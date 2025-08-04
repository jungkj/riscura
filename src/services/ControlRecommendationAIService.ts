// import { Risk, Control, RiskCategory } from '@/types';

// Enhanced control recommendation interfaces
export interface ControlFramework {
  id: string;
  name: string;
  description: string;
  version: string;
  categories: ControlCategory[];
  maturityLevels: MaturityLevel[];
  applicability: FrameworkApplicability;
}

export interface ControlCategory {
  id: string;
  name: string;
  description: string;
  objectives: string[];
  controlTemplates: ControlTemplate[];
  riskAlignment: RiskCategory[];
}

export interface ControlTemplate {
  id: string;
  title: string;
  description: string;
  type: 'preventive' | 'detective' | 'corrective' | 'compensating';
  implementationGuidance: string;
  testingProcedures: TestingProcedure[];
  keyAttributes: ControlAttribute[];
  costProfile: CostProfile;
  effectivenessMetrics: EffectivenessMetric[];
  industryBenchmarks: IndustryBenchmark;
}

export interface MaturityLevel {
  level: number;
  name: string;
  description: string;
  characteristics: string[];
  requirements: string[];
}

export interface FrameworkApplicability {
  industries: string[];
  organizationSizes: ('small' | 'medium' | 'large' | 'enterprise')[];
  riskCategories: RiskCategory[];
  regulatoryRequirements: string[];
}

export interface TestingProcedure {
  id: string;
  name: string;
  type: 'design' | 'operating_effectiveness' | 'walkthrough';
  frequency: 'continuous' | 'monthly' | 'quarterly' | 'annually';
  methodology: string;
  sampleSize: string;
  evidenceRequirements: string[];
  skillRequirements: string[];
  estimatedHours: number;
}

export interface ControlAttribute {
  name: string;
  value: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  measurable: boolean;
  benchmarkable: boolean;
}

export interface CostProfile {
  implementationCost: CostBreakdown;
  operationalCost: CostBreakdown;
  totalCostOfOwnership: TCOAnalysis;
  costDrivers: CostDriver[];
}

export interface CostBreakdown {
  personnel: number;
  technology: number;
  training: number;
  external: number;
  ongoing: number;
  total: number;
}

export interface TCOAnalysis {
  year1: number;
  year2: number;
  year3: number;
  year4: number;
  year5: number;
  npv: number;
  roi: number;
}

export interface CostDriver {
  factor: string;
  impact: 'high' | 'medium' | 'low';
  variability: 'fixed' | 'variable' | 'step';
  description: string;
}

export interface EffectivenessMetric {
  name: string;
  type: 'quantitative' | 'qualitative';
  measurement: string;
  target: string;
  benchmark: string;
  frequency: string;
}

export interface IndustryBenchmark {
  adoptionRate: number;
  effectivenessRating: number;
  implementationTime: number;
  averageCost: number;
  successFactors: string[];
  commonChallenges: string[];
}

export interface ControlRecommendation {
  id: string;
  controlTemplate: ControlTemplate;
  framework: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  rationale: string;
  riskAlignment: RiskAlignment;
  implementationPlan: ImplementationPlan;
  costBenefitAnalysis: CostBenefitAnalysis;
  riskReduction: RiskReductionAnalysis;
  alternatives: AlternativeControl[];
  prerequisites: Prerequisite[];
  successFactors: string[];
  potentialChallenges: Challenge[];
  aiConfidence: number;
}

export interface RiskAlignment {
  targetRiskIds: string[];
  controlObjectives: string[];
  coverageAnalysis: CoverageAnalysis;
  gapMitigation: string[];
}

export interface CoverageAnalysis {
  currentCoverage: number;
  expectedCoverage: number;
  coverageGaps: string[];
  redundancies: string[];
}

export interface ImplementationPlan {
  phases: ImplementationPhase[];
  timeline: number; // days
  resources: ResourceRequirement[];
  dependencies: Dependency[];
  milestones: Milestone[];
  riskMitigation: string[];
}

export interface ImplementationPhase {
  id: string;
  name: string;
  description: string;
  duration: number; // days
  activities: Activity[];
  deliverables: string[];
  successCriteria: string[];
  resources: string[];
}

export interface Activity {
  id: string;
  name: string;
  description: string;
  duration: number;
  dependencies: string[];
  owner: string;
  skillsRequired: string[];
}

