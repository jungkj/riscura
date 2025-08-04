/**
 * API Documentation Endpoints
 * Serves OpenAPI specification and documentation interface
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAPI } from '@/lib/api/middleware';
import { apiRegistry } from '@/lib/api/documentation';
import { stringify as yamlStringify } from 'yaml';

// ============================================================================
// GET /api/docs - Serve OpenAPI Specification
// ============================================================================

async function handleGet(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') || 'json';

  try {
    const openApiSpec = apiRegistry.generateOpenAPISpec();

    if (format === 'yaml') {
      // Convert to YAML if requested
      const yaml = yamlStringify(openApiSpec);
      return new NextResponse(yaml, {
        headers: {
          'Content-Type': 'application/yaml',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    return NextResponse.json(openApiSpec, {
      headers: {
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    // console.error('Error generating API documentation:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DOCUMENTATION_ERROR',
          message: 'Failed to generate API documentation',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

// YAML conversion is now handled by the yaml library

// ============================================================================
// EXPORT
// ============================================================================

export const GET = withAPI(handleGet, {
  requireAuth: false, // Public endpoint
  rateLimit: {
    maxRequests: 100,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
});
