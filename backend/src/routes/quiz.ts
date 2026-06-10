import { Router } from 'express';
import { getTodayQuiz, submitQuiz, generateQuiz, evaluateQuiz } from '@/controllers/quiz';
import { authenticate } from '@/middleware/auth';
import { validate } from '@/middleware/validator';
import { evaluateQuizSchema, generateQuizSchema } from '@/validators/quiz';

const router = Router();

router.get('/today', authenticate, getTodayQuiz);
router.post('/submit', authenticate, submitQuiz);
router.post('/generate', authenticate, validate(generateQuizSchema), generateQuiz);
router.post('/evaluate', authenticate, validate(evaluateQuizSchema), evaluateQuiz);

export default router;
