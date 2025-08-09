import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { db } from '@/lib/db';
import { z } from 'zod';
import { shouldServeDemoData } from '@/lib/demo/demo-mode';

const GetReportingMetricsQuerySchema = z.object({
  timeRange: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
  category: z.enum(['risk', 'compliance', 'controls', 'all']).default('all'),
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
      const query = GetReportingMetricsQuerySchema.parse(Object.fromEntries(searchParams));
      
      // Demo reporting metrics with realistic time series data
      const demoMetrics = {
        riskTrendData: [
          { date: '2024-01-01', critical: 2, high: 5, medium: 12, low: 8 },
          { date: '2024-01-08', critical: 1, high: 6, medium: 14, low: 9 },
          { date: '2024-01-15', critical: 3, high: 4, medium: 13, low: 10 },
          { date: '2024-01-22', critical: 2, high: 7, medium: 11, low: 12 },
          { date: '2024-01-29', critical: 1, high: 5, medium: 15, low: 11 },
          { date: '2024-02-05', critical: 2, high: 6, medium: 12, low: 13 },
          { date: '2024-02-12', critical: 1, high: 4, medium: 16, low: 14 },
        ],
        riskCategoryData: [
          { category: 'Technology', count: 23, percentage: 30.7 },
          { category: 'Operational', count: 18, percentage: 24.0 },
          { category: 'Financial', count: 12, percentage: 16.0 },
          { category: 'Compliance', count: 10, percentage: 13.3 },
          { category: 'Strategic', count: 8, percentage: 10.7 },
          { category: 'Reputational', count: 4, percentage: 5.3 },
        ],
        controlEffectivenessData: [
          { date: '2024-01-01', effective: 65, needs_improvement: 28, ineffective: 7 },
          { date: '2024-01-08', effective: 67, needs_improvement: 26, ineffective: 7 },
          { date: '2024-01-15', effective: 69, needs_improvement: 25, ineffective: 6 },
          { date: '2024-01-22', effective: 71, needs_improvement: 23, ineffective: 6 },
          { date: '2024-01-29', effective: 73, needs_improvement: 22, ineffective: 5 },
          { date: '2024-02-05', effective: 75, needs_improvement: 20, ineffective: 5 },
          { date: '2024-02-12', effective: 77, needs_improvement: 19, ineffective: 4 },
        ],
        complianceTrendData: [
          { date: '2024-01-01', compliant: 85, non_compliant: 12, pending: 3 },
          { date: '2024-01-08', compliant: 87, non_compliant: 10, pending: 3 },
          { date: '2024-01-15', compliant: 88, non_compliant: 9, pending: 3 },
          { date: '2024-01-22', compliant: 90, non_compliant: 8, pending: 2 },
          { date: '2024-01-29', compliant: 91, non_compliant: 7, pending: 2 },
          { date: '2024-02-05', compliant: 93, non_compliant: 6, pending: 1 },
          { date: '2024-02-12', compliant: 94, non_compliant: 5, pending: 1 },
        ],
        summary: {
          totalRisks: 75,
          criticalRisks: 2,
          highRisks: 6,
          totalControls: 100,
          effectiveControls: 77,
          complianceRate: 94,
          trendsAnalysis: {
            riskTrend: 'decreasing',
            controlEffectiveness: 'improving',
            complianceScore: 'improving'
          }
        },
        lastUpdated: new Date().toISOString()
      };

      return NextResponse.json({
        success: true,
        data: demoMetrics,
        demoMode: true
      });
    }

    try {
      const { searchParams } = new URL(req.url);
      const query = GetReportingMetricsQuerySchema.parse(Object.fromEntries(searchParams));
      
      // Calculate date range
      const now = new Date();
      const daysBack = query.timeRange === '7d' ? 7 : query.timeRange === '30d' ? 30 : query.timeRange === '90d' ? 90 : 365;
      const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

      // Get metrics from database
      const whereClause: any = {
        organizationId: user.organizationId,
        createdAt: {
          gte: startDate
        }
      };

      // Get risk trends
      const risks = await db.client.risk?.findMany({
        where: whereClause,
        select: {
          id: true,
          riskLevel: true,
          category: true,
          createdAt: true
        }
      }) || [];

      // Get control effectiveness
      const controls = await db.client.control?.findMany({
        where: {
          organizationId: user.organizationId
        },
        select: {
          id: true,
          effectiveness: true,
          lastTestDate: true
        }
      }) || [];

      // Get compliance data
      const assessments = await db.client.assessment?.findMany({
        where: {
          organizationId: user.organizationId
        },
        select: {
          id: true,
          status: true,
          progress: true,
          createdAt: true
        }
      }) || [];

      // Process data for charts
      const riskTrendData = [];
      const riskCategoryData = [];
      const controlEffectivenessData = [];
      const complianceTrendData = [];

      // Build time series data (simplified for now)
      for (let i = 0; i < daysBack; i += Math.floor(daysBack / 7)) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        
        riskTrendData.push({
          date: dateStr,
          critical: risks.filter(r => r.riskLevel === 'CRITICAL').length,
          high: risks.filter(r => r.riskLevel === 'HIGH').length,
          medium: risks.filter(r => r.riskLevel === 'MEDIUM').length,
          low: risks.filter(r => r.riskLevel === 'LOW').length,
        });
      }

      // Calculate risk categories
      const categories = risks.reduce((acc: any, risk) => {
        acc[risk.category] = (acc[risk.category] || 0) + 1;
        return acc;
      }, {});

      const total = Object.values(categories).reduce((sum: number, count: any) => sum + count, 0);
      Object.entries(categories).forEach(([category, count]: [string, any]) => {
        riskCategoryData.push({
          category,
          count,
          percentage: total > 0 ? Math.round((count / total) * 100 * 10) / 10 : 0
        });
      });

      // Calculate control effectiveness over time
      const effectiveControls = controls.filter(c => c.effectiveness === 'EFFECTIVE').length;
      const needsImprovementControls = controls.filter(c => c.effectiveness === 'NEEDS_IMPROVEMENT').length;
      const ineffectiveControls = controls.filter(c => c.effectiveness === 'INEFFECTIVE').length;

      controlEffectivenessData.push({
        date: now.toISOString().split('T')[0],
        effective: effectiveControls,
        needs_improvement: needsImprovementControls,
        ineffective: ineffectiveControls
      });

      // Calculate compliance trends
      const compliantAssessments = assessments.filter(a => a.status === 'COMPLETED').length;
      const nonCompliantAssessments = assessments.filter(a => a.status === 'FAILED').length;
      const pendingAssessments = assessments.filter(a => a.status === 'IN_PROGRESS' || a.status === 'DRAFT').length;

      complianceTrendData.push({
        date: now.toISOString().split('T')[0],
        compliant: compliantAssessments,
        non_compliant: nonCompliantAssessments,
        pending: pendingAssessments
      });

      const metrics = {
        riskTrendData,
        riskCategoryData,
        controlEffectivenessData,
        complianceTrendData,
        summary: {
          totalRisks: risks.length,
          criticalRisks: risks.filter(r => r.riskLevel === 'CRITICAL').length,
          highRisks: risks.filter(r => r.riskLevel === 'HIGH').length,
          totalControls: controls.length,
          effectiveControls,
          complianceRate: assessments.length > 0 ? Math.round((compliantAssessments / assessments.length) * 100) : 0,
          trendsAnalysis: {
            riskTrend: risks.length > 0 ? 'stable' : 'none',
            controlEffectiveness: effectiveControls > controls.length / 2 ? 'good' : 'needs_improvement',
            complianceScore: compliantAssessments > assessments.length / 2 ? 'good' : 'needs_improvement'
          }
        },
        lastUpdated: new Date().toISOString()
      };

      return NextResponse.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      console.error('Reporting metrics API error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch reporting metrics',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  },
  { requireAuth: true }
);