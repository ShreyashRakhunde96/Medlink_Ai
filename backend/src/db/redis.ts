import Redis from 'ioredis';

const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);

let redisClient: Redis | null = null;
let isRedisAvailable = false;

try {
  redisClient = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    maxRetriesPerRequest: 2,
    enableReadyCheck: true,
    connectTimeout: 2000,
  });

  redisClient.on('connect', () => {
    isRedisAvailable = true;
    console.log(`✅ Redis connected on ${REDIS_HOST}:${REDIS_PORT}`);
  });

  redisClient.on('error', (err) => {
    isRedisAvailable = false;
    // Keep warning brief to avoid log clutter
    console.warn(`⚠️ Redis notice: ${err.message}. Fallback memory cache enabled.`);
  });
} catch (e) {
  isRedisAvailable = false;
}

// In-memory cache fallback for when Redis is disconnected
const fallbackCache = new Map<string, { value: string; expiry: number }>();

export const cache = {
  async get(key: string): Promise<string | null> {
    if (isRedisAvailable && redisClient) {
      try {
        return await redisClient.get(key);
      } catch {
        // Fall through to fallback
      }
    }
    const item = fallbackCache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      fallbackCache.delete(key);
      return null;
    }
    return item.value;
  },

  async set(key: string, value: string, expireSeconds: number = 3600): Promise<void> {
    if (isRedisAvailable && redisClient) {
      try {
        await redisClient.set(key, value, 'EX', expireSeconds);
        return;
      } catch {
        // Fall through to fallback
      }
    }
    fallbackCache.set(key, {
      value,
      expiry: Date.now() + expireSeconds * 1000,
    });
  },

  async del(key: string): Promise<void> {
    if (isRedisAvailable && redisClient) {
      try {
        await redisClient.del(key);
        return;
      } catch {
        // Fall through
      }
    }
    fallbackCache.delete(key);
  },

  /**
   * Acquire a distributed lock for concurrency protection (e.g. stock reservation)
   */
  async acquireLock(lockKey: string, ttlSeconds: number = 10): Promise<boolean> {
    const fullKey = `lock:${lockKey}`;
    if (isRedisAvailable && redisClient) {
      try {
        const result = await redisClient.set(fullKey, 'LOCKED', 'EX', ttlSeconds, 'NX');
        return result === 'OK';
      } catch {
        // Fall through
      }
    }
    const item = fallbackCache.get(fullKey);
    if (item && Date.now() <= item.expiry) {
      return false; // Already locked
    }
    fallbackCache.set(fullKey, { value: 'LOCKED', expiry: Date.now() + ttlSeconds * 1000 });
    return true;
  },

  async releaseLock(lockKey: string): Promise<void> {
    const fullKey = `lock:${lockKey}`;
    await this.del(fullKey);
  },

  isAvailable(): boolean {
    return isRedisAvailable;
  },
};

export default redisClient;

