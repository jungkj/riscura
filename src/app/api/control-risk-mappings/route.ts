import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { db } from '@/lib/db';
import { z } from 'zod';

const CreateMappingSchema = z.object({
  riskId: z.string(),
  controlId: z.string(),
  effectiveness: z.number().min(0).max(100).optional(),
});

export const GET = withApiMiddleware(
  async (req: NextRequest) => {
    const user = (req as any).user;

    if (!user || !user.organizationId) {
      // console.warn('[Mappings API] Missing user or organizationId', { user })
      return NextResponse.json(
        { success: false, error: 'Organization context required' },
        { status: 403 }
      );
    }

    try {
      // console.log(
      //   '[Mappings API] Fetching control-risk mappings for organization:',
      //   user.organizationId
      // )

      // First check if there are any risks or controls at all
      const [risksCount, controlsCount] = await Promise.all([
        db.client.risk.count({ where: { organizationId: user.organizationId } }),
        db.client.control.count({ where: { organizationId: user.organizationId } }),
      ]);

      // console.log(`[Mappings API] Found ${risksCount} risks and ${controlsCount} controls`)

      if (risksCount === 0 || controlsCount === 0) {
        return NextResponse.json({
          success: true,
          data: [],
          message: 'No mappings possible - missing risks or controls',
        });
      }

      // Get all control-risk mappings for the organization
      const mappings = await db.client.controlRiskMapping.findMany({
        where: {
          risk: {
            organizationId: user.organizationId,
          },
        },
      });

      // console.log(`[Mappings API] Found ${mappings.length} mappings`)

      if (!mappings || mappings.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
          message: 'No control-risk mappings found',
        });
      }

      // Try to include relationships
      try {
        const mappingsWithRelations = await db.client.controlRiskMapping.findMany({
          where: {
            risk: {
              organizationId: user.organizationId,
            },
          },
          include: {
            risk: {
              select: {
                id: true,
                title: true,
                category: true,
                riskLevel: true,
              },
            },
            control: {
              select: {
                id: true,
                title: true,
                type: true,
                effectiveness: true,
              },
            },
          },
        });

        return NextResponse.json({
          success: true,
          data: mappingsWithRelations,
        });
      } catch (relationError) {
        // console.warn(
        //   '[Mappings API] Error fetching relationships, returning basic data:',
        //   relationError
        // )
        return NextResponse.json({
          success: true,
          data: mappings,
        });
      }
    } catch (error) {
      // console.error('[Mappings API] Critical error:', {
      //   error,
      //   message: error instanceof Error ? error.message : 'Unknown error',
      //   stack: error instanceof Error ? error.stack : undefined,
      //   organizationId: user.organizationId,
      // })

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch control-risk mappings',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
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
      // console.warn('[Mappings API] Missing user or organizationId in POST', { user })
      return NextResponse.json(
        { success: false, error: 'Organization context required' },
        { status: 403 }
      );
    }

    try {
      const body = await req.json();
      // console.log('[Mappings API] Creating mapping with data:', body)

      const validatedData = CreateMappingSchema.parse(body);

      // Verify the risk and control belong to the organization
      // console.log('[Mappings API] Verifying risk and control ownership...')

      const [risk, control] = await Promise.all([
        db.client.risk.findFirst({
          where: {
            id: validatedData.riskId,
            organizationId: user.organizationId,
          },
        }),
        db.client.control.findFirst({
          where: {
            id: validatedData.controlId,
            organizationId: user.organizationId,
          },
        }),
      ]);

      // console.log('[Mappings API] Risk found:', !!risk, 'Control found:', !!control)

      if (!risk) {
        return NextResponse.json(
          {
            success: false,
            error: 'Risk not found',
            details: `Risk ${validatedData.riskId} not found in organization ${user.organizationId}`,
          },
          { status: 404 }
        );
      }

      if (!control) {
        return NextResponse.json(
          {
            success: false,
            error: 'Control not found',
            details: `Control ${validatedData.controlId} not found in organization ${user.organizationId}`,
          },
          { status: 404 }
        );
      }

      // Check if mapping already exists
      try {
        const existingMapping = await db.client.controlRiskMapping.findUnique({
          where: {
            riskId_controlId: {
              riskId: validatedData.riskId,
              controlId: validatedData.controlId,
            },
          },
        });

        if (existingMapping) {
          // console.log('[Mappings API] Mapping already exists:', existingMapping.id)
          return NextResponse.json(
            {
              success: false,
              error: 'Mapping already exists',
              details: `Mapping between risk ${validatedData.riskId} and control ${validatedData.controlId} already exists`,
            },
            { status: 409 }
          );
        }
      } catch (checkError) {
        // console.warn('[Mappings API] Error checking existing mapping:', checkError)
        // Continue with creation if check fails
      }

      // Create the mapping
      // console.log('[Mappings API] Creating new mapping...')

      const mappingData = {
        riskId: validatedData.riskId,
        controlId: validatedData.controlId,
        effectiveness: validatedData.effectiveness || 0,
      };

      const mapping = await db.client.controlRiskMapping.create({
        data: mappingData,
      });

      // console.log('[Mappings API] Mapping created successfully:', mapping.id)

      // Try to return with relationships
      try {
        const mappingWithRelations = await db.client.controlRiskMapping.findUnique({
          where: { id: mapping.id },
          include: {
            risk: true,
            control: true,
          },
        });

        return NextResponse.json(
          {
            success: true,
            data: mappingWithRelations || mapping,
          },
          { status: 201 }
        );
      } catch (relationError) {
        // console.warn('[Mappings API] Error fetching relations for new mapping:', relationError)
        return NextResponse.json(
          {
            success: true,
            data: mapping,
          },
          { status: 201 }
        );
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        // console.error('[Mappings API] Validation error:', error.errors)
        return NextResponse.json(
          { success: false, error: 'Validation failed', details: error.errors },
          { status: 400 }
        );
      }

      // console.error('[Mappings API] Create mapping error:', {
      //   error,
      //   message: error instanceof Error ? error.message : 'Unknown error',
      //   stack: error instanceof Error ? error.stack : undefined,
      //   user: { id: user.id, organizationId: user.organizationId },
      // })

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create control-risk mapping',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  },
  {
    requireAuth: true,
  }
);

