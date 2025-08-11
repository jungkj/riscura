import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { withAuth, rateLimit, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { isDatabaseAvailable } from '@/lib/db';
import { env } from '@/config/env';
import { getServerSession } from 'next-auth/next';
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
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { billingManager } from '@/lib/billing/manager';

// ============================================================================
// ERROR CLASSES
// ============================================================================

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
  constructor(message: string, public errors?: any[]) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = errors;
  }
}

export class AuthenticationError extends APIError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class ForbiddenError extends APIError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN_ERROR');
  }
}

// NotFoundError removed - use createNotFoundError from error-handler.ts instead
// or check for Prisma.PrismaClientKnownRequestError with code P2025

export class ConflictError extends APIError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

export class RateLimitError extends APIError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

export class InternalServerError extends APIError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, 'INTERNAL_SERVER_ERROR');
  }
}

export class SubscriptionError extends APIError {
  constructor(message: string = 'Subscription required') {
    super(message, 402, 'SUBSCRIPTION_ERROR');
  }
}

export class PlanLimitError extends APIError {
  constructor(message: string = 'Plan limit exceeded') {
    super(message, 402, 'PLAN_LIMIT_ERROR');
  }
}

// ============================================================================
// RESPONSE UTILITIES
// ============================================================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
    totalPages?: number;
  };
  meta?: {
    requestId?: string;
    timestamp?: string;
    version?: string;
  };
}

export function createAPIResponse<T>(
  data: T,
  options?: {
    message?: string;
    pagination?: APIResponse['pagination'];
    meta?: APIResponse['meta'];
    statusCode?: number;
  }
): NextResponse<APIResponse<T>> {
  const response: APIResponse<T> = {
    success: true,
    data,
    message: options?.message,
    pagination: options?.pagination,
    meta: {
      timestamp: new Date().toISOString(),
      version: '1.0',
      ...options?.meta,
    },
  };

  return NextResponse.json(response, {
    status: options?.statusCode || 200,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Version': '1.0',
    },
  });
}

export function createErrorResponse(
  error: APIError | Error,
  requestId?: string
): NextResponse<APIResponse> {
  const isAPIError = error instanceof APIError;
  
  const response: APIResponse = {
    success: false,
    error: {
      code: isAPIError ? error.code || 'UNKNOWN_ERROR' : 'INTERNAL_SERVER_ERROR',
      message: error.message,
      details: isAPIError ? error.details : undefined,
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
      version: '1.0',
    },
  };

  const statusCode = isAPIError ? error.statusCode : 500;

  return NextResponse.json(response, {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Version': '1.0',
    },
  });
}

// ============================================================================
// RATE LIMITING
// ============================================================================

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (req: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

class RateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>();

  constructor(private config: RateLimitConfig) {}

  async checkLimit(req: NextRequest): Promise<{ allowed: boolean; resetTime?: number }> {
    const key = this.config.keyGenerator?.(req) || this.getDefaultKey(req);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Clean up old entries
    this.cleanup(windowStart);

    const entry = this.requests.get(key);
    
    if (!entry) {
      this.requests.set(key, { count: 1, resetTime: now + this.config.windowMs });
      return { allowed: true };
    }

    if (now > entry.resetTime) {
      // Window has expired, reset
      this.requests.set(key, { count: 1, resetTime: now + this.config.windowMs });
      return { allowed: true };
    }

    if (entry.count >= this.config.maxRequests) {
      return { allowed: false, resetTime: entry.resetTime };
    }

    entry.count++;
    return { allowed: true };
  }

  private cleanup(windowStart: number) {
    for (const [key, entry] of this.requests.entries()) {
      if (entry.resetTime < windowStart) {
        this.requests.delete(key);
      }
    }
  }

  private getDefaultKey(req: NextRequest): string {
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : req.ip || 'unknown';
    return `${ip}:${req.nextUrl.pathname}`;
  }
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Validation failed', error.errors);
    }
    throw new ValidationError('Invalid request data');
  }
}

export function validateQuery<T>(
  schema: z.ZodSchema<T>,
  searchParams: URLSearchParams
): T {
  const queryObject = Object.fromEntries(searchParams.entries());
  return validateRequest(schema, queryObject);
}

export function validateBody<T>(
  schema: z.ZodSchema<T>
) {
  return async (req: NextRequest): Promise<T> => {
    try {
      const body = await req.json();
      return validateRequest(schema, body);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new ValidationError('Invalid JSON in request body');
      }
      throw error;
    }
  };
}

