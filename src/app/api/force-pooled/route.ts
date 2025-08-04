import { NextResponse } from 'next/server';

// This endpoint forces the use of pooled connection and tests it
export async function GET() {
  const dbUrl = process.env.DATABASE_URL || process.env.database_url;

  if (!dbUrl) {
    return NextResponse.json({ error: 'No database URL found' }, { status: 500 });
  }

  // Force convert to pooled URL
  const supabaseDirectPattern =
    /postgresql:\/\/postgres:([^@]+)@db\.([^.]+)\.supabase\.co:5432\/postgres/;
  const match = dbUrl.match(supabaseDirectPattern);

  if (!match) {
    return NextResponse.json(
      {
        error: 'Database URL is not a Supabase direct URL',
        currentUrl: dbUrl.substring(0, 50) + '...',
      },
      { status: 400 }
    );
  }

  const [, password, projectRef] = match;
  // Get the region from environment or default to us-east-1
  const region = process.env.SUPABASE_REGION || 'us-east-1';
  const pooledUrl = `postgresql://postgres.${projectRef}:${password}@aws-0-${region}.pooler.supabase.com:6543/postgres`;

  // Test the pooled connection
  try {
    const { PrismaClient } = await import('@prisma/client');
    const testUrl = new URL(pooledUrl);
    testUrl.searchParams.set('pgbouncer', 'true');
    testUrl.searchParams.set('connection_limit', '1');

    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: testUrl.toString(),
        },
      },
      log: ['error'],
    });

    const _result = await prisma.$queryRaw`SELECT current_database() as db, now() as time`;
    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      message: 'Pooled connection works!',
      result,
      conversion: {
        from: `db.${projectRef}.supabase.co:5432`,
        to: `aws-0-${region}.pooler.supabase.com:6543`,
        region: region,
      },
      nextSteps: [
        '1. Go to Vercel dashboard',
        '2. Update your database_url environment variable',
        `3. Use this pooled URL: postgresql://postgres.${projectRef}:[YOUR-PASSWORD]@aws-0-${region}.pooler.supabase.com:6543/postgres`,
        '4. Or get the exact URL from Supabase Dashboard → Settings → Database → Connection Pooling',
        '5. Optionally set SUPABASE_REGION environment variable to your region (e.g., us-east-1)',
      ],
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        suggestion:
          'The pooled URL format might be incorrect. Please get the correct URL from Supabase.',
      },
      { status: 500 }
    );
  }
}
