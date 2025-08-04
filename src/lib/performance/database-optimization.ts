import { db } from '@/lib/db';

// ============================================================================
// DATABASE PERFORMANCE OPTIMIZATION
// ============================================================================

interface QueryCacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
}

class DatabaseOptimizer {
  private queryCache = new Map<string, { data: any; expires: number; tags: string[] }>();
  private maxCacheSize = 1000;

  // Query caching
  async cachedQuery<T>(
    queryKey: string,
    queryFn: () => Promise<T>,
    options: QueryCacheOptions = {}
  ): Promise<T> {
    const { ttl = 300, tags = [] } = options; // Default 5 minutes

    // Check cache first
    const _cached = this.queryCache.get(queryKey)
    if (cached && Date.now() < cached.expires) {
      return cached.data;
    }

    // Execute query
    const startTime = performance.now()
    const data = await queryFn();
    const _duration = performance.now() - startTime;

    // Log slow queries
    if (duration > 100) {
      // console.warn(`🐌 Slow database query: ${queryKey} took ${duration.toFixed(2)}ms`)
    }

    // Cache result
    if (this.queryCache.size >= this.maxCacheSize) {
      this.clearExpiredCache()
    }

    this.queryCache.set(queryKey, {
      data,
      expires: Date.now() + ttl * 1000,
      tags,
    });

    return data;
  }

  // Cache invalidation by tags
  invalidateByTags(tags: string[]): void {
    for (const [key, entry] of this.queryCache.entries()) {
      if (entry.tags.some((tag) => tags.includes(tag))) {
        this.queryCache.delete(key)
      }
    }
  }

  // Clear expired cache entries
  private clearExpiredCache(): void {
    const now = Date.now()
    for (const [key, entry] of this.queryCache.entries()) {
      if (now >= entry.expires) {
        this.queryCache.delete(key);
      }
    }
  }

  // Optimized pagination
  async paginatedQuery<T>(
    baseQuery: any,
    page: number,
    pageSize: number,
    orderBy?: any
  ): Promise<{ data: T[]; total: number; hasMore: boolean }> {
    const skip = (page - 1) * pageSize;

    // Execute count and data queries in parallel
    const [data, total] = await Promise.all([
      baseQuery
        .skip(skip)
        .take(pageSize)
        .orderBy(orderBy || { createdAt: 'desc' }),
      baseQuery.count(),
    ])

    return {
      data,
      total,
      hasMore: skip + pageSize < total,
    }
  }

  // Batch operations
  async batchCreate<T>(_model: any, data: any[], batchSize = 100): Promise<T[]> {
    const results: T[] = []

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const batchResults = await model.createMany({
        data: batch,
        skipDuplicates: true,
      });
      results.push(batchResults);
    }

    return results;
  }

  // Connection health check
  async healthCheck(): Promise<{
    connected: boolean
    latency: number;
    activeConnections?: number;
  }> {
    const start = performance.now();

    try {
      await db.client.$queryRaw`SELECT 1`;
      const latency = performance.now() - start;

      return {
        connected: true,
        latency,
      }
    } catch (error) {
      return {
        connected: false,
        latency: performance.now() - start,
      }
    }
  }
}

export const dbOptimizer = new DatabaseOptimizer();

// ============================================================================
// OPTIMIZED QUERY HELPERS
// ============================================================================

// Common query patterns with optimization
export const optimizedQueries = {
  // Get user with organization (cached)
  getUserWithOrg: async (_userId: string) => {
    return dbOptimizer.cachedQuery(
      `user_with_org:${userId}`,
      () =>
        db.client.user.findUnique({
          where: { id: userId },
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                plan: true,
                isActive: true,
              },
            },
          },
        }),
      { ttl: 1800, tags: ['user', 'organization'] } // 30 minutes
    )
  },

  // Get organization risks with pagination
  getOrganizationRisks: async (_organizationId: string,
    page: number,
    pageSize: number,
    filters?: any
  ) => {
    const baseQuery = db.client.risk.findMany({
      where: {
        organizationId,
        ...filters,
      },
      include: {
        category: true,
        controls: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    })

    return dbOptimizer.paginatedQuery(baseQuery, page, pageSize, {
      severity: 'desc',
      createdAt: 'desc',
    });
  },

  // Get dashboard statistics (heavily cached)
  getDashboardStats: async (_organizationId: string) => {
    return dbOptimizer.cachedQuery(
      `dashboard_stats:${organizationId}`,
      async () => {
        const [totalRisks, highRisks, totalControls, activeControls, recentActivities] =
          await Promise.all([
            db.client.risk.count({ where: { organizationId } }),
            db.client.risk.count({
              where: { organizationId, severity: { in: ['HIGH', 'CRITICAL'] } },
            }),
            db.client.control.count({ where: { organizationId } }),
            db.client.control.count({
              where: { organizationId, status: 'ACTIVE' },
            }),
            db.client.activity.findMany({
              where: { organizationId },
              take: 10,
              orderBy: { createdAt: 'desc' },
              include: {
                user: {
                  select: { firstName: true, lastName: true },
                },
              },
            }),
          ])

        return {
          risks: { total: totalRisks, high: highRisks },
          controls: { total: totalControls, active: activeControls },
          recentActivities,
        }
      },
      { ttl: 300, tags: ['dashboard', 'risks', 'controls'] } // 5 minutes
    );
  },
}

