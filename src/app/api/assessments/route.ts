import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { db } from '@/lib/db';

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
      const assessments = await db.client.questionnaire.findMany({
        where: { organizationId: user.organizationId },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          responses: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return NextResponse.json({
        success: true,
        data: assessments
      });
    } catch (error) {
      console.error('Get assessments error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch assessments' },
        { status: 500 }
      );
    }
  },
  { requireAuth: true }
);
