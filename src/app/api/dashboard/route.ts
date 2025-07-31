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
      // Get dashboard data
      const [riskCount, controlCount, openTaskCount, complianceScore] = await Promise.all([
        db.client.risk.count({
          where: { organizationId: user.organizationId },
        }),
        db.client.control.count({
          where: { organizationId: user.organizationId },
        }),
        db.client.task.count({
          where: {
            organizationId: user.organizationId,
            status: { not: 'COMPLETED' },
          },
        }),
        // Simplified compliance score
        db.client.control.aggregate({
          where: {
            organizationId: user.organizationId,
            effectiveness: { gt: 0 },
          },
          _avg: { effectiveness: true },
        }),
      ]);

      const dashboardData = {
        metrics: {
          totalRisks: riskCount,
          totalControls: controlCount,
          openTasks: openTaskCount,
          complianceScore: Math.round((complianceScore._avg?.effectiveness || 0) * 100),
        },
        user: {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          organization: user.organizationId,
        },
      };

      return NextResponse.json({
        success: true,
        data: dashboardData,
      });
    } catch (error) {
      console.error('Dashboard API error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch dashboard data',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  },
  { requireAuth: true }
);
