import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { AIService } from '@/services/AIService';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const controlRecommendationSchema = z.object({
  riskId: z.string().optional(),
  riskData: z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    riskScore: z.number().min(0).max(100),
  }),
  organizationId: z.string(),
  includeImplementationPlan: z.boolean().default(true),
  maxRecommendations: z.number().min(1).max(10).default(5),
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
    const validatedData = controlRecommendationSchema.parse(body);

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

    // Get control recommendations
    const recommendations = await aiService.recommendControls(
      validatedData.riskData,
      validatedData.organizationId
    );

    // Limit recommendations as requested
    const limitedRecommendations = recommendations.slice(0, validatedData.maxRecommendations);

    // Log the AI recommendation request
    await prisma.aiAnalysisLog.create({
      data: {
        userId: session.user.id,
        organizationId: validatedData.organizationId,
        analysisType: 'CONTROL_RECOMMENDATION',
        inputData: validatedData.riskData,
        outputData: limitedRecommendations,
        confidence: 0.8, // Average confidence for control recommendations
        timestamp: new Date(),
      },
    }).catch(error => {
      console.warn('Failed to log AI recommendation:', error);
    });

    // If this is for an existing risk, optionally create control suggestions
    if (validatedData.riskId && limitedRecommendations.length > 0) {
      try {
        // Create control suggestions in the database
        const controlSuggestions = limitedRecommendations.map(rec => ({
          riskId: validatedData.riskId!,
          organizationId: validatedData.organizationId,
          title: rec.title,
          description: rec.description,
          type: rec.type,
          priority: rec.priority,
          estimatedCost: rec.estimatedCost,
          effectiveness: rec.effectiveness,
          implementationComplexity: rec.implementationComplexity,
          aiGenerated: true,
          createdBy: session.user.id,
          createdAt: new Date(),
        }));

        await prisma.controlSuggestion.createMany({
          data: controlSuggestions,
          skipDuplicates: true,
        });
      } catch (error) {
        console.warn('Failed to save control suggestions:', error);
        // Continue with response even if saving fails
      }
    }

    return NextResponse.json({
      success: true,
      recommendations: limitedRecommendations,
      metadata: {
        recommendationId: `rec-${Date.now()}`,
        timestamp: new Date().toISOString(),
        totalRecommendations: recommendations.length,
        returnedRecommendations: limitedRecommendations.length,
        model: 'claude-3-sonnet',
      },
    });

  } catch (error) {
    console.error('AI control recommendation error:', error);

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
            message: 'Control recommendations are temporarily unavailable',
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Control recommendation failed',
        message: 'An error occurred while generating control recommendations',
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
    const riskId = searchParams.get('riskId');

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

    // Get control suggestions for the risk or organization
    const whereClause: any = {
      organizationId,
      aiGenerated: true,
    };

    if (riskId) {
      whereClause.riskId = riskId;
    }

    const controlSuggestions = await prisma.controlSuggestion.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        priority: true,
        estimatedCost: true,
        effectiveness: true,
        implementationComplexity: true,
        createdAt: true,
        risk: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
      },
      orderBy: [
        { priority: 'asc' },
        { createdAt: 'desc' },
      ],
      take: 50,
    }).catch(error => {
      console.warn('Failed to fetch control suggestions:', error);
      return [];
    });

    // Get recent control recommendation history
    const recentRecommendations = await prisma.aiAnalysisLog.findMany({
      where: {
        organizationId,
        analysisType: 'CONTROL_RECOMMENDATION',
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
      console.warn('Failed to fetch recommendation history:', error);
      return [];
    });

    // Get control recommendation statistics
    const stats = {
      totalSuggestions: controlSuggestions.length,
      byType: controlSuggestions.reduce((acc, suggestion) => {
        acc[suggestion.type] = (acc[suggestion.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byComplexity: controlSuggestions.reduce((acc, suggestion) => {
        acc[suggestion.implementationComplexity] = (acc[suggestion.implementationComplexity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      averageEffectiveness: controlSuggestions.reduce((sum, s) => sum + s.effectiveness, 0) / controlSuggestions.length || 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        controlSuggestions,
        recentRecommendations,
        statistics: stats,
        capabilities: {
          preventiveControls: true,
          detectiveControls: true,
          correctiveControls: true,
          automatedControls: true,
          manualControls: true,
        },
      },
    });

  } catch (error) {
    console.error('Error fetching control recommendations:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch control recommendations',
        message: 'An error occurred while retrieving control recommendation data',
      },
      { status: 500 }
    );
  }
} 