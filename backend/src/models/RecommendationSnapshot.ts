import { MongoClient, Collection } from 'mongodb';
import { config } from '@/config/env';

export type RecommendationSnapshotKind =
  | 'assessment'
  | 'career_match'
  | 'decision_intelligence'
  | 'personality_analysis'
  | 'resume_analysis'
  | 'skill_gap_analysis'
  | 'roadmap'
  | 'mentor_chat'
  | 'summary';

export interface RecommendationSnapshotDocument {
  userId: string;
  kind: RecommendationSnapshotKind;
  assessmentHash: string;
  promptVersion: string;
  model: string;
  response: unknown;
  input?: unknown;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

let mongoClientPromise: Promise<MongoClient> | null = null;
let indexesReadyPromise: Promise<void> | null = null;

async function getClient(): Promise<MongoClient> {
  const url = config.database.url;
  if (!url) {
    throw new Error('DATABASE_URL is not configured');
  }

  if (!mongoClientPromise) {
    const client = new MongoClient(url);
    mongoClientPromise = client.connect();
  }

  return mongoClientPromise;
}

async function ensureIndexes(collection: Collection<RecommendationSnapshotDocument>): Promise<void> {
  if (!indexesReadyPromise) {
    indexesReadyPromise = (async () => {
      try {
        await Promise.all([
          collection.createIndex(
            {
              userId: 1,
              assessmentHash: 1,
              promptVersion: 1,
              model: 1,
              kind: 1,
            },
            { unique: true, name: 'recommendation_snapshot_unique' }
          ),
          collection.createIndex(
            { expiresAt: 1 },
            { expireAfterSeconds: 0, name: 'recommendation_snapshot_ttl' }
          ),
          collection.createIndex(
            { userId: 1, createdAt: -1 },
            { name: 'recommendation_snapshot_user_created' }
          ),
        ]);
      } catch (error) {
        console.warn('Failed to create RecommendationSnapshot indexes', error);
      }
    })();
  }

  await indexesReadyPromise;
}

export async function getRecommendationSnapshotCollection(): Promise<Collection<RecommendationSnapshotDocument>> {
  const client = await getClient();
  const dbName = new URL(config.database.url as string).pathname.replace(/^\/+/, '') || 'Pragyan';
  const collection = client.db(dbName).collection<RecommendationSnapshotDocument>('RecommendationSnapshot');
  await ensureIndexes(collection);
  return collection;
}
