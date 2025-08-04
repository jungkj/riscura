import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth-options';
import { db } from '@/lib/db';

export interface SubscriptionStatus {
  isActive: boolean;
  status: 'FREE' | 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED';
  plan: string;
  trialEnd: Date | null;
  trialDaysLeft: number | null;
  isTrialExpired: boolean;
  needsUpgrade: boolean;
}

export interface SubscriptionRequirement {
  minPlan?: 'free' | 'pro' | 'enterprise';
  requiresActive?: boolean;
  allowTrial?: boolean;
}

// Get subscription status for a user/organization
export async function getSubscriptionStatus(_organizationId: string): Promise<SubscriptionStatus> {
  try {
    const organization = await db.client.organization.findUnique({
      where: { id: organizationId },
      include: {
        subscriptions: {
          where: {
            status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!organization) {
      return createFreeStatus();
    }

    const subscription = organization.subscriptions[0];
    const now = new Date();

    if (!subscription) {
      return createFreeStatus();
    }

    let status = subscription.status as SubscriptionStatus['status'];
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

    // Determine plan from Stripe price ID
    let plan = organization.plan || 'free';
    if (subscription.stripePriceId) {
      if (subscription.stripePriceId.includes('pro')) plan = 'pro';
      else if (subscription.stripePriceId.includes('enterprise')) plan = 'enterprise';
    }

    return {
      isActive,
      status,
      plan,
      trialEnd,
      trialDaysLeft,
      isTrialExpired,
      needsUpgrade: !isActive && plan === 'free',
    };
  } catch (error) {
    // console.error('Error getting subscription status:', error);
    return createFreeStatus();
  }
}

function createFreeStatus(): SubscriptionStatus {
  return {
    isActive: false,
    status: 'FREE',
    plan: 'free',
    trialEnd: null,
    trialDaysLeft: null,
    isTrialExpired: false,
    needsUpgrade: true,
  };
}

// Check if subscription meets requirements
export function checkSubscriptionAccess(
  subscription: SubscriptionStatus,
  requirements: SubscriptionRequirement
): { allowed: boolean; reason?: string } {
  if (requirements.requiresActive && !subscription.isActive) {
    if (subscription.status === 'TRIALING' && !requirements.allowTrial) {
      return { allowed: false, reason: 'Trial access not allowed for this feature' };
    }
    if (!subscription.isActive) {
      return { allowed: false, reason: 'Active subscription required' };
    }
  }

  if (requirements.minPlan) {
    const planLevels = { free: 0, pro: 1, enterprise: 2 };
    const userLevel = planLevels[subscription.plan as keyof typeof planLevels] || 0;
    const requiredLevel = planLevels[requirements.minPlan];

    if (userLevel < requiredLevel) {
      return { allowed: false, reason: `${requirements.minPlan} plan or higher required` };
    }
  }

  return { allowed: true };
}

// Middleware wrapper for subscription checks
export function withSubscriptionAuth(requirements: SubscriptionRequirement = {}) {
  return async (req: NextRequest) => {
    try {
      const session = await getServerSession(authOptions);

      if (!session?.user) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }

      const user = session.user as any;
      const subscriptionStatus = await getSubscriptionStatus(user.organizationId);

      const { allowed, reason } = checkSubscriptionAccess(subscriptionStatus, requirements);

      if (!allowed) {
        return NextResponse.json(
          {
            error: reason || 'Subscription upgrade required',
            code: 'SUBSCRIPTION_REQUIRED',
            subscriptionStatus,
            upgradeUrl: '/billing/upgrade',
          },
          { status: 402 }
        );
      }

      return null; // Allow the request to continue
    } catch (error) {
      // console.error('Subscription auth error:', error);
      return NextResponse.json({ error: 'Subscription verification failed' }, { status: 500 });
    }
  };
}
