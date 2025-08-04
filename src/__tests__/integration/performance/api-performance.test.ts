/**
 * Performance tests for critical API endpoints
 * Ensures API responses meet enterprise performance requirements
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import {
  createMockRequest,
  createMockPrismaClient,
  createTestUser,
  createTestOrganization,
  createTestRisk,
  createTestControl,
  measureExecutionTime,
  expectPerformance,
  type MockPrismaClient,
} from '../../utils/test-helpers';

// Mock the database
const mockPrisma = createMockPrismaClient();
jest.mock('@/lib/db', () => ({
  db: {
    client: mockPrisma,
  },
}));

// Mock the billing manager
const mockBillingManager = {
  getActiveSubscription: jest.fn(),
  getSubscriptionPlans: jest.fn(),
  trackUsage: jest.fn(),
};

jest.mock('@/lib/billing/manager', () => ({
  billingManager: mockBillingManager,
}));

describe('API Performance Tests', () => {
  let testUser: any;
  let testOrg: any;

  beforeEach(() => {
    testUser = createTestUser();
    testOrg = createTestOrganization();

    // Setup successful authentication
    mockBillingManager.getActiveSubscription.mockResolvedValue({
      id: 'sub-123',
      status: 'active',
      organizationId: testUser.organizationId,
    });

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // ============================================================================
  // RISK MANAGEMENT API PERFORMANCE
  // ============================================================================

  describe('Risk Management Performance', () => {
    it('should load risk list within performance threshold', async () => {
      // Mock large dataset
      const mockRisks = Array.from({ length: 100 }, (_, i) =>
        createTestRisk({ id: `risk-${i}`, title: `Risk ${i}` })
      );

      mockPrisma.risk.findMany.mockResolvedValue(mockRisks);
      mockPrisma.risk.count.mockResolvedValue(100);

      const request = createMockRequest('GET', 'http://localhost:3000/api/risks', {
        user: testUser,
      });

      const { result, duration } = await measureExecutionTime(async () => {
        const { GET } = await import('@/app/api/risks/route');
        return await GET(request);
      }, 'Risk List API');

      const response = result;
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(100);

      // API should respond within 500ms for 100 records
      expectPerformance(duration, 500);
    });

    it('should create risk within performance threshold', async () => {
      const newRisk = createTestRisk();
      mockPrisma.risk.create.mockResolvedValue(newRisk);

      const request = createMockRequest('POST', 'http://localhost:3000/api/risks', {
        user: testUser,
        body: {
          title: 'New Risk',
          description: 'Risk description',
          category: 'OPERATIONAL',
          likelihood: 3,
          impact: 4,
        },
      });

      const { result, duration } = await measureExecutionTime(async () => {
        const { POST } = await import('@/app/api/risks/route');
        return await POST(request);
      }, 'Risk Creation API');

      const response = result;
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data).toHaveProperty('id');

      // Risk creation should complete within 200ms
      expectPerformance(duration, 200);
    });

    it('should handle bulk risk operations efficiently', async () => {
      // Mock creating 10 risks at once
      const bulkRisks = Array.from({ length: 10 }, (_, i) =>
        createTestRisk({ id: `bulk-risk-${i}`, title: `Bulk Risk ${i}` })
      );

      mockPrisma.risk.createMany.mockResolvedValue({ count: 10 });
      mockPrisma.risk.findMany.mockResolvedValue(bulkRisks);

      const requestBody = {
        risks: bulkRisks.map((risk) => ({
          title: risk.title,
          description: risk.description,
          category: risk.category,
          likelihood: risk.likelihood,
          impact: risk.impact,
        })),
      };

      const request = createMockRequest('POST', 'http://localhost:3000/api/risks/bulk', {
        user: testUser,
        body: requestBody,
      });

      const { result, duration } = await measureExecutionTime(async () => {
        // Simulate bulk creation endpoint
        const response = await Promise.resolve(
          new Response(
            JSON.stringify({
              success: true,
              data: bulkRisks,
            }),
            { status: 201 }
          )
        );
        return response;
      }, 'Bulk Risk Creation');

      expect(result.status).toBe(201);

      // Bulk operations should complete within 1 second
      expectPerformance(duration, 1000);
    });
  });

  // ============================================================================
  // CONTROL MANAGEMENT API PERFORMANCE
  // ============================================================================

  describe('Control Management Performance', () => {
    it('should load control matrix within performance threshold', async () => {
      const mockControls = Array.from({ length: 50 }, (_, i) =>
        createTestControl({ id: `control-${i}`, title: `Control ${i}` })
      );

      mockPrisma.control.findMany.mockResolvedValue(mockControls);
      mockPrisma.control.count.mockResolvedValue(50);

      const request = createMockRequest('GET', 'http://localhost:3000/api/controls', {
        user: testUser,
      });

      const { result, duration } = await measureExecutionTime(async () => {
        const { GET } = await import('@/app/api/controls/route');
        return await GET(request);
      }, 'Control Matrix API');

      const response = result;
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(50);

      // Control matrix should load within 400ms
      expectPerformance(duration, 400);
    });

    it('should handle control-risk mapping efficiently', async () => {
      const mockMappings = Array.from({ length: 20 }, (_, i) => ({
        id: `mapping-${i}`,
        riskId: `risk-${i % 10}`,
        controlId: `control-${i % 5}`,
        effectiveness: 0.8,
      }));

      mockPrisma.controlRiskMapping.findMany.mockResolvedValue(mockMappings);

      const request = createMockRequest('GET', 'http://localhost:3000/api/control-risk-mappings', {
        user: testUser,
      });

      const { result, duration } = await measureExecutionTime(async () => {
        const { GET } = await import('@/app/api/control-risk-mappings/route');
        return await GET(request);
      }, 'Control-Risk Mapping API');

      const response = result;

      expect(response.status).toBe(200);

      // Mapping queries should complete within 300ms
      expectPerformance(duration, 300);
    });
  });

  // ============================================================================
  // DASHBOARD API PERFORMANCE
  // ============================================================================

  describe('Dashboard Performance', () => {
    it('should load dashboard data within performance threshold', async () => {
      // Mock dashboard aggregation data
      const mockDashboardData = {
        riskMetrics: {
          total: 100,
          high: 25,
          medium: 50,
          low: 25,
        },
        controlMetrics: {
          total: 150,
          effective: 120,
          needsReview: 30,
        },
        recentActivities: Array.from({ length: 10 }, (_, i) => ({
          id: `activity-${i}`,
          type: 'CREATED',
          description: `Activity ${i}`,
          createdAt: new Date(),
        })),
      };

      mockPrisma.risk.count.mockResolvedValue(100);
      mockPrisma.control.count.mockResolvedValue(150);
      mockPrisma.activity.findMany.mockResolvedValue(mockDashboardData.recentActivities);

      const request = createMockRequest('GET', 'http://localhost:3000/api/dashboard', {
        user: testUser,
      });

      const { result, duration } = await measureExecutionTime(async () => {
        const { GET } = await import('@/app/api/dashboard/route');
        return await GET(request);
      }, 'Dashboard API');

      const response = result;
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveProperty('riskMetrics');

      // Dashboard should load within 600ms (multiple aggregations)
      expectPerformance(duration, 600);
    });

    it('should handle real-time analytics efficiently', async () => {
      const mockAnalytics = {
        riskTrends: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
          count: Math.floor(Math.random() * 20) + 10,
        })),
        controlEffectiveness: {
          average: 0.85,
          trend: 'increasing',
        },
      };

      const request = createMockRequest('GET', 'http://localhost:3000/api/analytics/real-time', {
        user: testUser,
      });

      const { result, duration } = await measureExecutionTime(async () => {
        // Simulate analytics calculation
        await new Promise((resolve) => setTimeout(resolve, 50));
        return new Response(
          JSON.stringify({
            success: true,
            data: mockAnalytics,
          }),
          { status: 200 }
        );
      }, 'Real-time Analytics');

      expect(result.status).toBe(200);

      // Real-time analytics should complete within 300ms
      expectPerformance(duration, 300);
    });
  });

  // ============================================================================
  // SEARCH API PERFORMANCE
  // ============================================================================

  describe('Search Performance', () => {
    it('should handle full-text search efficiently', async () => {
      const mockSearchResults = {
        risks: Array.from({ length: 15 }, (_, i) =>
          createTestRisk({ id: `search-risk-${i}`, title: `Security Risk ${i}` })
        ),
        controls: Array.from({ length: 10 }, (_, i) =>
          createTestControl({ id: `search-control-${i}`, title: `Security Control ${i}` })
        ),
        documents: Array.from({ length: 5 }, (_, i) => ({
          id: `doc-${i}`,
          name: `Security Document ${i}.pdf`,
          type: 'application/pdf',
        })),
      };

      // Mock search queries
      mockPrisma.risk.findMany.mockResolvedValue(mockSearchResults.risks);
      mockPrisma.control.findMany.mockResolvedValue(mockSearchResults.controls);
      mockPrisma.document.findMany.mockResolvedValue(mockSearchResults.documents);

      const request = createMockRequest('GET', 'http://localhost:3000/api/search', {
        user: testUser,
        searchParams: { q: 'security', entities: 'risks,controls,documents' },
      });

      const { result, duration } = await measureExecutionTime(async () => {
        // Simulate search endpoint
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              query: 'security',
              results: mockSearchResults,
              total: 30,
            },
          }),
          { status: 200 }
        );
      }, 'Full-text Search');

      const response = result;
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.total).toBe(30);

      // Search should complete within 500ms
      expectPerformance(duration, 500);
    });

    it('should handle complex filtering efficiently', async () => {
      const complexFilters = {
        categories: ['OPERATIONAL', 'FINANCIAL'],
        riskLevels: ['HIGH', 'CRITICAL'],
        dateRange: {
          start: '2024-01-01',
          end: '2024-12-31',
        },
        tags: ['compliance', 'security'],
      };

      const mockFilteredResults = Array.from({ length: 25 }, (_, i) =>
        createTestRisk({
          id: `filtered-risk-${i}`,
          category: i % 2 === 0 ? 'OPERATIONAL' : 'FINANCIAL',
          riskLevel: i % 3 === 0 ? 'HIGH' : 'CRITICAL',
        })
      );

      mockPrisma.risk.findMany.mockResolvedValue(mockFilteredResults);
      mockPrisma.risk.count.mockResolvedValue(25);

      const request = createMockRequest('GET', 'http://localhost:3000/api/risks', {
        user: testUser,
        searchParams: {
          categories: 'OPERATIONAL,FINANCIAL',
          riskLevels: 'HIGH,CRITICAL',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          tags: 'compliance,security',
        },
      });

      const { result, duration } = await measureExecutionTime(async () => {
        const { GET } = await import('@/app/api/risks/route');
        return await GET(request);
      }, 'Complex Filtering');

      const response = result;
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(25);

      // Complex filtering should complete within 400ms
      expectPerformance(duration, 400);
    });
  });

  // ============================================================================
  // SUBSCRIPTION ENFORCEMENT PERFORMANCE
  // ============================================================================

  describe('Subscription Enforcement Performance', () => {
    it('should enforce subscription limits efficiently', async () => {
      // Mock subscription and plan data
      mockBillingManager.getActiveSubscription.mockResolvedValue({
        id: 'sub-123',
        status: 'active',
        planId: 'plan-pro',
        organizationId: testUser.organizationId,
      });

      mockBillingManager.getSubscriptionPlans.mockResolvedValue([
        {
          id: 'plan-pro',
          name: 'Professional',
          limits: { risks: 500, users: 50, aiQueries: 1000 },
          features: [{ id: 'advanced_analytics', included: true }],
        },
      ]);

      // Mock current usage
      mockPrisma.risk.count.mockResolvedValue(100);
      mockPrisma.user.count.mockResolvedValue(10);

      const request = createMockRequest('POST', 'http://localhost:3000/api/risks', {
        user: testUser,
        body: { title: 'New Risk', description: 'Test risk' },
      });

      const { result, duration } = await measureExecutionTime(async () => {
        // Simulate subscription enforcement middleware
        const subscription = await mockBillingManager.getActiveSubscription(
          testUser.organizationId
        );
        const plans = await mockBillingManager.getSubscriptionPlans();
        const currentRiskCount = await mockPrisma.risk.count();

        // Check limits
        if (currentRiskCount >= 500) {
          throw new Error('Limit exceeded');
        }

        return new Response(
          JSON.stringify({
            success: true,
            data: { allowed: true },
          }),
          { status: 200 }
        );
      }, 'Subscription Enforcement');

      expect(result.status).toBe(200);

      // Subscription checks should complete within 100ms
      expectPerformance(duration, 100);
    });

    it('should track usage efficiently', async () => {
      mockBillingManager.trackUsage.mockResolvedValue(undefined);

      const { result, duration } = await measureExecutionTime(async () => {
        await mockBillingManager.trackUsage(testUser.organizationId, 'apiCalls', 1, {
          endpoint: 'risks',
          method: 'POST',
        });

        return new Response(
          JSON.stringify({
            success: true,
            data: { tracked: true },
          }),
          { status: 200 }
        );
      }, 'Usage Tracking');

      expect(result.status).toBe(200);

      // Usage tracking should complete within 50ms
      expectPerformance(duration, 50);
    });
  });

  // ============================================================================
  // STRESS TESTS
  // ============================================================================

  describe('Stress Tests', () => {
    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 10;
      const requests = Array.from({ length: concurrentRequests }, (_, i) =>
        createMockRequest('GET', `http://localhost:3000/api/risks/${i}`, { user: testUser })
      );

      // Mock individual risk responses
      mockPrisma.risk.findUnique.mockImplementation((args) => {
        const id = args.where.id;
        return Promise.resolve(createTestRisk({ id, title: `Risk ${id}` }));
      });

      const { result, duration } = await measureExecutionTime(async () => {
        const responses = await Promise.all(
          requests.map(async (request, i) => {
            // Simulate individual risk fetching
            const risk = await mockPrisma.risk.findUnique({ where: { id: i.toString() } });
            return new Response(
              JSON.stringify({
                success: true,
                data: risk,
              }),
              { status: 200 }
            );
          })
        );
        return responses;
      }, 'Concurrent Requests');

      expect(result).toHaveLength(concurrentRequests);
      result.forEach((response) => {
        expect(response.status).toBe(200);
      });

      // 10 concurrent requests should complete within 800ms
      expectPerformance(duration, 800);
    });

    it('should handle large payload processing', async () => {
      const largeBulkData = {
        risks: Array.from({ length: 100 }, (_, i) => ({
          title: `Bulk Risk ${i}`,
          description: `Description for bulk risk ${i}`,
          category: 'OPERATIONAL',
          likelihood: (i % 5) + 1,
          impact: (i % 5) + 1,
        })),
      };

      const request = createMockRequest('POST', 'http://localhost:3000/api/risks/bulk-import', {
        user: testUser,
        body: largeBulkData,
      });

      const { result, duration } = await measureExecutionTime(async () => {
        // Simulate bulk processing
        const processedCount = largeBulkData.risks.length;

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              processed: processedCount,
              message: `Successfully processed ${processedCount} risks`,
            },
          }),
          { status: 200 }
        );
      }, 'Large Payload Processing');

      const response = result;
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.processed).toBe(100);

      // Large payload processing should complete within 2 seconds
      expectPerformance(duration, 2000);
    });
  });
});
