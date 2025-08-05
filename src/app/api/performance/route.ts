// Performance Metrics Collection API
import { NextRequest, NextResponse } from 'next/server';
// import { redisClient } from '@/lib/cache/redis-client'

interface PerformanceMetric {
  name: string;
  value: number;
  delta: number;
  id: string;
  timestamp: number;
  url: string;
  userAgent: string;
  connectionType?: string;
  deviceType?: string;
  userId?: string;
  sessionId?: string;
}

interface PerformancePayload {
  metrics: PerformanceMetric[];
  sessionId: string;
  userId?: string;
  timestamp: number;
  url: string;
}

// POST - Collect performance metrics
export async function POST(_request: NextRequest) {
  try {
    const payload: PerformancePayload = await request.json();

    // Validate payload
    if (!payload.metrics || !Array.isArray(payload.metrics)) {
      return NextResponse.json({ error: 'Invalid metrics data' }, { status: 400 });
    }

    // Process each metric
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    const processedMetrics = payload.metrics.map((metric) => ({
      ...metric,
      receivedAt: Date.now(),
      ip,
      country: (request as any).geo?.country || 'unknown',
      city: (request as any).geo?.city || 'unknown',
    }));

    // Store metrics in Redis with TTL
    const cacheKey = `performance:${payload.sessionId}:${Date.now()}`;
    await redisClient.set(
      cacheKey,
      JSON.stringify({
        ...payload,
        metrics: processedMetrics,
      }),
      3600 // 1 hour TTL
    );

    // Store aggregated metrics for reporting
    await storeAggregatedMetrics(processedMetrics);

    // Check for performance alerts
    await checkPerformanceAlerts(processedMetrics);

    return NextResponse.json({
      success: true,
      processed: processedMetrics.length,
      sessionId: payload.sessionId,
    });
  } catch (error) {
    // console.error('Performance metrics collection error:', error)
    return NextResponse.json({ error: 'Failed to process metrics' }, { status: 500 });
  }
}

// GET - Retrieve performance metrics
export async function GET(_request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId');
    const timeframe = searchParams.get('timeframe') || '1h';
    const metricType = searchParams.get('type');

    let metrics: any[] = [];

    if (sessionId) {
      // Get metrics for specific session
      const _pattern = `performance:${sessionId}:*`;
      const keys = await redisClient.smembers(`pattern:${pattern}`);

      for (const key of keys) {
        const data = await redisClient.get(key);
        if (data) {
          metrics.push(JSON.parse(data));
        }
      }
    } else {
      // Get aggregated metrics
      metrics = await getAggregatedMetrics(timeframe, metricType, userId);
    }

    // Calculate summary statistics
    const summary = calculateMetricsSummary(metrics);

    return NextResponse.json({
      metrics,
      summary,
      timeframe,
      total: metrics.length,
    });
  } catch (error) {
    // console.error('Performance metrics retrieval error:', error)
    return NextResponse.json({ error: 'Failed to retrieve metrics' }, { status: 500 });
  }
}

