import type { NextFunction, Request, Response } from 'express';
import { prisma } from '@/lib/prisma';

export async function getRoadmapByUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }

    if (req.user?.id !== userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'You can only access your own assessment roadmap' });
    }

    const roadmap = await (prisma as any).assessmentRoadmap.findUnique({
      where: { userId },
    });

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        error: 'No assessment roadmap found for this user. Complete the hybrid assessment first.',
      });
    }

    return res.status(200).json({ success: true, data: roadmap });
  } catch (error) {
    return next(error);
  }
}
