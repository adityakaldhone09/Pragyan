import { Router } from 'express';
import { awardXp, getProgression } from '@/controllers/xp';
import { authenticate } from '@/middleware/auth';

const router = Router();

router.post('/award', authenticate, awardXp);
router.get('/progression', authenticate, getProgression);

export default router;
