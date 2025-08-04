import { db } from '@/lib/db';
import { stripeService } from './stripe';
import { notificationManager } from '@/lib/collaboration/notifications';
import { v4 as uuidv4 } from 'uuid';
// import { addMonths, addDays } from 'date-fns'
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
  // Organization Subscription Queries
  async getOrganizationSubscription(_organizationId: string
  ): Promise<OrganizationSubscription | null> {
    const subscription = await db.client.organizationSubscription.findFirst({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    })

    if (!subscription) return null;

    return {
      ...subscription,
      metadata: subscription.metadata as any,
    }
  }

  async getActiveSubscription(_organizationId: string): Promise<OrganizationSubscription | null> {
    const subscription = await db.client.organizationSubscription.findFirst({
      where: {
        organizationId,
        status: 'active',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) return null;

    return {
      ...subscription,
      metadata: subscription.metadata as any,
    }
  }

  // Subscription Plan Management
  async createSubscriptionPlan(
    plan: Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<SubscriptionPlan> {
    const newPlan = await db.client.subscriptionPlan.create({
      data: {
        name: plan.name,
        description: plan.description,
        type: plan.type,
        price: plan.price,
        currency: plan.currency,
        billingInterval: plan.billingInterval,
        features: plan.features as any,
        limits: plan.limits as any,
        isActive: plan.isActive,
        trialDays: plan.trialDays,
        stripeProductId: plan.stripeProductId,
        stripePriceId: plan.stripePriceId,
      },
    })

    return {
      ...newPlan,
      features: newPlan.features as any,
      limits: newPlan.limits as any,
    }
  }

  async getSubscriptionPlans(filters?: {
    type?: string[];
    active?: boolean;
    currency?: string;
  }): Promise<SubscriptionPlan[]> {
    const where: any = {}

    if (filters?.type?.length) {
      where.type = { in: filters.type }
    }

    if (filters?.active !== undefined) {
      where.isActive = filters.active;
    }

    if (filters?.currency) {
      where.currency = filters.currency;
    }

    const plans = await db.client.subscriptionPlan.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return plans.map((plan) => ({
      ...plan,
      features: plan.features as any,
      limits: plan.limits as any,
    }));
  }

  // Organization Subscription Management
  async createSubscription(_organizationId: string,
    planId: string,
    options?: {
      trialDays?: number
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

    const plan = await db.client.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new Error('Subscription plan not found');
    }

    const now = new Date();
    const periodEnd = plan.billingCycle === 'yearly' ? addMonths(now, 12) : addMonths(now, 1);

    const subscription = await db.client.organizationSubscription.create({
      data: {
        organizationId,
        planId,
        stripeCustomerId: organization.stripeCustomerId,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        trialStart: options?.trialDays ? now : undefined,
        trialEnd: options?.trialDays ? addDays(now, options.trialDays) : undefined,
        cancelAtPeriodEnd: false,
        billingCycle: 'monthly',
        quantity: 1,
        unitPrice: plan.price,
        metadata: options?.coupon ? { coupon: options.coupon } : {},
      },
    });

    return {
      ...subscription,
      metadata: subscription.metadata as any,
    }
  }

  async changeSubscriptionPlan(
    subscriptionId: string,
    newPlanId: string
  ): Promise<OrganizationSubscription> {
    const existingSubscription = await db.client.organizationSubscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!existingSubscription) {
      throw new Error('Subscription not found');
    }

    const newPlan = await db.client.subscriptionPlan.findUnique({
      where: { id: newPlanId },
    });

    if (!newPlan) {
      throw new Error('New subscription plan not found');
    }

    const subscription = await db.client.organizationSubscription.update({
      where: { id: subscriptionId },
      data: {
        planId: newPlanId,
        unitPrice: newPlan.price,
        updatedAt: new Date(),
      },
    });

    return {
      ...subscription,
      metadata: subscription.metadata as any,
    }
  }

  async cancelSubscription(
    subscriptionId: string,
    immediately: boolean = false
  ): Promise<OrganizationSubscription> {
    const existingSubscription = await db.client.organizationSubscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!existingSubscription) {
      throw new Error('Subscription not found');
    }

    const subscription = await db.client.organizationSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: immediately ? 'canceled' : 'active',
        cancelAtPeriodEnd: !immediately,
        canceledAt: immediately ? new Date() : undefined,
        updatedAt: new Date(),
      },
    });

    return {
      ...subscription,
      metadata: subscription.metadata as any,
    }
  }

  async reactivateSubscription(subscriptionId: string): Promise<OrganizationSubscription> {
    const existingSubscription = await db.client.organizationSubscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!existingSubscription) {
      throw new Error('Subscription not found');
    }

    const subscription = await db.client.organizationSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'active',
        cancelAtPeriodEnd: false,
        canceledAt: null,
        updatedAt: new Date(),
      },
    });

    return {
      ...subscription,
      metadata: subscription.metadata as any,
    }
  }

  // Usage Tracking
  async trackUsage(_organizationId: string,
    type: UsageMetric['type'],
    quantity: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    const subscription = await db.client.organizationSubscription.findFirst({
      where: {
        organizationId,
        status: 'active',
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!subscription) {
      throw new Error('No active subscription found for organization');
    }

    const now = new Date();
    const period = new Date(now.getFullYear(), now.getMonth(), 1); // Start of current month

    await db.client.usageRecord.create({
      data: {
        organizationId,
        subscriptionId: subscription.id,
        metricType: type,
        quantity,
        unitPrice: 0, // Will be calculated based on plan
        total: 0, // Will be calculated based on plan
        period,
        metadata: metadata || {},
      },
    });
  }

  // Payment Method Management
  async addPaymentMethod(_organizationId: string,
    stripePaymentMethodId: string,
    setAsDefault: boolean = false
  ): Promise<PaymentMethod> {
    const organization = await db.client.organization.findUnique({
      where: { id: organizationId },
    })

    if (!organization) {
      throw new Error('Organization not found');
    }

    // If setting as default, unset other default payment methods
    if (setAsDefault) {
      await db.client.paymentMethod.updateMany({
        where: {
          organizationId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      })
    }

    // Get payment method details from Stripe
    const stripePaymentMethod = await stripeService.getPaymentMethod(stripePaymentMethodId)

    const paymentMethod = await db.client.paymentMethod.create({
      data: {
        organizationId,
        stripePaymentMethodId,
        type: stripePaymentMethod.type,
        card: stripePaymentMethod.card
          ? {
              brand: stripePaymentMethod.card.brand,
              last4: stripePaymentMethod.card.last4,
              expMonth: stripePaymentMethod.card.exp_month,
              expYear: stripePaymentMethod.card.exp_year,
              fingerprint: stripePaymentMethod.card.fingerprint,
            }
          : undefined,
        bankAccount: stripePaymentMethod.us_bank_account
          ? {
              routingNumber: stripePaymentMethod.us_bank_account.routing_number,
              last4: stripePaymentMethod.us_bank_account.last4,
              accountType: stripePaymentMethod.us_bank_account.account_type,
              bankName: stripePaymentMethod.us_bank_account.bank_name,
            }
          : undefined,
        isDefault: setAsDefault,
        isActive: true,
        metadata: {},
      },
    });

    return {
      ...paymentMethod,
      card: paymentMethod.card as any,
      bankAccount: paymentMethod.bankAccount as any,
      metadata: paymentMethod.metadata as any,
    }
  }

  // Analytics
  async getBillingAnalytics(
    organizationId?: string,
    period: { start: Date; end: Date } = {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date(),
    }
  ): Promise<BillingAnalytics> {
    const subscriptionWhere: any = {
      createdAt: {
        gte: period.start,
        lte: period.end,
      },
    }

    if (organizationId) {
      subscriptionWhere.organizationId = organizationId;
    }

    const [subscriptions, invoices, plans] = await Promise.all([
      db.client.organizationSubscription.findMany({
        where: subscriptionWhere,
        include: { plan: true },
      }),
      db.client.invoice.findMany({
        where: {
          createdAt: {
            gte: period.start,
            lte: period.end,
          },
        },
      }),
      db.client.subscriptionPlan.findMany({
        include: {
          subscriptions: {
            where: { status: 'active' },
          },
        },
      }),
    ]);

    const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
    const recurringRevenue = invoices
      .filter((i) => i.type === 'subscription')
      .reduce((sum, invoice) => sum + invoice.total, 0);
    const oneTimeRevenue = invoices
      .filter((i) => i.type === 'one_time')
      .reduce((sum, invoice) => sum + invoice.total, 0);

    const activeSubscriptions = subscriptions.filter((s) => s.status === 'active');
    const trialSubscriptions = subscriptions.filter((s) => s.trialEnd && s.trialEnd > new Date());
    const canceledSubscriptions = subscriptions.filter((s) => s.status === 'canceled');

    const planDistribution = plans.map((plan) => ({
      planId: plan.id,
      planName: plan.name,
      count: plan.subscriptions.length,
      revenue: plan.subscriptions.reduce((sum, sub) => sum + sub.unitPrice, 0),
    }));

    return {
      period,
      revenue: {
        total: totalRevenue,
        recurring: recurringRevenue,
        oneTime: oneTimeRevenue,
        usage: 0, // Calculate from usage records if needed
        currency: 'USD',
      },
      subscriptions: {
        total: subscriptions.length,
        active: activeSubscriptions.length,
        trial: trialSubscriptions.length,
        canceled: canceledSubscriptions.length,
        churnRate: canceledSubscriptions.length / Math.max(subscriptions.length, 1),
      },
      customers: {
        total: new Set(subscriptions.map((s) => s.organizationId)).size,
        new: subscriptions.length,
        churned: canceledSubscriptions.length,
      },
      metrics: {
        mrr: activeSubscriptions.reduce((sum, sub) => sum + sub.unitPrice, 0),
        arr: activeSubscriptions.reduce((sum, sub) => sum + sub.unitPrice, 0) * 12,
        ltv: 0, // Calculate lifetime value if needed
        cac: 0, // Calculate customer acquisition cost if needed
        arpu: totalRevenue / Math.max(subscriptions.length, 1),
      },
      planDistribution,
      paymentMethods: [], // Load payment methods if needed
    }
  }
}

export const billingManager = new BillingManager();
