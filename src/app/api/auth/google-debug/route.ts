import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Log all environment variables related to OAuth
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 
        `${process.env.GOOGLE_CLIENT_ID.substring(0, 20)}...` : 'NOT SET',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET',
    },
    request: {
      url: request.url,
      headers: {
        host: request.headers.get('host'),
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer'),
      },
      searchParams: Object.fromEntries(request.nextUrl.searchParams),
    },
    computedCallbackUrl: `${process.env.NEXTAUTH_URL}/api/auth/callback/google`,
    expectedRedirectUri: 'https://riscura.app/api/auth/callback/google',
  };

  // Log to server console
  console.log('[Google OAuth Debug]', JSON.stringify(debugInfo, null, 2));

  // Return as JSON for browser viewing
  return NextResponse.json(debugInfo);
}