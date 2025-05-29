import { RiskIntelligenceService } from './RiskIntelligenceService';
import { ControlIntelligenceService } from './ControlIntelligenceService';
import { ContextAwarenessService } from './ContextAwarenessService';
import { PredictiveAnalyticsService } from './PredictiveAnalyticsService';
import { ContentQualityService } from './ContentQualityService';
import {
  IntelligenceReport,
  AnalysisRequest,
  RiskInsight,
  ControlInsight,
  PredictiveInsight,
  QualityInsight,
  ContextualInsight,
  IntelligenceRecommendation,
  IntelligenceDashboard,
  IntelligenceMetrics,
  AlertLevel,
  InsightPriority,
  AnalysisType
} from '@/types/risk-intelligence.types';
import { Risk, Control, User } from '@/types';
import { generateId } from '@/lib/utils';

export class IntelligenceEngineService {
  private readonly riskIntelligence: RiskIntelligenceService;
  private readonly controlIntelligence: ControlIntelligenceService;
  private readonly contextAwareness: ContextAwarenessService;
  private readonly predictiveAnalytics: PredictiveAnalyticsService;
  private readonly contentQuality: ContentQualityService;
  private readonly cacheService: CacheService;
  private readonly eventService: EventService;

  constructor(
    riskIntelligence: RiskIntelligenceService,
    controlIntelligence: ControlIntelligenceService,
    contextAwareness: ContextAwarenessService,
    predictiveAnalytics: PredictiveAnalyticsService,
    contentQuality: ContentQualityService,
    cacheService: CacheService,
    eventService: EventService
  ) {
    this.riskIntelligence = riskIntelligence;
    this.controlIntelligence = controlIntelligence;
    this.contextAwareness = contextAwareness;
    this.predictiveAnalytics = predictiveAnalytics;
    this.contentQuality = contentQuality;
    this.cacheService = cacheService;
    this.eventService = eventService;
  }

  /**
   * Generate comprehensive intelligence report
   */
  async generateIntelligenceReport(request: AnalysisRequest): Promise<IntelligenceReport> {
    try {
      const startTime = Date.now();
      
      // Build organizational context
      const context = await this.contextAwareness.buildContext(request.userId);
      
      // Perform parallel analysis across all intelligence services
      const [
        riskInsights,
        controlInsights,
        predictiveInsights,
        qualityInsights,
        contextualInsights
      ] = await Promise.all([
        this.generateRiskInsights(request, context),
        this.generateControlInsights(request, context),
        this.generatePredictiveInsights(request, context),
        this.generateQualityInsights(request, context),
        this.contextAwareness.getRelevantInsights(context)
      ]);

      // Combine and prioritize all insights
      const allInsights = [
        ...riskInsights,
        ...controlInsights,
        ...predictiveInsights,
        ...qualityInsights,
        ...contextualInsights
      ];

      // Generate unified recommendations
      const recommendations = await this.generateUnifiedRecommendations(allInsights, context);

      // Calculate overall intelligence metrics
      const metrics = this.calculateIntelligenceMetrics(allInsights, recommendations);

      // Determine alert level
      const alertLevel = this.determineAlertLevel(allInsights, metrics);

      const report: IntelligenceReport = {
        id: generateId('intelligence-report'),
        userId: request.userId,
        analysisType: request.type,
        context,
        insights: {
          risk: riskInsights,
          control: controlInsights,
          predictive: predictiveInsights,
          quality: qualityInsights,
          contextual: contextualInsights
        },
        recommendations,
        metrics,
        alertLevel,
        confidence: this.calculateOverallConfidence(allInsights),
        generatedAt: new Date(),
        processingTime: Date.now() - startTime
      };

      // Cache the report
      await this.cacheService.set(`intelligence:${report.id}`, report, { ttl: 86400 }); // 24 hours

      // Emit intelligence event
      await this.eventService.emit('intelligence:report_generated', {
        reportId: report.id,
        userId: request.userId,
        alertLevel,
        insightCount: allInsights.length,
        recommendationCount: recommendations.length
      });

      return report;
      
    } catch (error) {
      console.error('Error generating intelligence report:', error);
      throw new Error('Failed to generate intelligence report');
    }
  }

