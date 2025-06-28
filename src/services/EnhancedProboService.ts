import { PrismaClient } from '@prisma/client';
import { ProboService } from './ProboService';

const prisma = new PrismaClient();

export interface EnhancedProboControl {
  id: string;
  controlId: string;
  name: string;
  category: string;
  importance: 'MANDATORY' | 'PREFERRED' | 'ADVANCED';
  standards: string[];
  description: string;
  status: 'NOT_IMPLEMENTED' | 'IN_PROGRESS' | 'IMPLEMENTED' | 'UNDER_REVIEW' | 'APPROVED' | 'NEEDS_ATTENTION';
  assignedTo?: string;
  dueDate?: Date;
  completedDate?: Date;
  evidenceCount: number;
  taskCount: number;
  measureCount: number;
  riskReduction: number; // Calculated risk reduction percentage
  implementationEffort: 'LOW' | 'MEDIUM' | 'HIGH';
  businessImpact: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface RiskControlMapping {
  riskId: string;
  controlIds: string[];
  coveragePercentage: number;
  effectivenessScore: number;
  recommendations: string[];
}

export interface ComplianceGapAnalysis {
  frameworkName: string;
  totalRequirements: number;
  implementedRequirements: number;
  gapPercentage: number;
  criticalGaps: Array<{
    requirementId: string;
    title: string;
    suggestedControls: string[];
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
  estimatedEffort: number; // hours
  estimatedCost: number; // USD
}

export interface VendorRiskProfile {
  vendorName: string;
  overallRiskScore: number;
  riskCategories: {
    security: number;
    compliance: number;
    financial: number;
    operational: number;
  };
  findings: Array<{
    category: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    title: string;
    description: string;
    recommendation: string;
  }>;
  aiInsights: {
    riskTrends: string[];
    recommendations: string[];
    benchmarkComparison: string;
  };
}

export class EnhancedProboService {
  private static instance: EnhancedProboService;
  private proboService: ProboService;

  private constructor() {
    this.proboService = ProboService.getInstance();
  }

  public static getInstance(): EnhancedProboService {
    if (!EnhancedProboService.instance) {
      EnhancedProboService.instance = new EnhancedProboService();
    }
    return EnhancedProboService.instance;
  }

  // === CONTROL MANAGEMENT ===

  async getEnhancedControls(organizationId: string, filters?: {
    category?: string;
    importance?: string;
    status?: string;
    assignedTo?: string;
  }): Promise<EnhancedProboControl[]> {
    const whereClause: any = { organizationId };
    
    if (filters?.category) whereClause.category = filters.category;
    if (filters?.importance) whereClause.importance = filters.importance;
    if (filters?.status) whereClause.status = filters.status;
    if (filters?.assignedTo) whereClause.assignedTo = filters.assignedTo;

    const controls = await prisma.proboControl.findMany({
      where: whereClause,
      include: {
        evidences: true,
        tasks: true,
        measures: true,
      },
    });

    return controls.map(control => ({
      ...control,
      evidenceCount: control.evidences.length,
      taskCount: control.tasks.length,
      measureCount: control.measures.length,
      riskReduction: this.calculateRiskReduction(control),
      implementationEffort: this.assessImplementationEffort(control),
      businessImpact: this.assessBusinessImpact(control),
    }));
  }

  async importProboControlsToOrganization(organizationId: string): Promise<{
    imported: number;
    updated: number;
    skipped: number;
  }> {
    const proboMitigations = await this.proboService.getMitigations();
    let imported = 0, updated = 0;
    const skipped = 0;

    for (const mitigation of proboMitigations) {
      const existingControl = await prisma.proboControl.findFirst({
        where: { controlId: mitigation.id, organizationId }
      });

      if (existingControl) {
        // Update existing control
        await prisma.proboControl.update({
          where: { id: existingControl.id },
          data: {
            name: mitigation.name,
            category: mitigation.category,
            importance: mitigation.importance as any,
            standards: mitigation.standards?.split(';') || [],
            description: mitigation.description,
          }
        });
        updated++;
      } else {
        // Create new control
        await prisma.proboControl.create({
          data: {
            controlId: mitigation.id,
            name: mitigation.name,
            category: mitigation.category,
            importance: mitigation.importance as any,
            standards: mitigation.standards?.split(';') || [],
            description: mitigation.description,
            organizationId,
          }
        });
        imported++;
      }
    }

    return { imported, updated, skipped };
  }

