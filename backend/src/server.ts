import { config } from '@/config/env';
import dns from 'dns';
import { formatStartupDiagnostics, formatStartupFailure } from '@/config/startupDiagnostics';
import { validateEnv, type ValidatedEnv } from '@/config/validateEnv';

const PORT = config.port;

type PrismaLike = {
  $connect(): Promise<void>;
  $disconnect(): Promise<void>;
};

function classifyPrismaConnectivityError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('dns resolution') || lowerMessage.includes('enotfound') || lowerMessage.includes('_mongodb._tcp')) {
    return 'Unable to resolve the MongoDB Atlas cluster hostname. Check the cluster name and DNS SRV record.';
  }

  if (lowerMessage.includes('authentication failed') || lowerMessage.includes('bad auth') || lowerMessage.includes('unauthorized')) {
    return 'MongoDB Atlas credentials are invalid. Check the username and password in DATABASE_URL.';
  }

  if (lowerMessage.includes('replica') || lowerMessage.includes('transaction')) {
    return 'MongoDB Atlas must be a replica-set compatible cluster for Prisma transactions.';
  }

  if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
    return 'MongoDB Atlas connection timed out. Check network access and cluster availability.';
  }

  return 'Unable to connect to MongoDB Atlas. Verify DATABASE_URL, cluster access, and credentials.';
}

async function connectPrismaSafely(prisma: PrismaLike): Promise<void> {
  const originalError = console.error;
  const originalWarn = console.warn;

  const maxAttempts = 3;
  const baseDelayMs = 2000;

  const attemptConnect = async (attempt: number): Promise<void> => {
    try {
      if (attempt > 1) {
        const wait = baseDelayMs * Math.pow(2, attempt - 2);
        await new Promise((r) => setTimeout(r, wait + Math.floor(Math.random() * 250)));
        console.log(`[Prisma Connect] retrying (${attempt}/${maxAttempts})`);
      }
      await prisma.$connect();
    } catch (err) {
      if (attempt >= maxAttempts) {
        throw err;
      }
      return attemptConnect(attempt + 1);
    }
  };

  try {
    // Suppress noisy driver logs during retries
    console.error = () => undefined;
    console.warn = () => undefined;

    await attemptConnect(1);
  } catch (error) {
    throw new Error(classifyPrismaConnectivityError(error));
  } finally {
    console.error = originalError;
    console.warn = originalWarn;
  }
}

async function disconnectPrisma() {
  try {
    const { prisma } = await import('@/lib/prisma');
    await prisma.$disconnect();
  } catch {
    // Ignore shutdown-time disconnect failures.
  }
}


async function startServer() {
  let env: ValidatedEnv;

  try {
    env = validateEnv();
  } catch (error) {
    const issue = error instanceof Error ? error.message : String(error);
    console.error(
      formatStartupFailure(
        'Pragyan Startup Validation Failed',
        issue,
        'Replace DATABASE_URL in backend/.env with your real MongoDB Atlas URI and restart the backend.',
        'mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/pragyan?retryWrites=true&w=majority'
      )
    );
    process.exit(1);
    return;
  }

  console.log(formatStartupDiagnostics(env, 'pending'));

  // Prefer public DNS resolvers for SRV lookups to avoid local DNS issues
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
    console.log('[Startup] Using DNS servers:', dns.getServers());
  } catch (_) {
    // ignore if environment disallows changing DNS
  }

  try {
    const [{ default: app }, { prisma }] = await Promise.all([
      import('@/app'),
      import('@/lib/prisma'),
    ]);

    try {
      console.log('Prisma initialization status: connecting...');
      await connectPrismaSafely(prisma);
      console.log('✓ MongoDB Atlas Connected');
      console.log(formatStartupDiagnostics(env, 'connected'));
    } catch (error) {
      const issue = error instanceof Error ? error.message : String(error);
      console.error(
        formatStartupFailure(
          'Pragyan Startup Validation Failed',
          issue,
          'Confirm the Atlas host, username, password, network access, and that the cluster supports replica sets.',
          'mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/pragyan?retryWrites=true&w=majority'
        )
      );
      process.exit(1);
      return;
    }

    try {
      const enableCron = process.env.ENABLE_CRON === 'true';
      if (config.nodeEnv === 'production' || enableCron) {
        await import('./cron/jobs');
      } else {
        console.log('Cron jobs disabled (non-production and ENABLE_CRON not set)');
      }
    } catch (err) {
      console.warn('Failed to initialize cron jobs:', err);
    }

    const server = app.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════╗
║   🚀 Pragyan Backend Server Running  ║
║   Environment: ${config.nodeEnv.toUpperCase().padEnd(25)}║
║   Port: ${PORT.toString().padEnd(32)}║
║   API Base: http://localhost:${PORT}     ║
╚══════════════════════════════════════╝
      `);
    });

    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Stop the process using that port and start the backend again.`);
        process.exit(1);
      }

      console.error('Backend server failed to start:', error.message);
      process.exit(1);
    });
  } catch (error) {
    const issue = error instanceof Error ? error.message : String(error);
    console.error(
      formatStartupFailure(
        'Pragyan Startup Validation Failed',
        issue,
        'Check the backend logs above, fix DATABASE_URL, then restart the server.',
        'mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/pragyan?retryWrites=true&w=majority'
      )
    );
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  console.log('\n✓ Shutting down gracefully...');
  await disconnectPrisma();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n✓ Shutting down gracefully...');
  await disconnectPrisma();
  process.exit(0);
});

process.on('unhandledRejection', (reason) => {
  console.error('[UnhandledRejection]', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[UncaughtException]', error instanceof Error ? error.message : error);
});

startServer();

