import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { db } from '@/lib/db';
import { z } from 'zod';
import { shouldServeDemoData } from '@/lib/demo/demo-mode';
import { getRCSADemoData } from '@/lib/demo-data-rcsa';

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

    // Check if this is a demo user
    if (shouldServeDemoData(user.id, user.organizationId)) {
      const { searchParams } = new URL(req.url);
      const query = GetAssessmentsQuerySchema.parse(Object.fromEntries(searchParams));
      
      const demoData = getRCSADemoData(user.organizationId);
      
      // Create demo assessments with real risk counts
      const demoAssessments = [
        {
          id: 'assessment-1',
          title: 'Annual Security Assessment',
          description: 'Comprehensive annual security risk assessment covering all critical business processes, systems, and third-party integrations.',
          status: 'IN_PROGRESS',
          type: 'SECURITY',
          progress: 65,
          dueDate: new Date('2025-02-15'),
          createdDate: new Date('2025-01-01'),
          assignedTo: user.id,
          assignedToName: `${user.firstName} ${user.lastName}`,
          priority: 'HIGH',
          riskCount: demoData.risks.filter(r => 
            r.category === 'OPERATIONAL' || r.riskLevel === 'HIGH' || r.riskLevel === 'CRITICAL'
          ).length, // Real count from demo data
          organizationId: user.organizationId,
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-08'),
          objectives: [
            'Identify and assess security vulnerabilities',
            'Evaluate current security controls effectiveness', 
            'Recommend improvements and remediation actions',
            'Ensure compliance with security frameworks'
          ]
        },
        {
          id: 'assessment-2',
          title: 'Compliance Risk Review',
          description: 'Quarterly compliance risk assessment focusing on regulatory requirements and adherence.',
          status: 'COMPLETED',
          type: 'COMPLIANCE',
          progress: 100,
          dueDate: new Date('2025-01-30'),
          createdDate: new Date('2024-10-01'),
          assignedTo: user.id,
          assignedToName: `${user.firstName} ${user.lastName}`,
          priority: 'MEDIUM',
          riskCount: demoData.risks.filter(r => r.category === 'COMPLIANCE').length,
          organizationId: user.organizationId,
          createdAt: new Date('2024-10-01'),
          updatedAt: new Date('2025-01-30'),
          objectives: [
            'Review compliance with regulatory frameworks',
            'Assess effectiveness of compliance controls',
            'Identify compliance gaps and violations',
            'Update compliance procedures'
          ]
        },
        {
          id: 'assessment-3',
          title: 'Third-Party Vendor Assessment',
          description: 'Assessment of risks associated with third-party vendors and service providers.',
          status: 'DRAFT',
          type: 'VENDOR',
          progress: 15,
          dueDate: new Date('2025-03-01'),
          createdDate: new Date('2024-12-15'),
          assignedTo: user.id,
          assignedToName: `${user.firstName} ${user.lastName}`,
          priority: 'HIGH',
          riskCount: demoData.risks.filter(r => 
            r.sourceOfRisk === 'Third Party Risk' || r.title.toLowerCase().includes('vendor')
          ).length,
          organizationId: user.organizationId,
          createdAt: new Date('2024-12-15'),
          updatedAt: new Date('2024-12-20'),
          objectives: [
            'Evaluate vendor risk management practices',
            'Assess contractual security requirements',
            'Review vendor access controls',
            'Validate business continuity plans'
          ]
        }
      ];

      const filtered = demoAssessments.filter(assessment => {
        if (query.status && assessment.status !== query.status) return false;
        if (query.type && assessment.type !== query.type) return false;
        return true;
      });

      const startIndex = (query.page - 1) * query.limit;
      const paginatedAssessments = filtered.slice(startIndex, startIndex + query.limit);

      return NextResponse.json({
        success: true,
        data: paginatedAssessments,
        pagination: {
          page: query.page,
          limit: query.limit,
          total: filtered.length,
          totalPages: Math.ceil(filtered.length / query.limit)
        },
        demoMode: true
      });
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
