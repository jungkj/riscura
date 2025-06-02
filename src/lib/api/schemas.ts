import { z } from 'zod';

// Common schemas
export const idSchema = z.string().uuid('Invalid ID format');

export const paginationSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const searchSchema = z.object({
  search: z.string().optional(),
  sort: z.string().optional(),
});

// Risk schemas
export const createRiskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(2000, 'Description too long').optional(),
  category: z.enum(['operational', 'strategic', 'financial', 'compliance', 'technology', 'reputational', 'other']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  likelihood: z.enum(['very_low', 'low', 'medium', 'high', 'very_high']),
  impact: z.enum(['very_low', 'low', 'medium', 'high', 'very_high']),
  status: z.enum(['identified', 'assessed', 'treatment_planned', 'treatment_implemented', 'monitored', 'closed']).default('identified'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  tags: z.array(z.string()).optional().default([]),
  ownerId: z.string().uuid('Invalid owner ID').optional(),
  reviewDate: z.string().datetime().optional(),
  mitigationStrategy: z.string().max(2000).optional(),
  residualRisk: z.enum(['very_low', 'low', 'medium', 'high', 'very_high']).optional(),
  businessUnit: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  location: z.string().max(100).optional(),
  customFields: z.record(z.any()).optional().default({}),
});

export const updateRiskSchema = createRiskSchema.partial();

export const riskQuerySchema = paginationSchema.extend({
  ...searchSchema.shape,
  category: z.string().optional(),
  severity: z.string().optional(),
  likelihood: z.string().optional(),
  impact: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  ownerId: z.string().optional(),
  businessUnit: z.string().optional(),
  department: z.string().optional(),
  tags: z.string().optional(), // Comma-separated tags
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

// Control schemas
export const createControlSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(2000, 'Description too long').optional(),
  controlType: z.enum(['preventive', 'detective', 'corrective', 'directive', 'compensating']),
  category: z.enum(['technical', 'administrative', 'physical', 'operational', 'management']),
  frequency: z.enum(['continuous', 'daily', 'weekly', 'monthly', 'quarterly', 'annually', 'ad_hoc']),
  automationLevel: z.enum(['manual', 'semi_automated', 'fully_automated']),
  effectiveness: z.enum(['not_effective', 'partially_effective', 'largely_effective', 'fully_effective']).optional(),
  status: z.enum(['planned', 'implemented', 'testing', 'operational', 'remediation', 'disabled']).default('planned'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  ownerId: z.string().uuid('Invalid owner ID').optional(),
  operatorId: z.string().uuid('Invalid operator ID').optional(),
  reviewerId: z.string().uuid('Invalid reviewer ID').optional(),
  lastTestDate: z.string().datetime().optional(),
  nextTestDate: z.string().datetime().optional(),
  testResults: z.string().max(1000).optional(),
  riskIds: z.array(z.string().uuid()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  businessUnit: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  location: z.string().max(100).optional(),
  cost: z.number().min(0).optional(),
  effort: z.enum(['low', 'medium', 'high']).optional(),
  customFields: z.record(z.any()).optional().default({}),
});

export const updateControlSchema = createControlSchema.partial();

export const controlQuerySchema = paginationSchema.extend({
  ...searchSchema.shape,
  controlType: z.string().optional(),
  category: z.string().optional(),
  frequency: z.string().optional(),
  automationLevel: z.string().optional(),
  effectiveness: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  ownerId: z.string().optional(),
  operatorId: z.string().optional(),
  reviewerId: z.string().optional(),
  riskId: z.string().optional(),
  businessUnit: z.string().optional(),
  department: z.string().optional(),
  tags: z.string().optional(),
  testDue: z.string().optional(), // 'overdue', 'due_soon', 'upcoming'
});

// Document schemas
export const createDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  category: z.enum(['policy', 'procedure', 'guideline', 'form', 'report', 'evidence', 'other']),
  type: z.enum(['internal', 'external', 'regulatory', 'standard']),
  status: z.enum(['draft', 'review', 'approved', 'published', 'archived', 'expired']).default('draft'),
  version: z.string().max(20).default('1.0'),
  ownerId: z.string().uuid('Invalid owner ID').optional(),
  approvedById: z.string().uuid('Invalid approver ID').optional(),
  reviewDate: z.string().datetime().optional(),
  expiryDate: z.string().datetime().optional(),
  tags: z.array(z.string()).optional().default([]),
  riskIds: z.array(z.string().uuid()).optional().default([]),
  controlIds: z.array(z.string().uuid()).optional().default([]),
  businessUnit: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  confidentiality: z.enum(['public', 'internal', 'confidential', 'restricted']).default('internal'),
  customFields: z.record(z.any()).optional().default({}),
});

