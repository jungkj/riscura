// import {
  SmartNotification,
  NotificationChannel,
  IntelligentPriority,
  InsightPriority,
  UserPreferences,
  ContextualData,
  PersonalizedContent,
  SuppressionRule,
  DeliveryChannel,
  EscalationRule,
  ActionItem,
  UserContext,
} from '@/types/proactive-monitoring.types';
// import { Risk, Control } from '@/types';
import { generateId } from '@/lib/utils';

// Import AI services for real integration
// import { AIService } from './AIService';
// import { ComplianceAIService } from './ComplianceAIService';
// import { RiskAnalysisAIService } from './RiskAnalysisAIService';
// import { ProactiveAIIntegrationService } from './ProactiveAIIntegrationService';

// Add missing ComplianceRequirement interface
interface ComplianceRequirement {
  id: string;
  title: string;
  description: string;
  deadline: Date;
  framework: string;
  status: 'compliant' | 'non_compliant' | 'partial' | 'unknown';
}

// Supporting interfaces
interface UserActivity {
  userId: string;
  activity: string;
  timestamp: Date;
  context: string;
  efficiency: number;
  satisfaction?: number;
}

interface NotificationTemplate {
  id: string;
  type: string;
  channel: NotificationChannel;
  template: string;
  variables: string[];
  tone: 'formal' | 'professional' | 'casual';
  language: string;
}

interface DeliveryResult {
  notificationId: string;
  channel: NotificationChannel;
  status: 'sent' | 'failed' | 'queued' | 'suppressed';
  timestamp: Date;
  error?: string;
  metadata?: Record<string, unknown>;
}

interface NotificationAnalytics {
  notificationId: string;
  userId: string;
  metrics: {
    deliveryTime: number;
    readTime?: number;
    actionTime?: number;
    satisfactionScore?: number;
    effectiveness: number;
  };
  interactions: {
    viewed: boolean;
    dismissed: boolean;
    acted: boolean;
    escalated: boolean;
    feedback?: string;
  };
}

// Enhanced AI notification interfaces
interface AINotificationRequest {
  userId: string;
  triggerType:
    | 'risk_change'
    | 'compliance_gap'
    | 'trend_alert'
    | 'insight_available'
    | 'deadline_approaching';
  entityId: string;
  entityType: 'risk' | 'control' | 'compliance' | 'process';
  context: Record<string, unknown>;
  urgency: 'immediate' | 'high' | 'medium' | 'low';
  personalization: {
    userRole: string;
    preferences: UserPreferences;
    historicalEngagement: unknown[];
  };
}

interface AIGeneratedContent {
  title: string;
  message: string;
  summary: string;
  details: string;
  actionItems: ActionItem[];
  tone: 'urgent' | 'informative' | 'advisory' | 'celebratory';
  complexity: 'simple' | 'medium' | 'detailed';
  personalizationApplied: boolean;
  confidence: number;
}

interface IntelligentPrioritizationResult {
  priority: InsightPriority;
  reasoning: string;
  factors: Array<{
    factor: string;
    weight: number;
    score: number;
    description: string;
  }>;
  urgencyScore: number;
  relevanceScore: number;
  impactScore: number;
  finalScore: number;
}

// Enhanced user service interfaces
interface UserService {
  getUserContext(_userId: string): Promise<UserContext>;
  getUserPreferences(_userId: string): Promise<UserPreferences>;
  updateUserPreferences(_userId: string, preferences: Partial<UserPreferences>): Promise<void>;
  getHistoricalEngagement(_userId: string): Promise<unknown[]>;
  recordEngagement(_userId: string, notificationId: string, action: string): Promise<void>;
}

// Enhanced AI insight service
interface AIInsightService {
  analyzeComplianceRequirement(requirement: ComplianceRequirement): Promise<{
    status: 'compliant' | 'non_compliant' | 'partial';
    confidence: number;
    gap?: { severity: string; recommendations: string[] };
  }>;
  generateComplianceInsight(
    requirement: ComplianceRequirement,
    userContext: UserContext,
    analysis: unknown
  ): Promise<{ insight: string; confidence: number; actionable: boolean }>;
  generatePersonalizedNotification(_request: AINotificationRequest): Promise<AIGeneratedContent>;
  calculateIntelligentPriority(_context: Record<string, unknown>,
    userProfile: UserContext
  ): Promise<IntelligentPrioritizationResult>;
}

export class SmartNotificationService {
  private readonly aiService: AIInsightService;
  private readonly userService: UserContextService;
  private readonly templateService: TemplateService;
  private readonly deliveryService: DeliveryService;
  private readonly analyticsService: AnalyticsService;
  private readonly cacheService: CacheService;
  private readonly eventService: EventService;

