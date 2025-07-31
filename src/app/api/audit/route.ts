/**
 * Audit Log API Endpoints
 * Provides access to audit logs and reporting functionality
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAPI } from '@/lib/api/middleware';
import {
  getAuditLogger,
  AuditQueryOptions,
  AuditAction,
  AuditEntity,
} from '@/lib/audit/audit-logger';
import { z } from 'zod';
import { db } from '@/lib/db';

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

async function handleGet(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const user = (req as any).user;

  if (!user || !user.organizationId) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Organization context required',
        },
      },
      { status: 403 }
    );
  }

  const organizationId = user.organizationId;

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

    // Convert date strings to Date objects and ensure action/entity are typed correctly
    const queryOptions: AuditQueryOptions = {
      ...validatedQuery,
      organizationId,
      startDate: validatedQuery.startDate ? new Date(validatedQuery.startDate) : undefined,
      endDate: validatedQuery.endDate ? new Date(validatedQuery.endDate) : undefined,
      action: validatedQuery.action as AuditAction | undefined,
      entity: validatedQuery.entity as AuditEntity | undefined,
    };

    // Query audit logs
    const auditLogger = getAuditLogger(db.client);
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

export const GET = withAPI(handleGet, {
  requireAuth: true,
  requiredPermissions: ['audit:read'],
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  },
  validateQuery: AuditQuerySchema,
});
