import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { validate } from '@/middleware/validator';
import { generateResumeSchema } from '@/validators/resume';
import { generateResume, getResume } from '@/controllers/resume';

const router = Router();

router.get('/', authenticate, getResume);
router.post('/generate', authenticate, validate(generateResumeSchema), generateResume);

export default router;
