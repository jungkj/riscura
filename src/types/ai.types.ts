// import { Risk, Control, Document } from './index'

// Base AI Types
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

export interface AIResponse {
  id: string;
  content: string;
  confidence: number;
  timestamp: Date;
  usage: TokenUsage;
  metadata?: Record<string, unknown>;
}

export interface AIRequest {
  id: string;
  type: AIRequestType;
  content: string;
  context?: Record<string, unknown>;
  userId: string;
  timestamp: Date;
}

export type AIRequestType =
  | 'risk_analysis'
  | 'control_recommendation'
  | 'content_generation'
  | 'explanation'
  | 'batch_analysis'
  | 'conversation'
  | 'compliance_check'
  | 'gap_analysis';

// Conversation Management
export interface Conversation {
  id: string;
  userId: string;
  title: string;
  agentType: AgentType;
  messages: ConversationMessage[];
  context: ConversationContext;
  status: 'active' | 'paused' | 'completed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    totalTokens: number;
    estimatedCost: number;
    relatedEntities: string[];
  };
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  usage?: TokenUsage;
  attachments?: MessageAttachment[];
  metadata?: Record<string, unknown>;
}

export interface ConversationContext {
  currentRisk?: Risk;
  currentControl?: Control;
  workingSet: {
    risks: string[];
    controls: string[];
    documents: string[];
  };
  preferences: {
    detailLevel: 'brief' | 'detailed' | 'comprehensive';
    includeReferences: boolean;
    generateVisuals: boolean;
  };
}

export interface MessageAttachment {
  id: string;
  type: 'risk' | 'control' | 'document' | 'chart' | 'report';
  title: string;
  url?: string;
  data?: unknown;
}

export type AgentType =
  | 'risk_analyzer'
  | 'control_advisor'
  | 'compliance_expert'
  | 'general_assistant';

// Risk Analysis Types
export interface RiskAnalysis {
  id: string;
  riskId: string;
  score: {
    likelihood: number;
    impact: number;
    overall: number;
    confidence: number;
  };
  assessment: {
    inherentRisk: number;
    residualRisk: number;
    riskReduction: number;
  };
  recommendations: RiskRecommendation[];
  gaps: RiskGap[];
  improvements: RiskImprovement[];
  relatedRisks: RelatedRisk[];
  indicators: KeyRiskIndicator[];
  treatmentStrategy: RiskTreatmentStrategy;
  regulatoryConsiderations: RegulatoryConsideration[];
  timestamp: Date;
  confidence: number;
}

export interface RiskRecommendation {
  id: string;
  type: 'immediate' | 'short_term' | 'long_term';
  priority: 'critical' | 'high' | 'medium' | 'low';
  action: string;
  rationale: string;
  estimatedEffort: 'low' | 'medium' | 'high';
  expectedImpact: number;
  dependencies: string[];
  timeline: string;
}

export interface RiskGap {
  id: string;
  category: 'control' | 'process' | 'monitoring' | 'reporting';
  description: string;
  impact: 'critical' | 'significant' | 'moderate' | 'minimal';
  remediation: string;
  priority: number;
}

export interface RiskImprovement {
  id: string;
  area: string;
  description: string;
  benefit: string;
  effort: 'low' | 'medium' | 'high';
  roi: number;
}

export interface RelatedRisk {
  id: string;
  title: string;
  relationship: 'causal' | 'correlated' | 'dependent' | 'independent';
  strength: number;
  description: string;
}

export interface KeyRiskIndicator {
  id: string;
  name: string;
  description: string;
  threshold: {
    green: number;
    amber: number;
    red: number;
  };
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  source: string;
}

export interface RiskTreatmentStrategy {
  recommended: 'accept' | 'avoid' | 'mitigate' | 'transfer';
  rationale: string;
  alternatives: Array<{
    strategy: 'accept' | 'avoid' | 'mitigate' | 'transfer';
    description: string;
    pros: string[];
    cons: string[];
  }>;
}

export interface RegulatoryConsideration {
  regulation: string;
  applicability: 'high' | 'medium' | 'low';
  requirements: string[];
  implications: string;
}

// Control Recommendation Types
export interface ControlRecommendation {
  id: string;
  title: string;
  description: string;
  type: 'preventive' | 'detective' | 'corrective';
  category: 'manual' | 'automated' | 'hybrid';
  effectiveness: number;
  implementationCost: 'low' | 'medium' | 'high';
  operationalCost: 'low' | 'medium' | 'high';
  priority: number;
  riskReduction: number;
  implementation: ControlImplementation;
  testing: ControlTesting;
  monitoring: ControlMonitoring;
  dependencies: string[];
  alternatives: ControlAlternative[];
  complianceMapping: ComplianceMapping[];
  timestamp: Date;
  confidence: number;
}