export interface ResourceRequirement {
  type: 'human' | 'technology' | 'financial' | 'external';
  description: string;
  quantity: number;
  skillLevel: 'basic' | 'intermediate' | 'advanced' | 'expert';
  duration: number;
  cost: number;
}

export interface Dependency {
  type: 'technical' | 'organizational' | 'regulatory' | 'vendor';
  description: string;
  criticality: 'blocker' | 'high' | 'medium' | 'low';
  mitigation: string;
}

export interface Milestone {
  name: string;
  description: string;
  targetDate: number; // days from start
  successCriteria: string[];
  dependencies: string[];
}

export interface CostBenefitAnalysis {
  implementation: CostBreakdown;
  operational: CostBreakdown;
  benefits: BenefitAnalysis;
  paybackPeriod: number; // months
  roi: number;
  npv: number;
  irr: number;
  sensitivityAnalysis: SensitivityAnalysis;
}

export interface BenefitAnalysis {
  riskReduction: number;
  efficiencyGains: number;
  complianceBenefits: number;
  reputationValue: number;
  avoidedCosts: number;
  total: number;
  qualitativeBenefits: string[];
}

export interface SensitivityAnalysis {
  scenarios: Scenario[];
  variables: SensitivityVariable[];
  recommendations: string[];
}

export interface Scenario {
  name: string;
  assumptions: string[];
  costImpact: number;
  benefitImpact: number;
  likelihood: number;
}

export interface SensitivityVariable {
  variable: string;
  baseCase: number;
  lowCase: number;
  highCase: number;
  impact: number;
}

export interface RiskReductionAnalysis {
  currentRiskLevel: number;
  projectedRiskLevel: number;
  reductionPercentage: number;
  residualRisks: ResidualRisk[];
  quantitativeImpact: QuantitativeImpact;
  qualitativeImpact: string[];
}

export interface ResidualRisk {
  riskId: string;
  description: string;
  likelihood: number;
  impact: number;
  mitigationOptions: string[];
}

export interface QuantitativeImpact {
  expectedLossPrevention: number;
  varianceReduction: number;
  confidenceLevel: number;
  timeHorizon: number; // months
}

export interface AlternativeControl {
  controlTemplate: ControlTemplate;
  comparisonAnalysis: ComparisonAnalysis;
  tradeoffs: string[];
}

export interface ComparisonAnalysis {
  effectiveness: number;
  cost: number;
  complexity: number;
  timeToImplement: number;
  overallScore: number;
  recommendation: string;
}

export interface Prerequisite {
  type: 'technical' | 'organizational' | 'regulatory' | 'financial';
  description: string;
  criticality: 'mandatory' | 'recommended' | 'optional';
  estimatedEffort: number;
  dependencies: string[];
}

export interface Challenge {
  category: 'technical' | 'organizational' | 'financial' | 'regulatory';
  description: string;
  likelihood: number;
  impact: 'high' | 'medium' | 'low';
  mitigation: string[];
}

export interface ControlGapAnalysis {
  riskId: string;
  currentControls: Control[];
  identifiedGaps: ControlGap[];
  recommendations: ControlRecommendation[];
  priorityMatrix: PriorityMatrix;
  implementationRoadmap: RoadmapItem[];
}

export interface ControlGap {
  id: string;
  description: string;
  category: 'design' | 'implementation' | 'operating' | 'monitoring';
  severity: 'critical' | 'high' | 'medium' | 'low';
  impact: string;
  rootCause: string[];
  recommendations: string[];
}

export interface PriorityMatrix {
  axes: { x: string; y: string };
  items: PriorityItem[];
  quadrants: Quadrant[];
}

export interface PriorityItem {
  id: string;
  name: string;
  x: number;
  y: number;
  size: number;
  category: string;
}

export interface Quadrant {
  name: string;
  description: string;
  recommendation: string;
  color: string;
}

export interface RoadmapItem {
  phase: string;
  timeframe: string;
  controls: string[];
  dependencies: string[];
  resources: ResourceRequirement[];
  expectedOutcomes: string[];
}