  async mapControlsToRisks(organizationId: string): Promise<RiskControlMapping[]> {
    // Get all risks and controls for the organization
    const risks = await prisma.risk.findMany({
      where: { organizationId }
    });

    const controls = await prisma.proboControl.findMany({
      where: { organizationId },
      include: { measures: true }
    });

    const mappings: RiskControlMapping[] = [];

    for (const risk of risks) {
      // AI-powered mapping logic
      const relevantControls = this.findRelevantControls(risk, controls);
      const coveragePercentage = this.calculateCoveragePercentage(risk, relevantControls);
      const effectivenessScore = this.calculateEffectivenessScore(relevantControls);
      const recommendations = this.generateControlRecommendations(risk, relevantControls);

      mappings.push({
        riskId: risk.id,
        controlIds: relevantControls.map(c => c.id),
        coveragePercentage,
        effectivenessScore,
        recommendations,
      });
    }

    return mappings;
  }

  // === COMPLIANCE MANAGEMENT ===

  async performComplianceGapAnalysis(
    organizationId: string, 
    frameworkName: string
  ): Promise<ComplianceGapAnalysis> {
    const framework = await prisma.complianceFramework.findFirst({
      where: { organizationId, name: frameworkName },
      include: { requirements: true }
    });

    if (!framework) {
      throw new Error(`Framework ${frameworkName} not found`);
    }

    const implementedRequirements = framework.requirements.filter(
      req => req.status === 'IMPLEMENTED' || req.status === 'APPROVED'
    );

    const gapPercentage = ((framework.requirements.length - implementedRequirements.length) / framework.requirements.length) * 100;

    // Identify critical gaps
    const criticalGaps = framework.requirements
      .filter(req => req.status === 'NOT_STARTED' || req.status === 'IN_PROGRESS')
      .map(req => ({
        requirementId: req.requirementId,
        title: req.title,
        suggestedControls: this.suggestControlsForRequirement(req),
        priority: this.assessRequirementPriority(req) as 'HIGH' | 'MEDIUM' | 'LOW',
      }));

    const estimatedEffort = this.calculateImplementationEffort(criticalGaps);
    const estimatedCost = this.calculateImplementationCost(criticalGaps);

    return {
      frameworkName,
      totalRequirements: framework.requirements.length,
      implementedRequirements: implementedRequirements.length,
      gapPercentage,
      criticalGaps,
      estimatedEffort,
      estimatedCost,
    };
  }

  async generateComplianceRoadmap(organizationId: string, frameworkName: string): Promise<{
    phases: Array<{
      name: string;
      duration: number; // weeks
      requirements: string[];
      controls: string[];
      effort: number; // hours
      cost: number; // USD
    }>;
    totalDuration: number;
    totalEffort: number;
    totalCost: number;
  }> {
    const gapAnalysis = await this.performComplianceGapAnalysis(organizationId, frameworkName);
    
    // Prioritize and phase the implementation
    const phases = this.createImplementationPhases(gapAnalysis.criticalGaps);
    
    return {
      phases,
      totalDuration: phases.reduce((sum, phase) => sum + phase.duration, 0),
      totalEffort: phases.reduce((sum, phase) => sum + phase.effort, 0),
      totalCost: phases.reduce((sum, phase) => sum + phase.cost, 0),
    };
  }

  // === VENDOR RISK ASSESSMENT ===

  async performAIVendorAssessment(
    organizationId: string,
    vendorUrl: string,
    vendorName: string
  ): Promise<VendorRiskProfile> {
    // Simulate AI-powered vendor assessment
    const aiAnalysis = await this.analyzeVendorWithAI(vendorUrl, vendorName);
    
    // Store assessment in database
    const assessment = await prisma.vendorAssessment.create({
      data: {
        vendorName,
        vendorUrl,
        overallRiskScore: aiAnalysis.overallRiskScore,
        securityScore: aiAnalysis.riskCategories.security,
        complianceScore: aiAnalysis.riskCategories.compliance,
        financialScore: aiAnalysis.riskCategories.financial,
        operationalScore: aiAnalysis.riskCategories.operational,
        assessmentMethod: 'AI_POWERED',
        assessorId: 'system',
        aiFindings: aiAnalysis.findings,
        recommendations: aiAnalysis.aiInsights.recommendations,
        organizationId,
      },
      include: { findings: true }
    });

    // Create findings
    for (const finding of aiAnalysis.findings) {
      await prisma.vendorFinding.create({
        data: {
          category: finding.category,
          severity: finding.severity,
          title: finding.title,
          description: finding.description,
          remediation: finding.recommendation,
          assessmentId: assessment.id,
        }
      });
    }

    return aiAnalysis;
  }

