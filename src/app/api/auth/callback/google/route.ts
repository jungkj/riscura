import { NextRequest, NextResponse } from 'next/server';

// This route helps debug OAuth callback issues
export async function GET(request: NextRequest) {
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

  console.log('[Google OAuth Callback Debug]', JSON.stringify(debugInfo, null, 2));

  // If this route is hit, it means NextAuth isn't intercepting the callback
  // This helps identify configuration issues
  return NextResponse.json({
    error: 'OAuth callback not handled by NextAuth',
    debug: debugInfo,
    help: 'This suggests NextAuth is not properly configured or the provider is not set up correctly',
  }, { status: 500 });
}