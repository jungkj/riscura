import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  // Get all environment variables that might contain database URLs
  const envVars: Record<string, string | undefined> = {};
  
  // Check all possible database-related env vars
  const possibleKeys = [
    'DATABASE_URL',
    'database_url',
    'DIRECT_URL',
    'direct_url',
    'POSTGRES_URL',
    'postgres_url',
    'POSTGRES_URL_NON_POOLING',
    'postgres_url_non_pooling',
    'POSTGRES_PRISMA_URL',
    'postgres_prisma_url',
    'POSTGRES_URL_NO_SSL',
    'postgres_url_no_ssl',
  ];
  
  for (const key of possibleKeys) {
    if (process.env[key]) {
      // Show first 50 chars and last 20 chars
      const value = process.env[key]!;
      if (value.length > 70) {
        envVars[key] = value.substring(0, 50) + '...' + value.substring(value.length - 20);
      } else {
        envVars[key] = value;
      }
    }
  }
  
  // Check if we're in Vercel
  const vercelInfo = {
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
    VERCEL_REGION: process.env.VERCEL_REGION,
    NODE_ENV: process.env.NODE_ENV,
  };
  
  // Parse the actual database URL being used
  const actualUrl = process.env.DATABASE_URL || process.env.database_url;
  let urlType = 'unknown';
  if (actualUrl) {
    if (actualUrl.includes('pooler.supabase.com')) {
      urlType = 'pooled';
    } else if (actualUrl.includes('db.') && actualUrl.includes('.supabase.co')) {
      urlType = 'direct';
    }
  }
  
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    vercelInfo,
    foundEnvVars: envVars,
    urlType,
    recommendation: urlType === 'direct' 
      ? 'The app is using a DIRECT database URL. Please check your Vercel environment variables.'
      : urlType === 'pooled'
        ? 'The app is correctly using a POOLED database URL.'
        : 'No database URL found.',
    possibleIssues: [
      'Check if DATABASE_URL (uppercase) is set in Vercel',
      'Make sure to redeploy after changing environment variables',
      'Verify the environment variable is in the correct Vercel environment (Production/Preview/Development)',
    ]
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}