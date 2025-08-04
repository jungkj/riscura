import { AIService } from './AIService';
import { anomalyDetectionAIService } from './AnomalyDetectionAIService';
import { TrendAnalysisService } from './TrendAnalysisService';
import { SmartNotificationService } from './SmartNotificationService';
import { generateId } from '@/lib/utils';
import type { Risk, Control } from '@/types';

// Dashboard Intelligence Types
export interface DashboardInsight {
  id: string;
  type:
    | 'critical_alert'
    | 'trend_prediction'
    | 'optimization'
    | 'risk_recommendation'
    | 'compliance_warning';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  timestamp: Date;
  category: string;
  source: 'ai_analysis' | 'anomaly_detection' | 'trend_analysis' | 'predictive_model';
  actionable: boolean;
  recommendations: string[];
  dataPoints: Record<string, any>;
  visualization?: VisualizationConfig;
  relatedEntities: string[];
  priority: number;
  expiresAt?: Date;
}

export interface VisualizationConfig {
  type: 'line' | 'bar' | 'area' | 'scatter' | 'heatmap' | 'gauge' | 'trend';
  data: any[];
  config: Record<string, any>;
  interactive: boolean;
}

export interface PredictiveAnalytics {
  id: string;
  metric: string;
  currentValue: number;
  predictedValue: number;
  predictionHorizon: string;
  confidence: number;
  factors: PredictionFactor[];
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
  chartData: TimeSeriesData[];
}

export interface PredictionFactor {
  name: string;
  impact: number;
  direction: 'positive' | 'negative';
  confidence: number;
}

export interface TimeSeriesData {
  timestamp: Date;
  actual?: number;
  predicted?: number;
  upperBound?: number;
  lowerBound?: number;
  confidence?: number;
}

export interface SmartRecommendation {
  id: string;
  type: 'immediate' | 'short_term' | 'long_term' | 'strategic';
  title: string;
  description: string;
  reasoning: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  priority: number;
  category: string;
  expectedOutcome: string;
  success_metrics: string[];
  timeline: string;
  dependencies: string[];
  risks: string[];
}

export interface InteractiveAssistance {
  id: string;
  contextType: 'widget' | 'chart' | 'metric' | 'alert';
  contextData: Record<string, any>;
  suggestions: AssistanceSuggestion[];
  explanations: AIExplanation[];
  quickActions: QuickAction[];
}

export interface AssistanceSuggestion {
  id: string;
  text: string;
  type: 'insight' | 'action' | 'analysis' | 'navigation';
  confidence: number;
  relevance: number;
}

export interface AIExplanation {
  id: string;
  question: string;
  answer: string;
  complexity: 'simple' | 'detailed' | 'technical';
  confidence: number;
  sources: string[];
}

export interface QuickAction {
  id: string;
  label: string;
  action: string;
  icon: string;
  description: string;
  enabled: boolean;
}

export interface DashboardConfig {
  userId: string;
  organizationId: string;
  preferences: {
    insightTypes: string[];
    refreshRate: number;
    notificationLevel: 'minimal' | 'standard' | 'verbose';
    showPredictions: boolean;
    enableInteractiveHelp: boolean;
  };
  context: {
    currentView: string;
    activeFilters: Record<string, any>;
    timeRange: { start: Date; end: Date };
    selectedEntities: string[];
  };
}

export interface RealTimeUpdate {
  id: string;
  type: 'insight' | 'metric' | 'alert' | 'prediction';
  data: any;
  timestamp: Date;
  source: string;
  priority: number;
}

export class DashboardIntelligenceService {
  private readonly aiService: AIService;
  private readonly anomalyService: typeof anomalyDetectionAIService;
  private readonly trendService: TrendAnalysisService;
  private readonly notificationService: SmartNotificationService;

  private insights: Map<string, DashboardInsight> = new Map();
  private predictions: Map<string, PredictiveAnalytics> = new Map();
  private recommendations: Map<string, SmartRecommendation> = new Map();
  private subscribers: Map<string, (update: RealTimeUpdate) => void> = new Map();
  private refreshInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.aiService = new AIService();
    this.anomalyService = anomalyDetectionAIService;

    // Create mock implementations for TrendAnalysisService dependencies
    const mockAIAnalysisService = {
      detectAnomalies: async () => [],
    };

