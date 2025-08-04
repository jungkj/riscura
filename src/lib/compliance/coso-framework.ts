import { Risk, Control } from '@/types';

export interface COSOComponent {
  id: string;
  name: string;
  description: string;
  principles: COSOPrinciple[];
  focusPoints: string[];
  assessmentCriteria: AssessmentCriteria[];
}

export interface COSOPrinciple {
  id: string;
  number: number;
  title: string;
  description: string;
  component: string;
  requirements: string[];
  evidenceTypes: string[];
  maturityLevels: MaturityLevel[];
}

export interface AssessmentCriteria {
  criterion: string;
  description: string;
  evidenceRequired: string[];
  testingProcedures: string[];
  ratingScale: RatingScale;
}

export interface MaturityLevel {
  level: number;
  name: string;
  description: string;
  characteristics: string[];
  evidenceIndicators: string[];
}

export interface RatingScale {
  scale: 'effective' | 'largely_effective' | 'partially_effective' | 'ineffective';
  score: number;
  description: string;
  criteria: string[];
}

export interface COSOAssessment {
  organizationId: string;
  assessmentDate: Date;
  assessor: string;
  scope: string;
  componentAssessments: ComponentAssessment[];
  overallRating: 'effective' | 'largely_effective' | 'partially_effective' | 'ineffective';
  overallScore: number;
  deficiencies: Deficiency[];
  materialWeaknesses: MaterialWeakness[];
  recommendations: COSORecommendation[];
  actionPlan: ActionItem[];
  nextAssessment: Date;
}

export interface ComponentAssessment {
  componentId: string;
  principleAssessments: PrincipleAssessment[];
  componentRating: 'effective' | 'largely_effective' | 'partially_effective' | 'ineffective';
  componentScore: number;
  strengths: string[];
  deficiencies: string[];
  recommendations: string[];
}

export interface PrincipleAssessment {
  principleId: string;
  rating: 'effective' | 'largely_effective' | 'partially_effective' | 'ineffective';
  score: number;
  evidence: Evidence[];
  testingResults: TestingResult[];
  findings: string[];
  deficiencies: string[];
}

export interface Evidence {
  type: string;
  description: string;
  source: string;
  quality: 'high' | 'medium' | 'low';
  relevance: 'direct' | 'indirect' | 'supporting';
  date: Date;
}

export interface TestingResult {
  testType: 'design' | 'operating' | 'walkthrough' | 'inquiry';
  result: 'satisfactory' | 'deficient' | 'not_tested';
  findings: string[];
  evidence: string[];
  tester: string;
  date: Date;
}

export interface Deficiency {
  id: string;
  type: 'design' | 'operating' | 'both';
  severity: 'significant' | 'material' | 'minor';
  component: string;
  principle: string;
  description: string;
  impact: string;
  rootCause: string;
  recommendation: string;
  timeline: string;
  owner: string;
  status: 'open' | 'in_progress' | 'resolved';
}

export interface MaterialWeakness {
  id: string;
  title: string;
  description: string;
  affectedComponents: string[];
  affectedPrinciples: string[];
  businessImpact: string;
  financialImpact: number;
  likelihood: 'remote' | 'reasonably_possible' | 'probable';
  remediation: RemediationPlan;
  disclosure: boolean;
}

export interface RemediationPlan {
  planId: string;
  description: string;
  actions: RemediationAction[];
  timeline: number; // days
  owner: string;
  budget: number;
  milestones: Milestone[];
  status: 'planned' | 'in_progress' | 'completed';
}

export interface RemediationAction {
  actionId: string;
  description: string;
  owner: string;
  dueDate: Date;
  status: 'not_started' | 'in_progress' | 'completed';
  dependencies: string[];
  evidence: string[];
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  status: 'not_started' | 'in_progress' | 'completed';
  deliverables: string[];
}

