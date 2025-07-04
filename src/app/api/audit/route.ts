/**
 * Audit Log API Endpoints
 * Provides access to audit logs and reporting functionality
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAPI } from '@/lib/api/middleware';
import { getAuditLogger, AuditQueryOptions } from '@/lib/audit/audit-logger';
import { withDataAudit } from '@/lib/audit/audit-middleware';
import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const AuditQuerySchema = z.object({
  userId: z.string().optional(),
  action: z.string().optional(),
  entity: z.string().optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  status: z.enum(['SUCCESS', 'FAILURE', 'WARNING', 'INFO']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(1000).default(50),
  sortBy: z.string().default('timestamp'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  includeMetadata: z.boolean().default(false),
  complianceFlags: z.array(z.string()).optional(),
});

// ============================================================================
// GET /api/audit - Query Audit Logs
// ============================================================================

async function handleGet(req: NextRequest, context: { user: any; organization: any }) {
  const { searchParams } = new URL(req.url);
  const organizationId = context.organization.id;

  try {
    // Parse query parameters
    const queryData = {
      userId: searchParams.get('userId') || undefined,
      action: searchParams.get('action') || undefined,
      entity: searchParams.get('entity') || undefined,
      severity: searchParams.get('severity') || undefined,
      status: searchParams.get('status') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
      sortBy: searchParams.get('sortBy') || 'timestamp',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      includeMetadata: searchParams.get('includeMetadata') === 'true',
      complianceFlags: searchParams.get('complianceFlags')?.split(','),
    };

    const validatedQuery = AuditQuerySchema.parse(queryData);

    // Convert date strings to Date objects
    const queryOptions: AuditQueryOptions = {
      ...validatedQuery,
      organizationId,
      startDate: validatedQuery.startDate ? new Date(validatedQuery.startDate) : undefined,
      endDate: validatedQuery.endDate ? new Date(validatedQuery.endDate) : undefined,
    };

    // Query audit logs
    const auditLogger = getAuditLogger(context.prisma);
    const result = await auditLogger.query(queryOptions);

    return NextResponse.json({
      success: true,
      data: result.events,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.totalCount,
        pages: result.totalPages,
        hasNextPage: result.hasNextPage,
        hasPreviousPage: result.hasPreviousPage,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers.get('x-request-id'),
        totalEvents: result.totalCount,
        queryOptions: {
          ...queryOptions,
          organizationId: undefined, // Don't expose in response
        },
      },
    });

  } catch (error) {
    console.error('Audit query error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'QUERY_ERROR',
          message: 'Failed to query audit logs',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// EXPORT HANDLERS
// ============================================================================

export const GET = withAPI(
  withDataAudit('AUDIT', 'READ')(handleGet),
  {
    auth: true,
    permissions: ['audit:read'],
    rateLimit: {
      requests: 100,
      window: '1h',
    },
    tags: ['Audit'],
    summary: 'Query Audit Logs',
    description: 'Retrieve audit logs with filtering, pagination, and search capabilities',
    parameters: [
      {
        name: 'userId',
        in: 'query',
        description: 'Filter by user ID',
        schema: { type: 'string' },
      },
      {
        name: 'action',
        in: 'query',
        description: 'Filter by action type',
        schema: { type: 'string' },
      },
      {
        name: 'entity',
        in: 'query',
        description: 'Filter by entity type',
        schema: { type: 'string' },
      },
      {
        name: 'severity',
        in: 'query',
        description: 'Filter by severity level',
        schema: {
          type: 'string',
          enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        },
      },
      {
        name: 'status',
        in: 'query',
        description: 'Filter by operation status',
        schema: {
          type: 'string',
          enum: ['SUCCESS', 'FAILURE', 'WARNING', 'INFO'],
        },
      },
      {
        name: 'startDate',
        in: 'query',
        description: 'Filter events after this date (ISO 8601)',
        schema: {
          type: 'string',
          format: 'date-time',
        },
      },
      {
        name: 'endDate',
        in: 'query',
        description: 'Filter events before this date (ISO 8601)',
        schema: {
          type: 'string',
          format: 'date-time',
        },
      },
      {
        name: 'search',
        in: 'query',
        description: 'Search in resource, path, and error message fields',
        schema: { type: 'string' },
      },
      {
        name: 'page',
        in: 'query',
        description: 'Page number for pagination',
        schema: {
          type: 'integer',
          minimum: 1,
          default: 1,
        },
      },
      {
        name: 'limit',
        in: 'query',
        description: 'Number of events per page',
        schema: {
          type: 'integer',
          minimum: 1,
          maximum: 1000,
          default: 50,
        },
      },
      {
        name: 'sortBy',
        in: 'query',
        description: 'Field to sort by',
        schema: {
          type: 'string',
          default: 'timestamp',
        },
      },
      {
        name: 'sortOrder',
        in: 'query',
        description: 'Sort order',
        schema: {
          type: 'string',
          enum: ['asc', 'desc'],
          default: 'desc',
        },
      },
      {
        name: 'includeMetadata',
        in: 'query',
        description: 'Include metadata and change details',
        schema: {
          type: 'boolean',
          default: false,
        },
      },
      {
        name: 'complianceFlags',
        in: 'query',
        description: 'Filter by compliance flags (comma-separated)',
        schema: { type: 'string' },
      },
    ],
    responses: {
      '200': {
        description: 'Audit logs retrieved successfully',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: true },
                data: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      timestamp: { type: 'string', format: 'date-time' },
                      userId: { type: 'string' },
                      organizationId: { type: 'string' },
                      action: { type: 'string' },
                      entity: { type: 'string' },
                      entityId: { type: 'string' },
                      resource: { type: 'string' },
                      method: { type: 'string' },
                      path: { type: 'string' },
                      severity: {
                        type: 'string',
                        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
                      },
                      status: {
                        type: 'string',
                        enum: ['SUCCESS', 'FAILURE', 'WARNING', 'INFO'],
                      },
                      duration: { type: 'number' },
                      errorMessage: { type: 'string' },
                      metadata: { type: 'object' },
                      complianceFlags: {
                        type: 'array',
                        items: { type: 'string' },
                      },
                    },
                  },
                },
                pagination: {
                  type: 'object',
                  properties: {
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                    total: { type: 'integer' },
                    pages: { type: 'integer' },
                    hasNextPage: { type: 'boolean' },
                    hasPreviousPage: { type: 'boolean' },
                  },
                },
              },
            },
          },
        },
      },
      '400': { $ref: '#/components/responses/ValidationError' },
      '401': { $ref: '#/components/responses/Unauthorized' },
      '403': { $ref: '#/components/responses/Forbidden' },
    },
  }
);