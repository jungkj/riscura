// Test User Service for Demo/Development Environment
import { v4 as uuidv4 } from 'uuid';

export interface TestUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
  organizationId: string;
  organization: {
    id: string;
    name: string;
    domain: string;
    isActive: boolean;
  };
  isActive: boolean;
  emailVerified: Date;
  lastLogin?: Date;
  profile: {
    avatar?: string;
    title: string;
    department: string;
    phone?: string;
    timezone: string;
  };
}

export interface TestOrganization {
  id: string;
  name: string;
  domain: string;
  isActive: boolean;
  subscription: {
    plan: string;
    status: string;
    expiresAt: Date;
  };
  settings: {
    features: string[];
    limits: Record<string, number>;
  };
}

export interface DemoData {
  users: TestUser[];
  organization: TestOrganization;
  risks: any[];
  controls: any[];
  documents: any[];
  dashboardMetrics: any;
}

// Test Organization
export const TEST_ORGANIZATION: TestOrganization = {
  id: 'org_demo_riscura',
  name: 'Riscura Demo Corporation',
  domain: 'demo.riscura.com',
  isActive: true,
  subscription: {
    plan: 'professional',
    status: 'active',
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
  },
  settings: {
    features: ['ai-insights', 'real-time-collaboration', 'advanced-reporting', 'api-access'],
    limits: {
      users: -1,
      risks: -1,
      controls: -1,
      documents: -1,
      storage: 100, // GB
    },
  },
};

