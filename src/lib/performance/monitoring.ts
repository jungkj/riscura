import { cacheService } from './cache';
import { databaseOptimizer } from './database';
import { compressionService } from './compression';
import { env } from '@/config/env';
import { getCLS, getFID, getFCP, getLCP, getTTFB, Metric, onINP } from 'web-vitals';

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

// Performance Monitoring System
export interface PerformanceMetric {
  name: string;
  value: number;
  delta: number;
  id: string;
  timestamp: number;
  url: string;
  userAgent: string;
  connectionType?: string;
  deviceType?: string;
  userId?: string;
  sessionId?: string;
}

export interface PerformanceReport {
  metrics: PerformanceMetric[];
  summary: {
    lcp: number;
    fid: number;
    cls: number;
    fcp: number;
    ttfb: number;
    inp?: number;
  };
  timestamp: number;
  url: string;
  loadTime: number;
  renderTime: number;
  domInteractive: number;
  domComplete: number;
  resourceTiming: PerformanceResourceTiming[];
}

export interface ResourcePerformance {
  name: string;
  type: string;
  duration: number;
  size: number;
  transferSize: number;
  cached: boolean;
  timing: {
    dns: number;
    tcp: number;
    ssl: number;
    request: number;
    response: number;
  };
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private sessionId: string;
  private userId?: string;
  private reportingEndpoint: string;
  private batchSize: number = 10;
  private reportingInterval: number = 30000; // 30 seconds
  private isEnabled: boolean = true;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.reportingEndpoint = process.env.NEXT_PUBLIC_PERFORMANCE_ENDPOINT || '/api/performance';
    this.setupWebVitals();
    this.setupResourceTiming();
    this.setupNavigationTiming();
    this.setupLongTaskObserver();
    this.setupLayoutShiftObserver();
    this.startReporting();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public setUserId(userId: string): void {
    this.userId = userId;
  }

  public enable(): void {
    this.isEnabled = true;
  }

  public disable(): void {
    this.isEnabled = false;
  }

  private setupWebVitals(): void {
    if (typeof window === 'undefined') return;

    // Largest Contentful Paint
    getLCP((metric) => {
      this.recordMetric({
        name: 'LCP',
        value: metric.value,
        delta: metric.delta,
        id: metric.id,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        connectionType: this.getConnectionType(),
        deviceType: this.getDeviceType(),
        userId: this.userId,
        sessionId: this.sessionId,
      });
    });

    // First Input Delay
    getFID((metric) => {
      this.recordMetric({
        name: 'FID',
        value: metric.value,
        delta: metric.delta,
        id: metric.id,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        connectionType: this.getConnectionType(),
        deviceType: this.getDeviceType(),
        userId: this.userId,
        sessionId: this.sessionId,
      });
    });

    // Cumulative Layout Shift
    getCLS((metric) => {
      this.recordMetric({
        name: 'CLS',
        value: metric.value,
        delta: metric.delta,
        id: metric.id,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        connectionType: this.getConnectionType(),
        deviceType: this.getDeviceType(),
        userId: this.userId,
        sessionId: this.sessionId,
      });
    });

    // First Contentful Paint
    getFCP((metric) => {
      this.recordMetric({
        name: 'FCP',
        value: metric.value,
        delta: metric.delta,
        id: metric.id,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        connectionType: this.getConnectionType(),
        deviceType: this.getDeviceType(),
        userId: this.userId,
        sessionId: this.sessionId,
      });
    });

    // Time to First Byte
    getTTFB((metric) => {
      this.recordMetric({
        name: 'TTFB',
        value: metric.value,
        delta: metric.delta,
        id: metric.id,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        connectionType: this.getConnectionType(),
        deviceType: this.getDeviceType(),
        userId: this.userId,
        sessionId: this.sessionId,
      });
    });

    // Interaction to Next Paint (INP)
    onINP((metric) => {
      this.recordMetric({
        name: 'INP',
        value: metric.value,
        delta: metric.delta,
        id: metric.id,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        connectionType: this.getConnectionType(),
        deviceType: this.getDeviceType(),
        userId: this.userId,
        sessionId: this.sessionId,
      });
    });
  }

  private setupResourceTiming(): void {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'resource') {
          this.recordResourceTiming(entry as PerformanceResourceTiming);
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
    this.observers.push(observer);
  }

