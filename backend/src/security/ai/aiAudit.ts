import { Request } from 'express';

import { logSecurityEvent, logSecurityEventFromRequest } from '@/security/audit.security';

export function logAIAttack(req: Request, metadata: Record<string, unknown>): void {
  logSecurityEventFromRequest(req, 'AI_ATTACK_BLOCKED', metadata);
}

export function logAIRequest(req: Request, metadata: Record<string, unknown> = {}): void {
  logSecurityEventFromRequest(req, 'AI_REQUEST', metadata);
}

export function logAIProviderEvent(metadata: Record<string, unknown>): void {
  void logSecurityEvent({
    event: 'AI_REQUEST',
    metadata,
  });
}

export function logAIProviderAttack(metadata: Record<string, unknown>): void {
  void logSecurityEvent({
    event: 'AI_ATTACK_BLOCKED',
    metadata,
  });
}
