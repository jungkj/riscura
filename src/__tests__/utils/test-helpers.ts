/**
 * Comprehensive test utilities for Riscura application
 * Provides reusable test helpers, mocks, and fixtures
 */

import { NextRequest, NextResponse } from 'next/server';
// import { User, Organization, Risk, Control, Document } from '@prisma/client'
import { jest } from '@jest/globals';
import type { SubscriptionPlan, OrganizationSubscription } from '@/lib/billing/types';

// ============================================================================
// TEST DATABASE UTILITIES
// ============================================================================

export interface TestUser extends User {
  organization: Organization;
}

export interface TestOrganization extends Organization {
  users: User[];
  risks: Risk[];
  controls: Control[];
  documents: Document[];
}

export const createTestUser = (overrides: Partial<User> = {}): TestUser => ({
  id: 'test-user-123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  passwordHash: 'hashed-password',
  avatar: null,
  phoneNumber: null,
  role: 'USER',
  permissions: ['read:risks', 'write:risks'],
  isActive: true,
  emailVerified: new Date(),
  emailVerificationToken: null,
  emailVerificationExpires: null,
  passwordResetToken: null,
  passwordResetExpires: null,
  lastLogin: new Date(),
  organizationId: 'test-org-123',
  createdAt: new Date(),
  updatedAt: new Date(),
  organization: createTestOrganization(),
  ...overrides,
});

