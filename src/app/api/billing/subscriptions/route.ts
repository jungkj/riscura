import { NextRequest, NextResponse } from 'next/server';
import { billingManager } from '@/lib/billing/manager';
import { validateRequest } from '@/lib/auth/validate';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { user } = await validateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get active subscription for the organization
    const subscription = await db.client.organizationSubscription.findFirst({
      where: {
        organizationId: user.organizationId,
        status: { in: ['active', 'trialing', 'past_due'] },
      },
      include: {
        plan: true,
      },
    });

    if (!subscription) {
      // Return default free plan if no subscription exists
      return NextResponse.json({
        subscription: {
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
        },
      });
    }

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await validateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId, options } = await request.json();

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    // Check if user has permission to manage billing
    if (!user.permissions.includes('*') && !user.permissions.includes('billing:write')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Validate the plan exists
    const plan = await db.client.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: 'Invalid or inactive plan' }, { status: 400 });
    }

    // Check for existing active subscription
    const existingSubscription = await db.client.organizationSubscription.findFirst({
      where: {
        organizationId: user.organizationId,
        status: { in: ['active', 'trialing'] },
      },
    });

    if (existingSubscription) {
      return NextResponse.json(
        { error: 'Organization already has an active subscription' },
        { status: 409 }
      );
    }

    // Create subscription using billing manager
    const subscription = await billingManager.createSubscription(
      user.organizationId,
      planId,
      options
    );

    return NextResponse.json({ subscription }, { status: 201 });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user } = await validateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscriptionId, planId, action } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 });
    }

    // Check permissions
    if (!user.permissions.includes('*') && !user.permissions.includes('billing:write')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Verify subscription belongs to user's organization
    const subscription = await db.client.organizationSubscription.findFirst({
      where: {
        id: subscriptionId,
        organizationId: user.organizationId,
      },
    });

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    let updatedSubscription;

    switch (action) {
      case 'upgrade':
      case 'downgrade':
        if (!planId) {
          return NextResponse.json({ error: 'Plan ID is required for plan changes' }, { status: 400 });
        }
        updatedSubscription = await billingManager.changeSubscriptionPlan(
          subscriptionId,
          planId
        );
        break;

      case 'cancel':
        updatedSubscription = await billingManager.cancelSubscription(subscriptionId);
        break;

      case 'reactivate':
        updatedSubscription = await billingManager.reactivateSubscription(subscriptionId);
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ subscription: updatedSubscription });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user } = await validateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('id');

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 });
    }

    // Check permissions
    if (!user.permissions.includes('*') && !user.permissions.includes('billing:write')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Verify subscription belongs to user's organization
    const subscription = await db.client.organizationSubscription.findFirst({
      where: {
        id: subscriptionId,
        organizationId: user.organizationId,
      },
    });

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // Cancel and delete subscription
    await billingManager.cancelSubscription(subscriptionId, true);

    return NextResponse.json({ message: 'Subscription deleted successfully' });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    return NextResponse.json(
      { error: 'Failed to delete subscription' },
      { status: 500 }
    );
  }
} 