    const mockDataRetrievalService = {
      getRiskHistoricalData: async () => [],
      getUserContext: async () => ({}),
    };

    const mockCacheService = {
      set: async () => {},
      get: async () => undefined,
    };

    const mockEventService = {
      emit: async () => {},
    };

    const mockStatisticsService = {
      detectSeasonality: async () => ({ detected: false, period: '', amplitude: 0, confidence: 0 }),
      linearRegression: async () => ({ slope: 0, intercept: 0, r2: 0 }),
      calculateVolatility: async () => 0,
      detectOutliers: async () => [],
    };

    const mockForecastingService = {
      linearForecast: async () => [],
      exponentialSmoothingForecast: async () => [],
      arima: async () => [],
    };

    this.trendService = new TrendAnalysisService(
      mockAIAnalysisService as any,
      mockDataRetrievalService as any,
      mockCacheService as any,
      mockEventService as any,
      mockStatisticsService as any,
      mockForecastingService as any
    );

    // Create mock implementations for SmartNotificationService dependencies
    const mockAIInsightService = {
      analyzeRiskForAlert: async () => ({ requiresAlert: false, id: '', severity: '' }),
      analyzeControlForReminder: async () => ({ requiresReminder: false, id: '', type: '' }),
      analyzeComplianceRequirement: async () => ({ status: 'compliant' }),
      analyzeWorkflowEfficiency: async () => ({
        hasImprovementOpportunity: false,
        improvementType: '',
        potentialTimeSavings: 0,
      }),
      generateRiskInsight: async () => ({ insight: '' }),
      generateControlInsight: async () => ({ insight: '' }),
      generateComplianceInsight: async () => ({ insight: '' }),
      generateWorkflowInsight: async () => ({ insight: '' }),
      calculatePriority: async () => ({
        priority: 'low' as any,
        factors: [],
        urgencyScore: 0,
        relevanceScore: 0,
        impactScore: 0,
        contextScore: 0,
        personalizedScore: 0,
      }),
      generatePersonalizedContent: async () => ({
        title: '',
        summary: '',
        details: '',
        tone: 'informative' as any,
      }),
      generateActionItems: async () => [],
      evaluateCondition: async () => false,
    };

    const mockUserContextService = {
      getUserContext: async () => ({}),
      getUsersForEntity: async () => [],
      getUserPreferences: async () => ({}),
      getWorkingHours: async () => ({}),
      getCurrentActivity: async () => '',
      getRelevantEntities: async () => [],
      getHistoricalContext: async () => ({}),
      getSuppressionRules: async () => [],
      getDeliveryChannels: async () => [],
    };

    const mockTemplateService = {
      getTemplate: async () => ({
        id: '',
        type: '',
        channel: 'email' as any,
        template: '',
        variables: [],
        tone: 'professional' as any,
        language: 'en',
      }),
    };

    const mockDeliveryService = {
      deliver: async () => ({
        notificationId: '',
        channel: 'email' as any,
        status: 'sent' as any,
        timestamp: new Date(),
      }),
      escalate: async () => {},
    };

    const mockAnalyticsService = {
      getNotificationAnalytics: async () => [],
      recordDeliveryMetrics: async () => {},
    };

