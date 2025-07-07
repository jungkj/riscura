import { NextRequest } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { 
  ApiResponseFormatter,
  formatValidationErrors 
} from '@/lib/api/response-formatter';
import { z } from 'zod';
import { 
  GenerateTestScriptRequest,
  GenerateTestScriptResponse,
  TestScriptType,
  TestFrequency 
} from '@/types/rcsa.types';
import { TestScriptGenerationAIService } from '@/services/ai/TestScriptGenerationAIService';

// Validation schema
const generateTestScriptSchema = z.object({
  controlId: z.string(),
  controlDescription: z.string().optional(),
  testObjective: z.string().optional(),
  additionalContext: z.string().optional()
});

// POST /api/test-scripts/generate - Generate test script using AI
export const POST = withApiMiddleware(
  async (req: NextRequest) => {
    const user = (req as any).user;
  
  // Parse and validate request body
  const body = await req.json();
  const validationResult = generateTestScriptSchema.safeParse(body);
  
  if (!validationResult.success) {
    return ApiResponseFormatter.error(
      'Invalid request data',
      400,
      'VALIDATION_ERROR',
      formatValidationErrors(validationResult.error)
    );
  }
  
  const data = validationResult.data as GenerateTestScriptRequest;
  
  try {
    // Initialize AI service
    const aiService = new TestScriptGenerationAIService();
    
    // Generate test script
    const response = await aiService.generateTestScript(
      data,
      user.organizationId,
      user.id
    );
    
    return ApiResponseFormatter.success(
      response,
      'Test script generated successfully'
    );
  } catch (error) {
    console.error('Test script generation error:', error);
    
    return ApiResponseFormatter.error(
      'Failed to generate test script',
      500,
      'AI_GENERATION_ERROR',
      {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        suggestion: 'Please try again or provide more context'
      }
    );
  }
},
  { requireAuth: true }
);