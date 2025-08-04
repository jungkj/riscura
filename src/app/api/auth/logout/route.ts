import { NextRequest, NextResponse } from 'next/server';
import { invalidateSession, invalidateAllSessions } from '@/lib/auth/session';
import { extractTokenFromHeader, verifyAccessToken } from '@/lib/auth/jwt';
import { db } from '@/lib/db';

export async function POST(_request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    let sessionId: string | undefined;
    let userId: string | undefined;

    // Try to get session from access token
    if (authHeader) {
      try {
        const _token = extractTokenFromHeader(authHeader);
        const payload = verifyAccessToken(token);
        sessionId = payload.sessionId;
        userId = payload.userId;
      } catch {
        // Ignore token errors for logout - allow logout even with invalid token
      }
    }

    // Get logout type from body
    const body = await request.json().catch(() => ({}));
    const logoutType = body.logoutType || 'current'; // 'current' or 'all'

    if (logoutType === 'all' && userId) {
      // Logout from all devices
      await invalidateAllSessions(userId);

      await logAuthEvent(
        'LOGOUT_ALL_DEVICES',
        request.headers.get('x-forwarded-for') || 'unknown',
        null,
        { userId }
      );
    } else if (sessionId) {
      // Logout from current session only
      await invalidateSession(sessionId);

      await logAuthEvent(
        'LOGOUT_SUCCESS',
        request.headers.get('x-forwarded-for') || 'unknown',
        null,
        { userId, sessionId }
      );
    }

    // Prepare response
    const response = NextResponse.json({
      message: 'Logout successful',
      logoutType,
    });

    // Clear cookies
    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    response.cookies.set('csrf-token', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    // console.error('Logout error:', error)

    // Even if there's an error, we should clear cookies and return success
    // because the user is trying to logout
    const response = NextResponse.json({
      message: 'Logout completed',
      note: 'Some cleanup operations may have failed',
    });

    // Clear cookies
    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    response.cookies.set('csrf-token', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    return response;
  }
}

/**
 * Log authentication events
 */
async function logAuthEvent(
  _type: string,
  ipAddress: string,
  email: string | null,
  metadata: any = {}
): Promise<void> {
  try {
    let organizationId: string | undefined;

    if (metadata.userId) {
      const user = await db.client.user.findUnique({
        where: { id: metadata.userId },
        select: { organizationId: true, email: true },
      });

      if (user) {
        organizationId = user.organizationId;
        if (!email) email = user.email;
      }
    }

    // For audit purposes, log the logout event
    // console.log('Logout Event:', {
    //   type: 'LOGOUT',
    //   userId: metadata.userId,
    //   sessionId: metadata.sessionId,
    //   organizationId: organizationId,
    //   reason: type,
    //   source: 'manual',
    //   timestamp: new Date(),
    // });
  } catch (error) {
    // console.error('Failed to log auth event:', error)
  }
}

// Health check
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'logout',
    timestamp: new Date().toISOString(),
  });
}
