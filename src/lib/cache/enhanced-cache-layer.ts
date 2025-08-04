/**
 * Enhanced Redis Caching Layer for Riscura Platform
 * Integrates all caching strategies and provides enterprise-grade performance optimization
 */

// import { redisClient } from './redis-client'
import {
  CacheManager,
  organizationCache,
  userCache,
  queryCache,
  staticCache,
} from '../performance/cache-manager';
import { apiCache } from './api-cache';
import { invalidationService } from './invalidation-service';
import { logger } from '../monitoring/logger';
import { db } from '../db';

// ============================================================================
// CACHE LAYER CONFIGURATION
// ============================================================================

export interface CacheLayerConfig {
  enableMultiLayerCaching: boolean;
  enableIntelligentPrefetching: boolean;
  enableCompressionOptimization: boolean;
  enableCacheWarming: boolean;
  enableSmartInvalidation: boolean;
  defaultTTL: number;
  maxCacheSize: number;
  compressionThreshold: number;
  prefetchThreshold: number;
  warmupEndpoints: string[];
  criticalDataTTL: number;
  bulkOperationTTL: number;
}

const DEFAULT_CONFIG: CacheLayerConfig = {
  enableMultiLayerCaching: true,
  enableIntelligentPrefetching: true,
  enableCompressionOptimization: true,
  enableCacheWarming: true,
  enableSmartInvalidation: true,
  defaultTTL: 300, // 5 minutes
  maxCacheSize: 100000, // 100k entries
  compressionThreshold: 1024, // 1KB
  prefetchThreshold: 0.8, // 80% cache hit ratio
  warmupEndpoints: [
    '/api/dashboard/metrics',
    '/api/organizations/current',
    '/api/users/profile',
    '/api/risks/summary',
    '/api/compliance/status',
  ],
  criticalDataTTL: 60, // 1 minute for critical data
  bulkOperationTTL: 1800, // 30 minutes for bulk operations
};

// ============================================================================
// ENHANCED CACHE LAYER CLASS
// ============================================================================

export class EnhancedCacheLayer {
  private config: CacheLayerConfig;
  private metrics: CacheLayerMetrics;
  private warmupInProgress: boolean = false;
  private prefetchQueue: Set<string> = new Set();

  constructor(_config: Partial<CacheLayerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.metrics = {
      totalRequests: 0,
      l1Hits: 0, // Memory cache hits
      l2Hits: 0, // Redis cache hits
      misses: 0,
      prefetchHits: 0,
      compressionSaved: 0,
      invalidations: 0,
      warmupTime: 0,
      avgResponseTime: 0,
    };
  }

  // ============================================================================
  // MULTI-LAYER CACHING
  // ============================================================================

