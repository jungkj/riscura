import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { AIService } from '@/services/AIService';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const complianceGapSchema = z.object({
  framework: z.string().min(1),
  organizationId: z.string(),
  includeRemediation: z.boolean().default(true),
  priorityLevel: z.enum(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM']).default('ALL'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = complianceGapSchema.parse(body);

    // Verify user has access to the organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        organizationId: true,
      },
    });

    if (!user || user.organizationId !== validatedData.organizationId) {
      return NextResponse.json(
        { error: 'Access denied to organization' },
        { status: 403 }
      );
    }

    // Initialize AI service
    const aiService = new AIService();

    // Identify compliance gaps
    const gaps = await aiService.identifyComplianceGaps(
      validatedData.framework,
      validatedData.organizationId
    );

    // Filter gaps by priority if specified
    let filteredGaps = gaps;
    if (validatedData.priorityLevel !== 'ALL') {
      filteredGaps = gaps.filter(gap => gap.severity === validatedData.priorityLevel);
    }

    // Log the AI compliance analysis request
    await prisma.aIAnalysisLog.create({
      data: {
        userId: session.user.id,
        organizationId: validatedData.organizationId,
        analysisType: 'COMPLIANCE_GAP',
        inputData: {
          framework: validatedData.framework,
          priorityLevel: validatedData.priorityLevel,
        },
        outputData: filteredGaps,
        confidence: 0.85, // Average confidence for compliance analysis
        timestamp: new Date(),
      },
    }).catch(error => {
      console.warn('Failed to log AI compliance analysis:', error);
    });

    // Create compliance gap records in the database
    if (filteredGaps.length > 0) {
      try {
        const gapRecords = filteredGaps.map(gap => ({
          organizationId: validatedData.organizationId,
          framework: gap.framework,
          requirement: gap.requirement,
          currentStatus: gap.currentStatus,
          gapDescription: gap.gapDescription,
          severity: gap.severity,
          recommendedActions: gap.recommendedActions,
          timeline: gap.timeline,
          resources: gap.resources,
          aiGenerated: true,
          identifiedBy: session.user.id,
          identifiedAt: new Date(),
        }));

        await prisma.complianceGap.createMany({
          data: gapRecords,
          skipDuplicates: true,
        });
      } catch (error) {
        console.warn('Failed to save compliance gaps:', error);
        // Continue with response even if saving fails
      }
    }

    // Calculate summary statistics
    const summary = {
      totalGaps: filteredGaps.length,
      criticalGaps: filteredGaps.filter(g => g.severity === 'CRITICAL').length,
      highGaps: filteredGaps.filter(g => g.severity === 'HIGH').length,
      mediumGaps: filteredGaps.filter(g => g.severity === 'MEDIUM').length,
      lowGaps: filteredGaps.filter(g => g.severity === 'LOW').length,
      framework: validatedData.framework,
      overallRisk: filteredGaps.length > 10 ? 'HIGH' : 
                   filteredGaps.length > 5 ? 'MEDIUM' : 'LOW',
    };

    return NextResponse.json({
      success: true,
      gaps: filteredGaps,
      summary,
      metadata: {
        analysisId: `compliance-${Date.now()}`,
        timestamp: new Date().toISOString(),
        framework: validatedData.framework,
        model: 'gpt-4',
        confidence: 0.85,
      },
    });

  } catch (error) {
    console.error('AI compliance gap analysis error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes('Rate limit')) {
        return NextResponse.json(
          {
            error: 'AI service rate limit exceeded',
            message: 'Please try again in a few minutes',
          },
          { status: 429 }
        );
      }

      if (error.message.includes('API key')) {
        return NextResponse.json(
          {
            error: 'AI service configuration error',
            message: 'Compliance analysis is temporarily unavailable',
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Compliance gap analysis failed',
        message: 'An error occurred while analyzing compliance gaps',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const framework = searchParams.get('framework');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Verify user has access to the organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        organizationId: true,
      },
    });

    if (!user || user.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'Access denied to organization' },
        { status: 403 }
      );
    }

    // Get compliance gaps
    const whereClause: any = {
      organizationId,
      aiGenerated: true,
    };

    if (framework) {
      whereClause.framework = framework;
    }

    const complianceGaps = await prisma.complianceGap.findMany({
      where: whereClause,
      select: {
        id: true,
        framework: true,
        requirement: true,
        currentStatus: true,
        gapDescription: true,
        severity: true,
        recommendedActions: true,
        timeline: true,
        resources: true,
        identifiedAt: true,
        status: true,
      },
      orderBy: [
        { severity: 'desc' },
        { identifiedAt: 'desc' },
      ],
      take: 100,
    }).catch(error => {
      console.warn('Failed to fetch compliance gaps:', error);
      return [];
    });

    // Get compliance analysis history
    const analysisHistory = await prisma.aIAnalysisLog.findMany({
      where: {
        organizationId,
        analysisType: 'COMPLIANCE_GAP',
        timestamp: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
        },
      },
      select: {
        id: true,
        timestamp: true,
        confidence: true,
        inputData: true,
        outputData: true,
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 20,
    }).catch(error => {
      console.warn('Failed to fetch analysis history:', error);
      return [];
    });

    // Calculate compliance statistics
    const stats = {
      totalGaps: complianceGaps.length,
      bySeverity: complianceGaps.reduce((acc, gap) => {
        acc[gap.severity] = (acc[gap.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byFramework: complianceGaps.reduce((acc, gap) => {
        acc[gap.framework] = (acc[gap.framework] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byStatus: complianceGaps.reduce((acc, gap) => {
        acc[gap.status || 'OPEN'] = (acc[gap.status || 'OPEN'] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      recentAnalyses: analysisHistory.length,
    };

    // Get supported frameworks
    const supportedFrameworks = [
      'ISO 27001',
      'SOC 2',
      'NIST Cybersecurity Framework',
      'PCI DSS',
      'GDPR',
      'HIPAA',
      'SOX',
      'COSO',
      'COBIT',
      'ITIL',
    ];

    return NextResponse.json({
      success: true,
      data: {
        complianceGaps,
        analysisHistory,
        statistics: stats,
        supportedFrameworks,
        capabilities: {
          gapIdentification: true,
          requirementMapping: true,
          remediationPlanning: true,
          prioritization: true,
          progressTracking: true,
        },
      },
    });

  } catch (error) {
    console.error('Error fetching compliance gaps:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch compliance gaps',
        message: 'An error occurred while retrieving compliance gap data',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { gapId, status, notes, assignedTo } = body;

    if (!gapId) {
      return NextResponse.json(
        { error: 'Gap ID is required' },
        { status: 400 }
      );
    }

    // Update compliance gap status
    const updatedGap = await prisma.complianceGap.update({
      where: {
        id: gapId,
      },
      data: {
        status: status || undefined,
        notes: notes || undefined,
        assignedTo: assignedTo || undefined,
        updatedAt: new Date(),
        updatedBy: session.user.id,
      },
    }).catch(error => {
      console.error('Failed to update compliance gap:', error);
      return null;
    });

    if (!updatedGap) {
      return NextResponse.json(
        { error: 'Compliance gap not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      gap: updatedGap,
      message: 'Compliance gap updated successfully',
    });

  } catch (error) {
    console.error('Error updating compliance gap:', error);

    return NextResponse.json(
      {
        error: 'Failed to update compliance gap',
        message: 'An error occurred while updating the compliance gap',
      },
      { status: 500 }
    );
  }
} 