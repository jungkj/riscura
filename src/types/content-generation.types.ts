import { Risk, Control } from './index';
import { 
  QualityScore, 
  ContentType, 
  RiskCategory, 
  Industry, 
  OrganizationContext 
} from './risk-intelligence.types';

// Define ContentType enum
export type ContentType = 
  | 'risk_description' 
  | 'control_description' 
  | 'test_script' 
  | 'policy_document' 
  | 'procedure_document'
  | 'assessment_report'
  | 'audit_finding'
  | 'corrective_action';

// Define OrganizationContext
export interface OrganizationContext {
  id: string;
  organizationSize: 'small' | 'medium' | 'large' | 'enterprise';
  industry: Industry;
  maturityLevel: 'initial' | 'developing' | 'defined' | 'managed' | 'optimizing';
  riskAppetite: 'low' | 'medium' | 'high';
  regulatoryEnvironment: string[];
  geographicScope: string[];
  businessModel: string;
}

// Core Content Generation Types
export interface RegenerationResult {
  alternatives: ContentAlternative[];
  originalContent: string;
  improvements: ImprovementSummary;
  qualityComparison: QualityComparison;
  changeTracking: ChangeTrack[];
  recommendedAlternative: string; // ID of best alternative
  metadata: RegenerationMetadata;
}

export interface ContentAlternative {
  id: string;
  content: string;
  qualityScore: QualityScore;
  improvementAreas: ImprovementArea[];
  strengthAreas: string[];
  confidence: number; // 0-100
  reasoning: string;
  generationMethod: 'template_based' | 'ai_generated' | 'hybrid' | 'rule_based';
  estimatedEffort: 'low' | 'medium' | 'high';
  riskLevel: 'low' | 'medium' | 'high';
}

export interface ImprovementCriteria {
  targetAudience: Audience;
  qualityThresholds: QualityThresholds;
  styleRequirements: StyleRequirements;
  complianceRequirements: ComplianceRequirement[];
  organizationContext: OrganizationContext;
  priorityAreas: ImprovementArea[];
  constraints: ImprovementConstraint[];
}

export interface ImprovementArea {
  aspect: 'clarity' | 'completeness' | 'accuracy' | 'consistency' | 'actionability' | 'measurability';
  priority: 'low' | 'medium' | 'high' | 'critical';
  currentScore: number;
  targetScore: number;
  gap: number;
  recommendations: string[];
}

export interface QualityThresholds {
  minimum: number;
  target: number;
  excellent: number;
  aspectThresholds: Record<string, number>;
}

export interface StyleRequirements {
  tone: CommunicationTone;
  formality: 'formal' | 'professional' | 'conversational';
  technicalLevel: TechnicalLevel;
  vocabulary: 'simple' | 'standard' | 'advanced' | 'technical';
  sentenceComplexity: 'simple' | 'moderate' | 'complex';
}

export interface ComplianceRequirement {
  framework: string;
  requirements: string[];
  criticality: 'low' | 'medium' | 'high' | 'mandatory';
  validationRules: string[];
}

export interface ImprovementConstraint {
  type: 'length' | 'format' | 'terminology' | 'style' | 'content';
  constraint: string;
  flexibility: 'strict' | 'moderate' | 'flexible';
}

export interface ImprovementSummary {
  totalImprovements: number;
  qualityGain: number;
  primaryBenefits: string[];
  implementationEffort: string;
}

export interface QualityComparison {
  before: QualityScore;
  after: QualityScore;
  improvement: number;
  significantChanges: string[];
}

export interface ChangeTrack {
  change: string;
  type: string;
  impact: string;
  reasoning: string;
}

export interface RegenerationMetadata {
  method: string;
  criteria: ImprovementCriteria;
  processingTime: number;
  confidence: number;
}

// Control Enhancement Types
export interface ControlEnhancement {
  originalControl: Control;
  enhancedDescription: string;
  clarityImprovements: Enhancement[];
  completenessEnhancements: Enhancement[];
  industryStandards: string[];
  regulatoryRequirements: string[];
  organizationMaturity: string;
  implementation: ImplementationGuidance;
  resourceConstraints: string[];
  performanceExpectations: string[];
  qualityImprovement: number;
  confidence: number;
  validationResults: ValidationResult[];
}

export interface Enhancement {
  aspect: string;
  originalText: string;
  enhancedText: string;
  rationale: string;
  impact: number; // 0-100
  effort: 'low' | 'medium' | 'high';
  risk: 'low' | 'medium' | 'high';
}

