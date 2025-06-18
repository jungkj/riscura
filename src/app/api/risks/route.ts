import { NextRequest } from 'next/server';
import { withAPI, withValidation, createAPIResponse, parsePagination, parseFilters, parseSorting, parseSearch, createPaginationMeta, NotFoundError, ForbiddenError } from '@/lib/api/middleware';
import { createRiskSchema, riskQuerySchema } from '@/lib/api/schemas';
import { getAuthenticatedUser, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { PERMISSIONS } from '@/lib/auth';
import { RiskCategory, RiskStatus, RiskLevel } from '@prisma/client';

// Enum mapping functions with proper validation
const mapRiskCategory = (apiCategory: string): RiskCategory => {
  const mapping: Record<string, RiskCategory> = {
    'operational': 'OPERATIONAL',
    'financial': 'FINANCIAL', 
    'strategic': 'STRATEGIC',
    'compliance': 'COMPLIANCE',
    'technology': 'TECHNOLOGY',
  };
  return mapping[apiCategory.toLowerCase()] || 'OPERATIONAL';
};

const mapRiskStatus = (apiStatus: string): RiskStatus => {
  const mapping: Record<string, RiskStatus> = {
    'identified': 'IDENTIFIED',
    'assessed': 'ASSESSED', 
    'mitigated': 'MITIGATED',
    'closed': 'CLOSED',
  };
  return mapping[apiStatus.toLowerCase()] || 'IDENTIFIED';
};

const calculateRiskScore = (likelihood: number, impact: number): number => {
  return likelihood * impact;
};

const calculateRiskLevel = (riskScore: number): RiskLevel => {
  if (riskScore <= 4) return 'LOW';
  if (riskScore <= 8) return 'MEDIUM';
  if (riskScore <= 12) return 'HIGH';
  return 'CRITICAL';
};

// GET /api/risks - List risks with pagination and filtering
export const GET = withAPI(
  withValidation(riskQuerySchema)(async (req: NextRequest, query) => {
    const authReq = req as AuthenticatedRequest;
    const user = getAuthenticatedUser(authReq);

    if (!user) {
      throw new ForbiddenError('Authentication required');
    }

    const url = new URL(req.url);
    const searchParams = url.searchParams;

    // Parse pagination
    const { skip, take, page, limit } = parsePagination(searchParams, { maxLimit: 100 });

    // Parse sorting
    const orderBy = parseSorting(searchParams, {
      defaultSort: 'createdAt',
      defaultOrder: 'desc',
      allowedFields: ['title', 'riskScore', 'riskLevel', 'status', 'category', 'createdAt', 'updatedAt'],
    });

    // Parse search
    const search = parseSearch(searchParams);

    // Build where clause with organization isolation
    const where: any = {
      organizationId: user.organizationId,
    };

    // Add search functionality
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Add filters from query parameters
    if (query.category) {
      where.category = Array.isArray(query.category) 
        ? { in: query.category.map(mapRiskCategory) }
        : mapRiskCategory(query.category);
    }

    if (query.status) {
      where.status = Array.isArray(query.status)
        ? { in: query.status.map(mapRiskStatus) }
        : mapRiskStatus(query.status);
    }

    if (query.ownerId) {
      where.owner = query.ownerId;
    }

    // Date range filtering
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
    }

    try {
      // Execute queries in parallel
      const [risks, total] = await Promise.all([
        db.client.risk.findMany({
          where,
          skip,
          take,
          orderBy,
          include: {
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            assignedUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            controls: {
              include: {
                control: {
                  select: {
                    id: true,
                    name: true,
                    status: true,
                    effectiveness: true,
                  },
                },
              },
            },
            evidence: {
              select: {
                id: true,
                title: true,
                category: true,
                createdAt: true,
              },
              take: 5, // Limit evidence to avoid payload bloat
            },
            _count: {
              select: {
                controls: true,
                evidence: true,
                comments: true,
                tasks: true,
              },
            },
          },
        }),
        db.client.risk.count({ where }),
      ]);

      // Transform data for API response
      const transformedRisks = risks.map(risk => ({
        id: risk.id,
        title: risk.title,
        description: risk.description,
        category: risk.category,
        likelihood: risk.likelihood,
        impact: risk.impact,
        riskScore: risk.riskScore,
        riskLevel: risk.riskLevel,
        status: risk.status,
        owner: risk.assignedUser,
        dateIdentified: risk.dateIdentified,
        lastAssessed: risk.lastAssessed,
        nextReview: risk.nextReview,
        aiConfidence: risk.aiConfidence,
        createdAt: risk.createdAt,
        updatedAt: risk.updatedAt,
        creator: risk.creator,
        controls: risk.controls.map(rc => rc.control),
        evidence: risk.evidence,
        _count: risk._count,
      }));

      const paginationMeta = createPaginationMeta({
        page,
        limit,
        total,
        itemCount: risks.length,
      });

      return createAPIResponse({
        data: transformedRisks,
                  meta: {
            pagination: paginationMeta,
            total,
            filters: {
              category: query.category,
              status: query.status,
              search,
            },
          },
      });
    } catch (error) {
      console.error('Error fetching risks:', error);
      throw new Error('Failed to fetch risks');
    }
  })
);

