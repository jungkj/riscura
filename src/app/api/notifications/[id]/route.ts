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
export async function GET(req: NextRequest, { params }: RouteParams) {
  return withApiMiddleware(async (req: NextRequest) => {
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
  })(req);
}

// PATCH /api/notifications/[id] - Update notification (mark as read)
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  return withApiMiddleware(async (req: NextRequest) => {
    const user = await getAuthenticatedUser();
    if (!user) {
      return ApiResponseFormatter.unauthorized('User not authenticated');
    }

    const notification = await notificationService.markAsRead(params.id, user.id);

    return ApiResponseFormatter.success(notification, 'Notification marked as read');
  })(req);
}

// DELETE /api/notifications/[id] - Dismiss notification
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  return withApiMiddleware(async (req: NextRequest) => {
    const user = await getAuthenticatedUser();
    if (!user) {
      return ApiResponseFormatter.unauthorized('User not authenticated');
    }

    const notification = await notificationService.dismissNotification(params.id, user.id);

    return ApiResponseFormatter.success(notification, 'Notification dismissed');
  })(req);
}