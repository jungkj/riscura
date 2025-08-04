// import { AgentType } from '@/types/ai.types'

// Interfaces for token management
export interface TokenUsage {
  promptTokens: number
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

export interface ConversationUsage {
  conversationId: string;
  agentType: AgentType;
  totalTokens: number;
  totalCost: number;
  messageCount: number;
  startTime: Date;
  lastActivity: Date;
  userId: string;
}

export interface UserUsage {
  userId: string;
  dailyTokens: number;
  weeklyTokens: number;
  monthlyTokens: number;
  dailyCost: number;
  weeklyCost: number;
  monthlyCost: number;
  conversationCount: number;
  lastReset: Date;
  tier: PricingTier;
}

export interface UsageQuota {
  dailyTokenLimit: number;
  weeklyTokenLimit: number;
  monthlyTokenLimit: number;
  dailyCostLimit: number;
  weeklyCostLimit: number;
  monthlyCostLimit: number;
  conversationLimit: number;
}

export interface PricingTier {
  id: string;
  name: string;
  description: string;
  quotas: UsageQuota;
  features: string[];
  monthlyPrice: number;
}

export interface ModelPricing {
  inputCostPer1k: number;
  outputCostPer1k: number;
  name: string;
  provider: 'openai' | 'anthropic' | 'google';
}

export interface UsageAlert {
  id: string;
  type: 'quota_warning' | 'quota_exceeded' | 'cost_threshold' | 'unusual_usage';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  threshold: number;
  currentUsage: number;
  timestamp: Date;
  userId: string;
  acknowledged: boolean;
}

export interface UsageReport {
  period: 'daily' | 'weekly' | 'monthly' | 'custom';
  startDate: Date;
  endDate: Date;
  userId: string;
  totalTokens: number;
  totalCost: number;
  conversationCount: number;
  agentBreakdown: Record<AgentType, { tokens: number; cost: number; count: number }>;
  modelBreakdown: Record<string, { tokens: number; cost: number; count: number }>;
  costTrend: { date: Date; cost: number; tokens: number }[];
  topConversations: ConversationUsage[];
}

export interface TokenTransaction {
  id: string;
  conversationId: string;
  userId: string;
  agentType: AgentType;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  timestamp: Date;
  messageId: string;
  duration: number;
}

// Pricing tiers configuration
export const PRICING_TIERS: Record<string, PricingTier> = {
  free: {
    id: 'free',
    name: 'Free Tier',
    description: 'Basic access with limited usage',
    quotas: {
      dailyTokenLimit: 10000,
      weeklyTokenLimit: 50000,
      monthlyTokenLimit: 200000,
      dailyCostLimit: 2.0,
      weeklyCostLimit: 10.0,
      monthlyCostLimit: 40.0,
      conversationLimit: 20,
    },
    features: ['Basic AI chat', 'Limited agents', 'Standard support'],
    monthlyPrice: 0,
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    description: 'Enhanced features for professionals',
    quotas: {
      dailyTokenLimit: 50000,
      weeklyTokenLimit: 300000,
      monthlyTokenLimit: 1200000,
      dailyCostLimit: 10.0,
      weeklyCostLimit: 60.0,
      monthlyCostLimit: 240.0,
      conversationLimit: 100,
    },
    features: ['All AI agents', 'Priority support', 'Usage analytics', 'Export reports'],
    monthlyPrice: 29.99,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Unlimited usage for large organizations',
    quotas: {
      dailyTokenLimit: 1000000,
      weeklyTokenLimit: 5000000,
      monthlyTokenLimit: 20000000,
      dailyCostLimit: 200.0,
      weeklyCostLimit: 1000.0,
      monthlyCostLimit: 4000.0,
      conversationLimit: 1000,
    },
    features: ['Unlimited usage', 'Custom agents', 'Dedicated support', 'API access', 'SSO'],
    monthlyPrice: 199.99,
  },
}

// Model pricing configuration (based on OpenAI pricing as of 2024)
export const MODEL_PRICING: Record<string, ModelPricing> = {
  'gpt-4o': {
    inputCostPer1k: 0.005,
    outputCostPer1k: 0.015,
    name: 'GPT-4o',
    provider: 'openai',
  },
  'gpt-4o-mini': {
    inputCostPer1k: 0.00015,
    outputCostPer1k: 0.0006,
    name: 'GPT-4o Mini',
    provider: 'openai',
  },
  'gpt-4-turbo': {
    inputCostPer1k: 0.01,
    outputCostPer1k: 0.03,
    name: 'GPT-4 Turbo',
    provider: 'openai',
  },
  'gpt-3.5-turbo': {
    inputCostPer1k: 0.0015,
    outputCostPer1k: 0.002,
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
  },
}

export class TokenManagementService {
  private userUsageCache: Map<string, UserUsage> = new Map();
  private conversationUsageCache: Map<string, ConversationUsage> = new Map();
  private tokenTransactions: TokenTransaction[] = [];
  private usageAlerts: UsageAlert[] = [];

