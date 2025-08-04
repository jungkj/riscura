import { z } from 'zod';

// Common schemas
export const idSchema = z.string().uuid('Invalid ID format')

export const paginationSchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
});

export const sortingSchema = z.object({
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const searchSchema = z.object({
  search: z.string().optional(),
});

// Risk schemas
export const createRiskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string(),
  likelihood: z.number().min(1).max(5),
  impact: z.number().min(1).max(5),
  status: z.string().optional(),
  owner: z.string().optional(),
  dateIdentified: z.string().optional(),
  nextReview: z.string().optional(),
})

export const updateRiskSchema = createRiskSchema.partial();
export const riskUpdateSchema = updateRiskSchema; // Alias for backward compatibility

export const riskQuerySchema = z.object({
  ...paginationSchema.shape,
  ...sortingSchema.shape,
  ...searchSchema.shape,
  category: z.union([z.string(), z.array(z.string())]).optional(),
  status: z.union([z.string(), z.array(z.string())]).optional(),
  severity: z.string().optional(),
  ownerId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

// Control schemas
export const createControlSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string(),
  type: z.string(),
  status: z.string().optional(),
  effectiveness: z.string().optional(),
  frequency: z.string().optional(),
  owner: z.string().optional(),
})

export const updateControlSchema = createControlSchema.partial();

export const controlQuerySchema = z
  .object({
    ...paginationSchema.shape,
    ...sortingSchema.shape,
    ...searchSchema.shape,
    controlType: z.string().optional(),
    category: z.string().optional(),
    status: z.string().optional(),
    effectiveness: z.string().optional(),
    frequency: z.string().optional(),
    ownerId: z.string().optional(),
    riskId: z.string().optional(),
    testDue: z.enum(['overdue', 'due_soon', 'upcoming']).optional(),
    // Enhanced filtering fields
    type: z.string().optional(),
    implementationStatus: z.string().optional(),
    framework: z.string().optional(),
    tags: z.array(z.string()).optional(),
    createdAfter: z.string().datetime().optional(),
    createdBefore: z.string().datetime().optional(),
    reviewDue: z.boolean().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  })
  .transform((data) => ({
    ...data,
    skip: (parseInt(data.page) - 1) * parseInt(data.limit),
    limit: parseInt(data.limit),
  }))

export const controlCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  controlId: z.string().optional(),
  category: z.enum(['TECHNICAL', 'ADMINISTRATIVE', 'PHYSICAL', 'OPERATIONAL', 'MANAGEMENT']),
  type: z.enum(['PREVENTIVE', 'DETECTIVE', 'CORRECTIVE', 'DIRECTIVE', 'COMPENSATING']),
  status: z
    .enum(['PLANNED', 'IMPLEMENTED', 'TESTING', 'OPERATIONAL', 'REMEDIATION', 'DISABLED'])
    .default('PLANNED'),
  implementationStatus: z
    .enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'])
    .default('NOT_STARTED'),
  effectiveness: z.number().min(0).max(100).optional(),
  frequency: z
    .enum(['CONTINUOUS', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY'])
    .optional(),
  automationLevel: z.enum(['MANUAL', 'SEMI_AUTOMATED', 'FULLY_AUTOMATED']).default('MANUAL'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  effort: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  cost: z.number().min(0).optional(),
  ownerId: z.string().uuid().optional(),
  tags: z.array(z.string()).default([]),
  nextReviewDate: z.string().datetime().optional(),
  implementationDate: z.string().datetime().optional(),
  lastTestedDate: z.string().datetime().optional(),
  nextTestDate: z.string().datetime().optional(),
  evidence: z.string().optional(),
  notes: z.string().optional(),
});

export const controlUpdateSchema = controlCreateSchema.partial();

export const controlBulkSchema = z.object({
  create: z.array(controlCreateSchema).optional(),
  update: z
    .array(
      z
        .object({
          id: z.string().uuid(),
        })
        .merge(controlUpdateSchema)
    )
    .optional(),
  delete: z.array(z.string().uuid()).optional(),
});

// Document schemas
export const createDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string(),
  status: z.string().optional(),
  version: z.string().optional(),
  tags: z.array(z.string()).optional(),
  confidentiality: z.string().optional(),
  reviewDate: z.string().optional(),
  linkedRiskIds: z.array(z.string()).optional(),
  linkedControlIds: z.array(z.string()).optional(),
})

