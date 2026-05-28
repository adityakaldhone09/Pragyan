import { prisma } from '@/lib/prisma';

export async function ensureIntelligenceIndexes() {
  const ttlDays = Number(process.env.INTELLIGENCE_AUDIT_TTL_DAYS ?? '30');
  const ttlSeconds = Math.max(0, Math.floor(ttlDays * 24 * 60 * 60));

  try {
    // Use raw command to create indexes on the Mongo collection
    await prisma.$runCommandRaw({
      createIndexes: 'IntelligenceDebugAudit',
      indexes: [
        { key: { adminId: 1, createdAt: -1 }, name: 'adminId_createdAt_idx' },
        { key: { endpoint: 1 }, name: 'endpoint_idx' },
        { key: { createdAt: 1 }, name: 'createdAt_ttl_idx', expireAfterSeconds: ttlSeconds },
      ],
    });

    // eslint-disable-next-line no-console
    console.log(`[Intelligence] ensured indexes for IntelligenceDebugAudit (ttlDays=${ttlDays})`);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[Intelligence] failed to ensure indexes', (e as any)?.message || e);
  }
}
