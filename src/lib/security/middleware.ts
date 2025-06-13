import { NextRequest, NextResponse } from 'next/server';
import { accessControl, Permission } from './access-control';
import { documentEncryption } from './document-encryption';

// Rate limiting configuration
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (request: NextRequest) => string;
}

// Security headers configuration
const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'wasm-unsafe-eval'", // Allow WASM for performance
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "media-src 'none'",
    "object-src 'none'",
    "child-src 'none'",
    "worker-src 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'"
  ].join('; ')
};

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Comprehensive security middleware
 */
export class SecurityMiddleware {
  private static instance: SecurityMiddleware;

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
  public async applySecurityMiddleware(
    request: NextRequest,
    options: {
      requireAuth?: boolean;
      requiredPermissions?: Permission[];
      rateLimit?: RateLimitConfig;
      allowCors?: boolean;
      corsOrigins?: string[];
    } = {}
  ): Promise<NextResponse | null> {
    try {
      // 1. Apply rate limiting
      if (options.rateLimit) {
        const rateLimitResult = this.checkRateLimit(request, options.rateLimit);
        if (!rateLimitResult.allowed) {
          return this.createErrorResponse(
            'Too Many Requests',
            429,
            {
              'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
              'X-RateLimit-Limit': options.rateLimit.maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
            }
          );
        }
      }

      // 2. Validate request origin and security headers
      const securityCheckResult = this.performSecurityChecks(request);
      if (!securityCheckResult.passed) {
        return this.createErrorResponse('Security Check Failed', 403);
      }

      // 3. Handle CORS if enabled
      if (options.allowCors) {
        const corsResponse = this.handleCors(request, options.corsOrigins);
        if (corsResponse) {
          return corsResponse;
        }
      }

      // 4. Authentication and authorization
      if (options.requireAuth) {
        const authResult = await this.authenticateRequest(request);
        if (!authResult.authenticated) {
          return this.createErrorResponse('Authentication Required', 401);
        }

        // Check permissions if required
        if (options.requiredPermissions && options.requiredPermissions.length > 0) {
          const hasPermission = options.requiredPermissions.some(perm =>
            accessControl.hasPermission(authResult.permissions, perm)
          );

          if (!hasPermission) {
            return this.createErrorResponse('Insufficient Permissions', 403);
          }
        }
      }

      // If all checks pass, return null to continue processing
      return null;

    } catch (error) {
      console.error('Security middleware error:', error);
      return this.createErrorResponse('Internal Security Error', 500);
    }
  }

  /**
   * Rate limiting implementation
   */
  private checkRateLimit(request: NextRequest, config: RateLimitConfig): {
    allowed: boolean;
    resetTime: number;
  } {
    const key = config.keyGenerator ? config.keyGenerator(request) : this.getClientIP(request);
    const now = Date.now();
    const windowKey = `${key}:${Math.floor(now / config.windowMs)}`;
    
    const current = rateLimitStore.get(windowKey) || { count: 0, resetTime: now + config.windowMs };
    
    if (current.count >= config.maxRequests) {
      return { allowed: false, resetTime: current.resetTime };
    }

    current.count++;
    rateLimitStore.set(windowKey, current);

    // Cleanup old entries
    this.cleanupRateLimit();

    return { allowed: true, resetTime: current.resetTime };
  }

