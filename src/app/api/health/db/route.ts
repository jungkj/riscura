import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'DATABASE_URL environment variable is not set',
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      )
    }

    // Mask the database URL for security
    const dbUrl = process.env.DATABASE_URL
    const maskedUrl = dbUrl
      .replace(/:[^:@]+@/, ':****@') // Mask password
      .replace(/\?.*$/, '?...'); // Mask query params

    // Try to connect and run a simple query
    const startTime = Date.now()
    const healthCheck = await db.healthCheck();

    return NextResponse.json({
      status: healthCheck.isHealthy ? 'healthy' : 'unhealthy',
      responseTime: healthCheck.responseTime,
      databaseUrl: maskedUrl,
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      error: healthCheck.error,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
