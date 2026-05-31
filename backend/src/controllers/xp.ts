import { Request, Response } from 'express';
import { xpService } from '@/services/xp';
import { sendSuccess, sendError } from '@/utils/response';
import { asyncHandler } from '@/middleware/errorHandler';

export const awardXp = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Unauthorized');

  const { amount, reason, meta } = req.body as { amount: number; reason?: string; meta?: any };
  if (typeof amount !== 'number') return sendError(res, 400, 'amount must be a number');

  const result = await xpService.awardXp(req.user.id, amount, reason || 'manual', meta);

  return sendSuccess(res, result.user, 200, 'XP awarded');
});

export const getProgression = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Unauthorized');

  const progression = await xpService.getUserProgression(req.user.id);
  return sendSuccess(res, progression, 200, 'XP progression fetched');
});
