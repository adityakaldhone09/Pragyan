export {
  getOrCreateCache as recommendationSnapshotCache,
  hashCacheInput,
  normalizeCacheInput,
} from '@/ai/cache.service';

export type {
  CacheContext as RecommendationSnapshotCacheContext,
  CacheOptions as RecommendationSnapshotCacheOptions,
} from '@/ai/cache.service';
