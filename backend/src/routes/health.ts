import { Router, Request, Response } from 'express';

import { getAIHealthSnapshot } from '@/services/aiHealth';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

router.get('/ai', async (_req: Request, res: Response, next) => {
  try {
    const health = await getAIHealthSnapshot();
    res.status(200).json(health);
  } catch (error) {
    next(error);
  }
});

export default router;
