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

    // TODO: Implement subscription model in Prisma schema
    // const subscription = await db.client.organizationSubscription.findFirst({
    //   where: {
    //     organizationId: user.organizationId,
    //     status: { in: ['active', 'trialing', 'past_due'] },
    //   },
    //   include: {
    //     plan: true,
    //   },
    // });

    // Return mock subscription for now
    const subscription = {
      id: 'sub_mock',
      organizationId: user.organizationId,
      planId: 'plan_free',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      plan: {
        id: 'plan_free',
        name: 'Free Plan',
        price: 0,
        features: ['Basic features'],
      },
    };

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