// Industry control frameworks
const CONTROL_FRAMEWORKS: Record<string, ControlFramework> = {
  cobit: {
    id: 'cobit',
    name: 'COBIT 2019',
    description: 'Control Objectives for Information and Related Technologies',
    version: '2019',
    categories: [
      {
        id: 'governance',
        name: 'Governance',
        description: 'Governance of Enterprise IT',
        objectives: ['Ensure Governance Framework Setting', 'Ensure Benefits Delivery'],
        controlTemplates: [],
        riskAlignment: ['strategic', 'operational'],
      },
    ],
    maturityLevels: [
      {
        level: 0,
        name: 'Incomplete',
        description: 'Process not implemented',
        characteristics: [],
        requirements: [],
      },
      {
        level: 1,
        name: 'Initial',
        description: 'Process is ad hoc',
        characteristics: [],
        requirements: [],
      },
    ],
    applicability: {
      industries: ['technology', 'financial_services', 'healthcare'],
      organizationSizes: ['medium', 'large', 'enterprise'],
      riskCategories: ['technology', 'operational'],
      regulatoryRequirements: ['SOX', 'GDPR'],
    },
  },
  itil: {
    id: 'itil',
    name: 'ITIL 4',
    description: 'Information Technology Infrastructure Library',
    version: '4.0',
    categories: [
      {
        id: 'service_management',
        name: 'Service Management',
        description: 'IT Service Management Practices',
        objectives: ['Service Value System', 'Service Value Chain'],
        controlTemplates: [],
        riskAlignment: ['technology', 'operational'],
      },
    ],
    maturityLevels: [],
    applicability: {
      industries: ['technology', 'telecommunications', 'financial_services'],
      organizationSizes: ['small', 'medium', 'large', 'enterprise'],
      riskCategories: ['technology', 'operational'],
      regulatoryRequirements: ['ISO27001', 'SOC2'],
    },
  },
  sox: {
    id: 'sox',
    name: 'Sarbanes-Oxley Act',
    description: 'Financial Reporting and Corporate Governance Controls',
    version: '2002',
    categories: [
      {
        id: 'financial_reporting',
        name: 'Financial Reporting',
        description: 'Controls over Financial Reporting',
        objectives: ['Accurate Financial Reporting', 'Management Assessment'],
        controlTemplates: [],
        riskAlignment: ['financial', 'compliance'],
      },
    ],
    maturityLevels: [],
    applicability: {
      industries: ['financial_services', 'public_companies'],
      organizationSizes: ['large', 'enterprise'],
      riskCategories: ['financial', 'compliance'],
      regulatoryRequirements: ['SOX', 'SEC'],
    },
  },
};

interface DependencyGraph {
  nodes: string[];
  edges: { from: string; to: string; weight: number }[];
}

interface ImplementationConstraints {
  budget?: number;
  timeline?: number; // months
  resources?: ResourceConstraint[];
  dependencies?: string[];
}

interface EffectivenessAnalysis {
  effectiveness: number;
  confidence: number;
}

interface ContextualAnalysis {
  factors: string[];
  impact: number;
}

interface OptimizationOptions {
  frameworks?: string[];
  organizationProfile?: OrganizationProfile;
  budget?: number;
  timeline?: number;
  riskTolerance?: 'low' | 'medium' | 'high';
  priorityFocus?: 'cost' | 'time' | 'effectiveness' | 'compliance';
}

interface BenefitEstimationContext {
  organizationProfile?: OrganizationProfile;
  historicalData?: HistoricalRiskData;
  marketData?: MarketBenchmarkData;
}

export class ControlRecommendationAIService {
  private frameworks: Map<string, ControlFramework> = new Map();
  private controlTemplates: Map<string, ControlTemplate> = new Map();
  private recommendationCache: Map<string, ControlRecommendation[]> = new Map();

  constructor() {
    this.initializeFrameworks();
    this.loadControlTemplates();
  }

  private initializeFrameworks(): void {
    Object.values(CONTROL_FRAMEWORKS).forEach((framework) => {
      this.frameworks.set(framework.id, framework);
    });
  }

  private async loadControlTemplates(): Promise<void> {
    // Load control templates from industry frameworks
    const templates = await this.buildControlTemplateLibrary();
    templates.forEach((template) => {
      this.controlTemplates.set(template.id, template);
    });
  }

