// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'risk_manager' | 'auditor' | 'user';
  organizationId: string;
  permissions: string[];
  createdAt: string;
  lastLogin: string;
  avatar?: string;
  isOnline?: boolean;
}

// Risk Types
export type RiskCategory = 'OPERATIONAL' | 'FINANCIAL' | 'STRATEGIC' | 'COMPLIANCE' | 'TECHNOLOGY';

export interface Risk {
  id: string;
  title: string;
  description: string;
  category: RiskCategory;
  likelihood: number; // 1-5 scale
  impact: number; // 1-5 scale
  riskScore: number; // calculated
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  owner: string;
  status: 'identified' | 'assessed' | 'mitigated' | 'closed';
  controls: string[]; // control IDs
  linkedControls?: string[]; // alias for controls
  existingControls?: any[]; // for backwards compatibility
  evidence: Document[];
  createdAt: string;
  updatedAt: string;
  lastAssessed?: Date;
  dateIdentified?: Date | string;
  nextReview?: Date;
  aiConfidence?: number;
  comments?: Comment[];
  tasks?: string[]; // task IDs
}

export interface RiskFilters {
  category?: RiskCategory;
  status?: Risk['status'];
  owner?: string;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  search?: string;
}

export interface RiskControlMapping {
  id: string;
  riskId: string;
  controlId: string;
  effectiveness: 'high' | 'medium' | 'low';
  createdAt: string;
}

// Control Types
export interface Control {
  id: string;
  title: string;
  description: string;
  type: 'preventive' | 'detective' | 'corrective';
  effectiveness: 'high' | 'medium' | 'low' | number; // support both string and number
  owner: string;
  frequency: string;
  evidence: Document[];
  linkedRisks: string[]; // risk IDs
  status: 'active' | 'inactive' | 'planned';
  lastTestDate?: string;
  nextTestDate?: string;
  lastTested?: Date; // alias for lastTestDate
  nextTest?: Date; // alias for nextTestDate
  createdAt: string;
  updatedAt: string;
  comments?: Comment[];
  tasks?: string[]; // task IDs
}

export interface ControlFilters {
  type?: Control['type'];
  effectiveness?: Control['effectiveness'];
  status?: Control['status'];
  owner?: string;
  search?: string;
}

export interface ControlRiskMapping {
  controlId: string;
  riskId: string;
  effectivenessRating: number;
  lastTested: string;
  nextTestDue: string;
  evidence: Document[];
  mitigationImpact: number;
}

// Document Types
export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string; // base64 encoded
  extractedText?: string;
  aiAnalysis?: {
    risks: string[];
    controls: string[];
    confidence: number;
  };
  uploadedBy: string;
  uploadedAt: string;
  sharedWith?: string[]; // user IDs
  comments?: Comment[];
}

// Enhanced Questionnaire Types
export interface Question {
  id: string;
  text: string;
  type: 'text' | 'multiple_choice' | 'rating' | 'yes_no' | 'file_upload';
  options?: string[];
  required: boolean;
  conditional?: {
    dependsOn: string;
    showWhen: unknown;
  };
  aiGenerated?: boolean;
  order: number;
  category?: string;
  helpText?: string;
}

export interface Questionnaire {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  targetRoles: string[];
  status: 'draft' | 'active' | 'completed' | 'archived';
  responses: Response[];
  createdAt: string;
  dueDate: string;
  createdBy: string;
  tags?: string[];
  estimatedTime?: number; // minutes
  completionRate?: number;
  analytics?: QuestionnaireAnalytics;
}

export interface Response {
  id: string;
  questionId: string;
  userId: string;
  answer: string | string[] | number | boolean;
  createdAt: string;
  updatedAt?: string;
  fileAttachments?: Document[];
}

export interface QuestionnaireAnalytics {
  totalResponses: number;
  completionRate: number;
  averageTime: number;
  responsesByQuestion: Record<string, unknown>;
  trends: { date: string; responses: number }[];
}

// Workflow Management Types
export interface Workflow {
  id: string;
  name: string;
  description: string;
  type: 'approval' | 'review' | 'assessment' | 'custom';
  steps: WorkflowStep[];
  status: 'draft' | 'active' | 'completed' | 'archived';
  assignedTo: string[];
  createdAt: string;
  createdBy: string;
  completedAt?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
  relatedEntities?: {
    risks?: string[];
    controls?: string[];
    documents?: string[];
  };
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'approval' | 'review' | 'action' | 'notification';
  assignee: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'skipped';
  dueDate: string;
  completedAt?: string;
  completedBy?: string;
  comments?: string;
  order: number;
  conditions?: WorkflowCondition[];
  escalation?: EscalationRule;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains';
  value: unknown;
}

export interface EscalationRule {
  enabled: boolean;
  timeoutHours: number;
  escalateTo: string; // user ID
  notificationMessage?: string;
}

// Reporting Types
export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'executive_dashboard' | 'risk_register' | 'control_effectiveness' | 'compliance' | 'custom';
  sections: ReportSection[];
  parameters: ReportParameter[];
  schedule?: ScheduleConfig;
  createdBy: string;
  createdAt: string;
  isPublic: boolean;
  tags?: string[];
}

