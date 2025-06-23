import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { AIService } from '@/services/AIService';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const chatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  organizationId: z.string(),
  conversationId: z.string().optional(),
  context: z.object({
    currentPage: z.string().optional(),
    selectedRisk: z.string().optional(),
    selectedControl: z.string().optional(),
    userRole: z.string().optional(),
  }).optional(),
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
    const validatedData = chatRequestSchema.parse(body);

    // Verify user has access to the organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizations: {
          where: { id: validatedData.organizationId },
        },
      },
    });

    if (!user || user.organizations.length === 0) {
      return NextResponse.json(
        { error: 'Access denied to organization' },
        { status: 403 }
      );
    }

    // Initialize AI service
    const aiService = new AIService();

    // Process the natural language query
    const chatResponse = await aiService.processNaturalLanguageQuery(
      validatedData.message,
      session.user.id,
      validatedData.organizationId
    );

    // Create or update conversation
    let conversationId = validatedData.conversationId;
    
    if (!conversationId) {
      // Create new conversation
      const conversation = await prisma.conversation.create({
        data: {
          id: `conv-${Date.now()}-${session.user.id}`,
          userId: session.user.id,
          organizationId: validatedData.organizationId,
          title: validatedData.message.substring(0, 50) + (validatedData.message.length > 50 ? '...' : ''),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }).catch(error => {
        console.warn('Failed to create conversation:', error);
        return { id: `temp-${Date.now()}` };
      });
      
      conversationId = conversation.id;
    }

    // Save chat messages
    try {
      await prisma.chatMessage.createMany({
        data: [
          {
            conversationId,
            role: 'user',
            content: validatedData.message,
            timestamp: new Date(),
          },
          {
            conversationId,
            role: 'assistant',
            content: chatResponse.message,
            metadata: {
              type: chatResponse.type,
              confidence: 0.8,
              actions: chatResponse.actions,
              followUpQuestions: chatResponse.followUpQuestions,
            },
            timestamp: new Date(),
          },
        ],
        skipDuplicates: true,
      });

      // Update conversation timestamp
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
    } catch (error) {
      console.warn('Failed to save chat messages:', error);
      // Continue with response even if saving fails
    }

    // Log the AI chat request
    await prisma.aiUsageLog.create({
      data: {
        userId: session.user.id,
        organizationId: validatedData.organizationId,
        feature: 'CHAT',
        inputTokens: Math.ceil(validatedData.message.length / 4), // Rough estimate
        outputTokens: Math.ceil(chatResponse.message.length / 4),
        model: 'gpt-4',
        timestamp: new Date(),
      },
    }).catch(error => {
      console.warn('Failed to log AI usage:', error);
    });

    return NextResponse.json({
      success: true,
      response: chatResponse,
      conversationId,
      metadata: {
        messageId: `msg-${Date.now()}`,
        timestamp: new Date().toISOString(),
        model: 'gpt-4',
        confidence: 0.8,
      },
    });

  } catch (error) {
    console.error('AI chat error:', error);

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
            message: 'Chat service is temporarily unavailable',
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Chat request failed',
        message: 'An error occurred while processing your message',
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
    const conversationId = searchParams.get('conversationId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Verify user has access to the organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizations: {
          where: { id: organizationId },
        },
      },
    });

    if (!user || user.organizations.length === 0) {
      return NextResponse.json(
        { error: 'Access denied to organization' },
        { status: 403 }
      );
    }

    if (conversationId) {
      // Get specific conversation with messages
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          userId: session.user.id,
          organizationId,
        },
        include: {
          messages: {
            orderBy: { timestamp: 'asc' },
            take: limit,
          },
        },
      }).catch(error => {
        console.warn('Failed to fetch conversation:', error);
        return null;
      });

      if (!conversation) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        conversation,
      });
    } else {
      // Get conversation list
      const conversations = await prisma.conversation.findMany({
        where: {
          userId: session.user.id,
          organizationId,
        },
        select: {
          id: true,
          title: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              messages: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 20,
      }).catch(error => {
        console.warn('Failed to fetch conversations:', error);
        return [];
      });

      // Get chat usage statistics
      const chatStats = await prisma.aiUsageLog.groupBy({
        by: ['feature'],
        where: {
          userId: session.user.id,
          organizationId,
          feature: 'CHAT',
          timestamp: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        _count: {
          id: true,
        },
        _sum: {
          inputTokens: true,
          outputTokens: true,
        },
      }).catch(error => {
        console.warn('Failed to fetch chat statistics:', error);
        return [];
      });

      return NextResponse.json({
        success: true,
        data: {
          conversations,
          statistics: {
            totalConversations: conversations.length,
            totalMessages: conversations.reduce((sum, conv) => sum + conv._count.messages, 0),
            usage: chatStats[0] || { _count: { id: 0 }, _sum: { inputTokens: 0, outputTokens: 0 } },
          },
          capabilities: {
            riskQueries: true,
            controlQueries: true,
            complianceQueries: true,
            dataAnalysis: true,
            recommendations: true,
            conversationHistory: true,
          },
        },
      });
    }

  } catch (error) {
    console.error('Error fetching chat data:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch chat data',
        message: 'An error occurred while retrieving chat information',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    // Delete conversation and its messages
    const deletedConversation = await prisma.conversation.delete({
      where: {
        id: conversationId,
        userId: session.user.id, // Ensure user owns the conversation
      },
    }).catch(error => {
      console.error('Failed to delete conversation:', error);
      return null;
    });

    if (!deletedConversation) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Conversation deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting conversation:', error);

    return NextResponse.json(
      {
        error: 'Failed to delete conversation',
        message: 'An error occurred while deleting the conversation',
      },
      { status: 500 }
    );
  }
} 