// ============================================================================
// PAGINATION UTILITIES
// ============================================================================

export interface PaginationOptions {
  page?: number;
  limit?: number;
  maxLimit?: number;
  defaultLimit?: number;
}

export interface PaginationResult {
  skip: number;
  take: number;
  page: number;
  limit: number;
}

export function parsePagination(
  searchParams: URLSearchParams,
  options: PaginationOptions = {}
): PaginationResult {
  const {
    maxLimit = 100,
    defaultLimit = 20,
  } = options;

  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(
    maxLimit,
    Math.max(1, parseInt(searchParams.get('limit') || String(defaultLimit), 10))
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
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    pages: totalPages,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

// ============================================================================
// SORTING UTILITIES
// ============================================================================

export interface SortOptions {
  allowedFields?: string[];
  defaultField?: string;
  defaultOrder?: 'asc' | 'desc';
}

export function parseSorting(
  searchParams: URLSearchParams,
  options: SortOptions = {}
): Record<string, 'asc' | 'desc'> {
  const {
    allowedFields,
    defaultField = 'createdAt',
    defaultOrder = 'desc',
  } = options;

  const sortBy = searchParams.get('sortBy') || searchParams.get('sort') || defaultField;
  const sortOrder = (searchParams.get('sortOrder') || searchParams.get('order') || defaultOrder) as 'asc' | 'desc';

  // Validate sort field if allowedFields is provided
  if (allowedFields && !allowedFields.includes(sortBy)) {
    return { [defaultField]: defaultOrder };
  }

  // Validate sort order
  if (!['asc', 'desc'].includes(sortOrder)) {
    return { [sortBy]: defaultOrder };
  }

  return { [sortBy]: sortOrder };
}

// ============================================================================
// FILTERING UTILITIES
// ============================================================================

export function parseFilters(searchParams: URLSearchParams): Record<string, any> {
  const filters: Record<string, any> = {};

  for (const [key, value] of searchParams.entries()) {
    // Skip pagination and sorting parameters
    if (['page', 'limit', 'sortBy', 'sort', 'sortOrder', 'order', 'search'].includes(key)) {
      continue;
    }

    // Handle array values (comma-separated)
    if (value.includes(',')) {
      filters[key] = value.split(',').map(v => v.trim());
    } else {
      filters[key] = value;
    }
  }

  return filters;
}

export function parseSearch(searchParams: URLSearchParams): string | undefined {
  return searchParams.get('search') || searchParams.get('q') || undefined;
}

// ============================================================================
// SUBSCRIPTION ENFORCEMENT
// ============================================================================

async function enforceSubscriptionLimits(
  organizationId: string,
  subscriptionOptions: NonNullable<MiddlewareOptions['subscription']>
): Promise<void> {
  // Skip subscription checks for demo organization
  if (organizationId === 'demo-org-id') {
    return; // Demo has unlimited access
  }

  // Check if database is available for subscription checks
  if (!isDatabaseAvailable()) {
    console.warn('Database not available for subscription checks, skipping');
    return;
  }

  // Check if organization has an active subscription
  if (subscriptionOptions.requireActive) {
    const subscription = await billingManager.getActiveSubscription(organizationId);
    
    if (!subscription) {
      throw new SubscriptionError('Active subscription required');
    }

    // Check if subscription is in trial and expired
    if (subscription.trialEnd && subscription.trialEnd < new Date() && subscription.status !== 'active') {
      throw new SubscriptionError('Trial period has ended. Please subscribe to continue.');
    }

    // Check if subscription is canceled and past period end
    if (subscription.cancelAtPeriodEnd && subscription.currentPeriodEnd < new Date()) {
      throw new SubscriptionError('Subscription has ended. Please renew to continue.');
    }
  }

  // Check feature availability
  if (subscriptionOptions.requiredFeatures?.length) {
    const subscription = await billingManager.getActiveSubscription(organizationId);
    
    if (!subscription) {
      throw new SubscriptionError('Subscription required for this feature');
    }

    const plans = await billingManager.getSubscriptionPlans();
    const currentPlan = plans.find(p => p.id === subscription.planId);
    
    if (!currentPlan) {
      throw new SubscriptionError('Invalid subscription plan');
    }

    // Check if all required features are included in the plan
    const missingFeatures = subscriptionOptions.requiredFeatures.filter(feature => {
      return !currentPlan.features.some(f => f.id === feature && f.included);
    });

    if (missingFeatures.length > 0) {
      throw new PlanLimitError(`This feature requires a higher plan. Missing features: ${missingFeatures.join(', ')}`);
    }
  }

  // Check usage limits
  if (subscriptionOptions.checkLimits) {
    const subscription = await billingManager.getActiveSubscription(organizationId);
    
    if (!subscription) {
      throw new SubscriptionError('Subscription required for limit checking');
    }

    const plans = await billingManager.getSubscriptionPlans();
    const currentPlan = plans.find(p => p.id === subscription.planId);
    
    if (!currentPlan) {
      throw new SubscriptionError('Invalid subscription plan');
    }

    // Check each limit
    for (const [limitType, requestedQuantity] of Object.entries(subscriptionOptions.checkLimits)) {
      const planLimit = currentPlan.limits[limitType];
      
      // -1 means unlimited
      if (planLimit === -1) continue;
      
      if (typeof planLimit === 'number' && planLimit > 0) {
        // Get current usage (simplified - in production you'd query actual usage)
        const currentUsage = await getCurrentUsage(organizationId, limitType);
        
        if (currentUsage + requestedQuantity > planLimit) {
          throw new PlanLimitError(`${limitType} limit exceeded. Current: ${currentUsage}, Limit: ${planLimit}`);
        }
      }
    }
  }
}

async function getCurrentUsage(organizationId: string, limitType: string): Promise<number> {
  // Skip for demo organization
  if (organizationId === 'demo-org-id') {
    return 0; // Demo has unlimited usage
  }

  // Check if database is available
  if (!isDatabaseAvailable()) {
    return 0; // Cannot check usage without database
  }

  // Dynamically import db to avoid initialization errors
  const { db } = await import('@/lib/db');

  // This is a simplified implementation. In production, you'd have more sophisticated usage tracking
  switch (limitType) {
    case 'users':
      const userCount = await db.client.user.count({
        where: { organizationId, isActive: true }
      });
      return userCount;
      
    case 'risks':
      const riskCount = await db.client.risk.count({
        where: { organizationId }
      });
      return riskCount;
      
    case 'controls':
      const controlCount = await db.client.control.count({
        where: { organizationId }
      });
      return controlCount;
      
    case 'documents':
      const documentCount = await db.client.document.count({
        where: { organizationId }
      });
      return documentCount;
      
    case 'aiQueries':
      // Get AI queries for current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const aiQueryCount = await db.client.aIUsageLog.count({
        where: {
          organizationId,
          createdAt: { gte: startOfMonth }
        }
      });
      return aiQueryCount;
      
    default:
      return 0;
  }
}

