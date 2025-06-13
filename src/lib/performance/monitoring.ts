import { cacheService } from './cache';
import { databaseOptimizer } from './database';
import { compressionService } from './compression';
import { env } from '@/config/env';
import { getCLS, getFID, getFCP, getLCP, getTTFB, Metric } from 'web-vitals';

export class MonitoringService {
  private metrics = new Map<string, Metric[]>();
  private alerts = new Map<string, Alert[]>();
  private healthChecks = new Map<string, HealthCheck>();
  
  constructor() {
    this.initializeHealthChecks();
    this.startMetricsCollection();
  }

  // Metrics Collection
  async recordMetric(name: string, value: number, tags: Record<string, string> = {}): Promise<void> {
    const metric: Metric = {
      name,
      value,
      timestamp: Date.now(),
      tags,
    };

    const existing = this.metrics.get(name) || [];
    existing.push(metric);
    
    // Keep only last 1000 metrics per name
    if (existing.length > 1000) {
      existing.splice(0, existing.length - 1000);
    }
    
    this.metrics.set(name, existing);
    
    // Check for alerts
    await this.checkAlerts(name, value, tags);
  }

  async recordTimer(name: string, startTime: number, tags: Record<string, string> = {}): Promise<void> {
    const duration = Date.now() - startTime;
    await this.recordMetric(`${name}.duration`, duration, tags);
  }

  async recordCounter(name: string, increment = 1, tags: Record<string, string> = {}): Promise<void> {
    const current = await this.getLatestMetric(`${name}.count`) || 0;
    await this.recordMetric(`${name}.count`, current + increment, tags);
  }

  async recordGauge(name: string, value: number, tags: Record<string, string> = {}): Promise<void> {
    await this.recordMetric(`${name}.gauge`, value, tags);
  }

  // Performance Monitoring
  async trackAPIRequest(endpoint: string, method: string, statusCode: number, duration: number): Promise<void> {
    await Promise.all([
      this.recordTimer('api.request', Date.now() - duration, {
        endpoint,
        method,
        status: statusCode.toString(),
      }),
      this.recordCounter('api.requests', 1, {
        endpoint,
        method,
        status: statusCode.toString(),
      }),
    ]);

    // Track error rates
    if (statusCode >= 400) {
      await this.recordCounter('api.errors', 1, {
        endpoint,
        method,
        status: statusCode.toString(),
      });
    }
  }

  async trackDatabaseQuery(query: string, duration: number, success: boolean): Promise<void> {
    const queryType = this.extractQueryType(query);
    
    await Promise.all([
      this.recordTimer('database.query', Date.now() - duration, {
        type: queryType,
        success: success.toString(),
      }),
      this.recordCounter('database.queries', 1, {
        type: queryType,
        success: success.toString(),
      }),
    ]);
  }

  async trackCacheOperation(operation: string, hit: boolean, duration: number): Promise<void> {
    await Promise.all([
      this.recordTimer('cache.operation', Date.now() - duration, {
        operation,
        hit: hit.toString(),
      }),
      this.recordCounter('cache.operations', 1, {
        operation,
        hit: hit.toString(),
      }),
    ]);
  }

  // Error Tracking
  async trackError(error: Error, context: ErrorContext): Promise<void> {
    const errorMetric: ErrorMetric = {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      context,
      fingerprint: this.generateErrorFingerprint(error),
    };

    await this.recordMetric('errors.count', 1, {
      type: error.constructor.name,
      endpoint: context.endpoint || 'unknown',
      userId: context.userId || 'anonymous',
    });

    // Store detailed error information
    const errorKey = `error:${errorMetric.fingerprint}`;
    await cacheService.set(errorKey, errorMetric, 86400); // 24 hours

    // Check if this is a critical error
    if (this.isCriticalError(error, context)) {
      await this.sendAlert({
        type: 'error',
        severity: 'critical',
        title: `Critical Error: ${error.message}`,
        description: `Error occurred in ${context.endpoint}: ${error.message}`,
        timestamp: Date.now(),
        metadata: { errorMetric },
      });
    }
  }

