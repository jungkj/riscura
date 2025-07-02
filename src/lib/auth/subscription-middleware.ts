import { NextRequest, NextResponse } from 'next/server';
import { unstable_getServerSession } from 'next-auth/next';
import { authOptions } from './auth-options';
import { db } from '@/lib/db';

export interface SubscriptionStatus {
  isActive: boolean;
  status: 'FREE' | 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'INCOMPLETE' | 'INCOMPLETE_EXPIRED' | 'UNPAID';
  plan: string;
  trialEnd: Date | null;
  trialDaysLeft: number | null;
  isTrialExpired: boolean;
  needsUpgrade: boolean;
  features: string[];
  limits: {
    users: number;
    risks: number;
    storage: string;
    aiQueries: number;
  };
}

export interface SubscriptionRequirement {
  minPlan?: 'free' | 'pro' | 'enterprise';
  requiresActiveSub?: boolean;
  allowTrial?: boolean;
  requiredFeatures?: string[];
}

// Plan definitions
const PLAN_FEATURES = {
  free: {
    features: ['Basic risk management', 'Up to 10 risks', 'Basic reporting'],
    limits: { users: 3, risks: 10, storage: '100MB', aiQueries: 50 }
  },
  pro: {
    features: ['Advanced risk management', 'Unlimited risks', 'Advanced reporting', 'AI insights', 'Integrations'],
    limits: { users: 25, risks: -1, storage: '10GB', aiQueries: 1000 }
  },
  enterprise: {
    features: ['Enterprise risk management', 'Unlimited everything', 'Custom reporting', 'Advanced AI', 'SSO', 'API access'],
    limits: { users: -1, risks: -1, storage: 'Unlimited', aiQueries: -1 }
  }
};

