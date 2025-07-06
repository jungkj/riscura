import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import ComplianceService from '@/services/ComplianceService';

export const GET = withApiMiddleware(
  async (req: NextRequest) => {
    const user = (req as any).user;
    
    if (!user || !user.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization context required' },
        { status: 403 }
      );
    }

    try {
      const frameworks = await ComplianceService.getFrameworks(user.organizationId);

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
