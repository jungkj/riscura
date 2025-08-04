import { db } from '@/lib/db';
import { complianceFrameworkManager } from './frameworks';
import { complianceMappingEngine } from './mapping';

export interface ComplianceQuery {
  id: string;
  query: string;
  intent:
    | 'framework-search'
    | 'requirement-lookup'
    | 'control-mapping'
    | 'gap-analysis'
    | 'interpretation'
    | 'recommendation';
  context: {
    organizationId: string;
    frameworks: string[];
    industry?: string;
    geography?: string;
    riskProfile?: string;
  };
  response: ComplianceQueryResponse;
  confidence: number;
  timestamp: Date;
  userId: string;
}

export interface ComplianceQueryResponse {
  type:
    | 'answer'
    | 'framework-list'
    | 'requirement-list'
    | 'control-mapping'
    | 'gap-analysis'
    | 'recommendations';
  content: string;
  data?: any;
  sources: string[];
  relatedQueries: string[];
  followUpActions?: ComplianceAction[];
  confidence?: number;
}

export interface ComplianceAction {
  type:
    | 'create-control'
    | 'request-evidence'
    | 'schedule-assessment'
    | 'assign-task'
    | 'generate-report';
  title: string;
  description: string;
  parameters: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface RegulatoryUpdate {
  id: string;
  frameworkId: string;
  updateType:
    | 'requirement-added'
    | 'requirement-modified'
    | 'requirement-removed'
    | 'guidance-updated'
    | 'deadline-changed';
  title: string;
  description: string;
  effectiveDate: Date;
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
  affectedRequirements: string[];
  recommendedActions: ComplianceAction[];
  source: string;
  sourceUrl?: string;
  isProcessed: boolean;
  organizationImpact?: OrganizationImpact;
  createdAt: Date;
}

export interface OrganizationImpact {
  organizationId: string;
  applicability: 'applicable' | 'not-applicable' | 'needs-review';
  affectedControls: string[];
  gapAnalysis?: {
    newGaps: number;
    modifiedGaps: number;
    resolvedGaps: number;
  };
  actionPlan?: {
    tasks: ComplianceAction[];
    timeline: number; // days
    effort: 'low' | 'medium' | 'high';
    cost: 'low' | 'medium' | 'high';
  };
  assessedAt: Date;
  assessedBy: string;
}

export interface ComplianceInsight {
  id: string;
  type:
    | 'risk-based-prioritization'
    | 'control-optimization'
    | 'regulatory-interpretation'
    | 'trend-analysis'
    | 'benchmark-comparison';
  title: string;
  description: string;
  organizationId: string;
  frameworkId?: string;
  confidence: number;
  severity: 'info' | 'warning' | 'critical';
  data: Record<string, any>;
  recommendations: ComplianceAction[];
  validUntil?: Date;
  generatedAt: Date;
  isActive: boolean;
}

export interface ControlPrioritization {
  controlId: string;
  priority: number; // 1-10
  riskReduction: number;
  complianceImpact: number;
  implementationEffort: number;
  costBenefit: number;
  businessValue: number;
  reasons: string[];
  recommendations: string[];
}

export class ComplianceAIIntelligence {
  // Process natural language compliance query
  async processComplianceQuery(
    _query: string,
    context: ComplianceQuery['context'],
    userId: string
  ): Promise<ComplianceQueryResponse> {
    // Determine query intent
    const intent = this.classifyQueryIntent(query);

    // Generate response based on intent
    const response = await this.generateQueryResponse(query, intent, context);

    // Store query for learning
    await this.storeQuery({
      id: `query_${Date.now()}`,
      query,
      intent,
      context,
      response,
      confidence: response.confidence || 0.8,
      timestamp: new Date(),
      userId,
    });

    return response;
  }

