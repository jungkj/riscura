import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import NotificationService from '@/services/NotificationService';

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
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '10', 10);
      const unreadOnly = searchParams.get('unreadOnly') === 'true';

      const result = await NotificationService.getUserNotifications(
        user.id,
        page,
        limit,
        unreadOnly
      );

      return NextResponse.json({
        success: true,
        data: result.notifications,
        meta: {
          total: result.total,
          page,
          limit,
          pages: result.pages,
          unreadCount: result.unreadCount
        }
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch notifications' },
        { status: 500 }
      );
    }
  },
  { requireAuth: true }
);