  // Storage keys for persistence
  private readonly USER_USAGE_KEY = 'riscura_user_usage'
  private readonly CONVERSATION_USAGE_KEY = 'riscura_conversation_usage';
  private readonly TOKEN_TRANSACTIONS_KEY = 'riscura_token_transactions';
  private readonly USAGE_ALERTS_KEY = 'riscura_usage_alerts';

  constructor() {
    this.loadStoredData();
    this.startCleanupInterval();
  }

  /**
   * Calculate cost for token usage based on model
   */
  calculateCost(promptTokens: number, completionTokens: number, model: string): number {
    const pricing = MODEL_PRICING[model];
    if (!pricing) {
      // console.warn(`Unknown model pricing for: ${model}, using default`)
      // Default to gpt-4o-mini pricing
      const defaultPricing = MODEL_PRICING['gpt-4o-mini']
      const promptCost = (promptTokens / 1000) * defaultPricing.inputCostPer1k;
      const completionCost = (completionTokens / 1000) * defaultPricing.outputCostPer1k;
      return promptCost + completionCost;
    }

    const promptCost = (promptTokens / 1000) * pricing.inputCostPer1k;
    const completionCost = (completionTokens / 1000) * pricing.outputCostPer1k;
    return promptCost + completionCost;
  }

  /**
   * Track token usage for a conversation
   */
  async trackTokenUsage(
    conversationId: string,
    userId: string,
    agentType: AgentType,
    model: string,
    usage: TokenUsage,
    messageId: string,
    duration: number = 0
  ): Promise<void> {
    // Create transaction record
    const transaction: TokenTransaction = {
      id: this.generateId('txn'),
      conversationId,
      userId,
      agentType,
      model,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
      cost: usage.estimatedCost,
      timestamp: new Date(),
      messageId,
      duration,
    }

    this.tokenTransactions.push(transaction);

    // Update conversation usage
    await this.updateConversationUsage(conversationId, agentType, usage, userId)

    // Update user usage
    await this.updateUserUsage(userId, usage)

    // Check quotas and generate alerts
    await this.checkQuotasAndGenerateAlerts(userId)

    // Persist data
    this.persistData()
  }

  /**
   * Get user usage statistics
   */
  getUserUsage(_userId: string): UserUsage | null {
    return this.userUsageCache.get(userId) || null;
  }

  /**
   * Get conversation usage statistics
   */
  getConversationUsage(conversationId: string): ConversationUsage | null {
    return this.conversationUsageCache.get(conversationId) || null;
  }

