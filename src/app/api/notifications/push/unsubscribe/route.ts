import { NextRequest } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { notificationService } from '@/services/NotificationService';
import { ApiResponseFormatter } from '@/lib/api/response-formatter';
import { z } from 'zod';

// POST /api/notifications/push/unsubscribe - Unsubscribe from push notifications
const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

export const POST = withApiMiddleware(async (req: NextRequest) => {
  const user = (req as any).user;
  if (!user) {
    return ApiResponseFormatter.authError('User not authenticated');
  }

  const body = await req.json();
  const { endpoint } = unsubscribeSchema.parse(body);

  await notificationService.unsubscribeFromPush(endpoint);

  return ApiResponseFormatter.success(null);
});
