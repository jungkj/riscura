interface ModelPerformanceMetrics {
  modelName: string;
  version: string;
  accuracy: number;
  responseTime: number;
  costPerRequest: number;
  userSatisfaction: number;
  errorRate: number;
  uptime: number;
  throughput: number;
  lastUpdated: Date;
}

interface ModelComparison {
  currentModel: ModelPerformanceMetrics;
  previousModel: ModelPerformanceMetrics;
  improvement: Record<string, number>;
  degradation: Record<string, number>;
  recommendation: 'upgrade' | 'maintain' | 'rollback';
}

interface PerformanceBenchmark {
  metric: string;
  target: number;
  current: number;
  status: 'above_target' | 'at_target' | 'below_target' | 'critical';
  trend: 'improving' | 'stable' | 'declining';
}

interface ModelConfig {
  name: string;
  version: string;
  parameters: Record<string, any>;
  deployedAt: Date;
  status: 'active' | 'testing' | 'deprecated' | 'rollback';
  rollbackThreshold: number;
  performanceThresholds: Record<string, number>;
}

export class ModelPerformanceTracker {
  private metrics: Map<string, ModelPerformanceMetrics[]> = new Map();
  private benchmarks: Map<string, PerformanceBenchmark[]> = new Map();
  private configurations: Map<string, ModelConfig> = new Map();
  private alerts: Array<{ timestamp: Date; message: string; severity: string }> = [];

  constructor() {
    this.initializeDefaultBenchmarks();
    this.startPerformanceMonitoring();
  }

  /**
   * Track performance metrics for a model request
   */
  async trackModelRequest(
    modelName: string,
    requestData: {
      responseTime: number;
      tokensUsed: number;
      cost: number;
      success: boolean;
      userFeedback?: number; // 1-5 rating
      errorType?: string;
    }
  ): Promise<void> {
    const version = this.getCurrentModelVersion(modelName);

    // Get or create metrics for this model/version
    let modelMetrics = this.getLatestMetrics(modelName, version);
    if (!modelMetrics) {
      modelMetrics = this.createNewMetrics(modelName, version);
    }

    // Update metrics
    this.updateMetrics(modelMetrics, requestData);

    // Store updated metrics
    this.storeMetrics(modelName, modelMetrics);

    // Check for performance degradation
    await this.checkPerformanceThresholds(modelName, modelMetrics);
  }

  /**
   * Compare two model versions
   */
  async compareModels(
    modelName: string,
    currentVersion: string,
    previousVersion: string
  ): Promise<ModelComparison> {
    const currentMetrics = this.getLatestMetrics(modelName, currentVersion);
    const previousMetrics = this.getLatestMetrics(modelName, previousVersion);

    if (!currentMetrics || !previousMetrics) {
      throw new Error('Insufficient data for model comparison');
    }

    const improvement: Record<string, number> = {};
    const degradation: Record<string, number> = {};

    // Compare key metrics
    const metricsToCompare = ['accuracy', 'responseTime', 'costPerRequest', 'errorRate'];

    for (const metric of metricsToCompare) {
      const current = (currentMetrics as any)[metric];
      const previous = (previousMetrics as any)[metric];
      const change = ((current - previous) / previous) * 100;

      if (metric === 'responseTime' || metric === 'costPerRequest' || metric === 'errorRate') {
        // Lower is better for these metrics
        if (change < 0) {
          improvement[metric] = Math.abs(change);
        } else {
          degradation[metric] = change;
        }
      } else {
        // Higher is better for these metrics
        if (change > 0) {
          improvement[metric] = change;
        } else {
          degradation[metric] = Math.abs(change);
        }
      }
    }

    const recommendation = this.generateRecommendation(improvement, degradation);

    return {
      currentModel: currentMetrics,
      previousModel: previousMetrics,
      improvement,
      degradation,
      recommendation,
    };
  }

