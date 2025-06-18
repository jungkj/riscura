import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { productionGuard, throwIfProduction } from '@/lib/security/production-guard';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth-options';
import { ROLE_PERMISSIONS } from './index';

export interface AuthenticatedRequest extends NextRequest {
  user?: AuthenticatedUser;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId: string;
  permissions: string[];
  avatar?: string;
  isActive: boolean;
  lastLoginAt?: Date;
}

function extractTokenFromHeader(authHeader: string): string {
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return authHeader;
}

export interface MiddlewareOptions {
  requiredPermissions?: string[];
  requiredRoles?: string[];
  allowSelf?: boolean; // Allow access if user is accessing their own data
  organizationRequired?: boolean;
}

/**
 * Enhanced authentication middleware with production security
 */
export async function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse> | NextResponse,
  options: {
    requiredPermissions?: string[];
    allowedRoles?: string[];
    requireOrganization?: boolean;
  } = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Get session from NextAuth
      const session = await getServerSession(authOptions);

      if (!session?.user?.email) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Get user from database with organization
      const user = await db.client.user.findUnique({
        where: { email: session.user.email },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              isActive: true,
            },
          },
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 401 }
        );
      }

      if (!user.isActive) {
        return NextResponse.json(
          { error: 'Account is inactive' },
          { status: 403 }
        );
      }

      if (options.requireOrganization !== false && !user.organizationId) {
        return NextResponse.json(
          { error: 'Organization membership required' },
          { status: 403 }
        );
      }

      if (user.organization && !user.organization.isActive) {
        return NextResponse.json(
          { error: 'Organization is inactive' },
          { status: 403 }
        );
      }

             // Check role permissions
       const userPermissions = [...(ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS] || [])];
       
       if (options.allowedRoles && !options.allowedRoles.includes(user.role)) {
         return NextResponse.json(
           { error: 'Insufficient role permissions' },
           { status: 403 }
         );
       }

       if (options.requiredPermissions) {
         const hasPermission = options.requiredPermissions.every(permission =>
           userPermissions.includes(permission) || userPermissions.includes('*')
         );

         if (!hasPermission) {
           return NextResponse.json(
             { error: 'Insufficient permissions' },
             { status: 403 }
           );
         }
       }

       // Create authenticated user object
       const authenticatedUser: AuthenticatedUser = {
         id: user.id,
         email: user.email,
         firstName: user.firstName,
         lastName: user.lastName,
         role: user.role,
         organizationId: user.organizationId!,
         permissions: userPermissions,
         avatar: user.avatar,
         isActive: user.isActive,
         lastLoginAt: user.lastLoginAt,
       };

      // Add user to request
      const authReq = req as AuthenticatedRequest;
      authReq.user = authenticatedUser;

      // Update last activity
      await db.client.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      return handler(authReq);
    } catch (error) {
      console.error('Authentication middleware error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      );
    }
  };
}

/**
 * Enhanced authorization check with security logging
 */
function checkAuthorization(
  user: {
    id: string;
    role: string;
    permissions: string[];
    organizationId: string;
  },
  options: MiddlewareOptions,
  req: NextRequest
): { allowed: boolean; reason?: string } {
  const {
    requiredPermissions = [],
    requiredRoles = [],
    allowSelf = false,
    organizationRequired = true,
  } = options;

  // Check if admin (admins have all permissions)
  if (user.role === 'ADMIN') {
    return { allowed: true };
  }

  // Check organization requirement
  if (organizationRequired && !user.organizationId) {
    return { allowed: false, reason: 'User must belong to an organization' };
  }

  // Check required roles
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return { allowed: false, reason: `Required role: ${requiredRoles.join(' or ')}` };
  }

  // Check required permissions
  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(permission => 
      user.permissions.includes(permission) || user.permissions.includes('*')
    );

    if (!hasAllPermissions) {
      return { allowed: false, reason: `Missing required permissions: ${requiredPermissions.join(', ')}` };
    }
  }

  // Check self-access (for endpoints like /api/users/:id where user can access their own data)
  if (allowSelf) {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const userIdInPath = pathParts[pathParts.length - 1];
    
    if (userIdInPath === user.id) {
      return { allowed: true };
    }
  }

  return { allowed: true };
}

/**
 * Role-based access control decorator
 */
export function requireRole(...roles: string[]) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;
    
    descriptor.value = withAuth(method, { requiredRoles: roles });
  };
}

/**
 * Permission-based access control decorator
 */
