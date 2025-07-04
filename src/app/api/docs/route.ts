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
    console.error('Error generating API documentation:', error);
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
  auth: false, // Public endpoint
  rateLimit: {
    requests: 100,
    window: '1h',
  },
  tags: ['Documentation'],
  summary: 'Get API Documentation',
  description: 'Returns the OpenAPI 3.0 specification for the Riscura API',
  responses: {
    '200': {
      description: 'OpenAPI specification',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            description: 'OpenAPI 3.0 specification',
          },
        },
        'application/yaml': {
          schema: {
            type: 'string',
            description: 'OpenAPI 3.0 specification in YAML format',
          },
        },
      },
    },
  },
  parameters: [
    {
      name: 'format',
      in: 'query',
      description: 'Response format (json or yaml)',
      required: false,
      schema: {
        type: 'string',
        enum: ['json', 'yaml'],
        default: 'json',
      },
    },
  ],
});