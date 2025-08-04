// Proactive Monitoring & Intelligence Types
// import {
  RiskCategory,
  RiskImpact,
  TrendDirection,
  ConfidenceInterval,
} from './risk-intelligence.types';

// === Core Monitoring Types ===

export interface ActionRecommendation {
  id: string;
  type: 'immediate' | 'short_term' | 'long_term' | 'ongoing';
  priority: ActionPriority;
  title: string;
  description: string;
  rationale: string;
  expectedOutcome: string;
  effort: 'low' | 'medium' | 'high';
  timeline: string;
  resources: string[];
  dependencies: string[];
  successCriteria: string[];
}

export interface MonitoringTask {
  id: string;
  type: AnalysisType;
  targetId: string;
  targetType: 'risk' | 'control' | 'process' | 'compliance' | 'system';
  priority: TaskPriority;
  frequency: AnalysisFrequency;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  lastResult?: MonitoringResult;
  metadata: Record<string, unknown>;
}

export interface MonitoringResult {
  taskId: string;
  status: 'success' | 'warning' | 'error' | 'anomaly';
  findings: MonitoringFinding[];
  metrics: PerformanceMetrics;
  insights: ProactiveInsight[];
  recommendations: ActionRecommendation[];
  timestamp: Date;
  confidence: number;
}

export interface MonitoringFinding {
  id: string;
  type: 'anomaly' | 'degradation' | 'improvement' | 'threshold_breach' | 'pattern_change';
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  evidence: Evidence[];
  impact: FindingImpact;
  recommendations: string[];
  requiresAction: boolean;
}

export interface Evidence {
  type: 'metric' | 'trend' | 'comparison' | 'correlation';
  description: string;
  value: number | string;
  threshold?: number;
  context: string;
}

export interface FindingImpact {
  scope: 'isolated' | 'localized' | 'widespread' | 'systemic';
  urgency: 'none' | 'monitor' | 'investigate' | 'act' | 'immediate';
  businessImpact: 'negligible' | 'minor' | 'moderate' | 'significant' | 'severe';
  stakeholders: string[];
}

export type AnalysisType =
  | 'risk_analysis'
  | 'control_testing'
  | 'compliance_check'
  | 'performance_review'
  | 'trend_analysis'
  | 'pattern_detection'
  | 'health_check'
  | 'workflow_analysis'
  | 'external_intelligence';

export type AnalysisFrequency =
  | 'real_time'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'on_demand';

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

// === Scheduled Analysis ===

export interface ScheduledAnalysis {
  id: string;
  name: string;
  description: string;
  analysisType: AnalysisType;
  targetIds: string[];
  frequency: AnalysisFrequency;
  schedule: AnalysisSchedule;
  enabled: boolean;
  lastRun?: Date;
  nextRun: Date;
  config: AnalysisConfig;
  notifications: NotificationConfig;
  history: AnalysisHistory[];
}

export interface AnalysisSchedule {
  frequency: AnalysisFrequency;
  timezone: string;
  specificTime?: string; // HH:MM format
  dayOfWeek?: number; // 0-6 (Sunday-Saturday)
  dayOfMonth?: number; // 1-31
  startDate: Date;
  endDate?: Date;
  blackoutPeriods: BlackoutPeriod[];
}

export interface BlackoutPeriod {
  name: string;
  startDate: Date;
  endDate: Date;
  reason: string;
}

export interface AnalysisConfig {
  thresholds: AnalysisThresholds;
  parameters: Record<string, unknown>;
  scope: AnalysisScope;
  outputFormat: 'summary' | 'detailed' | 'raw';
  retentionDays: number;
}

export interface AnalysisThresholds {
  warning: number;
  critical: number;
  anomalyDetection: boolean;
  customThresholds: CustomThreshold[];
}

export interface CustomThreshold {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'between';
  value: number | number[];
  label: string;
}