export const updateDocumentSchema = createDocumentSchema.partial();

export const documentQuerySchema = z.object({
  ...paginationSchema.shape,
  ...sortingSchema.shape,
  ...searchSchema.shape,
  category: z.union([z.string(), z.array(z.string())]).optional(),
  status: z.union([z.string(), z.array(z.string())]).optional(),
  type: z.string().optional(),
  ownerId: z.string().optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  expiryFrom: z.string().optional(),
  expiryTo: z.string().optional(),
});

// File upload schema
export const fileUploadSchema = z.object({
  file: z.any(), // File object handled separately
  documentId: z.string().uuid().optional(),
  category: z.string().optional(),
  description: z.string().max(500).optional(),
})

// Questionnaire schemas
export const createQuestionnaireSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  category: z.enum([
    'risk_assessment',
    'control_testing',
    'compliance',
    'audit',
    'survey',
    'other',
  ]),
  type: z.enum([
    'risk_evaluation',
    'control_effectiveness',
    'compliance_check',
    'vendor_assessment',
    'self_assessment',
  ]),
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
})

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
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.string(),
  status: z.string().optional(),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
})

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
  title: z.string().min(1, 'Title is required'),
  type: z.string(),
  parameters: z.record(z.any()).optional(),
  sharedWith: z.array(z.string()).optional(),
  exportFormats: z.array(z.string()).optional(),
})

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
  action: z.enum(['update', 'delete', 'archive', 'export']),
  entityType: z.string(),
  entityIds: z.array(z.string()),
  data: z.record(z.any()).optional(),
  confirm: z.boolean().default(false),
})

// Analytics schemas
export const analyticsQuerySchema = z.object({
  entity: z.enum(['risks', 'controls', 'documents', 'questionnaires', 'workflows', 'reports']),
  metric: z.enum(['count', 'trend', 'distribution', 'performance', 'summary']),
  period: z.enum(['day', 'week', 'month', 'quarter', 'year']).default('month'),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  groupBy: z.string().optional(),
  filters: z.record(z.any()).optional().default({}),
})

// Export schemas
export const exportSchema = z.object({
  entityType: z.string(),
  format: z.enum(['csv', 'xlsx', 'pdf', 'json']),
  filters: z.record(z.any()).optional(),
  includeRelated: z.boolean().optional().default(false),
})

// API Key schemas
export const createApiKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  permissions: z.array(z.string()).min(1, 'At least one permission is required'),
  expiresAt: z.string().datetime().optional(),
  ipWhitelist: z.array(z.string()).optional().default([]),
  isActive: z.boolean().default(true),
})

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
})

// Common response schemas
export const successResponseSchema = z.object({
  success: z.literal(true),
  data: z.any(),
  pagination: z
    .object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      pages: z.number(),
    })
    .optional(),
  meta: z
    .object({
      requestId: z.string(),
      timestamp: z.string(),
      version: z.string(),
    })
    .optional(),
})

export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
    details: z.any().optional(),
  }),
  meta: z
    .object({
      requestId: z.string(),
      timestamp: z.string(),
      version: z.string(),
    })
    .optional(),
});

// Health check schema
export const healthCheckSchema = z.object({
  status: z.enum(['ok', 'warning', 'error']),
  timestamp: z.string(),
  version: z.string(),
  services: z
    .record(
      z.object({
        status: z.enum(['ok', 'warning', 'error']),
        message: z.string().optional(),
        responseTime: z.number().optional(),
      })
    )
    .optional(),
})

// Validation helpers
export function validatePagination(params: URLSearchParams) {
  const page = Math.max(1, parseInt(params.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(params.get('limit') || '10')));
  const skip = (page - 1) * limit;
  return { page, limit, skip, take: limit }
}

export function validateSorting(params: URLSearchParams, allowedFields: string[] = []) {
  const sort = params.get('sort') || 'createdAt';
  const order = params.get('order') === 'asc' ? 'asc' : 'desc';

  // Validate sort field if allowed fields are specified
  if (allowedFields.length > 0 && !allowedFields.includes(sort)) {
    return { [allowedFields[0]]: order }
  }

  return { [sort]: order }
}

export function validateSearch(params: URLSearchParams) {
  return params.get('search') || undefined;
}
