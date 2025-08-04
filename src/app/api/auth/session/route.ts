import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

export async function GET(req: NextRequest) {
  try {
    // Try NextAuth session first
    try {
      const session = await getServerSession(authOptions);
      if (session) {
        return NextResponse.json(session);
      }
    } catch (nextAuthError) {
      // console.log('[Session] NextAuth session check failed:', nextAuthError);
    }

    // Check for simple OAuth session
    const sessionToken = req.cookies.get('session-token')?.value;
    if (sessionToken) {
      try {
        const sessionData = JSON.parse(Buffer.from(sessionToken, 'base64').toString());
        if (new Date(sessionData.expires) > new Date()) {
          return NextResponse.json({
            user: sessionData.user,
            expires: sessionData.expires,
          });
        }
      } catch (e) {
        // console.log('[Session] Invalid simple OAuth session token');
      }
    }

    // Check for demo user session
    const demoUserCookie = req.cookies.get('demo-user')?.value;
    if (demoUserCookie) {
      try {
        const demoUser = JSON.parse(demoUserCookie);
        return NextResponse.json({
          user: {
            ...demoUser,
            name: `${demoUser.firstName || 'Demo'} ${demoUser.lastName || 'User'}`,
            image: null,
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        });
      } catch (e) {
        // console.log('[Session] Invalid demo user cookie');
      }
    }

    // No valid session found
    return NextResponse.json(null);
  } catch (error) {
    // console.error('[Session] Error checking session:', error);
    return NextResponse.json(null);
  }
}