export interface ControlImplementation {
  timeline: string;
  phases: ImplementationPhase[];
  resources: RequiredResource[];
  risks: ImplementationRisk[];
  successCriteria: string[];
}

export interface ImplementationPhase {
  name: string;
  description: string;
  duration: string;
  deliverables: string[];
  dependencies: string[];
}

export interface RequiredResource {
  type: 'human' | 'technology' | 'financial';
  description: string;
  quantity: string;
  cost?: number;
}

export interface ImplementationRisk {
  description: string;
  likelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
}

export interface ControlTesting {
  frequency: 'continuous' | 'monthly' | 'quarterly' | 'annually';
  methodology: string;
  procedures: TestingProcedure[];
  evidence: string[];
  passFailCriteria: string[];
}

export interface TestingProcedure {
  step: number;
  description: string;
  expectedResult: string;
  documentation: string[];
}

export interface ControlMonitoring {
  metrics: ControlMetric[];
  dashboards: string[];
  alerting: AlertingRule[];
  reporting: ReportingRequirement[];
}

export interface ControlMetric {
  name: string;
  description: string;
  calculation: string;
  threshold: {
    target: number;
    acceptable: number;
    critical: number;
  };
  frequency: string;
}

export interface AlertingRule {
  condition: string;
  severity: 'info' | 'warning' | 'critical';
  recipients: string[];
  escalation: string;
}

export interface ReportingRequirement {
  audience: string;
  frequency: string;
  content: string[];
  format: string;
}

export interface ControlAlternative {
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  costComparison: number;
  effectivenessComparison: number;
}

export interface ComplianceMapping {
  framework: string;
  requirement: string;
  coverage: 'full' | 'partial' | 'none';
  gaps: string[];
}

// Content Generation Types
export type ContentType =
  | 'risk_description'
  | 'control_procedure'
  | 'policy_document'
  | 'training_material'
  | 'risk_scenario'
  | 'incident_response'
  | 'assessment_questionnaire';

export interface ContentGenerationRequest {
  type: ContentType;
  context: string;
  requirements: ContentRequirements;
  template?: string;
  examples?: string[];
}

export interface ContentRequirements {
  length: 'brief' | 'standard' | 'detailed';
  tone: 'formal' | 'professional' | 'conversational';
  audience: 'executives' | 'managers' | 'staff' | 'technical';
  includeReferences: boolean;
  includeExamples: boolean;
  customRequirements?: string[];
}

export interface RegenerationOptions {
  style: 'more_formal' | 'more_casual' | 'more_detailed' | 'more_concise';
  focus: string;
  addElements?: string[];
  removeElements?: string[];
}

// Batch Analysis Types
export interface BatchAnalysisRequest {
  items: BatchAnalysisItem[];
  analysisType: 'risk_assessment' | 'control_effectiveness' | 'gap_analysis' | 'compliance_check';
  options: BatchAnalysisOptions;
}

export interface BatchAnalysisItem {
  id: string;
  type: 'risk' | 'control' | 'document';
  data: Risk | Control | Document;
}

export interface BatchAnalysisOptions {
  includeRecommendations: boolean;
  includePrioritization: boolean;
  includeCorrelations: boolean;
  outputFormat: 'summary' | 'detailed' | 'executive';
}

export interface BatchAnalysisResult {
  id: string;
  summary: BatchAnalysisSummary;
  results: IndividualAnalysisResult[];
  correlations: AnalysisCorrelation[];
  recommendations: PrioritizedRecommendation[];
  timestamp: Date;
  totalUsage: TokenUsage;
}

