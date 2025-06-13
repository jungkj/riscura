import { NextRequest } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { 
  withApiMiddleware,
  riskManagerApiMiddleware,
  ApiRequestContext 
} from '@/lib/api/middleware';
import { 
  RiskCreateSchema, 
  RiskQuerySchema 
} from '@/lib/api/validation-schemas';

/**
 * GET /api/v1/risks/simplified
 * List risks with automatic handling of rate limiting, auth, validation, etc.
 */
export const GET = withApiMiddleware({
  requireAuth: true,
  allowedRoles: ['ADMIN', 'RISK_MANAGER', 'AUDITOR'],
  querySchema: RiskQuerySchema,
  rateLimiters: ['standard']
})(async (context: ApiRequestContext, validatedData: any) => {
  const { user } = context;
  const { 
    page, 
    limit, 
    search, 
    category, 
    likelihood,
    impact,
    riskLevel 
  } = validatedData.query;

  // Build database query
  const where: any = {
    organizationId: user.organizationId
  };

  // Apply search filter
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  // Apply other filters
  if (category) where.category = category;
  if (riskLevel) where.riskLevel = riskLevel;
  
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

  // Execute database queries
  const [risks, total] = await Promise.all([
    prisma.risk.findMany({
      where,
      include: {
        riskOwner: {
          select: { id: true, name: true, email: true }
        },
        controls: {
          select: { 
            id: true, 
            title: true, 
            type: true, 
            effectiveness: true 
          }
        },
        _count: {
          select: { controls: true, assessments: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.risk.count({ where })
  ]);

  // Transform data
  const transformedRisks = risks.map(risk => ({
    id: risk.id,
    title: risk.title,
    description: risk.description,
    category: risk.category,
    likelihood: risk.likelihood,
    impact: risk.impact,
    riskScore: risk.likelihood * risk.impact,
    riskLevel: risk.riskLevel,
    tags: risk.tags,
    owner: risk.riskOwner,
    controls: risk.controls,
    controlCount: risk._count.controls,
    assessmentCount: risk._count.assessments,
    createdAt: risk.createdAt,
    updatedAt: risk.updatedAt
  }));

  // Return paginated response (middleware handles formatting)
  return {
    data: transformedRisks,
    pagination: { page, limit, total }
  };
});

/**
 * POST /api/v1/risks/simplified
 * Create a new risk with automatic validation and error handling
 */
export const POST = withApiMiddleware({
  requireAuth: true,
  allowedRoles: ['ADMIN', 'RISK_MANAGER'],
  bodySchema: RiskCreateSchema,
  rateLimiters: ['standard', 'bulk']
})(async (context: ApiRequestContext, validatedData: any) => {
  const { user } = context;
  const {
    title,
    description,
    category,
    likelihood,
    impact,
    riskOwner,
    tags,
    dueDate,
    linkedControls,
    metadata
  } = validatedData.body;

  // Calculate risk metrics
  const riskScore = likelihood * impact;
  const riskLevel = calculateRiskLevel(riskScore);

  // Validate risk owner exists if provided
  if (riskOwner) {
    const ownerExists = await prisma.user.findFirst({
      where: {
        id: riskOwner,
        organizationId: user.organizationId
      }
    });
    if (!ownerExists) {
      throw new Error('Risk owner not found');
    }
  }

  // Validate linked controls if provided
  if (linkedControls && linkedControls.length > 0) {
    const controlsCount = await prisma.control.count({
      where: {
        id: { in: linkedControls },
        organizationId: user.organizationId
      }
    });
    if (controlsCount !== linkedControls.length) {
      throw new Error('One or more linked controls do not exist');
    }
  }

  // Create risk in database transaction
  const risk = await prisma.$transaction(async (tx) => {
    // Create the risk
    const newRisk = await tx.risk.create({
      data: {
        title,
        description,
        category,
        likelihood,
        impact,
        riskScore,
        riskLevel,
        riskOwnerId: riskOwner,
        tags: tags || [],
        dueDate: dueDate ? new Date(dueDate) : null,
        metadata: metadata || {},
        organizationId: user.organizationId,
        createdById: user.id,
        updatedById: user.id
      },
      include: {
        riskOwner: {
          select: { id: true, name: true, email: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Link controls if provided
    if (linkedControls && linkedControls.length > 0) {
      await tx.riskControl.createMany({
        data: linkedControls.map(controlId => ({
          riskId: newRisk.id,
          controlId,
          createdById: user.id
        }))
      });
    }

    return newRisk;
  });

  // Fetch complete risk data with controls
  const completeRisk = await prisma.risk.findUnique({
    where: { id: risk.id },
    include: {
      riskOwner: {
        select: { id: true, name: true, email: true }
      },
      controls: {
        select: { 
          id: true, 
          title: true, 
          type: true, 
          effectiveness: true 
        }
      },
      createdBy: {
        select: { id: true, name: true, email: true }
      },
      _count: {
        select: { controls: true, assessments: true }
      }
    }
  });

  // Transform response data
  const responseData = {
    id: completeRisk!.id,
    title: completeRisk!.title,
    description: completeRisk!.description,
    category: completeRisk!.category,
    likelihood: completeRisk!.likelihood,
    impact: completeRisk!.impact,
    riskScore: completeRisk!.riskScore,
    riskLevel: completeRisk!.riskLevel,
    tags: completeRisk!.tags,
    dueDate: completeRisk!.dueDate,
    owner: completeRisk!.riskOwner,
    controls: completeRisk!.controls,
    controlCount: completeRisk!._count.controls,
    assessmentCount: completeRisk!._count.assessments,
    createdBy: completeRisk!.createdBy,
    createdAt: completeRisk!.createdAt,
    updatedAt: completeRisk!.updatedAt
  };

  // Return created resource (middleware handles 201 status and formatting)
  return {
    data: responseData,
    status: 201
  };
});

/**
 * Helper function to calculate risk level from risk score
 */
function calculateRiskLevel(riskScore: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (riskScore <= 8) return 'LOW';
  if (riskScore <= 15) return 'MEDIUM';
  if (riskScore <= 20) return 'HIGH';
  return 'CRITICAL';
} 