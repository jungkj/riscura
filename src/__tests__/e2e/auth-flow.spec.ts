/// <reference types="cypress" />

import { defineConfig } from 'cypress'
import { test, expect, Page } from '@playwright/test';

// Custom commands for authentication
declare global {
  namespace Cypress {
    interface Chainable {
      login(email?: string, password?: string): Chainable<Element>
      logout(): Chainable<Element>
    }
  }
}

// Add custom commands
Cypress.Commands.add('login', (email?: string, password?: string) => {
  const testEmail = email || Cypress.env('TEST_USER_EMAIL') || 'test@example.com';
  const testPassword = password || Cypress.env('TEST_USER_PASSWORD') || 'password123';
  
  cy.session([testEmail, testPassword], () => {
    cy.visit('/auth/login');
    cy.get('[data-testid="email-input"]').type(testEmail);
    cy.get('[data-testid="password-input"]').type(testPassword);
    cy.get('[data-testid="login-button"]').click();
    cy.url().should('include', '/dashboard');
  });
});

Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="user-menu"]').click();
  cy.get('[data-testid="logout-button"]').click();
  cy.url().should('include', '/auth/login');
});

// Helper function for authentication
async function login(page: Page, email?: string, password?: string) {
  const testEmail = email || process.env.TEST_USER_EMAIL || 'test@example.com';
  const testPassword = password || process.env.TEST_USER_PASSWORD || 'password123';
  
  await page.goto('/auth/login');
  await page.fill('[data-testid="email-input"]', testEmail);
  await page.fill('[data-testid="password-input"]', testPassword);
  await page.click('[data-testid="login-button"]');
  await expect(page).toHaveURL(/.*dashboard/);
}

