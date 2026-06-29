import { prisma } from '@/lib/prisma';
import { getDomainQuestions } from '@/data/manualQuestions/domainQuestions';
import type { DomainAnswer, DomainQuestion, DownstreamResult, HybridAssessmentSession, HybridUserProfile, ParsedProfilePayload, SkillBaseline, StateMachineResponse } from '@/types/hybridAssessment';
import { initSession, runAdaptiveTurn } from './adaptiveEngine';
import { triggerDownstreamEngines } from './downstream';
import { parseResumeToProfile } from './profileParser';

export async function handleResumeUpload(resumeText: string): Promise<ParsedProfilePayload> {
  return parseResumeToProfile(resumeText);
}

export function getPhase2Questions(domain: string): DomainQuestion[] {
  return getDomainQuestions(domain);
}

export function buildSkillBaselines(answers: DomainAnswer[]): SkillBaseline[] {
  return answers
    .filter((answer) => answer && answer.skill)
    .map((answer) => ({
      skill: String(answer.skill),
      rating: Math.min(5, Math.max(1, Number(answer.rating) || 1)),
    }));
}

export async function startAssessmentSession(
  userId: string,
  profile: HybridUserProfile,
  skillBaselines: SkillBaseline[]
): Promise<{ sessionId: string; response: StateMachineResponse }> {
  const record = await prisma.assessmentSession.create({
    data: {
      userId,
      answers: '{}',
      selectedOptions: [],
      analysis: JSON.stringify({ engine: 'hybrid-assessment', status: 'initializing' }),
    },
  });

  const session = initSession(record.id, userId, normalizeProfile({ ...profile, userId }), skillBaselines);
  const response = await runAdaptiveTurn(session);
  await persistSession(session);

  return { sessionId: session.id, response };
}

function normalizeProfile(profile: HybridUserProfile): HybridUserProfile {
  const role = profile.role || profile.targetRole || 'Student';
  const domain = profile.domain || profile.careerPath || 'general';
  const education = profile.education || profile.highestQualification;

  return {
    ...profile,
    role,
    domain,
    experience: profile.experience || 'beginner',
    education,
    targetRole: profile.targetRole || role,
    domainExperience: profile.domainExperience || profile.experience || 'beginner',
    careerPath: profile.careerPath || domain,
    highestQualification: profile.highestQualification || education,
    careerTrack: profile.careerTrack === 'Government Job' ? 'Government Job' : 'Private Job',
    hobbies: Array.isArray(profile.hobbies) ? profile.hobbies : [],
    interests: Array.isArray(profile.interests) ? profile.interests : [],
    currentSkills: Array.isArray(profile.currentSkills) ? profile.currentSkills : [],
  };
}

export async function submitAssessmentAnswer(
  sessionId: string,
  userAnswer: string
): Promise<{ response: StateMachineResponse; downstream?: DownstreamResult }> {
  const session = await loadSession(sessionId);
  if (session.isCompleted) throw new Error(`Assessment session ${sessionId} is already completed`);

  const response = await runAdaptiveTurn(session, userAnswer);
  let downstream: DownstreamResult | undefined;

  if (session.isCompleted) {
    downstream = await triggerDownstreamEngines(session);
  }

  await persistSession(session, downstream);
  return downstream ? { response, downstream } : { response };
}

async function persistSession(session: HybridAssessmentSession, downstream?: DownstreamResult): Promise<void> {
  const analysis = {
    engine: 'hybrid-assessment',
    status: session.isCompleted ? 'completed' : 'in_progress',
    session,
    downstream,
  };

  await prisma.assessmentSession.update({
    where: { id: session.id },
    data: {
      answers: JSON.stringify(Object.fromEntries(session.history.map((item) => [item.question.questionId, item.userAnswer]))),
      selectedOptions: session.history.map((item) => item.userAnswer).filter(Boolean),
      analysis: JSON.stringify(analysis),
      completedAt: session.isCompleted ? new Date() : undefined,
    },
  });
}

async function loadSession(sessionId: string): Promise<HybridAssessmentSession> {
  const record = await prisma.assessmentSession.findUnique({ where: { id: sessionId } });
  if (!record) throw new Error(`Assessment session ${sessionId} not found`);

  const parsed = safeJsonParse<{ session?: HybridAssessmentSession }>(record.analysis, {});
  if (!parsed.session || parsed.session.id !== sessionId) {
    throw new Error(`Assessment session ${sessionId} is not a hybrid assessment session`);
  }

  return parsed.session;
}

function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
