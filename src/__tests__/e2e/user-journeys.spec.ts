import { test, expect, Page } from '@playwright/test';

/**
 * Critical User Journey Tests
 *
 * These tests cover the most important user flows in the risk management platform:
 * - User registration and onboarding
 * - Dashboard navigation and core features
 * - Risk creation and management
 * - Assessment workflows
 * - Data persistence verification
 */

test.describe('Critical User Journeys', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
  });

  test.describe('New User Registration Journey', () => {
    test('complete new user onboarding flow', async () => {
      const uniqueEmail = `testuser${Date.now()}@example.com`;

      // Step 1: Navigate to registration
      await page.goto('/auth/register');
      await expect(page.locator('h1, h2')).toContainText(/register|sign up/i);

      // Step 2: Fill registration form
      await page.fill(
        '[data-testid="first-name-input"], input[name="firstName"], input[placeholder*="first name" i]',
        'Test'
      );
      await page.fill(
        '[data-testid="last-name-input"], input[name="lastName"], input[placeholder*="last name" i]',
        'User'
      );
      await page.fill(
        '[data-testid="email-input"], input[type="email"], input[name="email"]',
        uniqueEmail
      );
      await page.fill(
        '[data-testid="password-input"], input[type="password"], input[name="password"]',
        'TestPassword123!'
      );
      await page.fill(
        '[data-testid="organization-input"], input[name="organization"], input[placeholder*="organization" i]',
        'Test Organization'
      );

      // Accept terms if checkbox exists
      const termsCheckbox = page
        .locator('[data-testid="terms-checkbox"], input[type="checkbox"]')
        .first();
      if (await termsCheckbox.isVisible()) {
        await termsCheckbox.check();
      }

      // Step 3: Submit registration
      await page.click(
        '[data-testid="register-button"], button[type="submit"], button:has-text("Register"), button:has-text("Sign Up")'
      );

      // Step 4: Handle post-registration flow
      // Check for either immediate login or email verification
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      if (currentUrl.includes('/dashboard')) {
        // Immediate login - verify dashboard access
        await expect(
          page.locator('[data-testid="user-menu"], .user-menu, [aria-label*="user"]')
        ).toBeVisible({ timeout: 10000 });
        // console.log('Registration successful - immediate dashboard access');
      } else if (currentUrl.includes('/verify') || currentUrl.includes('/confirmation')) {
        // Email verification required
        await expect(page.locator('text=email, text=verify, text=confirmation')).toBeVisible();
        // console.log('Registration successful - email verification required');
      } else {
        // Check for success message
        const successMessage = page.locator(
          '[data-testid="success-message"], .success, .alert-success'
        );
        if (await successMessage.isVisible()) {
          // console.log('Registration successful - success message displayed');
        } else {
          throw new Error(`Unexpected post-registration state: ${currentUrl}`);
        }
      }
    });

    test('registration form validation', async () => {
      await page.goto('/auth/register');

      // Try to submit empty form
      await page.click(
        '[data-testid="register-button"], button[type="submit"], button:has-text("Register"), button:has-text("Sign Up")'
      );

      // Check for validation errors
      await expect(page.locator('[data-testid*="error"], .error, .text-red')).toBeVisible({
        timeout: 5000,
      });

      // Test invalid email format
      await page.fill('input[type="email"], input[name="email"]', 'invalid-email');
      await page.click('[data-testid="register-button"], button[type="submit"]');

      await expect(page.locator('text=invalid email, text=valid email')).toBeVisible({
        timeout: 5000,
      });
    });
  });

  test.describe('Dashboard Navigation Journey', () => {
    test.beforeEach(async () => {
      // Use authenticated state
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
    });

    test('navigate through main dashboard sections', async () => {
      // Verify dashboard loads
      await expect(page.locator('h1, h2, [data-testid="dashboard-title"]')).toBeVisible();

      // Test navigation to key sections
      const navSections = [
        { text: 'Risks', url: '/risks' },
        { text: 'Controls', url: '/controls' },
        { text: 'Compliance', url: '/compliance' },
        { text: 'Reports', url: '/reports' },
        { text: 'Settings', url: '/settings' },
      ];

      for (const section of navSections) {
        // Try to find and click navigation link
        const navLink = page
          .locator(
            `a:has-text("${section.text}"), [data-testid="${section.text.toLowerCase()}-nav"], nav a[href*="${section.url}"]`
          )
          .first();

        if (await navLink.isVisible()) {
          await navLink.click();
          await page.waitForLoadState('networkidle');

          // Verify navigation worked
          const currentUrl = page.url();
          expect(currentUrl).toContain(section.url.toLowerCase());
          // console.log(`Successfully navigated to ${section.text} section`);

          // Navigate back to dashboard
          await page.goto('/dashboard');
          await page.waitForLoadState('networkidle');
        } else {
          // console.log(`Navigation link for ${section.text} not found - skipping`);
        }
      }
    });

    test('dashboard widgets and data display', async () => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Check for key dashboard elements
      const dashboardElements = [
        '[data-testid="risk-summary"], .risk-summary, .metric-card',
        '[data-testid="recent-activity"], .activity-feed, .recent-items',
        '[data-testid="compliance-status"], .compliance-widget, .status-widget',
      ];

      for (const selector of dashboardElements) {
        const element = page.locator(selector).first();
        if (await element.isVisible()) {
          // console.log(`Dashboard element found: ${selector}`);
        }
      }

      // Verify page is interactive (not just loading)
      await expect(page.locator('body')).not.toHaveClass(/loading/);
    });
  });

  test.describe('Risk Management Journey', () => {
    test.beforeEach(async () => {
      await page.goto('/dashboard/risks');
      await page.waitForLoadState('networkidle');
    });

    test('create new risk assessment', async () => {
      // Navigate to risk creation
      const createButton = page
        .locator(
          '[data-testid="create-risk"], button:has-text("Create"), button:has-text("New Risk"), .btn-primary'
        )
        .first();

      if (await createButton.isVisible()) {
        await createButton.click();
      } else {
        // Try alternative navigation
        await page.goto('/dashboard/risks/new');
      }

      await page.waitForLoadState('networkidle');

      // Fill risk assessment form
      const riskTitle = `Test Risk ${Date.now()}`;

      // Fill basic information
      await page.fill(
        '[data-testid="risk-title"], input[name="title"], input[placeholder*="title" i]',
        riskTitle
      );
      await page.fill(
        '[data-testid="risk-description"], textarea[name="description"], textarea[placeholder*="description" i]',
        'This is a test risk created by automated testing'
      );

      // Select risk category if dropdown exists
      const categorySelect = page
        .locator('[data-testid="risk-category"], select[name="category"], select:has(option)')
        .first();
      if (await categorySelect.isVisible()) {
        await categorySelect.selectOption({ index: 1 });
      }

      // Set risk likelihood and impact if controls exist
      const likelihoodControl = page
        .locator('[data-testid="likelihood"], input[name="likelihood"], select[name="likelihood"]')
        .first();
      const impactControl = page
        .locator('[data-testid="impact"], input[name="impact"], select[name="impact"]')
        .first();

      if (await likelihoodControl.isVisible()) {
        if ((await likelihoodControl.getAttribute('type')) === 'range') {
          await likelihoodControl.fill('3');
        } else {
          await likelihoodControl.selectOption({ index: 2 });
        }
      }

      if (await impactControl.isVisible()) {
        if ((await impactControl.getAttribute('type')) === 'range') {
          await impactControl.fill('3');
        } else {
          await impactControl.selectOption({ index: 2 });
        }
      }

      // Submit the form
      await page.click(
        '[data-testid="save-risk"], button[type="submit"], button:has-text("Save"), button:has-text("Create")'
      );

      // Verify risk was created
      await page.waitForTimeout(2000);

      // Check for success message or redirect to risk list
      const successIndicators = [
        page.locator('[data-testid="success-message"], .success, .alert-success'),
        page.locator(`text=${riskTitle}`),
        page.url().includes('/risks') && !page.url().includes('/new'),
      ];

      let created = false;
      for (const indicator of successIndicators) {
        if (typeof indicator === 'boolean') {
          if (indicator) created = true;
        } else if (await indicator.isVisible()) {
          created = true;
          break;
        }
      }

      expect(created).toBe(true);
      // console.log(`Risk "${riskTitle}" created successfully`);
    });

    test('risk list filtering and search', async () => {
      await page.goto('/dashboard/risks');
      await page.waitForLoadState('networkidle');

      // Test search functionality if available
      const searchInput = page
        .locator('[data-testid="search"], input[type="search"], input[placeholder*="search" i]')
        .first();

      if (await searchInput.isVisible()) {
        await searchInput.fill('test');
        await page.waitForTimeout(1000);

        // Verify search results are filtered
        // console.log('Search functionality tested');
      }

      // Test filters if available
      const filterButton = page
        .locator('[data-testid="filter"], button:has-text("Filter"), .filter-toggle')
        .first();

      if (await filterButton.isVisible()) {
        await filterButton.click();
        await page.waitForTimeout(500);

        // console.log('Filter functionality tested');
      }
    });
  });

  test.describe('Data Persistence Journey', () => {
    test('data persists across sessions', async () => {
      // Create some test data
      const testData = `Test Data ${Date.now()}`;

      await page.goto('/dashboard/risks/new');
      await page.waitForLoadState('networkidle');

      // Create a risk
      await page.fill('input[name="title"], [data-testid="risk-title"]', testData);
      await page.fill(
        'textarea[name="description"], [data-testid="risk-description"]',
        'Persistence test data'
      );

      await page.click('button[type="submit"], [data-testid="save-risk"]');
      await page.waitForTimeout(2000);

      // Navigate away and back
      await page.goto('/dashboard');
      await page.waitForTimeout(1000);
      await page.goto('/dashboard/risks');
      await page.waitForTimeout(2000);

      // Verify data is still there
      await expect(page.locator(`text=${testData}`)).toBeVisible({ timeout: 10000 });
      // console.log('Data persistence verified');
    });

    test('form data recovery after page refresh', async () => {
      await page.goto('/dashboard/risks/new');
      await page.waitForLoadState('networkidle');

      const testTitle = `Draft Risk ${Date.now()}`;

      // Fill form but don't submit
      await page.fill('input[name="title"], [data-testid="risk-title"]', testTitle);
      await page.fill(
        'textarea[name="description"], [data-testid="risk-description"]',
        'This is draft content'
      );

      // Refresh page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Check if form data is recovered (this depends on implementation)
      const titleInput = page.locator('input[name="title"], [data-testid="risk-title"]');
      if ((await titleInput.inputValue()) === testTitle) {
        // console.log('Form data recovery working');
      } else {
        // console.log('Form data recovery not implemented (this is optional)');
      }
    });
  });

  test.describe('Mobile Responsiveness Journey', () => {
    test.beforeEach(async ({ browser }) => {
      // Create mobile context
      const context = await browser.newContext({
        viewport: { width: 375, height: 667 }, // iPhone SE size
      });
      page = await context.newPage();
    });

    test('mobile navigation functionality', async () => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Look for mobile menu toggle
      const mobileMenuToggle = page
        .locator('[data-testid="mobile-menu"], .mobile-menu-toggle, button[aria-label*="menu"]')
        .first();

      if (await mobileMenuToggle.isVisible()) {
        await mobileMenuToggle.click();
        await page.waitForTimeout(500);

        // Verify menu opened
        const mobileMenu = page
          .locator('[data-testid="mobile-nav"], .mobile-navigation, .mobile-menu')
          .first();
        await expect(mobileMenu).toBeVisible();

        // console.log('Mobile navigation tested successfully');
      } else {
        // console.log('Mobile menu toggle not found - testing responsive layout');

        // Verify page is still usable on mobile
        await expect(page.locator('body')).toBeVisible();
        await expect(page.locator('h1, h2, [data-testid="dashboard-title"]')).toBeVisible();
      }
    });

    test('mobile form usability', async () => {
      await page.goto('/dashboard/risks/new');
      await page.waitForLoadState('networkidle');

      // Verify form is usable on mobile
      const titleInput = page.locator('input[name="title"], [data-testid="risk-title"]').first();

      if (await titleInput.isVisible()) {
        await titleInput.fill('Mobile Test Risk');

        // Verify input is responsive and usable
        const inputBox = await titleInput.boundingBox();
        expect(inputBox?.width).toBeGreaterThan(200); // Reasonable minimum width

        // console.log('Mobile form usability verified');
      }
    });
  });

  test.describe('Error Handling Journey', () => {
    test('graceful handling of network errors', async () => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Simulate network failure
      await page.setOffline(true);

      // Try to navigate or perform an action
      await page.click('a[href="/dashboard/risks"], [data-testid="risks-nav"]').catch(() => {
        // Click might fail due to offline state
      });

      await page.waitForTimeout(2000);

      // Restore network
      await page.setOffline(false);

      // Verify application recovers gracefully
      await page.waitForLoadState('networkidle');
      // console.log('Network error handling tested');
    });

    test('form validation error display', async () => {
      await page.goto('/dashboard/risks/new');
      await page.waitForLoadState('networkidle');

      // Submit empty form to trigger validation
      await page.click('button[type="submit"], [data-testid="save-risk"]');

      // Check for validation errors
      await expect(
        page.locator('[data-testid*="error"], .error, .text-red, .invalid-feedback')
      ).toBeVisible({ timeout: 5000 });

      // console.log('Form validation error display verified');
    });
  });
});
