import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { withAuth, rateLimit, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { env } from '@/config/env';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { 
  ApiResponseFormatter, 
  VersionedResponseFormatter,
  ResponseOptions 
} from './response-formatter';
import { 
  globalErrorHandler, 
  createAuthError, 
  createForbiddenError 
} from './error-handler';
import { 
  parseAndValidate, 
  validateQueryParams,
  formatValidationErrors 
} from './validation-schemas';
import { 
  applyRateLimit, 
  getRateLimiterForEndpoint 
} from './rate-limiter';
import { 
  getApiVersionFromRequest, 
  ApiVersionMiddleware,
  ApiVersion 
} from './versioning';

// API Error types
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class ValidationError extends APIError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class NotFoundError extends APIError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ForbiddenError extends APIError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends APIError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

export class TooManyRequestsError extends APIError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'TOO_MANY_REQUESTS');
  }
}

// API Response wrapper
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  meta?: {
    requestId: string;
    timestamp: string;
    version: string;
  };
}

// Request validation middleware
export function withValidation<T>(schema: z.ZodSchema<T>) {
  return function (
    handler: (req: NextRequest, validatedData: T) => Promise<NextResponse>
  ) {
    return async (req: NextRequest): Promise<NextResponse> => {
      try {
        let data: any;

        if (req.method === 'GET') {
          // Validate query parameters for GET requests
          const url = new URL(req.url);
          const queryParams: Record<string, any> = {};
          
          for (const [key, value] of url.searchParams.entries()) {
            // Handle array parameters (e.g., ?tags=tag1&tags=tag2)
            if (queryParams[key]) {
              if (Array.isArray(queryParams[key])) {
                queryParams[key].push(value);
              } else {
                queryParams[key] = [queryParams[key], value];
              }
            } else {
              queryParams[key] = value;
            }
          }

          data = queryParams;
        } else {
          // Validate request body for POST/PUT/PATCH requests
          const body = await req.json().catch(() => ({}));
          data = body;
        }

        const validatedData = schema.parse(data);
        return handler(req, validatedData);

      } catch (error) {
        if (error instanceof ZodError) {
          return createErrorResponse(
            new ValidationError('Invalid request data', error.errors),
            req
          );
        }

        return createErrorResponse(
          new APIError('Failed to process request'),
          req
        );
      }
    };
  };
}

// API logging middleware
export function withLogging(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (req: AuthenticatedRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const requestId = generateRequestId();
    
    // Add request ID to headers
    const headers = new Headers();
    headers.set('X-Request-ID', requestId);

    try {
      // Log request (commented out for now - needs schema fixes)
      /*
      await db.client.activity.create({
        data: {
          type: 'API_REQUEST',
          entityType: 'API',
          entityId: requestId,
          description: `${req.method} ${url.pathname}`,
          userId: user?.id,
          organizationId: user?.organizationId,
          metadata: {
            requestId,
            method: req.method,
            path: url.pathname,
            userAgent: req.headers.get('user-agent'),
            ip: getClientIP(req),
            duration: performance.now() - startTime,
            success: response?.ok || false,
            statusCode: response?.status || 0,
          },
          isPublic: false,
        },
      });
      */

      // Execute handler
      const response = await handler(req);

      // Add headers to response
      headers.forEach((value, key) => {
        response.headers.set(key, value);
      });

      // Log response (commented out for now - needs schema fixes)
      // await logAPIResponse(req, response, requestId, duration);

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log error (commented out for now - needs schema fixes)
      // await logAPIError(req, error as Error, requestId, duration);

      // Return error response
      const errorResponse = createErrorResponse(
        error instanceof APIError ? error : new APIError('Internal server error'),
        req,
        requestId
      );

      headers.forEach((value, key) => {
        errorResponse.headers.set(key, value);
      });

      return errorResponse;
    }
  };
}

// Rate limiting middleware
export function withRateLimit(
  limit: number = 100,
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  keyGenerator?: (req: NextRequest) => string
) {
  return function (
    handler: (req: NextRequest) => Promise<NextResponse>
  ) {
    return async (req: NextRequest): Promise<NextResponse> => {
      const key = keyGenerator 
        ? keyGenerator(req)
        : `api:${req.headers.get('x-forwarded-for') || 'unknown'}`;

      const rateLimitResult = rateLimit(key, limit, windowMs);

      if (!rateLimitResult.allowed) {
        const response = createErrorResponse(
          new TooManyRequestsError('Rate limit exceeded'),
          req
        );

        response.headers.set('X-RateLimit-Limit', limit.toString());
        response.headers.set('X-RateLimit-Remaining', '0');
        response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());

        return response;
      }

      const response = await handler(req);

      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', limit.toString());
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
      response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());

      return response;
    };
  };
}

