import { cacheService } from './cache';
import { databaseOptimizer } from './database';
import { compressionService } from './compression';

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
}

export interface DatabaseMetrics {
  totalQueries: number;
  averageQueryTime: number;
  slowQueries: number;
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