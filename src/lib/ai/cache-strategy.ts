import { LRUCache } from 'lru-cache';
import { createHash } from 'crypto';

interface CacheEntry {
  response: any;
  timestamp: number;
  ttl: number;
  hitCount: number;
  lastAccessed: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  memoryUsage: number;
}

export class EnhancedAICacheStrategy {
  private memoryCache: LRUCache<string, CacheEntry>;
  private stats: CacheStats;
  private persistentStore: Map<string, CacheEntry>;

  constructor(
    private maxMemorySize: number = 1000,
    private defaultTTL: number = 900000, // 15 minutes
    private maxPersistentSize: number = 5000
  ) {
    this.memoryCache = new LRUCache({
      max: maxMemorySize,
      ttl: defaultTTL,
      ttlAutopurge: true,
      allowStale: false,
    });

    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      size: 0,
      memoryUsage: 0,
    };

    this.persistentStore = new Map();
    this.loadPersistentCache();
    this.startMaintenanceTasks();
  }

  /**
   * Get cached response with intelligent cache strategy
   */
  get(key: string): any | null {
    const cacheKey = this.generateCacheKey(key);

    // Try memory cache first (fastest)
    let entry = this.memoryCache.get(cacheKey);

    if (entry) {
      if (this.isEntryValid(entry)) {
        entry.hitCount++;
        entry.lastAccessed = Date.now();
        this.stats.hits++;
        this.updateHitRate();
        return entry.response;
      } else {
        this.memoryCache.delete(cacheKey);
      }
    }

    // Try persistent cache (slower but larger)
    entry = this.persistentStore.get(cacheKey);
    if (entry && this.isEntryValid(entry)) {
      entry.hitCount++;
      entry.lastAccessed = Date.now();

      // Promote to memory cache for faster future access
      this.memoryCache.set(cacheKey, entry);

      this.stats.hits++;
      this.updateHitRate();
      return entry.response;
    }

    // Cache miss
    this.stats.misses++;
    this.updateHitRate();
    return null;
  }

  /**
   * Set cache entry with intelligent TTL and storage strategy
   */
  set(key: string, response: any, customTTL?: number): void {
    const cacheKey = this.generateCacheKey(key);
    const ttl = customTTL || this.calculateDynamicTTL(response);

    const entry: CacheEntry = {
      response,
      timestamp: Date.now(),
      ttl,
      hitCount: 0,
      lastAccessed: Date.now(),
    };

    // Always store in memory cache for fast access
    this.memoryCache.set(cacheKey, entry);

    // Store in persistent cache based on importance
    if (this.shouldPersist(response, entry)) {
      this.persistentStore.set(cacheKey, entry);

      // Cleanup persistent cache if it gets too large
      if (this.persistentStore.size > this.maxPersistentSize) {
        this.cleanupPersistentCache();
      }
    }

    this.updateStats();
  }

  /**
   * Invalidate cache entries based on patterns or conditions
   */
  invalidate(pattern?: string | RegExp): number {
    let invalidatedCount = 0;

    if (!pattern) {
      // Clear all caches
      this.memoryCache.clear();
      this.persistentStore.clear();
      invalidatedCount = this.stats.size;
    } else {
      const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

      // Invalidate matching entries
      for (const key of this.memoryCache.keys()) {
        if (regex.test(key)) {
          this.memoryCache.delete(key);
          invalidatedCount++;
        }
      }

      for (const key of this.persistentStore.keys()) {
        if (regex.test(key)) {
          this.persistentStore.delete(key);
          invalidatedCount++;
        }
      }
    }

    this.updateStats();
    return invalidatedCount;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Warm up cache with common queries
   */
  async warmUp(commonQueries: Array<{ key: string; value: any; ttl?: number }>): Promise<void> {
    for (const query of commonQueries) {
      this.set(query.key, query.value, query.ttl);
    }
  }

  /**
   * Export cache for backup/analysis
   */
  export(): Record<string, any> {
    const memoryEntries: Record<string, any> = {};
    const persistentEntries: Record<string, any> = {};

    for (const [key, value] of this.memoryCache.entries()) {
      memoryEntries[key] = value;
    }

    for (const [key, value] of this.persistentStore.entries()) {
      persistentEntries[key] = value;
    }

    return {
      memory: memoryEntries,
      persistent: persistentEntries,
      stats: this.stats,
      timestamp: new Date().toISOString(),
    };
  }

  private generateCacheKey(input: string): string {
    return createHash('sha256').update(input).digest('hex').substring(0, 32);
  }

  private isEntryValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  private calculateDynamicTTL(_response: any): number {
    // Longer TTL for static content
    if (this.isStaticContent(response)) {
      return 3600000; // 1 hour
    }

    // Shorter TTL for dynamic content
    if (this.isDynamicContent(response)) {
      return 300000; // 5 minutes
    }

    // Medium TTL for analysis results
    if (this.isAnalysisContent(response)) {
      return 1800000; // 30 minutes
    }

    return this.defaultTTL;
  }

  private isStaticContent(_response: any): boolean {
    // Check for static content indicators
    const content = JSON.stringify(response).toLowerCase();
    return (
      content.includes('framework') ||
      content.includes('definition') ||
      content.includes('standard')
    );
  }

  private isDynamicContent(_response: any): boolean {
    // Check for dynamic content indicators
    const content = JSON.stringify(response).toLowerCase();
    return content.includes('current') || content.includes('today') || content.includes('realtime');
  }

  private isAnalysisContent(_response: any): boolean {
    // Check for analysis content indicators
    const content = JSON.stringify(response).toLowerCase();
    return (
      content.includes('analysis') ||
      content.includes('assessment') ||
      content.includes('recommendation')
    );
  }

  private shouldPersist(_response: any, entry: CacheEntry): boolean {
    // Persist high-value responses
    const responseSize = JSON.stringify(response).length;

    // Don't persist very large responses
    if (responseSize > 100000) {
      // 100KB
      return false;
    }

    // Persist analysis results and frameworks
    return this.isAnalysisContent(response) || this.isStaticContent(response);
  }

  private cleanupPersistentCache(): void {
    // Sort by last accessed time and hit count
    const entries = Array.from(this.persistentStore.entries())
      .map(([key, entry]) => ({
        key,
        entry,
        score: entry.hitCount / Math.max(1, Date.now() - entry.lastAccessed),
      }))
      .sort((a, b) => a.score - b.score);

    // Remove least valuable entries
    const toRemove = Math.floor(this.maxPersistentSize * 0.2); // Remove 20%
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      this.persistentStore.delete(entries[i].key);
    }
  }

  private updateStats(): void {
    this.stats.size = this.memoryCache.size + this.persistentStore.size;
    this.stats.memoryUsage = this.calculateMemoryUsage();
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  private calculateMemoryUsage(): number {
    // Rough estimate of memory usage
    let usage = 0;
    for (const entry of this.memoryCache.values()) {
      usage += JSON.stringify(entry).length;
    }
    return usage;
  }

  private loadPersistentCache(): void {
    // In a real implementation, this would load from storage (Redis, etc.)
    // For now, just initialize empty
  }

  private startMaintenanceTasks(): void {
    // Cleanup expired entries every 5 minutes
    setInterval(() => {
      this.performMaintenance();
    }, 300000);
  }

  private performMaintenance(): void {
    // Remove expired entries from persistent store
    for (const [key, entry] of this.persistentStore.entries()) {
      if (!this.isEntryValid(entry)) {
        this.persistentStore.delete(key);
      }
    }

    this.updateStats();
  }
}
