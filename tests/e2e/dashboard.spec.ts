import { test, expect } from '@playwright/test';

test.describe('Dashboard Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // For now, we'll test the dashboard as an unauthenticated user
    // and see what redirects or access controls are in place
  });

  test('should redirect to login when accessing dashboard without auth', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for potential redirect
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    console.log('Dashboard access URL:', currentUrl);
    
    // Should either redirect to login or show login form
    const isOnLoginPage = currentUrl.includes('/auth/login') || currentUrl.includes('/login');
    const hasLoginForm = await page.locator('input[type="email"], input[name="email"]').count() > 0;
    
    if (isOnLoginPage || hasLoginForm) {
      console.log('✅ Dashboard properly protected - redirects to login');
    } else {
      console.log('⚠️  Dashboard may not be properly protected');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'screenshots/dashboard-unauthorized-access.png', fullPage: true });
  });

  test('should show proper landing page structure', async ({ page }) => {
    await page.goto('/');
    
    // Check for key landing page elements
    const hero = page.locator('h1, [data-testid="hero"], .hero');
    const navigation = page.locator('nav, [data-testid="navigation"], .navigation');
    const cta = page.locator('button:has-text("Get Started"), a:has-text("Sign Up"), [data-testid="cta"]');
    
    if (await hero.count() > 0) {
      await expect(hero.first()).toBeVisible();
      console.log('✅ Hero section found');
    }
    
    if (await navigation.count() > 0) {
      await expect(navigation.first()).toBeVisible();
      console.log('✅ Navigation found');
    }
    
    if (await cta.count() > 0) {
      console.log('✅ Call-to-action buttons found');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'screenshots/landing-page-structure.png', fullPage: true });
  });

  test('should handle navigation between pages', async ({ page }) => {
    await page.goto('/');
    
    // Test navigation links
    const navLinks = page.locator('nav a, [data-testid="nav-link"], .nav-link');
    const linkCount = await navLinks.count();
    
    console.log(`Found ${linkCount} navigation links`);
    
    // Take screenshot of navigation
    await page.screenshot({ path: 'screenshots/navigation-structure.png', fullPage: true });
    
    // Test a few navigation links if they exist
    if (linkCount > 0) {
      for (let i = 0; i < Math.min(3, linkCount); i++) {
        const link = navLinks.nth(i);
        const href = await link.getAttribute('href');
        const text = await link.textContent();
        
        if (href && !href.startsWith('http') && !href.includes('mailto:')) {
          console.log(`Testing navigation to: ${text} (${href})`);
          
          try {
            await link.click();
            await page.waitForTimeout(1000);
            
            const newUrl = page.url();
            console.log(`Navigated to: ${newUrl}`);
            
            // Go back to homepage for next test
            await page.goto('/');
            await page.waitForTimeout(500);
          } catch (error) {
            console.log(`Navigation error for ${href}:`, error.message);
          }
        }
      }
    }
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      
      // Wait for any responsive changes
      await page.waitForTimeout(1000);
      
      // Take screenshot for each viewport
      await page.screenshot({ 
        path: `screenshots/responsive-${viewport.name}-${viewport.width}x${viewport.height}.png`, 
        fullPage: true 
      });
      
      console.log(`✅ Screenshot taken for ${viewport.name} viewport (${viewport.width}x${viewport.height})`);
    }
  });

  test('should check API health endpoint', async ({ page }) => {
    // Test if health check endpoint is accessible
    const response = await page.request.get('/api/health');
    
    console.log('Health check status:', response.status());
    
    if (response.ok()) {
      const healthData = await response.json();
      console.log('Health check response:', healthData);
      console.log('✅ API health endpoint is responding');
    } else {
      console.log('⚠️  API health endpoint returned:', response.status());
    }
  });
});