  /**
   * Check if user can make a request (quota enforcement)
   */
  canMakeRequest(_userId: string,
    estimatedTokens: number = 1000
  ): {
    allowed: boolean;
    reason?: string;
    quotaStatus: {
      dailyUsed: number;
      dailyLimit: number;
      weeklyUsed: number;
      weeklyLimit: number;
      monthlyUsed: number;
      monthlyLimit: number;
    }
  } {
    const userUsage = this.getUserUsageOrCreate(userId);
    const quotas = userUsage.tier.quotas;

    const quotaStatus = {
      dailyUsed: userUsage.dailyTokens,
      dailyLimit: quotas.dailyTokenLimit,
      weeklyUsed: userUsage.weeklyTokens,
      weeklyLimit: quotas.weeklyTokenLimit,
      monthlyUsed: userUsage.monthlyTokens,
      monthlyLimit: quotas.monthlyTokenLimit,
    }

    // Check daily limit
    if (userUsage.dailyTokens + estimatedTokens > quotas.dailyTokenLimit) {
      return {
        allowed: false,
        reason: `Daily token limit exceeded (${quotas.dailyTokenLimit.toLocaleString()})`,
        quotaStatus,
      }
    }

    // Check weekly limit
    if (userUsage.weeklyTokens + estimatedTokens > quotas.weeklyTokenLimit) {
      return {
        allowed: false,
        reason: `Weekly token limit exceeded (${quotas.weeklyTokenLimit.toLocaleString()})`,
        quotaStatus,
      }
    }

    // Check monthly limit
    if (userUsage.monthlyTokens + estimatedTokens > quotas.monthlyTokenLimit) {
      return {
        allowed: false,
        reason: `Monthly token limit exceeded (${quotas.monthlyTokenLimit.toLocaleString()})`,
        quotaStatus,
      }
    }

    return { allowed: true, quotaStatus }
  }

  /**
   * Get active alerts for user
   */
  getActiveAlerts(_userId: string): UsageAlert[] {
    return this.usageAlerts.filter((alert) => alert.userId === userId && !alert.acknowledged);
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.usageAlerts.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.persistData();
    }
  }

  /**
   * Generate usage report
   */
  generateUsageReport(_userId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'custom',
    startDate?: Date,
    endDate?: Date
  ): UsageReport {
    const now = new Date();
    let reportStartDate: Date;
    const reportEndDate: Date = endDate || now;

    switch (period) {
      case 'daily':
        reportStartDate = new Date(now);
        reportStartDate.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        reportStartDate = new Date(now);
        reportStartDate.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        reportStartDate = new Date(now);
        reportStartDate.setMonth(now.getMonth() - 1);
        break;
      case 'custom':
        reportStartDate = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    // Filter transactions for the period
    const periodTransactions = this.tokenTransactions.filter(
      (txn) =>
        txn.userId === userId && txn.timestamp >= reportStartDate && txn.timestamp <= reportEndDate
    )

    // Calculate totals
    const totalTokens = periodTransactions.reduce((sum, txn) => sum + txn.totalTokens, 0)
    const totalCost = periodTransactions.reduce((sum, txn) => sum + txn.cost, 0);
    const conversationCount = new Set(periodTransactions.map((txn) => txn.conversationId)).size;

    // Agent breakdown
    const agentBreakdown: Record<AgentType, { tokens: number; cost: number; count: number }> =
      {} as Record<AgentType, { tokens: number; cost: number; count: number }>;
    const modelBreakdown: Record<string, { tokens: number; cost: number; count: number }> = {}

    periodTransactions.forEach((txn) => {
      // Agent breakdown
      if (!agentBreakdown[txn.agentType]) {
        agentBreakdown[txn.agentType] = { tokens: 0, cost: 0, count: 0 }
      }
      agentBreakdown[txn.agentType].tokens += txn.totalTokens;
      agentBreakdown[txn.agentType].cost += txn.cost;
      agentBreakdown[txn.agentType].count += 1;

      // Model breakdown
      if (!modelBreakdown[txn.model]) {
        modelBreakdown[txn.model] = { tokens: 0, cost: 0, count: 0 }
      }
      modelBreakdown[txn.model].tokens += txn.totalTokens;
      modelBreakdown[txn.model].cost += txn.cost;
      modelBreakdown[txn.model].count += 1;
    });

    // Cost trend (daily aggregation)
    const costTrend = this.calculateCostTrend(periodTransactions, reportStartDate, reportEndDate)

    // Top conversations
    const conversationUsageMap = new Map<string, { tokens: number; cost: number; count: number }>();
    periodTransactions.forEach((txn) => {
      const key = txn.conversationId;
      if (!conversationUsageMap.has(key)) {
        conversationUsageMap.set(key, { tokens: 0, cost: 0, count: 0 });
      }
      const usage = conversationUsageMap.get(key)!;
      usage.tokens += txn.totalTokens;
      usage.cost += txn.cost;
      usage.count += 1;
    });

    const topConversations = Array.from(this.conversationUsageCache.values())
      .filter((conv) => conv.userId === userId)
      .filter((conv) => conversationUsageMap.has(conv.conversationId))
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 10);

    return {
      period,
      startDate: reportStartDate,
      endDate: reportEndDate,
      userId,
      totalTokens,
      totalCost,
      conversationCount,
      agentBreakdown,
      modelBreakdown,
      costTrend,
      topConversations,
    }
  }