export const updateDocumentSchema = createDocumentSchema.partial();

export const documentQuerySchema = paginationSchema.extend({
  ...searchSchema.shape,
  category: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  ownerId: z.string().optional(),
  approvedById: z.string().optional(),
  businessUnit: z.string().optional(),
  department: z.string().optional(),
  confidentiality: z.string().optional(),
  tags: z.string().optional(),
  riskId: z.string().optional(),
  controlId: z.string().optional(),
  expiryFrom: z.string().datetime().optional(),
  expiryTo: z.string().datetime().optional(),
});

// File upload schema
export const fileUploadSchema = z.object({
  file: z.any(), // File object handled separately
  documentId: z.string().uuid().optional(),
  category: z.string().optional(),
  description: z.string().max(500).optional(),
});

// Questionnaire schemas
export const createQuestionnaireSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  category: z.enum(['risk_assessment', 'control_testing', 'compliance', 'audit', 'survey', 'other']),
  type: z.enum(['risk_evaluation', 'control_effectiveness', 'compliance_check', 'vendor_assessment', 'self_assessment']),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'archived']).default('draft'),
  ownerId: z.string().uuid('Invalid owner ID').optional(),
  assigneeIds: z.array(z.string().uuid()).optional().default([]),
  dueDate: z.string().datetime().optional(),
  instructions: z.string().max(2000).optional(),
  estimatedDuration: z.number().min(1).max(480).optional(), // Minutes
  isAnonymous: z.boolean().default(false),
  allowPartialSave: z.boolean().default(true),
  randomizeQuestions: z.boolean().default(false),
  tags: z.array(z.string()).optional().default([]),
  riskIds: z.array(z.string().uuid()).optional().default([]),
  controlIds: z.array(z.string().uuid()).optional().default([]),
  customFields: z.record(z.any()).optional().default({}),
});

export const updateQuestionnaireSchema = createQuestionnaireSchema.partial();

export const questionnaireQuerySchema = paginationSchema.extend({
  ...searchSchema.shape,
  category: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  ownerId: z.string().optional(),
  assigneeId: z.string().optional(),
  tags: z.string().optional(),
  dueDateFrom: z.string().datetime().optional(),
  dueDateTo: z.string().datetime().optional(),
});

// Workflow schemas
export const createWorkflowSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  category: z.enum(['risk_management', 'control_testing', 'document_approval', 'incident_response', 'compliance', 'other']),
  type: z.enum(['approval', 'review', 'assessment', 'remediation', 'monitoring']),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'cancelled']).default('draft'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  ownerId: z.string().uuid('Invalid owner ID').optional(),
  assigneeIds: z.array(z.string().uuid()).optional().default([]),
  approverIds: z.array(z.string().uuid()).optional().default([]),
  dueDate: z.string().datetime().optional(),
  startDate: z.string().datetime().optional(),
  estimatedDuration: z.number().min(1).optional(), // Days
  actualDuration: z.number().min(0).optional(), // Days
  tags: z.array(z.string()).optional().default([]),
  riskIds: z.array(z.string().uuid()).optional().default([]),
  controlIds: z.array(z.string().uuid()).optional().default([]),
  documentIds: z.array(z.string().uuid()).optional().default([]),
  customFields: z.record(z.any()).optional().default({}),
});

export const updateWorkflowSchema = createWorkflowSchema.partial();

export const workflowQuerySchema = paginationSchema.extend({
  ...searchSchema.shape,
  category: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  ownerId: z.string().optional(),
  assigneeId: z.string().optional(),
  approverId: z.string().optional(),
  tags: z.string().optional(),
  dueDateFrom: z.string().datetime().optional(),
  dueDateTo: z.string().datetime().optional(),
  overdue: z.string().optional(), // 'true' or 'false'
});

