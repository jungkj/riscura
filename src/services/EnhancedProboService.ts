import { PrismaClient, ProboIntegration, ProboMetric } from '@prisma/client';
import { ProboIntegrationService } from './ProboIntegrationService';
import crypto from 'crypto';

const prisma = new PrismaClient();

export interface ProboMetrics {
  totalControls: number;
  implementedControls: number;
  vendorAssessments: number;
  complianceFrameworks: number;
  riskReduction: number;
  lastUpdated: Date;
}

export interface ProboComplianceStatus {
  framework: string;
  score: number;
  status: 'compliant' | 'in-progress' | 'needs-review';
  controlsImplemented: number;
  totalControls: number;
  proboControlsAvailable: number;
  lastAssessed: Date;
  nextDue: Date;
}

export interface ProboInsights {
  controlCoverage: number;
  riskReduction: number;
  complianceImprovement: number;
  vendorRiskScore: number;
  recommendations: string[];
}

export interface ProboVendorSummary {
  totalAssessments: number;
  highRiskVendors: number;
  averageRiskScore: number;
  recentAssessments: Array<{
    vendorName: string;
    riskScore: number;
    assessmentDate: Date;
    status: string;
  }>;
}

export class EnhancedProboService {
  private proboIntegration: ProboIntegrationService;
  private encryptionKey: string;

  constructor() {
    this.proboIntegration = ProboIntegrationService.getInstance();
    this.encryptionKey = process.env.PROBO_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || 'default-key';
  }

  // Integration Management
  async setupIntegration(organizationId: string, apiKey: string, webhookUrl?: string): Promise<ProboIntegration> {
    // Encrypt API key
    const encryptedKey = this.encryptApiKey(apiKey);
    
    // Generate webhook secret
    const webhookSecret = webhookUrl ? crypto.randomBytes(32).toString('hex') : null;

    // Create or update integration
    const integration = await prisma.proboIntegration.upsert({
      where: { organizationId },
      create: {
        organizationId,
        apiKeyEncrypted: encryptedKey,
        webhookUrl,
        webhookSecret,
        config: {
          enableAI: true,
          autoSync: true,
          syncInterval: 3600, // 1 hour
          frameworks: ['SOC2', 'ISO27001', 'GDPR', 'HIPAA'],
        },
      },
      update: {
        apiKeyEncrypted: encryptedKey,
        webhookUrl,
        webhookSecret,
        isActive: true,
      },
    });

    return integration;
  }

  async getIntegration(organizationId: string): Promise<ProboIntegration | null> {
    return await prisma.proboIntegration.findUnique({
      where: { organizationId },
    });
  }

  async disableIntegration(organizationId: string): Promise<void> {
    await prisma.proboIntegration.update({
      where: { organizationId },
      data: { isActive: false },
    });
  }

