import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken } from '@/lib/auth/jwt';
import { refreshSession, getSessionByToken } from '@/lib/auth/session';
import { generateCSRFToken } from '@/lib/auth/middleware';
import { env } from '@/config/env';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get refresh token from cookie or body
    let refreshToken = request.cookies.get('refreshToken')?.value;
    
    if (!refreshToken) {
      const body = await request.json();
      refreshToken = body.refreshToken;
    }

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 401 }
      );
    }

    // Check if this is a demo refresh token
    if (refreshToken.startsWith('demo-refresh-') || refreshToken === 'demo-refresh-token') {
      const demoUserCookie = request.cookies.get('demo-user')?.value;
      
      if (!demoUserCookie) {
        return NextResponse.json(
          { error: 'Demo session not found' },
          { status: 401 }
        );
      }

      try {
        const demoUser = JSON.parse(demoUserCookie);
        
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
            accessToken: `demo-token-${demoUser.id}`,
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

        return response;
        
      } catch (parseError) {
        return NextResponse.json(
          { error: 'Invalid demo session' },
          { status: 401 }
        );
      }
    }

    // Regular JWT token refresh for non-demo users
    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Get session and refresh it
    const result = await refreshSession(payload.sessionId);
    
    if (!result) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    const { session, tokens } = result;

    // Generate new CSRF token
    const csrfToken = generateCSRFToken();

    // Log refresh event
    await logAuthEvent('TOKEN_REFRESHED', 
      request.headers.get('x-forwarded-for') || 'unknown',
      session.user.email,
      {
        userId: session.user.id,
        sessionId: session.id,
        userAgent: request.headers.get('user-agent'),
      }
    );

    // Prepare response
    const response = NextResponse.json({
      message: 'Token refreshed successfully',
      user: {
        id: session.user.id,
        email: session.user.email,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
        role: session.user.role,
        permissions: session.user.permissions,
        organizationId: session.user.organizationId,
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

    // Update cookies
    response.cookies.set('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: tokens.refreshExpiresIn,
      path: '/',
    });

    response.cookies.set('csrf-token', csrfToken, {
      httpOnly: false,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: tokens.expiresIn,
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Token refresh error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Token expired' || error.message === 'Invalid token') {
        return NextResponse.json(
          { error: 'Invalid or expired refresh token', code: 'INVALID_REFRESH_TOKEN' },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500 }
    );
  }
}

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
      ...metadata,
    });
  } catch (error) {
    console.error('Failed to log auth event:', error);
  }
}

// Health check
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ 
    status: 'ok', 
    endpoint: 'refresh',
    timestamp: new Date().toISOString(),
  });
} 