import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth.config';
import { ProboIntegrationService } from '@/services/ProboIntegrationService';
import {
  ControlGenerationRequest,
  ProboIntegrationConfig,
  ComplianceFramework,
  ProboControlCategory,
} from '@/types/probo-integration.types';

/**
 * POST /api/probo/generate-controls
 * Generate AI-powered controls for a specific risk using Probo integration
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = (await getServerSession(authOptions)) as any;
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body: ControlGenerationRequest = await request.json();

    // Validate required fields
    if (!body.riskId || !body.riskTitle || !body.riskSeverity) {
      return NextResponse.json(
        { error: 'Missing required fields: riskId, riskTitle, riskSeverity' },
        { status: 400 }
      );
    }

    // Initialize Probo service with configuration
    const config: ProboIntegrationConfig = {
      apiEndpoint: process.env.PROBO_API_ENDPOINT || 'https://api.probo.com',
      apiKey: process.env.PROBO_API_KEY || 'demo-key',
      organizationId: (session.user as any).organizationId || 'default-org',
      enableAI: process.env.PROBO_ENABLE_AI === 'true',
      autoApplyRecommendations: false,
      confidenceThreshold: 0.8,
      frameworks: [] as ComplianceFramework[],
      customCategories: [] as ProboControlCategory[],
    };

    // Get Probo service instance
    const proboService = ProboIntegrationService.getInstance();

    // Generate controls
    const response = await proboService.generateControlsForRisk(body);

    // Log the generation for analytics
    console.log(
      `Generated ${response.controls.length} controls for risk ${body.riskId} by user ${(session.user as any).id || session.user.email}`
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating controls:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate controls',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/probo/generate-controls
 * Get generation status and history
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = (await getServerSession(authOptions)) as any;
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const riskId = searchParams.get('riskId');

    // Get Probo service instance
    const proboService = ProboIntegrationService.getInstance();

    // Get integration status and metrics
    const status = await proboService.getIntegrationStatus();
    const metrics = await proboService.getIntegrationMetrics();

    return NextResponse.json({
      status: status.health,
      lastGeneration: status.usage.lastActivity,
      availableFrameworks: ['SOC2', 'ISO27001', 'GDPR', 'HIPAA', 'PCI-DSS'],
      supportedCategories: [
        'Access Control',
        'Data Protection',
        'Network Security',
        'Incident Response',
        'Compliance Monitoring',
        'Vendor Management',
      ],
      usage: {
        controlsGenerated: metrics.totalControls,
        mappingsCreated: metrics.implementedControls,
        lastActivity: metrics.lastUpdated.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error getting generation status:', error);

    return NextResponse.json(
      {
        error: 'Failed to get generation status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
