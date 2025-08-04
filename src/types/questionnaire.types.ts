// === Questionnaire System Types ===

export interface Questionnaire {
  id: string
  title: string;
  description: string;
  category: QuestionnaireCategory;
  type: QuestionnaireType;
  version: string;
  status: QuestionnaireStatus;

  // Configuration
  config: QuestionnaireConfig
  template?: QuestionnaireTemplate;

  // Content
  sections: QuestionnaireSection[]
  scoring: ScoringConfig;

  // Metadata
  createdBy: string
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  archivedAt?: Date;

  // Analytics
  analytics: QuestionnaireAnalytics

  // AI Features
  aiSettings: AISettings

  // Collaboration
  workflow?: WorkflowConfig
  permissions: QuestionnairePermissions;
}

export type QuestionnaireCategory =
  | 'risk_assessment'
  | 'compliance_audit'
  | 'control_testing'
  | 'security_review'
  | 'vendor_assessment'
  | 'business_continuity'
  | 'data_privacy'
  | 'operational_risk'
  | 'financial_risk'
  | 'strategic_assessment'
  | 'custom';

export type QuestionnaireType = 'static' | 'dynamic' | 'adaptive' | 'branching' | 'ai_generated';

export type QuestionnaireStatus =
  | 'draft'
  | 'review'
  | 'approved'
  | 'published'
  | 'active'
  | 'deprecated'
  | 'archived';

export interface QuestionnaireConfig {
  allowPartialSave: boolean;
  requiresApproval: boolean;
  timeLimit?: number; // minutes
  maxAttempts?: number;
  randomizeQuestions: boolean;
  showProgress: boolean;
  allowSkipping: boolean;
  requiredCompletion: number; // percentage
  notificationSettings: NotificationSettings;
  accessControl: AccessControl;
}

export interface QuestionnaireTemplate {
  id: string;
  name: string;
  industry: string[];
  framework: string[];
  baseQuestions: TemplateQuestion[];
  variables: TemplateVariable[];
  conditionalLogic: ConditionalRule[];
}

export interface QuestionnaireSection {
  id: string;
  title: string;
  description?: string;
  order: number;
  required: boolean;
  conditions?: Condition[];
  questions: Question[];
  subsections?: QuestionnaireSection[];
}

export interface Question {
  id: string;
  sectionId: string;
  type: QuestionType;
  text: string;
  description?: string;
  required: boolean;
  order: number;

  // Question Configuration
  config: QuestionConfig

  // Validation
  validation?: ValidationRule[]

  // Conditional Logic
  conditions?: Condition[]
  triggers?: Trigger[];

  // AI Features
  aiGenerated: boolean
  aiContext?: AIQuestionContext;

  // Metadata
  tags: string[]
  category?: string;
  riskIndicators?: RiskIndicator[];
}

export type QuestionType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'phone'
  | 'url'
  | 'date'
  | 'datetime'
  | 'single_choice'
  | 'multiple_choice'
  | 'dropdown'
  | 'scale'
  | 'rating'
  | 'boolean'
  | 'file_upload'
  | 'signature'
  | 'matrix'
  | 'ranking'
  | 'slider'
  | 'location'
  | 'ai_generated';

export interface QuestionConfig {
  options?: QuestionOption[];
  scale?: ScaleConfig;
  matrix?: MatrixConfig;
  fileConfig?: FileConfig;
  placeholder?: string;
  helpText?: string;
  defaultValue?: unknown;
  dependencies?: string[]; // question IDs
}

export interface QuestionOption {
  id: string;
  text: string;
  value: string | number;
  order: number;
  riskWeight?: number;
  followUpQuestions?: string[];
  conditions?: Condition[];
}

export interface ScaleConfig {
  min: number;
  max: number;
  step: number;
  labels?: { [key: number]: string }
  showLabels: boolean;
}

export interface MatrixConfig {
  rows: MatrixItem[];
  columns: MatrixItem[];
  multiplePerRow: boolean;
}

export interface MatrixItem {
  id: string;
  text: string;
  value: string;
}

export interface FileConfig {
  maxFiles: number;
  maxSize: number; // bytes
  allowedTypes: string[];
  required: boolean;
}

export interface ValidationRule {
  type: ValidationType;
  value?: unknown;
  message: string;
  condition?: Condition;
}

export type ValidationType =
  | 'required'
  | 'min_length'
  | 'max_length'
  | 'pattern'
  | 'email'
  | 'url'
  | 'number'
  | 'min_value'
  | 'max_value'
  | 'custom';

