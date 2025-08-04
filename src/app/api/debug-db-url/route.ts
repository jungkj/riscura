import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  // Get all possible database URL sources
  const urls = {
    DATABASE_URL: process.env.DATABASE_URL,
    database_url: process.env.database_url,
    DIRECT_URL: process.env.DIRECT_URL,
    direct_url: process.env.direct_url,
  }

  // Check what we're actually using
  const actualUrl = process.env.DATABASE_URL || process.env.database_url

  // Analyze the URL
  let urlInfo = null
  if (actualUrl) {
    try {
      const url = new URL(actualUrl);
      urlInfo = {
        hostname: url.hostname,
        port: url.port,
        username: url.username,
        pathname: url.pathname,
        isPooled: url.hostname.includes('pooler.supabase.com'),
        isDirectUrl: url.hostname.includes('db.') && url.hostname.includes('.supabase.co'),
        region: url.hostname.match(/aws-0-([^.]+)\.pooler/)?.[1] || null,
        projectRef:
          url.hostname.match(/postgres\.([^:]+):|db\.([^.]+)\./)?.[1] ||
          url.hostname.match(/postgres\.([^:]+):|db\.([^.]+)\./)?.[2] ||
          null,
      }
    } catch (e) {
      urlInfo = { error: 'Invalid URL format' }
    }
  }

  // Test if we can actually connect
  let connectionTest = null
  if (actualUrl) {
    try {
      const { PrismaClient } = await import('@prisma/client');
      const testClient = new PrismaClient({
        datasources: {
          db: {
            url: actualUrl,
          },
        },
        log: ['error'],
      });

      const _result = await testClient.$queryRaw`SELECT 1 as test`;
      await testClient.$disconnect();
      connectionTest = { success: true, result }
    } catch (error) {
      connectionTest = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        errorName: error instanceof Error ? error.name : 'Unknown',
      }
    }
  }

  return NextResponse.json(
    {
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        VERCEL_ENV: process.env.VERCEL_ENV,
        SUPABASE_REGION: process.env.SUPABASE_REGION,
      },
      urlSources: {
        hasDATABASE_URL: !!urls.DATABASE_URL,
        hasdatabase_url: !!urls.database_url,
        hasDIRECT_URL: !!urls.DIRECT_URL,
        hasdirect_url: !!urls.direct_url,
      },
      urlAnalysis: urlInfo,
      connectionTest,
      recommendation: urlInfo?.isDirectUrl
        ? 'Your app is using a direct database URL. This needs to be updated to use the pooled URL.'
        : urlInfo?.isPooled
          ? 'Your app is correctly configured with a pooled URL.'
          : 'Unable to determine database URL type.',
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
