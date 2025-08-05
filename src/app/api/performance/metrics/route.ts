import { NextRequest, NextResponse } from 'next/server';
import { withPerformance } from '@/lib/performance/api-middleware';

// Simple in-memory storage for demo (use Redis in production)
const performanceMetrics = new Map<
  string,
  Array<{
    timestamp: number
    value: number;
    url: string;
    userAgent?: string;
  }>
>();

async function handler(req: NextRequest): Promise<NextResponse> {
  if (req.method === 'POST') {
    // Store performance metrics
    try {
      const body = await req.json()
      const { metric, value, url } = body;

      if (!metric || typeof value !== 'number' || !url) {
        return NextResponse.json(
          { error: 'Missing required fields: metric, value, url' },
          { status: 400 }
        );
      }

      if (!performanceMetrics.has(metric)) {
        performanceMetrics.set(metric, []);
      }

      const metrics = performanceMetrics.get(metric)!;
      metrics.push({
        timestamp: Date.now(),
        value,
        url,
        userAgent: req.headers.get('user-agent') || undefined,
      });

      // Keep only last 1000 entries per metric
      if (metrics.length > 1000) {
        metrics.splice(0, metrics.length - 1000)
      }

      // console.log(`📊 Performance metric recorded: ${metric} = ${value}ms for ${url}`)

      return NextResponse.json({ success: true });
    } catch (error) {
      // console.error('Error storing performance metric:', error)
      return NextResponse.json({ error: 'Failed to store metric' }, { status: 500 });
    }
  }

  if (req.method === 'GET') {
    // Retrieve performance metrics
    try {
      const url = new URL(req.url)
      const metric = url.searchParams.get('metric');
      const limit = parseInt(url.searchParams.get('limit') || '100');

      if (metric) {
        const metrics = performanceMetrics.get(metric) || [];
        const recentMetrics = metrics.slice(-limit);

        const _stats = calculateStats(recentMetrics.map((m) => m.value));

        return NextResponse.json({
          metric,
          count: recentMetrics.length,
          recent: recentMetrics,
          stats,
        });
      }

      // Return all metrics summary
      const summary: { [key: string]: any } = {}

      for (const [metricName, metrics] of performanceMetrics.entries()) {
        const recentMetrics = metrics.slice(-limit);
        const values = recentMetrics.map((m) => m.value);

        summary[metricName] = {
          count: recentMetrics.length,
          stats: calculateStats(values),
          lastRecorded: recentMetrics[recentMetrics.length - 1]?.timestamp,
        }
      }

      return NextResponse.json({
        summary,
        totalMetrics: performanceMetrics.size,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // console.error('Error retrieving performance metrics:', error)
      return NextResponse.json({ error: 'Failed to retrieve metrics' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

const calculateStats = (values: number[]) => {
  if (values.length === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);

  return {
    count: values.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: sum / values.length,
    median: sorted[Math.floor(sorted.length / 2)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)],
  }
}

// Apply performance middleware
export const POST = withPerformance(handler, {
  enableCaching: false,
  enableProfiling: true,
})

export const GET = withPerformance(handler, {
  enableCaching: true,
  cacheTTL: 60, // 1 minute
  enableProfiling: true,
});
