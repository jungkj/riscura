import { db } from '@/lib/db';
import { stripeService } from './stripe';
import { notificationManager } from '@/lib/collaboration/notifications';
import { addDays, differenceInDays, isBefore, isAfter } from 'date-fns';

/**
 * Trial Management System
 * Hybrid approach: Use Stripe for trial tracking but add custom logic for better control
 */
export class TrialManager {
  
  /**
   * Start a trial for an organization
   * This can be called directly OR through Stripe subscription creation
   */
  async startTrial(organizationId: string, planId: string, trialDays: number = 14): Promise<void> {
    const now = new Date();
    const trialEnd = addDays(now, trialDays);

    // Create or update subscription with trial status
    await db.client.organizationSubscription.upsert({
      where: {
        organizationId_planId: {
          organizationId,
          planId,
        },
      },
      update: {
        status: 'trialing',
        trialStart: now,
        trialEnd,
        currentPeriodStart: now,
        currentPeriodEnd: trialEnd,
        updatedAt: now,
      },
      create: {
        organizationId,
        planId,
        status: 'trialing',
        trialStart: now,
        trialEnd,
        currentPeriodStart: now,
        currentPeriodEnd: trialEnd,
        billingCycle: 'monthly',
        quantity: 1,
        unitPrice: 0, // No charge during trial
      },
    });

    // Send welcome notification
    await notificationManager.sendNotification({
      type: 'TRIAL_STARTED',
      title: 'Welcome to Your Trial!',
      message: `Your ${trialDays}-day trial has started. Explore all premium features!`,
      recipientId: organizationId,
      urgency: 'low',
    });

    // Schedule trial ending reminder (3 days before)
    if (trialDays > 3) {
      await this.scheduleTrialReminder(organizationId, addDays(now, trialDays - 3));
    }
  }

  /**
   * Check all active trials and send notifications as needed
   * Should be run daily via cron job
   */
  async checkTrialStatuses(): Promise<void> {
    const now = new Date();
    
    // Find trials ending in 3 days
    const trialsEndingSoon = await db.client.organizationSubscription.findMany({
      where: {
        status: 'trialing',
        trialEnd: {
          gte: addDays(now, 2),
          lte: addDays(now, 4),
        },
      },
      include: {
        organization: true,
        plan: true,
      },
    });

    for (const subscription of trialsEndingSoon) {
      await this.sendTrialEndingNotification(subscription);
    }

    // Find expired trials
    const expiredTrials = await db.client.organizationSubscription.findMany({
      where: {
        status: 'trialing',
        trialEnd: {
          lt: now,
        },
      },
      include: {
        organization: true,
        plan: true,
      },
    });

    for (const subscription of expiredTrials) {
      await this.handleTrialExpiration(subscription);
    }
  }

