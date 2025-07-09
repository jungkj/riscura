import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = `${process.env.NEXTAUTH_URL || 'https://riscura.app'}/api/google-oauth/callback`;
    
    if (!clientId) {
      return NextResponse.json({ error: 'Google Client ID not configured' }, { status: 500 });
    }
    
    // Build Google OAuth URL
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.set('client_id', clientId);
    googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
    googleAuthUrl.searchParams.set('response_type', 'code');
    googleAuthUrl.searchParams.set('scope', 'openid email profile');
    googleAuthUrl.searchParams.set('access_type', 'offline');
    googleAuthUrl.searchParams.set('prompt', 'consent');
    
    // Get redirect URL from referrer or default to dashboard
    const referer = req.headers.get('referer');
    let intendedRedirect = '/dashboard';
    
    // Extract redirect path from login page URL if present
    if (referer && referer.includes('/auth/login')) {
      const url = new URL(referer);
      intendedRedirect = url.searchParams.get('from') || '/dashboard';
    }
    
    // Create state with both CSRF token and redirect
    const csrfToken = Math.random().toString(36).substring(7);
    const stateData = {
      csrf: csrfToken,
      redirect: intendedRedirect
    };
    const state = Buffer.from(JSON.stringify(stateData)).toString('base64');
    googleAuthUrl.searchParams.set('state', state);
    
    // Set CSRF token in cookie for verification
    const response = NextResponse.redirect(googleAuthUrl.toString());
    response.cookies.set('oauth_state', csrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
    });
    
    return response;
  } catch (error) {
    console.error('[Google OAuth] Login error:', error);
    return NextResponse.json(
      { 
        error: 'OAuth initialization failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}