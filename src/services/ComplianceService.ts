import { prisma } from '@/lib/prisma';
import {
  ComplianceFramework,
  ComplianceRequirement,
  ComplianceAssessment,
  ComplianceAssessmentItem,
  ComplianceGap,
  RequirementControlMapping,
  ComplianceFrameworkType,
  RequirementCriticality,
  AssessmentStatus,
  ComplianceStatus,
  GapType,
  GapSeverity,
  GapStatus,
  MappingType,
  Prisma,
} from '@prisma/client';
import { redis } from '@/lib/cache/memory-cache';
import { notificationService } from './NotificationService';
import { NotificationCategory, NotificationPriority } from '@prisma/client';

interface CreateFrameworkInput {
  name: string;
  description?: string;
  version?: string;
  type: ComplianceFrameworkType;
  organizationId: string;
  createdBy: string;
}

interface CreateRequirementInput {
  frameworkId: string;
  requirementId: string;
  title: string;
  description: string;
  category: string;
  criticality: RequirementCriticality;
  parentId?: string;
  order?: number;
}

interface CreateAssessmentInput {
  frameworkId: string;
  name: string;
  description?: string;
  dueDate?: Date;
  organizationId: string;
  assessorId?: string;
}

interface AssessRequirementInput {
  assessmentId: string;
  requirementId: string;
  status: ComplianceStatus;
  score?: number;
  evidence?: any[];
  findings?: string;
  recommendations?: string;
  assessedBy: string;
}

interface CreateGapInput {
  assessmentId: string;
  requirementId: string;
  gapType: GapType;
  severity: GapSeverity;
  description: string;
  impact?: string;
  remediationPlan?: string;
  estimatedEffort?: number;
  targetDate?: Date;
  assignedTo?: string;
}

interface ControlMappingInput {
  requirementId: string;
  controlId: string;
  mappingType: MappingType;
  effectiveness?: number;
  notes?: string;
}

interface GapAnalysisResult {
  framework: ComplianceFramework;
  assessment: ComplianceAssessment;
  overallCompliance: number;
  requirementCount: number;
  compliantCount: number;
  partiallyCompliantCount: number;
  nonCompliantCount: number;
  notAssessedCount: number;
  gaps: ComplianceGap[];
  criticalGaps: ComplianceGap[];
  recommendations: string[];
}

export class ComplianceService {
  private static instance: ComplianceService;
  private readonly cacheKeyPrefix = 'compliance:';
  private readonly cacheTTL = 600; // 10 minutes

  private constructor() {}

  static getInstance(): ComplianceService {
    if (!this.instance) {
      this.instance = new ComplianceService();
    }
    return this.instance;
  }

  // Framework Management
  async createFramework(input: CreateFrameworkInput): Promise<ComplianceFramework> {
    const framework = await prisma.complianceFramework.create({
      data: input,
      include: {
        creator: true,
        _count: {
          select: { requirements: true, assessments: true },
        },
      },
    });

    await this.clearFrameworkCache(input.organizationId);
    return framework;
  }

  async getFrameworks(
    organizationId: string,
    filters?: { type?: ComplianceFrameworkType; isActive?: boolean }
  ): Promise<ComplianceFramework[]> {
    const cacheKey = `${this.cacheKeyPrefix}frameworks:${organizationId}:${JSON.stringify(filters)}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    const frameworks = await prisma.complianceFramework.findMany({
      where: {
        organizationId,
        ...filters,
      },
      include: {
        creator: true,
        _count: {
          select: { requirements: true, assessments: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    await redis.setex(cacheKey, this.cacheTTL, JSON.stringify(frameworks));
    return frameworks;
  }

  async getFramework(id: string): Promise<ComplianceFramework | null> {
    return prisma.complianceFramework.findUnique({
      where: { id },
      include: {
        requirements: {
          orderBy: [{ order: 'asc' }, { requirementId: 'asc' }],
        },
        assessments: {
          orderBy: { assessmentDate: 'desc' },
          take: 5,
        },
      },
    });
  }

  // Requirement Management
  async createRequirement(input: CreateRequirementInput): Promise<ComplianceRequirement> {
    const requirement = await prisma.complianceRequirement.create({
      data: input,
      include: {
        framework: true,
        parent: true,
      },
    });

    await this.clearRequirementCache(input.frameworkId);
    return requirement;
  }

  async bulkCreateRequirements(
    frameworkId: string,
    requirements: Omit<CreateRequirementInput, 'frameworkId'>[]
  ): Promise<number> {
    const result = await prisma.complianceRequirement.createMany({
      data: requirements.map(req => ({ ...req, frameworkId })),
    });

    await this.clearRequirementCache(frameworkId);
    return result.count;
  }

  async getRequirements(frameworkId: string): Promise<ComplianceRequirement[]> {
    const cacheKey = `${this.cacheKeyPrefix}requirements:${frameworkId}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    const requirements = await prisma.complianceRequirement.findMany({
      where: { frameworkId },
      include: {
        parent: true,
        children: true,
        controlMappings: {
          include: {
            control: true,
          },
        },
      },
      orderBy: [{ order: 'asc' }, { requirementId: 'asc' }],
    });

    await redis.setex(cacheKey, this.cacheTTL, JSON.stringify(requirements));
    return requirements;
  }

