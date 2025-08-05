import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any;

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = session.user as any;

    // Get organization subscription status
    const organization = await db.client.organization.findUnique({
      where: { id: user.organizationId },
      include: {
        subscriptions: {
          where: {
            status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })

    if (!organization) {
      return NextResponse.json({
        isActive: false,
        status: 'FREE',
        plan: 'free',
        trialEnd: null,
        trialDaysLeft: null,
        isTrialExpired: false,
        needsUpgrade: true,
      });
    }

    const subscription = organization.subscriptions[0];
    const now = new Date();

    if (!subscription) {
      return NextResponse.json({
        isActive: false,
        status: 'FREE',
        plan: organization.plan || 'free',
        trialEnd: null,
        trialDaysLeft: null,
        isTrialExpired: false,
        needsUpgrade: true,
      });
    }

    let status = subscription.status;
    let isActive = ['ACTIVE', 'TRIALING'].includes(subscription.status);
    let trialEnd = subscription.trialEnd;
    let trialDaysLeft: number | null = null;
    let isTrialExpired = false;

    if (trialEnd) {
      const timeDiff = trialEnd.getTime() - now.getTime();
      trialDaysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      isTrialExpired = timeDiff <= 0;

      if (isTrialExpired && subscription.status === 'TRIALING') {
        isActive = false;
        status = 'FREE';
      }
    }

    // Determine plan from metadata or organization plan
    let plan = organization.plan || 'free'
    const stripePriceId = (subscription.metadata as any)?.stripePriceId;
    if (stripePriceId) {
      if (stripePriceId.includes('pro')) plan = 'pro';
      else if (stripePriceId.includes('enterprise')) plan = 'enterprise';
    }

    return NextResponse.json({
      isActive,
      status,
      plan,
      trialEnd,
      trialDaysLeft,
      isTrialExpired,
      needsUpgrade: !isActive && plan === 'free',
      features: getPlanFeatures(plan),
      limits: getPlanLimits(plan),
    });
  } catch (error) {
    // console.error('Error getting subscription status:', error)
    return NextResponse.json({ error: 'Failed to get subscription status' }, { status: 500 });
  }
}

const getPlanFeatures = (plan: string) => {
  const features = {
    free: ['Basic risk management', 'Up to 10 risks', 'Basic reporting'],
    pro: [
      'Advanced risk management',
      'Unlimited risks',
      'Advanced reporting',
      'AI insights',
      'Integrations',
    ],
    enterprise: [
      'Enterprise features',
      'Unlimited everything',
      'Custom reporting',
      'Advanced AI',
      'SSO',
      'API access',
    ],
  }
  return features[plan as keyof typeof features] || features.free;
}

const getPlanLimits = (plan: string) => {
  const limits = {
    free: { users: 3, risks: 10, storage: '100MB', aiQueries: 50 },
    pro: { users: 25, risks: -1, storage: '10GB', aiQueries: 1000 },
    enterprise: { users: -1, risks: -1, storage: 'Unlimited', aiQueries: -1 },
  }
  return limits[plan as keyof typeof limits] || limits.free;
}
