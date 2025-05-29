import {
  OrganizationContext,
  ContextualInsight,
  ContextUpdate,
  ContextImpact,
  RiskAppetite,
  Industry,
  RegulatoryFramework,
  BusinessObjective,
  Incident,
  DataPoint,
  ComparisonValue
} from '@/types/risk-intelligence.types';
import { Risk, User } from '@/types';
import { generateId } from '@/lib/utils';

export class ContextAwarenessService {
  private readonly userService: UserService;
  private readonly industryService: IndustryService;
  private readonly regulatoryService: RegulatoryService;
  private readonly riskService: RiskService;
  private readonly cacheService: CacheService;

  constructor(
    userService: UserService,
    industryService: IndustryService,
    regulatoryService: RegulatoryService,
    riskService: RiskService,
    cacheService: CacheService
  ) {
    this.userService = userService;
    this.industryService = industryService;
    this.regulatoryService = regulatoryService;
    this.riskService = riskService;
    this.cacheService = cacheService;
  }

  /**
   * Build comprehensive organizational context
   */
  async buildContext(userId: string): Promise<OrganizationContext> {
    try {
      const user = await this.userService.getUser(userId);
      const organizationId = user.organizationId;
      
      // Check cache first
      const cachedContext = await this.cacheService.get(`context:${organizationId}`);
      if (cachedContext && this.isContextFresh(cachedContext)) {
        return cachedContext;
      }

      // Build fresh context
      const industry = await this.getIndustryContext(organizationId);
      const organizationSize = await this.getOrganizationSize(organizationId);
      const riskAppetite = await this.getRiskAppetite(organizationId);
      const regulatoryEnvironment = await this.getRegulatoryEnvironment(organizationId);
      const currentRiskLandscape = await this.getCurrentRiskLandscape(organizationId);
      const historicalIncidents = await this.getHistoricalIncidents(organizationId);
      const businessObjectives = await this.getBusinessObjectives(organizationId);
      const geographicPresence = await this.getGeographicPresence(organizationId);
      const operatingModel = await this.getOperatingModel(organizationId);
      const maturityLevel = await this.assessMaturityLevel(organizationId);

      const context: OrganizationContext = {
        id: generateId('context'),
        industry,
        organizationSize,
        riskAppetite,
        regulatoryEnvironment,
        currentRiskLandscape,
        historicalIncidents,
        businessObjectives,
        geographicPresence,
        operatingModel,
        maturityLevel,
        lastUpdated: new Date()
      };

      // Cache the context
      await this.cacheService.set(`context:${organizationId}`, context, { ttl: 3600 }); // 1 hour TTL
      
      return context;
      
    } catch (error) {
      console.error('Error building context:', error);
      throw new Error('Failed to build organizational context');
    }
  }

  /**
   * Update context with new changes
   */
  async updateContext(context: OrganizationContext, changes: ContextUpdate): Promise<OrganizationContext> {
    try {
      const updatedContext = { ...context };

      switch (changes.type) {
        case 'risk_change':
          updatedContext.currentRiskLandscape = await this.getCurrentRiskLandscape(context.id);
          break;
        
        case 'control_change':
          // Update control-related context
          break;
        
        case 'incident':
          updatedContext.historicalIncidents = await this.getHistoricalIncidents(context.id);
          break;
        
        case 'regulatory_change':
          updatedContext.regulatoryEnvironment = await this.getRegulatoryEnvironment(context.id);
          break;
        
        case 'business_change':
          updatedContext.businessObjectives = await this.getBusinessObjectives(context.id);
          break;
      }

      updatedContext.lastUpdated = new Date();
      
      // Update cache
      await this.cacheService.set(`context:${context.id}`, updatedContext, { ttl: 3600 });
      
      return updatedContext;
      
    } catch (error) {
      console.error('Error updating context:', error);
      throw new Error('Failed to update context');
    }
  }

