import { test as setup, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';

const authFile = 'src/__tests__/e2e/.auth/user.json';
const adminAuthFile = 'src/__tests__/e2e/.auth/admin.json';

/**
 * Authentication Setup for E2E Tests
 *
 * This setup runs before other tests to authenticate users and save their session state.
 * It creates authenticated sessions for regular users and admin users.
 */

setup('authenticate as regular user', async ({ page }) => {
  const testEmail = process.env.TEST_USER_EMAIL || 'testuser@riscura.com';
  const testPassword = process.env.TEST_USER_PASSWORD || 'test123';

  // console.log(`Authenticating user: ${testEmail}`);

  // Navigate to login page
  await page.goto('/auth/login');

  // Wait for page to load
  await expect(page.locator('input[type="email"]')).toBeVisible();

  // Fill login form
  await page.fill('input[type="email"]', testEmail);
  await page.fill('input[type="password"]', testPassword);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for successful login - should redirect to dashboard
  await page.waitForURL('**/dashboard/**', { timeout: 30000 });

  // Verify we're logged in by checking for user menu or similar element
  await expect(
    page.locator(
      '[data-testid="user-menu"], .user-menu, [aria-label*="user"], [aria-label*="profile"]'
    )
  ).toBeVisible({ timeout: 10000 });

  // console.log('Regular user authentication successful');

  // Save signed-in state to file
  await page.context().storageState({ path: authFile });
});

setup('authenticate as admin user', async ({ page }) => {
  const adminEmail = process.env.TEST_ADMIN_EMAIL || 'admin@riscura.com';
  const adminPassword = process.env.TEST_ADMIN_PASSWORD || 'admin123';

  // console.log(`Authenticating admin: ${adminEmail}`);

  // Navigate to login page
  await page.goto('/auth/login');

  // Wait for page to load
  await expect(page.locator('input[type="email"]')).toBeVisible();

  // Fill login form
  await page.fill('input[type="email"]', adminEmail);
  await page.fill('input[type="password"]', adminPassword);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for successful login
  await page.waitForURL('**/dashboard/**', { timeout: 30000 });

  // Verify admin access
  await expect(
    page.locator(
      '[data-testid="user-menu"], .user-menu, [aria-label*="user"], [aria-label*="profile"]'
    )
  ).toBeVisible({ timeout: 10000 });

  // console.log('Admin user authentication successful');

  // Save admin signed-in state to file
  await page.context().storageState({ path: adminAuthFile });
});

setup('verify database connection', async ({ request }) => {
  // console.log('Verifying database connection...');

  // Test database connectivity through API
  const response = await request.get('/api/health/database');

  if (response.status() !== 200) {
    // console.error('Database health check failed');
    throw new Error(`Database health check failed with status: ${response.status()}`);
  }

  const data = await response.json();
  // console.log('Database connection verified:', data);
});

setup('prepare test data', async ({ request }) => {
  // console.log('Preparing test data...');

  // Create test organization and users if they don't exist
  // This would typically call a test data setup API endpoint
  try {
    const response = await request.post('/api/test/setup-data', {
      data: {
        createTestUsers: true,
        createTestOrganizations: true,
        createSampleRisks: true,
      },
    });

    if (response.status() === 200 || response.status() === 201) {
      // console.log('Test data preparation successful');
    } else {
      // console.log('Test data setup API not available or failed - continuing with existing data');
    }
  } catch (error) {
    // console.log('Test data setup API not available - continuing with existing data');
  }
});
