-- Billing System Migration
-- This migration adds comprehensive subscription and billing management capabilities
-- Author: Claude Code Implementation
-- Date: 2024-07-04

-- ============================================================================
-- SUBSCRIPTION PLANS
-- ============================================================================

-- Main subscription plans table
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "monthlyPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "yearlyPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "billingInterval" TEXT NOT NULL DEFAULT 'month', -- 'month' or 'year'
    "stripePriceId" TEXT,
    "stripeProductId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "maxUsers" INTEGER NOT NULL DEFAULT -1, -- -1 for unlimited
    "maxRisks" INTEGER NOT NULL DEFAULT -1,
    "maxControls" INTEGER NOT NULL DEFAULT -1,
    "maxDocuments" INTEGER NOT NULL DEFAULT -1,
    "maxApiCalls" INTEGER NOT NULL DEFAULT -1,
    "maxAiQueries" INTEGER NOT NULL DEFAULT -1,
    "features" JSONB NOT NULL DEFAULT '[]',
    "limits" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- ============================================================================
-- ORGANIZATION SUBSCRIPTIONS
-- ============================================================================

-- Organization subscription instances
CREATE TABLE "OrganizationSubscription" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT,
    "stripeCustomerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'trialing', -- 'trialing', 'active', 'canceled', 'past_due', 'unpaid'
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "trialStart" TIMESTAMP(3),
    "trialEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "defaultPaymentMethodId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationSubscription_pkey" PRIMARY KEY ("id")
);

-- ============================================================================
-- PAYMENT METHODS
-- ============================================================================

-- Payment methods for organizations
CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "stripePaymentMethodId" TEXT NOT NULL,
    "type" TEXT NOT NULL, -- 'card', 'bank_account', 'paypal'
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "last4" TEXT,
    "brand" TEXT,
    "expiryMonth" INTEGER,
    "expiryYear" INTEGER,
    "country" TEXT,
    "fingerprint" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- ============================================================================
-- INVOICES
-- ============================================================================

-- Invoice records
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "stripeInvoiceId" TEXT NOT NULL,
    "number" TEXT,
    "status" TEXT NOT NULL, -- 'draft', 'open', 'paid', 'void', 'uncollectible'
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "amountDue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "amountPaid" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tax" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "hostedInvoiceUrl" TEXT,
    "invoicePdf" TEXT,
    "paymentIntent" TEXT,
    "lineItems" JSONB NOT NULL DEFAULT '[]',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- ============================================================================
-- USAGE RECORDS
-- ============================================================================

-- Usage tracking for metered billing
CREATE TABLE "UsageRecord" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "metric" TEXT NOT NULL, -- 'users', 'risks', 'api_calls', 'ai_queries', etc.
    "quantity" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL, -- 'increment', 'set'
    "metadata" JSONB,
    "idempotencyKey" TEXT,

    CONSTRAINT "UsageRecord_pkey" PRIMARY KEY ("id")
);

-- ============================================================================
-- BILLING EVENTS
-- ============================================================================

-- Billing event history for audit trail
CREATE TABLE "BillingEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" TEXT NOT NULL, -- 'subscription.created', 'invoice.paid', 'payment.failed', etc.
    "stripeEventId" TEXT,
    "data" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "error" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "BillingEvent_pkey" PRIMARY KEY ("id")
);

-- ============================================================================
-- SUBSCRIPTION FEATURES
-- ============================================================================

-- Plan features for granular feature control
CREATE TABLE "PlanFeature" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "featureId" TEXT NOT NULL, -- 'advanced_analytics', 'api_access', 'priority_support'
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "included" BOOLEAN NOT NULL DEFAULT true,
    "limit" INTEGER, -- For features with usage limits
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanFeature_pkey" PRIMARY KEY ("id")
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- SubscriptionPlan indexes
CREATE INDEX "SubscriptionPlan_isActive_sortOrder_idx" ON "SubscriptionPlan"("isActive", "sortOrder");
CREATE INDEX "SubscriptionPlan_stripePriceId_idx" ON "SubscriptionPlan"("stripePriceId");
CREATE INDEX "SubscriptionPlan_stripeProductId_idx" ON "SubscriptionPlan"("stripeProductId");

-- OrganizationSubscription indexes
CREATE INDEX "OrganizationSubscription_organizationId_idx" ON "OrganizationSubscription"("organizationId");
CREATE INDEX "OrganizationSubscription_planId_idx" ON "OrganizationSubscription"("planId");
CREATE INDEX "OrganizationSubscription_stripeSubscriptionId_idx" ON "OrganizationSubscription"("stripeSubscriptionId");
CREATE INDEX "OrganizationSubscription_status_idx" ON "OrganizationSubscription"("status");
CREATE INDEX "OrganizationSubscription_currentPeriodEnd_idx" ON "OrganizationSubscription"("currentPeriodEnd");
CREATE INDEX "OrganizationSubscription_trialEnd_idx" ON "OrganizationSubscription"("trialEnd");

