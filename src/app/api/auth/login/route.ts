import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { generateCSRFToken, rateLimit } from '@/lib/auth/middleware';
import { appConfig } from '@/config/env';
import { validateTestCredentials, type TestUser } from '@/lib/demo/testUser';

// Login request schema
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Failed login attempts tracking
const failedAttempts = new Map<string, { count: number; lockedUntil?: number }>();

// Account lockout settings
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Rate limiting by IP
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    const rateLimitResult = rateLimit(
      `login:${clientIP}`,
      10, // 10 login attempts
      15 * 60 * 1000 // 15 minutes
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many login attempts. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
        },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validationResult = loginSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    // First, try test user authentication
    const testUser = validateTestCredentials(email, password);
    if (testUser) {
      return handleTestUserLogin(testUser, clientIP, request);
    }

    // Legacy demo credentials for backward compatibility
    if ((email === 'admin@riscura.com' && password === 'admin123') || 
        (appConfig.isDevelopment && email === 'demo@demo.com' && password === 'demo123')) {
      const demoUser = {
        id: 'demo-admin-id',
        email: email,
        firstName: 'Demo',
        lastName: 'User',
        role: 'ADMIN',
        permissions: ['*'],
        organizationId: 'demo-org-id',
        isActive: true,
        emailVerified: new Date(),
      };

      return handleDemoLogin(demoUser, clientIP, request);
    }

    // Try to find user in database
    try {
      const user = await db.client.user.findUnique({
        where: { email: email.toLowerCase() },
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

      if (!user || !user.isActive) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      if (!user.organization?.isActive) {
        return NextResponse.json(
          { error: 'Organization is inactive' },
          { status: 401 }
        );
      }

      // Verify password
      if (!user.passwordHash || !await verifyPassword(password, user.passwordHash)) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      // Check if email is verified
      if (!user.emailVerified) {
        return NextResponse.json(
          { 
            error: 'Email not verified. Please check your email for verification instructions.',
            requiresVerification: true,
          },
          { status: 401 }
        );
      }

      // Create session
      const sessionOptions = {
        ipAddress: clientIP,
        userAgent: request.headers.get('user-agent') || undefined,
      };

      const { session, tokens } = await createSession(user, sessionOptions);
      const csrfToken = generateCSRFToken();

      // Update last login
      await db.client.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      const response = NextResponse.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          permissions: user.permissions,
          organizationId: user.organizationId,
          organization: {
            id: user.organization.id,
            name: user.organization.name,
          },
        },
        tokens: {
          accessToken: tokens.accessToken,
          expiresIn: tokens.expiresIn,
        },
        session: {
          id: session.id,
          expiresAt: session.expiresAt,
        },
      });

      // Set cookies
      response.cookies.set('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: appConfig.isProduction,
        sameSite: 'strict',
        maxAge: tokens.refreshExpiresIn,
        path: '/',
      });

      response.cookies.set('csrf-token', csrfToken, {
        httpOnly: false,
        secure: appConfig.isProduction,
        sameSite: 'strict',
        maxAge: tokens.expiresIn,
        path: '/',
      });

      return response;

    } catch (dbError) {
      console.error('Database error during login:', dbError);
      
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login. Please try again.' },
      { status: 500 }
    );
  }
}

// Handle test user login with comprehensive demo data
function handleTestUserLogin(testUser: TestUser, clientIP: string, request: NextRequest): NextResponse {
  const tokens = {
    accessToken: `demo-token-${testUser.id}`,
    refreshToken: `demo-refresh-${testUser.id}`,
    expiresIn: 3600,
    refreshExpiresIn: 86400,
  };

  const csrfToken = generateCSRFToken();

  const response = NextResponse.json({
    message: 'Login successful',
    user: {
      id: testUser.id,
      email: testUser.email,
      firstName: testUser.firstName,
      lastName: testUser.lastName,
      role: testUser.role,
      permissions: testUser.permissions,
      organizationId: testUser.organizationId,
      organization: testUser.organization,
      profile: testUser.profile,
      lastLogin: testUser.lastLogin,
    },
    tokens: {
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
    },
    demoMode: true,
    features: {
      hasAI: true,
      hasReporting: true,
      hasCollaboration: true,
      hasAPI: testUser.permissions.includes('*') || testUser.permissions.includes('api:read'),
    },
  });

  // Set cookies
  response.cookies.set('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: appConfig.isProduction,
    sameSite: 'strict',
    maxAge: tokens.refreshExpiresIn,
    path: '/',
  });

  response.cookies.set('csrf-token', csrfToken, {
    httpOnly: false,
    secure: appConfig.isProduction,
    sameSite: 'strict',
    maxAge: tokens.expiresIn,
    path: '/',
  });

  // Store user session in cookie for demo purposes
  response.cookies.set('demo-user', JSON.stringify({
    id: testUser.id,
    email: testUser.email,
    role: testUser.role,
    permissions: testUser.permissions,
  }), {
    httpOnly: false,
    secure: appConfig.isProduction,
    sameSite: 'strict',
    maxAge: tokens.expiresIn,
    path: '/',
  });

  return response;
}

// Handle legacy demo login
function handleDemoLogin(demoUser: any, clientIP: string, request: NextRequest): NextResponse {
  const tokens = {
    accessToken: 'demo-access-token',
    refreshToken: 'demo-refresh-token',
    expiresIn: 3600,
    refreshExpiresIn: 86400,
  };

  const response = NextResponse.json({
    message: 'Login successful (legacy demo mode)',
    user: demoUser,
    tokens: {
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
    },
    demoMode: true,
  });

  response.cookies.set('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: appConfig.isProduction,
    sameSite: 'strict',
    maxAge: tokens.refreshExpiresIn,
    path: '/',
  });

  return response;
}

/**
 * Handle failed login attempt
 */
async function handleFailedLogin(
  email: string,
  clientIP: string,
  reason: string
): Promise<void> {
  const lockoutKey = `lockout:${email.toLowerCase()}`;
  const record = failedAttempts.get(lockoutKey) || { count: 0 };
  
  record.count++;
  
  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOCKOUT_DURATION;
    
    await logAuthEvent('ACCOUNT_LOCKED', clientIP, email, {
      failedAttempts: record.count,
      lockedUntil: new Date(record.lockedUntil),
    });
  } else {
    await logAuthEvent('LOGIN_FAILED', clientIP, email, {
      reason,
      failedAttempts: record.count,
      remainingAttempts: MAX_FAILED_ATTEMPTS - record.count,
    });
  }
  
  failedAttempts.set(lockoutKey, record);
}

/**
 * Log authentication events for audit trail
 */
async function logAuthEvent(
  type: string,
  ipAddress: string,
  email: string | null,
  metadata: any = {}
): Promise<void> {
  try {
    // For now, just log to console
    // In production, you might want to create a separate AuditLog table
    console.log('Authentication Event:', {
      type,
      ipAddress,
      email,
      timestamp: new Date(),
      ...metadata,
    });
  } catch (error) {
    console.error('Failed to log auth event:', error);
  }
}

// Health check endpoint
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ 
    status: 'ok', 
    endpoint: 'login',
    timestamp: new Date().toISOString(),
    testUsers: [
      { email: 'admin@riscura.demo', role: 'ADMIN', password: 'demo123' },
      { email: 'manager@riscura.demo', role: 'MANAGER', password: 'demo123' },
      { email: 'analyst@riscura.demo', role: 'USER', password: 'demo123' },
    ],
  });
} 