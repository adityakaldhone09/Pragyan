import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { sendError, sendSuccess } from '@/utils/response';
import { quizService } from '@/services/quiz';

export const getTodayQuiz = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Unauthorized');

  const roadmapId = (req.query.roadmapId as string) || undefined;
  const result = await quizService.getTodayQuizForUser(req.user.id, roadmapId);

  return sendSuccess(res, result, 200, 'Quiz fetched');
});

export const submitQuiz = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Unauthorized');

  const { quizId, answers, roadmapId, dayNumber } = req.body as { quizId?: string; answers: number[]; roadmapId?: string; dayNumber?: number };
  if (!Array.isArray(answers)) return sendError(res, 400, 'answers array required');

  const result = await quizService.submitQuiz(req.user.id, { quizId, answers, roadmapId, dayNumber });

  return sendSuccess(res, result, 200, 'Quiz submitted');
});
