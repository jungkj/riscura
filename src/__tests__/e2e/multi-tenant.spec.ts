import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

test.describe('Multi-Tenant Data Isolation', () => {
  const org1Data = {
    id: 'org-1',
    name: 'Organization One',
    domain: 'org1.com',
    users: [
      {
        id: 'user-1-org1',
        email: 'user1@org1.com',
        firstName: 'User',
        lastName: 'One',
        role: 'ADMIN',
      },
      {
        id: 'user-2-org1',
        email: 'user2@org1.com',
        firstName: 'User',
        lastName: 'Two',
        role: 'USER',
      },
    ],
    risks: [
      {
        id: 'risk-1-org1',
        title: 'Org 1 Security Risk',
        description: 'Security risk for organization 1',
        category: 'TECHNOLOGY',
        likelihood: 3,
        impact: 4,
      },
      {
        id: 'risk-2-org1',
        title: 'Org 1 Compliance Risk',
        description: 'Compliance risk for organization 1',
        category: 'COMPLIANCE',
        likelihood: 2,
        impact: 5,
      },
    ],
  }

  const org2Data = {
    id: 'org-2',
    name: 'Organization Two',
    domain: 'org2.com',
    users: [
      {
        id: 'user-1-org2',
        email: 'user1@org2.com',
        firstName: 'User',
        lastName: 'Alpha',
        role: 'ADMIN',
      },
    ],
    risks: [
      {
        id: 'risk-1-org2',
        title: 'Org 2 Operational Risk',
        description: 'Operational risk for organization 2',
        category: 'OPERATIONAL',
        likelihood: 4,
        impact: 3,
      },
    ],
  }

  test.beforeEach(async ({ page, request }) => {
    // Clear and seed test data for both organizations
    const apiUrl = process.env.API_URL || 'http://localhost:3000/api'

    // Clear database via API call
    await request.post(`${apiUrl}/test/clear-database`)

    // Seed multi-tenant data
    await request.post(`${apiUrl}/test/seed-multi-tenant`, {
      data: {
        organizations: [org1Data, org2Data],
      },
    })
  });

  test.describe('Data Isolation', () => {
    test('should only show risks from user organization', async ({ page }) => {
      // Setup API mocking
      await page.route('/api/auth/login', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: org1Data.users[0],
            token: 'org1-user-token',
          }),
        })
      });

      await page.route('/api/risks*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: org1Data.risks,
            pagination: {
              page: 1,
              limit: 10,
              total: org1Data.risks.length,
              totalPages: 1,
            },
          }),
        });
      });

      // Login as user from organization 1
      await page.goto('/auth/login')
      await page.locator('[data-testid="email-input"]').fill('user1@org1.com');
      await page.locator('[data-testid="password-input"]').fill('password123');
      await page.locator('[data-testid="login-button"]').click();

      // Navigate to risks page
      await page.goto('/dashboard/risks')

      // Verify only org1 risks are displayed
      const riskCards = page.locator('[data-testid="risk-card"]')
      await expect(riskCards).toHaveCount(2);

      await expect(riskCards.first()).toContainText('Org 1 Security Risk');
      await expect(riskCards.last()).toContainText('Org 1 Compliance Risk');

      // Verify org2 risks are not visible
      await expect(riskCards).not.toContainText('Org 2 Operational Risk')
    });

    test('should prevent cross-organization data access via API', async ({ request }) => {
      const apiUrl = process.env.API_URL || 'http://localhost:3000/api';

      // Login as org1 user to get token
      const loginResponse = await request.post(`${apiUrl}/auth/login`, {
        data: {
          email: 'user1@org1.com',
          password: 'password123',
        },
      })

      const loginData = await loginResponse.json();
      const _token = loginData.token;

      // Try to access org2 risk directly
      const riskResponse = await request.get(`${apiUrl}/risks/${org2Data.risks[0].id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Should return 404 (not found) due to organization isolation
      expect(riskResponse.status()).toBe(404)

      const responseData = await riskResponse.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Risk not found');
    });

    test('should isolate user lists by organization', async ({ page }) => {
      // Setup API mocking
      await page.route('/api/auth/login', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: { ...org1Data.users[0], role: 'ADMIN' },
            token: 'org1-admin-token',
          }),
        })
      });

      await page.route('/api/users*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: org1Data.users,
          }),
        });
      });

      // Login as org1 admin
      await page.goto('/auth/login')
      await page.locator('[data-testid="email-input"]').fill('user1@org1.com');
      await page.locator('[data-testid="password-input"]').fill('password123');
      await page.locator('[data-testid="login-button"]').click();

      // Navigate to users page
      await page.goto('/dashboard/admin/users')

      // Verify only org1 users are displayed
      const userRows = page.locator('[data-testid="user-row"]')
      await expect(userRows).toHaveCount(2);

      await expect(userRows).toContainText('user1@org1.com');
      await expect(userRows).toContainText('user2@org1.com');
      await expect(userRows).not.toContainText('user1@org2.com');
    });

    test('should prevent unauthorized organization switching', async ({ page, request }) => {
      const apiUrl = process.env.API_URL || 'http://localhost:3000/api';

      // Setup login mock
      await page.route('/api/auth/login', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: org1Data.users[0],
            token: 'org1-user-token',
          }),
        })
      });

      // Login as org1 user
      await page.goto('/auth/login')
      await page.locator('[data-testid="email-input"]').fill('user1@org1.com');
      await page.locator('[data-testid="password-input"]').fill('password123');
      await page.locator('[data-testid="login-button"]').click();

      // Try to manually access org2 data via URL manipulation
      await page.goto(`/dashboard/organizations/${org2Data.id}`)

      // Should be redirected or show access denied
      await expect(page.locator('[data-testid="access-denied"]')).toBeVisible()

      // Alternatively, check for redirect to proper organization
      expect(page.url()).not.toContain(org2Data.id)
    });

    test('should maintain session isolation between organizations', async ({ page }) => {
      // Setup mocks for org1
      await page.route('/api/auth/login', async (route) => {
        const request = route.request()
        const body = await request.postDataJSON();

        if (body.email === 'user1@org1.com') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              user: org1Data.users[0],
              token: 'org1-user-token',
            }),
          });
        } else if (body.email === 'user1@org2.com') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              user: org2Data.users[0],
              token: 'org2-user-token',
            }),
          });
        }
      });

      // Login as org1 user
      await page.goto('/auth/login')
      await page.locator('[data-testid="email-input"]').fill('user1@org1.com');
      await page.locator('[data-testid="password-input"]').fill('password123');
      await page.locator('[data-testid="login-button"]').click();

      // Verify org1 context
      await expect(page.locator('[data-testid="organization-name"]')).toContainText(org1Data.name)

      // Logout
      await page.locator('[data-testid="logout-button"]').click()

      // Login as org2 user
      await page.goto('/auth/login')
      await page.locator('[data-testid="email-input"]').fill('user1@org2.com');
      await page.locator('[data-testid="password-input"]').fill('password123');
      await page.locator('[data-testid="login-button"]').click();

      // Verify org2 context (should not show org1 data)
      await expect(page.locator('[data-testid="organization-name"]')).toContainText(org2Data.name)
      await expect(page.locator('[data-testid="organization-name"]')).not.toContainText(
        org1Data.name
      );
    });
  });

  test.describe('Database Level Isolation', () => {
    test('should enforce organization isolation in database queries', async ({ request }) => {
      const apiUrl = process.env.API_URL || 'http://localhost:3000/api';

      // Login as org1 user
      const loginResponse = await request.post(`${apiUrl}/auth/login`, {
        data: {
          email: 'user1@org1.com',
          password: 'password123',
        },
      })

      const loginData = await loginResponse.json();
      const _token = loginData.token;

      // Get all risks (should only return org1 risks)
      const risksResponse = await request.get(`${apiUrl}/risks`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const risksData = await risksResponse.json();
      expect(risksData.success).toBe(true);
      expect(risksData.data).toHaveLength(2);

      // Verify all returned risks belong to org1
      risksData.data.forEach((_risk: any) => {
        expect(risk.id).toContain('org1')
      });
    });

    test('should prevent SQL injection attempts for cross-organization access', async ({
      request,
    }) => {
      const apiUrl = process.env.API_URL || 'http://localhost:3000/api';

      // Login as org1 user
      const loginResponse = await request.post(`${apiUrl}/auth/login`, {
        data: {
          email: 'user1@org1.com',
          password: 'password123',
        },
      })

      const loginData = await loginResponse.json();
      const _token = loginData.token;

      // Attempt SQL injection to access org2 data
      const maliciousQuery = `' OR organizationId='${org2Data.id}' --`

      const response = await request.get(
        `${apiUrl}/risks?search=${encodeURIComponent(maliciousQuery)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      // Should still only return org1 data
      expect(data.success).toBe(true)
      data.data?.forEach((_risk: any) => {
        expect(risk.id).toContain('org1');
        expect(risk.id).not.toContain('org2');
      });
    });
  });

  test.describe('API Security', () => {
    test('should validate JWT tokens contain correct organization context', async ({ request }) => {
      const apiUrl = process.env.API_URL || 'http://localhost:3000/api';

      // Create a malicious token with org2 context
      const maliciousToken = 'Bearer fake-token-with-org2-context'

      const response = await request.get(`${apiUrl}/risks`, {
        headers: {
          Authorization: maliciousToken,
        },
      });

      // Should return 401 Unauthorized
      expect(response.status()).toBe(401)
    });

    test('should prevent token replay attacks across organizations', async ({ request }) => {
      const apiUrl = process.env.API_URL || 'http://localhost:3000/api';

      // Get valid org1 token
      const org1LoginResponse = await request.post(`${apiUrl}/auth/login`, {
        data: {
          email: 'user1@org1.com',
          password: 'password123',
        },
      })

      const org1Token = (await org1LoginResponse.json()).token;

      // Try to use org1 token to access org2 specific endpoint
      const response = await request.get(`${apiUrl}/organizations/${org2Data.id}/settings`, {
        headers: {
          Authorization: `Bearer ${org1Token}`,
        },
      })

      // Should return 403 Forbidden or 404 Not Found
      expect([403, 404]).toContain(response.status())
    });
  });

  test.describe('Frontend Route Protection', () => {
    test('should protect organization-specific routes', async ({ page }) => {
      // Setup auth mock
      await page.route('/api/auth/login', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: org1Data.users[0],
            token: 'org1-user-token',
          }),
        })
      });

      // Login as org1 user
      await page.goto('/auth/login')
      await page.locator('[data-testid="email-input"]').fill('user1@org1.com');
      await page.locator('[data-testid="password-input"]').fill('password123');
      await page.locator('[data-testid="login-button"]').click();

      // Try to access org2 specific route
      await page.goto(`/dashboard/organizations/${org2Data.id}/reports`)

      // Should be redirected or show error
      const currentUrl = page.url()
      expect(currentUrl).not.toContain(`/organizations/${org2Data.id}`);
    });

    test('should handle organization context in navigation', async ({ page }) => {
      // Setup auth and navigation mocks
      await page.route('/api/auth/login', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: org1Data.users[0],
            token: 'org1-user-token',
          }),
        })
      });

      await page.route('/api/organizations/current', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: org1Data,
          }),
        });
      });

      // Login and navigate
      await page.goto('/auth/login')
      await page.locator('[data-testid="email-input"]').fill('user1@org1.com');
      await page.locator('[data-testid="password-input"]').fill('password123');
      await page.locator('[data-testid="login-button"]').click();

      await page.goto('/dashboard');

      // Verify organization context is correct
      await expect(page.locator('[data-testid="organization-selector"]')).toContainText(
        org1Data.name
      )
      await expect(page.locator('[data-testid="organization-selector"]')).not.toContainText(
        org2Data.name
      );
    });
  });
});
