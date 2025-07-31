/**
 * Comprehensive API Documentation System for Riscura
 * Provides OpenAPI specification generation and documentation utilities
 */

import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// OPENAPI SPECIFICATION TYPES
// ============================================================================

export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
    termsOfService?: string;
    contact?: {
      name: string;
      url: string;
      email: string;
    };
    license?: {
      name: string;
      url: string;
    };
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  paths: Record<string, PathItem>;
  components: {
    schemas: Record<string, SchemaObject>;
    responses: Record<string, ResponseObject>;
    parameters: Record<string, ParameterObject>;
    examples: Record<string, ExampleObject>;
    requestBodies: Record<string, RequestBodyObject>;
    headers: Record<string, HeaderObject>;
    securitySchemes: Record<string, SecuritySchemeObject>;
    links: Record<string, LinkObject>;
    callbacks: Record<string, CallbackObject>;
  };
  security?: SecurityRequirement[];
  tags?: TagObject[];
  externalDocs?: ExternalDocumentationObject;
}

export interface PathItem {
  summary?: string;
  description?: string;
  get?: OperationObject;
  put?: OperationObject;
  post?: OperationObject;
  delete?: OperationObject;
  options?: OperationObject;
  head?: OperationObject;
  patch?: OperationObject;
  trace?: OperationObject;
  servers?: ServerObject[];
  parameters?: (ParameterObject | ReferenceObject)[];
}

export interface OperationObject {
  tags?: string[];
  summary?: string;
  description?: string;
  externalDocs?: ExternalDocumentationObject;
  operationId?: string;
  parameters?: (ParameterObject | ReferenceObject)[];
  requestBody?: RequestBodyObject | ReferenceObject;
  responses: ResponsesObject;
  callbacks?: Record<string, CallbackObject | ReferenceObject>;
  deprecated?: boolean;
  security?: SecurityRequirement[];
  servers?: ServerObject[];
}

export interface SchemaObject {
  type?: string;
  properties?: Record<string, SchemaObject>;
  required?: string[];
  description?: string;
  example?: any;
  enum?: any[];
  format?: string;
  items?: SchemaObject;
  additionalProperties?: boolean | SchemaObject;
  nullable?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  allOf?: SchemaObject[];
  oneOf?: SchemaObject[];
  anyOf?: SchemaObject[];
  not?: SchemaObject;
  discriminator?: DiscriminatorObject;
  xml?: XMLObject;
  externalDocs?: ExternalDocumentationObject;
  deprecated?: boolean;
}

export interface ResponseObject {
  description: string;
  headers?: Record<string, HeaderObject | ReferenceObject>;
  content?: Record<string, MediaTypeObject>;
  links?: Record<string, LinkObject | ReferenceObject>;
}

export interface ParameterObject {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
  schema?: SchemaObject | ReferenceObject;
  example?: any;
  examples?: Record<string, ExampleObject | ReferenceObject>;
  content?: Record<string, MediaTypeObject>;
}

export interface RequestBodyObject {
  description?: string;
  content: Record<string, MediaTypeObject>;
  required?: boolean;
}

export interface MediaTypeObject {
  schema?: SchemaObject | ReferenceObject;
  example?: any;
  examples?: Record<string, ExampleObject | ReferenceObject>;
  encoding?: Record<string, EncodingObject>;
}

export interface ResponsesObject {
  [statusCode: string]: ResponseObject | ReferenceObject;
}

export interface ExampleObject {
  summary?: string;
  description?: string;
  value?: any;
  externalValue?: string;
}

export interface HeaderObject {
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
  schema?: SchemaObject | ReferenceObject;
  example?: any;
  examples?: Record<string, ExampleObject | ReferenceObject>;
  content?: Record<string, MediaTypeObject>;
}

export interface SecuritySchemeObject {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
  description?: string;
  name?: string;
  in?: 'query' | 'header' | 'cookie';
  scheme?: string;
  bearerFormat?: string;
  flows?: OAuthFlowsObject;
  openIdConnectUrl?: string;
}

