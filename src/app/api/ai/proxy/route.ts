import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Helper function to get OpenAI client
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  return new OpenAI({
    apiKey,
    organization: process.env.OPENAI_ORG_ID,
  });
}

// Mock security service for build time
const mockSecurityService = {
  async processSecureAIRequest(request: any): Promise<any> {
    return {
      securityApproved: true,
      sanitizedContent: request.content,
      auditLogId: 'mock-audit-id',
      warnings: [] as any[],
    };
  },
  async processSecureAIResponse(
    auditLogId: string,
    response: string,
    confidence: number,
    sources: string[]
  ): Promise<any> {
    return {
      approved: true,
      filteredResponse: response,
      warnings: [] as any[],
    };
  },
};

export async function POST(request: NextRequest) {
  try {
    const { content, agentType, userId, sessionId } = await request.json();

    if (!content || !userId) {
      return NextResponse.json({ error: 'Content and userId are required' }, { status: 400 });
    }

    // Check if OpenAI is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        response:
          "I'm sorry, but the AI service is not currently available. This is a demo environment where AI features require additional configuration.",
        approved: true,
        warnings: ['AI service not configured'],
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        },
      });
    }

    // Get OpenAI client
    const openai = getOpenAIClient();

    // Security processing with mock service
    const securityResult = await mockSecurityService.processSecureAIRequest({
      content,
      userId,
      sessionId: sessionId || 'anonymous',
      action: {
        type: 'query',
        source: 'api',
        method: 'POST',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    if (!securityResult.securityApproved) {
      return NextResponse.json(
        {
          error: 'Request blocked by security policy',
          warnings: securityResult.warnings,
        },
        { status: 403 }
      );
    }

    // Make OpenAI request with sanitized content
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant for the Riscura risk management platform. Agent type: ${agentType || 'general_assistant'}`,
        },
        {
          role: 'user',
          content: securityResult.sanitizedContent,
        },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || '';

    // Process and filter response
    const responseResult = await mockSecurityService.processSecureAIResponse(
      securityResult.auditLogId,
      response,
      0.9, // confidence
      ['openai']
    );

    return NextResponse.json({
      response: responseResult.filteredResponse,
      approved: responseResult.approved,
      warnings: responseResult.warnings,
      usage: {
        promptTokens: completion.usage?.prompt_tokens || 0,
        completionTokens: completion.usage?.completion_tokens || 0,
        totalTokens: completion.usage?.total_tokens || 0,
      },
    });
  } catch (error) {
    console.error('AI Proxy Error:', error);

    return NextResponse.json({ error: 'AI service temporarily unavailable' }, { status: 500 });
  }
}