// POST /api/risks - Create new risk
export const POST = withAPI(
  withValidation(createRiskSchema)(async (req: NextRequest, data) => {
    const authReq = req as AuthenticatedRequest;
    const user = getAuthenticatedUser(authReq);

    if (!user) {
      throw new ForbiddenError('Authentication required');
    }

    try {
      // Calculate risk score and level
      const riskScore = calculateRiskScore(data.likelihood, data.impact);
      const riskLevel = calculateRiskLevel(riskScore);

      const risk = await db.client.risk.create({
        data: {
          title: data.title,
          description: data.description,
          category: mapRiskCategory(data.category),
          likelihood: data.likelihood,
          impact: data.impact,
          riskScore,
          riskLevel,
          status: data.status ? mapRiskStatus(data.status) : 'IDENTIFIED',
          dateIdentified: data.dateIdentified ? new Date(data.dateIdentified) : new Date(),
          owner: data.owner,
          organizationId: user.organizationId,
          createdBy: user.id,
        },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          assignedUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

              return createAPIResponse({
          data: risk,
          message: 'Risk created successfully',
        });
    } catch (error) {
      console.error('Error creating risk:', error);
      throw new Error('Failed to create risk');
    }
  })
);

// PUT /api/risks - Bulk update risks
export const PUT = withAPI(async (req: NextRequest) => {
  const authReq = req as AuthenticatedRequest;
  const user = getAuthenticatedUser(authReq);

  if (!user) {
    throw new ForbiddenError('Authentication required');
  }

  try {
    const body = await req.json();
    const { ids, updates } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new Error('Risk IDs are required');
    }

    // Verify user has access to all risks
    const existingRisks = await db.client.risk.findMany({
      where: {
        id: { in: ids },
        organizationId: user.organizationId,
      },
    });

    if (existingRisks.length !== ids.length) {
      throw new ForbiddenError('Access denied to some risks');
    }

    // Prepare update data
    const updateData: any = {};
    if (updates.status) updateData.status = mapRiskStatus(updates.status);
    if (updates.assignedUserId) updateData.assignedUserId = updates.assignedUserId;
    if (updates.category) updateData.category = mapRiskCategory(updates.category);
    if (updates.likelihood && updates.impact) {
      updateData.likelihood = updates.likelihood;
      updateData.impact = updates.impact;
      updateData.riskScore = calculateRiskScore(updates.likelihood, updates.impact);
      updateData.riskLevel = calculateRiskLevel(updateData.riskScore);
    }

    // Perform bulk update
    const result = await db.client.risk.updateMany({
      where: {
        id: { in: ids },
        organizationId: user.organizationId,
      },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    return createAPIResponse({
      data: { updated: result.count },
      message: `${result.count} risks updated successfully`,
    });
  } catch (error) {
    console.error('Error bulk updating risks:', error);
    throw new Error('Failed to update risks');
  }
});

// DELETE /api/risks - Bulk delete risks
export const DELETE = withAPI(async (req: NextRequest) => {
  const authReq = req as AuthenticatedRequest;
  const user = getAuthenticatedUser(authReq);

  if (!user) {
    throw new ForbiddenError('Authentication required');
  }

  try {
    const url = new URL(req.url);
    const ids = url.searchParams.get('ids')?.split(',') || [];

    if (ids.length === 0) {
      throw new Error('Risk IDs are required');
    }

    // Verify user has access to all risks
    const existingRisks = await db.client.risk.findMany({
      where: {
        id: { in: ids },
        organizationId: user.organizationId,
      },
    });

    if (existingRisks.length !== ids.length) {
      throw new ForbiddenError('Access denied to some risks');
    }

    // Perform bulk delete
    const result = await db.client.risk.deleteMany({
      where: {
        id: { in: ids },
        organizationId: user.organizationId,
      },
    });

    return createAPIResponse({
      data: { deleted: result.count },
      message: `${result.count} risks deleted successfully`,
    });
  } catch (error) {
    console.error('Error bulk deleting risks:', error);
    throw new Error('Failed to delete risks');
  }
}); 