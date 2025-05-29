import {
  MonitoringTask,
  MonitoringResult,
  ScheduledAnalysis,
  ProactiveInsight,
  AnalysisType,
  AnalysisFrequency,
  AnalysisConfig,
  UserContext,
  MonitoringFinding,
  InsightPriority,
  AnalysisSchedule,
  NotificationConfig,
  ActionRecommendation,
  PerformanceMetrics
} from '@/types/proactive-monitoring.types';
import { Risk, Control } from '@/types';
import { OrganizationContext, RiskCategory } from '@/types/risk-intelligence.types';
import { generateId } from '@/lib/utils';

// Supporting interfaces for schedule management
interface ScheduleManager {
  scheduleTask(task: MonitoringTask): Promise<void>;
  cancelTask(taskId: string): Promise<void>;
  updateSchedule(taskId: string, schedule: unknown): Promise<void>;
  getActiveSchedules(): Promise<ScheduledAnalysis[]>;
}

interface MonitoringQueue {
  enqueue(task: MonitoringTask): Promise<void>;
  dequeue(): Promise<MonitoringTask | null>;
  peek(): Promise<MonitoringTask | null>;
  size(): Promise<number>;
  clear(): Promise<void>;
}

// Supporting result types
interface TrendAnalysisResult {
  direction: 'increasing' | 'decreasing' | 'stable';
  magnitude: number;
  duration: string;
  acceleration: number;
  stability: number;
}

interface EmergingRisk {
  id: string;
  title: string;
  description: string;
  category: RiskCategory;
  relevanceScore: number;
  confidence: number;
  probability: number;
  timeHorizon: string;
  source: {
    origin: string;
  };
}

export class ProactiveMonitoringService {
  private readonly monitoringQueue: MonitoringQueue;
  private readonly scheduleManager: ScheduleManager;
  private readonly aiService: AIAnalysisService;
  private readonly dataService: DataRetrievalService;
  private readonly cacheService: CacheService;
  private readonly eventService: EventService;
  private readonly performanceService: PerformanceService;
  
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private activeMonitors: Map<string, MonitoringSession> = new Map();

  constructor(
    monitoringQueue: MonitoringQueue,
    scheduleManager: ScheduleManager,
    aiService: AIAnalysisService,
    dataService: DataRetrievalService,
    cacheService: CacheService,
    eventService: EventService,
    performanceService: PerformanceService
  ) {
    this.monitoringQueue = monitoringQueue;
    this.scheduleManager = scheduleManager;
    this.aiService = aiService;
    this.dataService = dataService;
    this.cacheService = cacheService;
    this.eventService = eventService;
    this.performanceService = performanceService;
  }

