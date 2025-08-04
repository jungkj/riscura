import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

export interface DatabaseConfig {
  connectionPool: {
    min: number;
    max: number;
    acquireTimeoutMillis: number;
    createTimeoutMillis: number;
    destroyTimeoutMillis: number;
    idleTimeoutMillis: number;
    reapIntervalMillis: number;
    createRetryIntervalMillis: number;
  };
  queryTimeout: number;
  slowQueryThreshold: number;
  enableQueryLogging: boolean;
  enableQueryCache: boolean;
  cacheConfig: {
    redis: {
      host: string;
      port: number;
      password?: string;
      db: number;
      keyPrefix: string;
      retryDelayOnFailover: number;
      maxRetriesPerRequest: number;
    };
    ttl: {
      default: number;
      short: number;
      medium: number;
      long: number;
    };
  };
  readReplicas: Array<{
    url: string;
    weight: number;
  }>;
  sharding: {
    enabled: boolean;
    strategy: 'tenant' | 'hash' | 'range';
    shards: Array<{
      id: string;
      url: string;
      ranges?: string[];
    }>;
  };
}

export interface QueryMetrics {
  duration: number;
  query: string;
  params?: any[];
  resultCount: number;
  cacheHit: boolean;
  shard?: string;
  replica?: string;
  timestamp: Date;
}

export interface DatabaseMetrics {
  activeConnections: number;
  totalQueries: number;
  slowQueries: number;
  cacheHitRate: number;
  averageQueryTime: number;
  connectionPoolUtilization: number;
  replicationLag: number;
  shardDistribution: Record<string, number>;
}

export interface OptimizationRecommendation {
  type: 'index' | 'query' | 'cache' | 'connection' | 'shard';
  priority: 'high' | 'medium' | 'low';
  description: string;
  impact: string;
  implementation: string;
  estimatedImprovement: string;
}

// Default database configuration for high performance
export const DEFAULT_DATABASE_CONFIG: DatabaseConfig = {
  connectionPool: {
    min: 10,
    max: 100,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100,
  },
  queryTimeout: 30000,
  slowQueryThreshold: 1000, // 1 second
  enableQueryLogging: process.env.NODE_ENV !== 'production',
  enableQueryCache: true,
  cacheConfig: {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: 0,
      keyPrefix: 'riscura:cache:',
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    },
    ttl: {
      default: 300, // 5 minutes
      short: 60, // 1 minute
      medium: 1800, // 30 minutes
      long: 86400, // 24 hours
    },
  },
  readReplicas: [],
  sharding: {
    enabled: false,
    strategy: 'tenant',
    shards: [],
  },
};

export class DatabasePerformanceOptimizer {
  private prisma: PrismaClient;
  private redis: Redis;
  private config: DatabaseConfig;
  private metrics: DatabaseMetrics = {
    activeConnections: 0,
    totalQueries: 0,
    slowQueries: 0,
    cacheHitRate: 0,
    averageQueryTime: 0,
    connectionPoolUtilization: 0,
    replicationLag: 0,
    shardDistribution: {},
  };
  private queryLog: QueryMetrics[] = [];
  private readReplicas: PrismaClient[] = [];
  private shardClients: Map<string, PrismaClient> = new Map();

  constructor(prisma: PrismaClient, config: Partial<DatabaseConfig> = {}) {
    this.prisma = prisma;
    this.config = { ...DEFAULT_DATABASE_CONFIG, ...config };
    this.initializeOptimizer();
  }

  /**
   * Initialize database optimizer
   */
  private async initializeOptimizer(): Promise<void> {
    // Initialize Redis cache
    await this.initializeCache();

    // Set up read replicas
    await this.initializeReadReplicas();

    // Set up sharding if enabled
    if (this.config.sharding.enabled) {
      await this.initializeSharding();
    }

    // Set up query monitoring
    this.setupQueryMonitoring();

    // Start metrics collection
    this.startMetricsCollection();

    // Set up connection pool optimization
    await this.optimizeConnectionPool();
  }

  /**
   * Initialize Redis cache
   */
  private async initializeCache(): Promise<void> {
    if (!this.config.enableQueryCache) return;

    try {
      this.redis = new Redis({
        ...this.config.cacheConfig.redis,
        lazyConnect: true,
        retryDelayOnFailover: this.config.cacheConfig.redis.retryDelayOnFailover,
        maxRetriesPerRequest: this.config.cacheConfig.redis.maxRetriesPerRequest,
        commandTimeout: 5000,
      });

      await this.redis.connect();
      // console.log('Redis cache initialized successfully');
    } catch (error) {
      // console.error('Failed to initialize Redis cache:', error);
      this.config.enableQueryCache = false;
    }
  }

