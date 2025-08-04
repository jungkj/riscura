'use client';

import {
  EnhancedControl,
  ControlFramework,
  ControlAIAssessment,
  AIControlRecommendation,
  ControlBulkOperation,
  AdvancedControlFilters,
  ControlAnalytics,
  ControlTest,
  ControlDeficiency,
  TestingSchedule,
  RiskCoverageAnalysis,
  MaturityAssessment,
  AutomationAssessment,
  ControlAnalyticsTrend,
  MaturityGap,
  MaturityRoadmap,
} from '@/types/enhanced-control.types';
import { Control } from '@/types';

export class EnhancedControlService {
  constructor() {}

  // AI-Powered Control Assessment
  async analyzeControlWithAI(control: EnhancedControl): Promise<ControlAIAssessment> {
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'control_assessment',
          data: {
            control,
            includeMaturity: true,
            includeGapAnalysis: true,
            includeAutomation: true,
            includeRiskCoverage: true,
          },
        }),
      });

      const result = await response.json();
      return result.assessment || this.getMockControlAssessment();
    } catch (error) {
      // console.error('AI control assessment failed:', error);
      return this.getMockControlAssessment();
    }
  }

  // Control Effectiveness Scoring
  async calculateEffectivenessScore(control: EnhancedControl): Promise<number> {
    const weights = {
      testResults: 0.4, // 40% - Testing outcomes
      maturity: 0.25, // 25% - Maturity level
      automation: 0.15, // 15% - Automation level
      compliance: 0.1, // 10% - Compliance status
      deficiencies: 0.1, // 10% - Outstanding deficiencies
    };

    // Calculate test results score
    const passRate =
      control.testingHistory.length > 0
        ? (control.testingHistory.filter((t) => t.overallResult === 'passed').length /
            control.testingHistory.length) *
          100
        : 0;

    // Calculate maturity score
    const maturityScore = (control.maturityLevel / 5) * 100;

    // Calculate automation score
    const automationScore = control.aiAssessment?.automationPotential.currentAutomationLevel || 0;

    // Calculate compliance score
    const complianceScore =
      control.complianceMapping.length > 0
        ? (control.complianceMapping.filter((m) => m.complianceStatus === 'compliant').length /
            control.complianceMapping.length) *
          100
        : 100;

    // Calculate deficiency impact (inverted)
    const criticalDeficiencies = control.testingHistory
      .flatMap((t) => t.deficiencies)
      .filter((d) => d.severity === 'critical' && d.status === 'open').length;
    const deficiencyScore = Math.max(0, 100 - criticalDeficiencies * 20);

    // Weighted average
    const effectivenessScore =
      passRate * weights.testResults +
      maturityScore * weights.maturity +
      automationScore * weights.automation +
      complianceScore * weights.compliance +
      deficiencyScore * weights.deficiencies;

    return Math.round(effectivenessScore);
  }

  // Risk-to-Control Mapping Analysis
  async analyzeRiskControlMapping(controlId: string, risks: any[]): Promise<RiskCoverageAnalysis> {
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'risk_control_mapping',
          data: { controlId, risks },
        }),
      });

      const result = await response.json();
      return result.mapping || this.getMockRiskCoverage();
    } catch (error) {
      // console.error('Risk-control mapping analysis failed:', error);
      return this.getMockRiskCoverage();
    }
  }

  // Generate Control Recommendations
  async generateControlRecommendations(
    risks: any[],
    existingControls: EnhancedControl[]
  ): Promise<AIControlRecommendation[]> {
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'control_recommendations',
          data: { risks, existingControls },
        }),
      });

      const result = await response.json();
      return result.recommendations || this.getMockRecommendations();
    } catch (error) {
      // console.error('Control recommendations generation failed:', error);
      return this.getMockRecommendations();
    }
  }

  // Control Testing Workflow
  async scheduleControlTest(
    controlId: string,
    testType: string,
    schedule: TestingSchedule
  ): Promise<{ success: boolean; testId?: string }> {
    try {
      // In a real implementation, this would integrate with a scheduling system
      const testId = `test-${Date.now()}`;

      // Calculate next test date based on frequency
      const nextTestDate = this.calculateNextTestDate(schedule);

      // console.log(`Scheduled ${testType} test for control ${controlId}`, {
        testId,
        nextTestDate,
        schedule,
      });

      return { success: true, testId };
    } catch (error) {
      // console.error('Control test scheduling failed:', error);
      return { success: false };
    }
  }

  // Maturity Assessment
  async assessControlMaturity(control: EnhancedControl): Promise<MaturityAssessment> {
    const currentLevel = control.maturityLevel;

    // Determine target level based on risk criticality and industry standards
    const targetLevel = this.determineTargetMaturityLevel(control);

    const maturityGaps = this.identifyMaturityGaps(currentLevel, targetLevel);
    const roadmap = this.generateMaturityRoadmap(currentLevel, targetLevel);

    return {
      currentLevel,
      targetLevel,
      maturityGaps,
      roadmapToTarget: roadmap,
    };
  }

  // Automation Potential Analysis
  async analyzeAutomationPotential(control: EnhancedControl): Promise<AutomationAssessment> {
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'automation_analysis',
          data: { control },
        }),
      });

      const result = await response.json();
      return result.automation || this.getMockAutomationAssessment();
    } catch (error) {
      // console.error('Automation analysis failed:', error);
      return this.getMockAutomationAssessment();
    }
  }

  // Control Framework Library
  async getControlFrameworks(): Promise<ControlFramework[]> {
    return [
      {
        id: 'soc2-cc6.1',
        name: 'Logical and Physical Access Controls',
        version: '2017',
        category: 'SOC2',
        domain: 'Common Criteria',
        subdomain: 'CC6.1',
        controlObjective:
          'Implement logical and physical access controls to restrict access to information assets',
        requirements: [
          'Access controls are implemented to restrict access to information and system resources',
          'Physical access to facilities and systems is restricted to authorized personnel',
          'Logical access controls are implemented and regularly reviewed',
        ],
      },
      {
        id: 'iso27001-a9.1.1',
        name: 'Access Control Policy',
        version: '2013',
        category: 'ISO27001',
        domain: 'Access Control',
        subdomain: 'A.9.1.1',
        controlObjective: 'Establish, document and review access control policy',
        requirements: [
          'Access control policy shall be established',
          'Policy shall be documented and communicated',
          'Policy shall be regularly reviewed and updated',
        ],
      },
      {
        id: 'nist-ac-1',
        name: 'Access Control Policy and Procedures',
        version: '800-53 Rev 5',
        category: 'NIST',
        domain: 'Access Control',
        subdomain: 'AC-1',
        controlObjective: 'Develop, document, and disseminate access control policy and procedures',
        requirements: [
          'Develop and document access control policy',
          'Disseminate policy to relevant personnel',
          'Review and update policy periodically',
        ],
      },
    ];
  }

  // Advanced Filtering
  filterControls(controls: EnhancedControl[], filters: AdvancedControlFilters): EnhancedControl[] {
    return controls.filter((control) => {
      // Framework filter
      if (filters.framework && filters.framework.length > 0) {
        if (!filters.framework.includes(control.framework.category)) return false;
      }

      // Control type filter
      if (filters.controlType && filters.controlType.length > 0) {
        if (!filters.controlType.includes(control.controlType)) return false;
      }

      // Control nature filter
      if (filters.controlNature && filters.controlNature.length > 0) {
        if (!filters.controlNature.includes(control.controlNature)) return false;
      }

      // Maturity level filter
      if (filters.maturityLevel && filters.maturityLevel.length > 0) {
        if (!filters.maturityLevel.includes(control.maturityLevel)) return false;
      }

      // Effectiveness range filter
      if (filters.effectivenessRange) {
        if (
          control.effectivenessScore < filters.effectivenessRange.min ||
          control.effectivenessScore > filters.effectivenessRange.max
        ) {
          return false;
        }
      }

      // Testing status filter
      if (filters.testingStatus && filters.testingStatus.length > 0) {
        if (!filters.testingStatus.includes(control.testingStatus)) return false;
      }

      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const searchableText = [
          control.title,
          control.description,
          control.framework.name,
          control.framework.controlObjective,
        ]
          .join(' ')
          .toLowerCase();

        if (!searchableText.includes(query)) return false;
      }

      // Has deficiencies filter
      if (filters.hasDeficiencies !== undefined) {
        const hasOpenDeficiencies = control.testingHistory.some((test) =>
          test.deficiencies.some((def) => def.status === 'open')
        );
        if (filters.hasDeficiencies && !hasOpenDeficiencies) return false;
        if (!filters.hasDeficiencies && hasOpenDeficiencies) return false;
      }

      return true;
    });
  }

  // Bulk Operations
  async performBulkOperation(
    operation: ControlBulkOperation
  ): Promise<{ success: boolean; errors?: string[] }> {
    try {
      switch (operation.type) {
        case 'test':
          return await this.bulkScheduleTests(operation.controlIds, operation.data);
        case 'update':
          return await this.bulkUpdate(operation.controlIds, operation.data);
        case 'approve':
          return await this.bulkApprove(operation.controlIds, operation.userId);
        case 'retire':
          return await this.bulkRetire(operation.controlIds, operation.userId);
        case 'export':
          return await this.bulkExport(operation.controlIds, operation.data);
        case 'assign':
          return await this.bulkAssign(operation.controlIds, operation.data);
        default:
          throw new Error(`Unsupported bulk operation: ${operation.type}`);
      }
    } catch (error) {
      // console.error('Bulk operation failed:', error);
      return { success: false, errors: [error instanceof Error ? error.message : 'Unknown error'] };
    }
  }

  // Analytics Generation
  async generateControlAnalytics(controls: EnhancedControl[]): Promise<ControlAnalytics> {
    const totalControls = controls.length;

    const controlsByFramework = controls.reduce(
      (acc, control) => {
        acc[control.framework.category] = (acc[control.framework.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const controlsByType = controls.reduce(
      (acc, control) => {
        acc[control.controlType] = (acc[control.controlType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const controlsByMaturity = controls.reduce(
      (acc, control) => {
        acc[control.maturityLevel] = (acc[control.maturityLevel] || 0) + 1;
        return acc;
      },
      {} as Record<number, number>
    );

    const averageEffectiveness =
      controls.reduce((sum, control) => sum + control.effectivenessScore, 0) / totalControls;

    const testingMetrics = this.calculateTestingMetrics(controls);
    const deficiencyMetrics = this.calculateDeficiencyMetrics(controls);
    const complianceMetrics = this.calculateComplianceMetrics(controls);

    const trendData = this.generateAnalyticsTrendData(controls);
    const topPerformingControls = controls
      .sort((a, b) => b.effectivenessScore - a.effectivenessScore)
      .slice(0, 10);

    const controlsNeedingAttention = controls
      .filter((c) => c.effectivenessScore < 70 || c.testingStatus === 'overdue')
      .sort((a, b) => a.effectivenessScore - b.effectivenessScore)
      .slice(0, 10);

    return {
      totalControls,
      controlsByFramework,
      controlsByType,
      controlsByMaturity,
      averageEffectiveness,
      testingMetrics,
      deficiencyMetrics,
      complianceMetrics,
      trendData,
      topPerformingControls,
      controlsNeedingAttention,
    };
  }

  // Convert regular Control to EnhancedControl
  enhanceControl(control: Control): EnhancedControl {
    return {
      ...control,
      controlId: control.id,
      framework: {
        id: 'iso27001-a9.1.1',
        name: 'Access Control Policy',
        version: '2013',
        category: 'ISO27001',
        domain: 'Access Control',
        subdomain: 'A.9.1.1',
        controlObjective: 'Establish, document and review access control policy',
        requirements: ['Access control policy shall be established'],
      },
      controlType: 'preventive',
      controlNature: 'manual',
      frequency: 'monthly',
      mappedRisks: [],
      parentControls: [],
      childControls: [],
      relatedControls: [],
      maturityLevel: 3,
      effectivenessScore: 75,
      performanceMetrics: {
        testingFrequency: 12,
        passRate: 85,
        averageTestDuration: 2,
        costPerTest: 500,
        autoDetectionRate: 0,
        falsePositiveRate: 0,
        timeToDetection: 0,
        timeToResponse: 0,
      },
      testingHistory: [],
      aiRecommendations: [],
      riskMitigationEffectiveness: [],
      testingSchedule: {
        frequency: 'monthly',
        testingWindows: [],
        autoScheduling: false,
        reminderSettings: {
          enabled: true,
          daysBeforeDue: [7, 3, 1],
          recipients: [control.owner],
          escalation: {
            enabled: true,
            daysOverdue: [1, 3, 7],
            escalationPath: [],
          },
        },
      },
      testingStatus: 'not_tested',
      lastTestPerformed: control.lastTestDate ? new Date(control.lastTestDate) : undefined,
      nextTestScheduled: control.nextTestDate ? new Date(control.nextTestDate) : undefined,
      testingEvidence: [],
      complianceMapping: [],
      regulatoryRequirements: [],
      industryBenchmarks: [],
      assignments: [],
      reviews: [],
      approvals: [],
      controlComments: [],
      procedures: [],
      evidenceRequirements: [],
      auditTrail: [],
      trendData: [],
      benchmarkComparison: {
        industry: 'Technology',
        peerGroup: 'Mid-size companies',
        metrics: [],
        position: 'average',
        improvementAreas: [],
      },
    };
  }

  // Private helper methods
  private getMockControlAssessment(): ControlAIAssessment {
    return {
      overallScore: 75,
      designEffectiveness: 80,
      operatingEffectiveness: 70,
      maturityAssessment: {
        currentLevel: 3,
        targetLevel: 4,
        maturityGaps: [],
        roadmapToTarget: [],
      },
      gapAnalysis: [],
      improvementOpportunities: [],
      automationPotential: this.getMockAutomationAssessment(),
      riskCoverage: this.getMockRiskCoverage(),
      confidenceScore: 0.8,
      lastAnalyzed: new Date(),
    };
  }

  private getMockRiskCoverage(): RiskCoverageAnalysis {
    return {
      totalRisksCovered: 5,
      riskCoveragePercentage: 85,
      criticalRisksCovered: 3,
      gaps: [],
      redundancies: [],
    };
  }

  private getMockRecommendations(): AIControlRecommendation[] {
    return [
      {
        id: 'rec-1',
        type: 'enhance_existing',
        title: 'Implement Automated Monitoring',
        description: 'Add automated monitoring capabilities to improve detection',
        rationale: 'Current manual processes are prone to delays',
        priority: 'medium',
        effort: 'medium',
        expectedBenefit: 'Faster detection and response times',
        implementationSteps: [
          'Evaluate monitoring tools',
          'Implement solution',
          'Test and validate',
        ],
        timeline: 8,
        cost: 15000,
        riskReduction: 25,
        affectedRisks: [],
        confidenceScore: 0.85,
      },
    ];
  }

  private getMockAutomationAssessment(): AutomationAssessment {
    return {
      automationScore: 60,
      automationPotential: 'medium',
      automationOpportunities: [],
      currentAutomationLevel: 30,
      targetAutomationLevel: 70,
    };
  }

  private calculateNextTestDate(schedule: TestingSchedule): Date {
    const now = new Date();
    const nextDate = new Date(now);

    switch (schedule.frequency) {
      case 'daily':
        nextDate.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(now.getMonth() + 1);
        break;
      case 'quarterly':
        nextDate.setMonth(now.getMonth() + 3);
        break;
      case 'annually':
        nextDate.setFullYear(now.getFullYear() + 1);
        break;
      default:
        nextDate.setDate(now.getDate() + (schedule.customFrequency || 30));
    }

    return nextDate;
  }

  private determineTargetMaturityLevel(control: EnhancedControl): 1 | 2 | 3 | 4 | 5 {
    // Logic to determine target maturity based on risk criticality and industry standards
    const criticalRisks = control.mappedRisks.length;
    if (criticalRisks > 5) return 5;
    if (criticalRisks > 3) return 4;
    return Math.min(5, control.maturityLevel + 1) as 1 | 2 | 3 | 4 | 5;
  }

  private identifyMaturityGaps(current: number, target: number): MaturityGap[] {
    const gaps: MaturityGap[] = [];
    for (let level = current + 1; level <= target; level++) {
      gaps.push({
        area: `Level ${level} Requirements`,
        currentState: `Level ${current}`,
        desiredState: `Level ${level}`,
        effort: level - current > 1 ? 'high' : 'medium',
        priority: level,
      });
    }
    return gaps;
  }

  private generateMaturityRoadmap(current: number, target: number): MaturityRoadmap[] {
    const roadmap: MaturityRoadmap[] = [];
    for (let level = current + 1; level <= target; level++) {
      roadmap.push({
        phase: level - current,
        milestone: `Achieve Maturity Level ${level}`,
        activities: [`Implement Level ${level} processes`, `Document procedures`, `Train staff`],
        duration: 12,
        dependencies: level > current + 1 ? [`Level ${level - 1} completion`] : [],
        resources: ['Process analyst', 'Training coordinator'],
      });
    }
    return roadmap;
  }

  private async bulkScheduleTests(controlIds: string[], data: any): Promise<{ success: boolean }> {
    // console.log('Bulk scheduling tests for controls:', controlIds, data);
    return { success: true };
  }

  private async bulkUpdate(controlIds: string[], data: any): Promise<{ success: boolean }> {
    // console.log('Bulk updating controls:', controlIds, data);
    return { success: true };
  }

  private async bulkApprove(controlIds: string[], userId: string): Promise<{ success: boolean }> {
    // console.log('Bulk approving controls:', controlIds, 'by user:', userId);
    return { success: true };
  }

  private async bulkRetire(controlIds: string[], userId: string): Promise<{ success: boolean }> {
    // console.log('Bulk retiring controls:', controlIds, 'by user:', userId);
    return { success: true };
  }

  private async bulkExport(controlIds: string[], options: any): Promise<{ success: boolean }> {
    // console.log('Bulk exporting controls:', controlIds, options);
    return { success: true };
  }

  private async bulkAssign(
    controlIds: string[],
    assignmentData: any
  ): Promise<{ success: boolean }> {
    // console.log('Bulk assigning controls:', controlIds, assignmentData);
    return { success: true };
  }

  private calculateTestingMetrics(controls: EnhancedControl[]): any {
    const totalTests = controls.reduce((sum, c) => sum + c.testingHistory.length, 0);
    const passedTests = controls.reduce(
      (sum, c) => sum + c.testingHistory.filter((t) => t.overallResult === 'passed').length,
      0
    );

    return {
      totalTestsCompleted: totalTests,
      overallPassRate: totalTests > 0 ? (passedTests / totalTests) * 100 : 0,
      averageTestDuration: 2.5,
      overdueTests: controls.filter((c) => c.testingStatus === 'overdue').length,
      upcomingTests: controls.filter((c) => c.testingStatus === 'scheduled').length,
      testingFrequencyCompliance: 85,
    };
  }

  private calculateDeficiencyMetrics(controls: EnhancedControl[]): any {
    const allDeficiencies = controls.flatMap((c) =>
      c.testingHistory.flatMap((t) => t.deficiencies)
    );

    return {
      totalDeficiencies: allDeficiencies.length,
      openDeficiencies: allDeficiencies.filter((d) => d.status === 'open').length,
      criticalDeficiencies: allDeficiencies.filter((d) => d.severity === 'critical').length,
      averageResolutionTime: 15,
      deficiencyTrends: [],
    };
  }

  private calculateComplianceMetrics(controls: EnhancedControl[]): any {
    const allMappings = controls.flatMap((c) => c.complianceMapping);
    const compliantMappings = allMappings.filter((m) => m.complianceStatus === 'compliant');

    return {
      overallComplianceScore:
        allMappings.length > 0 ? (compliantMappings.length / allMappings.length) * 100 : 100,
      frameworkCompliance: {},
      gapsIdentified: allMappings.filter((m) => m.gaps.length > 0).length,
      remediationProgress: 75,
    };
  }

  private generateAnalyticsTrendData(controls: EnhancedControl[]): ControlAnalyticsTrend[] {
    const trendData: ControlAnalyticsTrend[] = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);

      trendData.push({
        date,
        totalControls: controls.length,
        averageEffectiveness: 75 + (Math.random() - 0.5) * 10,
        testsCompleted: Math.floor(controls.length * 0.8 + (Math.random() - 0.5) * 10),
        deficienciesIdentified: Math.floor(Math.random() * 5),
        complianceScore: 85 + (Math.random() - 0.5) * 15,
      });
    }

    return trendData;
  }
}
