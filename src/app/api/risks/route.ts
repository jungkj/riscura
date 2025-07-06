import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { db } from '@/lib/db';
import { z } from 'zod';

const CreateRiskSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string(),
  likelihood: z.number().min(1).max(5),
  impact: z.number().min(1).max(5),
  status: z.enum(['IDENTIFIED', 'ASSESSED', 'MITIGATED', 'ACCEPTED', 'CLOSED']).optional()
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
      const risks = await db.client.risk.findMany({
        where: { organizationId: user.organizationId },
        include: {
          controls: true,
          createdBy: {
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
        data: risks
      });
    } catch (error) {
      console.error('Get risks error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch risks' },
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
      const validatedData = CreateRiskSchema.parse(body);

      const risk = await db.client.risk.create({
        data: {
          ...validatedData,
          organizationId: user.organizationId,
          createdById: user.id,
          riskScore: validatedData.likelihood * validatedData.impact,
          riskLevel: calculateRiskLevel(validatedData.likelihood * validatedData.impact)
        }
      });

      return NextResponse.json({
        success: true,
        data: risk
      }, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { success: false, error: 'Validation failed', details: error.errors },
          { status: 400 }
        );
      }
      console.error('Create risk error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create risk' },
        { status: 500 }
      );
    }
  },
  { 
    requireAuth: true,
    validateBody: CreateRiskSchema 
  }
);

function calculateRiskLevel(score: number): string {
  if (score <= 5) return 'LOW';
  if (score <= 10) return 'MEDIUM';
  if (score <= 15) return 'HIGH';
  return 'CRITICAL';
}