  // Health Checks
  private initializeHealthChecks(): void {
    this.healthChecks.set('database', {
      name: 'database',
      check: async () => await databaseOptimizer.healthCheck(),
      interval: 30000, // 30 seconds
      timeout: 5000,
      lastRun: 0,
    });

    this.healthChecks.set('cache', {
      name: 'cache',
      check: async () => await cacheService.healthCheck(),
      interval: 30000,
      timeout: 5000,
      lastRun: 0,
    });

    this.healthChecks.set('compression', {
      name: 'compression',
      check: async () => await compressionService.healthCheck(),
      interval: 60000, // 1 minute
      timeout: 5000,
      lastRun: 0,
    });

    this.healthChecks.set('memory', {
      name: 'memory',
      check: async () => await this.checkMemoryHealth(),
      interval: 30000,
      timeout: 1000,
      lastRun: 0,
    });

    this.healthChecks.set('disk', {
      name: 'disk',
      check: async () => await this.checkDiskHealth(),
      interval: 60000,
      timeout: 5000,
      lastRun: 0,
    });
  }

  async runHealthChecks(): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];
    const now = Date.now();

    for (const [name, healthCheck] of this.healthChecks) {
      if (now - healthCheck.lastRun >= healthCheck.interval) {
        try {
          const result = await Promise.race([
            healthCheck.check(),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Health check timeout')), healthCheck.timeout)
            ),
          ]);

          results.push({
            name,
            healthy: result.healthy,
            message: result.message,
            latency: result.latency || 0,
            timestamp: new Date(),
          });

          // Record health check metrics
          await this.recordMetric('health_check.status', result.healthy ? 1 : 0, { service: name });
          await this.recordMetric('health_check.latency', result.latency || 0, { service: name });

        } catch (error) {
          results.push({
            name,
            healthy: false,
            message: error instanceof Error ? error.message : 'Health check failed',
            latency: -1,
            timestamp: new Date(),
          });

          await this.recordMetric('health_check.status', 0, { service: name });
        }

        healthCheck.lastRun = now;
      }
    }

    return results;
  }

  // System Health Checks
  private async checkMemoryHealth(): Promise<any> {
    const memUsage = process.memoryUsage();
    const memUsedMB = memUsage.heapUsed / 1024 / 1024;
    const memTotalMB = memUsage.heapTotal / 1024 / 1024;
    const memUsagePercent = (memUsedMB / memTotalMB) * 100;

    await this.recordGauge('memory.usage_mb', memUsedMB);
    await this.recordGauge('memory.usage_percent', memUsagePercent);

    return {
      healthy: memUsagePercent < 85,
      message: `Memory usage: ${memUsedMB.toFixed(1)}MB (${memUsagePercent.toFixed(1)}%)`,
      latency: 0,
      data: memUsage,
    };
  }

  private async checkDiskHealth(): Promise<any> {
    try {
      const fs = await import('fs/promises');
      const stats = await fs.stat('.');
      
      return {
        healthy: true,
        message: 'Disk accessible',
        latency: 0,
        data: stats,
      };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : 'Disk check failed',
        latency: -1,
      };
    }
  }

  // Alert Management
  async createAlert(alert: AlertConfig): Promise<string> {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const existing = this.alerts.get(alert.metric) || [];
    existing.push({
      id: alertId,
      ...alert,
      createdAt: Date.now(),
      triggered: false,
      lastTriggered: 0,
    });
    
    this.alerts.set(alert.metric, existing);
    return alertId;
  }

  async removeAlert(alertId: string): Promise<boolean> {
    for (const [metric, alerts] of this.alerts) {
      const index = alerts.findIndex(a => a.id === alertId);
      if (index !== -1) {
        alerts.splice(index, 1);
        this.alerts.set(metric, alerts);
        return true;
      }
    }
    return false;
  }

  private async checkAlerts(metricName: string, value: number, tags: Record<string, string>): Promise<void> {
    const alerts = this.alerts.get(metricName) || [];
    const now = Date.now();

    for (const alert of alerts) {
      if (this.shouldTriggerAlert(alert, value, now)) {
        await this.triggerAlert(alert, value, tags);
      }
    }
  }

  private shouldTriggerAlert(alert: Alert, value: number, now: number): boolean {
    // Check cooldown period
    if (now - alert.lastTriggered < (alert.cooldown || 300000)) { // 5 minutes default
      return false;
    }

    // Check threshold
    switch (alert.condition) {
      case 'greater_than':
        return value > alert.threshold;
      case 'less_than':
        return value < alert.threshold;
      case 'equals':
        return value === alert.threshold;
      default:
        return false;
    }
  }

  private async triggerAlert(alert: Alert, value: number, tags: Record<string, string>): Promise<void> {
    alert.triggered = true;
    alert.lastTriggered = Date.now();

    const alertNotification: AlertNotification = {
      type: 'metric_alert',
      severity: alert.severity,
      title: alert.title,
      description: `${alert.description} (Current value: ${value})`,
      timestamp: Date.now(),
      metadata: {
        metric: alert.metric,
        value,
        threshold: alert.threshold,
        condition: alert.condition,
        tags,
      },
    };

    await this.sendAlert(alertNotification);
  }

  private async sendAlert(alert: AlertNotification): Promise<void> {
    try {
      // Log alert
      console.warn('ALERT:', alert);

      // In production, integrate with alerting services like:
      // - PagerDuty
      // - Slack
      // - Email
      // - Discord
      // - Custom webhooks

      // Record alert metric
      await this.recordCounter('alerts.sent', 1, {
        type: alert.type,
        severity: alert.severity,
      });

    } catch (error) {
      console.error('Failed to send alert:', error);
    }
  }

  // Performance Reports
  async generatePerformanceReport(timeRange: TimeRange): Promise<PerformanceReport> {
    const endTime = timeRange.end || Date.now();
    const startTime = timeRange.start || endTime - 3600000; // 1 hour default

    const [
      apiMetrics,
      databaseMetrics,
      cacheMetrics,
      errorMetrics,
      healthResults,
    ] = await Promise.all([
      this.getAPIMetrics(startTime, endTime),
      this.getDatabaseMetrics(startTime, endTime),
      this.getCacheMetrics(startTime, endTime),
      this.getErrorMetrics(startTime, endTime),
      this.runHealthChecks(),
    ]);

    return {
      timeRange: { start: startTime, end: endTime },
      api: apiMetrics,
      database: databaseMetrics,
      cache: cacheMetrics,
      errors: errorMetrics,
      health: healthResults,
      overallScore: this.calculateOverallScore({
        apiMetrics,
        databaseMetrics,
        cacheMetrics,
        errorMetrics,
        healthResults,
      }),
      generatedAt: Date.now(),
    };
  }

  // Metrics Aggregation
  private async getAPIMetrics(startTime: number, endTime: number): Promise<APIMetrics> {
    const requestMetrics = this.getMetricsInRange('api.requests.count', startTime, endTime);
    const errorMetrics = this.getMetricsInRange('api.errors.count', startTime, endTime);
    const durationMetrics = this.getMetricsInRange('api.request.duration', startTime, endTime);

    const totalRequests = requestMetrics.reduce((sum, m) => sum + m.value, 0);
    const totalErrors = errorMetrics.reduce((sum, m) => sum + m.value, 0);
    const avgDuration = durationMetrics.length > 0 
      ? durationMetrics.reduce((sum, m) => sum + m.value, 0) / durationMetrics.length 
      : 0;

    return {
      totalRequests,
      totalErrors,
      errorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
      averageResponseTime: avgDuration,
      p95ResponseTime: this.calculatePercentile(durationMetrics.map(m => m.value), 95),
      p99ResponseTime: this.calculatePercentile(durationMetrics.map(m => m.value), 99),
      requestCount: totalRequests,
      slowRequests: durationMetrics.filter(m => m.value > 2000).length,
      endpointMetrics: {},
    };
  }

  private async getDatabaseMetrics(startTime: number, endTime: number): Promise<DatabaseMetrics> {
    const queryMetrics = this.getMetricsInRange('database.queries.count', startTime, endTime);
    const durationMetrics = this.getMetricsInRange('database.query.duration', startTime, endTime);

    const totalQueries = queryMetrics.reduce((sum, m) => sum + m.value, 0);
    const avgDuration = durationMetrics.length > 0 
      ? durationMetrics.reduce((sum, m) => sum + m.value, 0) / durationMetrics.length 
      : 0;

    return {
      totalQueries,
      averageQueryTime: avgDuration,
      slowQueries: durationMetrics.filter(m => m.value > 1000).length, // > 1 second
      queryCount: totalQueries,
      connectionPoolSize: 10,
      activeConnections: 5,
    };
  }

  private async getCacheMetrics(startTime: number, endTime: number): Promise<CacheMetrics> {
    const hitMetrics = this.getMetricsInRange('cache.operations.count', startTime, endTime)
      .filter(m => m.tags.hit === 'true');
    const missMetrics = this.getMetricsInRange('cache.operations.count', startTime, endTime)
      .filter(m => m.tags.hit === 'false');

    const hits = hitMetrics.reduce((sum, m) => sum + m.value, 0);
    const misses = missMetrics.reduce((sum, m) => sum + m.value, 0);
    const total = hits + misses;

    return {
      hits,
      misses,
      hitRate: total > 0 ? (hits / total) * 100 : 0,
    };
  }

  private async getErrorMetrics(startTime: number, endTime: number): Promise<ErrorMetrics> {
    const errorMetrics = this.getMetricsInRange('errors.count', startTime, endTime);
    const totalErrors = errorMetrics.reduce((sum, m) => sum + m.value, 0);

    // Group by error type
    const errorsByType: Record<string, number> = {};
    errorMetrics.forEach(m => {
      const type = m.tags.type || 'unknown';
      errorsByType[type] = (errorsByType[type] || 0) + m.value;
    });

    return {
      totalErrors,
      errorsByType,
    };
  }

  // Utility Methods
  private getMetricsInRange(name: string, startTime: number, endTime: number): Metric[] {
    const metrics = this.metrics.get(name) || [];
    return metrics.filter(m => m.timestamp >= startTime && m.timestamp <= endTime);
  }

  private async getLatestMetric(name: string): Promise<number | null> {
    const metrics = this.metrics.get(name);
    if (!metrics || metrics.length === 0) return null;
    
    return metrics[metrics.length - 1].value;
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * (percentile / 100)) - 1;
    return sorted[Math.max(0, index)];
  }

  private extractQueryType(query: string): string {
    const trimmed = query.trim().toLowerCase();
    if (trimmed.startsWith('select')) return 'select';
    if (trimmed.startsWith('insert')) return 'insert';
    if (trimmed.startsWith('update')) return 'update';
    if (trimmed.startsWith('delete')) return 'delete';
    return 'other';
  }

  private generateErrorFingerprint(error: Error): string {
    const crypto = require('crypto');
    const content = `${error.constructor.name}:${error.message}`;
    return crypto.createHash('md5').update(content).digest('hex');
  }

  private isCriticalError(error: Error, context: ErrorContext): boolean {
    // Database errors
    if (error.message.includes('database') || error.message.includes('connection')) {
      return true;
    }
    
    // Authentication errors
    if (context.endpoint?.includes('/auth/')) {
      return true;
    }
    
    // Payment errors
    if (context.endpoint?.includes('/billing/') || context.endpoint?.includes('/payment/')) {
      return true;
    }
    
    return false;
  }

  private calculateOverallScore(data: any): number {
    let score = 100;
    
    // API performance
    if (data.apiMetrics.errorRate > 5) score -= 20;
    if (data.apiMetrics.averageResponseTime > 2000) score -= 15;
    
    // Database performance
    if (data.databaseMetrics.averageQueryTime > 500) score -= 10;
    if (data.databaseMetrics.slowQueries > 10) score -= 15;
    
    // Cache performance
    if (data.cacheMetrics.hitRate < 80) score -= 10;
    
    // Health checks
    const unhealthyServices = data.healthResults.filter((h: any) => !h.healthy).length;
    score -= unhealthyServices * 15;
    
    return Math.max(0, Math.min(100, score));
  }

  private startMetricsCollection(): void {
    // Collect system metrics every 30 seconds
    setInterval(async () => {
      await this.runHealthChecks();
    }, 30000);

    // Clean up old metrics every hour
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 3600000);
  }

  private cleanupOldMetrics(): void {
    const cutoff = Date.now() - 86400000; // 24 hours
    
    for (const [name, metrics] of this.metrics) {
      const filtered = metrics.filter(m => m.timestamp > cutoff);
      this.metrics.set(name, filtered);
    }
  }

  // Public API
  async getMetrics(name?: string): Promise<Metric[]> {
    if (name) {
      return this.metrics.get(name) || [];
    }
    
    const allMetrics: Metric[] = [];
    for (const metrics of this.metrics.values()) {
      allMetrics.push(...metrics);
    }
    
    return allMetrics.sort((a, b) => a.timestamp - b.timestamp);
  }

  async getAlerts(): Promise<Alert[]> {
    const allAlerts: Alert[] = [];
    for (const alerts of this.alerts.values()) {
      allAlerts.push(...alerts);
    }
    
    return allAlerts;
  }
}

