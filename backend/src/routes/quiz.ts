import { Router } from 'express';
import { getTodayQuiz, submitQuiz } from '@/controllers/quiz';
import { authenticate } from '@/middleware/auth';

const router = Router();

router.get('/today', authenticate, getTodayQuiz);
router.post('/submit', authenticate, submitQuiz);

export default router;
