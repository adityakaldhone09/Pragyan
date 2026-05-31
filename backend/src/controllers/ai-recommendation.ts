// src/controllers/ai-recommendation.ts

import { Request, Response } from 'express';
import { hasGroqKey, hasGeminiKey } from '@/config/env';
import { aiRecommendationService } from '@/services/ai-recommendation';
import { aiProvider } from '@/services/aiProvider';
import { deriveAdaptiveLearningProfile, getRecommendedTaskMix, shouldTriggerRevision } from '@/services/adaptive-learning';
import { sendSuccess, sendError } from '@/utils/response';
import { asyncHandler } from '@/middleware/errorHandler';
import aiTelemetry from '@/lib/aiTelemetry';

export const getRecommendations = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const recommendations = await aiRecommendationService.recommendCareers(req.user.id);

  return sendSuccess(res, recommendations, 200, 'Career recommendations fetched');
});

export const getRecommendedRoadmaps = asyncHandler(async (req: Request, res: Response) => {
  const { career } = req.params;

  if (!career) {
    return sendError(res, 400, 'Career parameter is required');
  }

  const roadmaps = await aiRecommendationService.getRecommendedRoadmaps(career);

  return sendSuccess(res, roadmaps, 200, 'Recommended roadmaps fetched');
});

export const getPersonalizedRoadmap = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const { careerGoal, skillLevel } = req.body;

  if (!careerGoal || !skillLevel) {
    return sendError(res, 400, 'careerGoal and skillLevel are required');
  }

  const roadmap = await aiRecommendationService.generatePersonalizedRoadmap(
    req.user.id,
    careerGoal,
    skillLevel
  );

  return sendSuccess(res, roadmap, 200, 'Personalized roadmap generated');
});

export const getStatus = asyncHandler(async (_req: Request, res: Response) => {
  const runtime = aiProvider.getRuntime();
  return sendSuccess(
    res,
    {
      enabled: runtime.provider !== 'local',
      provider: runtime.provider,
      model: runtime.model,
      fallbackAvailable: {
        gemini: hasGeminiKey,
        groq: hasGroqKey,
      },
    },
    200,
    'AI status fetched'
  );
});

export const getTelemetry = asyncHandler(async (_req: Request, res: Response) => {
  const data = aiTelemetry.getTelemetry();
  return sendSuccess(res, data, 200, 'AI telemetry');
});

export const chatAssistant = asyncHandler(async (req: Request, res: Response) => {
  const { message, context = {}, history = [] } = req.body || {};

  if (!message || typeof message !== 'string') {
    return sendError(res, 400, 'message is required');
  }

  const historyText = Array.isArray(history)
    ? history
        .slice(-6)
        .map((entry: any) => `${entry?.role === 'assistant' ? 'Assistant' : 'User'}: ${String(entry?.content || '')}`)
        .join('\n')
    : '';

  const prompt = [
    'You are Pragyan, an AI career operating system assistant.',
    'Answer in concise markdown with practical bullet points when helpful.',
    'Use career guidance, roadmap help, resume help, and interview preparation as your primary domains.',
    context.career ? `Current top career context: ${context.career}` : '',
    context.roadmap ? `Relevant roadmap context: ${context.roadmap}` : '',
    context.goal ? `User goal: ${context.goal}` : '',
    context.mentorLevel ? `Mentor level: ${context.mentorLevel}` : '',
    context.mentorDay ? `Current roadmap day: ${context.mentorDay}` : '',
    context.mentorTopic ? `Current topic: ${context.mentorTopic}` : '',
    context.roadmapTitle ? `Roadmap title: ${context.roadmapTitle}` : '',
    Array.isArray(context.completedTopics) && context.completedTopics.length ? `Completed topics: ${context.completedTopics.join(', ')}` : '',
    Array.isArray(context.weakSkills) && context.weakSkills.length ? `Weak skills: ${context.weakSkills.join(', ')}` : '',
    context.mentorLevel
      ? 'If this is a roadmap mentor request, structure the reply with: simple explanation, real-life analogy, code example or steps, mini quiz, and a practice task. Adapt the depth to the mentor level.'
      : '',
    historyText ? `Conversation so far:\n${historyText}` : '',
    `User message: ${message}`,
    'If the request needs backend data you do not have, be transparent and suggest the closest available Pragyan feature.',
    'Return a helpful response only.'
  ].filter(Boolean).join('\n\n');

  try {
    const reply = await (await import('@/services/ai-layers')).aiLayers.generateCreative(prompt);
    return sendSuccess(res, { reply, provider: aiProvider.getRuntime().provider, fallbackUsed: false }, 200, 'AI assistant response');
  } catch (error) {
    const fallback = 'I can help with that. Based on your current Pragyan data, focus on the top recommended career, align your roadmap, and keep your resume targeted to the skills gap.';
    console.error('AI assistant generation failed:', error);
    const runtime = typeof aiProvider?.getRuntime === 'function' ? aiProvider.getRuntime() : { provider: 'unknown', model: 'unknown' };
    const errorMsg = error && error instanceof Error ? error.message : String(error);
    return sendSuccess(
      res,
      { reply: fallback, provider: runtime.provider || 'local', fallbackUsed: true, error: errorMsg },
      200,
      'AI assistant fallback response'
    );
  }
});