// Get subscription status for a user
export async function getSubscriptionStatus(userId: string, organizationId: string): Promise<SubscriptionStatus> {
  try {
    // Get organization with active subscription
    const organization = await db.client.organization.findUnique({
      where: { id: organizationId },
      include: {
        subscriptions: {
          where: {
            status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] }
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    const subscription = organization.subscriptions[0];
    const now = new Date();

    // Determine subscription status
    let status: SubscriptionStatus['status'] = 'FREE';
    let isActive = false;
    let trialEnd: Date | null = null;
    let trialDaysLeft: number | null = null;
    let isTrialExpired = false;
    let plan = organization.plan || 'free';

    if (subscription) {
      status = subscription.status as SubscriptionStatus['status'];
      isActive = ['ACTIVE', 'TRIALING'].includes(subscription.status);
      trialEnd = subscription.trialEnd;
      
      if (trialEnd) {
        const timeDiff = trialEnd.getTime() - now.getTime();
        trialDaysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        isTrialExpired = timeDiff <= 0;
        
        if (isTrialExpired && subscription.status === 'TRIALING') {
          isActive = false;
          status = 'FREE';
        }
      }

      // Map Stripe price ID to plan name
      if (subscription.stripePriceId) {
        if (subscription.stripePriceId.includes('pro')) plan = 'pro';
        else if (subscription.stripePriceId.includes('enterprise')) plan = 'enterprise';
      }
    }

    const needsUpgrade = !isActive && plan === 'free';
    const planConfig = PLAN_FEATURES[plan as keyof typeof PLAN_FEATURES] || PLAN_FEATURES.free;

    return {
      isActive,
      status,
      plan,
      trialEnd,
      trialDaysLeft,
      isTrialExpired,
      needsUpgrade,
      features: planConfig.features,
      limits: planConfig.limits
    };
  } catch (error) {
    console.error('Error getting subscription status:', error);
    // Return free plan as fallback
    return {
      isActive: false,
      status: 'FREE',
      plan: 'free',
      trialEnd: null,
      trialDaysLeft: null,
      isTrialExpired: false,
      needsUpgrade: true,
      features: PLAN_FEATURES.free.features,
      limits: PLAN_FEATURES.free.limits
    };
  }
}

// Check if user meets subscription requirements
export function checkSubscriptionRequirements(
  subscriptionStatus: SubscriptionStatus,
  requirements: SubscriptionRequirement
): { allowed: boolean; reason?: string } {
  const { minPlan, requiresActiveSub, allowTrial, requiredFeatures } = requirements;

  // Check if active subscription is required
  if (requiresActiveSub && !subscriptionStatus.isActive) {
    if (subscriptionStatus.status === 'TRIALING' && !allowTrial) {
      return { allowed: false, reason: 'Trial access not allowed for this feature' };
    }
    if (!subscriptionStatus.isActive) {
      return { allowed: false, reason: 'Active subscription required' };
    }
  }

  // Check minimum plan requirement
  if (minPlan) {
    const planHierarchy = { free: 0, pro: 1, enterprise: 2 };
    const userPlanLevel = planHierarchy[subscriptionStatus.plan as keyof typeof planHierarchy] || 0;
    const requiredPlanLevel = planHierarchy[minPlan];
    
    if (userPlanLevel < requiredPlanLevel) {
      return { allowed: false, reason: `${minPlan} plan or higher required` };
    }
  }

  // Check required features
  if (requiredFeatures) {
    const missingFeatures = requiredFeatures.filter(
      feature => !subscriptionStatus.features.includes(feature)
    );
    if (missingFeatures.length > 0) {
      return { allowed: false, reason: `Missing required features: ${missingFeatures.join(', ')}` };
    }
  }

  return { allowed: true };
}

// Middleware to check subscription status
export async function withSubscription(
  req: NextRequest,
  requirements: SubscriptionRequirement = {}
) {
  try {
    import { unstable_getServerSession } from 'next-auth/next';
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const user = session.user as any;
    const subscriptionStatus = await getSubscriptionStatus(user.id, user.organizationId);
    
    // Check requirements
    const { allowed, reason } = checkSubscriptionRequirements(subscriptionStatus, requirements);
    
    if (!allowed) {
      return NextResponse.json(
        { 
          error: reason || 'Subscription upgrade required',
          code: 'SUBSCRIPTION_REQUIRED',
          subscriptionStatus,
          upgradeUrl: '/billing/upgrade'
        },
        { status: 402 } // Payment Required
      );
    }

    // Add subscription status to request headers for use in route handlers
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-subscription-status', JSON.stringify(subscriptionStatus));
    requestHeaders.set('x-user-id', user.id);
    requestHeaders.set('x-organization-id', user.organizationId);

    return { subscriptionStatus, user, headers: requestHeaders };
  } catch (error) {
    console.error('Subscription middleware error:', error);
    return NextResponse.json(
      { error: 'Failed to verify subscription', code: 'SUBSCRIPTION_ERROR' },
      { status: 500 }
    );
  }
}

// Higher-order function to wrap API routes with subscription checks
export function withSubscriptionCheck(
  handler: (req: NextRequest, context: any) => Promise<NextResponse>,
  requirements: SubscriptionRequirement = {}
) {
  return async (req: NextRequest, context: any) => {
    const subscriptionCheck = await withSubscription(req, requirements);
    
    if (subscriptionCheck instanceof NextResponse) {
      return subscriptionCheck; // Return error response
    }
    
    // Add subscription data to context
    const enhancedContext = {
      ...context,
      subscription: subscriptionCheck.subscriptionStatus,
      user: subscriptionCheck.user
    };
    
    // Create new request with subscription headers
    const enhancedRequest = new NextRequest(req.url, {
      method: req.method,
      headers: subscriptionCheck.headers,
      body: req.body
    });
    
    return handler(enhancedRequest, enhancedContext);
  };
}

// Utility to get subscription status from session
export function getSubscriptionFromSession(session: any): SubscriptionStatus | null {
  if (!session?.user) return null;
  
  const user = session.user;
  return {
    isActive: user.subscriptionStatus === 'ACTIVE' || user.subscriptionStatus === 'TRIALING',
    status: user.subscriptionStatus || 'FREE',
    plan: user.plan || 'free',
    trialEnd: user.trialEnd ? new Date(user.trialEnd) : null,
    trialDaysLeft: user.trialEnd ? Math.ceil((new Date(user.trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null,
    isTrialExpired: user.trialEnd ? new Date(user.trialEnd) < new Date() : false,
    needsUpgrade: !user.subscriptionStatus || user.subscriptionStatus === 'FREE',
    features: PLAN_FEATURES[user.plan as keyof typeof PLAN_FEATURES]?.features || PLAN_FEATURES.free.features,
    limits: PLAN_FEATURES[user.plan as keyof typeof PLAN_FEATURES]?.limits || PLAN_FEATURES.free.limits
  };
} 