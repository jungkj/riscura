import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  // Get the raw database URL
  const rawUrl = process.env.DATABASE_URL || process.env.database_url;

  // Check if it needs conversion
  const needsConversion = rawUrl?.includes('db.zggstcxinvxsfksssdyr.supabase.co');

  let convertedUrl = null;
  let testResult = null;

  if (needsConversion && rawUrl) {
    // Apply the same conversion logic
    const passwordMatch = rawUrl.match(/postgres:([^@]+)@/);
    if (passwordMatch) {
      const password = passwordMatch[1];
      convertedUrl = `postgresql://postgres.zggstcxinvxsfksssdyr:${password}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

      // Test the converted URL
      try {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient({
          datasources: {
            db: {
              url: convertedUrl,
            },
          },
          log: ['error'],
        });

        const _result = await prisma.$queryRaw`SELECT 1 as test, now() as time`;
        await prisma.$disconnect();

        testResult = {
          success: true,
          message: 'Pooled connection works with workaround!',
          result,
        };
      } catch (error) {
        testResult = {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  }

  return NextResponse.json(
    {
      timestamp: new Date().toISOString(),
      analysis: {
        rawUrl: rawUrl ? rawUrl.substring(0, 60) + '...' : 'Not found',
        needsConversion,
        hasPassword: !!rawUrl?.match(/postgres:([^@]+)@/),
        convertedUrl: convertedUrl ? convertedUrl.substring(0, 60) + '...' : null,
      },
      workaroundTest: testResult,
      dbLibStatus: {
        shouldBeConverting: process.env.NODE_ENV === 'production' && needsConversion,
        environment: process.env.NODE_ENV,
      },
      nextSteps: testResult?.success
        ? 'The workaround is functional! Google OAuth should work now. Still update your Vercel env vars for a permanent fix.'
        : 'The workaround test failed. Please update DATABASE_URL in Vercel immediately.',
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