export const generateDailyPlan = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const {
    roadmapTitle,
    roadmapCategory = '',
    currentDay = 1,
    completedTopics = [],
    weakSkills = [],
    level = 'Beginner',
    availableTime = 120,
    missedDays = 0,
    streak = 0,
    currentFocus = '',
    currentTopics = [],
    quizScore,
  } = req.body || {};

  if (!roadmapTitle || typeof roadmapTitle !== 'string') {
    return sendError(res, 400, 'roadmapTitle is required');
  }

  const prompt = [
    'You are Pragyan Smart Daily Planner.',
    'Create a practical plan for what the user should do today for their roadmap.',
    'Return only valid JSON with this exact shape:',
    '{ todayGoal: string, estimatedMinutes: number, tasks: [{ type: "learn"|"practice"|"quiz"|"revision"|"project", title: string, minutes: number, details?: string }], xpReward: number, level: string, rationale?: string }',
    'Keep the total estimatedMinutes at or below availableTime.',
    'Prefer 4 tasks in this order: learn, practice, quiz, revision. Add a project task only if it clearly fits.',
    'If available time is 150 minutes or more, include a project unlock task with type "project" and make it the emotional highlight of the day.',
    'Make the plan specific and actionable for today.',
    `Roadmap title: ${roadmapTitle}`,
    roadmapCategory ? `Roadmap category: ${roadmapCategory}` : '',
    `Current day: ${Number(currentDay)}`,
    `Current focus: ${currentFocus || currentTopics?.[0] || ''}`,
    `Current topics: ${Array.isArray(currentTopics) ? currentTopics.join(', ') : ''}`,
    `Completed topics: ${Array.isArray(completedTopics) ? completedTopics.join(', ') : ''}`,
    `Weak skills: ${Array.isArray(weakSkills) ? weakSkills.join(', ') : ''}`,
    `Level: ${String(level)}`,
    `Available time in minutes: ${Number(availableTime)}`,
    `Missed days: ${Number(missedDays)}`,
    `Current streak: ${Number(streak)}`,
    'If the user is a beginner, use simpler explanations and smaller steps. If intermediate, emphasize practical application. If advanced, emphasize interview-level nuance and tradeoffs.',
  ].filter(Boolean).join('\n\n');

  const fallback = {
    todayGoal: currentFocus || currentTopics?.[0] || roadmapTitle,
    estimatedMinutes: Number(availableTime) || 120,
    tasks: [
      { type: 'learn', title: currentTopics?.[0] || `Study ${roadmapTitle}`, minutes: 25, details: 'Focus on the core concept and one example.' },
      { type: 'practice', title: `Build a small exercise for ${currentFocus || roadmapTitle}`, minutes: 35, details: 'Apply the concept in code or a hands-on workflow.' },
      { type: 'quiz', title: `Quick quiz on ${currentFocus || roadmapTitle}`, minutes: 10, details: 'Check recall before moving on.' },
      { type: 'revision', title: 'Review yesterday’s concepts', minutes: 15, details: 'Revisit notes and key takeaways.' },
    ],
    xpReward: Math.max(45, Math.min(95, Math.round((Number(availableTime) || 120) / 2) + Math.max(0, 10 - Number(missedDays || 0) * 2) + Math.min(15, Number(streak || 0) * 2))),
    level: String(level),
    rationale: 'Fallback plan generated locally because the AI planner was unavailable.',
  };

  const progressPercent = Math.min(100, Math.round(((Array.isArray(completedTopics) ? completedTopics.length : 0) / Math.max(1, Array.isArray(currentTopics) ? currentTopics.length : 1)) * 100));
  const numericQuizScore = typeof quizScore === 'number' ? Number(quizScore) : undefined;
  const adaptive = deriveAdaptiveLearningProfile({
    streak: Number(streak || 0),
    progressPercent,
    quizScore: numericQuizScore,
    weakSkillCount: Array.isArray(weakSkills) ? weakSkills.length : 0,
    completedTopicsCount: Array.isArray(completedTopics) ? completedTopics.length : 0,
    availableTime: Number(availableTime) || 120,
    missedDays: Number(missedDays || 0),
  });

  try {
    const raw = await (await import('@/services/ai-layers')).aiLayers.generateStructuredJson(prompt, { timeoutMs: 12_000 });
    const parsed = JSON.parse(raw) as Partial<typeof fallback>;
    const tasks = Array.isArray(parsed.tasks)
      ? parsed.tasks
          .map((task) => ({
            type: String(task?.type || 'learn'),
            title: String(task?.title || 'Task'),
            minutes: Math.max(5, Number(task?.minutes || 5)),
            details: typeof task?.details === 'string' ? task.details : undefined,
          }))
          .filter((task) => task.title)
      : fallback.tasks;

    const normalizedAvailableTime = Number(availableTime) || 120;
    const hasProjectTask = tasks.some((task) => task.type === 'project');

    if (adaptive.mode === 'stretch' && normalizedAvailableTime >= 120 && !hasProjectTask) {
      tasks.push({
        type: 'project',
        title: `Mini project for ${currentFocus || roadmapTitle}`,
        minutes: 45,
        details: 'Use today’s lesson in a hands-on build so the roadmap unlocks into something tangible.',
      });
    } else if (adaptive.mode === 'recovery' || shouldTriggerRevision({
      streak: Number(streak || 0),
      progressPercent,
      quizScore: numericQuizScore,
      weakSkillCount: Array.isArray(weakSkills) ? weakSkills.length : 0,
      missedDays: Number(missedDays || 0),
    })) {
      tasks.splice(2, Math.max(0, tasks.length - 2));
      tasks.push({
        type: 'revision',
        title: `Review ${currentFocus || roadmapTitle}`,
        minutes: 20,
        details: 'Slow down and reinforce the basics before moving ahead.',
      });
    }

    const recommendedTaskMix = getRecommendedTaskMix({
      streak: Number(streak || 0),
      progressPercent,
      quizScore: numericQuizScore,
      weakSkillCount: Array.isArray(weakSkills) ? weakSkills.length : 0,
      completedTopicsCount: Array.isArray(completedTopics) ? completedTopics.length : 0,
      availableTime: normalizedAvailableTime,
      missedDays: Number(missedDays || 0),
    });

    const estimatedMinutes = Math.max(
      30,
      Math.min(normalizedAvailableTime, Number(parsed.estimatedMinutes || tasks.reduce((sum, task) => sum + task.minutes, 0) || fallback.estimatedMinutes))
    );

    const xpBase = Math.max(25, Number(parsed.xpReward || fallback.xpReward));
    const xpReward = adaptive.mode === 'stretch' ? Math.round(xpBase * 1.2) : adaptive.mode === 'recovery' ? Math.round(xpBase * 0.8) : xpBase;

    return sendSuccess(
      res,
      {
        todayGoal: String(parsed.todayGoal || fallback.todayGoal),
        estimatedMinutes,
        tasks,
        xpReward,
        level: String(parsed.level || level),
        rationale: typeof parsed.rationale === 'string' ? parsed.rationale : fallback.rationale,
        adaptiveMode: adaptive.mode,
        adaptiveReason: adaptive.reason,
        difficultyMultiplier: adaptive.difficultyMultiplier,
        recommendedTaskMix,
      },
      200,
      'Daily plan generated'
    );
  } catch {
    return sendSuccess(
      res,
      {
        ...fallback,
        adaptiveMode: adaptive.mode,
        adaptiveReason: adaptive.reason,
        difficultyMultiplier: adaptive.difficultyMultiplier,
        recommendedTaskMix: getRecommendedTaskMix({
          streak: Number(streak || 0),
          progressPercent,
          quizScore: numericQuizScore,
          weakSkillCount: Array.isArray(weakSkills) ? weakSkills.length : 0,
          completedTopicsCount: Array.isArray(completedTopics) ? completedTopics.length : 0,
          availableTime: Number(availableTime) || 120,
          missedDays: Number(missedDays || 0),
        }),
      },
      200,
      'Daily plan fallback generated'
    );
  }
});

