import { test, expect } from '@playwright/test';

test.describe('API Endpoints Testing', () => {
  test('should test public API endpoints', async ({ page }) => {
    const publicEndpoints = [
      '/api/health',
      '/api/ping'
    ];
    
    for (const endpoint of publicEndpoints) {
      console.log(`Testing endpoint: ${endpoint}`);
      
      const response = await page.request.get(endpoint);
      
      console.log(`${endpoint} - Status: ${response.status()}`);
      
      if (response.ok()) {
        try {
          const data = await response.json();
          console.log(`${endpoint} - Response:`, JSON.stringify(data, null, 2).substring(0, 200));
        } catch {
          const text = await response.text();
          console.log(`${endpoint} - Text response:`, text.substring(0, 200));
        }
      } else {
        console.log(`${endpoint} - Error response:`, response.statusText());
      }
    }
  });

  test('should test protected API endpoints (expect auth required)', async ({ page }) => {
    const protectedEndpoints = [
      '/api/users/me',
      '/api/dashboard',
      '/api/risks',
      '/api/controls',
      '/api/compliance/dashboard'
    ];
    
    for (const endpoint of protectedEndpoints) {
      console.log(`Testing protected endpoint: ${endpoint}`);
      
      const response = await page.request.get(endpoint);
      
      console.log(`${endpoint} - Status: ${response.status()}`);
      
      // Protected endpoints should return 401/403 or redirect
      if (response.status() === 401 || response.status() === 403) {
        console.log(`✅ ${endpoint} - Properly protected (${response.status()})`);
      } else if (response.status() >= 200 && response.status() < 300) {
        console.log(`⚠️  ${endpoint} - May not be properly protected (${response.status()})`);
      } else {
        console.log(`ℹ️  ${endpoint} - Status: ${response.status()}`);
      }
      
      try {
        const data = await response.json();
        console.log(`${endpoint} - Response snippet:`, JSON.stringify(data, null, 2).substring(0, 100));
      } catch {
        // Not JSON response
      }
    }
  });

  test('should test NextAuth endpoints', async ({ page }) => {
    const authEndpoints = [
      '/api/auth/session',
      '/api/auth/providers',
      '/api/auth/csrf'
    ];
    
    for (const endpoint of authEndpoints) {
      console.log(`Testing NextAuth endpoint: ${endpoint}`);
      
      const response = await page.request.get(endpoint);
      
      console.log(`${endpoint} - Status: ${response.status()}`);
      
      if (response.ok()) {
        try {
          const data = await response.json();
          console.log(`${endpoint} - Response:`, JSON.stringify(data, null, 2).substring(0, 200));
          
          // Special checks for specific endpoints
          if (endpoint === '/api/auth/providers' && data.google) {
            console.log('✅ Google OAuth provider is configured');
          }
          
          if (endpoint === '/api/auth/session') {
            if (data.user) {
              console.log('✅ User session found');
            } else {
              console.log('ℹ️  No active session (expected for unauthenticated test)');
            }
          }
        } catch {
          const text = await response.text();
          console.log(`${endpoint} - Text response:`, text.substring(0, 200));
        }
      } else {
        console.log(`${endpoint} - Error: ${response.status()}`);
      }
    }
  });

  test('should test API response formats', async ({ page }) => {
    // Test that APIs return proper JSON format with consistent structure
    const apiEndpoints = [
      '/api/health'
    ];
    
    for (const endpoint of apiEndpoints) {
      const response = await page.request.get(endpoint);
      
      if (response.ok()) {
        const contentType = response.headers()['content-type'];
        console.log(`${endpoint} - Content-Type: ${contentType}`);
        
        if (contentType && contentType.includes('application/json')) {
          console.log(`✅ ${endpoint} - Returns JSON`);
          
          const data = await response.json();
          
          // Check for common response patterns
          if (data.status || data.success !== undefined || data.error !== undefined) {
            console.log(`✅ ${endpoint} - Has proper response structure`);
          } else {
            console.log(`⚠️  ${endpoint} - May not follow standard response format`);
          }
          
          // Check for timestamp or version info
          if (data.timestamp || data.version) {
            console.log(`✅ ${endpoint} - Includes metadata (timestamp/version)`);
          }
        } else {
          console.log(`⚠️  ${endpoint} - Does not return JSON`);
        }
      }
    }
  });

  test('should test CORS and security headers', async ({ page }) => {
    const response = await page.request.get('/api/health');
    const headers = response.headers();
    
    console.log('Security headers check:');
    
    const securityHeaders = [
      'x-frame-options',
      'x-content-type-options',
      'strict-transport-security',
      'content-security-policy',
      'x-xss-protection',
      'referrer-policy'
    ];
    
    for (const header of securityHeaders) {
      if (headers[header]) {
        console.log(`✅ ${header}: ${headers[header]}`);
      } else {
        console.log(`⚠️  Missing security header: ${header}`);
      }
    }
    
    // Check CORS headers if present
    if (headers['access-control-allow-origin']) {
      console.log(`ℹ️  CORS allowed origin: ${headers['access-control-allow-origin']}`);
    }
    
    // Check cache control
    if (headers['cache-control']) {
      console.log(`ℹ️  Cache control: ${headers['cache-control']}`);
    }
  });
});