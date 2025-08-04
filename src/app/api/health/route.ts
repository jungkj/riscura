import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cacheService } from '@/lib/performance/cache';
import { databaseOptimizer } from '@/lib/performance/database';
import { compressionService } from '@/lib/performance/compression';

interface HealthCheckResult {
  status: 'ok' | 'warning' | 'error';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: ServiceStatus;
    cache?: ServiceStatus;
    storage?: ServiceStatus;
    ai?: ServiceStatus;
    billing?: ServiceStatus;
  };
  system: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu?: {
      usage: number;
    };
  };
}

interface ServiceStatus {
  status: 'ok' | 'warning' | 'error';
  message?: string;
  responseTime?: number;
  details?: any;
}

// Main health check endpoint
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    const dbHealth = await checkDatabase();

    // Calculate system metrics
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    // Determine overall health status
    const services = {
      database: dbHealth,
    };

    const hasError = Object.values(services).some((s) => s.status === 'error');
    const hasWarning = Object.values(services).some((s) => s.status === 'warning');

    const overallStatus = hasError ? 'error' : hasWarning ? 'warning' : 'ok';

    const healthResponse: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: Math.floor(uptime),
      services: {
        database: dbHealth,
      },
      system: {
        memory: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
        },
      },
    };

    // Add optional services if configured
    if (process.env.AWS_S3_BUCKET) {
      healthResponse.services.storage = await checkStorage();
    }

    if (process.env.OPENAI_API_KEY) {
      healthResponse.services.ai = await checkAI();
    }

    if (process.env.STRIPE_SECRET_KEY) {
      healthResponse.services.billing = await checkBilling();
    }

    const statusCode = overallStatus === 'error' ? 503 : 200;

    return NextResponse.json(healthResponse, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': `${Date.now() - startTime}ms`,
      },
    });
  } catch (error) {
    // console.error('Health check failed:', error);

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime(),
        error: error instanceof Error ? error.message : 'Unknown error',
        services: {},
        system: {
          memory: {
            used: 0,
            total: 0,
            percentage: 0,
          },
        },
      },
      { status: 503 }
    );
  }
}

// Database health check
async function checkDatabase(): Promise<ServiceStatus> {
  const start = Date.now();

  try {
    // Test database connection with a simple query
    await db.client.$queryRaw`SELECT 1 as health_check`;

    return {
      status: 'ok',
      message: 'Database is healthy',
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Database check failed',
      responseTime: Date.now() - start,
    };
  }
}

// Storage health check (S3)
async function checkStorage(): Promise<ServiceStatus> {
  const start = Date.now();

  try {
    // For now, just check if configured
    if (!process.env.AWS_S3_BUCKET) {
      return {
        status: 'warning',
        message: 'Storage not configured',
        responseTime: Date.now() - start,
      };
    }

    return {
      status: 'ok',
      message: 'Storage is configured',
      responseTime: Date.now() - start,
      details: {
        bucket: process.env.AWS_S3_BUCKET,
        region: process.env.AWS_REGION,
      },
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Storage check failed',
      responseTime: Date.now() - start,
    };
  }
}

// AI service health check
async function checkAI(): Promise<ServiceStatus> {
  const start = Date.now();

  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        status: 'warning',
        message: 'AI service not configured',
        responseTime: Date.now() - start,
      };
    }

    return {
      status: 'ok',
      message: 'AI service is configured',
      responseTime: Date.now() - start,
      details: {
        model: process.env.AI_MODEL || 'gpt-4',
        maxTokens: process.env.AI_MAX_TOKENS || '2000',
      },
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'AI service check failed',
      responseTime: Date.now() - start,
    };
  }
}

// Billing service health check
async function checkBilling(): Promise<ServiceStatus> {
  const start = Date.now();

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return {
        status: 'warning',
        message: 'Billing service not configured',
        responseTime: Date.now() - start,
      };
    }

    return {
      status: 'ok',
      message: 'Billing service is configured',
      responseTime: Date.now() - start,
      details: {
        provider: 'Stripe',
        webhookConfigured: !!process.env.STRIPE_WEBHOOK_SECRET,
      },
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Billing service check failed',
      responseTime: Date.now() - start,
    };
  }
}

// Readiness probe - checks if app is ready to serve traffic
export async function HEAD() {
  try {
    // Quick check for essential services
    await db.client.$queryRaw`SELECT 1`;
    return new Response(null, { status: 200 });
  } catch {
    return new Response(null, { status: 503 });
  }
}
