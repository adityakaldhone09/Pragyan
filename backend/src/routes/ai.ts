// src/routes/ai.ts

import { Router } from 'express';
import * as aiController from '@/controllers/ai-recommendation';
import { authenticate } from '@/middleware/auth';

const router = Router();

router.get('/recommend-careers', authenticate, aiController.getRecommendations);
router.get('/roadmaps/:career', aiController.getRecommendedRoadmaps);
router.post('/personalized-roadmap', authenticate, aiController.getPersonalizedRoadmap);
router.get('/status', aiController.getStatus);
router.get('/telemetry', aiController.getTelemetry);

router.post(
  '/recommend-career',
  aiController.getPythonCareerRecommendation
);

export default router;
