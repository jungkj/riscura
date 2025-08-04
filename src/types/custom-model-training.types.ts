// Re-export all types from CustomModelTrainingService
export type {
  TrainingConfiguration,
  TrainingJob,
  KnowledgeBase,
  ModelPerformance,
  ABTestExperiment,
  ModelDeployment,
} from '@/services/CustomModelTrainingService';

// Import types for type guards
import type {
  TrainingJob,
  KnowledgeBase,
  ModelDeployment,
} from '@/services/CustomModelTrainingService';

// Extended training system types
export interface ModelTrainingPipeline {
  id: string;
  name: string;
  organizationId: string;
  stages: PipelineStage[];
  triggers: PipelineTrigger[];
  schedule: PipelineSchedule;
  notifications: NotificationConfig[];
  version: string;
  status: PipelineStatus;
  lastRun?: PipelineRun;
  createdAt: Date;
  updatedAt: Date;
}

export interface PipelineStage {
  id: string;
  name: string;
  type: StageType;
  configuration: StageConfiguration;
  dependencies: string[];
  timeout: number;
  retryConfig: RetryConfiguration;
  resources: ResourceRequirements;
}

export type StageType =
  | 'data_ingestion'
  | 'data_preprocessing'
  | 'feature_engineering'
  | 'model_training'
  | 'model_validation'
  | 'model_testing'
  | 'model_deployment'
  | 'monitoring_setup';

export interface StageConfiguration {
  parameters: Record<string, unknown>;
  inputArtifacts: string[];
  outputArtifacts: string[];
  quality_gates: QualityGate[];
  notifications: string[];
}

export interface QualityGate {
  name: string;
  metric: string;
  threshold: number;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  action: 'pass' | 'fail' | 'warn';
}

export interface PipelineTrigger {
  type: 'schedule' | 'data_change' | 'performance_degradation' | 'manual';
  configuration: TriggerConfiguration;
  enabled: boolean;
}

export interface TriggerConfiguration {
  schedule?: CronSchedule;
  dataSource?: string;
  performanceMetric?: string;
  threshold?: number;
  cooldownPeriod?: number;
}

export interface CronSchedule {
  expression: string;
  timezone: string;
  startDate?: Date;
  endDate?: Date;
}

export interface PipelineSchedule {
  enabled: boolean;
  cron: string;
  timezone: string;
  maxConcurrentRuns: number;
  catchup: boolean;
}

export interface NotificationConfig {
  type: 'email' | 'slack' | 'webhook' | 'sms';
  configuration: Record<string, string>;
  events: NotificationEvent[];
  recipients: string[];
}

export type NotificationEvent =
  | 'pipeline_started'
  | 'pipeline_completed'
  | 'pipeline_failed'
  | 'stage_failed'
  | 'quality_gate_failed'
  | 'model_deployed'
  | 'performance_degraded';

export type PipelineStatus = 'active' | 'inactive' | 'running' | 'completed' | 'failed' | 'paused';

export interface PipelineRun {
  id: string;
  pipelineId: string;
  status: PipelineRunStatus;
  triggeredBy: string;
  triggerType: string;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  stageRuns: StageRun[];
  artifacts: PipelineArtifact[];
  logs: PipelineLog[];
  metrics: PipelineMetrics;
}

export type PipelineRunStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'skipped';

export interface StageRun {
  stageId: string;
  status: PipelineRunStatus;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  logs: string[];
  metrics: Record<string, number>;
  artifacts: string[];
  errorMessage?: string;
}

