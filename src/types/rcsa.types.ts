// Standardized RCSA types aligned with Prisma schema
import { 
  RiskCategory as PrismaRiskCategory,
  RiskStatus as PrismaRiskStatus, 
  RiskLevel as PrismaRiskLevel,
  ControlType as PrismaControlType,
  ControlStatus as PrismaControlStatus,
  ControlCategory as PrismaControlCategory,
  AutomationLevel as PrismaAutomationLevel,
  EffectivenessRating as PrismaEffectivenessRating,
  Priority as PrismaPriority,
  ControlEffort as PrismaControlEffort,
  TestScriptType as PrismaTestScriptType,
  TestFrequency as PrismaTestFrequency,
  TestStatus as PrismaTestStatus
} from '@prisma/client';

// Re-export Prisma enums for consistency
export const RiskCategory = PrismaRiskCategory;
export const RiskStatus = PrismaRiskStatus;
export const RiskLevel = PrismaRiskLevel;
export const ControlType = PrismaControlType;
export const ControlStatus = PrismaControlStatus;
export const ControlCategory = PrismaControlCategory;
export const AutomationLevel = PrismaAutomationLevel;
export const EffectivenessRating = PrismaEffectivenessRating;
export const Priority = PrismaPriority;
export const ControlEffort = PrismaControlEffort;
export const TestScriptType = PrismaTestScriptType;
export const TestFrequency = PrismaTestFrequency;
export const TestStatus = PrismaTestStatus;

export type RiskCategory = PrismaRiskCategory;
export type RiskStatus = PrismaRiskStatus;
export type RiskLevel = PrismaRiskLevel;
export type ControlType = PrismaControlType;
export type ControlStatus = PrismaControlStatus;
export type ControlCategory = PrismaControlCategory;
export type AutomationLevel = PrismaAutomationLevel;
export type EffectivenessRating = PrismaEffectivenessRating;
export type Priority = PrismaPriority;
export type ControlEffort = PrismaControlEffort;
export type TestScriptType = PrismaTestScriptType;
export type TestFrequency = PrismaTestFrequency;
export type TestStatus = PrismaTestStatus;

// Standardized Risk interface
export interface Risk {
  id: string;
  title: string;
  description: string;
  category: RiskCategory;
  likelihood: number; // 1-5 scale
  impact: number; // 1-5 scale
  riskScore: number; // calculated: likelihood * impact
  riskLevel?: RiskLevel; // calculated based on riskScore
  owner?: string;
  status: RiskStatus;
  dateIdentified?: Date;
  lastAssessed?: Date;
  nextReview?: Date;
  aiConfidence?: number;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  
  // Computed fields for UI
  evidence?: Document[];
  comments?: Comment[];
  tasks?: Task[];
  activities?: Activity[];
}

// Standardized Control interface
export interface Control {
  id: string;
  title: string;
  description: string;
  type: ControlType;
  category: ControlCategory;
  frequency: string;
  automationLevel: AutomationLevel;
  effectiveness: number; // 0-1 scale (STANDARDIZED)
  effectivenessRating?: EffectivenessRating;
  owner?: string;
  operatorId?: string;
  reviewerId?: string;
  status: ControlStatus;
  priority?: Priority;
  
  // Testing fields
  lastTestDate?: Date;
  nextTestDate?: Date;
  testResults?: string;
  
  // Business context
  businessUnit?: string;
  department?: string;
  location?: string;
  cost?: number;
  effort?: ControlEffort;
  
  // Custom fields  
  tags: string[];
  customFields?: Record<string, any>;
  
  // Multi-tenant isolation
  organizationId: string;
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  
  // Computed fields for UI
  evidence?: Document[];
  comments?: Comment[];
  tasks?: Task[];
  activities?: Activity[];
  testScripts?: TestScript[];
}

// Standardized ControlRiskMapping interface
export interface ControlRiskMapping {
  id: string;
  riskId: string;
  controlId: string;
  effectiveness: number; // 0-1 scale (STANDARDIZED)
  createdAt: Date;
  updatedAt: Date;
  
