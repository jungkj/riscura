import { Risk, Control } from '@/types';

export interface NISTFunction {
  id: string;
  name: string;
  description: string;
  categories: NISTCategory[];
  outcomes: string[];
}

export interface NISTCategory {
  id: string;
  name: string;
  description: string;
  subcategories: NISTSubcategory[];
}

export interface NISTSubcategory {
  id: string;
  name: string;
  description: string;
  informativeReferences: string[];
  implementationTiers: ImplementationTier[];
}

export interface ImplementationTier {
  tier: number;
  name: string;
  description: string;
  characteristics: string[];
  riskManagement: string;
  integratedRiskManagement: string;
  externalParticipation: string;
}

export interface NISTAssessment {
  organizationId: string;
  assessmentDate: Date;
  assessor: string;
  scope: string;
  currentProfile: NISTProfile;
  targetProfile: NISTProfile;
  functionAssessments: FunctionAssessment[];
  overallTier: number;
  gaps: NISTGap[];
  recommendations: NISTRecommendation[];
  implementationPlan: NISTImplementationPlan;
}

export interface NISTProfile {
  profileId: string;
  name: string;
  description: string;
  functionOutcomes: FunctionOutcome[];
  categoryOutcomes: CategoryOutcome[];
  subcategoryOutcomes: SubcategoryOutcome[];
  overallMaturity: number;
}

