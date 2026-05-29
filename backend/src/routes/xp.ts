import { Router } from 'express';
import { awardXp } from '@/controllers/xp';
import { authenticate } from '@/middleware/auth';

const router = Router();

router.post('/award', authenticate, awardXp);

export default router;
