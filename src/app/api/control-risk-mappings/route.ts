import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { db } from '@/lib/db';
import { z } from 'zod';

const CreateMappingSchema = z.object({
  riskId: z.string(),
  controlId: z.string(),
  effectiveness: z.number().min(0).max(100).optional()
});

export const GET = withApiMiddleware(
  async (req: NextRequest) => {
    const user = (req as any).user;
    
    if (!user || !user.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization context required' },
        { status: 403 }
      );
    }

    try {
      // Get all control-risk mappings for the organization
      const mappings = await db.client.controlRiskMapping.findMany({
        where: {
          risk: {
            organizationId: user.organizationId
          }
        },
        include: {
          risk: {
            select: {
              id: true,
              name: true,
              category: true,
              riskLevel: true
            }
          },
          control: {
            select: {
              id: true,
              name: true,
              type: true,
              effectiveness: true
            }
          }
        }
      });

      return NextResponse.json({
        success: true,
        data: mappings
      });
    } catch (error) {
      console.error('Get control-risk mappings error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch control-risk mappings' },
        { status: 500 }
      );
    }
  },
  { requireAuth: true }
);

export const POST = withApiMiddleware(
  async (req: NextRequest) => {
    const user = (req as any).user;
    
    if (!user || !user.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization context required' },
        { status: 403 }
      );
    }

    try {
      const body = await req.json();
      const validatedData = CreateMappingSchema.parse(body);

      // Verify the risk and control belong to the organization
      const [risk, control] = await Promise.all([
        db.client.risk.findFirst({
          where: {
            id: validatedData.riskId,
            organizationId: user.organizationId
          }
        }),
        db.client.control.findFirst({
          where: {
            id: validatedData.controlId,
            organizationId: user.organizationId
          }
        })
      ]);

      if (!risk || !control) {
        return NextResponse.json(
          { success: false, error: 'Risk or control not found' },
          { status: 404 }
        );
      }

      // Check if mapping already exists
      const existingMapping = await db.client.controlRiskMapping.findUnique({
        where: {
          riskId_controlId: {
            riskId: validatedData.riskId,
            controlId: validatedData.controlId
          }
        }
      });

      if (existingMapping) {
        return NextResponse.json(
          { success: false, error: 'Mapping already exists' },
          { status: 409 }
        );
      }

      // Create the mapping
      const mapping = await db.client.controlRiskMapping.create({
        data: {
          riskId: validatedData.riskId,
          controlId: validatedData.controlId,
          effectiveness: validatedData.effectiveness
        },
        include: {
          risk: true,
          control: true
        }
      });

      return NextResponse.json({
        success: true,
        data: mapping
      }, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { success: false, error: 'Validation failed', details: error.errors },
          { status: 400 }
        );
      }
      console.error('Create control-risk mapping error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create control-risk mapping' },
        { status: 500 }
      );
    }
  },
  { 
    requireAuth: true,
    validateBody: CreateMappingSchema 
  }
);

export const DELETE = withApiMiddleware(
  async (req: NextRequest) => {
    const user = (req as any).user;
    
    if (!user || !user.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization context required' },
        { status: 403 }
      );
    }

    try {
      const { searchParams } = new URL(req.url);
      const riskId = searchParams.get('riskId');
      const controlId = searchParams.get('controlId');

      if (!riskId || !controlId) {
        return NextResponse.json(
          { success: false, error: 'Both riskId and controlId are required' },
          { status: 400 }
        );
      }

      // Verify the mapping exists and belongs to the organization
      const mapping = await db.client.controlRiskMapping.findFirst({
        where: {
          riskId,
          controlId,
          risk: {
            organizationId: user.organizationId
          }
        }
      });

      if (!mapping) {
        return NextResponse.json(
          { success: false, error: 'Mapping not found' },
          { status: 404 }
        );
      }

      // Delete the mapping
      await db.client.controlRiskMapping.delete({
        where: {
          riskId_controlId: {
            riskId,
            controlId
          }
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Mapping deleted successfully'
      });
    } catch (error) {
      console.error('Delete control-risk mapping error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete control-risk mapping' },
        { status: 500 }
      );
    }
  },
  { requireAuth: true }
);