export interface ImplementationGuidance {
  steps: ImplementationStep[];
  timeline: string;
  resources: string[];
  dependencies: string[];
  risks: string[];
  successCriteria: string[];
}

export interface ImplementationStep {
  id: string;
  description: string;
  order: number;
  duration: string;
  effort: string;
  skills: string[];
  deliverables: string[];
}

export interface ValidationResult {
  aspect: string;
  isValid: boolean;
  score: number;
  issues: string[];
  recommendations: string[];
}

export interface ControlContext {
  riskContext: RiskCategory[];
  industryRequirements: string[];
  organizationalFactors: OrganizationContext;
  existingControls: Control[];
  complianceFrameworks: string[];
  maturityLevel: string;
  resourceAvailability: string;
  riskTolerance: string;
}

export interface TestScript {
  id: string;
  controlId: string;
  description: string;
  steps: TestStep[];
  expectedEvidence: string[];
  frequency: string;
  effort: string;
  skillRequirements: string[];
  tools: string[];
  riskLevel: string;
  lastUpdated: Date;
  version: string;
}

export interface TestStep {
  id: string;
  stepNumber: number;
  description: string;
  action: string;
  expectedResult: string;
  evidence: string[];
  criticalityLevel: string;
  estimatedTime: string;
  dependencies: string[];
}

export interface TestScriptOptimization {
  optimizedScript: TestScript;
  improvements: TestabilityImprovement[];
  efficiencyGains: EfficiencyGain[];
  automationOpportunities: AutomationOpportunity[];
  qualityEnhancements: Enhancement[];
  riskReductions: RiskReduction[];
  resourceOptimization: ResourceOptimization;
  overallImprovement: number;
}

export interface TestabilityImprovement {
  area: string;
  originalText: string;
  improvedText: string;
  benefit: string;
  implementationEffort: string;
  impact: number;
}

export interface EfficiencyGain {
  area: string;
  currentEffort: string;
  optimizedEffort: string;
  timeSaving: string;
  resourceSaving: string;
  implementation: string;
}

export interface AutomationOpportunity {
  step: string;
  automationType: 'full' | 'partial' | 'assisted';
  tools: string[];
  effort: string;
  benefits: string[];
  risks: string[];
  roi: number;
}

export interface RiskReduction {
  risk: string;
  currentLevel: string;
  reducedLevel: string;
  mitigation: string;
  confidence: number;
}

export interface ResourceOptimization {
  currentResources: string[];
  optimizedResources: string[];
  savings: string;
  reallocation: string[];
  impact: string;
}

export interface ScriptOptimization {
  type: string;
  description: string;
  benefit: string;
  effort: string;
  priority: string;
}

// Risk Template Types
export interface RiskTemplate {
  id: string;
  category: RiskCategory;
  industry: Industry;
  template: RiskStatementTemplate;
  guidance: RiskGuidance;
  examples: RiskExample[];
  customizations: TemplateCustomization[];
  validation: TemplateValidation;
  usage: TemplateUsage;
}

export interface RiskStatementTemplate {
  structure: StatementStructure;
  requiredElements: TemplateElement[];
  optionalElements: TemplateElement[];
  placeholders: Placeholder[];
  validationRules: ValidationRule[];
  qualityCheckpoints: QualityCheckpoint[];
}

export interface StatementStructure {
  format: string;
  sections: string[];
  optionalSections: string[];
  flow: string[];
}

export interface TemplateElement {
  name: string;
  description: string;
  type: string;
  required: boolean;
  placeholder: string;
  examples: string[];
}

export interface Placeholder {
  name: string;
  description: string;
  type: string;
  defaultValue: string;
  validation: string[];
}

export interface ValidationRule {
  rule: string;
  description: string;
  severity: string;
  errorMessage: string;
}

export interface QualityCheckpoint {
  checkpoint: string;
  criteria: string[];
  weight: number;
  automated: boolean;
}

export interface RiskGuidance {
  completionTips: string[];
  commonMistakes: CommonMistake[];
  bestPractices: string[];
  industrySpecificAdvice: string[];
  examplePhrases: ExamplePhrase[];
  relatedFrameworks: string[];
}

export interface CommonMistake {
  mistake: string;
  description: string;
  impact: string;
  correction: string;
  prevention: string[];
}

export interface ExamplePhrase {
  phrase: string;
  context: string;
  usage: string;
  alternatives: string[];
}