export interface BatchAnalysisSummary {
  totalItems: number;
  highRiskItems: number;
  mediumRiskItems: number;
  lowRiskItems: number;
  averageConfidence: number;
  keyFindings: string[];
  overallRating: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface IndividualAnalysisResult {
  itemId: string;
  analysis: RiskAnalysis | ControlRecommendation;
  score: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  findings: string[];
}

export interface AnalysisCorrelation {
  items: string[];
  type: 'risk_correlation' | 'control_overlap' | 'gap_pattern';
  strength: number;
  description: string;
  implications: string[];
}

export interface PrioritizedRecommendation {
  id: string;
  title: string;
  description: string;
  priority: number;
  scope: string[];
  impact: string;
  effort: string;
  timeline: string;
}

// Explanation Types
export interface ExplanationRequest {
  content: string;
  context: ExplanationContext;
  detailLevel: 'brief' | 'standard' | 'comprehensive';
  audience: 'technical' | 'business' | 'executive';
}

export interface ExplanationContext {
  domain: 'risk_management' | 'compliance' | 'controls' | 'general';
  relatedEntities?: {
    risks?: string[];
    controls?: string[];
    frameworks?: string[];
  };
  userRole?: string;
  organizationContext?: string;
}

export interface Explanation {
  summary: string;
  details: ExplanationSection[];
  examples: ExplanationExample[];
  references: ExplanationReference[];
  relatedConcepts: string[];
  confidence: number;
}

export interface ExplanationSection {
  title: string;
  content: string;
  importance: 'high' | 'medium' | 'low';
}

export interface ExplanationExample {
  scenario: string;
  application: string;
  outcome: string;
}

export interface ExplanationReference {
  title: string;
  source: string;
  url?: string;
  relevance: number;
}

// Rate Limiting Types
export interface RateLimitStatus {
  requestsRemaining: number;
  tokensRemaining: number;
  resetTime: Date;
  isLimited: boolean;
}

export interface RateLimitViolation {
  userId: string;
  type: 'requests' | 'tokens';
  limit: number;
  current: number;
  resetTime: Date;
  timestamp: Date;
}

// Audit and Security Types
export interface AIAuditLog {
  id: string;
  userId: string;
  requestType: AIRequestType;
  timestamp: Date;
  requestSummary: string;
  responseStatus: 'success' | 'error' | 'rate_limited';
  tokenUsage: TokenUsage;
  duration: number;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export interface SecurityEvent {
  id: string;
  type: 'suspicious_activity' | 'rate_limit_exceeded' | 'invalid_request' | 'unauthorized_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId: string;
  details: string;
  timestamp: Date;
  resolved: boolean;
}

// Error Types
export interface AIError {
  code: string;
  message: string;
  details?: string;
  timestamp: Date;
  requestId?: string;
  retryable: boolean;
  fallbackUsed: boolean;
}

export type AIErrorCode =
  | 'API_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INVALID_REQUEST'
  | 'AUTHENTICATION_FAILED'
  | 'NETWORK_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'TIMEOUT'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN_ERROR';

// Cache Types
export interface CacheEntry<T = unknown> {
  key: string;
  data: T;
  timestamp: Date;
  expiresAt: Date;
  hitCount: number;
  size: number;
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
}

// Performance Monitoring Types
export interface PerformanceMetrics {
  averageResponseTime: number;
  requestsPerMinute: number;
  errorRate: number;
  cacheHitRate: number;
  tokenUsageRate: number;
  concurrentRequests: number;
}

export interface PerformanceAlert {
  type: 'high_latency' | 'high_error_rate' | 'rate_limit_approaching' | 'cache_miss_rate';
  threshold: number;
  current: number;
  severity: 'warning' | 'critical';
  timestamp: Date;
}

// Import OpenAI SDK types when available
export interface OpenAIAgent {
  id: string;
  name: string;
  model: string;
  instructions: string;
  tools: unknown[];
  metadata?: Record<string, unknown>;
}

export interface OpenAIRun {
  id: string;
  object: string;
  created_at: number;
  thread_id: string;
  assistant_id: string;
  status:
    | 'queued'
    | 'in_progress'
    | 'requires_action'
    | 'cancelling'
    | 'cancelled'
    | 'failed'
    | 'completed'
    | 'expired';
  required_action?: unknown;
  last_error?: unknown;
  expires_at?: number;
  started_at?: number;
  cancelled_at?: number;
  failed_at?: number;
  completed_at?: number;
  model: string;
  instructions: string;
  tools: unknown[];
  metadata?: Record<string, unknown>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenAIThread {
  id: string;
  object: string;
  created_at: number;
  metadata?: Record<string, unknown>;
}

export interface OpenAIMessage {
  id: string;
  object: string;
  created_at: number;
  thread_id: string;
  role: 'user' | 'assistant';
  content: Array<{
    type: 'text';
    text: {
      value: string;
      annotations: unknown[];
    };
  }>;
  assistant_id?: string;
  run_id?: string;
  metadata?: Record<string, unknown>;
}
