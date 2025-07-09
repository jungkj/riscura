import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/config/env';

export async function GET(req: NextRequest) {
  // Only allow in development or with a special header
  const isDev = process.env.NODE_ENV === 'development';
  const hasDebugHeader = req.headers.get('x-debug-auth') === process.env.DEBUG_SECRET;
  
  if (!isDev && !hasDebugHeader) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  
  const diagnostics = {
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      APP_URL: process.env.APP_URL,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasJwtSecret: !!process.env.JWT_ACCESS_SECRET,
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      googleClientIdLength: process.env.GOOGLE_CLIENT_ID?.length || 0,
      googleClientIdPreview: process.env.GOOGLE_CLIENT_ID ? 
        `${process.env.GOOGLE_CLIENT_ID.substring(0, 10)}...` : 'not set',
    },
    envConfig: {
      nextAuthUrl: env.NEXTAUTH_URL || env.APP_URL,
      hasProviders: true,
      jwtSecretConfigured: !!env.JWT_ACCESS_SECRET,
      nextAuthSecretConfigured: !!env.NEXTAUTH_SECRET,
    },
    checks: {
      urlMismatch: process.env.NEXTAUTH_URL !== req.nextUrl.origin,
      currentOrigin: req.nextUrl.origin,
      expectedUrl: process.env.NEXTAUTH_URL,
    },
    timestamp: new Date().toISOString(),
  };
  
  return NextResponse.json(diagnostics, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}