import { Request, Response, NextFunction } from 'express';

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, Bucket>();

const isDevelopment = process.env.NODE_ENV !== 'production';
const MAX_TOKENS = isDevelopment ? 200 : 10; // requests for anonymous
const MAX_TOKENS_AUTH = isDevelopment ? 600 : 60; // requests for authenticated users
const REFILL_INTERVAL_MS = 60 * 1000; // refill per minute

function getKey(req: Request) {
  if ((req as any).user?.id) return `user:${(req as any).user.id}`;
  return `ip:${req.ip}`;
}

export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  try {
    const key = getKey(req);
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket) {
      const isAuth = Boolean((req as any).user?.id);
      const initial = isAuth ? MAX_TOKENS_AUTH : MAX_TOKENS;
      bucket = { tokens: initial, lastRefill: now };
      buckets.set(key, bucket);
    }

    // refill
    const elapsed = now - bucket.lastRefill;
    if (elapsed > REFILL_INTERVAL_MS) {
      const cycles = Math.floor(elapsed / REFILL_INTERVAL_MS);
      const maxTokens = key.startsWith('user:') ? MAX_TOKENS_AUTH : MAX_TOKENS;
      bucket.tokens = Math.min(maxTokens, bucket.tokens + cycles * maxTokens);
      bucket.lastRefill = now;
    }

    if (bucket.tokens <= 0) {
      res.status(429).json({ success: false, message: 'Rate limit exceeded' });
      return;
    }

    bucket.tokens -= 1;
    next();
  } catch (err) {
    next();
  }
}

export default rateLimiter;
