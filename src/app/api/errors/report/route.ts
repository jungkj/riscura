import { NextRequest, NextResponse } from 'next/server';

interface ErrorReport {
  errorId: string;
  message?: string;
  stack?: string;
  componentStack?: string;
  userAgent: string;
  timestamp: string;
  url: string;
  level: 'page' | 'component' | 'critical';
  retryCount: number;
}

export async function POST(_request: NextRequest) {
  try {
    const errorReport: ErrorReport = await request.json();

    // In a production environment, you would typically:
    // 1. Log to a service like Sentry, LogRocket, or Datadog
    // 2. Store in a database
    // 3. Send alerts for critical errors

    // For now, we'll just log to console and return success
    // console.error('Error Report:', {
      errorId: errorReport.errorId,
      level: errorReport.level,
      message: errorReport.message,
      url: errorReport.url,
      timestamp: errorReport.timestamp,
      userAgent: errorReport.userAgent,
      retryCount: errorReport.retryCount,
    })

    // If it's a critical error, you might want to send additional alerts
    if (errorReport.level === 'critical') {
      // console.error('CRITICAL ERROR DETECTED:', errorReport)
    }

    return NextResponse.json({
      success: true,
      message: 'Error report received',
    });
  } catch (error) {
    // console.error('Failed to process error report:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process error report',
      },
      { status: 500 }
    );
  }
}
