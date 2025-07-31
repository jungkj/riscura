import { NextRequest, NextResponse } from 'next/server';
import { securityHeaders } from '@/lib/security/headers';
import { csrfProtection } from '@/lib/security/csrf';
import { inputSanitizer } from '@/lib/security/input-sanitizer';
import { productionGuard } from '@/lib/security/production-guard';
import { rateLimitConfig } from '@/config/env';

/**
 * Integrated Security Middleware
 * Combines all security measures into a single, comprehensive system
 */

export interface SecurityMiddlewareOptions {
  // Authentication
  requireAuth?: boolean;
  requiredRoles?: string[];
  requiredPermissions?: string[];

  // CSRF Protection
  enableCSRF?: boolean;
  csrfExcludeMethods?: string[];

  // Rate Limiting
  enableRateLimit?: boolean;
  rateLimitType?: 'default' | 'auth' | 'upload' | 'api';
  customRateLimit?: {
    max: number;
    windowMs: number;
    keyGenerator?: (req: NextRequest) => string;
  };

  // Input Sanitization
  sanitizeInput?: boolean;
  sanitizationConfig?: 'strict' | 'basic' | 'rich' | 'text';

  // Security Headers
  enableSecurityHeaders?: boolean;
  customHeaders?: Record<string, string>;

  // CORS
  enableCORS?: boolean;
  corsOrigins?: string[];
  corsMethods?: string[];
  corsHeaders?: string[];

  // Logging
  enableSecurityLogging?: boolean;
  logLevel?: 'error' | 'warn' | 'info' | 'debug';

  // Custom validation
  customValidation?: (req: NextRequest) => Promise<{ isValid: boolean; error?: string }>;
}

const DEFAULT_SECURITY_OPTIONS: SecurityMiddlewareOptions = {
  requireAuth: false,
  enableCSRF: true,
  csrfExcludeMethods: ['GET', 'HEAD', 'OPTIONS'],
  enableRateLimit: true,
  rateLimitType: 'default',
  sanitizeInput: true,
  sanitizationConfig: 'basic',
  enableSecurityHeaders: true,
  enableCORS: false,
  enableSecurityLogging: true,
  logLevel: productionGuard.isProduction() ? 'warn' : 'info',
};

/**
 * Security Middleware Manager
 */
export class SecurityMiddleware {
  private static instance: SecurityMiddleware;
  private rateLimitStore = new Map<string, { count: number; resetTime: number }>();

  private constructor() {}

  public static getInstance(): SecurityMiddleware {
    if (!SecurityMiddleware.instance) {
      SecurityMiddleware.instance = new SecurityMiddleware();
    }
    return SecurityMiddleware.instance;
  }

