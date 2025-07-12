import { NextResponse } from 'next/server';

export async function GET() {
  // Only show in development or with secret key
  const secretKey = process.env.DEBUG_SECRET_KEY || 'default-debug-key';
  const isDev = process.env.NODE_ENV === 'development';
  
  if (!isDev && process.env.DEBUG_SECRET_KEY !== secretKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return NextResponse.json({
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
    },
    database: {
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
      DIRECT_URL: process.env.DIRECT_URL ? 'Set' : 'Not set',
    },
    auth: {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'Not set',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'Set' : 'Not set',
      APP_URL: process.env.APP_URL || 'Not set',
    },
    google: {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not set',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not set',
    },
    redis: {
      REDIS_URL: process.env.REDIS_URL ? 'Set' : 'Not set',
    },
    timestamp: new Date().toISOString(),
  });
}