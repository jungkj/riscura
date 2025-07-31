import { Risk, Control, Document } from '@/types';
import { AgentType } from '@/types/ai.types';

// Enhanced context interfaces
export interface IntelligentContext {
  user: UserContext;
  organizational: OrganizationalContext;
  current: CurrentContext;
  related: RelatedContext;
  analytics: AnalyticsContext;
  preferences: UserPreferences;
}

export interface UserContext {
  id: string;
  role: string;
  department: string;
  responsibilities: string[];
  expertise: string[];
  recentActivity: ActivityContext[];
  workingHours: {
    timezone: string;
    schedule: Record<string, { start: string; end: string }>;
  };
}

export interface OrganizationalContext {
  companyProfile: {
    name: string;
    industry: string;
    size: 'small' | 'medium' | 'large' | 'enterprise';
    locations: string[];
    regulations: string[];
  };
  riskFramework: {
    methodology: string;
    categories: string[];
    riskAppetite: string;
    toleranceLevel: string;
  };
  complianceRequirements: {
    frameworks: string[];
    jurisdictions: string[];
    mandatory: string[];
    voluntary: string[];
  };
}

export interface CurrentContext {
  page: string;
  section: string;
  action: string;
  selectedEntities: {
    risks: Risk[];
    controls: Control[];
    documents: Document[];
  };
  workingSet: {
    riskIds: string[];
    controlIds: string[];
    documentIds: string[];
  };
  activeFilters: Record<string, unknown>;
  viewMode: string;
}

export interface RelatedContext {
  similarRisks: Risk[];
  relatedControls: Control[];
  dependentEntities: {
    upstreamRisks: Risk[];
    downstreamControls: Control[];
    associatedDocuments: Document[];
  };
  historicalInteractions: HistoricalContext[];
  patterns: PatternContext[];
}

export interface AnalyticsContext {
  riskTrends: TrendData[];
  controlEffectiveness: EffectivenessData[];
  complianceStatus: ComplianceData[];
  kpiMetrics: KPIData[];
  benchmarkData: BenchmarkData[];
}

export interface ActivityContext {
  timestamp: Date;
  action: string;
  entityType: 'risk' | 'control' | 'document';
  entityId: string;
  context: Record<string, unknown>;
}

export interface HistoricalContext {
  conversationId: string;
  timestamp: Date;
  agentType: AgentType;
  topic: string;
  outcome: string;
  satisfaction: number;
}

export interface PatternContext {
  type: 'risk_correlation' | 'control_gap' | 'compliance_issue' | 'efficiency_opportunity';
  description: string;
  confidence: number;
  recommendation: string;
  impact: 'low' | 'medium' | 'high';
}

export interface UserPreferences {
  communicationStyle: 'concise' | 'detailed' | 'analytical' | 'conversational';
  detailLevel: 'brief' | 'standard' | 'comprehensive';
  includeExamples: boolean;
  includeReferences: boolean;
  visualPreference: 'text' | 'charts' | 'mixed';
  languageLevel: 'technical' | 'business' | 'executive';
}

export interface TrendData {
  period: string;
  metric: string;
  value: number;
  change: number;
  direction: 'up' | 'down' | 'stable';
}

export interface EffectivenessData {
  controlId: string;
  controlName: string;
  effectiveness: number;
  trend: 'improving' | 'declining' | 'stable';
  lastTested: Date;
}

export interface ComplianceData {
  framework: string;
  requirement: string;
  status: 'compliant' | 'non_compliant' | 'partial' | 'not_assessed';
  lastAssessment: Date;
  nextDue: Date;
}

export interface KPIData {
  name: string;
  current: number;
  target: number;
  status: 'on_track' | 'at_risk' | 'behind';
  trend: TrendData[];
}

export interface BenchmarkData {
  metric: string;
  userValue: number;
  industryAverage: number;
  bestPractice: number;
  percentile: number;
}

// Context analysis and injection
export interface ContextAnalysisResult {
  relevanceScore: number;
  keyInsights: string[];
  recommendations: string[];
  dataQuality: 'high' | 'medium' | 'low';
  completeness: number;
  freshness: number;
}

export interface ContextInjectionOptions {
  maxTokens: number;
  prioritizeRecent: boolean;
  includeAnalytics: boolean;
  includeRelated: boolean;
  summarizationLevel: 'minimal' | 'moderate' | 'comprehensive';
  agentType: AgentType;
}

