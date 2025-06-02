import { db } from '@/lib/db';
import { notificationManager } from '@/lib/collaboration/notifications';

export interface ComplianceEvidence {
  id: string;
  controlId: string;
  frameworkId: string;
  requirementId: string;
  title: string;
  description: string;
  type: 'document' | 'screenshot' | 'report' | 'certificate' | 'test-result' | 'log' | 'configuration' | 'other';
  category: 'policy' | 'procedure' | 'testing' | 'monitoring' | 'training' | 'technical' | 'management' | 'operational';
  status: 'draft' | 'pending-review' | 'approved' | 'expired' | 'rejected';
  file: {
    filename: string;
    path: string;
    size: number;
    mimeType: string;
    hash: string;
  };
  metadata: {
    source: string;
    author: string;
    reviewer?: string;
    effectiveDate: Date;
    expirationDate?: Date;
    version: string;
    tags: string[];
    confidentiality: 'public' | 'internal' | 'confidential' | 'restricted';
  };
  auditTrail: EvidenceAuditEntry[];
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EvidenceAuditEntry {
  id: string;
  action: 'created' | 'updated' | 'reviewed' | 'approved' | 'rejected' | 'expired' | 'accessed';
  userId: string;
  timestamp: Date;
  details: string;
  changes?: Record<string, { from: any; to: any }>;
}

export interface EvidenceRequest {
  id: string;
  controlId: string;
  frameworkId: string;
  requirementId: string;
  title: string;
  description: string;
  evidenceTypes: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate: Date;
  assignedTo: string[];
  status: 'open' | 'in-progress' | 'completed' | 'overdue' | 'cancelled';
  instructions: string;
  examples: string[];
  organizationId: string;
  requestedBy: string;
  createdAt: Date;
}

export interface AuditPackage {
  id: string;
  name: string;
  description: string;
  frameworkId: string;
  auditScope: string[];
  auditPeriod: {
    from: Date;
    to: Date;
  };
  status: 'preparing' | 'ready' | 'submitted' | 'under-review' | 'completed';
  evidence: ComplianceEvidence[];
  controls: string[];
  requirements: string[];
  auditor: {
    firm?: string;
    leadAuditor?: string;
    email?: string;
  };
  deliverables: AuditDeliverable[];
  timeline: AuditMilestone[];
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  submittedAt?: Date;
}

export interface AuditDeliverable {
  id: string;
  type: 'evidence-package' | 'control-matrix' | 'gap-analysis' | 'test-results' | 'management-letter';
  name: string;
  description: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'reviewed';
  dueDate: Date;
  assignedTo: string;
  files: string[];
  dependencies: string[];
}

export interface AuditMilestone {
  id: string;
  name: string;
  description: string;
  dueDate: Date;
  status: 'not-started' | 'in-progress' | 'completed' | 'delayed';
  dependencies: string[];
  deliverables: string[];
}

export interface EvidenceCollection {
  id: string;
  name: string;
  description: string;
  frameworkId: string;
  collectionType: 'manual' | 'automated' | 'continuous';
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
    startDate: Date;
    nextRun?: Date;
  };
  sources: EvidenceSource[];
  rules: EvidenceRule[];
  notifications: EvidenceNotification[];
  organizationId: string;
  isActive: boolean;
}

export interface EvidenceSource {
  id: string;
  type: 'file-system' | 'database' | 'api' | 'log-system' | 'monitoring-system' | 'manual';
  name: string;
  configuration: Record<string, any>;
  credentials?: Record<string, any>;
  filters: Record<string, any>;
  schedule?: {
    frequency: string;
    time?: string;
  };
}

export interface EvidenceRule {
  id: string;
  name: string;
  condition: string;
  action: 'collect' | 'flag' | 'notify' | 'escalate';
  parameters: Record<string, any>;
  isActive: boolean;
}

export interface EvidenceNotification {
  type: 'collection-completed' | 'collection-failed' | 'evidence-expired' | 'review-required';
  recipients: string[];
  template: string;
  conditions: Record<string, any>;
}

export class ComplianceEvidenceManager {

