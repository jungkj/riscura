import { db } from '@/lib/db';
import { stripeService } from './stripe';
import { notificationManager } from '@/lib/collaboration/notifications';
import { v4 as uuidv4 } from 'uuid';
import type {
  SubscriptionPlan,
  OrganizationSubscription,
  UsageBilling,
  UsageMetric,
  Invoice,
  PaymentMethod,
  BillingAnalytics,
} from './types';

export class BillingManager {

  // Subscription Plan Management
  async createSubscriptionPlan(plan: Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<SubscriptionPlan> {
    // TODO: Implement subscription plan model in Prisma schema
    // const newPlan = await db.client.subscriptionPlan.create({
    //   data: {
    //     ...plan,
    //     id: uuidv4(),
    //     createdAt: new Date(),
    //     updatedAt: new Date(),
    //   },
    // });

    // Return mock plan for now
    const newPlan: SubscriptionPlan = {
      ...plan,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return newPlan;
  }

  async getSubscriptionPlans(filters?: {
    type?: string[];
    active?: boolean;
    currency?: string;
  }): Promise<SubscriptionPlan[]> {
    // TODO: Implement subscription plan model in Prisma schema
    // Return mock plans for now
    return [
      {
        id: 'plan_free',
        name: 'Free',
        description: 'Basic features for small teams',
        type: 'freemium',
        price: 0,
        currency: 'USD',
        billingInterval: 'monthly',
        features: [
          { id: 'f1', name: '5 users', description: 'Up to 5 team members', category: 'core', included: true },
          { id: 'f2', name: '10 risks', description: 'Track up to 10 risks', category: 'core', included: true },
          { id: 'f3', name: 'Basic reports', description: 'Basic reporting features', category: 'reporting', included: true },
        ],
        limits: {
          users: 5,
          risks: 10,
          controls: 20,
          documents: 50,
          aiQueries: 100,
          storageGB: 1,
          apiCalls: 1000,
          frameworks: 2,
          reports: 10,
        },
        isActive: true,
        trialDays: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'plan_pro',
        name: 'Professional',
        description: 'Advanced features for growing teams',
        type: 'professional',
        price: 99,
        currency: 'USD',
        billingInterval: 'monthly',
        features: [
          { id: 'f1', name: 'Unlimited users', description: 'No limit on team members', category: 'core', included: true },
          { id: 'f2', name: 'Unlimited risks', description: 'Track unlimited risks', category: 'core', included: true },
          { id: 'f3', name: 'Advanced reports', description: 'Advanced analytics and reporting', category: 'reporting', included: true },
          { id: 'f4', name: 'API access', description: 'Full API access', category: 'core', included: true },
        ],
        limits: {
          users: -1,
          risks: -1,
          controls: -1,
          documents: -1,
          aiQueries: 10000,
          storageGB: 10,
          apiCalls: 100000,
          frameworks: -1,
          reports: -1,
        },
        isActive: true,
        trialDays: 14,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  // Organization Subscription Management
  async createSubscription(
    organizationId: string,
    planId: string,
    options?: {
      trialDays?: number;
      coupon?: string;
      paymentMethodId?: string;
    }
  ): Promise<OrganizationSubscription> {
    const organization = await db.client.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    // TODO: Implement subscription model in Prisma schema
    // Return mock subscription for now
    const subscription: OrganizationSubscription = {
      id: uuidv4(),
      organizationId,
      planId,
      stripeSubscriptionId: undefined,
      stripeCustomerId: organization.stripeCustomerId || undefined,
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      trialStart: options?.trialDays ? new Date() : undefined,
      trialEnd: options?.trialDays 
        ? new Date(Date.now() + options.trialDays * 24 * 60 * 60 * 1000) 
        : undefined,
      cancelAtPeriodEnd: false,
      billingCycle: 'monthly',
      quantity: 1,
      unitPrice: 0,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return subscription;
  }

  async changeSubscriptionPlan(
    subscriptionId: string,
    newPlanId: string
  ): Promise<OrganizationSubscription> {
    // TODO: Implement with real database operations
    // Return mock updated subscription for now
    const subscription: OrganizationSubscription = {
      id: subscriptionId,
      organizationId: 'org_123',
      planId: newPlanId,
      stripeSubscriptionId: undefined,
      stripeCustomerId: undefined,
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      trialStart: undefined,
      trialEnd: undefined,
      cancelAtPeriodEnd: false,
      billingCycle: 'monthly',
      quantity: 1,
      unitPrice: 0,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return subscription;
  }

  async cancelSubscription(
    subscriptionId: string,
    immediately: boolean = false
  ): Promise<OrganizationSubscription> {
    // TODO: Implement with real database operations
    // Return mock canceled subscription for now
    const subscription: OrganizationSubscription = {
      id: subscriptionId,
      organizationId: 'org_123',
      planId: 'plan_free',
      stripeSubscriptionId: undefined,
      stripeCustomerId: undefined,
      status: immediately ? 'canceled' : 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      trialStart: undefined,
      trialEnd: undefined,
      cancelAtPeriodEnd: !immediately,
      billingCycle: 'monthly',
      quantity: 1,
      unitPrice: 0,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return subscription;
  }

  async reactivateSubscription(
    subscriptionId: string
  ): Promise<OrganizationSubscription> {
    // TODO: Implement with real database operations
    // Return mock reactivated subscription for now
    const subscription: OrganizationSubscription = {
      id: subscriptionId,
      organizationId: 'org_123',
      planId: 'plan_pro',
      stripeSubscriptionId: undefined,
      stripeCustomerId: undefined,
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      trialStart: undefined,
      trialEnd: undefined,
      cancelAtPeriodEnd: false,
      billingCycle: 'monthly',
      quantity: 1,
      unitPrice: 0,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return subscription;
  }

  // Usage Tracking
  async trackUsage(
    organizationId: string,
    type: UsageMetric['type'],
    quantity: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    // TODO: Implement usage tracking when models are available
    console.log('Usage tracked:', {
      organizationId,
      type,
      quantity,
      metadata,
    });
  }

  // Payment Method Management
  async addPaymentMethod(
    organizationId: string,
    stripePaymentMethodId: string,
    setAsDefault: boolean = false
  ): Promise<PaymentMethod> {
    const organization = await db.client.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    // TODO: Implement payment method model in Prisma schema
    // Return mock payment method for now
    const paymentMethod: PaymentMethod = {
      id: uuidv4(),
      organizationId,
      stripePaymentMethodId,
      type: 'card',
      card: {
        brand: 'visa',
        last4: '4242',
        expMonth: 12,
        expYear: 2025,
        fingerprint: 'mock_fingerprint',
      },
      isDefault: setAsDefault,
      isActive: true,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return paymentMethod;
  }

  // Analytics
  async getBillingAnalytics(
    organizationId?: string,
    period: { start: Date; end: Date } = {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date(),
    }
  ): Promise<BillingAnalytics> {
    // Simple analytics implementation
    return {
      period,
      revenue: {
        total: 0,
        recurring: 0,
        oneTime: 0,
        usage: 0,
        currency: 'USD',
      },
      subscriptions: {
        total: 0,
        active: 0,
        trial: 0,
        canceled: 0,
        churnRate: 0,
      },
      customers: {
        total: 0,
        new: 0,
        churned: 0,
      },
      metrics: {
        mrr: 0,
        arr: 0,
        ltv: 0,
        cac: 0,
        arpu: 0,
      },
      planDistribution: [],
      paymentMethods: [],
    };
  }
}

export const billingManager = new BillingManager(); 