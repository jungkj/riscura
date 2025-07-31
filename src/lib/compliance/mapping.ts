import { db } from '@/lib/db';
import { complianceFrameworkManager } from './frameworks';

export interface ControlMapping {
  id: string;
  controlId: string;
  frameworkId: string;
  requirementId: string;
  mappingType: 'direct' | 'partial' | 'inherited' | 'compensating';
  coverage: number; // 0-100%
  confidence: number; // 0-1
  automated: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  notes?: string;
  evidenceRequired: string[];
  testingRequired: string[];
  deficiencies: string[];
  recommendations: string[];
  lastAssessed: Date;
  nextAssessment: Date;
  organizationId: string;
}

export interface GapAnalysisResult {
  frameworkId: string;
  totalRequirements: number;
  mappedRequirements: number;
  coveragePercentage: number;
  maturityScore: number;
  gaps: ComplianceGap[];
  recommendations: ComplianceRecommendation[];
  riskScore: number;
  readinessLevel: 'low' | 'medium' | 'high';
  estimatedEffort: {
    timeToCompliance: number; // days
    resourcesRequired: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
  };
}

export interface ComplianceGap {
  requirementId: string;
  requirementTitle: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  gapType: 'missing' | 'partial' | 'ineffective' | 'untested';
  description: string;
  riskLevel: number;
  controls: {
    existing: string[];
    recommended: string[];
    missing: string[];
  };
  remediation: {
    effort: 'low' | 'medium' | 'high';
    timeline: number; // days
    cost: 'low' | 'medium' | 'high';
    dependencies: string[];
  };
}

export interface ComplianceRecommendation {
  id: string;
  type: 'control' | 'process' | 'policy' | 'technology' | 'training';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  requirements: string[];
  benefits: string[];
  implementation: {
    effort: 'low' | 'medium' | 'high';
    timeline: number; // days
    cost: 'low' | 'medium' | 'high';
    resources: string[];
    dependencies: string[];
  };
  riskReduction: number;
  complianceImpact: number;
}

export interface ControlEffectivenessAssessment {
  controlId: string;
  frameworkRequirements: {
    requirementId: string;
    effectivenessScore: number;
    coverageScore: number;
    maturityLevel: number;
    deficiencies: string[];
    recommendations: string[];
  }[];
  overallEffectiveness: number;
  complianceReadiness: number;
  lastAssessed: Date;
}

export class ComplianceMappingEngine {
  // Automated control mapping using AI analysis
  async performAutomatedMapping(
    organizationId: string,
    frameworkIds: string[]
  ): Promise<ControlMapping[]> {
    const mappings: ControlMapping[] = [];

    // Get organization controls
    const controls = await db.client.control.findMany({
      where: { organizationId },
      include: {
        risks: true,
        requirements: true,
      },
    });

    for (const frameworkId of frameworkIds) {
      const framework = await complianceFrameworkManager.getFramework(frameworkId);
      if (!framework) continue;

      for (const requirement of framework.requirements) {
        const mapping = await this.analyzeControlMapping(
          controls,
          framework,
          requirement,
          organizationId
        );

        if (mapping) {
          mappings.push(mapping);
        }
      }
    }

    // Store mappings in database
    for (const mapping of mappings) {
      await this.createControlMapping(mapping);
    }

    return mappings;
  }

