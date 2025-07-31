'use client';

import {
  EnhancedRisk,
  AISuggestions,
  BulkOperation,
  BulkUpdateData,
  AdvancedRiskFilters,
  RiskAnalytics,
  RiskIntelligence,
  RiskTemplate,
  MitigationStrategy,
  WorkflowTransition,
  TrendDataPoint,
} from '@/types/enhanced-risk.types';
import { Risk } from '@/types';
import { RiskAnalysisAIService } from './RiskAnalysisAIService';

export class EnhancedRiskService {
  private aiService: RiskAnalysisAIService;

  constructor() {
    this.aiService = new RiskAnalysisAIService();
  }

  // AI-Powered Risk Assessment
  async analyzeRiskWithAI(riskData: Partial<EnhancedRisk>): Promise<AISuggestions> {
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'risk_analysis',
          data: riskData,
          options: {
            includeCategorization: true,
            includeScoring: true,
            includeMitigations: true,
            includeControls: true,
          },
        }),
      });

      const result = await response.json();

      return {
        suggestedCategory: result.suggestedCategory,
        suggestedLikelihood: result.suggestedLikelihood,
        suggestedImpact: result.suggestedImpact,
        suggestedMitigations: result.suggestedMitigations || [],
        suggestedControls: result.suggestedControls || [],
        reasoningExplanation: result.reasoning || 'AI analysis completed',
        confidenceScore: result.confidence || 0.8,
      };
    } catch (error) {
      console.error('AI risk analysis failed:', error);
      return {
        suggestedCategory: undefined,
        suggestedLikelihood: undefined,
        suggestedImpact: undefined,
        suggestedMitigations: [],
        suggestedControls: [],
        reasoningExplanation: 'AI analysis unavailable',
        confidenceScore: 0,
      };
    }
  }

  // Auto-categorization based on description
  async categorizeRisk(description: string, title: string): Promise<string> {
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'categorization',
          data: { description, title },
        }),
      });

      const result = await response.json();
      return result.category || 'operational';
    } catch (error) {
      console.error('Risk categorization failed:', error);
      return 'operational';
    }
  }

  // Generate mitigation strategies using AI
  async generateMitigationStrategies(risk: EnhancedRisk): Promise<MitigationStrategy[]> {
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'mitigation_strategies',
          data: {
            title: risk.title,
            description: risk.description,
            category: risk.category,
            riskScore: risk.riskScore,
            likelihood: risk.likelihood,
            impact: risk.impact,
          },
        }),
      });

      const result = await response.json();

      return (
        result.strategies?.map((strategy: any, index: number) => ({
          id: `strategy-${Date.now()}-${index}`,
          title: strategy.title,
          description: strategy.description,
          type: strategy.type || 'preventive',
          status: 'planned',
          effectiveness: strategy.effectiveness || 70,
          cost: strategy.estimatedCost || 0,
          timeline: strategy.timeline || 30,
          owner: risk.riskOwner,
          controls: strategy.relatedControls || [],
        })) || []
      );
    } catch (error) {
      console.error('Mitigation strategy generation failed:', error);
      return [];
    }
  }

  // Workflow state transitions
  async transitionWorkflowState(
    riskId: string,
    fromState: string,
    toState: string,
    userId: string,
    reason?: string
  ): Promise<WorkflowTransition> {
    const transition: WorkflowTransition = {
      id: `transition-${Date.now()}`,
      fromState,
      toState,
      transitionDate: new Date(),
      userId,
      reason,
      autoTransition: false,
    };

    // Here you would typically update the database
    // For now, we'll return the transition object
    return transition;
  }

  // Bulk operations
  async performBulkOperation(
    operation: BulkOperation
  ): Promise<{ success: boolean; errors?: string[] }> {
    try {
      switch (operation.type) {
        case 'update':
          return await this.bulkUpdate(operation.riskIds, operation.data as BulkUpdateData);
        case 'delete':
          return await this.bulkDelete(operation.riskIds);
        case 'export':
          return await this.bulkExport(operation.riskIds, operation.data);
        case 'approve':
          return await this.bulkApprove(operation.riskIds, operation.userId);
        case 'assign':
          return await this.bulkAssign(operation.riskIds, operation.data);
        default:
          throw new Error(`Unsupported bulk operation: ${operation.type}`);
      }
    } catch (error) {
      console.error('Bulk operation failed:', error);
      return { success: false, errors: [error instanceof Error ? error.message : 'Unknown error'] };
    }
  }

  private async bulkUpdate(
    riskIds: string[],
    updateData: BulkUpdateData
  ): Promise<{ success: boolean }> {
    // Implementation for bulk update
    console.log('Bulk updating risks:', riskIds, updateData);
    return { success: true };
  }

  private async bulkDelete(riskIds: string[]): Promise<{ success: boolean }> {
    // Implementation for bulk delete
    console.log('Bulk deleting risks:', riskIds);
    return { success: true };
  }

  private async bulkExport(riskIds: string[], options: any): Promise<{ success: boolean }> {
    // Implementation for bulk export
    console.log('Bulk exporting risks:', riskIds, options);
    return { success: true };
  }

  private async bulkApprove(riskIds: string[], userId: string): Promise<{ success: boolean }> {
    // Implementation for bulk approve
    console.log('Bulk approving risks:', riskIds, 'by user:', userId);
    return { success: true };
  }

  private async bulkAssign(riskIds: string[], assignmentData: any): Promise<{ success: boolean }> {
    // Implementation for bulk assign
    console.log('Bulk assigning risks:', riskIds, assignmentData);
    return { success: true };
  }

  // Advanced filtering
  filterRisks(risks: EnhancedRisk[], filters: AdvancedRiskFilters): EnhancedRisk[] {
    return risks.filter((risk) => {
      // Category filter
      if (filters.category && filters.category.length > 0) {
        if (!filters.category.includes(risk.category)) return false;
      }

      // Status filter
      if (filters.status && filters.status.length > 0) {
        if (!filters.status.includes(risk.status)) return false;
      }

      // Priority filter
      if (filters.priority && filters.priority.length > 0) {
        if (!filters.priority.includes(risk.priority)) return false;
      }

      // Risk level filter
      if (filters.riskLevel && filters.riskLevel.length > 0) {
        if (!filters.riskLevel.includes(risk.riskLevel || '')) return false;
      }

      // Score range filter
      if (filters.scoreRange) {
        if (risk.riskScore < filters.scoreRange.min || risk.riskScore > filters.scoreRange.max) {
          return false;
        }
      }

      // Date range filter
      if (filters.dateRange) {
        const dateValue = this.getDateFieldValue(risk, filters.dateRange.field);
        if (dateValue) {
          if (dateValue < filters.dateRange.start || dateValue > filters.dateRange.end) {
            return false;
          }
        }
      }

      // AI confidence filter
      if (filters.aiConfidenceRange) {
        if (
          risk.aiConfidence < filters.aiConfidenceRange.min ||
          risk.aiConfidence > filters.aiConfidenceRange.max
        ) {
          return false;
        }
      }

      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const searchableText = [risk.title, risk.description, risk.owner, ...risk.tags]
          .join(' ')
          .toLowerCase();

        if (!searchableText.includes(query)) return false;
      }

      // Tags filter
      if (filters.tags && filters.tags.length > 0) {
        if (!filters.tags.some((tag) => risk.tags.includes(tag))) return false;
      }

      // Owner filter
      if (filters.owner && filters.owner.length > 0) {
        if (!filters.owner.includes(risk.riskOwner)) return false;
      }

      return true;
    });
  }

  private getDateFieldValue(risk: EnhancedRisk, field: string): Date | null {
    switch (field) {
      case 'createdAt':
        return new Date(risk.createdAt);
      case 'updatedAt':
        return new Date(risk.updatedAt);
      case 'lastAssessed':
        return risk.lastAssessed ? new Date(risk.lastAssessed) : null;
      case 'nextReview':
        return risk.nextReview ? new Date(risk.nextReview) : null;
      default:
        return null;
    }
  }

  // Analytics and insights
  async generateRiskAnalytics(risks: EnhancedRisk[]): Promise<RiskAnalytics> {
    const totalRisks = risks.length;

    const risksByCategory = risks.reduce(
      (acc, risk) => {
        acc[risk.category] = (acc[risk.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const risksByStatus = risks.reduce(
      (acc, risk) => {
        acc[risk.status] = (acc[risk.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const risksByPriority = risks.reduce(
      (acc, risk) => {
        acc[risk.priority] = (acc[risk.priority] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const averageRiskScore = risks.reduce((sum, risk) => sum + risk.riskScore, 0) / totalRisks;

    const topRisks = risks.sort((a, b) => b.riskScore - a.riskScore).slice(0, 10);

    // Calculate trend data (mock implementation)
    const trendData = this.calculateTrendData(risks);

    return {
      totalRisks,
      risksByCategory,
      risksByStatus,
      risksByPriority,
      averageRiskScore,
      trendData,
      topRisks,
      riskVelocity: this.calculateRiskVelocity(risks),
      mitigationEffectiveness: this.calculateMitigationEffectiveness(risks),
      complianceScore: this.calculateComplianceScore(risks),
    };
  }

  private calculateTrendData(risks: EnhancedRisk[]): TrendDataPoint[] {
    // Mock trend data calculation
    const now = new Date();
    const trendData: TrendDataPoint[] = [];

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthRisks = risks.filter((risk) => {
        const riskDate = new Date(risk.createdAt);
        return (
          riskDate.getMonth() === date.getMonth() && riskDate.getFullYear() === date.getFullYear()
        );
      });

      trendData.push({
        date,
        totalRisks: monthRisks.length,
        averageScore:
          monthRisks.reduce((sum, risk) => sum + risk.riskScore, 0) / monthRisks.length || 0,
        newRisks: monthRisks.filter((risk) => risk.status === 'identified').length,
        mitigatedRisks: monthRisks.filter((risk) => risk.status === 'mitigated').length,
        criticalRisks: monthRisks.filter((risk) => risk.priority === 'critical').length,
      });
    }

    return trendData;
  }

  private calculateRiskVelocity(risks: EnhancedRisk[]): number {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const newRisksLastMonth = risks.filter((risk) => new Date(risk.createdAt) >= lastMonth);
    return newRisksLastMonth.length;
  }

  private calculateMitigationEffectiveness(risks: EnhancedRisk[]): number {
    const mitigatedRisks = risks.filter((risk) => risk.status === 'mitigated');
    const totalMitigations = risks.reduce((sum, risk) => sum + risk.mitigationStrategies.length, 0);

    if (totalMitigations === 0) return 0;
    return (mitigatedRisks.length / totalMitigations) * 100;
  }

  private calculateComplianceScore(risks: EnhancedRisk[]): number {
    const complianceRisks = risks.filter(
      (risk) => risk.category === 'COMPLIANCE' || risk.regulatoryFrameworks.length > 0
    );

    const mitigatedComplianceRisks = complianceRisks.filter(
      (risk) => risk.workflowState === 'mitigated' || risk.workflowState === 'monitored'
    );

    if (complianceRisks.length === 0) return 100;
    return (mitigatedComplianceRisks.length / complianceRisks.length) * 100;
  }

  // Risk correlation analysis
  async analyzeRiskCorrelations(risks: EnhancedRisk[]): Promise<any[]> {
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'correlation_analysis',
          data: { risks },
        }),
      });

      const result = await response.json();
      return result.correlations || [];
    } catch (error) {
      console.error('Risk correlation analysis failed:', error);
      return [];
    }
  }

  // Predictive risk modeling
  async generatePredictiveInsights(risks: EnhancedRisk[]): Promise<RiskIntelligence> {
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'predictive_analysis',
          data: { risks },
        }),
      });

      const result = await response.json();
      return result.intelligence || this.getMockRiskIntelligence();
    } catch (error) {
      console.error('Predictive analysis failed:', error);
      return this.getMockRiskIntelligence();
    }
  }

  private getMockRiskIntelligence(): RiskIntelligence {
    return {
      predictiveAnalysis: {
        forecastedRisks: [],
        trendPredictions: [],
        seasonalPatterns: [],
        confidence: 0.7,
      },
      correlationInsights: [],
      emergingRisks: [],
      industryBenchmarks: [],
      recommendations: [],
    };
  }

  // Risk templates
  async getRiskTemplates(): Promise<RiskTemplate[]> {
    // Mock risk templates - in a real app, these would come from a database
    return [
      {
        id: 'cybersecurity-template',
        name: 'Cybersecurity Risk',
        description: 'Template for cybersecurity and data breach risks',
        category: 'technology',
        defaultLikelihood: 3,
        defaultImpact: 4,
        suggestedControls: ['firewall', 'encryption', 'access-control'],
        commonMitigations: ['Security training', 'System updates', 'Backup procedures'],
        industryStandards: ['ISO 27001', 'NIST Cybersecurity Framework'],
      },
      {
        id: 'operational-template',
        name: 'Operational Risk',
        description: 'Template for operational and process risks',
        category: 'operational',
        defaultLikelihood: 2,
        defaultImpact: 3,
        suggestedControls: ['process-documentation', 'quality-control', 'monitoring'],
        commonMitigations: ['Process improvement', 'Staff training', 'Quality assurance'],
        industryStandards: ['ISO 9001', 'Six Sigma'],
      },
    ];
  }

  // Convert regular Risk to EnhancedRisk
  enhanceRisk(risk: Risk): EnhancedRisk {
    return {
      ...risk,
      workflowState: risk.status as any,
      workflowHistory: [],
      aiConfidence: 0.8,
      priority: this.calculatePriority(risk.riskScore),
      riskOwner: risk.owner,
      comments: [],
      riskComments: [],
      approvals: [],
      assignments: [],
      mitigationStrategies: [],
      tags: [],
      regulatoryFrameworks: [],
      complianceRequirements: [],
    };
  }

  private calculatePriority(riskScore: number): 'critical' | 'high' | 'medium' | 'low' {
    if (riskScore >= 20) return 'critical';
    if (riskScore >= 15) return 'high';
    if (riskScore >= 8) return 'medium';
    return 'low';
  }
}
