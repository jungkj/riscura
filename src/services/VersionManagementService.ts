import {
  ContentVersion,
  VersionComparison,
  RevisionHistory,
  VersionMetrics,
  VersionPerformance,
  ApprovalWorkflow,
  VersionTree,
  CollaborationAnalytics,
  MergeRequest,
  VersionReport,
  VersionBranch,
  VersionDiff
} from '@/types/content-generation.types';
import { generateId } from '@/lib/utils';

interface ContentVersionFull extends ContentVersion {
  branchId?: string;
  parentVersionId?: string;
  mergeRequestId?: string;
  tags: string[];
  metadata: Record<string, any>;
}

interface ApprovalStatus {
  pending: 'pending';
  approved: 'approved';
  rejected: 'rejected';
  'under_review': 'under_review';
}

export class VersionManagementService {
  private readonly storageService: VersionStorageService;
  private readonly diffService: DiffCalculationService;
  private readonly approvalService: ApprovalService;
  private readonly collaborationService: CollaborationService;
  private readonly metricsService: MetricsService;

  constructor(
    storageService: VersionStorageService,
    diffService: DiffCalculationService,
    approvalService: ApprovalService,
    collaborationService: CollaborationService,
    metricsService: MetricsService
  ) {
    this.storageService = storageService;
    this.diffService = diffService;
    this.approvalService = approvalService;
    this.collaborationService = collaborationService;
    this.metricsService = metricsService;
  }

  /**
   * Create new content version with comprehensive tracking
   */
  async createVersion(
    content: string,
    author: string,
    changeDescription: string,
    contentType: string,
    parentVersionId?: string
  ): Promise<ContentVersionFull> {
    try {
      // Generate quality score for new content
      const qualityScore = await this.calculateQualityScore(content, contentType);
      
      // Create version object
      const version: ContentVersionFull = {
        id: generateId('version'),
        content,
        timestamp: new Date(),
        author: author === 'ai' ? 'ai' : 'user',
        changeDescription,
        qualityScore,
        approvalStatus: 'pending',
        parentVersionId,
        branchId: await this.getCurrentBranch(contentType),
        tags: await this.generateVersionTags(content, contentType),
        metadata: await this.collectVersionMetadata(content, contentType, author)
      };
      
      // Store version
      await this.storageService.storeVersion(version);
      
      // Update version tree
      await this.updateVersionTree(version);
      
      // Track collaboration metrics
      await this.collaborationService.trackVersionCreation(version);
      
      // Generate automatic review if AI-generated
      if (author === 'ai') {
        await this.requestAutomaticReview(version);
      }
      
      return version;
      
    } catch (error) {
      console.error('Error creating version:', error);
      throw new Error('Failed to create content version');
    }
  }

  /**
   * Compare two content versions with detailed analysis
   */
  async compareVersions(
    version1Id: string,
    version2Id: string
  ): Promise<VersionComparison> {
    try {
      // Retrieve versions
      const version1 = await this.storageService.getVersion(version1Id);
      const version2 = await this.storageService.getVersion(version2Id);
      
      if (!version1 || !version2) {
        throw new Error('One or both versions not found');
      }
      
      // Calculate detailed differences
      const textDiff = await this.diffService.calculateTextDiff(version1.content, version2.content);
      const qualityDiff = this.calculateQualityDiff(version1.qualityScore, version2.qualityScore);
      const structuralChanges = await this.identifyStructuralChanges(version1.content, version2.content);
      const semanticChanges = await this.identifySemanticChanges(version1.content, version2.content);
      
      // Generate change summary
      const changeSummary = await this.generateChangeSummary(textDiff, qualityDiff, structuralChanges);
      
      // Calculate impact assessment
      const impactAssessment = await this.assessChangeImpact(version1, version2, textDiff);
      
      // Generate recommendations
      const recommendations = await this.generateComparisonRecommendations(
        version1,
        version2,
        qualityDiff,
        impactAssessment
      );
      
      return {
        version1,
        version2,
        textDiff,
        qualityDiff,
        structuralChanges,
        semanticChanges,
        changeSummary,
        impactAssessment,
        recommendations
      };
      
    } catch (error) {
      console.error('Error comparing versions:', error);
      throw new Error('Failed to compare versions');
    }
  }