export interface SmartContextSuggestion {
  id: string;
  type: 'data_insight' | 'missing_context' | 'related_entity' | 'action_item' | 'efficiency_tip';
  title: string;
  description: string;
  relevanceScore: number;
  actionRequired: boolean;
  quickAction?: {
    label: string;
    action: () => Promise<void>;
  };
  metadata: Record<string, unknown>;
}

export class ContextIntelligenceService {
  private contexts: Map<string, IntelligentContext> = new Map();
  private contextHistory: Map<string, HistoricalContext[]> = new Map();
  private patternCache: Map<string, PatternContext[]> = new Map();
  private suggestionCache: Map<string, SmartContextSuggestion[]> = new Map();

  constructor() {
    this.initializeService();
  }

  private initializeService(): void {
    // Initialize context intelligence service
    console.log('ContextIntelligenceService initialized');
  }

  /**
   * Get comprehensive context for AI prompt injection
   */
  async getIntelligentContext(
    userId: string,
    currentPage: string,
    selectedEntities: {
      risks?: Risk[];
      controls?: Control[];
      documents?: Document[];
    },
    options: Partial<ContextInjectionOptions> = {}
  ): Promise<IntelligentContext> {
    const defaultOptions: ContextInjectionOptions = {
      maxTokens: 4000,
      prioritizeRecent: true,
      includeAnalytics: true,
      includeRelated: true,
      summarizationLevel: 'moderate',
      agentType: 'general_assistant',
      ...options,
    };

    const context: IntelligentContext = {
      user: await this.getUserContext(userId),
      organizational: await this.getOrganizationalContext(userId),
      current: await this.getCurrentContext(currentPage, selectedEntities),
      related: await this.getRelatedContext(selectedEntities, defaultOptions),
      analytics: await this.getAnalyticsContext(selectedEntities, defaultOptions),
      preferences: await this.getUserPreferences(userId),
    };

    // Cache the context for future reference
    this.contexts.set(userId, context);

    return context;
  }

  /**
   * Analyze context relevance and quality
   */
  async analyzeContext(
    context: IntelligentContext,
    query: string,
    agentType: AgentType
  ): Promise<ContextAnalysisResult> {
    const relevanceScore = await this.calculateRelevanceScore(context, query, agentType);
    const keyInsights = await this.extractKeyInsights(context, query);
    const recommendations = await this.generateContextRecommendations(context, agentType);
    const dataQuality = this.assessDataQuality(context);
    const completeness = this.calculateCompleteness(context);
    const freshness = this.calculateFreshness(context);

    return {
      relevanceScore,
      keyInsights,
      recommendations,
      dataQuality,
      completeness,
      freshness,
    };
  }

  /**
   * Generate smart context for AI prompt injection
   */
  async generateSmartContext(
    context: IntelligentContext,
    query: string,
    agentType: AgentType,
    options: ContextInjectionOptions
  ): Promise<string> {
    const analysis = await this.analyzeContext(context, query, agentType);

    if (analysis.relevanceScore < 0.3) {
      return this.generateMinimalContext(context, options);
    }

    switch (options.summarizationLevel) {
      case 'minimal':
        return this.generateMinimalContext(context, options);
      case 'moderate':
        return this.generateModerateContext(context, analysis, options);
      case 'comprehensive':
        return this.generateComprehensiveContext(context, analysis, options);
      default:
        return this.generateModerateContext(context, analysis, options);
    }
  }

  /**
   * Get smart context suggestions
   */
  async getSmartSuggestions(
    userId: string,
    context: IntelligentContext,
    currentQuery?: string
  ): Promise<SmartContextSuggestion[]> {
    const cacheKey = `${userId}_${context.current.page}_${context.current.section}`;

    if (this.suggestionCache.has(cacheKey)) {
      return this.suggestionCache.get(cacheKey)!;
    }

    const suggestions: SmartContextSuggestion[] = [];

    // Data insight suggestions
    suggestions.push(...(await this.generateDataInsightSuggestions(context)));

    // Missing context suggestions
    suggestions.push(...(await this.generateMissingContextSuggestions(context)));

    // Related entity suggestions
    suggestions.push(...(await this.generateRelatedEntitySuggestions(context)));

    // Action item suggestions
    suggestions.push(...(await this.generateActionItemSuggestions(context)));

    // Efficiency tip suggestions
    suggestions.push(...(await this.generateEfficiencySuggestions(context)));

    // Sort by relevance score
    suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Cache for 5 minutes
    this.suggestionCache.set(cacheKey, suggestions);
    setTimeout(() => this.suggestionCache.delete(cacheKey), 5 * 60 * 1000);

    return suggestions.slice(0, 10); // Return top 10
  }

