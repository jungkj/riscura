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
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiMiddleware(
    async (request: NextRequest) => {
      const { id } = await params;
      const user = (request as any).user;
        // Verify test script exists
    const testScript = await db.client.testScript.findFirst({
      where: {
        id,
        organizationId: user.organizationId
      }
    });
    
    if (!testScript) {
      return ApiResponseFormatter.error('NOT_FOUND', 'Test script not found', { status: 404 });
    }
    
    // Get associated controls
    const controlAssociations = await db.client.controlTestScript.findMany({
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
    
    return ApiResponseFormatter.success(controlAssociations);
    },
    { requireAuth: true }
  )(req);
}

// POST /api/test-scripts/[id]/controls - Associate controls with a test script
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiMiddleware(
    async (request: NextRequest) => {
      const { id } = await params;
      const user = (request as any).user;
        // Verify test script exists
    const testScript = await db.client.testScript.findFirst({
      where: {
        id,
        organizationId: user.organizationId
      }
    });
    
    if (!testScript) {
      return ApiResponseFormatter.error('NOT_FOUND', 'Test script not found', { status: 404 });
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validationResult = associateControlsSchema.safeParse(body);
    
    if (!validationResult.success) {
      return ApiResponseFormatter.error('VALIDATION_ERROR', 'Invalid request data', { status: 400, details: formatValidationErrors(validationResult.error.errors) });
    }
    
    const { controlIds, isMandatory } = validationResult.data;
    
    // Verify all controls exist and belong to the organization
    const controls = await db.client.control.findMany({
      where: {
        id: { in: controlIds },
        organizationId: user.organizationId
      }
    });
    
    if (controls.length !== controlIds.length) {
      return ApiResponseFormatter.error('INVALID_CONTROLS', 'One or more controls not found', { status: 400 });
    }
    
    // Get existing associations to avoid duplicates
    const existingAssociations = await db.client.controlTestScript.findMany({
      where: {
        testScriptId: id,
        controlId: { in: controlIds }
      }
    });
    
    const existingControlIds = existingAssociations.map(a => a.controlId);
    const newControlIds = controlIds.filter(cId => !existingControlIds.includes(cId));
    
    // Create new associations
    if (newControlIds.length > 0) {
      await db.client.controlTestScript.createMany({
        data: newControlIds.map(controlId => ({
          testScriptId: id,
          controlId,
          isMandatory
        }))
      });
    }
    
    // Log activity
    await db.client.activity.create({
      data: {
        type: 'UPDATED',
        userId: user.id,
        organizationId: user.organizationId,
        entityType: 'DOCUMENT',
        entityId: id,
        description: `Associated ${newControlIds.length} controls with test script: ${testScript.title}`,
        metadata: {
          testScriptId: id,
          controlIds: newControlIds,
          isMandatory
        }
      }
    });
    
    return ApiResponseFormatter.success({
      associated: newControlIds.length,
      alreadyAssociated: existingControlIds.length,
      message: 'Controls associated successfully'
    });
    },
    { requireAuth: true }
  )(req);
}

// DELETE /api/test-scripts/[id]/controls - Disassociate controls from a test script
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiMiddleware(
    async (request: NextRequest) => {
      const { id } = await params;
      const user = (request as any).user;
        // Verify test script exists
    const testScript = await db.client.testScript.findFirst({
      where: {
        id,
        organizationId: user.organizationId
      }
    });
    
    if (!testScript) {
      return ApiResponseFormatter.error('NOT_FOUND', 'Test script not found', { status: 404 });
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validationResult = disassociateControlsSchema.safeParse(body);
    
    if (!validationResult.success) {
      return ApiResponseFormatter.error('VALIDATION_ERROR', 'Invalid request data', { status: 400, details: formatValidationErrors(validationResult.error.errors) });
    }
    
    const { controlIds } = validationResult.data;
    
    // Delete associations
    const result = await db.client.controlTestScript.deleteMany({
      where: {
        testScriptId: id,
        controlId: { in: controlIds }
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
        description: `Disassociated ${result.count} controls from test script: ${testScript.title}`,
        metadata: {
          testScriptId: id,
          controlIds,
          removedCount: result.count
        }
      }
    });
    
    return ApiResponseFormatter.success({
        removed: result.count
      });
    },
    { requireAuth: true }
  )(req);
}