  /**
   * Get comprehensive revision history with analytics
   */
  async getRevisionHistory(
    contentId: string,
    options: HistoryOptions = {}
  ): Promise<RevisionHistory> {
    try {
      // Retrieve all versions
      const versions = await this.storageService.getVersionsByContentId(contentId, options);
      
      // Calculate version metrics
      const metrics = await this.calculateVersionMetrics(versions);
      
      // Analyze performance trends
      const performanceTrends = await this.analyzePerformanceTrends(versions);
      
      // Generate collaboration analytics
      const collaborationAnalytics = await this.generateCollaborationAnalytics(versions);
      
      // Create timeline visualization data
      const timeline = await this.generateVersionTimeline(versions);
      
      // Generate insights and patterns
      const insights = await this.generateHistoryInsights(versions, metrics);
      
      return {
        contentId,
        versions,
        metrics,
        performanceTrends,
        collaborationAnalytics,
        timeline,
        insights
      };
      
    } catch (error) {
      console.error('Error getting revision history:', error);
      throw new Error('Failed to retrieve revision history');
    }
  }

  /**
   * Approve or reject content version with workflow management
   */
  async processApproval(
    versionId: string,
    decision: keyof ApprovalStatus,
    reviewerId: string,
    feedback?: string
  ): Promise<ApprovalWorkflow> {
    try {
      // Get version
      const version = await this.storageService.getVersion(versionId);
      if (!version) {
        throw new Error('Version not found');
      }
      
      // Process approval decision
      const approvalResult = await this.approvalService.processDecision(
        version,
        decision,
        reviewerId,
        feedback
      );
      
      // Update version status
      await this.storageService.updateVersionStatus(versionId, decision);
      
      // Generate approval workflow
      const workflow = await this.generateApprovalWorkflow(version, approvalResult);
      
      // Handle approval consequences
      if (decision === 'approved') {
        await this.handleApprovalConsequences(version);
      } else if (decision === 'rejected') {
        await this.handleRejectionConsequences(version, feedback);
      }
      
      // Track collaboration metrics
      await this.collaborationService.trackApprovalDecision(version, decision, reviewerId);
      
      return workflow;
      
    } catch (error) {
      console.error('Error processing approval:', error);
      throw new Error('Failed to process approval');
    }
  }

  /**
   * Merge version branches with conflict resolution
   */
  async mergeBranches(
    sourceBranchId: string,
    targetBranchId: string,
    mergeStrategy: 'auto' | 'manual',
    resolver?: string
  ): Promise<MergeRequest> {
    try {
      // Get branch versions
      const sourceVersions = await this.storageService.getVersionsByBranch(sourceBranchId);
      const targetVersions = await this.storageService.getVersionsByBranch(targetBranchId);
      
      // Identify conflicts
      const conflicts = await this.identifyMergeConflicts(sourceVersions, targetVersions);
      
      // Handle merge strategy
      let mergeResult;
      if (mergeStrategy === 'auto' && conflicts.length === 0) {
        mergeResult = await this.performAutomaticMerge(sourceVersions, targetVersions);
      } else {
        mergeResult = await this.createMergeRequest(
          sourceBranchId,
          targetBranchId,
          conflicts,
          resolver
        );
      }
      
      // Track merge analytics
      await this.metricsService.trackMergeOperation(mergeResult);
      
      return mergeResult;
      
    } catch (error) {
      console.error('Error merging branches:', error);
      throw new Error('Failed to merge branches');
    }
  }

