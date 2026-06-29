import { prisma } from '@/lib/prisma';
import { createClient, type RedisClientType } from 'redis';

interface TelemetryStats {
  calls: number;
  tokens: number;
  failures: number;
  fallbackCount: number;
  serviceUnavailable: number;
  totalLatencyMs: number;
  cacheHits: number;
  providerCalls: Record<string, number>;
  providerFailures: Record<string, number>;
  providerFallbacks: Record<string, number>;
  providerServiceUnavailable: Record<string, number>;
  lastError?: { provider: string; reason: string; at: string } | null;
  errorHistory: Array<{ provider: string; reason: string; at: string }>;
}

export const TELEMETRY_STREAM = 'pragyan:telemetry';

const STREAM_MAX_LEN = 10_000;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let streamClient: RedisClientType | null = null;
let streamConnectPromise: Promise<void> | null = null;

export const TelemetryEvent = {
  ASSESSMENT_STARTED: 'ASSESSMENT_STARTED',
  ASSESSMENT_QUESTION_GENERATED: 'ASSESSMENT_QUESTION_GENERATED',
  ASSESSMENT_ANSWER_SUBMITTED: 'ASSESSMENT_ANSWER_SUBMITTED',
  ASSESSMENT_COMPLETED: 'ASSESSMENT_COMPLETED',
  LLM_LATENCY_LOG: 'LLM_LATENCY_LOG',
  LLM_PARSE_ERROR: 'LLM_PARSE_ERROR',
  DOWNSTREAM_ENGINE_TRIGGERED: 'DOWNSTREAM_ENGINE_TRIGGERED',
  RECOMMENDATION_GENERATED: 'RECOMMENDATION_GENERATED',
  ROADMAP_GENERATED: 'ROADMAP_GENERATED',
} as const;

async function getStreamClient(): Promise<RedisClientType | null> {
  if (streamClient?.isReady) return streamClient;

  if (!streamConnectPromise) {
    streamConnectPromise = (async () => {
      try {
        const client = createClient({ url: REDIS_URL }) as RedisClientType;
        client.on('error', (error) => {
          console.error('[aiTelemetry] Redis stream client error:', error.message);
        });
        await client.connect();
        streamClient = client;
      } catch (error) {
        console.error(
          '[aiTelemetry] Redis stream unavailable:',
          error instanceof Error ? error.message : String(error)
        );
        streamClient = null;
        streamConnectPromise = null;
      }
    })();
  }

  await streamConnectPromise;
  return streamClient;
}

const stats: TelemetryStats = {
  calls: 0,
  tokens: 0,
  failures: 0,
  fallbackCount: 0,
  serviceUnavailable: 0,
  totalLatencyMs: 0,
  cacheHits: 0,
  providerCalls: {},
  providerFailures: {},
  providerFallbacks: {},
  providerServiceUnavailable: {},
  lastError: null,
  errorHistory: [],
};

function persistTelemetryEvent(event: {
  eventType: 'call' | 'failure' | 'fallback' | 'service_unavailable';
  provider: string;
  tokens?: number;
  latencyMs?: number;
  reason?: string;
  model?: string;
  success?: boolean;
  fallbackUsed?: boolean;
}) {
  try {
    void prisma.$runCommandRaw({
      insert: 'AITelemetry',
      documents: [
        {
          ...event,
          createdAt: new Date(),
        },
      ],
    }).catch(() => undefined);
  } catch {
    // Non-blocking telemetry persistence.
  }
}

function normalizeProvider(providerOrTokens: string | number, tokensOrLatency?: number, latencyMaybe?: number) {
  if (typeof providerOrTokens === 'string') {
    return {
      provider: providerOrTokens,
      tokens: Number(tokensOrLatency || 0),
      latency: Number(latencyMaybe || 0),
    };
  }

  return {
    provider: 'unknown',
    tokens: Number(providerOrTokens || 0),
    latency: Number(tokensOrLatency || 0),
  };
}

function normalizeCallMeta(modelOrMeta?: string | { model?: string; success?: boolean; fallbackUsed?: boolean }) {
  if (typeof modelOrMeta === 'string') {
    return { model: modelOrMeta };
  }

  return {
    model: modelOrMeta?.model,
    success: modelOrMeta?.success,
    fallbackUsed: modelOrMeta?.fallbackUsed,
  };
}

