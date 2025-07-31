import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './src/__tests__/e2e',
  /* Test files to run */
  testMatch: '**/*.spec.ts',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Global timeout for each action */
    actionTimeout: 30000,
    
    /* Global timeout for navigation */
    navigationTimeout: 60000,
  },

  /* Configure projects for major browsers */
  projects: [
    // Setup project to authenticate users and prepare test data
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // Cleanup project to clean up test data
    {
      name: 'cleanup',
      testMatch: /.*\.cleanup\.ts/,
      teardown: true,
    },

    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Use prepared auth state
        storageState: 'src/__tests__/e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        storageState: 'src/__tests__/e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        storageState: 'src/__tests__/e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        storageState: 'src/__tests__/e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        storageState: 'src/__tests__/e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },

    // Multi-tenant isolation tests
    {
      name: 'multi-tenant',
      testMatch: '**/multi-tenant*.spec.ts',
      use: { 
        ...devices['Desktop Chrome'],
        // Don't use shared auth state for multi-tenant tests
      },
    },

    // Performance tests
    {
      name: 'performance',
      testMatch: '**/performance*.spec.ts',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'src/__tests__/e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // Authentication flow tests (no pre-auth needed)
    {
      name: 'auth-flow',
      testMatch: '**/auth-flow*.spec.ts',
      use: { 
        ...devices['Desktop Chrome'],
        // No storageState - these tests handle auth themselves
      },
    },
  ],

  /* Global setup and teardown */
  globalSetup: require.resolve('./src/__tests__/setup/global-setup.ts'),
  globalTeardown: require.resolve('./src/__tests__/setup/global-teardown.ts'),

  /* Run your local dev server before starting the tests */
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: 'ignore',
    stderr: 'pipe',
  },

  /* Expect timeout */
  expect: {
    timeout: 10000,
  },

  /* Global test timeout */
  timeout: 60000,

  /* Output directories */
  outputDir: 'test-results/',
  
  /* Test result directory */
  reportSlowTests: {
    max: 5,
    threshold: 15000,
  },
});