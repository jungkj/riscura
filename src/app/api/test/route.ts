import { NextRequest, NextResponse } from 'next/server';
import { withCSRFProtection } from '@/lib/security/csrf';

/**
 * Test endpoint for security validation
 * This endpoint helps test CSRF protection and rate limiting
 */

async function handler(_request: NextRequest) {
  const method = request.method;

  try {
    // Handle different HTTP methods
    switch (method) {
      case 'GET':
        return NextResponse.json({
          message: 'Security test endpoint working',
          timestamp: new Date().toISOString(),
          method: 'GET',
          security: {
            rateLimitingActive: true,
            securityHeadersActive: true,
            csrfProtectionActive: false, // Not required for GET
          },
        });

      case 'POST':
        const body = await request.json().catch(() => ({}));

        return NextResponse.json({
          message: 'POST request successful - CSRF protection passed',
          timestamp: new Date().toISOString(),
          method: 'POST',
          body,
          security: {
            rateLimitingActive: true,
            securityHeadersActive: true,
            csrfProtectionActive: true,
          },
        });

      case 'PUT':
      case 'DELETE':
      case 'PATCH':
        return NextResponse.json({
          message: `${method} request successful - security checks passed`,
          timestamp: new Date().toISOString(),
          method,
          security: {
            rateLimitingActive: true,
            securityHeadersActive: true,
            csrfProtectionActive: true,
          },
        });

      default:
        return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
    }
  } catch (error) {
    // console.error('Test endpoint error:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Apply CSRF protection to POST, PUT, DELETE, PATCH methods
export const GET = handler;
export const POST = withCSRFProtection(handler);
export const PUT = withCSRFProtection(handler);
export const DELETE = withCSRFProtection(handler);
export const PATCH = withCSRFProtection(handler);
