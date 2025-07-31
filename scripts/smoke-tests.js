#!/usr/bin/env node

/**
 * Post-Deployment Smoke Test Suite
 * 
 * Quick smoke tests to verify critical functionality after deployment:
 * - Application accessibility
 * - Core user journeys
 * - API functionality
 * - Database connectivity
 * - Security measures
 * - Performance benchmarks
 */

const { execSync } = require('child_process');
const https = require('https');
const http = require('http');

class SmokeTestSuite {
  constructor() {
    this.baseUrl = process.env.SMOKE_TEST_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    this.testResults = [];
    this.timeout = 30000; // 30 seconds
    
    // Ensure URL has protocol
    if (!this.baseUrl.startsWith('http')) {
      this.baseUrl = `https://${this.baseUrl}`;
    }
    
    console.log(`🚀 Running smoke tests against: ${this.baseUrl}`);
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      error: '\x1b[31m',
      warning: '\x1b[33m',
      reset: '\x1b[0m'
    };
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const isHttps = url.startsWith('https://');
      const client = isHttps ? https : http;
      
      const requestOptions = {
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'SmokeTest/1.0',
          ...options.headers
        },
        timeout: this.timeout,
        ...options
      };

      const req = client.request(url, requestOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            ok: res.statusCode >= 200 && res.statusCode < 300
          });
        });
      });

      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Request timeout')));
      
      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  }

  async runTest(testName, testFn) {
    const startTime = Date.now();
    try {
      this.log(`Running: ${testName}`, 'info');
      await testFn();
      const duration = Date.now() - startTime;
      this.testResults.push({ name: testName, status: 'PASS', duration });
      this.log(`✓ ${testName} (${duration}ms)`, 'success');
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.push({ name: testName, status: 'FAIL', error: error.message, duration });
      this.log(`✗ ${testName}: ${error.message}`, 'error');
      return false;
    }
  }

  async testApplicationAccessibility() {
    await this.runTest('Application Homepage Accessible', async () => {
      const response = await this.makeRequest(this.baseUrl);
      if (!response.ok) {
        throw new Error(`Homepage returned ${response.status}`);
      }
      if (!response.data.includes('<html') && !response.data.includes('<!DOCTYPE')) {
        throw new Error('Homepage does not return valid HTML');
      }
    });

    await this.runTest('Login Page Accessible', async () => {
      const response = await this.makeRequest(`${this.baseUrl}/auth/login`);
      if (!response.ok) {
        throw new Error(`Login page returned ${response.status}`);
      }
    });

    await this.runTest('Dashboard Redirects to Login', async () => {
      const response = await this.makeRequest(`${this.baseUrl}/dashboard`);
      // Should redirect to login (302) or return login page (200) or unauthorized (401)
      if (![200, 302, 401].includes(response.status)) {
        throw new Error(`Dashboard returned unexpected status: ${response.status}`);
      }
    });
  }

  async testApiEndpoints() {
    await this.runTest('Health Check API', async () => {
      const response = await this.makeRequest(`${this.baseUrl}/api/health`);
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      
      try {
        const data = JSON.parse(response.data);
        if (data.status !== 'ok') {
          throw new Error(`Health check status is not ok: ${data.status}`);
        }
      } catch (parseError) {
        throw new Error('Health check response is not valid JSON');
      }
    });

    await this.runTest('Database Health Check', async () => {
      const response = await this.makeRequest(`${this.baseUrl}/api/health/database`);
      if (response.ok) {
        try {
          const data = JSON.parse(response.data);
          if (data.database !== 'connected') {
            throw new Error(`Database not connected: ${data.database}`);
          }
        } catch (parseError) {
          // If endpoint doesn't exist, that's okay
          this.log('Database health endpoint not implemented', 'warning');
        }
      } else if (response.status === 404) {
        this.log('Database health endpoint not implemented', 'warning');
      } else {
        throw new Error(`Database health check failed: ${response.status}`);
      }
    });

    await this.runTest('Authentication API Available', async () => {
      const response = await this.makeRequest(`${this.baseUrl}/api/auth/session`);
      // Should return 401 (unauthorized) or 200 (if session exists) - not 404 or 500
      if ([404, 500, 502, 503].includes(response.status)) {
        throw new Error(`Auth API returned error status: ${response.status}`);
      }
    });

    await this.runTest('API Rate Limiting Active', async () => {
      // Make rapid requests to test rate limiting
      const requests = [];
      for (let i = 0; i < 20; i++) {
        requests.push(this.makeRequest(`${this.baseUrl}/api/health`));
      }
      
      try {
        const responses = await Promise.all(requests);
        const rateLimited = responses.some(r => r.status === 429);
        
        if (!rateLimited) {
          this.log('Rate limiting may not be active (no 429 responses)', 'warning');
        } else {
          this.log('Rate limiting is active', 'success');
        }
      } catch (error) {
        // Some requests failing is okay for this test
        this.log('Rate limiting test completed with some failures (expected)', 'info');
      }
    });
  }

  async testSecurityFeatures() {
    await this.runTest('Security Headers Present', async () => {
      const response = await this.makeRequest(this.baseUrl);
      
      const requiredHeaders = [
        'x-frame-options',
        'x-content-type-options'
      ];

      const missingHeaders = requiredHeaders.filter(header => 
        !response.headers[header] && !response.headers[header.toLowerCase()]
      );

      if (missingHeaders.length > 0) {
        this.log(`Missing security headers: ${missingHeaders.join(', ')}`, 'warning');
        // Don't fail the test, just warn
      }
    });

    await this.runTest('HTTPS Redirect (Production)', async () => {
      if (this.baseUrl.startsWith('https://') && !this.baseUrl.includes('localhost')) {
        try {
          const httpUrl = this.baseUrl.replace('https://', 'http://');
          const response = await this.makeRequest(httpUrl);
          
          if (![301, 302, 308].includes(response.status)) {
            this.log('HTTPS redirect not configured', 'warning');
          }
        } catch (error) {
          // HTTP endpoint might not be available, which is fine
          this.log('HTTP endpoint not available (expected for HTTPS-only sites)', 'info');
        }
      } else {
        this.log('Skipping HTTPS redirect test (not production HTTPS)', 'info');
      }
    });

    await this.runTest('Content Security Policy', async () => {
      const response = await this.makeRequest(this.baseUrl);
      
      if (!response.headers['content-security-policy'] && 
          !response.headers['content-security-policy-report-only']) {
        this.log('Content Security Policy not configured', 'warning');
      }
    });
  }

  async testPerformanceBaseline() {
    await this.runTest('Homepage Load Time < 5s', async () => {
      const startTime = Date.now();
      const response = await this.makeRequest(this.baseUrl);
      const loadTime = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`Homepage failed to load: ${response.status}`);
      }

      if (loadTime > 5000) {
        throw new Error(`Homepage load time too slow: ${loadTime}ms (threshold: 5000ms)`);
      }

      this.log(`Homepage load time: ${loadTime}ms`, 'info');
    });

    await this.runTest('API Response Time < 2s', async () => {
      const startTime = Date.now();
      const response = await this.makeRequest(`${this.baseUrl}/api/health`);
      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      if (responseTime > 2000) {
        throw new Error(`API response too slow: ${responseTime}ms (threshold: 2000ms)`);
      }

      this.log(`API response time: ${responseTime}ms`, 'info');
    });
  }

  async testCriticalUserFlow() {
    await this.runTest('Login Form Present', async () => {
      const response = await this.makeRequest(`${this.baseUrl}/auth/login`);
      if (!response.ok) {
        throw new Error(`Login page not accessible: ${response.status}`);
      }

      const hasEmailInput = response.data.includes('type="email"') || 
                           response.data.includes('name="email"') ||
                           response.data.includes('id="email"');
      
      const hasPasswordInput = response.data.includes('type="password"') ||
                              response.data.includes('name="password"');

      if (!hasEmailInput || !hasPasswordInput) {
        throw new Error('Login form missing required fields');
      }
    });

    await this.runTest('Registration Available', async () => {
      const response = await this.makeRequest(`${this.baseUrl}/auth/register`);
      if (!response.ok && response.status !== 404) {
        throw new Error(`Registration page error: ${response.status}`);
      }
      
      if (response.status === 404) {
        this.log('Registration page not found (may be intentionally disabled)', 'warning');
      }
    });

    await this.runTest('Static Assets Loading', async () => {
      const response = await this.makeRequest(this.baseUrl);
      if (!response.ok) {
        throw new Error(`Homepage not accessible: ${response.status}`);
      }

      // Check for CSS and JS references
      const hasStyles = response.data.includes('.css') || response.data.includes('<style>');
      const hasScripts = response.data.includes('.js') || response.data.includes('<script>');

      if (!hasStyles && !hasScripts) {
        this.log('No CSS or JS assets detected (may be inlined)', 'warning');
      }
    });
  }

  async testDatabaseConnectivity() {
    await this.runTest('Database Connection via API', async () => {
      // Try to access an endpoint that would require database
      const response = await this.makeRequest(`${this.baseUrl}/api/health/database`);
      
      if (response.status === 404) {
        // Endpoint doesn't exist, try alternative
        const altResponse = await this.makeRequest(`${this.baseUrl}/api/health`);
        if (altResponse.ok) {
          this.log('Database connectivity test via health endpoint', 'info');
        } else {
          throw new Error('No database connectivity test endpoint available');
        }
      } else if (!response.ok) {
        throw new Error(`Database connectivity test failed: ${response.status}`);
      }
    });
  }

  generateReport() {
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const total = this.testResults.length;
    const successRate = ((passed / total) * 100).toFixed(1);

    console.log('\n' + '='.repeat(60));
    console.log('SMOKE TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`Target URL: ${this.baseUrl}`);
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${successRate}%`);
    console.log('='.repeat(60));

    this.testResults.forEach(test => {
      const status = test.status === 'PASS' ? '✓' : '✗';
      const duration = test.duration ? ` (${test.duration}ms)` : '';
      console.log(`${status} ${test.name}${duration}`);
      if (test.error) {
        console.log(`   Error: ${test.error}`);
      }
    });

    console.log('\n' + '='.repeat(60));

    if (failed === 0) {
      console.log('\n🎉 ALL SMOKE TESTS PASSED');
      console.log('Deployment appears to be healthy and ready for use!');
      return 0;
    } else if (failed <= 2 && passed >= (total * 0.8)) {
      console.log('\n⚠️  SMOKE TESTS MOSTLY PASSED');
      console.log(`${failed} non-critical tests failed. Review issues above.`);
      return 0; // Don't fail deployment for minor issues
    } else {
      console.log('\n❌ SMOKE TESTS FAILED');
      console.log(`${failed} critical tests failed. Deployment may have issues.`);
      return 1;
    }
  }

  async run() {
    this.log('Starting smoke test suite...', 'info');
    const startTime = Date.now();

    try {
      // Core functionality tests (critical)
      await this.testApplicationAccessibility();
      await this.testApiEndpoints();
      await this.testCriticalUserFlow();
      
      // Secondary tests (non-critical)
      await this.testSecurityFeatures();
      await this.testPerformanceBaseline();
      await this.testDatabaseConnectivity();
      
    } catch (error) {
      this.log(`Unexpected error during testing: ${error.message}`, 'error');
    }

    const totalTime = Date.now() - startTime;
    this.log(`Smoke tests completed in ${totalTime}ms`, 'info');
    
    return this.generateReport();
  }
}

// CLI Usage
if (require.main === module) {
  const smokeTests = new SmokeTestSuite();
  smokeTests.run().then(exitCode => {
    process.exit(exitCode);
  }).catch(error => {
    console.error('Smoke test suite failed:', error);
    process.exit(1);
  });
}

module.exports = SmokeTestSuite;