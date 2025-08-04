// import { Risk } from './index'

// Enhanced Risk Management Types
export interface EnhancedRisk extends Risk {
  // Workflow states
  workflowState: 'identified' | 'assessed' | 'mitigated' | 'monitored' | 'closed'
  workflowHistory: WorkflowTransition[];

  // AI-powered fields
  aiSuggestions?: AISuggestions
  aiConfidence: number;
  aiLastAnalyzed?: Date;

  // Enhanced metadata
  priority: 'critical' | 'high' | 'medium' | 'low'
  businessUnit?: string;
  riskOwner: string;
  riskApprover?: string;

  // Collaboration
  riskComments: RiskComment[]
  approvals: RiskApproval[];
  assignments: RiskAssignment[];

  // Analytics
  trendData?: RiskTrend[]
  correlatedRisks?: string[];
  mitigationStrategies: MitigationStrategy[];

  // Templates and categorization
  template?: RiskTemplate
  subCategory?: string;
  tags: string[];

  // Compliance and regulatory
  regulatoryFrameworks: string[]
  complianceRequirements: string[];

  // Financial impact
  potentialLoss?: FinancialImpact
  costOfMitigation?: number;
}

export interface WorkflowTransition {
  id: string;
  fromState: string;
  toState: string;
  transitionDate: Date;
  userId: string;
  reason?: string;
  autoTransition: boolean;
}

export interface AISuggestions {
  suggestedCategory?: string;
  suggestedLikelihood?: number;
  suggestedImpact?: number;
  suggestedMitigations: string[];
  suggestedControls: string[];
  reasoningExplanation: string;
  confidenceScore: number;
}

export interface RiskComment {
  id: string;
  authorId: string;
  content: string;
  entityType: 'risk';
  entityId: string;
  createdAt: Date;
  updatedAt?: Date;
  parentCommentId?: string;
  reactions: CommentReaction[];
}

export interface CommentReaction {
  userId: string;
  type: 'like' | 'agree' | 'disagree' | 'important';
}

export interface RiskApproval {
  id: string;
  approverId: string;
  status: 'pending' | 'approved' | 'rejected' | 'requires_changes';
  comments?: string;
  approvedAt?: Date;
  level: number; // approval hierarchy level
}

export interface RiskAssignment {
  id: string;
  userId: string;
  role: 'owner' | 'reviewer' | 'contributor' | 'observer';
  assignedAt: Date;
  assignedBy: string;
  dueDate?: Date;
  status: 'active' | 'completed' | 'overdue';
}

export interface RiskTrend {
  date: Date;
  likelihood: number;
  impact: number;
  riskScore: number;
  notes?: string;
}

export interface MitigationStrategy {
  id: string;
  title: string;
  description: string;
  type: 'preventive' | 'detective' | 'corrective';
  status: 'planned' | 'in_progress' | 'implemented' | 'failed';
  effectiveness: number; // 0-100
  cost: number;
  timeline: number; // days
  owner: string;
  controls: string[];
}

export interface RiskTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  defaultLikelihood: number;
  defaultImpact: number;
  suggestedControls: string[];
  commonMitigations: string[];
  industryStandards: string[];
}

export interface FinancialImpact {
  currency: string;
  minimumLoss: number;
  maximumLoss: number;
  expectedLoss: number;
  timeHorizon: number; // months
  confidenceLevel: number; // percentage
}

// Bulk Operations
export interface BulkOperation {
  type: 'update' | 'delete' | 'export' | 'approve' | 'assign'
  riskIds: string[];
  data?: any;
  userId: string;
  timestamp: Date;
}

export interface BulkUpdateData {
  status?: string;
  priority?: string;
  owner?: string;
  category?: string;
  tags?: string[];
}

// Advanced Filtering
export interface AdvancedRiskFilters {
  // Basic filters
  category?: string[]
  status?: string[];
  priority?: string[];
  riskLevel?: string[];

  // Date filters
  dateRange?: {
    start: Date
    end: Date;
    field: 'createdAt' | 'updatedAt' | 'lastAssessed' | 'nextReview';
  }

  // Score filters
  scoreRange?: {
    min: number
    max: number;
  }

  // Assignment filters
  assignedTo?: string[]
  owner?: string[];
  approver?: string[];

  // AI filters
  aiConfidenceRange?: {
    min: number
    max: number;
  }

  // Custom filters
  tags?: string[]
  businessUnit?: string[];
  regulatoryFramework?: string[];

  // Advanced queries
  searchQuery?: string
  correlatedWith?: string; // risk ID
  hasComments?: boolean;
  requiresApproval?: boolean;
}

// Import/Export
export interface RiskImportData {
  risks: Partial<EnhancedRisk>[]
  mapping: FieldMapping;
  validation: ValidationSettings;
}

export interface FieldMapping {
  [csvColumn: string]: keyof EnhancedRisk;
}

export interface ValidationSettings {
  skipInvalidRows: boolean;
  requireAllFields: boolean;
  allowDuplicates: boolean;
}

export interface RiskExportOptions {
  format: 'csv' | 'xlsx' | 'pdf' | 'json';
  includeComments: boolean;
  includeHistory: boolean;
  includeAttachments: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  }
}

// Analytics and Reporting
export interface RiskAnalytics {
  totalRisks: number
  risksByCategory: Record<string, number>;
  risksByStatus: Record<string, number>;
  risksByPriority: Record<string, number>;
  averageRiskScore: number;
  trendData: TrendDataPoint[];
  topRisks: EnhancedRisk[];
  riskVelocity: number; // risks created per month
  mitigationEffectiveness: number;
  complianceScore: number;
}

export interface TrendDataPoint {
  date: Date;
  totalRisks: number;
  averageScore: number;
  newRisks: number;
  mitigatedRisks: number;
  criticalRisks: number;
}

// AI Risk Intelligence
export interface RiskIntelligence {
  predictiveAnalysis: PredictiveAnalysis
  correlationInsights: CorrelationInsight[];
  emergingRisks: EmergingRisk[];
  industryBenchmarks: IndustryBenchmark[];
  recommendations: AIRecommendation[];
}

export interface PredictiveAnalysis {
  forecastedRisks: ForecastedRisk[];
  trendPredictions: TrendPrediction[];
  seasonalPatterns: SeasonalPattern[];
  confidence: number;
}

export interface ForecastedRisk {
  category: string;
  probability: number;
  predictedImpact: number;
  timeframe: string;
  reasoning: string;
}

export interface TrendPrediction {
  metric: string;
  currentValue: number;
  predictedValue: number;
  changeDirection: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
}

export interface SeasonalPattern {
  pattern: string;
  frequency: string;
  strength: number;
  nextPeakDate: Date;
}

export interface CorrelationInsight {
  risk1Id: string;
  risk2Id: string;
  correlationType: 'positive' | 'negative' | 'causal';
  strength: number;
  explanation: string;
}

export interface EmergingRisk {
  title: string;
  description: string;
  category: string;
  probability: number;
  potentialImpact: number;
  sourceSignals: string[];
  timeToMaterialization: number;
}

export interface IndustryBenchmark {
  metric: string;
  industryAverage: number;
  topQuartile: number;
  organizationValue: number;
  position: 'above_average' | 'average' | 'below_average';
}

export interface AIRecommendation {
  id: string;
  type: 'mitigation' | 'process_improvement' | 'resource_allocation' | 'monitoring';
  title: string;
  description: string;
  priority: number;
  expectedBenefit: string;
  effort: 'low' | 'medium' | 'high';
  timeline: string;
  affectedRisks: string[];
}
