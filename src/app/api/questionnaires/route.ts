import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { db } from '@/lib/db';
import { z } from 'zod';
import { shouldServeDemoData } from '@/lib/demo/demo-mode';

const GetQuestionnairesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
  search: z.string().optional(),
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
      const query = GetQuestionnairesQuerySchema.parse(Object.fromEntries(searchParams));
      
      // Demo questionnaires with realistic data
      const demoQuestionnaires = [
        {
          id: 'questionnaire-1',
          title: 'ISO 27001 Security Assessment',
          description: 'Comprehensive security assessment questionnaire based on ISO 27001 standards covering all aspects of information security management.',
          status: 'ACTIVE',
          type: 'SECURITY',
          organizationId: user.organizationId,
          createdBy: user.id,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-12-01'),
          questions: [
            {
              id: 'q1',
              text: 'Does the organization have a documented information security policy?',
              type: 'multiple_choice',
              required: true,
              options: ['Yes', 'No', 'Partially']
            },
            {
              id: 'q2', 
              text: 'Describe your current access control mechanisms.',
              type: 'text',
              required: true
            },
            {
              id: 'q3',
              text: 'Rate the effectiveness of your incident response procedures.',
              type: 'rating',
              required: true,
              scale: 5
            }
          ],
          responseCount: 5,
          completionRate: 100,
          averageScore: 8.2
        },
        {
          id: 'questionnaire-2',
          title: 'GDPR Compliance Assessment',
          description: 'Data protection and privacy compliance questionnaire for GDPR requirements assessment.',
          status: 'ACTIVE', 
          type: 'COMPLIANCE',
          organizationId: user.organizationId,
          createdBy: user.id,
          createdAt: new Date('2024-03-01'),
          updatedAt: new Date('2024-11-15'),
          questions: [
            {
              id: 'q1',
              text: 'Does your organization have a Data Protection Officer (DPO)?',
              type: 'multiple_choice',
              required: true,
              options: ['Yes', 'No', 'Not Required']
            },
            {
              id: 'q2',
              text: 'Describe your data breach notification procedures.',
              type: 'text', 
              required: true
            }
          ],
          responseCount: 12,
          completionRate: 92,
          averageScore: 7.5
        },
        {
          id: 'questionnaire-3',
          title: 'Vendor Security Assessment',
          description: 'Security assessment questionnaire for third-party vendors and service providers.',
          status: 'DRAFT',
          type: 'VENDOR',
          organizationId: user.organizationId,
          createdBy: user.id,
          createdAt: new Date('2024-11-01'),
          updatedAt: new Date('2024-12-15'),
          questions: [
            {
              id: 'q1',
              text: 'What security certifications does your organization maintain?',
              type: 'multiple_choice',
              required: true,
              options: ['ISO 27001', 'SOC 2', 'PCI DSS', 'None', 'Other']
            }
          ],
          responseCount: 0,
          completionRate: 0,
          averageScore: null
        }
      ];

      const filtered = demoQuestionnaires.filter(q => {
        if (query.status && q.status !== query.status) return false;
        if (query.search && !q.title.toLowerCase().includes(query.search.toLowerCase()) && 
            !q.description.toLowerCase().includes(query.search.toLowerCase())) return false;
        return true;
      });

      const startIndex = (query.page - 1) * query.limit;
      const paginatedQuestionnaires = filtered.slice(startIndex, startIndex + query.limit);

      return NextResponse.json({
        success: true,
        data: paginatedQuestionnaires,
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
      const query = GetQuestionnairesQuerySchema.parse(Object.fromEntries(searchParams));
      
      const whereClause: any = {
        organizationId: user.organizationId
      };

      if (query.status) {
        whereClause.status = query.status;
      }
      
      if (query.search) {
        whereClause.OR = [
          { title: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } }
        ];
      }

      const [questionnaires, totalCount] = await Promise.all([
        db.client.questionnaire.findMany({
          where: whereClause,
          include: {
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
                responses: true
              }
            }
          },
          orderBy: [
            { createdAt: 'desc' }
          ],
          skip: (query.page - 1) * query.limit,
          take: query.limit
        }),
        db.client.questionnaire.count({
          where: whereClause
        })
      ]);

      // Calculate analytics for each questionnaire
      const questionnairesWithAnalytics = await Promise.all(
        questionnaires.map(async (questionnaire: any) => {
          const responses = await db.client.questionnaireResponse?.findMany({
            where: { questionnaireId: questionnaire.id }
          }) || [];

          const completedResponses = responses.filter((r: any) => r.status === 'COMPLETED');
          const completionRate = responses.length > 0 
            ? Math.round((completedResponses.length / responses.length) * 100) 
            : 0;

          // Calculate average score if responses have scores
          const responsesWithScores = completedResponses.filter((r: any) => r.score !== null);
          const averageScore = responsesWithScores.length > 0
            ? responsesWithScores.reduce((sum: number, r: any) => sum + (r.score || 0), 0) / responsesWithScores.length
            : null;

          return {
            ...questionnaire,
            responseCount: responses.length,
            completionRate,
            averageScore: averageScore ? Math.round(averageScore * 10) / 10 : null
          };
        })
      );

      return NextResponse.json({
        success: true,
        data: questionnairesWithAnalytics,
        pagination: {
          page: query.page,
          limit: query.limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / query.limit)
        }
      });
    } catch (error) {
      console.error('Questionnaires API error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch questionnaires',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  },
  { requireAuth: true }
);

// POST /api/questionnaires - Create new questionnaire (stub implementation)
export async function POST(request: NextRequest) {
  try {
    return NextResponse.json(
      { 
        error: 'Create questionnaire not implemented'
      },
      { status: 501 }
    );
  } catch (error) {
    console.error('Create questionnaire error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/questionnaires - Update questionnaire (stub implementation)
export async function PUT(request: NextRequest) {
  try {
    return NextResponse.json(
      { 
        error: 'Update questionnaire not implemented'
      },
      { status: 501 }
    );
  } catch (error) {
    console.error('Update questionnaire error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/questionnaires - Delete questionnaire (stub implementation)
export async function DELETE(request: NextRequest) {
  try {
    return NextResponse.json(
      { 
        error: 'Delete questionnaire not implemented'
      },
      { status: 501 }
    );
  } catch (error) {
    console.error('Delete questionnaire error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}