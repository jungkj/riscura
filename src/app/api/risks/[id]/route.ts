import { NextRequest, NextResponse } from 'next/server';
import { withAPI, createAPIResponse, ForbiddenError, ValidationError, NotFoundError } from '@/lib/api/middleware';
import { getAuthenticatedUser, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { riskUpdateSchema } from '@/lib/api/schemas';
import { z } from 'zod';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/risks/[id] - Get single risk with full details
export const GET = withAPI(async (req: NextRequest, { params }: RouteParams) => {
  const authReq = req as AuthenticatedRequest;
  const user = getAuthenticatedUser(authReq);

  if (!user) {
    throw new ForbiddenError('Authentication required');
  }

  try {
    const riskId = params.id;

    if (!riskId) {
      throw new ValidationError('Risk ID is required');
    }

    // Validate UUID format
    const uuidSchema = z.string().uuid();
    const validatedId = uuidSchema.parse(riskId);

    const risk = await db.client.risk.findFirst({
      where: {
        id: validatedId,
        organizationId: user.organizationId,
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        controls: {
          include: {
            control: {
              select: {
                id: true,
                title: true,
                description: true,
                category: true,
                type: true,
                status: true,
                effectiveness: true,
                implementationDate: true,
                lastTestedDate: true,
                nextTestDate: true,
              },
            },
          },
        },
        evidence: {
          select: {
            id: true,
            name: true,
            type: true,
            size: true,
            uploadedAt: true,
            uploadedBy: true,
            path: true,
          },
          orderBy: {
            uploadedAt: 'desc',
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        activities: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!risk) {
      throw new NotFoundError('Risk not found');
    }

    // Calculate additional metrics
    const controlsCount = risk.controls.length;
    const implementedControlsCount = risk.controls.filter(
      c => c.control.status === 'OPERATIONAL' || c.control.status === 'IMPLEMENTED'
    ).length;
    const controlEffectiveness = controlsCount > 0 
      ? risk.controls.reduce((sum, c) => sum + (c.control.effectiveness || 0), 0) / controlsCount 
      : 0;

    const openTasksCount = risk.tasks.filter(t => t.status !== 'COMPLETED').length;
    const overdueTasks = risk.tasks.filter(t => 
      t.status !== 'COMPLETED' && t.dueDate && new Date(t.dueDate) < new Date()
    ).length;

    // Calculate risk trend (simplified - would need historical data for accurate trend)
    const recentActivities = risk.activities.filter(a => 
      a.createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
    );
    const riskTrend = recentActivities.length > 5 ? 'increasing' : 
                     recentActivities.length > 2 ? 'stable' : 'decreasing';

    const enrichedRisk = {
      ...risk,
      metrics: {
        controlsCount,
        implementedControlsCount,
        controlCoverage: controlsCount > 0 ? Math.round((implementedControlsCount / controlsCount) * 100) : 0,
        averageControlEffectiveness: Math.round(controlEffectiveness * 100) / 100,
        openTasksCount,
        overdueTasks,
        evidenceCount: risk.evidence.length,
        commentsCount: risk.comments.length,
        activitiesCount: risk.activities.length,
        riskTrend,
      },
      timeline: risk.activities.map(activity => ({
        id: activity.id,
        type: activity.type,
        description: activity.description,
        user: activity.user ? `${activity.user.firstName} ${activity.user.lastName}` : 'System',
        createdAt: activity.createdAt,
        metadata: activity.metadata,
      })),
    };

    return createAPIResponse({
      data: enrichedRisk,
    });
  } catch (error) {
    console.error('Error fetching risk:', error);
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid risk ID format', error.errors);
    }
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch risk');
  }
});

// PUT /api/risks/[id] - Update risk
export const PUT = withAPI(async (req: NextRequest, { params }: RouteParams) => {
  const authReq = req as AuthenticatedRequest;
  const user = getAuthenticatedUser(authReq);

  if (!user) {
    throw new ForbiddenError('Authentication required');
  }

  try {
    const riskId = params.id;

    if (!riskId) {
      throw new ValidationError('Risk ID is required');
    }

    // Validate UUID format
    const uuidSchema = z.string().uuid();
    const validatedId = uuidSchema.parse(riskId);

    const body = await req.json();
    const validatedData = riskUpdateSchema.parse(body);

    // Check if risk exists and user has access
    const existingRisk = await db.client.risk.findFirst({
      where: {
        id: validatedId,
        organizationId: user.organizationId,
      },
    });

    if (!existingRisk) {
      throw new NotFoundError('Risk not found');
    }

    // Validate assigned user if provided
    if (validatedData.owner) {
      const assignedUser = await db.client.user.findFirst({
        where: {
          id: validatedData.owner,
          organizationId: user.organizationId,
        },
      });

      if (!assignedUser) {
        throw new ValidationError('Invalid assigned user ID');
      }
    }

    // Calculate risk score if likelihood or impact changed
    let riskScore = existingRisk.riskScore;
    if (validatedData.likelihood !== undefined || validatedData.impact !== undefined) {
      const likelihood = validatedData.likelihood ?? existingRisk.likelihood;
      const impact = validatedData.impact ?? existingRisk.impact;
      riskScore = likelihood * impact;
    }

    // Determine risk level based on score
    let riskLevel = existingRisk.riskLevel;
    if (riskScore !== existingRisk.riskScore) {
      if (riskScore >= 20) riskLevel = 'CRITICAL';
      else if (riskScore >= 12) riskLevel = 'HIGH';
      else if (riskScore >= 6) riskLevel = 'MEDIUM';
      else riskLevel = 'LOW';
    }

    // Update risk
    const updatedRisk = await db.client.risk.update({
      where: { id: validatedId },
      data: {
        title: validatedData.title,
        description: validatedData.description,
        category: validatedData.category,
        likelihood: validatedData.likelihood,
        impact: validatedData.impact,
        riskScore,
        riskLevel,
        owner: validatedData.owner,
        status: validatedData.status,
        dateIdentified: validatedData.dateIdentified ? new Date(validatedData.dateIdentified) : undefined,
        lastAssessed: validatedData.lastAssessed ? new Date(validatedData.lastAssessed) : undefined,
        nextReview: validatedData.nextReview ? new Date(validatedData.nextReview) : undefined,
        aiConfidence: validatedData.aiConfidence,
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        controls: {
          include: {
            control: {
              select: {
                id: true,
                title: true,
                status: true,
                type: true,
                effectiveness: true,
              },
            },
          },
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
    });

    // Log activity
    await db.client.activity.create({
      data: {
        type: 'RISK_UPDATED',
        description: `Risk "${updatedRisk.title}" updated`,
        userId: user.id,
        organizationId: user.organizationId,
        entityType: 'RISK',
        entityId: updatedRisk.id,
        metadata: {
          changes: Object.keys(validatedData),
          previousRiskScore: existingRisk.riskScore,
          newRiskScore: riskScore,
          previousRiskLevel: existingRisk.riskLevel,
          newRiskLevel: riskLevel,
        },
      },
    });

    return createAPIResponse({
      data: updatedRisk,
      message: 'Risk updated successfully',
    });
  } catch (error) {
    console.error('Error updating risk:', error);
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid risk data', error.errors);
    }
    throw new Error(error instanceof Error ? error.message : 'Failed to update risk');
  }
});

// DELETE /api/risks/[id] - Delete risk
export const DELETE = withAPI(async (req: NextRequest, { params }: RouteParams) => {
  const authReq = req as AuthenticatedRequest;
  const user = getAuthenticatedUser(authReq);

  if (!user) {
    throw new ForbiddenError('Authentication required');
  }

  try {
    const riskId = params.id;

    if (!riskId) {
      throw new ValidationError('Risk ID is required');
    }

    // Validate UUID format
    const uuidSchema = z.string().uuid();
    const validatedId = uuidSchema.parse(riskId);

    // Check if risk exists and user has access
    const existingRisk = await db.client.risk.findFirst({
      where: {
        id: validatedId,
        organizationId: user.organizationId,
      },
      include: {
        controls: true,
        evidence: true,
        comments: true,
        tasks: true,
      },
    });

    if (!existingRisk) {
      throw new NotFoundError('Risk not found');
    }

    // Check if user has permission to delete (only creator or admin)
    const canDelete = existingRisk.createdBy === user.id || 
                     user.permissions.includes('risks:delete') ||
                     user.role === 'ADMIN';

    if (!canDelete) {
      throw new ForbiddenError('Insufficient permissions to delete this risk');
    }

    // Check for dependencies
    if (existingRisk.controls.length > 0) {
      // Option 1: Prevent deletion if controls are linked
      throw new ValidationError(
        `Cannot delete risk with ${existingRisk.controls.length} linked control(s). Please remove control associations first.`
      );
      
      // Option 2: Cascade delete (uncomment if preferred)
      // await db.client.controlRiskMapping.deleteMany({
      //   where: { riskId: validatedId },
      // });
    }

    // Delete related records first (if not using cascade delete in schema)
    await Promise.all([
      db.client.comment.deleteMany({ where: { entityId: validatedId, entityType: 'RISK' } }),
      db.client.task.deleteMany({ where: { riskId: validatedId } }),
      db.client.activity.deleteMany({ where: { entityId: validatedId, entityType: 'RISK' } }),
    ]);

    // Delete the risk
    await db.client.risk.delete({
      where: { id: validatedId },
    });

    // Log activity
    await db.client.activity.create({
      data: {
        type: 'RISK_DELETED',
        description: `Risk "${existingRisk.title}" deleted`,
        userId: user.id,
        organizationId: user.organizationId,
        entityType: 'RISK',
        entityId: validatedId,
        metadata: {
          riskTitle: existingRisk.title,
          riskCategory: existingRisk.category,
          riskLevel: existingRisk.riskLevel,
          linkedControls: existingRisk.controls.length,
          evidenceCount: existingRisk.evidence.length,
        },
      },
    });

    return createAPIResponse({
      data: { id: validatedId },
      message: 'Risk deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting risk:', error);
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid risk ID format', error.errors);
    }
    throw new Error(error instanceof Error ? error.message : 'Failed to delete risk');
  }
}); 