export interface ReportSection {
  id: string;
  name: string;
  type: 'chart' | 'table' | 'text' | 'metrics' | 'list';
  order: number;
  config: {
    dataSource: string;
    chartType?: 'bar' | 'line' | 'pie' | 'area' | 'scatter';
    filters?: Record<string, unknown>;
    columns?: string[];
    aggregation?: 'sum' | 'avg' | 'count' | 'max' | 'min';
  };
  styling?: {
    width?: string;
    height?: string;
    backgroundColor?: string;
  };
}

export interface ReportParameter {
  id: string;
  name: string;
  type: 'date' | 'select' | 'multiselect' | 'text' | 'number';
  required: boolean;
  defaultValue?: unknown;
  options?: { label: string; value: unknown }[];
}

export interface ScheduleConfig {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string; // HH:mm format
  recipients: string[]; // user IDs
  enabled: boolean;
}

export interface Report {
  id: string;
  templateId: string;
  title: string;
  type:
    | 'risk_assessment'
    | 'control_effectiveness'
    | 'compliance'
    | 'audit'
    | 'executive_dashboard';
  status: 'draft' | 'published' | 'archived';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  data: ReportData;
  parameters?: Record<string, unknown>;
  sharedWith?: string[];
  exportFormats?: ('pdf' | 'excel' | 'csv')[];
}

export interface ReportData {
  sections: {
    id: string;
    data: unknown;
    generatedAt: string;
  }[];
  metadata: {
    totalRecords: number;
    dateRange: { start: string; end: string };
    filters: Record<string, unknown>;
  };
}

// Collaboration Types
export interface Message {
  id: string;
  content: string;
  senderId: string;
  recipientIds: string[];
  type: 'direct' | 'group' | 'broadcast';
  status: 'sent' | 'delivered' | 'read';
  createdAt: string;
  updatedAt?: string;
  attachments?: Document[];
  threadId?: string;
  mentions?: string[]; // user IDs
  reactions?: MessageReaction[];
}

export interface MessageReaction {
  userId: string;
  emoji: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  entityType: 'risk' | 'control' | 'document' | 'task' | 'workflow';
  entityId: string;
  parentId?: string; // for threaded comments
  createdAt: string;
  updatedAt?: string;
  mentions?: string[]; // user IDs
  attachments?: Document[];
  reactions?: MessageReaction[];
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'mention' | 'task_assigned' | 'workflow_update';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  userId: string;
  actionUrl?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  priority?: 'low' | 'medium' | 'high';
}

// Task Management Types
export interface Task {
  id: string;
  title: string;
  description: string;
  type: 'risk_assessment' | 'control_testing' | 'document_review' | 'workflow_step' | 'custom';
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigneeId: string;
  assignedBy: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
  relatedEntities?: {
    risks?: string[];
    controls?: string[];
    workflows?: string[];
    documents?: string[];
  };
  subtasks?: SubTask[];
  comments?: Comment[];
  attachments?: Document[];
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
}

// Activity Feed Types
export interface Activity {
  id: string;
  type:
    | 'risk_created'
    | 'control_updated'
    | 'task_completed'
    | 'comment_added'
    | 'workflow_approved'
    | 'document_uploaded';
  userId: string;
  entityType: string;
  entityId: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  isPublic: boolean;
}

// State Management Types
export interface RiskState {
  risks: Risk[];
  selectedRisk: Risk | null;
  filters: RiskFilters;
  loading: boolean;
  error: string | null;
}

export interface ControlState {
  controls: Control[];
  selectedControl: Control | null;
  filters: ControlFilters;
  loading: boolean;
  error: string | null;
}

export interface DocumentState {
  documents: Document[];
  selectedDocument: Document | null;
  loading: boolean;
  error: string | null;
}

export interface QuestionnaireState {
  questionnaires: Questionnaire[];
  selectedQuestionnaire: Questionnaire | null;
  responses: Response[];
  analytics: Record<string, QuestionnaireAnalytics>;
  loading: boolean;
  error: string | null;
}

export interface WorkflowState {
  workflows: Workflow[];
  selectedWorkflow: Workflow | null;
  activeSteps: WorkflowStep[];
  loading: boolean;
  error: string | null;
}

export interface ReportState {
  reports: Report[];
  templates: ReportTemplate[];
  selectedReport: Report | null;
  selectedTemplate: ReportTemplate | null;
  loading: boolean;
  error: string | null;
}

export interface CollaborationState {
  messages: Message[];
  comments: Comment[];
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

export interface TaskState {
  tasks: Task[];
  selectedTask: Task | null;
  myTasks: Task[];
  overdueTasks: Task[];
  loading: boolean;
  error: string | null;
}

export interface ActivityState {
  activities: Activity[];
  loading: boolean;
  error: string | null;
}

export interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  notifications: Notification[];
  modals: ModalState;
  activeCollaborationPanel?: 'messages' | 'comments' | 'notifications';
}

export interface ModalState {
  isOpen: boolean;
  type: string | null;
  data: unknown;
}

export interface AppState {
  risks: RiskState;
  controls: ControlState;
  documents: DocumentState;
  questionnaires: QuestionnaireState;
  workflows: WorkflowState;
  reports: ReportState;
  collaboration: CollaborationState;
  tasks: TaskState;
  activities: ActivityState;
  ui: UIState;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresIn: number;
}

// AI Analysis Types
export interface AIAnalysisResponse {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results?: {
    identifiedRisks: Array<{
      text: string;
      confidence: number;
      category: RiskCategory;
    }>;
    suggestedControls: Array<{
      title: string;
      description: string;
      confidence: number;
    }>;
    documentSummary: string;
  };
  processingTime: number;
  error?: string;
}