export interface AnalysisScope {
  includeHistorical: boolean;
  timeWindow: TimeWindow;
  dependencies: boolean;
  relatedEntities: boolean;
  externalFactors: boolean;
}

export interface TimeWindow {
  duration: number;
  unit: 'hours' | 'days' | 'weeks' | 'months' | 'years';
  offset?: number; // Offset from current time
}

export interface AnalysisHistory {
  id: string;
  executedAt: Date;
  duration: number; // milliseconds
  status: 'success' | 'failure' | 'partial';
  results: MonitoringResult;
  notes?: string;
}

// === Proactive Insights ===

export interface ProactiveInsight {
  id: string;
  type: InsightType;
  category: RiskCategory;
  priority: InsightPriority;
  title: string;
  description: string;
  details: InsightDetails;
  actionItems: ActionItem[];
  deadline?: Date;
  assignedTo?: string;
  status: InsightStatus;
  source: InsightSource;
  confidence: number;
  impact: InsightImpact;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  aiInsight?: string;
  metadata: Record<string, unknown>;
}

export type InsightType =
  | 'risk_increase'
  | 'control_degradation'
  | 'compliance_gap'
  | 'performance_decline'
  | 'emerging_threat'
  | 'optimization_opportunity'
  | 'process_improvement'
  | 'resource_optimization'
  | 'workflow_bottleneck'
  | 'anomaly_detection'
  | 'trend_deviation'
  | 'threshold_breach'
  | 'pattern_change'
  | 'external_intelligence';

export type InsightPriority = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type InsightStatus = 'new' | 'acknowledged' | 'in_progress' | 'resolved' | 'dismissed';

export interface InsightDetails {
  context: string;
  evidence: Evidence[];
  trend: TrendAnalysis;
  comparison: ComparisonData;
  prediction: PredictionData;
  relatedInsights: string[];
}

export interface TrendAnalysis {
  direction: TrendDirection;
  magnitude: number;
  duration: string;
  acceleration: number;
  stability: number;
  seasonality?: SeasonalPattern;
}

export interface SeasonalPattern {
  detected: boolean;
  period: string;
  amplitude: number;
  confidence: number;
}

export interface ComparisonData {
  baseline: number;
  current: number;
  change: number;
  percentChange: number;
  industry?: number;
  peer?: number;
  historical?: number;
}

export interface PredictionData {
  forecast: number[];
  confidenceInterval: ConfidenceInterval;
  timeframe: string;
  assumptions: string[];
  scenarios: PredictionScenario[];
}

export interface PredictionScenario {
  name: string;
  probability: number;
  outcome: number;
  description: string;
}

export interface InsightSource {
  system: string;
  component: string;
  dataSource: string;
  algorithm: string;
  version: string;
}

export interface InsightImpact {
  financial: number;
  operational: string;
  compliance: string;
  reputation: string;
  strategic: string;
}

export interface ActionItem {
  id: string;
  type: ActionType;
  title: string;
  description: string;
  priority: ActionPriority;
  assignedTo?: string;
  dueDate?: Date;
  estimatedEffort: string;
  dependencies: string[];
  resources: string[];
  status: ActionStatus;
  progress: number; // 0-100
  notes?: string;
}

export type ActionType =
  | 'investigation'
  | 'mitigation'
  | 'monitoring'
  | 'process_change'
  | 'control_update'
  | 'training'
  | 'communication'
  | 'documentation'
  | 'automation'
  | 'optimization';

export type ActionPriority = 'immediate' | 'urgent' | 'high' | 'medium' | 'low';

export type ActionStatus =
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'blocked';

// === Smart Notifications ===

export interface SmartNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: InsightPriority;
  userId: string;
  timestamp: Date;
  read: boolean;
  aiInsight: string;
  contextualData: ContextualData;
  intelligentPriority: IntelligentPriority;
  dismissible: boolean;
  autoExpire: boolean;
  expiresAt?: Date;
  aggregatedWith?: string[]; // IDs of related notifications
  suppressionRules: SuppressionRule[];
  deliveryChannels: DeliveryChannel[];
  personalizedContent: PersonalizedContent;
  metadata?: Record<string, unknown>;
}

