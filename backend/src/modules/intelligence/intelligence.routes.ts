import { Router } from 'express';
import { authenticate, authorize } from '@/middleware/auth';
import { getForecast, getDebugForecast, getAuditLogs } from './intelligence.controller';

const router = Router();

router.get('/forecast', authenticate, getForecast);
router.get('/debug', authenticate, authorize('ADMIN'), getDebugForecast);
router.get('/audits', authenticate, authorize('ADMIN'), getAuditLogs);

export default router;