  /**
   * Generate smart control recommendations for risks
   */
  async generateControlRecommendations(_risks: Risk[],
    existingControls: Control[],
    options: {
      frameworks?: string[];
      organizationProfile?: OrganizationProfile;
      budget?: number;
      timeline?: number; // months
      riskTolerance?: 'low' | 'medium' | 'high';
      priorityFocus?: 'cost' | 'time' | 'effectiveness' | 'compliance';
    } = {}
  ): Promise<ControlRecommendation[]> {
    const recommendations: ControlRecommendation[] = [];

    for (const risk of risks) {
      const riskRecommendations = await this.generateRiskSpecificRecommendations(
        risk,
        existingControls,
        options
      );
      recommendations.push(...riskRecommendations);
    }

    // Optimize and prioritize recommendations
    const optimizedRecommendations = await this.optimizeRecommendations(recommendations, options);

    return optimizedRecommendations;
  }

  /**
   * Perform comprehensive control gap analysis
   */
  async performControlGapAnalysis(_risks: Risk[],
    existingControls: Control[],
    targetFramework?: string
  ): Promise<ControlGapAnalysis[]> {
    const analyses: ControlGapAnalysis[] = [];

    for (const risk of risks) {
      const analysis = await this.analyzeControlGapsForRisk(
        risk,
        existingControls,
        targetFramework
      );
      analyses.push(analysis);
    }

    return analyses;
  }

  /**
   * Generate detailed implementation roadmap
   */
  async generateImplementationRoadmap(
    recommendations: ControlRecommendation[],
    constraints: {
      budget?: number;
      timeline?: number; // months
      resources?: ResourceConstraint[];
      dependencies?: string[];
    } = {}
  ): Promise<ImplementationPlan> {
    // Analyze dependencies and constraints
    const dependencyGraph = await this.buildDependencyGraph(recommendations);

    // Optimize implementation sequence
    const optimizedSequence = await this.optimizeImplementationSequence(
      recommendations,
      dependencyGraph,
      constraints
    );

    // Generate detailed roadmap
    return this.buildImplementationRoadmap(optimizedSequence, constraints);
  }

  /**
   * Perform cost-benefit analysis for control investments
   */
  async performCostBenefitAnalysis(_recommendation: ControlRecommendation,
    context: {
      organizationProfile?: OrganizationProfile;
      historicalData?: HistoricalRiskData;
      marketData?: MarketBenchmarkData;
    } = {}
  ): Promise<CostBenefitAnalysis> {
    // Calculate implementation costs
    const implementationCosts = await this.calculateImplementationCosts(
      recommendation,
      context.organizationProfile
    );

    // Calculate operational costs
    const operationalCosts = await this.calculateOperationalCosts(
      recommendation,
      context.organizationProfile
    );

    // Estimate benefits
    const benefits = await this.estimateBenefits(recommendation, context);

    // Perform financial analysis
    const financialMetrics = await this.calculateFinancialMetrics(
      implementationCosts,
      operationalCosts,
      benefits
    );

    // Sensitivity analysis
    const sensitivityAnalysis = await this.performSensitivityAnalysis(recommendation, context);

    return {
      implementation: implementationCosts,
      operational: operationalCosts,
      benefits,
      paybackPeriod: financialMetrics.paybackPeriod,
      roi: financialMetrics.roi,
      npv: financialMetrics.npv,
      irr: financialMetrics.irr,
      sensitivityAnalysis,
    };
  }

  /**
   * Predict control effectiveness using AI
   */
  async predictControlEffectiveness(_controlTemplate: ControlTemplate,
    context: {
      risk: Risk;
      organizationProfile?: OrganizationProfile;
      existingControls?: Control[];
      implementationQuality?: 'basic' | 'standard' | 'advanced';
    }
  ): Promise<{
    effectiveness: number;
    confidence: number;
    factors: EffectivenessFactor[];
    recommendations: string[];
  }> {
    // Analyze control design effectiveness
    const designEffectiveness = await this.analyzeDesignEffectiveness(
      controlTemplate,
      context.risk
    );

    // Predict operating effectiveness
    const operatingEffectiveness = await this.predictOperatingEffectiveness(
      controlTemplate,
      context
    );

    // Consider contextual factors
    const contextualFactors = await this.analyzeContextualFactors(controlTemplate, context);

    // Calculate overall effectiveness
    const overallEffectiveness = this.calculateOverallEffectiveness(
      designEffectiveness,
      operatingEffectiveness,
      contextualFactors
    );

    return overallEffectiveness;
  }

