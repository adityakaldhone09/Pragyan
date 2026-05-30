import { Request, Response } from 'express';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/middleware/errorHandler';
import { sendSuccess } from '@/utils/response';

export const getDevSummary = asyncHandler(async (_req: Request, res: Response) => {
  const total = await prisma.roadmap.count();
  const samples = await prisma.roadmap.findMany({ take: 10, orderBy: { createdAt: 'desc' } });
  return sendSuccess(res, { total, samples }, 200, 'Dev summary');
});

export default { getDevSummary };
