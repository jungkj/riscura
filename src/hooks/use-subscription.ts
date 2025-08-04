import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export interface SubscriptionStatus {
  isActive: boolean;
  status: 'FREE' | 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED';
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

export function useSubscription() {
  const { data: session, status } = useSession();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubscriptionStatus() {
      if (status === 'loading') return;

      if (!session?.user) {
        setSubscription(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch('/api/subscription/status');

        if (!response.ok) {
          throw new Error('Failed to fetch subscription status');
        }

        const data = await response.json();
        setSubscription(data);
        setError(null);
      } catch (err) {
        // console.error('Error fetching subscription:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setSubscription(null);
      } finally {
        setLoading(false);
      }
    }

    fetchSubscriptionStatus();
  }, [session, status]);

  const canAccess = (feature: string) => {
    if (!subscription) return false;
    return subscription.features.includes(feature) || subscription.isActive;
  };

  const hasReachedLimit = (_type: 'users' | 'risks' | 'aiQueries') => {
    if (!subscription) return true;
    const limit = subscription.limits[type];
    return limit !== -1; // -1 means unlimited
  };

  const getUpgradeUrl = () => {
    return '/billing/upgrade';
  };

  return {
    subscription,
    loading,
    error,
    canAccess,
    hasReachedLimit,
    getUpgradeUrl,
    isActive: subscription?.isActive || false,
    isPro: subscription?.plan === 'pro',
    isEnterprise: subscription?.plan === 'enterprise',
    isFree: subscription?.plan === 'free' || !subscription?.isActive,
    isTrialing: subscription?.status === 'TRIALING',
    trialDaysLeft: subscription?.trialDaysLeft || 0,
  };
}
