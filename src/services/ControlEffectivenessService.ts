// import { Control, Risk } from '@/types'

export interface ControlEffectivenessAssessment {
  controlId: string;
  effectivenessScore: number; // 0-100 scale
  testingResults: ControlTestingResult[];
  coverageAnalysis: ControlCoverageAnalysis;
  gapAnalysis: ControlGapAnalysis;
  recommendations: ControlRecommendation[];
  lastAssessed: Date;
  nextAssessment: Date;
  assessor: string;
  confidence: number;
}

export interface ControlTestingResult {
  testId: string;
  testType: 'design' | 'operating' | 'compliance' | 'effectiveness';
  testDate: Date;
  testResult: 'passed' | 'failed' | 'partial' | 'not_tested';
  findings: string[];
  evidence: string[];
  score: number; // 0-100
  tester: string;
  remediation?: RemediationPlan;
}

export interface ControlCoverageAnalysis {
  totalRisks: number;
  coveredRisks: number;
  coveragePercentage: number;
  uncoveredRisks: string[]; // risk IDs
  overlapAnalysis: ControlOverlap[];
  gapAreas: string[];
}

export interface ControlOverlap {
  riskId: string;
  controlIds: string[];
  overlapType: 'redundant' | 'complementary' | 'conflicting';
  efficiency: number; // 0-100
  recommendation: string;
}

export interface ControlGapAnalysis {
  identifiedGaps: ControlGap[];
  riskExposure: number; // 0-100
  priorityGaps: ControlGap[];
  mitigationSuggestions: GapMitigationSuggestion[];
}

export interface ControlGap {
  gapId: string;
  gapType: 'coverage' | 'design' | 'implementation' | 'testing' | 'monitoring';
  description: string;
  affectedRisks: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: number; // 0-100
  likelihood: number; // 0-100
  currentState: string;
  desiredState: string;
  effort: 'low' | 'medium' | 'high';
  cost: number;
}

export interface GapMitigationSuggestion {
  gapId: string;
  suggestion: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedCost: number;
  estimatedTime: number; // days
  expectedBenefit: string;
  implementation: string[];
}

export interface ControlRecommendation {
  id: string;
  type: 'improve' | 'replace' | 'supplement' | 'remove';
  title: string;
  description: string;
  rationale: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedCost: number;
  estimatedTime: number; // days
  expectedImprovement: number; // percentage points
  implementation: string[];
  success: string[];
}

export interface RemediationPlan {
  planId: string;
  findings: string[];
  actions: RemediationAction[];
  timeline: number; // days
  owner: string;
  status: 'planned' | 'in_progress' | 'completed' | 'overdue';
  dueDate: Date;
}

export interface RemediationAction {
  actionId: string;
  description: string;
  owner: string;
  dueDate: Date;
  status: 'not_started' | 'in_progress' | 'completed';
  evidence: string[];
}

export class ControlEffectivenessService {
  /**
   * Assess overall control effectiveness using multiple algorithms
   */
  async assessControlEffectiveness(
    control: Control,
    relatedRisks: Risk[] = [],
    testingHistory: ControlTestingResult[] = []
  ): Promise<ControlEffectivenessAssessment> {
    // Calculate base effectiveness score
    const baseScore = this.calculateBaseEffectivenessScore(control)

    // Factor in testing results
    const testingScore = this.calculateTestingEffectivenessScore(testingHistory)

    // Analyze control coverage
    const coverageAnalysis = await this.analyzeControlCoverage(control, relatedRisks)

    // Perform gap analysis
    const gapAnalysis = await this.performControlGapAnalysis(control, relatedRisks, testingHistory)

    // Generate recommendations
    const recommendations = await this.generateControlRecommendations(
      control,
      baseScore,
      testingScore,
      gapAnalysis
    )

    // Calculate final effectiveness score (weighted average)
    const effectivenessScore = Math.round(
      baseScore * 0.4 +
        testingScore * 0.3 +
        coverageAnalysis.coveragePercentage * 0.2 +
        (100 - gapAnalysis.riskExposure) * 0.1
    )

    // Calculate confidence based on data quality
    const confidence = this.calculateAssessmentConfidence(control, testingHistory, relatedRisks)

    return {
      controlId: control.id,
      effectivenessScore,
      testingResults: testingHistory,
      coverageAnalysis,
      gapAnalysis,
      recommendations,
      lastAssessed: new Date(),
      nextAssessment: this.calculateNextAssessmentDate(control, effectivenessScore),
      assessor: 'ARIA Control Assessment Engine',
      confidence,
    }
  }