export interface Condition {
  questionId: string;
  operator: ConditionOperator;
  value: unknown;
  logic?: 'AND' | 'OR';
  nested?: Condition[];
}

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'greater_equal'
  | 'less_equal'
  | 'is_empty'
  | 'not_empty'
  | 'in'
  | 'not_in';

export interface Trigger {
  event: TriggerEvent;
  conditions: Condition[];
  actions: TriggerAction[];
}

export type TriggerEvent =
  | 'on_answer'
  | 'on_section_complete'
  | 'on_questionnaire_start'
  | 'on_questionnaire_complete'
  | 'on_save'
  | 'on_skip';

export interface TriggerAction {
  type: ActionType;
  target: string;
  value?: unknown;
  delay?: number;
}

export type ActionType =
  | 'show_question'
  | 'hide_question'
  | 'show_section'
  | 'hide_section'
  | 'set_value'
  | 'clear_value'
  | 'calculate_score'
  | 'send_notification'
  | 'create_risk'
  | 'update_risk'
  | 'ai_suggest';

// === AI Features ===

export interface AISettings {
  enabled: boolean
  questionGeneration: AIQuestionGeneration;
  responseAnalysis: AIResponseAnalysis;
  riskAssessment: AIRiskAssessment;
  followUpSuggestions: AIFollowUpSuggestions;
}

export interface AIQuestionGeneration {
  enabled: boolean;
  contextSources: ContextSource[];
  generationRules: GenerationRule[];
  reviewRequired: boolean;
  maxQuestions: number;
}

export interface AIQuestionContext {
  organizationProfile: OrganizationProfile;
  industry: string;
  riskFactors: string[];
  complianceFrameworks: string[];
  previousResponses: ResponseContext[];
}

export interface OrganizationProfile {
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  industry: string;
  geography: string[];
  riskProfile: 'low' | 'medium' | 'high' | 'critical';
  maturityLevel: 'basic' | 'developing' | 'defined' | 'managed' | 'optimizing';
}

export interface ResponseContext {
  questionId: string;
  response: unknown;
  riskIndicators: RiskIndicator[];
  followUps: string[];
}

export interface RiskIndicator {
  type: 'high_risk' | 'medium_risk' | 'low_risk' | 'compliance_gap' | 'control_weakness';
  severity: number; // 1-10
  confidence: number; // 0-1
  description: string;
  suggestedActions: string[];
}

export interface AIResponseAnalysis {
  enabled: boolean;
  patterns: AnalysisPattern[];
  riskScoring: boolean;
  anomalyDetection: boolean;
  sentimentAnalysis: boolean;
}

export interface AnalysisPattern {
  id: string;
  name: string;
  description: string;
  pattern: string; // regex or rule
  riskWeight: number;
  followUpQuestions: string[];
}

export interface AIRiskAssessment {
  enabled: boolean;
  scoringModel: ScoringModel;
  riskCategories: RiskCategory[];
  thresholds: RiskThreshold[];
  autoPopulate: boolean;
}

export interface ScoringModel {
  type: 'weighted' | 'matrix' | 'ml_model' | 'rule_based';
  weights: { [questionId: string]: number }
  rules: ScoringRule[];
  mlModelId?: string;
}

export interface ScoringRule {
  id: string;
  condition: Condition;
  score: number;
  multiplier?: number;
  category?: string;
}

export interface RiskCategory {
  id: string;
  name: string;
  weight: number;
  questions: string[]; // question IDs
  thresholds: RiskThreshold[];
}

export interface RiskThreshold {
  level: 'low' | 'medium' | 'high' | 'critical';
  minScore: number;
  maxScore: number;
  color: string;
  actions: string[];
}

export interface AIFollowUpSuggestions {
  enabled: boolean;
  triggerConditions: Condition[];
  suggestionRules: SuggestionRule[];
  maxSuggestions: number;
}

export interface SuggestionRule {
  id: string;
  trigger: Condition;
  questions: SuggestedQuestion[];
  priority: number;
}

export interface SuggestedQuestion {
  text: string;
  type: QuestionType;
  rationale: string;
  riskWeight: number;
  config?: Partial<QuestionConfig>;
}

// === Scoring System ===

export interface ScoringConfig {
  type: 'simple' | 'weighted' | 'matrix' | 'ai_enhanced'
  maxScore: number;
  categories: ScoreCategory[];
  aggregation: AggregationMethod;
  normalization: boolean;
}

