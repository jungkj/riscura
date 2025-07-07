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
      console.warn('[Risks API] Missing user or organizationId', { user });
      return NextResponse.json(
        { success: false, error: 'Organization context required' },
        { status: 403 }
      );
    }

    try {
      console.log('[Risks API] Fetching risks for organization:', user.organizationId);
      
      // Start with a simple query first
      const risks = await db.client.risk.findMany({
        where: { organizationId: user.organizationId },
        orderBy: { createdAt: 'desc' }
      });

      console.log(`[Risks API] Found ${risks.length} risks`);

      // If no risks found, return empty array
      if (!risks || risks.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
          message: 'No risks found'
        });
      }

      // Try to include relationships if we have risks
      try {
        const risksWithRelations = await db.client.risk.findMany({
          where: { organizationId: user.organizationId },
          include: {
            controls: {
              include: {
                control: true
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
          orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({
          success: true,
          data: risksWithRelations
        });
      } catch (relationError) {
        console.warn('[Risks API] Error fetching relationships, returning basic data:', relationError);
        // If relationships fail, return basic risk data
        return NextResponse.json({
          success: true,
          data: risks
        });
      }
    } catch (error) {
      console.error('[Risks API] Critical error:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        organizationId: user.organizationId
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch risks',
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
      console.warn('[Risks API] Missing user or organizationId in POST', { user });
      return NextResponse.json(
        { success: false, error: 'Organization context required' },
        { status: 403 }
      );
    }

    try {
      const body = await req.json();
      console.log('[Risks API] Creating risk with data:', body);
      
      const validatedData = CreateRiskSchema.parse(body);
      
      const riskScore = validatedData.likelihood * validatedData.impact;
      const riskLevel = calculateRiskLevel(riskScore);
      
      console.log('[Risks API] Calculated risk score:', riskScore, 'level:', riskLevel);

      const riskData = {
        title: validatedData.name, // Map name to title based on schema
        description: validatedData.description || '',
        category: validatedData.category as any, // Cast to enum
        likelihood: validatedData.likelihood,
        impact: validatedData.impact,
        riskScore,
        riskLevel: riskLevel as any, // Cast to enum
        status: (validatedData.status || 'IDENTIFIED') as any,
        organizationId: user.organizationId,
        createdBy: user.id,
        dateIdentified: new Date()
      };

      console.log('[Risks API] Creating risk with processed data:', riskData);

      const risk = await db.client.risk.create({
        data: riskData
      });

      console.log('[Risks API] Risk created successfully:', risk.id);

      return NextResponse.json({
        success: true,
        data: risk
      }, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('[Risks API] Validation error:', error.errors);
        return NextResponse.json(
          { success: false, error: 'Validation failed', details: error.errors },
          { status: 400 }
        );
      }
      
      // Check for foreign key constraint errors
      if (error instanceof Error && error.message.includes('organizationId_fkey')) {
        console.error('[Risks API] Organization not found:', user.organizationId);
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
      
      console.error('[Risks API] Create risk error:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        user: { id: user.id, organizationId: user.organizationId }
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create risk',
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

function calculateRiskLevel(score: number): string {
  if (score <= 5) return 'LOW';
  if (score <= 10) return 'MEDIUM';
  if (score <= 15) return 'HIGH';
  return 'CRITICAL';
}
