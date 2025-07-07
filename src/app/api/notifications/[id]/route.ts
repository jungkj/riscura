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
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiMiddleware(
    async (request: NextRequest) => {
      const { id } = await params;
      const user = (request as any).user;
    if (!user) {
      return ApiResponseFormatter.authError('User not authenticated');
    }

    const { notifications } = await notificationService.getUserNotifications(
      user.id,
      { id: id },
      1,
      1
    );

    if (notifications.length === 0) {
      return ApiResponseFormatter.notFoundError('Notification not found');
    }

    return ApiResponseFormatter.success(notifications[0]);
    },
    { requireAuth: true }
  )(req);
}

// PATCH /api/notifications/[id] - Update notification (mark as read)
export async function PATCH(
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

    const notification = await notificationService.markAsRead(id, user.id);

    return ApiResponseFormatter.success(notification);
    },
    { requireAuth: true }
  )(req);
}

// DELETE /api/notifications/[id] - Dismiss notification
export async function DELETE(
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

    const notification = await notificationService.dismissNotification(id, user.id);

    return ApiResponseFormatter.success(notification);
    },
    { requireAuth: true }
  )(req);
}
