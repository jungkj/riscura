import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { db } from '@/lib/db';
import { getDemoData, isDemoUser } from '@/lib/demo-data';

export const GET = withApiMiddleware(
  async (req: NextRequest) => {
    const user = (req as any).user;
    
    console.log('[Dashboard API] User object received:', {
      user: user ? {
        id: user.id,
        email: user.email,
        organizationId: user.organizationId,
        role: user.role
      } : null,
      isDemoUserResult: user ? isDemoUser(user.id) : false
    });
    
    if (!user || !user.organizationId) {
      console.log('[Dashboard API] Missing user or organizationId');
      return NextResponse.json(
        { success: false, error: 'Organization context required' },
        { status: 403 }
      );
    }

    // Check if this is a demo user
    if (isDemoUser(user.id) || user.organizationId === 'demo-org-id') {
      console.log('[Dashboard API] Serving demo data for demo user');
      const demoMetrics = getDemoData('metrics', user.organizationId);
      const demoOrganization = getDemoData('organization', user.organizationId);
      const demoAuditLogs = getDemoData('audit', user.organizationId);
      
      // Transform audit logs into recent activity format
      const recentActivity = demoAuditLogs ? demoAuditLogs.slice(0, 10).map((log: any, index: number) => ({
        id: index + 1,
        action: log.details || log.action,
        description: log.details || `${log.action} - ${log.resource}`,
        user: log.userName || 'Demo User',
        time: log.timestamp || 'Recently',
        type: log.result === 'SUCCESS' ? 'success' : 'info',
        priority: index < 2 ? 'high' : index < 5 ? 'medium' : 'low',
        status: 'Active',
        module: log.resource || 'Risk Management'
      })) : [];
      
      const dashboardData = {
        metrics: demoMetrics,
        recentActivity: recentActivity,
        user: {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          organization: user.organizationId
        },
        organization: demoOrganization,
        demoMode: true
      };

      console.log('[Dashboard API] Demo data response:', {
        metricsKeys: demoMetrics ? Object.keys(demoMetrics) : null,
        recentActivityCount: recentActivity.length,
        organizationName: demoOrganization?.name
      });

      return NextResponse.json({
        success: true,
        data: dashboardData
      });
    }

    try {
      // Get dashboard data
      const [
        riskCount,
        controlCount,
        openTaskCount,
        complianceScore
      ] = await Promise.all([
        db.client.risk.count({
          where: { organizationId: user.organizationId }
        }),
        db.client.control.count({
          where: { organizationId: user.organizationId }
        }),
        db.client.task.count({
          where: {
            organizationId: user.organizationId,
            status: { not: 'COMPLETED' }
          }
        }),
        // Simplified compliance score
        db.client.control.aggregate({
          where: {
            organizationId: user.organizationId,
            effectiveness: { gt: 0 }
          },
          _avg: { effectiveness: true }
        })
      ]);

      const dashboardData = {
        metrics: {
          totalRisks: riskCount,
          totalControls: controlCount,
          openTasks: openTaskCount,
          complianceScore: Math.round((complianceScore._avg?.effectiveness || 0) * 100)
        },
        user: {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          organization: user.organizationId
        }
      };

      return NextResponse.json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      console.error('Dashboard API error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch dashboard data',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  },
  { requireAuth: true }
);