export interface ContextualData {
  userRole: string;
  userPreferences: UserPreferences;
  workingHours: WorkingHours;
  currentActivity: string;
  relevantEntities: string[];
  historicalContext: HistoricalContext;
}

export interface UserPreferences {
  notificationFrequency: 'immediate' | 'batched' | 'digest';
  priorityThreshold: InsightPriority;
  categories: RiskCategory[];
  channels: NotificationChannel[];
  quietHours: QuietHours;
  language: string;
}

export interface WorkingHours {
  timezone: string;
  schedule: DailySchedule[];
  holidays: Date[];
  vacations: VacationPeriod[];
}

export interface DailySchedule {
  dayOfWeek: number; // 0-6
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  available: boolean;
}

export interface VacationPeriod {
  startDate: Date;
  endDate: Date;
  type: 'vacation' | 'leave' | 'conference' | 'training';
}

export interface QuietHours {
  enabled: boolean;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  timezone: string;
  exceptions: string[]; // Critical notification types
}

export interface HistoricalContext {
  previousInteractions: Interaction[];
  responsePatterns: ResponsePattern[];
  engagementScore: number;
  effectivenessMetrics: EffectivenessMetric[];
}

export interface Interaction {
  notificationId: string;
  timestamp: Date;
  action: 'viewed' | 'dismissed' | 'acted' | 'escalated' | 'ignored';
  timeToAction?: number; // milliseconds
  satisfactionScore?: number; // 1-5
}

export interface ResponsePattern {
  type: string;
  averageResponseTime: number;
  preferredChannel: NotificationChannel;
  effectiveness: number;
}

export interface EffectivenessMetric {
  metric: string;
  value: number;
  trend: TrendDirection;
  benchmark: number;
}

export interface IntelligentPriority {
  calculated: InsightPriority;
  factors: PriorityFactor[];
  urgencyScore: number; // 0-100
  relevanceScore: number; // 0-100
  impactScore: number; // 0-100
  contextScore: number; // 0-100
  personalizedScore: number; // 0-100
}

export interface PriorityFactor {
  factor: string;
  weight: number;
  contribution: number;
  description: string;
}

export interface SuppressionRule {
  id: string;
  condition: string;
  duration: number; // minutes
  reason: string;
  enabled: boolean;
}

export interface DeliveryChannel {
  channel: NotificationChannel;
  enabled: boolean;
  priority: InsightPriority;
  delay: number; // seconds
  retryAttempts: number;
  escalation?: EscalationRule;
}

export type NotificationChannel =
  | 'in_app'
  | 'email'
  | 'sms'
  | 'push'
  | 'slack'
  | 'teams'
  | 'webhook'
  | 'dashboard';

export interface EscalationRule {
  enabled: boolean;
  timeoutMinutes: number;
  escalateTo: string;
  escalationChannel: NotificationChannel;
  message: string;
}

export interface PersonalizedContent {
  title: string;
  summary: string;
  details: string;
  recommendations: string[];
  tone: 'formal' | 'professional' | 'casual';
  complexity: 'simple' | 'detailed' | 'technical';
}

// === Notification Configuration ===

export interface NotificationConfig {
  enabled: boolean;
  channels: NotificationChannelConfig[];
  batching: BatchingConfig;
  filtering: FilteringConfig;
  escalation: EscalationConfig;
}

export interface NotificationChannelConfig {
  channel: NotificationChannel;
  enabled: boolean;
  thresholds: NotificationThreshold[];
  template: string;
  frequency: 'immediate' | 'batched' | 'digest';
}

export interface NotificationThreshold {
  priority: InsightPriority;
  enabled: boolean;
  delay: number; // minutes
}

