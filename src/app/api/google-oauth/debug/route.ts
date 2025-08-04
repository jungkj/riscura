import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || 'https://riscura.app';
  const redirectUri = `${baseUrl}/api/google-oauth/callback`;

  // Check cookies
  const cookies = req.cookies.getAll()
  const sessionToken = req.cookies.get('session-token')?.value;

  let sessionData = null;
  let sessionError = null;

  if (sessionToken) {
    try {
      sessionData = JSON.parse(Buffer.from(sessionToken, 'base64').toString());
    } catch (error) {
      sessionError = 'Failed to decode session token';
    }
  }

  return NextResponse.json({
    status: 'OAuth Debug Info',
    config: {
      hasClientId: !!clientId,
      clientIdLength: clientId?.length || 0,
      clientIdPreview: clientId ? `${clientId.substring(0, 20)}...` : 'not set',
      hasClientSecret: !!clientSecret,
      baseUrl,
      redirectUri,
      nextAuthUrl: process.env.NEXTAUTH_URL,
      appUrl: process.env.APP_URL,
    },
    session: {
      hasSessionToken: !!sessionToken,
      sessionData,
      sessionError,
      cookies: cookies.map((c) => ({ name: c.name, hasValue: !!c.value })),
    },
    headers: {
      host: req.headers.get('host'),
      origin: req.headers.get('origin'),
      referer: req.headers.get('referer'),
    },
    urls: {
      login: '/api/google-oauth/login',
      callback: '/api/google-oauth/callback',
      session: '/api/google-oauth/session',
      logout: '/api/google-oauth/logout',
    },
    testPages: ['/test-oauth', '/simple-oauth-test', '/oauth-debug'],
    instructions: 'Visit /test-oauth to test the OAuth flow',
  });
}