  /**
   * Get real-time usage stats for dashboard
   */
  getRealTimeStats(_userId: string): {
    currentSession: {
      tokens: number;
      cost: number;
      duration: number;
    }
    today: {
      tokens: number;
      cost: number;
      conversations: number;
    }
    quotaStatus: {
      daily: { used: number; limit: number; percentage: number }
      weekly: { used: number; limit: number; percentage: number }
      monthly: { used: number; limit: number; percentage: number }
    }
    costProjection: {
      dailyProjected: number;
      weeklyProjected: number;
      monthlyProjected: number;
    }
  } {
    const userUsage = this.getUserUsageOrCreate(userId);
    const quotas = userUsage.tier.quotas;

    // Current session stats (last hour)
    const _oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const sessionTransactions = this.tokenTransactions.filter(
      (txn) => txn.userId === userId && txn.timestamp >= oneHourAgo
    );

    const sessionTokens = sessionTransactions.reduce((sum, txn) => sum + txn.totalTokens, 0);
    const sessionCost = sessionTransactions.reduce((sum, txn) => sum + txn.cost, 0);
    const sessionDuration =
      sessionTransactions.length > 0 ? Date.now() - sessionTransactions[0].timestamp.getTime() : 0;

    // Today's stats
    const today = new Date()
    today.setHours(0, 0, 0, 0);
    const todayTransactions = this.tokenTransactions.filter(
      (txn) => txn.userId === userId && txn.timestamp >= today
    );

    const todayTokens = todayTransactions.reduce((sum, txn) => sum + txn.totalTokens, 0);
    const todayCost = todayTransactions.reduce((sum, txn) => sum + txn.cost, 0);
    const todayConversations = new Set(todayTransactions.map((txn) => txn.conversationId)).size;

    // Quota status
    const quotaStatus = {
      daily: {
        used: userUsage.dailyTokens,
        limit: quotas.dailyTokenLimit,
        percentage: (userUsage.dailyTokens / quotas.dailyTokenLimit) * 100,
      },
      weekly: {
        used: userUsage.weeklyTokens,
        limit: quotas.weeklyTokenLimit,
        percentage: (userUsage.weeklyTokens / quotas.weeklyTokenLimit) * 100,
      },
      monthly: {
        used: userUsage.monthlyTokens,
        limit: quotas.monthlyTokenLimit,
        percentage: (userUsage.monthlyTokens / quotas.monthlyTokenLimit) * 100,
      },
    }

    // Cost projections
    const hoursInDay = 24
    const daysInWeek = 7;
    const daysInMonth = 30;
    const currentHour = new Date().getHours();

    const hourlyRate = todayCost / Math.max(currentHour, 1);
    const dailyProjected = hourlyRate * hoursInDay;
    const weeklyProjected =
      (userUsage.weeklyCost / Math.max(1, this.getDaysInCurrentWeek())) * daysInWeek;
    const monthlyProjected =
      (userUsage.monthlyCost / Math.max(1, this.getDaysInCurrentMonth())) * daysInMonth;

    return {
      currentSession: {
        tokens: sessionTokens,
        cost: sessionCost,
        duration: sessionDuration,
      },
      today: {
        tokens: todayTokens,
        cost: todayCost,
        conversations: todayConversations,
      },
      quotaStatus,
      costProjection: {
        dailyProjected,
        weeklyProjected,
        monthlyProjected,
      },
    }
  }

