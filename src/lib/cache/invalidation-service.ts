// Cache Invalidation Service for Coordinated Cache Management
import { redisClient } from './redis-client';
import { queryCache } from './query-cache';
import { apiCache } from './api-cache';

export interface InvalidationRule {
  trigger: {
    table?: string;
    endpoint?: string;
    resource?: string;
    operation?: 'CREATE' | 'UPDATE' | 'DELETE' | 'READ';
    condition?: (_data: any) => boolean;
  };
  targets: {
    queries?: string[];
    apis?: string[];
    resources?: string[];
    patterns?: string[];
    tags?: string[];
  };
  delay?: number; // Delay invalidation in ms
  cascade?: boolean; // Whether to cascade to related resources
}

export interface InvalidationEvent {
  id: string;
  timestamp: number;
  source: 'database' | 'api' | 'manual' | 'scheduled';
  trigger: any;
  targets: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  error?: string;
}

export interface InvalidationMetrics {
  totalInvalidations: number;
  successfulInvalidations: number;
  failedInvalidations: number;
  averageInvalidationTime: number;
  cacheHitRateImprovement: number;
  cascadedInvalidations: number;
}

class InvalidationService {
  private rules: Map<string, InvalidationRule> = new Map();
  private eventQueue: InvalidationEvent[] = [];
  private processing = false;
  private metrics: InvalidationMetrics = {
    totalInvalidations: 0,
    successfulInvalidations: 0,
    failedInvalidations: 0,
    averageInvalidationTime: 0,
    cacheHitRateImprovement: 0,
    cascadedInvalidations: 0,
  };
  private invalidationTimes: number[] = [];

  constructor() {
    this.setupDefaultRules();
    this.startEventProcessor();
  }

  // Register invalidation rule
  public registerRule(id: string, rule: InvalidationRule): void {
    this.rules.set(id, rule);
  }

  // Remove invalidation rule
  public removeRule(id: string): void {
    this.rules.delete(id);
  }

  // Trigger invalidation based on database change
  public async invalidateOnDatabaseChange(
    table: string,
    operation: 'CREATE' | 'UPDATE' | 'DELETE',
    recordId?: string,
    data?: any
  ): Promise<void> {
    const event: InvalidationEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      source: 'database',
      trigger: { table, operation, recordId, data },
      targets: [],
      status: 'pending',
      retryCount: 0,
    };

    // Find matching rules
    const matchingRules = this.findMatchingRules({
      table,
      operation,
      data,
    });

    // Build target list
    for (const rule of matchingRules) {
      if (rule.targets.queries) {
        event.targets.push(...rule.targets.queries.map((q) => `query:${q}`));
      }
      if (rule.targets.apis) {
        event.targets.push(...rule.targets.apis.map((a) => `api:${a}`));
      }
      if (rule.targets.resources) {
        event.targets.push(...rule.targets.resources.map((r) => `resource:${r}`));
      }
      if (rule.targets.patterns) {
        event.targets.push(...rule.targets.patterns.map((p) => `pattern:${p}`));
      }
      if (rule.targets.tags) {
        event.targets.push(...rule.targets.tags.map((t) => `tag:${t}`));
      }
    }

