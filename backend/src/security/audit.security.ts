import { Request } from 'express';

import { prisma } from '@/lib/prisma';

export type SecurityEvent =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'LOGOUT'
  | 'TOKEN_REFRESH'
  | 'TOKEN_REPLAY_DETECTED'
  | 'AI_REQUEST'
  | 'AI_ATTACK_BLOCKED'
  | 'RATE_LIMIT'
  | 'ADMIN_ACTION';

type AuditInput = {
  event: SecurityEvent;
  userId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
};

function redactMetadata(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.slice(0, 20).map(redactMetadata);
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const redacted: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (/password|token|secret|api[_-]?key|authorization|cookie/i.test(key)) {
      redacted[key] = '[REDACTED]';
    } else {
      redacted[key] = redactMetadata(entry);
    }
  }
  return redacted;
}

export function requestAuditContext(req: Request): Pick<AuditInput, 'userId' | 'ipAddress' | 'userAgent'> {
  return {
    userId: req.user?.id ?? null,
    ipAddress: req.ip || req.socket.remoteAddress || null,
    userAgent: req.get('user-agent') || null,
  };
}

export async function logSecurityEvent(input: AuditInput): Promise<void> {
  try {
    await (prisma as any).securityLog.create({
      data: {
        userId: input.userId ?? null,
        event: input.event,
        metadata: input.metadata ? (redactMetadata(input.metadata) as any) : undefined,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[SecurityAudit] Failed to persist event:', (error as Error).message);
    }
  }
}

export function logSecurityEventFromRequest(
  req: Request,
  event: SecurityEvent,
  metadata?: Record<string, unknown>
): void {
  void logSecurityEvent({
    ...requestAuditContext(req),
    event,
    metadata,
  });
}
