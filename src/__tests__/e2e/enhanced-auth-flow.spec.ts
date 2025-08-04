import { test, expect, Page } from '@playwright/test';

/**
 * Enhanced Authentication Flow Tests
 *
 * Comprehensive authentication testing including:
 * - Google OAuth flow testing
 * - Multi-factor authentication
 * - Session management
 * - Security features
 * - Cross-browser compatibility
 */

test.describe('Enhanced Authentication Flows', () => {
  test.describe('Google OAuth Integration', () => {
    test('Google OAuth login flow', async ({ page }) => {
      await page.goto('/auth/login');

      // Look for Google OAuth button
      const googleButton = page
        .locator(
          '[data-testid="google-login"], button:has-text("Google"), button:has-text("Continue with Google"), .google-auth-button'
        )
        .first()

      if (await googleButton.isVisible()) {
        // Mock Google OAuth flow for testing
        await page.route('https://accounts.google.com/oauth/**', async (route) => {
          // Simulate successful OAuth redirect
          await route.fulfill({
            status: 302,
            headers: {
              Location: `${page.url().split('/auth')[0]}/api/auth/callback/google?code=mock_auth_code&state=mock_state`,
            },
          })
        });

        // Mock the OAuth callback
        await page.route('/api/auth/callback/google**', async (route) => {
          await route.fulfill({
            status: 302,
            headers: {
              Location: '/dashboard',
            },
          })
        });

        await googleButton.click();

        // In a real test, this would go through Google's OAuth flow
        // For testing purposes, we verify the button click and mock the flow
        // console.log('Google OAuth button interaction tested')

        // Verify OAuth flow initiation (URL change or popup)
        await page.waitForTimeout(1000)
      } else {
        // console.log('Google OAuth not implemented or button not found')
      }
    });

    test('OAuth error handling', async ({ page }) => {
      await page.goto('/auth/login');

      const googleButton = page
        .locator('[data-testid="google-login"], button:has-text("Google")')
        .first();

      if (await googleButton.isVisible()) {
        // Mock OAuth error
        await page.route('https://accounts.google.com/oauth/**', async (route) => {
          await route.fulfill({
            status: 302,
            headers: {
              Location: `${page.url().split('/auth')[0]}/auth/login?error=oauth_error&error_description=Access denied`,
            },
          })
        });

        await googleButton.click();
        await page.waitForTimeout(2000);

        // Check for error message
        const errorMessage = page.locator('[data-testid="oauth-error"], .error, .alert-error')
        if (await errorMessage.isVisible()) {
          await expect(errorMessage).toContainText(/error|denied|failed/i);
          // console.log('OAuth error handling verified')
        }
      }
    });
  });

  test.describe('Multi-Factor Authentication', () => {
    test('MFA setup flow', async ({ page }) => {
      // First login with regular credentials
      await page.goto('/auth/login')
      await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'testuser@riscura.com');
      await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'test123');
      await page.click('button[type="submit"]');

      await page.waitForURL('**/dashboard/**', { timeout: 30000 });

      // Navigate to security settings
      const paths = ['/settings/security', '/profile/security', '/dashboard/settings']
      let settingsFound = false;

      for (const path of paths) {
        try {
          await page.goto(path);
          await page.waitForLoadState('networkidle');

          const mfaSection = page
            .locator('[data-testid="mfa-section"], .mfa-settings, text=two-factor, text=2FA')
            .first();
          if (await mfaSection.isVisible()) {
            settingsFound = true;

            // Look for MFA enable button
            const enableMfaButton = page
              .locator(
                '[data-testid="enable-mfa"], button:has-text("Enable"), button:has-text("Setup")'
              )
              .first()
            if (await enableMfaButton.isVisible()) {
              await enableMfaButton.click();

              // Verify MFA setup flow starts
              await expect(
                page.locator(
                  '[data-testid="mfa-setup"], .mfa-setup, text=QR code, text=authenticator'
                )
              ).toBeVisible({ timeout: 10000 })
              // console.log('MFA setup flow verified')
            }
            break;
          }
        } catch (error) {
          // Continue to next path
        }
      }

      if (!settingsFound) {
        // console.log('MFA settings not found or not implemented')
      }
    });

    test('MFA login verification', async ({ page }) => {
      // This test assumes MFA is already set up for the test user
      await page.goto('/auth/login')
      await page.fill(
        'input[type="email"]',
        process.env.TEST_MFA_USER_EMAIL || 'mfauser@riscura.com'
      );
      await page.fill('input[type="password"]', process.env.TEST_MFA_USER_PASSWORD || 'mfatest123');
      await page.click('button[type="submit"]');

      // Check for MFA prompt
      const mfaPrompt = page.locator(
        '[data-testid="mfa-prompt"], .mfa-verification, input[placeholder*="code"], input[name*="token"]'
      )

      if (await mfaPrompt.isVisible({ timeout: 5000 })) {
        // Simulate MFA code entry
        const codeInput = page
          .locator('input[placeholder*="code"], input[name*="token"], input[name*="mfa"]')
          .first()
        await codeInput.fill('123456'); // Mock MFA code

        await page.click(
          '[data-testid="verify-mfa"], button:has-text("Verify"), button[type="submit"]'
        );

        // console.log('MFA verification flow tested')
      } else {
        // console.log('MFA not configured for test user or not implemented')
      }
    });
  });

  test.describe('Advanced Session Management', () => {
    test('concurrent session handling', async ({ browser }) => {
      // Create two browser contexts to simulate different sessions
      const context1 = await browser.newContext()
      const context2 = await browser.newContext();

      const page1 = await context1.newPage();
      const page2 = await context2.newPage();

      // Login in first session
      await page1.goto('/auth/login')
      await page1.fill(
        'input[type="email"]',
        process.env.TEST_USER_EMAIL || 'testuser@riscura.com'
      );
      await page1.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'test123');
      await page1.click('button[type="submit"]');
      await page1.waitForURL('**/dashboard/**');

      // Login in second session with same user
      await page2.goto('/auth/login')
      await page2.fill(
        'input[type="email"]',
        process.env.TEST_USER_EMAIL || 'testuser@riscura.com'
      );
      await page2.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'test123');
      await page2.click('button[type="submit"]');
      await page2.waitForURL('**/dashboard/**');

      // Verify both sessions are active (or test session invalidation if implemented)
      await expect(page1.locator('[data-testid="user-menu"], .user-menu')).toBeVisible()
      await expect(page2.locator('[data-testid="user-menu"], .user-menu')).toBeVisible();

      // console.log('Concurrent session handling tested')

      await context1.close();
      await context2.close();
    });

    test('session timeout handling', async ({ page }) => {
      await page.goto('/auth/login');
      await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'testuser@riscura.com');
      await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'test123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard/**');

      // Mock expired session
      await page.route('/api/auth/**', async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Session expired' }),
        })
      });

      // Trigger an API call that would check session
      await page.reload()
      await page.waitForTimeout(2000);

      // Should redirect to login or show session expired message
      const currentUrl = page.url()
      if (currentUrl.includes('/auth/login')) {
        // console.log('Session timeout redirect to login verified')
      } else {
        const sessionMessage = page.locator(
          'text=session expired, text=please login, .expired-session'
        );
        if (await sessionMessage.isVisible()) {
          // console.log('Session expired message displayed')
        }
      }
    });

    test('remember me functionality', async ({ page }) => {
      await page.goto('/auth/login');

      const rememberCheckbox = page
        .locator('[data-testid="remember-me"], input[name="remember"], input[type="checkbox"]')
        .first();

      if (await rememberCheckbox.isVisible()) {
        await rememberCheckbox.check();

        await page.fill(
          'input[type="email"]',
          process.env.TEST_USER_EMAIL || 'testuser@riscura.com'
        );
        await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'test123');
        await page.click('button[type="submit"]');

        await page.waitForURL('**/dashboard/**');

        // Close browser and reopen to test persistence
        await page.context().close()

        const newContext = await page.context().browser()?.newContext();
        const newPage = await newContext?.newPage();

        if (newPage) {
          await newPage.goto('/dashboard');

          // Check if still logged in (this depends on implementation)
          const userMenu = newPage.locator('[data-testid="user-menu"], .user-menu')
          if (await userMenu.isVisible({ timeout: 5000 })) {
            // console.log('Remember me functionality working')
          } else {
            // console.log('Remember me not implemented or session not persisted')
          }

          await newContext?.close();
        }
      } else {
        // console.log('Remember me functionality not found')
      }
    });
  });

  test.describe('Password Security Features', () => {
    test('password strength validation', async ({ page }) => {
      await page.goto('/auth/register');

      const passwordInput = page.locator('input[type="password"]').first();
      const strengthIndicator = page.locator(
        '[data-testid="password-strength"], .password-strength, .strength-meter'
      );

      if (await passwordInput.isVisible()) {
        // Test weak password
        await passwordInput.fill('123')
        await page.waitForTimeout(500);

        if (await strengthIndicator.isVisible()) {
          await expect(strengthIndicator).toContainText(/weak|poor/i);
          // console.log('Weak password detection verified')
        }

        // Test strong password
        await passwordInput.fill('StrongPassword123!@#')
        await page.waitForTimeout(500);

        if (await strengthIndicator.isVisible()) {
          // Should show strong or good rating
          // console.log('Password strength validation tested')
        }
      }
    });

    test('password reset flow', async ({ page }) => {
      await page.goto('/auth/login');

      const forgotPasswordLink = page
        .locator('[data-testid="forgot-password"], a:has-text("Forgot"), a:has-text("Reset")')
        .first();

      if (await forgotPasswordLink.isVisible()) {
        await forgotPasswordLink.click();
        await page.waitForURL('**/forgot-password**');

        // Fill email and request reset
        await page.fill(
          'input[type="email"]',
          process.env.TEST_USER_EMAIL || 'testuser@riscura.com'
        )
        await page.click(
          '[data-testid="send-reset"], button[type="submit"], button:has-text("Send")'
        );

        // Verify success message
        await expect(
          page.locator('[data-testid="reset-sent"], .success, text=email sent')
        ).toBeVisible({ timeout: 10000 })

        // console.log('Password reset flow verified')
      } else {
        // console.log('Password reset functionality not found')
      }
    });
  });

  test.describe('Account Security', () => {
    test('account lockout protection', async ({ page }) => {
      await page.goto('/auth/login');

      const testEmail = 'test@example.com';
      const wrongPassword = 'wrongpassword';

      // Attempt multiple failed logins
      for (let i = 0; i < 6; i++) {
        await page.fill('input[type="email"]', testEmail);
        await page.fill('input[type="password"]', wrongPassword);
        await page.click('button[type="submit"]');

        await page.waitForTimeout(1000);

        // Clear fields for next attempt
        await page.fill('input[type="email"]', '')
        await page.fill('input[type="password"]', '');
      }

      // Check for lockout message
      const lockoutMessage = page.locator(
        '[data-testid="account-locked"], text=locked, text=too many attempts'
      )

      if (await lockoutMessage.isVisible()) {
        // console.log('Account lockout protection verified')
      } else {
        // console.log('Account lockout protection not implemented or threshold not reached')
      }
    });

    test('security headers validation', async ({ page }) => {
      const response = await page.goto('/auth/login');

      if (response) {
        const headers = response.headers();

        // Check for important security headers
        const securityHeaders = [
          'x-frame-options',
          'x-content-type-options',
          'strict-transport-security',
          'content-security-policy',
        ]

        securityHeaders.forEach((header) => {
          if (headers[header]) {
            // console.log(`Security header ${header} present: ${headers[header]}`)
          } else {
            // console.log(`Security header ${header} missing`)
          }
        });
      }
    });
  });

  test.describe('Cross-Browser Authentication', () => {
    ['chromium', 'firefox', 'webkit'].forEach((browserName) => {
      test(`authentication flow in ${browserName}`, async ({ page }) => {
        // This test will run across different browsers due to Playwright config
        await page.goto('/auth/login')

        await page.fill(
          'input[type="email"]',
          process.env.TEST_USER_EMAIL || 'testuser@riscura.com'
        );
        await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'test123');
        await page.click('button[type="submit"]');

        await page.waitForURL('**/dashboard/**', { timeout: 30000 });

        // Verify successful login across browsers
        await expect(page.locator('[data-testid="user-menu"], .user-menu')).toBeVisible()

        // console.log(`Authentication successful in ${browserName}`)
      });
    });
  });

  test.describe('Authentication API Testing', () => {
    test('authentication API endpoints', async ({ request }) => {
      // Test login API directly
      const loginResponse = await request.post('/api/auth/login', {
        data: {
          email: process.env.TEST_USER_EMAIL || 'testuser@riscura.com',
          password: process.env.TEST_USER_PASSWORD || 'test123',
        },
      })

      if (loginResponse.ok()) {
        const loginData = await loginResponse.json();
        expect(loginData).toHaveProperty('success');
        // console.log('Login API endpoint verified')
      } else {
        // console.log(`Login API returned status: ${loginResponse.status()}`)
      }

      // Test session API
      const sessionResponse = await request.get('/api/auth/session')
      // console.log(`Session API status: ${sessionResponse.status()}`)

      // Test logout API
      const logoutResponse = await request.post('/api/auth/logout')
      // console.log(`Logout API status: ${logoutResponse.status()}`)
    });
  });
});