  /**
   * Export usage data
   */
  exportUsageData(_userId: string,
    format: 'json' | 'csv',
    period: 'daily' | 'weekly' | 'monthly' | 'all' = 'monthly'
  ): string {
    const reportPeriod: 'daily' | 'weekly' | 'monthly' | 'custom' =
      period === 'all' ? 'monthly' : period;
    const report = this.generateUsageReport(userId, reportPeriod);

    if (format === 'json') {
      return JSON.stringify(report, null, 2);
    } else {
      return this.convertToCsv(report);
    }
  }

  /**
   * Reset user usage (for testing/admin purposes)
   */
  resetUserUsage(_userId: string): void {
    const userUsage = this.getUserUsageOrCreate(userId);
    userUsage.dailyTokens = 0;
    userUsage.weeklyTokens = 0;
    userUsage.monthlyTokens = 0;
    userUsage.dailyCost = 0;
    userUsage.weeklyCost = 0;
    userUsage.monthlyCost = 0;
    userUsage.conversationCount = 0;
    userUsage.lastReset = new Date();

    this.userUsageCache.set(userId, userUsage);
    this.persistData();
  }

  /**
   * Upgrade user tier
   */
  upgradeUserTier(_userId: string, tierName: string): boolean {
    const tier = PRICING_TIERS[tierName];
    if (!tier) {
      return false;
    }

    const userUsage = this.getUserUsageOrCreate(userId);
    userUsage.tier = tier;
    this.userUsageCache.set(userId, userUsage);
    this.persistData();

    return true;
  }

  // Private helper methods

  private getUserUsageOrCreate(_userId: string): UserUsage {
    let userUsage = this.userUsageCache.get(userId)

    if (!userUsage) {
      userUsage = {
        userId,
        dailyTokens: 0,
        weeklyTokens: 0,
        monthlyTokens: 0,
        dailyCost: 0,
        weeklyCost: 0,
        monthlyCost: 0,
        conversationCount: 0,
        lastReset: new Date(),
        tier: PRICING_TIERS.free,
      }
      this.userUsageCache.set(userId, userUsage);
    }

    // Reset counters if needed
    this.resetCountersIfNeeded(userUsage)

    return userUsage;
  }

  private async updateConversationUsage(
    conversationId: string,
    agentType: AgentType,
    usage: TokenUsage,
    userId: string
  ): Promise<void> {
    let convUsage = this.conversationUsageCache.get(conversationId);

    if (!convUsage) {
      convUsage = {
        conversationId,
        agentType,
        totalTokens: 0,
        totalCost: 0,
        messageCount: 0,
        startTime: new Date(),
        lastActivity: new Date(),
        userId,
      }
    }

    convUsage.totalTokens += usage.totalTokens;
    convUsage.totalCost += usage.estimatedCost;
    convUsage.messageCount += 1;
    convUsage.lastActivity = new Date();

    this.conversationUsageCache.set(conversationId, convUsage);
  }

  private async updateUserUsage(_userId: string, usage: TokenUsage): Promise<void> {
    const userUsage = this.getUserUsageOrCreate(userId);

    userUsage.dailyTokens += usage.totalTokens;
    userUsage.weeklyTokens += usage.totalTokens;
    userUsage.monthlyTokens += usage.totalTokens;
    userUsage.dailyCost += usage.estimatedCost;
    userUsage.weeklyCost += usage.estimatedCost;
    userUsage.monthlyCost += usage.estimatedCost;

    this.userUsageCache.set(userId, userUsage);
  }

  private async checkQuotasAndGenerateAlerts(_userId: string): Promise<void> {
    const userUsage = this.getUserUsageOrCreate(userId);
    const quotas = userUsage.tier.quotas;

    // Check daily quota
    if (userUsage.dailyTokens > quotas.dailyTokenLimit * 0.8) {
      this.generateAlert(
        userId,
        'quota_warning',
        'Daily token usage is at 80%',
        quotas.dailyTokenLimit * 0.8,
        userUsage.dailyTokens
      )
    }

    if (userUsage.dailyTokens > quotas.dailyTokenLimit) {
      this.generateAlert(
        userId,
        'quota_exceeded',
        'Daily token limit exceeded',
        quotas.dailyTokenLimit,
        userUsage.dailyTokens
      );
    }

    // Check weekly quota
    if (userUsage.weeklyTokens > quotas.weeklyTokenLimit * 0.8) {
      this.generateAlert(
        userId,
        'quota_warning',
        'Weekly token usage is at 80%',
        quotas.weeklyTokenLimit * 0.8,
        userUsage.weeklyTokens
      )
    }

    // Check cost thresholds
    if (userUsage.dailyCost > quotas.dailyCostLimit * 0.9) {
      this.generateAlert(
        userId,
        'cost_threshold',
        'Daily cost is approaching limit',
        quotas.dailyCostLimit * 0.9,
        userUsage.dailyCost
      )
    }
  }

