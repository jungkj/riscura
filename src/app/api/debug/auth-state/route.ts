import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Only allow in development or with debug flag
  if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_AUTH_DEBUG) {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }

  const cookies = req.cookies.getAll();
  const sessionToken = req.cookies.get('session-token')?.value;
  const nextAuthSession = req.cookies.get('next-auth.session-token')?.value || 
                         req.cookies.get('__Secure-next-auth.session-token')?.value;
  
  let oauthSessionData = null;
  let isOauthValid = false;
  
  if (sessionToken) {
    try {
      oauthSessionData = JSON.parse(Buffer.from(sessionToken, 'base64').toString());
      isOauthValid = new Date(oauthSessionData.expires) > new Date();
    } catch (e) {
      oauthSessionData = { error: 'Failed to parse session token' };
    }
  }
  
  return NextResponse.json({
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      APP_URL: process.env.APP_URL,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    },
    cookies: cookies.map(c => ({
      name: c.name,
      hasValue: !!c.value,
      ...(c.name === 'session-token' ? { length: c.value?.length } : {})
    })),
    session: {
      hasOAuthSession: !!sessionToken,
      hasNextAuthSession: !!nextAuthSession,
      oauthValid: isOauthValid,
      oauthData: oauthSessionData ? {
        userEmail: oauthSessionData.user?.email,
        userId: oauthSessionData.user?.id,
        expires: oauthSessionData.expires,
        rememberMe: oauthSessionData.rememberMe,
      } : null,
    },
    headers: {
      referer: req.headers.get('referer'),
      userAgent: req.headers.get('user-agent'),
      host: req.headers.get('host'),
    },
    timestamp: new Date().toISOString(),
  });
}