export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  type: 'freemium' | 'starter' | 'professional' | 'enterprise' | 'custom';
  billingInterval: 'monthly' | 'yearly';
  price: number;
  currency: string;
  features: PlanFeature[];
  limits: PlanLimits;
  trialDays: number;
  isActive: boolean;
  stripePriceId?: string;
  customPricing?: boolean;
  contactSales?: boolean;
  popular?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanFeature {
  id: string;
  name: string;
  description: string;
  category: 'core' | 'ai' | 'collaboration' | 'compliance' | 'reporting' | 'support';
  included: boolean;
  limit?: number;
  unlimited?: boolean;
}

export interface PlanLimits {
  users: number;
  risks: number;
  controls: number;
  documents: number;
  aiQueries: number;
  storageGB: number;
  apiCalls: number;
  frameworks: number;
  reports: number;
}

export interface OrganizationSubscription {
  id: string;
  organizationId: string;
  planId: string;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialStart?: Date;
  trialEnd?: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  billingCycle: 'monthly' | 'yearly';
  quantity: number;
  unitPrice: number;
  discount?: SubscriptionDiscount;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionDiscount {
  id: string;
  type: 'percentage' | 'fixed_amount';
  value: number;
  duration: 'once' | 'repeating' | 'forever';
  durationInMonths?: number;
  validFrom: Date;
  validUntil?: Date;
  couponCode?: string;
  reason?: string;
}

export interface UsageBilling {
  id: string;
  organizationId: string;
  subscriptionId: string;
  billingPeriod: {
    start: Date;
    end: Date;
  };
  usageData: UsageMetric[];
  totalAmount: number;
  currency: string;
  status: 'pending' | 'invoiced' | 'paid';
  stripeInvoiceId?: string;
  createdAt: Date;
}

export interface UsageMetric {
  id: string;
  type: 'ai_queries' | 'api_calls' | 'storage_gb' | 'document_processing' | 'compliance_scans';
  name: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  priceModel: 'per_unit' | 'tiered' | 'volume';
  tiers?: PricingTier[];
}

export interface PricingTier {
  upTo: number | null; // null for unlimited
  unitPrice: number;
  flatFee?: number;
}

export interface Invoice {
  id: string;
  organizationId: string;
  subscriptionId?: string;
  stripeInvoiceId?: string;
  invoiceNumber: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  type: 'subscription' | 'usage' | 'one_time' | 'credit';
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  currency: string;
  billingPeriod: {
    start: Date;
    end: Date;
  };
  lineItems: InvoiceLineItem[];
  paymentMethod?: PaymentMethod;
  paidAt?: Date;
  dueDate: Date;
  notes?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceLineItem {
  id: string;
  type: 'subscription' | 'usage' | 'one_time' | 'tax' | 'discount';
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  period?: {
    start: Date;
    end: Date;
  };
  metadata?: Record<string, any>;
}

export interface PaymentMethod {
  id: string;
  organizationId: string;
  stripePaymentMethodId: string;
  type: 'card' | 'bank_account' | 'sepa_debit' | 'ideal' | 'ach_debit';
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
    fingerprint: string;
  };
  bankAccount?: {
    bankName: string;
    last4: string;
    routingNumber: string;
    accountType: 'checking' | 'savings';
  };
  isDefault: boolean;
  isActive: boolean;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillingAddress {
  id: string;
  organizationId: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  taxId?: string;
  isDefault: boolean;
}

export interface PaymentIntent {
  id: string;
  organizationId: string;
  stripePaymentIntentId: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled';
  invoiceId?: string;
  subscriptionId?: string;
  paymentMethodId?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillingEvent {
  id: string;
  organizationId: string;
  type: 'subscription_created' | 'subscription_updated' | 'subscription_canceled' | 'invoice_created' | 'invoice_paid' | 'invoice_failed' | 'payment_succeeded' | 'payment_failed' | 'trial_ending' | 'usage_threshold';
  eventData: Record<string, any>;
  processed: boolean;
  processedAt?: Date;
  errorMessage?: string;
  retryCount: number;
  nextRetryAt?: Date;
  webhookEndpoint?: string;
  stripeEventId?: string;
  createdAt: Date;
}

export interface DunningCampaign {
  id: string;
  organizationId: string;
  subscriptionId: string;
  invoiceId: string;
  status: 'active' | 'paused' | 'completed' | 'canceled';
  currentStep: number;
  totalSteps: number;
  steps: DunningStep[];
  pausedReason?: string;
  completedReason?: 'payment_received' | 'subscription_canceled' | 'manual_resolution';
  createdAt: Date;
  updatedAt: Date;
}

export interface DunningStep {
  stepNumber: number;
  type: 'email' | 'sms' | 'phone_call' | 'service_restriction' | 'subscription_cancel';
  delayDays: number;
  template: string;
  executed: boolean;
  executedAt?: Date;
  scheduledFor: Date;
  metadata?: Record<string, any>;
}

export interface TaxConfiguration {
  id: string;
  organizationId: string;
  country: string;
  state?: string;
  taxId?: string;
  taxExempt: boolean;
  automaticTax: boolean;
  taxProviders: TaxProvider[];
  taxRates: TaxRate[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TaxProvider {
  name: 'stripe_tax' | 'taxjar' | 'avalara' | 'manual';
  enabled: boolean;
  configuration: Record<string, any>;
}

export interface TaxRate {
  id: string;
  displayName: string;
  jurisdiction: string;
  percentage: number;
  type: 'inclusive' | 'exclusive';
  active: boolean;
  stripeTaxRateId?: string;
}

export interface BillingAnalytics {
  period: {
    start: Date;
    end: Date;
  };
  revenue: {
    total: number;
    recurring: number;
    oneTime: number;
    usage: number;
    currency: string;
  };
  subscriptions: {
    total: number;
    active: number;
    trial: number;
    canceled: number;
    churnRate: number;
  };
  customers: {
    total: number;
    new: number;
    churned: number;
  };
  metrics: {
    mrr: number; // Monthly Recurring Revenue
    arr: number; // Annual Recurring Revenue
    ltv: number; // Lifetime Value
    cac: number; // Customer Acquisition Cost
    arpu: number; // Average Revenue Per User
  };
  planDistribution: PlanMetric[];
  paymentMethods: PaymentMethodMetric[];
}

export interface PlanMetric {
  planId: string;
  planName: string;
  subscriptions: number;
  revenue: number;
  percentage: number;
}

export interface PaymentMethodMetric {
  type: string;
  count: number;
  percentage: number;
}

export interface BillingConfiguration {
  id: string;
  organizationId: string;
  currency: string;
  timezone: string;
  invoicePrefix: string;
  invoiceNumbering: 'sequential' | 'random';
  paymentTerms: number; // days
  lateFeePercentage: number;
  reminderSettings: {
    enabled: boolean;
    daysBeforeDue: number[];
    daysAfterDue: number[];
  };
  retrySettings: {
    enabled: boolean;
    maxRetries: number;
    retryIntervals: number[]; // days
  };
  webhookEndpoints: WebhookEndpoint[];
  accounting: {
    provider?: 'quickbooks' | 'xero' | 'netsuite';
    configuration?: Record<string, any>;
    syncEnabled: boolean;
  };
  updatedAt: Date;
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
}

export interface RevenueMilestone {
  id: string;
  organizationId: string;
  type: 'monthly' | 'quarterly' | 'annual';
  amount: number;
  currency: string;
  achievedAt: Date;
  previousAmount?: number;
  growthPercentage?: number;
}

export interface CustomerPortalSession {
  id: string;
  organizationId: string;
  stripeSessionId: string;
  url: string;
  returnUrl: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface BillingAlert {
  id: string;
  organizationId: string;
  type: 'payment_failed' | 'trial_ending' | 'usage_limit' | 'subscription_canceled' | 'high_usage' | 'dunning_started';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  acknowledged: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  actionRequired: boolean;
  actionUrl?: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface CurrencyExchangeRate {
  baseCurrency: string;
  targetCurrency: string;
  rate: number;
  validAt: Date;
  source: string;
}

export interface SubscriptionUpgrade {
  id: string;
  organizationId: string;
  fromPlanId: string;
  toPlanId: string;
  effectiveDate: Date;
  proratedAmount: number;
  reason: 'user_upgrade' | 'usage_limit' | 'admin_change' | 'automatic';
  status: 'pending' | 'completed' | 'failed' | 'canceled';
  stripeSubscriptionScheduleId?: string;
  createdAt: Date;
  completedAt?: Date;
} 