  /**
   * Apply comprehensive security middleware
   */
  async applySecurityMiddleware(
    request: NextRequest,
    options: SecurityMiddlewareOptions = {}
  ): Promise<{ response?: NextResponse; proceed: boolean; context?: any }> {
    const config = { ...DEFAULT_SECURITY_OPTIONS, ...options };
    const context: any = {
      startTime: Date.now(),
      ip: this.getClientIP(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      path: new URL(request.url).pathname,
      method: request.method,
    };

    try {
      // 1. Security Headers Check
      if (config.enableSecurityHeaders) {
        context.securityHeaders = securityHeaders.getHeaders();
      }

      // 2. Production Guard Checks
      if (productionGuard.isProduction()) {
        const productionCheck = this.validateProductionSecurity(request);
        if (!productionCheck.isValid) {
          return {
            response: this.createSecurityErrorResponse(
              'Production security violation',
              403,
              productionCheck.details
            ),
            proceed: false,
            context,
          };
        }
      }

      // 3. Rate Limiting
      if (config.enableRateLimit) {
        const rateLimitResult = this.checkRateLimit(request, config);
        if (!rateLimitResult.allowed) {
          productionGuard.logSecurityEvent('rate_limit_exceeded', {
            ip: context.ip,
            path: context.path,
            method: context.method,
            limit: rateLimitResult.limit,
            resetTime: rateLimitResult.resetTime,
          });

          return {
            response: this.createRateLimitResponse(rateLimitResult),
            proceed: false,
            context,
          };
        }
        context.rateLimit = rateLimitResult;
      }

      // 4. CORS Handling
      if (config.enableCORS) {
        const corsResult = this.handleCORS(request, config);
        if (corsResult.response) {
          return {
            response: corsResult.response,
            proceed: false,
            context,
          };
        }
        context.cors = corsResult.headers;
      }

      // 5. CSRF Protection
      if (config.enableCSRF && !config.csrfExcludeMethods?.includes(request.method)) {
        const csrfResult = csrfProtection.validateRequest(request);
        if (!csrfResult.isValid) {
          productionGuard.logSecurityEvent('csrf_validation_failed', {
            ip: context.ip,
            path: context.path,
            method: context.method,
            reason: csrfResult.reason,
          });

          return {
            response: this.createSecurityErrorResponse('CSRF validation failed', 403, {
              reason: csrfResult.reason,
            }),
            proceed: false,
            context,
          };
        }
        context.csrf = csrfResult;
      }

      // 6. Input Sanitization
      if (config.sanitizeInput && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        try {
          const sanitizedInput = await this.sanitizeRequestInput(request, config);
          context.sanitizedInput = sanitizedInput;
        } catch (error) {
          productionGuard.logSecurityEvent('input_sanitization_failed', {
            ip: context.ip,
            path: context.path,
            error: error instanceof Error ? error.message : 'Unknown error',
          });

          return {
            response: this.createSecurityErrorResponse('Invalid input data', 400, {
              error: 'Input validation failed',
            }),
            proceed: false,
            context,
          };
        }
      }

      // 7. Custom Validation
      if (config.customValidation) {
        const customResult = await config.customValidation(request);
        if (!customResult.isValid) {
          return {
            response: this.createSecurityErrorResponse('Custom validation failed', 400, {
              error: customResult.error,
            }),
            proceed: false,
            context,
          };
        }
      }

      // 8. Security Logging
      if (config.enableSecurityLogging) {
        this.logSecurityEvent('security_middleware_passed', context, config.logLevel);
      }

      return { proceed: true, context };
    } catch (error) {
      productionGuard.logSecurityEvent('security_middleware_error', {
        ip: context.ip,
        path: context.path,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      return {
        response: this.createSecurityErrorResponse('Security check failed', 500, {
          error: 'Internal security error',
        }),
        proceed: false,
        context,
      };
    }
  }

  /**
   * Create secure response with all security measures applied
   */
  createSecureResponse(
    body: any,
    init: ResponseInit & {
      context?: any;
      options?: SecurityMiddlewareOptions;
    } = {}
  ): NextResponse {
    const { context, options, ...responseInit } = init;
    const config = { ...DEFAULT_SECURITY_OPTIONS, ...options };

    const response = NextResponse.json(body, responseInit);

    // Apply security headers
    if (config.enableSecurityHeaders) {
      securityHeaders.applyToResponse(response);
    }

    // Apply custom headers
    if (config.customHeaders) {
      Object.entries(config.customHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }

    // Apply CORS headers
    if (context?.cors) {
      Object.entries(context.cors).forEach(([key, value]: [string, string]) => {
        response.headers.set(key, value);
      });
    }

    // Set CSRF token if needed
    if (config.enableCSRF && context?.csrf?.shouldRotate) {
      const newToken = csrfProtection.generateToken();
      csrfProtection.setTokenCookie(response, newToken);
    }

    // Add security metadata
    response.headers.set('X-Security-Version', '1.0');
    response.headers.set('X-Request-ID', context?.requestId || this.generateRequestId());
    response.headers.set(
      'X-Processing-Time',
      context ? `${Date.now() - context.startTime}ms` : '0ms'
    );

    return response;
  }

  /**
   * Production security validation
   */
  private validateProductionSecurity(request: NextRequest): { isValid: boolean; details?: any } {
    const issues: string[] = [];

    // Check for development tokens
    const auth = request.headers.get('authorization');
    if (auth && (auth.includes('demo-') || auth.includes('test-') || auth.includes('dev-'))) {
      issues.push('Development tokens not allowed in production');
    }

    // Check for suspicious user agents
    const userAgent = request.headers.get('user-agent');
    if (!userAgent || userAgent.length < 10) {
      issues.push('Invalid or missing user agent');
    }

    // Check for suspicious origins
    const origin = request.headers.get('origin');
    if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      issues.push('Localhost origins not allowed in production');
    }

    return {
      isValid: issues.length === 0,
      details: issues.length > 0 ? { issues } : undefined,
    };
  }

  /**
   * Rate limiting implementation
   */
  private checkRateLimit(
    request: NextRequest,
    config: SecurityMiddlewareOptions
  ): { allowed: boolean; remaining: number; resetTime: number; limit: number } {
    const rateLimitOptions =
      config.customRateLimit || rateLimitConfig[config.rateLimitType || 'default'];

    const key = config.customRateLimit?.keyGenerator
      ? config.customRateLimit.keyGenerator(request)
      : this.getClientIP(request);

    const now = Date.now();
    const windowStart = now - rateLimitOptions.windowMs;

    // Clean expired entries
    for (const [k, v] of this.rateLimitStore.entries()) {
      if (v.resetTime < now) {
        this.rateLimitStore.delete(k);
      }
    }

    const current = this.rateLimitStore.get(key);
    const resetTime = now + rateLimitOptions.windowMs;

    if (!current || current.resetTime <= now) {
      this.rateLimitStore.set(key, { count: 1, resetTime });
      return {
        allowed: true,
        remaining: rateLimitOptions.max - 1,
        resetTime,
        limit: rateLimitOptions.max,
      };
    }

    if (current.count >= rateLimitOptions.max) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: current.resetTime,
        limit: rateLimitOptions.max,
      };
    }

    current.count++;
    return {
      allowed: true,
      remaining: rateLimitOptions.max - current.count,
      resetTime: current.resetTime,
      limit: rateLimitOptions.max,
    };
  }

  /**
   * CORS handling
   */
  private handleCORS(
    request: NextRequest,
    config: SecurityMiddlewareOptions
  ): { response?: NextResponse; headers?: Record<string, string> } {
    const origin = request.headers.get('origin');
    const method = request.method;

    // Handle preflight requests
    if (method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 200 });

      if (origin && this.isOriginAllowed(origin, config.corsOrigins)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Access-Control-Allow-Credentials', 'true');
        response.headers.set(
          'Access-Control-Allow-Methods',
          config.corsMethods?.join(', ') || 'GET, POST, PUT, DELETE, OPTIONS'
        );
        response.headers.set(
          'Access-Control-Allow-Headers',
          config.corsHeaders?.join(', ') || 'Content-Type, Authorization, X-CSRF-Token'
        );
        response.headers.set('Access-Control-Max-Age', '86400');
      }

      return { response };
    }