  private generateAlert(_userId: string,
    type: UsageAlert['type'],
    message: string,
    threshold: number,
    currentUsage: number
  ): void {
    // Don't create duplicate alerts
    const existingAlert = this.usageAlerts.find(
      (alert) =>
        alert.userId === userId &&
        alert.type === type &&
        !alert.acknowledged &&
        alert.threshold === threshold
    )

    if (existingAlert) {
      return;
    }

    const severity =
      currentUsage > threshold * 1.1 ? 'critical' : currentUsage > threshold ? 'high' : 'medium';

    const alert: UsageAlert = {
      id: this.generateId('alert'),
      type,
      severity,
      message,
      threshold,
      currentUsage,
      timestamp: new Date(),
      userId,
      acknowledged: false,
    }

    this.usageAlerts.push(alert);
  }

  private resetCountersIfNeeded(userUsage: UserUsage): void {
    const now = new Date();
    const lastReset = userUsage.lastReset;

    // Reset daily counters
    if (!this.isSameDay(now, lastReset)) {
      userUsage.dailyTokens = 0
      userUsage.dailyCost = 0;
    }

    // Reset weekly counters
    if (!this.isSameWeek(now, lastReset)) {
      userUsage.weeklyTokens = 0
      userUsage.weeklyCost = 0;
    }

    // Reset monthly counters
    if (!this.isSameMonth(now, lastReset)) {
      userUsage.monthlyTokens = 0
      userUsage.monthlyCost = 0;
      userUsage.conversationCount = 0;
    }

    userUsage.lastReset = now;
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString();
  }

  private isSameWeek(date1: Date, date2: Date): boolean {
    const week1 = this.getWeekNumber(date1);
    const week2 = this.getWeekNumber(date2);
    return week1[1] === week2[1] && week1[0] === week2[0];
  }

  private isSameMonth(date1: Date, date2: Date): boolean {
    return date1.getMonth() === date2.getMonth() && date1.getFullYear() === date2.getFullYear();
  }

