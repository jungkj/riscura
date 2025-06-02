import { NextRequest } from 'next/server';
import { withAPI, withValidation, createAPIResponse, parsePagination, parseFilters, parseSorting, parseSearch, createPaginationMeta, NotFoundError, ForbiddenError } from '@/lib/api/middleware';
import { createControlSchema, controlQuerySchema } from '@/lib/api/schemas';
import { getAuthenticatedUser, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { PERMISSIONS } from '@/lib/auth';

// Mapping functions for API <-> DB enum conversions
const mapControlType = (apiType: string): any => {
  const mapping: Record<string, string> = {
    'preventive': 'PREVENTIVE',
    'detective': 'DETECTIVE',
    'corrective': 'CORRECTIVE',
    'directive': 'DIRECTIVE',
    'compensating': 'COMPENSATING',
  };
  return mapping[apiType] || 'PREVENTIVE';
};

const mapControlStatus = (apiStatus: string): any => {
  const mapping: Record<string, string> = {
    'planned': 'PLANNED',
    'implemented': 'IMPLEMENTED',
    'testing': 'TESTING',
    'operational': 'OPERATIONAL',
    'remediation': 'REMEDIATION',
    'disabled': 'DISABLED',
  };
  return mapping[apiStatus] || 'PLANNED';
};

const mapControlCategory = (apiCategory: string): any => {
  const mapping: Record<string, string> = {
    'technical': 'TECHNICAL',
    'administrative': 'ADMINISTRATIVE',
    'physical': 'PHYSICAL',
    'operational': 'OPERATIONAL',
    'management': 'MANAGEMENT',
  };
  return mapping[apiCategory] || 'OPERATIONAL';
};

const mapAutomationLevel = (apiLevel: string): any => {
  const mapping: Record<string, string> = {
    'manual': 'MANUAL',
    'semi_automated': 'SEMI_AUTOMATED',
    'fully_automated': 'FULLY_AUTOMATED',
  };
  return mapping[apiLevel] || 'MANUAL';
};

const mapEffectivenessRating = (apiRating: string): any => {
  const mapping: Record<string, string> = {
    'not_effective': 'NOT_EFFECTIVE',
    'partially_effective': 'PARTIALLY_EFFECTIVE',
    'largely_effective': 'LARGELY_EFFECTIVE',
    'fully_effective': 'FULLY_EFFECTIVE',
  };
  return mapping[apiRating] || 'PARTIALLY_EFFECTIVE';
};

const mapControlEffort = (apiEffort: string): any => {
  const mapping: Record<string, string> = {
    'low': 'LOW',
    'medium': 'MEDIUM',
    'high': 'HIGH',
  };
  return mapping[apiEffort] || 'MEDIUM';
};

const mapPriority = (apiPriority: string): any => {
  const mapping: Record<string, string> = {
    'low': 'LOW',
    'medium': 'MEDIUM',
    'high': 'HIGH',
    'critical': 'CRITICAL',
  };
  return mapping[apiPriority] || 'MEDIUM';
};

// GET /api/controls - List controls with pagination and filtering
export const GET = withAPI(
  withValidation(controlQuerySchema)(async (req: NextRequest, query) => {
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
        // { testResults: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Add filters
    if (query.controlType) {
      where.controlType = query.controlType;
    }
    if (query.frequency) {
      where.frequency = query.frequency;
    }
    if (query.effectiveness) {
      where.effectiveness = query.effectiveness;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.ownerId) {
      where.owner = query.ownerId;
    }
    if (query.riskId) {
      where.risks = {
        some: {
          riskId: query.riskId
        }
      };
    }

    // Test due date filters
    if (query.testDue) {
      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(now.getDate() + 30);

      switch (query.testDue) {
        case 'overdue':
          where.nextTestDate = { lt: now };
          break;
        case 'due_soon':
          where.nextTestDate = { 
            gte: now,
            lte: thirtyDaysFromNow 
          };
          break;
        case 'upcoming':
          where.nextTestDate = { gt: thirtyDaysFromNow };
          break;
      }
    }

    // Execute queries
    const [controls, total] = await Promise.all([
      db.client.control.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          assignedUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          risks: {
            include: {
              risk: {
                select: {
                  id: true,
                  title: true,
                  riskLevel: true,
                  status: true,
                },
              },
            },
          },
          // controlTests: {
          //   select: {
          //     id: true,
          //     testDate: true,
          //     result: true,
          //     effectiveness: true,
          //   },
          //   orderBy: { testDate: 'desc' },
          //   take: 1,
          // },
          _count: {
            select: {
              risks: true,
              // controlTests: true,
              evidence: true,
            },
          },
        },
      }),
      db.client.control.count({ where }),
    ]);

    // Log activity
    await db.client.activity.create({
      data: {
        type: 'READ' as const,
        entityType: 'CONTROL',
        entityId: 'list',
        description: `Retrieved ${controls.length} controls`,
        userId: user.id,
        organizationId: user.organizationId,
        metadata: {
          query: query,
          resultCount: controls.length,
          filters: Object.keys(filters),
        },
        isPublic: false,
      },
    });

    return createAPIResponse(controls, {
      pagination: createPaginationMeta(page, limit, total),
    });
  }),
  {
    requiredPermissions: [PERMISSIONS.CONTROLS_READ],
    rateLimit: { limit: 100, windowMs: 15 * 60 * 1000 },
  }
);