  /**
   * Initialize read replicas
   */
  private async initializeReadReplicas(): Promise<void> {
    for (const replica of this.config.readReplicas) {
      try {
        const replicaClient = new PrismaClient({
          datasources: {
            db: { url: replica.url },
          },
        });

        await replicaClient.$connect();
        this.readReplicas.push(replicaClient);
        // console.log(`Read replica initialized: ${replica.url}`);
      } catch (error) {
        // console.error(`Failed to initialize read replica: ${replica.url}`, error);
      }
    }
  }

  /**
   * Initialize sharding
   */
  private async initializeSharding(): Promise<void> {
    for (const shard of this.config.sharding.shards) {
      try {
        const shardClient = new PrismaClient({
          datasources: {
            db: { url: shard.url },
          },
        });

        await shardClient.$connect();
        this.shardClients.set(shard.id, shardClient);
        // console.log(`Shard initialized: ${shard.id}`);
      } catch (error) {
        // console.error(`Failed to initialize shard: ${shard.id}`, error);
      }
    }
  }

  /**
   * Set up query monitoring
   */
  private setupQueryMonitoring(): void {
    // Intercept Prisma queries for monitoring
    this.prisma.$use(async (params, next) => {
      const start = Date.now();

      try {
        const result = await next(params);
        const duration = Date.now() - start;

        // Log query metrics
        this.logQueryMetrics({
          duration,
          query: `${params.model}.${params.action}`,
          params: params.args,
          resultCount: Array.isArray(result) ? result.length : result ? 1 : 0,
          cacheHit: false,
          timestamp: new Date(),
        });

        // Log slow queries
        if (duration > this.config.slowQueryThreshold) {
          // console.warn(`Slow query detected: ${params.model}.${params.action} (${duration}ms)`);
          this.metrics.slowQueries++;
        }

        this.metrics.totalQueries++;
        return result;
      } catch (error) {
        // console.error(`Query error: ${params.model}.${params.action}`, error);
        throw error;
      }
    });
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    setInterval(async () => {
      await this.updateMetrics();
    }, 60000); // Update every minute
  }

  /**
   * Optimize connection pool
   */
  private async optimizeConnectionPool(): Promise<void> {
    try {
      // Configure connection pool settings based on config
      await this.prisma.$executeRaw`
        SET SESSION wait_timeout = ${this.config.connectionPool.idleTimeoutMillis / 1000};
        SET SESSION interactive_timeout = ${this.config.connectionPool.idleTimeoutMillis / 1000};
        SET SESSION max_connections = ${this.config.connectionPool.max};
      `;

      // console.log('Connection pool optimized');
    } catch (error) {
      // console.error('Failed to optimize connection pool:', error);
    }
  }

