import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Test what the OAuth session endpoint would return
export async function GET(req: NextRequest) {
  try {
    // Call the OAuth session endpoint directly
    const response = await fetch(`${req.nextUrl.origin}/api/google-oauth/session`, {
      headers: {
        cookie: req.headers.get('cookie') || '',
      },
    });
    
    const data = await response.json();
    
    return NextResponse.json({
      oauthSessionResponse: {
        status: response.status,
        data: data,
      },
      cookies: {
        sessionToken: req.cookies.get('session-token')?.value ? 'exists' : 'missing',
        allCookies: req.cookies.getAll().map(c => c.name),
      },
      recommendation: data.user ? 
        'OAuth session is returning a valid user. Check if AuthContext is processing it correctly.' :
        'OAuth session is returning null user. This causes the redirect.',
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to test OAuth session',
      type: error instanceof Error ? error.name : 'Unknown',
    });
  }
}