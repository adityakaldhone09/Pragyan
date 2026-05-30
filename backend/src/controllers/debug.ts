import { Request, Response } from 'express';
import { prisma } from '@/lib/prisma';
import { sendSuccess } from '@/utils/response';
import { asyncHandler } from '@/middleware/errorHandler';

export const getRoadmapCount = asyncHandler(async (_req: Request, res: Response) => {
  const count = await prisma.roadmap.count();
  return sendSuccess(res, { count }, 200, 'Roadmap count fetched');
});

export default {
  getRoadmapCount,
};
