import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth-options';

export async function GET(request: NextRequest) {
  try {
    console.log('[Session-Check] Starting session check...');
    
    // Add detailed logging for debugging
    console.log('[Session-Check] Environment check:', {
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasJwtSecret: !!process.env.JWT_ACCESS_SECRET,
      nextAuthUrl: process.env.NEXTAUTH_URL
    });
    
    // First check for OAuth session token
    const oauthToken = request.cookies.get('session-token')?.value;
    if (oauthToken) {
      try {
        const sessionData = JSON.parse(Buffer.from(oauthToken, 'base64').toString());
        const isExpired = new Date(sessionData.expires) < new Date();
        
        console.log('[Session-Check] OAuth session found:', {
          userEmail: sessionData.user?.email,
          expires: sessionData.expires,
          isExpired
        });
        
        if (!isExpired && sessionData.user) {
          return NextResponse.json({
            authenticated: true,
            user: {
              email: sessionData.user.email,
              name: sessionData.user.name,
            },
            sessionType: 'oauth',
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('[Session-Check] Failed to parse OAuth token:', error);
      }
    }
    
    // Then check for NextAuth session
    let session: any = null;
    let sessionError: any = null;
    
    try {
      session = await getServerSession(authOptions);
      console.log('[Session-Check] NextAuth session result:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userEmail: session?.user?.email
      });
    } catch (err) {
      sessionError = err;
      console.error('[Session-Check] NextAuth error:', err);
    }
    
    return NextResponse.json({
      authenticated: !!session,
      user: session?.user ? {
        email: session.user.email,
        name: session.user.name,
      } : null,
      sessionType: session ? 'nextauth' : null,
      timestamp: new Date().toISOString(),
      debug: {
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasOAuthToken: !!oauthToken,
        sessionError: sessionError ? sessionError.message : null
      }
    });
  } catch (error) {
    console.error('[Session-Check] Unexpected error:', error);
    return NextResponse.json(
      { 
        authenticated: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        debug: {
          hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
          hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
          errorType: error?.constructor?.name
        }
      },
      { status: 200 }
    );
  }
} 