  // Populated relationships for UI
  risk?: Risk;
  control?: Control;
}

// Assessment and Evidence types
export interface AssessmentEvidence {
  id: string;
  assessmentId: string;
  controlId?: string;
  name: string;
  description?: string;
  evidenceType: string; // DOCUMENT, SCREENSHOT, CONFIGURATION, INTERVIEW
  fileUrl?: string;
  uploadedBy: string;
  uploadedAt: Date;
  
  // Populated relationships
  control?: Control;
  uploader?: User;
}

export interface AssessmentFinding {
  id: string;
  assessmentId: string;
  controlId?: string;
  title: string;
  description: string;
  severity: FindingSeverity;
  status: FindingStatus;
  remediation?: string;
  dueDate?: Date;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Populated relationships
  control?: Control;
  assignee?: User;
}

export enum FindingSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM', 
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum FindingStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED'
}

// Request/Response types for API
export interface CreateRiskRequest {
  title: string;
  description: string;
  category: RiskCategory;
  likelihood: number;
  impact: number;
  owner?: string;
  dateIdentified?: Date;
}

export interface UpdateRiskRequest {
  title?: string;
  description?: string;
  category?: RiskCategory;
  likelihood?: number;
  impact?: number;
  owner?: string;
  status?: RiskStatus;
  nextReview?: Date;
}

export interface CreateControlRequest {
  title: string;
  description: string;
  type: ControlType;
  category?: ControlCategory;
  frequency: string;
  automationLevel?: AutomationLevel;
  owner?: string;
}

export interface UpdateControlRequest {
  title?: string;
  description?: string;
  type?: ControlType;
  category?: ControlCategory;
  frequency?: string;
  automationLevel?: AutomationLevel;
  effectiveness?: number;
  effectivenessRating?: EffectivenessRating;
  owner?: string;
  status?: ControlStatus;
  lastTestDate?: Date;
  nextTestDate?: Date;
  testResults?: string;
}

export interface CreateControlRiskMappingRequest {
  riskId: string;
  controlId: string;
  effectiveness?: number;
}

export interface CreateEvidenceRequest {
  assessmentId: string;
  controlId?: string;
  name: string;
  description?: string;
  evidenceType: string;
  fileUrl?: string;
}

// Query parameter types
export interface RiskQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: RiskCategory | RiskCategory[];
  status?: RiskStatus | RiskStatus[];
  owner?: string;
  riskLevel?: RiskLevel | RiskLevel[];
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ControlQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: ControlCategory;
  type?: ControlType;
  status?: ControlStatus;
  effectiveness?: EffectivenessRating;
  implementationStatus?: string;
  ownerId?: string;
  framework?: string;
  tags?: string[];
  createdAfter?: string;
  createdBefore?: string;
  reviewDue?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  skip?: number;
}

// Navigation and UI types
export interface NavigationContext {
  fromEntity?: 'risk' | 'control' | 'assessment';
  fromId?: string;
  maintainContext: boolean;
}