  /**
   * Update context based on user interaction
   */
  async updateContext(userId: string, activity: ActivityContext): Promise<void> {
    const context = this.contexts.get(userId);
    if (!context) return;

    // Add to recent activity
    context.user.recentActivity.unshift(activity);

    // Keep only last 50 activities
    context.user.recentActivity = context.user.recentActivity.slice(0, 50);

    // Update patterns
    await this.updatePatterns(userId, activity);

    // Update context cache
    this.contexts.set(userId, context);
  }

  /**
   * Persist conversation context
   */
  async persistConversationContext(
    userId: string,
    conversationId: string,
    context: IntelligentContext,
    agentType: AgentType,
    topic: string
  ): Promise<void> {
    const historicalContext: HistoricalContext = {
      conversationId,
      timestamp: new Date(),
      agentType,
      topic,
      outcome: 'in_progress',
      satisfaction: 0,
    };

    const history = this.contextHistory.get(userId) || [];
    history.unshift(historicalContext);

    // Keep only last 100 conversations
    this.contextHistory.set(userId, history.slice(0, 100));

    // Store in localStorage for persistence
    localStorage.setItem(
      `aria_context_${userId}`,
      JSON.stringify({
        context,
        timestamp: new Date().toISOString(),
      })
    );
  }

  /**
   * Load persisted context
   */
  async loadPersistedContext(userId: string): Promise<IntelligentContext | null> {
    try {
      const stored = localStorage.getItem(`aria_context_${userId}`);
      if (!stored) return null;

      const { context, timestamp } = JSON.parse(stored);
      const storedTime = new Date(timestamp);
      const now = new Date();

      // Context expires after 24 hours
      if (now.getTime() - storedTime.getTime() > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(`aria_context_${userId}`);
        return null;
      }

      return context;
    } catch (error) {
      console.error('Error loading persisted context:', error);
      return null;
    }
  }

  // Private helper methods
  private async getUserContext(userId: string): Promise<UserContext> {
    // In a real implementation, this would fetch from user service
    return {
      id: userId,
      role: 'Risk Manager',
      department: 'Risk Management',
      responsibilities: ['Risk Assessment', 'Control Design', 'Compliance Monitoring'],
      expertise: ['Financial Risk', 'Operational Risk', 'Regulatory Compliance'],
      recentActivity: [],
      workingHours: {
        timezone: 'UTC',
        schedule: {
          monday: { start: '09:00', end: '17:00' },
          tuesday: { start: '09:00', end: '17:00' },
          wednesday: { start: '09:00', end: '17:00' },
          thursday: { start: '09:00', end: '17:00' },
          friday: { start: '09:00', end: '17:00' },
        },
      },
    };
  }

  private async getOrganizationalContext(userId: string): Promise<OrganizationalContext> {
    // In a real implementation, this would fetch from organization service
    return {
      companyProfile: {
        name: 'Example Corp',
        industry: 'Financial Services',
        size: 'large',
        locations: ['New York', 'London', 'Singapore'],
        regulations: ['SOX', 'GDPR', 'Basel III', 'MiFID II'],
      },
      riskFramework: {
        methodology: 'COSO ERM',
        categories: ['Strategic', 'Operational', 'Financial', 'Compliance'],
        riskAppetite: 'Conservative',
        toleranceLevel: 'Low to Moderate',
      },
      complianceRequirements: {
        frameworks: ['ISO 27001', 'SOC 2', 'PCI DSS'],
        jurisdictions: ['US', 'EU', 'APAC'],
        mandatory: ['SOX', 'GDPR'],
        voluntary: ['ISO 27001', 'NIST'],
      },
    };
  }

  private async getCurrentContext(
    currentPage: string,
    selectedEntities: {
      risks?: Risk[];
      controls?: Control[];
      documents?: Document[];
    }
  ): Promise<CurrentContext> {
    return {
      page: currentPage,
      section: this.extractSection(currentPage),
      action: this.extractAction(currentPage),
      selectedEntities: {
        risks: selectedEntities.risks || [],
        controls: selectedEntities.controls || [],
        documents: selectedEntities.documents || [],
      },
      workingSet: {
        riskIds: selectedEntities.risks?.map((r) => r.id) || [],
        controlIds: selectedEntities.controls?.map((c) => c.id) || [],
        documentIds: selectedEntities.documents?.map((d) => d.id) || [],
      },
      activeFilters: {},
      viewMode: 'list',
    };
  }

