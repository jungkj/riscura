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
    
    let session: any = null;
    let sessionError: any = null;
    
    try {
      session = await getServerSession(authOptions);
      console.log('[Session-Check] Session result:', {
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
      timestamp: new Date().toISOString(),
      debug: {
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
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