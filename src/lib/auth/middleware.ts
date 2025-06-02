import { NextRequest, NextResponse } from 'next/server';
import { extractTokenFromHeader, verifyAccessToken, type JWTPayload } from './jwt';
import { getSession } from './session';
import { db } from '@/lib/db';

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

export interface MiddlewareOptions {
  requiredPermissions?: string[];
  requiredRoles?: string[];
  allowSelf?: boolean; // Allow access if user is accessing their own data
  organizationRequired?: boolean;
}

/**
 * Authentication middleware for API routes
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
          { error: 'Authorization header is required' },
          { status: 401 }
        );
      }

      // Extract token
      const token = extractTokenFromHeader(authHeader);
      
      // Check if this is a demo token
      if (token.startsWith('demo-token-') || token === 'demo-access-token') {
        // Handle demo mode authentication
        const demoUserCookie = req.cookies.get('demo-user')?.value;
        
        if (!demoUserCookie) {
          return NextResponse.json(
            { error: 'Demo session not found' },
            { status: 401 }
          );
        }

        try {
          const demoUser = JSON.parse(demoUserCookie);
          
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

          // Skip permission checks for demo mode (demo users have full access)
          return handler(req as AuthenticatedRequest);
          
        } catch (parseError) {
          return NextResponse.json(
            { error: 'Invalid demo session' },
            { status: 401 }
          );
        }
      }

      // Regular JWT token validation for non-demo users
      const payload = verifyAccessToken(token);

      // Verify session is still valid
      const session = await getSession(payload.sessionId);
      if (!session) {
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
        },
      });

      if (!user || !user.isActive) {
        return NextResponse.json(
          { error: 'User not found or inactive' },
          { status: 401 }
        );
      }

      // Attach user to request
      (req as AuthenticatedRequest).user = {
        ...user,
        sessionId: payload.sessionId,
      };

      // Check permissions and roles
      const authResult = checkAuthorization(user, options, req);
      if (!authResult.allowed) {
        return NextResponse.json(
          { error: authResult.reason || 'Access denied' },
          { status: 403 }
        );
      }

      // Call the actual handler
      return handler(req as AuthenticatedRequest);

    } catch (error) {
      console.error('Authentication error:', error);
      
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
 * Check if user has required permissions and roles
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

/**
 * Extract user from authenticated request
 */
export function getAuthenticatedUser(req: AuthenticatedRequest) {
  return req.user;
}

/**
 * Check if user has specific permission
 */
export function hasPermission(user: { permissions: string[]; role: string }, permission: string): boolean {
  if (user.role === 'ADMIN') {
    return true;
  }
  
  return user.permissions.includes(permission) || user.permissions.includes('*');
}

/**
 * Check if user has any of the specified roles
 */
export function hasRole(user: { role: string }, ...roles: string[]): boolean {
  return roles.includes(user.role);
}

/**
 * Check if user belongs to organization
 */
export function belongsToOrganization(user: { organizationId: string }, organizationId: string): boolean {
  return user.organizationId === organizationId;
}

/**
 * Middleware for organization-scoped endpoints
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

/**
 * Rate limiting helper (to be used with authentication)
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    // New window or expired window
    const resetTime = now + windowMs;
    rateLimitMap.set(key, { count: 1, resetTime });
    return { allowed: true, remaining: limit - 1, resetTime };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  return { allowed: true, remaining: limit - record.count, resetTime: record.resetTime };
}

/**
 * CSRF protection helper
 */
export function validateCSRFToken(req: NextRequest): boolean {
  const token = req.headers.get('x-csrf-token');
  const cookie = req.cookies.get('csrf-token')?.value;
  
  if (!token || !cookie || token !== cookie) {
    return false;
  }
  
  return true;
}

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
} 