  // Analyze control mapping using AI-powered text analysis
  private async analyzeControlMapping(
    controls: any[],
    framework: any,
    requirement: any,
    organizationId: string
  ): Promise<ControlMapping | null> {
    let bestMatch: any = null;
    let bestScore = 0;

    // Use semantic analysis to find best matching control
    for (const control of controls) {
      const score = this.calculateMappingScore(control, requirement);

      if (score > bestScore && score > 0.3) {
        // Minimum confidence threshold
        bestScore = score;
        bestMatch = control;
      }
    }

    if (!bestMatch) return null;

    // Determine mapping type and coverage
    const mappingType = this.determineMappingType(bestMatch, requirement, bestScore);
    const coverage = this.calculateCoverage(bestMatch, requirement);

    return {
      id: `mapping_${bestMatch.id}_${requirement.id}_${Date.now()}`,
      controlId: bestMatch.id,
      frameworkId: framework.id,
      requirementId: requirement.id,
      mappingType,
      coverage,
      confidence: bestScore,
      automated: true,
      evidenceRequired: this.determineEvidenceRequirements(requirement),
      testingRequired: this.determineTestingRequirements(requirement),
      deficiencies: await this.identifyDeficiencies(bestMatch, requirement),
      recommendations: await this.generateMappingRecommendations(bestMatch, requirement),
      lastAssessed: new Date(),
      nextAssessment: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      organizationId,
    };
  }

  // Calculate mapping score using semantic similarity
  private calculateMappingScore(control: any, requirement: any): number {
    let score = 0;

    // Title similarity
    const titleScore = this.textSimilarity(control.name, requirement.title);
    score += titleScore * 0.3;

    // Description similarity
    const descScore = this.textSimilarity(control.description, requirement.description);
    score += descScore * 0.4;

    // Category matching
    if (control.category && requirement.category) {
      const categoryScore = this.categorySimilarity(control.category, requirement.category);
      score += categoryScore * 0.2;
    }

    // Keywords matching
    const keywordScore = this.keywordMatching(control, requirement);
    score += keywordScore * 0.1;

    return Math.min(score, 1.0);
  }