// ============================================================================
// DATABASE INDEXES (SQL to run)
// ============================================================================

export const requiredIndexes = [
  // User and organization indexes
  'CREATE INDEX IF NOT EXISTS idx_users_organization_email ON "User"("organizationId", "email");',
  'CREATE INDEX IF NOT EXISTS idx_users_active ON "User"("isActive", "createdAt");',

  // Risk indexes
  'CREATE INDEX IF NOT EXISTS idx_risks_organization_created ON "Risk"("organizationId", "createdAt");',
  'CREATE INDEX IF NOT EXISTS idx_risks_organization_severity ON "Risk"("organizationId", "severity");',
  'CREATE INDEX IF NOT EXISTS idx_risks_status ON "Risk"("status", "updatedAt");',

  // Control indexes
  'CREATE INDEX IF NOT EXISTS idx_controls_organization_status ON "Control"("organizationId", "status");',
  'CREATE INDEX IF NOT EXISTS idx_controls_type ON "Control"("type", "createdAt");',

  // Document indexes
  'CREATE INDEX IF NOT EXISTS idx_documents_organization_type ON "Document"("organizationId", "type");',
  'CREATE INDEX IF NOT EXISTS idx_documents_status ON "Document"("status", "uploadedAt");',

  // Activity indexes
  'CREATE INDEX IF NOT EXISTS idx_activities_user_created ON "Activity"("userId", "createdAt");',
  'CREATE INDEX IF NOT EXISTS idx_activities_organization_type ON "Activity"("organizationId", "type");',

  // Session indexes
  'CREATE INDEX IF NOT EXISTS idx_sessions_user_expires ON "Session"("userId", "expiresAt");',
  'CREATE INDEX IF NOT EXISTS idx_sessions_active ON "Session"("expiresAt") WHERE "expiresAt" > NOW();',
];

// Function to create indexes
export async function createOptimizationIndexes(): Promise<void> {
  // console.log('🏗️ Creating database optimization indexes...')

  for (const indexSql of requiredIndexes) {
    try {
      await db.client.$executeRawUnsafe(indexSql);
      // console.log(`✅ Created index: ${indexSql.split(' ')[5]}`)
    } catch (error) {
      // console.warn(`⚠️ Index creation failed: ${error}`)
    }
  }

  // console.log('✅ Database optimization indexes created')
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

export class DatabasePerformanceMonitor {
  private queryTimes = new Map<string, number[]>()

  trackQuery(operation: string, duration: number): void {
    if (!this.queryTimes.has(operation)) {
      this.queryTimes.set(operation, []);
    }

    const times = this.queryTimes.get(operation)!;
    times.push(duration);

    // Keep only last 100 measurements
    if (times.length > 100) {
      times.shift()
    }
  }

  getStats(operation?: string) {
    if (operation) {
      const times = this.queryTimes.get(operation) || [];
      return this.calculateStats(times);
    }

    const stats: { [key: string]: any } = {}
    for (const [op, times] of this.queryTimes.entries()) {
      stats[op] = this.calculateStats(times);
    }
    return stats;
  }

  private calculateStats(times: number[]) {
    if (times.length === 0) return null;

    const sorted = [...times].sort((a, b) => a - b);
    return {
      count: times.length,
      avg: times.reduce((a, b) => a + b, 0) / times.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
    }
  }
}

export const dbMonitor = new DatabasePerformanceMonitor();