  // Control Mapping
  async mapControlToRequirement(input: ControlMappingInput): Promise<RequirementControlMapping> {
    const mapping = await prisma.requirementControlMapping.create({
      data: input,
      include: {
        requirement: true,
        control: true,
      },
    });

    await this.clearRequirementCache(mapping.requirement.frameworkId);
    return mapping;
  }

  async getControlMappings(requirementId: string): Promise<RequirementControlMapping[]> {
    return prisma.requirementControlMapping.findMany({
      where: { requirementId },
      include: {
        control: true,
      },
      orderBy: { mappingType: 'asc' },
    });
  }

  async getUnmappedRequirements(frameworkId: string): Promise<ComplianceRequirement[]> {
    return prisma.complianceRequirement.findMany({
      where: {
        frameworkId,
        controlMappings: {
          none: {},
        },
      },
      orderBy: { requirementId: 'asc' },
    });
  }

  // Assessment Management
  async createAssessment(input: CreateAssessmentInput): Promise<ComplianceAssessment> {
    const assessment = await prisma.complianceAssessment.create({
      data: input,
      include: {
        framework: true,
        assessor: true,
        organization: true,
      },
    });

    // Create assessment items for all requirements
    const requirements = await this.getRequirements(input.frameworkId);
    await prisma.complianceAssessmentItem.createMany({
      data: requirements.map(req => ({
        assessmentId: assessment.id,
        requirementId: req.id,
        status: ComplianceStatus.NOT_ASSESSED,
      })),
    });

    await this.clearAssessmentCache(input.organizationId);
    
    // Send notification
    if (input.assessorId) {
      await notificationService.createNotification({
        userId: input.assessorId,
        organizationId: input.organizationId,
        title: 'New Compliance Assessment Assigned',
        message: `You have been assigned to assess "${assessment.name}"`,
        category: NotificationCategory.COMPLIANCE,
        priority: NotificationPriority.HIGH,
        actionUrl: `/compliance/assessments/${assessment.id}`,
      });
    }

    return assessment;
  }

