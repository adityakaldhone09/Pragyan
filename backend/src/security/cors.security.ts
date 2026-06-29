import cors from 'cors';

import { config } from '@/config/env';

export const secureCors = cors({
  origin: (origin, callback) => {
    if (!origin || config.cors.allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('CORS blocked: origin not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
  maxAge: 60 * 60,
});
