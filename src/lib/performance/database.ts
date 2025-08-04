import { db } from '@/lib/db';
import { cacheService } from './cache';

export class DatabaseOptimizer {
  private queryCache = new Map<string, any>();
  private performanceMetrics = new Map<string, QueryMetrics>();

  // Query optimization with caching
  async optimizedQuery<T>(
    _query: string,
    params: any[] = [],
    options: QueryOptions = {}
  ): Promise<T> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(query, params);

    try {
      // Check cache first
      if (options.useCache !== false) {
        const _cached = await cacheService.getCachedQuery<T>(query, params);
        if (cached !== null) {
          this.recordMetrics(query, Date.now() - startTime, true);
          return cached;
        }
      }

      // Execute query
      const _result = await this.executeQuery<T>(query, params);

      // Cache result if enabled
      if (options.useCache !== false && options.cacheTTL) {
        await cacheService.cacheQuery(query, params, result, options.cacheTTL);
      }

      this.recordMetrics(query, Date.now() - startTime, false);
      return result;
    } catch (error) {
      this.recordMetrics(query, Date.now() - startTime, false, error);
      throw error;
    }
  }

  // Batch operations for efficiency
  async batchInsert<T>(tableName: string, records: T[], batchSize = 1000): Promise<void> {
    const batches = this.chunkArray(records, batchSize);

    for (const batch of batches) {
      await db.client.$transaction(async (tx) => {
        for (const record of batch) {
          await (tx as any)[tableName].create({ data: record });
        }
      });
    }
  }

  async batchUpdate<T>(
    tableName: string,
    updates: Array<{ where: any; data: T }>,
    batchSize = 500
  ): Promise<void> {
    const batches = this.chunkArray(updates, batchSize);

    for (const batch of batches) {
      await db.client.$transaction(async (tx) => {
        for (const { where, data } of batch) {
          await (tx as any)[tableName].update({ where, data });
        }
      });
    }
  }

  // Connection pooling management
  async optimizeConnectionPool(): Promise<void> {
    // Configure connection pool settings
    await db.client.$executeRaw`
      SET SESSION innodb_buffer_pool_size = 2147483648
      SET SESSION max_connections = 200;
      SET SESSION wait_timeout = 28800;
      SET SESSION interactive_timeout = 28800;
    `;
  }

  // Index management
  async analyzeIndexUsage(): Promise<IndexAnalysis[]> {
    const query = `
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch
      FROM pg_stat_user_indexes
      ORDER BY idx_scan DESC
    `;

    return await this.executeQuery<IndexAnalysis[]>(query, []);
  }

  async createOptimalIndexes(tableName: string, columns: string[]): Promise<void> {
    const indexName = `idx_${tableName}_${columns.join('_')}`;
    const columnList = columns.join(', ');

    const query = `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS ${indexName}
      ON ${tableName} (${columnList});
    `;

    await this.executeQuery(query, []);
  }

  async dropUnusedIndexes(threshold = 100): Promise<number> {
    const unusedIndexes = await this.executeQuery<UnusedIndex[]>(
      `
      SELECT 
        schemaname,
        tablename,
        indexname
      FROM pg_stat_user_indexes
      WHERE idx_scan < $1
        AND indexname NOT LIKE '%_pkey'
        AND indexname NOT LIKE '%_unique';
    `,
      [threshold]
    );

    let droppedCount = 0;
    for (const index of unusedIndexes) {
      try {
        await this.executeQuery(`DROP INDEX IF EXISTS ${index.indexname};`, []);
        droppedCount++;
      } catch (error) {
        // console.error(`Failed to drop index ${index.indexname}:`, error)
      }
    }

    return droppedCount;
  }

  // Query plan analysis
  async analyzeQueryPlan(_query: string, params: any[] = []): Promise<QueryPlan> {
    const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`;
    const _result = await this.executeQuery<any[]>(explainQuery, params);

    return {
      plan: result[0],
      executionTime: this.extractExecutionTime(result[0]),
      cost: this.extractCost(result[0]),
      recommendations: this.generateRecommendations(result[0]),
    };
  }

  // Table statistics and maintenance
  async updateTableStatistics(tableName?: string): Promise<void> {
    if (tableName) {
      await this.executeQuery(`ANALYZE ${tableName};`, []);
    } else {
      await this.executeQuery('ANALYZE;', []);
    }
  }

  async vacuumTables(tableName?: string): Promise<void> {
    if (tableName) {
      await this.executeQuery(`VACUUM ANALYZE ${tableName};`, []);
    } else {
      await this.executeQuery('VACUUM ANALYZE;', []);
    }
  }

  // Performance monitoring
  async getSlowQueries(limit = 10): Promise<SlowQuery[]> {
    const query = `
      SELECT 
        query,
        calls,
        total_time,
        mean_time,
        rows
      FROM pg_stat_statements
      ORDER BY mean_time DESC
      LIMIT $1
    `;

    return await this.executeQuery<SlowQuery[]>(query, [limit]);
  }

  async getDatabaseSize(): Promise<DatabaseSize> {
    const sizeQuery = `
      SELECT 
        pg_size_pretty(pg_database_size(current_database())) as database_size,
        pg_size_pretty(pg_total_relation_size('public.users')) as users_table_size,
        pg_size_pretty(pg_total_relation_size('public.risks')) as risks_table_size,
        pg_size_pretty(pg_total_relation_size('public.controls')) as controls_table_size;
    `;

    const _result = await this.executeQuery<any[]>(sizeQuery, []);
    return result[0];
  }

  async getConnectionStats(): Promise<ConnectionStats> {
    const query = `
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections,
        count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
      FROM pg_stat_activity
      WHERE datname = current_database();
    `;

    const _result = await this.executeQuery<ConnectionStats[]>(query, []);
    return result[0];
  }

  // Performance recommendations
  async generatePerformanceReport(): Promise<PerformanceReport> {
    const [slowQueries, indexAnalysis, databaseSize, connectionStats, cacheStats] =
      await Promise.all([
        this.getSlowQueries(5),
        this.analyzeIndexUsage(),
        this.getDatabaseSize(),
        this.getConnectionStats(),
        cacheService.getCacheStats(),
      ]);

    const recommendations = this.generatePerformanceRecommendations({
      slowQueries,
      indexAnalysis,
      connectionStats,
      cacheStats,
    });

    return {
      timestamp: new Date(),
      slowQueries,
      indexAnalysis: indexAnalysis.slice(0, 10),
      databaseSize,
      connectionStats,
      cacheStats,
      recommendations,
      overallScore: this.calculatePerformanceScore({
        slowQueries,
        indexAnalysis,
        connectionStats,
        cacheStats,
      }),
    };
  }

  // Automated optimization
  async runAutoOptimization(): Promise<OptimizationResult> {
    const results: OptimizationResult = {
      timestamp: new Date(),
      optimizations: [],
      errors: [],
    };

    try {
      // Update statistics
      await this.updateTableStatistics();
      results.optimizations.push('Updated table statistics');

      // Vacuum if needed
      const lastVacuum = await this.getLastVacuumTime();
      if (Date.now() - lastVacuum.getTime() > 24 * 60 * 60 * 1000) {
        await this.vacuumTables();
        results.optimizations.push('Performed vacuum');
      }

      // Drop unused indexes
      const droppedIndexes = await this.dropUnusedIndexes();
      if (droppedIndexes > 0) {
        results.optimizations.push(`Dropped ${droppedIndexes} unused indexes`);
      }

      // Optimize connection pool
      await this.optimizeConnectionPool();
      results.optimizations.push('Optimized connection pool');
    } catch (error) {
      results.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return results;
  }

  // Private helper methods
  private async executeQuery<T>(_query: string, params: any[]): Promise<T> {
    // Use Prisma's raw query execution
    return (await db.client.$queryRaw<T>`${query}`) as T;
  }

  private generateCacheKey(_query: string, params: any[]): string {
    const crypto = require('crypto');
    const content = JSON.stringify({ query, params });
    return crypto.createHash('md5').update(content).digest('hex');
  }

  private recordMetrics(_query: string, duration: number, fromCache: boolean, error?: any): void {
    const queryHash = this.generateCacheKey(query, []);
    const existing = this.performanceMetrics.get(queryHash) || {
      query: query.substring(0, 100),
      totalExecutions: 0,
      totalDuration: 0,
      averageDuration: 0,
      cacheHits: 0,
      errors: 0,
    };

    existing.totalExecutions++;
    if (fromCache) {
      existing.cacheHits++;
    } else {
      existing.totalDuration += duration;
    }
    if (error) {
      existing.errors++;
    }
    existing.averageDuration =
      existing.totalDuration / (existing.totalExecutions - existing.cacheHits);

    this.performanceMetrics.set(queryHash, existing);
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private extractExecutionTime(plan: any): number {
    return plan['Execution Time'] || 0;
  }

  private extractCost(plan: any): number {
    return plan['Plan']?.['Total Cost'] || 0;
  }

  private generateRecommendations(plan: any): string[] {
    const recommendations: string[] = [];

    if (plan['Plan']?.['Node Type'] === 'Seq Scan') {
      recommendations.push('Consider adding an index to avoid sequential scan');
    }

    if (plan['Execution Time'] > 1000) {
      recommendations.push('Query execution time is high, consider optimization');
    }

    if (plan['Plan']?.['Total Cost'] > 10000) {
      recommendations.push('Query cost is high, review query structure');
    }

    return recommendations;
  }

  private generatePerformanceRecommendations(_data: any): string[] {
    const recommendations: string[] = [];

    if (data.slowQueries.length > 0) {
      recommendations.push('Review and optimize slow queries');
    }

    if (data.cacheStats.hitRate < 80) {
      recommendations.push('Improve cache hit rate by extending TTL or cache warming');
    }

    if (data.connectionStats.active_connections > 100) {
      recommendations.push('Consider connection pooling optimization');
    }

    return recommendations;
  }

  private calculatePerformanceScore(_data: any): number {
    let score = 100;

    // Deduct for slow queries
    score -= data.slowQueries.length * 5;

    // Deduct for poor cache hit rate
    if (data.cacheStats.hitRate < 80) {
      score -= 80 - data.cacheStats.hitRate;
    }

    // Deduct for high connection usage
    if (data.connectionStats.active_connections > 80) {
      score -= (data.connectionStats.active_connections - 80) * 0.5;
    }

    return Math.max(0, Math.min(100, score));
  }

  private async getLastVacuumTime(): Promise<Date> {
    const query = `
      SELECT last_vacuum, last_autovacuum
      FROM pg_stat_user_tables
      WHERE relname = 'users'
      LIMIT 1;
    `;

    const _result = await this.executeQuery<any[]>(query, []);
    const lastVacuum = result[0]?.last_vacuum || result[0]?.last_autovacuum;

    return lastVacuum ? new Date(lastVacuum) : new Date(0);
  }

  // Health check
  async healthCheck(): Promise<DatabaseHealthCheck> {
    try {
      const start = Date.now();
      await this.executeQuery('SELECT 1 as health_check;', []);
      const latency = Date.now() - start;

      const connectionStats = await this.getConnectionStats();
      const healthy = latency < 1000 && connectionStats.active_connections < 150;

      return {
        healthy,
        latency,
        connectionStats,
        message: healthy ? 'Database is healthy' : 'Database performance issues detected',
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        healthy: false,
        latency: -1,
        connectionStats: {
          total_connections: 0,
          active_connections: 0,
          idle_connections: 0,
          idle_in_transaction: 0,
        },
        message: error instanceof Error ? error.message : 'Database error',
        timestamp: new Date(),
      };
    }
  }
}

// Types
export interface QueryOptions {
  useCache?: boolean;
  cacheTTL?: number;
  timeout?: number;
}

export interface QueryMetrics {
  query: string;
  totalExecutions: number;
  totalDuration: number;
  averageDuration: number;
  cacheHits: number;
  errors: number;
}

export interface IndexAnalysis {
  schemaname: string;
  tablename: string;
  indexname: string;
  idx_scan: number;
  idx_tup_read: number;
  idx_tup_fetch: number;
}

export interface UnusedIndex {
  schemaname: string;
  tablename: string;
  indexname: string;
}

export interface QueryPlan {
  plan: any;
  executionTime: number;
  cost: number;
  recommendations: string[];
}

export interface SlowQuery {
  query: string;
  calls: number;
  total_time: number;
  mean_time: number;
  rows: number;
}

export interface DatabaseSize {
  database_size: string;
  users_table_size: string;
  risks_table_size: string;
  controls_table_size: string;
}

export interface ConnectionStats {
  total_connections: number;
  active_connections: number;
  idle_connections: number;
  idle_in_transaction: number;
}

export interface PerformanceReport {
  timestamp: Date;
  slowQueries: SlowQuery[];
  indexAnalysis: IndexAnalysis[];
  databaseSize: DatabaseSize;
  connectionStats: ConnectionStats;
  cacheStats: any;
  recommendations: string[];
  overallScore: number;
}

export interface OptimizationResult {
  timestamp: Date;
  optimizations: string[];
  errors: string[];
}

export interface DatabaseHealthCheck {
  healthy: boolean;
  latency: number;
  connectionStats: ConnectionStats;
  message: string;
  timestamp: Date;
}

// Global database optimizer instance
export const databaseOptimizer = new DatabaseOptimizer();
