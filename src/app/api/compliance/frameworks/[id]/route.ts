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

// GET /api/compliance/frameworks/[id] - Get single framework with requirements
export const GET = withApiMiddleware(async (req: NextRequest, { params }: RouteParams) => {
  const user = await getAuthenticatedUser();
  if (!user) {
    return ApiResponseFormatter.unauthorized('User not authenticated');
  }

  const framework = await complianceService.getFramework(params.id);
  
  if (!framework) {
    return ApiResponseFormatter.notFound('Framework not found');
  }

  // Verify user has access to this framework
  if (framework.organizationId !== user.organizationId) {
    return ApiResponseFormatter.forbidden('Access denied');
  }

  return ApiResponseFormatter.success(framework, 'Framework retrieved successfully');
});