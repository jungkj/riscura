/**
 * Performance and Load Testing Suite
 * Tests system behavior under concurrent user load and stress conditions
 */

import { test, expect, chromium, Browser, BrowserContext, Page } from '@playwright/test';
import { performance } from 'perf_hooks';

// Performance metrics collection
interface PerformanceMetrics {
  responseTime: number;
  loadTime: number;
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
  errorRate: number;
  throughput: number;
}

interface LoadTestResult {
  userCount: number;
  duration: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorCount: number;
  totalRequests: number;
  successRate: number;
  memoryPeak: number;
}

// Performance utilities
class PerformanceTestUtils {
  static async measurePageLoad(page: Page, url: string): Promise<PerformanceMetrics> {
    const startTime = performance.now();
    
    // Navigate and measure load time
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    
    const loadTime = performance.now() - startTime;
    
    // Get performance metrics from browser
    const metrics = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const memory = (performance as any).memory;
      
      return {
        responseTime: nav.responseEnd - nav.requestStart,
        loadTime: nav.loadEventEnd - nav.navigationStart,
        memoryUsage: memory ? memory.usedJSHeapSize : 0,
        networkLatency: nav.responseStart - nav.requestStart
      };
    });
    
    return {
      ...metrics,
      cpuUsage: 0, // Would need external monitoring
      errorRate: 0,
      throughput: 0
    };
  }

  static async simulateUserWorkflow(page: Page, userIndex: number): Promise<number[]> {
    const responseTimes: number[] = [];
    
    // Login
    const loginStart = performance.now();
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', `loadtest${userIndex}@example.com`);
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await page.waitForSelector('[data-testid="dashboard"]');
    responseTimes.push(performance.now() - loginStart);

    // Navigate to risks
    const risksStart = performance.now();
    await page.click('[data-testid="risks-menu"]');
    await page.waitForSelector('[data-testid="risks-list"]');
    responseTimes.push(performance.now() - risksStart);

    // Create new risk
    const createRiskStart = performance.now();
    await page.click('[data-testid="add-risk-button"]');
    await page.fill('[data-testid="risk-title"]', `Load Test Risk ${userIndex}`);
    await page.fill('[data-testid="risk-description"]', 'Risk created during load testing');
    await page.selectOption('[data-testid="risk-category"]', 'operational');
    await page.click('[data-testid="likelihood-3"]');
    await page.click('[data-testid="financial-impact-3"]');
    await page.click('[data-testid="save-risk-button"]');
    await page.waitForSelector('[data-testid="risk-saved"]');
    responseTimes.push(performance.now() - createRiskStart);

    // View reports
    const reportsStart = performance.now();
    await page.click('[data-testid="reports-menu"]');
    await page.waitForSelector('[data-testid="reports-dashboard"]');
    responseTimes.push(performance.now() - reportsStart);

    return responseTimes;
  }

  static calculateStatistics(values: number[]) {
    const sorted = values.sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      average: sum / values.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }

  static async monitorSystemResources(page: Page, duration: number): Promise<any[]> {
    const metrics: any[] = [];
    const interval = 1000; // Monitor every second
    const iterations = duration / interval;
    
    for (let i = 0; i < iterations; i++) {
      const memory = await page.evaluate(() => {
        const mem = (performance as any).memory;
        return mem ? {
          used: mem.usedJSHeapSize,
          total: mem.totalJSHeapSize,
          limit: mem.jsHeapSizeLimit
        } : null;
      });
      
      metrics.push({
        timestamp: Date.now(),
        memory,
        iteration: i
      });
      
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    return metrics;
  }
}

// Load test orchestrator
class LoadTestOrchestrator {
  private browser: Browser;
  private contexts: BrowserContext[] = [];
  private pages: Page[] = [];

  constructor(browser: Browser) {
    this.browser = browser;
  }

  async setupUsers(userCount: number): Promise<void> {
    for (let i = 0; i < userCount; i++) {
      const context = await this.browser.newContext();
      const page = await context.newPage();
      
      this.contexts.push(context);
      this.pages.push(page);
    }
  }