  async getVendorRiskTrends(organizationId: string): Promise<{
    totalVendors: number;
    averageRiskScore: number;
    riskDistribution: { [key: string]: number };
    trendData: Array<{ date: string; averageRisk: number; assessmentCount: number }>;
    topRisks: Array<{ vendor: string; riskScore: number; criticalFindings: number }>;
  }> {
    const assessments = await prisma.vendorAssessment.findMany({
      where: { organizationId },
      include: { findings: true },
      orderBy: { assessmentDate: 'desc' }
    });

    const totalVendors = assessments.length;
    const averageRiskScore = assessments.reduce((sum, a) => sum + a.overallRiskScore, 0) / totalVendors;

    // Risk distribution
    const riskDistribution = {
      low: assessments.filter(a => a.overallRiskScore <= 30).length,
      medium: assessments.filter(a => a.overallRiskScore > 30 && a.overallRiskScore <= 70).length,
      high: assessments.filter(a => a.overallRiskScore > 70).length,
    };

    // Trend data (last 12 months)
    const trendData = this.calculateVendorRiskTrends(assessments);

    // Top risks
    const topRisks = assessments
      .sort((a, b) => b.overallRiskScore - a.overallRiskScore)
      .slice(0, 10)
      .map(a => ({
        vendor: a.vendorName,
        riskScore: a.overallRiskScore,
        criticalFindings: a.findings.filter(f => f.severity === 'CRITICAL').length,
      }));

    return {
      totalVendors,
      averageRiskScore,
      riskDistribution,
      trendData,
      topRisks,
    };
  }

  // === TASK AND WORKFLOW MANAGEMENT ===

  async createImplementationTasks(
    organizationId: string,
    controlId: string,
    assignedTo?: string
  ): Promise<string[]> {
    const control = await prisma.proboControl.findUnique({
      where: { id: controlId }
    });

    if (!control) {
      throw new Error('Control not found');
    }

    const tasks = this.generateTasksForControl(control);
    const createdTaskIds: string[] = [];

    for (const task of tasks) {
      const createdTask = await prisma.proboTask.create({
        data: {
          title: task.title,
          description: task.description,
          priority: task.priority,
          estimatedHours: task.estimatedHours,
          dueDate: task.dueDate,
          assignedTo,
          assignedBy: 'system',
          controlId,
          organizationId,
        }
      });
      createdTaskIds.push(createdTask.id);
    }

    return createdTaskIds;
  }