  /**
   * Convert trial to paid subscription
   */
  async convertTrialToPaid(
    subscriptionId: string,
    paymentMethodId?: string
  ): Promise<void> {
    const subscription = await db.client.organizationSubscription.findUnique({
      where: { id: subscriptionId },
      include: {
        organization: true,
        plan: true,
      },
    });

    if (!subscription || subscription.status !== 'trialing') {
      throw new Error('Invalid trial subscription');
    }

    // If using Stripe, create/update the subscription
    if (subscription.organization.stripeCustomerId && subscription.plan.stripePriceId) {
      // Attach payment method if provided
      if (paymentMethodId) {
        await stripeService.attachPaymentMethod(
          paymentMethodId,
          subscription.organization.stripeCustomerId
        );
        await stripeService.setDefaultPaymentMethod(
          subscription.organization.stripeCustomerId,
          paymentMethodId
        );
      }

      // Create Stripe subscription (will handle trial end automatically)
      const stripeSubscription = await stripeService.createSubscription(
        subscription.organization.stripeCustomerId,
        subscription.plan.stripePriceId,
        subscription.organizationId,
        {
          trialDays: Math.max(0, differenceInDays(subscription.trialEnd!, new Date())),
          metadata: {
            convertedFromTrial: 'true',
            originalTrialStart: subscription.trialStart?.toISOString(),
          },
        }
      );

      // Update local subscription
      await db.client.organizationSubscription.update({
        where: { id: subscriptionId },
        data: {
          stripeSubscriptionId: stripeSubscription.id,
          status: 'active',
          unitPrice: subscription.plan.price,
          updatedAt: new Date(),
        },
      });
    } else {
      // Manual conversion (no Stripe)
      await db.client.organizationSubscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'active',
          unitPrice: subscription.plan.price,
          currentPeriodStart: new Date(),
          currentPeriodEnd: addDays(new Date(), 30),
          updatedAt: new Date(),
        },
      });
    }

    // Send confirmation
    await notificationManager.sendNotification({
      type: 'TRIAL_CONVERTED',
      title: 'Welcome to Premium!',
      message: `Your trial has been converted to a paid subscription. Thank you for choosing us!`,
      recipientId: subscription.organizationId,
      urgency: 'low',
    });
  }

  /**
   * Extend an existing trial
   */
  async extendTrial(subscriptionId: string, additionalDays: number): Promise<void> {
    const subscription = await db.client.organizationSubscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription || subscription.status !== 'trialing') {
      throw new Error('Can only extend active trials');
    }

    const newTrialEnd = addDays(subscription.trialEnd!, additionalDays);

    await db.client.organizationSubscription.update({
      where: { id: subscriptionId },
      data: {
        trialEnd: newTrialEnd,
        currentPeriodEnd: newTrialEnd,
        updatedAt: new Date(),
      },
    });

    // Update Stripe if connected
    if (subscription.stripeSubscriptionId) {
      await stripeService.updateSubscription(subscription.stripeSubscriptionId, {
        trial_end: Math.floor(newTrialEnd.getTime() / 1000),
      });
    }

    await notificationManager.sendNotification({
      type: 'TRIAL_EXTENDED',
      title: 'Trial Extended!',
      message: `Your trial has been extended by ${additionalDays} days.`,
      recipientId: subscription.organizationId,
      urgency: 'low',
    });
  }

  /**
   * Get trial status and remaining days
   */
  async getTrialStatus(organizationId: string): Promise<{
    isInTrial: boolean;
    daysRemaining: number;
    trialEnd?: Date;
    canExtend: boolean;
  }> {
    const subscription = await db.client.organizationSubscription.findFirst({
      where: {
        organizationId,
        status: 'trialing',
      },
    });

    if (!subscription || !subscription.trialEnd) {
      return {
        isInTrial: false,
        daysRemaining: 0,
        canExtend: false,
      };
    }

    const now = new Date();
    const daysRemaining = Math.max(0, differenceInDays(subscription.trialEnd, now));

    return {
      isInTrial: true,
      daysRemaining,
      trialEnd: subscription.trialEnd,
      canExtend: daysRemaining > 0 && daysRemaining < 7, // Allow extension in last week
    };
  }

  // Private helper methods
  private async sendTrialEndingNotification(subscription: any): Promise<void> {
    const daysLeft = differenceInDays(subscription.trialEnd, new Date());
    
    await notificationManager.sendNotification({
      type: 'TRIAL_ENDING',
      title: `Trial Ending in ${daysLeft} Days`,
      message: `Your ${subscription.plan.name} trial ends soon. Add a payment method to continue enjoying premium features.`,
      recipientId: subscription.organizationId,
      urgency: 'high',
      actionUrl: '/billing/upgrade',
      actionText: 'Upgrade Now',
    });
  }

  private async handleTrialExpiration(subscription: any): Promise<void> {
    // Check if they added a payment method
    const hasPaymentMethod = subscription.organization.stripeCustomerId && 
      await this.checkForPaymentMethod(subscription.organization.stripeCustomerId);

    if (hasPaymentMethod && subscription.stripeSubscriptionId) {
      // Stripe will automatically convert to paid
      await db.client.organizationSubscription.update({
        where: { id: subscription.id },
        data: {
          status: 'active',
          unitPrice: subscription.plan.price,
          updatedAt: new Date(),
        },
      });
    } else {
      // Downgrade to free plan
      await this.downgradeToFree(subscription);
    }
  }

  private async downgradeToFree(subscription: any): Promise<void> {
    // Cancel Stripe subscription if exists
    if (subscription.stripeSubscriptionId) {
      await stripeService.cancelSubscription(subscription.stripeSubscriptionId, false);
    }

    // Find free plan
    const freePlan = await db.client.subscriptionPlan.findFirst({
      where: { type: 'freemium' },
    });

    if (freePlan) {
      // Update to free plan
      await db.client.organizationSubscription.update({
        where: { id: subscription.id },
        data: {
          planId: freePlan.id,
          status: 'active',
          trialStart: null,
          trialEnd: null,
          unitPrice: 0,
          stripeSubscriptionId: null,
          updatedAt: new Date(),
        },
      });
    } else {
      // Just mark as canceled if no free plan
      await db.client.organizationSubscription.update({
        where: { id: subscription.id },
        data: {
          status: 'canceled',
          canceledAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    await notificationManager.sendNotification({
      type: 'TRIAL_EXPIRED',
      title: 'Trial Expired',
      message: 'Your trial has ended. Upgrade anytime to regain access to premium features.',
      recipientId: subscription.organizationId,
      urgency: 'medium',
      actionUrl: '/billing/upgrade',
      actionText: 'View Plans',
    });
  }

  private async checkForPaymentMethod(stripeCustomerId: string): Promise<boolean> {
    try {
      const paymentMethods = await stripeService.listPaymentMethods(stripeCustomerId);
      return paymentMethods.length > 0;
    } catch {
      return false;
    }
  }

  private async scheduleTrialReminder(organizationId: string, reminderDate: Date): Promise<void> {
    // In production, this would create a scheduled job
    // For now, it will be handled by the daily checkTrialStatuses cron
    console.log(`Trial reminder scheduled for ${organizationId} on ${reminderDate}`);
  }
}

export const trialManager = new TrialManager();