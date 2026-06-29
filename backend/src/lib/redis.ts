const { createClient } = require('redis');
import { config } from '@/config/env';

type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
interface JsonObject { [key: string]: JsonValue }

class RedisWrapper {
  private client: any = null;
  private ready = false;
  private fallbackStore = new Map<string, string>();
  private locks = new Map<string, number>();

  constructor() {
    const url = config.redis.url;
    if (!url) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn('REDIS_URL not configured — running with in-memory fallback');
      }
      return;
    }

    try {
      this.client = createClient({ url });
      this.client.on('error', (err: any) => {
        console.error('Redis error', err);
        this.ready = false;
      });
      this.client.connect().then(() => {
        this.ready = true;
        console.log('Connected to Redis');
      }).catch((e: any) => {
        console.error('Redis connect failed', e);
        this.ready = false;
      });
    } catch (err) {
      console.error('Redis initialization failed', err);
    }
  }

  isReady() {
    return this.ready && this.client !== null;
  }

  async get(key: string): Promise<string | null> {
    if (this.isReady()) {
      try {
        return await this.client!.get(key);
      } catch (e) {
        console.error('Redis get error', e);
      }
    }
    return this.fallbackStore.has(key) ? String(this.fallbackStore.get(key)) : null;
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    if (this.isReady()) {
      try {
        if (ttlSeconds) return await this.client!.setEx(key, ttlSeconds, value);
        return await this.client!.set(key, value);
      } catch (e) {
        console.error('Redis set error', e);
      }
    }
    this.fallbackStore.set(key, value);
    if (ttlSeconds) {
      const t = setTimeout(() => this.fallbackStore.delete(key), ttlSeconds * 1000);
      // do not keep Node process open for test runs
      try { t.unref && t.unref(); } catch (e) {}
    }
  }

  async del(key: string) {
    if (this.isReady()) {
      try { await this.client!.del(key); return; } catch (e) { console.error('Redis del error', e); }
    }
    this.fallbackStore.delete(key);
  }

  async incr(key: string): Promise<number> {
    if (this.isReady()) {
      try { return await this.client!.incr(key); } catch (e) { console.error('Redis incr error', e); }
    }
    const v = Number(this.fallbackStore.get(key) || '0') + 1;
    this.fallbackStore.set(key, String(v));
    return v;
  }

  async incrBy(key: string, amount: number): Promise<number> {
    if (this.isReady()) {
      try { return await this.client!.incrBy(key, amount); } catch (e) { console.error('Redis incrBy error', e); }
    }
    const v = Number(this.fallbackStore.get(key) || '0') + amount;
    this.fallbackStore.set(key, String(v));
    return v;
  }

  async expire(key: string, seconds: number) {
    if (this.isReady()) {
      try { await this.client!.expire(key, seconds); return; } catch (e) { console.error('Redis expire error', e); }
    }
    // in-memory fallback handled in set
  }

  // Simple lock via SETNX equivalent using Redis SET with NX PX
  async acquireLock(lockKey: string, ttlMs = 10000): Promise<boolean> {
    if (this.isReady()) {
      try {
        const res = await this.client!.set(lockKey, '1', { NX: true, PX: ttlMs });
        return res === 'OK';
      } catch (e) {
        console.error('Redis acquireLock error', e);
      }
    }

    // fallback in-memory lock
    const now = Date.now();
    const existing = this.locks.get(lockKey) || 0;
    if (existing > now) return false;
    this.locks.set(lockKey, now + ttlMs);
    return true;
  }

  async releaseLock(lockKey: string) {
    if (this.isReady()) {
      try { await this.client!.del(lockKey); return; } catch (e) { console.error('Redis releaseLock error', e); }
    }
    this.locks.delete(lockKey);
  }

  async waitForKey(key: string, timeoutMs = 15000): Promise<string | null> {
    const deadline = Date.now() + timeoutMs;

    const poll = async (): Promise<string | null> => {
      if (Date.now() >= deadline) return null;
      const v = await this.get(key);
      if (v !== null) return v;
      await new Promise((r) => setTimeout(r, 250));
      return poll();
    };

    return poll();
  }
}

export const redisClient = new RedisWrapper();

export default redisClient;
