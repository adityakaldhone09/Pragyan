import crypto from 'crypto';
import aiTelemetry from '@/lib/aiTelemetry';
import {
  getRecommendationSnapshotCollection,
  type RecommendationSnapshotDocument,
  type RecommendationSnapshotKind,
} from '@/models/RecommendationSnapshot';

export interface CacheContext<TInput> {
  userId: string;
  kind: RecommendationSnapshotKind;
  promptVersion: string;
  model: string;
  input: TInput;
  ttlSeconds?: number;
}

export interface CacheOptions<TInput, TResponse> extends CacheContext<TInput> {
  generate: () => Promise<TResponse>;
}

function normalizeText(value: unknown): string {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ');
}

function isEmptyValue(value: unknown): boolean {
  return value === null || value === undefined || value === '';
}

function canonicalize(value: unknown): unknown {
  if (isEmptyValue(value)) {
    return undefined;
  }

  if (typeof value === 'string') {
    return normalizeText(value);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    const normalized = value.flatMap((item) => {
      const canonical = canonicalize(item);
      return !isEmptyValue(canonical) ? [canonical] : [];
    });

    return Array.from(new Set(normalized.map((item) => JSON.stringify(item))))
      .sort()
      .map((item) => JSON.parse(item));
  }

  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .flatMap(([key, item]) => {
        const canonical = canonicalize(item);
        return !isEmptyValue(canonical) ? [[key, canonical] as const] : [];
      })
      .sort(([left], [right]) => left.localeCompare(right))
      .reduce<Record<string, unknown>>((accumulator, [key, item]) => {
        accumulator[key] = item;
        return accumulator;
      }, {});
  }

  return String(value);
}

export function normalizeCacheInput<TInput>(input: TInput): TInput {
  return canonicalize(input) as TInput;
}

export function hashCacheInput(input: unknown): string {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(normalizeCacheInput(input)))
    .digest('hex');
}

export async function getOrCreateCache<TInput, TResponse>(
  params: CacheOptions<TInput, TResponse>
): Promise<{ response: TResponse; cacheHit: boolean; expiresAt: Date }> {
  const collection = await getRecommendationSnapshotCollection();
  const assessmentHash = hashCacheInput(params.input);
  const expiresAt = new Date(Date.now() + (params.ttlSeconds ?? 60 * 60 * 24 * 30) * 1000);
  const normalizedInput = normalizeCacheInput(params.input);

  const cached = await collection.findOne(
    {
      userId: params.userId,
      kind: params.kind,
      assessmentHash,
      promptVersion: params.promptVersion,
      model: params.model,
      expiresAt: { $gt: new Date() },
    },
    { sort: { updatedAt: -1 } }
  );

  if (cached) {
    aiTelemetry.recordCacheHit();
    return {
      response: cached.response as TResponse,
      cacheHit: true,
      expiresAt: cached.expiresAt,
    };
  }

  const response = await params.generate();

  const doc: RecommendationSnapshotDocument = {
    userId: params.userId,
    kind: params.kind,
    assessmentHash,
    promptVersion: params.promptVersion,
    model: params.model,
    input: normalizedInput,
    response,
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt,
  };

  try {
    await collection.insertOne(doc);
  } catch (error: any) {
    if (Number(error?.code || 0) !== 11000) {
      console.warn('Failed to persist recommendation snapshot cache', error);
    }
  }

  return {
    response,
    cacheHit: false,
    expiresAt,
  };
}

export default {
  getOrCreateCache,
  hashCacheInput,
  normalizeCacheInput,
};
