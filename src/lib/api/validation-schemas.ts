import { z } from 'zod';

// Common validation schemas
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc')
});

export const SearchSchema = z.object({
  search: z.string().min(1).max(255).optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  tags: z.array(z.string()).optional()
});

export const IdSchema = z.object({
  id: z.string().uuid('Invalid ID format')
});

// Authentication schemas
export const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional()
});

export const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Password must contain uppercase, lowercase, number and special character'),
  confirmPassword: z.string(),
  organizationName: z.string().min(2).max(100).optional(),
  role: z.enum(['USER', 'ADMIN', 'RISK_MANAGER', 'AUDITOR']).default('USER'),
  acceptTerms: z.boolean().refine(val => val === true, 'Must accept terms and conditions')
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Password must contain uppercase, lowercase, number and special character'),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

// Risk schemas
export const RiskCreateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  category: z.enum([
    'OPERATIONAL', 'FINANCIAL', 'STRATEGIC', 'COMPLIANCE', 'TECHNOLOGY', 
    'REPUTATIONAL', 'MARKET', 'CREDIT', 'LIQUIDITY', 'ENVIRONMENTAL'
  ]),
  likelihood: z.number().int().min(1).max(5),
  impact: z.number().int().min(1).max(5),
  riskOwner: z.string().uuid().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  dueDate: z.string().datetime().optional(),
  linkedControls: z.array(z.string().uuid()).optional(),
  metadata: z.record(z.any()).optional()
});

export const RiskUpdateSchema = RiskCreateSchema.partial().extend({
  id: z.string().uuid()
});

export const RiskFilterSchema = z.object({
  category: z.enum([
    'OPERATIONAL', 'FINANCIAL', 'STRATEGIC', 'COMPLIANCE', 'TECHNOLOGY', 
    'REPUTATIONAL', 'MARKET', 'CREDIT', 'LIQUIDITY', 'ENVIRONMENTAL'
  ]).optional(),
  likelihood: z.object({
    min: z.number().int().min(1).max(5).optional(),
    max: z.number().int().min(1).max(5).optional()
  }).optional(),
  impact: z.object({
    min: z.number().int().min(1).max(5).optional(),
    max: z.number().int().min(1).max(5).optional()
  }).optional(),
  riskScore: z.object({
    min: z.number().int().min(1).max(25).optional(),
    max: z.number().int().min(1).max(25).optional()
  }).optional(),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  owner: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  dateRange: z.object({
    start: z.string().datetime().optional(),
    end: z.string().datetime().optional()
  }).optional()
});

// Control schemas
export const ControlCreateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  type: z.enum(['PREVENTIVE', 'DETECTIVE', 'CORRECTIVE', 'DIRECTIVE', 'COMPENSATING']),
  frequency: z.enum(['CONTINUOUS', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY', 'AD_HOC']),
  effectiveness: z.union([
    z.enum(['LOW', 'MEDIUM', 'HIGH']),
    z.number().min(0).max(100)
  ]),
  owner: z.string().uuid().optional(),
  implementationDate: z.string().datetime().optional(),
  lastTested: z.string().datetime().optional(),
  nextTestDate: z.string().datetime().optional(),
  linkedRisks: z.array(z.string().uuid()).optional(),
  evidence: z.array(z.string()).optional(),
  cost: z.number().min(0).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  metadata: z.record(z.any()).optional()
});

export const ControlUpdateSchema = ControlCreateSchema.partial().extend({
  id: z.string().uuid()
});

export const ControlFilterSchema = z.object({
  type: z.enum(['PREVENTIVE', 'DETECTIVE', 'CORRECTIVE', 'DIRECTIVE', 'COMPENSATING']).optional(),
  frequency: z.enum(['CONTINUOUS', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY', 'AD_HOC']).optional(),
  effectiveness: z.union([
    z.enum(['LOW', 'MEDIUM', 'HIGH']),
    z.object({
      min: z.number().min(0).max(100).optional(),
      max: z.number().min(0).max(100).optional()
    })
  ]).optional(),
  owner: z.string().uuid().optional(),
  testingStatus: z.enum(['CURRENT', 'OVERDUE', 'NEVER_TESTED']).optional(),
  linkedRisks: z.array(z.string().uuid()).optional(),
  tags: z.array(z.string()).optional()
});

// Assessment schemas
export const AssessmentCreateSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(255),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  assessmentType: z.enum(['SELF', 'THIRD_PARTY', 'REGULATORY']),
  framework: z.enum(['COSO', 'ISO31000', 'NIST']),
  scope: z.string().min(3, 'Scope must be at least 3 characters').max(500),
  dueDate: z.string().datetime().optional(),
  stakeholders: z.array(z.string().uuid()).optional(),
  riskCategories: z.array(z.enum([
    'OPERATIONAL', 'FINANCIAL', 'STRATEGIC', 'COMPLIANCE', 'TECHNOLOGY', 
    'REPUTATIONAL', 'MARKET', 'CREDIT', 'LIQUIDITY', 'ENVIRONMENTAL'
  ])).optional(),
  complianceFrameworks: z.array(z.string()).optional(),
  documents: z.array(z.object({
    name: z.string().min(1).max(255),
    type: z.string().min(1).max(100),
    content: z.string().min(1)
  })).optional()
});