// Types
export interface Metric {
  name: string;
  value: number;
  timestamp: number;
  tags: Record<string, string>;
}

export interface ErrorContext {
  endpoint?: string;
  userId?: string;
  userAgent?: string;
  ip?: string;
  method?: string;
  body?: any;
}

export interface ErrorMetric {
  message: string;
  stack?: string;
  timestamp: number;
  context: ErrorContext;
  fingerprint: string;
}

export interface HealthCheck {
  name: string;
  check: () => Promise<any>;
  interval: number;
  timeout: number;
  lastRun: number;
}

export interface HealthCheckResult {
  name: string;
  healthy: boolean;
  message: string;
  latency: number;
  timestamp: Date;
}

export interface AlertConfig {
  metric: string;
  condition: 'greater_than' | 'less_than' | 'equals';
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  cooldown?: number;
}

export interface Alert extends AlertConfig {
  id: string;
  createdAt: number;
  triggered: boolean;
  lastTriggered: number;
}

export interface AlertNotification {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: number;
  metadata: Record<string, any>;
}

export interface TimeRange {
  start?: number;
  end?: number;
}

export interface APIMetrics {
  totalRequests: number;
  totalErrors: number;
  errorRate: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestCount: number;
  slowRequests: number;
  endpointMetrics: Record<string, {
    count: number;
    averageTime: number;
    errorCount: number;
  }>;
}

