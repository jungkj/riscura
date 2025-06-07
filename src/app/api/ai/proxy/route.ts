import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { aiConfig } from '@/config/env';
import { AISecurityService } from '@/services/AISecurityService';

// Initialize OpenAI client server-side only
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Server-side only
  organization: process.env.OPENAI_ORG_ID,
});

// Initialize security service
const securityService = new AISecurityService({
  organizationId: 'default',
  encryptionKey: process.env.AI_ENCRYPTION_KEY || 'default-key',
  auditingEnabled: true,
  piiDetectionEnabled: true,
  contentFilteringEnabled: true,
  complianceStandards: [
    { name: 'SOC2', enabled: true, requirements: [] },
    { name: 'GDPR', enabled: true, requirements: [] }
  ],
  retentionPolicyDays: 365,
  anonymizationLevel: 'advanced'
});

export async function POST(request: NextRequest) {
  try {
    const { content, agentType, userId, sessionId } = await request.json();

    if (!content || !userId) {
      return NextResponse.json(
        { error: 'Content and userId are required' },
        { status: 400 }
      );
    }

    // Security processing
    const securityResult = await securityService.processSecureAIRequest({
      content,
      userId,
      sessionId: sessionId || 'anonymous',
      action: {
        type: 'query',
        source: 'api',
        method: 'POST',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    if (!securityResult.securityApproved) {
      return NextResponse.json(
        { 
          error: 'Request blocked by security policy',
          warnings: securityResult.warnings
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
          content: `You are an AI assistant for the Riscura risk management platform. Agent type: ${agentType || 'general_assistant'}`
        },
        {
          role: 'user',
          content: securityResult.sanitizedContent
        }
      ],
      max_tokens: 2000,
      temperature: 0.7
    });

    const response = completion.choices[0]?.message?.content || '';

    // Process and filter response
    const responseResult = await securityService.processSecureAIResponse(
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
        totalTokens: completion.usage?.total_tokens || 0
      }
    });

  } catch (error) {
    console.error('AI Proxy Error:', error);
    
    return NextResponse.json(
      { error: 'AI service temporarily unavailable' },
      { status: 500 }
    );
  }
} 