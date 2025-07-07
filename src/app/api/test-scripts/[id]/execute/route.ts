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
export const POST = withApiMiddleware(
  async (
    req: NextRequest,
    { params }: { params: { id: string } }
  ) => {
    const user = (req as any).user;
  const { id: testScriptId } = params;
  
  // Parse and validate request body
  const body = await req.json();
  const validationResult = executeTestSchema.safeParse(body);
  
  if (!validationResult.success) {
    return ApiResponseFormatter.error(
      'Invalid request data',
      400,
      'VALIDATION_ERROR',
      formatValidationErrors(validationResult.error)
    );
  }
  
  const data = validationResult.data as ExecuteTestRequest;
  
  // Verify test script exists and is associated with the control
  const testScript = await db.testScript.findFirst({
    where: {
      id: testScriptId,
      organizationId: user.organizationId
    },
    include: {
      controls: {
        where: { controlId: data.controlId }
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
  
  if (testScript.controls.length === 0) {
    return ApiResponseFormatter.error(
      'Test script is not associated with the specified control',
      400,
      'NOT_ASSOCIATED'
    );
  }
  
  // Verify control exists
  const control = await db.control.findFirst({
    where: {
      id: data.controlId,
      organizationId: user.organizationId
    }
  });
  
  if (!control) {
    return ApiResponseFormatter.error(
      'Control not found',
      404,
      'CONTROL_NOT_FOUND'
    );
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
  const testExecution = await db.testExecution.create({
    data: {
      testScriptId,
      controlId: data.controlId,
      executedBy: user.id,
      status: overallStatus,
      results: data.results,
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
  await db.control.update({
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
  await db.activity.create({
    data: {
      type: 'TEST_EXECUTED',
      userId: user.id,
      organizationId: user.organizationId,
      entityType: 'TEST_EXECUTION',
      entityId: testExecution.id,
      description: `Executed test script: ${testScript.title}`,
      metadata: {
        testScriptId,
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
    'Test executed successfully',
    {
      status: overallStatus,
      summary: {
        passed: passedSteps,
        failed: failedSteps,
        total: totalSteps
      }
    },
    201
  );
},
  { requireAuth: true }
);