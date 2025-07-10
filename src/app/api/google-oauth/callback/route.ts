import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    // Check for OAuth errors
    if (error) {
      const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || 'https://riscura.app';
      return NextResponse.redirect(`${baseUrl}/auth/error?error=${error}`);
    }
    
    if (!code) {
      return NextResponse.json({ error: 'No authorization code received' }, { status: 400 });
    }
    
    // Parse state to get CSRF token, redirect URL, and remember preference
    let redirectTo = '/dashboard';
    let rememberMe = false;
    try {
      if (state) {
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
        const savedCsrf = req.cookies.get('oauth_state')?.value;
        
        // Verify CSRF token
        if (savedCsrf && stateData.csrf !== savedCsrf) {
          console.warn('[Google OAuth] CSRF token mismatch');
        }
        
        redirectTo = stateData.redirect || '/dashboard';
        rememberMe = stateData.remember || false;
      }
    } catch (e) {
      // State might be from old format, continue with default redirect
      console.log('[Google OAuth] Could not parse state, using default redirect');
    }
    
    // Exchange code for tokens
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const params = new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXTAUTH_URL || process.env.APP_URL || 'https://riscura.app'}/api/google-oauth/callback`,
      grant_type: 'authorization_code',
    });
    
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    
    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('[Google OAuth] Token exchange failed:', error);
      return NextResponse.json({ error: 'Token exchange failed', details: error }, { status: 500 });
    }
    
    const tokens = await tokenResponse.json();
    
    // Get user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    
    if (!userResponse.ok) {
      return NextResponse.json({ error: 'Failed to get user info' }, { status: 500 });
    }
    
    const user = await userResponse.json();
    
    // Create a simple session token with appropriate expiration
    const sessionDuration = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 30 days if remember me, 1 day otherwise
    const sessionToken = Buffer.from(JSON.stringify({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
      expires: new Date(Date.now() + sessionDuration).toISOString(),
      rememberMe: rememberMe,
    })).toString('base64');
    
    // Redirect to the intended destination with session
    const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || 'https://riscura.app';
    const redirectUrl = `${baseUrl}${redirectTo}`;
    
    console.log('[Google OAuth] Setting session cookie and redirecting:', {
      baseUrl,
      redirectTo,
      redirectUrl,
      rememberMe,
      userEmail: user.email,
    });
    
    const response = NextResponse.redirect(redirectUrl);
    
    // Set session cookie with appropriate expiration
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : undefined, // 30 days if remember me, session cookie otherwise
      path: '/', // Ensure cookie is available site-wide
    };
    
    // In production, we might need to set the domain explicitly
    if (process.env.NODE_ENV === 'production' && process.env.COOKIE_DOMAIN) {
      (cookieOptions as any).domain = process.env.COOKIE_DOMAIN;
    }
    
    console.log('[Google OAuth] Setting cookie with options:', {
      ...cookieOptions,
      sessionTokenLength: sessionToken.length,
    });
    
    response.cookies.set('session-token', sessionToken, cookieOptions);
    
    // Clear OAuth state cookie
    response.cookies.delete('oauth_state');
    
    return response;
  } catch (error) {
    console.error('[Google OAuth] Callback error:', error);
    return NextResponse.json(
      { 
        error: 'OAuth callback failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}