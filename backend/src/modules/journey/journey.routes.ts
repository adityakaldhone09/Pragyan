import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { getJourney, getJourneyDashboard } from './journey.controller';

const router = Router();

router.get('/dashboard', authenticate, getJourneyDashboard);
router.get('/:careerSlug', authenticate, getJourney);

export default router;