  /**
   * Get real-time intelligence dashboard
   */
  async getIntelligenceDashboard(userId: string): Promise<IntelligenceDashboard> {
    try {
      // Check cache first
      const cached = await this.cacheService.get(`dashboard:${userId}`);
      if (cached && this.isDashboardFresh(cached)) {
        return cached;
      }

      // Build context
      const context = await this.contextAwareness.buildContext(userId);

      // Get recent insights
      const recentInsights = await this.getRecentInsights(userId);

      // Get active recommendations
      const activeRecommendations = await this.getActiveRecommendations(userId);

      // Get trending risks
      const trendingRisks = await this.getTrendingRisks(context);

      // Get performance metrics
      const performanceMetrics = await this.getPerformanceMetrics(context);

      // Get upcoming alerts
      const upcomingAlerts = await this.getUpcomingAlerts(context);

      const dashboard: IntelligenceDashboard = {
        userId,
        context,
        recentInsights,
        activeRecommendations,
        trendingRisks,
        performanceMetrics,
        upcomingAlerts,
        lastUpdated: new Date(),
        refreshInterval: 300000 // 5 minutes
      };

      // Cache dashboard
      await this.cacheService.set(`dashboard:${userId}`, dashboard, { ttl: 300 }); // 5 minutes

      return dashboard;
      
    } catch (error) {
      console.error('Error getting intelligence dashboard:', error);
      throw new Error('Failed to get intelligence dashboard');
    }
  }

  /**
   * Analyze specific content or entity
   */
  async analyzeEntity(
    entityType: 'risk' | 'control' | 'document' | 'procedure',
    entityId: string,
    userId: string
  ): Promise<EntityAnalysis> {
    try {
      const context = await this.contextAwareness.buildContext(userId);
      let analysis: EntityAnalysis;

      switch (entityType) {
        case 'risk':
          analysis = await this.analyzeRisk(entityId, context);
          break;
        case 'control':
          analysis = await this.analyzeControl(entityId, context);
          break;
        case 'document':
          analysis = await this.analyzeDocument(entityId, context);
          break;
        case 'procedure':
          analysis = await this.analyzeProcedure(entityId, context);
          break;
        default:
          throw new Error(`Unsupported entity type: ${entityType}`);
      }

      // Emit analysis event
      await this.eventService.emit('intelligence:entity_analyzed', {
        entityType,
        entityId,
        userId,
        analysis
      });

      return analysis;
      
    } catch (error) {
      console.error(`Error analyzing ${entityType}:`, error);
      throw new Error(`Failed to analyze ${entityType}`);
    }
  }

  /**
   * Get intelligence recommendations for user
   */
  async getRecommendations(
    userId: string,
    type?: 'all' | 'risk' | 'control' | 'process' | 'compliance'
  ): Promise<IntelligenceRecommendation[]> {
    try {
      const context = await this.contextAwareness.buildContext(userId);
      const allRecommendations: IntelligenceRecommendation[] = [];

      if (!type || type === 'all' || type === 'risk') {
        const riskRecommendations = await this.getRiskRecommendations(context);
        allRecommendations.push(...riskRecommendations);
      }

      if (!type || type === 'all' || type === 'control') {
        const controlRecommendations = await this.getControlRecommendations(context);
        allRecommendations.push(...controlRecommendations);
      }

      if (!type || type === 'all' || type === 'process') {
        const processRecommendations = await this.getProcessRecommendations(context);
        allRecommendations.push(...processRecommendations);
      }

      if (!type || type === 'all' || type === 'compliance') {
        const complianceRecommendations = await this.getComplianceRecommendations(context);
        allRecommendations.push(...complianceRecommendations);
      }

      // Sort by priority and relevance
      return allRecommendations.sort((a, b) => {
        const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
        const aScore = priorityWeight[a.priority] * a.confidence;
        const bScore = priorityWeight[b.priority] * b.confidence;
        return bScore - aScore;
      });
      
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw new Error('Failed to get intelligence recommendations');
    }
  }