  // Classify query intent using NLP analysis
  private classifyQueryIntent(_query: string): ComplianceQuery['intent'] {
    const lowerQuery = query.toLowerCase();

    // Framework search patterns
    if (
      lowerQuery.includes('framework') ||
      lowerQuery.includes('standard') ||
      lowerQuery.includes('regulation')
    ) {
      if (
        lowerQuery.includes('what is') ||
        lowerQuery.includes('tell me about') ||
        lowerQuery.includes('explain')
      ) {
        return 'interpretation';
      }
      return 'framework-search';
    }

    // Requirement lookup patterns
    if (
      lowerQuery.includes('requirement') ||
      lowerQuery.includes('control') ||
      lowerQuery.includes('article')
    ) {
      if (
        lowerQuery.includes('map') ||
        lowerQuery.includes('mapping') ||
        lowerQuery.includes('implement')
      ) {
        return 'control-mapping';
      }
      return 'requirement-lookup';
    }

    // Gap analysis patterns
    if (
      lowerQuery.includes('gap') ||
      lowerQuery.includes('missing') ||
      lowerQuery.includes('coverage')
    ) {
      return 'gap-analysis';
    }

    // Recommendation patterns
    if (
      lowerQuery.includes('recommend') ||
      lowerQuery.includes('suggest') ||
      lowerQuery.includes('should')
    ) {
      return 'recommendation';
    }

    // Default to interpretation for complex queries
    return 'interpretation';
  }

  // Generate response based on intent
  private async generateQueryResponse(
    _query: string,
    intent: ComplianceQuery['intent'],
    context: ComplianceQuery['context']
  ): Promise<ComplianceQueryResponse> {
    switch (intent) {
      case 'framework-search':
        return await this.handleFrameworkSearch(query, context);
      case 'requirement-lookup':
        return await this.handleRequirementLookup(query, context);
      case 'control-mapping':
        return await this.handleControlMapping(query, context);
      case 'gap-analysis':
        return await this.handleGapAnalysis(query, context);
      case 'interpretation':
        return await this.handleInterpretation(query, context);
      case 'recommendation':
        return await this.handleRecommendation(query, context);
      default:
        return this.generateGenericResponse(query);
    }
  }

  // Handle framework search queries
  private async handleFrameworkSearch(
    _query: string,
    context: ComplianceQuery['context']
  ): Promise<ComplianceQueryResponse> {
    const searchResults = await complianceFrameworkManager.searchFrameworks(query, {
      frameworks: context.frameworks,
    });

    const frameworks = searchResults.frameworks;

    if (frameworks.length === 0) {
      return {
        type: 'answer',
        content: `I couldn't find any compliance frameworks matching "${query}". You might want to try searching for specific framework names like "SOX", "ISO 27001", "NIST", or "GDPR".`,
        sources: [],
        relatedQueries: [
          'What compliance frameworks are available?',
          'Show me frameworks for financial services',
          'What frameworks apply to my industry?',
        ],
      };
    }

    const frameworkList = frameworks
      .map((f) => `**${f.name}** (${f.version}): ${f.description}`)
      .join('\n\n');

    return {
      type: 'framework-list',
      content: `I found ${frameworks.length} compliance framework(s) matching your query:\n\n${frameworkList}`,
      data: { frameworks },
      sources: frameworks.map((f) => f.source),
      relatedQueries: [
        'Tell me more about these frameworks',
        'What are the requirements for these frameworks?',
        'How do I implement these frameworks?',
      ],
      followUpActions: frameworks.map((f) => ({
        type: 'schedule-assessment' as const,
        title: `Assess ${f.name} Compliance`,
        description: `Perform gap analysis for ${f.name}`,
        parameters: { frameworkId: f.id },
        priority: 'medium' as const,
      })),
    };
  }

