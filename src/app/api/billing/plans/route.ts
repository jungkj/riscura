import { NextRequest, NextResponse } from 'next/server';
import { billingManager } from '@/lib/billing/manager';
import { validateRequest } from '@/lib/auth/validate';

export async function GET(request: NextRequest) {
  try {
    const { user } = await validateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const active = searchParams.get('active');
    const currency = searchParams.get('currency');

    const filters: any = {};
    if (type) filters.type = type.split(',');
    if (active !== null) filters.active = active === 'true';
    if (currency) filters.currency = currency;

    const plans = await billingManager.getSubscriptionPlans(filters);

    return NextResponse.json({ plans });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription plans' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await validateRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const planData = await request.json();

    const plan = await billingManager.createSubscriptionPlan(planData);

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    console.error('Error creating subscription plan:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription plan' },
      { status: 500 }
    );
  }
} 