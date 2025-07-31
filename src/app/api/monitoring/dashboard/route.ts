/**
 * Monitoring Dashboard API
 * Provides real-time performance and business metrics for monitoring dashboards
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPerformanceMonitor } from '@/lib/monitoring/performance';
import { getAnalytics } from '@/lib/monitoring/analytics';
import { getAlertingSystem } from '@/lib/monitoring/alerting';
import * as Sentry from '@sentry/nextjs';

// Dashboard metrics aggregation
interface DashboardMetrics {
  timestamp: number;
  performance: {
    webVitals: {
      lcp: number | null;
      fid: number | null;
      cls: number | null;
      fcp: number | null;
      ttfb: number | null;
    };
    apiMetrics: {
      averageResponseTime: number;
      errorRate: number;
      requestsPerMinute: number;
      slowestEndpoints: Array<{
        endpoint: string;
        responseTime: number;
      }>;
    };
    systemMetrics: {
      memoryUsage: number;
      cpuUsage: number;
      activeConnections: number;
    };
  };
  business: {
    kpis: {
      dailyActiveUsers: number;
      newRegistrations: number;
      rcsaAssessmentsCreated: number;
      documentsProcessed: number;
      reportsGenerated: number;
      documentProcessingSuccessRate: number;
    };
    trends: {
      userGrowthRate: number;
      featureAdoptionRate: number;
      customerSatisfactionScore: number;
    };
  };
  alerts: {
    active: number;
    critical: number;
    warning: number;
    recentAlerts: Array<{
      id: string;
      name: string;
      severity: string;
      timestamp: number;
    }>;
  };
  health: {
    overall: 'healthy' | 'degraded' | 'unhealthy';
    database: 'healthy' | 'degraded' | 'unhealthy';
    redis: 'healthy' | 'degraded' | 'unhealthy';
    externalServices: 'healthy' | 'degraded' | 'unhealthy';
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const timeRange: string = searchParams.get('timeRange') ?? '1h';
    const includeHistorical = searchParams.get('historical') === 'true';

    // Collect current metrics
    const performanceData = getPerformanceMonitor().getPerformanceSnapshot();
    const businessKpis = getAnalytics().getKPIs();
    const activeAlerts = getAlertingSystem().getActiveAlerts();

    // Get system health
    const health = await getSystemHealth();

    // Aggregate dashboard metrics
    const dashboardMetrics: DashboardMetrics = {
      timestamp: Date.now(),
      performance: {
        webVitals: {
          lcp: performanceData.webVitals.LCP?.value || null,
          fid: performanceData.webVitals.FID?.value || null,
          cls: performanceData.webVitals.CLS?.value || null,
          fcp: performanceData.webVitals.FCP?.value || null,
          ttfb: performanceData.webVitals.TTFB?.value || null,
        },
        apiMetrics: await getApiMetrics(timeRange),
        systemMetrics: await getSystemMetrics(),
      },
      business: {
        kpis: {
          dailyActiveUsers: businessKpis.dailyActiveUsers || 0,
          newRegistrations: businessKpis.newUserRegistrations || 0,
          rcsaAssessmentsCreated: businessKpis.rcsaAssessmentsCreated || 0,
          documentsProcessed: businessKpis.documentsProcessed || 0,
          reportsGenerated: businessKpis.reportsGenerated || 0,
          documentProcessingSuccessRate: businessKpis.documentProcessingSuccessRate || 100,
        },
        trends: await getBusinessTrends(timeRange),
      },
      alerts: {
        active: activeAlerts.filter((a) => !a.resolved).length,
        critical: activeAlerts.filter((a) => !a.resolved && a.severity === 'critical').length,
        warning: activeAlerts.filter((a) => !a.resolved && a.severity === 'warning').length,
        recentAlerts: activeAlerts
          .filter((a) => !a.resolved)
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 5)
          .map((alert) => ({
            id: alert.id,
            name: alert.name,
            severity: alert.severity,
            timestamp: alert.timestamp,
          })),
      },
      health,
    };

    // Include historical data if requested
    let historicalData: any = null;
    if (includeHistorical) {
      historicalData = await getHistoricalMetrics(timeRange);
    }

    const response = {
      success: true,
      data: dashboardMetrics,
      historical: historicalData,
      metadata: {
        timeRange,
        lastUpdated: Date.now(),
        refreshInterval: 30000, // 30 seconds
      },
    };

    // Add caching headers
    const headers = new Headers();
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');

    return NextResponse.json(response, { headers });
  } catch (error) {
    console.error('Dashboard API error:', error);

    Sentry.captureException(error, {
      tags: {
        endpoint: '/api/monitoring/dashboard',
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve dashboard metrics',
        details:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * Get API performance metrics
 */
