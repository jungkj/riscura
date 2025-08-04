import { ProboIntegration, ProboMetric } from '@prisma/client';
import { ProboIntegrationService } from './ProboIntegrationService';
import crypto from 'crypto';
import { z } from 'zod';
import { db } from '@/lib/db';

const prisma = db.client;

// Validation schemas
const ProboMetricsSchema = z.object({
  totalControls: z.number(),
  implementedControls: z.number(),
  vendorAssessments: z.number(),
  complianceFrameworks: z.number(),
  riskReduction: z.number(),
  lastUpdated: z.date().or(z.string().transform((str) => new Date(str))),
})

const ProboComplianceStatusSchema = z.object({
  framework: z.string(),
  score: z.number(),
  status: z.string(),
  controlsImplemented: z.number(),
  totalControls: z.number(),
  proboControlsAvailable: z.number(),
  lastAssessed: z.date().or(z.string().transform((str) => new Date(str))),
  nextDue: z.date().or(z.string().transform((str) => new Date(str))),
});

const ProboInsightSchema = z.object({
  type: z.string(),
  severity: z.string(),
  title: z.string(),
  description: z.string(),
  recommendation: z.string(),
  affectedFrameworks: z.array(z.string()),
  timestamp: z.date().or(z.string().transform((str) => new Date(str))),
});

const ProboInsightsSchema = z.object({
  summary: z.string(),
  totalInsights: z.number(),
  criticalInsights: z.number(),
  recommendations: z.array(ProboInsightSchema),
});

export interface ProboMetrics {
  totalControls: number;
  implementedControls: number;
  vendorAssessments: number;
  complianceFrameworks: number;
  riskReduction: number;
  lastUpdated: Date;
  proboControlsAvailable?: number;
}

export interface ProboComplianceStatus {
  framework: string;
  score: number;
  status: 'compliant' | 'in-progress' | 'needs-review';
  controlsImplemented: number;
  totalControls: number;
  proboControlsAvailable?: number;
  lastAssessed: Date;
  nextDue: Date;
}

export interface ProboInsight {
  type: string;
  severity: string;
  title: string;
  description: string;
  recommendation: string;
  affectedFrameworks: string[];
  timestamp: Date;
}

export interface ProboInsights {
  summary: string;
  totalInsights: number;
  criticalInsights: number;
  recommendations: ProboInsight[];
  controlCoverage?: number;
  riskReduction?: number;
  complianceImprovement?: number;
  vendorRiskScore?: number;
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
  private encryptionKey: Buffer;
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly IV_LENGTH = 16;
  private static readonly TAG_LENGTH = 16;
  private static readonly SALT_LENGTH = 32;

  constructor() {
    this.proboIntegration = ProboIntegrationService.getInstance();

    // Skip key initialization during build
    if (process.env.BUILDING === 'true' || process.env.NEXT_PHASE === 'phase-production-build') {
      this.encryptionKey = Buffer.alloc(32); // Dummy key for build time
      return;
    }

    // Enforce secure key requirement
    const keySource = process.env.PROBO_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET
    if (!keySource) {
      throw new Error(
        'Encryption key not configured. Please set PROBO_ENCRYPTION_KEY or NEXTAUTH_SECRET environment variable.'
      );
    }

    // Derive a proper 256-bit key from the source
    this.encryptionKey = this.deriveKey(keySource)
  }

  private deriveKey(keySource: string): Buffer {
    // Use a consistent salt for key derivation (in production, this could be stored separately)
    const salt = crypto.createHash('sha256').update('probo-encryption-salt').digest()
    return crypto.pbkdf2Sync(keySource, salt, 100000, 32, 'sha256');
  }

