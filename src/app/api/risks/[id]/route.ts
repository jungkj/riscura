import { NextRequest } from 'next/server';
import { withAPI, withValidation, createAPIResponse, NotFoundError, ForbiddenError, ConflictError } from '@/lib/api/middleware';
import { updateRiskSchema, idSchema } from '@/lib/api/schemas';
import { getAuthenticatedUser, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { PERMISSIONS } from '@/lib/auth';

// GET /api/risks/[id] - Get specific risk
export const GET = withAPI(
  async (req: AuthenticatedRequest) => {
    const user = getAuthenticatedUser(req);
    
    if (!user) {
      throw new ForbiddenError('Authentication required');
    }

    // Extract ID from URL
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];

    // Validate ID format
    const validatedId = idSchema.parse(id);

    const risk = await db.client.risk.findFirst({
      where: {
        id: validatedId,
        organizationId: user.organizationId,
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
        updatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        controls: {
          include: {
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        riskAssessments: {
          include: {
            assessor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { assessmentDate: 'desc' },
        },
        documents: {
          include: {
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        workflows: {
          include: {
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          where: {
            status: { not: 'completed' },
          },
        },
      },
    });

    if (!risk) {
      throw new NotFoundError('Risk not found');
    }

    // Log activity
    await db.client.activity.create({
      data: {
        type: 'READ',
        entityType: 'RISK',
        entityId: risk.id,
        description: `Viewed risk: ${risk.title}`,
        userId: user.id,
        organizationId: user.organizationId,
        metadata: {
          riskId: risk.id,
          category: risk.category,
          severity: risk.severity,
        },
        isPublic: false,
      },
    });

    return createAPIResponse(risk);
  },
  {
    requiredPermissions: [PERMISSIONS.RISKS_READ],
    rateLimit: { limit: 200, windowMs: 15 * 60 * 1000 },
  }
);

// PUT /api/risks/[id] - Update entire risk
export const PUT = withAPI(
  withValidation(updateRiskSchema)(async (req: NextRequest, data: any) => {
    const authReq = req as AuthenticatedRequest;
    const user = getAuthenticatedUser(authReq);
    
    if (!user) {
      throw new ForbiddenError('Authentication required');
    }

    // Extract ID from URL
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];

    // Check if risk exists and user has access
    const existingRisk = await db.client.risk.findFirst({
      where: {
        id: id,
        organizationId: user.organizationId,
      },
    });

    if (!existingRisk) {
      throw new NotFoundError('Risk not found');
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

    // Calculate new risk score if likelihood or impact changed
    let updateData = { ...data };
    if (data.likelihood || data.impact) {
      const likelihood = data.likelihood || existingRisk.likelihood;
      const impact = data.impact || existingRisk.impact;
      updateData.riskScore = calculateRiskScore(likelihood, impact);
      
      // Update inherent risk if this is a new assessment
      if (data.likelihood && data.impact) {
        updateData.inherentRisk = updateData.riskScore;
      }
    }

    // Update risk
    const risk = await db.client.risk.update({
      where: { id: id },
      data: {
        ...updateData,
        updatedById: user.id,
        updatedAt: new Date(),
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
        updatedBy: {
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
        type: 'UPDATED',
        entityType: 'RISK',
        entityId: risk.id,
        description: `Updated risk: ${risk.title}`,
        userId: user.id,
        organizationId: user.organizationId,
        metadata: {
          riskId: risk.id,
          changes: Object.keys(data),
          previousValues: {
            severity: existingRisk.severity,
            status: existingRisk.status,
            riskScore: existingRisk.riskScore,
          },
          newValues: {
            severity: risk.severity,
            status: risk.status,
            riskScore: risk.riskScore,
          },
        },
        isPublic: false,
      },
    });

    return createAPIResponse(risk);
  }),
  {
    requiredPermissions: [PERMISSIONS.RISKS_WRITE],
    rateLimit: { limit: 100, windowMs: 15 * 60 * 1000 },
  }
);

// PATCH /api/risks/[id] - Partial update risk
export const PATCH = withAPI(
  withValidation(updateRiskSchema.partial())(async (req: NextRequest, data: any) => {
    const authReq = req as AuthenticatedRequest;
    const user = getAuthenticatedUser(authReq);
    
    if (!user) {
      throw new ForbiddenError('Authentication required');
    }

    // Extract ID from URL
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];

    // Check if risk exists and user has access
    const existingRisk = await db.client.risk.findFirst({
      where: {
        id: id,
        organizationId: user.organizationId,
      },
    });

    if (!existingRisk) {
      throw new NotFoundError('Risk not found');
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

    // Calculate new risk score if likelihood or impact changed
    let updateData = { ...data };
    if (data.likelihood || data.impact) {
      const likelihood = data.likelihood || existingRisk.likelihood;
      const impact = data.impact || existingRisk.impact;
      updateData.riskScore = calculateRiskScore(likelihood, impact);
    }

    // Update risk
    const risk = await db.client.risk.update({
      where: { id: id },
      data: {
        ...updateData,
        updatedById: user.id,
        updatedAt: new Date(),
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
        updatedBy: {
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
        type: 'UPDATED',
        entityType: 'RISK',
        entityId: risk.id,
        description: `Partially updated risk: ${risk.title}`,
        userId: user.id,
        organizationId: user.organizationId,
        metadata: {
          riskId: risk.id,
          changes: Object.keys(data),
          updatedFields: Object.keys(data),
        },
        isPublic: false,
      },
    });

    return createAPIResponse(risk);
  }),
  {
    requiredPermissions: [PERMISSIONS.RISKS_WRITE],
    rateLimit: { limit: 100, windowMs: 15 * 60 * 1000 },
  }
);

// DELETE /api/risks/[id] - Delete risk
export const DELETE = withAPI(
  async (req: AuthenticatedRequest) => {
    const user = getAuthenticatedUser(req);
    
    if (!user) {
      throw new ForbiddenError('Authentication required');
    }

    // Extract ID from URL
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];

    // Check if risk exists and user has access
    const existingRisk = await db.client.risk.findFirst({
      where: {
        id: id,
        organizationId: user.organizationId,
      },
      include: {
        _count: {
          select: {
            controls: true,
            riskAssessments: true,
            workflows: true,
          },
        },
      },
    });

    if (!existingRisk) {
      throw new NotFoundError('Risk not found');
    }

    // Check if risk has dependent entities
    if (existingRisk._count.controls > 0) {
      throw new ConflictError('Cannot delete risk with associated controls. Remove controls first.');
    }

    if (existingRisk._count.workflows > 0) {
      const activeWorkflows = await db.client.workflow.count({
        where: {
          riskIds: { has: id },
          status: { notIn: ['completed', 'cancelled'] },
        },
      });

      if (activeWorkflows > 0) {
        throw new ConflictError('Cannot delete risk with active workflows. Complete or cancel workflows first.');
      }
    }

    // Delete risk (this will cascade to risk assessments due to FK constraints)
    await db.client.risk.delete({
      where: { id: id },
    });

    // Log activity
    await db.client.activity.create({
      data: {
        type: 'DELETED',
        entityType: 'RISK',
        entityId: id,
        description: `Deleted risk: ${existingRisk.title}`,
        userId: user.id,
        organizationId: user.organizationId,
        metadata: {
          riskId: id,
          title: existingRisk.title,
          category: existingRisk.category,
          severity: existingRisk.severity,
          deletedAssessments: existingRisk._count.riskAssessments,
        },
        isPublic: false,
      },
    });

    return createAPIResponse({ message: 'Risk deleted successfully' });
  },
  {
    requiredPermissions: [PERMISSIONS.RISKS_DELETE],
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