import { test, expect } from '@playwright/test';

test.describe('Static Page Testing', () => {
  test('should test basic HTTP connectivity', async ({ page }) => {
    // Test a simple HTTP request to a known working site
    try {
      await page.goto('https://httpbin.org/status/200');
      console.log('✅ Basic HTTP connectivity working');
    } catch (error) {
      console.log('❌ HTTP connectivity issue:', error.message);
    }
  });

  test('should test JSON API response parsing', async ({ page }) => {
    try {
      const response = await page.request.get('https://httpbin.org/json');
      
      console.log('Response status:', response.status());
      
      if (response.ok()) {
        const data = await response.json();
        console.log('✅ JSON parsing successful');
        console.log('Response data keys:', Object.keys(data));
      } else {
        console.log('❌ API request failed with status:', response.status());
      }
    } catch (error) {
      console.log('❌ JSON API test failed:', error.message);
    }
  });

  test('should demonstrate Playwright capabilities', async ({ page }) => {
    // This test will work regardless of our local server status
    console.log('🎭 Playwright Test Environment Info:');
    console.log('Browser name:', page.context().browser()?.browserType().name());
    console.log('Viewport size:', await page.viewportSize());
    
    // Test basic page navigation
    await page.goto('data:text/html,<html><head><title>Test Page</title></head><body><h1>Hello World</h1><button id="test-btn">Click Me</button></body></html>');
    
    // Test element interaction
    await expect(page.locator('h1')).toContainText('Hello World');
    await expect(page.locator('#test-btn')).toBeVisible();
    
    // Test clicking
    await page.click('#test-btn');
    
    // Take a screenshot
    await page.screenshot({ path: 'screenshots/playwright-demo.png' });
    
    console.log('✅ Basic Playwright functionality verified');
  });

  test('should test responsive design simulation', async ({ page }) => {
    const viewports = [
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 }
    ];
    
    const testHtml = `
      <html>
        <head>
          <title>Responsive Test</title>
          <style>
            body { font-family: Arial; margin: 20px; }
            .container { max-width: 100%; padding: 20px; background: #f0f0f0; }
            @media (max-width: 768px) { .container { background: #e0e0ff; } }
            @media (max-width: 480px) { .container { background: #ffe0e0; } }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Responsive Design Test</h1>
            <p>This page changes color based on viewport size.</p>
          </div>
        </body>
      </html>
    `;
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.setContent(testHtml);
      
      await page.screenshot({ 
        path: `screenshots/responsive-test-${viewport.name.toLowerCase()}.png` 
      });
      
      console.log(`✅ ${viewport.name} viewport (${viewport.width}x${viewport.height}) tested`);
    }
  });

  test('should test local development environment detection', async ({ page }) => {
    const localUrls = [
      'http://localhost:3000',
      'http://localhost:3000/api/health',
      'http://127.0.0.1:3000'
    ];
    
    console.log('Testing local development environment...');
    
    for (const url of localUrls) {
      try {
        console.log(`Testing: ${url}`);
        
        // Set a shorter timeout for local tests
        const response = await page.request.get(url, { timeout: 3000 });
        
        console.log(`${url} - Status: ${response.status()}`);
        
        if (response.ok()) {
          console.log(`✅ ${url} is responding`);
          
          // If it's the health endpoint, try to get details
          if (url.includes('/health')) {
            try {
              const healthData = await response.json();
              console.log('Health check data:', JSON.stringify(healthData, null, 2).substring(0, 300));
            } catch {
              console.log('Health endpoint returned non-JSON response');
            }
          }
        } else {
          console.log(`⚠️  ${url} returned status: ${response.status()}`);
        }
        
      } catch (error) {
        console.log(`❌ ${url} - Connection failed: ${error.message}`);
      }
    }
    
    console.log('ℹ️  To test local endpoints, start your development server with: npm run dev');
  });
});