  private async getRelatedContext(
    selectedEntities: {
      risks?: Risk[];
      controls?: Control[];
      documents?: Document[];
    },
    options: ContextInjectionOptions
  ): Promise<RelatedContext> {
    // Mock implementation - in reality, this would use graph algorithms
    return {
      similarRisks: [],
      relatedControls: [],
      dependentEntities: {
        upstreamRisks: [],
        downstreamControls: [],
        associatedDocuments: [],
      },
      historicalInteractions: [],
      patterns: [],
    };
  }

  private async getAnalyticsContext(
    selectedEntities: {
      risks?: Risk[];
      controls?: Control[];
      documents?: Document[];
    },
    options: ContextInjectionOptions
  ): Promise<AnalyticsContext> {
    // Mock implementation - in reality, this would fetch real analytics
    return {
      riskTrends: [],
      controlEffectiveness: [],
      complianceStatus: [],
      kpiMetrics: [],
      benchmarkData: [],
    };
  }

  private async getUserPreferences(userId: string): Promise<UserPreferences> {
    // Load from user preferences or use defaults
    return {
      communicationStyle: 'detailed',
      detailLevel: 'standard',
      includeExamples: true,
      includeReferences: true,
      visualPreference: 'mixed',
      languageLevel: 'business',
    };
  }

  private async calculateRelevanceScore(
    context: IntelligentContext,
    query: string,
    agentType: AgentType
  ): Promise<number> {
    // Simple relevance calculation - in reality, this would be more sophisticated
    let score = 0.5;

    // Check for entity matches
    if (context.current.selectedEntities.risks.length > 0) score += 0.2;
    if (context.current.selectedEntities.controls.length > 0) score += 0.2;

    // Check for recent activity
    if (context.user.recentActivity.length > 0) score += 0.1;

    return Math.min(score, 1.0);
  }

  private async extractKeyInsights(context: IntelligentContext, query: string): Promise<string[]> {
    const insights: string[] = [];

    if (context.current.selectedEntities.risks.length > 0) {
      insights.push(`Currently analyzing ${context.current.selectedEntities.risks.length} risk(s)`);
    }

    if (context.current.selectedEntities.controls.length > 0) {
      insights.push(`Working with ${context.current.selectedEntities.controls.length} control(s)`);
    }

    return insights;
  }

  private async generateContextRecommendations(
    context: IntelligentContext,
    agentType: AgentType
  ): Promise<string[]> {
    const recommendations: string[] = [];

    switch (agentType) {
      case 'risk_analyzer':
        if (context.current.selectedEntities.risks.length === 0) {
          recommendations.push('Consider selecting specific risks for more targeted analysis');
        }
        break;
      case 'control_advisor':
        if (context.current.selectedEntities.controls.length === 0) {
          recommendations.push('Select controls to receive specific recommendations');
        }
        break;
    }

    return recommendations;
  }

  private assessDataQuality(context: IntelligentContext): 'high' | 'medium' | 'low' {
    // Simple assessment - in reality, this would be more sophisticated
    const hasSelectedEntities =
      context.current.selectedEntities.risks.length > 0 ||
      context.current.selectedEntities.controls.length > 0;

    return hasSelectedEntities ? 'high' : 'medium';
  }

  private calculateCompleteness(context: IntelligentContext): number {
    let score = 0;

    if (context.user.id) score += 0.2;
    if (context.organizational.companyProfile.name) score += 0.2;
    if (context.current.selectedEntities.risks.length > 0) score += 0.2;
    if (context.current.selectedEntities.controls.length > 0) score += 0.2;
    if (context.user.recentActivity.length > 0) score += 0.2;

    return score;
  }

  private calculateFreshness(context: IntelligentContext): number {
    // Calculate based on how recent the data is
    const now = new Date();
    let totalFreshness = 0;
    let count = 0;

    context.user.recentActivity.forEach((activity) => {
      const age = now.getTime() - activity.timestamp.getTime();
      const hoursSinceActivity = age / (1000 * 60 * 60);
      const freshness = Math.max(0, 1 - hoursSinceActivity / 24); // Decay over 24 hours
      totalFreshness += freshness;
      count++;
    });

    return count > 0 ? totalFreshness / count : 0.5;
  }