export const AssessmentUpdateSchema = z.object({
  name: z.string().min(3).max(255).optional(),
  description: z.string().min(10).max(2000).optional(),
  scope: z.string().min(3).max(500).optional(),
  status: z.enum(['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED']).optional(),
  progress: z.number().min(0).max(100).optional(),
  dueDate: z.string().datetime().optional(),
  results: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional()
});

export const AssessmentExecuteSchema = z.object({
  includeQuantitative: z.boolean().default(false),
  includeCorrelation: z.boolean().default(false),
  targetMaturity: z.number().int().min(1).max(5).default(3),
  analysisOptions: z.object({
    riskScoring: z.boolean().default(true),
    controlEffectiveness: z.boolean().default(true),
    complianceGaps: z.boolean().default(true),
    recommendations: z.boolean().default(true)
  }).optional()
});

export const AssessmentFilterSchema = z.object({
  status: z.enum(['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED']).optional(),
  framework: z.enum(['COSO', 'ISO31000', 'NIST']).optional(),
  assessmentType: z.enum(['SELF', 'THIRD_PARTY', 'REGULATORY']).optional(),
  dateRange: z.object({
    start: z.string().datetime().optional(),
    end: z.string().datetime().optional()
  }).optional(),
  createdBy: z.string().uuid().optional()
});

// Document schemas
export const DocumentUploadSchema = z.object({
  file: z.instanceof(File).refine(
    file => file.size <= 50 * 1024 * 1024, // 50MB
    'File size must be less than 50MB'
  ).refine(
    file => [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv'
    ].includes(file.type),
    'File type not supported'
  ),
  assessmentId: z.string().uuid().optional(),
  riskId: z.string().uuid().optional(),
  controlId: z.string().uuid().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  description: z.string().max(500).optional()
});

export const DocumentAnalysisSchema = z.object({
  documentId: z.string().uuid(),
  analysisType: z.enum(['RISK_EXTRACTION', 'CONTROL_MAPPING', 'COMPLIANCE_CHECK']),
  options: z.object({
    extractRisks: z.boolean().default(true),
    mapControls: z.boolean().default(true),
    identifyGaps: z.boolean().default(true),
    generateRecommendations: z.boolean().default(true)
  }).optional()
});

// Report schemas
export const ReportGenerateSchema = z.object({
  assessmentId: z.string().uuid(),
  templateId: z.string().optional(),
  format: z.enum(['PDF', 'HTML', 'DOCX', 'EXCEL']).default('PDF'),
  audience: z.enum(['EXECUTIVE', 'MANAGEMENT', 'TECHNICAL', 'REGULATORY']).default('EXECUTIVE'),
  includeSections: z.array(z.string()).optional(),
  excludeSections: z.array(z.string()).optional(),
  customizations: z.object({
    logo: z.string().url().optional(),
    branding: z.record(z.any()).optional(),
    footer: z.string().max(500).optional(),
    watermark: z.string().max(100).optional()
  }).optional()
});

// User and organization schemas
export const UserUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(['USER', 'ADMIN', 'RISK_MANAGER', 'AUDITOR']).optional(),
  preferences: z.record(z.any()).optional(),
  isActive: z.boolean().optional()
});

export const OrganizationUpdateSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  industry: z.string().max(100).optional(),
  size: z.enum(['SMALL', 'MEDIUM', 'LARGE']).optional(),
  settings: z.record(z.any()).optional(),
  riskAppetite: z.record(z.number().min(0).max(25)).optional(),
  riskTolerance: z.record(z.number().min(0).max(25)).optional()
});

// File upload schemas
export const FileUploadSchema = z.object({
  file: z.instanceof(File).refine(
    file => file.size <= 100 * 1024 * 1024, // 100MB
    'File size must be less than 100MB'
  ),
  type: z.enum(['DOCUMENT', 'IMAGE', 'SPREADSHEET', 'PRESENTATION']),
  folder: z.string().max(255).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  description: z.string().max(1000).optional(),
  isPublic: z.boolean().default(false)
});

