import Redis from 'ioredis';
import { env } from '@/config/env';

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

interface CacheConfig {
  ttl: number; // Time to live in seconds
  prefix: string;
  compress?: boolean;
  serialize?: boolean;
}

const DEFAULT_CACHE_CONFIG: CacheConfig = {
  ttl: 3600, // 1 hour
  prefix: 'riscura',
  compress: true,
  serialize: true,
};

// ============================================================================
// REDIS CLIENT
// ============================================================================

class RedisClient {
  private client: Redis | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    if (this.client && this.isConnected) return;

    try {
      this.client = new Redis({
        host: env.REDIS_HOST || 'localhost',
        port: parseInt(env.REDIS_PORT || '6379'),
        password: env.REDIS_PASSWORD,
        db: parseInt(env.REDIS_DB || '0'),
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 5000,
      });

      await this.client.connect();
      this.isConnected = true;
      console.log('✅ Redis connected successfully');
    } catch (error) {
      console.warn('⚠️ Redis connection failed, falling back to memory cache:', error);
      this.client = null;
      this.isConnected = false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
      this.isConnected = false;
    }
  }

  getClient(): Redis | null {
    return this.client;
  }

  isHealthy(): boolean {
    return this.isConnected && this.client !== null;
  }
}

const redisClient = new RedisClient();

// ============================================================================
// MEMORY CACHE FALLBACK
// ============================================================================

class MemoryCache {
  private cache = new Map<string, { value: any; expires: number }>();
  private maxSize = 1000; // Maximum number of entries

  set(key: string, value: any, ttl: number): void {
    // Cleanup expired entries if cache is getting full
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    const expires = Date.now() + ttl * 1000;
    this.cache.set(key, { value, expires });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key);
      }
    }
  }

  size(): number {
    return this.cache.size;
  }
}

const memoryCache = new MemoryCache();

// ============================================================================
// CACHE MANAGER
// ============================================================================

export class CacheManager {
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
  }

  private generateKey(key: string): string {
    return `${this.config.prefix}:${key}`;
  }

  private serialize(data: any): string {
    if (!this.config.serialize) return data;
    return JSON.stringify(data);
  }

  private deserialize(data: string): any {
    if (!this.config.serialize) return data;
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const cacheKey = this.generateKey(key);
    const cacheTtl = ttl || this.config.ttl;
    const serializedValue = this.serialize(value);

    try {
      // Try Redis first
      if (redisClient.isHealthy()) {
        const client = redisClient.getClient();
        if (client) {
          await client.setex(cacheKey, cacheTtl, serializedValue);
          return;
        }
      }
    } catch (error) {
      console.warn('Redis set error:', error);
    }

    // Fallback to memory cache
    memoryCache.set(cacheKey, value, cacheTtl);
  }

  async get<T = any>(key: string): Promise<T | null> {
    const cacheKey = this.generateKey(key);

    try {
      // Try Redis first
      if (redisClient.isHealthy()) {
        const client = redisClient.getClient();
        if (client) {
          const value = await client.get(cacheKey);
          if (value !== null) {
            return this.deserialize(value);
          }
        }
      }
    } catch (error) {
      console.warn('Redis get error:', error);
    }

    // Fallback to memory cache
    return memoryCache.get(cacheKey);
  }

  async delete(key: string): Promise<void> {
    const cacheKey = this.generateKey(key);

    try {
      // Try Redis first
      if (redisClient.isHealthy()) {
        const client = redisClient.getClient();
        if (client) {
          await client.del(cacheKey);
        }
      }
    } catch (error) {
      console.warn('Redis delete error:', error);
    }

    // Also clear from memory cache
    memoryCache.delete(cacheKey);
  }

  async clear(pattern?: string): Promise<void> {
    try {
      // Clear Redis
      if (redisClient.isHealthy()) {
        const client = redisClient.getClient();
        if (client) {
          if (pattern) {
            const keys = await client.keys(`${this.config.prefix}:${pattern}`);
            if (keys.length > 0) {
              await client.del(...keys);
            }
          } else {
            await client.flushdb();
          }
        }
      }
    } catch (error) {
      console.warn('Redis clear error:', error);
    }

    // Clear memory cache
    memoryCache.clear();
  }

  async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetcher();
    await this.set(key, value, ttl);
    return value;
  }

  async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
    const cacheKeys = keys.map((key) => this.generateKey(key));

    try {
      // Try Redis first
      if (redisClient.isHealthy()) {
        const client = redisClient.getClient();
        if (client) {
          const values = await client.mget(...cacheKeys);
          return values.map((value) => (value ? this.deserialize(value) : null));
        }
      }
    } catch (error) {
      console.warn('Redis mget error:', error);
    }

    // Fallback to memory cache
    return cacheKeys.map((key) => memoryCache.get(key));
  }

  async mset(entries: Array<{ key: string; value: any; ttl?: number }>): Promise<void> {
    for (const entry of entries) {
      await this.set(entry.key, entry.value, entry.ttl);
    }
  }

  async exists(key: string): Promise<boolean> {
    const cached = await this.get(key);
    return cached !== null;
  }

  async ttl(key: string): Promise<number> {
    const cacheKey = this.generateKey(key);

    try {
      if (redisClient.isHealthy()) {
        const client = redisClient.getClient();
        if (client) {
          return await client.ttl(cacheKey);
        }
      }
    } catch (error) {
      console.warn('Redis TTL error:', error);
    }

    return -1; // Unknown for memory cache
  }

  async increment(key: string, value = 1): Promise<number> {
    const cacheKey = this.generateKey(key);

    try {
      if (redisClient.isHealthy()) {
        const client = redisClient.getClient();
        if (client) {
          return await client.incrby(cacheKey, value);
        }
      }
    } catch (error) {
      console.warn('Redis increment error:', error);
    }

    // Fallback for memory cache
    const current = (await this.get<number>(key)) || 0;
    const newValue = current + value;
    await this.set(key, newValue);
    return newValue;
  }
}

