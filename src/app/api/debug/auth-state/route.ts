import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';

export const GET = withApiMiddleware({
  requireAuth: false,
  rateLimiters: ['standard'],
})(async (context) => {
  const req = context.req;

  // Only allow in development or with debug flag
  if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_AUTH_DEBUG) {
    return { error: 'Not available in production' };
  }

  // Additional security: check if user is authenticated or request comes from allowed IP
  const allowedIPs = process.env.DEBUG_ALLOWED_IPS?.split(',') || ['127.0.0.1', '::1'];
  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const isAllowedIP = allowedIPs.some((ip) => clientIP.includes(ip));

  // Check if user is authenticated or from allowed IP
  if (process.env.NODE_ENV === 'production' && !isAllowedIP && !context.user) {
    return { error: 'Unauthorized access' };
  }

  const cookies = req.cookies.getAll();
  const sessionToken = req.cookies.get('session-token')?.value;
  const nextAuthSession =
    req.cookies.get('next-auth.session-token')?.value ||
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

  return {
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      APP_URL: process.env.APP_URL,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    },
    cookies: cookies.map((c) => ({
      name: c.name,
      hasValue: !!c.value,
      ...(c.name === 'session-token' ? { length: c.value?.length } : {}),
    })),
    session: {
      hasOAuthSession: !!sessionToken,
      hasNextAuthSession: !!nextAuthSession,
      oauthValid: isOauthValid,
      oauthData: oauthSessionData
        ? {
            userEmail: oauthSessionData.user?.email,
            userId: oauthSessionData.user?.id,
            expires: oauthSessionData.expires,
            rememberMe: oauthSessionData.rememberMe,
          }
        : null,
    },
    headers: {
      referer: req.headers.get('referer'),
      userAgent: req.headers.get('user-agent'),
      host: req.headers.get('host'),
    },
    timestamp: new Date().toISOString(),
  };
});
