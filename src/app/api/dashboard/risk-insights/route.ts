import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import getEnhancedProboService from '@/services/EnhancedProboService';
import { z } from 'zod';

// GET /api/dashboard/probo-insights - Get Probo integration insights
export const GET = withApiMiddleware(
  async (req: NextRequest) => {
    try {
      // Get user from request (added by middleware)
      const user = (req as any).user;

      if (!user || !user.organizationId) {
        return NextResponse.json(
          { success: false, error: 'Organization context required' },
          { status: 403 }
        );
      }

      // Fetch all Probo data
      const proboService = getEnhancedProboService();
      const [metrics, complianceStatus, insights, vendorSummary] = await Promise.all([
        proboService.getLatestMetrics(user.organizationId),
        proboService.getComplianceStatus(user.organizationId),
        proboService.getInsights(user.organizationId),
        proboService.getVendorSummary(user.organizationId),
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
      // console.error('Probo insights API error:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch Probo insights',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  },
  { requireAuth: true }
);

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

// POST /api/dashboard/probo-insights - Configure or sync Probo integration
export const POST = withApiMiddleware(
  async (req: NextRequest) => {
    try {
      // Get user from request (added by middleware)
      const user = (req as any).user;

      if (!user || !user.organizationId) {
        return NextResponse.json(
          { success: false, error: 'Organization context required' },
          { status: 403 }
        );
      }

      const body = await req.json();
      const validatedData = ActionSchema.parse(body);

      switch (validatedData.action) {
        case 'setup':
          const integration = await EnhancedProboService.setupIntegration(
            user.organizationId,
            validatedData.apiKey,
            validatedData.webhookUrl
          );

          // Initial sync
          await EnhancedProboService.syncMetrics(user.organizationId);

          return NextResponse.json({
            success: true,
            message: 'Probo integration configured successfully',
            data: { integrationId: integration.id },
          });

        case 'sync':
          await EnhancedProboService.syncMetrics(user.organizationId);

          return NextResponse.json({
            success: true,
            message: 'Probo data synchronized successfully',
          });

        case 'disable':
          await EnhancedProboService.disableIntegration(user.organizationId);

          return NextResponse.json({
            success: true,
            message: 'Probo integration disabled',
          });

        default:
          return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
      }
    } catch (error) {
      // console.error('Probo insights POST API error:', error)

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
  },
  {
    requireAuth: true,
    validateBody: ActionSchema,
  }
);