  // Handle requirement lookup queries
  private async handleRequirementLookup(
    _query: string,
    context: ComplianceQuery['context']
  ): Promise<ComplianceQueryResponse> {
    const searchResults = await complianceFrameworkManager.searchFrameworks(query, {
      frameworks: context.frameworks,
    });

    const requirements = searchResults.requirements;

    if (requirements.length === 0) {
      return {
        type: 'answer',
        content: `I couldn't find any compliance requirements matching "${query}". Try searching for specific requirement codes, titles, or keywords.`,
        sources: [],
        relatedQueries: [
          'Show me all requirements for this framework',
          'What are the critical requirements?',
          'How do I implement this requirement?',
        ],
      };
    }

    const requirementList = requirements
      .slice(0, 5)
      .map(
        (r) =>
          `**${r.code}: ${r.title}**\n${r.description}\n*Framework: ${(r as any).framework?.name || 'Unknown'}*\n*Priority: ${r.priority}*`
      )
      .join('\n\n');

    return {
      type: 'requirement-list',
      content: `I found ${requirements.length} requirement(s) matching your query:\n\n${requirementList}`,
      data: { requirements },
      sources: requirements.map((r) => (r as any).framework?.source || 'Unknown').filter(Boolean),
      relatedQueries: [
        'How do I implement these requirements?',
        'What controls satisfy these requirements?',
        'What evidence is needed for these requirements?',
      ],
      followUpActions: requirements.map((r) => ({
        type: 'create-control' as const,
        title: `Create Control for ${r.code}`,
        description: `Implement control to satisfy ${r.title}`,
        parameters: { requirementId: r.id, frameworkId: (r as any).frameworkId || r.id },
        priority: r.priority as any,
      })),
    };
  }

  // Handle control mapping queries
  private async handleControlMapping(
    _query: string,
    context: ComplianceQuery['context']
  ): Promise<ComplianceQueryResponse> {
    // Extract requirement/control information from query
    const keywords = this.extractKeywords(query);

    // For demonstration, provide intelligent mapping guidance
    const mappingGuidance = this.generateMappingGuidance(keywords, context);

    return {
      type: 'control-mapping',
      content: mappingGuidance.content,
      data: mappingGuidance.data,
      sources: ['AI Analysis', 'Best Practices Database'],
      relatedQueries: [
        'What controls do I need for this requirement?',
        'How effective is this control mapping?',
        'What evidence do I need for this control?',
      ],
      followUpActions: mappingGuidance.actions,
    };
  }

  // Handle gap analysis queries
  private async handleGapAnalysis(
    _query: string,
    context: ComplianceQuery['context']
  ): Promise<ComplianceQueryResponse> {
    // Perform gap analysis for specified frameworks
    const gapAnalyses = await Promise.all(
      context.frameworks.map((frameworkId) =>
        complianceMappingEngine.performGapAnalysis(context.organizationId, frameworkId)
      )
    );

    const totalGaps = gapAnalyses.reduce((sum, analysis) => sum + analysis.gaps.length, 0);
    const criticalGaps = gapAnalyses.reduce(
      (sum, analysis) => sum + analysis.gaps.filter((g) => g.priority === 'critical').length,
      0
    );

    const gapSummary = gapAnalyses
      .map((analysis) => {
        const framework = context.frameworks.find((f) => f === analysis.frameworkId);
        return `**${framework}**: ${analysis.gaps.length} gaps (${analysis.gaps.filter((g) => g.priority === 'critical').length} critical), ${analysis.coveragePercentage.toFixed(1)}% coverage`;
      })
      .join('\n');

    return {
      type: 'gap-analysis',
      content: `**Gap Analysis Summary**\n\nTotal Gaps: ${totalGaps}\nCritical Gaps: ${criticalGaps}\n\n${gapSummary}`,
      data: { analyses: gapAnalyses },
      sources: ['Control Mapping Analysis', 'Framework Requirements'],
      relatedQueries: [
        'How do I close these gaps?',
        'What controls should I prioritize?',
        'What is the timeline to close gaps?',
      ],
      followUpActions: [
        {
          type: 'generate-report',
          title: 'Generate Detailed Gap Analysis Report',
          description: 'Create comprehensive gap analysis with remediation plan',
          parameters: { type: 'gap-analysis', frameworks: context.frameworks },
          priority: 'high',
        },
      ],
    };
  }