export const generateAssessmentReport = asyncHandler(async (req: Request, res: Response) => {
  const { topMatches = [], confidence = 0, strengths = [], weaknesses = [], targetCareer } = req.body || {};

  if (!Array.isArray(topMatches) || !topMatches.length) {
    return sendError(res, 400, 'topMatches is required');
  }

  const prompt = [
    'You are an AI explainer for Pragyan career assessment.',
    'Important: you are NOT allowed to choose or change careers. Recommendation ranking is already decided by deterministic engine.',
    `Top matches (fixed): ${JSON.stringify(topMatches)}`,
    `Confidence score (fixed): ${Number(confidence)}`,
    `Strengths: ${Array.isArray(strengths) ? strengths.join(', ') : ''}`,
    `Growth areas: ${Array.isArray(weaknesses) ? weaknesses.join(', ') : ''}`,
    targetCareer ? `Primary target career: ${String(targetCareer)}` : '',
    'Return JSON with keys: summary, insights (string[]), skillGapAnalysis (string[]), interviewPlan (string[]).',
  ].filter(Boolean).join('\n\n');

  try {
    const raw = await aiProvider.generateText(prompt);
    return sendSuccess(res, { report: raw, mode: 'explainer-only' }, 200, 'AI report generated');
  } catch {
    const fallback = {
      summary: 'Your deterministic assessment indicates a strong fit for the top ranked role with actionable next steps.',
      insights: ['Build consistency in your strongest signal areas.', 'Translate strengths into projects and interview stories.'],
      skillGapAnalysis: ['Focus on role-specific practical depth.', 'Close missing foundational competencies with weekly practice.'],
      interviewPlan: ['Revise fundamentals', 'Practice scenario-based answers', 'Run mock interviews'],
    };
    return sendSuccess(res, { report: fallback, mode: 'fallback-explainer' }, 200, 'AI report fallback generated');
  }
});