export interface BatchingConfig {
  enabled: boolean;
  windowMinutes: number;
  maxBatchSize: number;
  priorities: InsightPriority[];
}

export interface FilteringConfig {
  duplicateWindow: number; // minutes
  relevanceThreshold: number; // 0-100
  categories: RiskCategory[];
  suppressionRules: string[];
}

export interface EscalationConfig {
  enabled: boolean;
  levels: EscalationLevel[];
}

export interface EscalationLevel {
  level: number;
  timeoutMinutes: number;
  recipients: string[];
  channels: NotificationChannel[];
  conditions: string[];
}

// === Health Check Types ===

export interface HealthCheckReport {
  id: string;
  type: HealthCheckType;
  targetId: string;
  overall: HealthStatus;
  dimensions: HealthDimension[];
  findings: HealthFinding[];
  recommendations: HealthRecommendation[];
  metrics: HealthMetric[];
  history: HealthHistory[];
  executedAt: Date;
  nextCheck: Date;
}

export type HealthCheckType =
  | 'risk_register'
  | 'control_framework'
  | 'workflow_efficiency'
  | 'compliance_posture'
  | 'data_quality'
  | 'system_performance'
  | 'user_experience';

export type HealthStatus = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

export interface HealthDimension {
  name: string;
  score: number; // 0-100
  status: HealthStatus;
  weight: number; // 0-1
  description: string;
  metrics: HealthMetric[];
  trends: HealthTrend[];
}

export interface HealthFinding {
  id: string;
  dimension: string;
  type: 'strength' | 'weakness' | 'opportunity' | 'threat';
  severity: 'info' | 'warning' | 'error' | 'critical';
  description: string;
  impact: string;
  evidence: string[];
  recommendations: string[];
}

export interface HealthRecommendation {
  id: string;
  type: 'immediate' | 'short_term' | 'long_term' | 'ongoing';
  priority: ActionPriority;
  title: string;
  description: string;
  benefits: string[];
  effort: 'low' | 'medium' | 'high';
  timeline: string;
  dependencies: string[];
  success_criteria: string[];
}

export interface HealthMetric {
  name: string;
  value: number;
  unit: string;
  target?: number;
  threshold: HealthThreshold;
  trend: HealthTrend;
  lastUpdated: Date;
}

export interface HealthThreshold {
  excellent: number;
  good: number;
  fair: number;
  poor: number;
}

export interface HealthTrend {
  direction: TrendDirection;
  magnitude: number;
  period: string;
  significance: number; // 0-100
}

export interface HealthHistory {
  date: Date;
  score: number;
  status: HealthStatus;
  keyChanges: string[];
}

// === Workflow Optimization ===

export interface ProductivityAnalysis {
  userId: string;
  timeRange: TimeWindow;
  overall: ProductivityScore;
  activities: ActivityAnalysis[];
  patterns: ProductivityPattern[];
  bottlenecks: Bottleneck[];
  opportunities: OptimizationOpportunity[];
  recommendations: ProductivityRecommendation[];
  benchmarks: ProductivityBenchmark[];
}

export interface ProductivityScore {
  overall: number; // 0-100
  efficiency: number;
  effectiveness: number;
  quality: number;
  engagement: number;
  collaboration: number;
}

export interface ActivityAnalysis {
  activity: string;
  timeSpent: number; // minutes
  percentage: number;
  efficiency: number; // 0-100
  value: 'high' | 'medium' | 'low';
  trend: TrendDirection;
  optimization: OptimizationPotential;
}

export interface OptimizationPotential {
  score: number; // 0-100
  methods: OptimizationMethod[];
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
}

export interface OptimizationMethod {
  type: 'automation' | 'delegation' | 'elimination' | 'streamlining' | 'tool_upgrade';
  description: string;
  effort: number; // hours
  benefit: string;
  feasibility: number; // 0-100
}

export interface ProductivityPattern {
  type: 'temporal' | 'task' | 'collaboration' | 'tool_usage';
  pattern: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  recommendations: string[];
}

