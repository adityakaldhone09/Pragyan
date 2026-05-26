// src/routes/auth.ts

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '@/controllers/auth';
import * as oauthController from '@/controllers/oauth';
import { validate } from '@/middleware/validator';
import { registerSchema, loginSchema, refreshTokenSchema, profileUpdateSchema } from '@/validators/auth';
import { authenticate } from '@/middleware/auth';

const router = Router();
const isDevelopment = process.env.NODE_ENV !== 'production';
const rateLimitMessage = { success: false, message: 'Too many requests' };

const authAttemptLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: isDevelopment ? 200 : 50,
	standardHeaders: true,
	legacyHeaders: false,
	message: rateLimitMessage,
	handler: (_req, res) => {
		res.status(429).json(rateLimitMessage);
	},
});

router.post('/register', authAttemptLimiter, validate(registerSchema), authController.register);
router.post('/login', authAttemptLimiter, validate(loginSchema), authController.login);
router.get('/google', authAttemptLimiter, oauthController.startGoogleAuth);
router.get('/google/callback', authAttemptLimiter, oauthController.handleGoogleCallback);
router.get('/github', authAttemptLimiter, oauthController.startGitHubAuth);
router.get('/github/callback', authAttemptLimiter, oauthController.handleGitHubCallback);
router.post('/link/start', authAttemptLimiter, authenticate, oauthController.startLinkAuth);
router.get('/me', authenticate, authController.me);
router.patch('/me', authenticate, validate(profileUpdateSchema), authController.updateProfile);
router.post('/logout', authAttemptLimiter, validate(refreshTokenSchema), authController.logout);
router.post('/refresh-token', authAttemptLimiter, validate(refreshTokenSchema), authController.refreshToken);

export default router;
