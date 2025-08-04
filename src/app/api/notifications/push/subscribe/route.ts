import { NextRequest } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { notificationService } from '@/services/NotificationService';
import { ApiResponseFormatter } from '@/lib/api/response-formatter';
import { z } from 'zod';

// POST /api/notifications/push/subscribe - Subscribe to push notifications
const subscribeSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    expirationTime: z.number().nullable().optional(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
  }),
  deviceInfo: z
    .object({
      userAgent: z.string().optional(),
      platform: z.string().optional(),
      browser: z.string().optional(),
    })
    .optional(),
});

export const POST = withApiMiddleware(async (req: NextRequest) => {
  const user = (req as any).user;
  if (!user) {
    return ApiResponseFormatter.authError('User not authenticated');
  }

  const body = await req.json();
  const { subscription, deviceInfo } = subscribeSchema.parse(body);

  const pushSubscription = await notificationService.subscribeToPush(
    user.id,
    subscription,
    deviceInfo
  );

  return ApiResponseFormatter.success(pushSubscription);
});