export interface COSORecommendation {
  id: string;
  component: string;
  principle?: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  rationale: string;
  implementation: string[];
  timeline: number; // days
  cost: number;
  benefit: string;
  success: string[];
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  owner: string;
  dueDate: Date;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  dependencies: string[];
  progress: number; // 0-100
}

export interface COSOGapAnalysis {
  componentGaps: ComponentGap[];
  principleGaps: PrincipleGap[];
  overallMaturity: number; // 0-100
  priorityAreas: string[];
  quickWins: string[];
  longTermInitiatives: string[];
  riskExposure: number; // 0-100
}

export interface ComponentGap {
  componentId: string;
  currentMaturity: number;
  targetMaturity: number;
  gap: number;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  priority: number;
  recommendations: string[];
}

export interface PrincipleGap {
  principleId: string;
  currentScore: number;
  targetScore: number;
  gap: number;
  deficiencies: string[];
  recommendations: string[];
  effort: 'high' | 'medium' | 'low';
}

export class COSOFrameworkService {
  private components: Map<string, COSOComponent> = new Map();
  private principles: Map<string, COSOPrinciple> = new Map();

  constructor() {
    this.initializeCOSOFramework();
  }

  /**
   * Initialize COSO 2013 Framework components and principles
   */
  private initializeCOSOFramework(): void {
    // Control Environment Component
    const controlEnvironment: COSOComponent = {
      id: 'control-environment',
      name: 'Control Environment',
      description: 'The foundation for all other components of internal control',
      principles: [],
      focusPoints: [
        'Integrity and ethical values',
        'Board oversight',
        'Management philosophy',
        'Organizational structure',
        'Competence and development',
      ],
      assessmentCriteria: [
        {
          criterion: 'Tone at the top',
          description: 'Management demonstrates commitment to integrity and ethical values',
          evidenceRequired: ['Code of conduct', 'Ethics training', 'Management communications'],
          testingProcedures: ['Interview management', 'Review policies', 'Observe behaviors'],
          ratingScale: {
            scale: 'effective',
            score: 100,
            description: 'Strong tone at the top with clear ethical standards',
            criteria: ['Clear code of conduct', 'Regular ethics training', 'Consistent messaging'],
          },
        },
      ],
    };

    // Risk Assessment Component
    const riskAssessment: COSOComponent = {
      id: 'risk-assessment',
      name: 'Risk Assessment',
      description: 'The identification, analysis, and management of risks',
      principles: [],
      focusPoints: [
        'Objective setting',
        'Risk identification',
        'Risk analysis',
        'Fraud risk assessment',
        'Change management',
      ],
      assessmentCriteria: [
        {
          criterion: 'Risk identification process',
          description: 'Organization has systematic process for identifying risks',
          evidenceRequired: ['Risk registers', 'Risk assessments', 'Process documentation'],
          testingProcedures: [
            'Review risk process',
            'Test risk identification',
            'Validate completeness',
          ],
          ratingScale: {
            scale: 'effective',
            score: 100,
            description: 'Comprehensive and systematic risk identification',
            criteria: ['Documented process', 'Regular updates', 'Stakeholder involvement'],
          },
        },
      ],
    };

    // Control Activities Component
    const controlActivities: COSOComponent = {
      id: 'control-activities',
      name: 'Control Activities',
      description: 'Policies and procedures that help ensure management directives are carried out',
      principles: [],
      focusPoints: [
        'Control selection and development',
        'Technology controls',
        'Policy deployment',
        'Segregation of duties',
        'Authorization controls',
      ],
      assessmentCriteria: [
        {
          criterion: 'Control design',
          description: 'Controls are designed to address identified risks',
          evidenceRequired: ['Control documentation', 'Risk-control matrices', 'Testing results'],
          testingProcedures: [
            'Review control design',
            'Test control operation',
            'Validate effectiveness',
          ],
          ratingScale: {
            scale: 'effective',
            score: 100,
            description: 'Well-designed controls that effectively address risks',
            criteria: [
              'Clear control objectives',
              'Appropriate control activities',
              'Regular testing',
            ],
          },
        },
      ],
    };

    // Information & Communication Component
    const informationCommunication: COSOComponent = {
      id: 'information-communication',
      name: 'Information & Communication',
      description: 'Information systems and communication processes that support internal control',
      principles: [],
      focusPoints: [
        'Information quality',
        'Internal communication',
        'External communication',
        'Information systems',
        'Data governance',
      ],
      assessmentCriteria: [
        {
          criterion: 'Information quality',
          description: 'Information is accurate, complete, and timely',
          evidenceRequired: ['Data quality reports', 'System documentation', 'User feedback'],
          testingProcedures: ['Test data accuracy', 'Review system controls', 'Validate reporting'],
          ratingScale: {
            scale: 'effective',
            score: 100,
            description: 'High-quality information supports decision making',
            criteria: ['Accurate data', 'Timely reporting', 'Accessible information'],
          },
        },
      ],
    };

    // Monitoring Activities Component
    const monitoringActivities: COSOComponent = {
      id: 'monitoring-activities',
      name: 'Monitoring Activities',
      description: 'Ongoing evaluations and separate evaluations of internal control',
      principles: [],
      focusPoints: [
        'Ongoing monitoring',
        'Separate evaluations',
        'Deficiency reporting',
        'Corrective actions',
        'Management oversight',
      ],
      assessmentCriteria: [
        {
          criterion: 'Monitoring effectiveness',
          description: 'Monitoring activities effectively evaluate internal control',
          evidenceRequired: ['Monitoring reports', 'Evaluation procedures', 'Corrective actions'],
          testingProcedures: [
            'Review monitoring process',
            'Test evaluation procedures',
            'Validate reporting',
          ],
          ratingScale: {
            scale: 'effective',
            score: 100,
            description: 'Effective monitoring identifies and addresses deficiencies',
            criteria: ['Regular monitoring', 'Timely reporting', 'Appropriate follow-up'],
          },
        },
      ],
    };

    // Store components
    this.components.set('control-environment', controlEnvironment);
    this.components.set('risk-assessment', riskAssessment);
    this.components.set('control-activities', controlActivities);
    this.components.set('information-communication', informationCommunication);
    this.components.set('monitoring-activities', monitoringActivities);

    // Initialize principles (17 principles total)
    this.initializeCOSOPrinciples();
  }