export const generateLearningRoadmap = asyncHandler(async (req: Request, res: Response) => {
  const { targetCareer, skillGaps = [], timelineWeeks = 12, profileSummary = '' } = req.body || {};

  if (!targetCareer) {
    return sendError(res, 400, 'targetCareer is required');
  }

  const prompt = [
    'You are a roadmap assistant for Pragyan.',
    'Important: do not select careers or alter ranking. Only generate a learning roadmap for the already-selected target role.',
    `Target career (fixed): ${String(targetCareer)}`,
    `Skill gaps: ${Array.isArray(skillGaps) ? skillGaps.join(', ') : ''}`,
    `Timeline in weeks: ${Number(timelineWeeks)}`,
    `Profile summary: ${String(profileSummary)}`,
    'Return concise markdown with week-by-week milestones, projects, and interview prep checkpoints.',
  ].join('\n\n');

  console.log('[AI ROADMAP START]', { targetCareer, timestamp: new Date().toISOString() });
  try {
    const roadmap = await aiProvider.generateText(prompt);
    console.log('[AI ROADMAP SUCCESS]', { targetCareer, timestamp: new Date().toISOString() });
    return sendSuccess(res, { roadmap, mode: 'explainer-only' }, 200, 'AI roadmap generated');
  } catch (error) {
    console.error('[AI ROADMAP ERROR]', { error: (error as any)?.message || error, targetCareer, timestamp: new Date().toISOString() });
    const fallback = {
      week1to4: ['Strengthen core fundamentals', 'Complete 1 guided mini project'],
      week5to8: ['Build production-quality project', 'Document outcomes and trade-offs'],
      week9to12: ['Mock interviews', 'Portfolio polishing', 'Targeted applications'],
    };
    return sendSuccess(res, { roadmap: fallback, mode: 'fallback-explainer', fallback: true }, 200, 'AI roadmap fallback generated');
  }
});