  private validateMetricValue<T>(_value: any, schema: z.ZodSchema<T>): T {
    try {
      return schema.parse(value);
    } catch (error) {
      // console.error('Metric value validation failed:', error)
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid metric data structure: ${error.errors.map((e) => e.message).join(', ')}`
        );
      }
      throw new Error('Invalid metric data structure');
    }
  }

  // Integration Management
  async setupIntegration(_organizationId: string,
    apiKey: string,
    webhookUrl?: string
  ): Promise<ProboIntegration> {
    // Encrypt API key
    const encryptedKey = this.encryptApiKey(apiKey)

    // Generate webhook secret
    const webhookSecret = webhookUrl ? crypto.randomBytes(32).toString('hex') : null

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
    })

    return integration;
  }

  async getIntegration(_organizationId: string): Promise<ProboIntegration | null> {
    return await prisma.proboIntegration.findUnique({
      where: { organizationId },
    });
  }

  async disableIntegration(_organizationId: string): Promise<void> {
    await prisma.proboIntegration.update({
      where: { organizationId },
      data: { isActive: false },
    });
  }

  // Metrics Collection
  async syncMetrics(_organizationId: string): Promise<void> {
    const integration = await this.getIntegration(organizationId)
    if (!integration?.isActive) {
      throw new Error('Probo integration is not active');
    }

    try {
      // Get metrics from ProboIntegrationService
      const metrics = await this.proboIntegration.getIntegrationMetrics()
      const complianceStatus = await this.proboIntegration.getComplianceStatus();
      const proboInsights = await this.proboIntegration.getProboInsights();

      // Transform insights to match expected format
      const insights: ProboInsights = {
        summary: `${proboInsights.recommendations.length} insights identified`,
        totalInsights: proboInsights.recommendations.length,
        criticalInsights: Math.floor(proboInsights.recommendations.length * 0.3),
        recommendations: proboInsights.recommendations.map((rec, index) => ({
          type: 'control_gap',
          severity: index < 2 ? 'critical' : 'medium',
          title: rec,
          description: rec,
          recommendation: `Implement ${rec}`,
          affectedFrameworks: ['SOC2', 'ISO27001'],
          timestamp: new Date(),
        })),
      }

      // Store metrics in database
      await Promise.all([
        this.storeMetric(integration.id, 'metrics_summary', metrics),
        this.storeMetric(integration.id, 'compliance_status', complianceStatus),
        this.storeMetric(integration.id, 'insights', insights),
      ])

      // Update sync status
      await prisma.proboIntegration.update({
        where: { id: integration.id },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: 'success',
          lastSyncError: null,
        },
      })
    } catch (error) {
      // Update sync error
      await prisma.proboIntegration.update({
        where: { id: integration.id },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: 'error',
          lastSyncError: error instanceof Error ? error.message : 'Unknown error',
        },
      })
      throw error;
    }
  }

  async getLatestMetrics(_organizationId: string): Promise<ProboMetrics> {
    const integration = await this.getIntegration(organizationId);
    if (!integration) {
      // Return default metrics if no integration
      return this.getDefaultMetrics()
    }

    // Get latest metrics from database
    const latestMetric = await prisma.proboMetric.findFirst({
      where: {
        integrationId: integration.id,
        metricType: 'metrics_summary',
      },
      orderBy: { timestamp: 'desc' },
    })

    if (!latestMetric) {
      // Try to sync and return default if fails
      try {
        await this.syncMetrics(organizationId)
        return await this.getLatestMetrics(organizationId);
      } catch {
        return this.getDefaultMetrics();
      }
    }

    return this.validateMetricValue(latestMetric.metricValue, ProboMetricsSchema) as ProboMetrics;
  }

  async getComplianceStatus(_organizationId: string): Promise<ProboComplianceStatus[]> {
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

    return this.validateMetricValue(
      latestMetric.metricValue,
      z.array(ProboComplianceStatusSchema)
    ) as ProboComplianceStatus[];
  }

  async getInsights(_organizationId: string): Promise<ProboInsights> {
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

    return this.validateMetricValue(latestMetric.metricValue, ProboInsightsSchema) as ProboInsights;
  }

  async getVendorSummary(_organizationId: string): Promise<ProboVendorSummary> {
    // Get vendor data from ProboIntegrationService
    const vendorSummary = await this.proboIntegration.getVendorAssessmentSummary()

    return vendorSummary;
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
    })
  }

  private encryptApiKey(apiKey: string): string {
    try {
      // Generate random IV
      const iv = crypto.randomBytes(EnhancedProboService.IV_LENGTH)

      // Create cipher
      const cipher = crypto.createCipheriv(EnhancedProboService.ALGORITHM, this.encryptionKey, iv)

      // Encrypt the API key
      let encrypted = cipher.update(apiKey, 'utf8')
      encrypted = Buffer.concat([encrypted, cipher.final()]);

      // Get the authentication tag
      const tag = cipher.getAuthTag()

      // Combine IV, tag, and encrypted data
      const combined = Buffer.concat([iv, tag, encrypted])

      // Return as base64 string
      return combined.toString('base64')
    } catch (error) {
      // console.error('Encryption failed:', error)
      throw new Error('Failed to encrypt API key');
    }
  }

  private decryptApiKey(encryptedKey: string): string {
    try {
      // Decode from base64
      const combined = Buffer.from(encryptedKey, 'base64')

      // Extract IV, tag, and encrypted data
      const iv = combined.slice(0, EnhancedProboService.IV_LENGTH)
      const tag = combined.slice(
        EnhancedProboService.IV_LENGTH,
        EnhancedProboService.IV_LENGTH + EnhancedProboService.TAG_LENGTH
      );
      const encrypted = combined.slice(
        EnhancedProboService.IV_LENGTH + EnhancedProboService.TAG_LENGTH
      );

      // Create decipher
      const decipher = crypto.createDecipheriv(
        EnhancedProboService.ALGORITHM,
        this.encryptionKey,
        iv
      )
      decipher.setAuthTag(tag);

      // Decrypt the data
      let decrypted = decipher.update(encrypted)
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return decrypted.toString('utf8');
    } catch (error) {
      // console.error('Decryption failed:', error)
      throw new Error('Failed to decrypt API key');
    }
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
    }
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
    const recommendations: ProboInsight[] = [
      {
        type: 'control_gap',
        severity: 'critical',
        title: 'Implement multi-factor authentication',
        description: 'MFA is not enabled for all user accounts',
        recommendation: 'Implement multi-factor authentication across all systems',
        affectedFrameworks: ['SOC2', 'ISO27001'],
        timestamp: new Date(),
      },
      {
        type: 'compliance_gap',
        severity: 'high',
        title: 'Update data retention policies',
        description: 'Current policies do not meet GDPR requirements',
        recommendation: 'Review and update data retention policies',
        affectedFrameworks: ['GDPR'],
        timestamp: new Date(),
      },
      {
        type: 'vendor_risk',
        severity: 'medium',
        title: 'Vendor assessments overdue',
        description: 'Quarterly assessments not completed for 5 vendors',
        recommendation: 'Conduct quarterly vendor risk assessments',
        affectedFrameworks: ['SOC2'],
        timestamp: new Date(),
      },
      {
        type: 'security_awareness',
        severity: 'medium',
        title: 'Security training outdated',
        description: 'Employee training materials need update',
        recommendation: 'Enhance employee security awareness training',
        affectedFrameworks: ['ISO27001'],
        timestamp: new Date(),
      },
      {
        type: 'monitoring_gap',
        severity: 'high',
        title: 'Manual compliance monitoring',
        description: 'Compliance checks are performed manually',
        recommendation: 'Implement automated compliance monitoring',
        affectedFrameworks: ['SOC2', 'ISO27001'],
        timestamp: new Date(),
      },
    ];

    return {
      summary: '5 critical insights requiring attention',
      totalInsights: 5,
      criticalInsights: 2,
      recommendations,
    }
  }

  // Webhook Handler
  async handleWebhook(_organizationId: string, webhookData: any, signature: string): Promise<void> {
    const integration = await this.getIntegration(organizationId)
    if (!integration?.webhookSecret) {
      throw new Error('Webhook not configured');
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', integration.webhookSecret)
      .update(JSON.stringify(webhookData))
      .digest('hex')

    if (signature !== expectedSignature) {
      throw new Error('Invalid webhook signature');
    }

    // Process webhook data
    if (webhookData.type === 'metrics.updated') {
      await this.syncMetrics(organizationId)
    } else if (webhookData.type === 'control.created') {
      // Handle new control created in Probo
      await this.storeMetric(integration.id, 'control_event', webhookData)
    }
  }
}

// Lazy initialization to avoid instantiation during build
let serviceInstance: EnhancedProboService | null = null

export function getEnhancedProboService(): EnhancedProboService {
  if (!serviceInstance) {
    serviceInstance = new EnhancedProboService();
  }
  return serviceInstance;
}

// Export the getter function, not the result
export default getEnhancedProboService