  /**
   * Start continuous monitoring for a user
   */
  async startContinuousMonitoring(userId: string): Promise<void> {
    try {
      console.log(`Starting continuous monitoring for user: ${userId}`);
      
      // Get user context and organization setup
      const userContext = await this.getUserContext(userId);
      const orgContext = await this.getOrganizationContext(userContext.organizationId);
      
      // Initialize monitoring session
      const session = await this.createMonitoringSession(userId, userContext, orgContext);
      this.activeMonitors.set(userId, session);
      
      // Schedule background risk register analysis
      await this.scheduleRiskRegisterAnalysis(userId, orgContext);
      
      // Schedule emerging risk detection
      await this.scheduleEmergingRiskDetection(userId, orgContext);
      
      // Schedule control effectiveness monitoring
      await this.scheduleControlEffectivenessMonitoring(userId, orgContext);
      
      // Schedule compliance status tracking
      await this.scheduleComplianceStatusTracking(userId, orgContext);
      
      // Start the monitoring loop if not already running
      if (!this.isMonitoring) {
        await this.startMonitoringLoop();
      }
      
      // Emit monitoring started event
      await this.eventService.emit('monitoring:started', {
        userId,
        sessionId: session.id,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error(`Error starting continuous monitoring for user ${userId}:`, error);
      throw new Error('Failed to start continuous monitoring');
    }
  }

  /**
   * Stop continuous monitoring for a user
   */
  async stopContinuousMonitoring(userId: string): Promise<void> {
    try {
      const session = this.activeMonitors.get(userId);
      if (!session) {
        console.warn(`No active monitoring session found for user: ${userId}`);
        return;
      }
      
      // Cancel all scheduled tasks for this user
      await this.cancelUserTasks(userId);
      
      // Remove from active monitors
      this.activeMonitors.delete(userId);
      
      // Stop monitoring loop if no active sessions
      if (this.activeMonitors.size === 0 && this.isMonitoring) {
        await this.stopMonitoringLoop();
      }
      
      // Emit monitoring stopped event
      await this.eventService.emit('monitoring:stopped', {
        userId,
        sessionId: session.id,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error(`Error stopping continuous monitoring for user ${userId}:`, error);
      throw new Error('Failed to stop continuous monitoring');
    }
  }

  /**
   * Schedule specific analysis with custom configuration
   */
  async scheduleAnalysis(
    analysisType: AnalysisType,
    targetIds: string[],
    frequency: AnalysisFrequency,
    config?: Partial<AnalysisConfig>
  ): Promise<ScheduledAnalysis> {
    try {
      const scheduledAnalysis: ScheduledAnalysis = {
        id: generateId('scheduled-analysis'),
        name: `${analysisType} Analysis`,
        description: `Scheduled ${analysisType} analysis for ${targetIds.length} targets`,
        analysisType,
        targetIds,
        frequency,
        schedule: this.createAnalysisSchedule(frequency),
        enabled: true,
        nextRun: this.calculateNextRun(frequency),
        config: this.mergeAnalysisConfig(config),
        notifications: this.getDefaultNotificationConfig(),
        history: []
      };
      
      // Create monitoring tasks for each target
      const tasks = await this.createMonitoringTasks(scheduledAnalysis);
      
      // Register with schedule manager
      await this.scheduleManager.scheduleTask(tasks[0]);
      
      // Store scheduled analysis
      await this.cacheService.set(`scheduled:${scheduledAnalysis.id}`, scheduledAnalysis, { ttl: 86400 });
      
      return scheduledAnalysis;
      
    } catch (error) {
      console.error('Error scheduling analysis:', error);
      throw new Error('Failed to schedule analysis');
    }
  }

  /**
   * Generate proactive insights based on user context
   */
  async generateProactiveInsights(context: UserContext): Promise<ProactiveInsight[]> {
    try {
      const insights: ProactiveInsight[] = [];
      
      // Identify risks requiring attention
      const risksRequiringAttention = await this.identifyRisksRequiringAttention(context);
      insights.push(...risksRequiringAttention);
      
      // Identify outdated assessments
      const outdatedAssessments = await this.identifyOutdatedAssessments(context);
      insights.push(...outdatedAssessments);
      
      // Identify control testing due dates
      const controlTestingDue = await this.identifyControlTestingDue(context);
      insights.push(...controlTestingDue);
      
      // Identify emerging industry risks
      const emergingRisks = await this.identifyEmergingIndustryRisks(context);
      insights.push(...emergingRisks);
      
      // Identify workflow inefficiencies
      const workflowIssues = await this.identifyWorkflowInefficiencies(context);
      insights.push(...workflowIssues);
      
      // Sort by priority and confidence
      const prioritizedInsights = this.prioritizeInsights(insights);
      
      // Limit to top 20 insights to avoid overwhelming users
      return prioritizedInsights.slice(0, 20);
      
    } catch (error) {
      console.error('Error generating proactive insights:', error);
      throw new Error('Failed to generate proactive insights');
    }
  }

  /**
   * Execute scheduled monitoring task
   */
  async executeMonitoringTask(task: MonitoringTask): Promise<MonitoringResult> {
    try {
      const startTime = Date.now();
      
      // Update task status
      task.status = 'running';
      task.startedAt = new Date();
      
      // Get target data based on task type
      const targetData = await this.getTargetData(task.targetId, task.targetType);
      
      // Perform analysis based on task type
      const analysisResult = await this.performAnalysis(task, targetData);
      
      // Generate findings and insights
      const findings = await this.generateFindings(task, analysisResult);
      const insights = await this.generateInsights(task, analysisResult, findings);
      const recommendations = await this.generateRecommendations(insights, findings);
      
      // Get performance metrics
      const metrics = await this.performanceService.getCurrentMetrics();
      
      // Create monitoring result
      const result: MonitoringResult = {
        taskId: task.id,
        status: this.determineResultStatus(findings),
        findings,
        metrics,
        insights,
        recommendations,
        timestamp: new Date(),
        confidence: this.calculateOverallConfidence(insights)
      };
      
      // Update task
      task.status = 'completed';
      task.completedAt = new Date();
      task.lastResult = result;
      
      // Cache result
      await this.cacheService.set(`result:${task.id}`, result, { ttl: 3600 });
      
      // Emit task completed event
      await this.eventService.emit('monitoring:task_completed', {
        taskId: task.id,
        status: result.status,
        insightCount: insights.length,
        duration: Date.now() - startTime
      });
      
      return result;
      
    } catch (error) {
      console.error(`Error executing monitoring task ${task.id}:`, error);
      
      // Update task status to failed
      task.status = 'failed';
      task.completedAt = new Date();
      
      throw new Error('Failed to execute monitoring task');
    }
  }

  /**
   * Get monitoring status for a user
   */
  async getMonitoringStatus(userId: string): Promise<MonitoringStatus> {
    try {
      const session = this.activeMonitors.get(userId);
      
      if (!session) {
        return {
          active: false,
          session: null,
          activeTasks: 0,
          lastUpdate: null,
          upcomingTasks: [],
          recentResults: []
        };
      }
      
      // Get active tasks count
      const activeTasks = await this.getActiveTasksCount();
      
      // Get upcoming scheduled tasks
      const upcomingTasks = await this.getUpcomingTasks();
      
      // Get recent results
      const recentResults = await this.getRecentResults();
      
      return {
        active: true,
        session,
        activeTasks,
        lastUpdate: session.lastUpdate,
        upcomingTasks,
        recentResults
      };
      
    } catch (error) {
      console.error(`Error getting monitoring status for user ${userId}:`, error);
      throw new Error('Failed to get monitoring status');
    }
  }

  // Private helper methods
  private async startMonitoringLoop(): Promise<void> {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('Starting monitoring loop');
    
    // Process monitoring queue every 30 seconds
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.processMonitoringQueue();
      } catch (error) {
        console.error('Error in monitoring loop:', error);
      }
    }, 30000);
  }

  private async stopMonitoringLoop(): Promise<void> {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    console.log('Stopped monitoring loop');
  }

  private async processMonitoringQueue(): Promise<void> {
    const queueSize = await this.monitoringQueue.size();
    if (queueSize === 0) return;
    
    console.log(`Processing monitoring queue with ${queueSize} tasks`);
    
    // Process tasks in batches to avoid overwhelming the system
    const batchSize = 5;
    const tasksToProcess: MonitoringTask[] = [];
    
    for (let i = 0; i < batchSize && i < queueSize; i++) {
      const task = await this.monitoringQueue.dequeue();
      if (task) {
        tasksToProcess.push(task);
      }
    }
    
    // Execute tasks in parallel
    const taskPromises = tasksToProcess.map(task => 
      this.executeMonitoringTask(task).catch(error => {
        console.error(`Task ${task.id} failed:`, error);
        return null;
      })
    );
    
    await Promise.all(taskPromises);
  }

  private async getUserContext(userId: string): Promise<UserContext> {
    // Get user context from cache or data service
    const cached = await this.cacheService.get(`user_context:${userId}`);
    if (cached) return cached as UserContext;
    
    const userContext = await this.dataService.getUserContext(userId);
    await this.cacheService.set(`user_context:${userId}`, userContext, { ttl: 1800 });
    
    return userContext;
  }

  private async getOrganizationContext(organizationId: string): Promise<OrganizationContext> {
    const cached = await this.cacheService.get(`org_context:${organizationId}`);
    if (cached) return cached as OrganizationContext;
    
    const orgContext = await this.dataService.getOrganizationContext(organizationId);
    await this.cacheService.set(`org_context:${organizationId}`, orgContext, { ttl: 3600 });
    
    return orgContext;
  }

  private async createMonitoringSession(
    userId: string, 
    userContext: UserContext, 
    orgContext: OrganizationContext
  ): Promise<MonitoringSession> {
    return {
      id: generateId('monitoring-session'),
      userId,
      startTime: new Date(),
      lastUpdate: new Date(),
      userContext,
      organizationContext: orgContext,
      activeTasks: 0,
      completedTasks: 0,
      generatedInsights: 0,
      status: 'active'
    };
  }

  private async scheduleRiskRegisterAnalysis(userId: string, orgContext: OrganizationContext): Promise<void> {
    const riskIds = orgContext.currentRiskLandscape.map(risk => risk.id);
    
    const task: MonitoringTask = {
      id: generateId('monitoring-task'),
      type: 'risk_analysis',
      targetId: orgContext.id,
      targetType: 'risk',
      priority: 'medium',
      frequency: 'daily',
      status: 'pending',
      scheduledAt: new Date(),
      metadata: {
        userId,
        riskIds,
        analysisType: 'comprehensive'
      }
    };
    
    await this.monitoringQueue.enqueue(task);
  }

  private async scheduleEmergingRiskDetection(userId: string, orgContext: OrganizationContext): Promise<void> {
    const task: MonitoringTask = {
      id: generateId('monitoring-task'),
      type: 'external_intelligence',
      targetId: orgContext.industry.code,
      targetType: 'system',
      priority: 'medium',
      frequency: 'weekly',
      status: 'pending',
      scheduledAt: new Date(),
      metadata: {
        userId,
        industry: orgContext.industry,
        analysisType: 'emerging_risks'
      }
    };
    
    await this.monitoringQueue.enqueue(task);
  }

  private async scheduleControlEffectivenessMonitoring(userId: string, orgContext: OrganizationContext): Promise<void> {
    // Get all controls from the organization
    const controls = await this.dataService.getOrganizationControls(orgContext.id);
    
    for (const control of controls.slice(0, 10)) { // Limit to top 10 controls
      const task: MonitoringTask = {
        id: generateId('monitoring-task'),
        type: 'control_testing',
        targetId: control.id,
        targetType: 'control',
        priority: 'high',
        frequency: 'weekly',
        status: 'pending',
        scheduledAt: new Date(),
        metadata: {
          userId,
          controlId: control.id,
          analysisType: 'effectiveness'
        }
      };
      
      await this.monitoringQueue.enqueue(task);
    }
  }

  private async scheduleComplianceStatusTracking(userId: string, orgContext: OrganizationContext): Promise<void> {
    for (const framework of orgContext.regulatoryEnvironment) {
      const task: MonitoringTask = {
        id: generateId('monitoring-task'),
        type: 'compliance_check',
        targetId: framework.id,
        targetType: 'compliance',
        priority: 'high',
        frequency: 'weekly',
        status: 'pending',
        scheduledAt: new Date(),
        metadata: {
          userId,
          frameworkId: framework.id,
          analysisType: 'compliance_status'
        }
      };
      
      await this.monitoringQueue.enqueue(task);
    }
  }

  private async identifyRisksRequiringAttention(context: UserContext): Promise<ProactiveInsight[]> {
    const insights: ProactiveInsight[] = [];
    
    // Analyze active risks for urgent attention
    for (const riskId of context.workContext.active_risks.slice(0, 5)) {
      const risk = await this.dataService.getRisk(riskId);
      if (!risk) continue;
      
      // Check if risk score has increased significantly
      const riskTrend = await this.aiService.analyzeRiskTrend(risk);
      
      if (riskTrend.direction === 'increasing' && riskTrend.magnitude > 20) {
        insights.push({
          id: generateId('insight'),
          type: 'risk_increase',
          category: risk.category as RiskCategory,
          priority: 'high',
          title: `Risk Level Increasing: ${risk.title}`,
          description: `Risk score has increased by ${riskTrend.magnitude}% over the past month`,
          details: {
            context: `Risk ${risk.title} shows concerning upward trend`,
            evidence: [{
              type: 'trend',
              description: 'Risk score trend analysis',
              value: riskTrend.magnitude,
              threshold: 20,
              context: 'Monthly trend analysis'
            }],
            trend: {
              direction: 'increasing',
              magnitude: riskTrend.magnitude,
              duration: '30 days',
              acceleration: 5,
              stability: 60
            },
            comparison: {
              baseline: risk.riskScore - riskTrend.magnitude,
              current: risk.riskScore,
              change: riskTrend.magnitude,
              percentChange: (riskTrend.magnitude / risk.riskScore) * 100
            },
            prediction: {
              forecast: [risk.riskScore + 5, risk.riskScore + 10],
              confidenceInterval: { lower: 80, upper: 95, confidence: 85 },
              timeframe: '3 months',
              assumptions: ['Current trend continues', 'No major mitigation implemented'],
              scenarios: [{
                name: 'Continued increase',
                probability: 70,
                outcome: risk.riskScore + 15,
                description: 'Risk continues to increase without intervention'
              }]
            },
            relatedInsights: []
          },
          actionItems: [{
            id: generateId('action'),
            type: 'investigation',
            title: 'Investigate Risk Increase',
            description: 'Analyze root causes of risk score increase',
            priority: 'urgent',
            estimatedEffort: '2-4 hours',
            dependencies: [],
            resources: ['Risk Analyst', 'SME'],
            status: 'pending',
            progress: 0
          }],
          status: 'new',
          source: {
            system: 'ProactiveMonitoring',
            component: 'RiskTrendAnalysis',
            dataSource: 'RiskDatabase',
            algorithm: 'TrendDetection v2.1',
            version: '2.1.0'
          },
          confidence: 85,
          impact: {
            financial: riskTrend.magnitude * 1000,
            operational: 'Potential process disruption',
            compliance: 'May affect compliance posture',
            reputation: 'Could impact stakeholder confidence',
            strategic: 'May require strategy adjustment'
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {
            riskId: risk.id,
            trendMagnitude: riskTrend.magnitude,
            analysisMethod: 'statistical_trend_analysis'
          }
        });
      }
    }
    
    return insights;
  }

  private async identifyOutdatedAssessments(context: UserContext): Promise<ProactiveInsight[]> {
    const insights: ProactiveInsight[] = [];
    
    // Check for assessments that haven't been updated in 6+ months
    const outdatedThreshold = new Date();
    outdatedThreshold.setMonth(outdatedThreshold.getMonth() - 6);
    
    for (const riskId of context.workContext.active_risks) {
      const risk = await this.dataService.getRisk(riskId);
      if (!risk || !risk.lastAssessed) continue;
      
      if (risk.lastAssessed < outdatedThreshold) {
        insights.push({
          id: generateId('insight'),
          type: 'process_improvement',
          category: risk.category as RiskCategory,
          priority: 'medium',
          title: `Assessment Overdue: ${risk.title}`,
          description: `Risk assessment is ${Math.floor((Date.now() - risk.lastAssessed.getTime()) / (1000 * 60 * 60 * 24))} days overdue`,
          details: {
            context: `Risk assessment requires updating to maintain accuracy`,
            evidence: [{
              type: 'comparison',
              description: 'Days since last assessment',
              value: Math.floor((Date.now() - risk.lastAssessed.getTime()) / (1000 * 60 * 60 * 24)),
              threshold: 180,
              context: 'Assessment staleness'
            }],
            trend: {
              direction: 'stable',
              magnitude: 0,
              duration: '6+ months',
              acceleration: 0,
              stability: 100
            },
            comparison: {
              baseline: 180,
              current: Math.floor((Date.now() - risk.lastAssessed.getTime()) / (1000 * 60 * 60 * 24)),
              change: Math.floor((Date.now() - risk.lastAssessed.getTime()) / (1000 * 60 * 60 * 24)) - 180,
              percentChange: 50
            },
            prediction: {
              forecast: [],
              confidenceInterval: { lower: 90, upper: 100, confidence: 95 },
              timeframe: 'immediate',
              assumptions: ['Assessment remains current priority'],
              scenarios: []
            },
            relatedInsights: []
          },
          actionItems: [{
            id: generateId('action'),
            type: 'process_change',
            title: 'Schedule Risk Assessment',
            description: 'Update risk assessment with current information',
            priority: 'medium',
            estimatedEffort: '1-2 hours',
            dependencies: [],
            resources: ['Risk Owner', 'SME'],
            status: 'pending',
            progress: 0
          }],
          status: 'new',
          source: {
            system: 'ProactiveMonitoring',
            component: 'AssessmentTracking',
            dataSource: 'RiskDatabase',
            algorithm: 'StalenessDetection v1.0',
            version: '1.0.0'
          },
          confidence: 95,
          impact: {
            financial: 0,
            operational: 'Reduced assessment accuracy',
            compliance: 'May affect audit readiness',
            reputation: 'Minimal impact',
            strategic: 'Outdated risk information'
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {
            riskId: risk.id,
            daysSinceAssessment: Math.floor((Date.now() - risk.lastAssessed.getTime()) / (1000 * 60 * 60 * 24))
          }
        });
      }
    }
    
    return insights;
  }

  private async identifyControlTestingDue(context: UserContext): Promise<ProactiveInsight[]> {
    const insights: ProactiveInsight[] = [];
    
    // Check upcoming deadlines for control testing
    const upcomingDeadlines = context.workContext.upcoming_deadlines
      .filter(deadline => deadline.type === 'control_testing' && deadline.urgency <= 30)
      .slice(0, 5);
    
    for (const deadline of upcomingDeadlines) {
      const urgencyLevel = deadline.urgency <= 7 ? 'critical' : 
                          deadline.urgency <= 14 ? 'high' : 'medium';
      
      insights.push({
        id: generateId('insight'),
        type: 'compliance_gap',
        category: 'operational',
        priority: urgencyLevel as InsightPriority,
        title: `Control Testing Due: ${deadline.title}`,
        description: `Control testing due in ${deadline.urgency} days`,
        details: {
          context: `Regular control testing maintains compliance and effectiveness`,
          evidence: [{
            type: 'metric',
            description: 'Days until testing due',
            value: deadline.urgency,
            threshold: 30,
            context: 'Testing schedule'
          }],
          trend: {
            direction: 'decreasing',
            magnitude: 1,
            duration: `${deadline.urgency} days`,
            acceleration: 0,
            stability: 100
          },
          comparison: {
            baseline: 90,
            current: deadline.urgency,
            change: deadline.urgency - 90,
            percentChange: ((deadline.urgency - 90) / 90) * 100
          },
          prediction: {
            forecast: [],
            confidenceInterval: { lower: 100, upper: 100, confidence: 100 },
            timeframe: 'fixed',
            assumptions: ['Testing schedule is fixed'],
            scenarios: []
          },
          relatedInsights: []
        },
        actionItems: [{
          id: generateId('action'),
          type: 'monitoring',
          title: 'Execute Control Testing',
          description: 'Perform scheduled control testing procedures',
          priority: urgencyLevel === 'critical' ? 'immediate' : 'urgent',
          dueDate: deadline.date,
          estimatedEffort: '2-4 hours',
          dependencies: [],
          resources: ['Control Owner', 'Testing Team'],
          status: 'pending',
          progress: 0
        }],
        deadline: deadline.date,
        status: 'new',
        source: {
          system: 'ProactiveMonitoring',
          component: 'ScheduleTracking',
          dataSource: 'ScheduleDatabase',
          algorithm: 'DeadlineMonitor v1.0',
          version: '1.0.0'
        },
        confidence: 100,
        impact: {
          financial: 0,
          operational: 'Maintains control effectiveness',
          compliance: 'Required for compliance',
          reputation: 'Demonstrates diligence',
          strategic: 'Supports risk management'
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          deadlineId: deadline.id,
          daysUntilDue: deadline.urgency
        }
      });
    }
    
    return insights;
  }

  private async identifyEmergingIndustryRisks(context: UserContext): Promise<ProactiveInsight[]> {
    const insights: ProactiveInsight[] = [];
    
    // Get external intelligence about emerging risks
    const emergingRisks = await this.aiService.getEmergingRisks(context.organizationId);
    
    for (const emergingRisk of emergingRisks.slice(0, 3)) {
      if (emergingRisk.relevanceScore > 70) {
        insights.push({
          id: generateId('insight'),
          type: 'emerging_threat',
          category: emergingRisk.category,
          priority: emergingRisk.relevanceScore > 90 ? 'high' : 'medium',
          title: `Emerging Risk: ${emergingRisk.title}`,
          description: emergingRisk.description,
          details: {
            context: `New risk identified in ${emergingRisk.category} category`,
            evidence: [{
              type: 'trend',
              description: 'Industry risk emergence',
              value: emergingRisk.relevanceScore,
              threshold: 70,
              context: 'External intelligence'
            }],
            trend: {
              direction: 'increasing',
              magnitude: emergingRisk.relevanceScore,
              duration: emergingRisk.timeHorizon,
              acceleration: 5,
              stability: 60
            },
            comparison: {
              baseline: 0,
              current: emergingRisk.relevanceScore,
              change: emergingRisk.relevanceScore,
              percentChange: 100
            },
            prediction: {
              forecast: [emergingRisk.probability * 100],
              confidenceInterval: { 
                lower: emergingRisk.confidence - 10, 
                upper: emergingRisk.confidence + 10, 
                confidence: emergingRisk.confidence 
              },
              timeframe: emergingRisk.timeHorizon,
              assumptions: ['Current trend continues', 'No major industry changes'],
              scenarios: [{
                name: 'Risk materializes',
                probability: emergingRisk.probability * 100,
                outcome: emergingRisk.relevanceScore,
                description: 'Emerging risk becomes significant threat'
              }]
            },
            relatedInsights: []
          },
          actionItems: [{
            id: generateId('action'),
            type: 'investigation',
            title: 'Assess Emerging Risk',
            description: 'Evaluate potential impact and develop mitigation strategy',
            priority: 'medium',
            estimatedEffort: '4-6 hours',
            dependencies: [],
            resources: ['Risk Analyst', 'Industry Expert'],
            status: 'pending',
            progress: 0
          }],
          status: 'new',
          source: {
            system: 'ProactiveMonitoring',
            component: 'ExternalIntelligence',
            dataSource: 'IndustryFeeds',
            algorithm: 'EmergingRiskDetection v1.5',
            version: '1.5.0'
          },
          confidence: emergingRisk.confidence,
          impact: {
            financial: 0,
            operational: 'Potential new threat',
            compliance: 'May require new controls',
            reputation: 'Industry perception',
            strategic: 'Strategic planning consideration'
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {
            emergingRiskId: emergingRisk.id,
            relevanceScore: emergingRisk.relevanceScore,
            source: emergingRisk.source.origin
          }
        });
      }
    }
    
    return insights;
  }

  private async identifyWorkflowInefficiencies(context: UserContext): Promise<ProactiveInsight[]> {
    const insights: ProactiveInsight[] = [];
    
    // Analyze recent activities for efficiency patterns
    const recentActivities = context.workContext.recent_activities
      .filter(activity => activity.duration && activity.duration > 3600000) // > 1 hour
      .slice(0, 5);
    
    if (recentActivities.length > 2) {
      const averageDuration = recentActivities.reduce((sum, activity) => 
        sum + (activity.duration || 0), 0) / recentActivities.length;
      
      if (averageDuration > 7200000) { // > 2 hours average
        insights.push({
          id: generateId('insight'),
          type: 'workflow_bottleneck',
          category: 'operational',
          priority: 'medium',
          title: 'Workflow Efficiency Opportunity',
          description: `Recent activities taking longer than expected (${Math.round(averageDuration / 3600000 * 10) / 10} hours average)`,
          details: {
            context: 'Workflow analysis suggests optimization opportunities',
            evidence: [{
              type: 'metric',
              description: 'Average activity duration',
              value: Math.round(averageDuration / 3600000 * 10) / 10,
              threshold: 2,
              context: 'Time efficiency analysis'
            }],
            trend: {
              direction: 'stable',
              magnitude: 0,
              duration: '7 days',
              acceleration: 0,
              stability: 80
            },
            comparison: {
              baseline: 2,
              current: Math.round(averageDuration / 3600000 * 10) / 10,
              change: Math.round(averageDuration / 3600000 * 10) / 10 - 2,
              percentChange: ((Math.round(averageDuration / 3600000 * 10) / 10 - 2) / 2) * 100
            },
            prediction: {
              forecast: [],
              confidenceInterval: { lower: 70, upper: 90, confidence: 80 },
              timeframe: 'ongoing',
              assumptions: ['Current workflow patterns continue'],
              scenarios: []
            },
            relatedInsights: []
          },
          actionItems: [{
            id: generateId('action'),
            type: 'optimization',
            title: 'Analyze Workflow Efficiency',
            description: 'Review current processes for optimization opportunities',
            priority: 'medium',
            estimatedEffort: '2-3 hours',
            dependencies: [],
            resources: ['Process Analyst', 'User'],
            status: 'pending',
            progress: 0
          }],
          status: 'new',
          source: {
            system: 'ProactiveMonitoring',
            component: 'WorkflowAnalysis',
            dataSource: 'ActivityLogs',
            algorithm: 'EfficiencyAnalysis v1.0',
            version: '1.0.0'
          },
          confidence: 75,
          impact: {
            financial: 0,
            operational: 'Improved productivity',
            compliance: 'More efficient compliance',
            reputation: 'Enhanced performance',
            strategic: 'Resource optimization'
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {
            averageDuration: averageDuration,
            activityCount: recentActivities.length
          }
        });
      }
    }
    
    return insights;
  }

  private prioritizeInsights(insights: ProactiveInsight[]): ProactiveInsight[] {
    return insights.sort((a, b) => {
      // Priority weight (critical=4, high=3, medium=2, low=1, info=0)
      const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
      const aPriorityScore = priorityWeight[a.priority] * a.confidence;
      const bPriorityScore = priorityWeight[b.priority] * b.confidence;
      
      return bPriorityScore - aPriorityScore;
    });
  }

  // Additional helper methods for task management and data processing
  private createAnalysisSchedule(frequency: AnalysisFrequency): AnalysisSchedule {
    const schedule = {
      frequency,
      timezone: 'UTC',
      startDate: new Date(),
      blackoutPeriods: []
    };
    
    switch (frequency) {
      case 'daily':
        return { ...schedule, specificTime: '02:00' };
      case 'weekly':
        return { ...schedule, dayOfWeek: 1, specificTime: '02:00' };
      case 'monthly':
        return { ...schedule, dayOfMonth: 1, specificTime: '02:00' };
      default:
        return schedule;
    }
  }

  private calculateNextRun(frequency: AnalysisFrequency): Date {
    const now = new Date();
    const nextRun = new Date(now);
    
    switch (frequency) {
      case 'hourly':
        nextRun.setHours(now.getHours() + 1);
        break;
      case 'daily':
        nextRun.setDate(now.getDate() + 1);
        nextRun.setHours(2, 0, 0, 0);
        break;
      case 'weekly':
        nextRun.setDate(now.getDate() + 7);
        nextRun.setHours(2, 0, 0, 0);
        break;
      case 'monthly':
        nextRun.setMonth(now.getMonth() + 1);
        nextRun.setDate(1);
        nextRun.setHours(2, 0, 0, 0);
        break;
      default:
        nextRun.setHours(now.getHours() + 1);
    }
    
    return nextRun;
  }

  private mergeAnalysisConfig(config?: Partial<AnalysisConfig>): AnalysisConfig {
    const defaultConfig: AnalysisConfig = {
      thresholds: {
        warning: 70,
        critical: 90,
        anomalyDetection: true,
        customThresholds: []
      },
      parameters: {},
      scope: {
        includeHistorical: true,
        timeWindow: { duration: 30, unit: 'days' },
        dependencies: true,
        relatedEntities: true,
        externalFactors: false
      },
      outputFormat: 'summary',
      retentionDays: 90
    };
    
    return { ...defaultConfig, ...config };
  }

  private getDefaultNotificationConfig(): NotificationConfig {
    return {
      enabled: true,
      channels: [],
      batching: { enabled: false, windowMinutes: 30, maxBatchSize: 5, priorities: [] },
      filtering: { duplicateWindow: 60, relevanceThreshold: 50, categories: [], suppressionRules: [] },
      escalation: { enabled: false, levels: [] }
    };
  }

  private async createMonitoringTasks(scheduledAnalysis: ScheduledAnalysis): Promise<MonitoringTask[]> {
    const tasks: MonitoringTask[] = [];
    
    for (const targetId of scheduledAnalysis.targetIds) {
      const task: MonitoringTask = {
        id: generateId('monitoring-task'),
        type: scheduledAnalysis.analysisType,
        targetId,
        targetType: this.getTargetType(scheduledAnalysis.analysisType),
        priority: 'medium',
        frequency: scheduledAnalysis.frequency,
        status: 'pending',
        scheduledAt: scheduledAnalysis.nextRun,
        metadata: {
          scheduledAnalysisId: scheduledAnalysis.id,
          config: scheduledAnalysis.config
        }
      };
      
      tasks.push(task);
    }
    
    return tasks;
  }

  private getTargetType(analysisType: AnalysisType): 'risk' | 'control' | 'process' | 'compliance' | 'system' {
    switch (analysisType) {
      case 'risk_analysis': return 'risk';
      case 'control_testing': return 'control';
      case 'compliance_check': return 'compliance';
      case 'workflow_analysis': return 'process';
      default: return 'system';
    }
  }

  // Placeholder methods for data operations
  private async getTargetData(targetId: string, targetType: string): Promise<unknown> {
    return await this.dataService.getEntityData(targetId, targetType);
  }

  private async performAnalysis(task: MonitoringTask, targetData: unknown): Promise<unknown> {
    return await this.aiService.performAnalysis(task.type, targetData, task.metadata);
  }

  private async generateFindings(task: MonitoringTask, analysisResult: unknown): Promise<MonitoringFinding[]> {
    return await this.aiService.generateFindings(task, analysisResult);
  }

  private async generateInsights(task: MonitoringTask, analysisResult: unknown, findings: MonitoringFinding[]): Promise<ProactiveInsight[]> {
    return await this.aiService.generateInsights(task, analysisResult, findings);
  }

  private async generateRecommendations(insights: ProactiveInsight[], findings: MonitoringFinding[]): Promise<ActionRecommendation[]> {
    return await this.aiService.generateRecommendations(insights, findings);
  }

  private determineResultStatus(findings: MonitoringFinding[]): 'success' | 'warning' | 'error' | 'anomaly' {
    const hasError = findings.some(f => f.severity === 'critical');
    const hasWarning = findings.some(f => f.severity === 'high' || f.severity === 'medium');
    const hasAnomaly = findings.some(f => f.type === 'anomaly');
    
    if (hasError) return 'error';
    if (hasAnomaly) return 'anomaly';
    if (hasWarning) return 'warning';
    return 'success';
  }

  private calculateOverallConfidence(insights: ProactiveInsight[]): number {
    if (insights.length === 0) return 50;
    
    const avgInsightConfidence = insights.reduce((sum, insight) => sum + insight.confidence, 0) / insights.length;
    return Math.round(avgInsightConfidence);
  }

  private async cancelUserTasks(userId: string): Promise<void> {
    // Implementation to cancel all tasks for a user
    await this.scheduleManager.cancelTask(userId);
  }

  private async getActiveTasksCount(): Promise<number> {
    // Implementation to get count of active tasks for user
    return 0;
  }

  private async getUpcomingTasks(): Promise<MonitoringTask[]> {
    // Implementation to get upcoming tasks for user
    return [];
  }

  private async getRecentResults(): Promise<MonitoringResult[]> {
    // Implementation to get recent results for user
    return [];
  }
}

// Supporting interfaces
interface MonitoringSession {
  id: string;
  userId: string;
  startTime: Date;
  lastUpdate: Date;
  userContext: UserContext;
  organizationContext: OrganizationContext;
  activeTasks: number;
  completedTasks: number;
  generatedInsights: number;
  status: 'active' | 'paused' | 'stopped';
}

interface MonitoringStatus {
  active: boolean;
  session: MonitoringSession | null;
  activeTasks: number;
  lastUpdate: Date | null;
  upcomingTasks: MonitoringTask[];
  recentResults: MonitoringResult[];
}

// Service interfaces
interface AIAnalysisService {
  analyzeRiskTrend(risk: Risk): Promise<TrendAnalysisResult>;
  getEmergingRisks(organizationId: string): Promise<EmergingRisk[]>;
  performAnalysis(type: AnalysisType, data: unknown, metadata: unknown): Promise<unknown>;
  generateFindings(task: MonitoringTask, result: unknown): Promise<MonitoringFinding[]>;
  generateInsights(task: MonitoringTask, result: unknown, findings: MonitoringFinding[]): Promise<ProactiveInsight[]>;
  generateRecommendations(insights: ProactiveInsight[], findings: MonitoringFinding[]): Promise<ActionRecommendation[]>;
}

interface DataRetrievalService {
  getUserContext(userId: string): Promise<UserContext>;
  getOrganizationContext(organizationId: string): Promise<OrganizationContext>;
  getOrganizationControls(organizationId: string): Promise<Control[]>;
  getRisk(riskId: string): Promise<Risk | null>;
  getEntityData(entityId: string, entityType: string): Promise<unknown>;
}

interface CacheService {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown, options?: { ttl?: number }): Promise<void>;
}

interface EventService {
  emit(event: string, data: unknown): Promise<void>;
}

interface PerformanceService {
  getCurrentMetrics(): Promise<PerformanceMetrics>;
} 