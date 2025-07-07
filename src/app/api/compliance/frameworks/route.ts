import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { complianceService } from '@/services/ComplianceService';
import { AuthenticatedRequest } from '@/types/api';

export const GET = withApiMiddleware(
  async (req: AuthenticatedRequest) => {
    const user = req.user;
    
    if (!user || !user.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization context required' },
        { status: 403 }
      );
    }

    try {
      const frameworks = await complianceService.getFrameworks(user.organizationId);

      return NextResponse.json({
        success: true,
        data: frameworks
      });
    } catch (error) {
      console.error('Get frameworks error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch frameworks' },
        { status: 500 }
      );
    }
  },
  { requireAuth: true }
);