-- PaymentMethod indexes
CREATE INDEX "PaymentMethod_organizationId_idx" ON "PaymentMethod"("organizationId");
CREATE INDEX "PaymentMethod_stripePaymentMethodId_idx" ON "PaymentMethod"("stripePaymentMethodId");
CREATE INDEX "PaymentMethod_isDefault_isActive_idx" ON "PaymentMethod"("isDefault", "isActive");

-- Invoice indexes
CREATE INDEX "Invoice_organizationId_idx" ON "Invoice"("organizationId");
CREATE INDEX "Invoice_subscriptionId_idx" ON "Invoice"("subscriptionId");
CREATE INDEX "Invoice_stripeInvoiceId_idx" ON "Invoice"("stripeInvoiceId");
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");
CREATE INDEX "Invoice_dueDate_idx" ON "Invoice"("dueDate");
CREATE INDEX "Invoice_createdAt_idx" ON "Invoice"("createdAt");

-- UsageRecord indexes
CREATE INDEX "UsageRecord_organizationId_idx" ON "UsageRecord"("organizationId");
CREATE INDEX "UsageRecord_subscriptionId_idx" ON "UsageRecord"("subscriptionId");
CREATE INDEX "UsageRecord_metric_timestamp_idx" ON "UsageRecord"("metric", "timestamp");
CREATE INDEX "UsageRecord_timestamp_idx" ON "UsageRecord"("timestamp");
CREATE INDEX "UsageRecord_idempotencyKey_idx" ON "UsageRecord"("idempotencyKey");

-- BillingEvent indexes
CREATE INDEX "BillingEvent_organizationId_idx" ON "BillingEvent"("organizationId");
CREATE INDEX "BillingEvent_type_idx" ON "BillingEvent"("type");
CREATE INDEX "BillingEvent_stripeEventId_idx" ON "BillingEvent"("stripeEventId");
CREATE INDEX "BillingEvent_processed_createdAt_idx" ON "BillingEvent"("processed", "createdAt");

-- PlanFeature indexes
CREATE INDEX "PlanFeature_planId_idx" ON "PlanFeature"("planId");
CREATE INDEX "PlanFeature_featureId_idx" ON "PlanFeature"("featureId");
CREATE INDEX "PlanFeature_category_idx" ON "PlanFeature"("category");

-- ============================================================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- OrganizationSubscription foreign keys
ALTER TABLE "OrganizationSubscription" ADD CONSTRAINT "OrganizationSubscription_organizationId_fkey" 
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizationSubscription" ADD CONSTRAINT "OrganizationSubscription_planId_fkey" 
    FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- PaymentMethod foreign keys
ALTER TABLE "PaymentMethod" ADD CONSTRAINT "PaymentMethod_organizationId_fkey" 
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Invoice foreign keys
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_organizationId_fkey" 
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_subscriptionId_fkey" 
    FOREIGN KEY ("subscriptionId") REFERENCES "OrganizationSubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- UsageRecord foreign keys
ALTER TABLE "UsageRecord" ADD CONSTRAINT "UsageRecord_organizationId_fkey" 
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UsageRecord" ADD CONSTRAINT "UsageRecord_subscriptionId_fkey" 
    FOREIGN KEY ("subscriptionId") REFERENCES "OrganizationSubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- BillingEvent foreign keys
ALTER TABLE "BillingEvent" ADD CONSTRAINT "BillingEvent_organizationId_fkey" 
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- PlanFeature foreign keys
ALTER TABLE "PlanFeature" ADD CONSTRAINT "PlanFeature_planId_fkey" 
    FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- UNIQUE CONSTRAINTS
-- ============================================================================

