import { NextRequest } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { complianceService } from '@/services/ComplianceService';
import { ApiResponseFormatter } from '@/lib/api/response-formatter';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/compliance/assessments/[id]/gap-analysis - Perform gap analysis
export const GET = withApiMiddleware(async (req: NextRequest, { params }: RouteParams) => {
  const user = await getAuthenticatedUser();
  if (!user) {
    return ApiResponseFormatter.unauthorized('User not authenticated');
  }

  const analysis = await complianceService.performGapAnalysis(params.id);

  return ApiResponseFormatter.success(analysis, 'Gap analysis completed successfully');
});