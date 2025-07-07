import { NextRequest } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { notificationService } from '@/services/NotificationService';
import { ApiResponseFormatter } from '@/lib/api/response-formatter';
import { z } from 'zod';
import { DigestFrequency } from '@prisma/client';

// GET /api/notifications/preferences - Get user preferences
export const GET = withApiMiddleware(async (req: NextRequest) => {
  const user = (req as any).user;
  if (!user) {
    return ApiResponseFormatter.authError('User not authenticated');
  }

  const preferences = await notificationService.getUserPreferences(user.id);

  return ApiResponseFormatter.success(preferences, 'Preferences retrieved successfully');
});

// PUT /api/notifications/preferences - Update user preferences
const updatePreferencesSchema = z.object({
  email: z.boolean().optional(),
  push: z.boolean().optional(),
  inApp: z.boolean().optional(),
  digest: z.nativeEnum(DigestFrequency).optional(),
  categories: z.record(z.boolean()).optional(),
  quietHours: z.object({
    start: z.string().regex(/^\d{2}:\d{2}$/),
    end: z.string().regex(/^\d{2}:\d{2}$/),
    timezone: z.string().optional(),
  }).optional(),
});

export const PUT = withApiMiddleware(async (req: NextRequest) => {
  const user = (req as any).user;
  if (!user) {
    return ApiResponseFormatter.authError('User not authenticated');
  }

  const body = await req.json();
  const validatedData = updatePreferencesSchema.parse(body);

  const preferences = await notificationService.updateUserPreferences(user.id, validatedData);

  return ApiResponseFormatter.success(preferences, 'Preferences updated successfully');
});