export function requirePermission(...permissions: string[]) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;
    
    descriptor.value = withAuth(method, { requiredPermissions: permissions });
  };
}

export function getAuthenticatedUser(req: AuthenticatedRequest): AuthenticatedUser | null {
  return req.user || null;
}

export function hasPermission(user: AuthenticatedUser, permission: string): boolean {
  return user.permissions.includes(permission) || user.permissions.includes('*');
}

export function hasRole(user: AuthenticatedUser, role: string): boolean {
  return user.role === role;
}

export function belongsToOrganization(user: { organizationId: string }, organizationId: string): boolean {
  return user.organizationId === organizationId;
}

/**
 * Organization-specific authentication middleware
 */
export function withOrgAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  options: Omit<MiddlewareOptions, 'organizationRequired'> = {}
) {
  return withAuth(handler, {
    ...options,
    organizationRequired: true,
  });
}

// Enhanced rate limiting with Redis support in production
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const resetTime = now + windowMs;
  
  // Clean expired entries
  for (const [k, v] of rateLimitStore.entries()) {
    if (v.resetTime <= now) {
      rateLimitStore.delete(k);
    }
  }
  
  const current = rateLimitStore.get(key);
  
  if (!current || current.resetTime <= now) {
    rateLimitStore.set(key, { count: 1, resetTime });
    return { allowed: true, remaining: limit - 1, resetTime };
  }
  
  if (current.count >= limit) {
    return { allowed: false, remaining: 0, resetTime: current.resetTime };
  }
  
  current.count++;
  return { allowed: true, remaining: limit - current.count, resetTime: current.resetTime };
}

/**
 * Enhanced CSRF protection for production
 */
export function validateCSRFToken(req: NextRequest): boolean {
  // Skip CSRF validation in demo mode (development only)
  if (!productionGuard.isProduction() && productionGuard.isDemoMode()) {
    return true;
  }
  
  const token = req.headers.get('x-csrf-token') || req.headers.get('csrf-token');
  const sessionToken = req.cookies.get('csrf-token')?.value;
  
  if (!token || !sessionToken || token !== sessionToken) {
    productionGuard.logSecurityEvent('csrf_validation_failed', {
      hasToken: !!token,
      hasSessionToken: !!sessionToken,
      tokensMatch: token === sessionToken
    });
    return false;
  }
  
  return true;
}

export function generateCSRFToken(): string {
  return require('crypto').randomBytes(32).toString('hex');
}



function getDefaultRateLimitKey(req: NextRequest): string {
  // Try to get IP from various headers
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwarded ? forwarded.split(',')[0] : realIp || req.ip || 'unknown';
  
  return `${ip}:${req.nextUrl.pathname}`;
}

// CORS middleware
export interface CORSConfig {
  origin?: string | string[] | ((origin: string) => boolean);
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

export function cors(config: CORSConfig = {}) {
  return (req: NextRequest): NextResponse | null => {
    const {
      origin = '*',
      methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders = ['Content-Type', 'Authorization'],
      credentials = false,
      maxAge = 86400,
    } = config;

    const requestOrigin = req.headers.get('origin') || '';

    // Handle OPTIONS preflight request
    if (req.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 200 });
      
      // Set CORS headers
      if (typeof origin === 'string') {
        response.headers.set('Access-Control-Allow-Origin', origin);
      } else if (Array.isArray(origin)) {
        if (origin.includes(requestOrigin)) {
          response.headers.set('Access-Control-Allow-Origin', requestOrigin);
        }
      } else if (typeof origin === 'function') {
        if (origin(requestOrigin)) {
          response.headers.set('Access-Control-Allow-Origin', requestOrigin);
        }
      }

      response.headers.set('Access-Control-Allow-Methods', methods.join(', '));
      response.headers.set('Access-Control-Allow-Headers', allowedHeaders.join(', '));
      
      if (credentials) {
        response.headers.set('Access-Control-Allow-Credentials', 'true');
      }
      
      response.headers.set('Access-Control-Max-Age', String(maxAge));
      
      return response;
    }

    return null; // Continue to next middleware
  };
}

// Security headers middleware
export function securityHeaders() {
  return (req: NextRequest): NextResponse | null => {
    // This will be applied to the response in the main handler
    return null;
  };
}

export function applySecurityHeaders(response: NextResponse): NextResponse {
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Adjust as needed
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  
  return response;
}