  /**
   * Initialize all 17 COSO principles
   */
  private initializeCOSOPrinciples(): void {
    const principles: COSOPrinciple[] = [
      // Control Environment Principles (1-5)
      {
        id: 'principle-1',
        number: 1,
        title: 'Demonstrates Commitment to Integrity and Ethical Values',
        description: 'The organization demonstrates a commitment to integrity and ethical values',
        component: 'control-environment',
        requirements: [
          'Establishes tone at the top',
          'Establishes standards of conduct',
          'Evaluates adherence to standards',
          'Addresses deviations in a timely manner',
        ],
        evidenceTypes: ['Code of conduct', 'Ethics training', 'Disciplinary actions'],
        maturityLevels: [
          {
            level: 1,
            name: 'Initial',
            description: 'Ad hoc approach to ethics',
            characteristics: ['Informal ethics guidance', 'Inconsistent messaging'],
            evidenceIndicators: ['Basic code of conduct exists'],
          },
          {
            level: 5,
            name: 'Optimized',
            description: 'Embedded ethical culture',
            characteristics: ['Strong ethical culture', 'Continuous improvement'],
            evidenceIndicators: ['Regular ethics assessments', 'Proactive ethics initiatives'],
          },
        ],
      },
      {
        id: 'principle-2',
        number: 2,
        title: 'Exercises Oversight Responsibility',
        description: 'The board of directors demonstrates independence and exercises oversight',
        component: 'control-environment',
        requirements: [
          'Establishes oversight responsibilities',
          'Applies relevant expertise',
          'Operates independently',
          'Provides oversight for internal control',
        ],
        evidenceTypes: ['Board charter', 'Meeting minutes', 'Independence assessments'],
        maturityLevels: [
          {
            level: 1,
            name: 'Initial',
            description: 'Limited board oversight',
            characteristics: ['Minimal board involvement', 'Unclear responsibilities'],
            evidenceIndicators: ['Basic board structure exists'],
          },
          {
            level: 5,
            name: 'Optimized',
            description: 'Effective board oversight',
            characteristics: ['Active board engagement', 'Clear accountability'],
            evidenceIndicators: ['Regular board assessments', 'Strong oversight practices'],
          },
        ],
      },
      // Additional principles would be added here...
    ];

    principles.forEach((principle) => {
      this.principles.set(principle.id, principle);

      // Add principle to its component
      const component = this.components.get(principle.component);
      if (component) {
        component.principles.push(principle);
      }
    });
  }

