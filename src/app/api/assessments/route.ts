import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { db } from '@/lib/db';

export const GET = withApiMiddleware(
  async (req: NextRequest) => {
    const user = (req as any).user;

    if (!user || !user.organizationId) {
      console.error('[Assessments API] Missing user or organizationId:', {
        hasUser: !!user,
        userId: user?.id,
        organizationId: user?.organizationId,
      });
      return NextResponse.json(
        { success: false, error: 'Organization context required' },
        { status: 403 }
      );
    }

    try {
      console.log('[Assessments API] Fetching assessments for organization:', user.organizationId);

      // Check if the organization exists
      const orgExists = await db.client.organization.findUnique({
        where: { id: user.organizationId },
      });

      if (!orgExists) {
        console.error('[Assessments API] Organization not found:', user.organizationId);
        // Return empty array instead of error for new organizations
        return NextResponse.json({
          success: true,
          data: [],
          message: 'No assessments found. Create your first assessment to get started.',
        });
      }

      const assessments = await db.client.questionnaire.findMany({
        where: { organizationId: user.organizationId },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          responses: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      console.log(`[Assessments API] Found ${assessments.length} assessments`);

      return NextResponse.json({
        success: true,
        data: assessments,
        message:
          assessments.length === 0
            ? 'No assessments found. Create your first assessment to get started.'
            : undefined,
      });
    } catch (error) {
      console.error('[Assessments API] Error:', error);

      // Return empty array for database errors to maintain UI functionality
      return NextResponse.json({
        success: true,
        data: [],
        message: 'Unable to load assessments at this time',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  },
  { requireAuth: true }
);
