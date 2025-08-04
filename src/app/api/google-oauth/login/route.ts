import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || 'https://riscura.app';
    const redirectUri = `${baseUrl}/api/google-oauth/callback`;

    // console.log('[Google OAuth] Login initialization:', {
    //   baseUrl,
    //   redirectUri,
    //   hasClientId: !!clientId,
    // })

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

    // Get redirect URL and remember me preference from query params or referrer
    const { searchParams } = req.nextUrl;
    const referer = req.headers.get('referer');
    let intendedRedirect = '/dashboard';
    let rememberMe = false;

    // First check query params for redirect
    if (searchParams.has('redirect')) {
      intendedRedirect = decodeURIComponent(searchParams.get('redirect') || '/dashboard');
    }
    // Fallback to extracting from referrer if not in query params
    else if (referer && referer.includes('/auth/login')) {
      const url = new URL(referer);
      intendedRedirect = url.searchParams.get('from') || '/dashboard';
    }

    // Check for remember me preference in query params
    if (searchParams.has('remember')) {
      rememberMe = searchParams.get('remember') === 'true';
    }

    // console.log('[Google OAuth] Login params:', {
    //   intendedRedirect,
    //   rememberMe,
    //   hasRedirectParam: searchParams.has('redirect'),
    //   hasRememberParam: searchParams.has('remember'),
    // })

    // Create state with CSRF token, redirect, and remember preference
    const csrfToken = Math.random().toString(36).substring(7);
    const stateData = {
      csrf: csrfToken,
      redirect: intendedRedirect,
      remember: rememberMe,
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
    // console.error('[Google OAuth] Login error:', error)
    return NextResponse.json(
      {
        error: 'OAuth initialization failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