export interface LinkObject {
  operationRef?: string;
  operationId?: string;
  parameters?: Record<string, any>;
  requestBody?: any;
  description?: string;
  server?: ServerObject;
}

export interface CallbackObject {
  [expression: string]: PathItem | ReferenceObject;
}

export interface ServerObject {
  url: string;
  description?: string;
  variables?: Record<string, ServerVariableObject>;
}

export interface ServerVariableObject {
  enum?: string[];
  default: string;
  description?: string;
}

export interface TagObject {
  name: string;
  description?: string;
  externalDocs?: ExternalDocumentationObject;
}

export interface ExternalDocumentationObject {
  description?: string;
  url: string;
}

export interface SecurityRequirement {
  [name: string]: string[];
}

export interface ReferenceObject {
  $ref: string;
}

export interface DiscriminatorObject {
  propertyName: string;
  mapping?: Record<string, string>;
}

export interface XMLObject {
  name?: string;
  namespace?: string;
  prefix?: string;
  attribute?: boolean;
  wrapped?: boolean;
}

export interface OAuthFlowsObject {
  implicit?: OAuthFlowObject;
  password?: OAuthFlowObject;
  clientCredentials?: OAuthFlowObject;
  authorizationCode?: OAuthFlowObject;
}

export interface OAuthFlowObject {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  scopes: Record<string, string>;
}

export interface EncodingObject {
  contentType?: string;
  headers?: Record<string, HeaderObject | ReferenceObject>;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
}

// ============================================================================
// API ENDPOINT REGISTRY
// ============================================================================

export interface APIEndpointInfo {
  path: string;
  method: string;
  summary: string;
  description: string;
  tags: string[];
  operationId: string;
  parameters?: ParameterObject[];
  requestBody?: RequestBodyObject;
  responses: ResponsesObject;
  security?: SecurityRequirement[];
  deprecated?: boolean;
  rateLimits?: {
    requests: number;
    window: string;
  };
  subscriptionRequired?: boolean;
  permissions?: string[];
  examples?: {
    request?: any;
    response?: any;
  };
}

export class APIRegistry {
  private endpoints: Map<string, APIEndpointInfo> = new Map();
  private schemas: Map<string, SchemaObject> = new Map();

  /**
   * Register an API endpoint with its documentation
   */
  registerEndpoint(info: APIEndpointInfo): void {
    const key = `${info.method.toUpperCase()}:${info.path}`;
    this.endpoints.set(key, info);
  }

  /**
   * Register a schema for reuse across endpoints
   */
  registerSchema(name: string, schema: SchemaObject): void {
    this.schemas.set(name, schema);
  }

  /**
   * Get registered endpoint information
   */
  getEndpoint(method: string, path: string): APIEndpointInfo | undefined {
    const key = `${method.toUpperCase()}:${path}`;
    return this.endpoints.get(key);
  }

  /**
   * Get all registered endpoints
   */
  getAllEndpoints(): Map<string, APIEndpointInfo> {
    return this.endpoints;
  }

  /**
   * Get all registered schemas
   */
  getAllSchemas(): Map<string, SchemaObject> {
    return this.schemas;
  }