export interface ScoreCategory {
  id: string;
  name: string;
  weight: number;
  questions: string[];
  formula?: string;
}

export type AggregationMethod = 'sum' | 'average' | 'weighted_average' | 'max' | 'min' | 'custom';

// === Response Management ===

export interface QuestionnaireResponse {
  id: string
  questionnaireId: string;
  version: string;
  respondent: RespondentInfo;

  // Response Data
  responses: Response[]
  metadata: ResponseMetadata;

  // Status
  status: ResponseStatus
  progress: ResponseProgress;

  // Scores and Analysis
  scores: ScoreResult[]
  analysis: ResponseAnalysis;
  riskAssessment?: RiskAssessmentResult;

  // Timeline
  startedAt: Date
  lastSavedAt: Date;
  submittedAt?: Date;
  reviewedAt?: Date;
  approvedAt?: Date;
}

export interface RespondentInfo {
  userId?: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  organization?: string;
  anonymous: boolean;
}

export interface Response {
  questionId: string;
  sectionId: string;
  value: unknown;
  textValue?: string;
  files?: ResponseFile[];
  metadata: ResponseMetadata;
  aiAnalysis?: AIAnalysisResult;
}

export interface ResponseFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: Date;
}

export interface ResponseMetadata {
  timestamp: Date;
  source: 'manual' | 'auto_save' | 'ai_suggestion' | 'import';
  device: string;
  ipAddress?: string;
  userAgent?: string;
  timeSpent?: number; // seconds
  attempts?: number;
  flags?: ResponseFlag[];
}

export interface ResponseFlag {
  type: 'incomplete' | 'suspicious' | 'high_risk' | 'requires_review' | 'ai_flagged';
  reason: string;
  confidence: number;
  details?: Record<string, unknown>;
}

export type ResponseStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'archived';

export interface ResponseProgress {
  percentage: number;
  sectionsCompleted: number;
  totalSections: number;
  questionsAnswered: number;
  totalQuestions: number;
  requiredAnswered: number;
  totalRequired: number;
  estimatedTimeRemaining?: number; // minutes
}

export interface ScoreResult {
  categoryId: string;
  categoryName: string;
  score: number;
  maxScore: number;
  percentage: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  breakdown: ScoreBreakdown[];
}

export interface ScoreBreakdown {
  questionId: string;
  questionText: string;
  score: number;
  weight: number;
  contribution: number;
}

export interface ResponseAnalysis {
  overall: OverallAnalysis;
  categories: CategoryAnalysis[];
  patterns: PatternAnalysis[];
  recommendations: Recommendation[];
  flags: AnalysisFlag[];
}

export interface OverallAnalysis {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  completeness: number;
  consistency: number;
  timeSpent: number;
  summary: string;
}

export interface CategoryAnalysis {
  categoryId: string;
  categoryName: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  findings: Finding[];
  recommendations: string[];
}

