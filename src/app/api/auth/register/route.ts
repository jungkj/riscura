import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { hashPassword, checkPasswordStrength } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { rateLimit, generateCSRFToken } from '@/lib/auth/middleware';
import { env } from '@/config/env';
import { UserRole } from '@prisma/client';
import { emailService } from '@/lib/email/service';
import jwt from 'jsonwebtoken';

// Registration request schema
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  organizationName: z
    .string()
    .min(1, 'Organization name is required')
    .max(100, 'Organization name too long')
    .optional(),
  organizationId: z.string().optional(), // For joining existing organization
  inviteToken: z.string().optional(), // For invite-based registration
  acceptTerms: z
    .boolean()
    .refine((val) => val === true, 'You must accept the terms and conditions'),
})

export async function POST(_request: NextRequest): Promise<NextResponse> {
  try {
    // Rate limiting by IP
    const clientIP =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    const rateLimitResult = rateLimit(
      `register:${clientIP}`,
      5, // 5 registration attempts
      60 * 60 * 1000 // 1 hour
    );

    if (!rateLimitResult.allowed) {
      await logAuthEvent('REGISTER_RATE_LIMITED', clientIP, null, {
        remainingTime: rateLimitResult.resetTime - Date.now(),
      });

      return NextResponse.json(
        {
          error: 'Too many registration attempts. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
        },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json()
    const validationResult = registerSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { email, password, firstName, lastName, organizationName, organizationId, inviteToken } =
      validationResult.data;

    // Check password strength
    const passwordStrength = checkPasswordStrength(password)
    if (!passwordStrength.isValid) {
      return NextResponse.json(
        {
          error: 'Password does not meet requirements',
          details: passwordStrength.feedback,
        },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await db.client.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      await logAuthEvent('REGISTER_EMAIL_EXISTS', clientIP, email);
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    let organization;
    let userRole: UserRole = UserRole.USER;

    // Handle organization logic
    if (inviteToken) {
      // TODO: Implement invite token validation
      // For now, treat as joining existing organization
      if (organizationId) {
        organization = await db.client.organization.findUnique({
          where: { id: organizationId },
        })

        if (!organization || !organization.isActive) {
          return NextResponse.json({ error: 'Invalid or inactive organization' }, { status: 400 });
        }
      } else {
        return NextResponse.json(
          { error: 'Organization ID is required when using invite token' },
          { status: 400 }
        );
      }
    } else if (organizationId) {
      // Joining existing organization (requires approval or open registration)
      organization = await db.client.organization.findUnique({
        where: { id: organizationId },
      })

      if (!organization || !organization.isActive) {
        return NextResponse.json({ error: 'Invalid or inactive organization' }, { status: 400 });
      }
    } else if (organizationName) {
      // Creating new organization - user becomes admin
      organization = await db.client.organization.create({
        data: {
          name: organizationName,
          plan: 'free', // Default plan
          settings: {
            industry: 'other',
            size: 'small',
            timezone: 'UTC',
            currency: 'USD',
          },
        },
      })
      userRole = UserRole.ADMIN; // First user becomes admin
    } else {
      return NextResponse.json({ error: 'Organization name or ID is required' }, { status: 400 });
    }

    // Ensure organization is defined at this point
    if (!organization) {
      throw new Error('Organization not found - this should not happen')
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    const user = await db.client.user.create({
      data: {
        email: email.toLowerCase(),
        firstName,
        lastName,
        passwordHash,
        role: userRole,
        permissions: getDefaultPermissions(userRole),
        organizationId: organization.id,
        isActive: !env.SKIP_EMAIL_VERIFICATION, // Require email verification in production
        emailVerified: env.SKIP_EMAIL_VERIFICATION ? new Date() : null,
      },
    })

    // Log registration
    await logAuthEvent('REGISTER_SUCCESS', clientIP, email, {
      userId: user.id,
      organizationId: organization.id,
      organizationName: organization.name,
      role: user.role,
      userAgent: request.headers.get('user-agent'),
    })

    // If email verification is disabled, create session immediately
    if (env.SKIP_EMAIL_VERIFICATION) {
      const sessionOptions = {
        ipAddress: clientIP,
        userAgent: request.headers.get('user-agent') || undefined,
      }

      const { session, tokens } = await createSession(user, sessionOptions);
      const csrfToken = generateCSRFToken();

      const response = NextResponse.json({
        message: 'Registration successful',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          permissions: user.permissions,
          organizationId: user.organizationId,
          organization: {
            id: organization.id,
            name: organization.name,
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
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: tokens.refreshExpiresIn,
        path: '/',
      })

      response.cookies.set('csrf-token', csrfToken, {
        httpOnly: false,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: tokens.expiresIn,
        path: '/',
      });

      return response;
    } else {
      // Send email verification
      await sendVerificationEmail(user.email, user.id)

      return NextResponse.json({
        message: 'Registration successful. Please check your email to verify your account.',
        requiresVerification: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });
    }
  } catch (error) {
    // console.error('Registration error:', error)

    await logAuthEvent(
      'REGISTER_ERROR',
      request.headers.get('x-forwarded-for') || 'unknown',
      null,
      { error: error instanceof Error ? error.message : 'Unknown error' }
    );

    return NextResponse.json(
      { error: 'An error occurred during registration. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * Get default permissions for user role
 */
const getDefaultPermissions = (role: UserRole): string[] {
  switch (role) {
    case UserRole.ADMIN:
      return ['*']; // All permissions
    case UserRole.RISK_MANAGER:
      return [
        'risks:read',
        'risks:write',
        'risks:delete',
        'controls:read',
        'controls:write',
        'controls:delete',
        'documents:read',
        'documents:write',
        'tasks:read',
        'tasks:write',
        'workflows:read',
        'workflows:write',
        'reports:read',
      ];
    case UserRole.AUDITOR:
      return [
        'risks:read',
        'controls:read',
        'documents:read',
        'tasks:read',
        'workflows:read',
        'reports:read',
        'reports:write',
        'questionnaires:read',
        'questionnaires:write',
      ];
    case UserRole.USER:
    default:
      return ['risks:read', 'controls:read', 'documents:read', 'tasks:read', 'workflows:read'];
  }
}

/**
 * Send email verification
 */
async function sendVerificationEmail(email: string, userId: string): Promise<void> {
  try {
    // Generate verification token
    const verificationToken = generateVerificationToken(userId)

    // Store token in database with expiration
    await db.client.user.update({
      where: { id: userId },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    })

    // Get user details for personalization
    const user = await db.client.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    })

    // Send verification email
    const verificationUrl = `${env.APP_URL}/auth/verify?token=${verificationToken}`

    await emailService.sendTemplate('verification', email, {
      firstName: user?.firstName || 'User',
      verificationUrl,
    });

    // console.log(`Verification email sent to ${email} for user ${userId}`)
  } catch (error) {
    // console.error('Failed to send verification email:', error)
    // Don't throw error to prevent registration failure due to email issues
  }
}

/**
 * Generate verification token
 */
const generateVerificationToken = (_userId: string): string {
  return jwt.sign(
    {
      userId,
      type: 'email_verification',
      iat: Math.floor(Date.now() / 1000),
    },
    env.JWT_SECRET,
    {
      expiresIn: '24h',
      issuer: 'riscura',
      audience: 'riscura-users',
    }
  )
}

/**
 * Log authentication events
 */
async function logAuthEvent(_type: string,
  ipAddress: string,
  email: string | null,
  metadata: any = {}
): Promise<void> {
  try {
    let userId: string | undefined;
    let organizationId: string | undefined;

    if (email) {
      const user = await db.client.user.findUnique({
        where: { email: email.toLowerCase() },
        select: { id: true, organizationId: true },
      });

      if (user) {
        userId = user.id;
        organizationId = user.organizationId;
      }
    }

    // For audit purposes, log the authentication event
    // console.log('Authentication Event:', {
      type,
      ipAddress,
      email,
      userId,
      organizationId,
      timestamp: new Date(),
      ...metadata,
    })
  } catch (error) {
    // console.error('Failed to log auth event:', error)
  }
}

// Health check endpoint
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'register',
    timestamp: new Date().toISOString(),
  })
}
