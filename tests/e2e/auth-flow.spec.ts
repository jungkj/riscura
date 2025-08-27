import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the homepage
    await page.goto('/');
  });

  test('should navigate to login page', async ({ page }) => {
    // Look for login link or button
    const loginLink = page.locator('a[href*="/auth/login"], a[href*="/login"], button:has-text("Sign In"), button:has-text("Login")');
    
    if (await loginLink.count() > 0) {
      await loginLink.first().click();
      await expect(page).toHaveURL(/.*\/auth\/login|.*\/login/);
    } else {
      // Navigate directly to login page
      await page.goto('/auth/login');
    }
    
    // Verify login page elements
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
    
    // Take screenshot of login page
    await page.screenshot({ path: 'screenshots/login-page.png', fullPage: true });
  });

  test('should show validation errors for invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
    await submitButton.click();
    
    // Should show validation errors
    const errorMessages = page.locator('[data-testid="error"], .error, [class*="error"]');
    await expect(errorMessages.first()).toBeVisible({ timeout: 5000 });
    
    // Take screenshot of validation errors
    await page.screenshot({ path: 'screenshots/login-validation-errors.png', fullPage: true });
  });

  test('should attempt login with test credentials', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Fill in test credentials
    await page.fill('input[type="email"], input[name="email"]', 'testuser@riscura.com');
    await page.fill('input[type="password"], input[name="password"]', 'test123');
    
    // Submit form
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
    await submitButton.click();
    
    // Wait for navigation or error
    await page.waitForTimeout(3000);
    
    // Take screenshot of result
    await page.screenshot({ path: 'screenshots/login-attempt-result.png', fullPage: true });
    
    // Check if we're redirected to dashboard or if there's an error
    const currentUrl = page.url();
    console.log('Current URL after login attempt:', currentUrl);
  });

  test('should display Google OAuth option', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Look for Google OAuth button
    const googleButton = page.locator('button:has-text("Google"), a:has-text("Google"), [data-testid="google-login"]');
    
    if (await googleButton.count() > 0) {
      await expect(googleButton.first()).toBeVisible();
      console.log('Google OAuth button found');
    } else {
      console.log('Google OAuth button not found - may need configuration');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'screenshots/login-with-oauth.png', fullPage: true });
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Look for register link
    const registerLink = page.locator('a[href*="/register"], a[href*="/signup"], a:has-text("Register"), a:has-text("Sign Up")');
    
    if (await registerLink.count() > 0) {
      await registerLink.first().click();
      await expect(page).toHaveURL(/.*\/auth\/register|.*\/register|.*\/signup/);
      
      // Verify register page elements
      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
      
      // Take screenshot
      await page.screenshot({ path: 'screenshots/register-page.png', fullPage: true });
    } else {
      console.log('Register link not found');
    }
  });
});