  // Private helper methods implementation would continue...
  private async buildControlTemplateLibrary(): Promise<ControlTemplate[]> {
    // This would integrate with actual framework databases
    return [];
  }

  private async generateRiskSpecificRecommendations(_risk: Risk,
    existingControls: Control[],
    options: OptimizationOptions
  ): Promise<ControlRecommendation[]> {
    // Implementation for risk-specific recommendations
    return [];
  }

  private async optimizeRecommendations(
    recommendations: ControlRecommendation[],
    options: OptimizationOptions
  ): Promise<ControlRecommendation[]> {
    // Implementation for recommendation optimization
    return recommendations;
  }

  private async analyzeControlGapsForRisk(_risk: Risk,
    existingControls: Control[],
    targetFramework?: string
  ): Promise<ControlGapAnalysis> {
    // Implementation for gap analysis
    return {
      riskId: risk.id,
      currentControls: existingControls,
      identifiedGaps: [],
      recommendations: [],
      priorityMatrix: {
        axes: { x: 'Impact', y: 'Effort' },
        items: [],
        quadrants: [],
      },
      implementationRoadmap: [],
    };
  }

  // Additional private methods would be implemented here...
  private async buildDependencyGraph(
    recommendations: ControlRecommendation[]
  ): Promise<DependencyGraph> {
    // Build dependency graph for implementation sequencing
    return {
      nodes: recommendations.map((r) => r.id),
      edges: [],
    };
  }

  private async optimizeImplementationSequence(
    recommendations: ControlRecommendation[],
    dependencyGraph: DependencyGraph,
    constraints: ImplementationConstraints
  ): Promise<ControlRecommendation[]> {
    // Optimize implementation sequence based on dependencies and constraints
    return recommendations;
  }

  private async buildImplementationRoadmap(_optimizedSequence: ControlRecommendation[],
    constraints: ImplementationConstraints
  ): Promise<ImplementationPlan> {
    // Build detailed implementation roadmap
    return {
      phases: [],
      timeline: 180,
      resources: [],
      dependencies: [],
      milestones: [],
      riskMitigation: [],
    };
  }

  private async calculateImplementationCosts(_recommendation: ControlRecommendation,
    organizationProfile?: OrganizationProfile
  ): Promise<CostBreakdown> {
    // Calculate implementation costs
    return {
      personnel: 50000,
      technology: 25000,
      training: 10000,
      external: 15000,
      ongoing: 5000,
      total: 105000,
    };
  }

  private async calculateOperationalCosts(_recommendation: ControlRecommendation,
    organizationProfile?: OrganizationProfile
  ): Promise<CostBreakdown> {
    // Calculate annual operational costs
    return {
      personnel: 30000,
      technology: 15000,
      training: 5000,
      external: 8000,
      ongoing: 12000,
      total: 70000,
    };
  }

  private async estimateBenefits(_recommendation: ControlRecommendation,
    context: BenefitEstimationContext
  ): Promise<BenefitAnalysis> {
    // Estimate benefits from control implementation
    return {
      riskReduction: 150000,
      efficiencyGains: 25000,
      complianceBenefits: 20000,
      reputationValue: 10000,
      avoidedCosts: 30000,
      total: 235000,
      qualitativeBenefits: [
        'Improved stakeholder confidence',
        'Enhanced regulatory compliance',
        'Better risk visibility',
      ],
    };
  }

  private async calculateFinancialMetrics(
    implementationCosts: CostBreakdown,
    operationalCosts: CostBreakdown,
    benefits: BenefitAnalysis
  ): Promise<{
    paybackPeriod: number;
    roi: number;
    npv: number;
    irr: number;
  }> {
    // Calculate financial metrics
    const totalImplementation = implementationCosts.total;
    const annualCosts = operationalCosts.total;
    const annualBenefits = benefits.total;
    const netAnnualBenefit = annualBenefits - annualCosts;

    return {
      paybackPeriod: (totalImplementation / netAnnualBenefit) * 12, // months
      roi: netAnnualBenefit / totalImplementation,
      npv: netAnnualBenefit * 5 - totalImplementation, // 5-year NPV
      irr: 0.25, // 25% IRR
    };
  }

