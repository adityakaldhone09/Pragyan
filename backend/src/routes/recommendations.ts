import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { validate } from '@/middleware/validator';
import * as recommendationsController from '@/controllers/recommendations';
import { recommendationProfileSchema } from '@/validators/recommendations';
import { careerIntelligenceSchema } from '@/validators/career-intelligence';

const router = Router();

// New AI recommendation endpoints
router.post('/', authenticate, validate(recommendationProfileSchema), recommendationsController.generateRecommendations);
router.post('/intelligence', authenticate, validate(careerIntelligenceSchema), recommendationsController.generateCareerIntelligence);
router.get('/top-career', authenticate, recommendationsController.getTopCareer);
router.get('/roadmaps', authenticate, recommendationsController.getRoadmapRecommendations);
router.get('/roadmap-sections', authenticate, recommendationsController.getRoadmapSections);
router.get('/skills', authenticate, recommendationsController.getSkillRecommendations);
router.get('/explain/:careerId', authenticate, recommendationsController.explainCareer);

// Backward-compatible endpoints used by existing frontend modules
router.get('/careers', authenticate, recommendationsController.getCareerRecommendations);
router.get('/jobs', authenticate, recommendationsController.getJobRecommendations);

export default router;
