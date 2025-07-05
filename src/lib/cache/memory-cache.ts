import { LRUCache } from 'lru-cache';
import { prisma } from '@/lib/db';

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  max?: number; // Maximum number of items
}

interface CacheEntry {
  key: string;
  value: any;
  expiresAt: Date;
}

/**
 * Free in-memory cache implementation with optional database persistence
 * Falls back to database for persistence when memory is cleared
 */
export class MemoryCache {
  private static instance: MemoryCache;
  private cache: LRUCache<string, any>;
  private persistToDB: boolean;

  private constructor(options: CacheOptions = {}) {
    this.cache = new LRUCache({
      max: options.max || 500, // Maximum 500 items
      ttl: options.ttl || 1000 * 60 * 5, // 5 minutes default TTL
      updateAgeOnGet: true,
      updateAgeOnHas: true,
    });
    
    // Check if we should persist to database
    this.persistToDB = process.env.CACHE_PERSIST === 'true';
  }

  static getInstance(): MemoryCache {
    if (!this.instance) {
      this.instance = new MemoryCache();
    }
    return this.instance;
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    // Try memory cache first
    const cached = this.cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    // If not in memory and persistence is enabled, check database
    if (this.persistToDB) {
      try {
        const dbCache = await prisma.cache.findUnique({
          where: { key },
        });

        if (dbCache && dbCache.expiresAt > new Date()) {
          const value = JSON.parse(dbCache.value);
          // Restore to memory cache
          this.cache.set(key, value);
          return value;
        }

        // Clean up expired entry
        if (dbCache) {
          await prisma.cache.delete({ where: { key } });
        }
      } catch (error) {
        console.error('Cache DB read error:', error);
      }
    }

    return null;
  }

  /**
   * Set a value in cache
   */
  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    const ttl = ttlMs || 1000 * 60 * 5; // 5 minutes default
    
    // Set in memory cache
    this.cache.set(key, value, { ttl });

    // Persist to database if enabled
    if (this.persistToDB) {
      try {
        await prisma.cache.upsert({
          where: { key },
          update: {
            value: JSON.stringify(value),
            expiresAt: new Date(Date.now() + ttl),
          },
          create: {
            key,
            value: JSON.stringify(value),
            expiresAt: new Date(Date.now() + ttl),
          },
        });
      } catch (error) {
        console.error('Cache DB write error:', error);
      }
    }
  }

  /**
   * Set with expiration time
   */
  async setex(key: string, seconds: number, value: any): Promise<void> {
    await this.set(key, value, seconds * 1000);
  }

  /**
   * Delete a value from cache
   */
  async del(key: string): Promise<void> {
    this.cache.delete(key);

    if (this.persistToDB) {
      try {
        await prisma.cache.delete({
          where: { key },
        });
      } catch (error) {
        console.error('Cache DB delete error:', error);
      }
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (this.cache.has(key)) {
      return true;
    }

    if (this.persistToDB) {
      try {
        const count = await prisma.cache.count({
          where: {
            key,
            expiresAt: { gt: new Date() },
          },
        });
        return count > 0;
      } catch (error) {
        console.error('Cache DB exists error:', error);
      }
    }

    return false;
  }

  /**
   * Get all keys matching a pattern
   */
  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    const memoryKeys = Array.from(this.cache.keys()).filter(key => regex.test(key));

    if (this.persistToDB) {
      try {
        const dbKeys = await prisma.cache.findMany({
          where: {
            key: { contains: pattern.replace(/\*/g, '') },
            expiresAt: { gt: new Date() },
          },
          select: { key: true },
        });
        
        const allKeys = new Set([...memoryKeys, ...dbKeys.map(item => item.key)]);
        return Array.from(allKeys).filter(key => regex.test(key));
      } catch (error) {
        console.error('Cache DB keys error:', error);
      }
    }

    return memoryKeys;
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.cache.clear();

    if (this.persistToDB) {
      try {
        await prisma.cache.deleteMany({});
      } catch (error) {
        console.error('Cache DB clear error:', error);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.cache.max,
      calculatedSize: this.cache.calculatedSize,
    };
  }

  /**
   * Clean up expired entries from database
   */
  async cleanup(): Promise<void> {
    if (this.persistToDB) {
      try {
        const deleted = await prisma.cache.deleteMany({
          where: {
            expiresAt: { lt: new Date() },
          },
        });
        console.log(`Cleaned up ${deleted.count} expired cache entries`);
      } catch (error) {
        console.error('Cache cleanup error:', error);
      }
    }
  }
}

// Create a singleton instance that mimics Redis API
export const cache = MemoryCache.getInstance();

// Redis-compatible exports
export const redis = {
  get: (key: string) => cache.get(key),
  set: (key: string, value: any) => cache.set(key, value),
  setex: (key: string, seconds: number, value: any) => cache.setex(key, seconds, value),
  del: (key: string) => cache.del(key),
  exists: (key: string) => cache.exists(key),
  keys: (pattern: string) => cache.keys(pattern),
  flushall: () => cache.clear(),
};