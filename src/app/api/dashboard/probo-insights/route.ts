import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedUser } from '@/lib/auth/auth-middleware';
import EnhancedProboService from '@/services/EnhancedProboService';
import { z } from 'zod';

// GET /api/dashboard/probo-insights - Get Probo integration insights
export const GET = withApiMiddleware(async (req: NextRequest) => {
  const { user, organization } = await getAuthenticatedUser(req);

  try {
    // Fetch all Probo data
    const [metrics, complianceStatus, insights, vendorSummary] = await Promise.all([
      EnhancedProboService.getLatestMetrics(organization.id),
      EnhancedProboService.getComplianceStatus(organization.id),
      EnhancedProboService.getInsights(organization.id),
      EnhancedProboService.getVendorSummary(organization.id),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        complianceStatus,
        insights,
        vendorSummary,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Probo insights API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch Probo insights',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

// POST /api/dashboard/probo-insights - Configure or sync Probo integration
export const POST = withApiMiddleware(async (req: NextRequest) => {
  const { user, organization } = await getAuthenticatedUser(req);

  const body = await req.json();

  // Schema for different actions
  const ActionSchema = z.discriminatedUnion('action', [
    z.object({
      action: z.literal('setup'),
      apiKey: z.string(),
      webhookUrl: z.string().url().optional(),
    }),
    z.object({
      action: z.literal('sync'),
    }),
    z.object({
      action: z.literal('disable'),
    }),
  ]);

  try {
    const validatedData = ActionSchema.parse(body);

    switch (validatedData.action) {
      case 'setup':
        const integration = await EnhancedProboService.setupIntegration(
          organization.id,
          validatedData.apiKey,
          validatedData.webhookUrl
        );
        
        // Initial sync
        await EnhancedProboService.syncMetrics(organization.id);
        
        return NextResponse.json({
          success: true,
          message: 'Probo integration configured successfully',
          data: { integrationId: integration.id },
        });

      case 'sync':
        await EnhancedProboService.syncMetrics(organization.id);
        
        return NextResponse.json({
          success: true,
          message: 'Probo data synchronized successfully',
        });

      case 'disable':
        await EnhancedProboService.disableIntegration(organization.id);
        
        return NextResponse.json({
          success: true,
          message: 'Probo integration disabled',
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Probo insights POST API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process Probo action',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}); 