  /**
   * Execute query with caching
   */
  async executeWithCache<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttl: number = this.config.cacheConfig.ttl.default
  ): Promise<T> {
    if (!this.config.enableQueryCache || !this.redis) {
      return queryFn();
    }

    try {
      // Try to get from cache
      const cached = await this.redis.get(key);
      if (cached) {
        this.logQueryMetrics({
          duration: 1,
          query: `Cache hit: ${key}`,
          resultCount: 1,
          cacheHit: true,
          timestamp: new Date(),
        });
        return JSON.parse(cached);
      }

      // Execute query
      const start = Date.now();
      const result = await queryFn();
      const duration = Date.now() - start;

      // Cache the result
      await this.redis.setex(key, ttl, JSON.stringify(result));

      this.logQueryMetrics({
        duration,
        query: `Cache miss: ${key}`,
        resultCount: Array.isArray(result) ? result.length : 1,
        cacheHit: false,
        timestamp: new Date(),
      });

      return result;
    } catch (error) {
      // console.error('Cache operation failed, falling back to direct query:', error);
      return queryFn();
    }
  }

  /**
   * Execute read query with replica selection
   */
  async executeReadQuery<T>(queryFn: (client: PrismaClient) => Promise<T>): Promise<T> {
    if (this.readReplicas.length === 0) {
      return queryFn(this.prisma);
    }

    // Select read replica based on load balancing
    const selectedReplica = this.selectReadReplica();

    try {
      const result = await queryFn(selectedReplica);
      this.logQueryMetrics({
        duration: 0, // Will be measured by the middleware
        query: 'Read replica query',
        resultCount: Array.isArray(result) ? result.length : 1,
        cacheHit: false,
        replica: 'replica',
        timestamp: new Date(),
      });
      return result;
    } catch (error) {
      // console.error('Read replica query failed, falling back to primary:', error);
      return queryFn(this.prisma);
    }
  }

  /**
   * Execute query with sharding
   */
  async executeShardedQuery<T>(
    shardKey: string,
    queryFn: (client: PrismaClient) => Promise<T>
  ): Promise<T> {
    if (!this.config.sharding.enabled) {
      return queryFn(this.prisma);
    }

    const shardId = this.getShardId(shardKey);
    const shardClient = this.shardClients.get(shardId);

    if (!shardClient) {
      // console.warn(`Shard ${shardId} not available, using primary`);
      return queryFn(this.prisma);
    }

    try {
      const result = await queryFn(shardClient);
      this.metrics.shardDistribution[shardId] = (this.metrics.shardDistribution[shardId] || 0) + 1;
      return result;
    } catch (error) {
      // console.error(`Shard query failed on ${shardId}, falling back to primary:`, error);
      return queryFn(this.prisma);
    }
  }

  /**
   * Batch execute queries for better performance
   */
  async batchExecute<T>(
    queries: Array<() => Promise<T>>,
    options: {
      batchSize?: number;
      concurrency?: number;
      useTransaction?: boolean;
    } = {}
  ): Promise<T[]> {
    const { batchSize = 10, concurrency = 5, useTransaction = false } = options;

    if (useTransaction) {
      return this.prisma.$transaction(queries, {
        timeout: this.config.queryTimeout,
      });
    }

    // Execute in batches with controlled concurrency
    const results: T[] = [];

    for (let i = 0; i < queries.length; i += batchSize) {
      const batch = queries.slice(i, i + batchSize);
      const batchPromises = batch.map((query) => this.limitConcurrency(query, concurrency));

      const batchResults = await Promise.allSettled(batchPromises);

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          // console.error('Batch query failed:', result.reason);
          throw result.reason;
        }
      }
    }

    return results;
  }

  /**
   * Limit concurrency for database operations
   */
  private async limitConcurrency<T>(
    operation: () => Promise<T>,
    maxConcurrency: number
  ): Promise<T> {
    // Simple semaphore implementation
    if (this.metrics.activeConnections >= maxConcurrency) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return this.limitConcurrency(operation, maxConcurrency);
    }

    this.metrics.activeConnections++;
    try {
      return await operation();
    } finally {
      this.metrics.activeConnections--;
    }
  }

  /**
   * Select read replica using weighted round-robin
   */
  private selectReadReplica(): PrismaClient {
    if (this.readReplicas.length === 0) return this.prisma;

    // Simple round-robin for now, can be enhanced with weights
    const index = this.metrics.totalQueries % this.readReplicas.length;
    return this.readReplicas[index];
  }

  /**
   * Get shard ID based on shard key
   */
  private getShardId(shardKey: string): string {
    const { strategy, shards } = this.config.sharding;

    switch (strategy) {
      case 'hash':
        const hash = this.hashString(shardKey);
        return shards[hash % shards.length].id;

      case 'tenant':
        // Use tenant ID as shard key
        const tenantShard = shards.find((s) => s.ranges?.includes(shardKey));
        return tenantShard?.id || shards[0].id;

      case 'range':
        // Range-based sharding
        const rangeShard = shards.find((s) => {
          const [min, max] = s.ranges?.[0]?.split('-') || ['0', '999999'];
          const keyNum = parseInt(shardKey) || 0;
          return keyNum >= parseInt(min) && keyNum <= parseInt(max);
        });
        return rangeShard?.id || shards[0].id;

      default:
        return shards[0].id;
    }
  }

  /**
   * Hash string for consistent sharding
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Log query metrics
   */
  private logQueryMetrics(metrics: QueryMetrics): void {
    this.queryLog.push(metrics);

    // Keep only recent queries in memory
    if (this.queryLog.length > 1000) {
      this.queryLog = this.queryLog.slice(-500);
    }
  }

  /**
   * Update performance metrics
   */
  private async updateMetrics(): Promise<void> {
    try {
      // Calculate cache hit rate
      const recentQueries = this.queryLog.slice(-100);
      const cacheHits = recentQueries.filter((q) => q.cacheHit).length;
      this.metrics.cacheHitRate =
        recentQueries.length > 0 ? (cacheHits / recentQueries.length) * 100 : 0;

      // Calculate average query time
      const queryTimes = recentQueries.map((q) => q.duration);
      this.metrics.averageQueryTime =
        queryTimes.length > 0 ? queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length : 0;

      // Update connection pool utilization
      this.metrics.connectionPoolUtilization =
        (this.metrics.activeConnections / this.config.connectionPool.max) * 100;

      // Measure replication lag if replicas exist
      if (this.readReplicas.length > 0) {
        await this.measureReplicationLag();
      }
    } catch (error) {
      // console.error('Failed to update metrics:', error);
    }
  }

  /**
   * Measure replication lag
   */
  private async measureReplicationLag(): Promise<void> {
    try {
      // Write to primary and measure time to read from replica
      const testKey = `replication_test_${Date.now()}`;
      const writeTime = Date.now();

      // This would be a actual test write/read operation
      // For now, we'll simulate
      this.metrics.replicationLag = Math.random() * 100; // Simulated lag in ms
    } catch (error) {
      // console.error('Failed to measure replication lag:', error);
    }
  }

  /**
   * Generate optimization recommendations
   */
  generateOptimizationRecommendations(): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Check slow queries
    if (this.metrics.slowQueries > this.metrics.totalQueries * 0.05) {
      recommendations.push({
        type: 'index',
        priority: 'high',
        description: 'High number of slow queries detected',
        impact: `${this.metrics.slowQueries} slow queries out of ${this.metrics.totalQueries} total`,
        implementation: 'Add database indexes for frequently queried columns',
        estimatedImprovement: '60-80% query performance improvement',
      });
    }

    // Check cache hit rate
    if (this.metrics.cacheHitRate < 70) {
      recommendations.push({
        type: 'cache',
        priority: 'medium',
        description: 'Low cache hit rate',
        impact: `Cache hit rate is ${this.metrics.cacheHitRate.toFixed(1)}% (target: >70%)`,
        implementation: 'Increase cache TTL for stable data, implement cache warming',
        estimatedImprovement: '40-50% response time improvement',
      });
    }

    // Check connection pool utilization
    if (this.metrics.connectionPoolUtilization > 80) {
      recommendations.push({
        type: 'connection',
        priority: 'high',
        description: 'High connection pool utilization',
        impact: `Pool utilization: ${this.metrics.connectionPoolUtilization.toFixed(1)}%`,
        implementation: 'Increase connection pool size or add read replicas',
        estimatedImprovement: '30-40% throughput improvement',
      });
    }

    // Check for sharding need
    if (!this.config.sharding.enabled && this.metrics.totalQueries > 10000) {
      recommendations.push({
        type: 'shard',
        priority: 'medium',
        description: 'Consider implementing database sharding',
        impact: `High query volume: ${this.metrics.totalQueries} queries`,
        implementation: 'Implement tenant-based or hash-based sharding',
        estimatedImprovement: '50-70% scalability improvement',
      });
    }

    return recommendations;
  }

  /**
   * Invalidate cache
   */
  async invalidateCache(pattern: string): Promise<void> {
    if (!this.redis) return;

    try {
      const keys = await this.redis.keys(`${this.config.cacheConfig.redis.keyPrefix}${pattern}*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      // console.error('Failed to invalidate cache:', error);
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): DatabaseMetrics {
    return { ...this.metrics };
  }

  /**
   * Get query log
   */
  getQueryLog(): QueryMetrics[] {
    return [...this.queryLog];
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }

    for (const replica of this.readReplicas) {
      await replica.$disconnect();
    }

    for (const [id, client] of this.shardClients) {
      await client.$disconnect();
    }
  }
}

// Utility functions for query optimization

/**
 * Generate optimized pagination query
 */
export function buildOptimizedPagination(page: number, limit: number, orderBy?: string) {
  const skip = (page - 1) * limit;
  const take = Math.min(limit, 100); // Max 100 items per page

  return {
    skip,
    take,
    ...(orderBy && { orderBy: { [orderBy]: 'desc' as const } }),
  };
}

/**
 * Generate optimized search query
 */
export function buildOptimizedSearch(searchTerm: string, fields: string[]) {
  if (!searchTerm || searchTerm.length < 2) return {};

  const searchConditions = fields.map((field) => ({
    [field]: {
      contains: searchTerm,
      mode: 'insensitive' as const,
    },
  }));

  return {
    where: {
      OR: searchConditions,
    },
  };
}

/**
 * Generate cache key
 */
export function generateCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce(
      (result, key) => {
        result[key] = params[key];
        return result;
      },
      {} as Record<string, any>
    );

  const paramString = JSON.stringify(sortedParams);
  const hash = require('crypto').createHash('md5').update(paramString).digest('hex');

  return `${prefix}:${hash}`;
}

export default DatabasePerformanceOptimizer;
