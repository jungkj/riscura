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

    const { notifications } = await notificationService.getUserNotifications(
      user.id,
      { id: resolvedParams.id },
      1,
      1
    );

    if (notifications.length === 0) {
      return ApiResponseFormatter.notFoundError('Notification not found');
    }

    return ApiResponseFormatter.success(notifications[0], 'Notification retrieved successfully');
  })(req);
}

// PATCH /api/notifications/[id] - Update notification (mark as read)
export async function PATCH(
  req: NextRequest,
  { params }: RouteParams
) {
  return withApiMiddleware(async (req: NextRequest) => {
    const resolvedParams = await params;
    const user = await getAuthenticatedUser();
    if (!user) {
      return ApiResponseFormatter.authError('User not authenticated');
    }

    const notification = await notificationService.markAsRead(resolvedParams.id, user.id);

    return ApiResponseFormatter.success(notification, 'Notification marked as read');
  })(req);
}

// DELETE /api/notifications/[id] - Dismiss notification
export async function DELETE(
  req: NextRequest,
  { params }: RouteParams
) {
  return withApiMiddleware(async (req: NextRequest) => {
    const resolvedParams = await params;
    const user = await getAuthenticatedUser();
    if (!user) {
      return ApiResponseFormatter.authError('User not authenticated');
    }

    const notification = await notificationService.dismissNotification(resolvedParams.id, user.id);

    return ApiResponseFormatter.success(notification, 'Notification dismissed');
  })(req);
}