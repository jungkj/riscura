import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { db } from '@/lib/db';
import { z } from 'zod';
import { shouldServeDemoData } from '@/lib/demo/demo-mode';
import { getRCSADemoData } from '@/lib/demo-data-rcsa';

const GetAssessmentRisksQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
});

export const GET = withApiMiddleware(
  async (req: NextRequest, context: { params: { id: string } }) => {
    const user = (req as any).user;
    const assessmentId = context.params.id;
    
    if (!user || !user.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization context required' },
        { status: 403 }
      );
    }

    // Check if this is a demo user
    if (shouldServeDemoData(user.id, user.organizationId)) {
      const { searchParams } = new URL(req.url);
      const query = GetAssessmentRisksQuerySchema.parse(Object.fromEntries(searchParams));
      
      const demoData = getRCSADemoData(user.organizationId);
      
      // Return risks based on assessment type
      let assessmentRisks;
      if (assessmentId === 'assessment-1') {
        // Annual Security Assessment - operational, high, and critical risks
        assessmentRisks = demoData.risks.filter(r => 
          r.category === 'OPERATIONAL' || r.riskLevel === 'HIGH' || r.riskLevel === 'CRITICAL'
        );
      } else if (assessmentId === 'assessment-2') {
        // Compliance Risk Review - compliance risks
        assessmentRisks = demoData.risks.filter(r => r.category === 'COMPLIANCE');
      } else if (assessmentId === 'assessment-3') {
        // Third-Party Vendor Assessment - vendor-related risks
        assessmentRisks = demoData.risks.filter(r => 
          r.sourceOfRisk === 'Third Party Risk' || r.title.toLowerCase().includes('vendor')
        );
      } else {
        // Default to all high priority risks
        assessmentRisks = demoData.risks.filter(r => 
          r.riskLevel === 'HIGH' || r.riskLevel === 'CRITICAL'
        );
      }

      const startIndex = (query.page - 1) * query.limit;
      const paginatedRisks = assessmentRisks.slice(startIndex, startIndex + query.limit);

      return NextResponse.json({
        success: true,
        data: paginatedRisks,
        pagination: {
          page: query.page,
          limit: query.limit,
          total: assessmentRisks.length,
          totalPages: Math.ceil(assessmentRisks.length / query.limit)
        },
        demoMode: true
      });
    }

    try {
      const { searchParams } = new URL(req.url);
      const query = GetAssessmentRisksQuerySchema.parse(Object.fromEntries(searchParams));
      
      // First check if assessment exists and belongs to user's organization
      const assessment = await db.client.complianceAssessment?.findFirst({
        where: {
          id: assessmentId,
          organizationId: user.organizationId
        }
      });

      if (!assessment) {
        return NextResponse.json(
          { success: false, error: 'Assessment not found' },
          { status: 404 }
        );
      }

      // Get risks associated with the assessment
      const [risks, totalCount] = await Promise.all([
        db.client.risk.findMany({
          where: {
            organizationId: user.organizationId,
            assessments: {
              some: {
                assessmentId: assessmentId
              }
            }
          },
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
          orderBy: [
            { riskLevel: 'desc' },
            { riskScore: 'desc' },
            { createdAt: 'desc' }
          ],
          skip: (query.page - 1) * query.limit,
          take: query.limit
        }),
        db.client.risk.count({
          where: {
            organizationId: user.organizationId,
            assessments: {
              some: {
                assessmentId: assessmentId
              }
            }
          }
        })
      ]);

      return NextResponse.json({
        success: true,
        data: risks,
        pagination: {
          page: query.page,
          limit: query.limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / query.limit)
        }
      });
    } catch (error) {
      console.error('Assessment risks API error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch assessment risks',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  },
  { requireAuth: true }
);