  private readonly notificationQueue: Map<string, SmartNotification[]> = new Map();
  private readonly suppressionCache: Map<string, Date> = new Map();
  private readonly deliveryMetrics: Map<string, NotificationAnalytics> = new Map();

  constructor(
    aiService: AIInsightService,
    userService: UserContextService,
    templateService: TemplateService,
    deliveryService: DeliveryService,
    analyticsService: AnalyticsService,
    cacheService: CacheService,
    eventService: EventService
  ) {
    this.aiService = aiService;
    this.userService = userService;
    this.templateService = templateService;
    this.deliveryService = deliveryService;
    this.analyticsService = analyticsService;
    this.cacheService = cacheService;
    this.eventService = eventService;
  }

  /**
   * Generate intelligent risk alerts with AI insights
   */
  async generateRiskAlerts(_risks: Risk[]): Promise<SmartNotification[]> {
    try {
      const notifications: SmartNotification[] = [];

      for (const risk of risks) {
        // Analyze risk for alert-worthy conditions
        const riskAnalysis = await this.aiService.analyzeRiskForAlert(risk);

        if (!riskAnalysis.requiresAlert) continue;

        // Get affected users
        const affectedUsers = await this.getUsersForRisk(risk);

        for (const userId of affectedUsers) {
          const userContext = await this.userService.getUserContext(userId);
          const contextualData = await this.buildContextualData(userId, userContext);

          // Generate AI insight for this specific risk and user
          const aiInsight = await this.aiService.generateRiskInsight(
            risk,
            userContext,
            riskAnalysis
          );

          // Calculate intelligent priority
          const intelligentPriority = await this.calculateIntelligentPriority(
            risk,
            userContext,
            riskAnalysis,
            'risk_alert'
          );

          // Generate personalized content
          const personalizedContent = await this.generatePersonalizedContent(
            'risk_alert',
            risk,
            userContext,
            aiInsight
          );

          // Create action items
          const actionItems = await this.generateRiskActionItems(risk, riskAnalysis, userContext);

          const notification: SmartNotification = {
            id: generateId('smart-notification'),
            type: 'risk_alert',
            title: personalizedContent.title,
            message: personalizedContent.summary,
            priority: intelligentPriority.calculated,
            userId,
            timestamp: new Date(),
            read: false,
            aiInsight: aiInsight.insight,
            contextualData,
            intelligentPriority,
            dismissible: true,
            autoExpire: true,
            expiresAt: this.calculateExpirationDate('risk_alert', intelligentPriority.calculated),
            suppressionRules: await this.getSuppressionRules(userId, 'risk_alert'),
            deliveryChannels: await this.getDeliveryChannels(
              userId,
              intelligentPriority.calculated
            ),
            personalizedContent,
            aggregatedWith: [],
            metadata: {
              riskId: risk.id,
              riskCategory: risk.category,
              analysisId: riskAnalysis.id,
              generatedAt: new Date(),
              actionItems,
            },
          };

          notifications.push(notification);
        }
      }

      // Process aggregation for related notifications
      const aggregatedNotifications = await this.processNotificationAggregation(notifications);

      return aggregatedNotifications;
    } catch (error) {
      // console.error('Error generating risk alerts:', error);
      throw new Error('Failed to generate risk alerts');
    }
  }

  /**
   * Create intelligent control reminders
   */
  async createControlReminders(controls: Control[]): Promise<SmartNotification[]> {
    try {
      const notifications: SmartNotification[] = [];

      for (const control of controls) {
        // Check if control needs attention (testing due, effectiveness declining, etc.)
        const controlAnalysis = await this.aiService.analyzeControlForReminder(control);

        if (!controlAnalysis.requiresReminder) continue;

        // Get responsible users
        const responsibleUsers = await this.getUsersForControl(control);

        for (const userId of responsibleUsers) {
          const userContext = await this.userService.getUserContext(userId);
          const contextualData = await this.buildContextualData(userId, userContext);

          // Generate AI insight
          const aiInsight = await this.aiService.generateControlInsight(
            control,
            userContext,
            controlAnalysis
          );

          // Calculate priority
          const intelligentPriority = await this.calculateIntelligentPriority(
            control,
            userContext,
            controlAnalysis,
            'control_reminder'
          );

          // Generate content
          const personalizedContent = await this.generatePersonalizedContent(
            'control_reminder',
            control,
            userContext,
            aiInsight
          );

          // Create action items
          const actionItems = await this.generateControlActionItems(
            control,
            controlAnalysis,
            userContext
          );

          const notification: SmartNotification = {
            id: generateId('smart-notification'),
            type: 'control_reminder',
            title: personalizedContent.title,
            message: personalizedContent.summary,
            priority: intelligentPriority.calculated,
            userId,
            timestamp: new Date(),
            read: false,
            aiInsight: aiInsight.insight,
            contextualData,
            intelligentPriority,
            dismissible: true,
            autoExpire: true,
            expiresAt: this.calculateExpirationDate(
              'control_reminder',
              intelligentPriority.calculated
            ),
            suppressionRules: await this.getSuppressionRules(userId, 'control_reminder'),
            deliveryChannels: await this.getDeliveryChannels(
              userId,
              intelligentPriority.calculated
            ),
            personalizedContent,
            aggregatedWith: [],
            metadata: {
              controlId: control.id,
              analysisId: controlAnalysis.id,
              actionItems,
              generatedAt: new Date(),
            },
          };

          notifications.push(notification);
        }
      }

      return notifications;
    } catch (error) {
      // console.error('Error creating control reminders:', error);
      throw new Error('Failed to create control reminders');
    }
  }