  /**
   * Perform comprehensive COSO assessment
   */
  async performCOSOAssessment(_organizationId: string,
    risks: Risk[],
    controls: Control[],
    assessor: string,
    scope: string = 'entity-wide'
  ): Promise<COSOAssessment> {
    const componentAssessments: ComponentAssessment[] = [];

    // Assess each component
    for (const [componentId, component] of this.components) {
      const componentAssessment = await this.assessComponent(component, risks, controls);
      componentAssessments.push(componentAssessment);
    }

    // Calculate overall rating and score
    const overallScore = this.calculateOverallScore(componentAssessments);
    const overallRating = this.determineOverallRating(overallScore);

    // Identify deficiencies and material weaknesses
    const deficiencies = this.identifyDeficiencies(componentAssessments);
    const materialWeaknesses = this.identifyMaterialWeaknesses(deficiencies);

    // Generate recommendations
    const recommendations = await this.generateCOSORecommendations(
      componentAssessments,
      deficiencies
    );

    // Create action plan
    const actionPlan = this.createActionPlan(recommendations, materialWeaknesses);

    return {
      organizationId,
      assessmentDate: new Date(),
      assessor,
      scope,
      componentAssessments,
      overallRating,
      overallScore,
      deficiencies,
      materialWeaknesses,
      recommendations,
      actionPlan,
      nextAssessment: this.calculateNextAssessmentDate(overallScore),
    };
  }

  /**
   * Perform gap analysis against COSO framework
   */
  async performGapAnalysis(
    currentAssessment: COSOAssessment,
    targetMaturity: number = 85
  ): Promise<COSOGapAnalysis> {
    const componentGaps: ComponentGap[] = [];
    const principleGaps: PrincipleGap[] = [];

    // Analyze component gaps
    currentAssessment.componentAssessments.forEach((compAssessment) => {
      const gap: ComponentGap = {
        componentId: compAssessment.componentId,
        currentMaturity: compAssessment.componentScore,
        targetMaturity,
        gap: targetMaturity - compAssessment.componentScore,
        impact: this.determineGapImpact(targetMaturity - compAssessment.componentScore),
        effort: this.determineGapEffort(targetMaturity - compAssessment.componentScore),
        priority: this.calculateGapPriority(compAssessment),
        recommendations: compAssessment.recommendations,
      };
      componentGaps.push(gap);

      // Analyze principle gaps within component
      compAssessment.principleAssessments.forEach((princAssessment) => {
        const principleGap: PrincipleGap = {
          principleId: princAssessment.principleId,
          currentScore: princAssessment.score,
          targetScore: targetMaturity,
          gap: targetMaturity - princAssessment.score,
          deficiencies: princAssessment.deficiencies,
          recommendations: this.generatePrincipleRecommendations(princAssessment),
          effort: this.determineGapEffort(targetMaturity - princAssessment.score),
        };
        principleGaps.push(principleGap);
      });
    });

    // Calculate overall maturity
    const overallMaturity = currentAssessment.overallScore;

    // Identify priority areas
    const priorityAreas = componentGaps
      .filter((gap) => gap.impact === 'high' && gap.gap > 20)
      .map((gap) => this.components.get(gap.componentId)?.name || gap.componentId);

    // Identify quick wins
    const quickWins = componentGaps
      .filter((gap) => gap.effort === 'low' && gap.gap > 10)
      .map((gap) => this.components.get(gap.componentId)?.name || gap.componentId);

    // Identify long-term initiatives
    const longTermInitiatives = componentGaps
      .filter((gap) => gap.effort === 'high' && gap.impact === 'high')
      .map((gap) => this.components.get(gap.componentId)?.name || gap.componentId);

    // Calculate risk exposure
    const riskExposure = Math.max(0, 100 - overallMaturity);

    return {
      componentGaps,
      principleGaps,
      overallMaturity,
      priorityAreas,
      quickWins,
      longTermInitiatives,
      riskExposure,
    };
  }