    // Set CORS headers for actual requests
    const headers: Record<string, string> = {};
    if (origin && this.isOriginAllowed(origin, config.corsOrigins)) {
      headers['Access-Control-Allow-Origin'] = origin;
      headers['Access-Control-Allow-Credentials'] = 'true';
    }

    return { headers };
  }

  /**
   * Check if origin is allowed
   */
  private isOriginAllowed(origin: string, allowedOrigins?: string[]): boolean {
    if (!allowedOrigins || allowedOrigins.length === 0) {
      return false;
    }

    return allowedOrigins.some((allowed) => {
      if (allowed === '*') return true;
      if (allowed.startsWith('*.')) {
        const domain = allowed.substring(2);
        return origin.endsWith(domain);
      }
      return origin === allowed;
    });
  }

  /**
   * Sanitize request input
   */
  private async sanitizeRequestInput(
    request: NextRequest,
    config: SecurityMiddlewareOptions
  ): Promise<any> {
    try {
      const contentType = request.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        const body = await request.json();
        return inputSanitizer.sanitizeObject(body);
      }

      if (contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await request.formData();
        const sanitized: Record<string, any> = {};

        for (const [key, value] of formData.entries()) {
          if (typeof value === 'string') {
            sanitized[key] = inputSanitizer.sanitizeText(value);
          } else {
            sanitized[key] = value; // File objects
          }
        }

        return sanitized;
      }

      return null;
    } catch (error) {
      throw new Error('Failed to parse or sanitize request body');
    }
  }

  /**
   * Create security error response
   */
  private createSecurityErrorResponse(
    message: string,
    status: number,
    details?: any
  ): NextResponse {
    const response = NextResponse.json(
      {
        error: message,
        code: `SECURITY_ERROR_${status}`,
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId(),
        ...(productionGuard.isProduction() ? {} : { details }),
      },
      { status }
    );

    // Apply security headers even to error responses
    securityHeaders.applyToResponse(response);

    return response;
  }

  /**
   * Create rate limit error response
   */
  private createRateLimitResponse(rateLimitResult: any): NextResponse {
    const response = NextResponse.json(
      {
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        limit: rateLimitResult.limit,
        remaining: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime,
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
      },
      { status: 429 }
    );

    // Set rate limit headers
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());
    response.headers.set(
      'Retry-After',
      Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
    );

    securityHeaders.applyToResponse(response);

    return response;
  }

  /**
   * Get client IP address
   */
  private getClientIP(request: NextRequest): string {
    return (
      request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown'
    );
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return require('crypto').randomBytes(16).toString('hex');
  }

  /**
   * Log security events
   */
  private logSecurityEvent(event: string, context: any, level: string = 'info'): void {
    if (productionGuard.isProduction()) {
      // In production, use structured logging
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level,
          event,
          context: {
            ...context,
            environment: 'production',
          },
        })
      );
    } else if (level !== 'debug') {
      // In development, use readable format for non-debug events
      console.log(`🛡️ Security Event [${level.toUpperCase()}]: ${event}`, context);
    }
  }
}