  /**
   * Identify compliance gaps and generate alerts
   */
  async identifyComplianceGaps(
    requirements: ComplianceRequirement[]
  ): Promise<SmartNotification[]> {
    try {
      const notifications: SmartNotification[] = [];

      for (const requirement of requirements) {
        // Analyze compliance status
        const complianceAnalysis = await this.aiService.analyzeComplianceRequirement(requirement);

        if (complianceAnalysis.status === 'compliant') continue;

        // Get relevant users based on requirement scope
        const relevantUsers = await this.getUsersForComplianceRequirement(requirement);

        for (const userId of relevantUsers) {
          const userContext = await this.userService.getUserContext(userId);
          const contextualData = await this.buildContextualData(userId, userContext);

          // Generate AI insight
          const aiInsight = await this.aiService.generateComplianceInsight(
            requirement,
            userContext,
            complianceAnalysis
          );

          // Calculate priority (compliance gaps are typically high priority)
          const intelligentPriority = await this.calculateIntelligentPriority(
            requirement,
            userContext,
            complianceAnalysis,
            'compliance_gap'
          );

          // Generate content
          const personalizedContent = await this.generatePersonalizedContent(
            'compliance_gap',
            requirement,
            userContext,
            aiInsight
          );

          // Create action items
          const actionItems = await this.generateComplianceActionItems(
            requirement,
            complianceAnalysis,
            userContext
          );

          const notification: SmartNotification = {
            id: generateId('smart-notification'),
            type: 'compliance_alert',
            title: personalizedContent.title,
            message: personalizedContent.summary,
            priority: intelligentPriority.calculated,
            userId,
            timestamp: new Date(),
            read: false,
            aiInsight: aiInsight.insight,
            contextualData,
            intelligentPriority,
            dismissible: false, // Compliance gaps are typically non-dismissible
            autoExpire: false,
            suppressionRules: [], // No suppression for compliance
            deliveryChannels: await this.getDeliveryChannels(
              userId,
              intelligentPriority.calculated
            ),
            personalizedContent,
            aggregatedWith: [],
            metadata: {
              requirementId: requirement.id,
              complianceStatus: complianceAnalysis.status,
              gapSeverity: complianceAnalysis.gap?.severity,
              deadline: requirement.deadline,
              actionItems,
              generatedAt: new Date(),
            },
          };

          notifications.push(notification);
        }
      }

      return notifications;
    } catch (error) {
      // console.error('Error identifying compliance gaps:', error);
      throw new Error('Failed to identify compliance gaps');
    }
  }

