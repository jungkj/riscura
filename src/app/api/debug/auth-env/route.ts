import { NextResponse } from 'next/server';

export async function GET() {
  // Direct environment variable access
  const envCheck = {
    // OAuth
    GOOGLE_CLIENT_ID: {
      exists: !!process.env.GOOGLE_CLIENT_ID,
      length: process.env.GOOGLE_CLIENT_ID?.length || 0,
      preview: process.env.GOOGLE_CLIENT_ID
        ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 20)}...`
        : 'NOT SET',
    },
    GOOGLE_CLIENT_SECRET: {
      exists: !!process.env.GOOGLE_CLIENT_SECRET,
      length: process.env.GOOGLE_CLIENT_SECRET?.length || 0,
      isNotEmpty: process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CLIENT_SECRET.length > 0,
    },

    // NextAuth
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
    NEXTAUTH_SECRET: {
      exists: !!process.env.NEXTAUTH_SECRET,
      length: process.env.NEXTAUTH_SECRET?.length || 0,
    },

    // Other auth-related
    JWT_ACCESS_SECRET: {
      exists: !!process.env.JWT_ACCESS_SECRET,
      length: process.env.JWT_ACCESS_SECRET?.length || 0,
    },
    SESSION_SECRET: {
      exists: !!process.env.SESSION_SECRET,
      length: process.env.SESSION_SECRET?.length || 0,
    },

    // Environment
    NODE_ENV: process.env.NODE_ENV || 'NOT SET',
    VERCEL: process.env.VERCEL || 'NOT SET',

    // All env keys (to check what's available)
    availableKeys: Object.keys(process.env).filter(
      (key) =>
        key.includes('GOOGLE') ||
        key.includes('AUTH') ||
        key.includes('JWT') ||
        key.includes('SESSION')
    ),
  }

  return NextResponse.json(envCheck, { status: 200 });
}