  async runConcurrentUserTest(duration: number): Promise<LoadTestResult> {
    const startTime = Date.now();
    const allResponseTimes: number[] = [];
    const errors: any[] = [];
    let totalRequests = 0;

    // Start monitoring system resources
    const resourceMonitoring = PerformanceTestUtils.monitorSystemResources(
      this.pages[0], 
      duration
    );

    // Run concurrent user simulations
    const userPromises = this.pages.map(async (page, index) => {
      const userResponseTimes: number[] = [];
      const endTime = startTime + duration;
      
      while (Date.now() < endTime) {
        try {
          const responseTimes = await PerformanceTestUtils.simulateUserWorkflow(page, index);
          userResponseTimes.push(...responseTimes);
          totalRequests += responseTimes.length;
          
          // Short delay between workflows
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          errors.push({ user: index, error: error.message, timestamp: Date.now() });
        }
      }
      
      return userResponseTimes;
    });

    // Wait for all users to complete
    const allUserResponseTimes = await Promise.all(userPromises);
    const resourceMetrics = await resourceMonitoring;

    // Flatten all response times
    allUserResponseTimes.forEach(times => allResponseTimes.push(...times));

    // Calculate statistics
    const stats = PerformanceTestUtils.calculateStatistics(allResponseTimes);
    const actualDuration = Date.now() - startTime;
    
    // Find peak memory usage
    const memoryPeak = Math.max(...resourceMetrics
      .filter(m => m.memory)
      .map(m => m.memory.used));

    return {
      userCount: this.pages.length,
      duration: actualDuration,
      averageResponseTime: stats.average,
      p95ResponseTime: stats.p95,
      p99ResponseTime: stats.p99,
      errorCount: errors.length,
      totalRequests,
      successRate: ((totalRequests - errors.length) / totalRequests) * 100,
      memoryPeak
    };
  }

  async cleanup(): Promise<void> {
    await Promise.all(this.contexts.map(ctx => ctx.close()));
    this.contexts = [];
    this.pages = [];
  }
}