export interface Bottleneck {
  id: string;
  type: 'process' | 'tool' | 'resource' | 'dependency' | 'knowledge';
  description: string;
  impact: BottleneckImpact;
  frequency: number; // occurrences per week
  duration: number; // average minutes lost
  affectedUsers: string[];
  resolution: BottleneckResolution[];
}

export interface BottleneckImpact {
  timeDelay: number; // minutes
  qualityImpact: number; // 0-100
  frustrationLevel: number; // 0-100
  cascadingEffects: string[];
}

export interface BottleneckResolution {
  approach: string;
  effort: 'low' | 'medium' | 'high';
  timeline: string;
  cost: number;
  effectiveness: number; // 0-100
  feasibility: number; // 0-100
}

export interface OptimizationOpportunity {
  id: string;
  type: 'process' | 'automation' | 'training' | 'tool' | 'workflow';
  title: string;
  description: string;
  benefit: OptimizationBenefit;
  implementation: ImplementationPlan;
  priority: number; // 1-100
  roi: number;
}

export interface OptimizationBenefit {
  timeSavings: number; // hours per week
  qualityImprovement: number; // 0-100
  satisfactionIncrease: number; // 0-100
  costReduction: number;
  riskReduction: number; // 0-100
}

export interface ImplementationPlan {
  phases: ImplementationPhase[];
  timeline: string;
  resources: string[];
  risks: string[];
  success_metrics: string[];
}

export interface ImplementationPhase {
  name: string;
  duration: string;
  activities: string[];
  deliverables: string[];
  dependencies: string[];
}

export interface ProductivityRecommendation {
  id: string;
  type: 'immediate' | 'short_term' | 'long_term';
  category: 'efficiency' | 'effectiveness' | 'automation' | 'training' | 'process';
  title: string;
  description: string;
  benefits: string[];
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  priority: number; // 1-100
  implementation: string[];
}

export interface ProductivityBenchmark {
  metric: string;
  current: number;
  industry: number;
  best_practice: number;
  peer: number;
  gap: number;
  percentile: number;
}

// === External Intelligence ===

export interface ExternalIntelligence {
  type: IntelligenceType;
  source: IntelligenceSource;
  data: IntelligenceData;
  relevance: RelevanceAssessment;
  impact: ImpactAssessment;
  actionability: ActionabilityAssessment;
  timestamp: Date;
  expiresAt?: Date;
}

export type IntelligenceType =
  | 'industry_risk_trend'
  | 'regulatory_update'
  | 'compliance_alert'
  | 'threat_intelligence'
  | 'market_intelligence'
  | 'technology_trend'
  | 'best_practice'
  | 'incident_report'
  | 'vulnerability_alert';

export interface IntelligenceSource {
  provider: string;
  reliability: number; // 0-100
  timeliness: number; // 0-100
  accuracy: number; // 0-100
  coverage: string[];
  lastUpdate: Date;
}

export interface IntelligenceData {
  title: string;
  summary: string;
  details: string;
  tags: string[];
  categories: string[];
  geography: string[];
  industries: string[];
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-100
  sources: string[];
  attachments: Attachment[];
}

export interface Attachment {
  name: string;
  type: string;
  url: string;
  size: number;
  hash: string;
}

export interface RelevanceAssessment {
  score: number; // 0-100
  factors: RelevanceFactor[];
  applicability: string[];
  context: string;
}

export interface RelevanceFactor {
  factor: string;
  weight: number; // 0-1
  score: number; // 0-100
  reasoning: string;
}

export interface ImpactAssessment {
  potential: RiskImpact;
  timeframe: string;
  scope: 'local' | 'regional' | 'national' | 'global';
  affected_areas: string[];
  mitigation_urgency: 'none' | 'monitor' | 'plan' | 'act' | 'immediate';
}

export interface ActionabilityAssessment {
  score: number; // 0-100
  available_actions: AvailableAction[];
  barriers: string[];
  enablers: string[];
  timeline: string;
}

