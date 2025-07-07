import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth-options';
import enhancedProboService from '@/services/EnhancedProboService';
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
    const session = await getServerSession(authOptions) as any;
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    const proboService = enhancedProboService;

    switch (action) {
      case 'analyze':
        const analysisData = gapAnalysisSchema.parse(body);
        const gapAnalysis = await proboService.performComplianceGapAnalysis(
          analysisData.organizationId,
          analysisData.frameworkName
        );
        
        return NextResponse.json({
          success: true,
          data: gapAnalysis,
          message: `Gap analysis completed for ${analysisData.frameworkName}`
        });

      case 'roadmap':
        const roadmapData = roadmapSchema.parse(body);
        const roadmap = await proboService.generateComplianceRoadmap(
          roadmapData.organizationId,
          roadmapData.frameworkName
        );
        
        return NextResponse.json({
          success: true,
          data: roadmap,
          message: `Implementation roadmap generated for ${roadmapData.frameworkName}`
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error processing gap analysis request:', error);
    return NextResponse.json(
      { error: 'Failed to process gap analysis' },
      { status: 500 }
    );
  }
} 