import { NextRequest, NextResponse } from 'next/server';
import { complianceMappingEngine } from '@/lib/compliance/mapping';

export async function POST(request: NextRequest) {
  try {
    // Simplified validation for now
    const body = await request.json();
    const { action, organizationId, frameworkIds, frameworkId, includeRecommendations } = body;

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    if (action === 'automated-mapping') {
      if (!frameworkIds || !Array.isArray(frameworkIds)) {
        return NextResponse.json({ error: 'Framework IDs required' }, { status: 400 });
      }

      const mappings = await complianceMappingEngine.performAutomatedMapping(
        organizationId,
        frameworkIds
      );

      return NextResponse.json({
        success: true,
        data: mappings,
        count: mappings.length,
      });
    }

    if (action === 'gap-analysis') {
      if (!frameworkId) {
        return NextResponse.json({ error: 'Framework ID required' }, { status: 400 });
      }

      const gapAnalysis = await complianceMappingEngine.performGapAnalysis(
        organizationId,
        frameworkId,
        includeRecommendations
      );

      return NextResponse.json({
        success: true,
        data: gapAnalysis,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in compliance mapping:', error);
    return NextResponse.json(
      { error: 'Failed to perform compliance mapping' },
      { status: 500 }
    );
  }
} 