import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { db } from '@/lib/db';
import { z } from 'zod';

const CreateTestScriptSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  steps: z.array(z.object({
    stepNumber: z.number(),
    description: z.string(),
    expectedResult: z.string()
  })),
  tags: z.array(z.string()).optional()
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
      const testScripts = await db.client.testScript.findMany({
        where: { organizationId: user.organizationId },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          _count: {
            select: {
              testExecutions: true,
              controls: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return NextResponse.json({
        success: true,
        data: testScripts
      });
    } catch (error) {
      console.error('Get test scripts error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch test scripts' },
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
      const validatedData = CreateTestScriptSchema.parse(body);

      const testScript = await db.client.testScript.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          steps: validatedData.steps,
          tags: validatedData.tags || [],
          organizationId: user.organizationId,
          createdById: user.id,
          status: 'DRAFT'
        }
      });

      return NextResponse.json({
        success: true,
        data: testScript
      }, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { success: false, error: 'Validation failed', details: error.errors },
          { status: 400 }
        );
      }
      console.error('Create test script error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create test script' },
        { status: 500 }
      );
    }
  },
  { 
    requireAuth: true,
    validateBody: CreateTestScriptSchema 
  }
);