export interface DatabaseMetrics {
  totalQueries: number;
  averageQueryTime: number;
  slowQueries: number;
  queryCount: number;
  connectionPoolSize: number;
  activeConnections: number;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByType: Record<string, number>;
}

export interface PerformanceReport {
  timeRange: TimeRange;
  api: APIMetrics;
  database: DatabaseMetrics;
  cache: CacheMetrics;
  errors: ErrorMetrics;
  health: HealthCheckResult[];
  overallScore: number;
  generatedAt: number;
}

// Global monitoring service instance
export const monitoringService = new MonitoringService();

// Performance Monitoring Service for Riscura RCSA Platform
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface SystemMetrics {
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  cpuUsage?: number;
  uptime: number;
  nodeVersion: string;
  environment: string;
}

export interface UserMetrics {
  activeUsers: number;
  totalSessions: number;
  averageSessionDuration: number;
  bounceRate: number;
  pageViews: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private apiMetrics: Map<string, { times: number[]; errors: number }> = new Map();
  private dbMetrics: { queries: number; totalTime: number; slowQueries: number } = {
    queries: 0,
    totalTime: 0,
    slowQueries: 0,
  };
  private isEnabled: boolean;
  private metricsBuffer: PerformanceMetric[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.isEnabled = env.NODE_ENV === 'production' || env.DEBUG_MODE;
    this.startMetricsCollection();
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    if (!this.isEnabled) return;

    this.metrics.push(metric);
    this.metricsBuffer.push(metric);

    // Keep only last 1000 metrics in memory
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  /**
   * Track API request performance
   */
  trackAPIRequest(endpoint: string, duration: number, success: boolean): void {
    if (!this.isEnabled) return;

    const key = this.normalizeEndpoint(endpoint);
    
    if (!this.apiMetrics.has(key)) {
      this.apiMetrics.set(key, { times: [], errors: 0 });
    }

    const metrics = this.apiMetrics.get(key)!;
    metrics.times.push(duration);
    
    if (!success) {
      metrics.errors++;
    }

    // Keep only last 100 measurements per endpoint
    if (metrics.times.length > 100) {
      metrics.times = metrics.times.slice(-100);
    }

    this.recordMetric({
      name: 'api_request_duration',
      value: duration,
      unit: 'ms',
      timestamp: new Date(),
      tags: {
        endpoint: key,
        success: success.toString(),
      },
    });
  }

  /**
   * Track database query performance
   */
  trackDatabaseQuery(query: string, duration: number, success: boolean): void {
    if (!this.isEnabled) return;

    this.dbMetrics.queries++;
    this.dbMetrics.totalTime += duration;

    if (duration > 1000) { // Slow query threshold: 1 second
      this.dbMetrics.slowQueries++;
    }

    this.recordMetric({
      name: 'db_query_duration',
      value: duration,
      unit: 'ms',
      timestamp: new Date(),
      tags: {
        success: success.toString(),
        slow: (duration > 1000).toString(),
      },
      metadata: {
        query: query.substring(0, 100), // First 100 chars for privacy
      },
    });
  }

  /**
   * Track memory usage
   */
  trackMemoryUsage(): void {
    if (!this.isEnabled) return;

    const memoryUsage = process.memoryUsage();
    
    this.recordMetric({
      name: 'memory_heap_used',
      value: memoryUsage.heapUsed,
      unit: 'bytes',
      timestamp: new Date(),
    });

    this.recordMetric({
      name: 'memory_heap_total',
      value: memoryUsage.heapTotal,
      unit: 'bytes',
      timestamp: new Date(),
    });

    this.recordMetric({
      name: 'memory_rss',
      value: memoryUsage.rss,
      unit: 'bytes',
      timestamp: new Date(),
    });
  }

  /**
   * Track user activity
   */
  trackUserActivity(userId: string, action: string, duration?: number): void {
    if (!this.isEnabled) return;

    this.recordMetric({
      name: 'user_activity',
      value: duration || 1,
      unit: duration ? 'ms' : 'count',
      timestamp: new Date(),
      tags: {
        userId,
        action,
      },
    });
  }

  /**
   * Get API metrics summary
   */
  getAPIMetrics(): APIMetrics {
    const endpointMetrics: Record<string, any> = {};
    let totalRequests = 0;
    let totalTime = 0;
    let totalErrors = 0;

    for (const [endpoint, data] of this.apiMetrics.entries()) {
      const count = data.times.length;
      const averageTime = count > 0 ? data.times.reduce((a, b) => a + b, 0) / count : 0;
      
      endpointMetrics[endpoint] = {
        count,
        averageTime: Math.round(averageTime),
        errorCount: data.errors,
      };

      totalRequests += count;
      totalTime += data.times.reduce((a, b) => a + b, 0);
      totalErrors += data.errors;
    }

    const values = Array.from(this.apiMetrics.values()).flatMap(d => d.times);

    return {
      requestCount: totalRequests,
      averageResponseTime: totalRequests > 0 ? Math.round(totalTime / totalRequests) : 0,
      errorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
      slowRequests: this.countSlowRequests(),
      endpointMetrics,
      totalRequests,
      totalErrors,
      p95ResponseTime: this.calculatePercentile(values, 95),
      p99ResponseTime: this.calculatePercentile(values, 99),
    };
  }

  /**
   * Get database metrics summary
   */
  getDatabaseMetrics(): DatabaseMetrics {
    return {
      queryCount: this.dbMetrics.queries,
      averageQueryTime: this.dbMetrics.queries > 0 
        ? Math.round(this.dbMetrics.totalTime / this.dbMetrics.queries) 
        : 0,
      slowQueries: this.dbMetrics.slowQueries,
      connectionPoolSize: 10, // This would come from your DB pool configuration
      activeConnections: 5, // This would come from your DB pool status
      totalQueries: this.dbMetrics.queries,
    };
  }

  /**
   * Get system metrics
   */
  getSystemMetrics(): SystemMetrics {
    const memoryUsage = process.memoryUsage();
    
    return {
      memoryUsage: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
      },
      uptime: Math.round(process.uptime()),
      nodeVersion: process.version,
      environment: env.NODE_ENV,
    };
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    api: APIMetrics;
    database: DatabaseMetrics;
    system: SystemMetrics;
    timestamp: Date;
  } {
    return {
      api: this.getAPIMetrics(),
      database: this.getDatabaseMetrics(),
      system: this.getSystemMetrics(),
      timestamp: new Date(),
    };
  }

