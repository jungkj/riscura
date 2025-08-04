import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { env } from '@/config/env';

const stripePromise = loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export interface CheckoutOptions {
  plan: 'PRO' | 'ENTERPRISE';
  isTrial?: boolean;
  successUrl?: string;
  cancelUrl?: string;
}

export function useStripeCheckout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCheckoutSession = async (_options: CheckoutOptions) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: options.plan,
          isTrial: options.isTrial || false,
          successUrl: options.successUrl || `${window.location.origin}/dashboard?checkout=success`,
          cancelUrl: options.cancelUrl || `${window.location.origin}/pricing?checkout=canceled`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create checkout session');
      }

      const { data } = await response.json();
      const stripe = await stripePromise;

      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      // Redirect to Stripe Checkout
      const { error: redirectError } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      })

      if (redirectError) {
        throw new Error(redirectError.message);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      // console.error('Stripe checkout error:', err)
    } finally {
      setLoading(false);
    }
  }

  const startFreeTrial = () => {
    return createCheckoutSession({
      plan: 'PRO',
      isTrial: true,
    });
  }

  const upgradeToPro = () => {
    return createCheckoutSession({
      plan: 'PRO',
      isTrial: false,
    });
  }

  const upgradeToEnterprise = () => {
    return createCheckoutSession({
      plan: 'ENTERPRISE',
      isTrial: false,
    });
  }

  return {
    loading,
    error,
    createCheckoutSession,
    startFreeTrial,
    upgradeToPro,
    upgradeToEnterprise,
  }
}
