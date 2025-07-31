/**
 * API Documentation Registry
 * Pre-registers all known API endpoints with their documentation
 */

import { apiRegistry, APIEndpointInfo } from './documentation';

// ============================================================================
// AUTHENTICATION ENDPOINTS
// ============================================================================

apiRegistry.registerEndpoint({
  path: '/api/auth/login',
  method: 'POST',
  summary: 'User Login',
  description: 'Authenticate a user with email and password',
  tags: ['Authentication'],
  operationId: 'loginUser',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'user@example.com',
            },
            password: {
              type: 'string',
              minLength: 8,
              description: 'User password',
              example: 'securePassword123',
            },
            remember: {
              type: 'boolean',
              description: 'Remember user login',
              default: false,
            },
          },
        },
      },
    },
  },
  responses: {
    '200': {
      description: 'Login successful',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              data: {
                type: 'object',
                properties: {
                  user: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      email: { type: 'string' },
                      name: { type: 'string' },
                      role: { type: 'string' },
                      organizationId: { type: 'string' },
                    },
                  },
                  token: { type: 'string' },
                  expiresAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
      },
    },
    '401': { $ref: '#/components/responses/Unauthorized' },
    '429': { $ref: '#/components/responses/RateLimitExceeded' },
  },
  rateLimits: {
    requests: 5,
    window: '15m',
  },
});

apiRegistry.registerEndpoint({
  path: '/api/auth/register',
  method: 'POST',
  summary: 'User Registration',
  description: 'Register a new user account',
  tags: ['Authentication'],
  operationId: 'registerUser',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['email', 'password', 'name', 'organizationName'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            password: {
              type: 'string',
              minLength: 8,
              description: 'User password (minimum 8 characters)',
            },
            name: {
              type: 'string',
              minLength: 2,
              description: 'User full name',
            },
            organizationName: {
              type: 'string',
              minLength: 2,
              description: 'Organization name',
            },
            inviteCode: {
              type: 'string',
              description: 'Optional invitation code',
            },
          },
        },
      },
    },
  },
  responses: {
    '201': {
      description: 'Registration successful',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              data: {
                type: 'object',
                properties: {
                  user: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      email: { type: 'string' },
                      name: { type: 'string' },
                      organizationId: { type: 'string' },
                    },
                  },
                  organization: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      plan: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '400': { $ref: '#/components/responses/ValidationError' },
    '409': {
      description: 'User already exists',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string', example: 'USER_EXISTS' },
                  message: { type: 'string', example: 'User already exists' },
                },
              },
            },
          },
        },
      },
    },
  },
  rateLimits: {
    requests: 3,
    window: '15m',
  },
});

// ============================================================================
// RISK MANAGEMENT ENDPOINTS
// ============================================================================

