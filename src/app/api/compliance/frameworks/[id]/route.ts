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

// GET /api/compliance/frameworks/[id] - Get single framework with requirements
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiMiddleware(
    async (_request: NextRequest) => {
      const { id } = await params;
      const user = (request as any).user;
      if (!user) {
        return ApiResponseFormatter.authError('User not authenticated');
      }

      const framework = await complianceService.getFramework(id);

      if (!framework) {
        return ApiResponseFormatter.notFoundError('Framework not found');
      }

      // Verify user has access to this framework
      if (framework.organizationId !== user.organizationId) {
        return ApiResponseFormatter.forbiddenError('Access denied');
      }

      return ApiResponseFormatter.success(framework);
    },
    { requireAuth: true }
  )(req);
}
