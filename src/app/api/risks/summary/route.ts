import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { db } from '@/lib/db';
import { shouldServeDemoData } from '@/lib/demo/demo-mode';
import { getRCSADemoData } from '@/lib/demo-data-rcsa';

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
      const demoData = getRCSADemoData(user.organizationId);
      
      // Calculate risk distribution for heatmap
      const heatmapData: Array<{impact: number, likelihood: number, count: number, risks: any[]}> = [];
      
      // Initialize 5x5 grid
      for (let impact = 1; impact <= 5; impact++) {
        for (let likelihood = 1; likelihood <= 5; likelihood++) {
          const cellRisks = demoData.risks.filter(r => 
            r.impact === impact && r.likelihood === likelihood
          );
          
          if (cellRisks.length > 0) {
            heatmapData.push({
              impact,
              likelihood, 
              count: cellRisks.length,
              risks: cellRisks.map(r => ({
                id: r.id,
                title: r.title,
                riskLevel: r.riskLevel,
                riskScore: r.riskScore,
                category: r.category,
                owner: r.owner
              }))
            });
          }
        }
      }

      const summary = {
        totalRisks: demoData.risks.length,
        riskLevelDistribution: {
          CRITICAL: demoData.risks.filter(r => r.riskLevel === 'CRITICAL').length,
          HIGH: demoData.risks.filter(r => r.riskLevel === 'HIGH').length,
          MEDIUM: demoData.risks.filter(r => r.riskLevel === 'MEDIUM').length,
          LOW: demoData.risks.filter(r => r.riskLevel === 'LOW').length,
        },
        categoryDistribution: {
          FINANCIAL: demoData.risks.filter(r => r.category === 'FINANCIAL').length,
          OPERATIONAL: demoData.risks.filter(r => r.category === 'OPERATIONAL').length,
          COMPLIANCE: demoData.risks.filter(r => r.category === 'COMPLIANCE').length,
          STRATEGIC: demoData.risks.filter(r => r.category === 'STRATEGIC').length,
          TECHNOLOGY: demoData.risks.filter(r => r.category === 'TECHNOLOGY').length,
        },
        heatmapData,
        averageRiskScore: Math.round(
          demoData.risks.reduce((sum, r) => sum + r.riskScore, 0) / demoData.risks.length
        ),
        materialRisks: demoData.risks.filter(r => r.materiality === 'Material').length
      };

      return NextResponse.json({
        success: true,
        data: summary,
        demoMode: true
      });
    }

    try {
      // Get risk summary from database
      const risks = await db.client.risk.findMany({
        where: { organizationId: user.organizationId },
        select: {
          id: true,
          title: true,
          impact: true,
          likelihood: true,
          riskScore: true,
          riskLevel: true,
          category: true,
          owner: true,
          materiality: true
        }
      });

      // Calculate heatmap data
      const heatmapData: Array<{impact: number, likelihood: number, count: number, risks: any[]}> = [];
      
      for (let impact = 1; impact <= 5; impact++) {
        for (let likelihood = 1; likelihood <= 5; likelihood++) {
          const cellRisks = risks.filter(r => 
            r.impact === impact && r.likelihood === likelihood
          );
          
          if (cellRisks.length > 0) {
            heatmapData.push({
              impact,
              likelihood,
              count: cellRisks.length,
              risks: cellRisks
            });
          }
        }
      }

      // Calculate distributions
      const riskLevelDistribution = risks.reduce((acc, risk) => {
        acc[risk.riskLevel] = (acc[risk.riskLevel] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const categoryDistribution = risks.reduce((acc, risk) => {
        acc[risk.category] = (acc[risk.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const summary = {
        totalRisks: risks.length,
        riskLevelDistribution: {
          CRITICAL: riskLevelDistribution.CRITICAL || 0,
          HIGH: riskLevelDistribution.HIGH || 0,
          MEDIUM: riskLevelDistribution.MEDIUM || 0,
          LOW: riskLevelDistribution.LOW || 0,
        },
        categoryDistribution: {
          FINANCIAL: categoryDistribution.FINANCIAL || 0,
          OPERATIONAL: categoryDistribution.OPERATIONAL || 0,
          COMPLIANCE: categoryDistribution.COMPLIANCE || 0,
          STRATEGIC: categoryDistribution.STRATEGIC || 0,
          TECHNOLOGY: categoryDistribution.TECHNOLOGY || 0,
        },
        heatmapData,
        averageRiskScore: risks.length > 0 
          ? Math.round(risks.reduce((sum, r) => sum + (r.riskScore || 0), 0) / risks.length)
          : 0,
        materialRisks: risks.filter(r => r.materiality === 'Material').length
      };

      return NextResponse.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Risk summary API error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch risk summary',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  },
  { requireAuth: true }
);