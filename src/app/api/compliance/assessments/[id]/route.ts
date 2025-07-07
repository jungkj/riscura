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

// GET /api/compliance/assessments/[id] - Get single assessment with details
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

    const assessment = await complianceService.getAssessment(resolvedParams.id);
    
    if (!assessment) {
      return ApiResponseFormatter.notFoundError('Assessment not found');
    }

    // Verify user has access to this assessment
    if (assessment.organizationId !== user.organizationId) {
      return ApiResponseFormatter.forbiddenError('Access denied');
    }

    return ApiResponseFormatter.success(assessment, 'Assessment retrieved successfully');
  })(req);
}