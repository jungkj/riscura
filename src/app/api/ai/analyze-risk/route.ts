import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { AIService } from '@/services/AIService';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const riskAnalysisSchema = z.object({
  riskId: z.string().optional(),
  riskData: z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    likelihood: z.number().min(1).max(5).optional(),
    impact: z.number().min(1).max(5).optional(),
    riskScore: z.number().min(0).max(100).optional(),
  }),
  organizationId: z.string(),
  includeHistoricalAnalysis: z.boolean().default(true),
  includeRecommendations: z.boolean().default(true),
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
    const validatedData = riskAnalysisSchema.parse(body);

    // Verify user has access to the organization
    const userOrg = await prisma.userOrganization.findFirst({
      where: {
        userId: session.user.id,
        organizationId: validatedData.organizationId,
      },
    });

    if (!userOrg) {
      return NextResponse.json(
        { error: 'Access denied to organization' },
        { status: 403 }
      );
    }

    // Initialize AI service
    const aiService = new AIService();

    // Perform risk analysis
    const analysis = await aiService.analyzeRisk(
      validatedData.riskData,
      validatedData.organizationId
    );

    // Log the AI analysis request
    await prisma.aiAnalysisLog.create({
      data: {
        userId: session.user.id,
        organizationId: validatedData.organizationId,
        analysisType: 'RISK_ANALYSIS',
        inputData: validatedData.riskData,
        outputData: analysis,
        confidence: analysis.confidenceLevel,
        timestamp: new Date(),
      },
    }).catch(error => {
      console.warn('Failed to log AI analysis:', error);
      // Don't fail the request if logging fails
    });

    // If this is an existing risk, update it with AI insights
    if (validatedData.riskId) {
      try {
        await prisma.risk.update({
          where: {
            id: validatedData.riskId,
            organizationId: validatedData.organizationId,
          },
          data: {
            aiRiskScore: analysis.riskScore,
            aiConfidence: analysis.confidenceLevel,
            aiRecommendations: analysis.analysis.recommendations,
            aiLastAnalyzed: new Date(),
          },
        });
      } catch (error) {
        console.warn('Failed to update risk with AI insights:', error);
        // Continue with response even if update fails
      }
    }

    return NextResponse.json({
      success: true,
      analysis,
      metadata: {
        analysisId: `analysis-${Date.now()}`,
        timestamp: new Date().toISOString(),
        confidence: analysis.confidenceLevel,
        model: 'gpt-4',
      },
    });

  } catch (error) {
    console.error('AI risk analysis error:', error);

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
      // Handle specific AI service errors
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
            message: 'AI analysis is temporarily unavailable',
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'AI analysis failed',
        message: 'An error occurred during risk analysis',
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

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Verify user has access to the organization
    const userOrg = await prisma.userOrganization.findFirst({
      where: {
        userId: session.user.id,
        organizationId,
      },
    });

    if (!userOrg) {
      return NextResponse.json(
        { error: 'Access denied to organization' },
        { status: 403 }
      );
    }

    // Get recent AI analysis history
    const recentAnalyses = await prisma.aiAnalysisLog.findMany({
      where: {
        organizationId,
        analysisType: 'RISK_ANALYSIS',
        timestamp: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
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

    // Get AI analysis statistics
    const stats = await prisma.aiAnalysisLog.groupBy({
      by: ['analysisType'],
      where: {
        organizationId,
        timestamp: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      _count: {
        id: true,
      },
      _avg: {
        confidence: true,
      },
    }).catch(error => {
      console.warn('Failed to fetch analysis statistics:', error);
      return [];
    });

    return NextResponse.json({
      success: true,
      data: {
        recentAnalyses,
        statistics: stats,
        capabilities: {
          riskAnalysis: true,
          controlRecommendations: true,
          complianceGapAnalysis: true,
          trendPrediction: true,
          naturalLanguageQuery: true,
        },
      },
    });

  } catch (error) {
    console.error('Error fetching AI analysis data:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch analysis data',
        message: 'An error occurred while retrieving AI analysis information',
      },
      { status: 500 }
    );
  }
} 