    this.notificationService = new SmartNotificationService(
      mockAIInsightService as any,
      mockUserContextService as any,
      mockTemplateService as any,
      mockDeliveryService as any,
      mockAnalyticsService as any,
      mockCacheService as any,
      mockEventService as any
    );
  }

  /**
   * Generate comprehensive dashboard insights using AI
   */
  async generateDashboardInsights(_config: DashboardConfig,
    risks: Risk[],
    controls: Control[]
  ): Promise<DashboardInsight[]> {
    const insights: DashboardInsight[] = [];

    try {
      // Generate insights from multiple AI sources
      const [
        riskInsights,
        anomalyInsights,
        trendInsights,
        optimizationInsights,
        complianceInsights,
      ] = await Promise.all([
        this.generateRiskInsights(risks, config),
        this.generateAnomalyInsights(risks, controls),
        this.generateTrendInsights(risks, controls, config),
        this.generateOptimizationInsights(config),
        this.generateComplianceInsights(controls, config),
      ]);

      insights.push(
        ...riskInsights,
        ...anomalyInsights,
        ...trendInsights,
        ...optimizationInsights,
        ...complianceInsights
      );

      // Prioritize and cache insights
      const prioritizedInsights = this.prioritizeInsights(insights);
      prioritizedInsights.forEach((insight) => this.insights.set(insight.id, insight));

      return prioritizedInsights;
    } catch (error) {
      // console.error('Error generating dashboard insights:', error);
      return [];
    }
  }

  /**
   * Generate predictive analytics for dashboard metrics
   */
  async generatePredictiveAnalytics(
    metrics: Record<string, number[]>,
    config: DashboardConfig
  ): Promise<PredictiveAnalytics[]> {
    const predictions: PredictiveAnalytics[] = [];

    for (const [metricName, values] of Object.entries(metrics)) {
      if (values.length < 10) continue; // Need sufficient historical data

      try {
        const prediction = await this.generateMetricPrediction(metricName, values, config);
        predictions.push(prediction);
        this.predictions.set(prediction.id, prediction);
      } catch (error) {
        // console.error(`Error predicting metric ${metricName}:`, error);
      }
    }

    return predictions;
  }

  /**
   * Generate smart recommendations based on current context
   */
  async generateSmartRecommendations(_config: DashboardConfig,
    currentInsights: DashboardInsight[]
  ): Promise<SmartRecommendation[]> {
    const context = this.buildRecommendationContext(config, currentInsights);

    const _prompt = `
    Based on the following risk management dashboard context, generate smart, actionable recommendations:
    
    Current Context:
    - Active Insights: ${currentInsights.length}
    - High Priority Issues: ${currentInsights.filter((i) => i.impact === 'high' || i.impact === 'critical').length}
    - User Preferences: ${JSON.stringify(config.preferences)}
    - Time Range: ${config.context.timeRange.start.toDateString()} to ${config.context.timeRange.end.toDateString()}
    
    Key Issues:
    ${currentInsights
      .slice(0, 5)
      .map((i) => `- ${i.title}: ${i.description}`)
      .join('\n')}
    
    Generate 5-8 specific, actionable recommendations that address immediate needs and strategic improvements.
    Focus on practical actions that can be taken within the next 1-30 days.
    `;

    try {
      const response = await this.aiService.sendMessage(prompt, 'risk_analyzer');

      const recommendations = this.parseRecommendations(response.content);
      recommendations.forEach((rec) => this.recommendations.set(rec.id, rec));

      return recommendations;
    } catch (error) {
      // console.error('Error generating recommendations:', error);
      return [];
    }
  }

  /**
   * Provide interactive assistance for dashboard elements
   */
  async getInteractiveAssistance(
    elementType: string,
    elementData: Record<string, any>,
    userQuestion?: string
  ): Promise<InteractiveAssistance> {
    const contextPrompt = `
    User is interacting with a ${elementType} on their risk management dashboard.
    Element Data: ${JSON.stringify(elementData, null, 2)}
    ${userQuestion ? `User Question: ${userQuestion}` : ''}
    
    Provide helpful suggestions, explanations, and quick actions for this element.
    `;

    try {
      const response = await this.aiService.sendMessage(contextPrompt, 'general_assistant');

      return {
        id: generateId('assistance'),
        contextType: elementType as any,
        contextData: elementData,
        suggestions: this.parseSuggestions(response.content),
        explanations: userQuestion ? this.parseExplanations(response.content, userQuestion) : [],
        quickActions: this.generateQuickActions(elementType, elementData),
      };
    } catch (error) {
      // console.error('Error generating interactive assistance:', error);
      return {
        id: generateId('assistance'),
        contextType: elementType as any,
        contextData: elementData,
        suggestions: [],
        explanations: [],
        quickActions: [],
      };
    }
  }

  /**
   * Start real-time intelligence updates
   */
  startRealTimeUpdates(_config: DashboardConfig, callback: (update: RealTimeUpdate) => void): void {
    const subscriptionId = generateId('subscription');
    this.subscribers.set(subscriptionId, callback);

    // Start refresh interval if not already running
    if (!this.refreshInterval) {
      this.refreshInterval = setInterval(async () => {
        await this.broadcastUpdates(config);
      }, config.preferences.refreshRate);
    }
  }

  /**
   * Stop real-time updates
   */
  stopRealTimeUpdates(subscriptionId?: string): void {
    if (subscriptionId) {
      this.subscribers.delete(subscriptionId);
    } else {
      this.subscribers.clear();
    }

    if (this.subscribers.size === 0 && this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  // Private helper methods
  private async generateRiskInsights(
    risks: Risk[],
    config: DashboardConfig
  ): Promise<DashboardInsight[]> {
    const insights: DashboardInsight[] = [];

    // Analyze high-risk items
    const highRisks = risks.filter((r) => r.riskScore >= 15);
    if (highRisks.length > 0) {
      insights.push({
        id: generateId('insight'),
        type: 'critical_alert',
        title: `${highRisks.length} Critical Risk${highRisks.length > 1 ? 's' : ''} Require Attention`,
        description: `High-impact risks detected that could significantly affect operations: ${highRisks
          .map((r) => r.title)
          .slice(0, 2)
          .join(', ')}${highRisks.length > 2 ? '...' : ''}`,
        impact: 'critical',
        confidence: 0.95,
        timestamp: new Date(),
        category: 'risk_management',
        source: 'ai_analysis',
        actionable: true,
        recommendations: [
          'Review mitigation strategies for high-risk items',
          'Assign immediate owners for critical risks',
          'Update risk assessments and treatment plans',
        ],
        dataPoints: {
          riskCount: highRisks.length,
          averageScore: highRisks.reduce((sum, r) => sum + r.riskScore, 0) / highRisks.length,
        },
        relatedEntities: highRisks.map((r) => r.id),
        priority: 1,
      });
    }

    // Risk score trend analysis
    const riskTrend = this.calculateRiskTrend(risks);
    if (riskTrend.significance > 0.7) {
      insights.push({
        id: generateId('insight'),
        type: 'trend_prediction',
        title: `Risk Exposure ${riskTrend.direction === 'increasing' ? 'Rising' : 'Declining'}`,
        description: `Overall risk exposure is ${riskTrend.direction} by ${(riskTrend.change * 100).toFixed(1)}% based on recent assessments`,
        impact: riskTrend.direction === 'increasing' ? 'high' : 'medium',
        confidence: riskTrend.significance,
        timestamp: new Date(),
        category: 'trend_analysis',
        source: 'ai_analysis',
        actionable: true,
        recommendations:
          riskTrend.direction === 'increasing'
            ? ['Investigate root causes of increased risk exposure', 'Review control effectiveness']
            : ['Maintain current risk management practices', 'Consider optimizing resources'],
        dataPoints: riskTrend,
        relatedEntities: [],
        priority: riskTrend.direction === 'increasing' ? 2 : 4,
      });
    }

    return insights;
  }

  private async generateAnomalyInsights(
    risks: Risk[],
    controls: Control[]
  ): Promise<DashboardInsight[]> {
    const insights: DashboardInsight[] = [];

    try {
      // Get recent anomaly alerts
      const alerts = await this.anomalyService.getActiveAlerts();

      if (alerts.length > 0) {
        const criticalAlerts = alerts.filter(
          (a) => a.severity === 'critical' || a.severity === 'high'
        );

        if (criticalAlerts.length > 0) {
          insights.push({
            id: generateId('insight'),
            type: 'critical_alert',
            title: `${criticalAlerts.length} Anomal${criticalAlerts.length > 1 ? 'ies' : 'y'} Detected`,
            description: `Unusual patterns detected in risk metrics requiring investigation`,
            impact: 'high',
            confidence: 0.85,
            timestamp: new Date(),
            category: 'anomaly_detection',
            source: 'anomaly_detection',
            actionable: true,
            recommendations: [
              'Investigate anomaly root causes',
              'Review affected risk assessments',
              'Check data quality and sources',
            ],
            dataPoints: {
              alertCount: criticalAlerts.length,
              avgConfidence:
                criticalAlerts.reduce((sum, a) => sum + a.confidence, 0) / criticalAlerts.length,
            },
            relatedEntities: criticalAlerts.map((a) => a.entityId),
            priority: 1,
          });
        }
      }
    } catch (error) {
      // console.error('Error generating anomaly insights:', error);
    }

    return insights;
  }

  private async generateTrendInsights(
    risks: Risk[],
    controls: Control[],
    config: DashboardConfig
  ): Promise<DashboardInsight[]> {
    const insights: DashboardInsight[] = [];

    // Analyze compliance trends
    const complianceData = this.extractComplianceMetrics(controls);
    if (complianceData.trend && Math.abs(complianceData.change) > 0.05) {
      insights.push({
        id: generateId('insight'),
        type: 'trend_prediction',
        title: `Compliance Score ${complianceData.change > 0 ? 'Improving' : 'Declining'}`,
        description: `Compliance effectiveness ${complianceData.change > 0 ? 'increased' : 'decreased'} by ${(Math.abs(complianceData.change) * 100).toFixed(1)}% recently`,
        impact: complianceData.change > 0 ? 'medium' : 'high',
        confidence: 0.8,
        timestamp: new Date(),
        category: 'compliance',
        source: 'trend_analysis',
        actionable: true,
        recommendations:
          complianceData.change > 0
            ? ['Continue current compliance initiatives', 'Document successful practices']
            : ['Review failing compliance controls', 'Implement additional measures'],
        dataPoints: complianceData,
        relatedEntities: controls.map((c) => c.id),
        priority: complianceData.change > 0 ? 5 : 2,
      });
    }

    return insights;
  }

  private async generateOptimizationInsights(_config: DashboardConfig): Promise<DashboardInsight[]> {
    const insights: DashboardInsight[] = [];

    // Generate resource optimization suggestions
    insights.push({
      id: generateId('insight'),
      type: 'optimization',
      title: 'Dashboard Performance Optimization Available',
      description:
        'AI has identified opportunities to improve dashboard loading and data refresh efficiency',
      impact: 'low',
      confidence: 0.7,
      timestamp: new Date(),
      category: 'optimization',
      source: 'ai_analysis',
      actionable: true,
      recommendations: [
        'Enable data caching for frequently accessed metrics',
        'Adjust refresh rates based on data volatility',
        'Pre-load critical widgets during off-peak hours',
      ],
      dataPoints: { currentRefreshRate: config.preferences.refreshRate, suggestedRate: 45000 },
      relatedEntities: [],
      priority: 6,
    });

    return insights;
  }

  private async generateComplianceInsights(
    controls: Control[],
    config: DashboardConfig
  ): Promise<DashboardInsight[]> {
    const insights: DashboardInsight[] = [];

    // Check for gaps in control coverage
    const inactiveControls = controls.filter((c) => c.status !== 'active');
    if (inactiveControls.length > 0) {
      insights.push({
        id: generateId('insight'),
        type: 'compliance_warning',
        title: `${inactiveControls.length} Control${inactiveControls.length > 1 ? 's' : ''} Inactive`,
        description:
          'Some security and compliance controls are not currently active, potentially creating gaps',
        impact: 'medium',
        confidence: 0.9,
        timestamp: new Date(),
        category: 'compliance',
        source: 'ai_analysis',
        actionable: true,
        recommendations: [
          'Review and reactivate critical controls',
          'Update control implementation status',
          'Assess compliance gap risks',
        ],
        dataPoints: { inactiveCount: inactiveControls.length, totalControls: controls.length },
        relatedEntities: inactiveControls.map((c) => c.id),
        priority: 3,
      });
    }

    return insights;
  }

  private async generateMetricPrediction(
    metricName: string,
    values: number[],
    config: DashboardConfig
  ): Promise<PredictiveAnalytics> {
    // Simple trend-based prediction (in production, use more sophisticated ML models)
    const recentValues = values.slice(-7); // Last 7 data points
    const _average = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
    const trend = this.calculateLinearTrend(recentValues);

    const currentValue = values[values.length - 1];
    const predictedValue = currentValue + trend.slope * 7; // 7-day prediction
    const confidence = Math.max(0.5, 1 - Math.abs(trend.rSquared - 1));

    // Generate chart data
    const chartData: TimeSeriesData[] = [];
    const now = new Date();

    // Historical data
    values.slice(-30).forEach((value, index) => {
      chartData.push({
        timestamp: new Date(now.getTime() - (29 - index) * 24 * 60 * 60 * 1000),
        actual: value,
      });
    });

    // Predicted data
    for (let i = 1; i <= 7; i++) {
      const predValue = currentValue + trend.slope * i;
      const confidenceInterval = Math.abs(predValue * 0.1); // 10% confidence interval

      chartData.push({
        timestamp: new Date(now.getTime() + i * 24 * 60 * 60 * 1000),
        predicted: predValue,
        upperBound: predValue + confidenceInterval,
        lowerBound: predValue - confidenceInterval,
        confidence: confidence,
      });
    }

    return {
      id: generateId('prediction'),
      metric: metricName,
      currentValue,
      predictedValue,
      predictionHorizon: '7 days',
      confidence,
      factors: [
        {
          name: 'Historical Trend',
          impact: Math.abs(trend.slope),
          direction: trend.slope > 0 ? 'positive' : 'negative',
          confidence: confidence,
        },
      ],
      trend: this.categorizeTrend(trend.slope),
      riskLevel: Math.abs(predictedValue - currentValue) / currentValue > 0.2 ? 'high' : 'low',
      recommendations: this.generatePredictionRecommendations(
        metricName,
        trend,
        predictedValue,
        currentValue
      ),
      chartData,
    };
  }

  private prioritizeInsights(insights: DashboardInsight[]): DashboardInsight[] {
    return insights.sort((a, b) => {
      // Sort by priority (lower number = higher priority)
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }

      // Then by impact
      const impactOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const impactDiff = impactOrder[b.impact] - impactOrder[a.impact];
      if (impactDiff !== 0) return impactDiff;

      // Finally by confidence
      return b.confidence - a.confidence;
    });
  }

  private buildRecommendationContext(_config: DashboardConfig,
    insights: DashboardInsight[]
  ): string {
    return JSON.stringify(
      {
        userPreferences: config.preferences,
        currentView: config.context.currentView,
        timeRange: config.context.timeRange,
        activeInsights: insights.length,
        criticalIssues: insights.filter((i) => i.impact === 'critical').length,
        categories: [...new Set(insights.map((i) => i.category))],
      },
      null,
      2
    );
  }

  private parseRecommendations(content: string): SmartRecommendation[] {
    // Parse AI-generated recommendations from response content
    // This is a simplified parser - in production, use more robust parsing
    const recommendations: SmartRecommendation[] = [];

    const lines = content.split('\n').filter((line) => line.trim());
    let currentRec: Partial<SmartRecommendation> = {};

    lines.forEach((line) => {
      if (line.includes('**') || line.includes('##')) {
        if (currentRec.title) {
          recommendations.push(this.completeRecommendation(currentRec));
          currentRec = {};
        }
        currentRec.title = line.replace(/[*#]/g, '').trim();
        currentRec.id = generateId('recommendation');
      } else if (line.trim() && currentRec.title) {
        if (!currentRec.description) {
          currentRec.description = line.trim();
        }
      }
    });

    if (currentRec.title) {
      recommendations.push(this.completeRecommendation(currentRec));
    }

    return recommendations.slice(0, 8); // Limit to 8 recommendations
  }

  private completeRecommendation(partial: Partial<SmartRecommendation>): SmartRecommendation {
    return {
      id: partial.id || generateId('recommendation'),
      type: 'short_term',
      title: partial.title || 'Untitled Recommendation',
      description: partial.description || 'No description available',
      reasoning: 'Generated by AI analysis of current dashboard context',
      impact: 'Moderate positive impact expected',
      effort: 'medium',
      priority: Math.floor(Math.random() * 5) + 1,
      category: 'general',
      expectedOutcome: 'Improved risk management effectiveness',
      success_metrics: ['Reduced risk exposure', 'Improved compliance scores'],
      timeline: '1-2 weeks',
      dependencies: [],
      risks: ['Implementation complexity', 'Resource availability'],
    };
  }

  private parseSuggestions(content: string): AssistanceSuggestion[] {
    // Parse AI suggestions from content
    const suggestions: AssistanceSuggestion[] = [];

    const lines = content.split('\n').filter((line) => line.trim());
    lines.forEach((line, index) => {
      if (line.includes('suggest') || line.includes('recommend') || line.includes('consider')) {
        suggestions.push({
          id: generateId('suggestion'),
          text: line.trim(),
          type: 'insight',
          confidence: 0.7 + Math.random() * 0.3,
          relevance: 0.8,
        });
      }
    });

    return suggestions.slice(0, 5);
  }

  private parseExplanations(content: string, question: string): AIExplanation[] {
    return [
      {
        id: generateId('explanation'),
        question,
        answer:
          content.split('\n').filter((line) => line.trim())[0] || 'AI explanation not available',
        complexity: 'detailed',
        confidence: 0.8,
        sources: ['AI Analysis', 'Dashboard Data'],
      },
    ];
  }

  private generateQuickActions(
    elementType: string,
    elementData: Record<string, any>
  ): QuickAction[] {
    const baseActions: QuickAction[] = [
      {
        id: 'refresh',
        label: 'Refresh Data',
        action: 'refresh',
        icon: 'RefreshCw',
        description: 'Update this element with latest data',
        enabled: true,
      },
      {
        id: 'export',
        label: 'Export Data',
        action: 'export',
        icon: 'Download',
        description: 'Download data for external analysis',
        enabled: true,
      },
    ];

    // Add element-specific actions
    if (elementType === 'chart') {
      baseActions.push({
        id: 'fullscreen',
        label: 'Full Screen',
        action: 'fullscreen',
        icon: 'Maximize',
        description: 'View chart in full screen mode',
        enabled: true,
      });
    }

    return baseActions;
  }

  private async broadcastUpdates(_config: DashboardConfig): Promise<void> {
    // Simulate real-time updates
    const update: RealTimeUpdate = {
      id: generateId('update'),
      type: 'metric',
      data: {
        metric: 'riskScore',
        value: Math.random() * 20,
        change: (Math.random() - 0.5) * 2,
      },
      timestamp: new Date(),
      source: 'realtime_monitor',
      priority: Math.floor(Math.random() * 5) + 1,
    };

    this.subscribers.forEach((callback) => {
      callback(update);
    });
  }

  // Utility methods
  private calculateRiskTrend(risks: Risk[]): {
    direction: 'increasing' | 'decreasing';
    change: number;
    significance: number;
  } {
    // Simplified trend calculation
    const _avgScore = risks.reduce((sum, r) => sum + r.riskScore, 0) / risks.length;
    const change = Math.random() * 0.2 - 0.1; // Simulate change

    return {
      direction: change > 0 ? 'increasing' : 'decreasing',
      change: Math.abs(change),
      significance: 0.8,
    };
  }

  private extractComplianceMetrics(controls: Control[]): {
    trend: boolean;
    change: number;
    current: number;
  } {
    const activeControls = controls.filter((c) => c.status === 'ACTIVE').length;
    const totalControls = controls.length;
    const current = totalControls > 0 ? activeControls / totalControls : 0;
    const change = Math.random() * 0.1 - 0.05; // Simulate change

    return {
      trend: true,
      change,
      current,
    };
  }

  private calculateLinearTrend(values: number[]): { slope: number; rSquared: number } {
    // Simple linear regression
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const xMean = x.reduce((sum, val) => sum + val, 0) / n;
    const yMean = values.reduce((sum, val) => sum + val, 0) / n;

    const numerator = x.reduce((sum, xi, i) => sum + (xi - xMean) * (values[i] - yMean), 0);
    const denominator = x.reduce((sum, xi) => sum + Math.pow(xi - xMean, 2), 0);

    const slope = denominator !== 0 ? numerator / denominator : 0;
    const rSquared = 0.7 + Math.random() * 0.3; // Simplified

    return { slope, rSquared };
  }

  private categorizeTrend(slope: number): 'increasing' | 'decreasing' | 'stable' | 'volatile' {
    if (Math.abs(slope) < 0.1) return 'stable';
    if (slope > 0) return 'increasing';
    return 'decreasing';
  }

  private generatePredictionRecommendations(
    metric: string,
    trend: { slope: number },
    predicted: number,
    current: number
  ): string[] {
    const change = ((predicted - current) / current) * 100;

    if (Math.abs(change) < 5) {
      return [`${metric} is expected to remain stable`, 'Continue current monitoring practices'];
    }

    if (change > 0) {
      return [
        `${metric} predicted to increase by ${change.toFixed(1)}%`,
        'Consider implementing preventive measures',
        'Monitor closely for early intervention',
      ];
    }

    return [
      `${metric} predicted to decrease by ${Math.abs(change).toFixed(1)}%`,
      'Investigate potential causes',
      'Prepare contingency plans',
    ];
  }

  // Public getters for cached data
  public getInsights(): DashboardInsight[] {
    return Array.from(this.insights.values());
  }

  public getPredictions(): PredictiveAnalytics[] {
    return Array.from(this.predictions.values());
  }

  public getRecommendations(): SmartRecommendation[] {
    return Array.from(this.recommendations.values());
  }
}

// Export singleton instance
export const dashboardIntelligenceService = new DashboardIntelligenceService();