    // Add to queue
    this.eventQueue.push(event);
  }

  // Trigger invalidation based on API change
  public async invalidateOnAPIChange(endpoint: string, method: string, data?: any): Promise<void> {
    const event: InvalidationEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      source: 'api',
      trigger: { endpoint, method, data },
      targets: [],
      status: 'pending',
      retryCount: 0,
    };

    // Find matching rules
    const matchingRules = this.findMatchingRules({
      endpoint,
      operation: method as any,
      data,
    });

    // Build target list
    for (const rule of matchingRules) {
      if (rule.targets.queries) {
        event.targets.push(...rule.targets.queries.map((q) => `query:${q}`));
      }
      if (rule.targets.apis) {
        event.targets.push(...rule.targets.apis.map((a) => `api:${a}`));
      }
      if (rule.targets.resources) {
        event.targets.push(...rule.targets.resources.map((r) => `resource:${r}`));
      }
      if (rule.targets.patterns) {
        event.targets.push(...rule.targets.patterns.map((p) => `pattern:${p}`));
      }
      if (rule.targets.tags) {
        event.targets.push(...rule.targets.tags.map((t) => `tag:${t}`));
      }
    }

    // Add to queue
    this.eventQueue.push(event);
  }

  // Manual invalidation
  public async invalidateManual(targets: {
    queries?: string[];
    apis?: string[];
    resources?: string[];
    patterns?: string[];
    tags?: string[];
  }): Promise<void> {
    const event: InvalidationEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      source: 'manual',
      trigger: { manual: true },
      targets: [],
      status: 'pending',
      retryCount: 0,
    };

    // Build target list
    if (targets.queries) {
      event.targets.push(...targets.queries.map((q) => `query:${q}`));
    }
    if (targets.apis) {
      event.targets.push(...targets.apis.map((a) => `api:${a}`));
    }
    if (targets.resources) {
      event.targets.push(...targets.resources.map((r) => `resource:${r}`));
    }
    if (targets.patterns) {
      event.targets.push(...targets.patterns.map((p) => `pattern:${p}`));
    }
    if (targets.tags) {
      event.targets.push(...targets.tags.map((t) => `tag:${t}`));
    }

    // Add to queue
    this.eventQueue.push(event);
  }

  // Scheduled invalidation (for time-based cache expiry)
  public async scheduleInvalidation(
    targets: {
      queries?: string[];
      apis?: string[];
      resources?: string[];
      patterns?: string[];
      tags?: string[];
    },
    delay: number
  ): Promise<void> {
    setTimeout(async () => {
      const event: InvalidationEvent = {
        id: this.generateEventId(),
        timestamp: Date.now(),
        source: 'scheduled',
        trigger: { scheduled: true, delay },
        targets: [],
        status: 'pending',
        retryCount: 0,
      };

      // Build target list
      if (targets.queries) {
        event.targets.push(...targets.queries.map((q) => `query:${q}`));
      }
      if (targets.apis) {
        event.targets.push(...targets.apis.map((a) => `api:${a}`));
      }
      if (targets.resources) {
        event.targets.push(...targets.resources.map((r) => `resource:${r}`));
      }
      if (targets.patterns) {
        event.targets.push(...targets.patterns.map((p) => `pattern:${p}`));
      }
      if (targets.tags) {
        event.targets.push(...targets.tags.map((t) => `tag:${t}`));
      }

      // Add to queue
      this.eventQueue.push(event);
    }, delay);
  }

  // Get invalidation metrics
  public getMetrics(): InvalidationMetrics {
    return { ...this.metrics };
  }

  // Get pending events
  public getPendingEvents(): InvalidationEvent[] {
    return this.eventQueue.filter((event) => event.status === 'pending');
  }

  // Clear all caches
  public async clearAllCaches(): Promise<void> {
    await Promise.all([redisClient.flush(), queryCache.invalidateAll()]);
  }

  // Private methods
  private setupDefaultRules(): void {
    // User-related invalidations
    this.registerRule('user-changes', {
      trigger: {
        table: 'users',
        operation: 'UPDATE',
      },
      targets: {
        queries: ['user:*'],
        apis: ['/api/users/*', '/api/auth/*'],
        resources: ['users'],
        tags: ['user-data'],
      },
      cascade: true,
    });

    // Risk-related invalidations
    this.registerRule('risk-changes', {
      trigger: {
        table: 'risks',
      },
      targets: {
        queries: ['risk:*', 'dashboard:*'],
        apis: ['/api/risks/*', '/api/dashboard/*'],
        resources: ['risks', 'dashboard'],
        tags: ['risk-data', 'dashboard-data'],
      },
      cascade: true,
    });

    // Compliance-related invalidations
    this.registerRule('compliance-changes', {
      trigger: {
        table: 'compliance',
      },
      targets: {
        queries: ['compliance:*', 'dashboard:*'],
        apis: ['/api/compliance/*', '/api/dashboard/*'],
        resources: ['compliance', 'dashboard'],
        tags: ['compliance-data', 'dashboard-data'],
      },
      cascade: true,
    });

    // Document-related invalidations
    this.registerRule('document-changes', {
      trigger: {
        table: 'documents',
      },
      targets: {
        queries: ['document:*'],
        apis: ['/api/documents/*'],
        resources: ['documents'],
        tags: ['document-data'],
      },
    });

    // Settings-related invalidations
    this.registerRule('settings-changes', {
      trigger: {
        table: 'settings',
      },
      targets: {
        queries: ['settings:*'],
        apis: ['/api/settings/*'],
        resources: ['settings'],
        tags: ['settings-data'],
      },
      cascade: true,
    });

    // Dashboard aggregation invalidations
    this.registerRule('dashboard-aggregations', {
      trigger: {
        table: 'risks',
        operation: 'CREATE',
      },
      targets: {
        queries: ['dashboard:*', 'analytics:*'],
        apis: ['/api/dashboard/*', '/api/analytics/*'],
        resources: ['dashboard', 'analytics'],
        tags: ['dashboard-data', 'analytics-data'],
      },
    });
  }

  private findMatchingRules(trigger: any): InvalidationRule[] {
    const matchingRules: InvalidationRule[] = [];

    for (const [, rule] of this.rules) {
      if (this.ruleMatches(rule, trigger)) {
        matchingRules.push(rule);
      }
    }

    return matchingRules;
  }

  private ruleMatches(rule: InvalidationRule, trigger: any): boolean {
    const { trigger: ruleTrigger } = rule;

    // Check table match
    if (ruleTrigger.table && trigger.table !== ruleTrigger.table) {
      return false;
    }

    // Check endpoint match
    if (ruleTrigger.endpoint && trigger.endpoint !== ruleTrigger.endpoint) {
      return false;
    }

    // Check resource match
    if (ruleTrigger.resource && trigger.resource !== ruleTrigger.resource) {
      return false;
    }

    // Check operation match
    if (ruleTrigger.operation && trigger.operation !== ruleTrigger.operation) {
      return false;
    }

    // Check condition match
    if (ruleTrigger.condition && !ruleTrigger.condition(trigger.data)) {
      return false;
    }

    return true;
  }

  private async startEventProcessor(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    const processEvents = async () => {
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift()!;
        await this.processEvent(event);
      }

      // Schedule next processing cycle
      setTimeout(processEvents, 100);
    };

    processEvents();
  }

  private async processEvent(event: InvalidationEvent): Promise<void> {
    const startTime = Date.now();
    event.status = 'processing';
    this.metrics.totalInvalidations++;

    try {
      // Group targets by type for efficient processing
      const queryTargets: string[] = [];
      const apiTargets: string[] = [];
      const resourceTargets: string[] = [];
      const patternTargets: string[] = [];
      const tagTargets: string[] = [];

      for (const target of event.targets) {
        const [type, value] = target.split(':', 2);
        switch (type) {
          case 'query':
            queryTargets.push(value);
            break;
          case 'api':
            apiTargets.push(value);
            break;
          case 'resource':
            resourceTargets.push(value);
            break;
          case 'pattern':
            patternTargets.push(value);
            break;
          case 'tag':
            tagTargets.push(value);
            break;
        }
      }

      // Execute invalidations in parallel
      const promises: Promise<any>[] = [];

      if (queryTargets.length > 0) {
        promises.push(this.invalidateQueries(queryTargets));
      }

      if (apiTargets.length > 0) {
        promises.push(this.invalidateAPIs(apiTargets));
      }

      if (resourceTargets.length > 0) {
        promises.push(this.invalidateResources(resourceTargets));
      }

      if (patternTargets.length > 0) {
        promises.push(this.invalidatePatterns(patternTargets));
      }

      if (tagTargets.length > 0) {
        promises.push(this.invalidateTags(tagTargets));
      }

      await Promise.all(promises);

      event.status = 'completed';
      this.metrics.successfulInvalidations++;

      const processingTime = Date.now() - startTime;
      this.updateMetrics(processingTime);
    } catch (error) {
      event.status = 'failed';
      event.error = error instanceof Error ? error.message : 'Unknown error';
      event.retryCount++;

      this.metrics.failedInvalidations++;

      // Retry logic
      if (event.retryCount < 3) {
        event.status = 'pending';
        this.eventQueue.push(event);
      }

      // console.error('Invalidation event failed:', error);
    }
  }

  private async invalidateQueries(targets: string[]): Promise<void> {
    const promises = targets.map((target) => {
      if (target.includes('*')) {
        return queryCache.invalidateByPattern(target);
      } else {
        return redisClient.delete(`query:${target}`);
      }
    });

    await Promise.all(promises);
  }

  private async invalidateAPIs(targets: string[]): Promise<void> {
    const promises = targets.map((target) => {
      if (target.includes('*')) {
        return apiCache.invalidateByPattern(target);
      } else {
        return apiCache.invalidateByEndpoint(target);
      }
    });

    await Promise.all(promises);
  }

  private async invalidateResources(targets: string[]): Promise<void> {
    const promises = targets.map((target) => {
      return apiCache.invalidateByResource(target);
    });

    await Promise.all(promises);
  }

  private async invalidatePatterns(targets: string[]): Promise<void> {
    const promises = targets.map((target) => {
      return redisClient.invalidateByTags([target]);
    });

    await Promise.all(promises);
  }

  private async invalidateTags(targets: string[]): Promise<void> {
    return redisClient.invalidateByTags(targets);
  }

  private updateMetrics(processingTime: number): void {
    this.invalidationTimes.push(processingTime);

    // Keep only last 1000 processing times
    if (this.invalidationTimes.length > 1000) {
      this.invalidationTimes.shift();
    }

    // Update average processing time
    this.metrics.averageInvalidationTime =
      this.invalidationTimes.reduce((sum, time) => sum + time, 0) / this.invalidationTimes.length;
  }

  private generateEventId(): string {
    return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Create singleton instance
export const invalidationService = new InvalidationService();

// Export class for custom instances
export { InvalidationService };

// Utility functions for common invalidation patterns
export const invalidateUserData = async (userId?: string): Promise<void> => {
  await invalidationService.invalidateManual({
    queries: userId ? [`user:${userId}`] : ['user:*'],
    apis: userId ? [`/api/users/${userId}`] : ['/api/users/*'],
    resources: ['users'],
    tags: ['user-data'],
  });
};

export const invalidateRiskData = async (riskId?: string): Promise<void> => {
  await invalidationService.invalidateManual({
    queries: riskId ? [`risk:${riskId}`, 'dashboard:*'] : ['risk:*', 'dashboard:*'],
    apis: riskId
      ? [`/api/risks/${riskId}`, '/api/dashboard/*']
      : ['/api/risks/*', '/api/dashboard/*'],
    resources: ['risks', 'dashboard'],
    tags: ['risk-data', 'dashboard-data'],
  });
};

export const invalidateComplianceData = async (complianceId?: string): Promise<void> => {
  await invalidationService.invalidateManual({
    queries: complianceId
      ? [`compliance:${complianceId}`, 'dashboard:*']
      : ['compliance:*', 'dashboard:*'],
    apis: complianceId
      ? [`/api/compliance/${complianceId}`, '/api/dashboard/*']
      : ['/api/compliance/*', '/api/dashboard/*'],
    resources: ['compliance', 'dashboard'],
    tags: ['compliance-data', 'dashboard-data'],
  });
};

export const invalidateDashboardData = async (): Promise<void> => {
  await invalidationService.invalidateManual({
    queries: ['dashboard:*', 'analytics:*'],
    apis: ['/api/dashboard/*', '/api/analytics/*'],
    resources: ['dashboard', 'analytics'],
    tags: ['dashboard-data', 'analytics-data'],
  });
};
