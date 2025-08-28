import { NextRequest } from 'next/server';
import { trialManager } from '@/lib/billing/trial-manager';
import { 
  withApiMiddleware, 
  createAPIResponse,
  ValidationError,
  ForbiddenError
} from '@/lib/api/middleware';

export const POST = withApiMiddleware(async (request: NextRequest) => {
  const user = (request as any).user;
  const { subscriptionId, days = 7 } = await request.json();

  if (!subscriptionId) {
    throw new ValidationError('Subscription ID is required');
  }

  if (days < 1 || days > 30) {
    throw new ValidationError('Extension days must be between 1 and 30');
  }

  // Check permissions
  if (!user.permissions.includes('*') && !user.permissions.includes('billing:write')) {
    throw new ForbiddenError('Insufficient permissions');
  }

  await trialManager.extendTrial(subscriptionId, days);

  return createAPIResponse({
    success: true,
    message: `Trial extended by ${days} days`,
  });
}, {
  requireAuth: true
});