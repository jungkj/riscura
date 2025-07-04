import { NextRequest, NextResponse } from 'next/server';
import { withAPI, createAPIResponse, ForbiddenError, ValidationError } from '@/lib/api/middleware';
import { getAuthenticatedUser, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Assessment validation schemas - Using Workflow model as base for assessments
const assessmentCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  assessmentType: z.enum(['RISK_ASSESSMENT', 'CONTROL_ASSESSMENT', 'COMPLIANCE_ASSESSMENT', 'VENDOR_ASSESSMENT', 'SELF_ASSESSMENT']),
  category: z.string().optional(),
  framework: z.string().optional(),
  scope: z.string().optional(),
  objectives: z.array(z.string()).default([]),
  methodology: z.string().optional(),
  assigneeId: z.string().uuid().optional(),
  approverId: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  tags: z.array(z.string()).default([]),
  riskIds: z.array(z.string().uuid()).optional(),
  controlIds: z.array(z.string().uuid()).optional(),
  questionnaireIds: z.array(z.string().uuid()).optional(),
});

const assessmentUpdateSchema = assessmentCreateSchema.partial();

const assessmentQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  framework: z.string().optional(),
  assigneeId: z.string().uuid().optional(),
  approverId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  dueDateFrom: z.string().datetime().optional(),
  dueDateTo: z.string().datetime().optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
}).transform((data) => ({
  ...data,
  skip: (data.page - 1) * data.limit,
}));

const assessmentBulkSchema = z.object({
  create: z.array(assessmentCreateSchema).optional(),
  update: z.array(z.object({
    id: z.string().uuid(),
  }).merge(assessmentUpdateSchema)).optional(),
  delete: z.array(z.string().uuid()).optional(),
});