export interface RiskExample {
  scenario: string;
  statementExample: string;
  qualityScore: number;
  explanation: string;
  applicableContexts: string[];
}

// Control Framework Template Types
export interface ControlFrameworkTemplate {
  id: string;
  riskProfile: RiskProfile;
  framework: ControlFramework;
  recommendations: FrameworkRecommendation[];
  implementation: ImplementationPlan;
  testing: TestingFramework;
  monitoring: MonitoringFramework;
}

export interface RiskProfile {
  id: string;
  categories: RiskCategory[];
  industryFactors: string[];
  organizationSize: string;
  maturityLevel: string;
  riskAppetite: string;
}

export interface ControlFramework {
  hierarchy: ControlHierarchy;
  controlTypes: ControlTypeMapping[];
  relationships: ControlRelationship[];
  coverage: CoverageMapping;
  maturityPath: MaturityProgression[];
}

export interface ControlHierarchy {
  levels: HierarchyLevel[];
  governance: string[];
  responsibilities: string[];
}

export interface HierarchyLevel {
  level: number;
  name: string;
  description: string;
  controls: string[];
}

export interface ControlTypeMapping {
  category: RiskCategory;
  preventiveControls: string[];
  detectiveControls: string[];
  correctiveControls: string[];
  compensatingControls: string[];
}

export interface ControlRelationship {
  sourceControl: string;
  targetControl: string;
  relationship: string;
  strength: number;
}

export interface CoverageMapping {
  riskCoverage: Record<string, number>;
  redundancies: string[];
  gaps: string[];
}

export interface MaturityProgression {
  level: string;
  description: string;
  requirements: string[];
  timeline: string;
}

export interface FrameworkRecommendation {
  id: string;
  type: string;
  priority: string;
  description: string;
  rationale: string;
  effort: string;
  impact: string;
}

export interface ImplementationPlan {
  phases: ImplementationPhase[];
  timeline: string;
  resources: string[];
  dependencies: string[];
  risks: string[];
}

export interface ImplementationPhase {
  phase: number;
  name: string;
  duration: string;
  activities: string[];
  deliverables: string[];
}

export interface TestingFramework {
  approach: string;
  procedures: string[];
  frequency: string;
  roles: string[];
}

export interface MonitoringFramework {
  metrics: string[];
  reporting: string[];
  escalation: string[];
  review: string;
}

export interface TestingProcedureTemplate {
  id: string;
  controlId: string;
  objectives: TestingObjective[];
  procedures: ProcedureTemplate[];
  schedules: TestingSchedule[];
  resources: ResourceTemplate[];
  reporting: ReportingTemplate;
}

export interface TestingObjective {
  id: string;
  description: string;
  type: 'design' | 'operating' | 'compliance';
  priority: 'low' | 'medium' | 'high';
  frequency: string;
}

export interface ProcedureTemplate {
  id: string;
  name: string;
  steps: string[];
  evidence: string[];
  tools: string[];
}

export interface TestingSchedule {
  frequency: string;
  timing: string;
  duration: string;
  resources: string[];
}

export interface ResourceTemplate {
  type: string;
  requirements: string[];
  allocation: string;
  skills: string[];
}

export interface ReportingTemplate {
  format: string;
  sections: string[];
  distribution: string[];
  frequency: string;
}

// Language Enhancement Types
export interface ClarityImprovement {
  improvements: TextImprovement[];
  readabilityScore: ReadabilityScore;
  complexityReduction: ComplexityReduction;
  audienceAlignment: AudienceAlignment;
  recommendations: ClarityRecommendation[];
}

export interface TextImprovement {
  id: string;
  type: string;
  originalText: string;
  improvedText: string;
  rationale: string;
  impact: number;
  confidence: number;
}

export interface ReadabilityScore {
  fleschKincaid: number;
  gunningFog: number;
  smog: number;
  overall: number;
  audience: Audience;
}

export interface ComplexityReduction {
  syntacticSimplification: number;
  lexicalSimplification: number;
  structuralSimplification: number;
  overall: number;
}

export interface AudienceAlignment {
  currentAlignment: number;
  targetAlignment: number;
  gap: number;
  recommendations: string[];
}

export interface ClarityRecommendation {
  id: string;
  type: string;
  priority: 'low' | 'medium' | 'high';
  description: string;
  expectedImprovement: number;
  implementationEffort: 'low' | 'medium' | 'high';
}