// Test Users with different roles and permissions
export const TEST_USERS: TestUser[] = [
  {
    id: 'user_admin_demo',
    email: 'admin@riscura.demo',
    firstName: 'Alex',
    lastName: 'Administrator',
    role: 'ADMIN',
    permissions: ['*'], // All permissions
    organizationId: TEST_ORGANIZATION.id,
    organization: {
      id: TEST_ORGANIZATION.id,
      name: TEST_ORGANIZATION.name,
      domain: TEST_ORGANIZATION.domain,
      isActive: TEST_ORGANIZATION.isActive,
    },
    isActive: true,
    emailVerified: new Date(),
    lastLogin: new Date(),
    profile: {
      title: 'Chief Risk Officer',
      department: 'Risk Management',
      phone: '+1 (555) 123-4567',
      timezone: 'America/New_York',
      avatar:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    },
  },
  {
    id: 'user_manager_demo',
    email: 'manager@riscura.demo',
    firstName: 'Maria',
    lastName: 'Manager',
    role: 'MANAGER',
    permissions: [
      'risks:read',
      'risks:write',
      'risks:delete',
      'controls:read',
      'controls:write',
      'documents:read',
      'documents:write',
      'reports:read',
      'reports:write',
      'dashboard:read',
      'ai:read',
      'ai:write',
    ],
    organizationId: TEST_ORGANIZATION.id,
    organization: {
      id: TEST_ORGANIZATION.id,
      name: TEST_ORGANIZATION.name,
      domain: TEST_ORGANIZATION.domain,
      isActive: TEST_ORGANIZATION.isActive,
    },
    isActive: true,
    emailVerified: new Date(),
    lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    profile: {
      title: 'Risk Manager',
      department: 'Compliance',
      phone: '+1 (555) 234-5678',
      timezone: 'America/Los_Angeles',
      avatar:
        'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    },
  },
  {
    id: 'user_analyst_demo',
    email: 'analyst@riscura.demo',
    firstName: 'John',
    lastName: 'Analyst',
    role: 'USER',
    permissions: [
      'risks:read',
      'risks:write',
      'controls:read',
      'documents:read',
      'reports:read',
      'dashboard:read',
      'ai:read',
    ],
    organizationId: TEST_ORGANIZATION.id,
    organization: {
      id: TEST_ORGANIZATION.id,
      name: TEST_ORGANIZATION.name,
      domain: TEST_ORGANIZATION.domain,
      isActive: TEST_ORGANIZATION.isActive,
    },
    isActive: true,
    emailVerified: new Date(),
    lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    profile: {
      title: 'Risk Analyst',
      department: 'Risk Management',
      phone: '+1 (555) 345-6789',
      timezone: 'Europe/London',
      avatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    },
  },
];

// Demo Risks Data
export const DEMO_RISKS = [
  {
    id: 'risk_cyber_security',
    title: 'Cybersecurity Threat',
    description: 'Potential data breach due to inadequate cybersecurity measures',
    category: 'Operational',
    type: 'Technology',
    severity: 'High',
    likelihood: 'Medium',
    impact: 'High',
    riskScore: 85,
    status: 'Open',
    ownerId: 'user_manager_demo',
    department: 'IT',
    businessUnit: 'Technology',
    tags: ['cybersecurity', 'data-protection', 'IT'],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'risk_regulatory_compliance',
    title: 'GDPR Compliance Gap',
    description: 'Non-compliance with GDPR data protection requirements',
    category: 'Compliance',
    type: 'Regulatory',
    severity: 'Critical',
    likelihood: 'High',
    impact: 'Critical',
    riskScore: 95,
    status: 'In Progress',
    ownerId: 'user_admin_demo',
    department: 'Legal',
    businessUnit: 'Compliance',
    tags: ['gdpr', 'compliance', 'legal'],
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'risk_financial_fraud',
    title: 'Financial Fraud Risk',
    description: 'Risk of financial fraud due to weak internal controls',
    category: 'Financial',
    type: 'Fraud',
    severity: 'Medium',
    likelihood: 'Low',
    impact: 'High',
    riskScore: 65,
    status: 'Mitigated',
    ownerId: 'user_analyst_demo',
    department: 'Finance',
    businessUnit: 'Finance',
    tags: ['fraud', 'financial', 'controls'],
    createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
];

// Demo Controls Data
export const DEMO_CONTROLS = [
  {
    id: 'control_access_management',
    title: 'Access Control Management',
    description: 'Multi-factor authentication and role-based access control',
    category: 'Preventive',
    type: 'Technical',
    status: 'Implemented',
    effectiveness: 'High',
    ownerId: 'user_manager_demo',
    department: 'IT',
    tags: ['access-control', 'mfa', 'security'],
    linkedRisks: ['risk_cyber_security'],
    testingFrequency: 'Quarterly',
    lastTested: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    nextTest: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'control_data_encryption',
    title: 'Data Encryption Standard',
    description: 'End-to-end encryption for sensitive data',
    category: 'Preventive',
    type: 'Technical',
    status: 'Planned',
    effectiveness: 'Medium',
    ownerId: 'user_admin_demo',
    department: 'IT',
    tags: ['encryption', 'data-protection'],
    linkedRisks: ['risk_cyber_security', 'risk_regulatory_compliance'],
    testingFrequency: 'Monthly',
    lastTested: null,
    nextTest: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
  },
];

// Demo Documents Data
export const DEMO_DOCUMENTS = [
  {
    id: 'doc_risk_policy',
    title: 'Enterprise Risk Management Policy',
    description: 'Comprehensive policy document for enterprise risk management',
    category: 'Policy',
    type: 'Governance',
    status: 'Approved',
    version: '2.1',
    ownerId: 'user_admin_demo',
    confidentiality: 'Internal',
    department: 'Risk Management',
    tags: ['policy', 'risk-management', 'governance'],
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    size: 2.5, // MB
  },
  {
    id: 'doc_security_procedures',
    title: 'Cybersecurity Incident Response Procedures',
    description: 'Step-by-step procedures for responding to cybersecurity incidents',
    category: 'Procedure',
    type: 'Operational',
    status: 'Draft',
    version: '1.0',
    ownerId: 'user_manager_demo',
    confidentiality: 'Confidential',
    department: 'IT',
    tags: ['cybersecurity', 'incident-response', 'procedures'],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    size: 1.8, // MB
  },
];

// Dashboard Metrics
export const DEMO_DASHBOARD_METRICS = {
  riskSummary: {
    total: 25,
    critical: 3,
    high: 8,
    medium: 10,
    low: 4,
    trend: '+2 this month',
  },
  controlsSummary: {
    total: 45,
    implemented: 32,
    planned: 8,
    testing: 5,
    effectiveness: 87, // percentage
  },
  complianceScore: {
    overall: 92,
    frameworks: {
      'ISO 27001': 95,
      GDPR: 88,
      SOX: 94,
    },
  },
  recentActivity: [
    {
      type: 'Risk Updated',
      description: 'Cybersecurity Threat risk severity updated to High',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      user: 'Maria Manager',
    },
    {
      type: 'Control Tested',
      description: 'Access Control Management testing completed',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      user: 'John Analyst',
    },
    {
      type: 'Document Approved',
      description: 'Enterprise Risk Management Policy approved',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      user: 'Alex Administrator',
    },
  ],
};

// Main function to get complete demo data
export function getDemoData(): DemoData {
  return {
    users: TEST_USERS,
    organization: TEST_ORGANIZATION,
    risks: DEMO_RISKS,
    controls: DEMO_CONTROLS,
    documents: DEMO_DOCUMENTS,
    dashboardMetrics: DEMO_DASHBOARD_METRICS,
  };
}

// Helper function to get user by email
export function getTestUserByEmail(email: string): TestUser | null {
  return TEST_USERS.find((user) => user.email === email) || null;
}

// Helper function to validate test credentials
export function validateTestCredentials(email: string, password: string): TestUser | null {
  const user = getTestUserByEmail(email);

  // Test password is 'demo123' for all test users
  if (user && password === 'demo123') {
    return user;
  }

  return null;
}

// Get user permissions
export function getUserPermissions(userId: string): string[] {
  const user = TEST_USERS.find((u) => u.id === userId);
  return user?.permissions || [];
}

// Check if user has permission
export function hasPermission(userId: string, permission: string): boolean {
  const permissions = getUserPermissions(userId);
  return permissions.includes('*') || permissions.includes(permission);
}