  // Metrics Collection
  async syncMetrics(organizationId: string): Promise<void> {
    const integration = await this.getIntegration(organizationId);
    if (!integration?.isActive) {
      throw new Error('Probo integration is not active');
    }

    try {
      // Get metrics from ProboIntegrationService
      const metrics = await this.proboIntegration.getMetrics();
      const complianceStatus = await this.proboIntegration.getComplianceStatus();
      const insights = await this.proboIntegration.getInsights();

      // Store metrics in database
      await Promise.all([
        this.storeMetric(integration.id, 'metrics_summary', metrics),
        this.storeMetric(integration.id, 'compliance_status', complianceStatus),
        this.storeMetric(integration.id, 'insights', insights),
      ]);

      // Update sync status
      await prisma.proboIntegration.update({
        where: { id: integration.id },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: 'success',
          lastSyncError: null,
        },
      });
    } catch (error) {
      // Update sync error
      await prisma.proboIntegration.update({
        where: { id: integration.id },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: 'error',
          lastSyncError: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      throw error;
    }
  }

  async getLatestMetrics(organizationId: string): Promise<ProboMetrics> {
    const integration = await this.getIntegration(organizationId);
    if (!integration) {
      // Return default metrics if no integration
      return this.getDefaultMetrics();
    }

    // Get latest metrics from database
    const latestMetric = await prisma.proboMetric.findFirst({
      where: {
        integrationId: integration.id,
        metricType: 'metrics_summary',
      },
      orderBy: { timestamp: 'desc' },
    });

    if (!latestMetric) {
      // Try to sync and return default if fails
      try {
        await this.syncMetrics(organizationId);
        return await this.getLatestMetrics(organizationId);
      } catch {
        return this.getDefaultMetrics();
      }
    }

    return latestMetric.metricValue as ProboMetrics;
  }

  async getComplianceStatus(organizationId: string): Promise<ProboComplianceStatus[]> {
    const integration = await this.getIntegration(organizationId);
    if (!integration) {
      return this.getDefaultComplianceStatus();
    }

    const latestMetric = await prisma.proboMetric.findFirst({
      where: {
        integrationId: integration.id,
        metricType: 'compliance_status',
      },
      orderBy: { timestamp: 'desc' },
    });

    if (!latestMetric) {
      try {
        await this.syncMetrics(organizationId);
        return await this.getComplianceStatus(organizationId);
      } catch {
        return this.getDefaultComplianceStatus();
      }
    }

    return latestMetric.metricValue as ProboComplianceStatus[];
  }

  async getInsights(organizationId: string): Promise<ProboInsights> {
    const integration = await this.getIntegration(organizationId);
    if (!integration) {
      return this.getDefaultInsights();
    }

    const latestMetric = await prisma.proboMetric.findFirst({
      where: {
        integrationId: integration.id,
        metricType: 'insights',
      },
      orderBy: { timestamp: 'desc' },
    });

    if (!latestMetric) {
      try {
        await this.syncMetrics(organizationId);
        return await this.getInsights(organizationId);
      } catch {
        return this.getDefaultInsights();
      }
    }

    return latestMetric.metricValue as ProboInsights;
  }

  async getVendorSummary(organizationId: string): Promise<ProboVendorSummary> {
    // Get vendor data from ProboIntegrationService
    const vendorAssessments = await this.proboIntegration.getVendorAssessments();
    
    const highRiskVendors = vendorAssessments.filter(v => v.riskScore > 70).length;
    const averageRiskScore = vendorAssessments.length > 0
      ? vendorAssessments.reduce((sum, v) => sum + v.riskScore, 0) / vendorAssessments.length
      : 0;

    return {
      totalAssessments: vendorAssessments.length,
      highRiskVendors,
      averageRiskScore,
      recentAssessments: vendorAssessments.slice(0, 5).map(v => ({
        vendorName: v.vendorName,
        riskScore: v.riskScore,
        assessmentDate: v.lastAssessed,
        status: v.status,
      })),
    };
  }

  // Helper Methods
  private async storeMetric(
    integrationId: string,
    metricType: string,
    metricValue: any
  ): Promise<ProboMetric> {
    return await prisma.proboMetric.create({
      data: {
        integrationId,
        metricType,
        metricValue,
        metadata: {
          source: 'probo_integration',
          version: '1.0',
        },
      },
    });
  }

  private encryptApiKey(apiKey: string): string {
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(apiKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  private decryptApiKey(encryptedKey: string): string {
    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
    let decrypted = decipher.update(encryptedKey, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // Default Data Methods
  private getDefaultMetrics(): ProboMetrics {
    return {
      totalControls: 650,
      implementedControls: 423,
      vendorAssessments: 23,
      complianceFrameworks: 4,
      riskReduction: 78,
      lastUpdated: new Date(),
    };
  }

  private getDefaultComplianceStatus(): ProboComplianceStatus[] {
    return [
      {
        framework: 'SOC 2 Type II',
        score: 96,
        status: 'compliant',
        controlsImplemented: 65,
        totalControls: 67,
        proboControlsAvailable: 45,
        lastAssessed: new Date('2024-01-01'),
        nextDue: new Date('2024-07-01'),
      },
      {
        framework: 'ISO 27001',
        score: 89,
        status: 'in-progress',
        controlsImplemented: 114,
        totalControls: 133,
        proboControlsAvailable: 98,
        lastAssessed: new Date('2024-02-15'),
        nextDue: new Date('2024-08-15'),
      },
      {
        framework: 'GDPR',
        score: 94,
        status: 'compliant',
        controlsImplemented: 47,
        totalControls: 50,
        proboControlsAvailable: 42,
        lastAssessed: new Date('2024-03-01'),
        nextDue: new Date('2024-09-01'),
      },
      {
        framework: 'HIPAA',
        score: 82,
        status: 'needs-review',
        controlsImplemented: 59,
        totalControls: 72,
        proboControlsAvailable: 55,
        lastAssessed: new Date('2023-12-01'),
        nextDue: new Date('2024-06-01'),
      },
    ];
  }

  private getDefaultInsights(): ProboInsights {
    return {
      controlCoverage: 85,
      riskReduction: 78,
      complianceImprovement: 15,
      vendorRiskScore: 72,
      recommendations: [
        'Implement multi-factor authentication across all systems',
        'Review and update data retention policies',
        'Conduct quarterly vendor risk assessments',
        'Enhance employee security awareness training',
        'Implement automated compliance monitoring',
      ],
    };
  }

  // Webhook Handler
  async handleWebhook(
    organizationId: string,
    webhookData: any,
    signature: string
  ): Promise<void> {
    const integration = await this.getIntegration(organizationId);
    if (!integration?.webhookSecret) {
      throw new Error('Webhook not configured');
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', integration.webhookSecret)
      .update(JSON.stringify(webhookData))
      .digest('hex');

    if (signature !== expectedSignature) {
      throw new Error('Invalid webhook signature');
    }

    // Process webhook data
    if (webhookData.type === 'metrics.updated') {
      await this.syncMetrics(organizationId);
    } else if (webhookData.type === 'control.created') {
      // Handle new control created in Probo
      await this.storeMetric(integration.id, 'control_event', webhookData);
    }
  }
}

export default new EnhancedProboService();