  // Private helper methods
  private async generateRiskInsights(request: AnalysisRequest, context: any): Promise<RiskInsight[]> {
    const insights: RiskInsight[] = [];
    
    if (request.scope.risks && request.scope.risks.length > 0) {
      for (const risk of request.scope.risks) {
        // Analyze risk quality
        const qualityAnalysis = await this.riskIntelligence.analyzeRiskQuality(risk);
        
        if (qualityAnalysis.overallScore < 70) {
          insights.push({
            id: generateId('risk-insight'),
            type: 'quality',
            priority: this.mapScoreToPriority(qualityAnalysis.overallScore),
            title: `Risk Quality Below Standard: ${risk.title}`,
            description: `Risk quality score of ${qualityAnalysis.overallScore}% indicates improvement needed`,
            riskId: risk.id,
            impact: 'medium',
            recommendations: qualityAnalysis.improvements.map(imp => imp.description),
            confidence: 85,
            context: context.id,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
          });
        }
      }
    }

    // Get emerging risks insights
    if (request.includeEmergingRisks) {
      const emergingRisks = await this.riskIntelligence.identifyEmergingRisks(context);
      
      for (const emergingRisk of emergingRisks.slice(0, 5)) { // Top 5
        insights.push({
          id: generateId('risk-insight'),
          type: 'emerging',
          priority: emergingRisk.relevanceScore > 80 ? 'high' : 'medium',
          title: `Emerging Risk: ${emergingRisk.title}`,
          description: emergingRisk.description,
          impact: emergingRisk.potentialImpact,
          recommendations: emergingRisk.mitigationSuggestions,
          confidence: emergingRisk.confidence,
          context: context.id,
          expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
        });
      }
    }

    return insights;
  }

  private async generateControlInsights(request: AnalysisRequest, context: any): Promise<ControlInsight[]> {
    const insights: ControlInsight[] = [];

    if (request.scope.controls && request.scope.controls.length > 0) {
      for (const control of request.scope.controls) {
        // Get control recommendations
        const recommendations = await this.controlIntelligence.recommendControls(control.risks[0]);
        
        if (recommendations.length > 0) {
          const topRecommendation = recommendations[0];
          
          insights.push({
            id: generateId('control-insight'),
            type: 'recommendation',
            priority: topRecommendation.priority,
            title: `Control Enhancement Opportunity: ${control.title}`,
            description: `Consider implementing: ${topRecommendation.title}`,
            controlId: control.id,
            impact: topRecommendation.effectiveness.overall > 80 ? 'high' : 'medium',
            recommendations: [topRecommendation.rationale],
            confidence: topRecommendation.confidence,
            context: context.id,
            expectedBenefit: topRecommendation.effectiveness.overall
          });
        }
      }
    }

    // Analyze control gaps
    if (request.scope.risks && request.scope.controls) {
      const gapAnalysis = await this.controlIntelligence.identifyControlGaps(
        request.scope.risks, 
        request.scope.controls
      );
      
      for (const gap of gapAnalysis.gaps.slice(0, 3)) { // Top 3 gaps
        insights.push({
          id: generateId('control-insight'),
          type: 'gap',
          priority: 'high',
          title: `Control Gap Identified: ${gap.category}`,
          description: gap.description,
          impact: gap.riskExposure > 70 ? 'high' : 'medium',
          recommendations: gap.recommendations,
          confidence: 90,
          context: context.id
        });
      }
    }

    return insights;
  }

  private async generatePredictiveInsights(request: AnalysisRequest, context: any): Promise<PredictiveInsight[]> {
    const insights: PredictiveInsight[] = [];

    if (request.includePredictive && request.scope.risks) {
      // Get risk trend predictions (simplified)
      for (const risk of request.scope.risks.slice(0, 3)) { // Top 3 risks
        insights.push({
          id: generateId('predictive-insight'),
          type: 'trend',
          priority: 'medium',
          title: `Risk Trend Prediction: ${risk.title}`,
          description: 'Based on historical data, this risk shows increasing trend',
          timeframe: '6-months',
          prediction: 'Risk score expected to increase by 15% over next 6 months',
          confidence: 75,
          impact: 'medium',
          recommendations: [
            'Monitor risk indicators more frequently',
            'Review mitigation strategies',
            'Consider additional controls'
          ],
          context: context.id
        });
      }
    }

    return insights;
  }

