import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { withAuth, rateLimit, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { env } from '@/config/env';

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
      // Log request
      await logAPIRequest(req, requestId);

      // Execute handler
      const response = await handler(req);

      // Add headers to response
      headers.forEach((value, key) => {
        response.headers.set(key, value);
      });

      // Log response
      const duration = Date.now() - startTime;
      await logAPIResponse(req, response, requestId, duration);

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('API Error:', error);
      
      // Log error
      await logAPIError(req, error as Error, requestId, duration);

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

// Logging functions
async function logAPIRequest(req: NextRequest, requestId: string): Promise<void> {
  try {
    const url = new URL(req.url);
    
    await db.client.activity.create({
      data: {
        type: 'API_REQUEST',
        entityType: 'API',
        entityId: requestId,
        description: `${req.method} ${url.pathname}`,
        metadata: {
          method: req.method,
          path: url.pathname,
          query: Object.fromEntries(url.searchParams.entries()),
          userAgent: req.headers.get('user-agent'),
          ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
          requestId,
        },
        organizationId: 'system',
        isPublic: false,
      },
    });
  } catch (error) {
    console.error('Failed to log API request:', error);
  }
}

async function logAPIResponse(
  req: NextRequest,
  response: NextResponse,
  requestId: string,
  duration: number
): Promise<void> {
  try {
    const url = new URL(req.url);
    
    await db.client.activity.create({
      data: {
        type: 'API_RESPONSE',
        entityType: 'API',
        entityId: requestId,
        description: `${req.method} ${url.pathname} - ${response.status}`,
        metadata: {
          method: req.method,
          path: url.pathname,
          statusCode: response.status,
          duration,
          requestId,
        },
        organizationId: 'system',
        isPublic: false,
      },
    });
  } catch (error) {
    console.error('Failed to log API response:', error);
  }
}

async function logAPIError(
  req: NextRequest,
  error: Error,
  requestId: string,
  duration: number
): Promise<void> {
  try {
    const url = new URL(req.url);
    
    await db.client.activity.create({
      data: {
        type: 'API_ERROR',
        entityType: 'API',
        entityId: requestId,
        description: `${req.method} ${url.pathname} - Error: ${error.message}`,
        metadata: {
          method: req.method,
          path: url.pathname,
          error: error.message,
          stack: error.stack,
          duration,
          requestId,
        },
        organizationId: 'system',
        isPublic: false,
      },
    });
  } catch (logError) {
    console.error('Failed to log API error:', logError);
  }
} 