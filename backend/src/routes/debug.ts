import { Router } from 'express';
import debugController from '@/controllers/debug';

const router = Router();

// GET /api/debug/roadmaps/count
router.get('/roadmaps/count', debugController.getRoadmapCount);

export default router;
