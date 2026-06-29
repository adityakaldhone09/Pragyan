import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { sendError, sendSuccess } from '@/utils/response';
import { quizService } from '@/services/quiz';

export const getTodayQuiz = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Unauthorized');

  const roadmapId = (req.query.roadmapId as string) || undefined;
  const result = await quizService.getTodayQuizForUser(req.user.id, roadmapId);

  // Don't send correctIndex to frontend for security
  if (result.quiz && result.quiz.questions) {
    result.quiz.questions = result.quiz.questions.map((q: any) => ({
      ...q,
      correctIndex: undefined, // Hide correct answer
      correctAnswer: undefined, // Hide correct answer
    }));
  }

  return sendSuccess(res, result, 200, 'Quiz fetched');
});

export const submitQuiz = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Unauthorized');

  const { quiz, answers, roadmapId, dayNumber } = req.body as { quiz?: any; answers: number[]; roadmapId?: string; dayNumber?: number };
  if (!Array.isArray(answers)) return sendError(res, 400, 'answers array required');
  if (!quiz) return sendError(res, 400, 'quiz object required');

  const result = await quizService.submitQuiz(req.user.id, { quiz, answers, roadmapId, dayNumber });

  return sendSuccess(res, result, 200, 'Quiz submitted');
});