  /**
   * Get metrics for a specific time range
   */
  getMetricsInRange(startTime: Date, endTime: Date): PerformanceMetric[] {
    return this.metrics.filter(
      metric => metric.timestamp >= startTime && metric.timestamp <= endTime
    );
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.metricsBuffer = [];
    this.apiMetrics.clear();
    this.dbMetrics = { queries: 0, totalTime: 0, slowQueries: 0 };
  }

  /**
   * Start automatic metrics collection
   */
  private startMetricsCollection(): void {
    if (!this.isEnabled) return;

    // Collect memory metrics every 30 seconds
    setInterval(() => {
      this.trackMemoryUsage();
    }, 30000);

    // Flush metrics buffer every 60 seconds
    this.flushInterval = setInterval(() => {
      this.flushMetrics();
    }, 60000);
  }

  /**
   * Flush metrics to external service (if configured)
   */
  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    try {
      // In production, you would send these to a monitoring service
      // like DataDog, New Relic, or CloudWatch
      if (env.NODE_ENV === 'development') {
        console.log(`Flushing ${this.metricsBuffer.length} metrics`);
      }

      // Clear the buffer after successful flush
      this.metricsBuffer = [];
    } catch (error) {
      console.error('Failed to flush metrics:', error);
    }
  }

  /**
   * Normalize API endpoint for consistent tracking
   */
  private normalizeEndpoint(endpoint: string): string {
    // Remove query parameters and normalize dynamic segments
    return endpoint
      .split('?')[0]
      .replace(/\/\d+/g, '/:id')
      .replace(/\/[a-f0-9-]{36}/g, '/:uuid');
  }

  /**
   * Count slow API requests
   */
  private countSlowRequests(): number {
    let slowCount = 0;
    for (const data of this.apiMetrics.values()) {
      slowCount += data.times.filter(time => time > 2000).length; // 2 second threshold
    }
    return slowCount;
  }

  /**
   * Calculate percentile for an array of values
   */
  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * (percentile / 100)) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.clearMetrics();
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Middleware helper for Express/Next.js
export function createPerformanceMiddleware() {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const success = res.statusCode < 400;
      
      performanceMonitor.trackAPIRequest(
        req.url || req.path,
        duration,
        success
      );
    });
    
    next();
  };
}

