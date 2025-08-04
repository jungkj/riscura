import { NextRequest, NextResponse } from 'next/server';
import {
  checkDatabaseConnection,
  checkDatabaseConnectionDetailed,
  getDatabaseStatus,
  connectDatabase,
} from '@/lib/db';

/**
 * Database Health Check API Endpoint
 * GET /api/health/database
 *
 * Returns comprehensive database health information including:
 * - Connection status
 * - Performance metrics
 * - Connection pool utilization
 * - Response times
 */
export async function GET(_request: NextRequest) {
  const startTime = Date.now();

  try {
    // Get detailed database status
    const [basicStatus, detailedConnection] = await Promise.all([
      getDatabaseStatus(),
      checkDatabaseConnectionDetailed(),
    ])

    const responseTime = Date.now() - startTime;

    // Determine overall health status
    const overallStatus =
      basicStatus.status === 'healthy' && detailedConnection.isHealthy
        ? 'healthy'
        : basicStatus.status === 'degraded'
          ? 'degraded'
          : 'unhealthy'

    const healthData = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime,
      database: {
        connected: detailedConnection.isHealthy,
        version: detailedConnection.connectionInfo.version,
        responseTime: detailedConnection.responseTime,
        error: detailedConnection.error,
      },
      connections: {
        active: basicStatus.connections.active,
        max: basicStatus.connections.max,
        utilization: Math.round(basicStatus.connections.utilization * 100) / 100,
        status:
          basicStatus.connections.utilization > 90
            ? 'critical'
            : basicStatus.connections.utilization > 70
              ? 'warning'
              : 'normal',
      },
      performance: {
        averageResponseTime: basicStatus.performance.averageResponseTime,
        slowQueries: basicStatus.performance.slowQueries,
        uptime: basicStatus.uptime,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing',
        connectionPooling: {
          maxConnections: process.env.DB_CONNECTION_POOL_MAX || '50',
          minConnections: process.env.DB_CONNECTION_POOL_MIN || '5',
          acquireTimeout: process.env.DB_CONNECTION_POOL_ACQUIRE_TIMEOUT || '60000',
        },
      },
      checks: {
        basicConnection: detailedConnection.isHealthy,
        queryExecution: detailedConnection.isHealthy,
        connectionPool: basicStatus.connections.utilization < 95,
        responseTime: detailedConnection.responseTime < 5000,
      },
      lastHealthCheck: basicStatus.lastHealthCheck,
    }

    // Return appropriate HTTP status based on health
    const httpStatus =
      overallStatus === 'healthy'
        ? 200
        : overallStatus === 'degraded'
          ? 200 // Still operational but with warnings
          : 503; // Service unavailable

    return NextResponse.json(healthData, {
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';

    // console.error('❌ Database health check failed:', error)

    const errorResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime,
      database: {
        connected: false,
        error: errorMessage,
      },
      connections: {
        active: 0,
        max: 0,
        utilization: 0,
        status: 'error',
      },
      performance: {
        averageResponseTime: responseTime,
        slowQueries: 0,
        uptime: 0,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing',
      },
      checks: {
        basicConnection: false,
        queryExecution: false,
        connectionPool: false,
        responseTime: false,
      },
      error: errorMessage,
      lastHealthCheck: new Date(),
    }

    return NextResponse.json(errorResponse, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  }
}

// POST /api/health/database - Comprehensive status check
export async function POST(_request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body;

    switch (action) {
      case 'status':
        try {
          const status = await getDatabaseStatus();
          return NextResponse.json({
            success: true,
            data: status,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          return NextResponse.json(
            {
              success: false,
              error: 'Failed to get database status',
              details: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date().toISOString(),
            },
            { status: 503 }
          );
        }

      case 'reconnect':
        try {
          await connectDatabase();
          const healthCheck = await checkDatabaseConnection();

          return NextResponse.json({
            success: true,
            message: 'Database reconnection successful',
            data: {
              connected: healthCheck.isHealthy,
              responseTime: healthCheck.responseTime,
            },
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          return NextResponse.json(
            {
              success: false,
              error: 'Failed to reconnect to database',
              details: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date().toISOString(),
            },
            { status: 503 }
          );
        }

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action. Supported actions: status, reconnect',
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
    }
  } catch (error) {
    // console.error('❌ Health check POST API error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Database Health Check Options
 * OPTIONS /api/health/database
 */
export async function OPTIONS() {
  return NextResponse.json(
    {
      methods: ['GET'],
      description: 'Database health check endpoint',
      responses: {
        200: 'Database is healthy or degraded but operational',
        503: 'Database is unhealthy or unavailable',
      },
      checks: [
        'Basic database connection',
        'Query execution capability',
        'Connection pool utilization',
        'Response time performance',
      ],
    },
    {
      headers: {
        Allow: 'GET, OPTIONS',
        'Cache-Control': 'public, max-age=3600',
      },
    }
  );
}