// ============================================================================
// CACHE STRATEGIES
// ============================================================================

export enum CacheStrategy {
  CACHE_FIRST = 'cache-first',
  CACHE_ASIDE = 'cache-aside',
  WRITE_THROUGH = 'write-through',
  WRITE_BEHIND = 'write-behind',
}

export interface CacheOptions {
  strategy?: CacheStrategy;
  ttl?: number;
  tags?: string[];
  compress?: boolean;
}

// ============================================================================
// PREDEFINED CACHE INSTANCES
// ============================================================================

// Different cache instances for different data types
export const sessionCache = new CacheManager({
  prefix: 'riscura:session',
  ttl: 3600, // 1 hour
});

export const queryCache = new CacheManager({
  prefix: 'riscura:query',
  ttl: 300, // 5 minutes
});

export const userCache = new CacheManager({
  prefix: 'riscura:user',
  ttl: 1800, // 30 minutes
});

export const organizationCache = new CacheManager({
  prefix: 'riscura:org',
  ttl: 3600, // 1 hour
});

export const staticCache = new CacheManager({
  prefix: 'riscura:static',
  ttl: 86400, // 24 hours
});

// ============================================================================
// CACHE WARMING
// ============================================================================

export class CacheWarmer {
  private cacheManager: CacheManager;

  constructor(cacheManager: CacheManager) {
    this.cacheManager = cacheManager;
  }

  async warmCache(
    entries: Array<{ key: string; fetcher: () => Promise<any>; ttl?: number }>
  ): Promise<void> {
    console.log(`🔥 Warming cache with ${entries.length} entries...`);

    const startTime = performance.now();
    const promises = entries.map(async (entry) => {
      try {
        const value = await entry.fetcher();
        await this.cacheManager.set(entry.key, value, entry.ttl);
      } catch (error) {
        console.warn(`Failed to warm cache for key: ${entry.key}`, error);
      }
    });

    await Promise.all(promises);
    const duration = performance.now() - startTime;
    console.log(`✅ Cache warming completed in ${duration.toFixed(2)}ms`);
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

export async function initializeCache(): Promise<void> {
  try {
    await redisClient.connect();
  } catch (error) {
    console.warn('Cache initialization warning:', error);
  }
}

export async function closeCacheConnections(): Promise<void> {
  await redisClient.disconnect();
}

// ============================================================================
// CACHE HEALTH CHECK
// ============================================================================

export async function getCacheHealth(): Promise<{
  redis: boolean;
  memory: boolean;
  memorySize: number;
}> {
  return {
    redis: redisClient.isHealthy(),
    memory: true,
    memorySize: memoryCache.size(),
  };
}
