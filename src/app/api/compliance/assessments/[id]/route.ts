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

// GET /api/compliance/assessments/[id] - Get single assessment with details
export const GET = withApiMiddleware(async (req: NextRequest, { params }: RouteParams) => {
  const user = await getAuthenticatedUser();
  if (!user) {
    return ApiResponseFormatter.unauthorized('User not authenticated');
  }

  const assessment = await complianceService.getAssessment(params.id);
  
  if (!assessment) {
    return ApiResponseFormatter.notFound('Assessment not found');
  }

  // Verify user has access to this assessment
  if (assessment.organizationId !== user.organizationId) {
    return ApiResponseFormatter.forbidden('Access denied');
  }

  return ApiResponseFormatter.success(assessment, 'Assessment retrieved successfully');
});