export interface ToneAdjustment {
  adjustedText: string;
  toneChanges: ToneChange[];
  consistencyScore: number;
  appropriatenessScore: number;
  recommendations: ToneRecommendation[];
}

export interface ToneChange {
  aspect: string;
  currentLevel: number;
  targetLevel: number;
  adjustmentType: 'increase' | 'decrease';
  specificChanges: string[];
}

export interface ToneRecommendation {
  aspect: string;
  recommendation: string;
  priority: string;
  impact: number;
}

export interface SimplificationResult {
  simplifiedText: string;
  complexityReduction: number;
  readabilityImprovement: ReadabilityImprovement;
  conceptualIntegrity: number;
  alternativeComplexities: AlternativeComplexity[];
}

export interface ReadabilityImprovement {
  fleschKincaidImprovement: number;
  gunningFogImprovement: number;
  smogImprovement: number;
  overallImprovement: number;
}

export interface AlternativeComplexity {
  level: string;
  text: string;
  complexity: number;
  tradeoffs: string[];
}

export interface ActionabilityEnhancement {
  enhancedText: string;
  actionableElements: ActionableElement[];
  implementationGuidance: string[];
  successCriteria: string[];
  timelineGuidance: TimelineGuidance;
  resourceRequirements: string[];
}

export interface ActionableElement {
  id: string;
  type: string;
  description: string;
  action: string;
  owner: string;
  timeline: string;
  resources: string[];
  success: string[];
}

export interface TimelineGuidance {
  estimatedDuration: string;
  milestones: string[];
  dependencies: string[];
  criticalPath: string[];
}