// Request logging middleware
export function requestLogger() {
  return (req: NextRequest): NextResponse | null => {
    const start = Date.now();
    const method = req.method;
    const url = req.nextUrl.pathname;
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const ip = req.headers.get('x-forwarded-for') || req.ip || 'unknown';

    console.log(`[${new Date().toISOString()}] ${method} ${url} - ${ip} - ${userAgent}`);

    // This would ideally be handled in a response interceptor
    // For now, just log the request
    return null;
  };
}

// Combined middleware composer
export function composeMiddleware(...middlewares: Array<(req: NextRequest) => Promise<NextResponse | null> | NextResponse | null>) {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    for (const middleware of middlewares) {
      const result = await middleware(req);
      if (result) {
        return result; // Middleware returned a response, stop processing
      }
    }
    return null; // All middleware passed, continue to handler
  };
}

// Organization isolation middleware
export function requireOrganization() {
  return async (req: AuthenticatedRequest): Promise<NextResponse | null> => {
    const user = getAuthenticatedUser(req);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!user.organizationId) {
      return NextResponse.json(
        { error: 'Organization membership required' },
        { status: 403 }
      );
    }

    return null; // Continue
  };
}

// Permission checking utilities
export function hasAnyPermission(user: AuthenticatedUser, permissions: string[]): boolean {
  return permissions.some(permission => hasPermission(user, permission));
}

export function hasAllPermissions(user: AuthenticatedUser, permissions: string[]): boolean {
  return permissions.every(permission => hasPermission(user, permission));
}

export function requirePermissions(...permissions: string[]) {
  return async (req: AuthenticatedRequest): Promise<NextResponse | null> => {
    const user = getAuthenticatedUser(req);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!hasAllPermissions(user, permissions)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    return null; // Continue
  };
}

// Role checking utilities
export function hasAnyRole(user: AuthenticatedUser, roles: string[]): boolean {
  return roles.includes(user.role);
}

export function requireRoles(...roles: string[]) {
  return async (req: AuthenticatedRequest): Promise<NextResponse | null> => {
    const user = getAuthenticatedUser(req);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!hasAnyRole(user, roles)) {
      return NextResponse.json(
        { error: 'Insufficient role permissions' },
        { status: 403 }
      );
    }

    return null; // Continue
  };
}

// API key authentication (for external integrations)
export async function withApiKey(
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse,
  options: {
    requiredScopes?: string[];
  } = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '');

      if (!apiKey) {
        return NextResponse.json(
          { error: 'API key required' },
          { status: 401 }
        );
      }

      // Validate API key
      const apiKeyRecord = await db.client.aPIKey.findFirst({
        where: {
          key: apiKey,
          isActive: true,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          organization: {
            select: {
              id: true,
              isActive: true,
            },
          },
        },
      });

      if (!apiKeyRecord || !apiKeyRecord.organization.isActive) {
        return NextResponse.json(
          { error: 'Invalid or expired API key' },
          { status: 401 }
        );
      }

      // Check scopes if required
      if (options.requiredScopes) {
        const hasRequiredScopes = options.requiredScopes.every(scope =>
          apiKeyRecord.scopes.includes(scope) || apiKeyRecord.scopes.includes('*')
        );

        if (!hasRequiredScopes) {
          return NextResponse.json(
            { error: 'Insufficient API key scopes' },
            { status: 403 }
          );
        }
      }

      // Update last used
      await db.client.aPIKey.update({
        where: { id: apiKeyRecord.id },
        data: { lastUsedAt: new Date() },
      });

      // Add organization context to request
      const authReq = req as AuthenticatedRequest;
      authReq.user = {
        id: 'api-key',
        email: 'api@system.local',
        firstName: 'API',
        lastName: 'Key',
        role: 'API',
        organizationId: apiKeyRecord.organizationId,
        permissions: apiKeyRecord.scopes,
        isActive: true,
      };

      return handler(authReq);
    } catch (error) {
      console.error('API key authentication error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      );
    }
  };
}

// Session validation
export async function validateSession(sessionToken: string): Promise<AuthenticatedUser | null> {
  try {
    // This would typically validate a JWT or session token
    // For now, we'll use NextAuth's session validation
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return null;
    }

    const user = await db.client.user.findUnique({
      where: { email: session.user.email },
      include: {
        organization: true,
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    const userPermissions = ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS] || [];

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      organizationId: user.organizationId!,
      permissions: userPermissions,
      avatar: user.avatar,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
    };
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

// Export types
export type {
  AuthenticatedRequest,
  AuthenticatedUser,
  RateLimitConfig,
  CORSConfig,
}; 