  // Handle interpretation queries
  private async handleInterpretation(
    _query: string,
    context: ComplianceQuery['context']
  ): Promise<ComplianceQueryResponse> {
    // Extract key concepts from query
    const concepts = this.extractComplianceConcepts(query);

    // Generate interpretation based on concepts
    const interpretation = this.generateInterpretation(concepts, context);

    return {
      type: 'answer',
      content: interpretation.content,
      data: interpretation.data,
      sources: interpretation.sources,
      relatedQueries: interpretation.relatedQueries,
      followUpActions: interpretation.actions,
    };
  }

  // Handle recommendation queries
  private async handleRecommendation(
    _query: string,
    context: ComplianceQuery['context']
  ): Promise<ComplianceQueryResponse> {
    // Generate recommendations based on query and context
    const recommendations = await this.generateRecommendations(query, context);

    return {
      type: 'recommendations',
      content: recommendations.content,
      data: recommendations.data,
      sources: ['AI Analysis', 'Best Practices', 'Industry Standards'],
      relatedQueries: [
        'How do I implement these recommendations?',
        'What is the priority order for these recommendations?',
        'What resources do I need?',
      ],
      followUpActions: recommendations.actions,
    };
  }

  // Generate generic response for unclassified queries
  private generateGenericResponse(_query: string): ComplianceQueryResponse {
    return {
      type: 'answer',
      content: `I understand you're asking about "${query}". Could you please be more specific? I can help you with:\n\n• Finding compliance frameworks\n• Looking up specific requirements\n• Mapping controls to requirements\n• Performing gap analysis\n• Interpreting regulatory guidance\n• Providing implementation recommendations`,
      sources: [],
      relatedQueries: [
        'What compliance frameworks apply to my organization?',
        'How do I perform a gap analysis?',
        'What controls do I need for SOX compliance?',
      ],
    };
  }

  // Extract keywords from query
  private extractKeywords(_query: string): string[] {
    const stopWords = [
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
    ];
    return query
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.includes(word));
  }

  // Extract compliance concepts
  private extractComplianceConcepts(_query: string): string[] {
    const complianceConcepts = [
      'control',
      'requirement',
      'framework',
      'standard',
      'regulation',
      'audit',
      'evidence',
      'testing',
      'assessment',
      'gap',
      'risk',
      'governance',
      'compliance',
      'maturity',
      'effectiveness',
      'monitoring',
    ];

    const queryLower = query.toLowerCase();
    return complianceConcepts.filter((concept) => queryLower.includes(concept));
  }

  // Generate mapping guidance
  private generateMappingGuidance(keywords: string[], context: ComplianceQuery['context']): any {
    return {
      content: `Based on your query, here's guidance for control mapping:\n\n**Recommended Approach:**\n1. Identify the specific requirement objective\n2. Map existing controls to requirements\n3. Assess control effectiveness\n4. Document gaps and plan remediation\n\n**Key Considerations:**\n• Consider both design and operating effectiveness\n• Ensure adequate testing procedures\n• Document evidence requirements\n• Plan for ongoing monitoring`,
      data: { keywords, mappingType: 'intelligent' },
      actions: [
        {
          type: 'create-control' as const,
          title: 'Create New Control',
          description: 'Design and implement new control based on requirements',
          parameters: { keywords },
          priority: 'medium' as const,
        },
      ],
    };
  }

  // Generate interpretation
  private generateInterpretation(concepts: string[], context: ComplianceQuery['context']): any {
    return {
      content: `Based on the compliance concepts in your query (${concepts.join(', ')}), here's my interpretation:\n\nCompliance frameworks provide structured approaches to managing regulatory and business requirements. Effective implementation requires:\n\n• Clear understanding of applicable requirements\n• Systematic control design and implementation\n• Regular testing and monitoring\n• Continuous improvement based on results\n\nFor your specific context, consider focusing on frameworks that align with your industry and risk profile.`,
      data: { concepts },
      sources: ['Regulatory Guidance', 'Industry Best Practices'],
      relatedQueries: [
        'How do I start implementing this framework?',
        'What are the key success factors?',
        'How do I measure compliance effectiveness?',
      ],
      actions: [],
    };
  }

