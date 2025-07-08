import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/config/env';

// Compatibility route for old Google OAuth flow
// This route now properly initiates NextAuth Google sign-in
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const callbackUrl = searchParams.get('redirect') || '/dashboard';
    
    // Check if Google OAuth is configured
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      console.error('Google OAuth not configured');
      // Redirect to regular sign-in page with error
      const signInUrl = new URL('/auth/login', request.url);
      signInUrl.searchParams.set('error', 'OAuthNotConfigured');
      return NextResponse.redirect(signInUrl.toString());
    }
    
    // Construct the NextAuth sign-in URL for Google provider
    // NextAuth expects: /api/auth/signin/google
    const googleSignInUrl = new URL('/api/auth/signin/google', request.url);
    googleSignInUrl.searchParams.set('callbackUrl', callbackUrl);
    
    return NextResponse.redirect(googleSignInUrl.toString());
  } catch (error) {
    console.error('Google OAuth redirect error:', error);
    // Fallback to login page
    return NextResponse.redirect(new URL('/auth/login', request.url).toString());
  }
}