apiRegistry.registerEndpoint({
  path: '/api/v1/risks',
  method: 'GET',
  summary: 'List Risks',
  description: 'Retrieve a paginated list of risks with optional filtering and sorting',
  tags: ['Risk Management'],
  operationId: 'listRisks',
  security: [{ BearerAuth: [] }],
  parameters: [
    { $ref: '#/components/parameters/OrganizationId' },
    { $ref: '#/components/parameters/Page' },
    { $ref: '#/components/parameters/Limit' },
    { $ref: '#/components/parameters/SortBy' },
    { $ref: '#/components/parameters/SortOrder' },
    { $ref: '#/components/parameters/Search' },
    {
      name: 'status',
      in: 'query',
      description: 'Filter by risk status',
      schema: {
        type: 'string',
        enum: ['IDENTIFIED', 'ASSESSED', 'MITIGATED', 'CLOSED'],
      },
    },
    {
      name: 'severity',
      in: 'query',
      description: 'Filter by risk severity',
      schema: {
        type: 'string',
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      },
    },
    {
      name: 'category',
      in: 'query',
      description: 'Filter by risk category',
      schema: { type: 'string' },
    },
  ],
  responses: {
    '200': {
      description: 'List of risks retrieved successfully',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              data: {
                type: 'array',
                items: { $ref: '#/components/schemas/Risk' },
              },
              pagination: {
                type: 'object',
                properties: {
                  page: { type: 'integer' },
                  limit: { type: 'integer' },
                  total: { type: 'integer' },
                  pages: { type: 'integer' },
                },
              },
              meta: {
                type: 'object',
                properties: {
                  timestamp: { type: 'string', format: 'date-time' },
                  requestId: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    '401': { $ref: '#/components/responses/Unauthorized' },
    '403': { $ref: '#/components/responses/Forbidden' },
  },
  permissions: ['risk:read'],
});

apiRegistry.registerEndpoint({
  path: '/api/v1/risks',
  method: 'POST',
  summary: 'Create Risk',
  description: 'Create a new risk assessment',
  tags: ['Risk Management'],
  operationId: 'createRisk',
  security: [{ BearerAuth: [] }],
  parameters: [{ $ref: '#/components/parameters/OrganizationId' }],
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/CreateRiskRequest' },
      },
    },
  },
  responses: {
    '201': {
      description: 'Risk created successfully',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              data: { $ref: '#/components/schemas/Risk' },
            },
          },
        },
      },
    },
    '400': { $ref: '#/components/responses/ValidationError' },
    '401': { $ref: '#/components/responses/Unauthorized' },
    '403': { $ref: '#/components/responses/Forbidden' },
  },
  permissions: ['risk:write'],
  subscriptionRequired: true,
});

// ============================================================================
// CONTROL MANAGEMENT ENDPOINTS
// ============================================================================

apiRegistry.registerEndpoint({
  path: '/api/controls',
  method: 'GET',
  summary: 'List Controls',
  description: 'Retrieve a list of security controls',
  tags: ['Controls'],
  operationId: 'listControls',
  security: [{ BearerAuth: [] }],
  parameters: [
    { $ref: '#/components/parameters/OrganizationId' },
    { $ref: '#/components/parameters/Page' },
    { $ref: '#/components/parameters/Limit' },
    {
      name: 'framework',
      in: 'query',
      description: 'Filter by framework (SOC2, ISO27001, etc.)',
      schema: { type: 'string' },
    },
    {
      name: 'status',
      in: 'query',
      description: 'Filter by implementation status',
      schema: {
        type: 'string',
        enum: ['NOT_IMPLEMENTED', 'IN_PROGRESS', 'IMPLEMENTED', 'NEEDS_ATTENTION'],
      },
    },
  ],
  responses: {
    '200': {
      description: 'Controls retrieved successfully',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              data: {
                type: 'array',
                items: { $ref: '#/components/schemas/Control' },
              },
            },
          },
        },
      },
    },
    '401': { $ref: '#/components/responses/Unauthorized' },
  },
  permissions: ['control:read'],
});

// ============================================================================
// BILLING ENDPOINTS
// ============================================================================

apiRegistry.registerEndpoint({
  path: '/api/billing/plans',
  method: 'GET',
  summary: 'List Subscription Plans',
  description: 'Retrieve available subscription plans',
  tags: ['Billing'],
  operationId: 'listPlans',
  responses: {
    '200': {
      description: 'Plans retrieved successfully',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              data: {
                type: 'array',
                items: { $ref: '#/components/schemas/SubscriptionPlan' },
              },
            },
          },
        },
      },
    },
  },
});

// ============================================================================
// SCHEMA DEFINITIONS
// ============================================================================