  /**
   * Get relevant insights based on context
   */
  async getRelevantInsights(context: OrganizationContext): Promise<ContextualInsight[]> {
    try {
      const insights: ContextualInsight[] = [];

      // Industry trend insights
      const industryInsights = await this.getIndustryInsights(context);
      insights.push(...industryInsights);

      // Risk landscape insights
      const riskInsights = await this.getRiskLandscapeInsights(context);
      insights.push(...riskInsights);

      // Regulatory insights
      const regulatoryInsights = await this.getRegulatoryInsights(context);
      insights.push(...regulatoryInsights);

      // Performance insights
      const performanceInsights = await this.getPerformanceInsights(context);
      insights.push(...performanceInsights);

      // Benchmark insights
      const benchmarkInsights = await this.getBenchmarkInsights(context);
      insights.push(...benchmarkInsights);

      // Sort by relevance and urgency
      return insights
        .sort((a, b) => (b.relevance * this.getUrgencyWeight(b.urgency)) - 
                       (a.relevance * this.getUrgencyWeight(a.urgency)))
        .slice(0, 20); // Limit to top 20 insights
      
    } catch (error) {
      console.error('Error getting relevant insights:', error);
      throw new Error('Failed to get relevant insights');
    }
  }

  // Private helper methods
  private async getIndustryContext(organizationId: string): Promise<Industry> {
    return await this.industryService.getIndustryForOrganization(organizationId);
  }

  private async getOrganizationSize(organizationId: string): Promise<'startup' | 'small' | 'medium' | 'large' | 'enterprise'> {
    const metrics = await this.userService.getOrganizationMetrics(organizationId);
    
    if (metrics.employeeCount < 10) return 'startup';
    if (metrics.employeeCount < 50) return 'small';
    if (metrics.employeeCount < 250) return 'medium';
    if (metrics.employeeCount < 1000) return 'large';
    return 'enterprise';
  }

  private async getRiskAppetite(organizationId: string): Promise<RiskAppetite> {
    return await this.riskService.getRiskAppetite(organizationId);
  }

  private async getRegulatoryEnvironment(organizationId: string): Promise<RegulatoryFramework[]> {
    return await this.regulatoryService.getApplicableFrameworks(organizationId);
  }

  private async getCurrentRiskLandscape(organizationId: string): Promise<Risk[]> {
    return await this.riskService.getRisksByOrganization(organizationId);
  }

  private async getHistoricalIncidents(organizationId: string): Promise<Incident[]> {
    return await this.riskService.getIncidentsByOrganization(organizationId);
  }

  private async getBusinessObjectives(organizationId: string): Promise<BusinessObjective[]> {
    return await this.userService.getBusinessObjectives(organizationId);
  }

  private async getGeographicPresence(organizationId: string): Promise<('north_america' | 'europe' | 'asia_pacific' | 'latin_america' | 'middle_east_africa')[]> {
    const presence = await this.userService.getGeographicPresence(organizationId);
    return presence.map(p => p.region);
  }

  private async getOperatingModel(organizationId: string): Promise<any> {
    return await this.userService.getOperatingModel(organizationId);
  }

  private async assessMaturityLevel(organizationId: string): Promise<'initial' | 'developing' | 'defined' | 'managed' | 'optimizing'> {
    const assessment = await this.riskService.getMaturityAssessment(organizationId);
    return assessment.overallLevel;
  }

  private isContextFresh(context: OrganizationContext): boolean {
    const maxAge = 3600000; // 1 hour in milliseconds
    return (Date.now() - context.lastUpdated.getTime()) < maxAge;
  }

  private async getIndustryInsights(context: OrganizationContext): Promise<ContextualInsight[]> {
    const insights: ContextualInsight[] = [];
    
    const industryTrends = await this.industryService.getTrends(context.industry.code);
    
    for (const trend of industryTrends) {
      if (trend.relevanceScore > 70) {
        insights.push({
          id: generateId('insight'),
          type: 'trend',
          title: `Industry Trend: ${trend.title}`,
          description: trend.description,
          relevance: trend.relevanceScore,
          urgency: this.mapTrendUrgency(trend.timeframe),
          category: trend.category,
          insights: trend.keyInsights,
          recommendations: trend.recommendations,
          dataPoints: this.convertTrendToDataPoints(trend),
          confidence: trend.confidence,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        });
      }
    }
    
    return insights;
  }

