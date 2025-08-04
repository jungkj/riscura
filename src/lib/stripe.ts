import Stripe from 'stripe';
import { env } from '@/config/env';

if (!env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil',
  typescript: true,
});

// Subscription plans configuration
export const SUBSCRIPTION_PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    priceId: null,
    features: ['Up to 5 risks', 'Basic risk assessment', 'Email support', 'Standard templates'],
    limits: {
      risks: 5,
      controls: 10,
      users: 1,
      storage: '100MB',
    },
  },
  PRO: {
    name: 'Pro',
    price: 15,
    priceId: env.STRIPE_PRICE_ID_PRO,
    features: [
      'Unlimited risks',
      'Advanced AI analysis',
      'Priority support',
      'Custom templates',
      'Integration APIs',
      'Advanced reporting',
      'Team collaboration',
    ],
    limits: {
      risks: Infinity,
      controls: Infinity,
      users: 10,
      storage: '10GB',
    },
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: null, // Custom pricing
    priceId: env.STRIPE_PRICE_ID_ENTERPRISE,
    features: [
      'Everything in Pro',
      'Custom integrations',
      'Dedicated support',
      'SSO & SAML',
      'Advanced security',
      'Compliance frameworks',
      'White-label options',
      'SLA guarantee',
    ],
    limits: {
      risks: Infinity,
      controls: Infinity,
      users: Infinity,
      storage: 'Unlimited',
    },
  },
} as const

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS;

// Free trial configuration
export const FREE_TRIAL_CONFIG = {
  duration: 7, // 7 days
  plan: 'PRO' as SubscriptionPlan,
  autoCancel: true,
}

// Helper functions
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(price)
}

export function getPlanByPriceId(priceId: string): SubscriptionPlan | null {
  for (const [planKey, plan] of Object.entries(SUBSCRIPTION_PLANS)) {
    if (plan.priceId === priceId) {
      return planKey as SubscriptionPlan;
    }
  }
  return null;
}

export function createCheckoutSession(params: {
  priceId: string;
  customerId?: string;
  userId: string;
  organizationId: string;
  successUrl: string;
  cancelUrl: string;
  trialPeriodDays?: number;
}) {
  return stripe.checkout.sessions.create({
    customer: params.customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: params.priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      userId: params.userId,
      organizationId: params.organizationId,
    },
    subscription_data: params.trialPeriodDays
      ? {
          trial_period_days: params.trialPeriodDays,
          metadata: {
            userId: params.userId,
            organizationId: params.organizationId,
          },
        }
      : {
          metadata: {
            userId: params.userId,
            organizationId: params.organizationId,
          },
        },
    allow_promotion_codes: true,
  });
}

export function createCustomer(params: { email: string; name: string; organizationId: string }) {
  return stripe.customers.create({
    email: params.email,
    name: params.name,
    metadata: {
      organizationId: params.organizationId,
    },
  });
}
