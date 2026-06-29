import { Router } from 'express';
import debugController from '@/controllers/debug';
import { authenticate, authorize } from '@/middleware/auth';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

// GET /api/debug/roadmaps/count
router.get('/roadmaps/count', debugController.getRoadmapCount);

export default router;
