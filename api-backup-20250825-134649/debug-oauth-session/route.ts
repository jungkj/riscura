import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = cookies();
    
    // Check all possible session cookies
    const sessionCookies = {
      'session-token': cookieStore.get('session-token')?.value,
      'next-auth.session-token': cookieStore.get('next-auth.session-token')?.value,
      '__Secure-next-auth.session-token': cookieStore.get('__Secure-next-auth.session-token')?.value,
    };
    
    // Check if any session exists
    const hasSession = Object.values(sessionCookies).some(v => !!v);
    
    // Try to decode the session if it exists
    let sessionData = null;
    let sessionError = null;
    
    const activeSession = sessionCookies['session-token'];
    if (activeSession) {
      try {
        const decoded = Buffer.from(activeSession, 'base64').toString();
        sessionData = JSON.parse(decoded);
      } catch (e) {
        sessionError = 'Failed to decode session token';
      }
    }
    
    // Check database connection
    let dbStatus = null;
    try {
      const { db } = await import('@/lib/db');
      await db.healthCheck();
      dbStatus = 'Connected';
      
      // If we have session data, check if user exists
      if (sessionData?.user?.email) {
        const user = await db.client.user.findUnique({
          where: { email: sessionData.user.email },
          select: { id: true, email: true, organizationId: true }
        });
        dbStatus = user ? 'Connected - User exists' : 'Connected - User NOT found';
      }
    } catch (e) {
      dbStatus = 'Failed: ' + (e instanceof Error ? e.message : String(e));
    }
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      cookies: {
        found: Object.entries(sessionCookies).filter(([_, v]) => !!v).map(([k]) => k),
        hasAnySession: hasSession,
      },
      session: {
        exists: !!activeSession,
        data: sessionData,
        error: sessionError,
        isExpired: sessionData?.expires ? new Date(sessionData.expires) < new Date() : null,
      },
      database: {
        status: dbStatus,
      },
      nextSteps: !hasSession 
        ? 'No session cookie found. OAuth callback may not be setting the cookie properly.'
        : sessionError 
          ? 'Session cookie exists but cannot be decoded.'
          : sessionData?.expires && new Date(sessionData.expires) < new Date()
            ? 'Session has expired. Try logging in again.'
            : 'Session appears valid. Check if middleware is recognizing it.',
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to debug session',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}