// Database query wrapper
export function wrapDatabaseQuery<T>(
  queryFn: () => Promise<T>,
  queryName: string
): Promise<T> {
  const startTime = Date.now();
  
  return queryFn()
    .then(result => {
      const duration = Date.now() - startTime;
      performanceMonitor.trackDatabaseQuery(queryName, duration, true);
      return result;
    })
    .catch(error => {
      const duration = Date.now() - startTime;
      performanceMonitor.trackDatabaseQuery(queryName, duration, false);
      throw error;
    });
}

// ============================================================================
// WEB VITALS MONITORING
// ============================================================================

interface PerformanceMetrics {
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
}

let metrics: PerformanceMetrics = {};

function sendToAnalytics(metric: Metric) {
  // Store metrics
  metrics[metric.name as keyof PerformanceMetrics] = metric.value;
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`📊 Web Vital: ${metric.name}`, {
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
    });
  }

  // Send to analytics service (implement based on your analytics provider)
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_label: metric.id,
      non_interaction: true,
    });
  }
}

export function initWebVitals() {
  if (typeof window !== 'undefined') {
    getCLS(sendToAnalytics);
    getFID(sendToAnalytics);
    getFCP(sendToAnalytics);
    getLCP(sendToAnalytics);
    getTTFB(sendToAnalytics);
  }
}

