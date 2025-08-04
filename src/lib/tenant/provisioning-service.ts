import { db } from '@/lib/db';
import { BillingManager } from '@/lib/billing/manager';
import { encrypt } from '@/lib/security/encryption';
import crypto from 'crypto';

export interface TenantProvisioningRequest {
  organizationName: string;
  adminEmail: string;
  adminFirstName: string;
  adminLastName: string;
  industry?: string;
  companySize?: string;
  planId: string;
  customDomain?: string;
  features?: string[];
  billingInfo?: {
    paymentMethodId?: string;
    billingEmail?: string;
    taxId?: string;
    address?: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    }
  }
  trialDays?: number;
  onboardingOptions?: {
    skipWelcome?: boolean;
    autoCreateSampleData?: boolean;
    enabledModules?: string[];
  }
}

export interface TenantProvisioningResult {
  success: boolean;
  organizationId?: string;
  adminUserId?: string;
  loginUrl?: string;
  temporaryPassword?: string;
  setupToken?: string;
  billingStatus?: string;
  errors?: string[];
  warnings?: string[];
}

export interface TenantTemplate {
  id: string;
  name: string;
  description: string;
  industry: string;
  features: string[];
  defaultRoles: Array<{
    name: string;
    permissions: string[];
    isDefault?: boolean;
  }>;
  sampleData: {
    risks?: any[];
    controls?: any[];
    frameworks?: any[];
  }
  configuration: Record<string, any>;
}

export class TenantProvisioningService {
  private billingManager: BillingManager;

  constructor() {
    this.billingManager = new BillingManager();
  }

