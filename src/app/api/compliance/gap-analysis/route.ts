import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth-options';
import { ComplianceAIService } from '@/services/ComplianceAIService';
import { z } from 'zod';

const gapAnalysisSchema = z.object({
  organizationId: z.string(),
  frameworkName: z.string(),
});

const roadmapSchema = z.object({
  organizationId: z.string(),
  frameworkName: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any;
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    const complianceAIService = new ComplianceAIService();

    switch (action) {
      case 'analyze':
        const analysisData = gapAnalysisSchema.parse(body);
        // TODO: Get existing controls and risks from database
        const existingControls: any[] = [] as any[];
        const risks: any[] = [] as any[];

        const gaps = await complianceAIService.identifyComplianceGaps(
          analysisData.frameworkName,
          existingControls,
          risks
        );

        return NextResponse.json({
          success: true,
          data: { gaps },
          message: `Gap analysis completed for ${analysisData.frameworkName}`,
        });

      case 'roadmap':
        const roadmapData = roadmapSchema.parse(body);
        // TODO: Get current assessment from database
        const currentAssessment: any = {
          id: 'temp',
          framework: roadmapData.frameworkName,
          scope: {},
          overallScore: 0,
          maturityLevel: 0,
          completionPercentage: 0,
          gapsIdentified: 0,
          criticalGaps: 0,
          requirements: [] as any[],
          recommendations: [] as any[],
          nextActions: [] as any[],
          auditReadiness: {},
          riskProfile: {},
          timeline: {},
          estimatedCosts: {},
          aiInsights: [] as any[],
          createdAt: new Date(),
          lastUpdated: new Date(),
        };

        const roadmap = await complianceAIService.generateComplianceRoadmap(
          [roadmapData.frameworkName],
          currentAssessment
        );

        return NextResponse.json({
          success: true,
          data: roadmap,
          message: `Implementation roadmap generated for ${roadmapData.frameworkName}`,
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing gap analysis request:', error);
    return NextResponse.json({ error: 'Failed to process gap analysis' }, { status: 500 });
  }
}
