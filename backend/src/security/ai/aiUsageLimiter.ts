import { NextFunction, Request, Response } from 'express';

import { prisma } from '@/lib/prisma';
import { logSecurityEventFromRequest } from '@/security/audit.security';

const FREE_DAILY_AI_LIMIT = Number(process.env.FREE_DAILY_AI_LIMIT || 100);

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function actorKey(req: Request): string {
  return req.user?.id ? `user:${req.user.id}` : `ip:${req.ip || 'unknown'}`;
}

export async function recordAIUsage(req: Request, tokensUsed = 0): Promise<void> {
  const key = actorKey(req);
  const date = todayKey();

  try {
    await (prisma as any).aIUsage.upsert({
      where: {
        actorKey_date: {
          actorKey: key,
          date,
        },
      },
      update: {
        dailyRequests: { increment: 1 },
        tokensUsed: { increment: Math.max(0, Math.round(tokensUsed)) },
        lastRequest: new Date(),
      },
      create: {
        actorKey: key,
        userId: req.user?.id ?? null,
        date,
        dailyRequests: 1,
        tokensUsed: Math.max(0, Math.round(tokensUsed)),
        lastRequest: new Date(),
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[AIUsage] Failed to record usage:', (error as Error).message);
    }
  }
}

export async function aiUsageLimiter(req: Request, res: Response, next: NextFunction): Promise<void> {
  const key = actorKey(req);
  const date = todayKey();

  try {
    const current = await (prisma as any).aIUsage.findUnique({
      where: {
        actorKey_date: {
          actorKey: key,
          date,
        },
      },
      select: { dailyRequests: true },
    });

    if ((current?.dailyRequests || 0) >= FREE_DAILY_AI_LIMIT) {
      logSecurityEventFromRequest(req, 'RATE_LIMIT', {
        limiter: 'ai_daily_usage',
        dailyLimit: FREE_DAILY_AI_LIMIT,
        path: req.originalUrl,
      });
      res.status(429).json({ success: false, message: 'Daily AI usage limit reached' });
      return;
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[AIUsage] Limit check failed:', (error as Error).message);
    }
  }

  next();
}
