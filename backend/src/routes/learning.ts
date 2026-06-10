import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { validate } from '@/middleware/validator';
import { completeLearningSchema, learningDayParamsSchema } from '@/validators/learning';
import { completeLearning, getLearningDay, getTodayLearning } from '@/controllers/learning';

const router = Router();

router.get('/today', authenticate, getTodayLearning);
router.get('/day/:dayId', authenticate, validate(learningDayParamsSchema, 'params'), getLearningDay);
router.post('/complete', authenticate, validate(completeLearningSchema), completeLearning);

export default router;
