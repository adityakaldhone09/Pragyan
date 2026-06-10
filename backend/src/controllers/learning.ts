import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { sendError, sendSuccess } from '@/utils/response';
import { learningService } from '@/services/learningService';

export const getTodayLearning = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const result = await learningService.getToday(req.user.id);
  return sendSuccess(res, result, 200, 'Today’s learning fetched successfully');
});

export const getLearningDay = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const result = await learningService.getDay(req.user.id, req.params.dayId);
  return sendSuccess(res, result, 200, 'Learning day fetched successfully');
});

export const completeLearning = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const result = await learningService.completeLearning(req.user.id, req.body);
  return sendSuccess(res, result, 200, 'Learning completed successfully');
});
