/**
 * Comprehensive test utilities for Riscura application
 * Provides reusable test helpers, mocks, and fixtures
 */

import { NextRequest, NextResponse } from 'next/server';
import { User, Organization, Risk, Control, Document } from '@prisma/client';
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

export const createTestSubscriptionPlan = (overrides: Partial<SubscriptionPlan> = {}): SubscriptionPlan => ({
  id: 'test-plan-123',
  name: 'Test Professional',
  description: 'Professional plan for testing',
  type: 'professional',
  price: 99,
  currency: 'USD',
  billingInterval: 'monthly',
  features: [
    { id: 'feature-1', name: 'Advanced Analytics', description: 'Detailed insights', category: 'analytics', included: true },
    { id: 'feature-2', name: 'API Access', description: 'RESTful API', category: 'integration', included: true },
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

export const createTestSubscription = (overrides: Partial<OrganizationSubscription> = {}): OrganizationSubscription => ({
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
    data: [{
      price: {
        id: 'price_test123',
        unit_amount: 9900,
        recurring: { interval: 'month' }
      },
      quantity: 1,
    }]
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
    data: [{
      id: 'il_test123',
      amount: 9900,
      currency: 'usd',
      description: 'Professional Plan',
      quantity: 1,
      metadata: {},
    }]
  },
  metadata: {},
  ...overrides,
});

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

export const expectValidApiResponse = (response: any) => {
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

export const expectValidPaginationResponse = (response: any) => {
  expectValidApiResponse(response);
  expect(response).toHaveProperty('pagination');
  expect(response.pagination).toHaveProperty('page');
  expect(response.pagination).toHaveProperty('limit');
  expect(response.pagination).toHaveProperty('total');
  expect(response.pagination).toHaveProperty('pages');
};

export const expectSubscriptionEnforcement = (response: any, expectedCode = 'SUBSCRIPTION_ERROR') => {
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
  await prisma.organizationSubscription.deleteMany({ where: { organizationId: { startsWith: 'test-' } } });
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
  const result = await fn();
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  console.log(`${name} executed in ${duration.toFixed(2)}ms`);
  
  return { result, duration };
};

export const expectPerformance = (duration: number, maxMs: number) => {
  expect(duration).toBeLessThan(maxMs);
};

// ============================================================================
// EXPORTS
// ============================================================================

export type MockPrismaClient = ReturnType<typeof createMockPrismaClient>;