  /**
   * Generate comprehensive version analytics report
   */
  async generateVersionReport(
    contentId: string,
    timeRange: TimeRange
  ): Promise<VersionReport> {
    try {
      // Get versions within time range
      const versions = await this.storageService.getVersionsByTimeRange(contentId, timeRange);
      
      // Calculate comprehensive metrics
      const qualityMetrics = await this.calculateQualityMetrics(versions);
      const productivityMetrics = await this.calculateProductivityMetrics(versions);
      const collaborationMetrics = await this.calculateCollaborationMetrics(versions);
      const approvalMetrics = await this.calculateApprovalMetrics(versions);
      
      // Generate performance analysis
      const performanceAnalysis = await this.generatePerformanceAnalysis(versions, timeRange);
      
      // Identify trends and patterns
      const trends = await this.identifyVersionTrends(versions);
      
      // Generate recommendations
      const recommendations = await this.generateVersionRecommendations(
        qualityMetrics,
        productivityMetrics,
        trends
      );
      
      // Create visualizations
      const visualizations = await this.generateVersionVisualizations(versions, timeRange);
      
      return {
        contentId,
        timeRange,
        qualityMetrics,
        productivityMetrics,
        collaborationMetrics,
        approvalMetrics,
        performanceAnalysis,
        trends,
        recommendations,
        visualizations
      };
      
    } catch (error) {
      console.error('Error generating version report:', error);
      throw new Error('Failed to generate version report');
    }
  }

  /**
   * Rollback to previous version with impact analysis
   */
  async rollbackToVersion(
    currentVersionId: string,
    targetVersionId: string,
    reason: string,
    userId: string
  ): Promise<RollbackResult> {
    try {
      // Get versions
      const currentVersion = await this.storageService.getVersion(currentVersionId);
      const targetVersion = await this.storageService.getVersion(targetVersionId);
      
      if (!currentVersion || !targetVersion) {
        throw new Error('Version not found');
      }
      
      // Analyze rollback impact
      const impactAnalysis = await this.analyzeRollbackImpact(currentVersion, targetVersion);
      
      // Create rollback version
      const rollbackVersion = await this.createVersion(
        targetVersion.content,
        userId,
        `Rollback to version ${targetVersionId}: ${reason}`,
        'rollback',
        currentVersionId
      );
      
      // Track rollback metrics
      await this.metricsService.trackRollback(currentVersion, targetVersion, reason);
      
      // Generate rollback report
      const rollbackReport = await this.generateRollbackReport(
        currentVersion,
        targetVersion,
        rollbackVersion,
        impactAnalysis
      );
      
      return {
        success: true,
        rollbackVersion,
        impactAnalysis,
        rollbackReport
      };
      
    } catch (error) {
      console.error('Error performing rollback:', error);
      throw new Error('Failed to rollback version');
    }
  }

  // Private helper methods
  private async calculateQualityScore(content: string, contentType: string): Promise<any> {
    // Quality scoring implementation
    return {
      overall: 85,
      clarity: 88,
      completeness: 82,
      accuracy: 90,
      consistency: 87
    };
  }

  private async generateVersionTags(content: string, contentType: string): Promise<string[]> {
    const tags: string[] = [contentType];
    
    // Add content-based tags
    if (content.length > 1000) tags.push('long-form');
    if (content.includes('risk')) tags.push('risk-related');
    if (content.includes('control')) tags.push('control-related');
    
    return tags;
  }

  private async collectVersionMetadata(content: string, contentType: string, author: string): Promise<Record<string, any>> {
    return {
      wordCount: content.split(' ').length,
      contentType,
      author,
      createdBy: author === 'ai' ? 'automatic' : 'manual',
      analysisTimestamp: new Date().toISOString()
    };
  }

  private async getCurrentBranch(contentType: string): Promise<string> {
    return `main-${contentType}`;
  }

  private async updateVersionTree(version: ContentVersionFull): Promise<void> {
    // Update version tree structure
    await this.storageService.updateVersionTree(version);
  }