// ============================================================================
// MAIN MIDDLEWARE WRAPPER
// ============================================================================

export interface MiddlewareOptions {
  requireAuth?: boolean;
  requiredPermissions?: string[];
  rateLimit?: RateLimitConfig;
  validateBody?: z.ZodSchema;
  validateQuery?: z.ZodSchema;
  cors?: {
    origin?: string | string[];
    methods?: string[];
    headers?: string[];
  };
  subscription?: {
    requireActive?: boolean;
    requiredFeatures?: string[];
    trackUsage?: {
      type: string;
      quantity?: number;
      metadata?: Record<string, any>;
    };
    checkLimits?: {
      [key: string]: number; // e.g., { users: 1, risks: 1, aiQueries: 1 }
    };
  };
}

export function withAPI(
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse,
  options: MiddlewareOptions = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const requestId = crypto.randomUUID();
    
    try {
      // CORS handling
      if (options.cors) {
        const origin = req.headers.get('origin');
        const allowedOrigins = Array.isArray(options.cors.origin) 
          ? options.cors.origin 
          : [options.cors.origin].filter(Boolean);

        if (req.method === 'OPTIONS') {
          return new NextResponse(null, {
            status: 200,
            headers: {
              'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : '*',
              'Access-Control-Allow-Methods': options.cors.methods?.join(', ') || 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': options.cors.headers?.join(', ') || 'Content-Type, Authorization',
              'Access-Control-Max-Age': '86400',
            },
          });
        }
      }

      // Rate limiting
      if (options.rateLimit) {
        const rateLimiter = new RateLimiter(options.rateLimit);
        const { allowed, resetTime } = await rateLimiter.checkLimit(req);
        
        if (!allowed) {
          const response = createErrorResponse(
            new RateLimitError('Rate limit exceeded'),
            requestId
          );
          
          if (resetTime) {
            response.headers.set('X-RateLimit-Reset', String(resetTime));
          }
          
          return response;
        }
      }

      // Authentication
      if (options.requireAuth) {
        try {
          let user = null;
          
          // First try to get NextAuth session
          try {
            const session = await getServerSession(authOptions) as any;
            if (session?.user) {
              // Get full user data from database if we have a session
              if (isDatabaseAvailable()) {
                const { db } = await import('@/lib/db');
                const dbUser = await db.client.user.findUnique({
                  where: { email: session.user.email },
                  include: { organization: true }
                });
                
                if (dbUser) {
                  user = {
                    id: dbUser.id,
                    email: dbUser.email,
                    firstName: dbUser.firstName || '',
                    lastName: dbUser.lastName || '',
                    role: dbUser.role,
                    organizationId: dbUser.organizationId || '',
                    permissions: dbUser.role === 'ADMIN' ? ['*'] : [],
                    avatar: dbUser.avatar || '',
                    isActive: dbUser.isActive,
                    lastLoginAt: dbUser.lastLogin || undefined
                  };
                }
              } else {
                // Use session data directly if database is not available
                user = {
                  id: session.user.id || session.user.email,
                  email: session.user.email,
                  firstName: session.user.name?.split(' ')[0] || '',
                  lastName: session.user.name?.split(' ')[1] || '',
                  role: session.user.role || 'USER',
                  organizationId: session.user.organizationId || '',
                  permissions: session.user.role === 'ADMIN' ? ['*'] : [],
                  avatar: session.user.image || '',
                  isActive: true,
                  lastLoginAt: new Date()
                };
              }
            }
          } catch (sessionError) {
            console.log('[API Middleware] NextAuth session check failed:', sessionError);
          }
          
          // If no session, check for authenticated user from middleware (OAuth, etc)
          if (!user) {
            user = getAuthenticatedUser(req as any);
          }
          
          if (!user) {
            throw new AuthenticationError();
          }

          // Attach authenticated user to request for downstream handlers
          (req as any).user = user;

          // Permission checking
          if (options.requiredPermissions && options.requiredPermissions.length > 0) {
            const hasPermission = options.requiredPermissions.some(permission => 
              user.permissions.includes(permission) || user.permissions.includes('*')
            );

            if (!hasPermission) {
              throw new ForbiddenError('Insufficient permissions');
            }
          }
        } catch (error) {
          if (error instanceof APIError) {
            return createErrorResponse(error, requestId);
          }
          return createErrorResponse(new AuthenticationError(), requestId);
        }
      }

      // Query validation
      if (options.validateQuery) {
        try {
          validateQuery(options.validateQuery, req.nextUrl.searchParams);
        } catch (error) {
          return createErrorResponse(error as APIError, requestId);
        }
      }

      // Body validation
      if (options.validateBody && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
        try {
          await validateBody(options.validateBody)(req);
        } catch (error) {
          return createErrorResponse(error as APIError, requestId);
        }
      }

      // Subscription enforcement
      if (options.subscription && options.requireAuth) {
        try {
          const user = (req as any).user;
          if (!user || !user.organizationId) {
            throw new SubscriptionError('Organization required for subscription check');
          }

          await enforceSubscriptionLimits(user.organizationId, options.subscription);
        } catch (error) {
          return createErrorResponse(error as APIError, requestId);
        }
      }

      // Execute handler
      const response = await handler(req);

      // Track usage after successful request
      if (options.subscription?.trackUsage && options.requireAuth) {
        try {
          const user = (req as any).user;
          if (user?.organizationId && response.status < 400) {
            await billingManager.trackUsage(
              user.organizationId,
              options.subscription.trackUsage.type,
              options.subscription.trackUsage.quantity || 1,
              options.subscription.trackUsage.metadata
            );
          }
        } catch (error) {
          // Log but don't fail the request for usage tracking errors
          console.error('Failed to track usage:', error);
        }
      }

      // Add CORS headers to response
      if (options.cors) {
        const origin = req.headers.get('origin');
        const allowedOrigins = Array.isArray(options.cors.origin) 
          ? options.cors.origin 
          : [options.cors.origin].filter(Boolean);

        response.headers.set(
          'Access-Control-Allow-Origin', 
          origin && allowedOrigins.includes(origin) ? origin : '*'
        );
      }

      // Add request ID to response
      response.headers.set('X-Request-ID', requestId);

      return response;

    } catch (error) {
      console.error('API Error:', error);
      
      if (error instanceof APIError) {
        return createErrorResponse(error, requestId);
      }

      // Handle unexpected errors
      return createErrorResponse(
        new InternalServerError('An unexpected error occurred'),
        requestId
      );
    }
  };
}

