import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  // Force reload all environment variables
  const dbUrls = {
    DATABASE_URL: process.env.DATABASE_URL,
    database_url: process.env.database_url,
    actualUsed: process.env.DATABASE_URL || process.env.database_url,
  };

  // Check if it's already a pooled URL
  const url = dbUrls.actualUsed;
  const isPooled = url?.includes('pooler.supabase.com');
  const isDirectUrl = url?.includes('db.') && url?.includes('.supabase.co');

  // Try to connect with the current URL
  let connectionTest = null;
  if (url) {
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient({
        datasources: {
          db: {
            url: url,
          },
        },
        log: ['error'],
      });

      const _result = await prisma.$queryRaw`SELECT current_database() as db, version() as version`;
      await prisma.$disconnect();

      connectionTest = {
        success: true,
        result,
      };
    } catch (error) {
      connectionTest = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  return NextResponse.json(
    {
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        VERCEL_ENV: process.env.VERCEL_ENV,
      },
      databaseUrls: {
        hasUppercase: !!process.env.DATABASE_URL,
        hasLowercase: !!process.env.database_url,
        uppercasePreview: process.env.DATABASE_URL
          ? process.env.DATABASE_URL.substring(0, 60) + '...'
          : null,
        lowercasePreview: process.env.database_url
          ? process.env.database_url.substring(0, 60) + '...'
          : null,
      },
      urlAnalysis: {
        isPooled,
        isDirectUrl,
        hostname: url ? new URL(url).hostname : null,
        port: url ? new URL(url).port : null,
      },
      connectionTest,
      recommendation: isDirectUrl
        ? 'Your database_url is still using the direct connection. Please update it in Vercel to use the pooled URL.'
        : isPooled
          ? 'Your database_url is correctly using the pooled connection.'
          : 'Unable to determine URL type.',
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    }
  );
}
