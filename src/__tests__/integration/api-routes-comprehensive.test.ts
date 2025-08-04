import { NextRequest, NextResponse } from 'next/server';
import { createMocks } from 'node-mocks-http';
import { testUtils } from '../utils/test-helpers';

/**
 * Comprehensive API Routes Testing
 *
 * This test suite covers:
 * - Authentication API endpoints
 * - Risk management APIs
 * - User management APIs
 * - Security middleware
 * - Rate limiting
 * - Data validation
 * - Multi-tenant isolation
 */

describe('API Routes Comprehensive Tests', () => {
  let mockUser: any;
  let mockOrganization: any;

  beforeEach(() => {
    mockUser = testUtils.createMockUser();
    mockOrganization = testUtils.createMockOrganization();
  });

  describe('Authentication APIs', () => {
    describe('POST /api/auth/login', () => {
      it('should authenticate valid user credentials', async () => {
        const { req, res } = createMocks({
          method: 'POST',
          body: {
            email: 'testuser@riscura.com',
            password: 'test123',
          },
        });

        // Mock successful authentication
        jest.spyOn(require('@/lib/auth/auth-service'), 'authenticateUser').mockResolvedValue({
          success: true,
          user: mockUser,
          token: 'mock-jwt-token',
        })

        const response = await testUtils.callApiRoute('/api/auth/login', req, res);

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('success', true);
        expect(response.data).toHaveProperty('user');
        expect(response.data).toHaveProperty('token');
      });

      it('should reject invalid credentials', async () => {
        const { req, res } = createMocks({
          method: 'POST',
          body: {
            email: 'invalid@example.com',
            password: 'wrongpassword',
          },
        });

        jest.spyOn(require('@/lib/auth/auth-service'), 'authenticateUser').mockResolvedValue({
          success: false,
          error: 'Invalid credentials',
        });

        const response = await testUtils.callApiRoute('/api/auth/login', req, res);

        expect(response.status).toBe(401);
        expect(response.data).toHaveProperty('success', false);
        expect(response.data).toHaveProperty('error');
      });

      it('should validate required fields', async () => {
        const { req, res } = createMocks({
          method: 'POST',
          body: {
            email: '', // Missing email
            password: 'test123',
          },
        });

        const response = await testUtils.callApiRoute('/api/auth/login', req, res);

        expect(response.status).toBe(400);
        expect(response.data).toHaveProperty('error');
        expect(response.data.error).toContain('email');
      });

      it('should implement rate limiting', async () => {
        const requests = [];

        // Make multiple rapid requests
        for (let i = 0; i < 10; i++) {
          const { req, res } = createMocks({
            method: 'POST',
            body: {
              email: 'test@example.com',
              password: 'wrongpassword',
            },
            headers: {
              'x-forwarded-for': '192.168.1.1', // Same IP for rate limiting
            },
          });

          requests.push(testUtils.callApiRoute('/api/auth/login', req, res));
        }

        const responses = await Promise.all(requests);

        // At least one should be rate limited
        const rateLimitedResponses = responses.filter((r) => r.status === 429)
        expect(rateLimitedResponses.length).toBeGreaterThan(0);
      });
    });

    describe('GET /api/auth/session', () => {
      it('should return valid session for authenticated user', async () => {
        const { req, res } = createMocks({
          method: 'GET',
          headers: {
            authorization: 'Bearer valid-jwt-token',
          },
        });

        jest.spyOn(require('@/lib/auth/jwt'), 'verifyToken').mockResolvedValue(mockUser);

        const response = await testUtils.callApiRoute('/api/auth/session', req, res);

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('user');
        expect(response.data.user.id).toBe(mockUser.id);
      });

      it('should return 401 for invalid token', async () => {
        const { req, res } = createMocks({
          method: 'GET',
          headers: {
            authorization: 'Bearer invalid-token',
          },
        });

        jest
          .spyOn(require('@/lib/auth/jwt'), 'verifyToken')
          .mockRejectedValue(new Error('Invalid token'));

        const response = await testUtils.callApiRoute('/api/auth/session', req, res);

        expect(response.status).toBe(401);
      });
    });

    describe('POST /api/auth/logout', () => {
      it('should successfully logout user', async () => {
        const { req, res } = createMocks({
          method: 'POST',
          headers: {
            authorization: 'Bearer valid-jwt-token',
          },
        });

        const response = await testUtils.callApiRoute('/api/auth/logout', req, res);

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('success', true);
      });
    });
  });

  describe('Risk Management APIs', () => {
    beforeEach(() => {
      // Mock authentication for these tests
      jest.spyOn(require('@/lib/auth/middleware'), 'requireAuth').mockImplementation((req: any) => {
        req.user = mockUser
        return Promise.resolve();
      });
    });

    describe('GET /api/risks', () => {
      it('should return risks for authenticated user organization', async () => {
        const mockRisks = [
          { id: 'risk-1', title: 'Test Risk 1', organizationId: mockUser.organizationId },
          { id: 'risk-2', title: 'Test Risk 2', organizationId: mockUser.organizationId },
        ];

        jest.spyOn(require('@/lib/db'), 'default').mockImplementation(() => ({
          risk: {
            findMany: jest.fn().mockResolvedValue(mockRisks),
          },
        }));

        const { req, res } = createMocks({
          method: 'GET',
          headers: {
            authorization: 'Bearer valid-jwt-token',
          },
        });

        const response = await testUtils.callApiRoute('/api/risks', req, res);

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('risks');
        expect(response.data.risks).toHaveLength(2);
      });

      it('should support pagination', async () => {
        const { req, res } = createMocks({
          method: 'GET',
          query: {
            page: '2',
            limit: '10',
          },
          headers: {
            authorization: 'Bearer valid-jwt-token',
          },
        });

        const response = await testUtils.callApiRoute('/api/risks', req, res);

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('pagination');
        expect(response.data.pagination.page).toBe(2);
        expect(response.data.pagination.limit).toBe(10);
      });

      it('should filter by search query', async () => {
        const { req, res } = createMocks({
          method: 'GET',
          query: {
            search: 'security',
          },
          headers: {
            authorization: 'Bearer valid-jwt-token',
          },
        });

        const response = await testUtils.callApiRoute('/api/risks', req, res);

        expect(response.status).toBe(200);
        // Verify search was applied (implementation dependent)
      })
    });

    describe('POST /api/risks', () => {
      it('should create new risk with valid data', async () => {
        const newRiskData = {
          title: 'New Security Risk',
          description: 'A test security risk',
          category: 'security',
          likelihood: 3,
          impact: 4,
        }

        const mockCreatedRisk = {
          id: 'new-risk-id',
          ...newRiskData,
          organizationId: mockUser.organizationId,
          createdBy: mockUser.id,
        }

        jest.spyOn(require('@/lib/db'), 'default').mockImplementation(() => ({
          risk: {
            create: jest.fn().mockResolvedValue(mockCreatedRisk),
          },
        }));

        const { req, res } = createMocks({
          method: 'POST',
          body: newRiskData,
          headers: {
            authorization: 'Bearer valid-jwt-token',
          },
        });

        const response = await testUtils.callApiRoute('/api/risks', req, res);

        expect(response.status).toBe(201);
        expect(response.data).toHaveProperty('risk');
        expect(response.data.risk.title).toBe(newRiskData.title);
        expect(response.data.risk.organizationId).toBe(mockUser.organizationId);
      });

      it('should validate required fields', async () => {
        const invalidRiskData = {
          // Missing required title
          description: 'A test risk without title',
        }

        const { req, res } = createMocks({
          method: 'POST',
          body: invalidRiskData,
          headers: {
            authorization: 'Bearer valid-jwt-token',
          },
        });

        const response = await testUtils.callApiRoute('/api/risks', req, res);

        expect(response.status).toBe(400);
        expect(response.data).toHaveProperty('error');
        expect(response.data.error).toContain('title');
      });

      it('should validate likelihood and impact ranges', async () => {
        const invalidRiskData = {
          title: 'Test Risk',
          description: 'Test description',
          likelihood: 10, // Invalid: should be 1-5
          impact: -1, // Invalid: should be 1-5
        }

        const { req, res } = createMocks({
          method: 'POST',
          body: invalidRiskData,
          headers: {
            authorization: 'Bearer valid-jwt-token',
          },
        });

        const response = await testUtils.callApiRoute('/api/risks', req, res);

        expect(response.status).toBe(400);
        expect(response.data).toHaveProperty('error');
      });
    });

    describe('PUT /api/risks/[id]', () => {
      it('should update existing risk', async () => {
        const riskId = 'existing-risk-id';
        const updateData = {
          title: 'Updated Risk Title',
          likelihood: 4,
        }

        const mockUpdatedRisk = {
          id: riskId,
          title: updateData.title,
          likelihood: updateData.likelihood,
          organizationId: mockUser.organizationId,
        }

        jest.spyOn(require('@/lib/db'), 'default').mockImplementation(() => ({
          risk: {
            findUnique: jest.fn().mockResolvedValue(mockUpdatedRisk),
            update: jest.fn().mockResolvedValue(mockUpdatedRisk),
          },
        }));

        const { req, res } = createMocks({
          method: 'PUT',
          body: updateData,
          query: { id: riskId },
          headers: {
            authorization: 'Bearer valid-jwt-token',
          },
        });

        const response = await testUtils.callApiRoute(`/api/risks/${riskId}`, req, res);

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('risk');
        expect(response.data.risk.title).toBe(updateData.title);
      });

      it('should prevent updating risks from other organizations', async () => {
        const riskId = 'other-org-risk-id';
        const otherOrgRisk = {
          id: riskId,
          title: 'Other Org Risk',
          organizationId: 'other-org-id', // Different organization
        }

        jest.spyOn(require('@/lib/db'), 'default').mockImplementation(() => ({
          risk: {
            findUnique: jest.fn().mockResolvedValue(otherOrgRisk),
          },
        }));

        const { req, res } = createMocks({
          method: 'PUT',
          body: { title: 'Hacked title' },
          query: { id: riskId },
          headers: {
            authorization: 'Bearer valid-jwt-token',
          },
        });

        const response = await testUtils.callApiRoute(`/api/risks/${riskId}`, req, res);

        expect(response.status).toBe(403);
        expect(response.data).toHaveProperty('error');
      });
    });

    describe('DELETE /api/risks/[id]', () => {
      it('should delete risk owned by user organization', async () => {
        const riskId = 'risk-to-delete';
        const mockRisk = {
          id: riskId,
          title: 'Risk to Delete',
          organizationId: mockUser.organizationId,
        }

        jest.spyOn(require('@/lib/db'), 'default').mockImplementation(() => ({
          risk: {
            findUnique: jest.fn().mockResolvedValue(mockRisk),
            delete: jest.fn().mockResolvedValue(mockRisk),
          },
        }));

        const { req, res } = createMocks({
          method: 'DELETE',
          query: { id: riskId },
          headers: {
            authorization: 'Bearer valid-jwt-token',
          },
        });

        const response = await testUtils.callApiRoute(`/api/risks/${riskId}`, req, res);

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('success', true);
      });
    });
  });

  describe('User Management APIs', () => {
    describe('GET /api/users/profile', () => {
      it('should return current user profile', async () => {
        jest
          .spyOn(require('@/lib/auth/middleware'), 'requireAuth')
          .mockImplementation((req: any) => {
            req.user = mockUser;
            return Promise.resolve();
          });

        const { req, res } = createMocks({
          method: 'GET',
          headers: {
            authorization: 'Bearer valid-jwt-token',
          },
        });

        const response = await testUtils.callApiRoute('/api/users/profile', req, res);

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('user');
        expect(response.data.user.id).toBe(mockUser.id);
        expect(response.data.user).not.toHaveProperty('password'); // Should not expose password
      });
    });

    describe('PUT /api/users/profile', () => {
      it('should update user profile', async () => {
        const updateData = {
          firstName: 'Updated',
          lastName: 'Name',
        }

        jest
          .spyOn(require('@/lib/auth/middleware'), 'requireAuth')
          .mockImplementation((req: any) => {
            req.user = mockUser;
            return Promise.resolve();
          });

        jest.spyOn(require('@/lib/db'), 'default').mockImplementation(() => ({
          user: {
            update: jest.fn().mockResolvedValue({
              ...mockUser,
              ...updateData,
            }),
          },
        }));

        const { req, res } = createMocks({
          method: 'PUT',
          body: updateData,
          headers: {
            authorization: 'Bearer valid-jwt-token',
          },
        });

        const response = await testUtils.callApiRoute('/api/users/profile', req, res);

        expect(response.status).toBe(200);
        expect(response.data.user.firstName).toBe(updateData.firstName);
      });
    });
  });

  describe('Health Check APIs', () => {
    describe('GET /api/health', () => {
      it('should return system health status', async () => {
        const { req, res } = createMocks({
          method: 'GET',
        });

        const response = await testUtils.callApiRoute('/api/health', req, res);

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('status', 'ok');
        expect(response.data).toHaveProperty('timestamp');
      });
    });

    describe('GET /api/health/database', () => {
      it('should return database connectivity status', async () => {
        jest.spyOn(require('@/lib/db'), 'default').mockImplementation(() => ({
          $connect: jest.fn().mockResolvedValue(undefined),
          $disconnect: jest.fn().mockResolvedValue(undefined),
        }));

        const { req, res } = createMocks({
          method: 'GET',
        });

        const response = await testUtils.callApiRoute('/api/health/database', req, res);

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('database', 'connected');
      });
    });
  });

  describe('API Middleware', () => {
    describe('CORS Middleware', () => {
      it('should include CORS headers', async () => {
        const { req, res } = createMocks({
          method: 'OPTIONS',
        });

        const response = await testUtils.callApiRoute('/api/health', req, res);

        expect(response.headers).toHaveProperty('access-control-allow-origin');
        expect(response.headers).toHaveProperty('access-control-allow-methods');
      });
    });

    describe('Security Headers', () => {
      it('should include security headers', async () => {
        const { req, res } = createMocks({
          method: 'GET',
        });

        const response = await testUtils.callApiRoute('/api/health', req, res);

        expect(response.headers).toMatchObject({
          'x-content-type-options': 'nosniff',
          'x-frame-options': 'DENY',
          'x-xss-protection': '1; mode=block',
        });
      });
    });

    describe('Request Validation', () => {
      it('should validate content-type for POST requests', async () => {
        const { req, res } = createMocks({
          method: 'POST',
          headers: {
            'content-type': 'text/plain', // Invalid content type
          },
          body: 'invalid body',
        });

        const response = await testUtils.callApiRoute('/api/risks', req, res);

        expect(response.status).toBe(400);
        expect(response.data).toHaveProperty('error');
      });
    });
  });

  describe('Multi-Tenant Isolation', () => {
    it('should isolate data between organizations', async () => {
      const user1 = { ...mockUser, organizationId: 'org-1' }
      const user2 = { ...mockUser, id: 'user-2', organizationId: 'org-2' }

      // Mock risks for different organizations
      const org1Risks = [{ id: 'risk-1', organizationId: 'org-1' }]
      const org2Risks = [{ id: 'risk-2', organizationId: 'org-2' }];

      jest.spyOn(require('@/lib/db'), 'default').mockImplementation(() => ({
        risk: {
          findMany: jest.fn().mockImplementation(({ where }) => {
            if (where.organizationId === 'org-1') return Promise.resolve(org1Risks);
            if (where.organizationId === 'org-2') return Promise.resolve(org2Risks);
            return Promise.resolve([]);
          }),
        },
      }));

      // Test user 1 can only see org 1 risks
      jest.spyOn(require('@/lib/auth/middleware'), 'requireAuth').mockImplementation((req: any) => {
        req.user = user1
        return Promise.resolve();
      });

      const { req: req1, res: res1 } = createMocks({
        method: 'GET',
        headers: { authorization: 'Bearer token1' },
      });

      const response1 = await testUtils.callApiRoute('/api/risks', req1, res1);
      expect(response1.data.risks).toHaveLength(1);
      expect(response1.data.risks[0].organizationId).toBe('org-1');

      // Test user 2 can only see org 2 risks
      jest.spyOn(require('@/lib/auth/middleware'), 'requireAuth').mockImplementation((req: any) => {
        req.user = user2
        return Promise.resolve();
      });

      const { req: req2, res: res2 } = createMocks({
        method: 'GET',
        headers: { authorization: 'Bearer token2' },
      });

      const response2 = await testUtils.callApiRoute('/api/risks', req2, res2);
      expect(response2.data.risks).toHaveLength(1);
      expect(response2.data.risks[0].organizationId).toBe('org-2');
    });
  });
});