  private setupNavigationTiming(): void {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'navigation') {
          this.recordNavigationTiming(entry as PerformanceNavigationTiming);
        }
      });
    });

    observer.observe({ entryTypes: ['navigation'] });
    this.observers.push(observer);
  }

  private setupLongTaskObserver(): void {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.recordMetric({
            name: 'LONG_TASK',
            value: entry.duration,
            delta: entry.duration,
            id: `long-task-${Date.now()}`,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            connectionType: this.getConnectionType(),
            deviceType: this.getDeviceType(),
            userId: this.userId,
            sessionId: this.sessionId,
          });
        });
      });

      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Long task observer not supported:', error);
    }
  }

  private setupLayoutShiftObserver(): void {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if ((entry as any).hadRecentInput) return; // Ignore shifts with recent input
          
          this.recordMetric({
            name: 'LAYOUT_SHIFT',
            value: (entry as any).value,
            delta: (entry as any).value,
            id: `layout-shift-${Date.now()}`,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            connectionType: this.getConnectionType(),
            deviceType: this.getDeviceType(),
            userId: this.userId,
            sessionId: this.sessionId,
          });
        });
      });

      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Layout shift observer not supported:', error);
    }
  }

  private recordMetric(metric: PerformanceMetric): void {
    if (!this.isEnabled) return;

    this.metrics.push(metric);
    
    // Emit custom event for real-time monitoring
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('performance-metric', {
        detail: metric
      }));
    }
  }

  private recordResourceTiming(entry: PerformanceResourceTiming): void {
    const resource: ResourcePerformance = {
      name: entry.name,
      type: this.getResourceType(entry.name),
      duration: entry.duration,
      size: entry.decodedBodySize || 0,
      transferSize: entry.transferSize || 0,
      cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
      timing: {
        dns: entry.domainLookupEnd - entry.domainLookupStart,
        tcp: entry.connectEnd - entry.connectStart,
        ssl: entry.secureConnectionStart > 0 ? entry.connectEnd - entry.secureConnectionStart : 0,
        request: entry.responseStart - entry.requestStart,
        response: entry.responseEnd - entry.responseStart,
      },
    };

    this.recordMetric({
      name: 'RESOURCE_TIMING',
      value: resource.duration,
      delta: resource.duration,
      id: `resource-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connectionType: this.getConnectionType(),
      deviceType: this.getDeviceType(),
      userId: this.userId,
      sessionId: this.sessionId,
    });
  }

  private recordNavigationTiming(entry: PerformanceNavigationTiming): void {
    const navigation = {
      loadTime: entry.loadEventEnd - entry.navigationStart,
      renderTime: entry.domContentLoadedEventEnd - entry.navigationStart,
      domInteractive: entry.domInteractive - entry.navigationStart,
      domComplete: entry.domComplete - entry.navigationStart,
      redirectTime: entry.redirectEnd - entry.redirectStart,
      dnsTime: entry.domainLookupEnd - entry.domainLookupStart,
      tcpTime: entry.connectEnd - entry.connectStart,
      requestTime: entry.responseStart - entry.requestStart,
      responseTime: entry.responseEnd - entry.responseStart,
    };

    Object.entries(navigation).forEach(([name, value]) => {
      if (value > 0) {
        this.recordMetric({
          name: `NAVIGATION_${name.toUpperCase()}`,
          value,
          delta: value,
          id: `navigation-${name}-${Date.now()}`,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          connectionType: this.getConnectionType(),
          deviceType: this.getDeviceType(),
          userId: this.userId,
          sessionId: this.sessionId,
        });
      }
    });
  }

  private getResourceType(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    
    if (['js', 'mjs'].includes(extension || '')) return 'script';
    if (['css'].includes(extension || '')) return 'stylesheet';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(extension || '')) return 'image';
    if (['woff', 'woff2', 'ttf', 'otf'].includes(extension || '')) return 'font';
    if (url.includes('/api/')) return 'api';
    
    return 'other';
  }

  private getConnectionType(): string {
    if (typeof navigator === 'undefined') return 'unknown';
    
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;
    
    return connection ? connection.effectiveType || connection.type : 'unknown';
  }

  private getDeviceType(): string {
    if (typeof navigator === 'undefined') return 'unknown';
    
    const userAgent = navigator.userAgent;
    
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) return 'mobile';
    
    return 'desktop';
  }

  // Manual performance measurement
  public mark(name: string): void {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(name);
    }
  }

  public measure(name: string, startMark: string, endMark?: string): number | null {
    if (typeof performance === 'undefined' || !performance.measure) return null;

    try {
      if (endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.measure(name, startMark);
      }

      const entries = performance.getEntriesByName(name, 'measure');
      const entry = entries[entries.length - 1];
      
      if (entry) {
        this.recordMetric({
          name: `CUSTOM_${name.toUpperCase()}`,
          value: entry.duration,
          delta: entry.duration,
          id: `custom-${name}-${Date.now()}`,
          timestamp: Date.now(),
          url: typeof window !== 'undefined' ? window.location.href : '',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          connectionType: this.getConnectionType(),
          deviceType: this.getDeviceType(),
          userId: this.userId,
          sessionId: this.sessionId,
        });

        return entry.duration;
      }
    } catch (error) {
      console.warn('Performance measurement failed:', error);
    }

    return null;
  }

  // Time a function execution
  public async timeFunction<T>(
    name: string,
    fn: () => Promise<T> | T
  ): Promise<T> {
    const startTime = Date.now();
    const startMark = `${name}-start`;
    const endMark = `${name}-end`;

    this.mark(startMark);

    try {
      const result = await fn();
      this.mark(endMark);
      this.measure(name, startMark, endMark);
      return result;
    } catch (error) {
      this.mark(endMark);
      this.measure(name, startMark, endMark);
      throw error;
    }
  }

  private startReporting(): void {
    if (typeof window === 'undefined') return;

    setInterval(() => {
      this.sendMetrics();
    }, this.reportingInterval);

    // Send metrics before page unload
    window.addEventListener('beforeunload', () => {
      this.sendMetrics(true);
    });

    // Send metrics on visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.sendMetrics(true);
      }
    });
  }

  private async sendMetrics(immediate: boolean = false): Promise<void> {
    if (!this.isEnabled || this.metrics.length === 0) return;

    const metricsToSend = immediate 
      ? [...this.metrics] 
      : this.metrics.splice(0, this.batchSize);

    if (metricsToSend.length === 0) return;

    try {
      const payload = {
        metrics: metricsToSend,
        sessionId: this.sessionId,
        userId: this.userId,
        timestamp: Date.now(),
        url: window.location.href,
      };

      if (immediate && navigator.sendBeacon) {
        // Use sendBeacon for reliable delivery during page unload
        navigator.sendBeacon(
          this.reportingEndpoint,
          JSON.stringify(payload)
        );
      } else {
        // Use fetch for regular reporting
        await fetch(this.reportingEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }

      // Remove sent metrics from the array
      if (!immediate) {
        this.metrics = this.metrics.slice(metricsToSend.length);
      }
    } catch (error) {
      console.warn('Failed to send performance metrics:', error);
      // Put metrics back if sending failed (unless it's immediate)
      if (!immediate) {
        this.metrics.unshift(...metricsToSend);
      }
    }
  }

  // Generate performance report
  public generateReport(): PerformanceReport {
    const webVitalsMetrics = this.metrics.filter(m => 
      ['LCP', 'FID', 'CLS', 'FCP', 'TTFB', 'INP'].includes(m.name)
    );

    const summary = {
      lcp: webVitalsMetrics.find(m => m.name === 'LCP')?.value || 0,
      fid: webVitalsMetrics.find(m => m.name === 'FID')?.value || 0,
      cls: webVitalsMetrics.find(m => m.name === 'CLS')?.value || 0,
      fcp: webVitalsMetrics.find(m => m.name === 'FCP')?.value || 0,
      ttfb: webVitalsMetrics.find(m => m.name === 'TTFB')?.value || 0,
      inp: webVitalsMetrics.find(m => m.name === 'INP')?.value,
    };

    const navigationMetrics = this.metrics.filter(m => 
      m.name.startsWith('NAVIGATION_')
    );

    return {
      metrics: [...this.metrics],
      summary,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      loadTime: navigationMetrics.find(m => m.name === 'NAVIGATION_LOADTIME')?.value || 0,
      renderTime: navigationMetrics.find(m => m.name === 'NAVIGATION_RENDERTIME')?.value || 0,
      domInteractive: navigationMetrics.find(m => m.name === 'NAVIGATION_DOMINTERACTIVE')?.value || 0,
      domComplete: navigationMetrics.find(m => m.name === 'NAVIGATION_DOMCOMPLETE')?.value || 0,
      resourceTiming: typeof performance !== 'undefined' 
        ? performance.getEntriesByType('resource') as PerformanceResourceTiming[]
        : [],
    };
  }

  // Get current metrics
  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  // Clear metrics
  public clearMetrics(): void {
    this.metrics = [];
  }

  // Cleanup
  public destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.clearMetrics();
    this.isEnabled = false;
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Export class for testing
export { PerformanceMonitor };

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