import { NextRequest, NextResponse } from 'next/server';
import { databaseConnection, DATABASE_CONFIG } from '@/lib/database/connection';
import { env } from '@/config/env';

export async function GET(request: NextRequest) {
  try {
    // Get detailed health status
    const healthStatus = await databaseConnection.healthCheck();
    
    // Additional database metrics
    const client = databaseConnection.getClient();
    
    // Test query performance
    const queryStartTime = Date.now();
    await client.$queryRaw`SELECT version()`;
    const queryTime = Date.now() - queryStartTime;
    
    // Get connection pool configuration
    const poolConfig = {
      max: DATABASE_CONFIG.pool.max,
      min: DATABASE_CONFIG.pool.min,
      idleTimeout: DATABASE_CONFIG.pool.idle,
      acquireTimeout: DATABASE_CONFIG.pool.acquire,
      evictTimeout: DATABASE_CONFIG.pool.evict,
    };
    
    // Get retry configuration
    const retryConfig = {
      attempts: DATABASE_CONFIG.retry.attempts,
      delay: DATABASE_CONFIG.retry.delay,
      backoff: DATABASE_CONFIG.retry.backoff,
    };
    
    // Determine overall health status
    const isHealthy = healthStatus.isHealthy && queryTime < 5000; // 5 second threshold
    
    const response = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: healthStatus.isHealthy,
        connectionPool: {
          active: healthStatus.activeConnections,
          idle: healthStatus.idleConnections,
          total: healthStatus.totalConnections,
          max: healthStatus.maxConnections,
          pending: healthStatus.pendingRequests,
        },
        performance: {
          avgQueryTime: Math.round(healthStatus.avgQueryTime),
          lastQueryTime: queryTime,
          uptime: healthStatus.uptime,
          lastHealthCheck: healthStatus.lastHealthCheck,
        },
        configuration: {
          pool: poolConfig,
          retry: retryConfig,
          environment: env.NODE_ENV,
        },
        errors: healthStatus.errors || [],
      },
      checks: [
        {
          name: 'database_connection',
          status: healthStatus.isHealthy ? 'pass' : 'fail',
          time: healthStatus.lastHealthCheck,
        },
        {
          name: 'query_performance',
          status: queryTime < 5000 ? 'pass' : 'warn',
          time: new Date(),
          details: { queryTime: `${queryTime}ms`, threshold: '5000ms' },
        },
        {
          name: 'connection_pool',
          status: healthStatus.activeConnections < healthStatus.maxConnections ? 'pass' : 'warn',
          time: new Date(),
          details: { 
            utilization: `${Math.round((healthStatus.activeConnections / healthStatus.maxConnections) * 100)}%` 
          },
        },
      ],
    };
    
    return NextResponse.json(response, { 
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
    
  } catch (error) {
    console.error('Database health check failed:', error);
    
    const errorResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        error: error instanceof Error ? error.message : String(error),
        configuration: {
          environment: env.NODE_ENV,
        },
      },
      checks: [
        {
          name: 'database_connection',
          status: 'fail',
          time: new Date(),
          error: error instanceof Error ? error.message : String(error),
        },
      ],
    };
    
    return NextResponse.json(errorResponse, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  }
}

// Also support HEAD requests for basic health checks
export async function HEAD(request: NextRequest) {
  try {
    const healthStatus = await databaseConnection.healthCheck();
    return new NextResponse(null, { 
      status: healthStatus.isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
} 