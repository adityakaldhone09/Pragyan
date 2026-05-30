import { Router } from 'express';
import adminDevController from '@/controllers/adminDev';

const router = Router();

// Development-only routes - do not mount in production
router.get('/summary', adminDevController.getDevSummary);

export default router;