export function getWebVitals(): PerformanceMetrics {
  return { ...metrics };
}

// ============================================================================
// PERFORMANCE OBSERVER
// ============================================================================

export class PerformanceObserver {
  private observers: PerformanceObserver[] = [];

  init() {
    if (typeof window === 'undefined') return;

    // Long Tasks Observer
    this.observeLongTasks();
    
    // Navigation Timing
    this.observeNavigation();
    
    // Resource Timing
    this.observeResources();
  }

  private observeLongTasks() {
    if ('PerformanceObserver' in window) {
      const observer = new window.PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Tasks longer than 50ms
            console.warn('🐌 Long task detected:', {
              duration: entry.duration,
              startTime: entry.startTime,
            });
          }
        }
      });

      try {
        observer.observe({ entryTypes: ['longtask'] });
        this.observers.push(observer);
      } catch (e) {
        console.warn('Long task observer not supported');
      }
    }
  }

  private observeNavigation() {
    if (typeof window !== 'undefined' && 'performance' in window) {
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        const metrics = {
          dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
          tcpConnect: navigation.connectEnd - navigation.connectStart,
          tlsNegotiation: navigation.secureConnectionStart > 0 
            ? navigation.connectEnd - navigation.secureConnectionStart 
            : 0,
          serverResponse: navigation.responseStart - navigation.requestStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
          windowLoad: navigation.loadEventEnd - navigation.navigationStart,
        };

        console.log('📈 Navigation metrics:', metrics);
      });
    }
  }

  private observeResources() {
    if ('PerformanceObserver' in window) {
      const observer = new window.PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resource = entry as PerformanceResourceTiming;
          
          // Log slow resources
          if (resource.duration > 1000) { // Resources taking more than 1s
            console.warn('🐌 Slow resource:', {
              name: resource.name,
              duration: resource.duration,
              size: resource.transferSize,
            });
          }
        }
      });

      try {
        observer.observe({ entryTypes: ['resource'] });
        this.observers.push(observer);
      } catch (e) {
        console.warn('Resource observer not supported');
      }
    }
  }

  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// ============================================================================