  /**
   * Provision a new tenant with full setup
   */
  async provisionTenant(_request: TenantProvisioningRequest): Promise<TenantProvisioningResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Step 1: Validate request
      const validation = this.validateProvisioningRequest(request)
      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors,
        }
      }

      // Step 2: Create organization
      const organizationResult = await this.createOrganization(request)
      if (!organizationResult.success) {
        return {
          success: false,
          errors: organizationResult.errors || ['Failed to create organization'],
        }
      }

      const organizationId = organizationResult.organizationId!;

      // Step 3: Create admin user
      const adminResult = await this.createAdminUser(request, organizationId)
      if (!adminResult.success) {
        // Cleanup organization
        await this.cleanupOrganization(organizationId)
        return {
          success: false,
          errors: adminResult.errors || ['Failed to create admin user'],
        }
      }

      const adminUserId = adminResult.userId!;

      // Step 4: Setup billing
      let billingStatus = 'pending'
      try {
        const billingResult = await this.setupBilling(request, organizationId);
        billingStatus = billingResult.status;
        if (billingResult.warnings) {
          warnings.push(...billingResult.warnings);
        }
      } catch (error) {
        warnings.push(
          `Billing setup incomplete: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }

      // Step 5: Apply tenant template
      try {
        await this.applyTenantTemplate(request, organizationId)
      } catch (error) {
        warnings.push(
          `Template application incomplete: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }

      // Step 6: Setup domain and branding
      try {
        await this.setupCustomDomain(request, organizationId)
      } catch (error) {
        warnings.push(
          `Custom domain setup incomplete: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }

      // Step 7: Initialize sample data (if requested)
      if (request.onboardingOptions?.autoCreateSampleData) {
        try {
          await this.createSampleData(organizationId, request.industry)
        } catch (error) {
          warnings.push(
            `Sample data creation incomplete: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      // Step 8: Generate setup token and temporary password
      const setupToken = this.generateSetupToken(organizationId, adminUserId)
      const temporaryPassword = this.generateTemporaryPassword();

      // Store encrypted temporary password
      await this.storeTemporaryCredentials(adminUserId, temporaryPassword, setupToken)

      // Step 9: Send welcome email (async)
      this.sendWelcomeEmail(request, {
        organizationId,
        adminUserId,
        temporaryPassword,
        setupToken,
      }).catch((error) => {
        // console.error('Failed to send welcome email:', error)
      });

      return {
        success: true,
        organizationId,
        adminUserId,
        loginUrl: this.generateLoginUrl(organizationId, setupToken),
        temporaryPassword,
        setupToken,
        billingStatus,
        warnings: warnings.length > 0 ? warnings : undefined,
      }
    } catch (error) {
      // console.error('Tenant provisioning error:', error)
      return {
        success: false,
        errors: [
          `Provisioning failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
      }
    }
  }

  /**
   * Get available tenant templates
   */
  async getTenantTemplates(): Promise<TenantTemplate[]> {
    return [
      {
        id: 'financial-services',
        name: 'Financial Services',
        description: 'Pre-configured for banks, credit unions, and financial institutions',
        industry: 'financial',
        features: ['sox-compliance', 'basel-framework', 'stress-testing', 'model-risk-management'],
        defaultRoles: [
          {
            name: 'Risk Manager',
            permissions: ['risks:read', 'risks:write', 'controls:read', 'controls:write'],
            isDefault: true,
          },
          {
            name: 'Compliance Officer',
            permissions: ['compliance:read', 'compliance:write', 'audit:read'],
          },
          {
            name: 'Executive',
            permissions: ['dashboard:read', 'reports:read'],
          },
        ],
        sampleData: {
          risks: this.getFinancialSampleRisks(),
          controls: this.getFinancialSampleControls(),
          frameworks: ['SOX', 'BASEL III', 'COSO'],
        },
        configuration: {
          riskCategories: ['Operational', 'Credit', 'Market', 'Liquidity', 'Regulatory'],
          riskAppetite: 'moderate',
          reportingFrequency: 'monthly',
        },
      },
      {
        id: 'healthcare',
        name: 'Healthcare',
        description: 'Pre-configured for healthcare organizations',
        industry: 'healthcare',
        features: ['hipaa-compliance', 'patient-safety', 'clinical-risk'],
        defaultRoles: [
          {
            name: 'Risk Manager',
            permissions: ['risks:read', 'risks:write', 'controls:read', 'controls:write'],
            isDefault: true,
          },
          {
            name: 'Privacy Officer',
            permissions: ['privacy:read', 'privacy:write', 'compliance:read'],
          },
        ],
        sampleData: {
          risks: this.getHealthcareSampleRisks(),
          controls: this.getHealthcareSampleControls(),
          frameworks: ['HIPAA', 'HITECH', 'Joint Commission'],
        },
        configuration: {
          riskCategories: ['Patient Safety', 'Privacy', 'Operational', 'Regulatory'],
          riskAppetite: 'low',
          reportingFrequency: 'quarterly',
        },
      },
      {
        id: 'technology',
        name: 'Technology',
        description: 'Pre-configured for technology companies',
        industry: 'technology',
        features: ['cyber-security', 'data-protection', 'software-risk'],
        defaultRoles: [
          {
            name: 'Risk Manager',
            permissions: ['risks:read', 'risks:write', 'controls:read', 'controls:write'],
            isDefault: true,
          },
          {
            name: 'CISO',
            permissions: ['security:read', 'security:write', 'incidents:read'],
          },
        ],
        sampleData: {
          risks: this.getTechnologySampleRisks(),
          controls: this.getTechnologySampleControls(),
          frameworks: ['ISO 27001', 'GDPR', 'SOC 2'],
        },
        configuration: {
          riskCategories: ['Cybersecurity', 'Data Privacy', 'Operational', 'Third Party'],
          riskAppetite: 'moderate',
          reportingFrequency: 'monthly',
        },
      },
    ];
  }

  /**
   * Get tenant provisioning status
   */
  async getProvisioningStatus(_organizationId: string): Promise<{
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
    completedSteps: string[];
    totalSteps: number;
    currentStep?: string;
    errors?: string[];
  }> {
    // In a real implementation, this would check the database for provisioning status
    return {
      status: 'completed',
      completedSteps: [
        'organization-created',
        'admin-user-created',
        'billing-setup',
        'template-applied',
        'domain-configured',
        'welcome-email-sent',
      ],
      totalSteps: 6,
    }
  }

  /**
   * Update tenant configuration
   */
  async updateTenantConfiguration(_organizationId: string,
    configuration: Record<string, any>
  ): Promise<{ success: boolean; errors?: string[] }> {
    try {
      await db.client.organization.update({
        where: { id: organizationId },
        data: {
          settings: configuration,
        },
      });

      return { success: true }
    } catch (error) {
      return {
        success: false,
        errors: [
          `Failed to update configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
      }
    }
  }

  // Private helper methods
  private validateProvisioningRequest(_request: TenantProvisioningRequest): {
    valid: boolean
    errors: string[];
  } {
    const errors: string[] = [];

    if (!request.organizationName?.trim()) {
      errors.push('Organization name is required');
    }

    if (!request.adminEmail?.trim()) {
      errors.push('Admin email is required');
    } else if (!this.isValidEmail(request.adminEmail)) {
      errors.push('Invalid admin email format');
    }

    if (!request.adminFirstName?.trim()) {
      errors.push('Admin first name is required');
    }

    if (!request.adminLastName?.trim()) {
      errors.push('Admin last name is required');
    }

    if (!request.planId?.trim()) {
      errors.push('Plan ID is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  private async createOrganization(_request: TenantProvisioningRequest): Promise<{
    success: boolean;
    organizationId?: string;
    errors?: string[];
  }> {
    try {
      const organization = await db.client.organization.create({
        data: {
          name: request.organizationName,
          domain: request.customDomain,
          industry: request.industry,
          companySize: request.companySize,
          settings: {
            features: request.features || [],
            onboarding: request.onboardingOptions || {},
          },
          metadata: {
            provisionedAt: new Date().toISOString(),
            template: this.getTemplateIdForIndustry(request.industry),
            provisioningVersion: '1.0',
          },
        },
      });

      return {
        success: true,
        organizationId: organization.id,
      }
    } catch (error) {
      return {
        success: false,
        errors: [
          `Organization creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
      }
    }
  }

  private async createAdminUser(_request: TenantProvisioningRequest,
    organizationId: string
  ): Promise<{
    success: boolean;
    userId?: string;
    errors?: string[];
  }> {
    try {
      const hashedPassword = await this.hashPassword(
        'temp-' + crypto.randomBytes(8).toString('hex')
      );

      const user = await db.client.user.create({
        data: {
          email: request.adminEmail,
          firstName: request.adminFirstName,
          lastName: request.adminLastName,
          passwordHash: hashedPassword,
          organizationId,
          role: 'admin',
          emailVerified: false,
          isActive: true,
          metadata: {
            isProvisioned: true,
            needsPasswordReset: true,
            provisionedAt: new Date().toISOString(),
          },
        },
      });

      return {
        success: true,
        userId: user.id,
      }
    } catch (error) {
      return {
        success: false,
        errors: [
          `User creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
      }
    }
  }

  private async setupBilling(_request: TenantProvisioningRequest,
    organizationId: string
  ): Promise<{
    status: string;
    warnings?: string[];
  }> {
    const warnings: string[] = [];

    try {
      if (request.billingInfo?.paymentMethodId) {
        // Create subscription with payment method
        await this.billingManager.createSubscription(organizationId, request.planId, {
          trialDays: request.trialDays,
          paymentMethodId: request.billingInfo.paymentMethodId,
        })
        return { status: 'active' }
      } else {
        // Start trial without payment method
        await this.billingManager.createSubscription(organizationId, request.planId, {
          trialDays: request.trialDays || 14,
        })
        return {
          status: 'trial',
          warnings: [
            'Trial started without payment method - billing setup will be required before trial expires',
          ],
        }
      }
    } catch (error) {
      return {
        status: 'pending',
        warnings: [
          `Billing setup incomplete: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
      }
    }
  }

  private async applyTenantTemplate(_request: TenantProvisioningRequest,
    organizationId: string
  ): Promise<void> {
    const templates = await this.getTenantTemplates();
    const template = templates.find((t) => t.industry === request.industry) || templates[0];

    // Create default roles
    for (const roleTemplate of template.defaultRoles) {
      await db.client.role.create({
        data: {
          name: roleTemplate.name,
          permissions: roleTemplate.permissions,
          organizationId,
          isDefault: roleTemplate.isDefault || false,
        },
      })
    }

    // Update organization with template configuration
    await db.client.organization.update({
      where: { id: organizationId },
      data: {
        settings: {
          ...template.configuration,
          templateId: template.id,
        },
      },
    })
  }

  private async setupCustomDomain(_request: TenantProvisioningRequest,
    organizationId: string
  ): Promise<void> {
    if (!request.customDomain) return;

    // Store domain configuration
    await db.client.organization.update({
      where: { id: organizationId },
      data: {
        domain: request.customDomain,
        settings: {
          customDomain: {
            domain: request.customDomain,
            status: 'pending-verification',
            configuredAt: new Date().toISOString(),
          },
        },
      },
    })

    // TODO: Setup DNS verification, SSL certificates, etc.
  }

  private async createSampleData(_organizationId: string, industry?: string): Promise<void> {
    const templates = await this.getTenantTemplates()
    const template = templates.find((t) => t.industry === industry) || templates[0];

    // Create sample risks
    if (template.sampleData.risks) {
      for (const riskData of template.sampleData.risks) {
        await db.client.risk.create({
          data: {
            ...riskData,
            organizationId,
          },
        })
      }
    }

    // Create sample controls
    if (template.sampleData.controls) {
      for (const controlData of template.sampleData.controls) {
        await db.client.control.create({
          data: {
            ...controlData,
            organizationId,
          },
        })
      }
    }
  }

  private async storeTemporaryCredentials(_userId: string,
    temporaryPassword: string,
    setupToken: string
  ): Promise<void> {
    const encrypted = await encrypt(
      JSON.stringify({
        temporaryPassword,
        setupToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      })
    );

    // Store in cache or database
    // TODO: Implement proper storage
  }

  private async sendWelcomeEmail(_request: TenantProvisioningRequest,
    provisioningResult: {
      organizationId: string
      adminUserId: string;
      temporaryPassword: string;
      setupToken: string;
    }
  ): Promise<void> {
    // TODO: Implement email sending
    // console.log(`Sending welcome email to ${request.adminEmail}`)
  }

  private async cleanupOrganization(_organizationId: string): Promise<void> {
    try {
      await db.client.organization.delete({
        where: { id: organizationId },
      });
    } catch (error) {
      // console.error('Failed to cleanup organization:', error)
    }
  }

  // Utility methods
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email);
  }

  private generateSetupToken(_organizationId: string, userId: string): string {
    const payload = {
      organizationId,
      userId,
      timestamp: Date.now(),
      type: 'setup',
    }
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  private generateTemporaryPassword(): string {
    return crypto.randomBytes(12).toString('base64').replace(/[+/=]/g, '').substring(0, 12);
  }

  private generateLoginUrl(_organizationId: string, setupToken: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    return `${baseUrl}/auth/setup?token=${setupToken}&org=${organizationId}`;
  }

  private getTemplateIdForIndustry(industry?: string): string {
    const mapping: Record<string, string> = {
      financial: 'financial-services',
      healthcare: 'healthcare',
      technology: 'technology',
    }
    return mapping[industry || ''] || 'technology';
  }

  private async hashPassword(password: string): Promise<string> {
    // TODO: Implement proper password hashing
    return crypto.createHash('sha256').update(password).digest('hex')
  }

  // Sample data generators
  private getFinancialSampleRisks(): any[] {
    return [
      {
        title: 'Credit Risk Concentration',
        description: 'Concentration of credit exposure to specific sectors or counterparties',
        category: 'Credit',
        likelihood: 'medium',
        impact: 'high',
        status: 'open',
      },
      {
        title: 'Operational Risk - IT Systems',
        description: 'Risk of IT system failures affecting business operations',
        category: 'Operational',
        likelihood: 'low',
        impact: 'high',
        status: 'open',
      },
    ]
  }

  private getFinancialSampleControls(): any[] {
    return [
      {
        title: 'Credit Risk Monitoring',
        description: 'Monthly monitoring and reporting of credit risk concentrations',
        category: 'Preventive',
        frequency: 'monthly',
        status: 'active',
      },
    ];
  }

  private getHealthcareSampleRisks(): any[] {
    return [
      {
        title: 'Patient Data Breach',
        description: 'Unauthorized access to patient health information',
        category: 'Privacy',
        likelihood: 'medium',
        impact: 'very-high',
        status: 'open',
      },
    ];
  }

  private getHealthcareSampleControls(): any[] {
    return [
      {
        title: 'Access Control Management',
        description: 'Role-based access controls for patient data systems',
        category: 'Preventive',
        frequency: 'continuous',
        status: 'active',
      },
    ];
  }

  private getTechnologySampleRisks(): any[] {
    return [
      {
        title: 'Data Security Breach',
        description: 'Unauthorized access to customer or proprietary data',
        category: 'Cybersecurity',
        likelihood: 'medium',
        impact: 'high',
        status: 'open',
      },
    ];
  }

  private getTechnologySampleControls(): any[] {
    return [
      {
        title: 'Multi-Factor Authentication',
        description: 'MFA implementation for all system access',
        category: 'Preventive',
        frequency: 'continuous',
        status: 'active',
      },
    ];
  }
}
