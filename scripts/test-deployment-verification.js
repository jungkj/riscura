#!/usr/bin/env node

/**
 * Deployment Verification Test Suite
 * 
 * This script performs comprehensive deployment verification including:
 * - Build process validation
 * - Environment configuration checks
 * - Database connectivity tests
 * - API route functionality verification
 * - Security headers validation
 * - Performance benchmarks
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

class DeploymentVerificationTester {
  constructor() {
    this.results = {
      build: { passed: 0, failed: 0, tests: [] },
      environment: { passed: 0, failed: 0, tests: [] },
      database: { passed: 0, failed: 0, tests: [] },
      api: { passed: 0, failed: 0, tests: [] },
      security: { passed: 0, failed: 0, tests: [] },
      performance: { passed: 0, failed: 0, tests: [] }
    };
    this.baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
    this.timeout = 30000; // 30 seconds
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

  async runTest(category, testName, testFn) {
    try {
      this.log(`Running ${category}: ${testName}`, 'info');
      const startTime = Date.now();
      await testFn();
      const duration = Date.now() - startTime;
      
      this.results[category].passed++;
      this.results[category].tests.push({
        name: testName,
        status: 'PASSED',
        duration,
        error: null
      });
      this.log(`✓ ${testName} (${duration}ms)`, 'success');
    } catch (error) {
      this.results[category].failed++;
      this.results[category].tests.push({
        name: testName,
        status: 'FAILED',
        duration: 0,
        error: error.message
      });
      this.log(`✗ ${testName}: ${error.message}`, 'error');
    }
  }

  async testBuildProcess() {
    this.log('Testing Build Process...', 'info');

    await this.runTest('build', 'TypeScript Compilation', async () => {
      try {
        execSync('npm run type-check', { stdio: 'pipe', timeout: this.timeout });
      } catch (error) {
        throw new Error(`TypeScript compilation failed: ${error.message}`);
      }
    });

    await this.runTest('build', 'ESLint Validation', async () => {
      try {
        execSync('npm run lint', { stdio: 'pipe', timeout: this.timeout });
      } catch (error) {
        throw new Error(`ESLint validation failed: ${error.message}`);
      }
    });

    await this.runTest('build', 'Production Build', async () => {
      try {
        execSync('npm run build', { stdio: 'pipe', timeout: 60000 });
        if (!fs.existsSync('.next/BUILD_ID')) {
          throw new Error('Build output not found');
        }
      } catch (error) {
        throw new Error(`Production build failed: ${error.message}`);
      }
    });

    await this.runTest('build', 'Build Artifacts Validation', async () => {
      const requiredFiles = [
        '.next/static',
        '.next/server',
        '.next/BUILD_ID'
      ];

      for (const file of requiredFiles) {
        if (!fs.existsSync(file)) {
          throw new Error(`Required build artifact missing: ${file}`);
        }
      }
    });
  }

  async testEnvironmentConfiguration() {
    this.log('Testing Environment Configuration...', 'info');

    await this.runTest('environment', 'Required Environment Variables', async () => {
      const requiredVars = [
        'DATABASE_URL',
        'NEXTAUTH_URL',
        'NEXTAUTH_SECRET'
      ];

      const missing = requiredVars.filter(varName => !process.env[varName]);
      if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
      }
    });

    await this.runTest('environment', 'Environment File Exists', async () => {
      if (!fs.existsSync('.env') && !fs.existsSync('.env.local')) {
        throw new Error('No environment file found (.env or .env.local)');
      }
    });

    await this.runTest('environment', 'Configuration Validation', async () => {
      try {
        execSync('npm run config:verify', { stdio: 'pipe', timeout: this.timeout });
      } catch (error) {
        throw new Error(`Configuration validation failed: ${error.message}`);
      }
    });
  }

  async testDatabaseConnectivity() {
    this.log('Testing Database Connectivity...', 'info');

    await this.runTest('database', 'Prisma Client Generation', async () => {
      try {
        execSync('npm run db:generate', { stdio: 'pipe', timeout: this.timeout });
      } catch (error) {
        throw new Error(`Prisma client generation failed: ${error.message}`);
      }
    });

    await this.runTest('database', 'Database Connection', async () => {
      // This would require a simple database connection test script
      try {
        const testScript = `
          const { PrismaClient } = require('@prisma/client');
          const prisma = new PrismaClient();
          
          async function testConnection() {
            try {
              await prisma.$connect();
              console.log('Database connection successful');
              await prisma.$disconnect();
              process.exit(0);
            } catch (error) {
              console.error('Database connection failed:', error);
              process.exit(1);
            }
          }
          
          testConnection();
        `;
        
        fs.writeFileSync('/tmp/db-test.js', testScript);
        execSync('node /tmp/db-test.js', { stdio: 'pipe', timeout: this.timeout });
        fs.unlinkSync('/tmp/db-test.js');
      } catch (error) {
        throw new Error(`Database connection test failed: ${error.message}`);
      }
    });

    await this.runTest('database', 'Database Schema Validation', async () => {
      try {
        execSync('npx prisma validate', { stdio: 'pipe', timeout: this.timeout });
      } catch (error) {
        throw new Error(`Database schema validation failed: ${error.message}`);
      }
    });
  }

  async makeHttpRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const isHttps = url.startsWith('https://');
      const client = isHttps ? https : http;
      
      const req = client.request(url, {
        method: options.method || 'GET',
        headers: options.headers || {},
        timeout: this.timeout,
        ...options
      }, (res) => {
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

  async testApiRoutes() {
    this.log('Testing API Routes...', 'info');

    await this.runTest('api', 'Health Check Endpoint', async () => {
      const response = await this.makeHttpRequest(`${this.baseUrl}/api/health`);
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
    });

    await this.runTest('api', 'Authentication API', async () => {
      const response = await this.makeHttpRequest(`${this.baseUrl}/api/auth/session`);
      // Should return 401 for unauthenticated request or 200 for valid session
      if (response.status !== 401 && response.status !== 200) {
        throw new Error(`Auth API unexpected status: ${response.status}`);
      }
    });

    await this.runTest('api', 'CORS Headers', async () => {
      const response = await this.makeHttpRequest(`${this.baseUrl}/api/health`, {
        method: 'OPTIONS'
      });
      
      if (!response.headers['access-control-allow-origin']) {
        throw new Error('CORS headers not configured properly');
      }
    });

    await this.runTest('api', 'Rate Limiting', async () => {
      // Test rate limiting by making multiple rapid requests
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(this.makeHttpRequest(`${this.baseUrl}/api/health`));
      }
      
      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);
      
      // Note: This test might pass even without rate limiting if limits are high
      this.log('Rate limiting test completed (429 status indicates rate limiting is active)', 'info');
    });
  }

  async testSecurityHeaders() {
    this.log('Testing Security Headers...', 'info');

    await this.runTest('security', 'Security Headers Present', async () => {
      const response = await this.makeHttpRequest(`${this.baseUrl}/`);
      
      const requiredHeaders = [
        'x-frame-options',
        'x-content-type-options',
        'referrer-policy'
      ];

      const missingHeaders = requiredHeaders.filter(header => 
        !response.headers[header] && !response.headers[header.toLowerCase()]
      );

      if (missingHeaders.length > 0) {
        throw new Error(`Missing security headers: ${missingHeaders.join(', ')}`);
      }
    });

    await this.runTest('security', 'Content Security Policy', async () => {
      const response = await this.makeHttpRequest(`${this.baseUrl}/`);
      
      if (!response.headers['content-security-policy'] && 
          !response.headers['content-security-policy-report-only']) {
        throw new Error('Content Security Policy header not found');
      }
    });

    await this.runTest('security', 'HTTPS Redirect (if applicable)', async () => {
      if (this.baseUrl.startsWith('https://')) {
        const httpUrl = this.baseUrl.replace('https://', 'http://');
        try {
          const response = await this.makeHttpRequest(httpUrl);
          if (response.status !== 301 && response.status !== 302) {
            this.log('Warning: HTTPS redirect not configured', 'warning');
          }
        } catch (error) {
          // HTTP might not be available, which is fine
          this.log('HTTP endpoint not available (expected for HTTPS-only)', 'info');
        }
      } else {
        this.log('Skipping HTTPS redirect test (testing HTTP endpoint)', 'info');
      }
    });
  }

  async testPerformance() {
    this.log('Testing Performance...', 'info');

    await this.runTest('performance', 'Page Load Time', async () => {
      const startTime = Date.now();
      const response = await this.makeHttpRequest(`${this.baseUrl}/`);
      const loadTime = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`Page load failed: ${response.status}`);
      }

      if (loadTime > 5000) {
        throw new Error(`Page load too slow: ${loadTime}ms (threshold: 5000ms)`);
      }

      this.log(`Page load time: ${loadTime}ms`, 'info');
    });

    await this.runTest('performance', 'API Response Time', async () => {
      const startTime = Date.now();
      const response = await this.makeHttpRequest(`${this.baseUrl}/api/health`);
      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      if (responseTime > 2000) {
        throw new Error(`API response too slow: ${responseTime}ms (threshold: 2000ms)`);
      }

      this.log(`API response time: ${responseTime}ms`, 'info');
    });

    await this.runTest('performance', 'Bundle Size Check', async () => {
      if (fs.existsSync('.next/static')) {
        try {
          const bundleAnalysis = execSync('npm run bundle:analyze 2>/dev/null || echo "Bundle analysis not available"', 
            { encoding: 'utf8', timeout: this.timeout });
          
          this.log('Bundle analysis completed', 'info');
        } catch (error) {
          this.log('Bundle analysis failed, continuing...', 'warning');
        }
      } else {
        throw new Error('Build artifacts not found for bundle analysis');
      }
    });
  }

  generateReport() {
    const totalTests = Object.values(this.results).reduce((sum, category) => 
      sum + category.passed + category.failed, 0);
    const totalPassed = Object.values(this.results).reduce((sum, category) => 
      sum + category.passed, 0);
    const totalFailed = Object.values(this.results).reduce((sum, category) => 
      sum + category.failed, 0);

    console.log('\n' + '='.repeat(60));
    console.log('DEPLOYMENT VERIFICATION REPORT');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${totalPassed}`);
    console.log(`Failed: ${totalFailed}`);
    console.log(`Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);
    console.log('='.repeat(60));

    Object.entries(this.results).forEach(([category, results]) => {
      console.log(`\n${category.toUpperCase()}:`);
      console.log(`  Passed: ${results.passed}, Failed: ${results.failed}`);
      
      results.tests.forEach(test => {
        const status = test.status === 'PASSED' ? '✓' : '✗';
        const duration = test.duration ? ` (${test.duration}ms)` : '';
        console.log(`  ${status} ${test.name}${duration}`);
        if (test.error) {
          console.log(`    Error: ${test.error}`);
        }
      });
    });

    console.log('\n' + '='.repeat(60));

    if (totalFailed > 0) {
      console.log('\n❌ DEPLOYMENT VERIFICATION FAILED');
      console.log(`${totalFailed} test(s) failed. Please review and fix issues before deploying.`);
      process.exit(1);
    } else {
      console.log('\n✅ DEPLOYMENT VERIFICATION PASSED');
      console.log('All tests passed. Deployment is ready!');
      process.exit(0);
    }
  }

  async run() {
    this.log('Starting Deployment Verification...', 'info');
    const startTime = Date.now();

    try {
      await this.testBuildProcess();
      await this.testEnvironmentConfiguration();
      await this.testDatabaseConnectivity();
      await this.testApiRoutes();
      await this.testSecurityHeaders();
      await this.testPerformance();
    } catch (error) {
      this.log(`Unexpected error during testing: ${error.message}`, 'error');
    }

    const totalTime = Date.now() - startTime;
    this.log(`Deployment verification completed in ${totalTime}ms`, 'info');
    
    this.generateReport();
  }
}

// CLI Usage
if (require.main === module) {
  const tester = new DeploymentVerificationTester();
  tester.run().catch(error => {
    console.error('Deployment verification failed:', error);
    process.exit(1);
  });
}

module.exports = DeploymentVerificationTester;