// API PERFORMANCE MONITORING
// ============================================================================

export class APIPerformanceMonitor {
  private metrics = new Map<string, Array<{ duration: number; timestamp: number }>>();

  trackRequest(endpoint: string, duration: number) {
    const now = Date.now();
    
    if (!this.metrics.has(endpoint)) {
      this.metrics.set(endpoint, []);
    }
    
    const endpointMetrics = this.metrics.get(endpoint)!;
    endpointMetrics.push({ duration, timestamp: now });
    
    // Keep only last 100 measurements per endpoint
    if (endpointMetrics.length > 100) {
      endpointMetrics.shift();
    }
    
    // Log slow API calls
    if (duration > 1000) {
      console.warn(`🐌 Slow API call: ${endpoint} took ${duration}ms`);
    }
  }

  getMetrics(endpoint?: string) {
    if (endpoint) {
      const endpointMetrics = this.metrics.get(endpoint) || [];
      return this.calculateStats(endpointMetrics);
    }
    
    const allMetrics: { [key: string]: any } = {};
    for (const [ep, metrics] of this.metrics.entries()) {
      allMetrics[ep] = this.calculateStats(metrics);
    }
    return allMetrics;
  }

  private calculateStats(metrics: Array<{ duration: number; timestamp: number }>) {
    if (metrics.length === 0) return null;
    
    const durations = metrics.map(m => m.duration);
    durations.sort((a, b) => a - b);
    
    return {
      count: durations.length,
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: durations[0],
      max: durations[durations.length - 1],
      p50: durations[Math.floor(durations.length * 0.5)],
      p95: durations[Math.floor(durations.length * 0.95)],
      p99: durations[Math.floor(durations.length * 0.99)],
    };
  }
}

export const apiMonitor = new APIPerformanceMonitor();

// ============================================================================
// PERFORMANCE MIDDLEWARE
// ============================================================================

export function withPerformanceTracking<T extends (...args: any[]) => any>(
  fn: T,
  label: string
): T {
  return ((...args: any[]) => {
    const start = performance.now();
    
    try {
      const result = fn(...args);
      
      // Handle async functions
      if (result instanceof Promise) {
        return result.finally(() => {
          const duration = performance.now() - start;
          console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
        });
      }
      
      const duration = performance.now() - start;
      console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`❌ ${label} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  }) as T;
}

// ============================================================================
// INITIALIZATION
// ============================================================================

let performanceObserver: PerformanceObserver;

export function initPerformanceMonitoring() {
  if (typeof window !== 'undefined') {
    initWebVitals();
    
    performanceObserver = new PerformanceObserver();
    performanceObserver.init();
    
    console.log('📊 Performance monitoring initialized');
  }
}

export function cleanupPerformanceMonitoring() {
  if (performanceObserver) {
    performanceObserver.cleanup();
  }
} 