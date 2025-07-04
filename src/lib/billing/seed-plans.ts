import { db } from '@/lib/db';
import { SubscriptionPlan } from './types';

const DEFAULT_PLANS: Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Free',
    description: 'Perfect for getting started with basic risk management',
    type: 'freemium',
    price: 0,
    currency: 'USD',
    billingInterval: 'monthly',
    features: [
      { id: 'basic_risks', name: 'Risk Management', description: 'Basic risk tracking and assessment', category: 'core', included: true },
      { id: 'basic_controls', name: 'Control Management', description: 'Basic control framework', category: 'core', included: true },
      { id: 'basic_reports', name: 'Basic Reports', description: 'Standard reporting templates', category: 'reporting', included: true },
      { id: 'email_support', name: 'Email Support', description: 'Email support during business hours', category: 'support', included: true },
      { id: 'advanced_analytics', name: 'Advanced Analytics', description: 'Detailed insights and trends', category: 'reporting', included: false },
      { id: 'api_access', name: 'API Access', description: 'RESTful API for integrations', category: 'integration', included: false },
      { id: 'custom_frameworks', name: 'Custom Frameworks', description: 'Custom compliance frameworks', category: 'compliance', included: false },
      { id: 'priority_support', name: 'Priority Support', description: '24/7 priority support', category: 'support', included: false },
    ],
    limits: {
      users: 3,
      risks: 25,
      controls: 50,
      documents: 100,
      aiQueries: 50,
      storageGB: 1,
      apiCalls: 0,
      frameworks: 1,
      reports: 5,
    },
    isActive: true,
    trialDays: 0,
    stripeProductId: null,
    stripePriceId: null,
  },
  {
    name: 'Professional',
    description: 'For growing teams that need advanced features and higher limits',
    type: 'professional',
    price: 49,
    currency: 'USD',
    billingInterval: 'monthly',
    features: [
      { id: 'basic_risks', name: 'Risk Management', description: 'Basic risk tracking and assessment', category: 'core', included: true },
      { id: 'basic_controls', name: 'Control Management', description: 'Basic control framework', category: 'core', included: true },
      { id: 'basic_reports', name: 'Basic Reports', description: 'Standard reporting templates', category: 'reporting', included: true },
      { id: 'advanced_analytics', name: 'Advanced Analytics', description: 'Detailed insights and trends', category: 'reporting', included: true },
      { id: 'api_access', name: 'API Access', description: 'RESTful API for integrations', category: 'integration', included: true },
      { id: 'email_support', name: 'Email Support', description: 'Email support during business hours', category: 'support', included: true },
      { id: 'custom_frameworks', name: 'Custom Frameworks', description: 'Custom compliance frameworks', category: 'compliance', included: false },
      { id: 'priority_support', name: 'Priority Support', description: '24/7 priority support', category: 'support', included: false },
    ],
    limits: {
      users: 15,
      risks: 500,
      controls: 1000,
      documents: 5000,
      aiQueries: 1000,
      storageGB: 10,
      apiCalls: 10000,
      frameworks: 5,
      reports: 50,
    },
    isActive: true,
    trialDays: 14,
    stripeProductId: null,
    stripePriceId: null,
  },
  {
    name: 'Enterprise',
    description: 'For large organizations requiring unlimited access and premium support',
    type: 'enterprise',
    price: 199,
    currency: 'USD',
    billingInterval: 'monthly',
    features: [
      { id: 'basic_risks', name: 'Risk Management', description: 'Basic risk tracking and assessment', category: 'core', included: true },
      { id: 'basic_controls', name: 'Control Management', description: 'Basic control framework', category: 'core', included: true },
      { id: 'basic_reports', name: 'Basic Reports', description: 'Standard reporting templates', category: 'reporting', included: true },
      { id: 'advanced_analytics', name: 'Advanced Analytics', description: 'Detailed insights and trends', category: 'reporting', included: true },
      { id: 'api_access', name: 'API Access', description: 'RESTful API for integrations', category: 'integration', included: true },
      { id: 'custom_frameworks', name: 'Custom Frameworks', description: 'Custom compliance frameworks', category: 'compliance', included: true },
      { id: 'priority_support', name: 'Priority Support', description: '24/7 priority support', category: 'support', included: true },
      { id: 'email_support', name: 'Email Support', description: 'Email support during business hours', category: 'support', included: true },
    ],
    limits: {
      users: -1, // Unlimited
      risks: -1,
      controls: -1,
      documents: -1,
      aiQueries: 10000,
      storageGB: 100,
      apiCalls: 100000,
      frameworks: -1,
      reports: -1,
    },
    isActive: true,
    trialDays: 30,
    stripeProductId: null,
    stripePriceId: null,
  },
];