  async getAssessments(
    organizationId: string,
    filters?: { frameworkId?: string; status?: AssessmentStatus }
  ): Promise<ComplianceAssessment[]> {
    const cacheKey = `${this.cacheKeyPrefix}assessments:${organizationId}:${JSON.stringify(filters)}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    const assessments = await prisma.complianceAssessment.findMany({
      where: {
        organizationId,
        ...filters,
      },
      include: {
        framework: true,
        assessor: true,
        reviewer: true,
        _count: {
          select: { items: true, gaps: true },
        },
      },
      orderBy: { assessmentDate: 'desc' },
    });

    await redis.setex(cacheKey, this.cacheTTL, JSON.stringify(assessments));
    return assessments;
  }

  async getAssessment(id: string): Promise<ComplianceAssessment | null> {
    return prisma.complianceAssessment.findUnique({
      where: { id },
      include: {
        framework: true,
        assessor: true,
        reviewer: true,
        items: {
          include: {
            requirement: true,
            assessor: true,
            reviewer: true,
          },
          orderBy: { requirement: { order: 'asc' } },
        },
        gaps: {
          include: {
            assignee: true,
          },
          orderBy: { severity: 'asc' },
        },
      },
    });
  }

  // Assessment Execution
  async assessRequirement(input: AssessRequirementInput): Promise<ComplianceAssessmentItem> {
    const item = await prisma.complianceAssessmentItem.upsert({
      where: {
        assessmentId_requirementId: {
          assessmentId: input.assessmentId,
          requirementId: input.requirementId,
        },
      },
      update: {
        status: input.status,
        score: input.score,
        evidence: input.evidence || Prisma.JsonNull,
        findings: input.findings,
        recommendations: input.recommendations,
        assessedBy: input.assessedBy,
        assessedAt: new Date(),
      },
      create: {
        assessmentId: input.assessmentId,
        requirementId: input.requirementId,
        status: input.status,
        score: input.score,
        evidence: input.evidence || Prisma.JsonNull,
        findings: input.findings,
        recommendations: input.recommendations,
        assessedBy: input.assessedBy,
        assessedAt: new Date(),
      },
      include: {
        requirement: true,
        assessment: true,
      },
    });

    // Automatically create gap if non-compliant
    if (input.status === ComplianceStatus.NON_COMPLIANT && input.findings) {
      await this.createGap({
        assessmentId: input.assessmentId,
        requirementId: input.requirementId,
        gapType: GapType.MISSING_CONTROL,
        severity: this.determineSeverity(item.requirement.criticality),
        description: input.findings,
        impact: input.recommendations,
      });
    }

    await this.updateAssessmentProgress(input.assessmentId);
    return item;
  }

  // Gap Management
  async createGap(input: CreateGapInput): Promise<ComplianceGap> {
    const gap = await prisma.complianceGap.create({
      data: input,
      include: {
        assessment: true,
        assignee: true,
      },
    });

    // Send notification to assignee
    if (input.assignedTo) {
      await notificationService.createNotification({
        userId: input.assignedTo,
        organizationId: gap.assessment.organizationId,
        title: 'Compliance Gap Assigned',
        message: `You have been assigned a ${gap.severity} severity compliance gap`,
        category: NotificationCategory.COMPLIANCE,
        priority: this.getNotificationPriority(gap.severity),
        actionUrl: `/compliance/gaps/${gap.id}`,
      });
    }

    await this.clearGapCache(gap.assessmentId);
    return gap;
  }

  async updateGapStatus(
    gapId: string,
    status: GapStatus,
    closureNotes?: string
  ): Promise<ComplianceGap> {
    const updateData: Prisma.ComplianceGapUpdateInput = {
      status,
      ...(status === GapStatus.RESOLVED && {
        closedAt: new Date(),
        closureNotes,
      }),
    };

    const gap = await prisma.complianceGap.update({
      where: { id: gapId },
      data: updateData,
      include: {
        assessment: true,
        assignee: true,
      },
    });

    await this.clearGapCache(gap.assessmentId);
    return gap;
  }

  async getGaps(
    assessmentId: string,
    filters?: { status?: GapStatus; severity?: GapSeverity }
  ): Promise<ComplianceGap[]> {
    return prisma.complianceGap.findMany({
      where: {
        assessmentId,
        ...filters,
      },
      include: {
        assignee: true,
      },
      orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
    });
  }

  // Gap Analysis
  async performGapAnalysis(assessmentId: string): Promise<GapAnalysisResult> {
    const assessment = await this.getAssessment(assessmentId);
    if (!assessment) {
      throw new Error('Assessment not found');
    }

    const items = assessment.items;
    const compliantCount = items.filter(i => i.status === ComplianceStatus.COMPLIANT).length;
    const partiallyCompliantCount = items.filter(i => i.status === ComplianceStatus.PARTIALLY_COMPLIANT).length;
    const nonCompliantCount = items.filter(i => i.status === ComplianceStatus.NON_COMPLIANT).length;
    const notAssessedCount = items.filter(i => i.status === ComplianceStatus.NOT_ASSESSED).length;
    const notApplicableCount = items.filter(i => i.status === ComplianceStatus.NOT_APPLICABLE).length;

    const assessedCount = items.length - notAssessedCount - notApplicableCount;
    const overallCompliance = assessedCount > 0
      ? ((compliantCount + partiallyCompliantCount * 0.5) / assessedCount) * 100
      : 0;

    const criticalGaps = assessment.gaps.filter(g => g.severity === GapSeverity.CRITICAL);

    // Generate recommendations
    const recommendations = this.generateRecommendations(assessment);

    // Update assessment overall score
    await prisma.complianceAssessment.update({
      where: { id: assessmentId },
      data: { overallScore: overallCompliance },
    });

    return {
      framework: assessment.framework,
      assessment,
      overallCompliance,
      requirementCount: items.length,
      compliantCount,
      partiallyCompliantCount,
      nonCompliantCount,
      notAssessedCount,
      gaps: assessment.gaps,
      criticalGaps,
      recommendations,
    };
  }

  // Helper methods
  private async updateAssessmentProgress(assessmentId: string): Promise<void> {
    const items = await prisma.complianceAssessmentItem.findMany({
      where: { assessmentId },
    });

    const assessedCount = items.filter(i => i.status !== ComplianceStatus.NOT_ASSESSED).length;
    const totalCount = items.length;
    
    if (assessedCount === totalCount) {
      await prisma.complianceAssessment.update({
        where: { id: assessmentId },
        data: { status: AssessmentStatus.UNDER_REVIEW },
      });
    }
  }

  private determineSeverity(criticality: RequirementCriticality): GapSeverity {
    switch (criticality) {
      case RequirementCriticality.CRITICAL:
        return GapSeverity.CRITICAL;
      case RequirementCriticality.HIGH:
        return GapSeverity.HIGH;
      case RequirementCriticality.MEDIUM:
        return GapSeverity.MEDIUM;
      case RequirementCriticality.LOW:
        return GapSeverity.LOW;
      default:
        return GapSeverity.MEDIUM;
    }
  }

  private getNotificationPriority(severity: GapSeverity): NotificationPriority {
    switch (severity) {
      case GapSeverity.CRITICAL:
        return NotificationPriority.URGENT;
      case GapSeverity.HIGH:
        return NotificationPriority.HIGH;
      case GapSeverity.MEDIUM:
        return NotificationPriority.MEDIUM;
      case GapSeverity.LOW:
        return NotificationPriority.LOW;
      default:
        return NotificationPriority.MEDIUM;
    }
  }

  private generateRecommendations(assessment: any): string[] {
    const recommendations: string[] = [];

    // Critical gaps
    const criticalGaps = assessment.gaps.filter((g: any) => g.severity === GapSeverity.CRITICAL);
    if (criticalGaps.length > 0) {
      recommendations.push(`Address ${criticalGaps.length} critical compliance gaps immediately`);
    }

    // Unmapped requirements
    const unmappedCount = assessment.items.filter((i: any) => 
      i.requirement.controlMappings?.length === 0
    ).length;
    if (unmappedCount > 0) {
      recommendations.push(`Map controls to ${unmappedCount} requirements without control coverage`);
    }

    // Low scoring areas
    const lowScoreItems = assessment.items.filter((i: any) => 
      i.score !== null && i.score < 50
    );
    if (lowScoreItems.length > 0) {
      recommendations.push(`Improve controls in ${lowScoreItems.length} low-scoring areas`);
    }

    // Missing documentation
    const missingDocsCount = assessment.gaps.filter((g: any) => 
      g.gapType === GapType.MISSING_DOCUMENTATION
    ).length;
    if (missingDocsCount > 0) {
      recommendations.push(`Complete documentation for ${missingDocsCount} requirements`);
    }

    // Training gaps
    const trainingGaps = assessment.gaps.filter((g: any) => 
      g.gapType === GapType.TRAINING_GAP
    ).length;
    if (trainingGaps > 0) {
      recommendations.push(`Implement training programs to address ${trainingGaps} knowledge gaps`);
    }

    return recommendations;
  }

  // Cache management
  private async clearFrameworkCache(organizationId: string): Promise<void> {
    const pattern = `${this.cacheKeyPrefix}frameworks:${organizationId}:*`;
    // In real implementation, use SCAN to find and delete matching keys
  }

  private async clearRequirementCache(frameworkId: string): Promise<void> {
    await redis.del(`${this.cacheKeyPrefix}requirements:${frameworkId}`);
  }

  private async clearAssessmentCache(organizationId: string): Promise<void> {
    const pattern = `${this.cacheKeyPrefix}assessments:${organizationId}:*`;
    // In real implementation, use SCAN to find and delete matching keys
  }

  private async clearGapCache(assessmentId: string): Promise<void> {
    await redis.del(`${this.cacheKeyPrefix}gaps:${assessmentId}`);
  }

  // Reporting
  async generateComplianceReport(assessmentId: string): Promise<any> {
    const analysis = await this.performGapAnalysis(assessmentId);
    
    return {
      summary: {
        framework: analysis.framework.name,
        assessmentDate: analysis.assessment.assessmentDate,
        overallCompliance: analysis.overallCompliance,
        totalRequirements: analysis.requirementCount,
        compliant: analysis.compliantCount,
        partiallyCompliant: analysis.partiallyCompliantCount,
        nonCompliant: analysis.nonCompliantCount,
        notAssessed: analysis.notAssessedCount,
      },
      gaps: {
        total: analysis.gaps.length,
        bySeverity: {
          critical: analysis.gaps.filter(g => g.severity === GapSeverity.CRITICAL).length,
          high: analysis.gaps.filter(g => g.severity === GapSeverity.HIGH).length,
          medium: analysis.gaps.filter(g => g.severity === GapSeverity.MEDIUM).length,
          low: analysis.gaps.filter(g => g.severity === GapSeverity.LOW).length,
        },
        byType: analysis.gaps.reduce((acc, gap) => {
          acc[gap.gapType] = (acc[gap.gapType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
      recommendations: analysis.recommendations,
      detailedFindings: analysis.assessment.items.filter((i: any) => 
        i.status !== ComplianceStatus.COMPLIANT && i.findings
      ).map((i: any) => ({
        requirement: i.requirement.title,
        status: i.status,
        findings: i.findings,
        recommendations: i.recommendations,
      })),
    };
  }
}

export const complianceService = ComplianceService.getInstance();