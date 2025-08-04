import { NextRequest, NextResponse } from 'next/server';
import { checkAuthEnvironment } from '@/lib/auth/env-check';

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    // console.log('[Auth Diagnostic] Running comprehensive authentication diagnostic...');

    const startTime = Date.now();
    const diagnostic = await checkAuthEnvironment();
    const _duration = Date.now() - startTime;

    // Additional runtime checks
    const runtimeChecks = {
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      serverUrl: request.nextUrl.origin,
    };

    // Test NextAuth initialization
    let nextAuthStatus = { working: false, error: null as string | null };
    try {
      const { authOptions } = await import('@/lib/auth/auth-options-fixed');
      nextAuthStatus.working = true;
    } catch (error) {
      nextAuthStatus.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Test fallback auth
    let fallbackAuthStatus = { working: false, error: null as string | null };
    try {
      const { createFallbackAuth } = await import('@/lib/auth/fallback-auth');
      const fallbackOptions = createFallbackAuth();
      fallbackAuthStatus.working =
        !!fallbackOptions.providers && fallbackOptions.providers.length > 0;
    } catch (error) {
      fallbackAuthStatus.error = error instanceof Error ? error.message : 'Unknown error';
    }

    const response = {
      status: diagnostic.isValid ? 'healthy' : 'issues_detected',
      summary: {
        criticalIssues: diagnostic.issues.length,
        warnings: diagnostic.warnings.length,
        googleOAuthWorking: diagnostic.googleOAuth.valid,
        nextAuthWorking: diagnostic.nextAuth.valid,
        databaseWorking: diagnostic.database.reachable,
      },
      details: diagnostic,
      runtime: runtimeChecks,
      components: {
        nextAuth: nextAuthStatus,
        fallbackAuth: fallbackAuthStatus,
      },
      recommendations: generateRecommendations(diagnostic),
    };

    // console.log('[Auth Diagnostic] Completed in', duration, 'ms');
    // console.log('[Auth Diagnostic] Status:', response.status);
    // console.log('[Auth Diagnostic] Critical issues:', response.summary.criticalIssues);

    return NextResponse.json(response, {
      status: diagnostic.isValid ? 200 : 207, // 207 Multi-Status for partial success
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    // console.error('[Auth Diagnostic] Fatal error:', error);

    return NextResponse.json(
      {
        status: 'error',
        message: 'Diagnostic check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}

const generateRecommendations = (diagnostic: any): string[] {
  const recommendations: string[] = [];

  if (!diagnostic.nextAuth.valid) {
    recommendations.push(
      'Fix NextAuth configuration: ensure NEXTAUTH_SECRET is set and at least 32 characters long'
    );
  }

  if (!diagnostic.googleOAuth.valid && diagnostic.googleOAuth.configured) {
    recommendations.push(
      'Check Google OAuth credentials: verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correct'
    );
  }

  if (!diagnostic.database.reachable && diagnostic.database.configured) {
    recommendations.push(
      'Database connection failed: check DATABASE_URL and ensure database server is running'
    );
  }

  if (!diagnostic.googleOAuth.configured) {
    recommendations.push('Consider setting up Google OAuth for better user experience');
  }

  if (diagnostic.issues.length === 0 && diagnostic.warnings.length > 0) {
    recommendations.push('Address warnings to improve authentication security and reliability');
  }

  if (recommendations.length === 0) {
    recommendations.push('Authentication system appears to be properly configured');
  }

  return recommendations;
}