export interface AssessmentWorkflow {
  id: string;
  name: string;
  status: 'draft' | 'in_progress' | 'completed' | 'approved';
  steps: WorkflowStep[];
  relatedRisks: string[];
  relatedControls: string[];
  assignedTo?: string;
  dueDate?: Date;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'assessment' | 'review' | 'approval' | 'testing';
  status: 'pending' | 'in_progress' | 'completed';
  assignee?: string;
  dueDate?: Date;
  completedAt?: Date;
  notes?: string;
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  meta?: {
    filters?: Record<string, any>;
    sorts?: Record<string, 'asc' | 'desc'>;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: Record<string, any>;
}

// Effectiveness and Analytics types
export interface EffectivenessUpdate {
  riskId: string;
  controlId: string;
  effectiveness: number;
}

export interface RCSAAnalytics {
  totalRisks: number;
  risksByCategory: Record<RiskCategory, number>;
  risksByLevel: Record<RiskLevel, number>;
  totalControls: number;
  controlsByType: Record<ControlType, number>;
  controlsByStatus: Record<ControlStatus, number>;
  averageControlEffectiveness: number;
  riskCoverageScore: number;
  overdueTests: number;
  trendsData: {
    date: string;
    risksIdentified: number;
    controlsImplemented: number;
    averageEffectiveness: number;
  }[];
}

// Re-export common types that may be used
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId: string;
  permissions: string[];
  createdAt: Date;
  avatar?: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  content?: string;
  extractedText?: string;
  aiAnalysis?: Record<string, any>;
  uploadedAt: Date;
  organizationId: string;
  uploadedBy?: string;
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  entityType: string;
  entityId: string;
  parentId?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  assigneeId: string;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Activity {
  id: string;
  type: string;
  userId: string;
  entityType: string;
  entityId: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// Test Script interfaces
export interface TestStep {
  id: string;
  order: number;
  description: string;
  expectedResult: string;
  dataRequired?: string;
  notes?: string;
}

export interface TestScript {
  id: string;
  title: string;
  description: string;
  steps: TestStep[];
  expectedResults: string;
  testType: TestScriptType;
  frequency: TestFrequency;
  estimatedDuration?: number;
  automationCapable: boolean;
  automationScript?: string;
  tags: string[];
  organizationId: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  controls?: ControlTestScript[];
  testExecutions?: TestExecution[];
}

/**
 * Represents the many-to-many relationship between Controls and Test Scripts
 * This interface is used for both database relations and API responses
 */
export interface ControlTestScript {
  id: string;
  controlId: string;
  testScriptId: string;
  isMandatory: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations - can be either full objects or partial depending on context
  control?: Control | {
    id: string;
    title: string;
    type: ControlType;
    status: ControlStatus;
    category?: ControlCategory;
    effectiveness?: number;
  };
  testScript?: TestScript;
}

// Type alias for backward compatibility - will be deprecated
export type TestScriptControl = ControlTestScript;

export interface TestExecution {
  id: string;
  testScriptId: string;
  controlId: string;
  executedBy: string;
  executionDate: Date;
  status: TestStatus;
  results: TestResult[];
  evidence: string[];
  notes?: string;
  duration?: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  testScript?: TestScript;
  executor?: User;
}

export interface TestResult {
  stepId: string;
  status: 'passed' | 'failed' | 'skipped' | 'not_applicable';
  actualResult: string;
  notes?: string;
  evidence?: string[];
}

// Extended Control interface with test scripts
export interface ControlWithTestScripts extends Control {
  testScripts?: TestScript[];
}

// API Request/Response types for Test Scripts
export interface CreateTestScriptRequest {
  title: string;
  description: string;
  steps: Omit<TestStep, 'id'>[];
  expectedResults: string;
  testType: TestScriptType;
  frequency: TestFrequency;
  estimatedDuration?: number;
  automationCapable?: boolean;
  automationScript?: string;
  tags?: string[];
  controlIds?: string[]; // Controls to associate with
}

export interface UpdateTestScriptRequest {
  title?: string;
  description?: string;
  steps?: TestStep[];
  expectedResults?: string;
  testType?: TestScriptType;
  frequency?: TestFrequency;
  estimatedDuration?: number;
  automationCapable?: boolean;
  automationScript?: string;
  tags?: string[];
}

export interface TestScriptQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  testType?: TestScriptType | TestScriptType[];
  frequency?: TestFrequency | TestFrequency[];
  automationCapable?: boolean;
  controlId?: string;
  tags?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ExecuteTestRequest {
  testScriptId: string;
  controlId: string;
  results: TestResult[];
  evidence?: string[];
  notes?: string;
  duration?: number;
}

// AI Generation types
export interface GenerateTestScriptRequest {
  controlId: string;
  controlDescription?: string;
  testObjective?: string;
  additionalContext?: string;
}

export interface GenerateTestScriptResponse {
  testScript: Omit<TestScript, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>;
  confidence: number;
  reasoning: string;
  suggestions?: string[];
} 