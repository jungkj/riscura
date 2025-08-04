import { DatabasePerformanceOptimizer } from '../database/performance-optimizer';
import { MemoryManager } from './memory-manager';
import { FileUploadOptimizer, LargeDatasetProcessor } from './file-upload-optimizer';
import { CoreWebVitalsOptimizer } from './core-web-vitals-optimizer';
import { BackgroundTaskOptimizer } from './background-task-optimizer';
import { WebSocketOptimizer } from './websocket-optimizer';
import { db } from '@/lib/db';

export interface MasterPerformanceConfig {
  enableDatabaseOptimization: boolean;
  enableMemoryManagement: boolean;
  enableFileUploadOptimization: boolean;
  enableCoreWebVitals: boolean;
  enableBackgroundTasks: boolean;
  enableWebSocketOptimization: boolean;
  enableRealTimeMonitoring: boolean;
  enableAutoOptimization: boolean;
  reportingEndpoint?: string;
  alertThresholds: {
    memoryUsage: number; // percentage
    connectionPoolUtilization: number; // percentage
    webVitalsLCP: number; // milliseconds
    webVitalsFID: number; // milliseconds
    webVitalsCLS: number; // score
    taskQueueLength: number; // number of tasks
    webSocketConnections: number; // number of connections
  }
}

export interface SystemPerformanceMetrics {
  database: {
    connectionPoolUtilization: number;
    averageQueryTime: number;
    cacheHitRate: number;
    activeConnections: number;
    slowQueries: number;
  }
  memory: {
    usedJSHeapSize: number;
    memoryUsagePercent: number;
    resourceCount: {
      eventListeners: number;
      intervals: number;
      timeouts: number;
      webSockets: number;
      fileHandles: number;
    }
  }
  webVitals: {
    lcp: number;
    fid: number;
    cls: number;
    fcp: number;
    ttfb: number;
  }
  tasks: {
    totalTasks: number;
    queueLength: number;
    workerUtilization: number;
    throughput: number;
  }
  webSockets: {
    activeConnections: number;
    averageLatency: number;
    errorRate: number;
    bandwidthUsage: number;
  }
  fileUploads: {
    activeUploads: number;
    averageUploadSpeed: number;
    failureRate: number;
  }
  system: {
    overallScore: number;
    alertsActive: number;
    optimizationsApplied: number;
    lastOptimization: Date;
  }
}

export interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'critical';
  category: 'database' | 'memory' | 'webvitals' | 'tasks' | 'websockets' | 'uploads' | 'system';
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
  resolved: boolean;
  resolutionAction?: string;
}

export interface OptimizationAction {
  id: string;
  type: 'automatic' | 'manual';
  category: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  timestamp: Date;
  result: 'success' | 'failed' | 'partial';
  metrics: {
    before: number;
    after: number;
    improvement: number;
  }
}

// Default configuration optimized for enterprise scale
export const DEFAULT_MASTER_CONFIG: MasterPerformanceConfig = {
  enableDatabaseOptimization: true,
  enableMemoryManagement: true,
  enableFileUploadOptimization: true,
  enableCoreWebVitals: true,
  enableBackgroundTasks: true,
  enableWebSocketOptimization: true,
  enableRealTimeMonitoring: true,
  enableAutoOptimization: true,
  alertThresholds: {
    memoryUsage: 85, // 85%
    connectionPoolUtilization: 80, // 80%
    webVitalsLCP: 2500, // 2.5s
    webVitalsFID: 100, // 100ms
    webVitalsCLS: 0.1, // 0.1 score
    taskQueueLength: 100, // 100 tasks
    webSocketConnections: 80, // 80% of max
  },
}

export class MasterPerformanceSystem {
  private config: MasterPerformanceConfig;
  private databaseOptimizer?: DatabasePerformanceOptimizer;
  private memoryManager?: MemoryManager;
  private fileUploadOptimizer?: FileUploadOptimizer;
  private datasetProcessor?: LargeDatasetProcessor;
  private coreWebVitalsOptimizer?: CoreWebVitalsOptimizer;
  private backgroundTaskOptimizer?: BackgroundTaskOptimizer;
  private webSocketOptimizer?: WebSocketOptimizer;