export async function seedSubscriptionPlans(): Promise<void> {
  console.log('🌱 Seeding subscription plans...');

  try {
    // Check if plans already exist
    const existingPlans = await db.client.subscriptionPlan.findMany();
    
    if (existingPlans.length > 0) {
      console.log('📋 Subscription plans already exist, skipping seed...');
      return;
    }

    // Create default plans
    for (const planData of DEFAULT_PLANS) {
      await db.client.subscriptionPlan.create({
        data: {
          name: planData.name,
          description: planData.description,
          type: planData.type,
          price: planData.price,
          currency: planData.currency,
          billingInterval: planData.billingInterval,
          features: planData.features as any,
          limits: planData.limits as any,
          isActive: planData.isActive,
          trialDays: planData.trialDays,
          stripeProductId: planData.stripeProductId,
          stripePriceId: planData.stripePriceId,
        },
      });
      
      console.log(`✅ Created plan: ${planData.name}`);
    }

    console.log('🎉 Successfully seeded subscription plans!');
  } catch (error) {
    console.error('❌ Error seeding subscription plans:', error);
    throw error;
  }
}

export async function createDefaultSubscriptionForOrganization(organizationId: string): Promise<void> {
  try {
    // Check if organization already has a subscription
    const existingSubscription = await db.client.organizationSubscription.findFirst({
      where: { organizationId },
    });

    if (existingSubscription) {
      console.log(`Organization ${organizationId} already has a subscription`);
      return;
    }

    // Find the free plan
    const freePlan = await db.client.subscriptionPlan.findFirst({
      where: { type: 'freemium', isActive: true },
    });

    if (!freePlan) {
      throw new Error('Free plan not found. Please run seedSubscriptionPlans() first.');
    }

    // Create a free subscription for the organization
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year

    await db.client.organizationSubscription.create({
      data: {
        organizationId,
        planId: freePlan.id,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        billingCycle: 'monthly',
        quantity: 1,
        unitPrice: freePlan.price,
        metadata: {
          autoCreated: true,
          createdAt: now.toISOString(),
        },
      },
    });

    console.log(`✅ Created free subscription for organization: ${organizationId}`);
  } catch (error) {
    console.error('❌ Error creating default subscription:', error);
    throw error;
  }
}

// Helper function to get plan by type
export async function getPlanByType(type: string): Promise<SubscriptionPlan | null> {
  const plan = await db.client.subscriptionPlan.findFirst({
    where: { type, isActive: true },
  });

  if (!plan) return null;

  return {
    ...plan,
    features: plan.features as any,
    limits: plan.limits as any,
  };
}

// Helper function to upgrade organization to a different plan
export async function upgradeOrganizationPlan(
  organizationId: string,
  newPlanType: string
): Promise<void> {
  const newPlan = await getPlanByType(newPlanType);
  
  if (!newPlan) {
    throw new Error(`Plan type '${newPlanType}' not found`);
  }

  const subscription = await db.client.organizationSubscription.findFirst({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
  });

  if (!subscription) {
    throw new Error(`No subscription found for organization: ${organizationId}`);
  }

  await db.client.organizationSubscription.update({
    where: { id: subscription.id },
    data: {
      planId: newPlan.id,
      unitPrice: newPlan.price,
      updatedAt: new Date(),
    },
  });

  console.log(`✅ Upgraded organization ${organizationId} to ${newPlan.name} plan`);
}