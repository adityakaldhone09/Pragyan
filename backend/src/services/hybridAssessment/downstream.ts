import type { DownstreamResult, HybridAssessmentSession, MentorContext, RecommendationResult, Roadmap, RoadmapTask } from '@/types/hybridAssessment';
import { prisma } from '@/lib/prisma';
import { callLLM, parseLLMJson } from './llmClient';
import { RECOMMENDATION_SYSTEM_PROMPT, ROADMAP_SYSTEM_PROMPT, buildRecommendationUserPrompt, buildRoadmapUserPrompt } from './promptTemplates';

export async function triggerDownstreamEngines(session: HybridAssessmentSession): Promise<DownstreamResult> {
  if (!session.isCompleted || !session.finalSummary) {
    throw new Error('Cannot trigger downstream engines before assessment completion');
  }

  const [recommendation, roadmap] = await Promise.all([
    generateRecommendation(session).catch(() => fallbackRecommendation(session)),
    generateRoadmap(session).catch(() => fallbackRoadmap(session)),
  ]);

  const dailyPlan = generateDailyPlan(session, roadmap);
  await persistAssessmentRoadmap(session, roadmap, dailyPlan);

  return {
    recommendation,
    roadmap,
    dailyPlan,
    mentorContext: buildMentorContext(session),
  };
}

async function generateRecommendation(session: HybridAssessmentSession): Promise<RecommendationResult> {
  const raw = await callLLM({
    systemPrompt: RECOMMENDATION_SYSTEM_PROMPT,
    userPrompt: buildRecommendationUserPrompt(session),
    temperature: 0.4,
  });
  const result = parseLLMJson<RecommendationResult>(raw);
  return {
    recommendedCareer: result.recommendedCareer || titleFromDomain(session.profile.domain),
    confidenceScore: clampScore(result.confidenceScore),
    reasoning: result.reasoning || 'Recommendation generated from the adaptive assessment summary.',
  };
}

async function generateRoadmap(session: HybridAssessmentSession): Promise<Roadmap> {
  const raw = await callLLM({
    systemPrompt: ROADMAP_SYSTEM_PROMPT,
    userPrompt: buildRoadmapUserPrompt(session),
    temperature: 0.5,
  });
  const roadmap = parseLLMJson<Roadmap>(raw);
  if (!roadmap.domain) roadmap.domain = session.profile.domain;
  if (!roadmap.track || !Array.isArray(roadmap.track.modules)) throw new Error('Invalid roadmap structure');
  return roadmap;
}

function generateDailyPlan(session: HybridAssessmentSession, roadmap: Roadmap) {
  const mode = session.finalSummary?.recommendedMode || 'Growth';
  const limit = mode === 'Recovery' ? 2 : mode === 'Stretch' ? 4 : 3;
  return {
    mode,
    date: new Date().toISOString().slice(0, 10),
    tasks: flattenTasks(roadmap).slice(0, limit),
  };
}

async function persistAssessmentRoadmap(
  session: HybridAssessmentSession,
  roadmap: Roadmap,
  dailyPlan: DownstreamResult['dailyPlan']
): Promise<void> {
  const finalSummary = session.finalSummary;

  await (prisma as any).assessmentRoadmap.upsert({
    where: { userId: session.userId },
    create: {
      userId: session.userId,
      sessionId: session.id,
      domain: roadmap.domain || session.profile.domain,
      recommendedRole: finalSummary?.recommendedRole || titleFromDomain(session.profile.domain),
      skillGaps: finalSummary?.skillGaps || [],
      track: roadmap.track,
      dailyPlan,
    },
    update: {
      sessionId: session.id,
      domain: roadmap.domain || session.profile.domain,
      recommendedRole: finalSummary?.recommendedRole || titleFromDomain(session.profile.domain),
      skillGaps: finalSummary?.skillGaps || [],
      track: roadmap.track,
      dailyPlan,
      updatedAt: new Date(),
    },
  });
}

function buildMentorContext(session: HybridAssessmentSession): MentorContext {
  const weakTopics = session.finalSummary?.weakTopics || [];
  const strengths = session.finalSummary?.strengths.join(', ') || 'none identified';
  const weak = weakTopics.join(', ') || 'none identified';
  const assessmentSummary = `User profile: ${session.profile.role} in ${session.profile.domain} (${session.profile.experience}). Strengths: ${strengths}. Weak topics: ${weak}.`;

  return {
    weakTopics,
    assessmentSummary,
    proactiveWarnings: weakTopics.map((topic) => `Review ${topic} before related modules and offer a short refresher.`),
  };
}

function fallbackRecommendation(session: HybridAssessmentSession): RecommendationResult {
  return {
    recommendedCareer: titleFromDomain(session.profile.domain),
    confidenceScore: 60,
    reasoning: 'Generated from assessment domain and weak-topic signals because the AI recommendation call was unavailable.',
  };
}

function fallbackRoadmap(session: HybridAssessmentSession): Roadmap {
  const weakTopics = session.finalSummary?.weakTopics.length ? session.finalSummary.weakTopics : ['Core fundamentals'];
  return {
    domain: session.profile.domain,
    track: {
      title: `${titleFromDomain(session.profile.domain)} Readiness Track`,
      modules: weakTopics.slice(0, 3).map((topic) => ({
        title: `${topic} Recovery`,
        topics: [
          {
            title: topic,
            tasks: [
              { title: `Review ${topic}`, description: `Revisit fundamentals for ${topic}.`, estimatedMinutes: 30 },
              { title: `Practice ${topic}`, description: `Complete a short applied exercise for ${topic}.`, estimatedMinutes: 45 },
            ],
          },
        ],
      })),
    },
  };
}

function flattenTasks(roadmap: Roadmap): RoadmapTask[] {
  return roadmap.track.modules.flatMap((module) => module.topics.flatMap((topic) => topic.tasks));
}

function clampScore(score: number): number {
  if (typeof score !== 'number' || Number.isNaN(score)) return 50;
  return Math.min(100, Math.max(0, Math.round(score)));
}

function titleFromDomain(domain: string): string {
  return domain
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Software Developer';
}
