import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { db } from '@/lib/db';
import { z } from 'zod';

const CreateControlSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['PREVENTIVE', 'DETECTIVE', 'CORRECTIVE']),
  frequency: z.enum(['CONTINUOUS', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY']),
  effectiveness: z.number().min(0).max(100).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'UNDER_REVIEW']).optional(),
  category: z.enum(['OPERATIONAL', 'FINANCIAL', 'COMPLIANCE', 'IT']).optional(),
  automationLevel: z.enum(['MANUAL', 'SEMI_AUTOMATED', 'AUTOMATED']).optional()
});

export const GET = withApiMiddleware(
  async (req: NextRequest) => {
    const user = (req as any).user;
    
    if (!user || !user.organizationId) {
      console.warn('[Controls API] Missing user or organizationId', { user });
      return NextResponse.json(
        { success: false, error: 'Organization context required' },
        { status: 403 }
      );
    }

    try {
      console.log('[Controls API] Fetching controls for organization:', user.organizationId);
      
      // Parse pagination parameters from query string
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '50');
      const offset = (page - 1) * limit;
      
      // Get total count for pagination
      const totalCount = await db.client.control.count({
        where: { organizationId: user.organizationId }
      });
      
      // Start with a simple query first
      const controls = await db.client.control.findMany({
        where: { organizationId: user.organizationId },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      });

      console.log(`[Controls API] Found ${controls.length} controls (page ${page}, total: ${totalCount})`);

      // If no controls found, return empty array with pagination info
      if (!controls || controls.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
          message: 'No controls found',
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit)
          }
        });
      }

      // Try to include relationships if we have controls
      try {
        const controlsWithRelations = await db.client.control.findMany({
          where: { organizationId: user.organizationId },
          include: {
            risks: {
              include: {
                risk: true
              }
            },
            assignedUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
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
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit
        });

        return NextResponse.json({
          success: true,
          data: controlsWithRelations,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit)
          }
        });
      } catch (relationError) {
        console.warn('[Controls API] Error fetching relationships, returning basic data:', relationError);
        // If relationships fail, return basic control data with pagination
        return NextResponse.json({
          success: true,
          data: controls,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit)
          }
        });
      }
    } catch (error) {
      console.error('[Controls API] Critical error:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        organizationId: user.organizationId
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch controls',
          details: error instanceof Error ? error.message : 'Unknown error'
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
      console.warn('[Controls API] Missing user or organizationId in POST', { user });
      return NextResponse.json(
        { success: false, error: 'Organization context required' },
        { status: 403 }
      );
    }

    try {
      const body = await req.json();
      console.log('[Controls API] Creating control with data:', body);
      
      const validatedData = CreateControlSchema.parse(body);
      
      // Map the incoming data to match the schema
      const controlData = {
        title: validatedData.title,
        description: validatedData.description || '',
        type: validatedData.type,
        frequency: validatedData.frequency,
        effectiveness: validatedData.effectiveness || 0,
        status: validatedData.status || 'ACTIVE',
        category: validatedData.category || 'OPERATIONAL',
        automationLevel: validatedData.automationLevel || 'MANUAL',
        organizationId: user.organizationId,
        owner: user.id,
        createdBy: user.id
      };

      console.log('[Controls API] Creating control with processed data:', controlData);

      const control = await db.client.control.create({
        data: controlData
      });

      console.log('[Controls API] Control created successfully:', control.id);

      return NextResponse.json({
        success: true,
        data: control
      }, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('[Controls API] Validation error:', error.errors);
        return NextResponse.json(
          { success: false, error: 'Validation failed', details: error.errors },
          { status: 400 }
        );
      }
      
      // Check for foreign key constraint errors
      if (error instanceof Error && error.message.includes('organizationId_fkey')) {
        console.error('[Controls API] Organization not found:', user.organizationId);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Organization not found',
            details: 'The organization does not exist in the database. Please ensure your organization is properly set up.',
            hint: process.env.NODE_ENV === 'development' ? 'In development mode, you may need to seed the database with test organizations.' : undefined
          },
          { status: 404 }
        );
      }
      
      console.error('[Controls API] Create control error:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        user: { id: user.id, organizationId: user.organizationId }
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create control',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  },
  { 
    requireAuth: true
  }
);
