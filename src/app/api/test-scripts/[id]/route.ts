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
  { params }: { params: { [key: string]: string } }
) {
  return withApiMiddleware(async (req: NextRequest) => {
    const user = (req as any).user;
  const { id } = params;
  
  const testScript = await db.testScript.findFirst({
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
    return ApiResponseFormatter.error(
      'Test script not found',
      404,
      'NOT_FOUND'
    );
  }
  
  return ApiResponseFormatter.success(
    testScript,
    'Test script retrieved successfully'
  );
})(req);
},
  { requireAuth: true }
);

// PATCH /api/test-scripts/[id] - Update a test script
export async function PATCH(
  req: NextRequest,
  { params }: { params: { [key: string]: string } }
) {
  return withApiMiddleware(async (req: NextRequest) => {
    const user = (req as any).user;
  const { id } = params;
  
  // Verify test script exists and belongs to organization
  const existingTestScript = await db.testScript.findFirst({
    where: {
      id,
      organizationId: user.organizationId
    }
  });
  
  if (!existingTestScript) {
    return ApiResponseFormatter.error(
      'Test script not found',
      404,
      'NOT_FOUND'
    );
  }
  
  // Parse and validate request body
  const body = await req.json();
  const validationResult = updateTestScriptSchema.safeParse(body);
  
  if (!validationResult.success) {
    return ApiResponseFormatter.error(
      'Invalid request data',
      400,
      'VALIDATION_ERROR',
      formatValidationErrors(validationResult.error)
    );
  }
  
  const data = validationResult.data as UpdateTestScriptRequest;
  
  // Update test script
  const updatedTestScript = await db.testScript.update({
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
  await db.activity.create({
    data: {
      type: 'TEST_SCRIPT_UPDATED',
      userId: user.id,
      organizationId: user.organizationId,
      entityType: 'TEST_SCRIPT',
      entityId: id,
      description: `Updated test script: ${updatedTestScript.title}`,
      metadata: {
        testScriptId: id,
        changes: Object.keys(data)
      }
    }
  });
  
  return ApiResponseFormatter.success(
    updatedTestScript,
    'Test script updated successfully'
  );
})(req);
},
  { requireAuth: true }
);

// DELETE /api/test-scripts/[id] - Delete a test script
export async function DELETE(
  req: NextRequest,
  { params }: { params: { [key: string]: string } }
) {
  return withApiMiddleware(async (req: NextRequest) => {
    const user = (req as any).user;
  const { id } = params;
  
  // Verify test script exists and belongs to organization
  const testScript = await db.testScript.findFirst({
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
    return ApiResponseFormatter.error(
      'Test script not found',
      404,
      'NOT_FOUND'
    );
  }
  
  // Check if test script is in use
  if (testScript._count.testExecutions > 0) {
    return ApiResponseFormatter.error(
      'Cannot delete test script with existing executions',
      400,
      'IN_USE',
      {
        executionCount: testScript._count.testExecutions,
        message: 'Archive the test script instead of deleting it'
      }
    );
  }
  
  // Delete test script (cascade will handle relationships)
  await db.testScript.delete({
    where: { id }
  });
  
  // Log activity
  await db.activity.create({
    data: {
      type: 'TEST_SCRIPT_DELETED',
      userId: user.id,
      organizationId: user.organizationId,
      entityType: 'TEST_SCRIPT',
      entityId: id,
      description: `Deleted test script: ${testScript.title}`,
      metadata: {
        testScriptId: id,
        title: testScript.title,
        controlCount: testScript._count.controls
      }
    }
  });
  
  return ApiResponseFormatter.success(
    { id },
    'Test script deleted successfully'
  );
})(req);
},
  { requireAuth: true }
);