// ============================================================================
// SPECIALIZED MIDDLEWARE
// ============================================================================

export function withAuth(requiredPermissions?: string[]) {
  return (
    handler: (req: NextRequest) => Promise<NextResponse> | NextResponse
  ) => {
    return withAPI(handler, {
      requireAuth: true,
      requiredPermissions,
    });
  };
}

export function withValidation<T, U>(
  bodySchema?: z.ZodSchema<T>,
  querySchema?: z.ZodSchema<U>
) {
  return (
    handler: (req: NextRequest, validatedBody?: T, validatedQuery?: U) => Promise<NextResponse> | NextResponse
  ) => {
    return withAPI(async (req: NextRequest) => {
      let validatedBody: T | undefined;
      let validatedQuery: U | undefined;

      if (bodySchema && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const body = await req.json();
        validatedBody = validateRequest(bodySchema, body);
      }

      if (querySchema) {
        validatedQuery = validateQuery(querySchema, req.nextUrl.searchParams);
      }

      return handler(req, validatedBody, validatedQuery);
    }, {
      validateBody: bodySchema,
      validateQuery: querySchema,
    });
  };
}

export function withRateLimit(config: RateLimitConfig) {
  return (
    handler: (req: NextRequest) => Promise<NextResponse> | NextResponse
  ) => {
    return withAPI(handler, { rateLimit: config });
  };
}