export function recordCall(
  providerOrTokens: string | number,
  tokensOrLatency?: number,
  latencyMaybe?: number,
  modelOrMeta?: string | { model?: string; success?: boolean; fallbackUsed?: boolean }
) {
  const meta = normalizeCallMeta(modelOrMeta);
  const { provider, tokens, latency } = normalizeProvider(providerOrTokens, tokensOrLatency, latencyMaybe);
  stats.calls += 1;
  stats.tokens += tokens;
  stats.totalLatencyMs += latency;
  stats.providerCalls[provider] = (stats.providerCalls[provider] || 0) + 1;
  persistTelemetryEvent({
    eventType: 'call',
    provider,
    tokens,
    latencyMs: latency,
    success: meta.success ?? true,
    fallbackUsed: meta.fallbackUsed ?? false,
    model: meta.model,
  });
  try {
    const redis = require('@/lib/redis').redisClient;
    if (redis && redis.isReady && redis.isReady()) {
      // increment counters in redis for global metrics
      try { redis.incr('telemetry:ai:calls'); } catch {}
      try { redis.incrBy('telemetry:ai:tokens', tokens); } catch {}
      try { redis.incr('telemetry:ai:latency_total_ms'); } catch {}
      try { redis.incr(`telemetry:ai:calls:${provider}`); } catch {}
    }
  } catch (e) {
    // ignore
  }
}

export function recordCacheHit() {
  stats.cacheHits += 1;
}

export function recordFailure(provider = 'unknown', reason = '', model?: string) {
  stats.failures += 1;
  stats.providerFailures[provider] = (stats.providerFailures[provider] || 0) + 1;
  if (reason) {
    const entry = { provider, reason, at: new Date().toISOString() };
    stats.lastError = entry;
    stats.errorHistory.push(entry);
    if (stats.errorHistory.length > 50) {
      stats.errorHistory.shift();
    }
  }
  persistTelemetryEvent({ eventType: 'failure', provider, reason, model, success: false, fallbackUsed: false });
  try { const redis = require('@/lib/redis').redisClient; if (redis && redis.isReady && redis.isReady()) redis.incr('telemetry:ai:failures').catch(()=>{}); } catch {}
}

export function recordFallback(provider = 'unknown', model?: string) {
  stats.fallbackCount += 1;
  stats.providerFallbacks[provider] = (stats.providerFallbacks[provider] || 0) + 1;
  persistTelemetryEvent({ eventType: 'fallback', provider, model, fallbackUsed: true });
  try { const redis = require('@/lib/redis').redisClient; if (redis && redis.isReady && redis.isReady()) redis.incr('telemetry:ai:fallbacks').catch(()=>{}); } catch {}
}

export function recordServiceUnavailable(provider = 'unknown', reason = '', model?: string) {
  stats.serviceUnavailable = (stats.serviceUnavailable || 0) + 1;
  stats.providerServiceUnavailable[provider] = (stats.providerServiceUnavailable[provider] || 0) + 1;
  if (reason) {
    const entry = { provider, reason, at: new Date().toISOString() };
    stats.lastError = entry;
    stats.errorHistory.push(entry);
    if (stats.errorHistory.length > 50) {
      stats.errorHistory.shift();
    }
  }
  persistTelemetryEvent({ eventType: 'service_unavailable', provider, reason, model, success: false, fallbackUsed: true });
  try { const redis = require('@/lib/redis').redisClient; if (redis && redis.isReady && redis.isReady()) redis.incr('telemetry:ai:service_unavailable').catch(()=>{}); } catch {}
}

export function getTelemetry() {
  return {
    ...stats,
    averageLatencyMs: stats.calls ? Math.round(stats.totalLatencyMs / stats.calls) : 0,
  };
}

export function publishTelemetryEvent(eventName: string, payload: Record<string, unknown>): void {
  void publishToStream(eventName, {
    ...payload,
    eventName,
    timestamp: new Date().toISOString(),
  }).catch((error) => {
    console.error(
      `[aiTelemetry] Failed to publish "${eventName}":`,
      error instanceof Error ? error.message : String(error)
    );
  });
}

async function publishToStream(eventName: string, payload: Record<string, unknown>): Promise<void> {
  const client = await getStreamClient();
  if (!client) return;

  await client.xAdd(
    TELEMETRY_STREAM,
    '*',
    {
      event: eventName,
      data: JSON.stringify(payload),
    },
    {
      TRIM: {
        strategy: 'MAXLEN',
        strategyModifier: '~',
        threshold: STREAM_MAX_LEN,
      },
    }
  );
}

export async function disconnectTelemetry(): Promise<void> {
  if (!streamClient?.isReady) return;
  await streamClient.quit();
  streamClient = null;
  streamConnectPromise = null;
}

export default {
  recordCall,
  recordCacheHit,
  recordFailure,
  recordFallback,
  recordServiceUnavailable,
  getTelemetry,
  publishTelemetryEvent,
  disconnectTelemetry,
};
