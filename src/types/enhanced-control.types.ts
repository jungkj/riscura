import { Control } from './index';

// Enhanced Control Management Types
export interface EnhancedControl extends Control {
  // Core Control Properties
  controlId: string
  framework: ControlFramework;
  controlType: 'preventive' | 'detective' | 'corrective' | 'compensating';
  controlNature: 'manual' | 'automated' | 'hybrid';
  frequency: 'continuous' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';

  // Relationships
  mappedRisks: string[]; // Risk IDs
  parentControls: string[]; // Parent control IDs
  childControls: string[]; // Child control IDs
  relatedControls: string[]; // Related control IDs

  // Effectiveness and Performance
  maturityLevel: 1 | 2 | 3 | 4 | 5; // Maturity scoring
  effectivenessScore: number; // 0-100
  performanceMetrics: ControlMetrics;
  testingHistory: ControlTest[];

  // AI-Powered Features
  aiAssessment?: ControlAIAssessment
  aiRecommendations: AIControlRecommendation[];
  riskMitigationEffectiveness: RiskMitigationScore[];

  // Testing and Validation (use different property names to avoid conflicts)
  testingSchedule: TestingSchedule
  testingStatus: 'not_tested' | 'scheduled' | 'in_progress' | 'passed' | 'failed' | 'overdue';
  lastTestPerformed?: Date; // renamed from lastTestDate to avoid conflict
  nextTestScheduled?: Date; // renamed from nextTestDate to avoid conflict
  testingEvidence: ControlEvidence[];

  // Compliance and Frameworks
  complianceMapping: ComplianceMapping[]
  regulatoryRequirements: string[];
  industryBenchmarks: IndustryBenchmark[];

  // Collaboration and Workflow
  assignments: ControlAssignment[]
  reviews: ControlReview[];
  approvals: ControlApproval[];
  controlComments: ControlComment[];

  // Documentation and Evidence
  procedures: ControlProcedure[]
  evidenceRequirements: EvidenceRequirement[];
  auditTrail: ControlAuditEntry[];

  // Performance Analytics
  trendData: ControlTrendData[]
  benchmarkComparison: BenchmarkComparison;
  costBenefitAnalysis?: CostBenefitAnalysis;
}

export interface ControlFramework {
  id: string;
  name: string;
  version: string;
  category:
    | 'SOC2'
    | 'ISO27001'
    | 'NIST'
    | 'PCI-DSS'
    | 'HIPAA'
    | 'GDPR'
    | 'SOX'
    | 'COBIT'
    | 'Custom';
  domain: string;
  subdomain?: string;
  controlObjective: string;
  requirements: string[];
}

export interface ControlMetrics {
  testingFrequency: number; // Tests per period
  passRate: number; // Percentage
  averageTestDuration: number; // Hours
  costPerTest: number;
  autoDetectionRate: number; // For detective controls
  falsePositiveRate: number; // For detective controls
  timeToDetection: number; // Minutes/hours
  timeToResponse: number; // Minutes/hours
}

export interface ControlTest {
  id: string;
  testDate: Date;
  tester: string;
  testType: 'design' | 'operating_effectiveness' | 'compliance' | 'walkthrough';
  testProcedure: string;
  sampleSize: number;
  testResults: TestResult[];
  overallResult: 'passed' | 'failed' | 'partially_effective' | 'not_applicable';
  deficiencies: ControlDeficiency[];
  remediation: RemediationPlan[];
  evidence: string[];
  testDuration: number; // Minutes
  nextTestDate?: Date;
  comments?: string;
}

export interface TestResult {
  attribute: string;
  expected: string;
  actual: string;
  status: 'pass' | 'fail' | 'exception';
  impact: 'low' | 'medium' | 'high' | 'critical';
  notes?: string;
}

export interface ControlDeficiency {
  id: string;
  type: 'design' | 'operating_effectiveness' | 'compliance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  rootCause: string;
  impact: string;
  identifiedDate: Date;
  owner: string;
  status: 'open' | 'in_progress' | 'closed' | 'accepted_risk';
  targetResolutionDate?: Date;
  actualResolutionDate?: Date;
}