  async getComplianceDashboardData(organizationId: string): Promise<{
    overallComplianceScore: number;
    controlsImplemented: number;
    totalControls: number;
    pendingTasks: number;
    overdueEvidence: number;
    recentActivity: Array<{
      type: string;
      description: string;
      timestamp: Date;
      user?: string;
    }>;
    frameworkProgress: Array<{
      framework: string;
      progress: number;
      status: string;
    }>;
  }> {
    const [controls, tasks, evidences, frameworks] = await Promise.all([
      prisma.proboControl.findMany({ where: { organizationId } }),
      prisma.proboTask.findMany({ 
        where: { organizationId, status: { in: ['TODO', 'IN_PROGRESS'] } }
      }),
      prisma.proboEvidence.findMany({ 
        where: { 
          organizationId, 
          validUntil: { lt: new Date() },
          status: { not: 'APPROVED' }
        }
      }),
      prisma.complianceFramework.findMany({ 
        where: { organizationId },
        include: { requirements: true }
      })
    ]);

    const implementedControls = controls.filter(c => 
      c.status === 'IMPLEMENTED' || c.status === 'APPROVED'
    ).length;

    const overallComplianceScore = (implementedControls / controls.length) * 100;

    const frameworkProgress = frameworks.map(framework => {
      const implementedReqs = framework.requirements.filter(req => 
        req.status === 'IMPLEMENTED' || req.status === 'APPROVED'
      ).length;
      const progress = (implementedReqs / framework.requirements.length) * 100;
      
      return {
        framework: framework.name,
        progress,
        status: progress >= 90 ? 'COMPLETE' : progress >= 50 ? 'IN_PROGRESS' : 'PLANNING'
      };
    });

    // Generate recent activity (simplified)
    const recentActivity = [
      {
        type: 'CONTROL_IMPLEMENTED',
        description: 'SSO enforcement control marked as implemented',
        timestamp: new Date(),
      },
      {
        type: 'EVIDENCE_SUBMITTED',
        description: 'Security policy evidence submitted for review',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
    ];

    return {
      overallComplianceScore: Math.round(overallComplianceScore),
      controlsImplemented: implementedControls,
      totalControls: controls.length,
      pendingTasks: tasks.length,
      overdueEvidence: evidences.length,
      recentActivity,
      frameworkProgress,
    };
  }

  // === PRIVATE HELPER METHODS ===

  private calculateRiskReduction(control: any): number {
    // AI-powered risk reduction calculation
    const importanceWeight = {
      MANDATORY: 0.8,
      PREFERRED: 0.6,
      ADVANCED: 0.4
    }[control.importance] || 0.5;

    const statusWeight = {
      IMPLEMENTED: 1.0,
      APPROVED: 1.0,
      UNDER_REVIEW: 0.8,
      IN_PROGRESS: 0.5,
      NOT_IMPLEMENTED: 0.0,
      NEEDS_ATTENTION: 0.3
    }[control.status] || 0.0;

    return Math.round(importanceWeight * statusWeight * 100);
  }

  private assessImplementationEffort(control: any): 'LOW' | 'MEDIUM' | 'HIGH' {
    const categoryEffort: { [key: string]: 'LOW' | 'MEDIUM' | 'HIGH' } = {
      'Identity & access management': 'MEDIUM',
      'Communications & collaboration security': 'LOW',
      'Infrastructure & network security': 'HIGH',
      'Secure development & code management': 'HIGH',
      'Endpoint security': 'MEDIUM',
      'Business continuity & third-party management': 'MEDIUM',
      'Data management & privacy': 'HIGH',
      'Governance, Risk & Compliance': 'LOW',
      'Human resources & personnel security': 'LOW',
      'Logging monitoring & incident management': 'MEDIUM',
      'Physical & environmental security': 'MEDIUM',
    };

    return categoryEffort[control.category] || 'MEDIUM';
  }

  private assessBusinessImpact(control: any): 'LOW' | 'MEDIUM' | 'HIGH' {
    return control.importance === 'MANDATORY' ? 'HIGH' : 
           control.importance === 'PREFERRED' ? 'MEDIUM' : 'LOW';
  }

  private findRelevantControls(risk: any, controls: any[]): any[] {
    // AI-powered control matching logic
    return controls.filter(control => {
      // Simple keyword matching - in production, use more sophisticated AI
      const riskKeywords = risk.title.toLowerCase().split(' ');
      const controlKeywords = (control.name + ' ' + control.description).toLowerCase();
      
      return riskKeywords.some(keyword => controlKeywords.includes(keyword));
    });
  }

  private calculateCoveragePercentage(risk: any, controls: any[]): number {
    if (controls.length === 0) return 0;
    
    // Calculate based on control implementation status and relevance
    const implementedControls = controls.filter(c => 
      c.status === 'IMPLEMENTED' || c.status === 'APPROVED'
    );
    
    return Math.round((implementedControls.length / controls.length) * 100);
  }

  private calculateEffectivenessScore(controls: any[]): number {
    if (controls.length === 0) return 0;
    
    const scores = controls.map(control => {
      const measures = control.measures || [];
      const avgEffectiveness = measures.reduce((sum: number, m: any) => 
        sum + (m.effectivenessScore || 50), 0) / Math.max(measures.length, 1);
      return avgEffectiveness;
    });
    
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  private generateControlRecommendations(risk: any, controls: any[]): string[] {
    const recommendations: string[] = [];
    
    if (controls.length === 0) {
      recommendations.push('No relevant controls found. Consider implementing basic security measures.');
    }
    
    const unimplementedControls = controls.filter(c => c.status === 'NOT_IMPLEMENTED');
    if (unimplementedControls.length > 0) {
      recommendations.push(`Implement ${unimplementedControls.length} pending controls to improve risk coverage.`);
    }
    
    return recommendations;
  }

  private suggestControlsForRequirement(requirement: any): string[] {
    // AI-powered control suggestion based on requirement
    return ['enforce-sso', 'password-manager', 'email-filtering']; // Simplified
  }

  private assessRequirementPriority(requirement: any): string {
    // Priority assessment logic
    const criticalKeywords = ['access', 'authentication', 'encryption', 'backup'];
    const reqText = requirement.title.toLowerCase();
    
    return criticalKeywords.some(keyword => reqText.includes(keyword)) ? 'HIGH' : 'MEDIUM';
  }

  private calculateImplementationEffort(gaps: any[]): number {
    return gaps.length * 8; // 8 hours per gap (simplified)
  }

  private calculateImplementationCost(gaps: any[]): number {
    return gaps.length * 1000; // $1000 per gap (simplified)
  }

  private createImplementationPhases(gaps: any[]): any[] {
    const highPriority = gaps.filter(g => g.priority === 'HIGH');
    const mediumPriority = gaps.filter(g => g.priority === 'MEDIUM');
    const lowPriority = gaps.filter(g => g.priority === 'LOW');

    return [
      {
        name: 'Critical Security Controls',
        duration: 4,
        requirements: highPriority.map(g => g.requirementId),
        controls: highPriority.flatMap(g => g.suggestedControls),
        effort: highPriority.length * 12,
        cost: highPriority.length * 1500,
      },
      {
        name: 'Standard Compliance',
        duration: 8,
        requirements: mediumPriority.map(g => g.requirementId),
        controls: mediumPriority.flatMap(g => g.suggestedControls),
        effort: mediumPriority.length * 8,
        cost: mediumPriority.length * 1000,
      },
      {
        name: 'Advanced Features',
        duration: 6,
        requirements: lowPriority.map(g => g.requirementId),
        controls: lowPriority.flatMap(g => g.suggestedControls),
        effort: lowPriority.length * 6,
        cost: lowPriority.length * 750,
      },
    ];
  }

  private async analyzeVendorWithAI(vendorUrl: string, vendorName: string): Promise<VendorRiskProfile> {
    // Simulate AI analysis - in production, integrate with actual AI services
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time

    const riskScore = Math.floor(Math.random() * 100);
    
    return {
      vendorName,
      overallRiskScore: riskScore,
      riskCategories: {
        security: Math.floor(Math.random() * 100),
        compliance: Math.floor(Math.random() * 100),
        financial: Math.floor(Math.random() * 100),
        operational: Math.floor(Math.random() * 100),
      },
      findings: [
        {
          category: 'Security',
          severity: riskScore > 70 ? 'HIGH' : 'MEDIUM',
          title: 'SSL Certificate Configuration',
          description: 'SSL certificate configuration needs improvement',
          recommendation: 'Implement proper SSL certificate management',
        },
      ],
      aiInsights: {
        riskTrends: ['Increasing security posture', 'Stable financial health'],
        recommendations: ['Implement additional monitoring', 'Review access controls'],
        benchmarkComparison: 'Above industry average for security practices',
      },
    };
  }

  private calculateVendorRiskTrends(assessments: any[]): any[] {
    // Calculate monthly trends
    const months = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthAssessments = assessments.filter(a => {
        const assessmentDate = new Date(a.assessmentDate);
        return assessmentDate.getMonth() === date.getMonth() && 
               assessmentDate.getFullYear() === date.getFullYear();
      });
      
      months.push({
        date: date.toISOString().substring(0, 7),
        averageRisk: monthAssessments.length > 0 ? 
          monthAssessments.reduce((sum, a) => sum + a.overallRiskScore, 0) / monthAssessments.length : 0,
        assessmentCount: monthAssessments.length,
      });
    }
    
    return months;
  }

  private generateTasksForControl(control: any): any[] {
    // Generate implementation tasks based on control type
    const baseTasks = [
      {
        title: `Review ${control.name} requirements`,
        description: `Analyze the requirements for implementing ${control.name}`,
        priority: 'HIGH',
        estimatedHours: 2,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
      },
      {
        title: `Implement ${control.name}`,
        description: `Execute the implementation of ${control.name} control`,
        priority: 'HIGH',
        estimatedHours: 8,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
      },
      {
        title: `Test and validate ${control.name}`,
        description: `Test the implementation and validate effectiveness`,
        priority: 'MEDIUM',
        estimatedHours: 4,
        dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 3 weeks
      },
    ];

    return baseTasks;
  }
}

export default EnhancedProboService; 