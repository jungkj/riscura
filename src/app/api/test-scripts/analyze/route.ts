import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { z } from 'zod';
import { OpenAI } from 'openai';
import { db } from '@/lib/db';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const analyzeBodySchema = z.object({
  testScriptContent: z.string(),
  controlId: z.string(),
});

interface EvidenceAnalysis {
  matchesRequirements: boolean;
  confidenceScore: number;
  findings: Finding[];
  recommendations: string[];
}

interface Finding {
  type: 'match' | 'gap' | 'issue';
  description: string;
  severity: 'high' | 'medium' | 'low';
}

const SYSTEM_PROMPT = `You are an expert compliance analyst specializing in control testing and evidence analysis.

Your task is to analyze test scripts and determine if they provide sufficient evidence for control effectiveness.

Focus on:
1. Whether the test script adequately tests the control
2. If the evidence collected would demonstrate control effectiveness
3. Gaps in testing methodology
4. Compliance with testing best practices
5. Sufficiency of evidence for audit purposes

Provide specific, actionable feedback.`;

export const POST = withApiMiddleware({
  requireAuth: true,
  bodySchema: analyzeBodySchema,
  rateLimiters: ['expensive'],
})(async (context, validatedData) => {
  const { testScriptContent, controlId } = validatedData;
  const { organizationId } = context;
  
  try {
    // Get control details
    const control = await db.client.control.findFirst({
      where: {
        id: controlId,
        organizationId,
      },
    });
    
    if (!control) {
      return {
        success: false,
        error: 'Control not found'
      };
    }
    
    // Perform AI analysis
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { 
          role: "user", 
          content: `Analyze this test script for the following control:

Control: ${control.title}
Description: ${control.description}
Type: ${control.type}
Frequency: ${control.frequency}

Test Script:
${testScriptContent}

Determine if this test script provides adequate evidence for control effectiveness.`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });
    
    const aiResponse = JSON.parse(completion.choices[0].message.content || '{}');
    
    // Default analysis structure if AI doesn't provide expected format
    const analysis: EvidenceAnalysis = {
      matchesRequirements: aiResponse.matchesRequirements ?? false,
      confidenceScore: aiResponse.confidenceScore ?? 0,
      findings: aiResponse.findings || [],
      recommendations: aiResponse.recommendations || [],
    };
    
    // Store the analysis result
    if (analysis.matchesRequirements && analysis.confidenceScore > 0.7) {
      // Update control with positive test results
      await db.client.control.update({
        where: { id: controlId },
        data: {
          lastTestDate: new Date(),
          testResults: `AI Analysis: Test script provides adequate evidence (${Math.round(analysis.confidenceScore * 100)}% confidence)`,
        },
      });
    }
    
    return {
      success: true,
      data: {
        analysis,
        controlTitle: control.title,
      }
    };
    
  } catch (error) {
    console.error('Test script analysis error:', error);
    
    // Fallback analysis without AI
    const basicAnalysis: EvidenceAnalysis = {
      matchesRequirements: false,
      confidenceScore: 0.5,
      findings: [
        {
          type: 'issue',
          description: 'Unable to perform AI analysis. Manual review required.',
          severity: 'medium'
        }
      ],
      recommendations: [
        'Ensure test script includes clear testing steps',
        'Document expected evidence and outcomes',
        'Include frequency and timing of tests',
        'Specify who performs the testing'
      ]
    };
    
    return {
      success: true,
      data: {
        analysis: basicAnalysis,
        controlTitle: 'Control'
      }
    };
  }
});