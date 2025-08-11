import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { db } from '@/lib/db';
import { z } from 'zod';

const GetAssessmentsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  status: z.enum(['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  type: z.string().optional(),
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
      const { searchParams } = new URL(req.url);
      const query = GetAssessmentsQuerySchema.parse(Object.fromEntries(searchParams));
      
      const whereClause: any = {
        organizationId: user.organizationId
      };

      if (query.status) {
        whereClause.status = query.status;
      }
      
      if (query.type) {
        whereClause.type = query.type;
      }

      const [assessments, totalCount] = await Promise.all([
        db.client.complianceAssessment?.findMany({
          where: whereClause,
          include: {
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
            },
            _count: {
              select: {
                risks: true
              }
            }
          },
          orderBy: [
            { priority: 'desc' },
            { dueDate: 'asc' },
            { createdAt: 'desc' }
          ],
          skip: (query.page - 1) * query.limit,
          take: query.limit
        }) || [],
        db.client.complianceAssessment?.count({
          where: whereClause
        }) || 0
      ]);

      // Transform the data to match expected format
      const transformedAssessments = assessments.map((assessment: any) => ({
        ...assessment,
        riskCount: assessment._count?.risks || 0,
        assignedToName: assessment.assignedUser 
          ? `${assessment.assignedUser.firstName} ${assessment.assignedUser.lastName}`
          : null
      }));

      return NextResponse.json({
        success: true,
        data: transformedAssessments,
        pagination: {
          page: query.page,
          limit: query.limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / query.limit)
        }
      });
    } catch (error) {
      console.error('Assessments API error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch assessments',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  },
  { requireAuth: true }
);
