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
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiMiddleware(
    async (request: NextRequest) => {
      const { id } = await params;
      const user = (request as any).user;
    if (!user) {
      return ApiResponseFormatter.authError('User not authenticated');
    }

    const assessment = await complianceService.getAssessment(id);
    
    if (!assessment) {
      return ApiResponseFormatter.notFoundError('Assessment not found');
    }

    // Verify user has access to this assessment
    if (assessment.organizationId !== user.organizationId) {
      return ApiResponseFormatter.forbiddenError('Access denied');
    }

    return ApiResponseFormatter.success(assessment);
    },
    { requireAuth: true }
  )(req);
}
