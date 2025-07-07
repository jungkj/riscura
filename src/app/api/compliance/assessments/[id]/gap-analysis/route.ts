import { NextRequest } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { complianceService } from '@/services/ComplianceService';
import { ApiResponseFormatter } from '@/lib/api/response-formatter';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/compliance/assessments/[id]/gap-analysis - Perform gap analysis
export async function GET(
  req: NextRequest,
  { params }: RouteParams
) {
  return withApiMiddleware(async (req: NextRequest) => {
    const resolvedParams = await params;
    const user = await getAuthenticatedUser();
    if (!user) {
      return ApiResponseFormatter.authError('User not authenticated');
    }

    try {
      const analysis = await complianceService.performGapAnalysis(resolvedParams.id);
      return ApiResponseFormatter.success(analysis, 'Gap analysis completed successfully');
    } catch (error) {
      console.error('Gap analysis error:', error);
      if (error instanceof Error) {
        return ApiResponseFormatter.error(error.message, 500);
      }
      return ApiResponseFormatter.error('Failed to perform gap analysis', 500);
    }
  })(req);
}