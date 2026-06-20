import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { getRoadmapByUser } from '@/controllers/assessmentRoadmap';

const router = Router();

router.get('/:userId', authenticate, getRoadmapByUser);

export default router;
