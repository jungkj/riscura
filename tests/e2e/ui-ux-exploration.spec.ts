import { test, expect } from '@playwright/test';

// UI/UX Analysis Results Storage
let analysisResults = {
  homepage: {},
  navigation: {},
  responsive: {},
  accessibility: {},
  performance: {},
  userFlow: {},
  recommendations: []
};

test.describe('UI/UX Exploration and Analysis', () => {
  test.beforeAll(async () => {
    console.log('🎨 Starting comprehensive UI/UX analysis of Riscura website...\n');
  });

  test('Homepage First Impression Analysis', async ({ page }) => {
    console.log('📱 HOMEPAGE ANALYSIS');
    console.log('='.repeat(50));
    
    // Navigate to homepage with performance tracking
    const startTime = Date.now();
    await page.goto('/', { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;
    
    console.log(`⏱️  Page Load Time: ${loadTime}ms`);
    
    // Take full page screenshot
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/homepage-full.png', 
      fullPage: true 
    });
    
    // Analyze page title and meta
    const title = await page.title();
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    
    console.log(`📝 Title: "${title}"`);
    console.log(`📝 Description: "${description || 'Not found'}"`);
    
    // Check for hero section
    const heroSection = page.locator('h1, [data-testid="hero"], .hero, [class*="hero"]');
    const heroCount = await heroSection.count();
    
    if (heroCount > 0) {
      const heroText = await heroSection.first().textContent();
      console.log(`🎯 Hero Section: "${heroText?.substring(0, 100)}..."`);
      
      // Take hero section screenshot
      await heroSection.first().screenshot({ path: 'tests/e2e/screenshots/hero-section.png' });
    } else {
      console.log('⚠️  No clear hero section found');
    }
    
    // Check for navigation
    const navElements = page.locator('nav, [role="navigation"], .nav, .navigation');
    const navCount = await navElements.count();
    console.log(`🧭 Navigation Elements: ${navCount} found`);
    
    // Check for call-to-action buttons
    const ctaButtons = page.locator('button:has-text("Get Started"), button:has-text("Start"), button:has-text("Sign Up"), a:has-text("Get Started")');
    const ctaCount = await ctaButtons.count();
    console.log(`🎯 CTA Buttons: ${ctaCount} found`);
    
    if (ctaCount > 0) {
      for (let i = 0; i < Math.min(ctaCount, 3); i++) {
        const ctaText = await ctaButtons.nth(i).textContent();
        console.log(`   CTA ${i + 1}: "${ctaText}"`);
      }
    }
    
    // Check for branding/logo
    const logoElements = page.locator('img[alt*="logo"], img[alt*="Logo"], [data-testid="logo"], .logo');
    const logoCount = await logoElements.count();
    console.log(`🏷️  Logo Elements: ${logoCount} found`);
    
    // Analyze color scheme by checking computed styles
    const bodyBg = await page.locator('body').evaluate(el => window.getComputedStyle(el).backgroundColor);
    console.log(`🎨 Body Background: ${bodyBg}`);
    
    console.log('\\n');
  });

  test('Navigation Structure Analysis', async ({ page }) => {
    console.log('🧭 NAVIGATION ANALYSIS');
    console.log('='.repeat(50));
    
    await page.goto('/');
    
    // Find all navigation elements
    const navLinks = page.locator('nav a, [role="navigation"] a, .nav a, .navigation a');
    const linkCount = await navLinks.count();
    
    console.log(`🔗 Total Navigation Links: ${linkCount}`);
    
    // Analyze each navigation link
    const navStructure = [];
    for (let i = 0; i < Math.min(linkCount, 10); i++) {
      const link = navLinks.nth(i);
      const text = await link.textContent();
      const href = await link.getAttribute('href');
      const isExternal = href?.startsWith('http') && !href.includes('localhost');
      
      navStructure.push({
        text: text?.trim(),
        href,
        external: isExternal
      });
      
      console.log(`   ${i + 1}. "${text?.trim()}" -> ${href} ${isExternal ? '(external)' : ''}`);
    }
    
    // Check for mobile menu
    const mobileMenuTrigger = page.locator('[aria-label*="menu"], .menu-toggle, .hamburger, [data-testid="mobile-menu"]');
    const mobileMenuCount = await mobileMenuTrigger.count();
    console.log(`📱 Mobile Menu Triggers: ${mobileMenuCount} found`);
    
    // Test navigation responsiveness
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile
    await page.screenshot({ path: 'tests/e2e/screenshots/navigation-mobile.png' });
    
    await page.setViewportSize({ width: 1920, height: 1080 }); // Desktop
    await page.screenshot({ path: 'tests/e2e/screenshots/navigation-desktop.png' });
    
    console.log('\\n');
  });

  test('Authentication Flow UX Analysis', async ({ page }) => {
    console.log('🔐 AUTHENTICATION UX ANALYSIS');
    console.log('='.repeat(50));
    
    // Try to find login/auth links
    await page.goto('/');
    
    const authLinks = page.locator('a:has-text("Login"), a:has-text("Sign In"), a:has-text("Sign Up"), button:has-text("Login")');
    const authLinkCount = await authLinks.count();
    
    console.log(`🚪 Authentication Entry Points: ${authLinkCount} found`);
    
    // Test login page if accessible
    const loginUrls = ['/auth/login', '/login', '/signin'];
    
    for (const url of loginUrls) {
      try {
        console.log(`\\n🔍 Testing: ${url}`);
        await page.goto(url, { timeout: 5000 });
        
        const currentUrl = page.url();
        console.log(`   Final URL: ${currentUrl}`);
        
        // Analyze login form
        const emailField = page.locator('input[type="email"], input[name="email"]');
        const passwordField = page.locator('input[type="password"], input[name="password"]');
        const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
        
        const hasEmail = await emailField.count() > 0;
        const hasPassword = await passwordField.count() > 0;
        const hasSubmit = await submitButton.count() > 0;
        
        console.log(`   📧 Email Field: ${hasEmail ? '✅' : '❌'}`);
        console.log(`   🔒 Password Field: ${hasPassword ? '✅' : '❌'}`);
        console.log(`   📤 Submit Button: ${hasSubmit ? '✅' : '❌'}`);
        
        // Check for OAuth options
        const googleButton = page.locator('button:has-text("Google"), a:has-text("Google"), [data-testid="google"]');
        const hasGoogle = await googleButton.count() > 0;
        console.log(`   🔍 Google OAuth: ${hasGoogle ? '✅' : '❌'}`);
        
        // Check for "Remember Me" and "Forgot Password"
        const rememberMe = page.locator('input[type="checkbox"], label:has-text("Remember")');
        const forgotPassword = page.locator('a:has-text("Forgot"), a:has-text("Reset")');
        
        const hasRememberMe = await rememberMe.count() > 0;
        const hasForgotPassword = await forgotPassword.count() > 0;
        
        console.log(`   💭 Remember Me: ${hasRememberMe ? '✅' : '❌'}`);
        console.log(`   🔄 Forgot Password: ${hasForgotPassword ? '✅' : '❌'}`);
        
        // Take screenshot of login page
        await page.screenshot({ path: `tests/e2e/screenshots/login-page-${url.replace('/', '_')}.png` });
        
        break; // If we successfully loaded a login page, stop trying others
        
      } catch (error) {
        console.log(`   ❌ Could not access ${url}: ${error.message}`);
      }
    }
    
    console.log('\\n');
  });

  test('Responsive Design Analysis', async ({ page }) => {
    console.log('📱 RESPONSIVE DESIGN ANALYSIS');
    console.log('='.repeat(50));
    
    const viewports = [
      { name: 'Mobile Portrait', width: 375, height: 667 },
      { name: 'Mobile Landscape', width: 667, height: 375 },
      { name: 'Tablet Portrait', width: 768, height: 1024 },
      { name: 'Tablet Landscape', width: 1024, height: 768 },
      { name: 'Desktop Small', width: 1366, height: 768 },
      { name: 'Desktop Large', width: 1920, height: 1080 },
    ];
    
    await page.goto('/');
    
    for (const viewport of viewports) {
      console.log(`\\n📐 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(1000); // Allow layout to adjust
      
      // Check for horizontal scrolling (bad UX)
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      const hasHorizontalScroll = scrollWidth > clientWidth;
      
      console.log(`   📏 Viewport: ${clientWidth}px, Content: ${scrollWidth}px`);
      console.log(`   ➡️  Horizontal Scroll: ${hasHorizontalScroll ? '⚠️  YES (potential issue)' : '✅ NO'}`);
      
      // Check if text is readable (not too small)
      const bodyFontSize = await page.locator('body').evaluate(el => 
        window.getComputedStyle(el).fontSize
      );
      console.log(`   📝 Body Font Size: ${bodyFontSize}`);
      
      // Check for touch-friendly elements on mobile
      if (viewport.width <= 768) {
        const buttons = page.locator('button, a');
        const buttonCount = await buttons.count();
        
        if (buttonCount > 0) {
          const firstButtonSize = await buttons.first().evaluate(el => {
            const rect = el.getBoundingClientRect();
            return { width: rect.width, height: rect.height };
          });
          
          const isTouchFriendly = firstButtonSize.height >= 44; // 44px is recommended minimum
          console.log(`   👆 Button Size: ${firstButtonSize.width.toFixed(0)}x${firstButtonSize.height.toFixed(0)}px ${isTouchFriendly ? '✅' : '⚠️  (too small)'}`);
        }
      }
      
      // Take screenshot
      const filename = `responsive-${viewport.name.toLowerCase().replace(/\s+/g, '-')}-${viewport.width}x${viewport.height}.png`;
      await page.screenshot({ path: `tests/e2e/screenshots/${filename}` });
    }
    
    console.log('\\n');
  });

  test('Content and Typography Analysis', async ({ page }) => {
    console.log('📝 CONTENT & TYPOGRAPHY ANALYSIS');
    console.log('='.repeat(50));
    
    await page.goto('/');
    
    // Analyze heading hierarchy
    const headings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    
    for (const heading of headings) {
      const elements = page.locator(heading);
      const count = await elements.count();
      
      if (count > 0) {
        console.log(`📰 ${heading.toUpperCase()}: ${count} found`);
        
        for (let i = 0; i < Math.min(count, 3); i++) {
          const text = await elements.nth(i).textContent();
          const fontSize = await elements.nth(i).evaluate(el => 
            window.getComputedStyle(el).fontSize
          );
          console.log(`   "${text?.substring(0, 60)}..." (${fontSize})`);
        }
      }
    }
    
    // Check for proper contrast and readability
    const paragraphs = page.locator('p');
    const pCount = await paragraphs.count();
    console.log(`\\n📄 Paragraphs: ${pCount} found`);
    
    if (pCount > 0) {
      const firstParagraph = paragraphs.first();
      const styles = await firstParagraph.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          fontSize: computed.fontSize,
          lineHeight: computed.lineHeight,
          color: computed.color,
          backgroundColor: computed.backgroundColor
        };
      });
      
      console.log(`📖 Text Styles:`);
      console.log(`   Font Size: ${styles.fontSize}`);
      console.log(`   Line Height: ${styles.lineHeight}`);
      console.log(`   Color: ${styles.color}`);
      console.log(`   Background: ${styles.backgroundColor}`);
    }
    
    console.log('\\n');
  });

  test('Performance and Loading Analysis', async ({ page }) => {
    console.log('⚡ PERFORMANCE ANALYSIS');
    console.log('='.repeat(50));
    
    // Test page load performance
    const startTime = Date.now();
    await page.goto('/', { waitUntil: 'load' });
    const loadTime = Date.now() - startTime;
    
    console.log(`⏱️  Initial Load Time: ${loadTime}ms`);
    
    // Wait for network idle to measure full load
    const networkIdleStart = Date.now();
    await page.waitForLoadState('networkidle');
    const networkIdleTime = Date.now() - networkIdleStart;
    
    console.log(`🌐 Network Idle Time: ${networkIdleTime}ms`);
    
    // Check for loading states
    const loadingElements = page.locator('[data-testid="loading"], .loading, .spinner, [aria-label*="loading"]');
    const loadingCount = await loadingElements.count();
    console.log(`⏳ Loading Indicators: ${loadingCount} found`);
    
    // Check for error states
    const errorElements = page.locator('[data-testid="error"], .error, [role="alert"]');
    const errorCount = await errorElements.count();
    console.log(`❌ Error Indicators: ${errorCount} found`);
    
    // Check image optimization
    const images = page.locator('img');
    const imageCount = await images.count();
    console.log(`🖼️  Images: ${imageCount} found`);
    
    if (imageCount > 0) {
      const firstImageSrc = await images.first().getAttribute('src');
      const hasAlt = await images.first().getAttribute('alt') !== null;
      const hasLazyLoading = await images.first().getAttribute('loading') === 'lazy';
      
      console.log(`   First Image: ${firstImageSrc}`);
      console.log(`   Alt Text: ${hasAlt ? '✅' : '⚠️  Missing'}`);
      console.log(`   Lazy Loading: ${hasLazyLoading ? '✅' : '⚠️  Not implemented'}`);
    }
    
    console.log('\\n');
  });

  test('Accessibility Analysis', async ({ page }) => {
    console.log('♿ ACCESSIBILITY ANALYSIS');
    console.log('='.repeat(50));
    
    await page.goto('/');
    
    // Check for semantic HTML
    const semanticElements = ['main', 'nav', 'header', 'footer', 'section', 'article', 'aside'];
    
    for (const element of semanticElements) {
      const count = await page.locator(element).count();
      console.log(`🏷️  <${element}>: ${count} ${count > 0 ? '✅' : '❌'}`);
    }
    
    // Check for ARIA landmarks
    const landmarks = page.locator('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"]');
    const landmarkCount = await landmarks.count();
    console.log(`\\n🎯 ARIA Landmarks: ${landmarkCount} found`);
    
    // Check for keyboard navigation
    const interactiveElements = page.locator('button, a, input, select, textarea, [tabindex]');
    const interactiveCount = await interactiveElements.count();
    console.log(`⌨️  Interactive Elements: ${interactiveCount} found`);
    
    // Test keyboard navigation on first few elements
    if (interactiveCount > 0) {
      console.log(`\\n⌨️  Testing Keyboard Navigation:`);
      
      for (let i = 0; i < Math.min(interactiveCount, 5); i++) {
        const element = interactiveElements.nth(i);
        const tagName = await element.evaluate(el => el.tagName.toLowerCase());
        const text = await element.textContent();
        const hasFocus = await element.evaluate(el => {
          el.focus();
          return document.activeElement === el;
        });
        
        console.log(`   ${i + 1}. <${tagName}> "${text?.substring(0, 30)}..." ${hasFocus ? '✅' : '⚠️  No focus'}`);
      }
    }
    
    // Check for alt text on images
    const imagesWithoutAlt = page.locator('img:not([alt]), img[alt=""]');
    const missingAltCount = await imagesWithoutAlt.count();
    console.log(`\\n🖼️  Images without Alt Text: ${missingAltCount} ${missingAltCount === 0 ? '✅' : '⚠️  Issue found'}`);
    
    // Check for color contrast (basic check)
    const textElements = page.locator('p, h1, h2, h3, h4, h5, h6, span, div');
    const textCount = await textElements.count();
    
    if (textCount > 0) {
      const textColor = await textElements.first().evaluate(el => 
        window.getComputedStyle(el).color
      );
      const backgroundColor = await textElements.first().evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      
      console.log(`\\n🎨 Color Analysis:`);
      console.log(`   Text Color: ${textColor}`);
      console.log(`   Background: ${backgroundColor}`);
    }
    
    console.log('\\n');
  });

  test.afterAll(async () => {
    console.log('📊 UI/UX ANALYSIS SUMMARY');
    console.log('='.repeat(50));
    console.log('');
    console.log('📸 Screenshots saved to: tests/e2e/screenshots/');
    console.log('');
    console.log('🔍 KEY FINDINGS:');
    console.log('   • Homepage structure and hero section analyzed');
    console.log('   • Navigation patterns documented');
    console.log('   • Authentication flow examined');
    console.log('   • Responsive design tested across 6 viewport sizes');
    console.log('   • Content hierarchy and typography reviewed');
    console.log('   • Performance metrics collected');
    console.log('   • Accessibility compliance checked');
    console.log('');
    console.log('📋 RECOMMENDATIONS will be generated based on findings above.');
    console.log('');
    console.log('✅ UI/UX Analysis Complete!');
  });
});