// Store aggregated metrics for reporting
async function storeAggregatedMetrics(metrics: any[]) {
  const now = new Date();
  const hourKey = `metrics:hour:${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
  const dayKey = `metrics:day:${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

  // Aggregate by metric type
  const aggregated: Record<
    string,
    { count: number; sum: number; min: number; max: number; values: number[] }
  > = {};

  metrics.forEach((metric) => {
    if (!aggregated[metric.name]) {
      aggregated[metric.name] = {
        count: 0,
        sum: 0,
        min: Infinity,
        max: -Infinity,
        values: [],
      };
    }

    const agg = aggregated[metric.name];
    agg.count++;
    agg.sum += metric.value;
    agg.min = Math.min(agg.min, metric.value);
    agg.max = Math.max(agg.max, metric.value);
    agg.values.push(metric.value);
  });

  // Calculate percentiles and store
  for (const [metricName, data] of Object.entries(aggregated)) {
    const sortedValues = data.values.sort((a, b) => a - b);
    const p50 = calculatePercentile(sortedValues, 50);
    const p75 = calculatePercentile(sortedValues, 75);
    const p95 = calculatePercentile(sortedValues, 95);
    const p99 = calculatePercentile(sortedValues, 99);

    const summary = {
      count: data.count,
      avg: data.sum / data.count,
      min: data.min,
      max: data.max,
      p50,
      p75,
      p95,
      p99,
      timestamp: now.toISOString(),
    };

    // Store hourly aggregation
    await redisClient.hset(hourKey, metricName, JSON.stringify(summary));
    await redisClient.expire(hourKey, 86400 * 7); // 7 days

    // Store daily aggregation
    await redisClient.hset(dayKey, metricName, JSON.stringify(summary));
    await redisClient.expire(dayKey, 86400 * 30); // 30 days
  }
}

// Check for performance alerts
async function checkPerformanceAlerts(metrics: any[]) {
  const alerts: any[] = [];
  const thresholds = {
    LCP: 2500,
    FID: 100,
    CLS: 0.1,
    FCP: 1800,
    TTFB: 600,
    INP: 200,
  };

  metrics.forEach((metric) => {
    const threshold = thresholds[metric.name as keyof typeof thresholds];
    if (threshold && metric.value > threshold) {
      alerts.push({
        type: 'performance_threshold_exceeded',
        metric: metric.name,
        value: metric.value,
        threshold,
        severity: metric.value > threshold * 1.5 ? 'critical' : 'warning',
        timestamp: metric.timestamp,
        sessionId: metric.sessionId,
        userId: metric.userId,
        url: metric.url,
      });
    }
  });

  // Store alerts
  if (alerts.length > 0) {
    const alertsKey = `alerts:performance:${Date.now()}`;
    await redisClient.set(alertsKey, JSON.stringify(alerts), 86400); // 24 hours

    // You could also send notifications here
    // console.warn(`Performance alerts generated:`, alerts)
  }
}

// Get aggregated metrics
async function getAggregatedMetrics(
  timeframe: string,
  metricType?: string | null,
  userId?: string | null
) {
  const now = new Date();
  const keys: string[] = [];

  // Determine which keys to query based on timeframe
  switch (timeframe) {
    case '1h':
      keys.push(
        `metrics:hour:${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`
      );
      break;
    case '24h':
      for (let i = 0; i < 24; i++) {
        const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
        keys.push(
          `metrics:hour:${hour.getFullYear()}-${hour.getMonth()}-${hour.getDate()}-${hour.getHours()}`
        );
      }
      break;
    case '7d':
      for (let i = 0; i < 7; i++) {
        const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        keys.push(`metrics:day:${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`);
      }
      break;
    default:
      keys.push(
        `metrics:hour:${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`
      );
  }

  const metrics: any[] = [];

  for (const key of keys) {
    const data = await redisClient.hgetall(key);
    for (const [metric, value] of Object.entries(data)) {
      if (!metricType || metric === metricType) {
        try {
          metrics.push({
            name: metric,
            ...JSON.parse(value),
            key,
          });
        } catch (error) {
          // console.error('Failed to parse metric data:', error)
        }
      }
    }
  }

  return metrics;
}

// Calculate metrics summary
const calculateMetricsSummary = (metrics: any[]) => {
  if (metrics.length === 0) {
    return {
      totalSessions: 0,
      avgLoadTime: 0,
      performanceScore: 0,
      alertsCount: 0,
    };
  }

  const sessions = new Set(metrics.map((m) => m.sessionId)).size;
  const loadTimes = metrics.filter((m) => m.name === 'NAVIGATION_LOADTIME').map((m) => m.value);

  const avgLoadTime =
    loadTimes.length > 0 ? loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length : 0;

  // Calculate simplified performance score
  const lcpMetrics = metrics.filter((m) => m.name === 'LCP');
  const fidMetrics = metrics.filter((m) => m.name === 'FID');
  const clsMetrics = metrics.filter((m) => m.name === 'CLS');

  const avgLCP =
    lcpMetrics.length > 0 ? lcpMetrics.reduce((sum, m) => sum + m.value, 0) / lcpMetrics.length : 0;

  const avgFID =
    fidMetrics.length > 0 ? fidMetrics.reduce((sum, m) => sum + m.value, 0) / fidMetrics.length : 0;

  const avgCLS =
    clsMetrics.length > 0 ? clsMetrics.reduce((sum, m) => sum + m.value, 0) / clsMetrics.length : 0;

  // Simple performance scoring
  let performanceScore = 100;
  if (avgLCP > 2500) performanceScore -= 20;
  if (avgFID > 100) performanceScore -= 20;
  if (avgCLS > 0.1) performanceScore -= 20;
  if (avgLoadTime > 3000) performanceScore -= 20;

  return {
    totalSessions: sessions,
    avgLoadTime: Math.round(avgLoadTime),
    performanceScore: Math.max(0, performanceScore),
    avgLCP: Math.round(avgLCP),
    avgFID: Math.round(avgFID),
    avgCLS: parseFloat(avgCLS.toFixed(3)),
    metricsCount: metrics.length,
  };
};

// Calculate percentile
const calculatePercentile = (sortedValues: number[], percentile: number): number => {
  if (sortedValues.length === 0) return 0;

  const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, index)];
};

// Health check endpoint
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
