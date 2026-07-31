// src/controllers/auditLog.ts

import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { sendSuccess } from '@/utils/response';
import { prisma } from '@/lib/prisma';

// ── Helpers ────────────────────────────────────────────────────────────────────

function buildWhereClause(query: Record<string, unknown>) {
  const where: Record<string, unknown> = {};

  if (query.organizationId) where.organizationId = query.organizationId;
  if (query.userId)         where.targetUserId    = query.userId;
  if (query.action)         where.action          = query.action;
  if (query.status)         where.status          = query.status;

  if (query.startDate || query.endDate) {
    const createdAt: Record<string, Date> = {};
    if (query.startDate) createdAt.gte = new Date(query.startDate as string);
    if (query.endDate)   createdAt.lte = new Date(query.endDate as string);
    where.createdAt = createdAt;
  }

  return where;
}

function formatLog(log: any) {
  return {
    id:           log.id,
    timestamp:    log.createdAt?.toISOString() ?? new Date().toISOString(),
    targetUser:   log.targetUser?.fullName   || log.targetUser?.email   || log.targetUserId   || '—',
    performedBy:  log.performedByUser?.fullName || log.performedByUser?.email || log.performedByUserId || '—',
    action:       log.action   || '—',
    resource:     log.resourceType || '—',
    resourceId:   log.resourceId   || '—',
    status:       log.status   || 'SUCCESS',
    failureReason: log.failureReason || null,
    ipAddress:    log.ipAddress || '—',
    userAgent:    log.userAgent || '—',
    organization: log.organization?.name || '—',
    changes:      log.changes  || null,
  };
}

// ── Controllers ────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/audit-logs
 * Returns paginated audit logs with optional filters.
 */
export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as Record<string, string>;
  const limit = Math.min(Number(query.limit) || 50, 200);
  const skip  = Number(query.skip)  || 0;

  const where = buildWhereClause(query);

  const [rawLogs, total] = await Promise.all([
    (prisma as any).auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take:    limit,
      skip,
      include: {
        targetUser:      { select: { id: true, fullName: true, email: true } },
        performedByUser: { select: { id: true, fullName: true, email: true } },
        organization:    { select: { id: true, name: true } },
      },
    }),
    (prisma as any).auditLog.count({ where }),
  ]);

  const logs = rawLogs.map(formatLog);

  return sendSuccess(res, {
    logs,
    pagination: {
      total,
      limit,
      skip,
      hasMore: skip + limit < total,
    },
  }, 200, 'Audit logs fetched');
});

/**
 * GET /api/admin/audit-logs/stats
 * Returns aggregate statistics for audit logs.
 */
export const getAuditStats = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as Record<string, string>;
  const where = buildWhereClause(query);

  const all = await (prisma as any).auditLog.findMany({
    where,
    select: { action: true, status: true },
  });

  const total      = all.length;
  const successful = all.filter((l: any) => l.status === 'SUCCESS').length;
  const failed     = all.filter((l: any) => l.status !== 'SUCCESS').length;

  const byAction: Record<string, number> = {};
  for (const l of all) {
    byAction[l.action] = (byAction[l.action] ?? 0) + 1;
  }

  return sendSuccess(res, { total, successful, failed, byAction }, 200, 'Audit stats fetched');
});

/**
 * GET /api/admin/audit-logs/user/:userId
 * Returns audit logs for a specific user.
 */
export const getUserActivity = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const limit = Math.min(Number(req.query.limit) || 20, 100);

  const rawLogs = await (prisma as any).auditLog.findMany({
    where:   { targetUserId: userId },
    orderBy: { createdAt: 'desc' },
    take:    limit,
    include: {
      targetUser:      { select: { id: true, fullName: true, email: true } },
      performedByUser: { select: { id: true, fullName: true, email: true } },
      organization:    { select: { id: true, name: true } },
    },
  });

  return sendSuccess(res, rawLogs.map(formatLog), 200, 'User activity fetched');
});

/**
 * GET /api/admin/audit-logs/organization/:organizationId
 * Returns audit logs for a specific organisation.
 */
export const getOrganizationLogs = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = req.params;
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const skip  = Number(req.query.skip) || 0;

  const [rawLogs, total] = await Promise.all([
    (prisma as any).auditLog.findMany({
      where:   { organizationId },
      orderBy: { createdAt: 'desc' },
      take:    limit,
      skip,
      include: {
        targetUser:      { select: { id: true, fullName: true, email: true } },
        performedByUser: { select: { id: true, fullName: true, email: true } },
        organization:    { select: { id: true, name: true } },
      },
    }),
    (prisma as any).auditLog.count({ where: { organizationId } }),
  ]);

  return sendSuccess(res, {
    logs: rawLogs.map(formatLog),
    pagination: { total, limit, skip, hasMore: skip + limit < total },
  }, 200, 'Organisation audit logs fetched');
});
