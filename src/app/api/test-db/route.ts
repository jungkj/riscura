import { NextResponse } from 'next/server';

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
    },
    database: {
      DATABASE_URL: process.env.DATABASE_URL ? 'Set (uppercase)' : 'Not set',
      database_url: process.env.database_url ? 'Set (lowercase)' : 'Not set',
      hasAnyDbUrl: !!(process.env.DATABASE_URL || process.env.database_url),
    },
    tests: {
      dbImport: null,
      prismaConnection: null,
      simpleQuery: null,
    },
  };

  // Test 1: Try to import the database module
  try {
    const dbModule = await import('@/lib/db');
    results.tests.dbImport = {
      success: true,
      hasDb: !!dbModule.db,
      hasClient: !!dbModule.db?.client,
    };
  } catch (error) {
    results.tests.dbImport = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 3) : null,
    };
  }

  // Test 2: Try to create a Prisma client directly
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || process.env.database_url || '',
        },
      },
    });

    results.tests.prismaConnection = {
      success: true,
      clientCreated: true,
    };

    // Test 3: Try a simple query
    try {
      const _result = await prisma.$queryRaw`SELECT 1 as test`;
      results.tests.simpleQuery = {
        success: true,
        result: result,
      };
      await prisma.$disconnect();
    } catch (queryError) {
      results.tests.simpleQuery = {
        success: false,
        error: queryError instanceof Error ? queryError.message : String(queryError),
        code: (queryError as any)?.code,
      };
    }
  } catch (prismaError) {
    results.tests.prismaConnection = {
      success: false,
      error: prismaError instanceof Error ? prismaError.message : String(prismaError),
      stack: prismaError instanceof Error ? prismaError.stack?.split('\n').slice(0, 3) : null,
    };
  }

  return NextResponse.json(results, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
