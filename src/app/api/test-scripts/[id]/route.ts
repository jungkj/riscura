import { NextRequest } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { db } from '@/lib/db';
import { 
  ApiResponseFormatter,
  formatValidationErrors 
} from '@/lib/api/response-formatter';
import { z } from 'zod';
import { 
  TestScriptType, 
  TestFrequency,
  UpdateTestScriptRequest 
} from '@/types/rcsa.types';

// Validation schema for updates
const updateTestScriptSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  steps: z.array(z.object({
    id: z.string().optional(),
    order: z.number().min(1),
    description: z.string().min(1),
    expectedResult: z.string().min(1),
    dataRequired: z.string().optional(),
    notes: z.string().optional()
  })).min(1).optional(),
  expectedResults: z.string().min(1).optional(),
  testType: z.nativeEnum(TestScriptType).optional(),
  frequency: z.nativeEnum(TestFrequency).optional(),
  estimatedDuration: z.number().min(1).optional(),
  automationCapable: z.boolean().optional(),
  automationScript: z.string().optional(),
  tags: z.array(z.string()).optional()
});

// GET /api/test-scripts/[id] - Get a single test script
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiMiddleware(
    async (request: NextRequest) => {
      const { id } = await params;
      const user = (request as any).user;
        const testScript = await db.client.testScript.findFirst({
      where: {
        id,
        organizationId: user.organizationId
      },
      include: {
        controls: {
          include: {
            control: {
              include: {
                _count: {
                  select: {
                    risks: true
                  }
                }
              }
            }
          }
        },
        testExecutions: {
          orderBy: { executionDate: 'desc' },
          take: 10,
          include: {
            executor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        _count: {
          select: {
            testExecutions: true
          }
        }
      }
    });
    
    if (!testScript) {
      return ApiResponseFormatter.error('NOT_FOUND', 'Test script not found', { status: 404 });
    }
    
    return ApiResponseFormatter.success(testScript);
    },
    { requireAuth: true }
  )(req);
}

// PATCH /api/test-scripts/[id] - Update a test script
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiMiddleware(
    async (request: NextRequest) => {
      const { id } = await params;
      const user = (request as any).user;
      // Verify test script exists and belongs to organization
  const existingTestScript = await db.client.testScript.findFirst({
    where: {
      id,
      organizationId: user.organizationId
    }
  });
  
  if (!existingTestScript) {
    return ApiResponseFormatter.error('NOT_FOUND', 'Test script not found', { status: 404 });
  }
  
  // Parse and validate request body
  const body = await request.json();
  const validationResult = updateTestScriptSchema.safeParse(body);
  
  if (!validationResult.success) {
    return ApiResponseFormatter.error('VALIDATION_ERROR', 'Invalid request data', { status: 400, details: formatValidationErrors(validationResult.error.errors) });
  }
  
  const data = validationResult.data as UpdateTestScriptRequest;
  
  // Update test script
  const updatedTestScript = await db.client.testScript.update({
    where: { id },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.description && { description: data.description }),
      ...(data.steps && { steps: data.steps }),
      ...(data.expectedResults && { expectedResults: data.expectedResults }),
      ...(data.testType && { testType: data.testType }),
      ...(data.frequency && { frequency: data.frequency }),
      ...(data.estimatedDuration !== undefined && { estimatedDuration: data.estimatedDuration }),
      ...(data.automationCapable !== undefined && { automationCapable: data.automationCapable }),
      ...(data.automationScript !== undefined && { automationScript: data.automationScript }),
      ...(data.tags && { tags: data.tags })
    },
    include: {
      controls: {
        include: {
          control: {
            select: {
              id: true,
              title: true,
              type: true
            }
          }
        }
      },
      creator: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  });
  
  // Log activity
  await db.client.activity.create({
    data: {
      type: 'UPDATED',
      userId: user.id,
      organizationId: user.organizationId,
      entityType: 'DOCUMENT',
      entityId: id,
      description: `Updated test script: ${updatedTestScript.title}`,
      metadata: {
        testScriptId: id,
        changes: Object.keys(data)
      }
    }
  });
  
  return ApiResponseFormatter.success(updatedTestScript);
    },
    { requireAuth: true }
  )(req);
}

// DELETE /api/test-scripts/[id] - Delete a test script
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiMiddleware(
    async (request: NextRequest) => {
      const { id } = await params;
      const user = (request as any).user;
      // Verify test script exists and belongs to organization
  const testScript = await db.client.testScript.findFirst({
    where: {
      id,
      organizationId: user.organizationId
    },
    include: {
      _count: {
        select: {
          testExecutions: true,
          controls: true
        }
      }
    }
  });
  
  if (!testScript) {
    return ApiResponseFormatter.error('NOT_FOUND', 'Test script not found', { status: 404 });
  }
  
  // Check if test script is in use
  if (testScript._count.testExecutions > 0) {
    return ApiResponseFormatter.error('IN_USE', 'Cannot delete test script with existing executions', { status: 400, details: {
        executionCount: testScript._count.testExecutions,
        message: 'Archive the test script instead of deleting it'
      } });
  }
  
  // Delete test script (cascade will handle relationships)
  await db.client.testScript.delete({
    where: { id }
  });
  
  // Log activity
  await db.client.activity.create({
    data: {
      type: 'DELETED',
      userId: user.id,
      organizationId: user.organizationId,
      entityType: 'DOCUMENT',
      entityId: id,
      description: `Deleted test script: ${testScript.title}`,
      metadata: {
        testScriptId: id,
        title: testScript.title,
        controlCount: testScript._count.controls
      }
    }
  });
  
  return ApiResponseFormatter.success({ id });
    },
    { requireAuth: true }
  )(req);
}