test.describe('Performance and Load Testing', () => {
  let browser: Browser;

  test.beforeAll(async () => {
    browser = await chromium.launch();
  });

  test.afterAll(async () => {
    await browser.close();
  });

  test('Baseline performance metrics', async () => {
    const page = await browser.newPage();
    
    // Test key pages
    const pages = [
      { name: 'Login', url: '/auth/login' },
      { name: 'Dashboard', url: '/dashboard' },
      { name: 'Risks', url: '/dashboard/risks' },
      { name: 'Reports', url: '/dashboard/reports' }
    ];

    for (const pageTest of pages) {
      const metrics = await PerformanceTestUtils.measurePageLoad(page, pageTest.url);
      
      // Assert performance thresholds
      expect(metrics.loadTime).toBeLessThan(3000); // < 3 seconds
      expect(metrics.responseTime).toBeLessThan(500); // < 500ms
      
      console.log(`${pageTest.name} - Load Time: ${metrics.loadTime}ms, Response Time: ${metrics.responseTime}ms`);
    }

    await page.close();
  });

  test('10 concurrent users for 2 minutes', async () => {
    test.setTimeout(180000); // 3 minutes
    
    const orchestrator = new LoadTestOrchestrator(browser);
    
    try {
      await orchestrator.setupUsers(10);
      
      const result = await orchestrator.runConcurrentUserTest(120000); // 2 minutes
      
      // Assert performance criteria
      expect(result.averageResponseTime).toBeLessThan(2000); // < 2 seconds average
      expect(result.p95ResponseTime).toBeLessThan(5000); // < 5 seconds 95th percentile
      expect(result.successRate).toBeGreaterThan(95); // > 95% success rate
      expect(result.errorCount).toBeLessThan(10); // < 10 errors total
      
      console.log('10 User Load Test Results:', result);
    } finally {
      await orchestrator.cleanup();
    }
  });

  test('50 concurrent users stress test', async () => {
    test.setTimeout(600000); // 10 minutes
    
    const orchestrator = new LoadTestOrchestrator(browser);
    
    try {
      await orchestrator.setupUsers(50);
      
      const result = await orchestrator.runConcurrentUserTest(300000); // 5 minutes
      
      // More lenient thresholds for stress test
      expect(result.averageResponseTime).toBeLessThan(5000); // < 5 seconds average
      expect(result.p95ResponseTime).toBeLessThan(10000); // < 10 seconds 95th percentile
      expect(result.successRate).toBeGreaterThan(90); // > 90% success rate
      
      console.log('50 User Stress Test Results:', result);
    } finally {
      await orchestrator.cleanup();
    }
  });

  test('Database stress testing with large datasets', async () => {
    const page = await browser.newPage();
    
    // Login as admin
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'admin@test.com');
    await page.fill('[data-testid="password-input"]', 'AdminPassword123!');
    await page.click('[data-testid="login-button"]');
    
    // Create large dataset
    const riskCount = 1000;
    const batchSize = 50;
    const batches = Math.ceil(riskCount / batchSize);
    
    let totalCreateTime = 0;
    
    for (let batch = 0; batch < batches; batch++) {
      const batchStart = performance.now();
      
      // Create batch of risks
      const promises = [];
      for (let i = 0; i < batchSize && (batch * batchSize + i) < riskCount; i++) {
        const riskIndex = batch * batchSize + i;
        promises.push(
          page.evaluate(async (index) => {
            const response = await fetch('/api/risks', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: `Load Test Risk ${index}`,
                description: `Risk created for database stress testing`,
                category: 'operational',
                likelihood: Math.floor(Math.random() * 5) + 1,
                impact: {
                  financial: Math.floor(Math.random() * 5) + 1,
                  operational: Math.floor(Math.random() * 5) + 1,
                  reputational: Math.floor(Math.random() * 5) + 1,
                  regulatory: Math.floor(Math.random() * 5) + 1
                }
              })
            });
            return response.ok;
          }, riskIndex)
        );
      }
      
      const results = await Promise.all(promises);
      const batchTime = performance.now() - batchStart;
      totalCreateTime += batchTime;
      
      const successCount = results.filter(Boolean).length;
      expect(successCount).toBe(Math.min(batchSize, riskCount - batch * batchSize));
      
      console.log(`Batch ${batch + 1}/${batches}: ${successCount} risks created in ${batchTime}ms`);
    }
    
    // Test query performance with large dataset
    const queryStart = performance.now();
    await page.goto('/dashboard/risks');
    await page.waitForSelector('[data-testid="risks-list"]');
    const queryTime = performance.now() - queryStart;
    
    expect(queryTime).toBeLessThan(5000); // Should load within 5 seconds
    
    console.log(`Large dataset query time: ${queryTime}ms`);
    console.log(`Total creation time for ${riskCount} risks: ${totalCreateTime}ms`);
    
    await page.close();
  });

  test('Memory usage under prolonged operation', async () => {
    const page = await browser.newPage();
    
    // Login and navigate to dashboard
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'user@test.com');
    await page.fill('[data-testid="password-input"]', 'UserPassword123!');
    await page.click('[data-testid="login-button"]');
    await page.waitForSelector('[data-testid="dashboard"]');
    
    // Monitor memory for 5 minutes while performing operations
    const monitoringDuration = 300000; // 5 minutes
    const initialMemory = await page.evaluate(() => {
      const mem = (performance as any).memory;
      return mem ? mem.usedJSHeapSize : 0;
    });
    
    const resourceMetrics = await PerformanceTestUtils.monitorSystemResources(
      page, 
      monitoringDuration
    );
    
    // Simulate continuous user activity during monitoring
    const activityPromise = (async () => {
      const endTime = Date.now() + monitoringDuration;
      const pages = ['/dashboard', '/dashboard/risks', '/dashboard/controls', '/dashboard/reports'];
      
      while (Date.now() < endTime) {
        for (const url of pages) {
          await page.goto(url);
          await page.waitForLoadState('networkidle');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    })();
    
    await activityPromise;
    
    const finalMemory = await page.evaluate(() => {
      const mem = (performance as any).memory;
      return mem ? mem.usedJSHeapSize : 0;
    });
    
    // Memory growth should be reasonable
    const memoryGrowth = finalMemory - initialMemory;
    const maxAcceptableGrowth = initialMemory * 2; // No more than 2x initial
    
    expect(memoryGrowth).toBeLessThan(maxAcceptableGrowth);
    
    console.log(`Memory usage: Initial: ${initialMemory}, Final: ${finalMemory}, Growth: ${memoryGrowth}`);
    
    await page.close();
  });

  test('API endpoint stress testing', async () => {
    const page = await browser.newPage();
    
    // Get authentication token
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'api-test@test.com');
    await page.fill('[data-testid="password-input"]', 'ApiTestPassword123!');
    await page.click('[data-testid="login-button"]');
    
    // Test API endpoints under load
    const endpoints = [
      { method: 'GET', url: '/api/risks' },
      { method: 'GET', url: '/api/controls' },
      { method: 'GET', url: '/api/dashboard/metrics' },
      { method: 'GET', url: '/api/reports' }
    ];
    
    for (const endpoint of endpoints) {
      const concurrentRequests = 50;
      const requestStart = performance.now();
      
      const requests = Array(concurrentRequests).fill(null).map(() =>
        page.evaluate(async (endpointConfig) => {
          const response = await fetch(endpointConfig.url, {
            method: endpointConfig.method
          });
          return {
            status: response.status,
            responseTime: Date.now()
          };
        }, endpoint)
      );
      
      const responses = await Promise.all(requests);
      const totalTime = performance.now() - requestStart;
      
      // All requests should succeed
      const successCount = responses.filter(r => r.status === 200).length;
      expect(successCount).toBe(concurrentRequests);
      
      // Average response time should be reasonable
      const avgResponseTime = totalTime / concurrentRequests;
      expect(avgResponseTime).toBeLessThan(1000); // < 1 second average
      
      console.log(`${endpoint.method} ${endpoint.url}: ${successCount}/${concurrentRequests} success, ${avgResponseTime}ms avg`);
    }
    
    await page.close();
  });

  test('File upload performance with large files', async () => {
    const page = await browser.newPage();
    
    // Login
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'upload-test@test.com');
    await page.fill('[data-testid="password-input"]', 'UploadTestPassword123!');
    await page.click('[data-testid="login-button"]');
    
    // Test file upload performance
    const fileSizes = [1, 5, 10, 25]; // MB
    
    for (const sizeInMB of fileSizes) {
      const uploadStart = performance.now();
      
      // Create test file of specified size
      const fileSize = sizeInMB * 1024 * 1024;
      const fileContent = 'A'.repeat(fileSize);
      
      await page.goto('/dashboard/documents');
      await page.click('[data-testid="upload-document-button"]');
      
      // Create blob and upload
      await page.evaluate((content, size) => {
        const blob = new Blob([content], { type: 'application/pdf' });
        const file = new File([blob], `test-${size}mb.pdf`, { type: 'application/pdf' });
        
        const input = document.querySelector('[data-testid="file-input"]') as HTMLInputElement;
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }, fileContent, sizeInMB);
      
      await page.fill('[data-testid="document-title"]', `Test ${sizeInMB}MB File`);
      await page.click('[data-testid="upload-submit-button"]');
      
      // Wait for upload completion
      await page.waitForSelector('[data-testid="upload-success"]', { timeout: 60000 });
      
      const uploadTime = performance.now() - uploadStart;
      const expectedMaxTime = sizeInMB * 2000; // 2 seconds per MB
      
      expect(uploadTime).toBeLessThan(expectedMaxTime);
      
      console.log(`${sizeInMB}MB file upload: ${uploadTime}ms`);
    }
    
    await page.close();
  });
});

export { PerformanceTestUtils, LoadTestOrchestrator }; 