export interface FunctionOutcome {
  functionId: string;
  maturityLevel: number;
  implementationStatus:
    | 'not_implemented'
    | 'partially_implemented'
    | 'largely_implemented'
    | 'fully_implemented';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface CategoryOutcome {
  categoryId: string;
  maturityLevel: number;
  implementationStatus:
    | 'not_implemented'
    | 'partially_implemented'
    | 'largely_implemented'
    | 'fully_implemented';
  controls: string[];
  gaps: string[];
}

export interface SubcategoryOutcome {
  subcategoryId: string;
  maturityLevel: number;
  implementationStatus:
    | 'not_implemented'
    | 'partially_implemented'
    | 'largely_implemented'
    | 'fully_implemented';
  evidence: string[];
  controls: string[];
}

export interface FunctionAssessment {
  functionId: string;
  tier: number;
  score: number;
  categoryAssessments: CategoryAssessment[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface CategoryAssessment {
  categoryId: string;
  tier: number;
  score: number;
  subcategoryAssessments: SubcategoryAssessment[];
  controlCoverage: number;
  gaps: string[];
}

export interface SubcategoryAssessment {
  subcategoryId: string;
  tier: number;
  score: number;
  implementationStatus:
    | 'not_implemented'
    | 'partially_implemented'
    | 'largely_implemented'
    | 'fully_implemented';
  evidence: Evidence[];
  controls: string[];
  deficiencies: string[];
}

export interface Evidence {
  type: string;
  description: string;
  quality: 'high' | 'medium' | 'low';
  date: Date;
  source: string;
}

export interface NISTGap {
  functionId: string;
  categoryId?: string;
  subcategoryId?: string;
  currentTier: number;
  targetTier: number;
  gap: number;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  priority: number;
  description: string;
}

export interface NISTRecommendation {
  id: string;
  function: string;
  category?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  rationale: string;
  implementation: string[];
  timeline: number;
  cost: number;
  benefit: string;
  dependencies: string[];
}

export interface NISTImplementationPlan {
  phases: ImplementationPhase[];
  totalDuration: number;
  totalCost: number;
  riskReduction: number;
  successMetrics: string[];
}

export interface ImplementationPhase {
  phase: number;
  name: string;
  duration: number;
  functions: string[];
  activities: string[];
  deliverables: string[];
  cost: number;
  riskReduction: number;
}

export class NISTFrameworkService {
  private functions: Map<string, NISTFunction> = new Map();
  private implementationTiers: ImplementationTier[] = [];

  constructor() {
    this.initializeNISTFramework();
  }

  private initializeNISTFramework(): void {
    // Initialize Implementation Tiers
    this.implementationTiers = [
      {
        tier: 1,
        name: 'Partial',
        description: 'Risk management practices are not formalized',
        characteristics: ['Ad hoc risk management', 'Limited awareness', 'Reactive approach'],
        riskManagement: 'Ad hoc and reactive',
        integratedRiskManagement: 'Limited integration',
        externalParticipation: 'Minimal participation',
      },
      {
        tier: 2,
        name: 'Risk Informed',
        description: 'Risk management practices are approved by management',
        characteristics: ['Risk-informed decisions', 'Management awareness', 'Some integration'],
        riskManagement: 'Risk-informed but not organization-wide',
        integratedRiskManagement: 'Some integration across organization',
        externalParticipation: 'Limited external participation',
      },
      {
        tier: 3,
        name: 'Repeatable',
        description: 'Risk management practices are formally approved',
        characteristics: ['Formal policies', 'Regular updates', 'Organization-wide'],
        riskManagement: 'Organization-wide approach',
        integratedRiskManagement: 'Integrated across organization',
        externalParticipation: 'Active external participation',
      },
      {
        tier: 4,
        name: 'Adaptive',
        description: 'Risk management practices are continuously improved',
        characteristics: ['Continuous improvement', 'Adaptive approach', 'Lessons learned'],
        riskManagement: 'Adaptive and continuously improving',
        integratedRiskManagement: 'Fully integrated enterprise approach',
        externalParticipation: 'Proactive external participation',
      },
    ];

    // Initialize NIST Functions
    this.initializeIdentifyFunction();
    this.initializeProtectFunction();
    this.initializeDetectFunction();
    this.initializeRespondFunction();
    this.initializeRecoverFunction();
  }

  private initializeIdentifyFunction(): void {
    const identifyFunction: NISTFunction = {
      id: 'identify',
      name: 'Identify (ID)',
      description: 'Develop organizational understanding to manage cybersecurity risk',
      categories: [
        {
          id: 'id-am',
          name: 'Asset Management (ID.AM)',
          description: 'Data, personnel, devices, systems, and facilities are identified',
          subcategories: [
            {
              id: 'id-am-1',
              name: 'Physical devices and systems are inventoried',
              description: 'Physical devices and systems within the organization are inventoried',
              informativeReferences: ['CIS CSC 1', 'ISO 27001 A.8.1.1'],
              implementationTiers: this.implementationTiers,
            },
            {
              id: 'id-am-2',
              name: 'Software platforms and applications are inventoried',
              description:
                'Software platforms and applications within the organization are inventoried',
              informativeReferences: ['CIS CSC 2', 'ISO 27001 A.8.1.1'],
              implementationTiers: this.implementationTiers,
            },
          ],
        },
        {
          id: 'id-be',
          name: 'Business Environment (ID.BE)',
          description:
            "Organization's mission, objectives, stakeholders, and activities are understood",
          subcategories: [
            {
              id: 'id-be-1',
              name: 'Organizational mission is identified and communicated',
              description:
                "The organization's role in the supply chain is identified and communicated",
              informativeReferences: ['ISO 27001 A.15.1.1'],
              implementationTiers: this.implementationTiers,
            },
          ],
        },
      ],
      outcomes: [
        'Asset inventory is maintained',
        'Business environment is understood',
        'Governance structure is established',
        'Risk assessment is performed',
        'Risk management strategy is established',
      ],
    };

    this.functions.set('identify', identifyFunction);
  }

  private initializeProtectFunction(): void {
    const protectFunction: NISTFunction = {
      id: 'protect',
      name: 'Protect (PR)',
      description: 'Develop and implement appropriate safeguards',
      categories: [
        {
          id: 'pr-ac',
          name: 'Identity Management and Access Control (PR.AC)',
          description: 'Access to physical and logical assets is limited to authorized users',
          subcategories: [
            {
              id: 'pr-ac-1',
              name: 'Identities and credentials are issued and managed',
              description:
                'Identities and credentials are issued, managed, verified, revoked, and audited',
              informativeReferences: ['CIS CSC 16', 'ISO 27001 A.9.2.1'],
              implementationTiers: this.implementationTiers,
            },
          ],
        },
      ],
      outcomes: [
        'Access controls are implemented',
        'Awareness and training programs are established',
        'Data security measures are in place',
        'Information protection processes are implemented',
        'Maintenance activities are performed',
        'Protective technology is deployed',
      ],
    };

    this.functions.set('protect', protectFunction);
  }

  private initializeDetectFunction(): void {
    const detectFunction: NISTFunction = {
      id: 'detect',
      name: 'Detect (DE)',
      description: 'Develop and implement appropriate activities to identify cybersecurity events',
      categories: [
        {
          id: 'de-ae',
          name: 'Anomalies and Events (DE.AE)',
          description: 'Anomalous activity is detected and potential impact is understood',
          subcategories: [
            {
              id: 'de-ae-1',
              name: 'Network baseline is established and managed',
              description:
                'A baseline of network operations and expected data flows is established',
              informativeReferences: ['CIS CSC 12', 'ISO 27001 A.12.4.1'],
              implementationTiers: this.implementationTiers,
            },
          ],
        },
      ],
      outcomes: [
        'Anomalies and events are detected',
        'Security continuous monitoring is performed',
        'Detection processes are maintained',
      ],
    };

    this.functions.set('detect', detectFunction);
  }

  private initializeRespondFunction(): void {
    const respondFunction: NISTFunction = {
      id: 'respond',
      name: 'Respond (RS)',
      description:
        'Develop and implement appropriate activities to take action regarding detected cybersecurity incidents',
      categories: [
        {
          id: 'rs-rp',
          name: 'Response Planning (RS.RP)',
          description: 'Response processes and procedures are executed and maintained',
          subcategories: [
            {
              id: 'rs-rp-1',
              name: 'Response plan is executed during or after an incident',
              description: 'Response plan is executed during or after an incident',
              informativeReferences: ['CIS CSC 19', 'ISO 27001 A.16.1.5'],
              implementationTiers: this.implementationTiers,
            },
          ],
        },
      ],
      outcomes: [
        'Response planning is established',
        'Communications are coordinated',
        'Analysis is performed',
        'Mitigation activities are implemented',
        'Improvements are incorporated',
      ],
    };

    this.functions.set('respond', respondFunction);
  }

  private initializeRecoverFunction(): void {
    const recoverFunction: NISTFunction = {
      id: 'recover',
      name: 'Recover (RC)',
      description:
        'Develop and implement appropriate activities to maintain resilience and restore capabilities',
      categories: [
        {
          id: 'rc-rp',
          name: 'Recovery Planning (RC.RP)',
          description: 'Recovery processes and procedures are executed and maintained',
          subcategories: [
            {
              id: 'rc-rp-1',
              name: 'Recovery plan is executed during or after a cybersecurity incident',
              description: 'Recovery plan is executed during or after a cybersecurity incident',
              informativeReferences: ['CIS CSC 10', 'ISO 27001 A.17.1.2'],
              implementationTiers: this.implementationTiers,
            },
          ],
        },
      ],
      outcomes: [
        'Recovery planning is established',
        'Improvements are incorporated',
        'Communications are coordinated',
      ],
    };

    this.functions.set('recover', recoverFunction);
  }

  async performNISTAssessment(
    organizationId: string,
    risks: Risk[],
    controls: Control[],
    assessor: string,
    targetTier: number = 3
  ): Promise<NISTAssessment> {
    // Create current profile
    const currentProfile = await this.createCurrentProfile(risks, controls);

    // Create target profile
    const targetProfile = await this.createTargetProfile(targetTier);

    // Assess each function
    const functionAssessments: FunctionAssessment[] = [];
    for (const [functionId, nistFunction] of this.functions) {
      const assessment = await this.assessFunction(nistFunction, risks, controls);
      functionAssessments.push(assessment);
    }

    // Calculate overall tier
    const overallTier = Math.round(
      functionAssessments.reduce((sum, f) => sum + f.tier, 0) / functionAssessments.length
    );

    // Identify gaps
    const gaps = this.identifyNISTGaps(currentProfile, targetProfile);

    // Generate recommendations
    const recommendations = await this.generateNISTRecommendations(functionAssessments, gaps);

    // Create implementation plan
    const implementationPlan = this.createNISTImplementationPlan(recommendations, gaps);

    return {
      organizationId,
      assessmentDate: new Date(),
      assessor,
      scope: 'Enterprise Cybersecurity',
      currentProfile,
      targetProfile,
      functionAssessments,
      overallTier,
      gaps,
      recommendations,
      implementationPlan,
    };
  }

  async performNISTGapAnalysis(currentAssessment: NISTAssessment): Promise<{
    functionGaps: NISTGap[];
    priorityAreas: string[];
    quickWins: string[];
    roadmap: ImplementationPhase[];
    riskReduction: number;
  }> {
    const functionGaps = currentAssessment.gaps;

    // Identify priority areas (high impact, high gap)
    const priorityAreas = functionGaps
      .filter((gap) => gap.impact === 'high' && gap.gap >= 2)
      .map((gap) => this.functions.get(gap.functionId)?.name || gap.functionId);

    // Identify quick wins (low effort, medium+ gap)
    const quickWins = functionGaps
      .filter((gap) => gap.effort === 'low' && gap.gap >= 1)
      .map((gap) => this.functions.get(gap.functionId)?.name || gap.functionId);

    // Create implementation roadmap
    const roadmap = this.createNISTRoadmap(functionGaps);

    // Calculate potential risk reduction
    const riskReduction = this.calculateRiskReduction(functionGaps);

    return {
      functionGaps,
      priorityAreas,
      quickWins,
      roadmap,
      riskReduction,
    };
  }

  private async createCurrentProfile(risks: Risk[], controls: Control[]): Promise<NISTProfile> {
    const functionOutcomes: FunctionOutcome[] = [];
    const categoryOutcomes: CategoryOutcome[] = [];
    const subcategoryOutcomes: SubcategoryOutcome[] = [];

    // Assess each function
    for (const [functionId, nistFunction] of this.functions) {
      const functionMaturity = this.assessFunctionMaturity(nistFunction, controls);

      functionOutcomes.push({
        functionId,
        maturityLevel: functionMaturity,
        implementationStatus: this.determineImplementationStatus(functionMaturity),
        priority: this.determineFunctionPriority(functionId, risks),
      });

      // Assess categories
      nistFunction.categories.forEach((category) => {
        const categoryMaturity = this.assessCategoryMaturity(category, controls);
        const relevantControls = this.getRelevantControls(category, controls);

        categoryOutcomes.push({
          categoryId: category.id,
          maturityLevel: categoryMaturity,
          implementationStatus: this.determineImplementationStatus(categoryMaturity),
          controls: relevantControls.map((c) => c.id),
          gaps: categoryMaturity < 3 ? [`Improve ${category.name} implementation`] : [],
        });

        // Assess subcategories
        category.subcategories.forEach((subcategory) => {
          const subcategoryMaturity = this.assessSubcategoryMaturity(subcategory, controls);
          const subcategoryControls = this.getRelevantControls(subcategory, controls);

          subcategoryOutcomes.push({
            subcategoryId: subcategory.id,
            maturityLevel: subcategoryMaturity,
            implementationStatus: this.determineImplementationStatus(subcategoryMaturity),
            evidence: ['Control documentation', 'Implementation records'],
            controls: subcategoryControls.map((c) => c.id),
          });
        });
      });
    }

    const overallMaturity = Math.round(
      functionOutcomes.reduce((sum, f) => sum + f.maturityLevel, 0) / functionOutcomes.length
    );

    return {
      profileId: 'current-profile',
      name: 'Current Cybersecurity Profile',
      description: 'Current state of cybersecurity implementation',
      functionOutcomes,
      categoryOutcomes,
      subcategoryOutcomes,
      overallMaturity,
    };
  }

  private async createTargetProfile(targetTier: number): Promise<NISTProfile> {
    const functionOutcomes: FunctionOutcome[] = [];
    const categoryOutcomes: CategoryOutcome[] = [];
    const subcategoryOutcomes: SubcategoryOutcome[] = [];

    // Set target maturity for all functions
    for (const [functionId, nistFunction] of this.functions) {
      functionOutcomes.push({
        functionId,
        maturityLevel: targetTier,
        implementationStatus: 'fully_implemented',
        priority: 'high',
      });

      nistFunction.categories.forEach((category) => {
        categoryOutcomes.push({
          categoryId: category.id,
          maturityLevel: targetTier,
          implementationStatus: 'fully_implemented',
          controls: [],
          gaps: [],
        });

        category.subcategories.forEach((subcategory) => {
          subcategoryOutcomes.push({
            subcategoryId: subcategory.id,
            maturityLevel: targetTier,
            implementationStatus: 'fully_implemented',
            evidence: [],
            controls: [],
          });
        });
      });
    }

    return {
      profileId: 'target-profile',
      name: `Target Cybersecurity Profile (Tier ${targetTier})`,
      description: `Target state for cybersecurity implementation at Tier ${targetTier}`,
      functionOutcomes,
      categoryOutcomes,
      subcategoryOutcomes,
      overallMaturity: targetTier,
    };
  }

  private async assessFunction(
    nistFunction: NISTFunction,
    risks: Risk[],
    controls: Control[]
  ): Promise<FunctionAssessment> {
    const categoryAssessments: CategoryAssessment[] = [];

    // Assess each category
    nistFunction.categories.forEach((category) => {
      const subcategoryAssessments: SubcategoryAssessment[] = [];

      category.subcategories.forEach((subcategory) => {
        const tier = this.assessSubcategoryMaturity(subcategory, controls);
        const relevantControls = this.getRelevantControls(subcategory, controls);

        subcategoryAssessments.push({
          subcategoryId: subcategory.id,
          tier,
          score: tier * 25, // Convert tier to percentage
          implementationStatus: this.determineImplementationStatus(tier),
          evidence: [
            {
              type: 'Control Documentation',
              description: 'Documented controls and procedures',
              quality: 'medium',
              date: new Date(),
              source: 'Control Registry',
            },
          ],
          controls: relevantControls.map((c) => c.id),
          deficiencies: tier < 3 ? ['Insufficient implementation'] : [],
        });
      });

      const categoryTier = Math.round(
        subcategoryAssessments.reduce((sum, s) => sum + s.tier, 0) / subcategoryAssessments.length
      );

      const controlCoverage = this.calculateControlCoverage(category, controls);

      categoryAssessments.push({
        categoryId: category.id,
        tier: categoryTier,
        score: categoryTier * 25,
        subcategoryAssessments,
        controlCoverage,
        gaps: categoryTier < 3 ? [`Improve ${category.name} maturity`] : [],
      });
    });

    const functionTier = Math.round(
      categoryAssessments.reduce((sum, c) => sum + c.tier, 0) / categoryAssessments.length
    );

    return {
      functionId: nistFunction.id,
      tier: functionTier,
      score: functionTier * 25,
      categoryAssessments,
      strengths: functionTier >= 3 ? [`Strong ${nistFunction.name} implementation`] : [],
      weaknesses: functionTier < 3 ? [`Weak ${nistFunction.name} implementation`] : [],
      recommendations: functionTier < 3 ? [`Enhance ${nistFunction.name} capabilities`] : [],
    };
  }

  // Helper methods
  private assessFunctionMaturity(nistFunction: NISTFunction, controls: Control[]): number {
    // Simplified maturity assessment based on control coverage
    const relevantControls = controls.filter((control) =>
      this.isControlRelevantToFunction(control, nistFunction)
    );

    if (relevantControls.length === 0) return 1;
    if (relevantControls.length < 3) return 2;
    if (relevantControls.length < 6) return 3;
    return 4;
  }

  private assessCategoryMaturity(category: NISTCategory, controls: Control[]): number {
    const relevantControls = this.getRelevantControls(category, controls);

    if (relevantControls.length === 0) return 1;
    if (relevantControls.length < 2) return 2;
    if (relevantControls.length < 4) return 3;
    return 4;
  }

  private assessSubcategoryMaturity(subcategory: NISTSubcategory, controls: Control[]): number {
    const relevantControls = this.getRelevantControls(subcategory, controls);

    if (relevantControls.length === 0) return 1;
    if (relevantControls.length === 1) return 2;
    if (relevantControls.length < 3) return 3;
    return 4;
  }

  private getRelevantControls(item: any, controls: Control[]): Control[] {
    // Simplified relevance check based on keywords
    return controls.filter((control) =>
      this.isControlRelevant(control, item.name + ' ' + item.description)
    );
  }

  private isControlRelevant(control: Control, context: string): boolean {
    const controlText = (control.title + ' ' + control.description).toLowerCase();
    const contextText = context.toLowerCase();

    // Simple keyword matching
    const keywords = ['access', 'identity', 'asset', 'data', 'network', 'incident', 'recovery'];
    return keywords.some(
      (keyword) => controlText.includes(keyword) && contextText.includes(keyword)
    );
  }

  private isControlRelevantToFunction(control: Control, nistFunction: NISTFunction): boolean {
    const controlText = (control.title + ' ' + control.description).toLowerCase();
    const functionText = (nistFunction.name + ' ' + nistFunction.description).toLowerCase();

    return this.isControlRelevant(control, functionText);
  }

  private determineImplementationStatus(
    maturityLevel: number
  ): 'not_implemented' | 'partially_implemented' | 'largely_implemented' | 'fully_implemented' {
    if (maturityLevel >= 4) return 'fully_implemented';
    if (maturityLevel >= 3) return 'largely_implemented';
    if (maturityLevel >= 2) return 'partially_implemented';
    return 'not_implemented';
  }

  private determineFunctionPriority(
    functionId: string,
    risks: Risk[]
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Determine priority based on risk exposure
    const techRisks = risks.filter((r) => r.category === 'TECHNOLOGY').length;

    if (functionId === 'protect' && techRisks > 10) return 'critical';
    if (functionId === 'detect' && techRisks > 5) return 'high';
    if (functionId === 'respond' && techRisks > 3) return 'high';

    return 'medium';
  }

  private calculateControlCoverage(category: NISTCategory, controls: Control[]): number {
    const relevantControls = this.getRelevantControls(category, controls);
    const totalSubcategories = category.subcategories.length;

    return totalSubcategories > 0
      ? Math.round((relevantControls.length / totalSubcategories) * 100)
      : 0;
  }

  private identifyNISTGaps(currentProfile: NISTProfile, targetProfile: NISTProfile): NISTGap[] {
    const gaps: NISTGap[] = [];

    currentProfile.functionOutcomes.forEach((current) => {
      const target = targetProfile.functionOutcomes.find(
        (t) => t.functionId === current.functionId
      );
      if (target && current.maturityLevel < target.maturityLevel) {
        const gap = target.maturityLevel - current.maturityLevel;
        gaps.push({
          functionId: current.functionId,
          currentTier: current.maturityLevel,
          targetTier: target.maturityLevel,
          gap,
          impact: this.determineGapImpact(gap),
          effort: this.determineGapEffort(gap),
          priority: this.calculateGapPriority(gap, current.functionId),
          description: `Improve ${current.functionId} from tier ${current.maturityLevel} to ${target.maturityLevel}`,
        });
      }
    });

    return gaps;
  }

  private async generateNISTRecommendations(
    functionAssessments: FunctionAssessment[],
    gaps: NISTGap[]
  ): Promise<NISTRecommendation[]> {
    const recommendations: NISTRecommendation[] = [];

    gaps.forEach((gap) => {
      const nistFunction = this.functions.get(gap.functionId);
      if (nistFunction) {
        recommendations.push({
          id: `rec-${gap.functionId}`,
          function: gap.functionId,
          priority: gap.impact === 'high' ? 'high' : 'medium',
          title: `Enhance ${nistFunction.name}`,
          description: `Improve ${nistFunction.name} from tier ${gap.currentTier} to tier ${gap.targetTier}`,
          rationale: `Gap of ${gap.gap} tiers identified with ${gap.impact} impact`,
          implementation: [
            'Develop implementation plan',
            'Deploy required controls',
            'Train personnel',
            'Establish monitoring',
          ],
          timeline: gap.effort === 'high' ? 180 : gap.effort === 'medium' ? 120 : 60,
          cost: gap.effort === 'high' ? 100000 : gap.effort === 'medium' ? 50000 : 25000,
          benefit: 'Improved cybersecurity posture and risk reduction',
          dependencies: [],
        });
      }
    });

    return recommendations;
  }

  private createNISTImplementationPlan(
    recommendations: NISTRecommendation[],
    gaps: NISTGap[]
  ): NISTImplementationPlan {
    const phases: ImplementationPhase[] = [
      {
        phase: 1,
        name: 'Foundation (Identify & Protect)',
        duration: 120,
        functions: ['identify', 'protect'],
        activities: ['Asset inventory', 'Access controls', 'Data protection'],
        deliverables: ['Asset register', 'Access control matrix', 'Data classification'],
        cost: 75000,
        riskReduction: 30,
      },
      {
        phase: 2,
        name: 'Detection & Response',
        duration: 90,
        functions: ['detect', 'respond'],
        activities: ['Monitoring deployment', 'Incident response', 'Threat detection'],
        deliverables: ['Monitoring system', 'Response procedures', 'Detection rules'],
        cost: 60000,
        riskReduction: 25,
      },
      {
        phase: 3,
        name: 'Recovery & Optimization',
        duration: 60,
        functions: ['recover'],
        activities: ['Recovery planning', 'Business continuity', 'Continuous improvement'],
        deliverables: ['Recovery plans', 'Continuity procedures', 'Improvement process'],
        cost: 40000,
        riskReduction: 20,
      },
    ];

    const totalDuration = phases.reduce((sum, phase) => sum + phase.duration, 0);
    const totalCost = phases.reduce((sum, phase) => sum + phase.cost, 0);
    const riskReduction = phases.reduce((sum, phase) => sum + phase.riskReduction, 0);

    return {
      phases,
      totalDuration,
      totalCost,
      riskReduction,
      successMetrics: [
        'NIST tier improvement',
        'Risk reduction percentage',
        'Control implementation rate',
        'Incident response time',
        'Recovery time objectives',
      ],
    };
  }

  private createNISTRoadmap(gaps: NISTGap[]): ImplementationPhase[] {
    // Sort gaps by priority
    const sortedGaps = gaps.sort((a, b) => b.priority - a.priority);

    const phases: ImplementationPhase[] = [];
    let currentPhase = 1;

    // Group gaps into phases based on function dependencies
    const functionOrder = ['identify', 'protect', 'detect', 'respond', 'recover'];

    functionOrder.forEach((functionId) => {
      const functionGaps = sortedGaps.filter((gap) => gap.functionId === functionId);

      if (functionGaps.length > 0) {
        const nistFunction = this.functions.get(functionId);
        phases.push({
          phase: currentPhase,
          name: `Implement ${nistFunction?.name || functionId}`,
          duration: 90,
          functions: [functionId],
          activities: [`Enhance ${functionId} capabilities`],
          deliverables: [`Improved ${functionId} implementation`],
          cost: 50000,
          riskReduction: 15,
        });
        currentPhase++;
      }
    });

    return phases;
  }

  private calculateRiskReduction(gaps: NISTGap[]): number {
    // Calculate potential risk reduction based on gap closure
    const totalGapImpact = gaps.reduce((sum, gap) => {
      const impactScore = gap.impact === 'high' ? 3 : gap.impact === 'medium' ? 2 : 1;
      return sum + gap.gap * impactScore;
    }, 0);

    // Convert to percentage (simplified calculation)
    return Math.min(75, totalGapImpact * 5);
  }

  private determineGapImpact(gap: number): 'high' | 'medium' | 'low' {
    if (gap >= 3) return 'high';
    if (gap >= 2) return 'medium';
    return 'low';
  }

  private determineGapEffort(gap: number): 'high' | 'medium' | 'low' {
    if (gap >= 3) return 'high';
    if (gap >= 2) return 'medium';
    return 'low';
  }

  private calculateGapPriority(gap: number, functionId: string): number {
    let priority = gap * 25; // Base priority on gap size

    // Adjust based on function criticality
    const criticalFunctions = ['protect', 'detect'];
    if (criticalFunctions.includes(functionId)) {
      priority += 25;
    }

    return Math.min(100, priority);
  }
}

export const nistFrameworkService = new NISTFrameworkService();