  private generateMinimalContext(
    context: IntelligentContext,
    options: ContextInjectionOptions
  ): string {
    const parts: string[] = [];

    if (context.current.selectedEntities.risks.length > 0) {
      parts.push(
        `Current risks: ${context.current.selectedEntities.risks.map((r) => r.title).join(', ')}`
      );
    }

    if (context.current.selectedEntities.controls.length > 0) {
      parts.push(
        `Current controls: ${context.current.selectedEntities.controls.map((c) => c.title).join(', ')}`
      );
    }

    parts.push(`User role: ${context.user.role}`);
    parts.push(
      `Company: ${context.organizational.companyProfile.name} (${context.organizational.companyProfile.industry})`
    );

    return parts.join('\n');
  }

  private generateModerateContext(
    context: IntelligentContext,
    analysis: ContextAnalysisResult,
    options: ContextInjectionOptions
  ): string {
    const parts: string[] = [];

    // User context
    parts.push(`User Context:`);
    parts.push(`- Role: ${context.user.role} in ${context.user.department}`);
    parts.push(`- Expertise: ${context.user.expertise.join(', ')}`);

    // Current context
    if (context.current.selectedEntities.risks.length > 0) {
      parts.push(`\nCurrent Risks:`);
      context.current.selectedEntities.risks.forEach((risk) => {
        parts.push(`- ${risk.title} (${risk.category}, Score: ${risk.riskScore})`);
      });
    }

    if (context.current.selectedEntities.controls.length > 0) {
      parts.push(`\nCurrent Controls:`);
      context.current.selectedEntities.controls.forEach((control) => {
        parts.push(
          `- ${control.title} (${control.type}, Effectiveness: ${control.effectiveness}%)`
        );
      });
    }

    // Organizational context
    parts.push(`\nOrganizational Context:`);
    parts.push(`- Company: ${context.organizational.companyProfile.name}`);
    parts.push(`- Industry: ${context.organizational.companyProfile.industry}`);
    parts.push(`- Risk Framework: ${context.organizational.riskFramework.methodology}`);
    parts.push(
      `- Key Regulations: ${context.organizational.complianceRequirements.mandatory.join(', ')}`
    );

    // Key insights
    if (analysis.keyInsights.length > 0) {
      parts.push(`\nKey Insights:`);
      analysis.keyInsights.forEach((insight) => parts.push(`- ${insight}`));
    }

    return parts.join('\n');
  }

  private generateComprehensiveContext(
    context: IntelligentContext,
    analysis: ContextAnalysisResult,
    options: ContextInjectionOptions
  ): string {
    // Start with moderate context
    const comprehensiveContext = this.generateModerateContext(context, analysis, options);

    const additionalParts: string[] = [];

    // Recent activity
    if (context.user.recentActivity.length > 0) {
      additionalParts.push(`\nRecent Activity:`);
      context.user.recentActivity.slice(0, 5).forEach((activity) => {
        additionalParts.push(
          `- ${activity.action} on ${activity.entityType} (${activity.timestamp.toLocaleDateString()})`
        );
      });
    }

    // Analytics if available
    if (options.includeAnalytics && context.analytics.riskTrends.length > 0) {
      additionalParts.push(`\nRisk Trends:`);
      context.analytics.riskTrends.slice(0, 3).forEach((trend) => {
        additionalParts.push(`- ${trend.metric}: ${trend.value} (${trend.direction})`);
      });
    }

    // User preferences
    additionalParts.push(`\nUser Preferences:`);
    additionalParts.push(`- Communication Style: ${context.preferences.communicationStyle}`);
    additionalParts.push(`- Detail Level: ${context.preferences.detailLevel}`);
    additionalParts.push(`- Language Level: ${context.preferences.languageLevel}`);

    return comprehensiveContext + additionalParts.join('\n');
  }

  private extractSection(currentPage: string): string {
    // Extract section from page path
    const parts = currentPage.split('/');
    return parts[parts.length - 1] || 'unknown';
  }

  private extractAction(currentPage: string): string {
    // Extract action from page parameters or path
    return 'view'; // Default action
  }