// Report schemas
export const createReportSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  category: z.enum(['risk_register', 'control_status', 'compliance', 'audit', 'dashboard', 'custom']),
  type: z.enum(['summary', 'detailed', 'executive', 'operational', 'regulatory']),
  format: z.enum(['pdf', 'excel', 'csv', 'json', 'html']).default('pdf'),
  status: z.enum(['draft', 'generating', 'ready', 'published', 'archived', 'failed']).default('draft'),
  schedule: z.enum(['manual', 'daily', 'weekly', 'monthly', 'quarterly', 'annually']).default('manual'),
  ownerId: z.string().uuid('Invalid owner ID').optional(),
  recipientIds: z.array(z.string().uuid()).optional().default([]),
  filters: z.record(z.any()).optional().default({}),
  parameters: z.record(z.any()).optional().default({}),
  tags: z.array(z.string()).optional().default([]),
  isPublic: z.boolean().default(false),
  expiryDate: z.string().datetime().optional(),
  customFields: z.record(z.any()).optional().default({}),
});

export const updateReportSchema = createReportSchema.partial();

export const reportQuerySchema = paginationSchema.extend({
  ...searchSchema.shape,
  category: z.string().optional(),
  type: z.string().optional(),
  format: z.string().optional(),
  status: z.string().optional(),
  schedule: z.string().optional(),
  ownerId: z.string().optional(),
  tags: z.string().optional(),
  isPublic: z.string().optional(),
});

// Bulk operation schemas
export const bulkOperationSchema = z.object({
  operation: z.enum(['update', 'delete', 'archive', 'export']),
  ids: z.array(z.string().uuid()).min(1, 'At least one ID is required'),
  data: z.record(z.any()).optional(), // For bulk updates
  confirm: z.boolean().default(false), // Confirmation for destructive operations
});

// Analytics schemas
export const analyticsQuerySchema = z.object({
  entity: z.enum(['risks', 'controls', 'documents', 'questionnaires', 'workflows', 'reports']),
  metric: z.enum(['count', 'trend', 'distribution', 'performance', 'summary']),
  period: z.enum(['day', 'week', 'month', 'quarter', 'year']).default('month'),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  groupBy: z.string().optional(),
  filters: z.record(z.any()).optional().default({}),
});

// Export schemas
export const exportSchema = z.object({
  entity: z.enum(['risks', 'controls', 'documents', 'questionnaires', 'workflows', 'reports']),
  format: z.enum(['csv', 'excel', 'pdf', 'json']),
  filters: z.record(z.any()).optional().default({}),
  fields: z.array(z.string()).optional(), // Specific fields to export
  includeRelated: z.boolean().default(false), // Include related entities
});

// API Key schemas
export const createApiKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  permissions: z.array(z.string()).min(1, 'At least one permission is required'),
  expiresAt: z.string().datetime().optional(),
  ipWhitelist: z.array(z.string()).optional().default([]),
  isActive: z.boolean().default(true),
});

export const updateApiKeySchema = createApiKeySchema.partial().omit({ permissions: true });

export const apiKeyQuerySchema = paginationSchema.extend({
  ...searchSchema.shape,
  isActive: z.string().optional(),
  expiryFrom: z.string().datetime().optional(),
  expiryTo: z.string().datetime().optional(),
});

// Activity/Audit schemas
export const activityQuerySchema = paginationSchema.extend({
  ...searchSchema.shape,
  type: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  userId: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  ipAddress: z.string().optional(),
});

// Common response schemas
export const successResponseSchema = z.object({
  success: z.literal(true),
  data: z.any(),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    pages: z.number(),
  }).optional(),
  meta: z.object({
    requestId: z.string(),
    timestamp: z.string(),
    version: z.string(),
  }).optional(),
});

export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
    details: z.any().optional(),
  }),
  meta: z.object({
    requestId: z.string(),
    timestamp: z.string(),
    version: z.string(),
  }).optional(),
});

// Health check schema
export const healthCheckSchema = z.object({
  status: z.enum(['ok', 'warning', 'error']),
  timestamp: z.string(),
  version: z.string(),
  services: z.record(z.object({
    status: z.enum(['ok', 'warning', 'error']),
    message: z.string().optional(),
    responseTime: z.number().optional(),
  })).optional(),
}); 