// Bulk operation schemas
export const BulkRiskUpdateSchema = z.object({
  riskIds: z.array(z.string().uuid()).min(1).max(100),
  updates: z.object({
    likelihood: z.number().int().min(1).max(5).optional(),
    impact: z.number().int().min(1).max(5).optional(),
    category: z.enum([
      'OPERATIONAL', 'FINANCIAL', 'STRATEGIC', 'COMPLIANCE', 'TECHNOLOGY', 
      'REPUTATIONAL', 'MARKET', 'CREDIT', 'LIQUIDITY', 'ENVIRONMENTAL'
    ]).optional(),
    owner: z.string().uuid().optional(),
    tags: z.array(z.string().max(50)).max(10).optional()
  }).refine(data => Object.keys(data).length > 0, 'At least one update field is required')
});

export const BulkControlUpdateSchema = z.object({
  controlIds: z.array(z.string().uuid()).min(1).max(100),
  updates: z.object({
    effectiveness: z.union([
      z.enum(['LOW', 'MEDIUM', 'HIGH']),
      z.number().min(0).max(100)
    ]).optional(),
    frequency: z.enum(['CONTINUOUS', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY', 'AD_HOC']).optional(),
    owner: z.string().uuid().optional(),
    tags: z.array(z.string().max(50)).max(10).optional(),
    lastTested: z.string().datetime().optional(),
    nextTestDate: z.string().datetime().optional()
  }).refine(data => Object.keys(data).length > 0, 'At least one update field is required')
});

// Export/Import schemas
export const ExportSchema = z.object({
  type: z.enum(['RISKS', 'CONTROLS', 'ASSESSMENTS', 'ALL']),
  format: z.enum(['CSV', 'EXCEL', 'JSON']),
  filters: z.record(z.any()).optional(),
  includeRelated: z.boolean().default(false)
});

export const ImportSchema = z.object({
  file: z.instanceof(File).refine(
    file => ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/json'].includes(file.type),
    'File must be CSV, Excel, or JSON format'
  ),
  type: z.enum(['RISKS', 'CONTROLS', 'ASSESSMENTS']),
  options: z.object({
    skipDuplicates: z.boolean().default(true),
    updateExisting: z.boolean().default(false),
    validateData: z.boolean().default(true),
    dryRun: z.boolean().default(false)
  }).optional()
});

// Query parameter schemas for different endpoints
export const RiskQuerySchema = PaginationSchema.merge(SearchSchema).merge(RiskFilterSchema);
export const ControlQuerySchema = PaginationSchema.merge(SearchSchema).merge(ControlFilterSchema);
export const AssessmentQuerySchema = PaginationSchema.merge(SearchSchema).merge(AssessmentFilterSchema);

// Headers schema for API versioning
export const ApiHeadersSchema = z.object({
  'x-api-version': z.string().optional(),
  'accept-version': z.string().optional(),
  'x-request-id': z.string().uuid().optional(),
  'authorization': z.string().optional(),
  'content-type': z.string().optional()
});

// Validation utilities
export function parseAndValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): { success: true; data: T } | { success: false; errors: z.ZodIssue[] } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.issues };
    }
    throw error;
  }
}

export function validateQueryParams<T>(
  schema: z.ZodSchema<T>,
  searchParams: URLSearchParams
): { success: true; data: T } | { success: false; errors: z.ZodIssue[] } {
  const queryObj: Record<string, any> = {};
  
  for (const [key, value] of searchParams.entries()) {
    // Handle array parameters (e.g., tags[]=value1&tags[]=value2)
    if (key.endsWith('[]')) {
      const arrayKey = key.slice(0, -2);
      if (!queryObj[arrayKey]) {
        queryObj[arrayKey] = [];
      }
      queryObj[arrayKey].push(value);
    }
    // Handle nested object parameters (e.g., filter[category]=OPERATIONAL)
    else if (key.includes('[') && key.includes(']')) {
      const match = key.match(/^([^[]+)\[([^\]]+)\]$/);
      if (match) {
        const [, objectKey, subKey] = match;
        if (!queryObj[objectKey]) {
          queryObj[objectKey] = {};
        }
        queryObj[objectKey][subKey] = value;
      }
    }
    // Handle simple parameters
    else {
      queryObj[key] = value;
    }
  }
  
  return parseAndValidate(schema, queryObj, 'query parameters');
}

export function formatValidationErrors(errors: z.ZodIssue[]): Array<{ field: string; message: string; code: string }> {
  return errors.map(error => ({
    field: error.path.join('.'),
    message: error.message,
    code: error.code
  }));
} 