export const DELETE = withApiMiddleware(
  async (req: NextRequest) => {
    const user = (req as any).user;

    if (!user || !user.organizationId) {
      // console.warn('[Mappings API] Missing user or organizationId in DELETE', { user })
      return NextResponse.json(
        { success: false, error: 'Organization context required' },
        { status: 403 }
      );
    }

    try {
      const { searchParams } = new URL(req.url);
      const riskId = searchParams.get('riskId');
      const controlId = searchParams.get('controlId');

      // console.log('[Mappings API] Deleting mapping:', { riskId, controlId })

      if (!riskId || !controlId) {
        return NextResponse.json(
          {
            success: false,
            error: 'Both riskId and controlId are required',
            details: { riskId: !!riskId, controlId: !!controlId },
          },
          { status: 400 }
        );
      }

      // Verify the mapping exists and belongs to the organization
      // console.log('[Mappings API] Verifying mapping ownership...')

      const mapping = await db.client.controlRiskMapping.findFirst({
        where: {
          riskId,
          controlId,
          risk: {
            organizationId: user.organizationId,
          },
        },
      });

      if (!mapping) {
        // console.warn('[Mappings API] Mapping not found:', {
        //   riskId,
        //   controlId,
        //   organizationId: user.organizationId,
        // })
        return NextResponse.json(
          {
            success: false,
            error: 'Mapping not found',
            details: `No mapping found between risk ${riskId} and control ${controlId}`,
          },
          { status: 404 }
        );
      }

      // console.log('[Mappings API] Deleting mapping:', mapping.id)

      // Delete the mapping
      await db.client.controlRiskMapping.delete({
        where: {
          riskId_controlId: {
            riskId,
            controlId,
          },
        },
      });

      // console.log('[Mappings API] Mapping deleted successfully')

      return NextResponse.json({
        success: true,
        message: 'Mapping deleted successfully',
        data: { riskId, controlId },
      });
    } catch (error) {
      // console.error('[Mappings API] Delete mapping error:', {
      //   error,
      //   message: error instanceof Error ? error.message : 'Unknown error',
      //   stack: error instanceof Error ? error.stack : undefined,
      //   user: { id: user.id, organizationId: user.organizationId },
      // })

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete control-risk mapping',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  },
  { requireAuth: true }
);