async function getApiMetrics(timeRange: string) {
  try {
    // This would typically query your metrics database/service
    // For now, return mock data based on performance monitoring
    const performanceData = getPerformanceMonitor().getPerformanceSnapshot();

    const apiMetrics = Object.entries(performanceData.apiMetrics).map(([endpoint, metrics]) => ({
      endpoint,
      responseTime: metrics.responseTime,
      errorRate: metrics.errorRate,
    }));

    const averageResponseTime =
      apiMetrics.length > 0
        ? apiMetrics.reduce((sum, metric) => sum + metric.responseTime, 0) / apiMetrics.length
        : 0;

    const averageErrorRate =
      apiMetrics.length > 0
        ? apiMetrics.reduce((sum, metric) => sum + metric.errorRate, 0) / apiMetrics.length
        : 0;

    return {
      averageResponseTime: Math.round(averageResponseTime),
      errorRate: Math.round(averageErrorRate * 100) / 100,
      requestsPerMinute: await getRequestsPerMinute(timeRange),
      slowestEndpoints: apiMetrics
        .sort((a, b) => b.responseTime - a.responseTime)
        .slice(0, 5)
        .map((metric) => ({
          endpoint: metric.endpoint,
          responseTime: Math.round(metric.responseTime),
        })),
    };
  } catch (error) {
    console.error('Error getting API metrics:', error);
    return {
      averageResponseTime: 0,
      errorRate: 0,
      requestsPerMinute: 0,
      slowestEndpoints: [],
    };
  }
}

/**
 * Get system performance metrics
 */
async function getSystemMetrics() {
  try {
    // Get memory usage
    const memoryUsage = process.memoryUsage();
    const memoryUsagePercentage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

    // Get CPU usage (simplified)
    const cpuUsage = process.cpuUsage();
    const cpuUsagePercentage = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to percentage

    // Active connections (mock data - would be from actual monitoring)
    const activeConnections = Math.floor(Math.random() * 100) + 50;

    return {
      memoryUsage: Math.round(memoryUsagePercentage),
      cpuUsage: Math.round(cpuUsagePercentage),
      activeConnections,
    };
  } catch (error) {
    console.error('Error getting system metrics:', error);
    return {
      memoryUsage: 0,
      cpuUsage: 0,
      activeConnections: 0,
    };
  }
}

/**
 * Get business trends
 */
async function getBusinessTrends(timeRange: string) {
  try {
    // This would typically calculate trends from historical data
    // For now, return mock trend data
    return {
      userGrowthRate: 15.2, // 15.2% growth
      featureAdoptionRate: 68.5, // 68.5% adoption
      customerSatisfactionScore: 4.2, // 4.2/5 rating
    };
  } catch (error) {
    console.error('Error getting business trends:', error);
    return {
      userGrowthRate: 0,
      featureAdoptionRate: 0,
      customerSatisfactionScore: 0,
    };
  }
}

/**
 * Get system health status
 */
