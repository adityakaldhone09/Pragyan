import { Request, Response, NextFunction } from 'express';
import redisClient from '@/lib/redis';
import { rateLimiter as inMemoryLimiter } from './rateLimiter';

const isDevelopment = process.env.NODE_ENV !== 'production';
const DEFAULT_LIMIT = isDevelopment ? 200 : 20; // per window
const DEFAULT_LIMIT_AUTH = isDevelopment ? 600 : 60; // higher limit for authenticated users
const WINDOW_SECONDS = 60; // 1 minute

export async function redisRateLimiter(req: Request, res: Response, next: NextFunction) {
  try {
    if (!redisClient.isReady()) {
      // fallback to in-memory limiter
      return inMemoryLimiter(req, res, next as NextFunction);
    }

    const userId = (req as any).user?.id;
    const key = userId ? `rl:user:${userId}` : `rl:ip:${req.ip}`;
    const limit = userId ? Number(process.env.ASSESSMENT_RATE_LIMIT_AUTH || DEFAULT_LIMIT_AUTH) : Number(process.env.ASSESSMENT_RATE_LIMIT || DEFAULT_LIMIT);

    const current = await redisClient.incr(key);
    if (current === 1) {
      await redisClient.expire(key, WINDOW_SECONDS);
    }

    if (current > limit) {
      return res.status(429).json({ success: false, message: 'Rate limit exceeded' });
    }

    next();
  } catch (err) {
    console.error('redisRateLimiter error', err);
    // fallback
    return inMemoryLimiter(req, res, next as NextFunction);
  }
}

export default redisRateLimiter;