// GET /api/assessments - List assessments using Workflow model
export const GET = withAPI(async (req: NextRequest) => {
  const authReq = req as AuthenticatedRequest;
  const user = getAuthenticatedUser(authReq);

  if (!user) {
    throw new ForbiddenError('Authentication required');
  }

  try {
    const { searchParams } = new URL(req.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedQuery = assessmentQuerySchema.parse(queryParams);

    // Build where clause for workflows that represent assessments
    const where: Prisma.WorkflowWhereInput = {
      organizationId: user.organizationId,
      type: 'ASSESSMENT', // Filter for assessment workflows
    };

    // Text search across multiple fields
    if (validatedQuery.search) {
      where.OR = [
        { name: { contains: validatedQuery.search, mode: 'insensitive' } },
        { description: { contains: validatedQuery.search, mode: 'insensitive' } },
      ];
    }

    // Apply filters
    if (validatedQuery.status) {
      where.status = validatedQuery.status as any;
    }

    if (validatedQuery.priority) {
      where.priority = validatedQuery.priority as any;
    }

    if (validatedQuery.assigneeId) {
      where.assignedTo = {
        has: validatedQuery.assigneeId,
      };
    }

    if (validatedQuery.tags && validatedQuery.tags.length > 0) {
      where.tags = {
        hasSome: validatedQuery.tags,
      };
    }

    if (validatedQuery.createdAfter || validatedQuery.createdBefore) {
      where.createdAt = {};
      if (validatedQuery.createdAfter) {
        where.createdAt.gte = new Date(validatedQuery.createdAfter);
      }
      if (validatedQuery.createdBefore) {
        where.createdAt.lte = new Date(validatedQuery.createdBefore);
      }
    }

    // Count total records
    const total = await db.client.workflow.count({ where });

    // Build orderBy
    const orderBy: Prisma.WorkflowOrderByWithRelationInput = {};
    if (validatedQuery.sortBy) {
      orderBy[validatedQuery.sortBy as keyof Prisma.WorkflowOrderByWithRelationInput] = validatedQuery.sortOrder;
    } else {
      orderBy.updatedAt = 'desc';
    }

    // Execute query
    const workflows = await db.client.workflow.findMany({
      where,
      orderBy,
      skip: validatedQuery.skip,
      take: validatedQuery.limit,
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Fetch activities for all workflows
    const workflowIds = workflows.map(w => w.id);
    const activities = await db.client.activity.findMany({
      where: {
        entityType: 'WORKFLOW',
        entityId: { in: workflowIds },
      },
      select: {
        id: true,
        type: true,
        description: true,
        createdAt: true,
        entityId: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Group activities by workflow ID
    const activitiesByWorkflow = activities.reduce((acc, activity) => {
      if (!acc[activity.entityId]) {
        acc[activity.entityId] = [];
      }
      acc[activity.entityId].push(activity);
      return acc;
    }, {} as Record<string, typeof activities>);

    // Calculate additional metrics for each assessment
    const enrichedAssessments = workflows.map(workflow => {
       // Since steps are stored as JSON, parse them if they exist
       const steps = Array.isArray(workflow.steps) ? workflow.steps : [];
       const completedSteps = steps.filter((step: any) => step.status === 'COMPLETED').length;
       const totalSteps = steps.length;
       const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

       // Type cast relatedEntities as it's a JSON field
       const relatedEntities = workflow.relatedEntities as any;

       // Get activities for this workflow (take only the first 5)
       const workflowActivities = activitiesByWorkflow[workflow.id] || [];
       const recentActivities = workflowActivities.slice(0, 5);

       return {
         ...workflow,
         assessmentType: relatedEntities?.assessmentType || 'SELF_ASSESSMENT',
         framework: relatedEntities?.framework,
         scope: relatedEntities?.scope,
         objectives: relatedEntities?.objectives || [],
         methodology: relatedEntities?.methodology,
         progress,
         completedSteps,
         totalSteps,
         assignedUsers: workflow.assignedTo || [],
         activities: recentActivities,
       };
     });

    return createAPIResponse({
      data: enrichedAssessments,
      pagination: {
        total,
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        hasNextPage: validatedQuery.skip + validatedQuery.limit < total,
        hasPreviousPage: validatedQuery.skip > 0,
        totalPages: Math.ceil(total / validatedQuery.limit),
      },
      summary: {
        totalAssessments: total,
        activeAssessments: workflows.filter(w => w.status === 'ACTIVE').length,
        completedAssessments: workflows.filter(w => w.status === 'COMPLETED').length,
        overdueAssessments: workflows.filter(w => w.completedAt === null && w.status === 'ACTIVE').length,
      },
    });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid query parameters', error.errors);
    }
    throw new Error('Failed to fetch assessments');
  }
});

// POST /api/assessments - Create new assessment using Workflow model
export const POST = withAPI(async (req: NextRequest) => {
  const authReq = req as AuthenticatedRequest;
  const user = getAuthenticatedUser(authReq);

  if (!user) {
    throw new ForbiddenError('Authentication required');
  }

  try {
    const body = await req.json();
    const validatedData = assessmentCreateSchema.parse(body);

    // Validate assignee exists
    if (validatedData.assigneeId) {
      const assignee = await db.client.user.findFirst({
        where: {
          id: validatedData.assigneeId,
          organizationId: user.organizationId,
        },
      });

      if (!assignee) {
        throw new ValidationError('Invalid assignee ID');
      }
    }

    // Validate approver exists
    if (validatedData.approverId) {
      const approver = await db.client.user.findFirst({
        where: {
          id: validatedData.approverId,
          organizationId: user.organizationId,
        },
      });

      if (!approver) {
        throw new ValidationError('Invalid approver ID');
      }
    }

    // Validate linked entities exist
    if (validatedData.riskIds && validatedData.riskIds.length > 0) {
      const risks = await db.client.risk.findMany({
        where: {
          id: { in: validatedData.riskIds },
          organizationId: user.organizationId,
        },
        select: { id: true },
      });

      if (risks.length !== validatedData.riskIds.length) {
        throw new ValidationError('One or more risk IDs are invalid');
      }
    }

    if (validatedData.controlIds && validatedData.controlIds.length > 0) {
      const controls = await db.client.control.findMany({
        where: {
          id: { in: validatedData.controlIds },
          organizationId: user.organizationId,
        },
        select: { id: true },
      });

      if (controls.length !== validatedData.controlIds.length) {
        throw new ValidationError('One or more control IDs are invalid');
      }
    }

    // Create assessment workflow
    const { riskIds, controlIds, questionnaireIds, assigneeId, approverId, ...workflowData } = validatedData;
    
    const workflow = await db.client.workflow.create({
      data: {
        name: workflowData.name,
        description: workflowData.description || '',
        type: 'ASSESSMENT',
        status: 'DRAFT',
        priority: workflowData.priority,
        tags: workflowData.tags,
        assignedTo: assigneeId ? [assigneeId] : [],
        organizationId: user.organizationId,
        createdBy: user.id,
        steps: getWorkflowStepsForAssessmentType(validatedData.assessmentType),
        relatedEntities: {
          assessmentType: validatedData.assessmentType,
          framework: validatedData.framework,
          scope: validatedData.scope,
          objectives: validatedData.objectives,
          methodology: validatedData.methodology,
          linkedRisks: riskIds,
          linkedControls: controlIds,
          linkedQuestionnaires: questionnaireIds,
          assigneeId,
          approverId,
        },
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
      },
    });

    // Workflow steps are already created as JSON in the workflow

    // Log activity
    await db.client.activity.create({
      data: {
        type: 'CREATED',
        description: `Assessment "${workflow.name}" created`,
        userId: user.id,
        organizationId: user.organizationId,
        entityType: 'WORKFLOW',
        entityId: workflow.id,
        metadata: {
          assessmentType: validatedData.assessmentType,
          priority: workflow.priority,
          linkedRisks: riskIds?.length || 0,
          linkedControls: controlIds?.length || 0,
        },
      },
    });

    return createAPIResponse({
      data: {
        ...workflow,
        assessmentType: validatedData.assessmentType,
        framework: validatedData.framework,
        scope: validatedData.scope,
        objectives: validatedData.objectives,
        methodology: validatedData.methodology,
      },
      message: 'Assessment created successfully',
    });
  } catch (error) {
    console.error('Error creating assessment:', error);
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid assessment data', error.errors);
    }
    throw new Error(error instanceof Error ? error.message : 'Failed to create assessment');
  }
});

// PUT /api/assessments/bulk - Bulk operations on assessments
export const PUT = withAPI(async (req: NextRequest) => {
  const authReq = req as AuthenticatedRequest;
  const user = getAuthenticatedUser(authReq);

  if (!user) {
    throw new ForbiddenError('Authentication required');
  }

  try {
    const body = await req.json();
    const validatedData = assessmentBulkSchema.parse(body);

    const results = {
      created: 0,
      updated: 0,
      deleted: 0,
      errors: [] as string[],
    };

    // Handle bulk create
    if (validatedData.create && validatedData.create.length > 0) {
      for (const assessmentData of validatedData.create) {
        try {
          const validatedAssessment = assessmentCreateSchema.parse(assessmentData);
          
          const { riskIds, controlIds, questionnaireIds, assigneeId, approverId, ...workflowData } = validatedAssessment;
          
          await db.client.workflow.create({
            data: {
              name: workflowData.name,
              description: workflowData.description || '',
              type: 'ASSESSMENT',
              status: 'DRAFT',
              priority: workflowData.priority,
              tags: workflowData.tags,
              assignedTo: assigneeId ? [assigneeId] : [],
              organizationId: user.organizationId,
              createdBy: user.id,
              steps: getWorkflowStepsForAssessmentType(validatedAssessment.assessmentType),
              relatedEntities: {
                assessmentType: validatedAssessment.assessmentType,
                framework: validatedAssessment.framework,
                scope: validatedAssessment.scope,
                objectives: validatedAssessment.objectives,
                methodology: validatedAssessment.methodology,
                linkedRisks: riskIds,
                linkedControls: controlIds,
                linkedQuestionnaires: questionnaireIds,
                assigneeId,
                approverId,
              },
            },
          });

          results.created++;
        } catch (error) {
          results.errors.push(`Failed to create assessment: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Handle bulk update
    if (validatedData.update && validatedData.update.length > 0) {
      for (const updateData of validatedData.update) {
        try {
          const { id, ...assessmentData } = updateData;
          const validatedAssessment = assessmentUpdateSchema.parse(assessmentData);

          const existing = await db.client.workflow.findFirst({
            where: {
              id,
              organizationId: user.organizationId,
              type: 'ASSESSMENT',
            },
          });

          if (!existing) {
            results.errors.push(`Assessment with ID ${id} not found`);
            continue;
          }

          const { riskIds, controlIds, questionnaireIds, assigneeId, approverId, ...workflowData } = validatedAssessment;

          await db.client.workflow.update({
            where: { id },
            data: {
              name: workflowData.name,
              description: workflowData.description,
              priority: workflowData.priority,
              tags: workflowData.tags,
              assignedTo: assigneeId ? [assigneeId] : existing.assignedTo,
              relatedEntities: {
                ...(existing.relatedEntities as any || {}),
                assessmentType: validatedAssessment.assessmentType,
                framework: validatedAssessment.framework,
                scope: validatedAssessment.scope,
                objectives: validatedAssessment.objectives,
                methodology: validatedAssessment.methodology,
                linkedRisks: riskIds,
                linkedControls: controlIds,
                linkedQuestionnaires: questionnaireIds,
                assigneeId,
                approverId,
              },
            },
          });

          results.updated++;
        } catch (error) {
          results.errors.push(`Failed to update assessment: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Handle bulk delete
    if (validatedData.delete && validatedData.delete.length > 0) {
      for (const assessmentId of validatedData.delete) {
        try {
          const existing = await db.client.workflow.findFirst({
            where: {
              id: assessmentId,
              organizationId: user.organizationId,
              type: 'ASSESSMENT',
            },
          });

          if (!existing) {
            results.errors.push(`Assessment with ID ${assessmentId} not found`);
            continue;
          }

          await db.client.workflow.delete({
            where: { id: assessmentId },
          });

          results.deleted++;
        } catch (error) {
          results.errors.push(`Failed to delete assessment: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Log bulk activity
    await db.client.activity.create({
      data: {
        type: 'UPDATED',
        description: `Bulk assessment operation: ${results.created} created, ${results.updated} updated, ${results.deleted} deleted`,
        userId: user.id,
        organizationId: user.organizationId,
        entityType: 'WORKFLOW',
        entityId: user.organizationId, // Use organization ID as a generic entity reference for bulk operations
        metadata: {
          created: results.created,
          updated: results.updated,
          deleted: results.deleted,
          errors: results.errors.length,
        },
      },
    });

    return createAPIResponse({
      data: results,
      message: `Bulk operation completed: ${results.created + results.updated + results.deleted} assessments processed`,
    });
  } catch (error) {
    console.error('Error in bulk assessments operation:', error);
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid bulk operation data', error.errors);
    }
    throw new Error('Failed to perform bulk operation');
  }
});

// Helper function to get workflow steps as JSON objects
function getWorkflowStepsForAssessmentType(assessmentType: string) {
  const baseSteps = [
    { name: 'Planning', description: 'Define assessment scope and objectives', type: 'PLANNING', daysFromStart: 0 },
    { name: 'Data Collection', description: 'Gather required information and evidence', type: 'EXECUTION', daysFromStart: 3 },
    { name: 'Analysis', description: 'Analyze collected data and identify findings', type: 'ANALYSIS', daysFromStart: 7 },
    { name: 'Reporting', description: 'Prepare assessment report', type: 'REPORTING', daysFromStart: 14 },
    { name: 'Review', description: 'Review and validate findings', type: 'REVIEW', daysFromStart: 16 },
    { name: 'Closure', description: 'Finalize assessment and document lessons learned', type: 'CLOSURE', daysFromStart: 18 },
  ];

  switch (assessmentType) {
    case 'RISK_ASSESSMENT':
      return [
        ...baseSteps,
        { name: 'Risk Identification', description: 'Identify and catalog risks', type: 'EXECUTION', daysFromStart: 5 },
        { name: 'Risk Analysis', description: 'Assess likelihood and impact', type: 'ANALYSIS', daysFromStart: 9 },
      ];
    case 'CONTROL_ASSESSMENT':
      return [
        ...baseSteps,
        { name: 'Control Testing', description: 'Test control effectiveness', type: 'EXECUTION', daysFromStart: 5 },
        { name: 'Gap Analysis', description: 'Identify control gaps', type: 'ANALYSIS', daysFromStart: 10 },
      ];
    case 'COMPLIANCE_ASSESSMENT':
      return [
        ...baseSteps,
        { name: 'Compliance Mapping', description: 'Map requirements to controls', type: 'PLANNING', daysFromStart: 2 },
        { name: 'Evidence Collection', description: 'Collect compliance evidence', type: 'EXECUTION', daysFromStart: 6 },
      ];
    default:
      return baseSteps;
  }
} 