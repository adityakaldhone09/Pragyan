import { prisma } from '@/lib/prisma';

export async function logIntelligenceDebugAccess(opts: {
  adminId: string;
  targetUser?: string | null;
  endpoint: string;
  filters?: any;
  env?: string;
}) {
  try {
    // Fire-and-forget insert into Mongo collection via raw command to avoid requiring a regenerated prisma client.
    void prisma.$runCommandRaw({
      insert: 'IntelligenceDebugAudit',
      documents: [
        {
          adminId: opts.adminId,
          targetUser: opts.targetUser ?? null,
          endpoint: opts.endpoint,
          filters: opts.filters ?? null,
          env: opts.env ?? process.env.NODE_ENV ?? 'unknown',
          createdAt: new Date(),
        },
      ],
    }).catch((e) => {
      // non-blocking logging failure — print for server ops debugging
      // eslint-disable-next-line no-console
      console.error('Intelligence audit log failed', (e as any)?.message || e);
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Intelligence audit log exception', (e as any)?.message || e);
  }
}
