import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { sendError, sendSuccess } from '@/utils/response';
import { intelligenceService } from './intelligence.service';
import { logIntelligenceDebugAccess } from './intelligence.audit';
import { journeyService } from '@/modules/journey/journey.service';

export const getForecast = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Unauthorized');

  const snapshot = await journeyService.getDashboardJourney(req.user.id);
  const payload = intelligenceService.buildForecastSignals(snapshot);

  return sendSuccess(res, payload, 200, 'Intelligence forecast computed');
});

export const getDebugForecast = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Unauthorized');

  // admin-only route enforced at the router layer
  const snapshot = await journeyService.getDashboardJourney(req.user.id);
  const payload = intelligenceService.buildDebugForecastSignals(snapshot);

  // Fire-and-forget audit log; do not block response on logging.
  try {
    const targetUser = typeof req.query.targetUser === 'string' ? req.query.targetUser : null;
    const filters = targetUser ? { targetUser } : {};
    void logIntelligenceDebugAccess({
      adminId: req.user.id,
      targetUser,
      endpoint: req.originalUrl || req.url || '/api/intelligence/debug',
      filters,
      env: process.env.NODE_ENV,
    });
  } catch (e) {
    // swallow errors — logging must not break the API
  }

  return sendSuccess(res, payload, 200, 'Intelligence debug payload');
});

export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Unauthorized');

  const page = Math.max(1, Number(req.query.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize ?? 20)));
  const skip = (page - 1) * pageSize;

  const filter: any = {};
  if (req.query.adminId) filter.adminId = String(req.query.adminId);
  if (req.query.endpoint) filter.endpoint = { $regex: String(req.query.endpoint), $options: 'i' };
  if (req.query.from || req.query.to) {
    filter.createdAt = {} as any;
    if (req.query.from) filter.createdAt.$gte = new Date(String(req.query.from));
    if (req.query.to) filter.createdAt.$lte = new Date(String(req.query.to));
  }

  // Fetch audit docs using raw Mongo aggregation to avoid requiring a regenerated prisma client
  const aggRes = await (globalThis as any).prisma.$runCommandRaw({
    aggregate: 'IntelligenceDebugAudit',
    pipeline: [
      { $match: filter },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: pageSize },
      { $project: { adminId: 1, targetUser: 1, endpoint: 1, filters: 1, env: 1, createdAt: 1 } },
    ],
    cursor: {},
  }).catch(() => null as any);

  const docs = (aggRes && aggRes.cursor && aggRes.cursor.firstBatch) || aggRes || [];

  // total count
  const countRes = await (globalThis as any).prisma.$runCommandRaw({ count: 'IntelligenceDebugAudit', query: filter }).catch(() => null as any);
  const total = countRes?.n ?? countRes?.count ?? 0;

  // enrich admin emails in batch
  const prisma = (globalThis as any).prisma;
  const adminIds = Array.from(new Set(docs.flatMap((d: any) => d.adminId ? [d.adminId] : [])));
  const adminMap: Record<string, string> = {};
  if (adminIds.length) {
    const users = await prisma.user.findMany({ where: { id: { in: adminIds } }, select: { id: true, email: true } }).catch(() => []);
    for (const u of users || []) adminMap[u.id] = u.email;
  }

  const rows = docs.map((d: any) => ({
    id: d._id ?? d.id ?? null,
    adminId: d.adminId,
    adminEmail: adminMap[d.adminId] ?? null,
    targetUser: d.targetUser ?? null,
    endpoint: d.endpoint ?? null,
    filters: d.filters ?? null,
    env: d.env ?? null,
    createdAt: d.createdAt ?? null,
  }));

  return sendSuccess(res, { rows, total, page, pageSize }, 200, 'Audit logs');
});