  /**
   * Get performance benchmarks for a model
   */
  getBenchmarks(modelName: string): PerformanceBenchmark[] {
    return this.benchmarks.get(modelName) || [];
  }

  /**
   * Update performance benchmarks
   */
  updateBenchmarks(modelName: string, benchmarks: PerformanceBenchmark[]): void {
    this.benchmarks.set(modelName, benchmarks);
  }

  /**
   * Get model deployment recommendations
   */
  async getDeploymentRecommendations(modelName: string): Promise<{
    canDeploy: boolean;
    reason: string;
    requiredActions: string[];
    riskLevel: 'low' | 'medium' | 'high';
  }> {
    const metrics = this.getLatestMetrics(modelName);
    const benchmarks = this.getBenchmarks(modelName);

    if (!metrics) {
      return {
        canDeploy: false,
        reason: 'Insufficient performance data',
        requiredActions: ['Collect baseline performance metrics', 'Run A/B testing'],
        riskLevel: 'high',
      };
    }

    const failedBenchmarks = benchmarks.filter(
      (b) => b.status === 'below_target' || b.status === 'critical'
    );

    if (failedBenchmarks.length === 0) {
      return {
        canDeploy: true,
        reason: 'All performance benchmarks met',
        requiredActions: [],
        riskLevel: 'low',
      };
    }

    const criticalFailures = failedBenchmarks.filter((b) => b.status === 'critical');

    if (criticalFailures.length > 0) {
      return {
        canDeploy: false,
        reason: 'Critical performance benchmarks not met',
        requiredActions: criticalFailures.map(
          (b) => `Improve ${b.metric} to meet target of ${b.target}`
        ),
        riskLevel: 'high',
      };
    }

    return {
      canDeploy: true,
      reason: 'Minor performance issues detected',
      requiredActions: failedBenchmarks.map((b) => `Monitor ${b.metric} - currently below target`),
      riskLevel: 'medium',
    };
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(
    modelName: string,
    period: 'daily' | 'weekly' | 'monthly'
  ): {
    summary: Record<string, any>;
    trends: Record<string, any>;
    recommendations: string[];
    alerts: Array<{ timestamp: Date; message: string; severity: string }>;
  } {
    const metrics = this.getMetricsForPeriod(modelName, period);
    const benchmarks = this.getBenchmarks(modelName);

    const summary = this.calculateSummaryMetrics(metrics);
    const trends = this.calculateTrends(metrics);
    const recommendations = this.generateRecommendations(summary, trends, benchmarks);
    const relevantAlerts = this.getAlertsForPeriod(period);

    return {
      summary,
      trends,
      recommendations,
      alerts: relevantAlerts,
    };
  }

  /**
   * Monitor model health in real-time
   */
  async monitorModelHealth(modelName: string): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    suggestions: string[];
  }> {
    const metrics = this.getLatestMetrics(modelName);
    const config = this.configurations.get(modelName);

    if (!metrics || !config) {
      return {
        status: 'critical',
        issues: ['Model metrics or configuration not found'],
        suggestions: ['Check model deployment and monitoring setup'],
      };
    }

    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check error rate
    if (metrics.errorRate > config.performanceThresholds.errorRate) {
      issues.push(`High error rate: ${metrics.errorRate}%`);
      suggestions.push('Investigate error patterns and causes');
    }

    // Check response time
    if (metrics.responseTime > config.performanceThresholds.responseTime) {
      issues.push(`Slow response time: ${metrics.responseTime}ms`);
      suggestions.push('Consider model optimization or scaling');
    }

    // Check user satisfaction
    if (metrics.userSatisfaction < config.performanceThresholds.userSatisfaction) {
      issues.push(`Low user satisfaction: ${metrics.userSatisfaction}/5`);
      suggestions.push('Review response quality and user feedback');
    }

    // Determine overall status
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (issues.length > 0) {
      const criticalIssues = issues.filter(
        (issue) => issue.includes('High error rate') || issue.includes('critical')
      );
      status = criticalIssues.length > 0 ? 'critical' : 'warning';
    }

    return { status, issues, suggestions };
  }