apiRegistry.registerSchema('Risk', {
  type: 'object',
  required: ['id', 'title', 'description', 'category', 'likelihood', 'impact', 'status'],
  properties: {
    id: {
      type: 'string',
      description: 'Unique risk identifier',
      example: 'risk_123456789',
    },
    title: {
      type: 'string',
      description: 'Risk title',
      example: 'Data breach vulnerability in customer database',
    },
    description: {
      type: 'string',
      description: 'Detailed risk description',
    },
    category: {
      type: 'string',
      description: 'Risk category',
      enum: ['OPERATIONAL', 'FINANCIAL', 'STRATEGIC', 'COMPLIANCE', 'TECHNOLOGY'],
    },
    likelihood: {
      type: 'integer',
      description: 'Likelihood score (1-5)',
      minimum: 1,
      maximum: 5,
    },
    impact: {
      type: 'integer',
      description: 'Impact score (1-5)',
      minimum: 1,
      maximum: 5,
    },
    riskScore: {
      type: 'number',
      description: 'Calculated risk score (likelihood × impact)',
      readOnly: true,
    },
    status: {
      type: 'string',
      description: 'Current risk status',
      enum: ['IDENTIFIED', 'ASSESSED', 'MITIGATED', 'CLOSED'],
    },
    owner: {
      type: 'string',
      description: 'Risk owner user ID',
    },
    dueDate: {
      type: 'string',
      format: 'date',
      description: 'Risk assessment due date',
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      description: 'Creation timestamp',
      readOnly: true,
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      description: 'Last update timestamp',
      readOnly: true,
    },
    tags: {
      type: 'array',
      items: { type: 'string' },
      description: 'Risk tags for categorization',
    },
    attachments: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          url: { type: 'string' },
          size: { type: 'integer' },
        },
      },
      description: 'Associated documents and files',
    },
  },
});

apiRegistry.registerSchema('CreateRiskRequest', {
  type: 'object',
  required: ['title', 'description', 'category', 'likelihood', 'impact'],
  properties: {
    title: { type: 'string', minLength: 5, maxLength: 200 },
    description: { type: 'string', minLength: 10 },
    category: {
      type: 'string',
      enum: ['OPERATIONAL', 'FINANCIAL', 'STRATEGIC', 'COMPLIANCE', 'TECHNOLOGY'],
    },
    likelihood: { type: 'integer', minimum: 1, maximum: 5 },
    impact: { type: 'integer', minimum: 1, maximum: 5 },
    owner: { type: 'string', description: 'User ID of risk owner' },
    dueDate: { type: 'string', format: 'date' },
    tags: {
      type: 'array',
      items: { type: 'string' },
      maxItems: 10,
    },
  },
});

apiRegistry.registerSchema('Control', {
  type: 'object',
  required: ['id', 'name', 'framework', 'status'],
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    description: { type: 'string' },
    framework: {
      type: 'string',
      enum: ['SOC2', 'ISO27001', 'NIST', 'PCI_DSS', 'HIPAA', 'GDPR'],
    },
    controlFamily: { type: 'string' },
    status: {
      type: 'string',
      enum: ['NOT_IMPLEMENTED', 'IN_PROGRESS', 'IMPLEMENTED', 'NEEDS_ATTENTION'],
    },
    implementationDate: { type: 'string', format: 'date' },
    nextReviewDate: { type: 'string', format: 'date' },
    owner: { type: 'string' },
    evidence: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          type: { type: 'string' },
          url: { type: 'string' },
        },
      },
    },
    createdAt: { type: 'string', format: 'date-time', readOnly: true },
    updatedAt: { type: 'string', format: 'date-time', readOnly: true },
  },
});

apiRegistry.registerSchema('SubscriptionPlan', {
  type: 'object',
  required: ['id', 'name', 'price', 'features'],
  properties: {
    id: { type: 'string' },
    name: { type: 'string', example: 'Professional' },
    description: { type: 'string' },
    price: {
      type: 'object',
      properties: {
        monthly: { type: 'number', example: 99.0 },
        yearly: { type: 'number', example: 990.0 },
      },
    },
    features: {
      type: 'array',
      items: { type: 'string' },
      example: ['Unlimited risks', 'Advanced reporting', 'API access'],
    },
    limits: {
      type: 'object',
      properties: {
        risks: { type: 'integer', nullable: true },
        controls: { type: 'integer', nullable: true },
        users: { type: 'integer', nullable: true },
        storage: { type: 'string', example: '100GB' },
      },
    },
    popular: { type: 'boolean', default: false },
    enterprise: { type: 'boolean', default: false },
  },
});

// ============================================================================
// EXPORT REGISTRY
// ============================================================================

export { apiRegistry };