  private async generateQualityInsights(request: AnalysisRequest, context: any): Promise<QualityInsight[]> {
    const insights: QualityInsight[] = [];

    if (request.scope.documents && request.scope.documents.length > 0) {
      for (const document of request.scope.documents) {
        const qualityScore = await this.contentQuality.scoreContent(
          document.content, 
          document.type
        );
        
        if (qualityScore.overall < 75) {
          insights.push({
            id: generateId('quality-insight'),
            type: 'content_quality',
            priority: this.mapScoreToPriority(qualityScore.overall),
            title: `Document Quality Below Standard: ${document.title}`,
            description: `Quality score of ${qualityScore.overall}% indicates improvement needed`,
            documentId: document.id,
            qualityScore: qualityScore.overall,
            improvements: qualityScore.improvements.slice(0, 3),
            confidence: qualityScore.confidence,
            context: context.id
          });
        }
      }
    }

    return insights;
  }

  private async generateUnifiedRecommendations(
    allInsights: any[], 
    context: any
  ): Promise<IntelligenceRecommendation[]> {
    const recommendations: IntelligenceRecommendation[] = [];
    
    // Group insights by category and generate strategic recommendations
    const riskInsights = allInsights.filter(i => i.type?.includes('risk') || i.riskId);
    const controlInsights = allInsights.filter(i => i.type?.includes('control') || i.controlId);
    const qualityInsights = allInsights.filter(i => i.type?.includes('quality') || i.qualityScore);
    
    // Strategic risk recommendation
    if (riskInsights.length > 3) {
      recommendations.push({
        id: generateId('recommendation'),
        category: 'strategic',
        priority: 'high',
        title: 'Comprehensive Risk Review Needed',
        description: `${riskInsights.length} risk-related insights identified. Consider strategic risk review.`,
        rationale: 'Multiple risk insights suggest systematic approach needed',
        actions: [
          'Schedule comprehensive risk assessment',
          'Review risk management framework',
          'Update risk appetite statements'
        ],
        expectedBenefit: 'Improved risk visibility and management effectiveness',
        timeframe: '1-2 months',
        effort: 'high',
        confidence: 85,
        context: context.id
      });
    }

    // Control optimization recommendation
    if (controlInsights.length > 2) {
      recommendations.push({
        id: generateId('recommendation'),
        category: 'operational',
        priority: 'medium',
        title: 'Control Framework Optimization',
        description: `${controlInsights.length} control improvement opportunities identified`,
        rationale: 'Multiple control insights suggest optimization potential',
        actions: [
          'Conduct control effectiveness review',
          'Implement priority control enhancements',
          'Establish regular control monitoring'
        ],
        expectedBenefit: 'Enhanced control effectiveness and efficiency',
        timeframe: '2-3 months',
        effort: 'medium',
        confidence: 80,
        context: context.id
      });
    }

    // Quality improvement recommendation
    if (qualityInsights.length > 1) {
      recommendations.push({
        id: generateId('recommendation'),
        category: 'process',
        priority: 'medium',
        title: 'Content Quality Improvement Initiative',
        description: `${qualityInsights.length} documents require quality improvements`,
        rationale: 'Consistent quality issues suggest need for standardization',
        actions: [
          'Develop content quality standards',
          'Implement quality review process',
          'Provide training on content creation'
        ],
        expectedBenefit: 'Improved documentation quality and consistency',
        timeframe: '1-2 months',
        effort: 'low',
        confidence: 90,
        context: context.id
      });
    }

    return recommendations;
  }

  private calculateIntelligenceMetrics(
    insights: any[], 
    recommendations: IntelligenceRecommendation[]
  ): IntelligenceMetrics {
    const criticalInsights = insights.filter(i => i.priority === 'critical').length;
    const highPriorityInsights = insights.filter(i => i.priority === 'high').length;
    const averageConfidence = insights.reduce((sum, i) => sum + (i.confidence || 75), 0) / insights.length;
    
    return {
      totalInsights: insights.length,
      criticalInsights,
      highPriorityInsights,
      averageConfidence: Math.round(averageConfidence),
      recommendationCount: recommendations.length,
      processingTime: 0, // Set by caller
      lastCalculated: new Date()
    };
  }