-- Unique constraints for data integrity
ALTER TABLE "SubscriptionPlan" ADD CONSTRAINT "SubscriptionPlan_name_key" UNIQUE ("name");
ALTER TABLE "SubscriptionPlan" ADD CONSTRAINT "SubscriptionPlan_stripePriceId_key" UNIQUE ("stripePriceId");
ALTER TABLE "OrganizationSubscription" ADD CONSTRAINT "OrganizationSubscription_stripeSubscriptionId_key" UNIQUE ("stripeSubscriptionId");
ALTER TABLE "PaymentMethod" ADD CONSTRAINT "PaymentMethod_stripePaymentMethodId_key" UNIQUE ("stripePaymentMethodId");
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_stripeInvoiceId_key" UNIQUE ("stripeInvoiceId");
ALTER TABLE "UsageRecord" ADD CONSTRAINT "UsageRecord_idempotencyKey_key" UNIQUE ("idempotencyKey");
ALTER TABLE "BillingEvent" ADD CONSTRAINT "BillingEvent_stripeEventId_key" UNIQUE ("stripeEventId");
ALTER TABLE "PlanFeature" ADD CONSTRAINT "PlanFeature_planId_featureId_key" UNIQUE ("planId", "featureId");

-- ============================================================================
-- BILLING ENUMS
-- ============================================================================

-- Create enum types for better data consistency
CREATE TYPE "SubscriptionStatus" AS ENUM ('trialing', 'active', 'canceled', 'past_due', 'unpaid', 'incomplete', 'incomplete_expired');
CREATE TYPE "InvoiceStatus" AS ENUM ('draft', 'open', 'paid', 'void', 'uncollectible');
CREATE TYPE "PaymentMethodType" AS ENUM ('card', 'bank_account', 'paypal', 'sepa_debit');
CREATE TYPE "BillingInterval" AS ENUM ('month', 'year');

-- Note: In production, these enum migrations should be done carefully
-- ALTER TABLE "OrganizationSubscription" ALTER COLUMN "status" TYPE "SubscriptionStatus" USING "status"::"SubscriptionStatus";
-- ALTER TABLE "Invoice" ALTER COLUMN "status" TYPE "InvoiceStatus" USING "status"::"InvoiceStatus";
-- ALTER TABLE "PaymentMethod" ALTER COLUMN "type" TYPE "PaymentMethodType" USING "type"::"PaymentMethodType";
-- ALTER TABLE "SubscriptionPlan" ALTER COLUMN "billingInterval" TYPE "BillingInterval" USING "billingInterval"::"BillingInterval";

-- ============================================================================
-- BILLING TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Function to update organization billing fields when subscription changes
CREATE OR REPLACE FUNCTION update_organization_billing() RETURNS TRIGGER AS $$
BEGIN
    -- Update organization's plan and stripeCustomerId when subscription changes
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE "Organization" 
        SET 
            "plan" = (SELECT "name" FROM "SubscriptionPlan" WHERE "id" = NEW."planId"),
            "stripeCustomerId" = NEW."stripeCustomerId",
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = NEW."organizationId";
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for organization billing updates
CREATE TRIGGER update_organization_billing_trigger
    AFTER INSERT OR UPDATE ON "OrganizationSubscription"
    FOR EACH ROW EXECUTE FUNCTION update_organization_billing();

-- Function to ensure only one default payment method per organization
CREATE OR REPLACE FUNCTION ensure_single_default_payment_method() RETURNS TRIGGER AS $$
BEGIN
    IF NEW."isDefault" = true THEN
        -- Remove default flag from other payment methods for this organization
        UPDATE "PaymentMethod" 
        SET "isDefault" = false, "updatedAt" = CURRENT_TIMESTAMP
        WHERE "organizationId" = NEW."organizationId" 
        AND "id" != NEW."id" 
        AND "isDefault" = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for default payment method enforcement
CREATE TRIGGER ensure_single_default_payment_method_trigger
    BEFORE INSERT OR UPDATE ON "PaymentMethod"
    FOR EACH ROW EXECUTE FUNCTION ensure_single_default_payment_method();

-- Function to automatically create billing events
CREATE OR REPLACE FUNCTION create_billing_event() RETURNS TRIGGER AS $$
DECLARE
    event_type TEXT;
    event_data JSONB;
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF TG_TABLE_NAME = 'OrganizationSubscription' THEN
            event_type := 'subscription.created';
            event_data := to_jsonb(NEW);
        ELSIF TG_TABLE_NAME = 'Invoice' THEN
            event_type := 'invoice.created';
            event_data := to_jsonb(NEW);
        ELSIF TG_TABLE_NAME = 'PaymentMethod' THEN
            event_type := 'payment_method.created';
            event_data := to_jsonb(NEW);
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF TG_TABLE_NAME = 'OrganizationSubscription' THEN
            event_type := 'subscription.updated';
            event_data := jsonb_build_object('from', to_jsonb(OLD), 'to', to_jsonb(NEW));
        ELSIF TG_TABLE_NAME = 'Invoice' THEN
            event_type := 'invoice.updated';
            event_data := jsonb_build_object('from', to_jsonb(OLD), 'to', to_jsonb(NEW));
        END IF;
    END IF;

    -- Insert billing event
    INSERT INTO "BillingEvent" ("organizationId", "type", "data", "createdAt")
    VALUES (NEW."organizationId", event_type, event_data, CURRENT_TIMESTAMP);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic billing event creation