  /**
   * Map controls to COSO principles
   */
  async mapControlsToCOSO(controls: Control[]): Promise<Map<string, string[]>> {
    const mapping = new Map<string, string[]>();

    controls.forEach((control) => {
      const mappedPrinciples = this.identifyRelevantPrinciples(control);
      mapping.set(control.id, mappedPrinciples);
    });

    return mapping;
  }

  /**
   * Generate COSO compliance report
   */
  async generateComplianceReport(
    assessment: COSOAssessment,
    gapAnalysis: COSOGapAnalysis
  ): Promise<{
    executiveSummary: string;
    componentSummaries: Array<{ component: string; summary: string; score: number }>;
    keyFindings: string[];
    recommendations: string[];
    actionPlan: string[];
    timeline: string;
  }> {
    const executiveSummary = this.generateExecutiveSummary(assessment, gapAnalysis);

    const componentSummaries = assessment.componentAssessments.map((comp) => ({
      component: this.components.get(comp.componentId)?.name || comp.componentId,
      summary: this.generateComponentSummary(comp),
      score: comp.componentScore,
    }));

    const keyFindings = this.extractKeyFindings(assessment);

    const recommendations = assessment.recommendations.map(
      (rec) => `${rec.title}: ${rec.description}`
    );

    const actionPlan = assessment.actionPlan.map(
      (action) => `${action.title} (Due: ${action.dueDate.toDateString()})`
    );

    const timeline = this.generateImplementationTimeline(assessment.actionPlan);

    return {
      executiveSummary,
      componentSummaries,
      keyFindings,
      recommendations,
      actionPlan,
      timeline,
    };
  }

  // Helper methods
  private async assessComponent(
    component: COSOComponent,
    risks: Risk[],
    controls: Control[]
  ): Promise<ComponentAssessment> {
    const principleAssessments: PrincipleAssessment[] = [];

    // Assess each principle in the component
    component.principles.forEach((principle) => {
      const assessment = this.assessPrinciple(principle, risks, controls);
      principleAssessments.push(assessment);
    });

    // Calculate component score and rating
    const componentScore =
      principleAssessments.length > 0
        ? Math.round(
            principleAssessments.reduce((sum, p) => sum + p.score, 0) / principleAssessments.length
          )
        : 0;

    const componentRating = this.determineRating(componentScore);

    // Identify strengths and deficiencies
    const strengths = principleAssessments
      .filter((p) => p.score >= 80)
      .map((p) => `Strong ${this.principles.get(p.principleId)?.title}`);

    const deficiencies = principleAssessments
      .filter((p) => p.score < 60)
      .flatMap((p) => p.deficiencies);

    // Generate component-level recommendations
    const recommendations = this.generateComponentRecommendations(component, principleAssessments);

    return {
      componentId: component.id,
      principleAssessments,
      componentRating,
      componentScore,
      strengths,
      deficiencies,
      recommendations,
    };
  }

