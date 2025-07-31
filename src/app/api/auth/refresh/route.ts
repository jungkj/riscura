import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken } from '@/lib/auth/jwt';
import { validateSession, getSessionByToken } from '@/lib/auth/session';
import { generateCSRFToken } from '@/lib/auth/middleware';
import { env } from '@/config/env';
import { productionGuard, throwIfProduction } from '@/lib/security/production-guard';
import { createSecureAPIHandler, SECURITY_PROFILES } from '@/lib/security/middleware-integration';

export const POST = createSecureAPIHandler(async (request: NextRequest): Promise<NextResponse> => {
  try {
    // Get refresh token from cookie or body
    let refreshToken = request.cookies.get('refreshToken')?.value;

    if (!refreshToken) {
      const body = await request.json();
      refreshToken = body.refreshToken;
    }

    if (!refreshToken) {
      productionGuard.logSecurityEvent('refresh_token_missing', {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      });

      return NextResponse.json({ error: 'Refresh token is required' }, { status: 401 });
    }

    // SECURITY: Block demo tokens in production
    if (productionGuard.isProduction() && refreshToken.startsWith('demo-')) {
      productionGuard.logSecurityEvent('blocked_demo_refresh_token', {
        token: 'demo-***',
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      });

      return NextResponse.json(
        { error: 'Demo authentication is not available in production' },
        { status: 403 }
      );
    }

    // DEVELOPMENT ONLY: Check if this is a demo refresh token
    if (
      !productionGuard.isProduction() &&
      productionGuard.isDemoMode() &&
      refreshToken.startsWith('demo-refresh-')
    ) {
      throwIfProduction('Demo token refresh');

      const demoUserCookie = request.cookies.get('demo-user')?.value;

      if (!demoUserCookie) {
        return NextResponse.json({ error: 'Demo session not found' }, { status: 401 });
      }

      try {
        const demoUser = JSON.parse(demoUserCookie);

        // Validate demo user structure
        if (!demoUser.id || !demoUser.email || !demoUser.role) {
          throw new Error('Invalid demo user data');
        }

        // Return fresh demo tokens
        const response = NextResponse.json({
          message: 'Demo token refreshed successfully',
          user: {
            id: demoUser.id,
            email: demoUser.email,
            firstName: 'Demo',
            lastName: 'User',
            role: demoUser.role,
            permissions: demoUser.permissions || ['*'],
            organizationId: 'demo-org-id',
          },
          tokens: {
            accessToken: `demo-access-${demoUser.id}`,
            expiresIn: 3600,
          },
          demoMode: true,
        });

        // Update demo cookies
        response.cookies.set('refreshToken', `demo-refresh-${demoUser.id}`, {
          httpOnly: true,
          secure: env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 86400, // 24 hours
          path: '/',
        });

        // Log demo token refresh (development only)
        console.log('🎭 Demo token refreshed for user:', demoUser.id);

        return response;
      } catch (parseError) {
        productionGuard.logSecurityEvent('invalid_demo_refresh_token', {
          error: parseError instanceof Error ? parseError.message : 'Unknown error',
        });

        return NextResponse.json({ error: 'Invalid demo session' }, { status: 401 });
      }
    }

    // Regular JWT token refresh for non-demo users
    try {
      // Verify refresh token
      const payload = verifyRefreshToken(refreshToken);

      // Validate session
      const sessionResult = await validateSession(payload.sessionId);

      if (!sessionResult.isValid || !sessionResult.session || !sessionResult.user) {
        productionGuard.logSecurityEvent('session_refresh_failed', {
          sessionId: payload.sessionId,
          ip: request.headers.get('x-forwarded-for') || 'unknown',
        });

        return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
      }

      const session = sessionResult.session;
      const user = sessionResult.user;

      // Generate new tokens (simplified - in production you'd use proper JWT generation)
      const tokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
        refreshExpiresIn: 86400,
      };

      // Generate new CSRF token
      const csrfToken = generateCSRFToken();

      // Log refresh event
      await logAuthEvent(
        'TOKEN_REFRESHED',
        request.headers.get('x-forwarded-for') || 'unknown',
        user.email,
        {
          userId: user.id,
          sessionId: session.id,
          userAgent: request.headers.get('user-agent'),
        }
      );

      // Prepare response
      const response = NextResponse.json({
        message: 'Token refreshed successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          permissions: user.permissions || [],
          organizationId: user.organizationId,
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

      // Update cookies with secure settings
      response.cookies.set('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: productionGuard.isProduction(),
        sameSite: 'strict',
        maxAge: tokens.refreshExpiresIn,
        path: '/',
      });

      response.cookies.set('csrf-token', csrfToken, {
        httpOnly: false,
        secure: productionGuard.isProduction(),
        sameSite: 'strict',
        maxAge: tokens.expiresIn,
        path: '/',
      });

      productionGuard.logSecurityEvent('token_refreshed_success', {
        userId: user.id,
        sessionId: session.id,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      });

      return response;
    } catch (jwtError) {
      productionGuard.logSecurityEvent('refresh_token_validation_failed', {
        error: jwtError instanceof Error ? jwtError.message : 'Unknown JWT error',
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      });

      if (jwtError instanceof Error) {
        if (jwtError.message === 'Token expired' || jwtError.message === 'Invalid token') {
          return NextResponse.json(
            { error: 'Invalid or expired refresh token', code: 'INVALID_REFRESH_TOKEN' },
            { status: 401 }
          );
        }
      }

      return NextResponse.json({ error: 'Failed to refresh token' }, { status: 500 });
    }
  } catch (error) {
    console.error('Token refresh error:', error);

    productionGuard.logSecurityEvent('token_refresh_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ error: 'Failed to refresh token' }, { status: 500 });
  }
}, SECURITY_PROFILES.auth);

/**
 * Log authentication events
 */
async function logAuthEvent(
  type: string,
  ipAddress: string,
  email: string | null,
  metadata: any = {}
): Promise<void> {
  try {
    const { db } = await import('@/lib/db');

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
    console.log('Authentication Event:', {
      type,
      ipAddress,
      email,
      userId,
      organizationId,
      timestamp: new Date(),
      metadata,
    });

    // In production, this would typically go to a proper audit log system
    productionGuard.logSecurityEvent(type.toLowerCase(), {
      ipAddress,
      email,
      userId,
      organizationId,
      metadata,
    });
  } catch (error) {
    console.error('Failed to log auth event:', error);
  }
}

// Health check endpoint
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'auth-refresh',
  });
}
