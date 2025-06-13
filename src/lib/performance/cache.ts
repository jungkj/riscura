// Conditional Redis import for demo mode compatibility
let Redis: any = null;
try {
  Redis = require('ioredis').default || require('ioredis');
} catch (error) {
  console.warn('Redis module not available, using in-memory cache');
}

import { v4 as uuidv4 } from 'uuid';

// Simple in-memory cache for development
class MemoryCache {
  private cache = new Map<string, { value: any; expires: number }>();
  private maxSize = 1000;

  set(key: string, value: any, ttl: number): void {
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    const expires = Date.now() + (ttl * 1000);
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
}

export const cache = new MemoryCache();

export async function cacheGet<T>(key: string): Promise<T | null> {
  return cache.get(key);
}

export async function cacheSet(key: string, value: any, ttl = 300): Promise<void> {
  cache.set(key, value, ttl);
}

export async function cacheDelete(key: string): Promise<void> {
  cache.delete(key);
}

export class CacheService {
  private redis: any = null;
  private memoryCache: InMemoryCache = new InMemoryCache();
  private defaultTTL = 3600; // 1 hour
  private keyPrefix = 'riscura:';
  private isRedisAvailable = false;

  constructor() {
    // Only initialize Redis if we have Redis configuration and the module is available
    if (Redis && (process.env.REDIS_HOST || process.env.REDIS_URL)) {
      try {
        this.redis = new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD,
          db: parseInt(process.env.REDIS_DB || '0'),
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          enableReadyCheck: true,
          showFriendlyErrorStack: true,
        });

        this.setupEventHandlers();
        this.isRedisAvailable = true;
      } catch (error) {
        console.warn('Redis not available, falling back to in-memory cache:', error);
        this.redis = null;
        this.isRedisAvailable = false;
      }
    } else {
      console.log('No Redis configuration found, using in-memory cache for demo mode');
      this.isRedisAvailable = false;
    }
  }

  private setupEventHandlers(): void {
    this.redis?.on('connect', () => {
      console.log('Redis cache connected');
    });

    this.redis?.on('error', (error) => {
      console.error('Redis cache error:', error);
    });

    this.redis?.on('close', () => {
      console.log('Redis cache connection closed');
    });
  }

  // Basic Cache Operations
  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.isRedisAvailable && this.redis) {
        const value = await this.redis.get(this.prefixKey(key));
        return value ? JSON.parse(value) : null;
      } else {
        // Use in-memory cache fallback
        const value = this.memoryCache.get(this.prefixKey(key));
        return value || null;
      }
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      const expiration = ttl || this.defaultTTL;
      
      if (this.isRedisAvailable && this.redis) {
        const serialized = JSON.stringify(value);
        const result = await this.redis.setex(
          this.prefixKey(key),
          expiration,
          serialized
        );
        return result === 'OK';
      } else {
        // Use in-memory cache fallback
        return this.memoryCache.set(this.prefixKey(key), value, expiration);
      }
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      if (this.isRedisAvailable && this.redis) {
        const result = await this.redis.del(this.prefixKey(key));
        return result > 0;
      } else {
        // Use in-memory cache fallback
        return this.memoryCache.del(this.prefixKey(key));
      }
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (this.isRedisAvailable && this.redis) {
        const result = await this.redis.exists(this.prefixKey(key));
        return result > 0;
      } else {
        // Use in-memory cache fallback
        return this.memoryCache.exists(this.prefixKey(key));
      }
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  // Advanced Cache Operations
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const prefixedKeys = keys.map(key => this.prefixKey(key));
      const values = await this.redis?.mget(...prefixedKeys);
      
      return values.map(value => 
        value ? JSON.parse(value) : null
      );
    } catch (error) {
      console.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  }

  async mset(entries: Array<{ key: string; value: any; ttl?: number }>): Promise<boolean> {
    try {
      const pipeline = this.redis?.pipeline();
      
      entries.forEach(({ key, value, ttl }) => {
        const serialized = JSON.stringify(value);
        const expiration = ttl || this.defaultTTL;
        pipeline?.setex(this.prefixKey(key), expiration, serialized);
      });
      
      const results = await pipeline?.exec();
      return results?.every(([error, result]) => !error && result === 'OK') || false;
    } catch (error) {
      console.error('Cache mset error:', error);
      return false;
    }
  }

  // Cache with fallback
  async getOrSet<T>(
    key: string,
    fallback: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }
    
    const value = await fallback();
    await this.set(key, value, ttl);
    
    return value;
  }

  // Cache patterns for common use cases
  async cacheUserData(userId: string, data: any, ttl = 1800): Promise<boolean> {
    return this.set(`user:${userId}`, data, ttl);
  }

  async getUserData<T>(userId: string): Promise<T | null> {
    return this.get<T>(`user:${userId}`);
  }

  async cacheQuery(
    query: string,
    params: any[],
    result: any,
    ttl = 300
  ): Promise<boolean> {
    const key = `query:${this.hashQuery(query, params)}`;
    return this.set(key, result, ttl);
  }

  async getCachedQuery<T>(query: string, params: any[]): Promise<T | null> {
    const key = `query:${this.hashQuery(query, params)}`;
    return this.get<T>(key);
  }

  async cacheAPIResponse(
    endpoint: string,
    params: any,
    response: any,
    ttl = 600
  ): Promise<boolean> {
    const key = `api:${endpoint}:${this.hashParams(params)}`;
    return this.set(key, response, ttl);
  }

  async getCachedAPIResponse<T>(endpoint: string, params: any): Promise<T | null> {
    const key = `api:${endpoint}:${this.hashParams(params)}`;
    return this.get<T>(key);
  }

  // Session management
  async setSession(sessionId: string, sessionData: any, ttl = 86400): Promise<boolean> {
    return this.set(`session:${sessionId}`, sessionData, ttl);
  }

  async getSession<T>(sessionId: string): Promise<T | null> {
    return this.get<T>(`session:${sessionId}`);
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    return this.del(`session:${sessionId}`);
  }

  async extendSession(sessionId: string, ttl = 86400): Promise<boolean> {
    try {
      const result = await this.redis?.expire(this.prefixKey(`session:${sessionId}`), ttl);
      return result === 1;
    } catch (error) {
      console.error('Session extend error:', error);
      return false;
    }
  }

  // Rate limiting
  async checkRateLimit(
    identifier: string,
    limit: number,
    window: number
  ): Promise<RateLimitResult> {
    const key = `rate_limit:${identifier}`;
    
    try {
      const pipeline = this.redis?.pipeline();
      pipeline?.incr(key);
      pipeline?.expire(key, window);
      
      const results = await pipeline?.exec();
      const count = results?.[0]?.[1] as number || 0;
      
      const remaining = Math.max(0, limit - count);
      const allowed = count <= limit;
      
      return {
        allowed,
        count,
        remaining,
        resetTime: new Date(Date.now() + window * 1000),
      };
    } catch (error) {
      console.error('Rate limit check error:', error);
      return {
        allowed: true,
        count: 0,
        remaining: limit,
        resetTime: new Date(),
      };
    }
  }

  // Cache invalidation patterns
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis?.keys(this.prefixKey(pattern));
      if (keys.length === 0) return 0;
      
      return await this.redis?.del(...keys);
    } catch (error) {
      console.error('Cache invalidation error:', error);
      return 0;
    }
  }

  async invalidateUserCache(userId: string): Promise<void> {
    await this.invalidatePattern(`user:${userId}*`);
  }

  async invalidateQueryCache(table?: string): Promise<void> {
    const pattern = table ? `query:*${table}*` : 'query:*';
    await this.invalidatePattern(pattern);
  }

  // Cache warming
  async warmCache(entries: Array<{ key: string; loader: () => Promise<any>; ttl?: number }>): Promise<void> {
    const promises = entries.map(async ({ key, loader, ttl }) => {
      try {
        const exists = await this.exists(key);
        if (!exists) {
          const data = await loader();
          await this.set(key, data, ttl);
        }
      } catch (error) {
        console.error(`Cache warming error for key ${key}:`, error);
      }
    });
    
    await Promise.allSettled(promises);
  }

  // Analytics and monitoring
  async getCacheStats(): Promise<CacheStats> {
    try {
      const info = await this.redis?.info('memory');
      const stats = await this.redis?.info('stats');
      const keyspace = await this.redis?.info('keyspace');
      
      return {
        memoryUsed: this.parseInfoValue(info, 'used_memory_human'),
        totalKeys: this.parseKeyspaceInfo(keyspace),
        hitRate: this.calculateHitRate(stats),
        evictedKeys: this.parseInfoValue(stats, 'evicted_keys'),
        expiredKeys: this.parseInfoValue(stats, 'expired_keys'),
        connectedClients: this.parseInfoValue(info, 'connected_clients'),
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return {
        memoryUsed: '0B',
        totalKeys: 0,
        hitRate: 0,
        evictedKeys: 0,
        expiredKeys: 0,
        connectedClients: 0,
      };
    }
  }

  // Cache health check
  async healthCheck(): Promise<CacheHealthCheck> {
    try {
      const start = Date.now();
      const testKey = `health:${uuidv4()}`;
      const testValue = 'health-check';
      
      // Test write
      await this.set(testKey, testValue, 10);
      
      // Test read
      const retrieved = await this.get(testKey);
      
      // Test delete
      await this.del(testKey);
      
      const latency = Date.now() - start;
      const healthy = retrieved === testValue;
      
      return {
        healthy,
        latency,
        message: healthy ? 'Cache is healthy' : 'Cache health check failed',
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        healthy: false,
        latency: -1,
        message: error instanceof Error ? error.message : 'Cache error',
        timestamp: new Date(),
      };
    }
  }

  // Utility methods
  private prefixKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  private hashQuery(query: string, params: any[]): string {
    const crypto = require('crypto');
    const content = JSON.stringify({ query, params });
    return crypto.createHash('md5').update(content).digest('hex');
  }

  private hashParams(params: any): string {
    const crypto = require('crypto');
    const content = JSON.stringify(params);
    return crypto.createHash('md5').update(content).digest('hex');
  }

  private parseInfoValue(info: string, key: string): any {
    const match = info.match(new RegExp(`${key}:(.+)`));
    return match ? match[1].trim() : null;
  }

  private parseKeyspaceInfo(keyspace: string): number {
    const match = keyspace.match(/keys=(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  private calculateHitRate(stats: string): number {
    const hits = this.parseInfoValue(stats, 'keyspace_hits') || 0;
    const misses = this.parseInfoValue(stats, 'keyspace_misses') || 0;
    const total = hits + misses;
    return total > 0 ? (hits / total) * 100 : 0;
  }

  // Cleanup
  async disconnect(): Promise<void> {
    await this.redis?.quit();
  }
}

// Types
export interface RateLimitResult {
  allowed: boolean;
  count: number;
  remaining: number;
  resetTime: Date;
}

export interface CacheStats {
  memoryUsed: string;
  totalKeys: number;
  hitRate: number;
  evictedKeys: number;
  expiredKeys: number;
  connectedClients: number;
}

export interface CacheHealthCheck {
  healthy: boolean;
  latency: number;
  message: string;
  timestamp: Date;
}

// Decorator for automatic caching
export function Cacheable(ttl = 300, keyGenerator?: (args: any[]) => string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const cacheKey = keyGenerator ? keyGenerator(args) : `${propertyName}:${JSON.stringify(args)}`;
      
      const cached = await cacheService.get(cacheKey);
      if (cached !== null) {
        return cached;
      }
      
      const result = await method.apply(this, args);
      await cacheService.set(cacheKey, result, ttl);
      
      return result;
    };
  };
}

// Global cache service instance
export const cacheService = new CacheService(); 