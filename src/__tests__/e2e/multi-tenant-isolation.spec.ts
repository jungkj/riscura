/**
 * Multi-Tenant Security and Data Isolation Tests
 * Validates data isolation between organizations and cross-tenant security
 */

import { test, expect, Page, Browser, BrowserContext } from '@playwright/test';
import { faker } from '@faker-js/faker';

// Multi-tenant test data factory
const createTenantData = (tenantName: string) => ({
  organization: {
    name: `${tenantName} ${faker.company.name()}`,
    domain: `${tenantName.toLowerCase()}.test.com`,
    industry: 'financial-services',
    size: 'medium',
  },
  admin: {
    email: `admin@${tenantName.toLowerCase()}.test.com`,
    password: 'AdminPassword123!',
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    role: 'admin',
  },
  user: {
    email: `user@${tenantName.toLowerCase()}.test.com`,
    password: 'UserPassword123!',
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    role: 'risk_manager',
  },
  sensitiveData: {
    riskTitle: `${tenantName} Confidential Risk - ${faker.lorem.words(3)}`,
    documentTitle: `${tenantName} Sensitive Document`,
    controlName: `${tenantName} Internal Control`,
    reportName: `${tenantName} Executive Report`,
  },
});

// Multi-tenant app wrapper
class MultiTenantRiscuraApp {
  constructor(
    public page: Page,
    public tenantId: string
  ) {}

  async setupTenant(tenantData: any) {
    // Register organization admin
    await this.page.goto('/auth/register');

    await this.page.fill('[data-testid="email-input"]', tenantData.admin.email);
    await this.page.fill('[data-testid="password-input"]', tenantData.admin.password);
    await this.page.fill('[data-testid="confirm-password-input"]', tenantData.admin.password);
    await this.page.fill('[data-testid="first-name-input"]', tenantData.admin.firstName);
    await this.page.fill('[data-testid="last-name-input"]', tenantData.admin.lastName);
    await this.page.fill('[data-testid="company-input"]', tenantData.organization.name);

    await this.page.click('[data-testid="register-button"]');

    // Complete organization setup
    await this.page.fill('[data-testid="organization-domain"]', tenantData.organization.domain);
    await this.page.selectOption(
      '[data-testid="industry-select"]',
      tenantData.organization.industry
    );
    await this.page.selectOption('[data-testid="size-select"]', tenantData.organization.size);

    await this.page.click('[data-testid="complete-setup-button"]');

    // Get organization ID for tenant validation
    const orgId = await this.page.locator('[data-testid="organization-id"]').textContent();
    if (!orgId) {
      throw new Error('Organization ID not found');
    }
    return orgId;
  }

