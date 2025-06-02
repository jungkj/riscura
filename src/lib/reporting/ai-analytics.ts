import { db } from '@/lib/db';
import { reportingEngine } from './engine';

export interface AIInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'correlation' | 'recommendation' | 'prediction';
  title: string;
  description: string;
  confidence: number; // 0-1
  severity: 'low' | 'medium' | 'high' | 'critical';
  entityType: string;
  entityId?: string;
  data: Record<string, any>;
  actionable: boolean;
  recommendations?: string[];
  generatedAt: Date;
  expiresAt?: Date;
}

export interface TrendAnalysis {
  metric: string;
  period: 'week' | 'month' | 'quarter' | 'year';
  direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  magnitude: number; // percentage change
  confidence: number;
  forecast: ForecastPoint[];
  drivers: string[];
}

export interface ForecastPoint {
  date: Date;
  value: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
}

export interface AnomalyDetection {
  metric: string;
  timestamp: Date;
  actualValue: number;
  expectedValue: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high';
  context: Record<string, any>;
}

export interface RiskCorrelation {
  risk1Id: string;
  risk2Id: string;
  correlationCoefficient: number;
  significance: number;
  relationshipType: 'causal' | 'coincidental' | 'inverse';
  confidence: number;
}

export interface ExecutiveSummary {
  period: { from: Date; to: Date };
  keyMetrics: {
    name: string;
    value: number;
    change: number;
    status: 'good' | 'warning' | 'critical';
  }[];
  topRisks: {
    id: string;
    name: string;
    score: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  }[];
  achievements: string[];
  concerns: string[];
  recommendations: string[];
  generatedAt: Date;
}

export class AIAnalyticsEngine {

  // Generate automated insights for a report
  async generateInsights(reportId: string, lookbackDays: number = 30): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    // Get report data
    const reportData = await reportingEngine.generateReportData(reportId);
    
    // Analyze trends
    const trendInsights = await this.analyzeTrends(reportData, lookbackDays);
    insights.push(...trendInsights);

    // Detect anomalies
    const anomalyInsights = await this.detectAnomalies(reportData, lookbackDays);
    insights.push(...anomalyInsights);

    // Find correlations
    const correlationInsights = await this.findCorrelations(reportData);
    insights.push(...correlationInsights);

    // Generate recommendations
    const recommendations = await this.generateRecommendations(reportData);
    insights.push(...recommendations);

    // Store insights
    for (const insight of insights) {
      await db.client.aiInsight.create({
        data: insight,
      });
    }