  /**
   * Get data with multi-layer caching strategy
   */
  async get<T>(
    key: string,
    fetcher?: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T | null> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      // Layer 1: Memory cache (fastest)
      if (this.config.enableMultiLayerCaching) {
        const memoryResult = await this.getFromMemory<T>(key);
        if (memoryResult !== null) {
          this.metrics.l1Hits++;
          this.updateResponseTime(Date.now() - startTime);
          return memoryResult;
        }
      }

      // Layer 2: Redis cache
      const redisResult = await this.getFromRedis<T>(key);
      if (redisResult !== null) {
        this.metrics.l2Hits++;

        // Populate memory cache for next request
        if (this.config.enableMultiLayerCaching) {
          await this.setInMemory(key, redisResult, options.ttl);
        }

        this.updateResponseTime(Date.now() - startTime);
        return redisResult;
      }

      // Layer 3: Source data (if fetcher provided)
      if (fetcher) {
        const sourceResult = await fetcher();
        this.metrics.misses++;

        // Cache in both layers
        await this.setMultiLayer(key, sourceResult, options);

        // Schedule prefetch of related data
        if (this.config.enableIntelligentPrefetching) {
          this.schedulePrefetch(key, options);
        }

        this.updateResponseTime(Date.now() - startTime);
        return sourceResult;
      }

      this.metrics.misses++;
      return null;
    } catch (error) {
      logger.error('Enhanced cache get error:', error);
      this.metrics.misses++;
      return null;
    }
  }

  /**
   * Set data in multi-layer cache
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    await this.setMultiLayer(key, value, options);
  }

  /**
   * Delete from all cache layers
   */
  async delete(key: string): Promise<void> {
    await Promise.all([this.deleteFromMemory(key), this.deleteFromRedis(key)]);
    this.metrics.invalidations++;
  }

  // ============================================================================
  // INTELLIGENT PREFETCHING
  // ============================================================================

  /**
   * Prefetch related data based on access patterns
   */
  private async schedulePrefetch(key: string, options: CacheOptions): Promise<void> {
    if (!this.config.enableIntelligentPrefetching || this.prefetchQueue.has(key)) {
      return;
    }

    this.prefetchQueue.add(key);

    // Schedule prefetch after small delay to batch operations
    setTimeout(async () => {
      try {
        await this.executePrefetch(key, options);
      } finally {
        this.prefetchQueue.delete(key);
      }
    }, 100);
  }

  private async executePrefetch(key: string, options: CacheOptions): Promise<void> {
    const relatedKeys = this.generateRelatedKeys(key);

    for (const relatedKey of relatedKeys) {
      const exists = await redisClient.exists(relatedKey);
      if (!exists) {
        // Prefetch related data if it's commonly accessed together
        const prefetchData = await this.fetchRelatedData(relatedKey);
        if (prefetchData) {
          await this.setMultiLayer(relatedKey, prefetchData, {
            ...options,
            ttl: options.ttl ? options.ttl * 0.5 : this.config.defaultTTL * 0.5,
          });
          this.metrics.prefetchHits++;
        }
      }
    }
  }

  private generateRelatedKeys(key: string): string[] {
    const parts = key.split(':');
    const relatedKeys: string[] = [];

    // Generate related keys based on patterns
    if (parts.includes('risk')) {
      const orgId = parts[1];
      relatedKeys.push(
        `org:${orgId}:risks:summary`,
        `org:${orgId}:dashboard:metrics`,
        `org:${orgId}:compliance:status`
      );
    }

    if (parts.includes('user')) {
      const orgId = parts[1];
      relatedKeys.push(
        `org:${orgId}:users:active`,
        `org:${orgId}:permissions`,
        `org:${orgId}:roles`
      );
    }

    if (parts.includes('organization')) {
      const orgId = parts[1];
      relatedKeys.push(
        `org:${orgId}:subscription`,
        `org:${orgId}:settings`,
        `org:${orgId}:billing:status`
      );
    }

    return relatedKeys;
  }

  private async fetchRelatedData(key: string): Promise<any> {
    // This would implement intelligent data fetching based on key patterns
    // For now, return null to avoid unnecessary database calls
    return null;
  }

  // ============================================================================
  // CACHE WARMING
  // ============================================================================

  /**
   * Warm critical cache entries for optimal performance
   */
  async warmCache(organizationId?: string): Promise<void> {
    if (this.warmupInProgress) {
      return;
    }

    this.warmupInProgress = true;
    const startTime = Date.now();

    try {
      logger.info('🔥 Starting cache warming process...');

      const warmupTasks = [
        this.warmOrganizationData(organizationId),
        this.warmDashboardData(organizationId),
        this.warmUserData(organizationId),
        this.warmStaticData(),
        this.warmBillingData(organizationId),
      ];

      await Promise.allSettled(warmupTasks);

      const _duration = Date.now() - startTime;
      this.metrics.warmupTime = duration;

      logger.info(`✅ Cache warming completed in ${duration}ms`);
    } catch (error) {
      logger.error('Cache warming error:', error);
    } finally {
      this.warmupInProgress = false;
    }
  }

  private async warmOrganizationData(organizationId?: string): Promise<void> {
    if (!organizationId) return;

    const tasks = [
      // Organization details
      this.warmSingleEntry(
        `org:${organizationId}:details`,
        () => db.organization.findUnique({ where: { id: organizationId } }),
        { ttl: 3600 }
      ),
      // Organization settings
      this.warmSingleEntry(
        `org:${organizationId}:settings`,
        () =>
          db.organization.findUnique({
            where: { id: organizationId },
            select: { settings: true, plan: true, isActive: true },
          }),
        { ttl: 1800 }
      ),
      // Active users count
      this.warmSingleEntry(
        `org:${organizationId}:users:count`,
        () =>
          db.user.count({
            where: { organizationId, isActive: true },
          }),
        { ttl: 600 }
      ),
    ];

    await Promise.allSettled(tasks);
  }

  private async warmDashboardData(organizationId?: string): Promise<void> {
    if (!organizationId) return;

    const tasks = [
      // Risk metrics
      this.warmSingleEntry(
        `org:${organizationId}:risks:metrics`,
        async () => {
          const [total, critical, high, medium, low] = await Promise.all([
            db.risk.count({ where: { organizationId } }),
            db.risk.count({ where: { organizationId, riskLevel: 'CRITICAL' } }),
            db.risk.count({ where: { organizationId, riskLevel: 'HIGH' } }),
            db.risk.count({ where: { organizationId, riskLevel: 'MEDIUM' } }),
            db.risk.count({ where: { organizationId, riskLevel: 'LOW' } }),
          ]);
          return { total, critical, high, medium, low };
        },
        { ttl: 300 }
      ),
      // Recent activities
      this.warmSingleEntry(
        `org:${organizationId}:activities:recent`,
        () =>
          db.activity.findMany({
            where: { organizationId },
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: { user: { select: { name: true, email: true } } },
          }),
        { ttl: 180 }
      ),
    ];

    await Promise.allSettled(tasks);
  }

  private async warmUserData(organizationId?: string): Promise<void> {
    if (!organizationId) return;

    await this.warmSingleEntry(
      `org:${organizationId}:users:active`,
      () =>
        db.user.findMany({
          where: { organizationId, isActive: true },
          select: { id: true, name: true, email: true, role: true, lastLoginAt: true },
        }),
      { ttl: 900 }
    );
  }

  private async warmStaticData(): Promise<void> {
    const tasks = [
      // Subscription plans
      this.warmSingleEntry(
        'static:subscription:plans',
        () =>
          db.subscriptionPlan.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
          }),
        { ttl: 86400 }
      ),
      // Risk categories
      this.warmSingleEntry(
        'static:risk:categories',
        () => ['OPERATIONAL', 'FINANCIAL', 'STRATEGIC', 'COMPLIANCE', 'TECHNOLOGY'],
        { ttl: 86400 }
      ),
    ];

    await Promise.allSettled(tasks);
  }

  private async warmBillingData(organizationId?: string): Promise<void> {
    if (!organizationId) return;

    await this.warmSingleEntry(
      `org:${organizationId}:billing:status`,
      async () => {
        const subscription = await db.organizationSubscription.findFirst({
          where: { organizationId },
          include: { plan: true },
        });
        return subscription
          ? {
              status: subscription.status,
              planName: subscription.plan.name,
              currentPeriodEnd: subscription.currentPeriodEnd,
            }
          : null;
      },
      { ttl: 600 }
    );
  }

  private async warmSingleEntry(
    key: string,
    fetcher: () => Promise<any>,
    options: CacheOptions
  ): Promise<void> {
    try {
      const exists = await redisClient.exists(key);
      if (!exists) {
        const data = await fetcher();
        if (data !== null && data !== undefined) {
          await this.setMultiLayer(key, data, options);
        }
      }
    } catch (error) {
      logger.error(`Cache warming failed for ${key}:`, error);
    }
  }

  // ============================================================================
  // SMART INVALIDATION
  // ============================================================================

  /**
   * Invalidate cache with smart dependency resolution
   */
  async invalidateSmartly(
    resource: string,
    resourceId?: string,
    organizationId?: string
  ): Promise<number> {
    if (!this.config.enableSmartInvalidation) {
      return 0;
    }

    const patterns = this.generateInvalidationPatterns(resource, resourceId, organizationId);
    let totalInvalidated = 0;

    for (const pattern of patterns) {
      const invalidated = await this.invalidatePattern(pattern);
      totalInvalidated += invalidated;
    }

    this.metrics.invalidations += totalInvalidated;
    logger.info(`Smart invalidation: ${totalInvalidated} entries for ${resource}:${resourceId}`);

    return totalInvalidated;
  }

  private generateInvalidationPatterns(
    resource: string,
    resourceId?: string,
    organizationId?: string
  ): string[] {
    const patterns: string[] = [];

    if (organizationId) {
      // Organization-specific patterns
      patterns.push(`org:${organizationId}:${resource}:*`);

      if (resourceId) {
        patterns.push(`org:${organizationId}:${resource}:${resourceId}:*`);
      }

      // Related data patterns
      switch (resource) {
        case 'risk':
          patterns.push(
            `org:${organizationId}:dashboard:*`,
            `org:${organizationId}:risks:metrics`,
            `org:${organizationId}:compliance:*`,
            `org:${organizationId}:activities:*`
          );
          break;

        case 'user':
          patterns.push(
            `org:${organizationId}:users:*`,
            `org:${organizationId}:activities:*`,
            `org:${organizationId}:permissions:*`
          );
          break;

        case 'organization':
          patterns.push(`org:${organizationId}:*`);
          break;

        case 'subscription':
          patterns.push(
            `org:${organizationId}:billing:*`,
            `org:${organizationId}:limits:*`,
            `org:${organizationId}:features:*`
          );
          break;
      }
    }

    return patterns;
  }

  // ============================================================================
  // COMPRESSION OPTIMIZATION
  // ============================================================================

  private async compressIfNeeded(_data: any): Promise<{ data: any; compressed: boolean }> {
    if (!this.config.enableCompressionOptimization) {
      return { data, compressed: false };
    }

    const serialized = JSON.stringify(data);
    const size = Buffer.byteLength(serialized, 'utf8');

    if (size > this.config.compressionThreshold) {
      const compressed = Buffer.from(serialized).toString('base64');
      const compressionRatio = compressed.length / size;

      if (compressionRatio < 0.8) {
        // Only compress if >20% savings
        this.metrics.compressionSaved += size - compressed.length;
        return { data: compressed, compressed: true };
      }
    }

    return { data, compressed: false };
  }

  private decompressIfNeeded(_data: any, compressed: boolean): any {
    if (!compressed || !this.config.enableCompressionOptimization) {
      return data;
    }

    try {
      const decompressed = Buffer.from(data, 'base64').toString();
      return JSON.parse(decompressed);
    } catch (error) {
      logger.error('Decompression error:', error);
      return data;
    }
  }

  // ============================================================================
  // CACHE LAYER HELPERS
  // ============================================================================

  private async getFromMemory<T>(key: string): Promise<T | null> {
    // Use existing memory cache from cache manager
    return await queryCache.get<T>(key);
  }

  private async setInMemory<T>(key: string, value: T, ttl?: number): Promise<void> {
    await queryCache.set(key, value, ttl);
  }

  private async deleteFromMemory(key: string): Promise<void> {
    await queryCache.delete(key);
  }

  private async getFromRedis<T>(key: string): Promise<T | null> {
    const _result = await redisClient.get(key);
    if (!result) return null;

    try {
      const parsed = JSON.parse(result);
      return this.decompressIfNeeded(parsed.data, parsed.compressed);
    } catch (error) {
      logger.error('Redis deserialization error:', error);
      return null;
    }
  }

  private async setInRedis<T>(key: string, value: T, options: CacheOptions): Promise<void> {
    const { data, compressed } = await this.compressIfNeeded(value);
    const cacheEntry = { data, compressed, timestamp: Date.now() };

    await redisClient.set(key, JSON.stringify(cacheEntry), options.ttl || this.config.defaultTTL);
  }

  private async deleteFromRedis(key: string): Promise<void> {
    await redisClient.del(key);
  }

  private async setMultiLayer<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const tasks = [];

    // Set in Redis
    tasks.push(this.setInRedis(key, value, options));

    // Set in memory if multi-layer is enabled
    if (this.config.enableMultiLayerCaching) {
      tasks.push(this.setInMemory(key, value, options.ttl));
    }

    await Promise.all(tasks);
  }

  private async invalidatePattern(_pattern: string): Promise<number> {
    return await redisClient.invalidatePattern(pattern);
  }

  private updateResponseTime(responseTime: number): void {
    this.metrics.avgResponseTime = (this.metrics.avgResponseTime + responseTime) / 2;
  }

  // ============================================================================
  // METRICS AND MONITORING
  // ============================================================================

  getMetrics(): CacheLayerMetrics {
    const hitRate =
      this.metrics.totalRequests > 0
        ? ((this.metrics.l1Hits + this.metrics.l2Hits) / this.metrics.totalRequests) * 100
        : 0;

    return {
      ...this.metrics,
      hitRate,
      memoryHitRate:
        this.metrics.totalRequests > 0
          ? (this.metrics.l1Hits / this.metrics.totalRequests) * 100
          : 0,
      redisHitRate:
        this.metrics.totalRequests > 0
          ? (this.metrics.l2Hits / this.metrics.totalRequests) * 100
          : 0,
    };
  }

  async getHealthStatus(): Promise<CacheHealthStatus> {
    const redisHealthy = await redisClient.ping();
    const metrics = this.getMetrics();

    return {
      status: redisHealthy ? 'healthy' : 'degraded',
      redis: redisHealthy,
      memory: true,
      hitRate: metrics.hitRate,
      avgResponseTime: metrics.avgResponseTime,
      compressionSaved: metrics.compressionSaved,
      prefetchQueue: this.prefetchQueue.size,
      warmupInProgress: this.warmupInProgress,
    };
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  async bulkGet<T>(keys: string[]): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>();

    // Try to get all from Redis in one operation
    const redisResults = await redisClient.mget(keys);

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const value = redisResults[i];

      if (value) {
        try {
          const parsed = JSON.parse(value);
          results.set(key, this.decompressIfNeeded(parsed.data, parsed.compressed));
        } catch (error) {
          logger.error(`Bulk get deserialization error for ${key}:`, error);
          results.set(key, null);
        }
      } else {
        results.set(key, null);
      }
    }

    return results;
  }

  async bulkSet<T>(
    entries: Array<{ key: string; value: T; options?: CacheOptions }>
  ): Promise<void> {
    const redisEntries: Record<string, string> = {};

    for (const entry of entries) {
      const { data, compressed } = await this.compressIfNeeded(entry.value);
      const cacheEntry = { data, compressed, timestamp: Date.now() };
      redisEntries[entry.key] = JSON.stringify(cacheEntry);
    }

    await redisClient.mset(redisEntries);

    // Set TTLs separately (Redis doesn't support MSETEX)
    for (const entry of entries) {
      const ttl = entry.options?.ttl || this.config.defaultTTL;
      await redisClient.expire(entry.key, ttl);
    }
  }
}

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  compress?: boolean;
  priority?: 'low' | 'medium' | 'high';
}