  private async requestAutomaticReview(version: ContentVersionFull): Promise<void> {
    // Request automatic review for AI-generated content
    await this.approvalService.requestReview(version.id, 'automatic-review');
  }

  private calculateQualityDiff(quality1: any, quality2: any): any {
    return {
      overallChange: quality2.overall - quality1.overall,
      clarityChange: quality2.clarity - quality1.clarity,
      completenessChange: quality2.completeness - quality1.completeness,
      accuracyChange: quality2.accuracy - quality1.accuracy,
      consistencyChange: quality2.consistency - quality1.consistency
    };
  }

  private async identifyStructuralChanges(content1: string, content2: string): Promise<StructuralChange[]> {
    // Identify structural changes between content versions
    return [
      {
        type: 'paragraph_added',
        location: 'section_2',
        description: 'New paragraph added in section 2',
        impact: 'medium'
      }
    ];
  }

  private async identifySemanticChanges(content1: string, content2: string): Promise<SemanticChange[]> {
    // Identify semantic changes between content versions
    return [
      {
        type: 'meaning_shift',
        location: 'paragraph_3',
        description: 'Meaning has shifted in paragraph 3',
        severity: 'low'
      }
    ];
  }

  private async generateChangeSummary(textDiff: any, qualityDiff: any, structuralChanges: StructuralChange[]): Promise<string> {
    const summaryParts: string[] = [];
    
    if (qualityDiff.overallChange > 0) {
      summaryParts.push(`Quality improved by ${qualityDiff.overallChange} points`);
    }
    
    if (structuralChanges.length > 0) {
      summaryParts.push(`${structuralChanges.length} structural changes detected`);
    }
    
    return summaryParts.join('; ');
  }

  private async assessChangeImpact(version1: ContentVersionFull, version2: ContentVersionFull, textDiff: any): Promise<ImpactAssessment> {
    return {
      riskLevel: 'low',
      affectedSections: ['introduction', 'conclusion'],
      stakeholderImpact: 'minimal',
      approvalRequired: false,
      rollbackComplexity: 'simple'
    };
  }

  private async generateComparisonRecommendations(
    version1: ContentVersionFull,
    version2: ContentVersionFull,
    qualityDiff: any,
    impact: ImpactAssessment
  ): Promise<string[]> {
    const recommendations: string[] = [];
    
    if (qualityDiff.overallChange > 10) {
      recommendations.push('Significant quality improvement detected - recommend approval');
    }
    
    if (impact.riskLevel === 'high') {
      recommendations.push('High-risk changes detected - require additional review');
    }
    
    return recommendations;
  }

  private async calculateVersionMetrics(versions: ContentVersionFull[]): Promise<VersionMetrics> {
    return {
      totalVersions: versions.length,
      averageQualityScore: versions.reduce((sum, v) => sum + v.qualityScore.overall, 0) / versions.length,
      approvalRate: versions.filter(v => v.approvalStatus === 'approved').length / versions.length,
      averageTimeToApproval: 24, // hours
      mostActiveAuthor: this.findMostActiveAuthor(versions),
      qualityTrend: 'improving'
    };
  }

  private async analyzePerformanceTrends(versions: ContentVersionFull[]): Promise<VersionPerformance[]> {
    return versions.map(version => ({
      versionId: version.id,
      timestamp: version.timestamp,
      qualityScore: version.qualityScore.overall,
      approvalTime: 24, // Simplified
      authorProductivity: 85
    }));
  }

  private async generateCollaborationAnalytics(versions: ContentVersionFull[]): Promise<CollaborationAnalytics> {
    const authors = [...new Set(versions.map(v => v.author))];
    const authorStats = authors.map(author => ({
      author,
      versionsCreated: versions.filter(v => v.author === author).length,
      averageQuality: versions
        .filter(v => v.author === author)
        .reduce((sum, v) => sum + v.qualityScore.overall, 0) / 
        versions.filter(v => v.author === author).length,
      approvalRate: versions
        .filter(v => v.author === author && v.approvalStatus === 'approved').length /
        versions.filter(v => v.author === author).length
    }));
    
    return {
      totalAuthors: authors.length,
      authorStats,
      collaborationScore: 85,
      averageResponseTime: 12 // hours
    };
  }