    return insights;
  }

  // Analyze trends in the data
  private async analyzeTrends(reportData: any, lookbackDays: number): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    for (const widget of reportData.widgets) {
      if (widget.data.length > 0) {
        const trendAnalysis = this.calculateTrend(widget.data, lookbackDays);
        
        if (trendAnalysis.confidence > 0.7) {
          insights.push({
            id: `trend_${widget.id}_${Date.now()}`,
            type: 'trend',
            title: `Trend Analysis: ${widget.id}`,
            description: this.generateTrendDescription(trendAnalysis),
            confidence: trendAnalysis.confidence,
            severity: this.getTrendSeverity(trendAnalysis),
            entityType: 'REPORT_WIDGET',
            entityId: widget.id,
            data: { trendAnalysis },
            actionable: true,
            recommendations: this.getTrendRecommendations(trendAnalysis),
            generatedAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          });
        }
      }
    }

    return insights;
  }

  // Calculate trend for time series data
  private calculateTrend(data: any[], lookbackDays: number): TrendAnalysis {
    // Simple linear regression for trend calculation
    const timeSeriesData = this.extractTimeSeries(data);
    
    if (timeSeriesData.length < 2) {
      return {
        metric: 'unknown',
        period: 'month',
        direction: 'stable',
        magnitude: 0,
        confidence: 0,
        forecast: [],
        drivers: [],
      };
    }

    const { slope, rSquared } = this.linearRegression(timeSeriesData);
    
    let direction: 'increasing' | 'decreasing' | 'stable' | 'volatile' = 'stable';
    if (Math.abs(slope) > 0.1) {
      direction = slope > 0 ? 'increasing' : 'decreasing';
    }

    // Calculate magnitude (percentage change)
    const firstValue = timeSeriesData[0].value;
    const lastValue = timeSeriesData[timeSeriesData.length - 1].value;
    const magnitude = firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;

    // Generate forecast
    const forecast = this.generateForecast(timeSeriesData, slope, 30); // 30 days forecast

    return {
      metric: 'value',
      period: 'month',
      direction,
      magnitude: Math.abs(magnitude),
      confidence: rSquared,
      forecast,
      drivers: this.identifyTrendDrivers(data),
    };
  }

  // Extract time series data from widget data
  private extractTimeSeries(data: any[]): { date: Date; value: number }[] {
    return data
      .filter(item => item.date && item.value !== undefined)
      .map(item => ({
        date: new Date(item.date),
        value: Number(item.value) || 0,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  // Perform linear regression
  private linearRegression(data: { date: Date; value: number }[]): { slope: number; rSquared: number } {
    const n = data.length;
    const startTime = data[0].date.getTime();
    
    // Convert dates to numeric values (days since start)
    const points = data.map(point => ({
      x: (point.date.getTime() - startTime) / (1000 * 60 * 60 * 24),
      y: point.value,
    }));

    const sumX = points.reduce((sum, p) => sum + p.x, 0);
    const sumY = points.reduce((sum, p) => sum + p.y, 0);
    const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumX2 = points.reduce((sum, p) => sum + p.x * p.x, 0);
    const sumY2 = points.reduce((sum, p) => sum + p.y * p.y, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const meanY = sumY / n;
    const ssTotal = points.reduce((sum, p) => sum + Math.pow(p.y - meanY, 2), 0);
    const ssResidual = points.reduce((sum, p) => {
      const predicted = slope * p.x + intercept;
      return sum + Math.pow(p.y - predicted, 2);
    }, 0);
    
    const rSquared = ssTotal !== 0 ? 1 - (ssResidual / ssTotal) : 0;

    return { slope, rSquared };
  }

  // Generate forecast points
  private generateForecast(historicalData: { date: Date; value: number }[], slope: number, days: number): ForecastPoint[] {
    const forecast: ForecastPoint[] = [];
    const lastPoint = historicalData[historicalData.length - 1];
    const startTime = historicalData[0].date.getTime();
    const lastX = (lastPoint.date.getTime() - startTime) / (1000 * 60 * 60 * 24);

    for (let i = 1; i <= days; i++) {
      const date = new Date(lastPoint.date.getTime() + i * 24 * 60 * 60 * 1000);
      const x = lastX + i;
      const value = lastPoint.value + slope * i;
      
      // Simple confidence interval (would be more sophisticated in practice)
      const uncertainty = Math.abs(value * 0.1); // 10% uncertainty
      
      forecast.push({
        date,
        value,
        confidenceInterval: {
          lower: value - uncertainty,
          upper: value + uncertainty,
        },
      });
    }

    return forecast;
  }

  // Identify trend drivers
  private identifyTrendDrivers(data: any[]): string[] {
    const drivers: string[] = [];
    
    // Analyze data for potential drivers
    // This is a simplified implementation
    if (data.some(item => item.category === 'high_risk')) {
      drivers.push('High-risk events increasing');
    }
    
    if (data.some(item => item.status === 'overdue')) {
      drivers.push('Overdue items accumulating');
    }

    return drivers;
  }

  // Generate trend description
  private generateTrendDescription(trend: TrendAnalysis): string {
    const direction = trend.direction === 'increasing' ? 'upward' : 
                     trend.direction === 'decreasing' ? 'downward' : 'stable';
    
    return `${trend.metric} shows a ${direction} trend over the ${trend.period} with ${trend.magnitude.toFixed(1)}% change (confidence: ${(trend.confidence * 100).toFixed(1)}%)`;
  }

  // Get trend severity
  private getTrendSeverity(trend: TrendAnalysis): 'low' | 'medium' | 'high' | 'critical' {
    if (trend.magnitude > 50 && trend.confidence > 0.8) return 'critical';
    if (trend.magnitude > 25 && trend.confidence > 0.7) return 'high';
    if (trend.magnitude > 10 && trend.confidence > 0.6) return 'medium';
    return 'low';
  }

  // Get trend recommendations
  private getTrendRecommendations(trend: TrendAnalysis): string[] {
    const recommendations: string[] = [];

    if (trend.direction === 'increasing' && trend.magnitude > 20) {
      recommendations.push('Monitor closely for continued growth');
      recommendations.push('Consider scaling resources to handle increased volume');
    }

    if (trend.direction === 'decreasing' && trend.magnitude > 20) {
      recommendations.push('Investigate root causes of decline');
      recommendations.push('Implement corrective measures');
    }

    return recommendations;
  }

  // Detect anomalies in data
  private async detectAnomalies(reportData: any, lookbackDays: number): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    for (const widget of reportData.widgets) {
      const anomalies = this.findAnomalies(widget.data, lookbackDays);
      
      for (const anomaly of anomalies) {
        insights.push({
          id: `anomaly_${widget.id}_${Date.now()}_${Math.random()}`,
          type: 'anomaly',
          title: `Anomaly Detected: ${anomaly.metric}`,
          description: `Unusual value detected: ${anomaly.actualValue} (expected: ${anomaly.expectedValue}, deviation: ${anomaly.deviation.toFixed(2)})`,
          confidence: 0.8,
          severity: anomaly.severity,
          entityType: 'REPORT_WIDGET',
          entityId: widget.id,
          data: { anomaly },
          actionable: true,
          recommendations: this.getAnomalyRecommendations(anomaly),
          generatedAt: new Date(),
        });
      }
    }

    return insights;
  }

  // Find anomalies using statistical methods
  private findAnomalies(data: any[], lookbackDays: number): AnomalyDetection[] {
    const anomalies: AnomalyDetection[] = [];
    const timeSeriesData = this.extractTimeSeries(data);

    if (timeSeriesData.length < 10) return anomalies; // Need sufficient data

    // Calculate rolling statistics
    const windowSize = Math.min(7, Math.floor(timeSeriesData.length / 3));
    
    for (let i = windowSize; i < timeSeriesData.length; i++) {
      const window = timeSeriesData.slice(i - windowSize, i);
      const mean = window.reduce((sum, p) => sum + p.value, 0) / window.length;
      const variance = window.reduce((sum, p) => sum + Math.pow(p.value - mean, 2), 0) / window.length;
      const stdDev = Math.sqrt(variance);

      const currentValue = timeSeriesData[i].value;
      const deviation = Math.abs(currentValue - mean) / (stdDev || 1);

      // Flag as anomaly if more than 2 standard deviations away
      if (deviation > 2) {
        let severity: 'low' | 'medium' | 'high' = 'low';
        if (deviation > 4) severity = 'high';
        else if (deviation > 3) severity = 'medium';

        anomalies.push({
          metric: 'value',
          timestamp: timeSeriesData[i].date,
          actualValue: currentValue,
          expectedValue: mean,
          deviation,
          severity,
          context: {
            windowMean: mean,
            windowStdDev: stdDev,
            windowSize,
          },
        });
      }
    }

    return anomalies;
  }

  // Get anomaly recommendations
  private getAnomalyRecommendations(anomaly: AnomalyDetection): string[] {
    const recommendations: string[] = [];

    if (anomaly.severity === 'high') {
      recommendations.push('Immediate investigation required');
      recommendations.push('Check for data quality issues');
      recommendations.push('Verify system integrity');
    } else {
      recommendations.push('Monitor for pattern continuation');
      recommendations.push('Review related metrics');
    }

    return recommendations;
  }

  // Find correlations between different metrics
  private async findCorrelations(reportData: any): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    // Get risk data for correlation analysis
    const risks = await db.client.risk.findMany({
      where: {
        createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }, // Last 90 days
      },
      include: {
        controls: true,
      },
    });

    const correlations = this.calculateRiskCorrelations(risks);

    for (const correlation of correlations) {
      if (correlation.significance > 0.05 && Math.abs(correlation.correlationCoefficient) > 0.5) {
        insights.push({
          id: `correlation_${correlation.risk1Id}_${correlation.risk2Id}`,
          type: 'correlation',
          title: `Risk Correlation Detected`,
          description: `Strong ${correlation.relationshipType} relationship found between risks (coefficient: ${correlation.correlationCoefficient.toFixed(3)})`,
          confidence: correlation.confidence,
          severity: Math.abs(correlation.correlationCoefficient) > 0.8 ? 'high' : 'medium',
          entityType: 'RISK',
          data: { correlation },
          actionable: true,
          recommendations: this.getCorrelationRecommendations(correlation),
          generatedAt: new Date(),
        });
      }
    }

    return insights;
  }

  // Calculate correlations between risks
  private calculateRiskCorrelations(risks: any[]): RiskCorrelation[] {
    const correlations: RiskCorrelation[] = [];

    for (let i = 0; i < risks.length; i++) {
      for (let j = i + 1; j < risks.length; j++) {
        const risk1 = risks[i];
        const risk2 = risks[j];

        // Calculate correlation based on likelihood and impact scores
        const correlation = this.pearsonCorrelation(
          [risk1.likelihood, risk1.impact],
          [risk2.likelihood, risk2.impact]
        );

        if (Math.abs(correlation) > 0.3) { // Only significant correlations
          correlations.push({
            risk1Id: risk1.id,
            risk2Id: risk2.id,
            correlationCoefficient: correlation,
            significance: 0.05, // Simplified significance
            relationshipType: correlation > 0 ? 'causal' : 'inverse',
            confidence: Math.abs(correlation),
          });
        }
      }
    }

    return correlations;
  }

  // Calculate Pearson correlation coefficient
  private pearsonCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    if (n === 0) return 0;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  // Get correlation recommendations
  private getCorrelationRecommendations(correlation: RiskCorrelation): string[] {
    const recommendations: string[] = [];

    if (correlation.relationshipType === 'causal') {
      recommendations.push('Consider consolidated risk treatment strategies');
      recommendations.push('Monitor both risks together');
    } else {
      recommendations.push('Balance risk treatment between correlated risks');
      recommendations.push('Use inverse relationship for risk hedging');
    }

    return recommendations;
  }

  // Generate recommendations based on data analysis
  private async generateRecommendations(reportData: any): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    // Analyze control effectiveness
    const controlInsights = await this.analyzeControlEffectiveness();
    insights.push(...controlInsights);

    // Analyze risk appetite alignment
    const riskAppetiteInsights = await this.analyzeRiskAppetiteAlignment();
    insights.push(...riskAppetiteInsights);

    return insights;
  }

  // Analyze control effectiveness
  private async analyzeControlEffectiveness(): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    const controls = await db.client.control.findMany({
      include: {
        risks: true,
        _count: {
          select: {
            risks: true,
          },
        },
      },
    });

    for (const control of controls) {
      if (control.effectivenessScore < 70 && control._count.risks > 0) {
        insights.push({
          id: `control_effectiveness_${control.id}`,
          type: 'recommendation',
          title: `Control Effectiveness Improvement Needed`,
          description: `Control "${control.name}" has low effectiveness score (${control.effectivenessScore}%) and affects ${control._count.risks} risks`,
          confidence: 0.9,
          severity: control.effectivenessScore < 50 ? 'high' : 'medium',
          entityType: 'CONTROL',
          entityId: control.id,
          data: { control },
          actionable: true,
          recommendations: [
            'Review control design and implementation',
            'Increase testing frequency',
            'Provide additional training to control owners',
            'Consider automation opportunities',
          ],
          generatedAt: new Date(),
        });
      }
    }

    return insights;
  }

  // Analyze risk appetite alignment
  private async analyzeRiskAppetiteAlignment(): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    const risks = await db.client.risk.findMany({
      where: {
        status: 'open',
      },
    });

    const highRisks = risks.filter(risk => (risk.likelihood * risk.impact) > 15);

    if (highRisks.length > 0) {
      insights.push({
        id: `risk_appetite_${Date.now()}`,
        type: 'recommendation',
        title: `Risk Appetite Alignment Review`,
        description: `${highRisks.length} risks exceed typical risk appetite thresholds`,
        confidence: 0.8,
        severity: 'medium',
        entityType: 'ORGANIZATION',
        data: { highRiskCount: highRisks.length },
        actionable: true,
        recommendations: [
          'Review organizational risk appetite statements',
          'Consider additional risk mitigation measures',
          'Reassess risk tolerance levels',
          'Implement enhanced monitoring for high-risk areas',
        ],
        generatedAt: new Date(),
      });
    }

    return insights;
  }

  // Generate executive summary
  async generateExecutiveSummary(organizationId: string, period: { from: Date; to: Date }): Promise<ExecutiveSummary> {
    // Get key metrics
    const keyMetrics = await this.calculateKeyMetrics(organizationId, period);
    
    // Get top risks
    const topRisks = await this.getTopRisks(organizationId, 5);
    
    // Generate achievements and concerns
    const achievements = await this.identifyAchievements(organizationId, period);
    const concerns = await this.identifyConcerns(organizationId, period);
    
    // Generate recommendations
    const recommendations = await this.generateExecutiveRecommendations(organizationId);

    return {
      period,
      keyMetrics,
      topRisks,
      achievements,
      concerns,
      recommendations,
      generatedAt: new Date(),
    };
  }

  // Calculate key metrics for executive summary
  private async calculateKeyMetrics(organizationId: string, period: { from: Date; to: Date }): Promise<{
    name: string;
    value: number;
    change: number;
    status: 'good' | 'warning' | 'critical';
  }[]> {
    const metrics: {
      name: string;
      value: number;
      change: number;
      status: 'good' | 'warning' | 'critical';
    }[] = [];

    // Total risks
    const totalRisks = await db.client.risk.count({
      where: { organizationId, createdAt: { gte: period.from, lte: period.to } },
    });

    const previousPeriodRisks = await db.client.risk.count({
      where: {
        organizationId,
        createdAt: {
          gte: new Date(period.from.getTime() - (period.to.getTime() - period.from.getTime())),
          lte: period.from,
        },
      },
    });

    const riskChange = previousPeriodRisks > 0 ? ((totalRisks - previousPeriodRisks) / previousPeriodRisks) * 100 : 0;

    metrics.push({
      name: 'Total Risks',
      value: totalRisks,
      change: riskChange,
      status: totalRisks > previousPeriodRisks * 1.2 ? 'critical' : totalRisks > previousPeriodRisks * 1.1 ? 'warning' : 'good',
    });

    // Control effectiveness
    const controls = await db.client.control.findMany({
      where: { organizationId },
      select: { effectivenessScore: true },
    });

    const avgEffectiveness = controls.length > 0 
      ? controls.reduce((sum, c) => sum + c.effectivenessScore, 0) / controls.length
      : 0;

    metrics.push({
      name: 'Avg Control Effectiveness',
      value: Math.round(avgEffectiveness),
      change: 0, // Would calculate from historical data
      status: avgEffectiveness >= 80 ? 'good' : avgEffectiveness >= 60 ? 'warning' : 'critical',
    });

    return metrics;
  }

  // Get top risks
  private async getTopRisks(organizationId: string, limit: number): Promise<{
    id: string;
    name: string;
    score: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  }[]> {
    const risks = await db.client.risk.findMany({
      where: { organizationId, status: 'open' },
      orderBy: [
        { likelihood: 'desc' },
        { impact: 'desc' },
      ],
      take: limit,
    });

    return risks.map(risk => ({
      id: risk.id,
      name: risk.name,
      score: risk.likelihood * risk.impact,
      trend: 'stable' as const, // Would analyze historical data for actual trend
    }));
  }

  // Identify achievements
  private async identifyAchievements(organizationId: string, period: { from: Date; to: Date }): Promise<string[]> {
    const achievements: string[] = [];

    // Check for resolved risks
    const resolvedRisks = await db.client.risk.count({
      where: {
        organizationId,
        status: 'resolved',
        updatedAt: { gte: period.from, lte: period.to },
      },
    });

    if (resolvedRisks > 0) {
      achievements.push(`Successfully resolved ${resolvedRisks} risks`);
    }

    // Check for improved controls
    const improvedControls = await db.client.control.count({
      where: {
        organizationId,
        effectivenessScore: { gte: 80 },
        updatedAt: { gte: period.from, lte: period.to },
      },
    });

    if (improvedControls > 0) {
      achievements.push(`${improvedControls} controls achieved high effectiveness scores`);
    }

    return achievements;
  }

  // Identify concerns
  private async identifyConcerns(organizationId: string, period: { from: Date; to: Date }): Promise<string[]> {
    const concerns: string[] = [];

    // Check for overdue items
    const overdueItems = await db.client.task.count({
      where: {
        organizationId,
        status: { not: 'completed' },
        dueDate: { lt: new Date() },
      },
    });

    if (overdueItems > 0) {
      concerns.push(`${overdueItems} overdue tasks require attention`);
    }

    // Check for high-risk items
    const highRisks = await db.client.risk.count({
      where: {
        organizationId,
        status: 'open',
        likelihood: { gte: 4 },
        impact: { gte: 4 },
      },
    });

    if (highRisks > 0) {
      concerns.push(`${highRisks} critical risks require immediate attention`);
    }

    return concerns;
  }

  // Generate executive recommendations
  private async generateExecutiveRecommendations(organizationId: string): Promise<string[]> {
    const recommendations: string[] = [];

    // Get recent insights
    const recentInsights = await db.client.aiInsight.findMany({
      where: {
        generatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        severity: { in: ['high', 'critical'] },
      },
      take: 5,
    });

    if (recentInsights.length > 0) {
      recommendations.push('Address high-priority insights from AI analysis');
    }

    recommendations.push('Continue regular risk assessment and monitoring');
    recommendations.push('Enhance control testing and validation procedures');
    recommendations.push('Invest in automation for routine compliance tasks');

    return recommendations;
  }

  // Generate natural language report summary
  async generateNaturalLanguageReport(reportData: any): Promise<string> {
    const insights = await this.generateInsights(reportData.reportId || 'temp');
    
    let summary = "## Risk Management Summary\n\n";
    
    // Trends section
    const trendInsights = insights.filter(i => i.type === 'trend');
    if (trendInsights.length > 0) {
      summary += "### Key Trends\n";
      for (const insight of trendInsights.slice(0, 3)) {
        summary += `- ${insight.description}\n`;
      }
      summary += "\n";
    }

    // Anomalies section
    const anomalyInsights = insights.filter(i => i.type === 'anomaly');
    if (anomalyInsights.length > 0) {
      summary += "### Anomalies Detected\n";
      for (const insight of anomalyInsights.slice(0, 3)) {
        summary += `- ${insight.description}\n`;
      }
      summary += "\n";
    }

    // Recommendations section
    const recommendations = insights.filter(i => i.type === 'recommendation');
    if (recommendations.length > 0) {
      summary += "### Recommendations\n";
      for (const insight of recommendations.slice(0, 5)) {
        summary += `- ${insight.title}: ${insight.description}\n`;
      }
      summary += "\n";
    }

    summary += "This report was generated automatically using AI-powered analytics.";

    return summary;
  }
}

export const aiAnalyticsEngine = new AIAnalyticsEngine(); 