'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DollarSign
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  type: string;
  price: number;
  currency: string;
  billingInterval: 'monthly' | 'yearly';
  features: Array<{
    name: string;
    included: boolean;
    limit?: number;
    unlimited?: boolean;
  }>;
  limits: {
    users: number;
    risks: number;
    controls: number;
    aiQueries: number;
    storageGB: number;
  };
  popular?: boolean;
}

interface OrganizationSubscription {
  id: string;
  planId: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEnd?: string;
  cancelAtPeriodEnd: boolean;
  billingCycle: string;
  unitPrice: number;
  plan: SubscriptionPlan;
}

interface UsageData {
  type: string;
  current: number;
  limit: number;
  percentage: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  total: number;
  currency: string;
  dueDate: string;
  paidAt?: string;
  type: string;
}

interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  isDefault: boolean;
}

const BillingDashboard: React.FC = () => {
  const [subscription, setSubscription] = useState<OrganizationSubscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [usage, setUsage] = useState<UsageData[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    setLoading(true);
    try {
      // Load subscription
      const subResponse = await fetch('/api/billing/subscriptions');
      const subData = await subResponse.json();
      setSubscription(subData.subscription);

      // Load plans
      const plansResponse = await fetch('/api/billing/plans');
      const plansData = await plansResponse.json();
      setPlans(plansData.plans);

      // Mock usage data
      setUsage([
        { type: 'Users', current: 8, limit: 25, percentage: 32 },
        { type: 'AI Queries', current: 340, limit: 500, percentage: 68 },
        { type: 'Storage (GB)', current: 12, limit: 25, percentage: 48 },
        { type: 'API Calls', current: 2400, limit: 10000, percentage: 24 },
      ]);

      // Mock invoices
      setInvoices([
        {
          id: '1',
          invoiceNumber: 'INV-2024-001',
          status: 'paid',
          total: 149,
          currency: 'USD',
          dueDate: '2024-01-15',
          paidAt: '2024-01-14',
          type: 'subscription',
        },
        {
          id: '2',
          invoiceNumber: 'INV-2024-002',
          status: 'open',
          total: 149,
          currency: 'USD',
          dueDate: '2024-02-15',
          type: 'subscription',
        },
      ]);

      // Mock payment methods
      setPaymentMethods([
        {
          id: '1',
          type: 'card',
          card: {
            brand: 'visa',
            last4: '4242',
            expMonth: 12,
            expYear: 2025,
          },
          isDefault: true,
        },
      ]);
    } catch (error) {
      console.error('Failed to load billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; text: string }> = {
      active: { variant: 'default', text: 'Active' },
      trialing: { variant: 'secondary', text: 'Trial' },
      past_due: { variant: 'destructive', text: 'Past Due' },
      canceled: { variant: 'outline', text: 'Canceled' },
      paid: { variant: 'default', text: 'Paid' },
      open: { variant: 'destructive', text: 'Unpaid' },
    };

    const config = variants[status] || { variant: 'outline', text: status };
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const usageChartData = usage.map(item => ({
    name: item.type,
    current: item.current,
    limit: item.limit,
    percentage: item.percentage,
  }));

  const billingHistoryData = [
    { month: 'Jan', amount: 149 },
    { month: 'Feb', amount: 149 },
    { month: 'Mar', amount: 149 },
    { month: 'Apr', amount: 149 },
    { month: 'May', amount: 149 },
    { month: 'Jun', amount: 149 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-gray-600 mt-1">Manage your subscription, usage, and billing information</p>
        </div>
        <Button>
          <CreditCard className="w-4 h-4 mr-2" />
          Manage Billing
        </Button>
      </div>

      {/* Current Subscription Overview */}
      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-600">Plan</p>
                <p className="text-lg font-semibold">{subscription.plan.name}</p>
                {subscription.plan.popular && (
                  <Badge variant="secondary" className="mt-1">Popular</Badge>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <div className="mt-1">
                  {getStatusBadge(subscription.status)}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Billing Cycle</p>
                <p className="text-lg font-semibold capitalize">{subscription.billingCycle}</p>
                <p className="text-sm text-gray-500">
                  {formatCurrency(subscription.unitPrice)} / {subscription.billingCycle}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Next Billing</p>
                <p className="text-lg font-semibold">{formatDate(subscription.currentPeriodEnd)}</p>
                {subscription.trialEnd && (
                  <p className="text-sm text-orange-600">
                    Trial ends {formatDate(subscription.trialEnd)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Usage Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {usage.map((item) => (
              <Card key={item.type}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-600">{item.type}</p>
                    <span className="text-xs text-gray-500">
                      {item.current} / {item.limit === -1 ? '∞' : item.limit}
                    </span>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">{item.percentage}% used</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Billing History Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>Your billing charges over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={billingHistoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrency(value as number), 'Amount']} />
                  <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Usage Details</CardTitle>
              <CardDescription>Current usage across all features and limits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {usage.map((item) => (
                  <div key={item.type} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{item.type}</span>
                      <span className="text-sm text-gray-600">
                        {item.current} / {item.limit === -1 ? 'Unlimited' : item.limit}
                      </span>
                    </div>
                    <Progress value={item.percentage} className="h-3" />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{item.percentage}% used</span>
                      {item.percentage > 80 && (
                        <span className="text-orange-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Approaching limit
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={usageChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="percentage" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Invoices</CardTitle>
              <CardDescription>Your billing history and upcoming charges</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-gray-600">
                          Due: {formatDate(invoice.dueDate)}
                          {invoice.paidAt && ` • Paid: ${formatDate(invoice.paidAt)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(invoice.total)}</p>
                        <div className="mt-1">
                          {getStatusBadge(invoice.status)}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Manage your payment methods and billing information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <CreditCard className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium">
                          {method.card ? (
                            <>
                              {method.card.brand.toUpperCase()} •••• {method.card.last4}
                            </>
                          ) : (
                            method.type
                          )}
                        </p>
                        <p className="text-sm text-gray-600">
                          {method.card && `Expires ${method.card.expMonth}/${method.card.expYear}`}
                          {method.isDefault && (
                            <Badge variant="secondary" className="ml-2">Default</Badge>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="outline" size="sm">Remove</Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Add Payment Method
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className={`relative ${plan.popular ? 'border-blue-500 border-2' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500">Most Popular</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="flex justify-between items-start">
                    <span>{plan.name}</span>
                    <span className="text-sm text-gray-500 capitalize">{plan.type}</span>
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <span className="text-3xl font-bold">{formatCurrency(plan.price)}</span>
                    <span className="text-gray-600">/{plan.billingInterval}</span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {plan.features.slice(0, 4).map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>
                          {feature.name}
                          {feature.limit && ` (${feature.limit})`}
                          {feature.unlimited && ' (Unlimited)'}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Button 
                    className="w-full" 
                    variant={subscription?.planId === plan.id ? "outline" : "default"}
                    disabled={subscription?.planId === plan.id}
                  >
                    {subscription?.planId === plan.id ? 'Current Plan' : 'Upgrade'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BillingDashboard; 