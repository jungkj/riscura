import React from 'react';
import { useSubscription } from '@/hooks/use-subscription';
import { DaisyAlert } from '@/components/ui/DaisyAlert';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { Crown, Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export function SubscriptionBanner() {
  const { subscription, loading, isTrialing, trialDaysLeft, isFree } = useSubscription();

  if (loading || !subscription) return null;

  // Don't show banner for active paid subscriptions
  if (subscription.isActive && !isTrialing) return null

  return (
    <div className="mb-6">
      {Boolean(isTrialing) && trialDaysLeft !== null && (
        <DaisyAlert className="border-blue-200 bg-blue-50" >
  <Clock className="h-4 w-4 text-blue-600" />
</DaisyAlert>
          <DaisyAlertDescription className="flex items-center justify-between" >
  <div>
                </DaisyAlertDescription>
</DaisyAlert>
              <strong>Free Trial Active:</strong> {trialDaysLeft} days remaining. 
              Upgrade now to continue accessing all features after your trial ends.
            </div>
            <DaisyButton asChild size="sm" className="ml-4" >
  <Link href="/billing/upgrade">
</DaisyButton>
                <Crown className="h-4 w-4 mr-2" />
                Upgrade Now
              </Link>
            </DaisyButton>
                </DaisyAlertDescription>
              </DaisyAlert>
      )}

      {Boolean(isFree) && !isTrialing && (
        <DaisyAlert className="border-amber-200 bg-amber-50" >
  <DaisyAlertTriangle className="h-4 w-4 text-amber-600" />
</DaisyAlert>
          <DaisyAlertDescription className="flex items-center justify-between" >
  <div>
                </DaisyAlertDescription>
</DaisyAlert>
              <strong>Free Plan:</strong> You're using the free plan with limited features. 
              Upgrade to unlock advanced risk management capabilities.
            </div>
            <DaisyButton asChild size="sm" variant="primary" className="ml-4" >
  <Link href="/billing/upgrade">
</DaisyButton>
                <Crown className="h-4 w-4 mr-2" />
                Upgrade Plan
              </Link>
            </DaisyButton>
                </DaisyAlertDescription>
              </DaisyAlert>
      )}

      {subscription.status === 'PAST_DUE' && (
        <DaisyAlert className="border-red-200 bg-red-50" >
  <DaisyAlertTriangle className="h-4 w-4 text-red-600" />
</DaisyAlert>
          <DaisyAlertDescription className="flex items-center justify-between" >
  <div>
                </DaisyAlertDescription>
</DaisyAlert>
              <strong>Payment Past Due:</strong> Your subscription payment is overdue. 
              Please update your payment method to continue accessing premium features.
            </div>
            <DaisyButton asChild size="sm" variant="danger" className="ml-4" >
  <Link href="/billing/manage">
</DaisyButton>
                Update Payment
              </Link>
            </DaisyButton>
                </DaisyAlertDescription>
              </DaisyAlert>
      )}
    </div>
  );
} 