  /**
   * Calculate base effectiveness score from control attributes
   */
  private calculateBaseEffectivenessScore(control: Control): number {
    let score = 50; // baseline

    // Control type effectiveness weights
    const typeWeights = {
      preventive: 1.2,
      detective: 1.0,
      corrective: 0.8,
    }

    score *= typeWeights[control.type] || 1.0;

    // Frequency factor
    const frequencyScores = {
      continuous: 100,
      daily: 95,
      weekly: 85,
      monthly: 75,
      quarterly: 65,
      annually: 50,
      'ad-hoc': 30,
    }

    const frequencyScore = frequencyScores[control.frequency.toLowerCase()] || 50;
    score = (score + frequencyScore) / 2;

    // Status factor
    const statusMultipliers = {
      active: 1.0,
      inactive: 0.2,
      planned: 0.1,
    }

    score *= statusMultipliers[control.status] || 0.5;

    // Owner assignment factor
    if (control.owner) {
      score *= 1.1; // 10% bonus for having an owner
    }

    // Evidence factor
    if (control.evidence && control.evidence.length > 0) {
      score *= 1.05; // 5% bonus for having evidence
    }

    return Math.min(100, Math.max(0, Math.round(score)));
  }

  /**
   * Calculate effectiveness score based on testing results
   */
  private calculateTestingEffectivenessScore(testingHistory: ControlTestingResult[]): number {
    if (!testingHistory || testingHistory.length === 0) {
      return 30; // Low score for no testing
    }

    // Weight recent tests more heavily
    const now = new Date()
    let weightedScore = 0;
    let totalWeight = 0;

    testingHistory.forEach((test) => {
      const daysSinceTest = Math.floor(
        (now.getTime() - test.testDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const recencyWeight = Math.max(0.1, 1 - daysSinceTest / 365); // Decay over a year

      // Test type weights
      const testTypeWeights = {
        design: 0.8,
        operating: 1.0,
        compliance: 0.9,
        effectiveness: 1.2,
      }

      const testWeight = (testTypeWeights[test.testType] || 1.0) * recencyWeight;

      weightedScore += test.score * testWeight;
      totalWeight += testWeight;
    });

    return totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 30;
  }

  /**
   * Analyze control coverage across risks
   */
  async analyzeControlCoverage(
    control: Control,
    relatedRisks: Risk[]
  ): Promise<ControlCoverageAnalysis> {
    const totalRisks = relatedRisks.length;
    const coveredRisks = control.linkedRisks?.length || 0;
    const coveragePercentage = totalRisks > 0 ? Math.round((coveredRisks / totalRisks) * 100) : 0;

    // Identify uncovered risks
    const linkedRiskIds = new Set(control.linkedRisks || [])
    const uncoveredRisks = relatedRisks
      .filter((risk) => !linkedRiskIds.has(risk.id))
      .map((risk) => risk.id);

    // Analyze overlaps (simplified - would need other controls data)
    const overlapAnalysis: ControlOverlap[] = []

    // Identify gap areas based on uncovered risks
    const gapAreas = this.identifyGapAreas(relatedRisks, control.linkedRisks || [])

    return {
      totalRisks,
      coveredRisks,
      coveragePercentage,
      uncoveredRisks,
      overlapAnalysis,
      gapAreas,
    }
  }

  /**
   * Perform comprehensive control gap analysis
   */
  async performControlGapAnalysis(
    control: Control,
    relatedRisks: Risk[],
    testingHistory: ControlTestingResult[]
  ): Promise<ControlGapAnalysis> {
    const gaps: ControlGap[] = [];

    // Coverage gaps
    const uncoveredRisks = relatedRisks.filter((risk) => !control.linkedRisks?.includes(risk.id))

    if (uncoveredRisks.length > 0) {
      gaps.push({
        gapId: `coverage-${control.id}`,
        gapType: 'coverage',
        description: `Control does not cover ${uncoveredRisks.length} related risks`,
        affectedRisks: uncoveredRisks.map((r) => r.id),
        severity: uncoveredRisks.length > 3 ? 'high' : 'medium',
        impact: Math.min(100, uncoveredRisks.length * 20),
        likelihood: 70,
        currentState: `${control.linkedRisks?.length || 0} risks covered`,
        desiredState: `${relatedRisks.length} risks covered`,
        effort: uncoveredRisks.length > 5 ? 'high' : 'medium',
        cost: uncoveredRisks.length * 1000,
      });
    }

    // Testing gaps
    const recentTests = testingHistory.filter((test) => {
      const daysSince = (new Date().getTime() - test.testDate.getTime()) / (1000 * 60 * 60 * 24)
      return daysSince <= 365; // Within last year
    });

    if (recentTests.length === 0) {
      gaps.push({
        gapId: `testing-${control.id}`,
        gapType: 'testing',
        description: 'Control has not been tested within the last year',
        affectedRisks: control.linkedRisks || [],
        severity: 'high',
        impact: 80,
        likelihood: 90,
        currentState: 'No recent testing',
        desiredState: 'Regular testing schedule',
        effort: 'medium',
        cost: 5000,
      });
    }

    // Design gaps
    if (!control.owner) {
      gaps.push({
        gapId: `owner-${control.id}`,
        gapType: 'design',
        description: 'Control has no assigned owner',
        affectedRisks: control.linkedRisks || [],
        severity: 'medium',
        impact: 60,
        likelihood: 80,
        currentState: 'No owner assigned',
        desiredState: 'Clear ownership defined',
        effort: 'low',
        cost: 500,
      })
    }

    // Calculate overall risk exposure
    const totalImpact = gaps.reduce((sum, gap) => sum + gap.impact, 0)
    const riskExposure = Math.min(100, totalImpact / gaps.length || 0);

    // Identify priority gaps
    const priorityGaps = gaps
      .filter((gap) => gap.severity === 'high' || gap.severity === 'critical')
      .sort((a, b) => b.impact * b.likelihood - a.impact * a.likelihood)

    // Generate mitigation suggestions
    const mitigationSuggestions = this.generateGapMitigationSuggestions(gaps)

    return {
      identifiedGaps: gaps,
      riskExposure,
      priorityGaps,
      mitigationSuggestions,
    }
  }

  /**
   * Generate control improvement recommendations
   */
  async generateControlRecommendations(
    control: Control,
    baseScore: number,
    testingScore: number,
    gapAnalysis: ControlGapAnalysis
  ): Promise<ControlRecommendation[]> {
    const recommendations: ControlRecommendation[] = [];

    // Low effectiveness recommendations
    if (baseScore < 60) {
      recommendations.push({
        id: `improve-${control.id}`,
        type: 'improve',
        title: 'Enhance Control Design',
        description: 'Control effectiveness is below acceptable threshold',
        rationale: `Current effectiveness score of ${baseScore}% indicates design improvements needed`,
        priority: baseScore < 40 ? 'critical' : 'high',
        estimatedCost: 10000,
        estimatedTime: 30,
        expectedImprovement: 25,
        implementation: [
          'Review control design and procedures',
          'Update control documentation',
          'Enhance monitoring mechanisms',
          'Provide additional training',
        ],
        success: [
          'Effectiveness score > 70%',
          'Reduced control failures',
          'Improved risk coverage',
        ],
      })
    }

    // Testing recommendations
    if (testingScore < 50) {
      recommendations.push({
        id: `testing-${control.id}`,
        type: 'improve',
        title: 'Implement Regular Testing',
        description: 'Control testing is inadequate or outdated',
        rationale: `Testing score of ${testingScore}% indicates insufficient validation`,
        priority: 'high',
        estimatedCost: 5000,
        estimatedTime: 15,
        expectedImprovement: 20,
        implementation: [
          'Establish testing schedule',
          'Define testing procedures',
          'Train testing personnel',
          'Implement testing tools',
        ],
        success: [
          'Regular testing completed',
          'Testing score > 70%',
          'Issues identified and resolved',
        ],
      })
    }

    // Gap-based recommendations
    gapAnalysis.priorityGaps.forEach((gap) => {
      recommendations.push({
        id: `gap-${gap.gapId}`,
        type: 'improve',
        title: `Address ${gap.gapType} Gap`,
        description: gap.description,
        rationale: `Gap poses ${gap.severity} risk with ${gap.impact}% impact`,
        priority: gap.severity as any,
        estimatedCost: gap.cost,
        estimatedTime: gap.effort === 'high' ? 60 : gap.effort === 'medium' ? 30 : 15,
        expectedImprovement: Math.round(gap.impact / 5),
        implementation: [`Transition from "${gap.currentState}" to "${gap.desiredState}"`],
        success: ['Gap closed', 'Risk exposure reduced'],
      })
    });

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Calculate control-to-risk mapping effectiveness
   */
  async calculateControlRiskMappingEffectiveness(
    controlId: string,
    riskId: string,
    mappingData: {
      controlType: string;
      riskCategory: string;
      implementationQuality: number; // 0-100
      testingResults: number; // 0-100
      frequency: string;
    }
  ): Promise<{
    mappingEffectiveness: number;
    factors: Array<{ factor: string; score: number; weight: number }>;
    recommendations: string[];
  }> {
    const factors = [];

    // Control type vs risk category alignment
    const alignmentScore = this.calculateTypeRiskAlignment(
      mappingData.controlType,
      mappingData.riskCategory
    )
    factors.push({ factor: 'Type-Risk Alignment', score: alignmentScore, weight: 0.3 });

    // Implementation quality
    factors.push({
      factor: 'Implementation Quality',
      score: mappingData.implementationQuality,
      weight: 0.25,
    })

    // Testing effectiveness
    factors.push({
      factor: 'Testing Results',
      score: mappingData.testingResults,
      weight: 0.25,
    })

    // Frequency appropriateness
    const frequencyScore = this.calculateFrequencyScore(
      mappingData.frequency,
      mappingData.riskCategory
    )
    factors.push({ factor: 'Frequency Appropriateness', score: frequencyScore, weight: 0.2 });

    // Calculate weighted effectiveness
    const mappingEffectiveness = Math.round(
      factors.reduce((sum, factor) => sum + factor.score * factor.weight, 0)
    )

    // Generate recommendations
    const recommendations = this.generateMappingRecommendations(factors, mappingEffectiveness)

    return {
      mappingEffectiveness,
      factors,
      recommendations,
    }
  }

  // Helper methods
  private identifyGapAreas(allRisks: Risk[], coveredRiskIds: string[]): string[] {
    const uncoveredRisks = allRisks.filter((risk) => !coveredRiskIds.includes(risk.id))
    const _categories = [...new Set(uncoveredRisks.map((risk) => risk.category))];
    return categories.map((cat) => `${cat} risks not adequately covered`);
  }

  private generateGapMitigationSuggestions(gaps: ControlGap[]): GapMitigationSuggestion[] {
    return gaps.map((gap) => ({
      gapId: gap.gapId,
      suggestion: `Implement ${gap.gapType} improvements to address: ${gap.description}`,
      priority: gap.severity as any,
      estimatedCost: gap.cost,
      estimatedTime: gap.effort === 'high' ? 60 : gap.effort === 'medium' ? 30 : 15,
      expectedBenefit: `Reduce risk exposure by ${Math.round(gap.impact / 2)}%`,
      implementation: [`Move from "${gap.currentState}" to "${gap.desiredState}"`],
    }));
  }

  private calculateAssessmentConfidence(
    control: Control,
    testingHistory: ControlTestingResult[],
    relatedRisks: Risk[]
  ): number {
    let confidence = 50; // base confidence

    // More testing history increases confidence
    if (testingHistory.length > 0) confidence += 20
    if (testingHistory.length > 3) confidence += 10;

    // Recent testing increases confidence
    const recentTests = testingHistory.filter((test) => {
      const daysSince = (new Date().getTime() - test.testDate.getTime()) / (1000 * 60 * 60 * 24)
      return daysSince <= 90;
    });
    if (recentTests.length > 0) confidence += 15;

    // Clear ownership increases confidence
    if (control.owner) confidence += 10

    // Evidence availability increases confidence
    if (control.evidence && control.evidence.length > 0) confidence += 5

    return Math.min(100, confidence);
  }

  private calculateNextAssessmentDate(control: Control, effectivenessScore: number): Date {
    const now = new Date();
    let monthsUntilNext = 12; // default annual

    // More frequent assessment for less effective controls
    if (effectivenessScore < 50) monthsUntilNext = 3
    else if (effectivenessScore < 70) monthsUntilNext = 6;
    else if (effectivenessScore < 85) monthsUntilNext = 9;

    // High-risk controls need more frequent assessment
    if (control.linkedRisks && control.linkedRisks.length > 5) {
      monthsUntilNext = Math.max(3, monthsUntilNext - 3)
    }

    now.setMonth(now.getMonth() + monthsUntilNext);
    return now;
  }

  private calculateTypeRiskAlignment(controlType: string, riskCategory: string): number {
    const alignmentMatrix: Record<string, Record<string, number>> = {
      preventive: {
        OPERATIONAL: 90,
        FINANCIAL: 85,
        STRATEGIC: 70,
        COMPLIANCE: 80,
        TECHNOLOGY: 85,
      },
      detective: {
        OPERATIONAL: 80,
        FINANCIAL: 90,
        STRATEGIC: 60,
        COMPLIANCE: 85,
        TECHNOLOGY: 90,
      },
      corrective: {
        OPERATIONAL: 70,
        FINANCIAL: 75,
        STRATEGIC: 80,
        COMPLIANCE: 70,
        TECHNOLOGY: 75,
      },
    }

    return alignmentMatrix[controlType]?.[riskCategory] || 50;
  }

  private calculateFrequencyScore(frequency: string, riskCategory: string): number {
    const frequencyScores: Record<string, number> = {
      continuous: 100,
      daily: 95,
      weekly: 85,
      monthly: 75,
      quarterly: 65,
      annually: 50,
    }

    let score = frequencyScores[frequency.toLowerCase()] || 50;

    // Adjust based on risk category
    if (
      riskCategory === 'TECHNOLOGY' &&
      ['continuous', 'daily'].includes(frequency.toLowerCase())
    ) {
      score += 5; // Technology risks benefit from frequent monitoring
    }

    return Math.min(100, score);
  }

  private generateMappingRecommendations(
    factors: Array<{ factor: string; score: number; weight: number }>,
    overallScore: number
  ): string[] {
    const recommendations: string[] = [];

    if (overallScore < 60) {
      recommendations.push('Consider redesigning the control-risk mapping');
    }

    factors.forEach((factor) => {
      if (factor.score < 60) {
        switch (factor.factor) {
          case 'Type-Risk Alignment':
            recommendations.push('Review control type appropriateness for this risk category');
            break;
          case 'Implementation Quality':
            recommendations.push('Improve control implementation and documentation');
            break;
          case 'Testing Results':
            recommendations.push('Enhance testing procedures and frequency');
            break;
          case 'Frequency Appropriateness':
            recommendations.push('Adjust control frequency based on risk characteristics');
            break;
        }
      }
    });

    return recommendations;
  }
}

export const controlEffectivenessService = new ControlEffectivenessService();