  private assessPrinciple(
    principle: COSOPrinciple,
    risks: Risk[],
    controls: Control[]
  ): PrincipleAssessment {
    // Simplified assessment logic - in practice would be more sophisticated
    const relevantControls = controls.filter((control) =>
      this.isControlRelevantToPrinciple(control, principle)
    );

    let score = 50; // baseline

    // Increase score based on relevant controls
    if (relevantControls.length > 0) {
      const avgEffectiveness =
        relevantControls.reduce((sum, control) => {
          const effectiveness =
            typeof control.effectiveness === 'number'
              ? control.effectiveness
              : this.convertEffectivenessToNumber(control.effectiveness);
          return sum + effectiveness;
        }, 0) / relevantControls.length;

      score = Math.round((score + avgEffectiveness) / 2);
    }

    const rating = this.determineRating(score);

    // Generate mock evidence and testing results
    const evidence: Evidence[] = relevantControls.map((control) => ({
      type: 'Control Documentation',
      description: `Control: ${control.title}`,
      source: 'Control Registry',
      quality: 'medium',
      relevance: 'direct',
      date: new Date(),
    }));

    const testingResults: TestingResult[] = [];
    const findings: string[] = [];
    const deficiencies: string[] = [];

    if (score < 60) {
      deficiencies.push(`Insufficient controls for ${principle.title}`);
    }

    return {
      principleId: principle.id,
      rating,
      score,
      evidence,
      testingResults,
      findings,
      deficiencies,
    };
  }

  private calculateOverallScore(componentAssessments: ComponentAssessment[]): number {
    if (componentAssessments.length === 0) return 0;

    return Math.round(
      componentAssessments.reduce((sum, comp) => sum + comp.componentScore, 0) /
        componentAssessments.length
    );
  }

  private determineOverallRating(
    score: number
  ): 'effective' | 'largely_effective' | 'partially_effective' | 'ineffective' {
    if (score >= 85) return 'effective';
    if (score >= 70) return 'largely_effective';
    if (score >= 50) return 'partially_effective';
    return 'ineffective';
  }

  private determineRating(
    score: number
  ): 'effective' | 'largely_effective' | 'partially_effective' | 'ineffective' {
    if (score >= 85) return 'effective';
    if (score >= 70) return 'largely_effective';
    if (score >= 50) return 'partially_effective';
    return 'ineffective';
  }

  private convertEffectivenessToNumber(effectiveness: string | number): number {
    if (typeof effectiveness === 'number') return effectiveness;

    switch (effectiveness.toLowerCase()) {
      case 'high':
        return 80;
      case 'medium':
        return 60;
      case 'low':
        return 40;
      default:
        return 50;
    }
  }

  private isControlRelevantToPrinciple(control: Control, principle: COSOPrinciple): boolean {
    // Simplified mapping logic - would be more sophisticated in practice
    const controlKeywords = [control.title.toLowerCase(), control.description.toLowerCase()];
    const principleKeywords = principle.title.toLowerCase();

    return controlKeywords.some(
      (keyword) => principleKeywords.includes(keyword) || keyword.includes(principleKeywords)
    );
  }

  private identifyDeficiencies(componentAssessments: ComponentAssessment[]): Deficiency[] {
    const deficiencies: Deficiency[] = [];

    componentAssessments.forEach((compAssessment) => {
      compAssessment.principleAssessments.forEach((princAssessment) => {
        if (princAssessment.score < 60) {
          princAssessment.deficiencies.forEach((deficiency, index) => {
            deficiencies.push({
              id: `def-${princAssessment.principleId}-${index}`,
              type: 'design',
              severity: princAssessment.score < 40 ? 'material' : 'significant',
              component: compAssessment.componentId,
              principle: princAssessment.principleId,
              description: deficiency,
              impact: 'Potential impact on internal control effectiveness',
              rootCause: 'Insufficient control design or implementation',
              recommendation: 'Enhance control design and implementation',
              timeline: '90 days',
              owner: 'Management',
              status: 'open',
            });
          });
        }
      });
    });

    return deficiencies;
  }

