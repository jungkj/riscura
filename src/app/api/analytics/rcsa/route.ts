import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { db } from '@/lib/db';
import { AuthenticatedRequest } from '@/types/api';

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
      // Get RCSA analytics data
      const [
        totalRisks,
        totalControls,
        controlRiskMappings,
        risksByCategory,
        risksBySeverity,
        controlsByType,
        controlsByEffectiveness
      ] = await Promise.all([
        // Total counts
        db.client.risk.count({
          where: { organizationId: user.organizationId }
        }),
        db.client.control.count({
          where: { organizationId: user.organizationId }
        }),
        db.client.controlRiskMapping.count({
          where: {
            risk: { organizationId: user.organizationId }
          }
        }),
        
        // Risk distributions
        db.client.risk.groupBy({
          by: ['category'],
          where: { organizationId: user.organizationId },
          _count: { id: true }
        }),
        db.client.risk.groupBy({
          by: ['riskLevel'],
          where: { organizationId: user.organizationId },
          _count: { id: true }
        }),
        
        // Control distributions
        db.client.control.groupBy({
          by: ['type'],
          where: { organizationId: user.organizationId },
          _count: { id: true }
        }),
        db.client.control.groupBy({
          by: ['status'],
          where: { organizationId: user.organizationId },
          _count: { id: true }
        })
      ]);

      // Calculate coverage metrics
      const risksWithControls = await db.client.risk.count({
        where: {
          organizationId: user.organizationId,
          controls: {
            some: {}
          }
        }
      });

      const controlsWithRisks = await db.client.control.count({
        where: {
          organizationId: user.organizationId,
          risks: {
            some: {}
          }
        }
      });

      const analytics = {
        summary: {
          totalRisks,
          totalControls,
          totalMappings: controlRiskMappings,
          riskCoverage: totalRisks > 0 ? parseFloat((risksWithControls / totalRisks * 100).toFixed(1)) : 0,
          controlUtilization: totalControls > 0 ? parseFloat((controlsWithRisks / totalControls * 100).toFixed(1)) : 0
        },
        riskAnalysis: {
          byCategory: risksByCategory.map(item => ({
            category: item.category,
            count: item._count.id
          })),
          bySeverity: risksBySeverity.map(item => ({
            severity: item.riskLevel,
            count: item._count.id
          }))
        },
        controlAnalysis: {
          byType: controlsByType.map(item => ({
            type: item.type,
            count: item._count.id
          })),
          byEffectiveness: controlsByEffectiveness.map(item => ({
            status: item.status,
            count: item._count.id
          }))
        },
        trends: {
          // Placeholder for trend data - would need date-based queries
          riskTrend: [] as any[],
          controlTrend: [] as any[],
          mappingTrend: [] as any[]
        }
      };

      return NextResponse.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Get RCSA analytics error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch RCSA analytics' },
        { status: 500 }
      );
    }
  },
  { requireAuth: true }
);