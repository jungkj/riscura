import { NextRequest } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { notificationService } from '@/services/NotificationService';
import { ApiResponseFormatter } from '@/lib/api/response-formatter';

// GET /api/notifications/unread - Get unread count
export const GET = withApiMiddleware(async (req: NextRequest) => {
  const user = await getAuthenticatedUser();
  if (!user) {
    return ApiResponseFormatter.authError('User not authenticated');
  }

  const count = await notificationService.getUnreadCount(user.id);

  return ApiResponseFormatter.success({ count }, 'Unread count retrieved successfully');
});