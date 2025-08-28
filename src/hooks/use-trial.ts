'use client';

import { useState, useEffect } from 'react';

interface TrialStatus {
  isInTrial: boolean;
  daysRemaining: number;
  trialEnd?: Date;
  canExtend: boolean;
  organizationId?: string;
}

export function useTrial() {
  const [trialStatus, setTrialStatus] = useState<TrialStatus>({
    isInTrial: false,
    daysRemaining: 0,
    canExtend: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch trial status
  const fetchTrialStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/billing/trial');
      
      if (!response.ok) {
        throw new Error('Failed to fetch trial status');
      }

      const data = await response.json();
      setTrialStatus({
        ...data,
        trialEnd: data.trialEnd ? new Date(data.trialEnd) : undefined,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Convert trial to paid
  const convertTrial = async (subscriptionId: string, paymentMethodId?: string) => {
    try {
      const response = await fetch('/api/billing/trial/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId,
          paymentMethodId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to convert trial');
      }

      await fetchTrialStatus(); // Refresh status
      return await response.json();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Extend trial
  const extendTrial = async (subscriptionId: string, days: number = 7) => {
    try {
      const response = await fetch('/api/billing/trial/extend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId,
          days,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to extend trial');
      }

      await fetchTrialStatus(); // Refresh status
      return await response.json();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Calculate urgency level
  const getUrgencyLevel = (): 'none' | 'low' | 'medium' | 'high' | 'critical' => {
    if (!trialStatus.isInTrial) return 'none';
    
    const { daysRemaining } = trialStatus;
    if (daysRemaining <= 1) return 'critical';
    if (daysRemaining <= 3) return 'high';
    if (daysRemaining <= 7) return 'medium';
    return 'low';
  };

  // Get display message
  const getDisplayMessage = (): string => {
    if (!trialStatus.isInTrial) return '';
    
    const { daysRemaining } = trialStatus;
    if (daysRemaining === 0) return 'Your trial expires today!';
    if (daysRemaining === 1) return 'Your trial expires tomorrow!';
    return `${daysRemaining} days left in your trial`;
  };

  // Get progress percentage (for progress bars)
  const getProgressPercentage = (totalTrialDays: number = 14): number => {
    if (!trialStatus.isInTrial) return 0;
    const elapsed = totalTrialDays - trialStatus.daysRemaining;
    return Math.min(Math.max((elapsed / totalTrialDays) * 100, 0), 100);
  };

  useEffect(() => {
    fetchTrialStatus();
  }, []);

  return {
    trialStatus,
    loading,
    error,
    fetchTrialStatus,
    convertTrial,
    extendTrial,
    getUrgencyLevel,
    getDisplayMessage,
    getProgressPercentage,
  };
}