  // Generate recommendations
  private async generateRecommendations(
    _query: string,
    context: ComplianceQuery['context']
  ): Promise<any> {
    // Analyze current state and generate recommendations
    const recommendations = [
      '**Prioritize Critical Requirements**: Focus on mandatory and high-risk requirements first',
      '**Implement Risk-Based Controls**: Design controls that address your highest risks',
      '**Establish Testing Programs**: Create systematic testing and monitoring procedures',
      '**Document Everything**: Maintain comprehensive documentation for audit purposes',
      '**Train Your Team**: Ensure staff understand their compliance responsibilities',
    ];

    return {
      content: `Based on your query and organizational context, here are my recommendations:\n\n${recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n\n')}`,
      data: { recommendations },
      actions: [
        {
          type: 'assign-task' as const,
          title: 'Create Compliance Implementation Plan',
          description: 'Develop comprehensive plan based on recommendations',
          parameters: { recommendations },
          priority: 'high' as const,
        },
      ],
    };
  }

  // Store query for learning
  private async storeQuery(_query: ComplianceQuery): Promise<void> {
    await db.client.complianceQuery.create({
      data: query,
    });
  }

  // Monitor regulatory updates
  async monitorRegulatoryUpdates(): Promise<RegulatoryUpdate[]> {
    // This would integrate with regulatory monitoring services
    // For now, return mock updates
    const mockUpdates: RegulatoryUpdate[] = [
      {
        id: `update_${Date.now()}`,
        frameworkId: 'gdpr-2018',
        updateType: 'guidance-updated',
        title: 'Updated Guidance on AI and Automated Decision Making',
        description: 'New guidance clarifies requirements for AI systems under GDPR',
        effectiveDate: new Date(),
        impactLevel: 'medium',
        affectedRequirements: ['gdpr-art22'],
        recommendedActions: [
          {
            type: 'schedule-assessment',
            title: 'Review AI Systems',
            description: 'Assess AI systems for GDPR compliance',
            parameters: { framework: 'gdpr', focus: 'ai-systems' },
            priority: 'medium',
          },
        ],
        source: 'European Data Protection Board',
        sourceUrl: 'https://edpb.europa.eu',
        isProcessed: false,
        createdAt: new Date(),
      },
    ];

    // Store updates
    for (const update of mockUpdates) {
      await db.client.regulatoryUpdate.create({
        data: update,
      });
    }

    return mockUpdates;
  }

  // Assess organizational impact of regulatory updates
  async assessRegulatoryImpact(
    updateId: string,
    organizationId: string,
    assessorId: string
  ): Promise<OrganizationImpact> {
    const update = await db.client.regulatoryUpdate.findUnique({
      where: { id: updateId },
    });

    if (!update) {
      throw new Error('Regulatory update not found');
    }

    // Analyze impact on organization
    const impact: OrganizationImpact = {
      organizationId,
      applicability: 'applicable', // Would be determined through analysis
      affectedControls: [], // Would be identified through mapping
      gapAnalysis: {
        newGaps: 2,
        modifiedGaps: 1,
        resolvedGaps: 0,
      },
      actionPlan: {
        tasks: update.recommendedActions,
        timeline: 90,
        effort: 'medium',
        cost: 'medium',
      },
      assessedAt: new Date(),
      assessedBy: assessorId,
    };

    // Update the regulatory update with impact assessment
    await db.client.regulatoryUpdate.update({
      where: { id: updateId },
      data: {
        organizationImpact: impact,
        isProcessed: true,
      },
    });

    return impact;
  }