  private metrics: SystemPerformanceMetrics = {
    database: {
      connectionPoolUtilization: 0,
      averageQueryTime: 0,
      cacheHitRate: 0,
      activeConnections: 0,
      slowQueries: 0,
    },
    memory: {
      usedJSHeapSize: 0,
      memoryUsagePercent: 0,
      resourceCount: {
        eventListeners: 0,
        intervals: 0,
        timeouts: 0,
        webSockets: 0,
        fileHandles: 0,
      },
    },
    webVitals: {
      lcp: 0,
      fid: 0,
      cls: 0,
      fcp: 0,
      ttfb: 0,
    },
    tasks: {
      totalTasks: 0,
      queueLength: 0,
      workerUtilization: 0,
      throughput: 0,
    },
    webSockets: {
      activeConnections: 0,
      averageLatency: 0,
      errorRate: 0,
      bandwidthUsage: 0,
    },
    fileUploads: {
      activeUploads: 0,
      averageUploadSpeed: 0,
      failureRate: 0,
    },
    system: {
      overallScore: 100,
      alertsActive: 0,
      optimizationsApplied: 0,
      lastOptimization: new Date(),
    },
  }

  private alerts: PerformanceAlert[] = [];
  private optimizationHistory: OptimizationAction[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isInitialized: boolean = false;

  constructor(_config: Partial<MasterPerformanceConfig> = {}) {
    this.config = { ...DEFAULT_MASTER_CONFIG, ...config }
    this.initializeSystem();
  }

  /**
   * Initialize the master performance system
   */
  private async initializeSystem(): Promise<void> {
    if (this.isInitialized) return;

    // console.log('🚀 Initializing Riscura Master Performance System...')

    try {
      // Initialize database optimization
      if (this.config.enableDatabaseOptimization) {
        this.databaseOptimizer = new DatabasePerformanceOptimizer(db.client)
        // console.log('✅ Database optimization initialized')
      }

      // Initialize memory management
      if (this.config.enableMemoryManagement) {
        this.memoryManager = new MemoryManager()
        // console.log('✅ Memory management initialized')
      }

      // Initialize file upload optimization
      if (this.config.enableFileUploadOptimization) {
        this.fileUploadOptimizer = new FileUploadOptimizer()
        this.datasetProcessor = new LargeDatasetProcessor();
        // console.log('✅ File upload optimization initialized')
      }

      // Initialize Core Web Vitals optimization
      if (this.config.enableCoreWebVitals) {
        this.coreWebVitalsOptimizer = new CoreWebVitalsOptimizer({
          enableMonitoring: true,
          enableOptimizations: true,
          reportingEndpoint: this.config.reportingEndpoint,
        })
        // console.log('✅ Core Web Vitals optimization initialized')
      }

      // Initialize background task optimization
      if (this.config.enableBackgroundTasks) {
        this.backgroundTaskOptimizer = new BackgroundTaskOptimizer()
        // console.log('✅ Background task optimization initialized')
      }

      // Initialize WebSocket optimization
      if (this.config.enableWebSocketOptimization) {
        this.webSocketOptimizer = new WebSocketOptimizer()
        // console.log('✅ WebSocket optimization initialized')
      }

      // Start real-time monitoring
      if (this.config.enableRealTimeMonitoring) {
        this.startRealTimeMonitoring()
        // console.log('✅ Real-time monitoring started')
      }

      this.isInitialized = true;
      // console.log('🎉 Master Performance System initialized successfully!')

      // Run initial optimization
      if (this.config.enableAutoOptimization) {
        setTimeout(() => this.runAutoOptimization(), 5000)
      }
    } catch (error) {
      // console.error('❌ Failed to initialize Master Performance System:', error)
      throw error;
    }
  }

  /**
   * Start real-time monitoring
   */
  private startRealTimeMonitoring(): void {
    this.monitoringInterval = setInterval(async () => {
      await this.collectMetrics();
      this.analyzePerformance();
      this.checkAlertThresholds();

      if (this.config.enableAutoOptimization) {
        await this.runAutoOptimization();
      }
    }, 30000); // Monitor every 30 seconds

    // console.log('📊 Real-time monitoring active (30s intervals)')
  }

  /**
   * Collect metrics from all subsystems
   */
  private async collectMetrics(): Promise<void> {
    try {
      // Collect database metrics
      if (this.databaseOptimizer) {
        const dbMetrics = this.databaseOptimizer.getMetrics()
        this.metrics.database = {
          connectionPoolUtilization: dbMetrics.connectionPoolUtilization,
          averageQueryTime: dbMetrics.averageQueryTime,
          cacheHitRate: dbMetrics.cacheHitRate,
          activeConnections: dbMetrics.activeConnections,
          slowQueries: dbMetrics.slowQueries,
        }
      }

      // Collect memory metrics
      if (this.memoryManager) {
        const memMetrics = this.memoryManager.getMetrics()
        this.metrics.memory = {
          usedJSHeapSize: memMetrics.usedJSHeapSize,
          memoryUsagePercent: memMetrics.memoryUsagePercent,
          resourceCount: memMetrics.resourceCount,
        }
      }

      // Collect Core Web Vitals metrics
      if (this.coreWebVitalsOptimizer) {
        const vitalsMetrics = this.coreWebVitalsOptimizer.getMetrics()
        this.metrics.webVitals = {
          lcp: vitalsMetrics.lcp || 0,
          fid: vitalsMetrics.fid || 0,
          cls: vitalsMetrics.cls || 0,
          fcp: vitalsMetrics.fcp || 0,
          ttfb: vitalsMetrics.ttfb || 0,
        }
      }

      // Collect background task metrics
      if (this.backgroundTaskOptimizer) {
        const taskMetrics = this.backgroundTaskOptimizer.getMetrics()
        this.metrics.tasks = {
          totalTasks: taskMetrics.totalTasks,
          queueLength: taskMetrics.queueLength,
          workerUtilization: taskMetrics.workerUtilization,
          throughput: taskMetrics.throughput,
        }
      }

      // Collect WebSocket metrics
      if (this.webSocketOptimizer) {
        const wsMetrics = this.webSocketOptimizer.getMetrics()
        this.metrics.webSockets = {
          activeConnections: wsMetrics.activeConnections,
          averageLatency: wsMetrics.averageLatency,
          errorRate: wsMetrics.errorRate,
          bandwidthUsage: wsMetrics.bandwidthUsage,
        }
      }

      // Calculate overall system score
      this.calculateOverallScore()
    } catch (error) {
      // console.error('Failed to collect metrics:', error)
    }
  }

  /**
   * Calculate overall system performance score
   */
  private calculateOverallScore(): void {
    let score = 100;
    const weights = {
      database: 0.25,
      memory: 0.2,
      webVitals: 0.25,
      tasks: 0.15,
      webSockets: 0.1,
      uploads: 0.05,
    }

    // Database score
    const dbScore = Math.max(
      0,
      100 -
        this.metrics.database.connectionPoolUtilization * 0.5 -
        this.metrics.database.averageQueryTime / 10
    )
    score -= (100 - dbScore) * weights.database;

    // Memory score
    const memScore = Math.max(0, 100 - this.metrics.memory.memoryUsagePercent)
    score -= (100 - memScore) * weights.memory;

    // Web Vitals score
    const vitalsScore = Math.max(
      0,
      100 -
        ((this.metrics.webVitals.lcp > 2500 ? 20 : 0) +
          (this.metrics.webVitals.fid > 100 ? 20 : 0) +
          (this.metrics.webVitals.cls > 0.1 ? 20 : 0))
    )
    score -= (100 - vitalsScore) * weights.webVitals;

    // Task score
    const taskScore = Math.max(
      0,
      100 - this.metrics.tasks.queueLength / 10 - (100 - this.metrics.tasks.workerUtilization)
    )
    score -= (100 - taskScore) * weights.tasks;

    // WebSocket score
    const wsScore = Math.max(0, 100 - this.metrics.webSockets.errorRate * 100)
    score -= (100 - wsScore) * weights.webSockets;

    this.metrics.system.overallScore = Math.max(0, Math.round(score));
  }

  /**
   * Analyze performance and identify issues
   */
  private analyzePerformance(): void {
    const issues = [];

    // Analyze database performance
    if (this.metrics.database.connectionPoolUtilization > 80) {
      issues.push('High database connection pool utilization')
    }
    if (this.metrics.database.averageQueryTime > 1000) {
      issues.push('Slow database query performance');
    }
    if (this.metrics.database.cacheHitRate < 70) {
      issues.push('Low database cache hit rate');
    }

    // Analyze memory usage
    if (this.metrics.memory.memoryUsagePercent > 85) {
      issues.push('High memory usage detected')
    }

    // Analyze Core Web Vitals
    if (this.metrics.webVitals.lcp > 2500) {
      issues.push('LCP exceeds recommended threshold')
    }
    if (this.metrics.webVitals.fid > 100) {
      issues.push('FID exceeds recommended threshold');
    }
    if (this.metrics.webVitals.cls > 0.1) {
      issues.push('CLS exceeds recommended threshold');
    }

    // Analyze task queue
    if (this.metrics.tasks.queueLength > 100) {
      issues.push('High background task queue length')
    }

    // Analyze WebSocket performance
    if (this.metrics.webSockets.errorRate > 0.05) {
      issues.push('High WebSocket error rate')
    }

    if (issues.length > 0) {
      // console.warn('⚠️ Performance issues detected:', issues)
    }
  }

  /**
   * Check alert thresholds and create alerts
   */
  private checkAlertThresholds(): void {
    const thresholds = this.config.alertThresholds;

    // Check memory usage
    if (this.metrics.memory.memoryUsagePercent > thresholds.memoryUsage) {
      this.createAlert(
        'memory',
        'critical',
        `Memory usage at ${this.metrics.memory.memoryUsagePercent}%`,
        this.metrics.memory.memoryUsagePercent,
        thresholds.memoryUsage
      )
    }

    // Check database connection pool
    if (this.metrics.database.connectionPoolUtilization > thresholds.connectionPoolUtilization) {
      this.createAlert(
        'database',
        'warning',
        `Database connection pool utilization at ${this.metrics.database.connectionPoolUtilization}%`,
        this.metrics.database.connectionPoolUtilization,
        thresholds.connectionPoolUtilization
      )
    }

    // Check Core Web Vitals
    if (this.metrics.webVitals.lcp > thresholds.webVitalsLCP) {
      this.createAlert(
        'webvitals',
        'error',
        `LCP at ${this.metrics.webVitals.lcp}ms exceeds threshold`,
        this.metrics.webVitals.lcp,
        thresholds.webVitalsLCP
      )
    }

    if (this.metrics.webVitals.fid > thresholds.webVitalsFID) {
      this.createAlert(
        'webvitals',
        'error',
        `FID at ${this.metrics.webVitals.fid}ms exceeds threshold`,
        this.metrics.webVitals.fid,
        thresholds.webVitalsFID
      );
    }

    if (this.metrics.webVitals.cls > thresholds.webVitalsCLS) {
      this.createAlert(
        'webvitals',
        'error',
        `CLS at ${this.metrics.webVitals.cls} exceeds threshold`,
        this.metrics.webVitals.cls,
        thresholds.webVitalsCLS
      );
    }

    // Check task queue
    if (this.metrics.tasks.queueLength > thresholds.taskQueueLength) {
      this.createAlert(
        'tasks',
        'warning',
        `Task queue length at ${this.metrics.tasks.queueLength} tasks`,
        this.metrics.tasks.queueLength,
        thresholds.taskQueueLength
      )
    }

    // Update active alerts count
    this.metrics.system.alertsActive = this.alerts.filter((alert) => !alert.resolved).length
  }

  /**
   * Create performance alert
   */
  private createAlert(
    category: PerformanceAlert['category'],
    type: PerformanceAlert['type'],
    message: string,
    value: number,
    threshold: number
  ): void {
    // Check if similar alert already exists
    const existingAlert = this.alerts.find(
      (alert) => alert.category === category && alert.message === message && !alert.resolved
    )

    if (existingAlert) return;

    const alert: PerformanceAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      category,
      message,
      value,
      threshold,
      timestamp: new Date(),
      resolved: false,
    }

    this.alerts.push(alert);

    // Keep only recent alerts
    if (this.alerts.length > 200) {
      this.alerts = this.alerts.slice(-100)
    }

    // console.warn(`🚨 Performance Alert [${type.toUpperCase()}]: ${message}`)

    // Send to reporting endpoint if configured
    if (this.config.reportingEndpoint) {
      this.reportAlert(alert)
    }
  }