CREATE TRIGGER create_subscription_billing_event_trigger
    AFTER INSERT OR UPDATE ON "OrganizationSubscription"
    FOR EACH ROW EXECUTE FUNCTION create_billing_event();

CREATE TRIGGER create_invoice_billing_event_trigger
    AFTER INSERT OR UPDATE ON "Invoice"
    FOR EACH ROW EXECUTE FUNCTION create_billing_event();

CREATE TRIGGER create_payment_method_billing_event_trigger
    AFTER INSERT ON "PaymentMethod"
    FOR EACH ROW EXECUTE FUNCTION create_billing_event();

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert default subscription plans
INSERT INTO "SubscriptionPlan" ("id", "name", "description", "monthlyPrice", "yearlyPrice", "sortOrder", "maxUsers", "maxRisks", "maxControls", "maxDocuments", "maxApiCalls", "maxAiQueries", "features", "limits") VALUES
('plan-free', 'Free', 'Perfect for getting started with basic risk management', 0, 0, 1, 2, 10, 5, 10, 100, 10, 
 '[{"id": "basic_features", "name": "Basic Features", "description": "Essential risk management tools", "category": "core", "included": true}]',
 '{"users": 2, "risks": 10, "controls": 5, "documents": 10, "apiCalls": 100, "aiQueries": 10}'),
 
('plan-pro', 'Professional', 'Advanced features for growing organizations', 49, 490, 2, 50, 500, 250, 1000, 10000, 1000,
 '[{"id": "advanced_analytics", "name": "Advanced Analytics", "description": "Detailed insights and reporting", "category": "analytics", "included": true}, {"id": "api_access", "name": "API Access", "description": "Full API integration capabilities", "category": "integration", "included": true}]',
 '{"users": 50, "risks": 500, "controls": 250, "documents": 1000, "apiCalls": 10000, "aiQueries": 1000}'),
 
('plan-enterprise', 'Enterprise', 'Complete solution for large enterprises', 199, 1990, 3, -1, -1, -1, -1, -1, -1,
 '[{"id": "unlimited_everything", "name": "Unlimited Access", "description": "No limits on usage", "category": "enterprise", "included": true}, {"id": "priority_support", "name": "Priority Support", "description": "24/7 dedicated support", "category": "support", "included": true}, {"id": "custom_integrations", "name": "Custom Integrations", "description": "Tailored integration solutions", "category": "integration", "included": true}]',
 '{"users": -1, "risks": -1, "controls": -1, "documents": -1, "apiCalls": -1, "aiQueries": -1}');

-- Insert plan features
INSERT INTO "PlanFeature" ("id", "planId", "featureId", "name", "description", "category", "included") VALUES
-- Free plan features
('pf-free-basic', 'plan-free', 'basic_features', 'Basic Features', 'Essential risk management tools', 'core', true),
('pf-free-dashboard', 'plan-free', 'basic_dashboard', 'Basic Dashboard', 'Simple overview and metrics', 'dashboard', true),

-- Professional plan features
('pf-pro-analytics', 'plan-pro', 'advanced_analytics', 'Advanced Analytics', 'Detailed insights and reporting', 'analytics', true),
('pf-pro-api', 'plan-pro', 'api_access', 'API Access', 'Full API integration capabilities', 'integration', true),
('pf-pro-export', 'plan-pro', 'data_export', 'Data Export', 'Export data in multiple formats', 'data', true),
('pf-pro-compliance', 'plan-pro', 'compliance_templates', 'Compliance Templates', 'Pre-built compliance frameworks', 'compliance', true),

-- Enterprise plan features
('pf-ent-unlimited', 'plan-enterprise', 'unlimited_everything', 'Unlimited Access', 'No limits on usage', 'enterprise', true),
('pf-ent-support', 'plan-enterprise', 'priority_support', 'Priority Support', '24/7 dedicated support', 'support', true),
('pf-ent-custom', 'plan-enterprise', 'custom_integrations', 'Custom Integrations', 'Tailored integration solutions', 'integration', true),
('pf-ent-sso', 'plan-enterprise', 'sso', 'Single Sign-On', 'SAML/OIDC authentication', 'security', true),
('pf-ent-audit', 'plan-enterprise', 'advanced_audit', 'Advanced Audit Logs', 'Comprehensive audit trail', 'security', true);

-- Migration complete
SELECT 'Billing system migration completed successfully' as status;