export function withCORS(corsOptions: MiddlewareOptions['cors']) {
  return (
    handler: (req: NextRequest) => Promise<NextResponse> | NextResponse
  ) => {
    return withAPI(handler, { cors: corsOptions });
  };
}

export function withSubscription(subscriptionOptions: MiddlewareOptions['subscription']) {
  return (
    handler: (req: NextRequest) => Promise<NextResponse> | NextResponse
  ) => {
    return withAPI(handler, {
      requireAuth: true,
      subscription: subscriptionOptions,
    });
  };
}

export function withFeatureGate(requiredFeatures: string[]) {
  return (
    handler: (req: NextRequest) => Promise<NextResponse> | NextResponse
  ) => {
    return withAPI(handler, {
      requireAuth: true,
      subscription: {
        requireActive: true,
        requiredFeatures,
      },
    });
  };
}

export function withUsageTracking(type: string, quantity?: number, metadata?: Record<string, any>) {
  return (
    handler: (req: NextRequest) => Promise<NextResponse> | NextResponse
  ) => {
    return withAPI(handler, {
      requireAuth: true,
      subscription: {
        trackUsage: { type, quantity, metadata },
      },
    });
  };
}

export function withPlanLimits(limits: Record<string, number>) {
  return (
    handler: (req: NextRequest) => Promise<NextResponse> | NextResponse
  ) => {
    return withAPI(handler, {
      requireAuth: true,
      subscription: {
        requireActive: true,
        checkLimits: limits,
      },
    });
  };
}

// ============================================================================
// HEALTH CHECK UTILITIES
// ============================================================================

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database?: { status: 'up' | 'down'; responseTime?: number };
    redis?: { status: 'up' | 'down'; responseTime?: number };
    external?: { status: 'up' | 'down'; responseTime?: number };
  };
}

export async function performHealthCheck(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  const result: HealthCheckResult = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks: {},
  };

  try {
    // Database health check
    const dbStart = Date.now();
    // Add your database health check here
    // await db.client.$queryRaw`SELECT 1`;
    result.checks.database = {
      status: 'up',
      responseTime: Date.now() - dbStart,
    };
  } catch (error) {
    result.checks.database = { status: 'down' };
    result.status = 'unhealthy';
  }

  return result;
}

// ============================================================================
// ALIASES FOR BACKWARD COMPATIBILITY
// ============================================================================

export const withApiMiddleware = withAPI;

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type {
  APIResponse,
  PaginationOptions,
  PaginationResult,
  SortOptions,
  MiddlewareOptions,
  RateLimitConfig,
  HealthCheckResult,
}; 