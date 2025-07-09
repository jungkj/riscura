import { NextResponse } from 'next/server';

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      hasDatabase: !!process.env.DATABASE_URL,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasJwtSecret: !!process.env.JWT_ACCESS_SECRET,
      nextAuthUrl: process.env.NEXTAUTH_URL,
    },
    tests: {
      envModule: null as any,
      dbModule: null as any,
      authOptions: null as any,
      prismaClient: null as any,
    },
    errors: [] as string[],
  };

  // Test 1: Can we load the env module?
  try {
    const { env } = await import('@/config/env');
    diagnostics.tests.envModule = {
      success: true,
      hasNextAuthSecret: !!env.NEXTAUTH_SECRET,
      hasGoogleCreds: !!env.GOOGLE_CLIENT_ID,
    };
  } catch (error) {
    diagnostics.tests.envModule = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    diagnostics.errors.push(`env module: ${error}`);
  }

  // Test 2: Can we load the db module?
  try {
    const dbModule = await import('@/lib/db');
    diagnostics.tests.dbModule = {
      success: true,
      hasDb: !!dbModule.db,
      hasClient: false,
    };
    
    // Try to access the client
    try {
      const client = dbModule.db.client;
      diagnostics.tests.dbModule.hasClient = !!client;
    } catch (clientError) {
      diagnostics.tests.dbModule.clientError = clientError instanceof Error ? clientError.message : 'Unknown error';
    }
  } catch (error) {
    diagnostics.tests.dbModule = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    diagnostics.errors.push(`db module: ${error}`);
  }

  // Test 3: Can we load auth options?
  try {
    const { authOptions } = await import('@/lib/auth/auth-options');
    diagnostics.tests.authOptions = {
      success: true,
      hasProviders: !!authOptions.providers,
      providerCount: authOptions.providers?.length || 0,
      hasAdapter: !!authOptions.adapter,
      hasSecret: !!authOptions.secret,
    };
  } catch (error) {
    diagnostics.tests.authOptions = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    };
    diagnostics.errors.push(`auth options: ${error}`);
  }

  // Test 4: Can we initialize Prisma directly?
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient({
      log: ['error'],
    });
    
    // Don't actually connect, just test initialization
    diagnostics.tests.prismaClient = {
      success: true,
      initialized: true,
    };
  } catch (error) {
    diagnostics.tests.prismaClient = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    diagnostics.errors.push(`prisma client: ${error}`);
  }

  // Test 5: NextAuth initialization
  try {
    const NextAuth = (await import('next-auth')).default;
    diagnostics.tests.nextAuth = {
      imported: true,
      type: typeof NextAuth,
    };
  } catch (error) {
    diagnostics.tests.nextAuth = {
      imported: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  const statusCode = diagnostics.errors.length > 0 ? 500 : 200;
  
  return NextResponse.json(diagnostics, { 
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}