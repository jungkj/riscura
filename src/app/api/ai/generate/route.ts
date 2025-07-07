import { NextRequest } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { 
  ApiResponseFormatter,
  formatValidationErrors 
} from '@/lib/api/response-formatter';
import { z } from 'zod';
import { AIService } from '@/services/AIService';
import { db } from '@/lib/db';
import { getModelPricing } from '@/lib/config/ai-pricing';

// Validation schema for AI generation requests
const aiGenerateSchema = z.object({
  prompt: z.string().min(1).max(10000),
  systemPrompt: z.string().optional(),
  temperature: z.number().min(0).max(2).optional().default(0.7),
  maxTokens: z.number().min(1).max(4000).optional().default(2000),
  model: z.enum(['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo']).optional().default('gpt-4'),
  context: z.record(z.any()).optional()
});

// Rate limiting configuration for AI endpoints
const AI_RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10 // 10 requests per minute per user
};

// POST /api/ai/generate - Generate AI content with server-side API key
export const POST = withApiMiddleware(
  async (req: NextRequest) => {
    const user = (req as any).user;
  
  // Parse and validate request body
  const body = await req.json();
  const validationResult = aiGenerateSchema.safeParse(body);
  
  if (!validationResult.success) {
    return ApiResponseFormatter.error(
      'VALIDATION_ERROR',
      'Invalid request data',
      {
        status: 400,
        details: formatValidationErrors(validationResult.error.errors)
      }
    );
  }
  
  const data = validationResult.data;
  
  // Record start time for response time calculation
  const startTime = Date.now();
  
  try {
    // Check user's AI usage quota if applicable
    const userQuota = await checkUserAIQuota(user.id, user.organizationId);
    if (!userQuota.allowed) {
      return ApiResponseFormatter.error(
        'QUOTA_EXCEEDED',
        'AI generation quota exceeded',
        {
          status: 429,
          details: {
            quotaLimit: userQuota.limit,
            quotaUsed: userQuota.used,
            resetAt: userQuota.resetAt
          }
        }
      );
    }
    
    // Initialize AI service with server-side configuration
    const aiService = new AIService();
    
    // Generate content using the correct interface
    const response = await aiService.generateContent({
      type: 'general',
      context: {
        prompt: data.prompt,
        systemPrompt: data.systemPrompt,
        temperature: data.temperature,
        maxTokens: data.maxTokens,
        model: data.model,
        additionalContext: data.context
      },
      requirements: `Generate content based on the provided prompt with temperature ${data.temperature} and max tokens ${data.maxTokens}`,
      userId: user.id,
      organizationId: user.organizationId
    });
    
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    // Track AI usage for billing and analytics
    await trackAIUsage({
      userId: user.id,
      organizationId: user.organizationId,
      model: data.model,
      promptTokens: response.usage?.promptTokens || 0,
      completionTokens: response.usage?.completionTokens || 0,
      totalTokens: response.usage?.totalTokens || 0,
      cost: calculateAICost(data.model, {
        prompt_tokens: response.usage?.promptTokens,
        completion_tokens: response.usage?.completionTokens
      }),
      responseTime,
      success: true
    });
    
    // Log activity
    await db.client.activity.create({
      data: {
        type: 'UPDATED',
        userId: user.id,
        organizationId: user.organizationId,
        entityType: 'ASSESSMENT',
        entityId: response.id || 'unknown',
        description: `Generated AI content using ${data.model}`,
        metadata: JSON.parse(JSON.stringify({
          model: data.model,
          tokenUsage: response.usage,
          temperature: data.temperature
        }))
      }
    });
    
    return ApiResponseFormatter.success(
      {
        content: response.content,
        model: data.model,
        usage: response.usage,
        id: response.id
      }
    );
  } catch (error) {
    console.error('AI generation error:', error);
    
    // Calculate response time for failed request
    const responseTime = Date.now() - startTime;
    
    // Track failed AI usage
    await trackAIUsage({
      userId: user.id,
      organizationId: user.organizationId,
      model: data.model,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      cost: 0,
      responseTime,
      success: false
    });
    
    // Handle specific AI service errors
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return ApiResponseFormatter.error(
          'RATE_LIMITED',
          'AI service rate limit exceeded',
          { status: 429 }
        );
      }
      if (error.message.includes('invalid api key')) {
        return ApiResponseFormatter.error(
          'SERVICE_ERROR',
          'AI service configuration error',
          { status: 500 }
        );
      }
    }
    
    return ApiResponseFormatter.error(
      'AI_GENERATION_ERROR',
      'Failed to generate AI content',
      {
        status: 500,
        details: {
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      }
    );
  }
},
  { requireAuth: true }
);

// Helper function to check user's AI usage quota
async function checkUserAIQuota(userId: string, organizationId: string): Promise<{
  allowed: boolean;
  limit: number;
  used: number;
  resetAt: Date;
}> {
  // Implement quota checking logic based on your subscription model
  // This is a simplified example
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const usage = await db.client.aIUsageLog.count({
    where: {
      userId,
      organizationId,
      createdAt: {
        gte: startOfMonth
      }
    }
  });
  
  // Get organization's plan limits
  const organization = await db.client.organization.findUnique({
    where: { id: organizationId },
    select: { plan: true }
  });
  
  const limits: Record<string, number> = {
    free: 100,
    starter: 1000,
    professional: 5000,
    enterprise: -1 // unlimited
  };
  
  const limit = limits[organization?.plan || 'free'];
  const allowed = limit === -1 || usage < limit;
  
  const nextMonth = new Date(startOfMonth);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  
  return {
    allowed,
    limit,
    used: usage,
    resetAt: nextMonth
  };
}

// Helper function to track AI usage
async function trackAIUsage(data: {
  userId: string;
  organizationId: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  responseTime: number;
  success: boolean;
}) {
  try {
    await db.client.aIUsageLog.create({
      data: {
        userId: data.userId,
        organizationId: data.organizationId,
        requestType: data.model,
        promptTokens: data.promptTokens,
        completionTokens: data.completionTokens,
        totalTokens: data.totalTokens,
        estimatedCost: data.cost,
        responseTime: data.responseTime,
        success: data.success
      }
    });
  } catch (error) {
    console.error('Failed to track AI usage:', error);
    // Don't fail the request if tracking fails
  }
}

// Helper function to calculate AI costs
function calculateAICost(model: string, usage?: { prompt_tokens?: number; completion_tokens?: number }): number {
  if (!usage) return 0;
  
  const modelPricing = getModelPricing(model);
  const promptCost = (usage.prompt_tokens || 0) / 1000 * modelPricing.prompt;
  const completionCost = (usage.completion_tokens || 0) / 1000 * modelPricing.completion;
  
  return promptCost + completionCost;
}