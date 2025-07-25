import { NextRequest } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { complianceService } from '@/services/ComplianceService';
import { ApiResponseFormatter } from '@/lib/api/response-formatter';

// GET /api/compliance/assessments/[id]/gap-analysis - Perform gap analysis
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiMiddleware(
    async (request: NextRequest) => {
      const { id } = await params;
      const user = (request as any).user;
      if (!user) {
        return ApiResponseFormatter.authError('User not authenticated');
      }

      try {
        const analysis = await complianceService.performGapAnalysis(id);
        return ApiResponseFormatter.success(analysis);
      } catch (error) {
        console.error('Gap analysis error:', error);
        if (error instanceof Error) {
          return ApiResponseFormatter.error('SERVER_ERROR', error.message, { status: 500 });
        }
        return ApiResponseFormatter.error('SERVER_ERROR', 'Failed to perform gap analysis', { status: 500 });
      }
    },
    { requireAuth: true }
  )(req);
}