  /**
   * Generate OpenAPI specification
   */
  generateOpenAPISpec(): OpenAPISpec {
    const paths: Record<string, PathItem> = {};
    const components = {
      schemas: Object.fromEntries(this.schemas),
      responses: this.generateStandardResponses(),
      parameters: this.generateStandardParameters(),
      examples: {},
      requestBodies: {},
      headers: {},
      securitySchemes: this.generateSecuritySchemes(),
      links: {},
      callbacks: {},
    };

    // Build paths from registered endpoints
    for (const [key, endpoint] of this.endpoints) {
      const [method, path] = key.split(':');
      const methodLower = method.toLowerCase() as keyof PathItem;

      if (!paths[path]) {
        paths[path] = {};
      }

      paths[path][methodLower] = {
        tags: endpoint.tags,
        summary: endpoint.summary,
        description: endpoint.description,
        operationId: endpoint.operationId,
        parameters: endpoint.parameters,
        requestBody: endpoint.requestBody,
        responses: endpoint.responses,
        security: endpoint.security,
        deprecated: endpoint.deprecated,
      };
    }

    return {
      openapi: '3.0.3',
      info: {
        title: 'Riscura API',
        version: '1.0.0',
        description: 'Comprehensive API documentation for the Riscura risk management platform',
        contact: {
          name: 'Riscura Support',
          url: 'https://riscura.com/support',
          email: 'support@riscura.com',
        },
        license: {
          name: 'Proprietary',
          url: 'https://riscura.com/license',
        },
      },
      servers: [
        {
          url: 'https://api.riscura.com',
          description: 'Production server',
        },
        {
          url: 'https://staging-api.riscura.com',
          description: 'Staging server',
        },
        {
          url: 'http://localhost:3000',
          description: 'Development server',
        },
      ],
      paths,
      components,
      security: [
        {
          BearerAuth: [],
        },
        {
          SessionAuth: [],
        },
      ],
      tags: [
        {
          name: 'Authentication',
          description: 'User authentication and session management',
        },
        {
          name: 'Risk Management',
          description: 'Risk assessment and management operations',
        },
        {
          name: 'Compliance',
          description: 'Compliance framework and audit operations',
        },
        {
          name: 'Controls',
          description: 'Security control management',
        },
        {
          name: 'Documents',
          description: 'Document management and storage',
        },
        {
          name: 'Reporting',
          description: 'Report generation and analytics',
        },
        {
          name: 'AI Services',
          description: 'AI-powered risk and compliance features',
        },
        {
          name: 'Billing',
          description: 'Subscription and billing management',
        },
        {
          name: 'System',
          description: 'System health and monitoring',
        },
      ],
    };
  }

  private generateStandardResponses(): Record<string, ResponseObject> {
    return {
      Success: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: true },
                data: { type: 'object' },
                meta: {
                  type: 'object',
                  properties: {
                    timestamp: { type: 'string', format: 'date-time' },
                    requestId: { type: 'string' },
                    version: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
      Error: {
        description: 'Error response',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                error: {
                  type: 'object',
                  properties: {
                    code: { type: 'string' },
                    message: { type: 'string' },
                    details: { type: 'array', items: { type: 'object' } },
                  },
                },
              },
            },
          },
        },
      },
      Unauthorized: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                error: {
                  type: 'object',
                  properties: {
                    code: { type: 'string', example: 'UNAUTHORIZED' },
                    message: { type: 'string', example: 'Authentication required' },
                  },
                },
              },
            },
          },
        },
      },
      Forbidden: {
        description: 'Access forbidden',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                error: {
                  type: 'object',
                  properties: {
                    code: { type: 'string', example: 'FORBIDDEN' },
                    message: { type: 'string', example: 'Access forbidden' },
                  },
                },
              },
            },
          },
        },
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                error: {
                  type: 'object',
                  properties: {
                    code: { type: 'string', example: 'NOT_FOUND' },
                    message: { type: 'string', example: 'Resource not found' },
                  },
                },
              },
            },
          },
        },
      },
      ValidationError: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                error: {
                  type: 'object',
                  properties: {
                    code: { type: 'string', example: 'VALIDATION_ERROR' },
                    message: { type: 'string', example: 'Validation failed' },
                    details: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          field: { type: 'string' },
                          message: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      RateLimitExceeded: {
        description: 'Rate limit exceeded',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                error: {
                  type: 'object',
                  properties: {
                    code: { type: 'string', example: 'RATE_LIMIT_EXCEEDED' },
                    message: { type: 'string', example: 'Rate limit exceeded' },
                    retryAfter: { type: 'number', example: 60 },
                  },
                },
              },
            },
          },
        },
      },
    };
  }

  private generateStandardParameters(): Record<string, ParameterObject> {
    return {
      OrganizationId: {
        name: 'organizationId',
        in: 'header',
        description: 'Organization ID for multi-tenant access',
        required: true,
        schema: { type: 'string' },
      },
      Page: {
        name: 'page',
        in: 'query',
        description: 'Page number for pagination',
        required: false,
        schema: { type: 'integer', minimum: 1, default: 1 },
      },
      Limit: {
        name: 'limit',
        in: 'query',
        description: 'Number of items per page',
        required: false,
        schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
      },
      SortBy: {
        name: 'sortBy',
        in: 'query',
        description: 'Field to sort by',
        required: false,
        schema: { type: 'string' },
      },
      SortOrder: {
        name: 'sortOrder',
        in: 'query',
        description: 'Sort order',
        required: false,
        schema: { type: 'string', enum: ['asc', 'desc'], default: 'asc' },
      },
      Filter: {
        name: 'filter',
        in: 'query',
        description: 'Filter criteria (JSON object)',
        required: false,
        schema: { type: 'string' },
      },
      Search: {
        name: 'search',
        in: 'query',
        description: 'Search query',
        required: false,
        schema: { type: 'string' },
      },
    };
  }

  private generateSecuritySchemes(): Record<string, SecuritySchemeObject> {
    return {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Bearer token authentication',
      },
      SessionAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'next-auth.session-token',
        description: 'Session-based authentication',
      },
    };
  }
}