export interface CacheLayerMetrics {
  totalRequests: number;
  l1Hits: number;
  l2Hits: number;
  misses: number;
  prefetchHits: number;
  compressionSaved: number;
  invalidations: number;
  warmupTime: number;
  avgResponseTime: number;
  hitRate?: number;
  memoryHitRate?: number;
  redisHitRate?: number;
}

export interface CacheHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  redis: boolean;
  memory: boolean;
  hitRate: number;
  avgResponseTime: number;
  compressionSaved: number;
  prefetchQueue: number;
  warmupInProgress: boolean;
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const enhancedCache = new EnhancedCacheLayer();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Initialize the enhanced cache layer
 */
export async function initializeEnhancedCache(organizationId?: string): Promise<void> {
  logger.info('🚀 Initializing Enhanced Cache Layer...');

  try {
    // Ensure Redis is connected
    if (!redisClient.isReady()) {
      await redisClient.connect();
    }

    // Warm critical cache entries
    await enhancedCache.warmCache(organizationId);

    logger.info('✅ Enhanced Cache Layer initialized successfully');
  } catch (error) {
    logger.error('Enhanced Cache Layer initialization failed:', error);
    throw error;
  }
}

/**
 * Gracefully shutdown cache layer
 */
export async function shutdownEnhancedCache(): Promise<void> {
  logger.info('🛑 Shutting down Enhanced Cache Layer...');

  try {
    await redisClient.disconnect();
    logger.info('✅ Enhanced Cache Layer shutdown complete');
  } catch (error) {
    logger.error('Enhanced Cache Layer shutdown error:', error);
  }
}

/**
 * Cache warming middleware for Next.js API routes
 */
export function withCacheWarming(organizationId?: string) {
  return async function middleware() {
    if (organizationId) {
      // Warm cache in background
      enhancedCache.warmCache(organizationId).catch((error) => {
        logger.error('Background cache warming failed:', error);
      });
    }
  };
}
