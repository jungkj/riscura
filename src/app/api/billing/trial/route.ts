import { NextRequest } from 'next/server';
import { trialManager } from '@/lib/billing/trial-manager';
import { 
  withApiMiddleware, 
  createAPIResponse,
  ValidationError,
  ForbiddenError
} from '@/lib/api/middleware';

/**
 * GET /api/billing/trial - Get current trial status
 */
export const GET = withApiMiddleware(async (request: NextRequest) => {
  const user = (request as any).user;

  const trialStatus = await trialManager.getTrialStatus(user.organizationId);
  
  return createAPIResponse({
    ...trialStatus,
    organizationId: user.organizationId,
  });
}, {
  requireAuth: true
});

/**
 * POST /api/billing/trial/convert - Convert trial to paid subscription
 */
export const POST = withApiMiddleware(async (request: NextRequest) => {
  const user = (request as any).user;
  const url = new URL(request.url);
  const action = url.pathname.split('/').pop();

  if (action === 'convert') {
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
  }

  if (action === 'extend') {
    const { subscriptionId, days = 7 } = await request.json();

    if (!subscriptionId) {
      throw new ValidationError('Subscription ID is required');
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
  }

  throw new ValidationError('Invalid action');
}, {
  requireAuth: true
});