export interface PipelineArtifact {
  id: string;
  name: string;
  type: 'model' | 'dataset' | 'report' | 'metrics' | 'logs';
  path: string;
  size: number;
  checksum: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface PipelineLog {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  stage?: string;
  message: string;
  context: Record<string, unknown>;
}

export interface PipelineMetrics {
  totalStages: number;
  completedStages: number;
  failedStages: number;
  skippedStages: number;
  successRate: number;
  averageDuration: number;
  resourceUsage: ResourceUsageMetrics;
}

export interface ResourceUsageMetrics {
  cpuHours: number;
  memoryGBHours: number;
  gpuHours: number;
  storageGB: number;
  networkGB: number;
  cost: number;
}

export interface RetryConfiguration {
  maxAttempts: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  baseDelay: number;
  maxDelay: number;
  retryableErrors: string[];
}

export interface ResourceRequirements {
  cpu: string;
  memory: string;
  gpu?: string;
  storage: string;
  network?: string;
  priority: 'low' | 'medium' | 'high';
}

// Advanced training configurations
export interface AdvancedTrainingConfig {
  distributedTraining: DistributedTrainingConfig;
  checkpointStrategy: CheckpointStrategy;
  optimizationStrategy: OptimizationStrategy;
  regularizationConfig: RegularizationConfig;
  transferLearningConfig?: TransferLearningConfig;
  multiTaskConfig?: MultiTaskConfig;
}

export interface DistributedTrainingConfig {
  enabled: boolean;
  strategy: 'data_parallel' | 'model_parallel' | 'pipeline_parallel';
  numNodes: number;
  numGPUs: number;
  communicationBackend: 'nccl' | 'gloo' | 'mpi';
  gradientCompression: boolean;
}

export interface CheckpointStrategy {
  frequency: number; // epochs
  keepLast: number;
  saveOptimizer: boolean;
  saveScheduler: boolean;
  compressionEnabled: boolean;
  cloudStorage: boolean;
}

export interface OptimizationStrategy {
  gradientAccumulation: number;
  mixedPrecision: boolean;
  gradientClipping: ClippingConfig;
  learningRateScheduler: SchedulerConfig;
  warmupStrategy: WarmupConfig;
}

export interface ClippingConfig {
  enabled: boolean;
  type: 'norm' | 'value';
  maxNorm: number;
  normType: number;
}

export interface SchedulerConfig {
  type: 'linear' | 'cosine' | 'polynomial' | 'step' | 'exponential';
  parameters: Record<string, number>;
  warmupSteps: number;
}

export interface WarmupConfig {
  enabled: boolean;
  steps: number;
  initialLR: number;
  strategy: 'linear' | 'constant';
}

export interface RegularizationConfig {
  dropout: number;
  weightDecay: number;
  labelSmoothing: number;
  dataAugmentation: AugmentationConfig;
  noiseInjection: NoiseConfig;
}

export interface AugmentationConfig {
  enabled: boolean;
  techniques: AugmentationTechnique[];
  probability: number;
  strength: number;
}

export interface AugmentationTechnique {
  name: string;
  parameters: Record<string, unknown>;
  probability: number;
}

export interface NoiseConfig {
  enabled: boolean;
  type: 'gaussian' | 'uniform' | 'dropout';
  magnitude: number;
  schedule: 'constant' | 'decay';
}

export interface TransferLearningConfig {
  sourceModel: string;
  freezeLayers: string[];
  fineTuneLayers: string[];
  transferStrategy: 'feature_extraction' | 'fine_tuning' | 'gradual_unfreezing';
  domainAdaptation: boolean;
}

export interface MultiTaskConfig {
  tasks: TaskConfig[];
  lossWeighting: LossWeightingStrategy;
  sharedLayers: string[];
  taskSpecificLayers: Record<string, string[]>;
}

export interface TaskConfig {
  name: string;
  type: 'classification' | 'regression' | 'generation';
  weight: number;
  metrics: string[];
  lossFunction: string;
}

export interface LossWeightingStrategy {
  type: 'fixed' | 'adaptive' | 'uncertainty' | 'gradient_normalization';
  parameters: Record<string, number>;
}

// Model evaluation and validation
export interface EvaluationSuite {
  id: string;
  name: string;
  description: string;
  evaluations: ModelEvaluation[];
  benchmarks: Benchmark[];
  customTests: CustomTest[];
  reportConfig: ReportConfiguration;
}

export interface ModelEvaluation {
  id: string;
  type: 'accuracy' | 'robustness' | 'fairness' | 'efficiency' | 'interpretability';
  configuration: EvaluationConfig;
  dataset: string;
  metrics: EvaluationMetric[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  results?: EvaluationResults;
}

export interface EvaluationConfig {
  sampling: SamplingStrategy;
  crossValidation: CrossValidationConfig;
  confidenceLevel: number;
  iterations: number;
  parallelism: number;
}

export interface SamplingStrategy {
  type: 'random' | 'stratified' | 'systematic' | 'bootstrap';
  size: number;
  seed: number;
  replacement: boolean;
}

export interface CrossValidationConfig {
  enabled: boolean;
  folds: number;
  strategy: 'k_fold' | 'stratified' | 'time_series' | 'group';
  shuffle: boolean;
}

export interface EvaluationMetric {
  name: string;
  type: 'scalar' | 'distribution' | 'matrix' | 'time_series';
  aggregation: 'mean' | 'median' | 'max' | 'min' | 'std';
  threshold?: number;
  direction: 'higher_better' | 'lower_better';
}

export interface EvaluationResults {
  overall: OverallResults;
  perClass?: PerClassResults;
  perFeature?: PerFeatureResults;
  confidenceIntervals: ConfidenceInterval[];
  statisticalTests: StatisticalTestResult[];
  visualizations: Visualization[];
}

export interface OverallResults {
  metrics: Record<string, number>;
  summary: string;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  passed: boolean;
}

export interface PerClassResults {
  classes: string[];
  metrics: Record<string, Record<string, number>>;
  confusionMatrix?: number[][];
}

export interface PerFeatureResults {
  features: string[];
  importance: Record<string, number>;
  correlations: Record<string, number>;
}

export interface ConfidenceInterval {
  metric: string;
  lower: number;
  upper: number;
  confidence: number;
}

export interface StatisticalTestResult {
  test: string;
  statistic: number;
  pValue: number;
  significant: boolean;
  interpretation: string;
}

export interface Visualization {
  type: 'chart' | 'plot' | 'heatmap' | 'distribution';
  title: string;
  data: unknown;
  configuration: Record<string, unknown>;
}

export interface Benchmark {
  id: string;
  name: string;
  description: string;
  dataset: string;
  baseline: number;
  leaderboard: LeaderboardEntry[];
  submissionConfig: SubmissionConfig;
}

export interface LeaderboardEntry {
  modelId: string;
  modelName: string;
  score: number;
  rank: number;
  submittedAt: Date;
  submittedBy: string;
}

export interface SubmissionConfig {
  maxSubmissions: number;
  evaluationPeriod: number;
  publicLeaderboard: boolean;
  allowedMetrics: string[];
}

export interface CustomTest {
  id: string;
  name: string;
  description: string;
  testFunction: string;
  parameters: Record<string, unknown>;
  expectedOutcome: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface ReportConfiguration {
  format: 'html' | 'pdf' | 'json' | 'markdown';
  sections: ReportSection[];
  branding: BrandingConfig;
  distribution: DistributionConfig;
}

export interface ReportSection {
  name: string;
  type: 'summary' | 'detailed' | 'visualization' | 'comparison';
  content: string[];
  order: number;
}

export interface BrandingConfig {
  logo?: string;
  colors: Record<string, string>;
  fonts: Record<string, string>;
  template: string;
}

export interface DistributionConfig {
  recipients: string[];
  schedule: string;
  format: string[];
  delivery: 'email' | 'dashboard' | 'api' | 'storage';
}

// Model lifecycle management
export interface ModelLifecycle {
  modelId: string;
  stages: LifecycleStage[];
  transitions: LifecycleTransition[];
  governance: GovernanceConfig;
  compliance: ComplianceConfig;
  approval: ApprovalWorkflow;
}

export interface LifecycleStage {
  name: string;
  description: string;
  requirements: StageRequirement[];
  duration: number;
  approvers: string[];
  automatable: boolean;
}

export interface StageRequirement {
  type: 'documentation' | 'testing' | 'review' | 'approval' | 'deployment';
  description: string;
  mandatory: boolean;
  criteria: string[];
}

export interface LifecycleTransition {
  from: string;
  to: string;
  conditions: TransitionCondition[];
  automated: boolean;
  approvalRequired: boolean;
}

export interface TransitionCondition {
  type: 'metric' | 'approval' | 'time' | 'dependency';
  condition: string;
  value: unknown;
  required: boolean;
}

export interface GovernanceConfig {
  policies: GovernancePolicy[];
  controls: GovernanceControl[];
  auditConfig: AuditConfiguration;
  riskAssessment: RiskAssessmentConfig;
}

export interface GovernancePolicy {
  id: string;
  name: string;
  description: string;
  scope: string[];
  rules: PolicyRule[];
  enforcement: 'advisory' | 'warning' | 'blocking';
}

export interface PolicyRule {
  condition: string;
  action: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
}

export interface GovernanceControl {
  id: string;
  type: 'preventive' | 'detective' | 'corrective';
  description: string;
  implementation: string;
  frequency: string;
  responsible: string[];
}

export interface AuditConfiguration {
  enabled: boolean;
  scope: string[];
  frequency: string;
  retention: number;
  compliance: string[];
}

export interface RiskAssessmentConfig {
  framework: 'coso' | 'iso31000' | 'nist' | 'custom';
  categories: RiskCategory[];
  assessmentFrequency: string;
  mitigationStrategies: MitigationStrategy[];
}

export interface RiskCategory {
  name: string;
  description: string;
  weight: number;
  factors: RiskFactor[];
}

export interface RiskFactor {
  name: string;
  impact: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  likelihood: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  mitigation: string[];
}

export interface MitigationStrategy {
  risk: string;
  strategy: 'avoid' | 'mitigate' | 'transfer' | 'accept';
  actions: string[];
  timeline: string;
  responsible: string;
}

export interface ComplianceConfig {
  standards: ComplianceStandard[];
  requirements: ComplianceRequirement[];
  assessments: ComplianceAssessment[];
  reporting: ComplianceReporting;
}

export interface ComplianceStandard {
  name: string;
  version: string;
  applicable: boolean;
  requirements: string[];
  certification: boolean;
}

export interface ComplianceRequirement {
  id: string;
  standard: string;
  description: string;
  mandatory: boolean;
  evidence: string[];
  status: 'compliant' | 'non_compliant' | 'not_assessed';
}

export interface ComplianceAssessment {
  id: string;
  standard: string;
  assessor: string;
  date: Date;
  findings: AssessmentFinding[];
  recommendations: string[];
  status: 'passed' | 'failed' | 'conditional';
}

export interface AssessmentFinding {
  requirement: string;
  status: 'compliant' | 'non_compliant' | 'partial';
  evidence: string[];
  gaps: string[];
  remediation: string;
}

export interface ComplianceReporting {
  frequency: string;
  recipients: string[];
  format: string[];
  dashboard: boolean;
  alerts: boolean;
}

export interface ApprovalWorkflow {
  stages: ApprovalStage[];
  escalation: EscalationConfig;
  notifications: WorkflowNotification[];
  parallel: boolean;
}

export interface ApprovalStage {
  name: string;
  approvers: string[];
  required: number;
  timeout: number;
  criteria: string[];
  delegation: boolean;
}

export interface EscalationConfig {
  enabled: boolean;
  timeout: number;
  escalateTo: string[];
  maxLevels: number;
}

export interface WorkflowNotification {
  trigger: 'stage_start' | 'approval_needed' | 'approved' | 'rejected' | 'timeout';
  recipients: string[];
  template: string;
  channels: string[];
}

// Integration and API types
export interface ModelRegistry {
  id: string;
  name: string;
  description: string;
  models: RegisteredModel[];
  versions: ModelVersion[];
  metadata: RegistryMetadata;
  access: AccessControl;
}

export interface RegisteredModel {
  id: string;
  name: string;
  description: string;
  owner: string;
  tags: string[];
  versions: string[];
  latestVersion: string;
  status: 'active' | 'deprecated' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export interface ModelVersion {
  id: string;
  modelId: string;
  version: string;
  description: string;
  artifacts: ModelArtifact[];
  metadata: VersionMetadata;
  status: 'active' | 'staging' | 'production' | 'deprecated';
  createdAt: Date;
  createdBy: string;
}

export interface ModelArtifact {
  id: string;
  name: string;
  type: 'model' | 'tokenizer' | 'config' | 'metrics' | 'docs';
  path: string;
  size: number;
  checksum: string;
  format: string;
  metadata: Record<string, unknown>;
}

export interface VersionMetadata {
  framework: string;
  algorithm: string;
  hyperparameters: Record<string, unknown>;
  training: TrainingMetadata;
  evaluation: EvaluationMetadata;
  deployment: DeploymentMetadata;
}

export interface TrainingMetadata {
  dataset: string;
  duration: number;
  resources: string;
  commit: string;
  reproducible: boolean;
}

export interface EvaluationMetadata {
  metrics: Record<string, number>;
  dataset: string;
  timestamp: Date;
  evaluator: string;
}

export interface DeploymentMetadata {
  targets: string[];
  requirements: string[];
  configuration: Record<string, unknown>;
  healthCheck: string;
}

export interface RegistryMetadata {
  created: Date;
  owner: string;
  permissions: string[];
  backup: BackupConfig;
  sync: SyncConfig;
}

export interface BackupConfig {
  enabled: boolean;
  frequency: string;
  retention: number;
  location: string;
  encryption: boolean;
}

export interface SyncConfig {
  enabled: boolean;
  targets: string[];
  frequency: string;
  conflictResolution: 'source' | 'target' | 'manual';
}

export interface AccessControl {
  public: boolean;
  users: UserAccess[];
  groups: GroupAccess[];
  apiKeys: ApiKeyAccess[];
}

export interface UserAccess {
  userId: string;
  permissions: string[];
  granted: Date;
  grantedBy: string;
  expires?: Date;
}

export interface GroupAccess {
  groupId: string;
  permissions: string[];
  granted: Date;
  grantedBy: string;
}

export interface ApiKeyAccess {
  keyId: string;
  permissions: string[];
  rateLimit: number;
  expires: Date;
}

// Utility types for type guards and validation
export const isTrainingJob = (obj: unknown): obj is TrainingJob => {
  return (
    typeof obj === 'object' && obj !== null && 'id' in obj && 'status' in obj && 'config' in obj
  );
};

export const isKnowledgeBase = (obj: unknown): obj is KnowledgeBase => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'documents' in obj &&
    'embeddings' in obj
  );
};

export const isModelDeployment = (obj: unknown): obj is ModelDeployment => {
  return (
    typeof obj === 'object' && obj !== null && 'id' in obj && 'modelId' in obj && 'status' in obj
  );
};