  /**
   * Run automatic optimization
   */
  private async runAutoOptimization(): Promise<void> {
    const optimizations = [];

    try {
      // Database optimizations
      if (this.databaseOptimizer && this.metrics.database.connectionPoolUtilization > 70) {
        await this.databaseOptimizer.optimizeConnectionPool()
        optimizations.push('Database connection pool optimized');
      }

      // Memory optimizations
      if (this.memoryManager && this.metrics.memory.memoryUsagePercent > 80) {
        this.memoryManager.performPartialCleanup()
        optimizations.push('Memory cleanup performed');
      }

      // Bundle optimizations
      if (this.coreWebVitalsOptimizer && this.metrics.webVitals.lcp > 3000) {
        // Request bundle optimization
        optimizations.push('Core Web Vitals optimization requested')
      }

      // Task optimizations
      if (this.backgroundTaskOptimizer && this.metrics.tasks.queueLength > 50) {
        await this.backgroundTaskOptimizer.optimizeBundles()
        optimizations.push('Background task optimization performed');
      }

      if (optimizations.length > 0) {
        this.recordOptimization(
          'automatic',
          'system',
          `Auto-optimization: ${optimizations.join(', ')}`,
          'medium'
        );
        // console.log('🔧 Auto-optimizations applied:', optimizations)
      }
    } catch (error) {
      // console.error('Failed to run auto-optimization:', error)
    }
  }

