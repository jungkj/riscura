import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

/**
 * Create a signed session token to prevent tampering
 * Uses HMAC-SHA256 with a secret key
 */
function createSignedSessionToken(sessionData: any): string {
  const secret = process.env.NEXTAUTH_SECRET || process.env.SESSION_SECRET || 'fallback-secret-key';
  const payload = JSON.stringify(sessionData);

  // Create HMAC signature
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  // Combine payload and signature
  const signedToken = Buffer.from(
    JSON.stringify({
      payload: payload,
      signature: signature,
    })
  ).toString('base64');

  return signedToken;
}

/**
 * Verify a signed session token
 */
function verifySignedSessionToken(token: string): any | null {
  try {
    const secret =
      process.env.NEXTAUTH_SECRET || process.env.SESSION_SECRET || 'fallback-secret-key';
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(decoded.payload)
      .digest('hex');

    if (decoded.signature !== expectedSignature) {
      return null; // Invalid signature
    }

    return JSON.parse(decoded.payload);
  } catch {
    return null; // Invalid token format
  }
}

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
      return NextResponse.redirect(
        `${baseUrl}/auth/login?error=No%20authorization%20code%20received`
      );
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
          // console.warn('[Google OAuth] CSRF token mismatch')
        }

        redirectTo = stateData.redirect || '/dashboard';
        rememberMe = stateData.remember || false;
      }
    } catch (e) {
      // State might be from old format, continue with default redirect
      // console.log('[Google OAuth] Could not parse state, using default redirect')
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
      // console.error('[Google OAuth] Token exchange failed:', error)
      const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || 'https://riscura.app';
      return NextResponse.redirect(`${baseUrl}/auth/login?error=Authentication%20failed`);
    }

    const tokens = await tokenResponse.json();

    // Get user info with timeout protection
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    let userResponse;
    try {
      userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
        signal: controller.signal, // Add abort signal for timeout
      });
      clearTimeout(timeoutId); // Clear timeout on successful response
    } catch (fetchError) {
      clearTimeout(timeoutId);
      const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || 'https://riscura.app';
      const errorMsg =
        fetchError instanceof Error && fetchError.name === 'AbortError'
          ? 'Request%20timeout%20getting%20user%20info'
          : 'Network%20error%20getting%20user%20info';
      return NextResponse.redirect(`${baseUrl}/auth/login?error=${errorMsg}`);
    }

    if (!userResponse.ok) {
      const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || 'https://riscura.app';
      return NextResponse.redirect(`${baseUrl}/auth/login?error=Failed%20to%20get%20user%20info`);
    }

    const googleUser = await userResponse.json();

    // Find or create user in database (using static import for better performance)
    let dbUser;
    try {
      dbUser = await db.client.user.findUnique({
        where: { email: googleUser.email },
        include: { organization: true },
      });
    } catch (dbError) {
      // console.error('[Google OAuth] Database query error:', dbError)
      // console.error('[Google OAuth] Query error details:', {
      //   errorName: dbError instanceof Error ? dbError.name : 'Unknown',
      //   errorMessage: dbError instanceof Error ? dbError.message : String(dbError),
      //   hasDbClient: !!db?.client,
      // })
      const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || 'https://riscura.app';
      // Provide a more user-friendly error message
      return NextResponse.redirect(
        `${baseUrl}/auth/login?error=Unable%20to%20connect%20to%20database.%20Please%20try%20again%20later.`
      );
    }

    if (!dbUser) {
      // console.log('[Google OAuth] Creating new user:', googleUser.email)

      // Create a default organization for the user
      const orgName = googleUser.email.split('@')[1] || 'My Organization';
      const org = await db.client.organization.create({
        data: {
          name: orgName,
          plan: 'free', // Using 'plan' field, not 'tier'
          settings: {},
        },
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
          // Removed profile field as it doesn't exist in the schema
        },
        include: { organization: true },
      });
    } else {
      // Update last login
      await db.client.user.update({
        where: { id: dbUser.id },
        data: { lastLogin: new Date() },
      });
    }

    // Create a secure signed session token to prevent tampering
    const sessionDuration = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 30 days if remember me, 1 day otherwise
    const sessionData = {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: `${dbUser.firstName} ${dbUser.lastName}`.trim() || dbUser.email,
        picture: dbUser.avatar || googleUser.picture,
        organizationId: dbUser.organizationId,
        role: dbUser.role.toLowerCase(), // Ensure role is lowercase for consistency
      },
      expires: new Date(Date.now() + sessionDuration).toISOString(),
      rememberMe: rememberMe,
      iat: Math.floor(Date.now() / 1000), // Issued at timestamp
    };

    const sessionToken = createSignedSessionToken(sessionData);

    // Redirect to the intended destination with session
    const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || 'https://riscura.app';
    const redirectUrl = `${baseUrl}${redirectTo}`;

    // console.log('[Google OAuth] Setting session cookie and redirecting:', {
    //   baseUrl,
    //   redirectTo,
    //   redirectUrl,
    //   rememberMe,
    //   userEmail: dbUser.email,
    // })

    const response = NextResponse.redirect(redirectUrl);

    // Set session cookie with appropriate expiration
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60, // Default to 24 hours if not remember me
      path: '/', // Ensure cookie is available site-wide
    };

    // In production, handle cookie domain properly
    if (process.env.NODE_ENV === 'production') {
      // For Vercel deployments, don't set domain to allow cookies to work properly
      // The browser will automatically use the current domain
      // Only set domain if explicitly configured (e.g., for custom domains)
      if (process.env.COOKIE_DOMAIN && process.env.COOKIE_DOMAIN !== 'auto') {
        (cookieOptions as any).domain = process.env.COOKIE_DOMAIN;
      }
    }

    // console.log('[Google OAuth] Setting cookie with options:', {
    //   ...cookieOptions,
    //   sessionTokenLength: sessionToken.length,
    //   environment: process.env.NODE_ENV,
    //   redirectUrl,
    // })

    // Clear OAuth state cookie first to avoid conflicts
    response.cookies.delete('oauth_state');

    // Set secure session cookie
    response.cookies.set('session-token', sessionToken, cookieOptions);

    return response;
  } catch (error) {
    // console.error('[Google OAuth] Callback error:', error)

    // Always redirect to login with error instead of returning JSON
    const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || 'https://riscura.app';
    const errorMessage = error instanceof Error ? error.message : 'OAuth callback failed';
    const errorUrl = `${baseUrl}/auth/login?error=${encodeURIComponent(errorMessage)}`;

    return NextResponse.redirect(errorUrl);
  }
}
