import { NextRequest } from 'next/server';
import { billingManager } from '@/lib/billing/manager';
import { db } from '@/lib/db';
import {
  withApiMiddleware,
  createAPIResponse,
  ValidationError,
  ConflictError,
  ForbiddenError,
} from '@/lib/api/middleware';
import { createNotFoundError } from '@/lib/api/error-handler';

export const GET = withApiMiddleware(
  async (_request: NextRequest) => {
    const user = (request as any).user;

    // Get active subscription for the organization
    const subscription = await db.client.organizationSubscription.findFirst({
      where: {
        organizationId: user.organizationId,
        status: { in: ['active', 'trialing', 'past_due'] },
      },
      include: {
        plan: true,
      },
    })

    if (!subscription) {
      // Return default free plan if no subscription exists
      const freePlan = {
        id: 'free-plan',
        organizationId: user.organizationId,
        planId: 'plan_free',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        plan: {
          id: 'plan_free',
          name: 'Free Plan',
          price: 0,
          currency: 'USD',
          billingInterval: 'monthly',
          features: ['Basic risk management', 'Up to 10 risks', 'Basic reporting'],
          limits: {
            risks: 10,
            users: 3,
            storage: '100MB',
            aiQueries: 50,
          },
        },
      }

      return createAPIResponse(freePlan);
    }

    return createAPIResponse(subscription);
  },
  {
    requireAuth: true,
  }
);

export const POST = withApiMiddleware(
  async (_request: NextRequest) => {
    const user = (request as any).user;
    const { planId, options } = await request.json();

    if (!planId) {
      throw new ValidationError('Plan ID is required');
    }

    // Check if user has permission to manage billing
    if (!user.permissions.includes('*') && !user.permissions.includes('billing:write')) {
      throw new ForbiddenError('Insufficient permissions')
    }

    // Validate the plan exists
    const plan = await db.client.subscriptionPlan.findUnique({
      where: { id: planId },
    })

    if (!plan || !plan.isActive) {
      throw new ValidationError('Invalid or inactive plan');
    }

    // Check for existing active subscription
    const existingSubscription = await db.client.organizationSubscription.findFirst({
      where: {
        organizationId: user.organizationId,
        status: { in: ['active', 'trialing'] },
      },
    })

    if (existingSubscription) {
      throw new ConflictError('Organization already has an active subscription');
    }

    // Create subscription using billing manager
    const subscription = await billingManager.createSubscription(
      user.organizationId,
      planId,
      options
    )

    return createAPIResponse(subscription, { statusCode: 201 });
  },
  {
    requireAuth: true,
  }
);

export const PUT = withApiMiddleware(
  async (_request: NextRequest) => {
    const user = (request as any).user;
    const { subscriptionId, planId, action } = await request.json();

    if (!subscriptionId) {
      throw new ValidationError('Subscription ID is required');
    }

    // Check permissions
    if (!user.permissions.includes('*') && !user.permissions.includes('billing:write')) {
      throw new ForbiddenError('Insufficient permissions')
    }

    // Verify subscription belongs to user's organization
    const subscription = await db.client.organizationSubscription.findFirst({
      where: {
        id: subscriptionId,
        organizationId: user.organizationId,
      },
    })

    if (!subscription) {
      throw createNotFoundError('Subscription');
    }

    let updatedSubscription;

    switch (action) {
      case 'upgrade':
      case 'downgrade':
        if (!planId) {
          throw new ValidationError('Plan ID is required for plan changes');
        }
        updatedSubscription = await billingManager.changeSubscriptionPlan(subscriptionId, planId);
        break;

      case 'cancel':
        updatedSubscription = await billingManager.cancelSubscription(subscriptionId);
        break;

      case 'reactivate':
        updatedSubscription = await billingManager.reactivateSubscription(subscriptionId);
        break;

      default:
        throw new ValidationError('Invalid action');
    }

    return createAPIResponse(updatedSubscription);
  },
  {
    requireAuth: true,
  }
);

export const DELETE = withApiMiddleware(
  async (_request: NextRequest) => {
    const user = (request as any).user;
    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('id');
    const immediately = searchParams.get('immediately') === 'true';

    if (!subscriptionId) {
      throw new ValidationError('Subscription ID is required');
    }

    // Check permissions
    if (!user.permissions.includes('*') && !user.permissions.includes('billing:write')) {
      throw new ForbiddenError('Insufficient permissions')
    }

    // Verify subscription belongs to user's organization
    const subscription = await db.client.organizationSubscription.findFirst({
      where: {
        id: subscriptionId,
        organizationId: user.organizationId,
      },
    })

    if (!subscription) {
      throw createNotFoundError('Subscription');
    }

    // Cancel subscription
    const canceledSubscription = await billingManager.cancelSubscription(
      subscriptionId,
      immediately
    )

    return createAPIResponse({
      ...canceledSubscription,
      message: immediately
        ? 'Subscription canceled immediately'
        : 'Subscription scheduled for cancellation',
    });
  },
  {
    requireAuth: true,
  }
);
