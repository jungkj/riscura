import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// This endpoint shows exactly what needs to be done to fix the database configuration
export async function GET() {
  const config = {
    current: {
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
      database_url: process.env.database_url ? 'Set' : 'Not set',
      DIRECT_URL: process.env.DIRECT_URL ? 'Set' : 'Not set',
      actualUrl:
        (process.env.DATABASE_URL || process.env.database_url || '').substring(0, 60) + '...',
      directUrl: (process.env.DIRECT_URL || '').substring(0, 60) + '...',
    },
    analysis: {
      isDATABASE_URLDirect:
        process.env.DATABASE_URL?.includes('db.') &&
        process.env.DATABASE_URL?.includes('.supabase.co'),
      isDATABASE_URLPooled: process.env.DATABASE_URL?.includes('pooler.supabase.com'),
      isDIRECT_URLSet: !!process.env.DIRECT_URL,
      problemIdentified: false,
      issue: '',
    },
  }

  // Identify the specific issue
  if (process.env.DIRECT_URL && process.env.DATABASE_URL === process.env.DIRECT_URL) {
    config.analysis.problemIdentified = true
    config.analysis.issue =
      'DATABASE_URL and DIRECT_URL are the same (both using direct connection)';
  } else if (config.analysis.isDATABASE_URLDirect) {
    config.analysis.problemIdentified = true;
    config.analysis.issue = 'DATABASE_URL is using direct connection instead of pooled';
  }

  const yourPooledUrl =
    'postgresql://postgres.zggstcxinvxsfksssdyr:Gynaha2pf!123@aws-0-us-east-1.pooler.supabase.com:6543/postgres';

  return NextResponse.json(
    {
      ...config,
      solution: {
        message: 'You need to update your Vercel environment variables:',
        steps: [
          {
            step: 1,
            action: 'Go to Vercel Dashboard → Your Project → Settings → Environment Variables',
          },
          {
            step: 2,
            action: 'Update DATABASE_URL (uppercase) to your pooled URL:',
            value: yourPooledUrl,
          },
          {
            step: 3,
            action: 'If DIRECT_URL exists, update it to your direct URL (or remove it):',
            value:
              'postgresql://postgres:[password]@db.zggstcxinvxsfksssdyr.supabase.co:5432/postgres',
          },
          {
            step: 4,
            action: 'Make sure these are set for Production environment',
          },
          {
            step: 5,
            action: 'Redeploy your application after updating environment variables',
          },
        ],
        important: [
          'DATABASE_URL should use the pooled connection (pooler.supabase.com)',
          'DIRECT_URL should use the direct connection (db.*.supabase.co) or be removed',
          'Never set both to the same value',
          'If you only have one database URL, use it for DATABASE_URL and remove DIRECT_URL',
        ],
      },
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
