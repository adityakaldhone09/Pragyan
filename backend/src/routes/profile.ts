import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import * as profileController from '@/controllers/profile';

const router = Router();

router.get('/providers', authenticate, profileController.getProviders);
router.post('/link/:provider', authenticate, profileController.startLink);
router.delete('/unlink/:provider', authenticate, profileController.unlinkProvider);

export default router;