// Complete API middleware stack
export function withAPI(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  options: {
    requireAuth?: boolean;
    rateLimit?: { limit: number; windowMs: number };
    requiredPermissions?: string[];
    requiredRoles?: string[];
  } = {}
) {
  const {
    requireAuth = true,
    rateLimit: rateLimitOptions,
    requiredPermissions,
    requiredRoles,
  } = options;

  let middleware = handler;

  // Add logging
  middleware = withLogging(middleware);

  // Add authentication if required
  if (requireAuth) {
    middleware = withAuth(middleware, {
      requiredPermissions,
      requiredRoles,
    });
  }

  // Add rate limiting
  if (rateLimitOptions) {
    middleware = withRateLimit(
      rateLimitOptions.limit,
      rateLimitOptions.windowMs
    )(middleware as any) as any;
  }

  return middleware;
}

// Create standardized API response
export function createAPIResponse<T>(
  data: T,
  options: {
    pagination?: APIResponse['pagination'];
    meta?: Partial<APIResponse['meta']>;
    statusCode?: number;
  } = {}
): NextResponse {
  const response: APIResponse<T> = {
    success: true,
    data,
    pagination: options.pagination,
    meta: {
      requestId: generateRequestId(),
      timestamp: new Date().toISOString(),
      version: env.API_VERSION || 'v1',
      ...options.meta,
    },
  };

  return NextResponse.json(response, {
    status: options.statusCode || 200,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Version': response.meta!.version,
    },
  });
}

// Create error response
export function createErrorResponse(
  error: APIError,
  req: NextRequest,
  requestId?: string
): NextResponse {
  const response: APIResponse = {
    success: false,
    error: {
      message: error.message,
      code: error.code,
      details: error.details,
    },
    meta: {
      requestId: requestId || generateRequestId(),
      timestamp: new Date().toISOString(),
      version: env.API_VERSION || 'v1',
    },
  };

  return NextResponse.json(response, {
    status: error.statusCode,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Version': response.meta!.version,
    },
  });
}

// Pagination utilities
export interface PaginationOptions {
  page?: number;
  limit?: number;
  maxLimit?: number;
}

export function parsePagination(
  searchParams: URLSearchParams,
  options: PaginationOptions = {}
): { skip: number; take: number; page: number; limit: number } {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(
    options.maxLimit || 100,
    Math.max(1, parseInt(searchParams.get('limit') || '10'))
  );

  return {
    skip: (page - 1) * limit,
    take: limit,
    page,
    limit,
  };
}

export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): APIResponse['pagination'] {
  return {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  };
}

// Filtering utilities
export function parseFilters(searchParams: URLSearchParams): Record<string, any> {
  const filters: Record<string, any> = {};

  for (const [key, value] of searchParams.entries()) {
    if (key.startsWith('filter.')) {
      const filterKey = key.substring(7); // Remove 'filter.' prefix
      
      // Handle different filter operators
      if (filterKey.includes('.')) {
        const [field, operator] = filterKey.split('.');
        
        if (!filters[field]) {
          filters[field] = {};
        }

        switch (operator) {
          case 'eq':
            filters[field] = value;
            break;
          case 'ne':
            filters[field] = { not: value };
            break;
          case 'gt':
            filters[field] = { gt: parseFilterValue(value) };
            break;
          case 'gte':
            filters[field] = { gte: parseFilterValue(value) };
            break;
          case 'lt':
            filters[field] = { lt: parseFilterValue(value) };
            break;
          case 'lte':
            filters[field] = { lte: parseFilterValue(value) };
            break;
          case 'contains':
            filters[field] = { contains: value, mode: 'insensitive' };
            break;
          case 'startsWith':
            filters[field] = { startsWith: value, mode: 'insensitive' };
            break;
          case 'endsWith':
            filters[field] = { endsWith: value, mode: 'insensitive' };
            break;
          case 'in':
            filters[field] = { in: value.split(',') };
            break;
          case 'notIn':
            filters[field] = { notIn: value.split(',') };
            break;
        }
      } else {
        // Simple equality filter
        filters[filterKey] = parseFilterValue(value);
      }
    }
  }

  return filters;
}

