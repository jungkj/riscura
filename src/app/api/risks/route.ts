import { NextRequest } from 'next/server';
import { withAPI, withValidation, createAPIResponse, createErrorResponse, parsePagination, parseFilters, parseSorting, parseSearch, createPaginationMeta, NotFoundError, ForbiddenError } from '@/lib/api/middleware';
import { createRiskSchema, riskQuerySchema } from '@/lib/api/schemas';
import { getAuthenticatedUser, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { PERMISSIONS } from '@/lib/auth';

// GET /api/risks - List risks with pagination and filtering
export const GET = withAPI(
  withValidation(riskQuerySchema)(async (req: NextRequest, query: any) => {
    const authReq = req as AuthenticatedRequest;
    const user = getAuthenticatedUser(authReq);

    if (!user) {
      throw new ForbiddenError('Authentication required');
    }

    const url = new URL(req.url);
    const searchParams = url.searchParams;

    // Parse pagination
    const { skip, take, page, limit } = parsePagination(searchParams, { maxLimit: 100 });

    // Parse filters
    const filters = parseFilters(searchParams);

    // Parse sorting
    const orderBy = parseSorting(searchParams);

    // Parse search
    const search = parseSearch(searchParams);

    // Build where clause
    let where: any = {
      organizationId: user.organizationId, // Organization isolation
    };

    // Add search functionality
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { mitigationStrategy: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Add filters
    if (query.category) {
      where.category = query.category;
    }
    if (query.severity) {
      where.severity = query.severity;
    }
    if (query.likelihood) {
      where.likelihood = query.likelihood;
    }
    if (query.impact) {
      where.impact = query.impact;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.priority) {
      where.priority = query.priority;
    }
    if (query.ownerId) {
      where.ownerId = query.ownerId;
    }
    if (query.businessUnit) {
      where.businessUnit = { contains: query.businessUnit, mode: 'insensitive' };
    }
    if (query.department) {
      where.department = { contains: query.department, mode: 'insensitive' };
    }
    if (query.tags) {
      const tagList = query.tags.split(',').map((tag: string) => tag.trim());
      where.tags = { hasSome: tagList };
    }

    // Date range filters
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) {
        where.createdAt.gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        where.createdAt.lte = new Date(query.dateTo);
      }
    }

    // Execute queries
    const [risks, total] = await Promise.all([
      db.client.risk.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          controls: {
            select: {
              id: true,
              title: true,
              status: true,
              effectiveness: true,
            },
          },
          riskAssessments: {
            select: {
              id: true,
              assessmentDate: true,
              inherentRisk: true,
              residualRisk: true,
            },
            orderBy: { assessmentDate: 'desc' },
            take: 1,
          },
          _count: {
            select: {
              controls: true,
              riskAssessments: true,
              documents: true,
            },
          },
        },
      }),
      db.client.risk.count({ where }),
    ]);

    // Log activity
    await db.client.activity.create({
      data: {
        type: 'READ',
        entityType: 'RISK',
        entityId: 'list',
        description: `Retrieved ${risks.length} risks`,
        userId: user.id,
        organizationId: user.organizationId,
        metadata: {
          query: query,
          resultCount: risks.length,
          filters: Object.keys(filters),
        },
        isPublic: false,
      },
    });

    return createAPIResponse(risks, {
      pagination: createPaginationMeta(page, limit, total),
    });
  }),
  {
    requiredPermissions: [PERMISSIONS.RISKS_READ],
    rateLimit: { limit: 100, windowMs: 15 * 60 * 1000 },
  }
);

// POST /api/risks - Create new risk
export const POST = withAPI(
  withValidation(createRiskSchema)(async (req: NextRequest, data: any) => {
    const authReq = req as AuthenticatedRequest;
    const user = getAuthenticatedUser(authReq);

    if (!user) {
      throw new ForbiddenError('Authentication required');
    }

    // Validate owner if specified
    if (data.ownerId) {
      const owner = await db.client.user.findFirst({
        where: {
          id: data.ownerId,
          organizationId: user.organizationId,
          isActive: true,
        },
      });

      if (!owner) {
        throw new NotFoundError('Specified owner not found in organization');
      }
    }

    // Calculate risk score based on likelihood and impact
    const riskScore = calculateRiskScore(data.likelihood, data.impact);

    // Create risk
    const risk = await db.client.risk.create({
      data: {
        ...data,
        organizationId: user.organizationId,
        createdById: user.id,
        riskScore,
        inherentRisk: riskScore, // Initial inherent risk
        residualRisk: riskScore, // Initial residual risk (same as inherent until controls applied)
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Log activity
    await db.client.activity.create({
      data: {
        type: 'CREATED',
        entityType: 'RISK',
        entityId: risk.id,
        description: `Created risk: ${risk.title}`,
        userId: user.id,
        organizationId: user.organizationId,
        metadata: {
          riskId: risk.id,
          category: risk.category,
          severity: risk.severity,
          riskScore,
        },
        isPublic: false,
      },
    });

    return createAPIResponse(risk, { statusCode: 201 });
  }),
  {
    requiredPermissions: [PERMISSIONS.RISKS_WRITE],
    rateLimit: { limit: 50, windowMs: 15 * 60 * 1000 },
  }
);

// Helper function to calculate risk score
function calculateRiskScore(likelihood: string, impact: string): number {
  const likelihoodValues = {
    very_low: 1,
    low: 2,
    medium: 3,
    high: 4,
    very_high: 5,
  };

  const impactValues = {
    very_low: 1,
    low: 2,
    medium: 3,
    high: 4,
    very_high: 5,
  };

  return (likelihoodValues[likelihood as keyof typeof likelihoodValues] || 3) *
         (impactValues[impact as keyof typeof impactValues] || 3);
} 