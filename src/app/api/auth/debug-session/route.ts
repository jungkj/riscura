import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Get all cookies
  const cookies = req.cookies.getAll();
  const sessionToken = req.cookies.get('session-token')?.value;
  const nextAuthToken = req.cookies.get('next-auth.session-token')?.value;
  const secureNextAuthToken = req.cookies.get('__Secure-next-auth.session-token')?.value;
  
  let sessionData = null;
  let sessionError = null;
  
  if (sessionToken) {
    try {
      sessionData = JSON.parse(Buffer.from(sessionToken, 'base64').toString());
    } catch (error) {
      sessionError = 'Failed to decode session token';
    }
  }
  
  // Check what the AuthContext would see
  const authCheckResult = await fetch(`${req.nextUrl.origin}/api/google-oauth/session`, {
    headers: {
      cookie: req.headers.get('cookie') || '',
    },
  });
  const authData = await authCheckResult.json();
  
  return NextResponse.json({
    debug: 'Session Debug Info',
    cookies: {
      all: cookies.map(c => ({ name: c.name, hasValue: !!c.value, length: c.value?.length })),
      hasSessionToken: !!sessionToken,
      hasNextAuthToken: !!nextAuthToken,
      hasSecureNextAuthToken: !!secureNextAuthToken,
    },
    sessionToken: {
      exists: !!sessionToken,
      data: sessionData,
      error: sessionError,
    },
    authContextCheck: {
      response: authData,
      wouldAuthenticate: !!(authData && authData.user),
    },
    request: {
      url: req.url,
      headers: {
        host: req.headers.get('host'),
        cookie: req.headers.get('cookie')?.substring(0, 100) + '...',
      },
    },
    middleware: {
      info: 'If you see this page, the middleware allowed access',
      protectedPaths: ['/dashboard', '/admin'],
    },
  });
}