  private async performSensitivityAnalysis(_recommendation: ControlRecommendation,
    context: BenefitEstimationContext
  ): Promise<SensitivityAnalysis> {
    // Perform sensitivity analysis
    return {
      scenarios: [
        {
          name: 'Best Case',
          assumptions: ['High user adoption', 'No implementation delays'],
          costImpact: -0.1,
          benefitImpact: 0.2,
          likelihood: 0.3,
        },
        {
          name: 'Most Likely',
          assumptions: ['Normal implementation', 'Standard adoption'],
          costImpact: 0,
          benefitImpact: 0,
          likelihood: 0.5,
        },
        {
          name: 'Worst Case',
          assumptions: ['Implementation delays', 'Low adoption'],
          costImpact: 0.3,
          benefitImpact: -0.2,
          likelihood: 0.2,
        },
      ],
      variables: [],
      recommendations: ['Monitor implementation closely', 'Ensure proper change management'],
    };
  }

  private async analyzeDesignEffectiveness(_controlTemplate: ControlTemplate,
    risk: Risk
  ): Promise<EffectivenessAnalysis> {
    // Analyze control design effectiveness
    return { effectiveness: 0.8, confidence: 0.75 };
  }

  private async predictOperatingEffectiveness(_controlTemplate: ControlTemplate,
    context: {
      risk: Risk;
      organizationProfile?: OrganizationProfile;
      existingControls?: Control[];
      implementationQuality?: 'basic' | 'standard' | 'advanced';
    }
  ): Promise<EffectivenessAnalysis> {
    // Predict operating effectiveness
    return { effectiveness: 0.75, confidence: 0.7 };
  }

  private async analyzeContextualFactors(_controlTemplate: ControlTemplate,
    context: {
      risk: Risk;
      organizationProfile?: OrganizationProfile;
      existingControls?: Control[];
      implementationQuality?: 'basic' | 'standard' | 'advanced';
    }
  ): Promise<ContextualAnalysis> {
    // Analyze contextual factors
    return { factors: [], impact: 0.1 };
  }

  private calculateOverallEffectiveness(_designEffectiveness: EffectivenessAnalysis,
    operatingEffectiveness: EffectivenessAnalysis,
    contextualFactors: ContextualAnalysis
  ): {
    effectiveness: number;
    confidence: number;
    factors: EffectivenessFactor[];
    recommendations: string[];
  } {
    // Calculate overall effectiveness
    return {
      effectiveness: 0.77,
      confidence: 0.72,
      factors: [],
      recommendations: ['Regular monitoring recommended', 'Consider automation opportunities'],
    };
  }
}

interface OrganizationProfile {
  industry: string;
  size: 'small' | 'medium' | 'large' | 'enterprise';
  maturityLevel: number;
  riskTolerance: 'low' | 'medium' | 'high';
  regulatoryRequirements: string[];
  budgetConstraints: number;
  technicalCapabilities: string[];
}

interface ResourceConstraint {
  type: 'human' | 'financial' | 'technical' | 'time';
  description: string;
  limitation: number;
  flexibility: 'fixed' | 'flexible' | 'negotiable';
}

interface HistoricalRiskData {
  incidents: RiskIncident[];
  controlPerformance: ControlPerformanceData[];
  lossData: LossEvent[];
}

interface RiskIncident {
  date: Date;
  riskId: string;
  severity: number;
  cost: number;
  controlFailures: string[];
}

interface ControlPerformanceData {
  controlId: string;
  period: string;
  effectiveness: number;
  issues: string[];
  cost: number;
}

interface LossEvent {
  date: Date;
  category: string;
  amount: number;
  rootCause: string[];
  preventedBy?: string[];
}

interface MarketBenchmarkData {
  industryAverages: IndustryAverages;
  peerComparisons: PeerComparison[];
  trends: MarketTrend[];
}

interface IndustryAverages {
  controlCosts: Record<string, number>;
  effectiveness: Record<string, number>;
  implementationTime: Record<string, number>;
}

interface PeerComparison {
  organization: string;
  controls: string[];
  performance: number;
  costs: number;
}

interface MarketTrend {
  area: string;
  direction: 'increasing' | 'decreasing' | 'stable';
  impact: string;
  timeframe: string;
}

interface EffectivenessFactor {
  factor: string;
  impact: number;
  confidence: number;
  explanation: string;
}

export const controlRecommendationAIService = new ControlRecommendationAIService();