// Sorting utilities
export function parseSorting(searchParams: URLSearchParams): Record<string, 'asc' | 'desc'>[] {
  const sortParam = searchParams.get('sort');
  if (!sortParam) return [{ createdAt: 'desc' }]; // Default sort

  return sortParam.split(',').map(sort => {
    const [field, direction] = sort.trim().split(':');
    return {
      [field]: (direction === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc'
    };
  });
}

// Search utilities
export function parseSearch(searchParams: URLSearchParams): string | undefined {
  return searchParams.get('search') || undefined;
}

// Helper functions
function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

function parseFilterValue(value: string): any {
  // Try to parse as number
  if (!isNaN(Number(value))) {
    return Number(value);
  }

  // Try to parse as boolean
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;

  // Try to parse as date
  if (value.match(/^\d{4}-\d{2}-\d{2}/)) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Return as string
  return value;
}

// Commented out logging functions for now - need schema fixes
/*
async function logAPIRequest(req: NextRequest, requestId: string): Promise<void> {
  // ... existing implementation ...
}

async function logAPIResponse(
  req: NextRequest,
  response: NextResponse,
  requestId: string,
  duration: number
): Promise<void> {
  // ... existing implementation ...
}

async function logAPIError(
  req: NextRequest,
  error: Error,
  requestId: string,
  duration: number
): Promise<void> {
  // ... existing implementation ...
}
*/

// Middleware configuration
export interface ApiMiddlewareConfig {
  // Authentication
  requireAuth?: boolean;
  allowedRoles?: string[];
  requireOrganization?: boolean;
  
  // Rate limiting
  rateLimiters?: string[];
  skipRateLimit?: boolean;
  
  // Validation
  bodySchema?: z.ZodSchema<any>;
  querySchema?: z.ZodSchema<any>;
  skipValidation?: boolean;
  
  // Versioning
  supportedVersions?: ApiVersion[];
  skipVersioning?: boolean;
  
  // Logging
  enableLogging?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  
  // CORS
  corsEnabled?: boolean;
  corsOptions?: {
    origin?: string | string[];
    methods?: string[];
    headers?: string[];
    credentials?: boolean;
  };
}

// Request context
export interface ApiRequestContext {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    organizationId: string;
  };
  version: ApiVersion;
  requestId: string;
  startTime: number;
  rateLimitHeaders: Record<string, string>;
}

// Middleware result
export interface ApiMiddlewareResult<T = any> {
  success: boolean;
  context: ApiRequestContext;
  validatedData?: T;
  response?: NextResponse;
  error?: any;
}

// Main API middleware class
export class ApiMiddleware {
  private config: Required<ApiMiddlewareConfig>;