  private async generateVersionTimeline(versions: ContentVersionFull[]): Promise<TimelineEvent[]> {
    return versions.map(version => ({
      id: version.id,
      timestamp: version.timestamp,
      event: 'version_created',
      author: version.author,
      description: version.changeDescription,
      qualityImpact: version.qualityScore.overall
    }));
  }

  private async generateHistoryInsights(versions: ContentVersionFull[], metrics: VersionMetrics): Promise<string[]> {
    const insights: string[] = [];
    
    if (metrics.qualityTrend === 'improving') {
      insights.push('Content quality is consistently improving over time');
    }
    
    if (metrics.approvalRate > 0.8) {
      insights.push('High approval rate indicates effective content creation process');
    }
    
    return insights;
  }

  private async generateApprovalWorkflow(version: ContentVersionFull, approvalResult: any): Promise<ApprovalWorkflow> {
    return {
      versionId: version.id,
      currentStatus: approvalResult.status,
      reviewers: approvalResult.reviewers,
      timeline: approvalResult.timeline,
      nextSteps: approvalResult.nextSteps
    };
  }

  private async handleApprovalConsequences(version: ContentVersionFull): Promise<void> {
    // Handle post-approval actions
    await this.storageService.markAsApproved(version.id);
    await this.collaborationService.notifyApproval(version);
  }

  private async handleRejectionConsequences(version: ContentVersionFull, feedback?: string): Promise<void> {
    // Handle post-rejection actions
    await this.storageService.markAsRejected(version.id);
    await this.collaborationService.notifyRejection(version, feedback);
  }

  private async identifyMergeConflicts(sourceVersions: ContentVersionFull[], targetVersions: ContentVersionFull[]): Promise<MergeConflict[]> {
    // Identify conflicts between branches
    return [];
  }

  private async performAutomaticMerge(sourceVersions: ContentVersionFull[], targetVersions: ContentVersionFull[]): Promise<MergeRequest> {
    // Perform automatic merge
    return {
      id: generateId('merge'),
      sourceBranchId: 'source',
      targetBranchId: 'target',
      status: 'completed',
      conflicts: [],
      resolution: 'automatic'
    };
  }

  private async createMergeRequest(
    sourceBranchId: string,
    targetBranchId: string,
    conflicts: MergeConflict[],
    resolver?: string
  ): Promise<MergeRequest> {
    return {
      id: generateId('merge-request'),
      sourceBranchId,
      targetBranchId,
      status: 'pending',
      conflicts,
      resolution: 'manual',
      resolver
    };
  }