  /**
   * Suggest workflow improvements based on user activity
   */
  async suggestWorkflowImprovements(userActivity: UserActivity[]): Promise<SmartNotification[]> {
    try {
      const notifications: SmartNotification[] = [];

      // Group activities by user
      const userActivities = this.groupActivitiesByUser(userActivity);

      for (const [userId, activities] of userActivities.entries()) {
        // Analyze workflow patterns
        const workflowAnalysis = await this.aiService.analyzeWorkflowEfficiency(activities);

        if (!workflowAnalysis.hasImprovementOpportunity) continue;

        const userContext = await this.userService.getUserContext(userId);
        const contextualData = await this.buildContextualData(userId, userContext);

        // Generate AI insight
        const aiInsight = await this.aiService.generateWorkflowInsight(
          activities,
          userContext,
          workflowAnalysis
        );

        // Calculate priority
        const intelligentPriority = await this.calculateIntelligentPriority(
          activities,
          userContext,
          workflowAnalysis,
          'workflow_improvement'
        );

        // Generate content
        const personalizedContent = await this.generatePersonalizedContent(
          'workflow_improvement',
          activities,
          userContext,
          aiInsight
        );

        // Create action items
        const actionItems = await this.generateWorkflowActionItems(workflowAnalysis, userContext);

        const notification: SmartNotification = {
          id: generateId('smart-notification'),
          type: 'workflow_suggestion',
          title: personalizedContent.title,
          message: personalizedContent.summary,
          priority: intelligentPriority.calculated,
          userId,
          timestamp: new Date(),
          read: false,
          aiInsight: aiInsight.insight,
          contextualData,
          intelligentPriority,
          dismissible: true,
          autoExpire: true,
          expiresAt: this.calculateExpirationDate(
            'workflow_suggestion',
            intelligentPriority.calculated
          ),
          suppressionRules: await this.getSuppressionRules(userId, 'workflow_suggestion'),
          deliveryChannels: await this.getDeliveryChannels(userId, intelligentPriority.calculated),
          personalizedContent,
          aggregatedWith: [],
          metadata: {
            activityCount: activities.length,
            improvementType: workflowAnalysis.improvementType,
            potentialTimeSavings: workflowAnalysis.potentialTimeSavings,
            actionItems,
            generatedAt: new Date(),
          },
        };

        notifications.push(notification);
      }

      return notifications;
    } catch (error) {
      // console.error('Error suggesting workflow improvements:', error);
      throw new Error('Failed to suggest workflow improvements');
    }
  }

