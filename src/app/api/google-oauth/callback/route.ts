import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    // Check for OAuth errors
    if (error) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'https://riscura.app'}/auth/error?error=${error}`);
    }
    
    if (!code) {
      return NextResponse.json({ error: 'No authorization code received' }, { status: 400 });
    }
    
    // Parse state to get CSRF token and redirect URL
    let redirectTo = '/dashboard';
    try {
      if (state) {
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
        const savedCsrf = req.cookies.get('oauth_state')?.value;
        
        // Verify CSRF token
        if (savedCsrf && stateData.csrf !== savedCsrf) {
          console.warn('[Google OAuth] CSRF token mismatch');
        }
        
        redirectTo = stateData.redirect || '/dashboard';
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
      redirect_uri: `${process.env.NEXTAUTH_URL || 'https://riscura.app'}/api/google-oauth/callback`,
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
    
    // Create a simple session token
    const sessionToken = Buffer.from(JSON.stringify({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    })).toString('base64');
    
    // Redirect to the intended destination with session
    const response = NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'https://riscura.app'}${redirectTo}`);
    
    // Set session cookie
    response.cookies.set('session-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });
    
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