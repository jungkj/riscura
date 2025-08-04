import { RCSAApiClient } from '@/lib/api/rcsa-client';
import { getSession } from 'next-auth/react';

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  getSession: jest.fn(),
}))

// Mock fetch globally
global.fetch = jest.fn()

describe('Authentication Integration Tests', () => {
  let apiClient: RCSAApiClient;
  let mockFetch: jest.MockedFunction<typeof fetch>;
  let mockGetSession: jest.MockedFunction<typeof getSession>;

  beforeEach(() => {
    apiClient = new RCSAApiClient();
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    mockGetSession = getSession as jest.MockedFunction<typeof getSession>;

    // Reset mocks
    mockFetch.mockReset()
    mockGetSession.mockReset();
  });

  describe('RCSAApiClient Authentication Headers', () => {
    it('should include authentication headers with valid session', async () => {
      // Mock session with organization
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@riscura.com',
          organizationId: 'org-456',
        } as any,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }
      mockGetSession.mockResolvedValue(mockSession);

      // Mock successful API response
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      } as Response)

      // Make API call
      await apiClient.getRisks()

      // Verify fetch was called with correct headers
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/risks',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'organization-id': 'org-456',
            'x-request-id': expect.stringMatching(/^req_\d+_[a-z0-9]+$/),
          }),
          credentials: 'include',
        })
      )
    });

    it('should handle session without organization gracefully', async () => {
      // Mock session without organization
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@riscura.com',
        } as any,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }
      mockGetSession.mockResolvedValue(mockSession);

      // Mock successful API response
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      } as Response)

      // Make API call
      await apiClient.getRisks()

      // Verify fetch was called without organization header
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/risks',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-request-id': expect.stringMatching(/^req_\d+_[a-z0-9]+$/),
          }),
          credentials: 'include',
        })
      )

      // Verify organization-id header is not present
      const callArgs = mockFetch.mock.calls[0]
      const headers = callArgs[1]?.headers as Record<string, string>;
      expect(headers['organization-id']).toBeUndefined();
    });

    it('should handle session fetch errors', async () => {
      // Mock session error
      mockGetSession.mockRejectedValue(new Error('Session fetch failed'))

      // Mock successful API response
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      } as Response)

      // Make API call
      await apiClient.getRisks()

      // Verify fetch was called with basic headers only
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/risks',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          credentials: 'include',
        })
      )
    });
  });

  describe('Authentication Error Handling', () => {
    it('should handle 401 Unauthorized responses', async () => {
      // Mock session
      mockGetSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@riscura.com' } as any,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })

      // Mock 401 response
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ message: 'Authentication required' }),
      } as Response)

      // Make API call and verify error handling
      const _result = await apiClient.getRisks()

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Authentication required');
    });

    it('should handle 403 Forbidden responses', async () => {
      // Mock session
      mockGetSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@riscura.com' } as any,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })

      // Mock 403 response
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: () => Promise.resolve({ message: 'Insufficient permissions' }),
      } as Response)

      // Make API call and verify error handling
      const _result = await apiClient.getRisks()

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Insufficient permissions');
    });

    it('should handle network errors', async () => {
      // Mock session
      mockGetSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@riscura.com' } as any,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })

      // Mock network error
      mockFetch.mockRejectedValue(new Error('Network error'))

      // Make API call and verify error handling
      const _result = await apiClient.getRisks()

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Network error');
    });
  });

  describe('Request Configuration', () => {
    it('should include credentials in all requests', async () => {
      // Mock session
      mockGetSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@riscura.com' } as any,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })

      // Mock successful API response
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: {} }),
      } as Response)

      // Test various API methods
      await apiClient.getRisk('risk-123')
      await apiClient.getControls();
      await apiClient.healthCheck();

      // Verify all calls include credentials
      mockFetch.mock.calls.forEach((call) => {
        expect(call[1]).toEqual(
          expect.objectContaining({
            credentials: 'include',
          })
        )
      });
    });

    it('should generate unique request IDs', async () => {
      // Mock session
      mockGetSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@riscura.com' } as any,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })

      // Mock successful API response
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      } as Response)

      // Make multiple API calls
      await apiClient.getRisks()
      await apiClient.getControls();

      // Extract request IDs from headers
      const requestIds = mockFetch.mock.calls.map((call) => {
        const headers = call[1]?.headers as Record<string, string>
        return headers['x-request-id'];
      });

      // Verify all request IDs are unique and properly formatted
      expect(requestIds).toHaveLength(2)
      expect(requestIds[0]).not.toBe(requestIds[1]);
      requestIds.forEach((id) => {
        expect(id).toMatch(/^req_\d+_[a-z0-9]+$/);
      });
    });
  });

  describe('CRUD Operations with Authentication', () => {
    beforeEach(() => {
      // Mock valid session for all CRUD tests
      mockGetSession.mockResolvedValue({
        user: {
          id: 'user-123',
          email: 'test@riscura.com',
          organizationId: 'org-456',
        } as any,
      })
    });

    it('should authenticate POST requests (create operations)', async () => {
      // Mock successful creation response
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: { id: 'risk-123', title: 'Test Risk' },
          }),
      } as Response)

      const riskData = {
        title: 'Test Risk',
        description: 'Test Description',
        category: 'OPERATIONAL' as any,
        likelihood: 3,
        impact: 4,
      }

      await apiClient.createRisk(riskData);

      // Verify POST request includes authentication
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/risks',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'organization-id': 'org-456',
            'x-request-id': expect.any(String),
          }),
          credentials: 'include',
          body: JSON.stringify(riskData),
        })
      )
    });

    it('should authenticate PATCH requests (update operations)', async () => {
      // Mock successful update response
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: { id: 'risk-123', title: 'Updated Risk' },
          }),
      } as Response)

      const updates = { title: 'Updated Risk' }
      await apiClient.updateRisk('risk-123', updates);

      // Verify PATCH request includes authentication
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/risks/risk-123',
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            'organization-id': 'org-456',
            'x-request-id': expect.any(String),
          }),
          credentials: 'include',
          body: JSON.stringify(updates),
        })
      )
    });

    it('should authenticate DELETE requests', async () => {
      // Mock successful deletion response
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response)

      await apiClient.deleteRisk('risk-123');

      // Verify DELETE request includes authentication
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/risks/risk-123',
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'organization-id': 'org-456',
            'x-request-id': expect.any(String),
          }),
          credentials: 'include',
        })
      )
    });
  });

  describe('Query Parameter Handling', () => {
    it('should properly handle query parameters with authentication', async () => {
      // Mock session
      mockGetSession.mockResolvedValue({
        user: {
          id: 'user-123',
          email: 'test@riscura.com',
          organizationId: 'org-456',
        } as any,
      })

      // Mock successful response
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      } as Response)

      // Make request with query parameters
      await apiClient.getRisks({
        page: 1,
        limit: 10,
        category: ['OPERATIONAL', 'FINANCIAL'] as any,
        status: 'IDENTIFIED' as any,
      })

      // Verify URL includes query parameters
      const expectedUrl =
        '/api/risks?page=1&limit=10&category=OPERATIONAL&category=FINANCIAL&status=IDENTIFIED'
      expect(mockFetch).toHaveBeenCalledWith(
        expectedUrl,
        expect.objectContaining({
          headers: expect.objectContaining({
            'organization-id': 'org-456',
          }),
          credentials: 'include',
        })
      );
    });
  });
});