// ============================================================================
// GLOBAL REGISTRY INSTANCE
// ============================================================================

export const apiRegistry = new APIRegistry();

// ============================================================================
// DOCUMENTATION DECORATORS
// ============================================================================

/**
 * Decorator to automatically register API endpoints
 */
export function ApiEndpoint(info: Partial<APIEndpointInfo>) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (req: NextRequest, context?: any) {
      // Register endpoint if not already registered
      if (info.path && info.method) {
        const fullInfo: APIEndpointInfo = {
          summary: info.summary || 'API endpoint',
          description: info.description || 'API endpoint description',
          tags: info.tags || ['API'],
          operationId: info.operationId || propertyKey,
          responses: info.responses || {
            '200': { $ref: '#/components/responses/Success' },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '500': { $ref: '#/components/responses/Error' },
          },
          ...info,
        } as APIEndpointInfo;

        apiRegistry.registerEndpoint(fullInfo);
      }

      return originalMethod.call(this, req, context);
    };

    return descriptor;
  };
}

/**
 * Zod schema to OpenAPI schema converter
 */
export function zodToOpenAPI(schema: z.ZodType<any>): SchemaObject {
  if (schema instanceof z.ZodString) {
    return {
      type: 'string',
      ...(schema.minLength !== null && { minLength: schema.minLength }),
      ...(schema.maxLength !== null && { maxLength: schema.maxLength }),
    };
  }

  if (schema instanceof z.ZodNumber) {
    return {
      type: 'number',
      ...(schema.minValue !== null && { minimum: schema.minValue }),
      ...(schema.maxValue !== null && { maximum: schema.maxValue }),
    };
  }

  if (schema instanceof z.ZodBoolean) {
    return { type: 'boolean' };
  }

  if (schema instanceof z.ZodArray) {
    return {
      type: 'array',
      items: zodToOpenAPI(schema.element),
    };
  }

  if (schema instanceof z.ZodObject) {
    const properties: Record<string, SchemaObject> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(schema.shape)) {
      properties[key] = zodToOpenAPI(value as z.ZodType<any>);
      if (!(value as z.ZodType<any>).isOptional()) {
        required.push(key);
      }
    }

    return {
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined,
    };
  }

  if (schema instanceof z.ZodEnum) {
    return {
      type: 'string',
      enum: schema.options,
    };
  }

  if (schema instanceof z.ZodOptional) {
    return zodToOpenAPI(schema.unwrap());
  }

  if (schema instanceof z.ZodNullable) {
    return {
      ...zodToOpenAPI(schema.unwrap()),
      nullable: true,
    };
  }

  return { type: 'object' };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default apiRegistry;
