import { NextRequest, NextResponse } from 'next/server';
import { performanceConfig } from '@/config/performance';

export async function GET(request: NextRequest) {
  try {
    if (!performanceConfig.monitoring.enabled) {
      return NextResponse.json({ error: 'Performance monitoring disabled' }, { status: 404 });
    }

    // Collect server-side performance metrics
    const metrics = {
      timestamp: new Date().toISOString(),
      server: {
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        cpuUsage: process.cpuUsage(),
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      config: {
        nodeEnv: process.env.NODE_ENV,
        monitoring: performanceConfig.monitoring,
        alerts: performanceConfig.alerts,
      }
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error collecting performance metrics:', error);
    return NextResponse.json(
      { error: 'Failed to collect metrics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!performanceConfig.monitoring.enabled) {
      return NextResponse.json({ error: 'Performance monitoring disabled' }, { status: 404 });
    }

    const body = await request.json();
    const { type, metrics, timestamp } = body;

    // Log client-side metrics
    console.log('Client Performance Metrics:', {
      type,
      metrics,
      timestamp,
      userAgent: request.headers.get('user-agent'),
      ip: request.ip || request.headers.get('x-forwarded-for'),
    });

    // Here you would typically store metrics in a database or send to monitoring service
    // For now, we'll just acknowledge receipt
    
    return NextResponse.json({ 
      success: true, 
      message: 'Metrics received',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing performance metrics:', error);
    return NextResponse.json(
      { error: 'Failed to process metrics' },
      { status: 500 }
    );
  }
} 