'use client';

import React, { useState, useEffect } from 'react';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisyAlert } from '@/components/ui/DaisyAlert';
import { DaisyScrollArea } from '@/components/ui/DaisyScrollArea';
import { toast } from 'sonner';
import { 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  Users, 
  Zap, 
  FileText, 
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  AlertTriangle,
  Settings,
  ExternalLink,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
// import { format } from 'date-fns';

interface BillingData {
  subscription: {
    id: string;
    plan: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' | 'CUSTOM';
    status: 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'INCOMPLETE';
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    amount: number;
    currency: string;
    interval: 'month' | 'year';
    nextBillingDate: string;
  };
  usage: {
    users: { current: number; limit: number };
    risks: { current: number; limit: number };
    controls: { current: number; limit: number };
    documents: { current: number; limit: number };
    apiCalls: { current: number; limit: number };
    storage: { current: number; limit: number }; // in MB
    aiRequests: { current: number; limit: number };
  };
  invoices: Array<{
    id: string;
    number: string;
    status: 'PAID' | 'PENDING' | 'FAILED' | 'DRAFT';
    amount: number;
    currency: string;
    created: string;
    dueDate: string;
    paidAt?: string;
    downloadUrl?: string;
  }>;
  paymentMethods: Array<{
    id: string;
    type: 'card' | 'bank_account';
    brand?: string;
    last4: string;
    expiryMonth?: number;
    expiryYear?: number;
    isDefault: boolean;
  }>;
  upcomingInvoice?: {
    amount: number;
    currency: string;
    periodStart: string;
    periodEnd: string;
    dueDate: string;
  };
}

interface PlanFeature {
  name: string;
  included: boolean;
  limit?: number;
  description?: string;
}

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: PlanFeature[];
  popular?: boolean;
  description: string;
}

class BillingService {
  private static instance: BillingService;

  static getInstance(): BillingService {
    if (!BillingService.instance) {
      BillingService.instance = new BillingService();
    }
    return BillingService.instance;
  }

  // Get billing data
  async getBillingData(): Promise<BillingData> {
    try {
      const response = await fetch('/api/billing/data');
      if (!response.ok) {
        throw new Error('Failed to fetch billing data');
      }
      return await response.json();
    } catch (error) {
      // console.error('Billing service error:', error);
      // Return mock data for development
      return this.getMockBillingData();
    }
  }

  // Get available plans
  async getAvailablePlans(): Promise<PricingPlan[]> {
    try {
      const response = await fetch('/api/billing/plans');
      if (!response.ok) {
        throw new Error('Failed to fetch plans');
      }
      return await response.json();
    } catch (error) {
      // console.error('Plans service error:', error);
      return this.getMockPlans();
    }
  }