export interface RemediationPlan {
  id: string;
  deficiencyId: string;
  action: string;
  owner: string;
  dueDate: Date;
  status: 'planned' | 'in_progress' | 'completed' | 'overdue';
  effort: number; // Hours
  cost: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dependencies: string[];
}

export interface ControlAIAssessment {
  overallScore: number; // 0-100
  designEffectiveness: number; // 0-100
  operatingEffectiveness: number; // 0-100
  maturityAssessment: MaturityAssessment;
  gapAnalysis: GapAnalysis[];
  improvementOpportunities: ImprovementOpportunity[];
  automationPotential: AutomationAssessment;
  riskCoverage: RiskCoverageAnalysis;
  confidenceScore: number; // 0-1
  lastAnalyzed: Date;
}

export interface MaturityAssessment {
  currentLevel: 1 | 2 | 3 | 4 | 5;
  targetLevel: 1 | 2 | 3 | 4 | 5;
  maturityGaps: MaturityGap[];
  roadmapToTarget: MaturityRoadmap[];
}

export interface MaturityGap {
  area: string;
  currentState: string;
  desiredState: string;
  effort: 'low' | 'medium' | 'high';
  priority: number;
}

export interface MaturityRoadmap {
  phase: number;
  milestone: string;
  activities: string[];
  duration: number; // Weeks
  dependencies: string[];
  resources: string[];
}

export interface GapAnalysis {
  category: 'design' | 'implementation' | 'testing' | 'documentation' | 'monitoring';
  gap: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  effort: 'low' | 'medium' | 'high';
  recommendation: string;
  priority: number;
}

export interface ImprovementOpportunity {
  id: string;
  title: string;
  description: string;
  category: 'efficiency' | 'effectiveness' | 'automation' | 'cost_reduction' | 'risk_reduction';
  expectedBenefit: string;
  implementationEffort: 'low' | 'medium' | 'high';
  roi: number; // Return on investment
  timeline: number; // Weeks
  prerequisites: string[];
}

export interface AutomationAssessment {
  automationScore: number; // 0-100
  automationPotential: 'low' | 'medium' | 'high';
  automationOpportunities: AutomationOpportunity[];
  currentAutomationLevel: number; // 0-100
  targetAutomationLevel: number; // 0-100
}

export interface AutomationOpportunity {
  process: string;
  currentState: string;
  proposedAutomation: string;
  effort: 'low' | 'medium' | 'high';
  cost: number;
  expectedSavings: number;
  riskReduction: number; // 0-100
}

export interface RiskCoverageAnalysis {
  totalRisksCovered: number;
  riskCoveragePercentage: number;
  criticalRisksCovered: number;
  gaps: RiskCoverageGap[];
  redundancies: ControlRedundancy[];
}

export interface RiskCoverageGap {
  riskId: string;
  riskTitle: string;
  coverageLevel: 'none' | 'partial' | 'adequate' | 'strong';
  recommendedControls: string[];
}

export interface ControlRedundancy {
  controlIds: string[];
  riskId: string;
  redundancyLevel: 'minimal' | 'moderate' | 'excessive';
  recommendation: string;
}

export interface AIControlRecommendation {
  id: string;
  type: 'new_control' | 'enhance_existing' | 'automate' | 'retire' | 'consolidate';
  title: string;
  description: string;
  rationale: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  effort: 'low' | 'medium' | 'high';
  expectedBenefit: string;
  implementationSteps: string[];
  timeline: number; // Weeks
  cost: number;
  riskReduction: number; // 0-100
  affectedRisks: string[];
  confidenceScore: number; // 0-1
}

export interface RiskMitigationScore {
  riskId: string;
  mitigationEffectiveness: number; // 0-100
  residualRisk: number; // 0-100
  controlContribution: number; // 0-100
  trendDirection: 'improving' | 'stable' | 'declining';
}