async function logout(page: Page) {
  await page.click('[data-testid="user-menu"]');
  await page.click('[data-testid="logout-button"]');
  await expect(page).toHaveURL(/.*auth\/login/);
}

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup test data if needed
  });

  test.describe('User Login', () => {
    test('should successfully log in with valid credentials', async ({ page }) => {
      await page.goto('/auth/login');
      
      await page.fill('[data-testid="email-input"]', process.env.TEST_USER_EMAIL || 'test@example.com');
      await page.fill('[data-testid="password-input"]', process.env.TEST_USER_PASSWORD || 'password123');
      
      // Mock successful login API call
      await page.route('/api/auth/login', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: {
              id: 'test-user-1',
              email: process.env.TEST_USER_EMAIL || 'test@example.com',
              firstName: 'Test',
              lastName: 'User',
              role: 'USER',
              organizationId: 'test-org-1',
            },
            token: 'test-jwt-token',
          })
        });
      });
      
      await page.click('[data-testid="login-button"]');
      
      // Verify successful login
      await expect(page).toHaveURL(/.*dashboard/);
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
      await expect(page.locator('[data-testid="welcome-message"]')).toContainText('Welcome, Test User');
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/auth/login');
      
      await page.fill('[data-testid="email-input"]', 'invalid@example.com');
      await page.fill('[data-testid="password-input"]', 'wrongpassword');
      
      // Mock failed login
      await page.route('/api/auth/login', async route => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Invalid credentials',
          })
        });
      });
      
      await page.click('[data-testid="login-button"]');
      
      // Verify error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials');
      
      // Should remain on login page
      await expect(page).toHaveURL(/.*auth\/login/);
    });

    test('should validate form fields', async ({ page }) => {
      await page.goto('/auth/login');
      
      // Try to submit empty form
      await page.click('[data-testid="login-button"]');
      
      // Should show validation errors
      await expect(page.locator('[data-testid="email-error"]')).toContainText('Email is required');
      await expect(page.locator('[data-testid="password-error"]')).toContainText('Password is required');
      
      // Test invalid email format
      await page.fill('[data-testid="email-input"]', 'invalid-email');
      await expect(page.locator('[data-testid="email-error"]')).toContainText('Please enter a valid email');
    });

    test('should handle forgotten password flow', async ({ page }) => {
      await page.goto('/auth/login');
      
      await page.click('[data-testid="forgot-password-link"]');
      await expect(page).toHaveURL(/.*auth\/forgot-password/);
      
      await page.fill('[data-testid="reset-email-input"]', process.env.TEST_USER_EMAIL || 'test@example.com');
      
      await page.route('/api/auth/forgot-password', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Reset email sent' })
        });
      });
      
      await page.click('[data-testid="send-reset-button"]');
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Password reset email sent');
    });
  });

  test.describe('User Registration', () => {
    test('should allow new user registration', async ({ page }) => {
      await page.goto('/auth/register');
      
      // Fill registration form
      await page.fill('[data-testid="first-name-input"]', 'New');
      await page.fill('[data-testid="last-name-input"]', 'User');
      await page.fill('[data-testid="email-input"]', 'newuser@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.fill('[data-testid="confirm-password-input"]', 'password123');
      await page.fill('[data-testid="organization-name-input"]', 'New Organization');
      await page.check('[data-testid="terms-checkbox"]');
      
      // Mock successful registration
      await page.route('/api/auth/register', async route => {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Registration successful',
            user: {
              id: 'new-user-id',
              email: 'newuser@example.com',
              firstName: 'New',
              lastName: 'User',
            }
          })
        });
      });
      
      await page.click('[data-testid="register-button"]');
      
      // Should redirect to verification page
      await expect(page).toHaveURL(/.*auth\/verify-email/);
      await expect(page.locator('[data-testid="verification-message"]')).toContainText('Please check your email');
    });

    test('should validate registration form', async ({ page }) => {
      await page.goto('/auth/register');
      
      // Try to submit empty form
      await page.click('[data-testid="register-button"]');
      
      // Should show validation errors
      await expect(page.locator('[data-testid="first-name-error"]')).toContainText('First name is required');
      await expect(page.locator('[data-testid="email-error"]')).toContainText('Email is required');
      
      // Test password mismatch
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.fill('[data-testid="confirm-password-input"]', 'different');
      await expect(page.locator('[data-testid="password-mismatch-error"]')).toContainText('Passwords do not match');
    });
  });

  test.describe('Session Management', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
    });

    test('should maintain session across page refreshes', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Verify user is logged in
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
      
      // Refresh page
      await page.reload();
      
      // Should still be logged in
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
      await expect(page).toHaveURL(/.*dashboard/);
    });

    test('should logout successfully', async ({ page }) => {
      await page.goto('/dashboard');
      await logout(page);
      await expect(page).toHaveURL(/.*auth\/login/);
    });

    test('should redirect to login when session expires', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Mock session expiration
      await page.route('/api/auth/session', async route => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Session expired' })
        });
      });
      
      await page.reload();
      await expect(page).toHaveURL(/.*auth\/login/);
    });
  });

  test.describe('Access Control', () => {
    test('should prevent access to protected routes without authentication', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/.*auth\/login/);
    });

    test('should handle different user roles correctly', async ({ page }) => {
      // Test admin access
      await login(page, 'admin@example.com', 'adminpass');
      await page.goto('/admin');
      await expect(page.locator('[data-testid="admin-panel"]')).toBeVisible();
      
      await logout(page);
      
      // Test regular user access restriction
      await login(page, 'user@example.com', 'userpass');
      await page.goto('/admin');
      await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
    });
  });

  test.describe('Security Features', () => {
    test('should implement rate limiting on login attempts', async ({ page }) => {
      await page.goto('/auth/login');
      
      // Attempt multiple failed logins
      for (let i = 0; i < 5; i++) {
        await page.fill('[data-testid="email-input"]', 'test@example.com');
        await page.fill('[data-testid="password-input"]', 'wrongpassword');
        await page.click('[data-testid="login-button"]');
        await page.waitForTimeout(1000);
      }
      
      // Should show rate limit message
      await expect(page.locator('[data-testid="rate-limit-error"]')).toBeVisible();
    });

    test('should handle CSRF protection', async ({ page }) => {
      // This would test CSRF token validation
      await page.goto('/auth/login');
      
      // Attempt login without proper CSRF token (would be handled by the backend)
      const response = await page.request.post('/api/auth/login', {
        data: {
          email: 'test@example.com',
          password: 'password123'
        }
      });
      
      // Should return error for missing CSRF token
      expect(response.status()).toBe(403);
    });
  });
}); 
}); 
}); 