  // Create evidence record
  async createEvidence(evidence: Omit<ComplianceEvidence, 'id' | 'auditTrail' | 'createdAt' | 'updatedAt'>): Promise<ComplianceEvidence> {
    const newEvidence = await db.client.complianceEvidence.create({
      data: {
        ...evidence,
        auditTrail: [
          {
            id: `audit_${Date.now()}`,
            action: 'created',
            userId: evidence.createdBy,
            timestamp: new Date(),
            details: 'Evidence record created',
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Log activity
    await db.client.activity.create({
      data: {
        type: 'EVIDENCE_CREATED',
        entityType: 'EVIDENCE',
        entityId: newEvidence.id,
        description: `Evidence created: ${evidence.title}`,
        userId: evidence.createdBy,
        organizationId: evidence.organizationId,
        metadata: {
          controlId: evidence.controlId,
          frameworkId: evidence.frameworkId,
          type: evidence.type,
        },
        isPublic: false,
      },
    });

    return newEvidence;
  }

  // Update evidence
  async updateEvidence(
    evidenceId: string,
    updates: Partial<ComplianceEvidence>,
    userId: string
  ): Promise<ComplianceEvidence> {
    const existing = await db.client.complianceEvidence.findUnique({
      where: { id: evidenceId },
    });

    if (!existing) {
      throw new Error('Evidence not found');
    }

    // Track changes
    const changes: Record<string, { from: any; to: any }> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (key in existing && existing[key as keyof ComplianceEvidence] !== value) {
        changes[key] = {
          from: existing[key as keyof ComplianceEvidence],
          to: value,
        };
      }
    }

    // Add audit entry
    const auditEntry: EvidenceAuditEntry = {
      id: `audit_${Date.now()}`,
      action: 'updated',
      userId,
      timestamp: new Date(),
      details: 'Evidence record updated',
      changes,
    };

    const updated = await db.client.complianceEvidence.update({
      where: { id: evidenceId },
      data: {
        ...updates,
        auditTrail: [...existing.auditTrail, auditEntry],
        updatedAt: new Date(),
      },
    });

    return updated;
  }

  // Review evidence
  async reviewEvidence(
    evidenceId: string,
    reviewerId: string,
    approved: boolean,
    comments?: string
  ): Promise<ComplianceEvidence> {
    const auditEntry: EvidenceAuditEntry = {
      id: `audit_${Date.now()}`,
      action: approved ? 'approved' : 'rejected',
      userId: reviewerId,
      timestamp: new Date(),
      details: comments || (approved ? 'Evidence approved' : 'Evidence rejected'),
    };

    const updated = await db.client.complianceEvidence.update({
      where: { id: evidenceId },
      data: {
        status: approved ? 'approved' : 'rejected',
        'metadata.reviewer': reviewerId,
        auditTrail: {
          push: auditEntry,
        },
        updatedAt: new Date(),
      },
    });

    // Notify stakeholders
    await this.notifyEvidenceReview(updated, approved, comments);

    return updated;
  }

  // Get evidence by control
  async getEvidenceByControl(
    controlId: string,
    filters?: {
      type?: string[];
      status?: string[];
      frameworkId?: string;
    }
  ): Promise<ComplianceEvidence[]> {
    const where: any = { controlId };

    if (filters?.type) {
      where.type = { in: filters.type };
    }

    if (filters?.status) {
      where.status = { in: filters.status };
    }

    if (filters?.frameworkId) {
      where.frameworkId = filters.frameworkId;
    }

    return await db.client.complianceEvidence.findMany({
      where,
      orderBy: [
        { 'metadata.effectiveDate': 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  // Get evidence by framework
  async getEvidenceByFramework(
    frameworkId: string,
    organizationId: string,
    filters?: {
      requirementId?: string;
      type?: string[];
      status?: string[];
    }
  ): Promise<ComplianceEvidence[]> {
    const where: any = { frameworkId, organizationId };

    if (filters?.requirementId) {
      where.requirementId = filters.requirementId;
    }

    if (filters?.type) {
      where.type = { in: filters.type };
    }

    if (filters?.status) {
      where.status = { in: filters.status };
    }

    return await db.client.complianceEvidence.findMany({
      where,
      include: {
        control: true,
        requirement: true,
      },
      orderBy: [
        { 'metadata.effectiveDate': 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  // Create evidence request
  async createEvidenceRequest(request: Omit<EvidenceRequest, 'id' | 'createdAt'>): Promise<EvidenceRequest> {
    const newRequest = await db.client.evidenceRequest.create({
      data: {
        ...request,
        createdAt: new Date(),
      },
    });

    // Notify assigned users
    for (const userId of request.assignedTo) {
      await notificationManager.sendNotification({
        type: 'EVIDENCE_REQUEST_ASSIGNED',
        title: 'Evidence Request Assigned',
        message: `You have been assigned to provide evidence for: ${request.title}`,
        recipientId: userId,
        entityType: 'EVIDENCE_REQUEST',
        entityId: newRequest.id,
        urgency: request.priority === 'critical' ? 'urgent' : request.priority === 'high' ? 'high' : 'medium',
        data: {
          dueDate: request.dueDate,
          controlId: request.controlId,
          evidenceTypes: request.evidenceTypes,
        },
      });
    }

    return newRequest;
  }

  // Update evidence request status
  async updateEvidenceRequestStatus(
    requestId: string,
    status: EvidenceRequest['status'],
    userId: string,
    comments?: string
  ): Promise<EvidenceRequest> {
    const updated = await db.client.evidenceRequest.update({
      where: { id: requestId },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    // Log activity
    await db.client.activity.create({
      data: {
        type: 'EVIDENCE_REQUEST_UPDATED',
        entityType: 'EVIDENCE_REQUEST',
        entityId: requestId,
        description: `Evidence request status updated to: ${status}`,
        userId,
        organizationId: updated.organizationId,
        metadata: {
          status,
          comments,
        },
        isPublic: false,
      },
    });

    return updated;
  }

  // Create audit package
  async createAuditPackage(packageData: Omit<AuditPackage, 'id' | 'createdAt'>): Promise<AuditPackage> {
    const auditPackage = await db.client.auditPackage.create({
      data: {
        ...packageData,
        createdAt: new Date(),
      },
    });

    // Auto-collect relevant evidence
    await this.collectEvidenceForAudit(auditPackage.id);

    return auditPackage;
  }

  // Collect evidence for audit
  private async collectEvidenceForAudit(auditPackageId: string): Promise<void> {
    const auditPackage = await db.client.auditPackage.findUnique({
      where: { id: auditPackageId },
    });

    if (!auditPackage) return;

    // Get evidence for specified controls and requirements
    const evidence = await db.client.complianceEvidence.findMany({
      where: {
        organizationId: auditPackage.organizationId,
        frameworkId: auditPackage.frameworkId,
        OR: [
          { controlId: { in: auditPackage.controls } },
          { requirementId: { in: auditPackage.requirements } },
        ],
        status: 'approved',
        'metadata.effectiveDate': {
          gte: auditPackage.auditPeriod.from,
          lte: auditPackage.auditPeriod.to,
        },
      },
    });

    // Update audit package with collected evidence
    await db.client.auditPackage.update({
      where: { id: auditPackageId },
      data: {
        evidence: evidence.map(e => e.id),
      },
    });
  }

  // Generate audit deliverable
  async generateAuditDeliverable(
    packageId: string,
    deliverableType: AuditDeliverable['type']
  ): Promise<string> {
    const auditPackage = await db.client.auditPackage.findUnique({
      where: { id: packageId },
      include: {
        evidence: true,
        controls: true,
        requirements: true,
      },
    });

    if (!auditPackage) {
      throw new Error('Audit package not found');
    }

    switch (deliverableType) {
      case 'evidence-package':
        return await this.generateEvidencePackage(auditPackage);
      case 'control-matrix':
        return await this.generateControlMatrix(auditPackage);
      case 'gap-analysis':
        return await this.generateGapAnalysisReport(auditPackage);
      case 'test-results':
        return await this.generateTestResultsReport(auditPackage);
      default:
        throw new Error(`Unsupported deliverable type: ${deliverableType}`);
    }
  }

  // Generate evidence package
  private async generateEvidencePackage(auditPackage: any): Promise<string> {
    // Create ZIP package with all evidence files
    const packageStructure = {
      metadata: {
        packageName: auditPackage.name,
        framework: auditPackage.frameworkId,
        auditPeriod: auditPackage.auditPeriod,
        generatedAt: new Date(),
        evidenceCount: auditPackage.evidence.length,
      },
      evidence: auditPackage.evidence.map((evidence: any) => ({
        id: evidence.id,
        title: evidence.title,
        type: evidence.type,
        category: evidence.category,
        controlId: evidence.controlId,
        requirementId: evidence.requirementId,
        file: evidence.file,
        metadata: evidence.metadata,
      })),
      controls: auditPackage.controls,
      requirements: auditPackage.requirements,
    };

    // In a real implementation, this would create an actual ZIP file
    const packageFilename = `audit_evidence_${auditPackage.id}_${Date.now()}.json`;
    
    // Store package metadata
    await db.client.file.create({
      data: {
        filename: packageFilename,
        path: `/audit-packages/${packageFilename}`,
        content: JSON.stringify(packageStructure, null, 2),
        size: JSON.stringify(packageStructure).length,
        mimeType: 'application/json',
        organizationId: auditPackage.organizationId,
        uploadedBy: auditPackage.createdBy,
        tags: ['audit-package', 'evidence', auditPackage.frameworkId],
      },
    });

    return packageFilename;
  }

  // Generate control matrix
  private async generateControlMatrix(auditPackage: any): Promise<string> {
    // Create control effectiveness matrix
    const matrix = {
      framework: auditPackage.frameworkId,
      auditPeriod: auditPackage.auditPeriod,
      controls: auditPackage.controls.map((control: any) => ({
        id: control.id,
        name: control.name,
        category: control.category,
        effectiveness: control.effectivenessScore,
        testingStatus: control.lastTested ? 'tested' : 'not-tested',
        evidence: auditPackage.evidence.filter((e: any) => e.controlId === control.id),
        gaps: control.deficiencies || [],
        recommendations: control.recommendations || [],
      })),
      summary: {
        totalControls: auditPackage.controls.length,
        effectiveControls: auditPackage.controls.filter((c: any) => c.effectivenessScore >= 80).length,
        testedControls: auditPackage.controls.filter((c: any) => c.lastTested).length,
        overallMaturity: auditPackage.controls.reduce((sum: number, c: any) => sum + c.effectivenessScore, 0) / auditPackage.controls.length,
      },
    };

    const matrixFilename = `control_matrix_${auditPackage.id}_${Date.now()}.json`;
    
    await db.client.file.create({
      data: {
        filename: matrixFilename,
        path: `/audit-packages/${matrixFilename}`,
        content: JSON.stringify(matrix, null, 2),
        size: JSON.stringify(matrix).length,
        mimeType: 'application/json',
        organizationId: auditPackage.organizationId,
        uploadedBy: auditPackage.createdBy,
        tags: ['control-matrix', auditPackage.frameworkId],
      },
    });

    return matrixFilename;
  }

  // Generate gap analysis report
  private async generateGapAnalysisReport(auditPackage: any): Promise<string> {
    // This would use the gap analysis from the mapping engine
    const gapAnalysis = {
      framework: auditPackage.frameworkId,
      scope: auditPackage.auditScope,
      period: auditPackage.auditPeriod,
      summary: {
        totalRequirements: auditPackage.requirements.length,
        coveredRequirements: 0, // Would be calculated
        gapCount: 0, // Would be calculated
        riskScore: 0, // Would be calculated
      },
      gaps: [], // Would be populated from gap analysis
      recommendations: [], // Would be populated
      timeline: [], // Implementation timeline
    };

    const reportFilename = `gap_analysis_${auditPackage.id}_${Date.now()}.json`;
    
    await db.client.file.create({
      data: {
        filename: reportFilename,
        path: `/audit-packages/${reportFilename}`,
        content: JSON.stringify(gapAnalysis, null, 2),
        size: JSON.stringify(gapAnalysis).length,
        mimeType: 'application/json',
        organizationId: auditPackage.organizationId,
        uploadedBy: auditPackage.createdBy,
        tags: ['gap-analysis', auditPackage.frameworkId],
      },
    });

    return reportFilename;
  }

  // Generate test results report
  private async generateTestResultsReport(auditPackage: any): Promise<string> {
    const testResults = {
      framework: auditPackage.frameworkId,
      testingPeriod: auditPackage.auditPeriod,
      controls: auditPackage.controls.map((control: any) => ({
        id: control.id,
        name: control.name,
        testingResults: {
          designEffectiveness: control.designEffective || 'not-tested',
          operatingEffectiveness: control.operatingEffective || 'not-tested',
          lastTested: control.lastTested,
          testFrequency: control.testFrequency,
          deficiencies: control.deficiencies || [],
          exceptions: control.exceptions || [],
        },
        evidence: auditPackage.evidence.filter((e: any) => e.controlId === control.id && e.type === 'test-result'),
      })),
      summary: {
        totalTests: 0, // Would be calculated
        passedTests: 0, // Would be calculated
        failedTests: 0, // Would be calculated
        deficiencies: 0, // Would be calculated
      },
    };

    const resultsFilename = `test_results_${auditPackage.id}_${Date.now()}.json`;
    
    await db.client.file.create({
      data: {
        filename: resultsFilename,
        path: `/audit-packages/${resultsFilename}`,
        content: JSON.stringify(testResults, null, 2),
        size: JSON.stringify(testResults).length,
        mimeType: 'application/json',
        organizationId: auditPackage.organizationId,
        uploadedBy: auditPackage.createdBy,
        tags: ['test-results', auditPackage.frameworkId],
      },
    });

    return resultsFilename;
  }

  // Setup automated evidence collection
  async setupAutomatedCollection(collection: Omit<EvidenceCollection, 'id'>): Promise<EvidenceCollection> {
    const newCollection = await db.client.evidenceCollection.create({
      data: collection,
    });

    // Schedule collection if automated
    if (collection.collectionType === 'automated' && collection.isActive) {
      await this.scheduleEvidenceCollection(newCollection.id);
    }

    return newCollection;
  }

  // Schedule evidence collection
  private async scheduleEvidenceCollection(collectionId: string): Promise<void> {
    // This would integrate with a job scheduler like node-cron
    console.log(`Scheduling evidence collection: ${collectionId}`);
    
    // In a real implementation, this would:
    // 1. Set up cron jobs based on collection frequency
    // 2. Connect to various evidence sources
    // 3. Apply collection rules and filters
    // 4. Store collected evidence automatically
    // 5. Send notifications on completion/failure
  }

  // Notify evidence review
  private async notifyEvidenceReview(
    evidence: ComplianceEvidence,
    approved: boolean,
    comments?: string
  ): Promise<void> {
    await notificationManager.sendNotification({
      type: approved ? 'EVIDENCE_APPROVED' : 'EVIDENCE_REJECTED',
      title: `Evidence ${approved ? 'Approved' : 'Rejected'}`,
      message: `Evidence "${evidence.title}" has been ${approved ? 'approved' : 'rejected'}${comments ? `: ${comments}` : ''}`,
      recipientId: evidence.createdBy,
      entityType: 'EVIDENCE',
      entityId: evidence.id,
      urgency: 'medium',
      data: {
        controlId: evidence.controlId,
        frameworkId: evidence.frameworkId,
        approved,
        comments,
      },
    });
  }

  // Check evidence expiration
  async checkEvidenceExpiration(organizationId: string): Promise<void> {
    const expiringEvidence = await db.client.complianceEvidence.findMany({
      where: {
        organizationId,
        status: 'approved',
        'metadata.expirationDate': {
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          gte: new Date(),
        },
      },
    });

    for (const evidence of expiringEvidence) {
      await notificationManager.sendNotification({
        type: 'EVIDENCE_EXPIRING',
        title: 'Evidence Expiring Soon',
        message: `Evidence "${evidence.title}" will expire on ${evidence.metadata.expirationDate?.toDateString()}`,
        recipientId: evidence.createdBy,
        entityType: 'EVIDENCE',
        entityId: evidence.id,
        urgency: 'medium',
        data: {
          expirationDate: evidence.metadata.expirationDate,
          controlId: evidence.controlId,
        },
      });
    }

    // Mark expired evidence
    await db.client.complianceEvidence.updateMany({
      where: {
        organizationId,
        status: 'approved',
        'metadata.expirationDate': {
          lt: new Date(),
        },
      },
      data: {
        status: 'expired',
        updatedAt: new Date(),
      },
    });
  }

  // Get evidence statistics
  async getEvidenceStatistics(organizationId: string, frameworkId?: string): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
    expiringCount: number;
    recentlyAdded: number;
  }> {
    const where: any = { organizationId };
    if (frameworkId) {
      where.frameworkId = frameworkId;
    }

    const evidence = await db.client.complianceEvidence.findMany({
      where,
      select: {
        type: true,
        status: true,
        category: true,
        'metadata.expirationDate': true,
        createdAt: true,
      },
    });

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      total: evidence.length,
      byType: evidence.reduce((acc, e) => {
        acc[e.type] = (acc[e.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byStatus: evidence.reduce((acc, e) => {
        acc[e.status] = (acc[e.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byCategory: evidence.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      expiringCount: evidence.filter(e => 
        e.metadata.expirationDate && 
        new Date(e.metadata.expirationDate) <= thirtyDaysFromNow
      ).length,
      recentlyAdded: evidence.filter(e => 
        new Date(e.createdAt) >= sevenDaysAgo
      ).length,
    };
  }
}

export const complianceEvidenceManager = new ComplianceEvidenceManager(); 