  async loginAsAdmin(tenantData: any) {
    await this.page.goto('/auth/login');
    await this.page.fill('[data-testid="email-input"]', tenantData.admin.email);
    await this.page.fill('[data-testid="password-input"]', tenantData.admin.password);
    await this.page.click('[data-testid="login-button"]');

    await expect(this.page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
  }

  async loginAsUser(tenantData: any) {
    await this.page.goto('/auth/login');
    await this.page.fill('[data-testid="email-input"]', tenantData.user.email);
    await this.page.fill('[data-testid="password-input"]', tenantData.user.password);
    await this.page.click('[data-testid="login-button"]');

    await expect(this.page.locator('[data-testid="user-dashboard"]')).toBeVisible();
  }

  async createUser(userData: any) {
    await this.page.click('[data-testid="users-menu"]');
    await this.page.click('[data-testid="add-user-button"]');

    await this.page.fill('[data-testid="user-email"]', userData.email);
    await this.page.fill('[data-testid="user-first-name"]', userData.firstName);
    await this.page.fill('[data-testid="user-last-name"]', userData.lastName);
    await this.page.selectOption('[data-testid="user-role"]', userData.role);

    await this.page.click('[data-testid="create-user-button"]');

    await expect(this.page.locator('[data-testid="user-created"]')).toBeVisible();
  }

  async createSensitiveRisk(riskData: any) {
    await this.page.click('[data-testid="risks-menu"]');
    await this.page.click('[data-testid="add-risk-button"]');

    await this.page.fill('[data-testid="risk-title"]', riskData.title);
    await this.page.fill(
      '[data-testid="risk-description"]',
      'CONFIDENTIAL: This contains sensitive tenant data'
    );
    await this.page.selectOption('[data-testid="risk-category"]', 'operational');
    await this.page.selectOption('[data-testid="risk-classification"]', 'confidential');

    await this.page.click('[data-testid="save-risk-button"]');

    const riskId = await this.page.locator('[data-testid="risk-id"]').textContent();
    if (!riskId) {
      throw new Error('Risk ID not found');
    }
    return riskId;
  }

  async uploadSensitiveDocument(docData: any) {
    await this.page.click('[data-testid="documents-menu"]');
    await this.page.click('[data-testid="upload-document-button"]');

    // Upload a test document
    const testFile = 'test-sensitive-document.pdf';
    await this.page.setInputFiles('[data-testid="file-input"]', testFile);

    await this.page.fill('[data-testid="document-title"]', docData.title);
    await this.page.selectOption('[data-testid="document-classification"]', 'confidential');
    await this.page.check('[data-testid="restricted-access"]');

    await this.page.click('[data-testid="upload-submit-button"]');

    const docId = await this.page.locator('[data-testid="document-id"]').textContent();
    if (!docId) {
      throw new Error('Document ID not found');
    }
    return docId;
  }

  async attemptCrossTenantAccess(resourceType: string, resourceId: string) {
    // Try to access another tenant's resources directly via URL manipulation
    const urls = {
      risk: `/dashboard/risks/${resourceId}`,
      document: `/dashboard/documents/${resourceId}`,
      control: `/dashboard/controls/${resourceId}`,
      report: `/dashboard/reports/${resourceId}`,
    };

    const targetUrl = urls[resourceType as keyof typeof urls];
    if (!targetUrl) throw new Error(`Unknown resource type: ${resourceType}`);

    await this.page.goto(targetUrl);

    // Should see access denied or not found, never the actual resource
    const hasAccessDenied = await this.page.locator('[data-testid="access-denied"]').isVisible();
    const hasNotFound = await this.page.locator('[data-testid="not-found"]').isVisible();
    const hasUnauthorized = await this.page.locator('[data-testid="unauthorized"]').isVisible();

    return hasAccessDenied || hasNotFound || hasUnauthorized;
  }

  async searchForCrossTenantData(searchTerm: string) {
    await this.page.fill('[data-testid="global-search"]', searchTerm);
    await this.page.click('[data-testid="search-button"]');

    // Wait for search results
    await this.page.waitForSelector('[data-testid="search-results"]');

    const results = await this.page.locator('[data-testid="search-result-item"]').count();
    const resultTexts = await this.page
      .locator('[data-testid="search-result-item"]')
      .allTextContents();

    return { count: results, texts: resultTexts };
  }

  async verifyTenantIsolationInDatabase() {
    // This would be implemented as an API call to verify database-level isolation
    const response = await this.page.request.get('/api/admin/tenant-isolation-check');
    const data = await response.json();

    return data.isolated === true && data.crossTenantAccess === false;
  }
}

test.describe('Multi-Tenant Security and Data Isolation', () => {
  let browser: Browser;
  let tenantAContext: BrowserContext;
  let tenantBContext: BrowserContext;
  let tenantAApp: MultiTenantRiscuraApp;
  let tenantBApp: MultiTenantRiscuraApp;
  let tenantAData: ReturnType<typeof createTenantData>;
  let tenantBData: ReturnType<typeof createTenantData>;

  test.beforeAll(async ({ browser: testBrowser }) => {
    browser = testBrowser;

    // Create separate browser contexts for each tenant
    tenantAContext = await browser.newContext();
    tenantBContext = await browser.newContext();

    const tenantAPage = await tenantAContext.newPage();
    const tenantBPage = await tenantBContext.newPage();

    tenantAApp = new MultiTenantRiscuraApp(tenantAPage, 'tenant-a');
    tenantBApp = new MultiTenantRiscuraApp(tenantBPage, 'tenant-b');

    tenantAData = createTenantData('TenantA');
    tenantBData = createTenantData('TenantB');
  });

  test.afterAll(async () => {
    await tenantAContext.close();
    await tenantBContext.close();
  });

  test('Complete tenant setup and isolation validation', async () => {
    test.setTimeout(180000); // 3 minutes for full setup

    // Step 1: Set up both tenants
    await test.step('Setup Tenant A', async () => {
      const orgIdA = await tenantAApp.setupTenant(tenantAData);
      expect(orgIdA).toBeTruthy();
    });

    await test.step('Setup Tenant B', async () => {
      const orgIdB = await tenantBApp.setupTenant(tenantBData);
      expect(orgIdB).toBeTruthy();
    });

    // Step 2: Create users in each tenant
    await test.step('Create users in both tenants', async () => {
      await tenantAApp.loginAsAdmin(tenantAData);
      await tenantAApp.createUser(tenantAData.user);

      await tenantBApp.loginAsAdmin(tenantBData);
      await tenantBApp.createUser(tenantBData.user);
    });

    // Step 3: Create sensitive data in each tenant
    let tenantARiskId: string;
    let tenantBRiskId: string;
    let tenantADocId: string;
    let tenantBDocId: string;

    await test.step('Create sensitive data in Tenant A', async () => {
      tenantARiskId = await tenantAApp.createSensitiveRisk({
        title: tenantAData.sensitiveData.riskTitle,
      });
      tenantADocId = await tenantAApp.uploadSensitiveDocument({
        title: tenantAData.sensitiveData.documentTitle,
      });
    });

    await test.step('Create sensitive data in Tenant B', async () => {
      tenantBRiskId = await tenantBApp.createSensitiveRisk({
        title: tenantBData.sensitiveData.riskTitle,
      });
      tenantBDocId = await tenantBApp.uploadSensitiveDocument({
        title: tenantBData.sensitiveData.documentTitle,
      });
    });

    // Step 4: Test cross-tenant access attempts (should all fail)
    await test.step('Verify Tenant A cannot access Tenant B data', async () => {
      const riskAccessDenied = await tenantAApp.attemptCrossTenantAccess('risk', tenantBRiskId);
      const docAccessDenied = await tenantAApp.attemptCrossTenantAccess('document', tenantBDocId);

      expect(riskAccessDenied).toBe(true);
      expect(docAccessDenied).toBe(true);
    });

    await test.step('Verify Tenant B cannot access Tenant A data', async () => {
      const riskAccessDenied = await tenantBApp.attemptCrossTenantAccess('risk', tenantARiskId);
      const docAccessDenied = await tenantBApp.attemptCrossTenantAccess('document', tenantADocId);

      expect(riskAccessDenied).toBe(true);
      expect(docAccessDenied).toBe(true);
    });

    // Step 5: Test search isolation
    await test.step('Verify search does not return cross-tenant results', async () => {
      await tenantAApp.loginAsUser(tenantAData);
      const searchResults = await tenantAApp.searchForCrossTenantData(
        tenantBData.sensitiveData.riskTitle
      );

      expect(searchResults.count).toBe(0);
      expect(searchResults.texts.join(' ')).not.toContain(tenantBData.sensitiveData.riskTitle);
    });

    // Step 6: Database-level isolation verification
    await test.step('Verify database-level tenant isolation', async () => {
      const isolationValid = await tenantAApp.verifyTenantIsolationInDatabase();
      expect(isolationValid).toBe(true);
    });
  });

  test('User permission boundaries within tenant', async () => {
    // Test role-based access control within a single tenant
    await tenantAApp.loginAsUser(tenantAData);

    // User should not be able to access admin functions
    await tenantAApp.page.goto('/dashboard/admin/users');
    const hasAdminAccess = await tenantAApp.page.locator('[data-testid="admin-panel"]').isVisible();
    expect(hasAdminAccess).toBe(false);

    // User should not be able to delete organization data
    const canDeleteOrg = await tenantAApp.page
      .locator('[data-testid="delete-organization"]')
      .isVisible();
    expect(canDeleteOrg).toBe(false);
  });

  test('Session isolation between tenants', async () => {
    // Login to both tenants simultaneously
    await tenantAApp.loginAsAdmin(tenantAData);
    await tenantBApp.loginAsAdmin(tenantBData);

    // Verify each session only sees their own data
    const tenantAOrgName = await tenantAApp.page
      .locator('[data-testid="organization-name"]')
      .textContent();
    const tenantBOrgName = await tenantBApp.page
      .locator('[data-testid="organization-name"]')
      .textContent();

    expect(tenantAOrgName).toBe(tenantAData.organization.name);
    expect(tenantBOrgName).toBe(tenantBData.organization.name);
    expect(tenantAOrgName).not.toBe(tenantBOrgName);
  });

  test('API endpoint security for cross-tenant requests', async () => {
    await tenantAApp.loginAsAdmin(tenantAData);

    // Try to make API requests to other tenant's data
    const response = await tenantAApp.page.request.get('/api/risks', {
      headers: {
        'X-Tenant-Override': 'tenant-b', // Attempt to override tenant
      },
    });

    // Should either reject the request or ignore the override
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('File storage isolation', async () => {
    await tenantAApp.loginAsAdmin(tenantAData);

    // Attempt to access another tenant's file directly
    const response = await tenantAApp.page.request.get('/api/documents/download/tenant-b-file-id');

    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('Audit log isolation', async () => {
    await tenantAApp.loginAsAdmin(tenantAData);

    // Access audit logs
    await tenantAApp.page.goto('/dashboard/admin/audit-logs');

    // Verify only tenant A activities are visible
    const auditEntries = await tenantAApp.page
      .locator('[data-testid="audit-entry"]')
      .allTextContents();

    auditEntries.forEach((entry) => {
      expect(entry).not.toContain(tenantBData.organization.name);
      expect(entry).not.toContain(tenantBData.admin.email);
    });
  });
});

// Performance test for multi-tenant scalability
test.describe('Multi-Tenant Performance', () => {
  test('System handles multiple tenants concurrently', async ({ browser }) => {
    const tenantCount = 5;
    const contexts: BrowserContext[] = [];
    const apps: MultiTenantRiscuraApp[] = [];

    // Create multiple tenant contexts
    for (let i = 0; i < tenantCount; i++) {
      const context = await browser.newContext();
      const page = await context.newPage();
      const app = new MultiTenantRiscuraApp(page, `tenant-${i}`);

      contexts.push(context);
      apps.push(app);
    }

    // Simulate concurrent tenant operations
    const operations = apps.map(async (app, index) => {
      const tenantData = createTenantData(`ConcurrentTenant${index}`);
      await app.setupTenant(tenantData);
      await app.loginAsAdmin(tenantData);
      await app.createSensitiveRisk({
        title: `Concurrent Risk ${index}`,
      });
    });

    // All operations should complete successfully
    await Promise.all(operations);

    // Cleanup
    await Promise.all(contexts.map((ctx) => ctx.close()));
  });
});

export { MultiTenantRiscuraApp, createTenantData };