  /**
   * Send notification through appropriate channels
   */
  async sendNotification(notification: SmartNotification): Promise<DeliveryResult[]> {
    try {
      const results: DeliveryResult[] = [];

      // Check suppression rules
      if (await this.isNotificationSuppressed(notification)) {
        return [
          {
            notificationId: notification.id,
            channel: 'none' as NotificationChannel,
            status: 'suppressed',
            timestamp: new Date(),
            metadata: { reason: 'suppression_rule_matched' },
          },
        ];
      }

      // Process delivery through each configured channel
      for (const channelConfig of notification.deliveryChannels) {
        if (!channelConfig.enabled) continue;

        try {
          // Apply delay if configured
          if (channelConfig.delay > 0) {
            await this.delay(channelConfig.delay * 1000);
          }

          // Deliver notification
          const deliveryResult = await this.deliverToChannel(notification, channelConfig);
          results.push(deliveryResult);

          // Track delivery metrics
          await this.trackDeliveryMetrics(notification, channelConfig, deliveryResult);

          // Handle escalation if needed
          if (channelConfig.escalation?.enabled && deliveryResult.status === 'failed') {
            await this.handleEscalation(notification, channelConfig.escalation);
          }
        } catch (error) {
          // console.error(`Error delivering to ${channelConfig.channel}:`, error);
          results.push({
            notificationId: notification.id,
            channel: channelConfig.channel,
            status: 'failed',
            timestamp: new Date(),
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Update notification status
      await this.updateNotificationStatus(notification, results);

      // Emit delivery event
      await this.eventService.emit('notification:delivered', {
        notificationId: notification.id,
        userId: notification.userId,
        channels: results.map((r) => r.channel),
        timestamp: new Date(),
      });

      return results;
    } catch (error) {
      // console.error('Error sending notification:', error);
      throw new Error('Failed to send notification');
    }
  }

  /**
   * Process notification queue for batching
   */
  async processNotificationQueue(_userId: string): Promise<void> {
    try {
      const userQueue = this.notificationQueue.get(userId) || [];
      if (userQueue.length === 0) return;

      const userPreferences = await this.getUserPreferences(userId);

      // Check if batching is enabled
      if (userPreferences.notificationFrequency === 'batched') {
        await this.processBatchedNotifications(userId, userQueue);
      } else if (userPreferences.notificationFrequency === 'digest') {
        await this.processDigestNotifications(userId, userQueue);
      } else {
        // Send immediately
        for (const notification of userQueue) {
          await this.sendNotification(notification);
        }
      }

      // Clear processed queue
      this.notificationQueue.delete(userId);
    } catch (error) {
      // console.error(`Error processing notification queue for user ${userId}:`, error);
    }
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(_userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<void> {
    try {
      const currentPreferences = await this.getUserPreferences(userId);
      const updatedPreferences = { ...currentPreferences, ...preferences };

      await this.cacheService.set(`user_preferences:${userId}`, updatedPreferences);

      // Emit preferences updated event
      await this.eventService.emit('notification:preferences_updated', {
        userId,
        preferences: updatedPreferences,
        timestamp: new Date(),
      });
    } catch (error) {
      // console.error('Error updating notification preferences:', error);
      throw new Error('Failed to update notification preferences');
    }
  }

  /**
   * Get notification analytics for a user
   */
  async getNotificationAnalytics(_userId: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<NotificationAnalytics[]> {
    try {
      return await this.analyticsService.getNotificationAnalytics(userId, timeRange);
    } catch (error) {
      // console.error('Error getting notification analytics:', error);
      throw new Error('Failed to get notification analytics');
    }
  }

  // Private helper methods

  private async buildContextualData(_userId: string,
    userContext: UserContext
  ): Promise<ContextualData> {
    const preferences = await this.getUserPreferences(userId);
    const workingHours = await this.getWorkingHours(userId);
    const currentActivity = await this.getCurrentActivity(userId);
    const relevantEntities = await this.getRelevantEntities(userId, userContext);
    const historicalContext = await this.getHistoricalContext(userId);

    return {
      userRole: userContext.role,
      userPreferences: preferences,
      workingHours: workingHours as any, // Type assertion needed for service integration
      currentActivity,
      relevantEntities,
      historicalContext: historicalContext as any, // Type assertion needed for service integration
    };
  }

  private async calculateIntelligentPriority(
    _entity: unknown,
    userContext: UserContext,
    analysis: unknown,
    notificationType: string
  ): Promise<IntelligentPriority> {
    // Use AI to calculate intelligent priority based on multiple factors
    const priorityAnalysis = await this.aiService.calculatePriority(
      entity,
      userContext,
      analysis,
      notificationType
    );

    return {
      calculated: priorityAnalysis.priority,
      factors: priorityAnalysis.factors as any, // Type assertion needed for service integration
      urgencyScore: priorityAnalysis.urgencyScore,
      relevanceScore: priorityAnalysis.relevanceScore,
      impactScore: priorityAnalysis.impactScore,
      contextScore: priorityAnalysis.contextScore,
      personalizedScore: priorityAnalysis.personalizedScore,
    };
  }

  private async generatePersonalizedContent(
    notificationType: string,
    entity: unknown,
    userContext: UserContext,
    aiInsight: unknown
  ): Promise<PersonalizedContent> {
    const template = await this.templateService.getTemplate(
      notificationType,
      userContext.preferences.language
    );

    return await this.aiService.generatePersonalizedContent(
      template,
      entity,
      userContext,
      aiInsight
    );
  }

  private async generateRiskActionItems(_risk: Risk,
    analysis: unknown,
    userContext: UserContext
  ): Promise<ActionItem[]> {
    return await this.aiService.generateActionItems('risk', risk, analysis, userContext);
  }

  private async generateControlActionItems(
    control: Control,
    analysis: unknown,
    userContext: UserContext
  ): Promise<ActionItem[]> {
    return await this.aiService.generateActionItems('control', control, analysis, userContext);
  }

  private async generateComplianceActionItems(
    requirement: ComplianceRequirement,
    analysis: unknown,
    userContext: UserContext
  ): Promise<ActionItem[]> {
    return await this.aiService.generateActionItems(
      'compliance',
      requirement,
      analysis,
      userContext
    );
  }

  private async generateWorkflowActionItems(
    analysis: unknown,
    userContext: UserContext
  ): Promise<ActionItem[]> {
    return await this.aiService.generateActionItems('workflow', null, analysis, userContext);
  }

  private calculateExpirationDate(notificationType: string, priority: InsightPriority): Date {
    const now = new Date();
    const expirationHours = this.getExpirationHours(notificationType, priority);

    return new Date(now.getTime() + expirationHours * 60 * 60 * 1000);
  }

  private getExpirationHours(notificationType: string, priority: InsightPriority): number {
    const expirationMap: Record<string, Record<InsightPriority, number>> = {
      risk_alert: { critical: 24, high: 48, medium: 72, low: 168, info: 168 },
      control_reminder: { critical: 12, high: 24, medium: 48, low: 168, info: 168 },
      compliance_gap: { critical: 6, high: 12, medium: 24, low: 48, info: 48 },
      workflow_suggestion: { critical: 168, high: 168, medium: 336, low: 672, info: 672 },
    };

    return expirationMap[notificationType]?.[priority] || 72;
  }

  private async processNotificationAggregation(
    notifications: SmartNotification[]
  ): Promise<SmartNotification[]> {
    // Group related notifications and aggregate them
    const grouped = this.groupRelatedNotifications(notifications);
    const aggregated: SmartNotification[] = [];

    for (const group of grouped) {
      if (group.length === 1) {
        aggregated.push(group[0]);
      } else {
        // Create aggregated notification
        const primaryNotification = group[0];
        const relatedIds = group.slice(1).map((n) => n.id);

        primaryNotification.aggregatedWith = relatedIds;
        primaryNotification.personalizedContent.title = `${group.length} Related Alerts`;
        primaryNotification.personalizedContent.summary = `Multiple items require your attention`;

        aggregated.push(primaryNotification);
      }
    }

    return aggregated;
  }

  private groupRelatedNotifications(notifications: SmartNotification[]): SmartNotification[][] {
    // Simple grouping by user and type for now
    const groups = new Map<string, SmartNotification[]>();

    for (const notification of notifications) {
      const key = `${notification.userId}-${notification.type}`;
      const group = groups.get(key) || [];
      group.push(notification);
      groups.set(key, group);
    }

    return Array.from(groups.values());
  }

  private groupActivitiesByUser(activities: UserActivity[]): Map<string, UserActivity[]> {
    const grouped = new Map<string, UserActivity[]>();

    for (const activity of activities) {
      const userActivities = grouped.get(activity.userId) || [];
      userActivities.push(activity);
      grouped.set(activity.userId, userActivities);
    }

    return grouped;
  }

  private async isNotificationSuppressed(notification: SmartNotification): Promise<boolean> {
    const suppressionKey = `${notification.userId}-${notification.type}`;
    const suppressedUntil = this.suppressionCache.get(suppressionKey);

    if (suppressedUntil && suppressedUntil > new Date()) {
      return true;
    }

    // Check dynamic suppression rules
    for (const rule of notification.suppressionRules) {
      if (rule.enabled && (await this.evaluateSuppressionRule(rule, notification))) {
        return true;
      }
    }

    return false;
  }

  private async evaluateSuppressionRule(
    rule: SuppressionRule,
    notification: SmartNotification
  ): Promise<boolean> {
    // Evaluate suppression rule condition
    return await this.aiService.evaluateCondition(rule.condition, notification);
  }

  private async deliverToChannel(
    notification: SmartNotification,
    channelConfig: DeliveryChannel
  ): Promise<DeliveryResult> {
    return await this.deliveryService.deliver(notification, channelConfig);
  }

  private async handleEscalation(
    notification: SmartNotification,
    escalation: EscalationRule
  ): Promise<void> {
    // Implement escalation logic
    await this.deliveryService.escalate(notification, escalation);
  }

  private async trackDeliveryMetrics(
    notification: SmartNotification,
    channel: DeliveryChannel,
    result: DeliveryResult
  ): Promise<void> {
    const analytics: NotificationAnalytics = {
      notificationId: notification.id,
      userId: notification.userId,
      metrics: {
        deliveryTime: Date.now() - notification.timestamp.getTime(),
        effectiveness: result.status === 'sent' ? 100 : 0,
      },
      interactions: {
        viewed: false,
        dismissed: false,
        acted: false,
        escalated: false,
      },
    };

    this.deliveryMetrics.set(notification.id, analytics);
    await this.analyticsService.recordDeliveryMetrics(analytics);
  }

  private async updateNotificationStatus(
    notification: SmartNotification,
    results: DeliveryResult[]
  ): Promise<void> {
    const successfulDeliveries = results.filter((r) => r.status === 'sent');

    if (successfulDeliveries.length > 0) {
      await this.cacheService.set(`notification:${notification.id}`, {
        ...notification,
        deliveryStatus: 'delivered',
        deliveredAt: new Date(),
      });
    }
  }

  private async processBatchedNotifications(_userId: string,
    notifications: SmartNotification[]
  ): Promise<void> {
    // Group notifications by priority and send in batches
    const batches = this.createNotificationBatches(notifications);

    for (const batch of batches) {
      const batchNotification = await this.createBatchNotification(userId, batch);
      await this.sendNotification(batchNotification);
    }
  }

  private async processDigestNotifications(_userId: string,
    notifications: SmartNotification[]
  ): Promise<void> {
    // Create daily digest
    const digestNotification = await this.createDigestNotification(userId, notifications);
    await this.sendNotification(digestNotification);
  }

  private createNotificationBatches(notifications: SmartNotification[]): SmartNotification[][] {
    // Simple batching by priority
    const critical = notifications.filter((n) => n.priority === 'critical');
    const high = notifications.filter((n) => n.priority === 'high');
    const medium = notifications.filter((n) => n.priority === 'medium');
    const low = notifications.filter((n) => n.priority === 'low' || n.priority === 'info');

    const batches: SmartNotification[][] = [];
    if (critical.length > 0) batches.push(critical);
    if (high.length > 0) batches.push(high);
    if (medium.length > 0) batches.push(medium);
    if (low.length > 0) batches.push(low);

    return batches;
  }

  private async createBatchNotification(_userId: string,
    batch: SmartNotification[]
  ): Promise<SmartNotification> {
    const userContext = await this.userService.getUserContext(userId);
    const contextualData = await this.buildContextualData(userId, userContext);

    return {
      id: generateId('smart-notification'),
      type: 'batch_notification',
      title: `${batch.length} Items Require Attention`,
      message: `You have ${batch.length} notifications grouped by priority`,
      priority: batch[0].priority,
      userId,
      timestamp: new Date(),
      read: false,
      aiInsight: `Batched ${batch.length} notifications to reduce interruptions`,
      contextualData,
      intelligentPriority: {
        calculated: batch[0].priority,
        factors: [],
        urgencyScore: 50,
        relevanceScore: 70,
        impactScore: 60,
        contextScore: 80,
        personalizedScore: 75,
      },
      dismissible: true,
      autoExpire: true,
      expiresAt: this.calculateExpirationDate('batch_notification', batch[0].priority),
      suppressionRules: [],
      deliveryChannels: await this.getDeliveryChannels(userId, batch[0].priority),
      personalizedContent: {
        title: `${batch.length} Items Require Attention`,
        summary: `You have ${batch.length} notifications`,
        details: batch.map((n) => n.personalizedContent.summary).join('\n'),
        recommendations: [],
        tone: 'professional',
        complexity: 'simple',
      },
      aggregatedWith: batch.map((n) => n.id),
      metadata: {
        batchSize: batch.length,
        batchType: 'priority',
        originalNotifications: batch.map((n) => n.id),
      },
    };
  }

  private async createDigestNotification(_userId: string,
    notifications: SmartNotification[]
  ): Promise<SmartNotification> {
    const userContext = await this.userService.getUserContext(userId);
    const contextualData = await this.buildContextualData(userId, userContext);

    // Calculate digest priority based on highest priority notification
    const highestPriority = notifications.reduce((highest, current) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
      return priorityOrder[current.priority] > priorityOrder[highest] ? current.priority : highest;
    }, 'info' as InsightPriority);

    return {
      id: generateId('smart-notification'),
      type: 'digest_notification',
      title: 'Daily Risk Management Digest',
      message: `Your daily summary with ${notifications.length} items`,
      priority: highestPriority,
      userId,
      timestamp: new Date(),
      read: false,
      aiInsight: `Daily digest summarizing ${notifications.length} notifications and activities`,
      contextualData,
      intelligentPriority: {
        calculated: highestPriority,
        factors: [],
        urgencyScore: 30,
        relevanceScore: 80,
        impactScore: 50,
        contextScore: 90,
        personalizedScore: 85,
      },
      dismissible: true,
      autoExpire: true,
      expiresAt: this.calculateExpirationDate('digest_notification', highestPriority),
      suppressionRules: [],
      deliveryChannels: await this.getDeliveryChannels(userId, highestPriority),
      personalizedContent: {
        title: 'Daily Risk Management Digest',
        summary: `Your daily summary with ${notifications.length} items`,
        details: this.createDigestContent(notifications),
        recommendations: [],
        tone: 'professional',
        complexity: 'detailed',
      },
      aggregatedWith: notifications.map((n) => n.id),
      metadata: {
        digestDate: new Date().toISOString().split('T')[0],
        notificationCount: notifications.length,
        categories: this.getDigestCategories(notifications),
      },
    };
  }

  private createDigestContent(notifications: SmartNotification[]): string {
    const sections = [
      "📊 Today's Summary:",
      `• ${notifications.length} total notifications`,
      `• ${notifications.filter((n) => n.priority === 'critical' || n.priority === 'high').length} high priority items`,
      '',
      '🔍 Key Items:',
    ];

    // Add top 5 most important notifications
    const topNotifications = notifications
      .sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, 5);

    for (const notification of topNotifications) {
      sections.push(`• ${notification.title}`);
    }

    return sections.join('\n');
  }

  private getDigestCategories(notifications: SmartNotification[]): string[] {
    const _categories = new Set<string>();

    for (const notification of notifications) {
      categories.add(notification.type);
    }

    return Array.from(categories);
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Service integration helper methods
  private async getUsersForRisk(_risk: Risk): Promise<string[]> {
    return await this.userService.getUsersForEntity('risk', risk.id);
  }

  private async getUsersForControl(control: Control): Promise<string[]> {
    return await this.userService.getUsersForEntity('control', control.id);
  }

  private async getUsersForComplianceRequirement(
    requirement: ComplianceRequirement
  ): Promise<string[]> {
    return await this.userService.getUsersForEntity('compliance', requirement.id);
  }

  private async getUserPreferences(_userId: string): Promise<UserPreferences> {
    const _cached = await this.cacheService.get(`user_preferences:${userId}`);
    if (cached) return cached as UserPreferences;

    return await this.userService.getUserPreferences(userId);
  }

  private async getWorkingHours(_userId: string): Promise<unknown> {
    // Mock implementation
    return {
      start: '09:00',
      end: '17:00',
      timezone: 'UTC',
    };
  }

  private async getCurrentActivity(_userId: string): Promise<string> {
    // Mock implementation
    return 'reviewing_risks';
  }

  private async getRelevantEntities(_userId: string, userContext: UserContext): Promise<string[]> {
    // Mock implementation
    return ['entity1', 'entity2'];
  }

  private async getHistoricalContext(_userId: string): Promise<unknown> {
    // Mock implementation
    return {
      recentActions: [],
      preferences: {},
    };
  }

  private async getSuppressionRules(_userId: string,
    notificationType: string
  ): Promise<SuppressionRule[]> {
    return await this.userService.getSuppressionRules(userId, notificationType);
  }

  private async getDeliveryChannels(_userId: string,
    priority: InsightPriority
  ): Promise<DeliveryChannel[]> {
    return await this.userService.getDeliveryChannels(userId, priority);
  }
}

// Service interfaces
interface AIInsightService {
  analyzeRiskForAlert(_risk: Risk
  ): Promise<{ requiresAlert: boolean; id: string; severity: string }>;
  analyzeControlForReminder(
    control: Control
  ): Promise<{ requiresReminder: boolean; id: string; type: string }>;
  analyzeComplianceRequirement(
    requirement: ComplianceRequirement
  ): Promise<{ status: string; gap?: { severity: string } }>;
  analyzeWorkflowEfficiency(activities: UserActivity[]): Promise<{
    hasImprovementOpportunity: boolean;
    improvementType: string;
    potentialTimeSavings: number;
  }>;
  generateRiskInsight(_risk: Risk,
    context: UserContext,
    analysis: unknown
  ): Promise<{ insight: string }>;
  generateControlInsight(
    control: Control,
    context: UserContext,
    analysis: unknown
  ): Promise<{ insight: string }>;
  generateComplianceInsight(
    requirement: ComplianceRequirement,
    context: UserContext,
    analysis: unknown
  ): Promise<{ insight: string }>;
  generateWorkflowInsight(
    activities: UserActivity[],
    context: UserContext,
    analysis: unknown
  ): Promise<{ insight: string }>;
  calculatePriority(
    _entity: unknown,
    context: UserContext,
    analysis: unknown,
    type: string
  ): Promise<{
    priority: InsightPriority;
    factors: unknown[];
    urgencyScore: number;
    relevanceScore: number;
    impactScore: number;
    contextScore: number;
    personalizedScore: number;
  }>;
  generatePersonalizedContent(
    template: unknown,
    entity: unknown,
    context: UserContext,
    insight: unknown
  ): Promise<PersonalizedContent>;
  generateActionItems(
    _type: string,
    entity: unknown,
    analysis: unknown,
    context: UserContext
  ): Promise<ActionItem[]>;
  evaluateCondition(condition: string, notification: SmartNotification): Promise<boolean>;
}

interface UserContextService {
  getUserContext(_userId: string): Promise<UserContext>;
  getUsersForEntity(_entityType: string, entityId: string): Promise<string[]>;
  getUserPreferences(_userId: string): Promise<UserPreferences>;
  getWorkingHours(_userId: string): Promise<unknown>;
  getCurrentActivity(_userId: string): Promise<string>;
  getRelevantEntities(_userId: string, context: UserContext): Promise<string[]>;
  getHistoricalContext(_userId: string): Promise<unknown>;
  getSuppressionRules(_userId: string, type: string): Promise<SuppressionRule[]>;
  getDeliveryChannels(_userId: string, priority: InsightPriority): Promise<DeliveryChannel[]>;
}

interface TemplateService {
  getTemplate(_type: string, language: string): Promise<NotificationTemplate>;
}

interface DeliveryService {
  deliver(notification: SmartNotification, channel: DeliveryChannel): Promise<DeliveryResult>;
  escalate(notification: SmartNotification, escalation: EscalationRule): Promise<void>;
}

interface AnalyticsService {
  getNotificationAnalytics(_userId: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<NotificationAnalytics[]>;
  recordDeliveryMetrics(analytics: NotificationAnalytics): Promise<void>;
}

interface CacheService {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
}

interface EventService {
  emit(event: string, data: unknown): Promise<void>;
}
