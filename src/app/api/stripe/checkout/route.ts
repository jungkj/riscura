import { NextRequest, NextResponse } from 'next/server';
import { withAPI, createAPIResponse, ForbiddenError, ValidationError } from '@/lib/api/middleware';
import { getAuthenticatedUser, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { stripe, createCheckoutSession, SUBSCRIPTION_PLANS, FREE_TRIAL_CONFIG } from '@/lib/stripe';
import { db } from '@/lib/db';
import { z } from 'zod';

const checkoutSchema = z.object({
  plan: z.enum(['PRO', 'ENTERPRISE']),
  isTrial: z.boolean().optional().default(false),
  successUrl: z.string().url(),
  cancelUrl: z.string().url()
});

// POST /api/stripe/checkout - Create Stripe checkout session
export const POST = withAPI(async (req: NextRequest) => {
  const authReq = req as AuthenticatedRequest;
  const user = getAuthenticatedUser(authReq);

  if (!user) {
    throw new ForbiddenError('Authentication required');
  }

  try {
    const body = await req.json();
    const { plan, isTrial, successUrl, cancelUrl } = checkoutSchema.parse(body);

    // Get the subscription plan
    const selectedPlan = SUBSCRIPTION_PLANS[plan];
    if (!selectedPlan.priceId) {
      throw new ValidationError('Invalid subscription plan');
    }

    // Check if user already has a subscription
    const existingSubscription = await db.client.organizationSubscription.findFirst({
      where: {
        organizationId: user.organizationId,
        status: {
          in: ['ACTIVE', 'TRIALING']
        }
      }
    });

    if (existingSubscription && !isTrial) {
      throw new ValidationError('Organization already has an active subscription');
    }

    // Get or create Stripe customer
    const organization = await db.client.organization.findUnique({
      where: { id: user.organizationId }
    });
    let stripeCustomerId = organization?.stripeCustomerId;
    
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: {
          userId: user.id,
          organizationId: user.organizationId,
        }
      });
      
      stripeCustomerId = customer.id;
      
      // Update organization with Stripe customer ID
      await db.client.organization.update({
        where: { id: user.organizationId },
        data: { stripeCustomerId }
      });
    }

    // Create checkout session
    const session = await createCheckoutSession({
      priceId: selectedPlan.priceId,
      customerId: stripeCustomerId,
      userId: user.id,
      organizationId: user.organizationId,
      successUrl,
      cancelUrl,
      trialPeriodDays: isTrial ? FREE_TRIAL_CONFIG.duration : undefined
    });

    // Log the checkout attempt
    await db.client.billingEvent.create({
      data: {
        organizationId: user.organizationId,
        type: 'CHECKOUT_CREATED',
        eventData: {
          plan,
          isTrial,
          sessionId: session.id,
          amount: (selectedPlan.price || 0) * 100, // Store in cents
          currency: 'USD'
        }
      }
    });

    return createAPIResponse({
      data: {
        sessionId: session.id,
        url: session.url
      }
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid request data');
    }
    
    throw error;
  }
}); 