  // Text similarity using basic NLP techniques
  private textSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0;

    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);

    const intersection = words1.filter((word) => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];

    return intersection.length / union.length;
  }

  // Category similarity mapping
  private categorySimilarity(cat1: string, cat2: string): number {
    const categoryMappings: Record<string, string[]> = {
      'access-control': ['access', 'authentication', 'authorization', 'identity'],
      'data-protection': ['data', 'privacy', 'confidentiality', 'encryption'],
      monitoring: ['logging', 'audit', 'surveillance', 'detection'],
      'incident-response': ['incident', 'response', 'recovery', 'business-continuity'],
      'risk-management': ['risk', 'assessment', 'evaluation', 'treatment'],
      governance: ['policy', 'procedure', 'management', 'oversight'],
    };

    const mapped1 = categoryMappings[cat1.toLowerCase()] || [cat1.toLowerCase()];
    const mapped2 = categoryMappings[cat2.toLowerCase()] || [cat2.toLowerCase()];

    const intersection = mapped1.filter((item) => mapped2.includes(item));
    return intersection.length > 0 ? 0.8 : 0;
  }

  // Keyword matching
  private keywordMatching(control: any, requirement: any): number {
    const controlKeywords = this.extractKeywords(control);
    const requirementKeywords = requirement.tags || [];

    const matches = controlKeywords.filter((keyword) =>
      requirementKeywords.some((tag: string) => tag.includes(keyword))
    );

    return matches.length / Math.max(requirementKeywords.length, 1);
  }

  // Extract keywords from control
  private extractKeywords(control: any): string[] {
    const text = `${control.name} ${control.description}`.toLowerCase();

    // Common compliance keywords
    const keywords = [
      'access',
      'authentication',
      'authorization',
      'encryption',
      'audit',
      'logging',
      'monitoring',
      'incident',
      'backup',
      'recovery',
      'training',
      'policy',
      'procedure',
      'review',
      'approval',
      'testing',
      'vulnerability',
      'patch',
      'update',
      'security',
      'privacy',
      'data',
      'protection',
    ];

    return keywords.filter((keyword) => text.includes(keyword));
  }

  // Determine mapping type
  private determineMappingType(
    control: any,
    requirement: any,
    score: number
  ): 'direct' | 'partial' | 'inherited' | 'compensating' {
    if (score > 0.8) return 'direct';
    if (score > 0.6) return 'partial';
    if (score > 0.4) return 'inherited';
    return 'compensating';
  }

  // Calculate coverage percentage
  private calculateCoverage(control: any, requirement: any): number {
    // Simplified coverage calculation
    let coverage = 50; // Base coverage

    // Adjust based on control maturity
    if (control.effectivenessScore > 80) coverage += 30;
    else if (control.effectivenessScore > 60) coverage += 20;
    else if (control.effectivenessScore > 40) coverage += 10;

    // Adjust based on testing status
    if (
      control.lastTested &&
      new Date(control.lastTested) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    ) {
      coverage += 10;
    }

    // Adjust based on evidence availability
    if (control.evidence && control.evidence.length > 0) {
      coverage += 10;
    }

    return Math.min(coverage, 100);
  }

  // Determine evidence requirements
  private determineEvidenceRequirements(requirement: any): string[] {
    const evidenceTypes = requirement.evidenceTypes || [];

    const mappings: Record<string, string[]> = {
      policies: ['Policy documents', 'Procedure manuals', 'Management approval'],
      'testing-results': ['Test reports', 'Walkthrough documentation', 'Exception reports'],
      documentation: ['Process documentation', 'Control descriptions', 'Flowcharts'],
      certification: ['Management certifications', 'Officer attestations', 'Sign-off documents'],
      'monitoring-reports': ['Monitoring dashboards', 'Exception reports', 'Performance metrics'],
    };

    const evidence: string[] = [];
    for (const type of evidenceTypes) {
      if (mappings[type]) {
        evidence.push(...mappings[type]);
      }
    }

    return [...new Set(evidence)];
  }

  // Determine testing requirements
  private determineTestingRequirements(requirement: any): string[] {
    const frequency = requirement.frequency || 'annual';
    const testable = requirement.testable || false;

    if (!testable) return [];

    const tests = ['Design effectiveness testing', 'Operating effectiveness testing'];

    if (frequency === 'continuous' || frequency === 'monthly') {
      tests.push('Continuous monitoring');
    }

    if (requirement.category === 'access-control') {
      tests.push('Access rights review', 'User provisioning testing');
    }

    if (requirement.category === 'data-protection') {
      tests.push('Data handling review', 'Encryption verification');
    }

    return tests;
  }

  // Identify deficiencies
  private async identifyDeficiencies(control: any, requirement: any): Promise<string[]> {
    const deficiencies: string[] = [];

    // Check control effectiveness
    if (control.effectivenessScore < 70) {
      deficiencies.push('Control effectiveness below threshold');
    }

    // Check testing frequency
    if (control.lastTested) {
      const daysSinceTest =
        (Date.now() - new Date(control.lastTested).getTime()) / (1000 * 60 * 60 * 24);
      const requiredFrequency = this.getTestingFrequency(requirement.frequency);

      if (daysSinceTest > requiredFrequency) {
        deficiencies.push('Control testing overdue');
      }
    } else {
      deficiencies.push('No testing evidence available');
    }

    // Check documentation
    if (!control.description || control.description.length < 50) {
      deficiencies.push('Insufficient control documentation');
    }

    // Check evidence
    if (!control.evidence || control.evidence.length === 0) {
      deficiencies.push('Missing supporting evidence');
    }

    return deficiencies;
  }

  // Get testing frequency in days
  private getTestingFrequency(frequency: string): number {
    switch (frequency) {
      case 'continuous':
        return 30;
      case 'monthly':
        return 30;
      case 'quarterly':
        return 90;
      case 'annual':
        return 365;
      default:
        return 365;
    }
  }

  // Generate mapping recommendations
  private async generateMappingRecommendations(control: any, requirement: any): Promise<string[]> {
    const recommendations: string[] = [];

    // Effectiveness recommendations
    if (control.effectivenessScore < 80) {
      recommendations.push('Enhance control design and implementation');
    }

    // Testing recommendations
    if (!control.lastTested) {
      recommendations.push('Implement regular control testing program');
    }

    // Documentation recommendations
    if (!control.description || control.description.length < 100) {
      recommendations.push('Improve control documentation and procedures');
    }

    // Automation recommendations
    if (control.automated === false && requirement.frequency === 'continuous') {
      recommendations.push('Consider automation for continuous compliance monitoring');
    }

    // Training recommendations
    if (!control.owner || !control.responsible) {
      recommendations.push('Assign clear control ownership and responsibilities');
    }

    return recommendations;
  }

  // Create control mapping
  async createControlMapping(mapping: ControlMapping): Promise<ControlMapping> {
    return await db.client.controlMapping.create({
      data: mapping,
    });
  }

  // Perform compliance gap analysis
  async performGapAnalysis(
    organizationId: string,
    frameworkId: string,
    includeRecommendations: boolean = true
  ): Promise<GapAnalysisResult> {
    const framework = await complianceFrameworkManager.getFramework(frameworkId);
    if (!framework) {
      throw new Error('Framework not found');
    }

    // Get existing mappings
    const mappings = await db.client.controlMapping.findMany({
      where: {
        organizationId,
        frameworkId,
      },
      include: {
        control: true,
        requirement: true,
      },
    });

    const totalRequirements = framework.requirements.length;
    const mappedRequirements = mappings.length;
    const coveragePercentage = (mappedRequirements / totalRequirements) * 100;

    // Calculate maturity score
    const maturityScore = this.calculateMaturityScore(mappings);

    // Identify gaps
    const gaps = await this.identifyComplianceGaps(framework, mappings, organizationId);

    // Generate recommendations
    const recommendations = includeRecommendations
      ? await this.generateComplianceRecommendations(gaps, framework, organizationId)
      : [];

    // Calculate risk score
    const riskScore = this.calculateComplianceRiskScore(gaps, mappings);

    // Determine readiness level
    const readinessLevel = this.determineReadinessLevel(
      coveragePercentage,
      maturityScore,
      riskScore
    );

    // Estimate effort
    const estimatedEffort = this.estimateComplianceEffort(gaps, recommendations);

    return {
      frameworkId,
      totalRequirements,
      mappedRequirements,
      coveragePercentage,
      maturityScore,
      gaps,
      recommendations,
      riskScore,
      readinessLevel,
      estimatedEffort,
    };
  }

  // Calculate maturity score
  private calculateMaturityScore(mappings: any[]): number {
    if (mappings.length === 0) return 0;

    const totalScore = mappings.reduce((sum, mapping) => {
      const controlScore = mapping.control?.effectivenessScore || 0;
      const coverageWeight = mapping.coverage / 100;
      return sum + controlScore * coverageWeight;
    }, 0);

    return totalScore / mappings.length;
  }

  // Identify compliance gaps
  private async identifyComplianceGaps(
    framework: any,
    mappings: any[],
    organizationId: string
  ): Promise<ComplianceGap[]> {
    const gaps: ComplianceGap[] = [];
    const mappedRequirements = new Set(mappings.map((m) => m.requirementId));

    // Get organization controls for reference
    const controls = await db.client.control.findMany({
      where: { organizationId },
    });

    for (const requirement of framework.requirements) {
      if (!mappedRequirements.has(requirement.id)) {
        // Missing requirement
        gaps.push({
          requirementId: requirement.id,
          requirementTitle: requirement.title,
          category: requirement.category,
          priority: requirement.priority,
          gapType: 'missing',
          description: `No controls mapped to requirement: ${requirement.title}`,
          riskLevel: this.calculateRequirementRiskLevel(requirement),
          controls: {
            existing: [],
            recommended: this.recommendControlsForRequirement(requirement, controls),
            missing: [`Control for ${requirement.category}`],
          },
          remediation: {
            effort: this.estimateRemediationEffort(requirement),
            timeline: this.estimateRemediationTimeline(requirement),
            cost: this.estimateRemediationCost(requirement),
            dependencies: requirement.relatedRequirements || [],
          },
        });
      } else {
        // Check existing mappings for effectiveness
        const mapping = mappings.find((m) => m.requirementId === requirement.id);
        if (mapping && mapping.coverage < 70) {
          gaps.push({
            requirementId: requirement.id,
            requirementTitle: requirement.title,
            category: requirement.category,
            priority: requirement.priority,
            gapType: 'partial',
            description: `Partial coverage (${mapping.coverage}%) for requirement: ${requirement.title}`,
            riskLevel: this.calculateRequirementRiskLevel(requirement),
            controls: {
              existing: [mapping.control.name],
              recommended: this.recommendEnhancementsForControl(mapping.control, requirement),
              missing: [],
            },
            remediation: {
              effort: 'medium',
              timeline: 30,
              cost: 'medium',
              dependencies: [],
            },
          });
        }
      }
    }

    return gaps;
  }

  // Calculate requirement risk level
  private calculateRequirementRiskLevel(requirement: any): number {
    let risk = 5; // Base risk

    // Adjust based on priority
    switch (requirement.priority) {
      case 'critical':
        risk = 10;
        break;
      case 'high':
        risk = 8;
        break;
      case 'medium':
        risk = 5;
        break;
      case 'low':
        risk = 3;
        break;
    }

    // Adjust based on mandatory nature
    if (requirement.mandatory) {
      risk += 2;
    }

    // Adjust based on category
    if (['security', 'privacy', 'financial'].includes(requirement.category)) {
      risk += 1;
    }

    return Math.min(risk, 10);
  }

  // Recommend controls for requirement
  private recommendControlsForRequirement(requirement: any, controls: any[]): string[] {
    const recommendations: string[] = [];

    // Use simple keyword matching for recommendations
    const keywords = requirement.tags || [];

    for (const control of controls) {
      const controlText = `${control.name} ${control.description}`.toLowerCase();
      const matches = keywords.filter((keyword: string) =>
        controlText.includes(keyword.toLowerCase())
      );

      if (matches.length > 0) {
        recommendations.push(control.name);
      }
    }

    // Add generic recommendations based on category
    if (requirement.category === 'access-control') {
      recommendations.push('Identity and Access Management Control');
    }
    if (requirement.category === 'data-protection') {
      recommendations.push('Data Protection Control');
    }

    return recommendations.slice(0, 3); // Limit to 3 recommendations
  }

  // Estimate remediation parameters
  private estimateRemediationEffort(requirement: any): 'low' | 'medium' | 'high' {
    if (requirement.priority === 'critical') return 'high';
    if (requirement.priority === 'high') return 'medium';
    return 'low';
  }

  private estimateRemediationTimeline(requirement: any): number {
    switch (requirement.priority) {
      case 'critical':
        return 30;
      case 'high':
        return 60;
      case 'medium':
        return 90;
      default:
        return 120;
    }
  }

  private estimateRemediationCost(requirement: any): 'low' | 'medium' | 'high' {
    if (requirement.category === 'technology') return 'high';
    if (requirement.category === 'training') return 'low';
    return 'medium';
  }

  // Generate compliance recommendations
  private async generateComplianceRecommendations(
    gaps: ComplianceGap[],
    framework: any,
    organizationId: string
  ): Promise<ComplianceRecommendation[]> {
    const recommendations: ComplianceRecommendation[] = [];

    // Analyze gaps and generate strategic recommendations
    const criticalGaps = gaps.filter((g) => g.priority === 'critical');
    const highGaps = gaps.filter((g) => g.priority === 'high');

    if (criticalGaps.length > 0) {
      recommendations.push({
        id: `rec_critical_${Date.now()}`,
        type: 'control',
        title: 'Address Critical Compliance Gaps',
        description: `Immediate attention required for ${criticalGaps.length} critical compliance gaps`,
        priority: 'critical',
        category: 'risk-reduction',
        requirements: criticalGaps.map((g) => g.requirementId),
        benefits: ['Reduced regulatory risk', 'Improved compliance posture'],
        implementation: {
          effort: 'high',
          timeline: 30,
          cost: 'high',
          resources: ['Compliance team', 'Technical team', 'Management'],
          dependencies: [],
        },
        riskReduction: 8,
        complianceImpact: 9,
      });
    }

    // Technology recommendations
    const techGaps = gaps.filter((g) => g.category === 'technology');
    if (techGaps.length > 2) {
      recommendations.push({
        id: `rec_tech_${Date.now()}`,
        type: 'technology',
        title: 'Implement Compliance Technology Solutions',
        description: 'Deploy automated compliance monitoring and control systems',
        priority: 'high',
        category: 'automation',
        requirements: techGaps.map((g) => g.requirementId),
        benefits: ['Automated compliance', 'Reduced manual effort', 'Real-time monitoring'],
        implementation: {
          effort: 'high',
          timeline: 90,
          cost: 'high',
          resources: ['IT team', 'Compliance team', 'Vendors'],
          dependencies: ['Budget approval', 'Technology selection'],
        },
        riskReduction: 6,
        complianceImpact: 8,
      });
    }

    return recommendations;
  }

  // Calculate compliance risk score
  private calculateComplianceRiskScore(gaps: ComplianceGap[], mappings: any[]): number {
    const gapRisk = gaps.reduce((sum, gap) => sum + gap.riskLevel, 0);
    const mappingRisk = mappings.reduce((sum, mapping) => {
      const coverageRisk = (100 - mapping.coverage) / 10;
      return sum + coverageRisk;
    }, 0);

    const totalRisk = gapRisk + mappingRisk;
    const maxPossibleRisk = gaps.length * 10 + mappings.length * 10;

    return maxPossibleRisk > 0 ? (totalRisk / maxPossibleRisk) * 10 : 0;
  }

  // Determine readiness level
  private determineReadinessLevel(
    coverage: number,
    maturity: number,
    risk: number
  ): 'low' | 'medium' | 'high' {
    const overallScore = (coverage + maturity) / 2 - risk * 5;

    if (overallScore >= 70) return 'high';
    if (overallScore >= 40) return 'medium';
    return 'low';
  }

  // Estimate compliance effort
  private estimateComplianceEffort(
    gaps: ComplianceGap[],
    recommendations: ComplianceRecommendation[]
  ): {
    timeToCompliance: number;
    resourcesRequired: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
  } {
    const totalTimeline = gaps.reduce((sum, gap) => sum + gap.remediation.timeline, 0);
    const criticalGaps = gaps.filter((g) => g.priority === 'critical').length;
    const highGaps = gaps.filter((g) => g.priority === 'high').length;

    let priority: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (criticalGaps > 0) priority = 'critical';
    else if (highGaps > 3) priority = 'high';
    else if (gaps.length > 5) priority = 'medium';

    return {
      timeToCompliance: Math.max(totalTimeline / 4, 30), // Parallel execution
      resourcesRequired: gaps.length + recommendations.length,
      priority,
    };
  }

  // Additional helper methods for control enhancements
  private recommendEnhancementsForControl(control: any, requirement: any): string[] {
    const enhancements: string[] = [];

    if (control.effectivenessScore < 70) {
      enhancements.push('Improve control design');
    }

    if (!control.automated && requirement.frequency === 'continuous') {
      enhancements.push('Implement automation');
    }

    if (!control.lastTested) {
      enhancements.push('Establish testing program');
    }

    return enhancements;
  }
}

export const complianceMappingEngine = new ComplianceMappingEngine();
