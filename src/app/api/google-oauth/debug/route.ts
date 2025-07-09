import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXTAUTH_URL || 'https://riscura.app'}/api/google-oauth/callback`;
  
  return NextResponse.json({
    status: 'Simple OAuth Debug Info',
    config: {
      hasClientId: !!clientId,
      clientIdLength: clientId?.length || 0,
      clientIdPreview: clientId ? `${clientId.substring(0, 20)}...` : 'not set',
      hasClientSecret: !!clientSecret,
      redirectUri,
      nextAuthUrl: process.env.NEXTAUTH_URL,
    },
    urls: {
      login: '/api/google-oauth/login',
      callback: '/api/google-oauth/callback',
      session: '/api/google-oauth/session',
      logout: '/api/google-oauth/logout',
    },
    testPages: [
      '/simple-oauth-test',
      '/test-google',
    ],
    instructions: 'Visit /test-google or /simple-oauth-test to test the OAuth flow',
  });
}