import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { validate } from '@/middleware/validator';
import * as learningResourceController from '@/controllers/learningResources';
import {
  LearningResourceQuerySchema,
  ResourceHistoryUpsertSchema,
} from '@/validators/learningResources';

const router = Router();

router.get('/', validate(LearningResourceQuerySchema, 'query'), learningResourceController.getLearningResources);
router.get('/roadmaps/:roadmapId', validate(LearningResourceQuerySchema, 'query'), learningResourceController.getRoadmapLearningResources);
router.get('/personalized', authenticate, learningResourceController.getPersonalizedLearningResources);
router.get('/history', authenticate, learningResourceController.getLearningResourceHistory);
router.post('/history', authenticate, validate(ResourceHistoryUpsertSchema), learningResourceController.upsertLearningResourceHistory);

export default router;