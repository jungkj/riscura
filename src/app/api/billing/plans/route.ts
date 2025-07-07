import { NextRequest } from 'next/server';
import { billingManager } from '@/lib/billing/manager';
import { withApiMiddleware, createAPIResponse, AuthenticationError } from '@/lib/api/middleware';

export const GET = withApiMiddleware(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const active = searchParams.get('active');
  const currency = searchParams.get('currency');

  const filters: any = {};
  if (type) filters.type = type.split(',');
  if (active !== null) filters.active = active === 'true';
  if (currency) filters.currency = currency;

  const plans = await billingManager.getSubscriptionPlans(filters);

  return createAPIResponse(plans);
}, {
  requireAuth: true
});

export const POST = withApiMiddleware(async (request: NextRequest) => {
  const user = (request as any).user;
  
  if (user.role !== 'ADMIN') {
    throw new AuthenticationError('Admin access required');
  }

  const planData = await request.json();
  const plan = await billingManager.createSubscriptionPlan(planData);

  return createAPIResponse(plan, { statusCode: 201 });
}, {
  requireAuth: true,
  requiredPermissions: ['billing:write']
});