  constructor(config: ApiMiddlewareConfig = {}) {
    this.config = {
      requireAuth: config.requireAuth ?? true,
      allowedRoles: config.allowedRoles ?? [],
      requireOrganization: config.requireOrganization ?? true,
      rateLimiters: config.rateLimiters ?? [],
      skipRateLimit: config.skipRateLimit ?? false,
      bodySchema: config.bodySchema ?? undefined,
      querySchema: config.querySchema ?? undefined,
      skipValidation: config.skipValidation ?? false,
      supportedVersions: config.supportedVersions ?? [ApiVersion.V1],
      skipVersioning: config.skipVersioning ?? false,
      enableLogging: config.enableLogging ?? true,
      logLevel: config.logLevel ?? 'info',
      corsEnabled: config.corsEnabled ?? true,
      corsOptions: config.corsOptions ?? {
        origin: process.env.ALLOWED_ORIGINS?.split(',') ?? ['http://localhost:3000'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        headers: ['Content-Type', 'Authorization', 'X-API-Version', 'X-Request-ID'],
        credentials: true
      }
    };
  }

  /**
   * Execute middleware pipeline
   */
  async execute(request: NextRequest): Promise<ApiMiddlewareResult> {
    const startTime = Date.now();
    const requestId = ApiResponseFormatter.getOrCreateRequestId(request);
    
    try {
      // 1. CORS handling
      if (this.config.corsEnabled && request.method === 'OPTIONS') {
        return {
          success: true,
          context: this.createBaseContext(request, startTime, requestId),
          response: this.createCorsResponse()
        };
      }

      // 2. Version negotiation
      let version = ApiVersion.V1;
      if (!this.config.skipVersioning) {
        const versionResult = await this.handleVersioning(request);
        if (!versionResult.success) {
          return versionResult;
        }
        version = versionResult.version!;
      }

      // 3. Rate limiting
      let rateLimitHeaders: Record<string, string> = {};
      if (!this.config.skipRateLimit) {
        const rateLimitResult = await this.handleRateLimit(request);
        if (!rateLimitResult.success) {
          return {
            success: false,
            context: this.createBaseContext(request, startTime, requestId, version),
            error: rateLimitResult.error
          };
        }
        rateLimitHeaders = rateLimitResult.headers;
      }

      // 4. Authentication & Authorization
      let user;
      if (this.config.requireAuth) {
        const authResult = await this.handleAuthentication(request);
        if (!authResult.success) {
          return {
            success: false,
            context: this.createBaseContext(request, startTime, requestId, version, rateLimitHeaders),
            error: authResult.error
          };
        }
        user = authResult.user;
      }

      // 5. Input validation
      let validatedData;
      if (!this.config.skipValidation) {
        const validationResult = await this.handleValidation(request);
        if (!validationResult.success) {
          return {
            success: false,
            context: this.createBaseContext(request, startTime, requestId, version, rateLimitHeaders, user),
            error: validationResult.error
          };
        }
        validatedData = validationResult.data;
      }

      // 6. Create successful context
      const context: ApiRequestContext = {
        user,
        version,
        requestId,
        startTime,
        rateLimitHeaders
      };

      return {
        success: true,
        context,
        validatedData
      };

    } catch (error) {
      return {
        success: false,
        context: this.createBaseContext(request, startTime, requestId),
        error
      };
    }
  }

  /**
   * Handle CORS preflight
   */
  private createCorsResponse(): NextResponse {
    const response = new NextResponse(null, { status: 200 });
    
    if (this.config.corsOptions.origin) {
      const origins = Array.isArray(this.config.corsOptions.origin) 
        ? this.config.corsOptions.origin.join(', ')
        : this.config.corsOptions.origin;
      response.headers.set('Access-Control-Allow-Origin', origins);
    }
    
    if (this.config.corsOptions.methods) {
      response.headers.set('Access-Control-Allow-Methods', this.config.corsOptions.methods.join(', '));
    }
    
    if (this.config.corsOptions.headers) {
      response.headers.set('Access-Control-Allow-Headers', this.config.corsOptions.headers.join(', '));
    }
    
    if (this.config.corsOptions.credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
    
    response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
    
    return response;
  }

  /**
   * Handle API versioning
   */
  private async handleVersioning(request: NextRequest): Promise<{
    success: boolean;
    version?: ApiVersion;
    error?: any;
  }> {
    try {
      const version = getApiVersionFromRequest(request);
      
      if (!this.config.supportedVersions.includes(version)) {
        return {
          success: false,
          error: ApiResponseFormatter.error(
            'UNSUPPORTED_VERSION',
            `API version '${version}' is not supported by this endpoint`,
            {
              status: 400,
              requestId: ApiResponseFormatter.getOrCreateRequestId(request),
              details: {
                supportedVersions: this.config.supportedVersions,
                requestedVersion: version
              }
            }
          )
        };
      }

      return { success: true, version };
    } catch (error) {
      return { success: false, error };
    }
  }

  /**
   * Handle rate limiting
   */
  private async handleRateLimit(request: NextRequest): Promise<{
    success: boolean;
    headers: Record<string, string>;
    error?: any;
  }> {
    try {
      const url = new URL(request.url);
      const rateLimiters = this.config.rateLimiters.length > 0 
        ? this.config.rateLimiters 
        : getRateLimiterForEndpoint(url.pathname, request.method);

      const result = await applyRateLimit(request, rateLimiters);
      return result;
    } catch (error) {
      return { success: false, headers: {}, error };
    }
  }

  /**
   * Handle authentication and authorization
   */
  private async handleAuthentication(request: NextRequest): Promise<{
    success: boolean;
    user?: any;
    error?: any;
  }> {
    try {
      const session = await getServerSession(authOptions);
      
      if (!session?.user) {
        return {
          success: false,
          error: createAuthError('Authentication required')
        };
      }

      // Check role-based authorization
      if (this.config.allowedRoles.length > 0 && 
          !this.config.allowedRoles.includes(session.user.role)) {
        return {
          success: false,
          error: createForbiddenError('Insufficient permissions')
        };
      }

      // Check organization requirement
      if (this.config.requireOrganization && !session.user.organizationId) {
        return {
          success: false,
          error: createForbiddenError('Organization membership required')
        };
      }

      return {
        success: true,
        user: session.user
      };
    } catch (error) {
      return { success: false, error };
    }
  }

  /**
   * Handle input validation
   */
  private async handleValidation(request: NextRequest): Promise<{
    success: boolean;
    data?: any;
    error?: any;
  }> {
    try {
      const validatedData: any = {};

      // Validate query parameters
      if (this.config.querySchema) {
        const url = new URL(request.url);
        const queryValidation = validateQueryParams(this.config.querySchema, url.searchParams);
        
        if (!queryValidation.success) {
          return {
            success: false,
            error: ApiResponseFormatter.validationError(
              formatValidationErrors(queryValidation.errors),
              ApiResponseFormatter.createResponseOptions(request)
            )
          };
        }
        
        validatedData.query = queryValidation.data;
      }

      // Validate body
      if (this.config.bodySchema && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        const body = await request.json();
        const bodyValidation = parseAndValidate(this.config.bodySchema, body);
        
        if (!bodyValidation.success) {
          return {
            success: false,
            error: ApiResponseFormatter.validationError(
              formatValidationErrors(bodyValidation.errors),
              ApiResponseFormatter.createResponseOptions(request)
            )
          };
        }
        
        validatedData.body = bodyValidation.data;
      }

      return {
        success: true,
        data: validatedData
      };
    } catch (error) {
      return { success: false, error };
    }
  }

  /**
   * Create base context
   */
  private createBaseContext(
    request: NextRequest,
    startTime: number,
    requestId: string,
    version: ApiVersion = ApiVersion.V1,
    rateLimitHeaders: Record<string, string> = {},
    user?: any
  ): ApiRequestContext {
    return {
      user,
      version,
      requestId,
      startTime,
      rateLimitHeaders
    };
  }

  /**
   * Add CORS headers to response
   */
  addCorsHeaders(response: NextResponse, request: NextRequest): NextResponse {
    if (!this.config.corsEnabled) return response;

    const origin = request.headers.get('Origin');
    const allowedOrigins = Array.isArray(this.config.corsOptions.origin)
      ? this.config.corsOptions.origin
      : [this.config.corsOptions.origin!];

    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }

    if (this.config.corsOptions.credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    return response;
  }

  /**
   * Create standardized response with middleware context
   */
  createResponse<T>(
    data: T,
    context: ApiRequestContext,
    options: {
      status?: number;
      pagination?: any;
    } = {}
  ): NextResponse {
    const responseOptions: ResponseOptions = {
      requestId: context.requestId,
      version: context.version,
      status: options.status
    };

    let response;
    if (options.pagination) {
      response = VersionedResponseFormatter.paginated(
        data as any,
        options.pagination,
        context.version,
        responseOptions
      );
    } else {
      response = VersionedResponseFormatter.success(
        data,
        context.version,
        responseOptions
      );
    }

    // Add rate limit headers
    Object.entries(context.rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }

  /**
   * Handle errors with middleware context
   */
  async handleError(
    error: any,
    request: NextRequest,
    context?: Partial<ApiRequestContext>
  ): Promise<NextResponse> {
    const response = await globalErrorHandler.handleError(error, request, {
      endpoint: `${request.method} ${new URL(request.url).pathname}`,
      context
    });

    // Add rate limit headers if available
    if (context?.rateLimitHeaders) {
      Object.entries(context.rateLimitHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }

    return response;
  }
}

// Utility function to create middleware with configuration
export function createApiMiddleware(config?: ApiMiddlewareConfig) {
  return new ApiMiddleware(config);
}

// Decorator for API handlers
export function withApiMiddleware(config?: ApiMiddlewareConfig) {
  const middleware = createApiMiddleware(config);

  return function <T extends any[], R>(
    handler: (context: ApiRequestContext, validatedData?: any, ...args: T) => Promise<R>
  ) {
    return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
      try {
        const result = await middleware.execute(request);
        
        if (!result.success) {
          if (result.response) return result.response;
          throw result.error;
        }

        const handlerResult = await handler(result.context, result.validatedData, ...args);
        
        // If handler returns NextResponse, return it directly
        if (handlerResult instanceof NextResponse) {
          return middleware.addCorsHeaders(handlerResult, request);
        }

        // Otherwise, wrap in standardized response
        const response = middleware.createResponse(handlerResult, result.context);
        return middleware.addCorsHeaders(response, request);

      } catch (error) {
        return middleware.handleError(error, request, result?.context);
      }
    };
  };
}

// Specific middleware configurations for common patterns
export const authApiMiddleware = (allowedRoles?: string[]) => createApiMiddleware({
  requireAuth: true,
  allowedRoles,
  requireOrganization: true
});

export const publicApiMiddleware = createApiMiddleware({
  requireAuth: false,
  skipRateLimit: false
});

export const adminApiMiddleware = createApiMiddleware({
  requireAuth: true,
  allowedRoles: ['ADMIN'],
  requireOrganization: true
});

export const riskManagerApiMiddleware = createApiMiddleware({
  requireAuth: true,
  allowedRoles: ['ADMIN', 'RISK_MANAGER'],
  requireOrganization: true
});

// Export types
export type { ApiMiddlewareConfig, ApiRequestContext, ApiMiddlewareResult }; 