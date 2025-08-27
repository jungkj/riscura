import { test, expect } from '@playwright/test';

test('homepage loads successfully', async ({ page }) => {
  // Go to the starting url before each test.
  await page.goto('/');
  
  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/RisCura/);
  
  // Take a screenshot for verification
  await page.screenshot({ path: 'homepage.png', fullPage: true });
});

test('authentication flow', async ({ page }) => {
  await page.goto('/auth/signin');
  
  // Check if the sign-in page loads
  await expect(page.locator('h1')).toContainText(['Sign In', 'Login', 'Authentication']);
  
  // Test form elements exist
  const emailField = page.locator('input[type="email"], input[name="email"]');
  const passwordField = page.locator('input[type="password"], input[name="password"]');
  
  await expect(emailField).toBeVisible();
  await expect(passwordField).toBeVisible();
  
  // Take a screenshot of the auth page
  await page.screenshot({ path: 'auth-page.png', fullPage: true });
});

test('responsive design on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
  await page.goto('/');
  
  // Check that the page is responsive
  await expect(page).toHaveTitle(/RisCura/);
  
  // Take a screenshot for mobile view
  await page.screenshot({ path: 'mobile-homepage.png', fullPage: true });
});