// Version Management Types
export interface ContentVersion {
  id: string;
  content: string;
  timestamp: Date;
  author: 'user' | 'ai';
  changeDescription: string;
  qualityScore: QualityScore;
  approvalStatus: ApprovalStatus;
  reviewComments: ReviewComment[];
  metadata: VersionMetadata;
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'under_review';

export interface ReviewComment {
  id: string;
  reviewer: string;
  comment: string;
  timestamp: Date;
  type: string;
}

export interface VersionMetadata {
  wordCount: number;
  contentType: ContentType;
  tags: string[];
  analytics: Record<string, any>;
}

export interface VersionComparison {
  version1: ContentVersion;
  version2: ContentVersion;
  qualityDiff: QualityDifference;
  structuralChanges: StructuralChange[];
  semanticChanges: SemanticChange[];
  changeSummary: string;
  impactAssessment: ImpactAssessment;
  recommendations: ComparisonRecommendation[];
  mergeability: MergeabilityAssessment;
}

export interface QualityDifference {
  overall: number;
  aspects: Record<string, number>;
  improvement: boolean;
  significance: string;
}

export interface StructuralChange {
  type: string;
  location: string;
  description: string;
  impact: ChangeImpact;
}

export interface SemanticChange {
  type: string;
  location: string;
  description: string;
  severity: string;
}

export interface ImpactAssessment {
  riskLevel: string;
  impactedElements: ImpactedElement[];
  rollbackComplexity: string;
  approvalRequired: boolean;
  warnings: RollbackWarning[];
}

export interface ImpactedElement {
  element: string;
  impact: string;
  severity: string;
}

export interface RollbackWarning {
  warning: string;
  severity: string;
  recommendation: string;
}

export interface ComparisonRecommendation {
  type: string;
  description: string;
  priority: string;
  rationale: string;
}

export interface MergeabilityAssessment {
  canMerge: boolean;
  conflicts: MergeConflict[];
  autoResolvedChanges: AutoResolvedChange[];
  resolution: string;
  recommendations: MergeRecommendation[];
}

export interface MergeConflict {
  location: string;
  type: string;
  description: string;
  resolution?: string;
}

export interface AutoResolvedChange {
  change: string;
  resolution: string;
  confidence: number;
}

export interface MergeRecommendation {
  recommendation: string;
  rationale: string;
  priority: string;
}

// Batch Processing Types
export interface BatchProcessingResult {
  processedItems: ProcessedItem[];
  successCount: number;
  errorCount: number;
  qualityImprovements: BatchQualityImprovement[];
  recommendations: BatchRecommendation[];
  overallImprovement: number;
}

export interface ProcessedItem {
  id: string;
  status: string;
  result?: RegenerationResult | ControlEnhancement | TestScriptOptimization;
  error?: string;
  quality: number;
}

export interface BatchQualityImprovement {
  type: string;
  improvement: number;
  itemsAffected: number;
  description: string;
}

export interface BatchRecommendation {
  type: string;
  description: string;
  priority: string;
  itemsAffected: string[];
}

export interface QualityAnalysisResult {
  itemScores: ItemQualityScore[];
  overallScore: number;
  trends: QualityTrend[];
  outliers: QualityOutlier[];
  recommendations: QualityRecommendation[];
  benchmarks: QualityBenchmark[];
}

export interface ItemQualityScore {
  itemId: string;
  score: number;
  aspects: Record<string, number>;
  issues: string[];
}

export interface QualityTrend {
  aspect: string;
  direction: string;
  strength: number;
  duration: string;
}

export interface QualityOutlier {
  itemId: string;
  type: string;
  score: number;
  reason: string;
}

export interface QualityRecommendation {
  type: string;
  description: string;
  impact: string;
  effort: string;
}

export interface QualityBenchmark {
  name: string;
  score: number;
  comparison: string;
}

export interface StandardizationResult {
  standardizedItems: StandardizedItem[];
  standardizationRules: StandardizationRule[];
  compliance: ComplianceReport;
  exceptions: StandardizationException[];
  qualityImpact: BatchQualityImpact;
}

export interface StandardizedItem {
  itemId: string;
  originalText: string;
  standardizedText: string;
  changes: string[];
  confidence: number;
}

export interface StandardizationRule {
  rule: string;
  description: string;
  applications: number;
  confidence: number;
}

export interface ComplianceReport {
  framework: string;
  score: number;
  violations: string[];
  recommendations: string[];
}

export interface StandardizationException {
  itemId: string;
  reason: string;
  recommendation: string;
}

export interface BatchQualityImpact {
  before: number;
  after: number;
  improvement: number;
  distribution: Record<string, number>;
}

// Analytics and Reporting Types
export interface ContentAnalytics {
  timeRange: TimeRange;
  volumeMetrics: VolumeMetrics;
  qualityMetrics: QualityMetrics;
  predictions: TrendPrediction[];
  anomalies: TrendAnomaly[];
  insights: TrendInsight[];
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface VolumeMetrics {
  totalItems: number;
  itemsPerDay: number;
  growthRate: number;
  peakPeriods: string[];
}

export interface QualityMetrics {
  averageScore: number;
  distribution: Record<string, number>;
  trends: string[];
  improvements: number;
}

export interface TrendPrediction {
  metric: string;
  prediction: number;
  confidence: number;
  timeframe: string;
}

export interface TrendAnomaly {
  metric: string;
  value: number;
  expected: number;
  severity: string;
  explanation: string;
}

export interface TrendInsight {
  insight: string;
  impact: string;
  recommendation: string;
  confidence: number;
}

export interface PatternAnalysisResult {
  successPatterns: SuccessPattern[];
  problemPatterns: ProblemPattern[];
  industryPatterns: IndustryPattern[];
  recommendations: PatternRecommendation[];
}

export interface SuccessPattern {
  pattern: string;
  frequency: number;
  impact: string;
  characteristics: string[];
}

export interface ProblemPattern {
  pattern: string;
  frequency: number;
  impact: string;
  mitigation: string[];
}

export interface IndustryPattern {
  industry: string;
  pattern: string;
  adoption: number;
  effectiveness: number;
}

export interface PatternRecommendation {
  recommendation: string;
  rationale: string;
  priority: string;
  implementation: string;
}

export interface BenchmarkingResult {
  currentPerformance: PerformanceMetrics;
  industryBenchmarks: BenchmarkData[];
  gaps: PerformanceGap[];
  strengths: BenchmarkStrength[];
  improvementPlan: ImprovementPlan;
}

export interface PerformanceMetrics {
  quality: number;
  efficiency: number;
  consistency: number;
  innovation: number;
}

export interface BenchmarkData {
  metric: string;
  industry: number;
  topQuartile: number;
  median: number;
  current: number;
}

export interface PerformanceGap {
  metric: string;
  gap: number;
  severity: string;
  priority: string;
}

export interface BenchmarkStrength {
  metric: string;
  advantage: number;
  sustainability: string;
}

export interface ImprovementPlan {
  objectives: string[];
  initiatives: string[];
  timeline: string;
  resources: string[];
}

export interface InsightDiscoveryResult {
  patterns: DiscoveredPattern[];
  correlations: Correlation[];
  opportunities: Opportunity[];
  risks: Risk[];
  impact: InsightImpact;
}

export interface DiscoveredPattern {
  pattern: string;
  strength: number;
  frequency: number;
  description: string;
}

export interface Correlation {
  factor1: string;
  factor2: string;
  strength: number;
  significance: string;
}

export interface Opportunity {
  opportunity: string;
  potential: string;
  effort: string;
  priority: string;
}

export interface InsightImpact {
  strategic: string;
  operational: string;
  financial: string;
  risk: string;
}

// Additional Supporting Types
export type Audience = 'executives' | 'managers' | 'specialists' | 'auditors' | 'regulators' | 'general';
export type CommunicationTone = 'formal' | 'professional' | 'conversational' | 'technical';
export type TechnicalLevel = 'basic' | 'intermediate' | 'advanced' | 'expert';

export interface TemplateCustomization {
  type: string;
  description: string;
  options: string[];
}

export interface TemplateValidation {
  rules: string[];
  checkpoints: string[];
  thresholds: Record<string, number>;
}

export interface TemplateUsage {
  guidelines: string[];
  workflows: string[];
  integrations: string[];
}

export interface ChangeImpact {
  level: string;
  areas: string[];
  description: string;
}

// Version Management Extended Types
export interface RevisionHistory {
  contentId: string;
  versions: ContentVersion[];
  metrics: VersionMetrics;
  performanceTrends: VersionPerformance[];
  collaborationAnalytics: CollaborationAnalytics;
  timeline: TimelineEvent[];
  insights: string[];
}

export interface VersionMetrics {
  totalVersions: number;
  averageQualityScore: number;
  approvalRate: number;
  averageTimeToApproval: number;
  mostActiveAuthor: string;
  qualityTrend: string;
}

export interface VersionPerformance {
  versionId: string;
  timestamp: Date;
  qualityScore: number;
  approvalTime: number;
  authorProductivity: number;
}

export interface CollaborationAnalytics {
  totalAuthors: number;
  authorStats: AuthorStats[];
  collaborationScore: number;
  averageResponseTime: number;
}

export interface AuthorStats {
  author: string;
  versionsCreated: number;
  averageQuality: number;
  approvalRate: number;
}

export interface TimelineEvent {
  id: string;
  timestamp: Date;
  event: string;
  author: string;
  description: string;
  qualityImpact: number;
}

export interface ApprovalWorkflow {
  versionId: string;
  currentStatus: string;
  reviewers: string[];
  timeline: string[];
  nextSteps: string[];
}

export interface MergeRequest {
  id: string;
  sourceBranchId: string;
  targetBranchId: string;
  status: string;
  conflicts: MergeConflict[];
  resolution: string;
  resolver?: string;
}

export interface VersionReport {
  contentId: string;
  timeRange: TimeRange;
  qualityMetrics: QualityMetrics;
  productivityMetrics: ProductivityMetrics;
  collaborationMetrics: CollaborationMetrics;
  approvalMetrics: ApprovalMetrics;
  performanceAnalysis: PerformanceAnalysis;
  trends: VersionTrend[];
  recommendations: VersionRecommendation[];
  visualizations: VisualizationData[];
}

export interface ProductivityMetrics {
  versionsPerDay: number;
  averageTimePerVersion: number;
  revisionRate: number;
  automationRate: number;
}

export interface CollaborationMetrics {
  uniqueAuthors: number;
  averageCollaboration: number;
  conflictRate: number;
  resolutionTime: number;
}

export interface ApprovalMetrics {
  approvalRate: number;
  averageApprovalTime: number;
  rejectionRate: number;
  pendingRate: number;
}

export interface PerformanceAnalysis {
  timeRange: TimeRange;
  totalActivity: number;
  qualityImprovement: number;
  productivityGain: number;
  collaborationEffectiveness: number;
}

export interface VersionTrend {
  trend: string;
  strength: 'weak' | 'moderate' | 'strong';
  duration: string;
  prediction: string;
}

export interface VersionRecommendation {
  id: string;
  type: string;
  priority: 'low' | 'medium' | 'high';
  description: string;
  expectedImpact: string;
}

export interface VisualizationData {
  type: string;
  data: any[];
  description: string;
}

export interface VersionTree {
  rootVersion: string;
  branches: VersionBranch[];
  mergeHistory: MergeRequest[];
}

export interface VersionBranch {
  id: string;
  name: string;
  versions: string[];
  parentBranch?: string;
  active: boolean;
}

export interface VersionDiff {
  additions: string[];
  deletions: string[];
  modifications: string[];
  metadata: Record<string, any>;
} 