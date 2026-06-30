// src/controllers/assessment.ts

import { Request, Response } from 'express';
import { assessmentService } from '@/services/assessment';
import { adaptiveAssessmentService } from '@/services/adaptive-assessment';
import { generateCareerEnhancements } from '@/ai/resultEnhancer';
import { sendSuccess, sendError } from '@/utils/response';
import { asyncHandler } from '@/middleware/errorHandler';

export const startAssessment = asyncHandler(async (req: Request, res: Response) => {
  const started = await adaptiveAssessmentService.startAssessment(req.user?.id);
  return sendSuccess(res, started, 201, 'Assessment session started');
});

export const answerAssessment = asyncHandler(async (req: Request, res: Response) => {
  const { sessionId, questionId, answer } = req.body || {};

  if (!sessionId || !questionId || !answer) {
    return sendError(res, 400, 'sessionId, questionId and answer are required');
  }

  const response = await adaptiveAssessmentService.answerQuestion({
    sessionId: String(sessionId),
    questionId: String(questionId),
    answer: String(answer),
    userId: req.user?.id,
  });

  return sendSuccess(res, response, 200, 'Answer recorded');
});

export const getQuestions = asyncHandler(async (_req: Request, res: Response) => {
  console.log('[Assessment Controller] getQuestions: Fetching questions');
  try {
    const questions = await assessmentService.getQuestions();
    console.log(`[Assessment Controller] getQuestions: Returning ${questions.length} questions`);
    return sendSuccess(res, questions, 200, 'Questions fetched successfully');
  } catch (err) {
    console.error('[Assessment Controller] getQuestions: Error', err);
    throw err;
  }
});

export const getQuestionsByCategory = asyncHandler(async (req: Request, res: Response) => {
  const { category } = req.params;
  const questions = await assessmentService.getQuestionsByCategory(category);

  return sendSuccess(res, questions, 200, 'Questions fetched successfully');
});

export const submitAssessment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    console.warn('[submitAssessment] Unauthorized - no user');
    return sendError(res, 401, 'Unauthorized');
  }

  // Log incoming request metadata for debugging persistence issues
  console.log('[submitAssessment] Headers:', {
    authorization: req.headers.authorization ? 'present' : 'missing',
    'content-length': req.headers['content-length'] || 'unknown',
  });

  const { answers } = req.body;

  if (!answers || typeof answers !== 'object') {
    console.warn('[submitAssessment] Invalid answers format');
    return sendError(res, 400, 'Invalid answers format');
  }

  console.log(`[submitAssessment] Processing for user ${req.user.id} with ${Object.keys(answers).length} answers`);
  let svcResult;
  try {
    svcResult = await assessmentService.submitAssessment(req.user.id, answers);
    console.log('[submitAssessment] Service returned result, persisted:', !!(svcResult as any)?.assessmentResult);
  } catch (err) {
    console.error('[submitAssessment] Service threw an error:', (err as any)?.message || err);
    return sendError(res, 500, 'Failed to process assessment');
  }

  // Non-authoritative Gemini enhancement: schedule async so AI downtime doesn't block the response
  const combined = (svcResult as any).combinedMatches || [];
  console.log('[submitAssessment] Scheduling AI enhancements (async)');
  void (async () => {
    console.log('[AI ENHANCE START]', { userId: req.user?.id, timestamp: new Date().toISOString() });
    try {
      await generateCareerEnhancements(answers, combined || []);
      console.log('[AI ENHANCE SUCCESS]', { userId: req.user?.id, timestamp: new Date().toISOString() });
      // Optionally persist or emit telemetry here
    } catch (err) {
      console.error('[AI ENHANCE ERROR]', { userId: req.user?.id, error: (err as any)?.message || err, timestamp: new Date().toISOString() });
    }
  })();
  const enhancements = null; // not included synchronously

  // Prepare response: include persisted result, deterministic matches, summary and enhancements
  const response = {
    persisted: (svcResult as any).assessmentResult,
    combinedMatches: (svcResult as any).combinedMatches || null,
    summary: (svcResult as any).summary,
    enhancements,
    aiEnhancementScheduled: true,
  };
  
  console.log('[submitAssessment] Returning response with', Object.keys(response));
  // If persistence failed, include a clear flag for the frontend
  if (!response.persisted) {
    console.warn('[submitAssessment] Persistence missing in response - communicating to frontend');
    try {
      const { contextAggregator } = await import('@/services/contextAggregator');
      void contextAggregator.invalidate(req.user.id).catch(() => undefined);
    } catch (e) {
      // ignore
    }
    return sendSuccess(res, { ...response, persisted: null, persistenceWarning: 'Persistence failed; result returned deterministically' }, 201, 'Assessment submitted with persistence warning');
  }

  try {
    const { contextAggregator } = await import('@/services/contextAggregator');
    await contextAggregator.invalidate(req.user.id);
  } catch (e) {
    // ignore
  }

  return sendSuccess(res, response, 201, 'Assessment submitted successfully');
});