  private initializeDefaultBenchmarks(): void {
    const defaultBenchmarks: PerformanceBenchmark[] = [
      {
        metric: 'accuracy',
        target: 0.85,
        current: 0,
        status: 'below_target',
        trend: 'stable',
      },
      {
        metric: 'responseTime',
        target: 2000, // 2 seconds
        current: 0,
        status: 'below_target',
        trend: 'stable',
      },
      {
        metric: 'errorRate',
        target: 0.05, // 5%
        current: 0,
        status: 'below_target',
        trend: 'stable',
      },
      {
        metric: 'userSatisfaction',
        target: 4.0,
        current: 0,
        status: 'below_target',
        trend: 'stable',
      },
    ];

    this.benchmarks.set('default', defaultBenchmarks);
  }

  private startPerformanceMonitoring(): void {
    // Monitor performance every 5 minutes
    setInterval(() => {
      this.performPerformanceCheck();
    }, 300000);
  }

  private async performPerformanceCheck(): Promise<void> {
    for (const [modelName] of this.configurations) {
      const health = await this.monitorModelHealth(modelName);

      if (health.status === 'critical') {
        this.alerts.push({
          timestamp: new Date(),
          message: `CRITICAL: Model ${modelName} health issues: ${health.issues.join(', ')}`,
          severity: 'critical',
        });
      }
    }
  }

  private getCurrentModelVersion(modelName: string): string {
    const config = this.configurations.get(modelName);
    return config?.version || '1.0.0';
  }

  private getLatestMetrics(modelName: string, version?: string): ModelPerformanceMetrics | null {
    const modelMetrics = this.metrics.get(modelName);
    if (!modelMetrics || modelMetrics.length === 0) return null;

    if (version) {
      return modelMetrics.find((m) => m.version === version) || null;
    }

    return modelMetrics[modelMetrics.length - 1];
  }

  private createNewMetrics(modelName: string, version: string): ModelPerformanceMetrics {
    return {
      modelName,
      version,
      accuracy: 0,
      responseTime: 0,
      costPerRequest: 0,
      userSatisfaction: 0,
      errorRate: 0,
      uptime: 100,
      throughput: 0,
      lastUpdated: new Date(),
    };
  }

  private updateMetrics(
    metrics: ModelPerformanceMetrics,
    requestData: {
      responseTime: number;
      tokensUsed: number;
      cost: number;
      success: boolean;
      userFeedback?: number;
      errorType?: string;
    }
  ): void {
    // Update response time (moving average)
    metrics.responseTime = (metrics.responseTime + requestData.responseTime) / 2;

    // Update cost per request
    metrics.costPerRequest = (metrics.costPerRequest + requestData.cost) / 2;

    // Update error rate
    const currentErrorRate = metrics.errorRate || 0;
    const errorCount = requestData.success ? 0 : 1;
    metrics.errorRate = currentErrorRate * 0.9 + errorCount * 0.1;

    // Update user satisfaction if provided
    if (requestData.userFeedback) {
      metrics.userSatisfaction = (metrics.userSatisfaction + requestData.userFeedback) / 2;
    }

    metrics.lastUpdated = new Date();
  }

  private storeMetrics(modelName: string, metrics: ModelPerformanceMetrics): void {
    const modelMetrics = this.metrics.get(modelName) || [];

    // Update existing metrics or add new
    const existingIndex = modelMetrics.findIndex((m) => m.version === metrics.version);
    if (existingIndex >= 0) {
      modelMetrics[existingIndex] = metrics;
    } else {
      modelMetrics.push(metrics);
    }

    this.metrics.set(modelName, modelMetrics);
  }

