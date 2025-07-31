import { Risk } from './index';

// Core Intelligence Types
export interface RiskQualityAnalysis {
  overallScore: number; // 0-100
  dimensions: {
    clarity: QualityDimension;
    completeness: QualityDimension;
    measurability: QualityDimension;
    actionability: QualityDimension;
    relevance: QualityDimension;
  };
  improvements: RiskImprovement[];
  benchmarkComparison: BenchmarkComparison;
  timestamp: Date;
}

export interface QualityDimension {
  score: number; // 0-100
  description: string;
  issues: QualityIssue[];
  suggestions: string[];
}

export interface QualityIssue {
  type: 'clarity' | 'completeness' | 'measurability' | 'actionability' | 'relevance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location?: string; // Where in the content the issue occurs
  suggestion: string;
}

export interface RiskImprovement {
  id: string;
  type: 'content' | 'structure' | 'methodology' | 'documentation';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  originalText?: string;
  suggestedText?: string;
  expectedImpact: number; // Expected score improvement
  implementationEffort: 'low' | 'medium' | 'high';
  rationale: string;
}

export interface BenchmarkComparison {
  industryAverage: number;
  bestPracticeScore: number;
  peerComparison: number;
  complianceAlignment: number;
  maturityLevel: 'initial' | 'developing' | 'defined' | 'managed' | 'optimizing';
}

// Emerging Risk Analysis
export interface EmergingRisk {
  id: string;
  title: string;
  description: string;
  category: RiskCategory;
  source: EmergingRiskSource;
  probability: number; // 0-1
  potentialImpact: RiskImpact;
  timeHorizon: '1-6months' | '6-12months' | '1-2years' | '2-5years' | '5+years';
  indicators: RiskIndicator[];
  mitigation: EmergingRiskMitigation;
  relevanceScore: number; // 0-100 how relevant to this organization
  confidence: number; // 0-100 confidence in the prediction
  relatedRisks: string[]; // IDs of related existing risks
  metadata: Record<string, unknown>;
}

export interface EmergingRiskSource {
  type: 'regulatory' | 'technology' | 'market' | 'environmental' | 'social' | 'economic';
  origin: string; // e.g., "EU AI Act", "Quantum Computing", "Climate Change"
  reliability: number; // 0-100
  lastUpdated: Date;
}

export interface RiskIndicator {
  id: string;
  name: string;
  description: string;
  currentValue: number;
  thresholdValue: number;
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  importance: number; // 0-100
}

export interface EmergingRiskMitigation {
  preparatoryActions: string[];
  monitoringPoints: string[];
  contingencyPlans: string[];
  resourceRequirements: ResourceRequirement[];
}

export interface ResourceRequirement {
  type: 'budget' | 'personnel' | 'technology' | 'training' | 'infrastructure';
  description: string;
  estimatedCost: number;
  timeframe: string;
}

// Risk Relationship Analysis
export interface RiskRelationshipMap {
  relationships: RiskRelationship[];
  clusters: RiskCluster[];
  criticalPaths: CriticalPath[];
  cascadingImpacts: CascadingImpact[];
  networkMetrics: NetworkMetrics;
}

export interface RiskRelationship {
  fromRiskId: string;
  toRiskId: string;
  relationshipType: 'causal' | 'correlative' | 'mutually_exclusive' | 'reinforcing' | 'mitigating';
  strength: number; // 0-1
  confidence: number; // 0-100
  description: string;
  evidence: string[];
  bidirectional: boolean;
}

export interface RiskCluster {
  id: string;
  name: string;
  riskIds: string[];
  cohesionScore: number; // 0-1
  clusterType: 'operational' | 'strategic' | 'compliance' | 'financial' | 'reputational';
  centralRiskId: string; // Most connected risk in cluster
}

export interface CriticalPath {
  id: string;
  riskIds: string[];
  totalImpact: number;
  probability: number;
  pathLength: number;
  description: string;
  mitigationOptions: string[];
}