export const getNextQuestions = asyncHandler(async (req: Request, res: Response) => {
  const { sessionId, answers, limit } = req.body || {};

  if (sessionId) {
    try {
      const next = await adaptiveAssessmentService.getNextQuestion(String(sessionId));
      return sendSuccess(res, next, 200, 'Next question fetched');
    } catch (error: any) {
      if (String(error?.message || '').toLowerCase().includes('not found')) {
        return sendError(res, 404, 'Assessment session not found or expired');
      }
      return sendError(res, 400, 'Unable to fetch next question');
    }
  }

  if (!answers || typeof answers !== 'object') {
    console.warn('[getNextQuestions] Invalid answers payload');
    return sendError(res, 400, 'Invalid answers payload');
  }

  console.log(`[getNextQuestions] Fetching next questions with limit=${limit}`);
  const next = await assessmentService.getNextQuestions(answers, Number(limit) || 3);
  console.log(`[getNextQuestions] Returning ${next.length} next questions`);
  return sendSuccess(res, next, 200, 'Next questions fetched');
});

export const getAssessmentResult = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const { resultId } = req.params;
  const result = await assessmentService.getAssessmentResult(req.user.id, resultId);

  return sendSuccess(res, result, 200, 'Assessment result fetched successfully');
});

export const submitAdaptiveAssessment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const { sessionId } = req.body || {};
  if (!sessionId) {
    return sendError(res, 400, 'sessionId is required');
  }

  let result;
  try {
    result = await adaptiveAssessmentService.submitAssessment({
      sessionId: String(sessionId),
      userId: req.user.id,
    });
  } catch (error: any) {
    if (String(error?.message || '').toLowerCase().includes('not found')) {
      return sendError(res, 404, 'Assessment session not found or expired');
    }
    return sendError(res, 400, 'Unable to submit adaptive assessment');
  }

  // Schedule AI enhancements asynchronously so submission is not blocked by external AI availability
  void (async () => {
    console.log('[AI ENHANCE(adaptive) START]', { userId: req.user?.id, sessionId: sessionId || null, timestamp: new Date().toISOString() });
    try {
      await generateCareerEnhancements(
        {
          path: result.summary?.topMatch?.career || '',
          strengths: result.summary?.strengths || [],
          weaknesses: result.summary?.weaknesses || [],
        } as any,
        result.allMatches || []
      );
      console.log('[AI ENHANCE(adaptive) SUCCESS]', { userId: req.user?.id, sessionId: sessionId || null, timestamp: new Date().toISOString() });
    } catch (err) {
      console.error('[AI ENHANCE(adaptive) ERROR]', { userId: req.user?.id, sessionId: sessionId || null, error: (err as any)?.message || err, timestamp: new Date().toISOString() });
    }
  })();

  try {
    const { contextAggregator } = await import('@/services/contextAggregator');
    await contextAggregator.invalidate(req.user.id);
  } catch (e) {
    // ignore
  }

  return sendSuccess(res, { ...result, ai: null, aiEnhancementScheduled: true }, 201, 'Adaptive assessment submitted');
});

export const getAdaptiveAssessmentResult = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const { id } = req.params;
  const result = await adaptiveAssessmentService.getResultById(req.user.id, id);
  if (!result) {
    return sendError(res, 404, 'Result not found');
  }

  return sendSuccess(res, result, 200, 'Adaptive result fetched');
});

export const saveAssessment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    console.warn('[saveAssessment] Unauthorized - no user');
    return sendError(res, 401, 'Unauthorized');
  }

  const { answers } = req.body;

  if (!answers || typeof answers !== 'object') {
    console.warn('[saveAssessment] Invalid answers format');
    return sendError(res, 400, 'Invalid answers format');
  }

  console.log(`[saveAssessment] Saving session for user ${req.user.id} with ${Object.keys(answers).length} answers`);
  const result = await assessmentService.saveAssessmentSession(req.user.id, answers);
  console.log(`[saveAssessment] Session saved with ID ${result.id}`);
  return sendSuccess(res, result, 201, 'Assessment saved successfully');
});

export const getAssessmentHistory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const history = await assessmentService.getAssessmentHistory(req.user.id);
  return sendSuccess(res, history, 200, 'Assessment history fetched successfully');
});

export const getLatestAssessment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const latest = await assessmentService.getLatestAssessment(req.user.id);
  return sendSuccess(res, latest, 200, 'Latest assessment fetched successfully');
});

export const createAssessment = asyncHandler(async (req: Request, res: Response) => {
  const { title, description, questions } = req.body;

  if (!title || !Array.isArray(questions) || questions.length === 0) {
    return sendError(res, 400, 'Invalid payload: title and questions are required');
  }

  const created = await assessmentService.createAssessment({ title, description, questions });
  return sendSuccess(res, created, 201, 'Assessment created successfully');
});

export const generateAndCreateAssessment = asyncHandler(async (req: Request, res: Response) => {
  const { title = 'AI Generated Assessment', description = 'Generated from dataset with Gemini enhancements' } = req.body || {};

  // Deterministic generation from dataset
  const questions = await assessmentService.getQuestions();

  if (!questions || !questions.length) {
    return sendError(res, 500, 'Failed to generate questions');
  }

  const mapped = (questions as any[]).map((q) => ({ questionText: q.question || '', options: q.options || [], category: q.category || '' }));

  const created = await assessmentService.createAssessment({ title, description, questions: mapped });
  return sendSuccess(res, created, 201, 'AI-generated assessment created');
});
