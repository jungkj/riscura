import { NextResponse } from 'next/server';

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    currentUrl: {
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
      database_url: process.env.database_url ? 'Set' : 'Not set',
    },
    urlAnalysis: {},
    pooledTest: null,
  };

  const dbUrl = process.env.DATABASE_URL || process.env.database_url;
  
  if (dbUrl) {
    try {
      const url = new URL(dbUrl);
      results.urlAnalysis = {
        hostname: url.hostname,
        port: url.port,
        isDirectUrl: url.hostname.includes('db.') && url.hostname.includes('.supabase.co'),
        isPooledUrl: url.hostname.includes('pooler.supabase.com'),
        projectRef: url.hostname.match(/db\.([^.]+)\.supabase\.co/)?.[1] || 
                    url.hostname.match(/postgres\.([^:]+)/)?.[1] || 
                    'unknown',
      };

      // If it's a direct URL, show what the pooled URL should be
      if (results.urlAnalysis.isDirectUrl) {
        const match = dbUrl.match(/postgresql:\/\/postgres:([^@]+)@db\.([^.]+)\.supabase\.co:5432\/postgres/);
        if (match) {
          const [, password, projectRef] = match;
          results.suggestedPooledUrl = `postgresql://postgres.${projectRef}:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres`;
          results.instructions = [
            '1. Go to your Supabase dashboard',
            '2. Navigate to Settings → Database',
            '3. Find the "Connection Pooling" section',
            '4. Copy the connection string (Mode: Session)',
            '5. Update your database_url in Vercel with this pooled URL',
          ];
        }
      }

      // Test the pooled connection if URL is already pooled
      if (results.urlAnalysis.isPooledUrl) {
        try {
          const { PrismaClient } = await import('@prisma/client');
          const testUrl = new URL(dbUrl);
          testUrl.searchParams.set('pgbouncer', 'true');
          testUrl.searchParams.set('connection_limit', '1');
          
          const prisma = new PrismaClient({
            datasources: {
              db: {
                url: testUrl.toString(),
              },
            },
          });
          
          const result = await prisma.$queryRaw`SELECT 1 as test`;
          results.pooledTest = {
            success: true,
            result: result,
          };
          await prisma.$disconnect();
        } catch (error) {
          results.pooledTest = {
            success: false,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      }
    } catch (error) {
      results.urlAnalysis.error = error instanceof Error ? error.message : String(error);
    }
  }

  return NextResponse.json(results, { 
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}