  // Generate compliance insights
  async generateComplianceInsights(_organizationId: string): Promise<ComplianceInsight[]> {
    const insights: ComplianceInsight[] = [];

    // Risk-based prioritization insight
    const prioritization = await this.analyzeRiskBasedPrioritization(organizationId);
    if (prioritization.length > 0) {
      insights.push({
        id: `insight_priority_${Date.now()}`,
        type: 'risk-based-prioritization',
        title: 'Control Prioritization Recommendations',
        description: `Based on risk analysis, ${prioritization.length} controls should be prioritized for implementation or improvement`,
        organizationId,
        confidence: 0.85,
        severity: 'warning',
        data: { prioritization },
        recommendations: prioritization.slice(0, 3).map((p) => ({
          type: 'create-control',
          title: `Prioritize Control ${p.controlId}`,
          description: p.reasons.join(', '),
          parameters: { controlId: p.controlId, priority: p.priority },
          priority: p.priority >= 8 ? 'critical' : p.priority >= 6 ? 'high' : 'medium',
        })),
        generatedAt: new Date(),
        isActive: true,
      });
    }

    // Control optimization insight
    const optimizations = await this.analyzeControlOptimization(organizationId);
    if (optimizations.length > 0) {
      insights.push({
        id: `insight_optimization_${Date.now()}`,
        type: 'control-optimization',
        title: 'Control Optimization Opportunities',
        description: `${optimizations.length} controls can be optimized for better efficiency or effectiveness`,
        organizationId,
        confidence: 0.78,
        severity: 'info',
        data: { optimizations },
        recommendations: optimizations.slice(0, 2).map((opt) => ({
          type: 'assign-task',
          title: `Optimize ${opt.name}`,
          description: opt.recommendation,
          parameters: { controlId: opt.id, optimization: opt.opportunity },
          priority: 'medium',
        })),
        generatedAt: new Date(),
        isActive: true,
      });
    }

    // Store insights
    for (const insight of insights) {
      await db.client.complianceInsight.create({
        data: insight,
      });
    }

    return insights;
  }

  // Analyze risk-based prioritization
  private async analyzeRiskBasedPrioritization(
    _organizationId: string
  ): Promise<ControlPrioritization[]> {
    const controls = await db.client.control.findMany({
      where: { organizationId },
      include: {
        risks: true,
        requirements: true,
      },
    });

    return controls
      .map((control) => {
        // Calculate prioritization score
        const riskReduction = this.calculateRiskReduction(control);
        const complianceImpact = this.calculateComplianceImpact(control);
        const implementationEffort = this.calculateImplementationEffort(control);
        const costBenefit = (riskReduction + complianceImpact) / implementationEffort;
        const businessValue = this.calculateBusinessValue(control);

        const priority = Math.round(
          (riskReduction + complianceImpact + costBenefit + businessValue) / 4
        );

        return {
          controlId: control.id,
          priority,
          riskReduction,
          complianceImpact,
          implementationEffort,
          costBenefit,
          businessValue,
          reasons: this.generatePrioritizationReasons(control, priority),
          recommendations: this.generatePrioritizationRecommendations(control, priority),
        };
      })
      .sort((a, b) => b.priority - a.priority);
  }

  // Calculate various scores for prioritization
  private calculateRiskReduction(control: any): number {
    const riskCount = control.risks?.length || 0;
    const avgRiskScore =
      control.risks?.reduce((sum: number, r: any) => sum + r.likelihood * r.impact, 0) /
        Math.max(riskCount, 1) || 0;
    return Math.min(avgRiskScore / 2, 10);
  }

  private calculateComplianceImpact(control: any): number {
    const requirementCount = control.requirements?.length || 0;
    const criticalRequirements =
      control.requirements?.filter((r: any) => r.priority === 'critical').length || 0;
    return Math.min(requirementCount * 2 + criticalRequirements * 3, 10);
  }

  private calculateImplementationEffort(control: any): number {
    // Based on control complexity, automation level, etc.
    let effort = 5; // Base effort

    if (control.automated) effort -= 2;
    if (control.effectivenessScore > 80) effort -= 1;
    if (!control.owner) effort += 2;

    return Math.max(Math.min(effort, 10), 1);
  }