async function getSystemHealth() {
  const health: {
    overall: 'healthy' | 'degraded' | 'unhealthy';
    database: 'healthy' | 'degraded' | 'unhealthy';
    redis: 'healthy' | 'degraded' | 'unhealthy';
    externalServices: 'healthy' | 'degraded' | 'unhealthy';
  } = {
    overall: 'healthy',
    database: 'healthy',
    redis: 'healthy',
    externalServices: 'healthy',
  };

  try {
    // Check database health
    const dbResponse = await fetch('http://localhost:3000/api/health/database');
    health.database = dbResponse.ok ? 'healthy' : 'unhealthy';
  } catch {
    health.database = 'unhealthy';
  }

  try {
    // Check Redis health
    const redisResponse = await fetch('http://localhost:3000/api/health/redis');
    health.redis = redisResponse.ok ? 'healthy' : 'unhealthy';
  } catch {
    health.redis = 'unhealthy';
  }

  try {
    // Check external services (OpenAI, etc.)
    const servicesResponse = await fetch('http://localhost:3000/api/health/external');
    health.externalServices = servicesResponse.ok ? 'healthy' : 'degraded';
  } catch {
    health.externalServices = 'degraded';
  }

  // Determine overall health
  const unhealthyServices = Object.values(health).filter((status) => status === 'unhealthy').length;
  const degradedServices = Object.values(health).filter((status) => status === 'degraded').length;

  if (unhealthyServices > 0) {
    health.overall = 'unhealthy';
  } else if (degradedServices > 0) {
    health.overall = 'degraded';
  }

  return health;
}

/**
 * Get requests per minute
 */
async function getRequestsPerMinute(timeRange: string): Promise<number> {
  try {
    // This would typically query your access logs or metrics service
    // For now, return a mock value
    return Math.floor(Math.random() * 1000) + 500;
  } catch {
    return 0;
  }
}

/**
 * Get historical metrics for charting
 */
async function getHistoricalMetrics(timeRange: string) {
  try {
    const now = Date.now();
    const intervals = getTimeIntervals(timeRange);

    // Generate mock historical data
    const historical = {
      performance: {
        responseTime: intervals.map((time, index) => ({
          timestamp: time,
          value: 200 + Math.sin(index / 10) * 100 + Math.random() * 50,
        })),
        errorRate: intervals.map((time, index) => ({
          timestamp: time,
          value: Math.max(0, 1 + Math.sin(index / 5) * 0.5 + Math.random() * 0.5),
        })),
        memoryUsage: intervals.map((time, index) => ({
          timestamp: time,
          value: 60 + Math.sin(index / 8) * 20 + Math.random() * 10,
        })),
      },
      business: {
        activeUsers: intervals.map((time, index) => ({
          timestamp: time,
          value: 100 + Math.sin(index / 12) * 50 + Math.random() * 20,
        })),
        newRegistrations: intervals.map((time, index) => ({
          timestamp: time,
          value: Math.floor(Math.random() * 10) + 1,
        })),
        rcsaCreated: intervals.map((time, index) => ({
          timestamp: time,
          value: Math.floor(Math.random() * 5) + 1,
        })),
      },
    };

    return historical;
  } catch (error) {
    console.error('Error getting historical metrics:', error);
    return null;
  }
}

/**
 * Generate time intervals for historical data
 */
function getTimeIntervals(timeRange: string): number[] {
  const now = Date.now();
  const intervals: number[] = [];

  let duration: number;
  let step: number;

  switch (timeRange) {
    case '1h':
      duration = 60 * 60 * 1000; // 1 hour
      step = 60 * 1000; // 1 minute
      break;
    case '6h':
      duration = 6 * 60 * 60 * 1000; // 6 hours
      step = 5 * 60 * 1000; // 5 minutes
      break;
    case '24h':
      duration = 24 * 60 * 60 * 1000; // 24 hours
      step = 15 * 60 * 1000; // 15 minutes
      break;
    case '7d':
      duration = 7 * 24 * 60 * 60 * 1000; // 7 days
      step = 60 * 60 * 1000; // 1 hour
      break;
    default:
      duration = 60 * 60 * 1000; // Default 1 hour
      step = 60 * 1000; // 1 minute
  }

  for (let time = now - duration; time <= now; time += step) {
    intervals.push(time);
  }

  return intervals;
}
