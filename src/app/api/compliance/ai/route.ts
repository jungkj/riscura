import { NextRequest, NextResponse } from 'next/server';
import { complianceAIIntelligence } from '@/lib/compliance/ai-intelligence';

export async function POST(_request: NextRequest) {
  try {
    const body = await request.json();
    const { action, query, context, userId, organizationId, updateId, assessorId } = body;

    if (action === 'query') {
      if (!query || !context || !userId) {
        return NextResponse.json(
          { error: 'Query, context, and user ID required' },
          { status: 400 }
        );
      }

      const response = await complianceAIIntelligence.processComplianceQuery(
        query,
        context,
        userId
      );

      return NextResponse.json({
        success: true,
        data: response,
      });
    }

    if (action === 'insights') {
      if (!organizationId) {
        return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
      }

      const insights = await complianceAIIntelligence.generateComplianceInsights(organizationId);

      return NextResponse.json({
        success: true,
        data: insights,
        count: insights.length,
      });
    }

    if (action === 'regulatory-updates') {
      const updates = await complianceAIIntelligence.monitorRegulatoryUpdates();

      return NextResponse.json({
        success: true,
        data: updates,
        count: updates.length,
      });
    }

    if (action === 'assess-impact') {
      if (!updateId || !organizationId || !assessorId) {
        return NextResponse.json(
          { error: 'Update ID, organization ID, and assessor ID required' },
          { status: 400 }
        );
      }

      const impact = await complianceAIIntelligence.assessRegulatoryImpact(
        updateId,
        organizationId,
        assessorId
      );

      return NextResponse.json({
        success: true,
        data: impact,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    // console.error('Error in AI compliance intelligence:', error)
    return NextResponse.json({ error: 'Failed to process AI compliance request' }, { status: 500 });
  }
}
