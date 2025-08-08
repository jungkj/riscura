import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { db } from '@/lib/db';
import { z } from 'zod';
import { RiskCategory, RiskLevel, RiskStatus } from '@prisma/client';
import { getDemoData, isDemoUser } from '@/lib/demo-data';

const CreateRiskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.nativeEnum(RiskCategory),
  likelihood: z.number().min(1).max(5),
  impact: z.number().min(1).max(5),
  status: z.nativeEnum(RiskStatus).optional(),
  addToRCSA: z.boolean().optional() // Option to automatically add to RCSA
});

export const GET = withApiMiddleware(
  async (req: NextRequest) => {
    const user = (req as any).user;
    
    console.log('[Risks API] User object received:', {
      user: user ? {
        id: user.id,
        email: user.email,
        organizationId: user.organizationId,
        role: user.role
      } : null,
      isDemoUserResult: user ? isDemoUser(user.id) : false
    });
    
    if (!user || !user.organizationId) {
      console.warn('[Risks API] Missing user or organizationId', { user });
      return NextResponse.json(
        { success: false, error: 'Organization context required' },
        { status: 403 }
      );
    }

    // Check if this is a demo user
    if (isDemoUser(user.id)) {
      console.log('[Risks API] Serving demo data for demo user');
      const demoRisks = getDemoData('risks', user.organizationId);
      
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '50');
      const offset = (page - 1) * limit;
      
      const paginatedRisks = demoRisks?.slice(offset, offset + limit) || [];
      const totalCount = demoRisks?.length || 0;
      
      return NextResponse.json({
        success: true,
        data: paginatedRisks,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        },
        demoMode: true
      });
    }

    try {
      console.log('[Risks API] Fetching risks for organization:', user.organizationId);
      
      // Parse pagination parameters from query string
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '50');
      const offset = (page - 1) * limit;
      
      // Get total count for pagination
      const totalCount = await db.client.risk.count({
        where: { organizationId: user.organizationId }
      });
      
      // Start with a simple query first
      const risks = await db.client.risk.findMany({
        where: { organizationId: user.organizationId },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      });

      console.log(`[Risks API] Found ${risks.length} risks (page ${page}, total: ${totalCount})`);

      // If no risks found, return empty array with pagination info
      if (!risks || risks.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
          message: 'No risks found',
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit)
          }
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
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit
        });

        return NextResponse.json({
          success: true,
          data: risksWithRelations,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit)
          }
        });
      } catch (relationError) {
        console.warn('[Risks API] Error fetching relationships, returning basic data:', relationError);
        // If relationships fail, return basic risk data with pagination
        return NextResponse.json({
          success: true,
          data: risks,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit)
          }
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
        title: validatedData.title,
        description: validatedData.description || '',
        category: validatedData.category,
        likelihood: validatedData.likelihood,
        impact: validatedData.impact,
        riskScore,
        riskLevel: riskLevel as RiskLevel,
        status: validatedData.status || RiskStatus.IDENTIFIED,
        organizationId: user.organizationId,
        createdBy: user.id,
        dateIdentified: new Date(),
        metadata: validatedData.addToRCSA ? {
          includedInRCSA: true,
          lastRCSASync: new Date().toISOString()
        } : undefined
      };

      console.log('[Risks API] Creating risk with processed data:', riskData);

      const risk = await db.client.risk.create({
        data: riskData
      });

      console.log('[Risks API] Risk created successfully:', risk.id);
      
      // Create activity log if added to RCSA
      if (validatedData.addToRCSA) {
        await db.client.activity.create({
          data: {
            type: 'CREATED',
            entityType: 'RISK',
            entityId: risk.id,
            description: 'Risk created and added to RCSA',
            userId: user.id,
            organizationId: user.organizationId
          }
        });
      }

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

function calculateRiskLevel(score: number): RiskLevel {
  if (score <= 6) return RiskLevel.LOW;      // 1-6 (24% of range)
  if (score <= 12) return RiskLevel.MEDIUM;  // 7-12 (24% of range)
  if (score <= 20) return RiskLevel.HIGH;    // 13-20 (32% of range)
  return RiskLevel.CRITICAL;                 // 21-25 (20% of range)
}