  // Suggestion generation methods
  private async generateDataInsightSuggestions(
    context: IntelligentContext
  ): Promise<SmartContextSuggestion[]> {
    const suggestions: SmartContextSuggestion[] = [];

    if (context.current.selectedEntities.risks.length > 1) {
      suggestions.push({
        id: `insight_${Date.now()}_1`,
        type: 'data_insight',
        title: 'Risk Correlation Analysis',
        description: 'Analyze correlations between selected risks to identify common themes',
        relevanceScore: 0.8,
        actionRequired: false,
        quickAction: {
          label: 'Analyze Correlations',
          action: async () => {
            // Implement correlation analysis
            console.log('Analyzing risk correlations...');
          },
        },
        metadata: { riskCount: context.current.selectedEntities.risks.length },
      });
    }

    return suggestions;
  }

  private async generateMissingContextSuggestions(
    context: IntelligentContext
  ): Promise<SmartContextSuggestion[]> {
    const suggestions: SmartContextSuggestion[] = [];

    if (
      context.current.selectedEntities.risks.length === 0 &&
      context.current.page.includes('risk')
    ) {
      suggestions.push({
        id: `missing_${Date.now()}_1`,
        type: 'missing_context',
        title: 'No Risks Selected',
        description: 'Select specific risks to get more targeted AI assistance',
        relevanceScore: 0.7,
        actionRequired: true,
        quickAction: {
          label: 'Browse Risks',
          action: async () => {
            // Navigate to risk selection
            console.log('Opening risk selection...');
          },
        },
        metadata: { contextType: 'risk_selection' },
      });
    }

    return suggestions;
  }

  private async generateRelatedEntitySuggestions(
    context: IntelligentContext
  ): Promise<SmartContextSuggestion[]> {
    const suggestions: SmartContextSuggestion[] = [];

    if (
      context.current.selectedEntities.risks.length > 0 &&
      context.current.selectedEntities.controls.length === 0
    ) {
      suggestions.push({
        id: `related_${Date.now()}_1`,
        type: 'related_entity',
        title: 'Related Controls Available',
        description: 'There are controls related to your selected risks that might be relevant',
        relevanceScore: 0.6,
        actionRequired: false,
        quickAction: {
          label: 'View Related Controls',
          action: async () => {
            // Show related controls
            console.log('Showing related controls...');
          },
        },
        metadata: { entityType: 'controls' },
      });
    }

    return suggestions;
  }

  private async generateActionItemSuggestions(
    context: IntelligentContext
  ): Promise<SmartContextSuggestion[]> {
    const suggestions: SmartContextSuggestion[] = [];

    // Check for overdue items based on context
    if (context.user.recentActivity.length === 0) {
      suggestions.push({
        id: `action_${Date.now()}_1`,
        type: 'action_item',
        title: 'Review Recent Changes',
        description: 'Check for any recent updates to risks and controls in your area',
        relevanceScore: 0.5,
        actionRequired: true,
        quickAction: {
          label: 'View Recent Changes',
          action: async () => {
            // Show recent changes
            console.log('Showing recent changes...');
          },
        },
        metadata: { actionType: 'review' },
      });
    }

    return suggestions;
  }

  private async generateEfficiencySuggestions(
    context: IntelligentContext
  ): Promise<SmartContextSuggestion[]> {
    const suggestions: SmartContextSuggestion[] = [];

    if (context.current.selectedEntities.risks.length > 5) {
      suggestions.push({
        id: `efficiency_${Date.now()}_1`,
        type: 'efficiency_tip',
        title: 'Bulk Operations Available',
        description: 'Use bulk operations to update multiple risks at once',
        relevanceScore: 0.4,
        actionRequired: false,
        quickAction: {
          label: 'Open Bulk Tools',
          action: async () => {
            // Open bulk operations
            console.log('Opening bulk operations...');
          },
        },
        metadata: { feature: 'bulk_operations' },
      });
    }

    return suggestions;
  }

  private async updatePatterns(userId: string, activity: ActivityContext): Promise<void> {
    // Update pattern analysis based on new activity
    const patterns = this.patternCache.get(userId) || [];

    // Simple pattern detection - in reality, this would be more sophisticated
    if (activity.action === 'view' && activity.entityType === 'risk') {
      // Pattern: frequent risk viewing
      const existingPattern = patterns.find((p) => p.type === 'risk_correlation');
      if (existingPattern) {
        existingPattern.confidence += 0.1;
      } else {
        patterns.push({
          type: 'risk_correlation',
          description: 'User frequently views related risks',
          confidence: 0.1,
          recommendation: 'Consider creating risk correlation dashboard',
          impact: 'medium',
        });
      }
    }

    this.patternCache.set(userId, patterns);
  }
}

export const contextIntelligenceService = new ContextIntelligenceService();