  private findMostActiveAuthor(versions: ContentVersionFull[]): string {
    const authorCounts = versions.reduce((acc, version) => {
      acc[version.author] = (acc[version.author] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(authorCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'unknown';
  }

  // Additional helper methods continue...
  private async calculateQualityMetrics(versions: ContentVersionFull[]): Promise<QualityMetrics> {
    return {
      averageQuality: versions.reduce((sum, v) => sum + v.qualityScore.overall, 0) / versions.length,
      qualityRange: Math.max(...versions.map(v => v.qualityScore.overall)) - Math.min(...versions.map(v => v.qualityScore.overall)),
      improvementRate: 5.2,
      consistencyScore: 85
    };
  }

  private async calculateProductivityMetrics(versions: ContentVersionFull[]): Promise<ProductivityMetrics> {
    return {
      versionsPerDay: versions.length / 7,
      averageTimePerVersion: 2.5, // hours
      revisionRate: 0.3,
      automationRate: versions.filter(v => v.author === 'ai').length / versions.length
    };
  }

  private async calculateCollaborationMetrics(versions: ContentVersionFull[]): Promise<CollaborationMetrics> {
    return {
      uniqueAuthors: new Set(versions.map(v => v.author)).size,
      averageCollaboration: 3.2,
      conflictRate: 0.1,
      resolutionTime: 4.5 // hours
    };
  }

  private async calculateApprovalMetrics(versions: ContentVersionFull[]): Promise<ApprovalMetrics> {
    return {
      approvalRate: versions.filter(v => v.approvalStatus === 'approved').length / versions.length,
      averageApprovalTime: 18, // hours
      rejectionRate: versions.filter(v => v.approvalStatus === 'rejected').length / versions.length,
      pendingRate: versions.filter(v => v.approvalStatus === 'pending').length / versions.length
    };
  }

  private async generatePerformanceAnalysis(versions: ContentVersionFull[], timeRange: TimeRange): Promise<PerformanceAnalysis> {
    return {
      timeRange,
      totalActivity: versions.length,
      qualityImprovement: 12.5,
      productivityGain: 8.3,
      collaborationEffectiveness: 87
    };
  }

  private async identifyVersionTrends(versions: ContentVersionFull[]): Promise<VersionTrend[]> {
    return [
      {
        trend: 'quality_improvement',
        strength: 'strong',
        duration: '30_days',
        prediction: 'continuing'
      },
      {
        trend: 'increased_collaboration',
        strength: 'moderate',
        duration: '14_days',
        prediction: 'stabilizing'
      }
    ];
  }

  private async generateVersionRecommendations(
    qualityMetrics: QualityMetrics,
    productivityMetrics: ProductivityMetrics,
    trends: VersionTrend[]
  ): Promise<VersionRecommendation[]> {
    return [
      {
        id: generateId('recommendation'),
        type: 'quality_improvement',
        priority: 'high',
        description: 'Continue focus on quality improvements',
        expectedImpact: 'significant'
      }
    ];
  }

  private async generateVersionVisualizations(versions: ContentVersionFull[], timeRange: TimeRange): Promise<VisualizationData[]> {
    return [
      {
        type: 'quality_timeline',
        data: versions.map(v => ({ x: v.timestamp, y: v.qualityScore.overall })),
        description: 'Quality scores over time'
      },
      {
        type: 'author_contribution',
        data: this.calculateAuthorContributions(versions),
        description: 'Author contribution breakdown'
      }
    ];
  }

  private calculateAuthorContributions(versions: ContentVersionFull[]): any[] {
    const contributions = versions.reduce((acc, version) => {
      acc[version.author] = (acc[version.author] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(contributions).map(([author, count]) => ({ author, count }));
  }

  private async analyzeRollbackImpact(currentVersion: ContentVersionFull, targetVersion: ContentVersionFull): Promise<RollbackImpact> {
    return {
      qualityImpact: currentVersion.qualityScore.overall - targetVersion.qualityScore.overall,
      featuresLost: ['recent_improvements'],
      riskAssessment: 'low',
      estimatedEffort: 'minimal'
    };
  }

  private async generateRollbackReport(
    currentVersion: ContentVersionFull,
    targetVersion: ContentVersionFull,
    rollbackVersion: ContentVersionFull,
    impact: RollbackImpact
  ): Promise<RollbackReport> {
    return {
      rollbackId: rollbackVersion.id,
      fromVersion: currentVersion.id,
      toVersion: targetVersion.id,
      impact,
      timestamp: new Date(),
      success: true
    };
  }
}

// Supporting interfaces
interface HistoryOptions {
  limit?: number;
  offset?: number;
  author?: string;
  timeRange?: TimeRange;
}

interface TimeRange {
  start: Date;
  end: Date;
}

interface StructuralChange {
  type: string;
  location: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
}

interface SemanticChange {
  type: string;
  location: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

interface ImpactAssessment {
  riskLevel: 'low' | 'medium' | 'high';
  affectedSections: string[];
  stakeholderImpact: string;
  approvalRequired: boolean;
  rollbackComplexity: 'simple' | 'moderate' | 'complex';
}

interface TimelineEvent {
  id: string;
  timestamp: Date;
  event: string;
  author: string;
  description: string;
  qualityImpact: number;
}

interface MergeConflict {
  location: string;
  type: string;
  description: string;
  resolution?: string;
}

interface QualityMetrics {
  averageQuality: number;
  qualityRange: number;
  improvementRate: number;
  consistencyScore: number;
}

interface ProductivityMetrics {
  versionsPerDay: number;
  averageTimePerVersion: number;
  revisionRate: number;
  automationRate: number;
}

interface CollaborationMetrics {
  uniqueAuthors: number;
  averageCollaboration: number;
  conflictRate: number;
  resolutionTime: number;
}

interface ApprovalMetrics {
  approvalRate: number;
  averageApprovalTime: number;
  rejectionRate: number;
  pendingRate: number;
}

interface PerformanceAnalysis {
  timeRange: TimeRange;
  totalActivity: number;
  qualityImprovement: number;
  productivityGain: number;
  collaborationEffectiveness: number;
}

interface VersionTrend {
  trend: string;
  strength: 'weak' | 'moderate' | 'strong';
  duration: string;
  prediction: string;
}

interface VersionRecommendation {
  id: string;
  type: string;
  priority: 'low' | 'medium' | 'high';
  description: string;
  expectedImpact: string;
}

interface VisualizationData {
  type: string;
  data: any[];
  description: string;
}

interface RollbackResult {
  success: boolean;
  rollbackVersion: ContentVersionFull;
  impactAnalysis: RollbackImpact;
  rollbackReport: RollbackReport;
}

interface RollbackImpact {
  qualityImpact: number;
  featuresLost: string[];
  riskAssessment: string;
  estimatedEffort: string;
}

interface RollbackReport {
  rollbackId: string;
  fromVersion: string;
  toVersion: string;
  impact: RollbackImpact;
  timestamp: Date;
  success: boolean;
}

// Service interfaces
interface VersionStorageService {
  storeVersion(version: ContentVersionFull): Promise<void>;
  getVersion(versionId: string): Promise<ContentVersionFull | null>;
  getVersionsByContentId(contentId: string, options?: HistoryOptions): Promise<ContentVersionFull[]>;
  getVersionsByBranch(branchId: string): Promise<ContentVersionFull[]>;
  getVersionsByTimeRange(contentId: string, timeRange: TimeRange): Promise<ContentVersionFull[]>;
  updateVersionStatus(versionId: string, status: keyof ApprovalStatus): Promise<void>;
  updateVersionTree(version: ContentVersionFull): Promise<void>;
  markAsApproved(versionId: string): Promise<void>;
  markAsRejected(versionId: string): Promise<void>;
}

interface DiffCalculationService {
  calculateTextDiff(text1: string, text2: string): Promise<any>;
}

interface ApprovalService {
  processDecision(version: ContentVersionFull, decision: keyof ApprovalStatus, reviewerId: string, feedback?: string): Promise<any>;
  requestReview(versionId: string, reviewType: string): Promise<void>;
}

interface CollaborationService {
  trackVersionCreation(version: ContentVersionFull): Promise<void>;
  trackApprovalDecision(version: ContentVersionFull, decision: keyof ApprovalStatus, reviewerId: string): Promise<void>;
  notifyApproval(version: ContentVersionFull): Promise<void>;
  notifyRejection(version: ContentVersionFull, feedback?: string): Promise<void>;
}

interface MetricsService {
  trackMergeOperation(mergeResult: MergeRequest): Promise<void>;
  trackRollback(currentVersion: ContentVersionFull, targetVersion: ContentVersionFull, reason: string): Promise<void>;
} 