// Export singleton instance
export const securityMiddleware = SecurityMiddleware.getInstance();

// Utility function for applying comprehensive security
export async function withComprehensiveSecurity(
  request: NextRequest,
  options: SecurityMiddlewareOptions = {}
) {
  return securityMiddleware.applySecurityMiddleware(request, options);
}

// Higher-order function for API routes
export function createSecureAPIHandler(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>,
  options: SecurityMiddlewareOptions = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const securityResult = await securityMiddleware.applySecurityMiddleware(req, options);

    if (!securityResult.proceed) {
      return securityResult.response!;
    }

    try {
      const response = await handler(req, securityResult.context);
      return securityMiddleware.createSecureResponse(await response.json().catch(() => null), {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        context: securityResult.context,
        options,
      });
    } catch (error) {
      productionGuard.logSecurityEvent('api_handler_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        path: new URL(req.url).pathname,
        method: req.method,
      });

      return securityMiddleware.createSecureResponse(
        { error: 'Internal server error' },
        { status: 500, context: securityResult.context, options }
      );
    }
  };
}

// Pre-configured security profiles
export const SECURITY_PROFILES = {
  // Public endpoints (minimal security)
  public: {
    requireAuth: false,
    enableCSRF: false,
    enableRateLimit: true,
    rateLimitType: 'default' as const,
    sanitizeInput: true,
    sanitizationConfig: 'strict' as const,
  },

  // Authenticated endpoints
  authenticated: {
    requireAuth: true,
    enableCSRF: true,
    enableRateLimit: true,
    rateLimitType: 'api' as const,
    sanitizeInput: true,
    sanitizationConfig: 'basic' as const,
  },

  // Admin endpoints (maximum security)
  admin: {
    requireAuth: true,
    requiredRoles: ['ADMIN'],
    enableCSRF: true,
    enableRateLimit: true,
    rateLimitType: 'api' as const,
    sanitizeInput: true,
    sanitizationConfig: 'strict' as const,
    enableSecurityLogging: true,
  },

  // File upload endpoints
  upload: {
    requireAuth: true,
    enableCSRF: true,
    enableRateLimit: true,
    rateLimitType: 'upload' as const,
    sanitizeInput: true,
    sanitizationConfig: 'text' as const,
  },

  // Authentication endpoints
  auth: {
    requireAuth: false,
    enableCSRF: true,
    enableRateLimit: true,
    rateLimitType: 'auth' as const,
    sanitizeInput: true,
    sanitizationConfig: 'strict' as const,
  },
} satisfies Record<string, SecurityMiddlewareOptions>;