  /**
   * Security checks including suspicious request detection
   */
  private performSecurityChecks(request: NextRequest): { passed: boolean; reason?: string } {
    const url = new URL(request.url);
    const userAgent = request.headers.get('user-agent') || '';
    const contentType = request.headers.get('content-type') || '';

    // Check for common attack patterns
    const suspiciousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /onload=/gi,
      /onerror=/gi,
      /eval\(/gi,
      /document\.cookie/gi,
      /\.\.\/\.\.\//g,
      /%2e%2e%2f/gi,
      /union.*select/gi,
      /drop.*table/gi,
      /insert.*into/gi,
      /delete.*from/gi
    ];

    // Check URL for suspicious patterns
    const fullUrl = url.pathname + url.search;
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(fullUrl)) {
        return { passed: false, reason: 'Suspicious URL pattern detected' };
      }
    }

    // Check for bot/crawler user agents that might be malicious
    const suspiciousUserAgents = [
      /sqlmap/i,
      /nikto/i,
      /nmap/i,
      /masscan/i,
      /zap/i,
      /burp/i,
      /acunetix/i,
      /netsparker/i
    ];

    for (const pattern of suspiciousUserAgents) {
      if (pattern.test(userAgent)) {
        return { passed: false, reason: 'Suspicious user agent detected' };
      }
    }

    // Check content type for potential attacks
    if (request.method === 'POST' && contentType) {
      const allowedContentTypes = [
        'application/json',
        'application/x-www-form-urlencoded',
        'multipart/form-data',
        'text/plain'
      ];

      if (!allowedContentTypes.some(type => contentType.startsWith(type))) {
        return { passed: false, reason: 'Invalid content type' };
      }
    }

    return { passed: true };
  }

  /**
   * Handle CORS requests
   */
  private handleCors(request: NextRequest, allowedOrigins?: string[]): NextResponse | null {
    const origin = request.headers.get('origin');
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 200 });
      
      if (origin && this.isOriginAllowed(origin, allowedOrigins)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
      }
      
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      response.headers.set('Access-Control-Max-Age', '86400');
      
      return response;
    }

    return null;
  }

  /**
   * Check if origin is allowed
   */
  private isOriginAllowed(origin: string, allowedOrigins?: string[]): boolean {
    if (!allowedOrigins || allowedOrigins.length === 0) {
      return false;
    }

    // Check exact match
    if (allowedOrigins.includes(origin)) {
      return true;
    }

    // Check wildcard patterns
    return allowedOrigins.some(allowed => {
      if (allowed === '*') return true;
      if (allowed.startsWith('*.')) {
        const domain = allowed.slice(2);
        return origin.endsWith(domain);
      }
      return false;
    });
  }

  /**
   * Authenticate request using various methods
   */
  private async authenticateRequest(request: NextRequest): Promise<{
    authenticated: boolean;
    userId?: string;
    role?: string;
    permissions: Permission[];
  }> {
    // Try different authentication methods

    // 1. Check for API key in headers
    const apiKey = request.headers.get('x-api-key');
    if (apiKey) {
      const apiAuthResult = await this.authenticateApiKey(apiKey);
      if (apiAuthResult.valid) {
        return {
          authenticated: true,
          userId: apiAuthResult.userId,
          role: apiAuthResult.role,
          permissions: apiAuthResult.permissions
        };
      }
    }

    // 2. Check for Bearer token
    const authorization = request.headers.get('authorization');
    if (authorization?.startsWith('Bearer ')) {
      const token = authorization.slice(7);
      const tokenResult = documentEncryption.verifySecureToken(token);
      if (tokenResult.valid) {
        return {
          authenticated: true,
          userId: tokenResult.payload.userId,
          role: tokenResult.payload.role || 'USER',
          permissions: tokenResult.payload.permissions || []
        };
      }
    }

    // 3. Check for session cookies
    const refreshToken = request.cookies.get('refreshToken')?.value;
    const demoUser = request.cookies.get('demo-user')?.value;

    if (refreshToken || demoUser) {
      // In a real implementation, validate these against the database
      const permissions = demoUser ? ['*'] : ['document:read'];
      return {
        authenticated: true,
        userId: 'demo-user-id',
        role: 'ADMIN',
        permissions: permissions as Permission[]
      };
    }

    return { authenticated: false, permissions: [] };
  }

  /**
   * Authenticate API key
   */
  private async authenticateApiKey(apiKey: string): Promise<{
    valid: boolean;
    userId?: string;
    role?: string;
    permissions: Permission[];
  }> {
    try {
      // Import database connection
      const { db } = await import('@/lib/database/connection');
      
      // Query database for valid API key
      const apiKeyRecord = await db.aPIKey.findFirst({
        where: {
          key: apiKey,
          isActive: true,
          expiresAt: {
            gt: new Date()
          }
        },
        include: {
          organization: true,
          user: true
        }
      });

      if (!apiKeyRecord) {
        return { valid: false, permissions: [] };
      }

      // Update last used timestamp
      await db.aPIKey.update({
        where: { id: apiKeyRecord.id },
        data: { lastUsedAt: new Date() }
      });

      return {
        valid: true,
        userId: apiKeyRecord.userId || undefined,
        role: apiKeyRecord.user?.role || 'USER',
        permissions: apiKeyRecord.permissions as Permission[]
      };
    } catch (error) {
      console.error('API key authentication error:', error);
      return { valid: false, permissions: [] };
    }
  }

  /**
   * Create error response with security headers
   */
  private createErrorResponse(
    message: string,
    status: number,
    additionalHeaders: Record<string, string> = {}
  ): NextResponse {
    const response = NextResponse.json(
      { 
        error: message,
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      },
      { status }
    );

    // Apply security headers
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    // Apply additional headers
    Object.entries(additionalHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

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
   * Cleanup old rate limit entries
   */
  private cleanupRateLimit(): void {
    const now = Date.now();
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }

  /**
   * Apply security headers to response
   */
  public applySecurityHeaders(response: NextResponse): NextResponse {
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }

  /**
   * Create secure document download response
   */
  public createSecureDownloadResponse(
    fileContent: Buffer,
    fileName: string,
    mimeType: string,
    userId: string,
    documentId: string
  ): NextResponse {
    // Create watermark
    const userEmail = 'user@example.com'; // Would get from user context
    const watermark = documentEncryption.createWatermark(documentId, userId, userEmail);

    const response = new NextResponse(fileContent, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileContent.length.toString(),
        'X-Document-Watermark': watermark,
        'X-Download-Timestamp': new Date().toISOString(),
        'X-User-ID': userId,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    // Apply security headers
    return this.applySecurityHeaders(response);
  }
}

// Export singleton instance
export const securityMiddleware = SecurityMiddleware.getInstance();

// Utility function to create rate limit key generators
export function createRateLimitKeyGenerator(
  type: 'ip' | 'user' | 'api-key' | 'custom',
  customGenerator?: (request: NextRequest) => string
) {
  return (request: NextRequest): string => {
    switch (type) {
      case 'ip':
        return securityMiddleware['getClientIP'](request);
      case 'user':
        const userId = request.headers.get('x-user-id') || 'anonymous';
        return `user:${userId}`;
      case 'api-key':
        const apiKey = request.headers.get('x-api-key') || 'none';
        return `api:${apiKey}`;
      case 'custom':
        return customGenerator ? customGenerator(request) : 'default';
      default:
        return 'default';
    }
  };
}

// Pre-configured rate limits for different endpoints
export const RATE_LIMITS = {
  // Authentication endpoints - stricter limits
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    keyGenerator: createRateLimitKeyGenerator('ip')
  },
  
  // API endpoints - moderate limits
  API: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    keyGenerator: createRateLimitKeyGenerator('user')
  },
  
  // File uploads - strict limits
  UPLOAD: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    keyGenerator: createRateLimitKeyGenerator('user')
  },
  
  // Document access - moderate limits
  DOCUMENT: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 50,
    keyGenerator: createRateLimitKeyGenerator('user')
  }
};

// CORS configurations for different environments
export const CORS_CONFIGS = {
  DEVELOPMENT: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3004'],
  STAGING: ['https://staging.riscura.com'],
  PRODUCTION: ['https://app.riscura.com', 'https://riscura.com']
}; 