/**
 * Comprehensive test suite for BillingManager
 * Tests all billing operations including subscriptions, plans, and analytics
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { BillingManager } from '@/lib/billing/manager';
import {
  createMockPrismaClient,
  createTestSubscriptionPlan,
  createTestSubscription,
  createTestOrganization,
  cleanupTestData,
  type MockPrismaClient,
} from '../../utils/test-helpers';

// Mock the database
const mockPrisma = createMockPrismaClient();
jest.mock('@/lib/db', () => ({
  db: {
    client: mockPrisma,
  },
}));

// Mock the Stripe service
const mockStripeService = {
  getPaymentMethod: jest.fn<any, any>(),
};
jest.mock('@/lib/billing/stripe', () => ({
  stripeService: mockStripeService,
}));

describe('BillingManager', () => {
  let billingManager: BillingManager;
  let testOrg: any;
  let testPlan: any;
  let testSubscription: any;

  beforeEach(() => {
    billingManager = new BillingManager();
    testOrg = createTestOrganization();
    testPlan = createTestSubscriptionPlan();
    testSubscription = createTestSubscription();

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // ============================================================================
  // SUBSCRIPTION PLAN MANAGEMENT TESTS
  // ============================================================================

  describe('Subscription Plan Management', () => {
    describe('createSubscriptionPlan', () => {
      it('should create a new subscription plan successfully', async () => {
        const planData = {
          name: 'Enterprise',
          description: 'Enterprise plan',
          type: 'enterprise',
          price: 199,
          currency: 'USD',
          billingInterval: 'monthly',
          features: [],
          limits: {},
          isActive: true,
          trialDays: 30,
          stripeProductId: null,
          stripePriceId: null,
        };

        mockPrisma.subscriptionPlan.create.mockResolvedValue({
          id: 'plan-123',
          ...planData,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const result = await billingManager.createSubscriptionPlan(planData);

        expect(mockPrisma.subscriptionPlan.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            name: planData.name,
            description: planData.description,
            type: planData.type,
            price: planData.price,
          }),
        });

        expect(result).toHaveProperty('id');
        expect(result.name).toBe(planData.name);
        expect(result.price).toBe(planData.price);
      });

      it('should handle database errors gracefully', async () => {
        const planData = {
          name: 'Test Plan',
          description: 'Test description',
          type: 'test',
          price: 0,
          currency: 'USD',
          billingInterval: 'monthly',
          features: [],
          limits: {},
          isActive: true,
          trialDays: 0,
          stripeProductId: null,
          stripePriceId: null,
        };

        mockPrisma.subscriptionPlan.create.mockRejectedValue(new Error('Database error'));

        await expect(billingManager.createSubscriptionPlan(planData)).rejects.toThrow(
          'Database error'
        );
      });
    });

    describe('getSubscriptionPlans', () => {
      it('should retrieve all active subscription plans', async () => {
        const mockPlans = [testPlan, { ...testPlan, id: 'plan-456', name: 'Basic' }];
        mockPrisma.subscriptionPlan.findMany.mockResolvedValue(mockPlans);

        const result = await billingManager.getSubscriptionPlans();

        expect(mockPrisma.subscriptionPlan.findMany).toHaveBeenCalledWith({
          where: {},
          orderBy: { createdAt: 'desc' },
        });

        expect(result).toHaveLength(2);
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('features');
        expect(result[0]).toHaveProperty('limits');
      });

      it('should filter plans by type when specified', async () => {
        const filters = { type: ['professional'], active: true, currency: 'USD' };
        mockPrisma.subscriptionPlan.findMany.mockResolvedValue([testPlan]);

        const result = await billingManager.getSubscriptionPlans(filters);

        expect(mockPrisma.subscriptionPlan.findMany).toHaveBeenCalledWith({
          where: {
            type: { in: ['professional'] },
            isActive: true,
            currency: 'USD',
          },
          orderBy: { createdAt: 'desc' },
        });

        expect(result).toHaveLength(1);
      });

      it('should return empty array when no plans found', async () => {
        mockPrisma.subscriptionPlan.findMany.mockResolvedValue([]);

        const result = await billingManager.getSubscriptionPlans();

        expect(result).toEqual([]);
      });
    });
  });

  // ============================================================================
  // ORGANIZATION SUBSCRIPTION TESTS
  // ============================================================================

  describe('Organization Subscription Management', () => {
    describe('createSubscription', () => {
      it('should create a subscription for an organization', async () => {
        mockPrisma.organization.findUnique.mockResolvedValue(testOrg);
        mockPrisma.subscriptionPlan.findUnique.mockResolvedValue(testPlan);
        mockPrisma.organizationSubscription.create.mockResolvedValue(testSubscription);

        const result = await billingManager.createSubscription(testOrg.id, testPlan.id, {
          trialDays: 14,
        });

        expect(mockPrisma.organization.findUnique).toHaveBeenCalledWith({
          where: { id: testOrg.id },
        });

        expect(mockPrisma.subscriptionPlan.findUnique).toHaveBeenCalledWith({
          where: { id: testPlan.id },
        });

        expect(mockPrisma.organizationSubscription.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            organizationId: testOrg.id,
            planId: testPlan.id,
            status: 'active',
            quantity: 1,
            unitPrice: testPlan.price,
          }),
        });

        expect(result).toHaveProperty('id');
        expect(result.organizationId).toBe(testOrg.id);
      });

      it('should throw error when organization not found', async () => {
        mockPrisma.organization.findUnique.mockResolvedValue(null);

        await expect(billingManager.createSubscription('invalid-org', 'plan-123')).rejects.toThrow(
          'Organization not found'
        );
      });

      it('should throw error when plan not found', async () => {
        mockPrisma.organization.findUnique.mockResolvedValue(testOrg);
        mockPrisma.subscriptionPlan.findUnique.mockResolvedValue(null);

        await expect(billingManager.createSubscription(testOrg.id, 'invalid-plan')).rejects.toThrow(
          'Subscription plan not found'
        );
      });
    });

    describe('getActiveSubscription', () => {
      it('should retrieve active subscription for organization', async () => {
        mockPrisma.organizationSubscription.findFirst.mockResolvedValue(testSubscription);

        const result = await billingManager.getActiveSubscription(testOrg.id);

        expect(mockPrisma.organizationSubscription.findFirst).toHaveBeenCalledWith({
          where: {
            organizationId: testOrg.id,
            status: 'active',
          },
          orderBy: { createdAt: 'desc' },
        });

        expect(result).not.toBeNull();
        expect(result?.organizationId).toBe(testOrg.id);
      });

      it('should return null when no active subscription found', async () => {
        mockPrisma.organizationSubscription.findFirst.mockResolvedValue(null);

        const result = await billingManager.getActiveSubscription(testOrg.id);

        expect(result).toBeNull();
      });
    });

    describe('changeSubscriptionPlan', () => {
      it('should update subscription plan successfully', async () => {
        const newPlan = { ...testPlan, id: 'new-plan-123', price: 149 };
        mockPrisma.organizationSubscription.findUnique.mockResolvedValue(testSubscription);
        mockPrisma.subscriptionPlan.findUnique.mockResolvedValue(newPlan);
        mockPrisma.organizationSubscription.update.mockResolvedValue({
          ...testSubscription,
          planId: newPlan.id,
          unitPrice: newPlan.price,
        });

        const result = await billingManager.changeSubscriptionPlan(testSubscription.id, newPlan.id);

        expect(mockPrisma.organizationSubscription.update).toHaveBeenCalledWith({
          where: { id: testSubscription.id },
          data: {
            planId: newPlan.id,
            unitPrice: newPlan.price,
            updatedAt: expect.any(Date),
          },
        });

        expect(result.planId).toBe(newPlan.id);
        expect(result.unitPrice).toBe(newPlan.price);
      });

      it('should throw error when subscription not found', async () => {
        mockPrisma.organizationSubscription.findUnique.mockResolvedValue(null);

        await expect(
          billingManager.changeSubscriptionPlan('invalid-sub', 'plan-123')
        ).rejects.toThrow('Subscription not found');
      });
    });

    describe('cancelSubscription', () => {
      it('should cancel subscription immediately when requested', async () => {
        mockPrisma.organizationSubscription.findUnique.mockResolvedValue(testSubscription);
        mockPrisma.organizationSubscription.update.mockResolvedValue({
          ...testSubscription,
          status: 'canceled',
          canceledAt: new Date(),
        });

        const result = await billingManager.cancelSubscription(testSubscription.id, true);

        expect(mockPrisma.organizationSubscription.update).toHaveBeenCalledWith({
          where: { id: testSubscription.id },
          data: {
            status: 'canceled',
            cancelAtPeriodEnd: false,
            canceledAt: expect.any(Date),
            updatedAt: expect.any(Date),
          },
        });

        expect(result.status).toBe('canceled');
      });

      it('should schedule cancellation at period end', async () => {
        mockPrisma.organizationSubscription.findUnique.mockResolvedValue(testSubscription);
        mockPrisma.organizationSubscription.update.mockResolvedValue({
          ...testSubscription,
          cancelAtPeriodEnd: true,
        });

        const result = await billingManager.cancelSubscription(testSubscription.id, false);

        expect(mockPrisma.organizationSubscription.update).toHaveBeenCalledWith({
          where: { id: testSubscription.id },
          data: {
            status: 'active',
            cancelAtPeriodEnd: true,
            canceledAt: undefined,
            updatedAt: expect.any(Date),
          },
        });

        expect(result.cancelAtPeriodEnd).toBe(true);
      });
    });
  });

  // ============================================================================
  // USAGE TRACKING TESTS
  // ============================================================================

  describe('Usage Tracking', () => {
    describe('trackUsage', () => {
      it('should track usage for active subscription', async () => {
        mockPrisma.organizationSubscription.findFirst.mockResolvedValue(testSubscription);
        mockPrisma.usageRecord.create.mockResolvedValue({
          id: 'usage-123',
          organizationId: testOrg.id,
          subscriptionId: testSubscription.id,
          metricType: 'aiQueries',
          quantity: 5,
          period: new Date(),
        });

        await billingManager.trackUsage(testOrg.id, 'aiQueries', 5, { feature: 'risk-analysis' });

        expect(mockPrisma.organizationSubscription.findFirst).toHaveBeenCalledWith({
          where: {
            organizationId: testOrg.id,
            status: 'active',
          },
          orderBy: { createdAt: 'desc' },
        });

        expect(mockPrisma.usageRecord.create).toHaveBeenCalledWith({
          data: {
            organizationId: testOrg.id,
            subscriptionId: testSubscription.id,
            metricType: 'aiQueries',
            quantity: 5,
            unitPrice: 0,
            total: 0,
            period: expect.any(Date),
            metadata: { feature: 'risk-analysis' },
          },
        });
      });

      it('should throw error when no active subscription found', async () => {
        mockPrisma.organizationSubscription.findFirst.mockResolvedValue(null);

        await expect(billingManager.trackUsage(testOrg.id, 'aiQueries', 1)).rejects.toThrow(
          'No active subscription found for organization'
        );
      });
    });
  });

  // ============================================================================
  // PAYMENT METHOD TESTS
  // ============================================================================

  describe('Payment Method Management', () => {
    describe('addPaymentMethod', () => {
      it('should add payment method successfully', async () => {
        const mockPaymentMethod = {
          id: 'pm_test123',
          type: 'card',
          card: {
            brand: 'visa',
            last4: '4242',
            exp_month: 12,
            exp_year: 2025,
            fingerprint: 'fingerprint123',
          },
        };

        mockPrisma.organization.findUnique.mockResolvedValue(testOrg);
        mockStripeService.getPaymentMethod.mockResolvedValue(mockPaymentMethod);
        mockPrisma.paymentMethod.updateMany.mockResolvedValue({ count: 0 });
        mockPrisma.paymentMethod.create.mockResolvedValue({
          id: 'payment-123',
          organizationId: testOrg.id,
          stripePaymentMethodId: 'pm_test123',
          type: 'card',
          isDefault: true,
          isActive: true,
        });

        const result = await billingManager.addPaymentMethod(testOrg.id, 'pm_test123', true);

        expect(mockStripeService.getPaymentMethod).toHaveBeenCalledWith('pm_test123');
        expect(mockPrisma.paymentMethod.updateMany).toHaveBeenCalledWith({
          where: {
            organizationId: testOrg.id,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });

        expect(result).toHaveProperty('id');
        expect(result.stripePaymentMethodId).toBe('pm_test123');
        expect(result.isDefault).toBe(true);
      });

      it('should throw error when organization not found', async () => {
        mockPrisma.organization.findUnique.mockResolvedValue(null);

        await expect(billingManager.addPaymentMethod('invalid-org', 'pm_test123')).rejects.toThrow(
          'Organization not found'
        );
      });
    });
  });

  // ============================================================================
  // ANALYTICS TESTS
  // ============================================================================

  describe('Billing Analytics', () => {
    describe('getBillingAnalytics', () => {
      it('should return comprehensive billing analytics', async () => {
        const mockSubscriptions = [testSubscription];
        const mockInvoices = [
          {
            id: 'inv-123',
            total: 99,
            type: 'subscription',
            createdAt: new Date(),
          },
        ];
        const mockPlans = [
          {
            ...testPlan,
            subscriptions: [testSubscription],
          },
        ];

        mockPrisma.organizationSubscription.findMany.mockResolvedValue(mockSubscriptions);
        mockPrisma.invoice.findMany.mockResolvedValue(mockInvoices);
        mockPrisma.subscriptionPlan.findMany.mockResolvedValue(mockPlans);

        const result = await billingManager.getBillingAnalytics(testOrg.id);

        expect(result).toHaveProperty('period');
        expect(result).toHaveProperty('revenue');
        expect(result).toHaveProperty('subscriptions');
        expect(result).toHaveProperty('customers');
        expect(result).toHaveProperty('metrics');
        expect(result).toHaveProperty('planDistribution');

        expect(result.revenue.total).toBe(99);
        expect(result.subscriptions.total).toBe(1);
        expect(result.subscriptions.active).toBe(1);
        expect(result.planDistribution).toHaveLength(1);
      });

      it('should handle empty data gracefully', async () => {
        mockPrisma.organizationSubscription.findMany.mockResolvedValue([]);
        mockPrisma.invoice.findMany.mockResolvedValue([]);
        mockPrisma.subscriptionPlan.findMany.mockResolvedValue([]);

        const result = await billingManager.getBillingAnalytics();

        expect(result.revenue.total).toBe(0);
        expect(result.subscriptions.total).toBe(0);
        expect(result.customers.total).toBe(0);
        expect(result.planDistribution).toHaveLength(0);
      });
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('Integration Tests', () => {
    it('should handle complete subscription lifecycle', async () => {
      // Setup
      mockPrisma.organization.findUnique.mockResolvedValue(testOrg);
      mockPrisma.subscriptionPlan.findUnique.mockResolvedValue(testPlan);
      mockPrisma.organizationSubscription.create.mockResolvedValue(testSubscription);
      mockPrisma.organizationSubscription.findFirst.mockResolvedValue(testSubscription);
      mockPrisma.organizationSubscription.findUnique.mockResolvedValue(testSubscription);

      // Create subscription
      const subscription = await billingManager.createSubscription(testOrg.id, testPlan.id);
      expect(subscription).toHaveProperty('id');

      // Get active subscription
      const activeSubscription = await billingManager.getActiveSubscription(testOrg.id);
      expect(activeSubscription).not.toBeNull();

      // Track usage
      await expect(billingManager.trackUsage(testOrg.id, 'aiQueries', 1)).resolves.not.toThrow();

      // Cancel subscription
      mockPrisma.organizationSubscription.update.mockResolvedValue({
        ...testSubscription,
        status: 'canceled',
      });

      const canceledSubscription = await billingManager.cancelSubscription(subscription.id, true);
      expect(canceledSubscription.status).toBe('canceled');
    });
  });
});
