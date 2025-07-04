/**
 * Comprehensive test suite for API middleware
 * Tests authentication, authorization, subscription enforcement, and feature gating
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import {
  withAPI,
  withSubscription,
  withFeatureGate,
  withUsageTracking,
  withPlanLimits,
  APIError,
  SubscriptionError,
  PlanLimitError,
} from '@/lib/api/middleware';
import {
  createMockRequest,
  createMockPrismaClient,
  createTestUser,
  createTestOrganization,
  createTestSubscriptionPlan,
  createTestSubscription,
  type MockPrismaClient
} from '../../utils/test-helpers';

// Mock the database
const mockPrisma = createMockPrismaClient();
jest.mock('@/lib/db', () => ({
  db: {
    client: mockPrisma
  }
}));

// Mock the billing manager
const mockBillingManager = {
  getActiveSubscription: jest.fn(),
  getSubscriptionPlans: jest.fn(),
  trackUsage: jest.fn(),
};

jest.mock('@/lib/billing/manager', () => ({
  billingManager: mockBillingManager
}));

import { TestUser, TestOrganization, createTestUser, createTestOrganization, createTestSubscriptionPlan, createTestSubscription } from '@/__tests__/utils/test-helpers';
import type { SubscriptionPlan, OrganizationSubscription } from '@/lib/billing/types';

describe('API Middleware', () => {
  let testUser: TestUser;
  let testOrg: TestOrganization;
  let testPlan: SubscriptionPlan;
  let testSubscription: OrganizationSubscription;
  let mockHandler: jest.Mock;

  beforeEach(() => {
    testUser = createTestUser();
    testOrg = createTestOrganization();
    testPlan = createTestSubscriptionPlan();
    testSubscription = createTestSubscription();
    mockHandler = jest.fn();

    // Setup default successful responses
    mockHandler.mockResolvedValue(
      NextResponse.json({ data: 'success' }, { status: 200 })
    );

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // ============================================================================
  // BASIC MIDDLEWARE TESTS
  // ============================================================================

  describe('withAPI Basic Functionality', () => {
    it('should execute handler successfully without options', async () => {
      const wrappedHandler = withAPI(mockHandler);
      const request = createMockRequest();

      const response = await wrappedHandler(request);

      expect(mockHandler).toHaveBeenCalledWith(request);
      expect(response.status).toBe(200);
    });

    it('should handle handler errors gracefully', async () => {
      const error = new Error('Handler error');
      mockHandler.mockRejectedValue(error);

      const wrappedHandler = withAPI(mockHandler);
      const request = createMockRequest();

      const response = await wrappedHandler(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INTERNAL_SERVER_ERROR');
    });

    it('should handle API errors correctly', async () => {
      const apiError = new APIError('Custom error', 400, 'CUSTOM_ERROR');
      mockHandler.mockRejectedValue(apiError);

      const wrappedHandler = withAPI(mockHandler);
      const request = createMockRequest();

      const response = await wrappedHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('CUSTOM_ERROR');
      expect(data.error.message).toBe('Custom error');
    });

    it('should add request ID to response headers', async () => {
      const wrappedHandler = withAPI(mockHandler);
      const request = createMockRequest();

      const response = await wrappedHandler(request);

      expect(response.headers.get('X-Request-ID')).toBeDefined();
      expect(response.headers.get('X-Request-ID')).toMatch(/^[0-9a-f-]{36}$/);
    });
  });

  // ============================================================================
  // AUTHENTICATION TESTS
  // ============================================================================

  describe('Authentication', () => {
    it('should require authentication when specified', async () => {
      const wrappedHandler = withAPI(mockHandler, { requireAuth: true });
      const request = createMockRequest();

      const response = await wrappedHandler(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('AUTHENTICATION_ERROR');
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should allow authenticated requests', async () => {
      const wrappedHandler = withAPI(mockHandler, { requireAuth: true });
      const request = createMockRequest('GET', 'http://localhost:3000/api/test', {
        user: testUser
      });

      const response = await wrappedHandler(request);

      expect(response.status).toBe(200);
      expect(mockHandler).toHaveBeenCalledWith(request);
    });

    it('should check permissions when specified', async () => {
      const wrappedHandler = withAPI(mockHandler, {
        requireAuth: true,
        requiredPermissions: ['admin:billing']
      });

      const userWithoutPermission = {
        ...testUser,
        permissions: ['read:risks']
      };

      const request = createMockRequest('GET', 'http://localhost:3000/api/test', {
        user: userWithoutPermission
      });

      const response = await wrappedHandler(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe('FORBIDDEN_ERROR');
    });

    it('should allow wildcard permissions', async () => {
      const wrappedHandler = withAPI(mockHandler, {
        requireAuth: true,
        requiredPermissions: ['admin:billing']
      });

      const adminUser = {
        ...testUser,
        permissions: ['*']
      };

      const request = createMockRequest('GET', 'http://localhost:3000/api/test', {
        user: adminUser
      });

      const response = await wrappedHandler(request);

      expect(response.status).toBe(200);
      expect(mockHandler).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // SUBSCRIPTION ENFORCEMENT TESTS
  // ============================================================================

  describe('Subscription Enforcement', () => {
    describe('Active Subscription Requirements', () => {
      it('should require active subscription when specified', async () => {
        mockBillingManager.getActiveSubscription.mockResolvedValue(null);

        const wrappedHandler = withAPI(mockHandler, {
          requireAuth: true,
          subscription: {
            requireActive: true
          }
        });

        const request = createMockRequest('GET', 'http://localhost:3000/api/test', {
          user: testUser
        });

        const response = await wrappedHandler(request);
        const data = await response.json();

        expect(response.status).toBe(402);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('SUBSCRIPTION_ERROR');
        expect(data.error.message).toBe('Active subscription required');
      });

      it('should allow request with active subscription', async () => {
        mockBillingManager.getActiveSubscription.mockResolvedValue(testSubscription);

        const wrappedHandler = withAPI(mockHandler, {
          requireAuth: true,
          subscription: {
            requireActive: true
          }
        });

        const request = createMockRequest('GET', 'http://localhost:3000/api/test', {
          user: testUser
        });

        const response = await wrappedHandler(request);

        expect(response.status).toBe(200);
        expect(mockHandler).toHaveBeenCalled();
      });

      it('should check trial expiration', async () => {
        const expiredTrialSubscription = {
          ...testSubscription,
          trialEnd: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
          status: 'trialing'
        };

        mockBillingManager.getActiveSubscription.mockResolvedValue(expiredTrialSubscription);

        const wrappedHandler = withAPI(mockHandler, {
          requireAuth: true,
          subscription: {
            requireActive: true
          }
        });

        const request = createMockRequest('GET', 'http://localhost:3000/api/test', {
          user: testUser
        });

        const response = await wrappedHandler(request);
        const data = await response.json();

        expect(response.status).toBe(402);
        expect(data.error.message).toContain('Trial period has ended');
      });

      it('should check subscription cancellation', async () => {
        const canceledSubscription = {
          ...testSubscription,
          cancelAtPeriodEnd: true,
          currentPeriodEnd: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
        };

        mockBillingManager.getActiveSubscription.mockResolvedValue(canceledSubscription);

        const wrappedHandler = withAPI(mockHandler, {
          requireAuth: true,
          subscription: {
            requireActive: true
          }
        });

        const request = createMockRequest('GET', 'http://localhost:3000/api/test', {
          user: testUser
        });

        const response = await wrappedHandler(request);
        const data = await response.json();

        expect(response.status).toBe(402);
        expect(data.error.message).toContain('Subscription has ended');
      });
    });

    describe('Feature Requirements', () => {
      it('should require specific features', async () => {
        const planWithoutFeature = {
          ...testPlan,
          features: [
            { id: 'basic_features', name: 'Basic', description: '', category: 'core', included: true }
          ]
        };

        mockBillingManager.getActiveSubscription.mockResolvedValue(testSubscription);
        mockBillingManager.getSubscriptionPlans.mockResolvedValue([planWithoutFeature]);

        const wrappedHandler = withAPI(mockHandler, {
          requireAuth: true,
          subscription: {
            requiredFeatures: ['advanced_analytics']
          }
        });

        const request = createMockRequest('GET', 'http://localhost:3000/api/test', {
          user: testUser
        });

        const response = await wrappedHandler(request);
        const data = await response.json();

        expect(response.status).toBe(402);
        expect(data.error.code).toBe('PLAN_LIMIT_ERROR');
        expect(data.error.message).toContain('Missing features: advanced_analytics');
      });

      it('should allow access with required features', async () => {
        const planWithFeature = {
          ...testPlan,
          features: [
            { id: 'advanced_analytics', name: 'Analytics', description: '', category: 'analytics', included: true }
          ]
        };

        mockBillingManager.getActiveSubscription.mockResolvedValue(testSubscription);
        mockBillingManager.getSubscriptionPlans.mockResolvedValue([planWithFeature]);

        const wrappedHandler = withAPI(mockHandler, {
          requireAuth: true,
          subscription: {
            requiredFeatures: ['advanced_analytics']
          }
        });

        const request = createMockRequest('GET', 'http://localhost:3000/api/test', {
          user: testUser
        });

        const response = await wrappedHandler(request);

        expect(response.status).toBe(200);
        expect(mockHandler).toHaveBeenCalled();
      });
    });

    describe('Usage Limits', () => {
      it('should enforce usage limits', async () => {
        const planWithLimits = {
          ...testPlan,
          limits: {
            users: 5,
            risks: 10,
            aiQueries: 100
          }
        };

        mockBillingManager.getActiveSubscription.mockResolvedValue(testSubscription);
        mockBillingManager.getSubscriptionPlans.mockResolvedValue([planWithLimits]);
        
        // Mock current usage at limit
        mockPrisma.risk.count.mockResolvedValue(10);

        const wrappedHandler = withAPI(mockHandler, {
          requireAuth: true,
          subscription: {
            requireActive: true,
            checkLimits: { risks: 1 } // Trying to add 1 more risk
          }
        });

        const request = createMockRequest('POST', 'http://localhost:3000/api/risks', {
          user: testUser,
          body: { title: 'New Risk' }
        });

        const response = await wrappedHandler(request);
        const data = await response.json();

        expect(response.status).toBe(402);
        expect(data.error.code).toBe('PLAN_LIMIT_ERROR');
        expect(data.error.message).toContain('risks limit exceeded');
      });

      it('should allow usage within limits', async () => {
        const planWithLimits = {
          ...testPlan,
          limits: {
            risks: 100
          }
        };

        mockBillingManager.getActiveSubscription.mockResolvedValue(testSubscription);
        mockBillingManager.getSubscriptionPlans.mockResolvedValue([planWithLimits]);
        
        // Mock current usage under limit
        mockPrisma.risk.count.mockResolvedValue(5);

        const wrappedHandler = withAPI(mockHandler, {
          requireAuth: true,
          subscription: {
            requireActive: true,
            checkLimits: { risks: 1 }
          }
        });

        const request = createMockRequest('POST', 'http://localhost:3000/api/risks', {
          user: testUser,
          body: { title: 'New Risk' }
        });

        const response = await wrappedHandler(request);

        expect(response.status).toBe(200);
        expect(mockHandler).toHaveBeenCalled();
      });

      it('should handle unlimited limits (-1)', async () => {
        const planWithUnlimited = {
          ...testPlan,
          limits: {
            risks: -1 // Unlimited
          }
        };

        mockBillingManager.getActiveSubscription.mockResolvedValue(testSubscription);
        mockBillingManager.getSubscriptionPlans.mockResolvedValue([planWithUnlimited]);

        const wrappedHandler = withAPI(mockHandler, {
          requireAuth: true,
          subscription: {
            requireActive: true,
            checkLimits: { risks: 1000 } // Large request
          }
        });

        const request = createMockRequest('POST', 'http://localhost:3000/api/risks', {
          user: testUser
        });

        const response = await wrappedHandler(request);

        expect(response.status).toBe(200);
        expect(mockHandler).toHaveBeenCalled();
      });
    });

    describe('Usage Tracking', () => {
      it('should track usage after successful request', async () => {
        mockBillingManager.trackUsage.mockResolvedValue(undefined);

        const wrappedHandler = withAPI(mockHandler, {
          requireAuth: true,
          subscription: {
            trackUsage: {
              type: 'aiQueries',
              quantity: 1,
              metadata: { feature: 'risk-analysis' }
            }
          }
        });

        const request = createMockRequest('POST', 'http://localhost:3000/api/ai/analyze', {
          user: testUser
        });

        const response = await wrappedHandler(request);

        expect(response.status).toBe(200);
        expect(mockBillingManager.trackUsage).toHaveBeenCalledWith(
          testUser.organizationId,
          'aiQueries',
          1,
          { feature: 'risk-analysis' }
        );
      });

      it('should not track usage on failed requests', async () => {
        mockHandler.mockResolvedValue(
          NextResponse.json({ error: 'Bad request' }, { status: 400 })
        );

        const wrappedHandler = withAPI(mockHandler, {
          requireAuth: true,
          subscription: {
            trackUsage: {
              type: 'aiQueries',
              quantity: 1
            }
          }
        });

        const request = createMockRequest('POST', 'http://localhost:3000/api/ai/analyze', {
          user: testUser
        });

        const response = await wrappedHandler(request);

        expect(response.status).toBe(400);
        expect(mockBillingManager.trackUsage).not.toHaveBeenCalled();
      });

      it('should not fail request if usage tracking fails', async () => {
        mockBillingManager.trackUsage.mockRejectedValue(new Error('Tracking failed'));

        const wrappedHandler = withAPI(mockHandler, {
          requireAuth: true,
          subscription: {
            trackUsage: {
              type: 'aiQueries',
              quantity: 1
            }
          }
        });

        const request = createMockRequest('POST', 'http://localhost:3000/api/ai/analyze', {
          user: testUser
        });

        const response = await wrappedHandler(request);

        expect(response.status).toBe(200);
        expect(mockHandler).toHaveBeenCalled();
      });
    });
  });

  // ============================================================================
  // HELPER MIDDLEWARE TESTS
  // ============================================================================

  describe('Helper Middleware Functions', () => {
    describe('withSubscription', () => {
      it('should create subscription-enforced handler', async () => {
        mockBillingManager.getActiveSubscription.mockResolvedValue(testSubscription);

        const wrappedHandler = withSubscription({
          requireActive: true,
          trackUsage: { type: 'apiCalls', quantity: 1 }
        })(mockHandler);

        const request = createMockRequest('GET', 'http://localhost:3000/api/test', {
          user: testUser
        });

        const response = await wrappedHandler(request);

        expect(response.status).toBe(200);
        expect(mockBillingManager.trackUsage).toHaveBeenCalledWith(
          testUser.organizationId,
          'apiCalls',
          1,
          undefined
        );
      });
    });

    describe('withFeatureGate', () => {
      it('should create feature-gated handler', async () => {
        const planWithFeature = {
          ...testPlan,
          features: [
            { id: 'advanced_analytics', name: 'Analytics', description: '', category: 'analytics', included: true }
          ]
        };

        mockBillingManager.getActiveSubscription.mockResolvedValue(testSubscription);
        mockBillingManager.getSubscriptionPlans.mockResolvedValue([planWithFeature]);

        const wrappedHandler = withFeatureGate(['advanced_analytics'])(mockHandler);

        const request = createMockRequest('GET', 'http://localhost:3000/api/analytics', {
          user: testUser
        });

        const response = await wrappedHandler(request);

        expect(response.status).toBe(200);
        expect(mockHandler).toHaveBeenCalled();
      });
    });

    describe('withUsageTracking', () => {
      it('should create usage-tracking handler', async () => {
        const wrappedHandler = withUsageTracking('apiCalls', 1, { endpoint: 'test' })(mockHandler);

        const request = createMockRequest('GET', 'http://localhost:3000/api/test', {
          user: testUser
        });

        const response = await wrappedHandler(request);

        expect(response.status).toBe(200);
        expect(mockBillingManager.trackUsage).toHaveBeenCalledWith(
          testUser.organizationId,
          'apiCalls',
          1,
          { endpoint: 'test' }
        );
      });
    });

    describe('withPlanLimits', () => {
      it('should create limit-enforced handler', async () => {
        const planWithLimits = {
          ...testPlan,
          limits: { risks: 100 }
        };

        mockBillingManager.getActiveSubscription.mockResolvedValue(testSubscription);
        mockBillingManager.getSubscriptionPlans.mockResolvedValue([planWithLimits]);
        mockPrisma.risk.count.mockResolvedValue(5);

        const wrappedHandler = withPlanLimits({ risks: 1 })(mockHandler);

        const request = createMockRequest('POST', 'http://localhost:3000/api/risks', {
          user: testUser
        });

        const response = await wrappedHandler(request);

        expect(response.status).toBe(200);
        expect(mockHandler).toHaveBeenCalled();
      });
    });
  });

  // ============================================================================
  // EDGE CASES AND ERROR HANDLING
  // ============================================================================

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing organization ID', async () => {
      const userWithoutOrg = { ...testUser, organizationId: undefined };

      const wrappedHandler = withAPI(mockHandler, {
        requireAuth: true,
        subscription: { requireActive: true }
      });

      const request = createMockRequest('GET', 'http://localhost:3000/api/test', {
        user: userWithoutOrg
      });

      const response = await wrappedHandler(request);
      const data = await response.json();

      expect(response.status).toBe(402);
      expect(data.error.message).toContain('Organization required');
    });

    it('should handle billing service errors gracefully', async () => {
      mockBillingManager.getActiveSubscription.mockRejectedValue(
        new Error('Database connection failed')
      );

      const wrappedHandler = withAPI(mockHandler, {
        requireAuth: true,
        subscription: { requireActive: true }
      });

      const request = createMockRequest('GET', 'http://localhost:3000/api/test', {
        user: testUser
      });

      const response = await wrappedHandler(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe('INTERNAL_SERVER_ERROR');
    });

    it('should handle invalid plan data', async () => {
      mockBillingManager.getActiveSubscription.mockResolvedValue(testSubscription);
      mockBillingManager.getSubscriptionPlans.mockResolvedValue([]);

      const wrappedHandler = withAPI(mockHandler, {
        requireAuth: true,
        subscription: { requiredFeatures: ['advanced_analytics'] }
      });

      const request = createMockRequest('GET', 'http://localhost:3000/api/test', {
        user: testUser
      });

      const response = await wrappedHandler(request);
      const data = await response.json();

      expect(response.status).toBe(402);
      expect(data.error.message).toContain('Invalid subscription plan');
    });
  });
});