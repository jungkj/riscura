import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { db } from '@/lib/db';
import { z } from 'zod';

const CreateControlSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['PREVENTIVE', 'DETECTIVE', 'CORRECTIVE']),
  frequency: z.enum(['CONTINUOUS', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY']),
  effectiveness: z.number().min(0).max(100).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'UNDER_REVIEW']).optional()
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
      const controls = await db.client.control.findMany({
        where: { organizationId: user.organizationId },
        include: {
          risks: true,
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return NextResponse.json({
        success: true,
        data: controls
      });
    } catch (error) {
      console.error('Get controls error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch controls' },
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
      const validatedData = CreateControlSchema.parse(body);

      const control = await db.client.control.create({
        data: {
          ...validatedData,
          organizationId: user.organizationId,
          ownerId: user.id,
          status: validatedData.status || 'ACTIVE'
        }
      });

      return NextResponse.json({
        success: true,
        data: control
      }, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { success: false, error: 'Validation failed', details: error.errors },
          { status: 400 }
        );
      }
      console.error('Create control error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create control' },
        { status: 500 }
      );
    }
  },
  { 
    requireAuth: true,
    validateBody: CreateControlSchema 
  }
);
