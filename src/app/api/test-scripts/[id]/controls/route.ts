import { NextRequest } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { db } from '@/lib/db';
import { 
  ApiResponseFormatter,
  formatValidationErrors 
} from '@/lib/api/response-formatter';
import { z } from 'zod';

// Validation schemas
const associateControlsSchema = z.object({
  controlIds: z.array(z.string()).min(1),
  isMandatory: z.boolean().optional().default(true)
});

const disassociateControlsSchema = z.object({
  controlIds: z.array(z.string()).min(1)
});

// GET /api/test-scripts/[id]/controls - Get controls associated with a test script
export const GET = withApiMiddleware(
  async (req: NextRequest, { params }: { params: { [key: string]: string } }) => {
    const user = (req as any).user;
    const { id } = params;
    
    // Verify test script exists
    const testScript = await db.testScript.findFirst({
      where: {
        id,
        organizationId: user.organizationId
      }
    });
    
    if (!testScript) {
      return ApiResponseFormatter.error(
        'Test script not found',
        404,
        'NOT_FOUND'
      );
    }
    
    // Get associated controls
    const controlAssociations = await db.controlTestScript.findMany({
      where: { testScriptId: id },
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
    });
    
    return ApiResponseFormatter.success(
      controlAssociations,
      'Associated controls retrieved successfully'
    );
  },
  { requireAuth: true }
);

// POST /api/test-scripts/[id]/controls - Associate controls with a test script
export const POST = withApiMiddleware(
  async (req: NextRequest, { params }: { params: { [key: string]: string } }) => {
    const user = (req as any).user;
    const { id } = params;
    
    // Verify test script exists
    const testScript = await db.testScript.findFirst({
      where: {
        id,
        organizationId: user.organizationId
      }
    });
    
    if (!testScript) {
      return ApiResponseFormatter.error(
        'Test script not found',
        404,
        'NOT_FOUND'
      );
    }
    
    // Parse and validate request body
    const body = await req.json();
    const validationResult = associateControlsSchema.safeParse(body);
    
    if (!validationResult.success) {
      return ApiResponseFormatter.error(
        'Invalid request data',
        400,
        'VALIDATION_ERROR',
        formatValidationErrors(validationResult.error)
      );
    }
    
    const { controlIds, isMandatory } = validationResult.data;
    
    // Verify all controls exist and belong to the organization
    const controls = await db.control.findMany({
      where: {
        id: { in: controlIds },
        organizationId: user.organizationId
      }
    });
    
    if (controls.length !== controlIds.length) {
      return ApiResponseFormatter.error(
        'One or more controls not found',
        400,
        'INVALID_CONTROLS'
      );
    }
    
    // Get existing associations to avoid duplicates
    const existingAssociations = await db.controlTestScript.findMany({
      where: {
        testScriptId: id,
        controlId: { in: controlIds }
      }
    });
    
    const existingControlIds = existingAssociations.map(a => a.controlId);
    const newControlIds = controlIds.filter(cId => !existingControlIds.includes(cId));
    
    // Create new associations
    if (newControlIds.length > 0) {
      await db.controlTestScript.createMany({
        data: newControlIds.map(controlId => ({
          testScriptId: id,
          controlId,
          isMandatory
        }))
      });
    }
    
    // Log activity
    await db.activity.create({
      data: {
        type: 'TEST_SCRIPT_CONTROLS_ASSOCIATED',
        userId: user.id,
        organizationId: user.organizationId,
        entityType: 'TEST_SCRIPT',
        entityId: id,
        description: `Associated ${newControlIds.length} controls with test script`,
        metadata: {
          testScriptId: id,
          controlIds: newControlIds,
          isMandatory
        }
      }
    });
    
    return ApiResponseFormatter.success(
      {
        associated: newControlIds.length,
        alreadyAssociated: existingControlIds.length
      },
      'Controls associated successfully'
    );
  },
  { requireAuth: true }
);

// DELETE /api/test-scripts/[id]/controls - Disassociate controls from a test script
export const DELETE = withApiMiddleware(
  async (req: NextRequest, { params }: { params: { [key: string]: string } }) => {
    const user = (req as any).user;
    const { id } = params;
    
    // Verify test script exists
    const testScript = await db.testScript.findFirst({
      where: {
        id,
        organizationId: user.organizationId
      }
    });
    
    if (!testScript) {
      return ApiResponseFormatter.error(
        'Test script not found',
        404,
        'NOT_FOUND'
      );
    }
    
    // Parse and validate request body
    const body = await req.json();
    const validationResult = disassociateControlsSchema.safeParse(body);
    
    if (!validationResult.success) {
      return ApiResponseFormatter.error(
        'Invalid request data',
        400,
        'VALIDATION_ERROR',
        formatValidationErrors(validationResult.error)
      );
    }
    
    const { controlIds } = validationResult.data;
    
    // Delete associations
    const result = await db.controlTestScript.deleteMany({
      where: {
        testScriptId: id,
        controlId: { in: controlIds }
      }
    });
    
    // Log activity
    await db.activity.create({
      data: {
        type: 'TEST_SCRIPT_CONTROLS_DISASSOCIATED',
        userId: user.id,
        organizationId: user.organizationId,
        entityType: 'TEST_SCRIPT',
        entityId: id,
        description: `Disassociated ${result.count} controls from test script`,
        metadata: {
          testScriptId: id,
          controlIds,
          removedCount: result.count
        }
      }
    });
    
    return ApiResponseFormatter.success(
      {
        removed: result.count
      },
      'Controls disassociated successfully'
    );
  },
  { requireAuth: true }
);