export interface CascadingImpact {
  triggerRiskId: string;
  affectedRisks: CascadingEffect[];
  totalAmplification: number; // Impact multiplier
  timeToImpact: number; // Hours/days to full impact
  containmentOptions: string[];
}

export interface CascadingEffect {
  riskId: string;
  impactMultiplier: number;
  propagationDelay: number; // Time delay in hours
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface NetworkMetrics {
  density: number; // How connected the risk network is
  centralization: number; // How much the network depends on central nodes
  modularity: number; // How well risks group into communities
  resilience: number; // Network's ability to maintain function if nodes fail
  complexity: number; // Overall network complexity score
}

// Risk Appetite Analysis
export interface RiskAppetite {
  id: string;
  organizationId: string;
  framework: RiskAppetiteFramework;
  categories: RiskAppetiteCategory[];
  overallTolerance: ToleranceLevel;
  lastReviewed: Date;
  nextReview: Date;
  approvedBy: string;
  version: string;
}

export interface RiskAppetiteFramework {
  methodology: 'qualitative' | 'quantitative' | 'hybrid';
  scaleType: 'numerical' | 'categorical' | 'percentage';
  timeHorizon: string;
  reviewFrequency: 'monthly' | 'quarterly' | 'annually';
  escalationThresholds: number[];
}

export interface RiskAppetiteCategory {
  category: RiskCategory;
  maxAcceptableRisk: number;
  currentExposure: number;
  utilizationPercentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  constraints: RiskConstraint[];
}

export interface RiskConstraint {
  type: 'regulatory' | 'board' | 'stakeholder' | 'operational';
  description: string;
  hardLimit: boolean;
  threshold: number;
  consequences: string[];
}

export interface ToleranceLevel {
  overall: number; // 0-100
  byCategory: Record<RiskCategory, number>;
  confidence: number; // Confidence in the appetite setting
  volatility: number; // How much appetite varies
}

export interface RiskAppetiteAnalysis {
  currentUtilization: AppetiteUtilization;
  alignment: AppetiteAlignment;
  recommendations: AppetiteRecommendation[];
  trends: AppetiteTrend[];
  breaches: AppetiteBreach[];
  forecast: AppetiteForecast;
}

export interface AppetiteUtilization {
  overall: number; // Percentage of appetite used
  byCategory: Record<RiskCategory, number>;
  overexposed: RiskCategory[];
  underutilized: RiskCategory[];
  optimalBalance: boolean;
}

export interface AppetiteAlignment {
  strategicAlignment: number; // 0-100
  stakeholderAlignment: number;
  operationalAlignment: number;
  misalignmentAreas: AlignmentIssue[];
  alignmentTrend: 'improving' | 'deteriorating' | 'stable';
}

export interface AlignmentIssue {
  area: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommendedAction: string;
  impact: number;
}

export interface AppetiteRecommendation {
  type: 'increase' | 'decrease' | 'reallocate' | 'maintain';
  category: RiskCategory;
  currentLevel: number;
  recommendedLevel: number;
  rationale: string;
  benefits: string[];
  risks: string[];
  implementationSteps: string[];
}

export interface AppetiteTrend {
  category: RiskCategory;
  direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  magnitude: number;
  timeframe: string;
  confidence: number;
  drivingFactors: string[];
}

export interface AppetiteBreach {
  id: string;
  category: RiskCategory;
  exceedanceAmount: number;
  duration: number; // Days in breach
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  status: 'active' | 'resolved' | 'escalated';
  contributingRisks: string[];
  mitigationActions: string[];
}

export interface AppetiteForecast {
  timeHorizon: number; // Months
  predictedUtilization: number[];
  scenarioAnalysis: AppetiteScenario[];
  confidence: number;
  keyAssumptions: string[];
}

export interface AppetiteScenario {
  name: string;
  probability: number;
  utilizationImpact: number;
  description: string;
  mitigationOptions: string[];
}

// Control Intelligence Types
export interface ControlRecommendation {
  id: string;
  riskId: string;
  controlType: ControlType;
  category: ControlCategory;
  title: string;
  description: string;
  rationale: string;
  implementationGuide: ImplementationGuide;
  effectiveness: EffectivenessRating;
  cost: CostAnalysis;
  complexity: ComplexityAssessment;
  compliance: ComplianceMapping[];
  alternatives: AlternativeControl[];
  confidence: number; // 0-100
  priority: ControlPriority;
  metadata: Record<string, unknown>;
}

export interface ImplementationGuide {
  steps: ImplementationStep[];
  timeline: string;
  resources: ResourceRequirement[];
  dependencies: string[];
  risks: ImplementationRisk[];
  successCriteria: string[];
}

export interface ImplementationStep {
  id: string;
  title: string;
  description: string;
  duration: string;
  resources: string[];
  deliverables: string[];
  dependencies: string[];
}

export interface ImplementationRisk {
  description: string;
  probability: number;
  impact: string;
  mitigation: string;
}

export interface EffectivenessRating {
  overall: number; // 0-100
  designEffectiveness: number;
  operatingEffectiveness: number;
  factors: EffectivenessFactor[];
  benchmarkComparison: number;
  confidence: number;
}

export interface EffectivenessFactor {
  factor: string;
  impact: number; // -100 to +100
  description: string;
  weight: number; // 0-1
}

export interface CostAnalysis {
  initialCost: number;
  recurringCost: number;
  totalCostOfOwnership: number;
  roi: number;
  paybackPeriod: number; // Months
  costFactors: CostFactor[];
  assumptions: string[];
}

export interface CostFactor {
  category: 'technology' | 'personnel' | 'training' | 'infrastructure' | 'maintenance';
  amount: number;
  frequency: 'one-time' | 'monthly' | 'quarterly' | 'annually';
  description: string;
}

export interface ComplexityAssessment {
  technical: number; // 0-100
  organizational: number;
  process: number;
  overall: number;
  factors: ComplexityFactor[];
  mitigationStrategies: string[];
}

export interface ComplexityFactor {
  type: string;
  score: number;
  description: string;
  impact: string;
}

export interface ComplianceMapping {
  framework: string;
  requirement: string;
  coverageLevel: 'full' | 'partial' | 'supplementary';
  citation: string;
  additionalRequirements: string[];
}

export interface AlternativeControl {
  title: string;
  description: string;
  effectiveness: number;
  cost: number;
  complexity: number;
  tradeoffs: string[];
}

export type ControlPriority = 'critical' | 'high' | 'medium' | 'low';
export type ControlType = 'preventive' | 'detective' | 'corrective' | 'compensating';
export type ControlCategory = 'manual' | 'automated' | 'it-dependent' | 'it-general';

// Control Gap Analysis
export interface ControlGapAnalysis {
  coverage: CoverageAnalysis;
  gaps: ControlGap[];
  redundancies: ControlRedundancy[];
  optimization: OptimizationOpportunity[];
  riskExposure: GapRiskExposure;
  recommendations: GapRecommendation[];
}

export interface CoverageAnalysis {
  overall: number; // 0-100 percentage covered
  byRisk: Record<string, number>;
  byCategory: Record<RiskCategory, number>;
  byFramework: Record<string, number>;
  trends: CoverageTrend[];
}

export interface CoverageTrend {
  period: string;
  coverage: number;
  direction: 'improving' | 'deteriorating' | 'stable';
  factors: string[];
}

export interface ControlGap {
  id: string;
  riskIds: string[];
  gapType: 'missing' | 'inadequate' | 'ineffective' | 'outdated';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: GapImpact;
  recommendations: string[];
  priority: number; // 1-100
  estimatedCost: number;
  timeToImplement: string;
}

export interface GapImpact {
  riskIncrease: number; // Percentage increase in risk exposure
  complianceImpact: string[];
  businessImpact: string;
  stakeholderImpact: string[];
}

export interface ControlRedundancy {
  id: string;
  controlIds: string[];
  redundancyType: 'full' | 'partial' | 'overlapping';
  description: string;
  consolidationOpportunity: ConsolidationOpportunity;
  riskOfConsolidation: string[];
}

export interface ConsolidationOpportunity {
  approach: string;
  costSavings: number;
  effectivenessImpact: number;
  implementationEffort: string;
  timeline: string;
}

export interface OptimizationOpportunity {
  id: string;
  type: 'automation' | 'consolidation' | 'enhancement' | 'elimination';
  description: string;
  benefits: OptimizationBenefit[];
  investment: number;
  roi: number;
  timeline: string;
  feasibility: number; // 0-100
}

export interface OptimizationBenefit {
  type: 'cost' | 'efficiency' | 'effectiveness' | 'compliance';
  quantifiedBenefit: number;
  description: string;
  timeframe: string;
}

export interface GapRiskExposure {
  totalExposure: number;
  byRisk: Record<string, number>;
  byCategory: Record<RiskCategory, number>;
  criticalExposures: CriticalExposure[];
  trends: ExposureTrend[];
}

export interface CriticalExposure {
  riskId: string;
  exposureLevel: number;
  urgency: 'immediate' | 'urgent' | 'important' | 'monitor';
  potentialImpact: string;
  recommendedActions: string[];
}

export interface ExposureTrend {
  period: string;
  exposure: number;
  direction: 'increasing' | 'decreasing' | 'stable';
  drivingFactors: string[];
}

export interface GapRecommendation {
  id: string;
  gapId: string;
  recommendation: string;
  priority: ControlPriority;
  cost: number;
  timeline: string;
  benefits: string[];
  risks: string[];
  alternatives: string[];
}

// Common Types
export type RiskCategory =
  | 'operational'
  | 'financial'
  | 'strategic'
  | 'compliance'
  | 'technology'
  | 'reputational'
  | 'environmental'
  | 'human_resources';

export type RiskImpact = 'negligible' | 'minor' | 'moderate' | 'major' | 'severe';

export interface OrganizationContext {
  id: string;
  industry: Industry;
  organizationSize: OrganizationSize;
  riskAppetite: RiskAppetite;
  regulatoryEnvironment: RegulatoryFramework[];
  currentRiskLandscape: Risk[];
  historicalIncidents: Incident[];
  businessObjectives: BusinessObjective[];
  geographicPresence: GeographicRegion[];
  operatingModel: OperatingModel;
  maturityLevel: RiskMaturityLevel;
  lastUpdated: Date;
}

export interface Industry {
  code: string;
  name: string;
  sector: string;
  subSector?: string;
  regulatoryIntensity: 'low' | 'medium' | 'high' | 'very_high';
  riskProfile: IndustryRiskProfile;
}

export interface IndustryRiskProfile {
  primaryRisks: RiskCategory[];
  emergingRisks: string[];
  regulatoryTrends: string[];
  benchmarkMetrics: Record<string, number>;
}

export type OrganizationSize = 'startup' | 'small' | 'medium' | 'large' | 'enterprise';

export interface RegulatoryFramework {
  id: string;
  name: string;
  jurisdiction: string;
  applicability: number; // 0-100 how applicable to this org
  complexity: number; // 0-100
  changeFrequency: 'low' | 'medium' | 'high';
  requirements: RegulatoryRequirement[];
}

export interface RegulatoryRequirement {
  id: string;
  description: string;
  category: string;
  mandatory: boolean;
  deadline?: Date;
  penalties: string[];
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  category: RiskCategory;
  severity: RiskImpact;
  dateOccurred: Date;
  dateResolved?: Date;
  financialImpact: number;
  lessonsLearned: string[];
  preventiveActions: string[];
  relatedRisks: string[];
}

export interface BusinessObjective {
  id: string;
  title: string;
  description: string;
  category: 'financial' | 'operational' | 'strategic' | 'stakeholder';
  priority: 'low' | 'medium' | 'high' | 'critical';
  timeline: string;
  success_metrics: string[];
  relatedRisks: string[];
}

export type GeographicRegion =
  | 'north_america'
  | 'europe'
  | 'asia_pacific'
  | 'latin_america'
  | 'middle_east_africa';

export interface OperatingModel {
  structure: 'centralized' | 'decentralized' | 'hybrid';
  governance: 'traditional' | 'agile' | 'matrix';
  riskCulture: 'risk_averse' | 'balanced' | 'risk_taking';
  decisionMaking: 'top_down' | 'collaborative' | 'distributed';
}

export type RiskMaturityLevel = 'initial' | 'developing' | 'defined' | 'managed' | 'optimizing';

// Content Quality Types
export interface QualityScore {
  overall: number; // 0-100
  dimensions: QualityDimensions;
  improvements: ContentImprovement[];
  benchmarks: QualityBenchmarks;
  confidence: number; // 0-100
  timestamp: Date;
}

export interface QualityDimensions {
  clarity: number; // 0-100
  completeness: number;
  consistency: number;
  conciseness: number;
  accuracy: number;
  relevance: number;
  actionability: number;
  measurability: number;
}

export interface ContentImprovement {
  id: string;
  type: 'word_choice' | 'structure' | 'clarity' | 'completeness' | 'consistency';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  originalText: string;
  suggestedText: string;
  rationale: string;
  expectedImpact: number; // Expected score improvement
  confidence: number; // 0-100
}

export interface QualityBenchmarks {
  industryStandard: number;
  organizationAverage: number;
  bestPractice: number;
  complianceMinimum: number;
}

export type ContentType =
  | 'risk_description'
  | 'control_procedure'
  | 'policy_document'
  | 'assessment_questionnaire'
  | 'incident_report'
  | 'risk_scenario'
  | 'training_material';

// Style Guide and Compliance
export interface StyleGuide {
  id: string;
  organizationId: string;
  name: string;
  version: string;
  language: string;
  tone: 'formal' | 'professional' | 'conversational' | 'technical';
  terminology: TerminologyRule[];
  formatting: FormattingRule[];
  structure: StructureRule[];
  lastUpdated: Date;
}

export interface TerminologyRule {
  term: string;
  preferredUsage: string;
  alternatives: string[];
  context: string;
  mandatory: boolean;
}

export interface FormattingRule {
  element: string;
  requirement: string;
  examples: string[];
}

export interface StructureRule {
  contentType: ContentType;
  requiredSections: string[];
  optionalSections: string[];
  order: string[];
  guidelines: string[];
}

export interface ComplianceValidation {
  isCompliant: boolean;
  overallScore: number; // 0-100
  frameworkResults: FrameworkValidation[];
  violations: ComplianceViolation[];
  recommendations: ComplianceRecommendation[];
  lastValidated: Date;
}

export interface FrameworkValidation {
  frameworkId: string;
  name: string;
  compliant: boolean;
  score: number; // 0-100
  requirements: RequirementValidation[];
}

export interface RequirementValidation {
  requirementId: string;
  description: string;
  status: 'compliant' | 'non_compliant' | 'partial' | 'not_applicable';
  evidence: string[];
  gaps: string[];
}

export interface ComplianceViolation {
  id: string;
  frameworkId: string;
  requirementId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: string; // Where in content
  remediation: string;
  deadline?: Date;
}

export interface ComplianceRecommendation {
  id: string;
  type: 'content_update' | 'process_change' | 'control_addition' | 'training';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  benefits: string[];
  effort: 'low' | 'medium' | 'high';
  timeline: string;
}

// Predictive Analytics Types
export interface RiskTrendPrediction {
  riskId: string;
  timeHorizon: number; // Months
  trend: TrendDirection;
  predictions: TrendPrediction[];
  confidence: number; // 0-100
  influencingFactors: InfluencingFactor[];
  scenarios: PredictionScenario[];
  recommendations: string[];
}

export type TrendDirection = 'increasing' | 'decreasing' | 'stable' | 'volatile' | 'cyclical';

export interface TrendPrediction {
  timestamp: Date;
  predictedValue: number;
  confidenceInterval: ConfidenceInterval;
  factors: string[];
}

export interface ConfidenceInterval {
  lower: number;
  upper: number;
  confidence: number; // 0-100
}

export interface InfluencingFactor {
  name: string;
  influence: number; // -100 to +100
  description: string;
  predictability: number; // 0-100
}

export interface PredictionScenario {
  name: string;
  description: string;
  probability: number; // 0-100
  outcome: number;
  impact: string;
  mitigationOptions: string[];
}

export interface PerformanceForecast {
  controlId: string;
  forecastPeriod: number; // Months
  predictedPerformance: PerformancePrediction[];
  deteriorationRisk: number; // 0-100
  maintenanceRequirements: MaintenanceRequirement[];
  optimizationOpportunities: string[];
  confidence: number; // 0-100
}

export interface PerformancePrediction {
  timestamp: Date;
  effectiveness: number; // 0-100
  reliability: number; // 0-100
  efficiency: number; // 0-100
  confidenceInterval: ConfidenceInterval;
}

export interface MaintenanceRequirement {
  type: 'update' | 'review' | 'test' | 'training' | 'replacement';
  description: string;
  scheduledDate: Date;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  estimatedEffort: string;
  impact: string;
}

export interface ScenarioAnalysisResult {
  scenarioId: string;
  name: string;
  description: string;
  probability: number; // 0-100
  impact: ScenarioImpact;
  affectedRisks: AffectedRisk[];
  mitigationStrategies: MitigationStrategy[];
  contingencyPlans: ContingencyPlan[];
  confidence: number; // 0-100
}

export interface ScenarioImpact {
  financial: number;
  operational: string;
  strategic: string;
  reputational: string;
  timeline: string;
  severity: RiskImpact;
}

export interface AffectedRisk {
  riskId: string;
  impactMultiplier: number;
  newProbability: number;
  newImpact: RiskImpact;
  reasoning: string;
}

export interface MitigationStrategy {
  id: string;
  name: string;
  description: string;
  effectiveness: number; // 0-100
  cost: number;
  timeline: string;
  feasibility: number; // 0-100
  dependencies: string[];
}

export interface ContingencyPlan {
  id: string;
  trigger: string;
  actions: string[];
  resources: ResourceRequirement[];
  timeline: string;
  responsibilities: string[];
  successCriteria: string[];
}

export interface AllocationRecommendation {
  category: RiskCategory;
  currentAllocation: number;
  recommendedAllocation: number;
  rationale: string;
  expectedBenefit: AllocationBenefit;
  implementationPlan: AllocationPlan;
  riskAdjustment: RiskAdjustment[];
}

export interface AllocationBenefit {
  riskReduction: number; // Percentage
  efficiencyGain: number; // Percentage
  roiImprovement: number;
  qualitativeBenefits: string[];
}

export interface AllocationPlan {
  phases: AllocationPhase[];
  timeline: string;
  milestones: string[];
  successMetrics: string[];
  contingencies: string[];
}

export interface AllocationPhase {
  phase: number;
  description: string;
  allocation: number;
  duration: string;
  deliverables: string[];
  dependencies: string[];
}

export interface RiskAdjustment {
  riskId: string;
  currentExposure: number;
  projectedExposure: number;
  adjustmentReason: string;
  timeline: string;
}

// Context and Insights
export interface ContextualInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'opportunity' | 'threat' | 'benchmark';
  title: string;
  description: string;
  relevance: number; // 0-100
  urgency: 'low' | 'medium' | 'high' | 'critical';
  category: RiskCategory;
  insights: string[];
  recommendations: string[];
  dataPoints: DataPoint[];
  confidence: number; // 0-100
  expiresAt?: Date;
}

export interface DataPoint {
  metric: string;
  value: number;
  comparison: ComparisonValue;
  trend: TrendDirection;
  significance: number; // 0-100
}

export interface ComparisonValue {
  baseline: number;
  industry: number;
  benchmark: number;
  trend: number;
}

export interface ContextUpdate {
  type: 'risk_change' | 'control_change' | 'incident' | 'regulatory_change' | 'business_change';
  description: string;
  impact: ContextImpact;
  effectiveDate: Date;
  metadata: Record<string, unknown>;
}

export interface ContextImpact {
  areas: string[];
  magnitude: 'low' | 'medium' | 'high' | 'critical';
  duration: 'temporary' | 'permanent';
  cascadingEffects: string[];
}