  private identifyMaterialWeaknesses(deficiencies: Deficiency[]): MaterialWeakness[] {
    const materialDeficiencies = deficiencies.filter((def) => def.severity === 'material');

    return materialDeficiencies.map((def) => ({
      id: `mw-${def.id}`,
      title: `Material Weakness in ${def.component}`,
      description: def.description,
      affectedComponents: [def.component],
      affectedPrinciples: [def.principle],
      businessImpact: 'Potential for material misstatement',
      financialImpact: 100000, // Estimated impact
      likelihood: 'reasonably_possible',
      remediation: {
        planId: `plan-${def.id}`,
        description: def.recommendation,
        actions: [],
        timeline: 90,
        owner: def.owner,
        budget: 50000,
        milestones: [],
        status: 'planned',
      },
      disclosure: true,
    }));
  }

  private async generateCOSORecommendations(
    componentAssessments: ComponentAssessment[],
    deficiencies: Deficiency[]
  ): Promise<COSORecommendation[]> {
    const recommendations: COSORecommendation[] = [];

    // Generate recommendations for each component with low scores
    componentAssessments.forEach((compAssessment) => {
      if (compAssessment.componentScore < 70) {
        recommendations.push({
          id: `rec-${compAssessment.componentId}`,
          component: compAssessment.componentId,
          priority: compAssessment.componentScore < 50 ? 'high' : 'medium',
          title: `Improve ${this.components.get(compAssessment.componentId)?.name}`,
          description: `Enhance controls and processes for ${this.components.get(compAssessment.componentId)?.name}`,
          rationale: `Current score of ${compAssessment.componentScore}% indicates improvement needed`,
          implementation: compAssessment.recommendations,
          timeline: 90,
          cost: 25000,
          benefit: 'Improved internal control effectiveness',
          success: ['Score improvement to >70%', 'Reduced deficiencies'],
        });
      }
    });

    return recommendations;
  }

  private createActionPlan(
    recommendations: COSORecommendation[],
    materialWeaknesses: MaterialWeakness[]
  ): ActionItem[] {
    const actionItems: ActionItem[] = [];

    // Create action items for recommendations
    recommendations.forEach((rec) => {
      actionItems.push({
        id: `action-${rec.id}`,
        title: rec.title,
        description: rec.description,
        owner: 'Management',
        dueDate: new Date(Date.now() + rec.timeline * 24 * 60 * 60 * 1000),
        priority: rec.priority === 'high' ? 'critical' : 'medium',
        status: 'not_started',
        dependencies: [],
        progress: 0,
      });
    });

    // Create action items for material weaknesses
    materialWeaknesses.forEach((mw) => {
      actionItems.push({
        id: `action-mw-${mw.id}`,
        title: `Remediate ${mw.title}`,
        description: mw.description,
        owner: mw.remediation.owner,
        dueDate: new Date(Date.now() + mw.remediation.timeline * 24 * 60 * 60 * 1000),
        priority: 'critical',
        status: 'not_started',
        dependencies: [],
        progress: 0,
      });
    });

    return actionItems;
  }

  private calculateNextAssessmentDate(overallScore: number): Date {
    const now = new Date();
    let monthsUntilNext = 12; // Default annual

    // More frequent assessments for lower scores
    if (overallScore < 50) monthsUntilNext = 6;
    else if (overallScore < 70) monthsUntilNext = 9;

    now.setMonth(now.getMonth() + monthsUntilNext);
    return now;
  }

  // Additional helper methods for gap analysis and reporting
  private determineGapImpact(gap: number): 'high' | 'medium' | 'low' {
    if (gap > 30) return 'high';
    if (gap > 15) return 'medium';
    return 'low';
  }

  private determineGapEffort(gap: number): 'high' | 'medium' | 'low' {
    if (gap > 40) return 'high';
    if (gap > 20) return 'medium';
    return 'low';
  }