  private async getRiskLandscapeInsights(context: OrganizationContext): Promise<ContextualInsight[]> {
    const insights: ContextualInsight[] = [];
    
    // Analyze risk concentration
    const risksByCategory = this.groupRisksByCategory(context.currentRiskLandscape);
    
    for (const [category, risks] of Object.entries(risksByCategory)) {
      if (risks.length > 5) { // High concentration threshold
        insights.push({
          id: generateId('insight'),
          type: 'anomaly',
          title: `High Risk Concentration in ${category}`,
          description: `${risks.length} risks identified in ${category} category, indicating potential concentration risk`,
          relevance: 85,
          urgency: 'medium',
          category: category as any,
          insights: [
            `${risks.length} risks in ${category}`,
            `Average risk score: ${this.calculateAverageRiskScore(risks)}`,
            `Concentration represents ${Math.round((risks.length / context.currentRiskLandscape.length) * 100)}% of total risks`
          ],
          recommendations: [
            'Consider diversifying risk mitigation strategies',
            'Review potential common causes across risks',
            'Assess correlation between risks in this category'
          ],
          dataPoints: [{
            metric: 'Risk Count',
            value: risks.length,
            comparison: {
              baseline: 3,
              industry: 4,
              benchmark: 5,
              trend: risks.length
            },
            trend: 'increasing',
            significance: 75
          }],
          confidence: 90
        });
      }
    }
    
    return insights;
  }

  private async getRegulatoryInsights(context: OrganizationContext): Promise<ContextualInsight[]> {
    const insights: ContextualInsight[] = [];
    
    for (const framework of context.regulatoryEnvironment) {
      if (framework.changeFrequency === 'high') {
        insights.push({
          id: generateId('insight'),
          type: 'threat',
          title: `High Regulatory Change Risk: ${framework.name}`,
          description: `${framework.name} has high change frequency, requiring continuous monitoring`,
          relevance: framework.applicability,
          urgency: 'high',
          category: 'compliance',
          insights: [
            `Change frequency: ${framework.changeFrequency}`,
            `Applicability: ${framework.applicability}%`,
            `Complexity: ${framework.complexity}/100`
          ],
          recommendations: [
            'Establish dedicated monitoring for this framework',
            'Consider regulatory change management process',
            'Regular compliance assessment updates'
          ],
          dataPoints: [{
            metric: 'Change Frequency',
            value: 3, // High = 3
            comparison: {
              baseline: 1,
              industry: 2,
              benchmark: 1,
              trend: 3
            },
            trend: 'increasing',
            significance: framework.applicability
          }],
          confidence: 85
        });
      }
    }
    
    return insights;
  }

  private async getPerformanceInsights(context: OrganizationContext): Promise<ContextualInsight[]> {
    const insights: ContextualInsight[] = [];
    
    // Analyze risk management performance
    const totalRisks = context.currentRiskLandscape.length;
    const mitigatedRisks = context.currentRiskLandscape.filter(r => r.status === 'mitigated').length;
    const mitigationRate = totalRisks > 0 ? (mitigatedRisks / totalRisks) * 100 : 0;
    
    if (mitigationRate < 60) { // Below benchmark
      insights.push({
        id: generateId('insight'),
        type: 'opportunity',
        title: 'Risk Mitigation Performance Below Benchmark',
        description: `Current mitigation rate of ${Math.round(mitigationRate)}% is below industry benchmark`,
        relevance: 90,
        urgency: 'medium',
        category: 'operational',
        insights: [
          `Current mitigation rate: ${Math.round(mitigationRate)}%`,
          `Industry benchmark: 75%`,
          `Gap: ${Math.round(75 - mitigationRate)}%`
        ],
        recommendations: [
          'Review and prioritize open risk mitigation activities',
          'Assess resource allocation for risk management',
          'Consider process improvements for faster mitigation'
        ],
        dataPoints: [{
          metric: 'Mitigation Rate',
          value: mitigationRate,
          comparison: {
            baseline: 50,
            industry: 75,
            benchmark: 80,
            trend: mitigationRate
          },
          trend: 'stable',
          significance: 85
        }],
        confidence: 95
      });
    }
    
    return insights;
  }

