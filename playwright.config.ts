import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for RISCURA E2E Testing
 * Comprehensive setup for end-to-end integration testing
 */

export default defineConfig({
  // Test directory
  testDir: './src/__tests__/e2e',
  
  // Parallel execution settings
  fullyParallel: false, // Disable for data isolation in multi-tenant tests
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : 4,
  
  // Global test timeout (5 minutes for complex workflows)
  timeout: 300000,
  
  // Expect timeout for individual assertions
  expect: {
    timeout: 10000
  },
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'test-results/playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    process.env.CI ? ['github'] : ['list']
  ],
  
  // Global setup and teardown
  globalSetup: require.resolve('./src/__tests__/setup/global-setup.ts'),
  globalTeardown: require.resolve('./src/__tests__/setup/global-teardown.ts'),
  
  // Output directory for test artifacts
  outputDir: 'test-results/',
  
  // Use base configuration for all tests
  use: {
    // Base URL for all tests
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    
    // Browser context options
    browserName: 'chromium',
    headless: process.env.CI ? true : false,
    viewport: { width: 1280, height: 720 },
    
    // Test data attributes
    testIdAttribute: 'data-testid',
    
    // Screenshots and videos
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    
    // Navigation timeout
    navigationTimeout: 30000,
    actionTimeout: 10000,
    
    // Ignore HTTPS errors in development
    ignoreHTTPSErrors: true,
    
    // Extra HTTP headers
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9'
    }
  },

  // Projects for different browsers and scenarios
  projects: [
    // Setup project for database seeding and user creation
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
      teardown: 'cleanup'
    },
    
    // Main Chrome tests
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup']
    },
    
    // Firefox tests for cross-browser compatibility
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup']
    },
    
    // Safari tests (if running on macOS)
    ...(process.platform === 'darwin' ? [{
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup']
    }] : []),
    
    // Mobile testing
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      dependencies: ['setup']
    },
    
    // Performance testing project
    {
      name: 'performance',
      testDir: './src/__tests__/performance',
      use: { 
        ...devices['Desktop Chrome'],
        // Performance testing specific settings
        video: 'off',
        screenshot: 'off'
      },
      dependencies: ['setup']
    },
    
    // Multi-tenant isolation testing
    {
      name: 'multi-tenant',
      testMatch: /multi-tenant-isolation\.spec\.ts/,
      use: { 
        ...devices['Desktop Chrome'],
        // Each tenant test needs isolation
        contextOptions: {
          ignoreHTTPSErrors: true
        }
      },
      dependencies: ['setup']
    },
    
    // Cleanup project
    {
      name: 'cleanup',
      testMatch: /global\.teardown\.ts/
    }
  ],

  // Web server configuration for local development
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      NODE_ENV: 'test',
      // Test database URL
      DATABASE_URL: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
      // Disable external services in tests
      DISABLE_EXTERNAL_SERVICES: 'true'
    }
  },

  // Metadata for test results
  metadata: {
    testType: 'e2e-integration',
    platform: process.platform,
    ci: !!process.env.CI,
    baseUrl: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'
  }
}); 