  /**
   * Record optimization action
   */
  private recordOptimization(_type: OptimizationAction['type'],
    category: string,
    description: string,
    impact: OptimizationAction['impact']
  ): void {
    const optimization: OptimizationAction = {
      id: `opt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      category,
      description,
      impact,
      timestamp: new Date(),
      result: 'success',
      metrics: {
        before: this.metrics.system.overallScore,
        after: this.metrics.system.overallScore, // Will be updated on next collection
        improvement: 0,
      },
    }

    this.optimizationHistory.push(optimization);
    this.metrics.system.optimizationsApplied++;
    this.metrics.system.lastOptimization = new Date();

    // Keep only recent optimizations
    if (this.optimizationHistory.length > 500) {
      this.optimizationHistory = this.optimizationHistory.slice(-250)
    }
  }

  /**
   * Report alert to external endpoint
   */
  private async reportAlert(_alert: PerformanceAlert): Promise<void> {
    if (!this.config.reportingEndpoint) return;

    try {
      await fetch(this.config.reportingEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'performance_alert',
          alert,
          metrics: this.metrics,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      // console.error('Failed to report alert:', error)
    }
  }

  /**
   * Get current system metrics
   */
  getMetrics(): SystemPerformanceMetrics {
    return { ...this.metrics }
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): PerformanceAlert[] {
    return this.alerts.filter((alert) => !alert.resolved);
  }

  /**
   * Get optimization history
   */
  getOptimizationHistory(): OptimizationAction[] {
    return [...this.optimizationHistory];
  }

  /**
   * Generate comprehensive performance report
   */
  generatePerformanceReport(): {
    summary: {
      overallScore: number;
      alertsActive: number;
      optimizationsApplied: number;
      systemStatus: 'excellent' | 'good' | 'warning' | 'critical';
    }
    metrics: SystemPerformanceMetrics;
    alerts: PerformanceAlert[];
    recommendations: string[];
  } {
    const score = this.metrics.system.overallScore;
    let systemStatus: 'excellent' | 'good' | 'warning' | 'critical';

    if (score >= 90) systemStatus = 'excellent';
    else if (score >= 75) systemStatus = 'good';
    else if (score >= 60) systemStatus = 'warning';
    else systemStatus = 'critical';

    const recommendations = this.generateRecommendations();

    return {
      summary: {
        overallScore: score,
        alertsActive: this.metrics.system.alertsActive,
        optimizationsApplied: this.metrics.system.optimizationsApplied,
        systemStatus,
      },
      metrics: this.metrics,
      alerts: this.getActiveAlerts(),
      recommendations,
    }
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations = [];

    if (this.metrics.database.connectionPoolUtilization > 80) {
      recommendations.push('Consider scaling database connection pool or adding read replicas');
    }

    if (this.metrics.memory.memoryUsagePercent > 85) {
      recommendations.push('Implement more aggressive memory cleanup or increase memory limits');
    }

    if (this.metrics.webVitals.lcp > 2500) {
      recommendations.push(
        'Optimize Largest Contentful Paint with image optimization and critical resource preloading'
      );
    }

    if (this.metrics.tasks.queueLength > 100) {
      recommendations.push('Increase background task worker pool size or optimize task processing');
    }

    if (this.metrics.webSockets.errorRate > 0.05) {
      recommendations.push(
        'Investigate WebSocket connection stability and implement better error handling'
      );
    }

    return recommendations;
  }

  /**
   * Manually trigger optimization
   */
  async triggerOptimization(category?: string): Promise<void> {
    // console.log(`🔧 Manual optimization triggered${category ? ` for ${category}` : ''}`)
    await this.runAutoOptimization();
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string, resolutionAction?: string): void {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolutionAction = resolutionAction;
      this.metrics.system.alertsActive = this.alerts.filter((a) => !a.resolved).length;
      // console.log(`✅ Alert ${alertId} resolved: ${resolutionAction}`)
    }
  }

  /**
   * Cleanup system resources
   */
  cleanup(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    // Cleanup subsystems
    this.databaseOptimizer?.cleanup()
    this.memoryManager?.cleanup();
    this.fileUploadOptimizer?.cleanup();
    this.datasetProcessor?.cleanup();
    this.coreWebVitalsOptimizer?.cleanup();
    this.backgroundTaskOptimizer?.cleanup();
    this.webSocketOptimizer?.cleanup();

    // console.log('🧹 Master Performance System cleaned up')
  }
}

// Global instance
export const masterPerformanceSystem = new MasterPerformanceSystem()

// Initialize on load
if (typeof window !== 'undefined') {
  (window as any).__MASTER_PERFORMANCE_SYSTEM__ = masterPerformanceSystem
}

export default MasterPerformanceSystem;
