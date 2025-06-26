import React from 'react';
import { useSubscription } from '@/hooks/use-subscription';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Crown, Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export function SubscriptionBanner() {
  const { subscription, loading, isTrialing, trialDaysLeft, isFree } = useSubscription();

  if (loading || !subscription) return null;

  // Don't show banner for active paid subscriptions
  if (subscription.isActive && !isTrialing) return null;

  return (
    <div className="mb-6">
      {isTrialing && trialDaysLeft !== null && (
        <Alert className="border-blue-200 bg-blue-50">
          <Clock className="h-4 w-4 text-blue-600" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <strong>Free Trial Active:</strong> {trialDaysLeft} days remaining. 
              Upgrade now to continue accessing all features after your trial ends.
            </div>
            <Button asChild size="sm" className="ml-4">
              <Link href="/billing/upgrade">
                <Crown className="h-4 w-4 mr-2" />
                Upgrade Now
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isFree && !isTrialing && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <strong>Free Plan:</strong> You're using the free plan with limited features. 
              Upgrade to unlock advanced risk management capabilities.
            </div>
            <Button asChild size="sm" variant="default" className="ml-4">
              <Link href="/billing/upgrade">
                <Crown className="h-4 w-4 mr-2" />
                Upgrade Plan
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {subscription.status === 'PAST_DUE' && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <strong>Payment Past Due:</strong> Your subscription payment is overdue. 
              Please update your payment method to continue accessing premium features.
            </div>
            <Button asChild size="sm" variant="destructive" className="ml-4">
              <Link href="/billing/manage">
                Update Payment
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
} 