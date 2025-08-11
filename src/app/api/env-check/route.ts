import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const envCheck = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    
    // Essential variables
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasJwtSecret: !!process.env.JWT_ACCESS_SECRET,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasDirectUrl: !!process.env.DIRECT_URL,
    
    // Values (safe to show)
    nextAuthUrl: process.env.NEXTAUTH_URL,
    nodeEnv: process.env.NODE_ENV,
    
    // Length check (don't expose secrets)
    nextAuthSecretLength: process.env.NEXTAUTH_SECRET?.length || 0,
    jwtSecretLength: process.env.JWT_ACCESS_SECRET?.length || 0,
    databaseUrlLength: process.env.DATABASE_URL?.length || 0,
    
    // Required for production
    requiredVariables: {
      NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      JWT_ACCESS_SECRET: !!process.env.JWT_ACCESS_SECRET,
      DATABASE_URL: !!process.env.DATABASE_URL,
      DIRECT_URL: !!process.env.DIRECT_URL
    },
    
    allRequiredPresent: !!(
      process.env.NEXTAUTH_URL &&
      process.env.NEXTAUTH_SECRET &&
      process.env.JWT_ACCESS_SECRET &&
      process.env.DATABASE_URL &&
      process.env.DIRECT_URL
    )
  };

  return NextResponse.json({
    success: true,
    data: envCheck
  });
}