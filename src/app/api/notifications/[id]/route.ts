import { NextRequest } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { notificationService } from '@/services/NotificationService';
import { ApiResponseFormatter } from '@/lib/api/response-formatter';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/notifications/[id] - Get single notification
export const GET = withApiMiddleware(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {

    
    const user = (req as any).user;
    if (!user) {
      return ApiResponseFormatter.authError('User not authenticated');
    }

    const { notifications } = await notificationService.getUserNotifications(
      user.id,
      { id: (await params).id },
      1,
      1
    );

    if (notifications.length === 0) {
      return ApiResponseFormatter.notFoundError('Notification not found');
    }

    return ApiResponseFormatter.success(notifications[0], "Notification retrieved successfully");
  },
  { requireAuth: true }
);

// PATCH /api/notifications/[id] - Update notification (mark as read)
export const PATCH = withApiMiddleware(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {

    
    const user = (req as any).user;
    if (!user) {
      return ApiResponseFormatter.authError('User not authenticated');
    }

    const notification = await notificationService.markAsRead((await params).id, user.id);

    return ApiResponseFormatter.success(notification, "Notification marked as read");
  },
  { requireAuth: true }
);

// DELETE /api/notifications/[id] - Dismiss notification
export const DELETE = withApiMiddleware(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {

    
    const user = (req as any).user;
    if (!user) {
      return ApiResponseFormatter.authError('User not authenticated');
    }

    const notification = await notificationService.dismissNotification((await params).id, user.id);

    return ApiResponseFormatter.success(notification, "Notification dismissed");
  },
  { requireAuth: true }
);