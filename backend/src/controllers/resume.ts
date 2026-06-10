import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { sendError, sendSuccess } from '@/utils/response';
import { resumeService } from '@/services/resumeService';

export const generateResume = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const result = await resumeService.generateResume(req.user.id);
  return sendSuccess(res, result, 200, 'Resume generated successfully');
});

export const getResume = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const result = await resumeService.getLatestResume(req.user.id);
  return sendSuccess(res, result, 200, 'Resume fetched successfully');
});
