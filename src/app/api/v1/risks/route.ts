import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/database/prisma';
import { ApiResponseFormatter } from '@/lib/api/response-formatter';
import { 
  globalErrorHandler, 
  createAuthError, 
  createForbiddenError,
  createNotFoundError
} from '@/lib/api/error-handler';
import { 
  RiskCreateSchema, 
  RiskQuerySchema, 
  parseAndValidate, 
  validateQueryParams 
} from '@/lib/api/validation-schemas';
import { 
  applyRateLimit, 
  getRateLimiterForEndpoint 
} from '@/lib/api/rate-limiter';
import { 
  getApiVersionFromRequest, 
  ApiVersionMiddleware 
} from '@/lib/api/versioning';

/**
 * GET /api/v1/risks
 * List risks with filtering, pagination, and search
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Rate limiting
    const rateLimitResult = await applyRateLimit(request);
    if (!rateLimitResult.success) {
      throw rateLimitResult.error;
    }

    // 2. Version negotiation
    const version = getApiVersionFromRequest(request);
    const versionNegotiation = await ApiVersionMiddleware.negotiateVersion(request);
    if (!versionNegotiation.success) {
      return versionNegotiation.response!;
    }

    // 3. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createAuthError();
    }

    // 4. Parse and validate query parameters
    const queryValidation = validateQueryParams(RiskQuerySchema, request.nextUrl.searchParams);

    if (!queryValidation.success) {
      return ApiResponseFormatter.validationError(
        queryValidation.errors.map(error => ({
          field: error.path.join('.'),
          message: error.message,
          code: error.code
        })),
        ApiResponseFormatter.createResponseOptions(request)
      );
    }

    const {
      page = 1,
      limit = 10,
      search,
      category,
      sort,
      order,
      likelihood,
      impact,
      riskScore,
      riskLevel,
      owner,
      tags,
      dateRange
    } = queryValidation.data;

    // 5. Build database query
    const where: any = {
      organizationId: (session.user as any).organizationId
    };

    // Apply filters
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (category) {
      where.category = category;
    }

    if (likelihood) {
      where.likelihood = {};
      if (likelihood.min) where.likelihood.gte = likelihood.min;
      if (likelihood.max) where.likelihood.lte = likelihood.max;
    }

    if (impact) {
      where.impact = {};
      if (impact.min) where.impact.gte = impact.min;
      if (impact.max) where.impact.lte = impact.max;
    }

    if (riskLevel) {
      where.riskLevel = riskLevel;
    }

    if (owner) {
      where.owner = owner;
    }

    if (tags && tags.length > 0) {
      where.tags = {
        hasSome: tags
      };
    }

    if (dateRange) {
      where.createdAt = {};
      if (dateRange.start) where.createdAt.gte = new Date(dateRange.start);
      if (dateRange.end) where.createdAt.lte = new Date(dateRange.end);
    }

    // 6. Execute database queries
    const [risks, total] = await Promise.all([
      prisma.risk.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          likelihood: true,
          impact: true,
          riskScore: true,
          riskLevel: true,
          owner: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          assignedUser: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          controls: {
            include: {
              control: {
                select: {
                  id: true,
                  title: true,
                  type: true,
                  effectiveness: true
                }
              }
            }
          },
          _count: {
            select: {
              controls: true,
            }
          }
        },
        orderBy: sort ? { [sort]: order } : { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.risk.count({ where })
    ]);

    // 7. Transform data for response
    const transformedRisks = risks.map(risk => ({
      id: risk.id,
      title: risk.title,
      description: risk.description,
      category: risk.category,
      likelihood: risk.likelihood,
      impact: risk.impact,
      riskScore: risk.likelihood * risk.impact,
      riskLevel: calculateRiskLevel(risk.likelihood * risk.impact),
      status: risk.status,
      owner: risk.assignedUser,
      controls: risk.controls.map(c => c.control),
      controlCount: risk._count.controls,
      createdAt: risk.createdAt,
      updatedAt: risk.updatedAt
    }));

    // 8. Return paginated response with rate limit headers
    const response = ApiResponseFormatter.paginated(
      transformedRisks,
      {
        page,
        limit,
        total
      },
      {
        version,
        ...ApiResponseFormatter.createResponseOptions(request)
      }
    );

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;

  } catch (error) {
    return globalErrorHandler.handleError(error, request, {
      endpoint: 'GET /api/v1/risks',
      action: 'list_risks'
    });
  }
}

/**
 * POST /api/v1/risks
 * Create a new risk
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting
    const rateLimitResult = await applyRateLimit(request, ['standard', 'bulk']);
    if (!rateLimitResult.success) {
      throw rateLimitResult.error;
    }

    // 2. Version negotiation
    const version = getApiVersionFromRequest(request);
    const versionNegotiation = await ApiVersionMiddleware.negotiateVersion(request);
    if (!versionNegotiation.success) {
      return versionNegotiation.response!;
    }

    // 3. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createAuthError();
    }

    // 4. Authorization - check if user can create risks
    if (!['ADMIN', 'RISK_MANAGER'].includes((session.user as any).role)) {
      throw createForbiddenError('Insufficient permissions to create risks');
    }

    // 5. Input validation
    const body = await request.json();
    const validation = parseAndValidate(RiskCreateSchema, body);
    if (!validation.success) {
      return ApiResponseFormatter.validationError(
        validation.errors.map(error => ({
          field: error.path.join('.'),
          message: error.message,
          code: error.code
        })),
        ApiResponseFormatter.createResponseOptions(request)
      );
    }

    const {
      title,
      description,
      category,
      likelihood,
      impact,
      riskOwner,
      linkedControls
    } = validation.data;

    // 6. Business logic validation
    const riskScore = likelihood * impact;
    const riskLevel = calculateRiskLevel(riskScore);

    // Check if risk owner exists if provided
    if (riskOwner) {
      const ownerExists = await prisma.user.findFirst({
        where: {
          id: riskOwner,
          organizationId: (session.user as any).organizationId
        }
      });
      if (!ownerExists) {
        throw createNotFoundError('Risk owner');
      }
    }

    // Validate linked controls if provided  
    if (linkedControls && linkedControls.length > 0) {
      const controlsCount = await prisma.control.count({
        where: {
          id: { in: linkedControls },
          organizationId: (session.user as any).organizationId
        }
      });
      if (controlsCount !== linkedControls.length) {
        return ApiResponseFormatter.error(
          'INVALID_CONTROLS',
          'One or more linked controls do not exist',
          {
            status: 400,
            ...ApiResponseFormatter.createResponseOptions(request)
          }
        );
      }
    }

    // 7. Create risk in database
    const risk = await prisma.risk.create({
      data: {
        title,
        description,
        category,
        likelihood,
        impact,
        riskScore,
        riskLevel,
        owner: riskOwner,

        organizationId: (session.user as any).organizationId,
        createdBy: (session.user as any).id,
      },
      include: {
        assignedUser: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        creator: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    // 8. Link controls if provided
    if (linkedControls && linkedControls.length > 0) {
      await prisma.controlRiskMapping.createMany({
        data: linkedControls.map(controlId => ({
          riskId: risk.id,
          controlId,
        }))
      });
    }

    // 9. Fetch complete risk data
    const completeRisk = await prisma.risk.findUnique({
      where: { id: risk.id },
      include: {
        assignedUser: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        controls: {
          include: {
            control: {
              select: {
                id: true,
                title: true,
                type: true,
                effectiveness: true
              }
            }
          }
        },
        _count: {
          select: {
            controls: true,
          }
        },
        creator: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    // 10. Transform and return response
    const transformedRisk = {
      id: completeRisk!.id,
      title: completeRisk!.title,
      description: completeRisk!.description,
      category: completeRisk!.category,
      likelihood: completeRisk!.likelihood,
      impact: completeRisk!.impact,
      riskScore: completeRisk!.likelihood * completeRisk!.impact,
      riskLevel: calculateRiskLevel(completeRisk!.likelihood * completeRisk!.impact),
      status: completeRisk!.status,
      owner: completeRisk!.assignedUser,
      controls: completeRisk!.controls,
      controlCount: completeRisk!._count.controls,
      createdBy: completeRisk!.creator,
      createdAt: completeRisk!.createdAt,
      updatedAt: completeRisk!.updatedAt
    };

    // 11. Return success response
    const response = ApiResponseFormatter.success(
      transformedRisk,
      {
        version,
        status: 201,
        ...ApiResponseFormatter.createResponseOptions(request)
      }
    );

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;

  } catch (error) {
    return globalErrorHandler.handleError(error, request, {
      endpoint: 'POST /api/v1/risks',
      action: 'create_risk'
    });
  }
}

/**
 * Helper function to calculate risk level from risk score
 */
function calculateRiskLevel(riskScore: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (riskScore <= 8) return 'LOW';
  if (riskScore <= 15) return 'MEDIUM';
  if (riskScore <= 20) return 'HIGH';
  return 'CRITICAL';
} 