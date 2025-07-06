import { NextRequest } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { notificationService } from '@/services/NotificationService';
import { ApiResponseFormatter } from '@/lib/api/response-formatter';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/notifications/[id] - Get single notification
export const GET = withApiMiddleware(async (req: NextRequest, { params }: RouteParams) => {
  const user = await getAuthenticatedUser();
  if (!user) {
    return ApiResponseFormatter.unauthorized('User not authenticated');
  }

  const { notifications } = await notificationService.getUserNotifications(
    user.id,
    { id: params.id },
    1,
    1
  );

  if (notifications.length === 0) {
    return ApiResponseFormatter.notFound('Notification not found');
  }

  return ApiResponseFormatter.success(notifications[0], 'Notification retrieved successfully');
});

// PATCH /api/notifications/[id] - Update notification (mark as read)
export const PATCH = withApiMiddleware(async (req: NextRequest, { params }: RouteParams) => {
  const user = await getAuthenticatedUser();
  if (!user) {
    return ApiResponseFormatter.unauthorized('User not authenticated');
  }

  const notification = await notificationService.markAsRead(params.id, user.id);

  return ApiResponseFormatter.success(notification, 'Notification marked as read');
});

// DELETE /api/notifications/[id] - Dismiss notification
export const DELETE = withApiMiddleware(async (req: NextRequest, { params }: RouteParams) => {
  const user = await getAuthenticatedUser();
  if (!user) {
    return ApiResponseFormatter.unauthorized('User not authenticated');
  }

  const notification = await notificationService.dismissNotification(params.id, user.id);

  return ApiResponseFormatter.success(notification, 'Notification dismissed');
});