export interface AvailableAction {
  action: string;
  type: ActionType;
  effort: 'low' | 'medium' | 'high';
  effectiveness: number; // 0-100
  timeline: string;
  resources: string[];
}

// === Background Processing ===

export interface BackgroundTask {
  id: string;
  type: TaskType;
  priority: TaskPriority;
  payload: TaskPayload;
  status: TaskStatus;
  progress: TaskProgress;
  resource_requirements: ResourceRequirements;
  dependencies: string[];
  createdAt: Date;
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  retryCount: number;
  maxRetries: number;
  timeout: number; // milliseconds
  metadata: Record<string, unknown>;
}

export type TaskType =
  | 'monitoring'
  | 'analysis'
  | 'notification'
  | 'health_check'
  | 'optimization'
  | 'data_sync'
  | 'report_generation'
  | 'intelligence_gathering'
  | 'trend_analysis'
  | 'anomaly_detection';

export type TaskStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timeout'
  | 'retrying';

export interface TaskPayload {
  operation: string;
  parameters: Record<string, unknown>;
  input_data: unknown;
  configuration: TaskConfiguration;
}

export interface TaskConfiguration {
  timeout: number;
  memory_limit: number;
  cpu_limit: number;
  concurrency: number;
  cache_enabled: boolean;
  retry_strategy: RetryStrategy;
}

export interface RetryStrategy {
  max_attempts: number;
  backoff_type: 'linear' | 'exponential' | 'fixed';
  initial_delay: number; // milliseconds
  max_delay: number; // milliseconds
  jitter: boolean;
}

export interface TaskProgress {
  percentage: number; // 0-100
  current_step: string;
  total_steps: number;
  completed_steps: number;
  estimated_remaining: number; // milliseconds
  throughput: number; // items per second
  errors: TaskError[];
}

export interface TaskError {
  timestamp: Date;
  message: string;
  code: string;
  stack?: string;
  recoverable: boolean;
}