// POST /api/controls - Create new control
export const POST = withAPI(
  withValidation(createControlSchema)(async (req: NextRequest, data) => {
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
          isActive: true 
        },
      });
      
      if (!owner) {
        throw new NotFoundError('Specified owner not found in organization');
      }
    }
    
    // Remove operatorId and reviewerId validation as these fields don't exist
    
    // Validate risk IDs if specified
    if (data.riskIds && data.riskIds.length > 0) {
      const risks = await db.client.risk.findMany({
        where: {
          id: { in: data.riskIds },
          organizationId: user.organizationId,
        },
        select: { id: true },
      });

      if (risks.length !== data.riskIds.length) {
        throw new NotFoundError('One or more specified risks not found in organization');
      }
    }

    // Create control with proper field mappings
    const { 
      ownerId, 
      riskIds, 
      controlType, 
      category,
      status,
      automationLevel,
      effectiveness,
      priority,
      effort,
      description,
      ...controlData 
    } = data;
    
    const control = await db.client.control.create({
      data: {
        ...controlData,
        description: description || '', // Ensure description is not undefined
        type: mapControlType(controlType),
        category: mapControlCategory(category),
        status: status ? mapControlStatus(status) : 'PLANNED',
        automationLevel: automationLevel ? mapAutomationLevel(automationLevel) : 'MANUAL',
        effectivenessRating: effectiveness ? mapEffectivenessRating(effectiveness) : undefined,
        priority: priority ? mapPriority(priority) : undefined,
        effort: effort ? mapControlEffort(effort) : undefined,
        owner: ownerId,
        organizationId: user.organizationId,
        createdBy: user.id,
        // Create risk mappings if riskIds provided
        risks: riskIds ? {
          create: riskIds.map((riskId: string) => ({
            riskId,
          }))
        } : undefined,
      },
      include: {
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        risks: {
          include: {
            risk: {
              select: {
                id: true,
                title: true,
                riskLevel: true,
              },
            },
          },
        },
      },
    });

    // Log activity
    await db.client.activity.create({
      data: {
        type: 'CREATED' as const,
        entityType: 'CONTROL',
        entityId: control.id,
        description: `Created control: ${control.title}`,
        userId: user.id,
        organizationId: user.organizationId,
        metadata: {
          controlId: control.id,
          controlType: control.type,
          frequency: control.frequency,
          linkedRisks: data.riskIds?.length || 0,
        },
        isPublic: false,
      },
    });

    return createAPIResponse(control, { statusCode: 201 });
  }),
  {
    requiredPermissions: [PERMISSIONS.CONTROLS_WRITE],
    rateLimit: { limit: 50, windowMs: 15 * 60 * 1000 },
  }
); 