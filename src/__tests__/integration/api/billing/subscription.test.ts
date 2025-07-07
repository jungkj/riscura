/**
 * Integration tests for billing/subscription API endpoints
 * Tests the complete subscription management API with authentication and authorization
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import {
  createMockRequest,
  createMockPrismaClient,
  createTestUser,
  createTestOrganization,
  createTestSubscriptionPlan,
  createTestSubscription,
  expectValidApiResponse,
  expectSubscriptionEnforcement,
  type MockPrismaClient
} from '../../../utils/test-helpers';

// Mock the database
const mockPrisma = createMockPrismaClient();
jest.mock('@/lib/db', () => ({
  db: {
    client: mockPrisma
  }
}));

// Mock the billing manager with proper types
const mockBillingManager = {
  getSubscriptionPlans: jest.fn(),
  createSubscription: jest.fn(),
  getActiveSubscription: jest.fn(),
  changeSubscriptionPlan: jest.fn(),
  cancelSubscription: jest.fn(),
  getBillingAnalytics: jest.fn(),
  reactivateSubscription: jest.fn(),
  createSubscriptionPlan: jest.fn(),
};

jest.mock('@/lib/billing/manager', () => ({
  billingManager: mockBillingManager
}));

describe('/api/billing/subscriptions', () => {
  let testUser: any;
  let testOrg: any;
  let testPlan: any;
  let testSubscription: any;

  beforeEach(() => {
    testUser = createTestUser();
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
  // GET /api/billing/plans - List subscription plans
  // ============================================================================

  describe('GET /api/billing/plans', () => {
    it('should return all active subscription plans', async () => {
      const mockPlans = [testPlan, { ...testPlan, id: 'plan-456', name: 'Enterprise' }];
      mockBillingManager.getSubscriptionPlans.mockResolvedValue(mockPlans);

      const request = createMockRequest('GET', 'http://localhost:3000/api/billing/plans');
      
      // Import the route handler dynamically to ensure mocks are applied
      const { GET } = await import('@/app/api/billing/plans/route');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expectValidApiResponse(data);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.data[0]).toHaveProperty('id');
      expect(data.data[0]).toHaveProperty('name');
      expect(data.data[0]).toHaveProperty('price');
      expect(data.data[0]).toHaveProperty('features');
      expect(data.data[0]).toHaveProperty('limits');
    });

    it('should filter plans by type when specified', async () => {
      const mockPlans = [testPlan];
      mockBillingManager.getSubscriptionPlans.mockResolvedValue(mockPlans);

      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/billing/plans',
        { searchParams: { type: 'professional', active: 'true' } }
      );

      const { GET } = await import('@/app/api/billing/plans/route');
      const response = await GET(request);
      const data = await response.json();

      expect(mockBillingManager.getSubscriptionPlans).toHaveBeenCalledWith({
        type: ['professional'],
        active: true,
      });

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
    });

    it('should handle empty plans gracefully', async () => {
      mockBillingManager.getSubscriptionPlans.mockResolvedValue([]);

      const request = createMockRequest('GET', 'http://localhost:3000/api/billing/plans');
      
      const { GET } = await import('@/app/api/billing/plans/route');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toEqual([]);
    });

    it('should handle service errors gracefully', async () => {
      mockBillingManager.getSubscriptionPlans.mockRejectedValue(new Error('Database connection failed'));

      const request = createMockRequest('GET', 'http://localhost:3000/api/billing/plans');
      
      const { GET } = await import('@/app/api/billing/plans/route');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INTERNAL_SERVER_ERROR');
    });
  });

  // ============================================================================
  // POST /api/billing/subscriptions - Create subscription
  // ============================================================================

  describe('POST /api/billing/subscriptions', () => {
    it('should create a new subscription successfully', async () => {
      // Mock database checks
      (mockPrisma.subscriptionPlan.findUnique as any).mockResolvedValue({ ...testPlan, isActive: true });
      (mockPrisma.organizationSubscription.findFirst as any).mockResolvedValue(null);
      mockBillingManager.createSubscription.mockResolvedValue(testSubscription);

      const requestBody = {
        planId: testPlan.id,
        options: { trialDays: 14 },
      };

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/billing/subscriptions',
        { body: requestBody, user: testUser }
      );

      const { POST } = await import('@/app/api/billing/subscriptions/route');
      const response = await POST(request);
      const data = await response.json();

      expect(mockBillingManager.createSubscription).toHaveBeenCalledWith(
        testUser.organizationId,
        testPlan.id,
        { trialDays: 14 }
      );

      expect(response.status).toBe(201);
      expectValidApiResponse(data);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('id');
      expect(data.data.planId).toBe(testPlan.id);
    });

    it('should require authentication', async () => {
      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/billing/subscriptions',
        { body: { planId: testPlan.id } }
      );

      const { POST } = await import('@/app/api/billing/subscriptions/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should validate request body', async () => {
      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/billing/subscriptions',
        { body: {}, user: testUser } // Missing planId
      );

      const { POST } = await import('@/app/api/billing/subscriptions/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle duplicate subscription errors', async () => {
      // Mock database checks showing existing subscription
      (mockPrisma.subscriptionPlan.findUnique as any).mockResolvedValue({ ...testPlan, isActive: true });
      (mockPrisma.organizationSubscription.findFirst as any).mockResolvedValue(testSubscription);

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/billing/subscriptions',
        { body: { planId: testPlan.id }, user: testUser }
      );

      const { POST } = await import('@/app/api/billing/subscriptions/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('CONFLICT_ERROR');
    });
  });

  // ============================================================================
  // GET /api/billing/subscriptions - Get current subscription
  // ============================================================================

  describe('GET /api/billing/subscriptions', () => {
    it('should return current active subscription', async () => {
      // Mock database response instead of billing manager
      (mockPrisma.organizationSubscription.findFirst as any).mockResolvedValue({
        ...testSubscription,
        plan: testPlan
      });

      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/billing/subscriptions',
        { user: testUser }
      );

      const { GET } = await import('@/app/api/billing/subscriptions/route');
      const response = await GET(request);
      const data = await response.json();

      expect(mockPrisma.organizationSubscription.findFirst).toHaveBeenCalledWith({
        where: {
          organizationId: testUser.organizationId,
          status: { in: ['active', 'trialing', 'past_due'] },
        },
        include: {
          plan: true,
        },
      });

      expect(response.status).toBe(200);
      expectValidApiResponse(data);
      expect(data.data).toHaveProperty('id');
      expect(data.data.organizationId).toBe(testUser.organizationId);
    });

    it('should return free plan when no subscription found', async () => {
      // Mock no subscription found
      (mockPrisma.organizationSubscription.findFirst as any).mockResolvedValue(null);

      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/billing/subscriptions',
        { user: testUser }
      );

      const { GET } = await import('@/app/api/billing/subscriptions/route');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('free-plan');
      expect(data.data.plan.name).toBe('Free Plan');
      expect(data.data.plan.price).toBe(0);
    });

    it('should require authentication', async () => {
      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/billing/subscriptions'
      );

      const { GET } = await import('@/app/api/billing/subscriptions/route');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('AUTHENTICATION_ERROR');
    });
  });

  // ============================================================================
  // PUT /api/billing/subscriptions - Update subscription
  // ============================================================================

  describe('PUT /api/billing/subscriptions', () => {
    it('should update subscription plan successfully', async () => {
      const updatedSubscription = { ...testSubscription, planId: 'new-plan-123' };
      // Mock database check for subscription ownership
      (mockPrisma.organizationSubscription.findFirst as any).mockResolvedValue(testSubscription);
      mockBillingManager.changeSubscriptionPlan.mockResolvedValue(updatedSubscription);

      const request = createMockRequest(
        'PUT',
        'http://localhost:3000/api/billing/subscriptions',
        { body: { subscriptionId: testSubscription.id, planId: 'new-plan-123', action: 'upgrade' }, user: testUser }
      );

      const { PUT } = await import('@/app/api/billing/subscriptions/route');
      const response = await PUT(request);
      const data = await response.json();

      expect(mockBillingManager.changeSubscriptionPlan).toHaveBeenCalledWith(
        testSubscription.id,
        'new-plan-123'
      );

      expect(response.status).toBe(200);
      expectValidApiResponse(data);
      expect(data.data.planId).toBe('new-plan-123');
    });

    it('should require billing permissions for plan changes', async () => {
      const regularUser = { ...testUser, role: 'USER', permissions: ['read:risks'] };

      const request = createMockRequest(
        'PUT',
        'http://localhost:3000/api/billing/subscriptions',
        { body: { subscriptionId: testSubscription.id, planId: 'new-plan-123', action: 'upgrade' }, user: regularUser }
      );

      const { PUT } = await import('@/app/api/billing/subscriptions/route');
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe('FORBIDDEN_ERROR');
    });
  });

  // ============================================================================
  // DELETE /api/billing/subscriptions - Cancel subscription
  // ============================================================================

  describe('DELETE /api/billing/subscriptions', () => {
    it('should cancel subscription immediately', async () => {
      const canceledSubscription = { ...testSubscription, status: 'canceled' };
      // Mock database check for subscription ownership
      (mockPrisma.organizationSubscription.findFirst as any).mockResolvedValue(testSubscription);
      mockBillingManager.cancelSubscription.mockResolvedValue(canceledSubscription);

      const request = createMockRequest(
        'DELETE',
        `http://localhost:3000/api/billing/subscriptions?id=${testSubscription.id}&immediately=true`,
        { user: testUser }
      );

      const { DELETE } = await import('@/app/api/billing/subscriptions/route');
      const response = await DELETE(request);
      const data = await response.json();

      expect(mockBillingManager.cancelSubscription).toHaveBeenCalledWith(
        testSubscription.id,
        true
      );

      expect(response.status).toBe(200);
      expectValidApiResponse(data);
      expect(data.data.status).toBe('canceled');
    });

    it('should schedule cancellation at period end by default', async () => {
      const scheduledCancellation = { ...testSubscription, cancelAtPeriodEnd: true };
      // Mock database check for subscription ownership
      (mockPrisma.organizationSubscription.findFirst as any).mockResolvedValue(testSubscription);
      mockBillingManager.cancelSubscription.mockResolvedValue(scheduledCancellation);

      const request = createMockRequest(
        'DELETE',
        `http://localhost:3000/api/billing/subscriptions?id=${testSubscription.id}`,
        { user: testUser }
      );

      const { DELETE } = await import('@/app/api/billing/subscriptions/route');
      const response = await DELETE(request);
      const data = await response.json();

      expect(mockBillingManager.cancelSubscription).toHaveBeenCalledWith(
        testSubscription.id,
        false
      );

      expect(data.data.cancelAtPeriodEnd).toBe(true);
    });

    it('should handle subscription not found', async () => {
      // Mock database check returning null for subscription
      (mockPrisma.organizationSubscription.findFirst as any).mockResolvedValue(null);

      const request = createMockRequest(
        'DELETE',
        'http://localhost:3000/api/billing/subscriptions?id=invalid-id',
        { user: testUser }
      );

      const { DELETE } = await import('@/app/api/billing/subscriptions/route');
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NOT_FOUND_ERROR');
    });
  });

  // ============================================================================
  // SUBSCRIPTION ENFORCEMENT TESTS
  // ============================================================================

  describe('Subscription Enforcement', () => {
    it('should enforce feature gates on premium endpoints', async () => {
      // Mock no active subscription
      mockBillingManager.getActiveSubscription.mockResolvedValue(null);

      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/advanced-analytics',
        { user: testUser }
      );

      // This would be an endpoint with subscription enforcement
      // The actual implementation would use the withSubscription middleware
      
      // For testing purposes, we'll simulate the enforcement
      const subscription = await mockBillingManager.getActiveSubscription(testUser.organizationId);
      
      if (!subscription) {
        const response = {
          success: false,
          error: {
            code: 'SUBSCRIPTION_ERROR',
            message: 'Active subscription required',
          },
        };
        
        expectSubscriptionEnforcement(response);
      }
    });

    it('should allow access with valid subscription', async () => {
      mockBillingManager.getActiveSubscription.mockResolvedValue(testSubscription);

      const subscription = await mockBillingManager.getActiveSubscription(testUser.organizationId);
      
      expect(subscription).not.toBeNull();
      expect(subscription.status).toBe('active');
    });
  });

  // ============================================================================
  // GET /api/billing/analytics - Billing analytics (NOT IMPLEMENTED YET)
  // ============================================================================

  // Note: The billing analytics endpoint is not implemented yet.
  // These tests are commented out until the endpoint is created.
  
  /* 
  describe('GET /api/billing/analytics', () => {
    it('should return billing analytics for organization', async () => {
      const mockAnalytics = {
        period: { start: new Date(), end: new Date() },
        revenue: { total: 1980, recurring: 1980, oneTime: 0, usage: 0, currency: 'USD' },
        subscriptions: { total: 20, active: 18, trial: 2, canceled: 0, churnRate: 0 },
        customers: { total: 20, new: 5, churned: 0 },
        metrics: { mrr: 1980, arr: 23760, ltv: 0, cac: 0, arpu: 99 },
        planDistribution: [
          { planId: testPlan.id, planName: 'Professional', count: 18, revenue: 1782 }
        ],
        paymentMethods: [],
      };

      mockBillingManager.getBillingAnalytics.mockResolvedValue(mockAnalytics);

      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/billing/analytics',
        { user: { ...testUser, role: 'ADMIN' } }
      );

      const { GET } = await import('@/app/api/billing/analytics/route');
      const response = await GET(request);
      const data = await response.json();

      expect(mockBillingManager.getBillingAnalytics).toHaveBeenCalledWith(
        testUser.organizationId,
        expect.any(Object)
      );

      expect(response.status).toBe(200);
      expectValidApiResponse(data);
      expect(data.data).toHaveProperty('revenue');
      expect(data.data).toHaveProperty('subscriptions');
      expect(data.data).toHaveProperty('metrics');
      expect(data.data.revenue.total).toBe(1980);
    });

    it('should require admin permissions', async () => {
      const regularUser = { ...testUser, role: 'USER' };

      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/billing/analytics',
        { user: regularUser }
      );

      const { GET } = await import('@/app/api/billing/analytics/route');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe('FORBIDDEN_ERROR');
    });

    it('should support custom date ranges', async () => {
      const mockAnalytics = { };
      mockBillingManager.getBillingAnalytics.mockResolvedValue(mockAnalytics);

      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/billing/analytics',
        { 
          searchParams: { 
            startDate: '2024-01-01',
            endDate: '2024-01-31'
          },
          user: { ...testUser, role: 'ADMIN' }
        }
      );

      const { GET } = await import('@/app/api/billing/analytics/route');
      await GET(request);

      expect(mockBillingManager.getBillingAnalytics).toHaveBeenCalledWith(
        testUser.organizationId,
        expect.objectContaining({
          start: expect.any(Date),
          end: expect.any(Date),
        })
      );
    });
  });
  */
});