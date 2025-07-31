import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { z } from 'zod';
import { parseRCSAExcel, parseRCSAText } from '@/lib/rcsa/parser';
import { analyzeRCSAData } from '@/services/ai/rcsa-analysis';

const analyzeBodySchema = z.object({
  type: z.enum(['file', 'text']),
  content: z.string().optional(),
  fileName: z.string().optional(),
});

export const POST = withApiMiddleware({
  requireAuth: true,
  bodySchema: analyzeBodySchema,
  rateLimiters: ['expensive'],
})(async (context, validatedData) => {
  const { type, content, fileName } = validatedData;

  try {
    let parsedData;

    if (type === 'file' && content) {
      // Parse base64 encoded Excel file
      const buffer = Buffer.from(content, 'base64');
      parsedData = await parseRCSAExcel(buffer);
    } else if (type === 'text' && content) {
      // Parse pasted text data
      parsedData = parseRCSAText(content);
    } else {
      return {
        success: false,
        error: 'Invalid input data',
      };
    }

    if (parsedData.errors.length > 0) {
      return {
        success: false,
        errors: parsedData.errors,
        warnings: parsedData.warnings,
      };
    }

    if (parsedData.rows.length === 0) {
      return {
        success: false,
        error: 'No valid data found to analyze',
      };
    }

    // Perform AI gap analysis
    const analysis = await analyzeRCSAData(parsedData.rows);

    // Store analysis in session or temporary storage for review
    // This would be implemented based on your session management approach

    return {
      success: true,
      data: {
        analysis,
        rowCount: parsedData.rows.length,
        warnings: parsedData.warnings,
      },
    };
  } catch (error) {
    console.error('RCSA analysis error:', error);
    return {
      success: false,
      error: 'Failed to analyze RCSA data',
    };
  }
});
