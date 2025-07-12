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
      const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || 'https://riscura.app';
      return NextResponse.redirect(`${baseUrl}/login?error=No%20authorization%20code%20received`);
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
      const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || 'https://riscura.app';
      return NextResponse.redirect(`${baseUrl}/login?error=Authentication%20failed`);
    }
    
    const tokens = await tokenResponse.json();
    
    // Get user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    
    if (!userResponse.ok) {
      const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || 'https://riscura.app';
      return NextResponse.redirect(`${baseUrl}/login?error=Failed%20to%20get%20user%20info`);
    }
    
    const googleUser = await userResponse.json();
    
    // Import database client
    let db;
    try {
      const dbModule = await import('@/lib/db');
      db = dbModule.db;
    } catch (dbError) {
      console.error('[Google OAuth] Database import error:', dbError);
      console.error('[Google OAuth] Environment check:', {
        hasDbUrl: !!process.env.DATABASE_URL,
        hasDbUrlLower: !!process.env.database_url,
        hasAnyDb: !!(process.env.DATABASE_URL || process.env.database_url),
        nodeEnv: process.env.NODE_ENV,
        nextAuthUrl: process.env.NEXTAUTH_URL,
        appUrl: process.env.APP_URL,
        errorType: dbError instanceof Error ? dbError.name : 'Unknown',
        errorMsg: dbError instanceof Error ? dbError.message : String(dbError),
      });
      const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || 'https://riscura.app';
      // More specific error message for missing DATABASE_URL
      const hasDb = process.env.DATABASE_URL || process.env.database_url;
      const errorMsg = !hasDb 
        ? 'Database%20not%20configured.%20Please%20contact%20support.'
        : `Database%20import%20failed%3A%20${encodeURIComponent((dbError instanceof Error ? dbError.message : 'Unknown error').substring(0, 50))}`;
      return NextResponse.redirect(`${baseUrl}/login?error=${errorMsg}`);
    }
    
    // Find or create user in database
    let dbUser;
    try {
      dbUser = await db.client.user.findUnique({
        where: { email: googleUser.email },
        include: { organization: true }
      });
    } catch (dbError) {
      console.error('[Google OAuth] Database query error:', dbError);
      console.error('[Google OAuth] Query error details:', {
        errorName: dbError instanceof Error ? dbError.name : 'Unknown',
        errorMessage: dbError instanceof Error ? dbError.message : String(dbError),
        hasDbClient: !!db?.client,
      });
      const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || 'https://riscura.app';
      // Provide a more user-friendly error message
      return NextResponse.redirect(`${baseUrl}/login?error=Unable%20to%20connect%20to%20database.%20Please%20try%20again%20later.`);
    }
    
    if (!dbUser) {
      console.log('[Google OAuth] Creating new user:', googleUser.email);
      
      // Create a default organization for the user
      const orgName = googleUser.email.split('@')[1] || 'My Organization';
      const org = await db.client.organization.create({
        data: {
          name: orgName,
          tier: 'STARTER',
          settings: {}
        }
      });
      
      // Create the user
      dbUser = await db.client.user.create({
        data: {
          email: googleUser.email,
          firstName: googleUser.given_name || googleUser.name?.split(' ')[0] || '',
          lastName: googleUser.family_name || googleUser.name?.split(' ').slice(1).join(' ') || '',
          role: 'USER',
          avatar: googleUser.picture,
          organizationId: org.id,
          lastLogin: new Date(),
          profile: {
            bio: '',
            department: '',
            jobTitle: '',
            location: '',
            phone: ''
          }
        },
        include: { organization: true }
      });
    } else {
      // Update last login
      await db.client.user.update({
        where: { id: dbUser.id },
        data: { lastLogin: new Date() }
      });
    }
    
    // Create a simple session token with appropriate expiration
    const sessionDuration = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 30 days if remember me, 1 day otherwise
    const sessionToken = Buffer.from(JSON.stringify({
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: `${dbUser.firstName} ${dbUser.lastName}`.trim() || dbUser.email,
        picture: dbUser.avatar || googleUser.picture,
        organizationId: dbUser.organizationId,
        role: dbUser.role
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
      userEmail: dbUser.email,
    });
    
    const response = NextResponse.redirect(redirectUrl);
    
    // Set session cookie with appropriate expiration
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60, // Default to 24 hours if not remember me
      path: '/', // Ensure cookie is available site-wide
    };
    
    // In production, we might need to set the domain explicitly
    if (process.env.NODE_ENV === 'production' && process.env.COOKIE_DOMAIN) {
      (cookieOptions as any).domain = process.env.COOKIE_DOMAIN;
    }
    
    // For localhost development, ensure cookie works properly
    if (process.env.NODE_ENV === 'development') {
      // Don't set domain for localhost to avoid cookie issues
      delete (cookieOptions as any).domain;
    }
    
    console.log('[Google OAuth] Setting cookie with options:', {
      ...cookieOptions,
      sessionTokenLength: sessionToken.length,
      environment: process.env.NODE_ENV,
      redirectUrl,
    });
    
    response.cookies.set('session-token', sessionToken, cookieOptions);
    
    // Clear OAuth state cookie
    response.cookies.delete('oauth_state');
    
    return response;
  } catch (error) {
    console.error('[Google OAuth] Callback error:', error);
    
    // Always redirect to login with error instead of returning JSON
    const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || 'https://riscura.app';
    const errorMessage = error instanceof Error ? error.message : 'OAuth callback failed';
    const errorUrl = `${baseUrl}/login?error=${encodeURIComponent(errorMessage)}`;
    
    return NextResponse.redirect(errorUrl);
  }
}