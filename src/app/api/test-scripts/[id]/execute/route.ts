import { NextRequest } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { db } from '@/lib/db';
import { 
  ApiResponseFormatter,
  formatValidationErrors 
} from '@/lib/api/response-formatter';
import { z } from 'zod';
import { TestStatus, ExecuteTestRequest } from '@/types/rcsa.types';

// Validation schema for test execution
const executeTestSchema = z.object({
  controlId: z.string(),
  results: z.array(z.object({
    stepId: z.string(),
    status: z.enum(['passed', 'failed', 'skipped', 'not_applicable']),
    actualResult: z.string(),
    notes: z.string().optional(),
    evidence: z.array(z.string()).optional()
  })).min(1),
  evidence: z.array(z.string()).optional(),
  notes: z.string().optional(),
  duration: z.number().min(0).optional()
});

// POST /api/test-scripts/[id]/execute - Execute a test script
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiMiddleware(
    async (request: NextRequest) => {
      const { id } = await params;
      const user = (request as any).user;
    
  
  // Parse and validate request body
  const body = await request.json();
  const validationResult = executeTestSchema.safeParse(body);
  
  if (!validationResult.success) {
    return ApiResponseFormatter.error('VALIDATION_ERROR', 'Invalid request data', { status: 400, details: formatValidationErrors(validationResult.error.errors) });
  }
  
  const data = validationResult.data as ExecuteTestRequest;
  
  // Verify test script exists and is associated with the control
  const testScript = await db.client.testScript.findFirst({
    where: {
      id,
      organizationId: user.organizationId
    },
    include: {
      controls: {
        where: { controlId: data.controlId }
      }
    }
  });
  
  if (!testScript) {
    return ApiResponseFormatter.error('NOT_FOUND', 'Test script not found', { status: 404 });
  }
  
  if (testScript.controls.length === 0) {
    return ApiResponseFormatter.error('NOT_ASSOCIATED', 'Test script is not associated with the specified control', { status: 400 });
  }
  
  // Verify control exists
  const control = await db.client.control.findFirst({
    where: {
      id: data.controlId,
      organizationId: user.organizationId
    }
  });
  
  if (!control) {
    return ApiResponseFormatter.error('CONTROL_NOT_FOUND', 'Control not found', { status: 404 });
  }
  
  // Determine overall test status based on results
  const failedSteps = data.results.filter(r => r.status === 'failed').length;
  const passedSteps = data.results.filter(r => r.status === 'passed').length;
  const totalSteps = data.results.length;
  
  let overallStatus: TestStatus;
  if (failedSteps === 0 && passedSteps === totalSteps) {
    overallStatus = TestStatus.PASSED;
  } else if (failedSteps === totalSteps) {
    overallStatus = TestStatus.FAILED;
  } else if (passedSteps > 0 || failedSteps > 0) {
    overallStatus = TestStatus.PARTIAL;
  } else {
    overallStatus = TestStatus.NOT_APPLICABLE;
  }
  
  // Create test execution record
  const testExecution = await db.client.testExecution.create({
    data: {
      testScriptId: id,
      controlId: data.controlId,
      executedBy: user.id,
      status: overallStatus,
      results: data.results as any,
      evidence: data.evidence || [],
      notes: data.notes,
      duration: data.duration
    },
    include: {
      testScript: {
        select: {
          id: true,
          title: true,
          testType: true
        }
      },
      executor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  });
  
  // Update control's last test date and results
  await db.client.control.update({
    where: { id: data.controlId },
    data: {
      lastTestDate: new Date(),
      testResults: `${overallStatus} - ${testScript.title}`,
      // Update effectiveness based on test results
      ...(overallStatus === TestStatus.PASSED && {
        effectiveness: Math.min(control.effectiveness + 0.1, 1.0)
      }),
      ...(overallStatus === TestStatus.FAILED && {
        effectiveness: Math.max(control.effectiveness - 0.2, 0)
      })
    }
  });
  
  // Log activity
  await db.client.activity.create({
    data: {
      type: 'COMPLETED',
      userId: user.id,
      organizationId: user.organizationId,
      entityType: 'DOCUMENT',
      entityId: testExecution.id,
      description: `Executed test script: ${testScript.title}`,
      metadata: {
        testScriptId: id,
        controlId: data.controlId,
        status: overallStatus,
        duration: data.duration,
        passedSteps,
        failedSteps,
        totalSteps
      }
    }
  });
  
  return ApiResponseFormatter.success(
    testExecution,
    {
      status: 201
    }
  );
    },
    { requireAuth: true }
  )(req);
}