export const createTestOrganization = (overrides: Partial<Organization> = {}): Organization => ({
  id: 'test-org-123',
  name: 'Test Organization',
  domain: 'test.example.com',
  settings: { theme: 'light', notifications: true },
  plan: 'professional',
  stripeCustomerId: 'cus_test123',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createTestRisk = (overrides: Partial<Risk> = {}): Risk => ({
  id: 'test-risk-123',
  title: 'Test Risk',
  description: 'A test risk for testing purposes',
  category: 'OPERATIONAL',
  likelihood: 3,
  impact: 4,
  riskScore: 12,
  riskLevel: 'HIGH',
  owner: 'test-user-123',
  status: 'IDENTIFIED',
  dateIdentified: new Date(),
  lastAssessed: new Date(),
  nextReview: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  aiConfidence: 0.85,
  organizationId: 'test-org-123',
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'test-user-123',
  ...overrides,
});

export const createTestControl = (overrides: Partial<Control> = {}): Control => ({
  id: 'test-control-123',
  title: 'Test Control',
  description: 'A test control for testing purposes',
  type: 'PREVENTIVE',
  category: 'TECHNICAL',
  frequency: 'daily',
  automationLevel: 'MANUAL',
  effectiveness: 0.8,
  effectivenessRating: 'LARGELY_EFFECTIVE',
  owner: 'test-user-123',
  operatorId: 'test-user-123',
  reviewerId: 'test-user-123',
  status: 'OPERATIONAL',
  priority: 'HIGH',
  lastTestDate: new Date(),
  nextTestDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  testResults: 'Passed all tests',
  businessUnit: 'IT',
  department: 'Security',
  location: 'Data Center',
  cost: 1000,
  effort: 'MEDIUM',
  tags: ['security', 'compliance'],
  customFields: { reviewCycle: 'weekly' },
  organizationId: 'test-org-123',
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'test-user-123',
  ...overrides,
});

export const createTestDocument = (overrides: Partial<Document> = {}): Document => ({
  id: 'test-doc-123',
  name: 'Test Document.pdf',
  type: 'application/pdf',
  size: 1024000,
  content: 'base64-encoded-content',
  extractedText: 'Extracted text content',
  aiAnalysis: { summary: 'Document analysis', confidence: 0.9 },
  uploadedAt: new Date(),
  organizationId: 'test-org-123',
  uploadedBy: 'test-user-123',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// ============================================================================
// BILLING TEST UTILITIES
// ============================================================================

export const createTestSubscriptionPlan = (
  overrides: Partial<SubscriptionPlan> = {}
): SubscriptionPlan => ({
  id: 'test-plan-123',
  name: 'Test Professional',
  description: 'Professional plan for testing',
  type: 'professional',
  price: 99,
  currency: 'USD',
  billingInterval: 'monthly',
  features: [
    {
      id: 'feature-1',
      name: 'Advanced Analytics',
      description: 'Detailed insights',
      category: 'analytics',
      included: true,
    },
    {
      id: 'feature-2',
      name: 'API Access',
      description: 'RESTful API',
      category: 'integration',
      included: true,
    },
  ],
  limits: {
    users: 15,
    risks: 500,
    controls: 1000,
    documents: 5000,
    aiQueries: 1000,
    storageGB: 10,
    apiCalls: 10000,
    frameworks: 5,
    reports: 50,
  },
  isActive: true,
  trialDays: 14,
  stripeProductId: 'prod_test123',
  stripePriceId: 'price_test123',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createTestSubscription = (
  overrides: Partial<OrganizationSubscription> = {}
): OrganizationSubscription => ({
  id: 'test-sub-123',
  organizationId: 'test-org-123',
  planId: 'test-plan-123',
  stripeSubscriptionId: 'sub_test123',
  stripeCustomerId: 'cus_test123',
  status: 'active',
  currentPeriodStart: new Date(),
  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  trialStart: null,
  trialEnd: null,
  canceledAt: null,
  cancelAtPeriodEnd: false,
  billingCycle: 'monthly',
  quantity: 1,
  unitPrice: 99,
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// ============================================================================
// HTTP REQUEST/RESPONSE MOCKING
// ============================================================================

export const createMockRequest = (
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
  url = 'http://localhost:3000/api/test',
  options: {
    body?: any;
    headers?: Record<string, string>;
    searchParams?: Record<string, string>;
    user?: TestUser;
  } = {}
): NextRequest => {
  const urlObj = new URL(url);

  if (options.searchParams) {
    Object.entries(options.searchParams).forEach(([key, value]) => {
      urlObj.searchParams.set(key, value);
    });
  }

  const headers = new Headers({
    'Content-Type': 'application/json',
    ...options.headers,
  });

  const init: RequestInit = {
    method,
    headers,
  };

  if (options.body && ['POST', 'PUT', 'PATCH'].includes(method)) {
    init.body = JSON.stringify(options.body);
  }

  const request = new NextRequest(urlObj.toString(), init);

  // Attach user for authenticated requests
  if (options.user) {
    (request as any).user = options.user;
  }

  return request;
};

export const createMockResponse = (
  data: any = {},
  status = 200,
  headers: Record<string, string> = {}
): NextResponse => {
  return NextResponse.json(data, {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
};

// ============================================================================
// DATABASE MOCKING
// ============================================================================

export const createMockPrismaClient = () => {
  return {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    organization: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    risk: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    control: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    document: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    subscriptionPlan: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    organizationSubscription: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      upsert: jest.fn(),
      updateMany: jest.fn(),
    },
    usageRecord: {
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    invoice: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      updateMany: jest.fn(),
    },
    billingEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    paymentMethod: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    aIUsageLog: {
      count: jest.fn(),
      create: jest.fn(),
    },
    controlRiskMapping: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    activity: {
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    $disconnect: jest.fn(),
    $transaction: jest.fn(),
  };
};

// ============================================================================
// STRIPE MOCKING
// ============================================================================

export const createMockStripeCustomer = (overrides: any = {}) => ({
  id: 'cus_test123',
  email: 'test@example.com',
  name: 'Test Customer',
  metadata: {
    organizationId: 'test-org-123',
  },
  created: Math.floor(Date.now() / 1000),
  ...overrides,
});

export const createMockStripeSubscription = (overrides: any = {}) => ({
  id: 'sub_test123',
  customer: 'cus_test123',
  status: 'active',
  current_period_start: Math.floor(Date.now() / 1000),
  current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
  cancel_at_period_end: false,
  items: {
    data: [
      {
        price: {
          id: 'price_test123',
          unit_amount: 9900,
          recurring: { interval: 'month' },
        },
        quantity: 1,
      },
    ],
  },
  metadata: {
    organizationId: 'test-org-123',
  },
  ...overrides,
});

export const createMockStripeInvoice = (overrides: any = {}) => ({
  id: 'in_test123',
  customer: 'cus_test123',
  subscription: 'sub_test123',
  status: 'paid',
  number: 'INV-TEST-001',
  amount_paid: 9900,
  amount_due: 9900,
  subtotal: 9900,
  total: 9900,
  currency: 'usd',
  created: Math.floor(Date.now() / 1000),
  lines: {
    data: [
      {
        id: 'il_test123',
        amount: 9900,
        currency: 'usd',
        description: 'Professional Plan',
        quantity: 1,
        metadata: {},
      },
    ],
  },
  metadata: {},
  ...overrides,
});

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

export const expectValidApiResponse = (_response: any) => {
  expect(response).toHaveProperty('success');
  expect(response).toHaveProperty('data');
  if (response.success === false) {
    expect(response).toHaveProperty('error');
    expect(response.error).toHaveProperty('code');
    expect(response.error).toHaveProperty('message');
  }
  expect(response).toHaveProperty('meta');
  expect(response.meta).toHaveProperty('timestamp');
};

export const expectValidPaginationResponse = (_response: any) => {
  expectValidApiResponse(response);
  expect(response).toHaveProperty('pagination');
  expect(response.pagination).toHaveProperty('page');
  expect(response.pagination).toHaveProperty('limit');
  expect(response.pagination).toHaveProperty('total');
  expect(response.pagination).toHaveProperty('pages');
};

export const expectSubscriptionEnforcement = (
  _response: any,
  expectedCode = 'SUBSCRIPTION_ERROR'
) => {
  expect(response.success).toBe(false);
  expect(response.error.code).toBe(expectedCode);
  expect(response.error.message).toContain('subscription');
};

// ============================================================================
// TEST CLEANUP UTILITIES
// ============================================================================

export const cleanupTestData = async (prisma: any) => {
  // Clean up in reverse dependency order
  await prisma.usageRecord.deleteMany({ where: { organizationId: { startsWith: 'test-' } } });
  await prisma.invoice.deleteMany({ where: { organizationId: { startsWith: 'test-' } } });
  await prisma.organizationSubscription.deleteMany({
    where: { organizationId: { startsWith: 'test-' } },
  });
  await prisma.billingEvent.deleteMany({ where: { organizationId: { startsWith: 'test-' } } });
  await prisma.paymentMethod.deleteMany({ where: { organizationId: { startsWith: 'test-' } } });
  await prisma.document.deleteMany({ where: { organizationId: { startsWith: 'test-' } } });
  await prisma.control.deleteMany({ where: { organizationId: { startsWith: 'test-' } } });
  await prisma.risk.deleteMany({ where: { organizationId: { startsWith: 'test-' } } });
  await prisma.user.deleteMany({ where: { organizationId: { startsWith: 'test-' } } });
  await prisma.organization.deleteMany({ where: { id: { startsWith: 'test-' } } });
  await prisma.subscriptionPlan.deleteMany({ where: { id: { startsWith: 'test-' } } });
};

// ============================================================================
// PERFORMANCE TESTING UTILITIES
// ============================================================================

export const measureExecutionTime = async <T>(
  fn: () => Promise<T>,
  name: string
): Promise<{ result: T; duration: number }> => {
  const startTime = performance.now();
  const _result = await fn();
  const endTime = performance.now();
  const _duration = endTime - startTime;

  // console.log(`${name} executed in ${duration.toFixed(2)}ms`)

  return { result, duration };
};

export const expectPerformance = (duration: number, maxMs: number) => {
  expect(duration).toBeLessThan(maxMs);
};

// ============================================================================
// EXPORTS
// ============================================================================

export type MockPrismaClient = ReturnType<typeof createMockPrismaClient>;

// ============================================================================
// API ROUTE TESTING UTILITIES
// ============================================================================

/**
 * Call an API route handler for testing purposes
 */
export const callApiRoute = async (
  routePath: string,
  req: any,
  res: any
): Promise<{ status: number; data: any; headers: any }> => {
  try {
    // Dynamic import of the route handler
    const handler = await import(`@/app/api${routePath}/route`);

    // Determine which HTTP method to call
    const method = req.method || 'GET';
    const routeHandler = handler[method];

    if (!routeHandler) {
      return {
        status: 405,
        data: { error: 'Method not allowed' },
        headers: {},
      };
    }

    // Call the route handler
    const response = await routeHandler(req);

    // Extract response data
    const data = response.json ? await response.json() : response;
    const status = response.status || 200;
    const headers = response.headers || {};

    return { status, data, headers };
  } catch (error) {
    return {
      status: 500,
      data: { error: error.message },
      headers: {},
    };
  }
};

/**
 * Setup authenticated request with user context
 */
export const createAuthenticatedRequest = (
  method: string,
  url: string,
  options: {
    body?: any;
    headers?: Record<string, string>;
    user?: TestUser;
  } = {}
): any => {
  const user = options.user || createTestUser();

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer mock-jwt-token`,
    ...options.headers,
  };

  const request = {
    method,
    url,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    user, // Attach user for middleware
  };

  return request;
};

/**
 * Mock authentication middleware for testing
 */
export const mockAuthMiddleware = (user: TestUser = createTestUser()) => {
  return jest.fn().mockImplementation((req: any) => {
    req.user = user;
    return Promise.resolve();
  });
};

/**
 * Mock rate limiting for testing
 */
export const mockRateLimiter = (shouldLimit = false) => {
  return jest.fn().mockImplementation(() => {
    if (shouldLimit) {
      const error = new Error('Rate limit exceeded');
      (error as any).status = 429;
      throw error;
    }
    return Promise.resolve();
  });
};

// ============================================================================
// DATABASE TESTING UTILITIES
// ============================================================================

/**
 * Create test database connection string
 */
export const getTestDatabaseUrl = (): string => {
  return (
    process.env.TEST_DATABASE_URL ||
    process.env.DATABASE_URL ||
    'postgresql://test:test@localhost:5432/test_db'
  );
};

/**
 * Setup test database with sample data
 */
export const setupTestDatabase = async (prisma: any) => {
  // Create test organization
  const testOrg = await prisma.organization.create({
    data: createTestOrganization(),
  });

  // Create test user
  const testUser = await prisma.user.create({
    data: {
      ...createTestUser(),
      organizationId: testOrg.id,
    },
  });

  // Create test risks
  const testRisk = await prisma.risk.create({
    data: {
      ...createTestRisk(),
      organizationId: testOrg.id,
      createdBy: testUser.id,
    },
  });

  // Create test controls
  const testControl = await prisma.control.create({
    data: {
      ...createTestControl(),
      organizationId: testOrg.id,
      createdBy: testUser.id,
    },
  });

  return {
    organization: testOrg,
    user: testUser,
    risk: testRisk,
    control: testControl,
  };
};

// ============================================================================
// E2E TESTING UTILITIES
// ============================================================================

/**
 * Wait for element with timeout
 */
export const waitForElement = async (page: any, selector: string, timeout = 10000) => {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    // console.warn(`Element ${selector} not found within ${timeout}ms`)
    return false;
  }
};

/**
 * Fill form with error handling
 */
export const fillFormSafely = async (page: any, selector: string, value: string) => {
  try {
    await page.fill(selector, value);
    return true;
  } catch (error) {
    // console.warn(`Could not fill ${selector} with ${value}: ${error.message}`)
    return false;
  }
};

/**
 * Click element with multiple selector attempts
 */
export const clickElementSafely = async (page: any, selectors: string[]) => {
  for (const selector of selectors) {
    try {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 })) {
        await element.click();
        return true;
      }
    } catch (error) {
      // Continue to next selector
    }
  }
  // console.warn(`Could not click any of: ${selectors.join(', ')}`)
  return false;
};

/**
 * Login helper for E2E tests
 */
export const loginUser = async (
  page: any,
  email: string = 'testuser@riscura.com',
  password: string = 'test123'
) => {
  await page.goto('/auth/login');

  // Try multiple selector patterns for email input
  const emailSelectors = [
    '[data-testid="email-input"]',
    'input[type="email"]',
    'input[name="email"]',
    'input[placeholder*="email" i]',
  ];

  const passwordSelectors = [
    '[data-testid="password-input"]',
    'input[type="password"]',
    'input[name="password"]',
    'input[placeholder*="password" i]',
  ];

  const submitSelectors = [
    '[data-testid="login-button"]',
    'button[type="submit"]',
    'button:has-text("Sign In")',
    'button:has-text("Login")',
  ];

  // Fill form
  let emailFilled = false;
  for (const selector of emailSelectors) {
    if (await fillFormSafely(page, selector, email)) {
      emailFilled = true;
      break;
    }
  }

  let passwordFilled = false;
  for (const selector of passwordSelectors) {
    if (await fillFormSafely(page, selector, password)) {
      passwordFilled = true;
      break;
    }
  }

  if (!emailFilled || !passwordFilled) {
    throw new Error('Could not fill login form');
  }

  // Submit form
  const submitted = await clickElementSafely(page, submitSelectors);
  if (!submitted) {
    throw new Error('Could not submit login form');
  }

  // Wait for redirect to dashboard
  try {
    await page.waitForURL('**/dashboard**', { timeout: 30000 });
    return true;
  } catch (error) {
    // console.warn('Login may have failed - no redirect to dashboard detected')
    return false;
  }
};

/**
 * Logout helper for E2E tests
 */
export const logoutUser = async (page: any) => {
  const userMenuSelectors = [
    '[data-testid="user-menu"]',
    '.user-menu',
    '[aria-label*="user" i]',
    '[aria-label*="profile" i]',
  ];

  const logoutSelectors = [
    '[data-testid="logout-button"]',
    'button:has-text("Logout")',
    'button:has-text("Sign Out")',
    'a:has-text("Logout")',
  ];

  // Click user menu
  const menuClicked = await clickElementSafely(page, userMenuSelectors);
  if (!menuClicked) {
    throw new Error('Could not find user menu');
  }

  // Wait a bit for menu to open
  await page.waitForTimeout(500);

  // Click logout
  const loggedOut = await clickElementSafely(page, logoutSelectors);
  if (!loggedOut) {
    throw new Error('Could not find logout button');
  }

  // Wait for redirect to login
  try {
    await page.waitForURL('**/auth/login**', { timeout: 10000 });
    return true;
  } catch (error) {
    // console.warn('Logout may have failed - no redirect to login detected')
    return false;
  }
};

// ============================================================================
// DEPLOYMENT TESTING UTILITIES
// ============================================================================

/**
 * Check if URL is accessible
 */
export const checkUrlAccessibility = async (url: string, timeout = 10000): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      signal: controller.signal,
      method: 'HEAD',
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
};

/**
 * Measure page load time
 */
export const measurePageLoadTime = async (page: any, url: string): Promise<number> => {
  const startTime = Date.now();
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  return Date.now() - startTime;
};

/**
 * Check for console errors
 */
export const checkConsoleErrors = async (page: any): Promise<string[]> => {
  const errors: string[] = [];

  page.on('console', (msg: any) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  return errors;
};