export interface ResourceRequirements {
  cpu: number; // percentage
  memory: number; // MB
  disk: number; // MB
  network: number; // MB
  concurrency: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface TaskResult {
  taskId: string;
  status: TaskStatus;
  output: unknown;
  metrics: TaskMetrics;
  errors: TaskError[];
  timestamp: Date;
}

export interface TaskMetrics {
  execution_time: number; // milliseconds
  cpu_usage: number; // percentage
  memory_usage: number; // MB
  disk_usage: number; // MB
  network_usage: number; // MB
  items_processed: number;
  throughput: number; // items per second
  cache_hits: number;
  cache_misses: number;
}

// === Performance & Resource Management ===

export interface PerformanceMetrics {
  system: SystemMetrics;
  application: ApplicationMetrics;
  user_experience: UserExperienceMetrics;
  resource_utilization: ResourceUtilization;
  thresholds: PerformanceThreshold[];
  alerts: PerformanceAlert[];
}

export interface SystemMetrics {
  cpu_usage: number; // percentage
  memory_usage: number; // percentage
  disk_usage: number; // percentage
  network_usage: number; // Mbps
  active_connections: number;
  load_average: number[];
  uptime: number; // seconds
}

export interface ApplicationMetrics {
  response_time: number; // milliseconds
  throughput: number; // requests per second
  error_rate: number; // percentage
  availability: number; // percentage
  active_users: number;
  active_sessions: number;
  cache_hit_rate: number; // percentage
}

export interface UserExperienceMetrics {
  page_load_time: number; // milliseconds
  time_to_interactive: number; // milliseconds
  bounce_rate: number; // percentage
  satisfaction_score: number; // 1-5
  task_completion_rate: number; // percentage
  user_engagement: number; // 0-100
}

export interface ResourceUtilization {
  workers: WorkerUtilization[];
  queues: QueueUtilization[];
  cache: CacheUtilization;
  database: DatabaseUtilization;
  storage: StorageUtilization;
}

export interface WorkerUtilization {
  worker_id: string;
  cpu_usage: number; // percentage
  memory_usage: number; // MB
  active_tasks: number;
  completed_tasks: number;
  error_rate: number; // percentage
  utilization: number; // percentage
}

export interface QueueUtilization {
  queue_name: string;
  size: number;
  processing_rate: number; // items per second
  wait_time: number; // seconds
  backlog: number;
  priority_distribution: Record<string, number>;
}

export interface CacheUtilization {
  hit_rate: number; // percentage
  miss_rate: number; // percentage
  eviction_rate: number; // items per second
  memory_usage: number; // MB
  key_count: number;
  expiration_rate: number; // items per second
}

export interface DatabaseUtilization {
  connection_count: number;
  query_rate: number; // queries per second
  slow_query_count: number;
  lock_wait_time: number; // milliseconds
  buffer_hit_ratio: number; // percentage
  disk_reads: number; // reads per second
}

export interface StorageUtilization {
  read_iops: number;
  write_iops: number;
  read_bandwidth: number; // MB/s
  write_bandwidth: number; // MB/s
  disk_usage: number; // percentage
  available_space: number; // GB
}

export interface PerformanceThreshold {
  metric: string;
  warning: number;
  critical: number;
  unit: string;
  trend_analysis: boolean;
}

export interface PerformanceAlert {
  id: string;
  type: string;
  severity: 'warning' | 'critical';
  metric: string;
  current_value: number;
  threshold: number;
  description: string;
  recommendations: string[];
  timestamp: Date;
  resolved: boolean;
}

// === User Context ===

export interface UserContext {
  userId: string;
  organizationId: string;
  role: string;
  permissions: string[];
  preferences: UserPreferences;
  currentSession: SessionContext;
  workContext: WorkContext;
  historicalBehavior: BehaviorPattern[];
}

export interface SessionContext {
  sessionId: string;
  startTime: Date;
  lastActivity: Date;
  currentPage: string;
  currentTask?: string;
  deviceInfo: DeviceInfo;
  locationInfo: LocationInfo;
}

export interface DeviceInfo {
  type: 'desktop' | 'tablet' | 'mobile';
  os: string;
  browser: string;
  screen_resolution: string;
  battery_level?: number;
  network_type: string;
}

export interface LocationInfo {
  timezone: string;
  country: string;
  region: string;
  city: string;
  ip_address: string;
}

export interface WorkContext {
  current_project?: string;
  active_risks: string[];
  recent_activities: RecentActivity[];
  pending_tasks: PendingTask[];
  upcoming_deadlines: Deadline[];
  collaboration_sessions: CollaborationSession[];
}

export interface RecentActivity {
  type: string;
  entityId: string;
  entityType: string;
  action: string;
  timestamp: Date;
  duration?: number; // milliseconds
}

export interface PendingTask {
  id: string;
  title: string;
  type: string;
  priority: ActionPriority;
  dueDate?: Date;
  progress: number; // 0-100
}

export interface Deadline {
  id: string;
  title: string;
  type: string;
  date: Date;
  urgency: number; // days until due
  importance: 'low' | 'medium' | 'high' | 'critical';
}

export interface CollaborationSession {
  id: string;
  type: 'review' | 'assessment' | 'discussion' | 'approval';
  participants: string[];
  topic: string;
  status: 'active' | 'scheduled' | 'completed';
  startTime?: Date;
  endTime?: Date;
}

export interface BehaviorPattern {
  pattern: string;
  frequency: number;
  context: string[];
  effectiveness: number; // 0-100
  last_observed: Date;
}

// === Dashboard Context ===

export interface DashboardContext {
  organizationId: string;
  userRole: string;
  permissions: string[];
  currentView: string;
  activeFilters: Record<string, unknown>;
  timeRange: TimeWindow;
  preferences: Record<string, unknown>;
}