  // Update subscription
  async updateSubscription(planId: string): Promise<{ success: boolean; clientSecret?: string }> {
    try {
      const response = await fetch('/api/billing/subscription', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update subscription');
      }
      
      return await response.json();
    } catch (error) {
      // console.error('Subscription update error:', error);
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(): Promise<{ success: boolean }> {
    try {
      const response = await fetch('/api/billing/subscription', {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }
      
      return await response.json();
    } catch (error) {
      // console.error('Subscription cancellation error:', error);
      throw error;
    }
  }

  // Add payment method
  async addPaymentMethod(paymentMethodId: string): Promise<{ success: boolean }> {
    try {
      const response = await fetch('/api/billing/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add payment method');
      }
      
      return await response.json();
    } catch (error) {
      // console.error('Payment method error:', error);
      throw error;
    }
  }

  // Download invoice
  async downloadInvoice(invoiceId: string): Promise<void> {
    try {
      const response = await fetch(`/api/billing/invoices/${invoiceId}/download`);
      if (!response.ok) {
        throw new Error('Failed to download invoice');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      // console.error('Invoice download error:', error);
      throw error;
    }
  }

  // Mock data for development
  private getMockBillingData(): BillingData {
    return {
      subscription: {
        id: 'sub_mock123',
        plan: 'PROFESSIONAL',
        status: 'ACTIVE',
        currentPeriodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
        amount: 99,
        currency: 'USD',
        interval: 'month',
        nextBillingDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      },
      usage: {
        users: { current: 8, limit: 25 },
        risks: { current: 145, limit: 500 },
        controls: { current: 89, limit: 300 },
        documents: { current: 234, limit: 1000 },
        apiCalls: { current: 12500, limit: 50000 },
        storage: { current: 2048, limit: 10240 }, // 2GB of 10GB
        aiRequests: { current: 850, limit: 2000 },
      },
      invoices: [
        {
          id: 'inv_001',
          number: 'INV-2024-001',
          status: 'PAID',
          amount: 99,
          currency: 'USD',
          created: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          dueDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
          paidAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'inv_002',
          number: 'INV-2024-002',
          status: 'PAID',
          amount: 99,
          currency: 'USD',
          created: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          dueDate: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString(),
          paidAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
      paymentMethods: [
        {
          id: 'pm_001',
          type: 'card',
          brand: 'visa',
          last4: '4242',
          expiryMonth: 12,
          expiryYear: 2025,
          isDefault: true,
        },
      ],
      upcomingInvoice: {
        amount: 99,
        currency: 'USD',
        periodStart: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        periodEnd: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      },
    };
  }

  private getMockPlans(): PricingPlan[] {
    return [
      {
        id: 'starter',
        name: 'Starter',
        price: 29,
        currency: 'USD',
        interval: 'month',
        description: 'Perfect for small teams getting started with risk management',
        features: [
          { name: 'Up to 5 users', included: true, limit: 5 },
          { name: 'Up to 100 risks', included: true, limit: 100 },
          { name: 'Up to 50 controls', included: true, limit: 50 },
          { name: 'Basic reporting', included: true },
          { name: '1GB storage', included: true, limit: 1024 },
          { name: 'Email support', included: true },
          { name: 'AI features', included: false },
          { name: 'Advanced analytics', included: false },
          { name: 'Custom integrations', included: false },
        ],
      },
      {
        id: 'professional',
        name: 'Professional',
        price: 99,
        currency: 'USD',
        interval: 'month',
        description: 'Ideal for growing organizations with comprehensive risk management needs',
        popular: true,
        features: [
          { name: 'Up to 25 users', included: true, limit: 25 },
          { name: 'Up to 500 risks', included: true, limit: 500 },
          { name: 'Up to 300 controls', included: true, limit: 300 },
          { name: 'Advanced reporting', included: true },
          { name: '10GB storage', included: true, limit: 10240 },
          { name: 'Priority support', included: true },
          { name: 'AI features', included: true, limit: 2000 },
          { name: 'Advanced analytics', included: true },
          { name: 'API access', included: true, limit: 50000 },
        ],
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: 299,
        currency: 'USD',
        interval: 'month',
        description: 'For large organizations requiring enterprise-grade features and support',
        features: [
          { name: 'Unlimited users', included: true },
          { name: 'Unlimited risks', included: true },
          { name: 'Unlimited controls', included: true },
          { name: 'Custom reporting', included: true },
          { name: 'Unlimited storage', included: true },
          { name: '24/7 dedicated support', included: true },
          { name: 'Unlimited AI features', included: true },
          { name: 'Advanced analytics', included: true },
          { name: 'Custom integrations', included: true },
          { name: 'SSO & SAML', included: true },
          { name: 'On-premise deployment', included: true },
        ],
      },
    ];
  }
}

const BillingDashboard: React.FC = () => {
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [availablePlans, setAvailablePlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');

  const billingService = BillingService.getInstance();

  // Load billing data
  const loadBillingData = async () => {
    try {
      setLoading(true);
      const [billing, plans] = await Promise.all([
        billingService.getBillingData(),
        billingService.getAvailablePlans(),
      ]);
      
      setBillingData(billing);
      setAvailablePlans(plans);
    } catch (error) {
      // console.error('Failed to load billing data:', error);
      toast.error('Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  // Handle plan upgrade
  const handlePlanUpgrade = async (planId: string) => {
    try {
      const result = await billingService.updateSubscription(planId);
      if (result.success) {
        toast.success('Subscription updated successfully');
        loadBillingData();
      } else {
        toast.error('Failed to update subscription');
      }
    } catch (error) {
      toast.error('Failed to update subscription');
    }
  };

  // Handle subscription cancellation
  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return;
    }

    try {
      const result = await billingService.cancelSubscription();
      if (result.success) {
        toast.success('Subscription cancelled successfully');
        loadBillingData();
      } else {
        toast.error('Failed to cancel subscription');
      }
    } catch (error) {
      toast.error('Failed to cancel subscription');
    }
  };

  // Handle invoice download
  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      await billingService.downloadInvoice(invoiceId);
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      toast.error('Failed to download invoice');
    }
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  // Get usage percentage
  const getUsagePercentage = (current: number, limit: number): number => {
    if (limit === 0) return 0;
    return Math.min((current / limit) * 100, 100);
  };

  // Get usage color
  const getUsageColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  useEffect(() => {
    loadBillingData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!billingData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <DaisyAlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" >
  <p>
</DaisyAlertTriangle>Failed to load billing information</p>
          <DaisyButton onClick={loadBillingData} className="mt-2">
          Retry

        </DaisyButton>
          </DaisyButton>
        </div>
      </div>
    );
  }

  const currentPlan = availablePlans.find(plan => plan.name.toUpperCase() === billingData.subscription.plan);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage your subscription, usage, and billing information
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <DaisyButton variant="outline" size="sm" >
  <Settings className="h-4 w-4 mr-2" />
</DaisyButton>
            Billing Settings
          </DaisyButton>
        </div>
      </div>

      {/* Subscription Status Alert */}
      {billingData.subscription.status !== 'ACTIVE' && (
        <DaisyAlert variant="error" >
  <DaisyAlertTriangle className="h-4 w-4" />
</DaisyAlert>
          <DaisyAlertTitle>Subscription Issue</DaisyAlertTitle>
          <DaisyAlertDescription >
  Your subscription is {billingData.subscription.status.toLowerCase()}. 
                </DaisyAlertDescription>
</DaisyAlert>
            Please update your payment method to continue using premium features.
                </DaisyAlertDescription>
              </DaisyAlert>
      )}

      {/* Current Subscription */}
      <DaisyCard >
  <DaisyCardBody >
</DaisyCard>
          <DaisyCardTitle className="flex items-center gap-2" >
  <CreditCard className="h-5 w-5" />
</DaisyCardTitle>
            Current Subscription
          </DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
</DaisyCardBody>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold">{billingData.subscription.plan}</h3>
                <DaisyBadge variant={billingData.subscription.status === 'ACTIVE' ? 'default' : 'destructive'} >
  {billingData.subscription.status}
</DaisyBadge>
                </DaisyBadge>
              </div>
              <p className="text-2xl font-bold">
                {formatCurrency(billingData.subscription.amount)}
                <span className="text-sm font-normal text-gray-600">/{billingData.subscription.interval}</span>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Next billing: {format(new Date(billingData.subscription.nextBillingDate), 'MMM dd, yyyy')}
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Billing Period</h4>
              <p className="text-sm text-gray-600">
                {format(new Date(billingData.subscription.currentPeriodStart), 'MMM dd, yyyy')} - 
                {format(new Date(billingData.subscription.currentPeriodEnd), 'MMM dd, yyyy')}
              </p>
              {billingData.subscription.cancelAtPeriodEnd && (
                <DaisyBadge variant="secondary" className="mt-2" >
  Cancels at period end
</DaisyBadge>
                </DaisyBadge>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <DaisyButton variant="outline" size="sm">
          Change Plan

        </DaisyButton>
              </DaisyButton>
              {!billingData.subscription.cancelAtPeriodEnd && (
                <DaisyButton 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCancelSubscription}
                  className="text-red-600 hover:text-red-700">
          Cancel Subscription

        </DaisyButton>
                </DaisyButton>
              )}
            </div>
          </div>
        </DaisyCardBody>
      </DaisyCard>

      {/* Usage Overview */}
      <DaisyCard >
  <DaisyCardBody >
</DaisyCard>
          <DaisyCardTitle className="flex items-center gap-2" >
  <TrendingUp className="h-5 w-5" />
</DaisyCardTitle>
            Usage Overview
          </DaisyCardTitle>
          <DaisyCardDescription >
  Current usage across all features in your billing period
</DaisyCardDescription>
          </p>
        
        <DaisyCardBody >
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
</DaisyCardBody>
            {Object.entries(billingData.usage).map(([key, usage]) => {
              const percentage = getUsagePercentage(usage.current, usage.limit);
              const isUnlimited = usage.limit === -1;
              
              return (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className={`text-sm font-medium ${getUsageColor(percentage)}`}>
                      {isUnlimited ? '∞' : `${usage.current}/${usage.limit}`}
                    </span>
                  </div>
                  {!isUnlimited && (
                    <DaisyProgress 
                      value={percentage} 
                      className="h-2" />)}
                  {!isUnlimited && percentage >= 90 && (
                    <p className="text-xs text-red-600">
                      Approaching limit
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </DaisyProgress>
      </DaisyCard>

      {/* Tabs */}
      <DaisyTabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4" >
          <DaisyTabsList className="grid w-full grid-cols-3" >
            <DaisyTabsTrigger value="overview">Overview</DaisyTabs>
          <DaisyTabsTrigger value="invoices">Invoices</DaisyTabsTrigger>
          <DaisyTabsTrigger value="plans">Plans</DaisyTabsTrigger>
        </DaisyTabsList>

        <DaisyTabsContent value="overview" className="space-y-4" >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Upcoming Invoice */}
            {billingData.upcomingInvoice && (
              <DaisyCard >
  <DaisyCardBody >
</DaisyTabsContent>
                  <DaisyCardTitle className="flex items-center gap-2" >
  <DaisyCalendar className="h-5 w-5" />
</DaisyCardTitle>
                    Upcoming Invoice
                  </DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <div className="space-y-2">
</DaisyCardBody>
                    <div className="flex justify-between">
                      <span>Amount:</span>
                      <span className="font-medium">
                        {formatCurrency(billingData.upcomingInvoice.amount, billingData.upcomingInvoice.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Due Date:</span>
                      <span className="font-medium">
                        {format(new Date(billingData.upcomingInvoice.dueDate), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Period:</span>
                      <span className="font-medium">
                        {format(new Date(billingData.upcomingInvoice.periodStart), 'MMM dd')} - 
                        {format(new Date(billingData.upcomingInvoice.periodEnd), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>
                </DaisyCardBody>
              </DaisyCard>
            )}

            {/* Payment Methods */}
            <DaisyCard >
  <DaisyCardBody >
</DaisyCard>
                <DaisyCardTitle className="flex items-center gap-2" >
  <CreditCard className="h-5 w-5" />
</DaisyCardTitle>
                  Payment Methods
                </DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <div className="space-y-3">
</DaisyCardBody>
                  {billingData.paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium">
                            {method.brand?.toUpperCase()} •••• {method.last4}
                          </p>
                          {method.expiryMonth && method.expiryYear && (
                            <p className="text-sm text-gray-600">
                              Expires {method.expiryMonth}/{method.expiryYear}
                            </p>
                          )}
                        </div>
                      </div>
                      {method.isDefault && (
                        <DaisyBadge variant="secondary">Default</DaisyBadge>
                      )}
                    </div>
                  ))}
                  <DaisyButton variant="outline" size="sm" className="w-full">
          Add Payment Method

        </DaisyButton>
                  </DaisyButton>
                </div>
              </DaisyCardBody>
            </DaisyCard>
          </div>
        </DaisyTabsContent>

        <DaisyTabsContent value="invoices" className="space-y-4" >
            <DaisyCard >
  <DaisyCardBody >
</DaisyTabsContent>
              <DaisyCardTitle className="flex items-center gap-2" >
  <FileText className="h-5 w-5" />
</DaisyCardTitle>
                Invoice History
              </DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <div className="space-y-3">
</DaisyCardBody>
                {billingData.invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{invoice.number}</p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(invoice.created), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(invoice.amount, invoice.currency)}
                        </p>
                        <DaisyBadge 
                          variant={
                            invoice.status === 'PAID' ? 'default' :
                            invoice.status === 'PENDING' ? 'secondary' :
                            'destructive'
                          } >
  {invoice.status}
</DaisyBadge>
                        </DaisyBadge>
                      </div>
                      <DaisyButton 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownloadInvoice(invoice.id)} />
                        <Download className="h-4 w-4" />
                      </DaisyButton>
                    </div>
                  </div>
                ))}
              </div>
            </DaisyCardBody>
          </DaisyCard>
        </DaisyTabsContent>

        <DaisyTabsContent value="plans" className="space-y-4" >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {availablePlans.map((plan) => (
              <DaisyCard 
                key={plan.id} 
                className={`relative ${plan.popular ? 'border-blue-500 shadow-lg' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <DaisyBadge className="bg-blue-500">Most Popular</DaisyTabsContent>
                  </div>
                )}
                <DaisyCardBody >
  <DaisyCardTitle className="flex items-center justify-between" >
</DaisyCardBody>
                    {plan.name}
                    {billingData.subscription.plan === plan.name.toUpperCase() && (
                      <DaisyBadge variant="secondary">Current</DaisyBadge>
                    )}
                  </DaisyCardTitle>
                  <DaisyCardDescription>{plan.description}</p>
                  <div className="text-3xl font-bold">
                    {formatCurrency(plan.price)}
                    <span className="text-sm font-normal text-gray-600">/{plan.interval}</span>
                  </div>
                
                <DaisyCardBody >
  <div className="space-y-3">
</DaisyCardDescription>
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        {feature.included ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border border-gray-300" />
                        )}
                        <span className={`text-sm ${feature.included ? '' : 'text-gray-500'}`}>
                          {feature.name}
                          {feature.limit && ` (${feature.limit.toLocaleString()})`}
                        </span>
                      </div>
                    ))}
                  </div>
                  <DaisyButton 
                    className="w-full mt-6"
                    variant={billingData.subscription.plan === plan.name.toUpperCase() ? 'outline' : 'primary'}
                    disabled={billingData.subscription.plan === plan.name.toUpperCase()}
                    onClick={() =>
          handlePlanUpgrade(plan.id)} />
                    {billingData.subscription.plan === plan.name.toUpperCase() ? 'Current Plan' : 'Upgrade'}
                  
        </DaisyButton>
                </DaisyCardBody>
              </DaisyCard>
            ))}
          </div>
        </DaisyTabsContent>
      </DaisyTabs>
    </div>
  );
};

export default BillingDashboard; 