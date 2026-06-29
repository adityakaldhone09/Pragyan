import rateLimit, { Options } from 'express-rate-limit';

import { logSecurityEventFromRequest } from './audit.security';

const isDevelopment = process.env.NODE_ENV !== 'production';

function makeLimiter(options: Partial<Options> & { name: string }) {
  const { name, ...rest } = options;
  return rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => false,
    message: { success: false, message: 'Too many requests' },
    handler: (req, res) => {
      logSecurityEventFromRequest(req, 'RATE_LIMIT', {
        limiter: name,
        path: req.originalUrl,
        method: req.method,
      });
      res.status(429).json({ success: false, message: 'Too many requests' });
    },
    ...rest,
  });
}

export const generalApiRateLimiter = makeLimiter({
  name: 'general',
  windowMs: 60 * 1000,
  max: isDevelopment ? 1000 : 100,
});

export const authRateLimiter = makeLimiter({
  name: 'auth',
  windowMs: 15 * 60 * 1000,
  max: isDevelopment ? 100 : 5,
});

export const aiApiRateLimiter = makeLimiter({
  name: 'ai',
  windowMs: 60 * 1000,
  max: isDevelopment ? 120 : 20,
});
