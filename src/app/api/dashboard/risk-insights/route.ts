import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import getEnhancedProboService from '@/services/EnhancedProboService';
import { z } from 'zod';
import { getDemoData, isDemoUser } from '@/lib/demo-data';

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

      // Check if this is a demo user
      if (isDemoUser(user.id) || user.organizationId === 'demo-org-id') {
        console.log('[Risk Insights API] Serving demo data');
        const demoMetrics = getDemoData('metrics', user.organizationId);
        const demoRisks = getDemoData('risks', user.organizationId) as any[];
        
        // Generate insights from demo data
        const highRisks = demoRisks?.filter(r => r.riskLevel === 'HIGH' || r.riskLevel === 'CRITICAL') || [];
        const insights = [
          {
            id: 'insight-1',
            type: 'risk',
            priority: 'high',
            title: `${highRisks.length} High Priority Risks Identified`,
            description: `RCSA process identified ${highRisks.length} high/critical risks requiring immediate attention`,
            recommendation: 'Review and prioritize mitigation strategies for high-risk areas',
            timestamp: new Date().toISOString()
          },
          {
            id: 'insight-2',
            type: 'control',
            priority: 'medium',
            title: 'Control Effectiveness at 87%',
            description: 'Overall control effectiveness is good but some controls need improvement',
            recommendation: 'Focus on enhancing partially effective controls',
            timestamp: new Date().toISOString()
          },
          {
            id: 'insight-3',
            type: 'compliance',
            priority: 'low',
            title: 'RCSA Assessment 100% Complete',
            description: 'All 77 risks and controls have been documented and assessed',
            recommendation: 'Schedule quarterly review to maintain completeness',
            timestamp: new Date().toISOString()
          }
        ];
        
        return NextResponse.json({
          success: true,
          data: {
            metrics: demoMetrics,
            insights,
            complianceStatus: {
              overall: 88,
              frameworks: [
                { name: 'Basel III', score: 92 },
                { name: 'SOC 2', score: 88 },
                { name: 'ISO 27001', score: 85 },
                { name: 'PCI DSS', score: 87 }
              ]
            },
            vendorSummary: {
              total: 5,
              approved: 3,
              conditional: 1,
              underReview: 1,
              critical: 2
            },
            timestamp: new Date().toISOString(),
            demoMode: true
          }
        });
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
          const proboService = getEnhancedProboService();
          const integration = await proboService.setupIntegration(
            user.organizationId,
            validatedData.apiKey,
            validatedData.webhookUrl
          );
          
          // Initial sync
          await proboService.syncMetrics(user.organizationId);
          
          return NextResponse.json({
            success: true,
            message: 'Probo integration configured successfully',
            data: { integrationId: integration.id },
          });

        case 'sync':
          const proboServiceSync = getEnhancedProboService();
          await proboServiceSync.syncMetrics(user.organizationId);
          
          return NextResponse.json({
            success: true,
            message: 'Probo data synchronized successfully',
          });

        case 'disable':
          const proboServiceDisable = getEnhancedProboService();
          await proboServiceDisable.disableIntegration(user.organizationId);
          
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
  },
  { 
    requireAuth: true,
    validateBody: ActionSchema 
  }
); 