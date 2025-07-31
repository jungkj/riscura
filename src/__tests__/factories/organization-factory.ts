import { Organization } from '@prisma/client';

export interface CreateOrganizationOptions {
  id?: string;
  name?: string;
  domain?: string;
  settings?: any;
  plan?: string;
  stripeCustomerId?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class OrganizationFactory {
  private static counter = 1;

  static create(options: CreateOrganizationOptions = {}): Organization {
    const id = options.id || `org-${this.counter++}`;

    return {
      id,
      name: options.name || `Test Organization ${this.counter}`,
      domain: options.domain || `test-org-${this.counter}.com`,
      settings: options.settings || {
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        currency: 'USD',
        riskMatrix: '5x5',
        autoArchiveRisks: false,
        requireApprovalForHighRisks: true,
      },
      plan: options.plan || 'free',
      stripeCustomerId: options.stripeCustomerId || null,
      isActive: options.isActive ?? true,
      createdAt: options.createdAt || new Date(),
      updatedAt: options.updatedAt || new Date(),
    } as Organization;
  }

  static createEnterprise(options: CreateOrganizationOptions = {}): Organization {
    return this.create({
      ...options,
      plan: 'enterprise',
      name: options.name || `Enterprise Org ${this.counter}`,
      settings: {
        ...options.settings,
        features: {
          aiAnalysis: true,
          advancedReporting: true,
          customWorkflows: true,
          sso: true,
          auditLogs: true,
        },
      },
    });
  }

  static createPro(options: CreateOrganizationOptions = {}): Organization {
    return this.create({
      ...options,
      plan: 'pro',
      name: options.name || `Pro Org ${this.counter}`,
      settings: {
        ...options.settings,
        features: {
          aiAnalysis: true,
          advancedReporting: true,
          customWorkflows: false,
          sso: false,
          auditLogs: true,
        },
      },
    });
  }

  static createFree(options: CreateOrganizationOptions = {}): Organization {
    return this.create({
      ...options,
      plan: 'free',
      name: options.name || `Free Org ${this.counter}`,
      settings: {
        ...options.settings,
        features: {
          aiAnalysis: false,
          advancedReporting: false,
          customWorkflows: false,
          sso: false,
          auditLogs: false,
        },
        limits: {
          maxRisks: 50,
          maxUsers: 5,
          maxControls: 100,
        },
      },
    });
  }

  static createBatch(count: number, options: CreateOrganizationOptions = {}): Organization[] {
    return Array.from({ length: count }, () => this.create(options));
  }

  static createWithDomain(domain: string): Organization {
    return this.create({
      domain,
      name: `${domain.split('.')[0]} Organization`,
    });
  }

  static reset(): void {
    this.counter = 1;
  }
}

// Export commonly used test organizations
export const testOrganizations = {
  default: OrganizationFactory.create({
    id: 'org-1',
    name: 'Default Test Organization',
    domain: 'test.com',
  }),

  enterprise: OrganizationFactory.createEnterprise({
    id: 'org-enterprise',
    name: 'Enterprise Test Org',
    domain: 'enterprise.com',
  }),

  pro: OrganizationFactory.createPro({
    id: 'org-pro',
    name: 'Pro Test Org',
    domain: 'pro.com',
  }),

  free: OrganizationFactory.createFree({
    id: 'org-free',
    name: 'Free Test Org',
    domain: 'free.com',
  }),
};