  private calculateBusinessValue(control: any): number {
    // Based on business criticality, regulatory importance, etc.
    let value = 5; // Base value

    if (control.category === 'financial') value += 2;
    if (control.category === 'security') value += 1;
    if (control.requirements?.some((r: any) => r.mandatory)) value += 2;

    return Math.min(value, 10);
  }

  private generatePrioritizationReasons(control: any, priority: number): string[] {
    const reasons: string[] = [];

    if (priority >= 8) {
      reasons.push('High impact on risk reduction');
      reasons.push('Critical compliance requirements');
    }

    if (control.risks?.length > 0) {
      reasons.push(`Addresses ${control.risks.length} risk(s)`);
    }

    if (control.requirements?.some((r: any) => r.mandatory)) {
      reasons.push('Mandatory regulatory requirement');
    }

    return reasons;
  }

  private generatePrioritizationRecommendations(control: any, priority: number): string[] {
    const recommendations: string[] = [];

    if (priority >= 8) {
      recommendations.push('Implement immediately');
      recommendations.push('Assign dedicated resources');
    } else if (priority >= 6) {
      recommendations.push('Include in next planning cycle');
      recommendations.push('Assess resource requirements');
    } else {
      recommendations.push('Consider for future implementation');
      recommendations.push('Monitor for requirement changes');
    }

    return recommendations;
  }

  // Analyze control optimization opportunities
  private async analyzeControlOptimization(_organizationId: string): Promise<
    {
      id: any;
      name: any;
      opportunity: string;
      recommendation: string;
      effort: 'low' | 'medium' | 'high';
      benefit: 'low' | 'medium' | 'high';
    }[]
  > {
    const controls = await db.client.control.findMany({
      where: { organizationId },
    });

    const optimizations: {
      id: any;
      name: any;
      opportunity: string;
      recommendation: string;
      effort: 'low' | 'medium' | 'high';
      benefit: 'low' | 'medium' | 'high';
    }[] = [];

    for (const control of controls) {
      const opportunities: string[] = [];

      // Check for automation opportunities
      if (!control.automated && control.frequency === 'continuous') {
        opportunities.push('Automation opportunity for continuous monitoring');
      }

      // Check for effectiveness improvements
      if (control.effectivenessScore < 70) {
        opportunities.push('Effectiveness improvement needed');
      }

      // Check for testing optimization
      if (
        !control.lastTested ||
        new Date(control.lastTested) < new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
      ) {
        opportunities.push('Testing program needs enhancement');
      }

      if (opportunities.length > 0) {
        optimizations.push({
          id: control.id,
          name: control.name,
          opportunity: opportunities[0],
          recommendation: this.generateOptimizationRecommendation(opportunities[0]),
          effort: this.estimateOptimizationEffort(opportunities[0]),
          benefit: this.estimateOptimizationBenefit(opportunities[0]),
        });
      }
    }

    return optimizations;
  }

  private generateOptimizationRecommendation(opportunity: string): string {
    if (opportunity.includes('automation')) {
      return 'Implement automated monitoring and alerting system';
    }
    if (opportunity.includes('effectiveness')) {
      return 'Review control design and strengthen implementation';
    }
    if (opportunity.includes('testing')) {
      return 'Establish regular testing schedule and procedures';
    }
    return 'Review and improve control implementation';
  }

  private estimateOptimizationEffort(opportunity: string): 'low' | 'medium' | 'high' {
    if (opportunity.includes('automation')) return 'high';
    if (opportunity.includes('testing')) return 'medium';
    return 'low';
  }

  private estimateOptimizationBenefit(opportunity: string): 'low' | 'medium' | 'high' {
    if (opportunity.includes('automation')) return 'high';
    if (opportunity.includes('effectiveness')) return 'high';
    return 'medium';
  }
}

export const complianceAIIntelligence = new ComplianceAIIntelligence();