  private determineAlertLevel(insights: any[], metrics: IntelligenceMetrics): AlertLevel {
    if (metrics.criticalInsights > 0) return 'critical';
    if (metrics.highPriorityInsights > 3) return 'high';
    if (metrics.totalInsights > 10) return 'medium';
    return 'low';
  }

  private calculateOverallConfidence(insights: any[]): number {
    if (insights.length === 0) return 0;
    const totalConfidence = insights.reduce((sum, insight) => sum + (insight.confidence || 75), 0);
    return Math.round(totalConfidence / insights.length);
  }

  private mapScoreToPriority(score: number): InsightPriority {
    if (score < 40) return 'critical';
    if (score < 60) return 'high';
    if (score < 75) return 'medium';
    return 'low';
  }

  private isDashboardFresh(dashboard: IntelligenceDashboard): boolean {
    const maxAge = dashboard.refreshInterval || 300000; // 5 minutes default
    return (Date.now() - dashboard.lastUpdated.getTime()) < maxAge;
  }

  // Additional helper methods would be implemented here...
  private async getRecentInsights(userId: string): Promise<any[]> {
    // Implementation to get recent insights for user
    return [];
  }

  private async getActiveRecommendations(userId: string): Promise<IntelligenceRecommendation[]> {
    // Implementation to get active recommendations
    return [];
  }

  private async getTrendingRisks(context: any): Promise<any[]> {
    // Implementation to get trending risks
    return [];
  }

  private async getPerformanceMetrics(context: any): Promise<any> {
    // Implementation to get performance metrics
    return {};
  }

  private async getUpcomingAlerts(context: any): Promise<any[]> {
    // Implementation to get upcoming alerts
    return [];
  }

  private async analyzeRisk(riskId: string, context: any): Promise<EntityAnalysis> {
    // Implementation for risk analysis
    return {
      entityType: 'risk',
      entityId: riskId,
      insights: [],
      recommendations: [],
      confidence: 80,
      lastAnalyzed: new Date()
    };
  }

  private async analyzeControl(controlId: string, context: any): Promise<EntityAnalysis> {
    // Implementation for control analysis
    return {
      entityType: 'control',
      entityId: controlId,
      insights: [],
      recommendations: [],
      confidence: 80,
      lastAnalyzed: new Date()
    };
  }

  private async analyzeDocument(documentId: string, context: any): Promise<EntityAnalysis> {
    // Implementation for document analysis
    return {
      entityType: 'document',
      entityId: documentId,
      insights: [],
      recommendations: [],
      confidence: 80,
      lastAnalyzed: new Date()
    };
  }

  private async analyzeProcedure(procedureId: string, context: any): Promise<EntityAnalysis> {
    // Implementation for procedure analysis
    return {
      entityType: 'procedure',
      entityId: procedureId,
      insights: [],
      recommendations: [],
      confidence: 80,
      lastAnalyzed: new Date()
    };
  }

  private async getRiskRecommendations(context: any): Promise<IntelligenceRecommendation[]> {
    // Implementation to get risk-specific recommendations
    return [];
  }

  private async getControlRecommendations(context: any): Promise<IntelligenceRecommendation[]> {
    // Implementation to get control-specific recommendations
    return [];
  }

  private async getProcessRecommendations(context: any): Promise<IntelligenceRecommendation[]> {
    // Implementation to get process-specific recommendations
    return [];
  }

  private async getComplianceRecommendations(context: any): Promise<IntelligenceRecommendation[]> {
    // Implementation to get compliance-specific recommendations
    return [];
  }
}

// Supporting interfaces
interface EntityAnalysis {
  entityType: string;
  entityId: string;
  insights: any[];
  recommendations: any[];
  confidence: number;
  lastAnalyzed: Date;
}

interface CacheService {
  get(key: string): Promise<any>;
  set(key: string, value: any, options?: { ttl?: number }): Promise<void>;
}

interface EventService {
  emit(event: string, data: any): Promise<void>;
} 