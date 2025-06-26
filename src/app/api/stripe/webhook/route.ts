import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { env } from '@/config/env';
import Stripe from 'stripe';

// Disable body parsing, we need the raw body for signature verification
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    console.error('No Stripe signature found');
    return new NextResponse('No signature', { status: 400 });
  }

  if (!env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return new NextResponse('Webhook secret not configured', { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return new NextResponse('Invalid signature', { status: 400 });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object as Stripe.Subscription);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new NextResponse('Webhook handler failed', { status: 500 });
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const organizationId = subscription.metadata.organizationId;
  const userId = subscription.metadata.userId;

  if (!organizationId) {
    console.error('No organizationId in subscription metadata');
    return;
  }

  await db.client.organizationSubscription.create({
    data: {
      organizationId,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer as string,
      stripePriceId: subscription.items.data[0]?.price.id || '',
      status: subscription.status.toUpperCase() as any,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
    }
  });

  // Log billing event
  await db.client.billingEvent.create({
    data: {
      organizationId,
      type: 'SUBSCRIPTION_CREATED',
      amount: subscription.items.data[0]?.price.unit_amount || 0,
      currency: subscription.currency.toUpperCase(),
      metadata: {
        subscriptionId: subscription.id,
        status: subscription.status,
        trialEnd: subscription.trial_end
      }
    }
  });

  console.log(`Subscription created for organization ${organizationId}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const organizationId = subscription.metadata.organizationId;

  if (!organizationId) {
    console.error('No organizationId in subscription metadata');
    return;
  }

  await db.client.organizationSubscription.update({
    where: {
      stripeSubscriptionId: subscription.id
    },
    data: {
      status: subscription.status.toUpperCase() as any,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
    }
  });

  // Log billing event
  await db.client.billingEvent.create({
    data: {
      organizationId,
      type: 'SUBSCRIPTION_UPDATED',
      amount: subscription.items.data[0]?.price.unit_amount || 0,
      currency: subscription.currency.toUpperCase(),
      metadata: {
        subscriptionId: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      }
    }
  });

  console.log(`Subscription updated for organization ${organizationId}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const organizationId = subscription.metadata.organizationId;

  if (!organizationId) {
    console.error('No organizationId in subscription metadata');
    return;
  }

  await db.client.organizationSubscription.update({
    where: {
      stripeSubscriptionId: subscription.id
    },
    data: {
      status: 'CANCELED',
      canceledAt: new Date()
    }
  });

  // Log billing event
  await db.client.billingEvent.create({
    data: {
      organizationId,
      type: 'SUBSCRIPTION_CANCELED',
      amount: 0,
      currency: subscription.currency.toUpperCase(),
      metadata: {
        subscriptionId: subscription.id,
        canceledAt: new Date().toISOString()
      }
    }
  });

  console.log(`Subscription canceled for organization ${organizationId}`);
}

async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  const organizationId = subscription.metadata.organizationId;

  if (!organizationId) {
    console.error('No organizationId in subscription metadata');
    return;
  }

  // Log trial ending event
  await db.client.billingEvent.create({
    data: {
      organizationId,
      type: 'TRIAL_ENDING',
      amount: 0,
      currency: subscription.currency.toUpperCase(),
      metadata: {
        subscriptionId: subscription.id,
        trialEnd: subscription.trial_end
      }
    }
  });

  // Here you could send notification emails or trigger other actions
  console.log(`Trial ending soon for organization ${organizationId}`);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  
  if (!subscriptionId) {
    console.error('No subscription ID in invoice');
    return;
  }

  const subscription = await db.client.organizationSubscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId }
  });

  if (!subscription) {
    console.error(`Subscription not found: ${subscriptionId}`);
    return;
  }

  // Log successful payment
  await db.client.billingEvent.create({
    data: {
      organizationId: subscription.organizationId,
      type: 'PAYMENT_SUCCESS',
      amount: invoice.amount_paid,
      currency: invoice.currency.toUpperCase(),
      metadata: {
        invoiceId: invoice.id,
        subscriptionId: subscriptionId,
        amountPaid: invoice.amount_paid
      }
    }
  });

  console.log(`Payment succeeded for organization ${subscription.organizationId}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  
  if (!subscriptionId) {
    console.error('No subscription ID in invoice');
    return;
  }

  const subscription = await db.client.organizationSubscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId }
  });

  if (!subscription) {
    console.error(`Subscription not found: ${subscriptionId}`);
    return;
  }

  // Log failed payment
  await db.client.billingEvent.create({
    data: {
      organizationId: subscription.organizationId,
      type: 'PAYMENT_FAILED',
      amount: invoice.amount_due,
      currency: invoice.currency.toUpperCase(),
      metadata: {
        invoiceId: invoice.id,
        subscriptionId: subscriptionId,
        amountDue: invoice.amount_due,
        attemptCount: invoice.attempt_count
      }
    }
  });

  console.log(`Payment failed for organization ${subscription.organizationId}`);
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const organizationId = session.metadata?.organizationId;
  const userId = session.metadata?.userId;

  if (!organizationId || !userId) {
    console.error('Missing metadata in checkout session');
    return;
  }

  // Log checkout completion
  await db.client.billingEvent.create({
    data: {
      organizationId,
      type: 'CHECKOUT_COMPLETED',
      amount: session.amount_total || 0,
      currency: session.currency?.toUpperCase() || 'USD',
      metadata: {
        sessionId: session.id,
        subscriptionId: session.subscription,
        customerId: session.customer
      }
    }
  });

  console.log(`Checkout completed for organization ${organizationId}`);
} 