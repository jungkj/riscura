import Stripe from 'stripe';
import { db } from '@/lib/db';
import { notificationManager } from '@/lib/collaboration/notifications';
import type {
  OrganizationSubscription,
  SubscriptionPlan,
  PaymentMethod,
  Invoice,
  PaymentIntent,
  BillingEvent,
  CustomerPortalSession,
} from './types';

export class StripeService {
  private stripe: Stripe | null;
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = !!process.env.STRIPE_SECRET_KEY;
    
    if (!process.env.STRIPE_SECRET_KEY) {
      console.warn('STRIPE_SECRET_KEY not configured - billing features will be disabled');
      this.stripe = null;
      return;
    }

    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-05-28.basil',
      typescript: true,
    });
  }

  private ensureStripeEnabled(): void {
    if (!this.isEnabled || !this.stripe) {
      throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
    }
  }

  // Customer Management
  async createCustomer(organizationId: string, email: string, name: string, metadata?: Record<string, any>): Promise<Stripe.Customer> {
    this.ensureStripeEnabled();
    const customer = await this.stripe!.customers.create({
      email,
      name,
      metadata: {
        organizationId,
        ...metadata,
      },
    });

    // Store customer ID in database
    await db.client.organization.update({
      where: { id: organizationId },
      data: {
        stripeCustomerId: customer.id,
        updatedAt: new Date(),
      },
    });

    return customer;
  }

  async updateCustomer(customerId: string, updates: Stripe.CustomerUpdateParams): Promise<Stripe.Customer> {
    this.ensureStripeEnabled();
    return await this.stripe!.customers.update(customerId, updates);
  }

  async getCustomer(customerId: string): Promise<Stripe.Customer | null> {
    this.ensureStripeEnabled();
    try {
      return await this.stripe!.customers.retrieve(customerId) as Stripe.Customer;
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError && error.code === 'resource_missing') {
        return null;
      }
      throw error;
    }
  }

  // Subscription Management
  async createSubscription(
    customerId: string,
    priceId: string,
    organizationId: string,
    options?: {
      trialDays?: number;
      coupon?: string;
      quantity?: number;
      metadata?: Record<string, any>;
    }
  ): Promise<Stripe.Subscription> {
    this.ensureStripeEnabled();
    const subscriptionParams: any = {
      customer: customerId,
      items: [
        {
          price: priceId,
          quantity: options?.quantity || 1,
        },
      ],
      metadata: {
        organizationId,
        ...options?.metadata,
      },
      trial_period_days: options?.trialDays,
      collection_method: 'charge_automatically',
      expand: ['latest_invoice.payment_intent'],
    };

    // Add coupon if provided
    if (options?.coupon) {
      subscriptionParams.discounts = [{
        coupon: options.coupon,
      }];
    }

    const subscription = await this.stripe!.subscriptions.create(subscriptionParams);

    // Store subscription in database
    await this.storeSubscription(subscription, organizationId);

    return subscription;
  }

  async updateSubscription(subscriptionId: string, updates: Stripe.SubscriptionUpdateParams): Promise<Stripe.Subscription> {
    this.ensureStripeEnabled();
    return await this.stripe!.subscriptions.update(subscriptionId, updates);
  }

  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = true): Promise<Stripe.Subscription> {
    this.ensureStripeEnabled();
    if (cancelAtPeriodEnd) {
      return await this.stripe!.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    } else {
      return await this.stripe!.subscriptions.cancel(subscriptionId);
    }
  }

  async pauseSubscription(subscriptionId: string, resumeAt?: Date): Promise<Stripe.Subscription> {
    this.ensureStripeEnabled();
    return await this.stripe!.subscriptions.update(subscriptionId, {
      pause_collection: {
        behavior: 'mark_uncollectible',
        resumes_at: resumeAt ? Math.floor(resumeAt.getTime() / 1000) : undefined,
      },
    });
  }

  async resumeSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    this.ensureStripeEnabled();
    return await this.stripe!.subscriptions.update(subscriptionId, {
      pause_collection: null,
    });
  }

  // Payment Method Management
  async attachPaymentMethod(paymentMethodId: string, customerId: string): Promise<Stripe.PaymentMethod> {
    this.ensureStripeEnabled();
    return await this.stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
  }

  async detachPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    this.ensureStripeEnabled();
    return await this.stripe.paymentMethods.detach(paymentMethodId);
  }

  async setDefaultPaymentMethod(customerId: string, paymentMethodId: string): Promise<Stripe.Customer> {
    this.ensureStripeEnabled();
    return await this.stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
  }

  async listPaymentMethods(customerId: string, type?: Stripe.PaymentMethodListParams.Type): Promise<Stripe.PaymentMethod[]> {
    this.ensureStripeEnabled();
    const paymentMethods = await this.stripe.paymentMethods.list({
      customer: customerId,
      type: type || 'card',
    });

    return paymentMethods.data;
  }

  // Invoice Management
  async createInvoice(customerId: string, params?: Stripe.InvoiceCreateParams): Promise<Stripe.Invoice> {
    this.ensureStripeEnabled();
    return await this.stripe.invoices.create({
      customer: customerId,
      ...params,
    });
  }

  async finalizeInvoice(invoiceId: string): Promise<Stripe.Invoice> {
    this.ensureStripeEnabled();
    return await this.stripe.invoices.finalizeInvoice(invoiceId);
  }

  async payInvoice(invoiceId: string, paymentMethodId?: string): Promise<Stripe.Invoice> {
    this.ensureStripeEnabled();
    const params: any = {};
    if (paymentMethodId) {
      params.payment_method = paymentMethodId;
    }

    return await this.stripe.invoices.pay(invoiceId, params);
  }

  async voidInvoice(invoiceId: string): Promise<Stripe.Invoice> {
    this.ensureStripeEnabled();
    return await this.stripe.invoices.voidInvoice(invoiceId);
  }

  async sendInvoice(invoiceId: string): Promise<Stripe.Invoice> {
    this.ensureStripeEnabled();
    return await this.stripe.invoices.sendInvoice(invoiceId);
  }

  // Usage-based Billing (using manual invoice items)
  async createUsageRecord(organizationId: string, customerId: string, description: string, quantity: number, unitAmount: number): Promise<Stripe.InvoiceItem> {
    this.ensureStripeEnabled();
    return await this.stripe.invoiceItems.create({
      customer: customerId,
      amount: Math.round(quantity * unitAmount * 100), // Convert to cents
      currency: 'usd',
      description,
      metadata: {
        organizationId,
        type: 'usage',
        quantity: quantity.toString(),
        unitAmount: unitAmount.toString(),
      },
    });
  }

  async listUsageRecords(customerId: string, startDate?: Date, endDate?: Date): Promise<Stripe.InvoiceItem[]> {
    this.ensureStripeEnabled();
    const params: any = {
      customer: customerId,
    };
    
    if (startDate || endDate) {
      params.created = {};
      if (startDate) {
        params.created.gte = Math.floor(startDate.getTime() / 1000);
      }
      if (endDate) {
        params.created.lte = Math.floor(endDate.getTime() / 1000);
      }
    }

    const usageRecords = await this.stripe.invoiceItems.list(params);
    return usageRecords.data.filter(item => item.metadata?.type === 'usage');
  }

  // Payment Intents
  async createPaymentIntent(
    amount: number,
    currency: string,
    customerId: string,
    options?: {
      paymentMethodId?: string;
      confirmationMethod?: 'automatic' | 'manual';
      metadata?: Record<string, any>;
    }
  ): Promise<Stripe.PaymentIntent> {
    this.ensureStripeEnabled();
    const params: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      customer: customerId,
      confirmation_method: options?.confirmationMethod || 'automatic',
      metadata: options?.metadata,
    };

    if (options?.paymentMethodId) {
      params.payment_method = options.paymentMethodId;
      params.confirm = true;
    }

    return await this.stripe.paymentIntents.create(params);
  }

  async confirmPaymentIntent(paymentIntentId: string, paymentMethodId?: string): Promise<Stripe.PaymentIntent> {
    this.ensureStripeEnabled();
    const params: any = {};
    
    if (paymentMethodId) {
      params.payment_method = paymentMethodId;
    }

    return await this.stripe.paymentIntents.confirm(paymentIntentId, params);
  }

  // Customer Portal
  async createCustomerPortalSession(customerId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session> {
    this.ensureStripeEnabled();
    return await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  // Coupons and Discounts
  async createCoupon(params: Stripe.CouponCreateParams): Promise<Stripe.Coupon> {
    this.ensureStripeEnabled();
    return await this.stripe.coupons.create(params);
  }

  async applyCoupon(customerId: string, couponId: string): Promise<void> {
    // Use the discounts API to apply coupon
    this.ensureStripeEnabled();
    await this.stripe.customers.update(customerId, {
      metadata: {
        applied_coupon: couponId,
      },
    });
  }

  // Tax Management
  async calculateTax(params: Stripe.Tax.CalculationCreateParams): Promise<Stripe.Tax.Calculation> {
    this.ensureStripeEnabled();
    return await this.stripe.tax.calculations.create(params);
  }

  async createTaxRate(params: Stripe.TaxRateCreateParams): Promise<Stripe.TaxRate> {
    this.ensureStripeEnabled();
    return await this.stripe.taxRates.create(params);
  }

  // Webhooks
  constructWebhookEvent(payload: string | Buffer, signature: string, secret: string): Stripe.Event {
    this.ensureStripeEnabled();
    return this.stripe.webhooks.constructEvent(payload, signature, secret);
  }

  async handleWebhook(event: Stripe.Event): Promise<void> {
    try {
      await this.processWebhookEvent(event);
      
      // Log successful processing
      await this.logBillingEvent({
        type: event.type as any,
        eventData: event.data,
        stripeEventId: event.id,
        processed: true,
        processedAt: new Date(),
      });

    } catch (error) {
      console.error('Webhook processing failed:', error);
      
      // Log failed processing
      await this.logBillingEvent({
        type: event.type as any,
        eventData: event.data,
        stripeEventId: event.id,
        processed: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        retryCount: 0,
        nextRetryAt: new Date(Date.now() + 5 * 60 * 1000), // Retry in 5 minutes
      });

      throw error;
    }
  }

  private async processWebhookEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionEvent(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.created':
      case 'invoice.updated':
        await this.handleInvoiceEvent(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.trial_will_end':
        await this.handleTrialWillEnd(event.data.object as Stripe.Subscription);
        break;

      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }
  }

  private async handleSubscriptionEvent(subscription: Stripe.Subscription): Promise<void> {
    const organizationId = subscription.metadata.organizationId;
    if (!organizationId) return;

    await this.storeSubscription(subscription, organizationId);
  }

  private async handleSubscriptionCanceled(subscription: Stripe.Subscription): Promise<void> {
    const organizationId = subscription.metadata.organizationId;
    if (!organizationId) return;

    // TODO: Implement organizationSubscription model in Prisma schema
    // await db.client.organizationSubscription.update({
    //   where: { stripeSubscriptionId: subscription.id },
    //   data: {
    //     status: 'canceled',
    //     canceledAt: new Date(),
    //     updatedAt: new Date(),
    //   },
    // });

    console.log('Subscription canceled:', {
      stripeSubscriptionId: subscription.id,
      organizationId,
    });

    // Send notification
    await notificationManager.sendNotification({
      type: 'SUBSCRIPTION_CANCELED',
      title: 'Subscription Canceled',
      message: 'Your subscription has been canceled',
      recipientId: 'admin', // Would get actual admin user
      urgency: 'high',
    });
  }

  private async handleInvoiceEvent(invoice: Stripe.Invoice): Promise<void> {
    const customerId = invoice.customer as string;
    const organization = await db.client.organization.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!organization) return;

    await this.storeInvoice(invoice, organization.id);
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    const customerId = invoice.customer as string;
    const organization = await db.client.organization.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!organization) return;

    // TODO: Implement invoice model in Prisma schema
    // Update invoice status
    // await db.client.invoice.updateMany({
    //   where: { stripeInvoiceId: invoice.id },
    //   data: {
    //     status: 'paid',
    //     paidAt: new Date(),
    //     updatedAt: new Date(),
    //   },
    // });

    console.log('Payment succeeded:', {
      stripeInvoiceId: invoice.id,
      organizationId: organization.id,
      amount: invoice.amount_paid,
    });

    // Send notification
    await notificationManager.sendNotification({
      type: 'PAYMENT_SUCCEEDED',
      title: 'Payment Successful',
      message: `Payment of ${this.formatAmount(invoice.amount_paid, invoice.currency)} received`,
      recipientId: 'admin', // Would get actual admin user
      urgency: 'medium',
    });
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const customerId = invoice.customer as string;
    const organization = await db.client.organization.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!organization) return;

    // TODO: Implement invoice model in Prisma schema
    // Update invoice status
    // await db.client.invoice.updateMany({
    //   where: { stripeInvoiceId: invoice.id },
    //   data: {
    //     status: 'open',
    //     updatedAt: new Date(),
    //   },
    // });

    console.log('Payment failed:', {
      stripeInvoiceId: invoice.id,
      organizationId: organization.id,
    });

    // Send notification
    await notificationManager.sendNotification({
      type: 'PAYMENT_FAILED',
      title: 'Payment Failed',
      message: `Payment failed for invoice ${invoice.number}`,
      recipientId: 'admin', // Would get actual admin user
      urgency: 'urgent',
    });
  }

  private async handleTrialWillEnd(subscription: Stripe.Subscription): Promise<void> {
    const organizationId = subscription.metadata.organizationId;
    if (!organizationId) return;

    // Send notification
    await notificationManager.sendNotification({
      type: 'TRIAL_ENDING',
      title: 'Trial Ending Soon',
      message: 'Your trial will end in 3 days. Please add a payment method to continue.',
      recipientId: 'admin', // Would get actual admin user
      urgency: 'high',
    });
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    // TODO: Implement paymentIntent model in Prisma schema
    // Update payment intent in database if stored
    // await db.client.paymentIntent.updateMany({
    //   where: { stripePaymentIntentId: paymentIntent.id },
    //   data: {
    //     status: 'succeeded',
    //     updatedAt: new Date(),
    //   },
    // });

    console.log('Payment intent succeeded:', {
      stripePaymentIntentId: paymentIntent.id,
    });
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    // TODO: Implement paymentIntent model in Prisma schema
    // Update payment intent in database if stored
    // await db.client.paymentIntent.updateMany({
    //   where: { stripePaymentIntentId: paymentIntent.id },
    //   data: {
    //     status: 'canceled',
    //     updatedAt: new Date(),
    //   },
    // });

    console.log('Payment intent failed:', {
      stripePaymentIntentId: paymentIntent.id,
    });
  }

  // Helper Methods
  private async storeSubscription(subscription: Stripe.Subscription, organizationId: string): Promise<void> {
    // TODO: Implement organizationSubscription model in Prisma schema
    const planId = subscription.items.data[0]?.price.id;
    const sub = subscription as any; // Use any to avoid type issues
    
    console.log('Storing subscription:', {
      stripeSubscriptionId: subscription.id,
      organizationId,
      planId,
      status: subscription.status,
    });

    // await db.client.organizationSubscription.upsert({
    //   where: { stripeSubscriptionId: subscription.id },
    //   update: {
    //     status: subscription.status as any,
    //     currentPeriodStart: new Date(sub.current_period_start * 1000),
    //     currentPeriodEnd: new Date(sub.current_period_end * 1000),
    //     cancelAtPeriodEnd: sub.cancel_at_period_end,
    //     canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
    //     trialStart: sub.trial_start ? new Date(sub.trial_start * 1000) : null,
    //     trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
    //     quantity: subscription.items.data[0]?.quantity || 1,
    //     metadata: subscription.metadata,
    //     updatedAt: new Date(),
    //   },
    //   create: {
    //     organizationId,
    //     planId: planId || 'unknown',
    //     stripeSubscriptionId: subscription.id,
    //     status: subscription.status as any,
    //     currentPeriodStart: new Date(sub.current_period_start * 1000),
    //     currentPeriodEnd: new Date(sub.current_period_end * 1000),
    //     cancelAtPeriodEnd: sub.cancel_at_period_end,
    //     billingCycle: subscription.items.data[0]?.price.recurring?.interval === 'year' ? 'yearly' : 'monthly',
    //     quantity: subscription.items.data[0]?.quantity || 1,
    //     unitPrice: subscription.items.data[0]?.price.unit_amount || 0,
    //     metadata: subscription.metadata,
    //     createdAt: new Date(),
    //     updatedAt: new Date(),
    //   },
    // });
  }

  private async storeInvoice(invoice: Stripe.Invoice, organizationId: string): Promise<void> {
    // TODO: Implement invoice model in Prisma schema
    console.log('Storing invoice:', {
      stripeInvoiceId: invoice.id,
      organizationId,
      invoiceNumber: invoice.number,
      total: invoice.total,
    });
    
    // const inv = invoice as any; // Use any to avoid type issues
    // const lineItems = invoice.lines.data.map(line => {
    //   const lineAny = line as any;
    //   return {
    //     id: line.id,
    //     type: lineAny.type || 'subscription',
    //     description: line.description || '',
    //     quantity: line.quantity || 1,
    //     unitPrice: lineAny.price?.unit_amount || 0,
    //     amount: line.amount,
    //     period: lineAny.period ? {
    //       start: new Date(lineAny.period.start * 1000),
    //       end: new Date(lineAny.period.end * 1000),
    //     } : undefined,
    //     metadata: line.metadata,
    //   };
    // });

    // await db.client.invoice.upsert({
    //   where: { stripeInvoiceId: invoice.id },
    //   update: {
    //     status: invoice.status as any,
    //     subtotal: invoice.subtotal,
    //     taxAmount: inv.tax || 0,
    //     discountAmount: inv.discount?.amount || inv.discounts?.[0]?.amount || 0,
    //     total: invoice.total,
    //     paidAt: inv.status_transitions?.paid_at ? new Date(inv.status_transitions.paid_at * 1000) : null,
    //     lineItems,
    //     updatedAt: new Date(),
    //   },
    //   create: {
    //     organizationId,
    //     stripeInvoiceId: invoice.id,
    //     invoiceNumber: invoice.number || '',
    //     status: invoice.status as any,
    //     type: 'subscription',
    //     subtotal: invoice.subtotal,
    //     taxAmount: inv.tax || 0,
    //     discountAmount: inv.discount?.amount || inv.discounts?.[0]?.amount || 0,
    //     total: invoice.total,
    //     currency: invoice.currency,
    //     billingPeriod: {
    //       start: new Date(inv.period_start * 1000),
    //       end: new Date(inv.period_end * 1000),
    //     },
    //     lineItems,
    //     dueDate: inv.due_date ? new Date(inv.due_date * 1000) : new Date(),
    //     paidAt: inv.status_transitions?.paid_at ? new Date(inv.status_transitions.paid_at * 1000) : null,
    //     metadata: invoice.metadata,
    //     createdAt: new Date(),
    //     updatedAt: new Date(),
    //   },
    // });
  }

  private async logBillingEvent(eventData: Partial<BillingEvent>): Promise<void> {
    // TODO: Implement billingEvent model in Prisma schema
    console.log('Billing event:', eventData);
    
    // await db.client.billingEvent.create({
    //   data: {
    //     organizationId: 'system', // Would determine from event data
    //     retryCount: 0,
    //     createdAt: new Date(),
    //     ...eventData,
    //   } as any,
    // });
  }

  private formatAmount(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  }
}

export const stripeService = new StripeService(); 