  private getWeekNumber(date: Date): [number, number] {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return [
      d.getUTCFullYear(),
      Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7),
    ];
  }

  private getDaysInCurrentWeek(): number {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    return Math.ceil((now.getTime() - startOfWeek.getTime()) / (1000 * 60 * 60 * 24));
  }

  private getDaysInCurrentMonth(): number {
    const now = new Date();
    return now.getDate();
  }

  private calculateCostTrend(
    transactions: TokenTransaction[],
    startDate: Date,
    endDate: Date
  ): { date: Date; cost: number; tokens: number }[] {
    const dailyAggregation = new Map<string, { cost: number; tokens: number }>();

    transactions.forEach((txn) => {
      const dateKey = txn.timestamp.toISOString().split('T')[0];
      if (!dailyAggregation.has(dateKey)) {
        dailyAggregation.set(dateKey, { cost: 0, tokens: 0 });
      }
      const day = dailyAggregation.get(dateKey)!;
      day.cost += txn.cost;
      day.tokens += txn.totalTokens;
    });

    return Array.from(dailyAggregation.entries())
      .map(([dateKey, data]) => ({
        date: new Date(dateKey),
        cost: data.cost,
        tokens: data.tokens,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private convertToCsv(report: UsageReport): string {
    const headers = [
      'Date',
      'Period',
      'Total Tokens',
      'Total Cost',
      'Conversation Count',
      'Agent Type',
      'Agent Tokens',
      'Agent Cost',
    ];

    const rows = [headers.join(',')];

    // Add summary row
    rows.push(
      [
        report.startDate.toISOString().split('T')[0],
        report.period,
        report.totalTokens.toString(),
        report.totalCost.toFixed(4),
        report.conversationCount.toString(),
        'TOTAL',
        report.totalTokens.toString(),
        report.totalCost.toFixed(4),
      ].join(',')
    )

    // Add agent breakdown
    Object.entries(report.agentBreakdown).forEach(([agent, data]) => {
      rows.push(
        [
          report.startDate.toISOString().split('T')[0],
          report.period,
          report.totalTokens.toString(),
          report.totalCost.toFixed(4),
          report.conversationCount.toString(),
          agent,
          data.tokens.toString(),
          data.cost.toFixed(4),
        ].join(',')
      )
    });

    return rows.join('\n');
  }

  private startCleanupInterval(): void {
    // Clean up old transactions and alerts every hour
    setInterval(
      () => {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

        // Keep only last 30 days of transactions
        this.tokenTransactions = this.tokenTransactions.filter(
          (txn) => txn.timestamp >= thirtyDaysAgo
        )

        // Remove acknowledged alerts older than 7 days
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        this.usageAlerts = this.usageAlerts.filter(
          (alert) => !alert.acknowledged || alert.timestamp >= sevenDaysAgo
        );

        this.persistData();
      },
      60 * 60 * 1000
    ); // Every hour
  }

  private loadStoredData(): void {
    try {
      // Only access localStorage in browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return
      }

      // Load user usage
      const userUsageData = localStorage.getItem(this.USER_USAGE_KEY)
      if (userUsageData) {
        const data = JSON.parse(userUsageData);
        Object.entries(data).forEach(([userId, usage]) => {
          const userUsage = usage as UserUsage;
          this.userUsageCache.set(userId, {
            ...userUsage,
            lastReset: new Date(userUsage.lastReset),
          });
        });
      }

      // Load conversation usage
      const conversationUsageData = localStorage.getItem(this.CONVERSATION_USAGE_KEY)
      if (conversationUsageData) {
        const data = JSON.parse(conversationUsageData);
        Object.entries(data).forEach(([conversationId, usage]) => {
          const conversationUsage = usage as ConversationUsage;
          this.conversationUsageCache.set(conversationId, {
            ...conversationUsage,
            startTime: new Date(conversationUsage.startTime),
            lastActivity: new Date(conversationUsage.lastActivity),
          });
        });
      }

      // Load token transactions
      const transactionsData = localStorage.getItem(this.TOKEN_TRANSACTIONS_KEY)
      if (transactionsData) {
        this.tokenTransactions = JSON.parse(transactionsData).map((txn: TokenTransaction) => ({
          ...txn,
          timestamp: new Date(txn.timestamp),
        }));
      }

      // Load usage alerts
      const alertsData = localStorage.getItem(this.USAGE_ALERTS_KEY)
      if (alertsData) {
        this.usageAlerts = JSON.parse(alertsData).map((_alert: UsageAlert) => ({
          ...alert,
          timestamp: new Date(alert.timestamp),
        }));
      }
    } catch (error) {
      // console.error('Error loading stored token management data:', error)
    }
  }

  private persistData(): void {
    try {
      // Only access localStorage in browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return
      }

      // Persist user usage
      const userUsageData = Object.fromEntries(this.userUsageCache)
      localStorage.setItem(this.USER_USAGE_KEY, JSON.stringify(userUsageData));

      // Persist conversation usage
      const conversationUsageData = Object.fromEntries(this.conversationUsageCache)
      localStorage.setItem(this.CONVERSATION_USAGE_KEY, JSON.stringify(conversationUsageData));

      // Persist token transactions (last 1000 only)
      const recentTransactions = this.tokenTransactions
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 1000)
      localStorage.setItem(this.TOKEN_TRANSACTIONS_KEY, JSON.stringify(recentTransactions));

      // Persist usage alerts (last 100 only)
      const recentAlerts = this.usageAlerts
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 100)
      localStorage.setItem(this.USAGE_ALERTS_KEY, JSON.stringify(recentAlerts));
    } catch (error) {
      // console.error('Error persisting token management data:', error)
    }
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const tokenManagementService = new TokenManagementService()
