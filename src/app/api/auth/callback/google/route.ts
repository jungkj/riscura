import { NextRequest, NextResponse } from 'next/server';

// This route helps debug OAuth callback issues
export async function GET(_request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const debugInfo = {
    timestamp: new Date().toISOString(),
    url: request.url,
    searchParams: Object.fromEntries(searchParams),
    headers: {
      host: request.headers.get('host'),
      referer: request.headers.get('referer'),
    },
    error: searchParams.get('error'),
    errorDescription: searchParams.get('error_description'),
    code: searchParams.get('code'),
    state: searchParams.get('state'),
  };

  // console.log('[Google OAuth Callback Debug]', JSON.stringify(debugInfo, null, 2))

  // Since NextAuth is not working, redirect to our simple OAuth handler
  const simpleOAuthUrl = new URL('/api/google-oauth/callback', request.nextUrl.origin);

  // Copy all search params to the new URL
  searchParams.forEach((value, key) => {
    simpleOAuthUrl.searchParams.set(key, value);
  });

  // console.log('[Google OAuth] Redirecting to simple OAuth handler:', simpleOAuthUrl.toString())

  // Redirect to simple OAuth callback
  return NextResponse.redirect(simpleOAuthUrl.toString());
}