export interface TestingSchedule {
  frequency: 'continuous' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  customFrequency?: number; // Days
  testingWindows: TestingWindow[];
  autoScheduling: boolean;
  reminderSettings: ReminderSettings;
}

export interface TestingWindow {
  startDate: Date;
  endDate: Date;
  testType: string;
  assigned: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface ReminderSettings {
  enabled: boolean;
  daysBeforeDue: number[];
  recipients: string[];
  escalation: EscalationSettings;
}

export interface EscalationSettings {
  enabled: boolean;
  daysOverdue: number[];
  escalationPath: string[];
}

export interface ControlEvidence {
  id: string;
  type: 'document' | 'screenshot' | 'log_file' | 'report' | 'video' | 'other';
  name: string;
  description: string;
  fileUrl?: string;
  uploadDate: Date;
  uploadedBy: string;
  testId?: string;
  tags: string[];
  confidentiality: 'public' | 'internal' | 'confidential' | 'restricted';
  retentionPeriod: number; // Days
}

export interface ComplianceMapping {
  frameworkId: string;
  frameworkName: string;
  requirement: string;
  mappingType: 'primary' | 'secondary' | 'supporting';
  complianceStatus: 'compliant' | 'partially_compliant' | 'non_compliant' | 'not_applicable';
  lastAssessment: Date;
  evidence: string[];
  gaps: string[];
}

export interface IndustryBenchmark {
  industry: string;
  controlCategory: string;
  metric: string;
  industryAverage: number;
  topQuartile: number;
  organizationValue: number;
  benchmarkDate: Date;
  source: string;
}

export interface ControlAssignment {
  id: string;
  userId: string;
  role: 'owner' | 'tester' | 'reviewer' | 'approver' | 'observer';
  assignedDate: Date;
  assignedBy: string;
  responsibilities: string[];
  delegationLevel: 'full' | 'limited' | 'view_only';
}

export interface ControlReview {
  id: string;
  reviewDate: Date;
  reviewer: string;
  reviewType: 'design' | 'effectiveness' | 'periodic' | 'incident_driven';
  findings: ReviewFinding[];
  overallRating: 'satisfactory' | 'needs_improvement' | 'unsatisfactory';
  recommendations: string[];
  nextReviewDate: Date;
}

export interface ReviewFinding {
  category: string;
  finding: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
  status: 'open' | 'addressed' | 'accepted';
}

export interface ControlApproval {
  id: string;
  approver: string;
  approvalType: 'design' | 'implementation' | 'change' | 'retirement';
  status: 'pending' | 'approved' | 'rejected' | 'requires_changes';
  approvalDate?: Date;
  comments?: string;
  conditions?: string[];
}

export interface ControlComment {
  id: string;
  userId: string;
  authorId: string;
  content: string;
  entityType: 'control';
  entityId: string;
  createdAt: Date;
  updatedAt?: Date;
  parentCommentId?: string;
  category: 'general' | 'testing' | 'improvement' | 'issue' | 'question';
  reactions: CommentReaction[];
}

export interface CommentReaction {
  userId: string;
  type: 'like' | 'agree' | 'disagree' | 'important' | 'resolved';
}

export interface ControlProcedure {
  id: string;
  title: string;
  description: string;
  steps: ProcedureStep[];
  version: string;
  approvedBy: string;
  approvalDate: Date;
  effectiveDate: Date;
  nextReviewDate: Date;
  documentUrl?: string;
}

export interface ProcedureStep {
  order: number;
  step: string;
  responsible: string;
  tools: string[];
  expectedOutcome: string;
  documentation: string[];
}

export interface EvidenceRequirement {
  id: string;
  requirement: string;
  evidenceType: string;
  frequency: string;
  retentionPeriod: number;
  responsible: string;
  automated: boolean;
  currentStatus: 'collected' | 'pending' | 'overdue' | 'not_applicable';
}

export interface ControlAuditEntry {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  oldValue?: any;
  newValue?: any;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ControlTrendData {
  date: Date;
  effectivenessScore: number;
  testResults: number; // Pass rate
  maturityLevel: number;
  costMetrics: number;
  riskMitigation: number;
}

export interface BenchmarkComparison {
  industry: string;
  peerGroup: string;
  metrics: BenchmarkMetric[];
  position: 'leader' | 'above_average' | 'average' | 'below_average' | 'laggard';
  improvementAreas: string[];
}

export interface BenchmarkMetric {
  metric: string;
  organizationValue: number;
  industryAverage: number;
  topQuartile: number;
  percentile: number;
}

export interface CostBenefitAnalysis {
  implementationCost: number;
  operatingCost: number; // Annual
  maintenanceCost: number; // Annual
  riskReductionValue: number;
  efficiencyGains: number;
  complianceBenefits: number;
  roi: number;
  paybackPeriod: number; // Months
  npv: number; // Net Present Value
}

// Advanced Filtering and Search
export interface AdvancedControlFilters {
  framework?: string[]
  controlType?: string[];
  controlNature?: string[];
  maturityLevel?: number[];
  effectivenessRange?: { min: number; max: number }
  testingStatus?: string[];
  complianceStatus?: string[];
  owner?: string[];
  lastTestDate?: { start: Date; end: Date }
  riskIds?: string[];
  tags?: string[];
  searchQuery?: string;
  hasDeficiencies?: boolean;
  automationLevel?: { min: number; max: number }
}

// Bulk Operations
export interface ControlBulkOperation {
  type: 'test' | 'update' | 'approve' | 'retire' | 'export' | 'assign'
  controlIds: string[];
  data?: any;
  userId: string;
  timestamp: Date;
}

// Analytics and Reporting
export interface ControlAnalytics {
  totalControls: number
  controlsByFramework: Record<string, number>;
  controlsByType: Record<string, number>;
  controlsByMaturity: Record<number, number>;
  averageEffectiveness: number;
  testingMetrics: TestingMetrics;
  deficiencyMetrics: DeficiencyMetrics;
  complianceMetrics: ComplianceMetrics;
  trendData: ControlAnalyticsTrend[];
  topPerformingControls: EnhancedControl[];
  controlsNeedingAttention: EnhancedControl[];
}

export interface TestingMetrics {
  totalTestsCompleted: number;
  overallPassRate: number;
  averageTestDuration: number;
  overdueTests: number;
  upcomingTests: number;
  testingFrequencyCompliance: number;
}

export interface DeficiencyMetrics {
  totalDeficiencies: number;
  openDeficiencies: number;
  criticalDeficiencies: number;
  averageResolutionTime: number;
  deficiencyTrends: DeficiencyTrend[];
}

export interface DeficiencyTrend {
  date: Date;
  opened: number;
  closed: number;
  backlog: number;
}

export interface ComplianceMetrics {
  overallComplianceScore: number;
  frameworkCompliance: Record<string, number>;
  gapsIdentified: number;
  remediationProgress: number;
}

export interface ControlAnalyticsTrend {
  date: Date;
  totalControls: number;
  averageEffectiveness: number;
  testsCompleted: number;
  deficienciesIdentified: number;
  complianceScore: number;
}

// Import/Export
export interface ControlImportData {
  controls: Partial<EnhancedControl>[]
  mapping: ControlFieldMapping;
  validation: ControlValidationSettings;
}

export interface ControlFieldMapping {
  [csvColumn: string]: keyof EnhancedControl;
}

export interface ControlValidationSettings {
  skipInvalidRows: boolean;
  requireAllFields: boolean;
  allowDuplicates: boolean;
  validateFrameworkMapping: boolean;
}

export interface ControlExportOptions {
  format: 'csv' | 'xlsx' | 'pdf' | 'json';
  includeTests: boolean;
  includeEvidence: boolean;
  includeDeficiencies: boolean;
  dateRange?: { start: Date; end: Date }
  frameworks?: string[];
}
