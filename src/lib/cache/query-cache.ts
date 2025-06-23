import { LRUCache } from 'lru-cache';

interface QueryCacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class QueryCache {
  private cache: LRUCache<string, QueryCacheEntry>;
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes

  constructor(options: { max?: number; ttl?: number } = {}) {
    this.cache = new LRUCache({
      max: options.max || 1000,
      ttl: options.ttl || this.defaultTTL,
    });
  }

  set(key: string, data: any, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  size(): number {
    return this.cache.size;
  }
}

export const queryCache = new QueryCache();
export default queryCache; 