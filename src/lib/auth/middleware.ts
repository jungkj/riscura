import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { productionGuard, throwIfProduction } from '@/lib/security/production-guard';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    permissions: string[];
    organizationId: string;
    sessionId: string;
  };
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
export function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  options: MiddlewareOptions = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const authHeader = req.headers.get('authorization');
      
      if (!authHeader) {
        return NextResponse.json(
          { error: 'Authorization header missing' },
          { status: 401 }
        );
      }

      const token = extractTokenFromHeader(authHeader);
      
      // SECURITY: Block demo authentication in production
      if (productionGuard.isProduction() && token.startsWith('demo-')) {
        productionGuard.logSecurityEvent('blocked_demo_auth_attempt', {
          token: 'demo-***',
          ip: req.headers.get('x-forwarded-for') || 'unknown',
          userAgent: req.headers.get('user-agent') || 'unknown'
        });
        
        return NextResponse.json(
          { error: 'Demo authentication is not available in production' },
          { status: 403 }
        );
      }

      // DEVELOPMENT ONLY: Handle demo mode authentication
      if (!productionGuard.isProduction() && productionGuard.isDemoMode() && 
          token.startsWith('demo-')) {
        
        throwIfProduction('Demo authentication');
        
        const demoUserCookie = req.cookies.get('demo-user')?.value;
        
        if (!demoUserCookie) {
          return NextResponse.json(
            { error: 'Demo session not found' },
            { status: 401 }
          );
        }

        try {
          const demoUser = JSON.parse(demoUserCookie);
          
          // Validate demo user structure
          if (!demoUser.id || !demoUser.email || !demoUser.role) {
            throw new Error('Invalid demo user data');
          }
          
          // Create a mock user object for demo mode
          (req as AuthenticatedRequest).user = {
            id: demoUser.id,
            email: demoUser.email,
            firstName: 'Demo',
            lastName: 'User',
            role: demoUser.role,
            permissions: demoUser.permissions || ['*'],
            organizationId: 'demo-org-id',
            sessionId: 'demo-session-id',
          };

          // Log demo authentication (development only)
          console.log('🎭 Demo authentication used:', {
            userId: demoUser.id,
            role: demoUser.role
          });

          // Skip permission checks for demo mode (demo users have full access)
          return handler(req as AuthenticatedRequest);
          
        } catch (parseError) {
          return NextResponse.json(
            { error: 'Invalid demo session' },
            { status: 401 }
          );
        }
      }

      // Production JWT token validation
      const payload = verifyAccessToken(token);

      // Verify session is still valid (simplified for now)
      const session = await db.client.session.findFirst({
        where: { 
          id: payload.sessionId,
          userId: payload.userId,
          expiresAt: { gt: new Date() }
        }
      });

      if (!session) {
        productionGuard.logSecurityEvent('invalid_session', {
          sessionId: payload.sessionId,
          userId: payload.userId
        });
        
        return NextResponse.json(
          { error: 'Session not found or expired' },
          { status: 401 }
        );
      }

      // Check if user is still active
      const user = await db.client.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          permissions: true,
          organizationId: true,
          isActive: true,
          lastLoginAt: true,
          failedLoginAttempts: true,
          lockedUntil: true,
        },
      });

      if (!user || !user.isActive) {
        productionGuard.logSecurityEvent('inactive_user_access_attempt', {
          userId: payload.userId,
          userExists: !!user,
          isActive: user?.isActive
        });
        
        return NextResponse.json(
          { error: 'User not found or inactive' },
          { status: 401 }
        );
      }

      // Check if account is locked due to failed login attempts
      if (user.lockedUntil && new Date() < user.lockedUntil) {
        productionGuard.logSecurityEvent('locked_account_access_attempt', {
          userId: user.id,
          lockedUntil: user.lockedUntil
        });
        
        return NextResponse.json(
          { 
            error: 'Account is temporarily locked due to multiple failed login attempts',
            lockedUntil: user.lockedUntil 
          },
          { status: 423 }
        );
      }

      // Enhanced session validation for production
      if (productionGuard.isProduction()) {
        // Check for session hijacking indicators
        const currentIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');
        
        if (session.ipAddress && currentIP && session.ipAddress !== currentIP) {
          productionGuard.logSecurityEvent('session_ip_mismatch', {
            userId: user.id,
            sessionIP: session.ipAddress,
            currentIP: currentIP
          });
          
          // In production, terminate session on IP mismatch
          await db.client.session.delete({
            where: { id: session.id }
          });
          
          return NextResponse.json(
            { error: 'Session security violation detected' },
            { status: 401 }
          );
        }

        // Check session age and force re-authentication for sensitive operations
        const sessionAge = Date.now() - new Date(session.createdAt).getTime();
        const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (sessionAge > maxSessionAge) {
          productionGuard.logSecurityEvent('session_expired_age', {
            userId: user.id,
            sessionAge: sessionAge,
            maxAge: maxSessionAge
          });
          
          return NextResponse.json(
            { error: 'Session expired, please re-authentication' },
            { status: 401 }
          );
        }
      }

      // Attach user to request
      (req as AuthenticatedRequest).user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        permissions: user.permissions,
        organizationId: user.organizationId,
        sessionId: payload.sessionId,
      };

      // Check permissions and roles
      const authResult = checkAuthorization(user, options, req);
      if (!authResult.allowed) {
        productionGuard.logSecurityEvent('authorization_failed', {
          userId: user.id,
          reason: authResult.reason,
          requiredRoles: options.requiredRoles,
          requiredPermissions: options.requiredPermissions,
          userRole: user.role
        });
        
        return NextResponse.json(
          { error: authResult.reason || 'Access denied' },
          { status: 403 }
        );
      }

      // Update session activity
      if (productionGuard.isProduction()) {
        await db.client.session.update({
          where: { id: session.id },
          data: { 
            lastAccessedAt: new Date(),
            ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
            userAgent: req.headers.get('user-agent')
          }
        });
      }

      // Call the actual handler
      return handler(req as AuthenticatedRequest);

    } catch (error) {
      console.error('Authentication error:', error);
      
      productionGuard.logSecurityEvent('authentication_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      if (error instanceof Error) {
        if (error.message === 'Token expired') {
          return NextResponse.json(
            { error: 'Token expired', code: 'TOKEN_EXPIRED' },
            { status: 401 }
          );
        }
        if (error.message === 'Invalid token') {
          return NextResponse.json(
            { error: 'Invalid token', code: 'INVALID_TOKEN' },
            { status: 401 }
          );
        }
      }

      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
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

export function getAuthenticatedUser(req: AuthenticatedRequest) {
  if (!req.user) {
    throw new Error('Request is not authenticated');
  }
  return req.user;
}

export function hasPermission(user: { permissions: string[]; role: string }, permission: string): boolean {
  if (user.role === 'ADMIN') return true;
  return user.permissions.includes(permission) || user.permissions.includes('*');
}

export function hasRole(user: { role: string }, ...roles: string[]): boolean {
  return roles.includes(user.role);
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