  private calculateGapPriority(assessment: ComponentAssessment): number {
    // Priority based on score and number of deficiencies
    const scoreFactor = (100 - assessment.componentScore) / 100;
    const deficiencyFactor = assessment.deficiencies.length / 10;
    return Math.round((scoreFactor + deficiencyFactor) * 100);
  }

  private generatePrincipleRecommendations(assessment: PrincipleAssessment): string[] {
    const recommendations: string[] = [];

    if (assessment.score < 60) {
      recommendations.push('Strengthen control design and implementation');
      recommendations.push('Enhance documentation and evidence');
      recommendations.push('Implement regular testing procedures');
    }

    return recommendations;
  }

  private generateComponentRecommendations(
    component: COSOComponent,
    principleAssessments: PrincipleAssessment[]
  ): string[] {
    const recommendations: string[] = [];

    const lowScoringPrinciples = principleAssessments.filter((p) => p.score < 60);

    if (lowScoringPrinciples.length > 0) {
      recommendations.push(`Address deficiencies in ${lowScoringPrinciples.length} principles`);
      recommendations.push('Enhance overall component effectiveness');
      recommendations.push('Implement comprehensive testing program');
    }

    return recommendations;
  }

  private identifyRelevantPrinciples(control: Control): string[] {
    // Simplified mapping - would use more sophisticated logic in practice
    const relevantPrinciples: string[] = [];

    // Map based on control type and description
    if (control.type === 'preventive') {
      relevantPrinciples.push('principle-1'); // Integrity and ethical values
    }

    if (control.description.toLowerCase().includes('risk')) {
      relevantPrinciples.push('principle-6'); // Risk assessment (if it existed)
    }

    return relevantPrinciples;
  }

  private generateExecutiveSummary(
    assessment: COSOAssessment,
    gapAnalysis: COSOGapAnalysis
  ): string {
    return `
      COSO Internal Control Assessment Summary
      
      Overall Rating: ${assessment.overallRating.toUpperCase()}
      Overall Score: ${assessment.overallScore}%
      
      The assessment identified ${assessment.deficiencies.length} deficiencies and 
      ${assessment.materialWeaknesses.length} material weaknesses across the five COSO components.
      
      Key areas for improvement include: ${gapAnalysis.priorityAreas.join(', ')}.
      
      Immediate actions required: ${assessment.actionPlan.filter((a) => a.priority === 'critical').length} critical items.
    `;
  }

  private generateComponentSummary(assessment: ComponentAssessment): string {
    return `
      Score: ${assessment.componentScore}% (${assessment.componentRating})
      Strengths: ${assessment.strengths.length} identified
      Deficiencies: ${assessment.deficiencies.length} identified
      Recommendations: ${assessment.recommendations.length} provided
    `;
  }

  private extractKeyFindings(assessment: COSOAssessment): string[] {
    const findings: string[] = [];

    // Overall findings
    findings.push(`Overall internal control effectiveness: ${assessment.overallRating}`);

    // Component findings
    assessment.componentAssessments.forEach((comp) => {
      if (comp.componentScore < 60) {
        findings.push(
          `${this.components.get(comp.componentId)?.name} requires significant improvement`
        );
      }
    });

    // Material weakness findings
    if (assessment.materialWeaknesses.length > 0) {
      findings.push(`${assessment.materialWeaknesses.length} material weaknesses identified`);
    }

    return findings;
  }

  private generateImplementationTimeline(actionPlan: ActionItem[]): string {
    const criticalItems = actionPlan.filter((a) => a.priority === 'critical').length;
    const highItems = actionPlan.filter((a) => a.priority === 'high').length;

    return `
      Implementation Timeline:
      - Critical items (${criticalItems}): 0-90 days
      - High priority items (${highItems}): 90-180 days
      - Medium priority items: 180-365 days
      
      Total estimated timeline: 12 months
    `;
  }
}

export const cosoFrameworkService = new COSOFrameworkService();
