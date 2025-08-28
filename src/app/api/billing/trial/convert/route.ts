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
  const { subscriptionId, paymentMethodId } = await request.json();

  if (!subscriptionId) {
    throw new ValidationError('Subscription ID is required');
  }

  // Check permissions
  if (!user.permissions.includes('*') && !user.permissions.includes('billing:write')) {
    throw new ForbiddenError('Insufficient permissions');
  }

  await trialManager.convertTrialToPaid(subscriptionId, paymentMethodId);

  return createAPIResponse({
    success: true,
    message: 'Trial successfully converted to paid subscription',
  });
}, {
  requireAuth: true
});