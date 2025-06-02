import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { rateLimit, generateCSRFToken } from '@/lib/auth/middleware';
import { env } from '@/config/env';

// Login request schema
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
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
      10, // 10 attempts
      15 * 60 * 1000 // 15 minutes
    );

    if (!rateLimitResult.allowed) {
      await logAuthEvent('LOGIN_RATE_LIMITED', clientIP, null, {
        remainingTime: rateLimitResult.resetTime - Date.now(),
      });

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

    const { email, password, rememberMe } = validationResult.data;

    // Check account lockout
    const lockoutKey = `lockout:${email.toLowerCase()}`;
    const lockoutRecord = failedAttempts.get(lockoutKey);
    
    if (lockoutRecord?.lockedUntil && Date.now() < lockoutRecord.lockedUntil) {
      await logAuthEvent('LOGIN_BLOCKED_LOCKED', clientIP, email, {
        lockoutEnds: new Date(lockoutRecord.lockedUntil),
      });

      return NextResponse.json(
        { 
          error: 'Account temporarily locked due to too many failed attempts.',
          lockedUntil: new Date(lockoutRecord.lockedUntil),
        },
        { status: 423 }
      );
    }

    // Find user by email
    const user = await db.client.user.findUnique({
      where: { 
        email: email.toLowerCase(),
      },
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

    if (!user || !user.passwordHash) {
      await handleFailedLogin(email, clientIP, 'USER_NOT_FOUND');
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      await logAuthEvent('LOGIN_INACTIVE_USER', clientIP, email);
      return NextResponse.json(
        { error: 'Account is inactive. Please contact support.' },
        { status: 401 }
      );
    }

    // Check if organization is active
    if (!user.organization.isActive) {
      await logAuthEvent('LOGIN_INACTIVE_ORG', clientIP, email, {
        organizationId: user.organizationId,
      });
      return NextResponse.json(
        { error: 'Organization is inactive. Please contact support.' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    
    if (!isPasswordValid) {
      await handleFailedLogin(email, clientIP, 'INVALID_PASSWORD');
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Clear failed attempts on successful login
    failedAttempts.delete(lockoutKey);

    // Create session
    const sessionOptions = {
      ipAddress: clientIP,
      userAgent: request.headers.get('user-agent') || undefined,
      maxSessions: rememberMe ? 10 : 5,
    };

    const { session, tokens } = await createSession(user, sessionOptions);

    // Generate CSRF token
    const csrfToken = generateCSRFToken();

    // Log successful login
    await logAuthEvent('LOGIN_SUCCESS', clientIP, email, {
      userId: user.id,
      sessionId: session.id,
      organizationId: user.organizationId,
      userAgent: request.headers.get('user-agent'),
    });

    // Prepare response
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
        lastLogin: user.lastLogin,
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

    // Set HTTP-only cookie for refresh token
    response.cookies.set('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: tokens.refreshExpiresIn,
      path: '/',
    });

    // Set CSRF token cookie
    response.cookies.set('csrf-token', csrfToken, {
      httpOnly: false, // Accessible to JS for including in headers
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: tokens.expiresIn,
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    
    await logAuthEvent('LOGIN_ERROR', 
      request.headers.get('x-forwarded-for') || 'unknown',
      null,
      { error: error instanceof Error ? error.message : 'Unknown error' }
    );

    return NextResponse.json(
      { error: 'An error occurred during login. Please try again.' },
      { status: 500 }
    );
  }
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
  });
} 