  private async checkPerformanceThresholds(
    modelName: string,
    metrics: ModelPerformanceMetrics
  ): Promise<void> {
    const config = this.configurations.get(modelName);
    if (!config) return;

    // Check rollback threshold
    if (metrics.errorRate > config.rollbackThreshold) {
      this.alerts.push({
        timestamp: new Date(),
        message: `ROLLBACK TRIGGERED: Model ${modelName} error rate (${metrics.errorRate}) exceeds threshold (${config.rollbackThreshold})`,
        severity: 'critical',
      });
    }
  }

  private generateRecommendation(
    improvement: Record<string, number>,
    degradation: Record<string, number>
  ): 'upgrade' | 'maintain' | 'rollback' {
    const improvementScore = Object.values(improvement).reduce((a, b) => a + b, 0);
    const degradationScore = Object.values(degradation).reduce((a, b) => a + b, 0);

    // Check for critical degradations
    if (degradation.errorRate > 50 || degradation.responseTime > 100) {
      return 'rollback';
    }

    if (improvementScore > degradationScore * 1.5) {
      return 'upgrade';
    }

    if (degradationScore > improvementScore * 2) {
      return 'rollback';
    }

    return 'maintain';
  }

  private getMetricsForPeriod(
    modelName: string,
    period: 'daily' | 'weekly' | 'monthly'
  ): ModelPerformanceMetrics[] {
    const allMetrics = this.metrics.get(modelName) || [];
    const now = new Date();
    let cutoffDate: Date;

    switch (period) {
      case 'daily':
        cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    return allMetrics.filter((m) => m.lastUpdated >= cutoffDate);
  }

  private calculateSummaryMetrics(metrics: ModelPerformanceMetrics[]): Record<string, any> {
    if (metrics.length === 0) return {};

    const latest = metrics[metrics.length - 1];
    const _average = {
      responseTime: metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length,
      errorRate: metrics.reduce((sum, m) => sum + m.errorRate, 0) / metrics.length,
      userSatisfaction: metrics.reduce((sum, m) => sum + m.userSatisfaction, 0) / metrics.length,
    };

    return { latest, average, totalRequests: metrics.length };
  }

  private calculateTrends(metrics: ModelPerformanceMetrics[]): Record<string, any> {
    if (metrics.length < 2) return {};

    const first = metrics[0];
    const last = metrics[metrics.length - 1];

    return {
      responseTime: {
        change: last.responseTime - first.responseTime,
        trend: last.responseTime > first.responseTime ? 'increasing' : 'decreasing',
      },
      errorRate: {
        change: last.errorRate - first.errorRate,
        trend: last.errorRate > first.errorRate ? 'increasing' : 'decreasing',
      },
    };
  }

  private generateRecommendations(
    summary: Record<string, any>,
    trends: Record<string, any>,
    benchmarks: PerformanceBenchmark[]
  ): string[] {
    const recommendations: string[] = [];

    // Check if response time is trending upward
    if (trends.responseTime?.trend === 'increasing') {
      recommendations.push('Consider optimizing model or infrastructure to improve response times');
    }

    // Check if error rate is increasing
    if (trends.errorRate?.trend === 'increasing') {
      recommendations.push('Investigate causes of increasing error rate');
    }

    // Check benchmark compliance
    const failingBenchmarks = benchmarks.filter((b) => b.status === 'below_target');
    if (failingBenchmarks.length > 0) {
      recommendations.push(
        `Address performance issues with: ${failingBenchmarks.map((b) => b.metric).join(', ')}`
      );
    }

    return recommendations;
  }

  private getAlertsForPeriod(
    period: 'daily' | 'weekly' | 'monthly'
  ): Array<{ timestamp: Date; message: string; severity: string }> {
    const now = new Date();
    let cutoffDate: Date;

    switch (period) {
      case 'daily':
        cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    return this.alerts.filter((alert) => alert.timestamp >= cutoffDate);
  }
}