export interface Finding {
  type: 'strength' | 'weakness' | 'gap' | 'risk' | 'opportunity';
  description: string;
  evidence: string[];
  impact: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

export interface PatternAnalysis {
  pattern: string;
  frequency: number;
  riskImplication: string;
  confidence: number;
  examples: string[];
}

export interface Recommendation {
  id: string;
  type: 'immediate' | 'short_term' | 'long_term';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  title: string;
  description: string;
  rationale: string;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  timeline: string;
  resources: string[];
  dependencies: string[];
}

export interface AnalysisFlag {
  type: 'inconsistency' | 'incomplete' | 'high_risk' | 'anomaly' | 'requires_attention';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  details: string;
  questions: string[];
  suggestions: string[];
}

// === Risk Assessment Integration ===

export interface RiskAssessmentResult {
  id: string
  responseId: string;
  overallRisk: RiskLevel;
  categories: RiskCategoryResult[];
  identifiedRisks: IdentifiedRisk[];
  recommendations: RiskRecommendation[];
  autoGeneratedRisks: AutoGeneratedRisk[];
  integrationStatus: IntegrationStatus;
}

export interface RiskLevel {
  level: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  confidence: number;
  factors: RiskFactor[];
}

export interface RiskFactor {
  factor: string;
  impact: number;
  likelihood: number;
  contribution: number;
  evidence: string[];
}

export interface RiskCategoryResult {
  category: string;
  riskLevel: RiskLevel;
  findings: string[];
  gaps: string[];
  controls: string[];
}

export interface IdentifiedRisk {
  id: string;
  title: string;
  description: string;
  category: string;
  likelihood: number;
  impact: number;
  riskScore: number;
  evidence: Evidence[];
  mitigations: string[];
  timeline: string;
  owner?: string;
}

export interface Evidence {
  questionId: string;
  response: unknown;
  analysis: string;
  weight: number;
}

export interface RiskRecommendation {
  type: 'mitigation' | 'control' | 'monitoring' | 'acceptance' | 'transfer';
  priority: 'immediate' | 'high' | 'medium' | 'low';
  description: string;
  rationale: string;
  implementation: string;
  cost: 'low' | 'medium' | 'high';
  effectiveness: number;
}

export interface AutoGeneratedRisk {
  title: string;
  description: string;
  category: string;
  likelihood: number;
  impact: number;
  confidence: number;
  source: string;
  evidence: string[];
  approved: boolean;
  reviewRequired: boolean;
}

export interface IntegrationStatus {
  riskRegister: 'pending' | 'completed' | 'failed' | 'manual_review';
  controlRegister: 'pending' | 'completed' | 'failed' | 'manual_review';
  complianceTracker: 'pending' | 'completed' | 'failed' | 'manual_review';
  notifications: NotificationStatus[];
}

export interface NotificationStatus {
  type: string;
  status: 'sent' | 'pending' | 'failed';
  recipients: string[];
  timestamp: Date;
}

// === Workflow and Collaboration ===

export interface WorkflowConfig {
  enabled: boolean
  steps: WorkflowStep[];
  approvers: WorkflowApprover[];
  notifications: WorkflowNotification[];
  escalation: EscalationRule[];
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'review' | 'approval' | 'notification' | 'integration' | 'custom';
  order: number;
  required: boolean;
  assignees: string[];
  conditions?: Condition[];
  timeLimit?: number; // hours
  actions: WorkflowAction[];
}

export interface WorkflowApprover {
  userId: string;
  role: string;
  level: number;
  conditions?: Condition[];
  delegations?: Delegation[];
}

export interface Delegation {
  toUserId: string;
  startDate: Date;
  endDate: Date;
  reason: string;
}

export interface WorkflowNotification {
  trigger: WorkflowTrigger;
  recipients: string[];
  template: string;
  delay?: number; // minutes
  conditions?: Condition[];
}

export type WorkflowTrigger =
  | 'step_started'
  | 'step_completed'
  | 'approval_required'
  | 'overdue'
  | 'escalated'
  | 'completed'
  | 'rejected';

export interface WorkflowAction {
  type: 'auto_approve' | 'notify' | 'escalate' | 'integrate' | 'custom';
  config: Record<string, unknown>;
  conditions?: Condition[];
}

export interface EscalationRule {
  trigger: EscalationTrigger;
  delay: number; // hours
  escalateTo: string[];
  actions: string[];
  conditions?: Condition[];
}

export type EscalationTrigger = 'overdue' | 'no_response' | 'high_risk' | 'critical_finding';

// === Analytics and Reporting ===

export interface QuestionnaireAnalytics {
  overview: AnalyticsOverview
  completion: CompletionAnalytics;
  performance: PerformanceAnalytics;
  responses: ResponseAnalytics;
  trends: TrendAnalytics;
}

export interface AnalyticsOverview {
  totalResponses: number;
  completionRate: number;
  averageScore: number;
  averageTime: number; // minutes
  lastUpdated: Date;
}

export interface CompletionAnalytics {
  started: number;
  completed: number;
  abandoned: number;
  averageCompletionTime: number;
  completionRateBySection: SectionCompletion[];
  dropOffPoints: DropOffPoint[];
}

export interface SectionCompletion {
  sectionId: string;
  sectionName: string;
  completionRate: number;
  averageTime: number;
  dropOffRate: number;
}

export interface DropOffPoint {
  questionId: string;
  questionText: string;
  dropOffRate: number;
  commonReasons: string[];
}

export interface PerformanceAnalytics {
  averageResponseTime: number;
  questionDifficulty: QuestionDifficulty[];
  userExperience: UserExperienceMetrics;
  technicalMetrics: TechnicalMetrics;
}

export interface QuestionDifficulty {
  questionId: string;
  difficultyScore: number;
  averageTime: number;
  skipRate: number;
  revisionRate: number;
}

export interface UserExperienceMetrics {
  satisfactionScore: number;
  usabilityScore: number;
  clarityScore: number;
  feedbackCount: number;
  commonComplaints: string[];
}

export interface TechnicalMetrics {
  loadTime: number;
  errorRate: number;
  crashRate: number;
  deviceBreakdown: DeviceMetrics[];
  browserBreakdown: BrowserMetrics[];
}

export interface DeviceMetrics {
  device: string;
  usage: number;
  completionRate: number;
  averageTime: number;
}

export interface BrowserMetrics {
  browser: string;
  usage: number;
  errorRate: number;
  performance: number;
}

export interface ResponseAnalytics {
  patterns: ResponsePattern[];
  distributions: ResponseDistribution[];
  correlations: ResponseCorrelation[];
  outliers: ResponseOutlier[];
}

export interface ResponsePattern {
  pattern: string;
  frequency: number;
  significance: number;
  description: string;
  implications: string[];
}

export interface ResponseDistribution {
  questionId: string;
  distribution: { [value: string]: number }
  mean?: number;
  median?: number;
  mode?: unknown;
  standardDeviation?: number;
}

export interface ResponseCorrelation {
  questionA: string;
  questionB: string;
  correlation: number;
  significance: number;
  interpretation: string;
}

export interface ResponseOutlier {
  responseId: string;
  questionId: string;
  value: unknown;
  deviationScore: number;
  context: string;
  flagged: boolean;
}

export interface TrendAnalytics {
  timeSeriesData: TimeSeriesPoint[];
  trendDirection: 'improving' | 'stable' | 'declining';
  seasonality: SeasonalPattern[];
  forecasts: Forecast[];
}

export interface TimeSeriesPoint {
  date: Date;
  metric: string;
  value: number;
  count: number;
}

export interface SeasonalPattern {
  pattern: string;
  strength: number;
  period: string;
  description: string;
}

export interface Forecast {
  metric: string;
  period: string;
  predicted: number;
  confidence: number;
  range: { min: number; max: number }
}

// === Permissions and Security ===

export interface QuestionnairePermissions {
  read: string[]
  write: string[];
  admin: string[];
  respond: string[];
  review: string[];
  approve: string[];
  analytics: string[];
}

export interface AccessControl {
  publicAccess: boolean;
  requiresAuthentication: boolean;
  allowedRoles: string[];
  allowedUsers: string[];
  restrictions: AccessRestriction[];
}

export interface AccessRestriction {
  type: 'ip' | 'location' | 'time' | 'device' | 'domain';
  value: string;
  action: 'allow' | 'deny';
}

// === Template System ===

export interface TemplateQuestion {
  id: string
  text: string;
  type: QuestionType;
  category: string;
  tags: string[];
  riskWeight: number;
  config: QuestionConfig;
  variables: string[];
  conditions?: TemplateCondition[];
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  defaultValue?: unknown;
  options?: unknown[];
  description: string;
}

export interface TemplateCondition {
  variable: string;
  operator: ConditionOperator;
  value: unknown;
}

export interface ConditionalRule {
  id: string;
  condition: TemplateCondition;
  actions: TemplateAction[];
}

export interface TemplateAction {
  type: 'include_question' | 'exclude_question' | 'modify_question' | 'add_section';
  target: string;
  value?: unknown;
}

// === Utility Types ===

export interface AIAnalysisResult {
  riskIndicators: RiskIndicator[]
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
  suggestions: string[];
  followUpQuestions: SuggestedQuestion[];
}

export interface NotificationSettings {
  enabled: boolean;
  types: NotificationType[];
  channels: NotificationChannel[];
  frequency: NotificationFrequency;
  recipients: NotificationRecipient[];
}

export type NotificationType =
  | 'response_submitted'
  | 'review_required'
  | 'approval_needed'
  | 'deadline_approaching'
  | 'overdue'
  | 'completed'
  | 'high_risk_detected';

export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app' | 'webhook';

export type NotificationFrequency = 'immediate' | 'hourly' | 'daily' | 'weekly';

export interface NotificationRecipient {
  type: 'user' | 'role' | 'group' | 'external';
  identifier: string;
  conditions?: Condition[];
}

export interface ContextSource {
  type:
    | 'organization'
    | 'industry'
    | 'framework'
    | 'previous_responses'
    | 'risk_register'
    | 'external';
  source: string;
  weight: number;
}

export interface GenerationRule {
  trigger: Condition[];
  questionTypes: QuestionType[];
  maxQuestions: number;
  categories: string[];
  riskFocus: string[];
}