  private async getBenchmarkInsights(context: OrganizationContext): Promise<ContextualInsight[]> {
    const insights: ContextualInsight[] = [];
    
    const benchmarks = await this.industryService.getBenchmarks(context.industry.code);
    
    // Compare risk maturity level
    const maturityBenchmark = benchmarks.riskMaturityLevel;
    const currentMaturity = this.getMaturityScore(context.maturityLevel);
    const benchmarkMaturity = this.getMaturityScore(maturityBenchmark);
    
    if (currentMaturity < benchmarkMaturity) {
      insights.push({
        id: generateId('insight'),
        type: 'benchmark',
        title: 'Risk Maturity Below Industry Average',
        description: `Organization's risk maturity (${context.maturityLevel}) below industry average (${maturityBenchmark})`,
        relevance: 80,
        urgency: 'medium',
        category: 'strategic',
        insights: [
          `Current maturity: ${context.maturityLevel}`,
          `Industry average: ${maturityBenchmark}`,
          `Maturity gap: ${benchmarkMaturity - currentMaturity} levels`
        ],
        recommendations: [
          'Develop risk maturity improvement plan',
          'Invest in risk management capabilities',
          'Benchmark against industry leaders'
        ],
        dataPoints: [{
          metric: 'Maturity Level',
          value: currentMaturity,
          comparison: {
            baseline: 1,
            industry: benchmarkMaturity,
            benchmark: 5,
            trend: currentMaturity
          },
          trend: 'stable',
          significance: 75
        }],
        confidence: 80
      });
    }
    
    return insights;
  }

  private getUrgencyWeight(urgency: string): number {
    switch (urgency) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 2;
    }
  }

  private mapTrendUrgency(timeframe: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (timeframe) {
      case '0-6months': return 'critical';
      case '6-12months': return 'high';
      case '1-2years': return 'medium';
      default: return 'low';
    }
  }

  private convertTrendToDataPoints(trend: any): DataPoint[] {
    return [{
      metric: 'Trend Strength',
      value: trend.strength || 70,
      comparison: {
        baseline: 50,
        industry: 65,
        benchmark: 80,
        trend: trend.strength || 70
      },
      trend: trend.direction || 'increasing',
      significance: trend.relevanceScore || 75
    }];
  }

  private groupRisksByCategory(risks: Risk[]): Record<string, Risk[]> {
    return risks.reduce((groups, risk) => {
      const category = risk.category;
      groups[category] = groups[category] || [];
      groups[category].push(risk);
      return groups;
    }, {} as Record<string, Risk[]>);
  }

  private calculateAverageRiskScore(risks: Risk[]): number {
    if (risks.length === 0) return 0;
    const total = risks.reduce((sum, risk) => sum + risk.riskScore, 0);
    return Math.round(total / risks.length);
  }

  private getMaturityScore(level: string): number {
    switch (level) {
      case 'initial': return 1;
      case 'developing': return 2;
      case 'defined': return 3;
      case 'managed': return 4;
      case 'optimizing': return 5;
      default: return 1;
    }
  }
}

// Supporting service interfaces
interface UserService {
  getUser(userId: string): Promise<User>;
  getOrganizationMetrics(organizationId: string): Promise<any>;
  getBusinessObjectives(organizationId: string): Promise<BusinessObjective[]>;
  getGeographicPresence(organizationId: string): Promise<any[]>;
  getOperatingModel(organizationId: string): Promise<any>;
}

interface IndustryService {
  getIndustryForOrganization(organizationId: string): Promise<Industry>;
  getTrends(industryCode: string): Promise<any[]>;
  getBenchmarks(industryCode: string): Promise<any>;
}

interface RegulatoryService {
  getApplicableFrameworks(organizationId: string): Promise<RegulatoryFramework[]>;
}

interface RiskService {
  getRiskAppetite(organizationId: string): Promise<RiskAppetite>;
  getRisksByOrganization(organizationId: string): Promise<Risk[]>;
  getIncidentsByOrganization(organizationId: string): Promise<Incident[]>;
  getMaturityAssessment(organizationId: string): Promise<any>;
}

interface CacheService {
  get(key: string): Promise<any>;
  set(key: string, value: any, options?: { ttl?: number }): Promise<void>;
} 