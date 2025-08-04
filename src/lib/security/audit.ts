import crypto from 'crypto';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { notificationManager } from '@/lib/collaboration/notifications';
import type {
  AuditConfiguration,
  SecurityAuditEvent,
  AuditEventType,
  AuditDestination,
  SIEMIntegration,
  GeoLocation,
  DeviceInfo,
} from './types';

export class AuditService {
  private config: AuditConfiguration;
  private eventQueue: SecurityAuditEvent[] = [];
  private processingQueue = false;
  private siemClients: Map<string, SIEMClient> = new Map();

  // Class-level constants for severity multipliers
  private static readonly severityMultipliers: Record<string, number> = {
    info: 1,
    low: 1.2,
    medium: 1.5,
    high: 2,
    critical: 3,
  };

  constructor(_config: AuditConfiguration) {
    this.config = config;
    this.initializeSIEMClients();
    this.startEventProcessor();
  }

  // Core Audit Logging
  async logEvent(event: Partial<SecurityAuditEvent>): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const auditEvent: SecurityAuditEvent = {
      id: event.id || uuidv4(),
      timestamp: event.timestamp || new Date(),
      organizationId: event.organizationId || 'system',
      userId: event.userId,
      sessionId: event.sessionId,
      eventType: event.eventType || 'unknown',
      category: event.category || 'system_access',
      action: event.action || 'unknown',
      resource: event.resource,
      resourceId: event.resourceId,
      source: event.source || {
        ip: 'unknown',
      },
      outcome: event.outcome || 'success',
      severity: event.severity || 'info',
      details: event.details || {},
      risk_score: event.risk_score,
      correlationId: event.correlationId || uuidv4(),
      tags: event.tags || [],
    };

    // Add integrity signature
    await this.addIntegritySignature(auditEvent);

    // Calculate risk score if not provided
    if (!auditEvent.risk_score) {
      auditEvent.risk_score = this.calculateRiskScore(auditEvent);
    }

    // Check if this event type should be logged
    if (!this.shouldLogEvent(auditEvent)) {
      return;
    }

    // Add to queue for processing
    this.eventQueue.push(auditEvent);

    // Process real-time alerts
    if (this.config.realTimeAlerting) {
      await this.processRealTimeAlert(auditEvent);
    }
  }

  // Enhanced logging methods for specific categories
  async logAuthentication(_data: AuthenticationAuditData): Promise<void> {
    await this.logEvent({
      category: 'authentication',
      action: data.action,
      userId: data.userId,
      eventType: `auth_${data.action}`,
      outcome: data.success ? 'success' : 'failure',
      severity: data.success ? 'info' : 'medium',
      source: data.source,
      details: {
        method: data.method,
        provider: data.provider,
        mfaUsed: data.mfaUsed,
        deviceTrusted: data.deviceTrusted,
        failureReason: data.failureReason,
        sessionDuration: data.sessionDuration,
      },
      tags: ['authentication', data.method, data.action],
    });
  }

  async logAuthorization(_data: AuthorizationAuditData): Promise<void> {
    await this.logEvent({
      category: 'authorization',
      action: data.action,
      userId: data.userId,
      eventType: `authz_${data.action}`,
      resource: data.resource,
      resourceId: data.resourceId,
      outcome: data.granted ? 'success' : 'failure',
      severity: data.granted ? 'info' : 'medium',
      source: data.source,
      details: {
        permissions: data.permissions,
        role: data.role,
        deniedReason: data.deniedReason,
        elevatedAccess: data.elevatedAccess,
      },
      tags: ['authorization', data.action],
    });
  }

  async logDataAccess(_data: DataAccessAuditData): Promise<void> {
    await this.logEvent({
      category: 'data_access',
      action: data.action,
      userId: data.userId,
      eventType: `data_${data.action}`,
      resource: data.resource,
      resourceId: data.resourceId,
      outcome: 'success',
      severity: this.getDataAccessSeverity(data),
      source: data.source,
      details: {
        dataType: data.dataType,
        classification: data.classification,
        recordCount: data.recordCount,
        query: data.query,
        sensitive: data.sensitive,
        exported: data.exported,
        fields: data.fields,
      },
      tags: ['data_access', data.dataType, data.action],
    });
  }

  async logDataModification(_data: DataModificationAuditData): Promise<void> {
    await this.logEvent({
      category: 'data_modification',
      action: data.action,
      userId: data.userId,
      eventType: `data_${data.action}`,
      resource: data.resource,
      resourceId: data.resourceId,
      outcome: 'success',
      severity: 'medium',
      source: data.source,
      details: {
        oldValues: data.oldValues,
        newValues: data.newValues,
        changedFields: data.changedFields,
        reason: data.reason,
        approvedBy: data.approvedBy,
        bulk: data.bulk,
        recordCount: data.recordCount,
      },
      tags: ['data_modification', data.action],
    });
  }

  async logSystemAccess(_data: SystemAccessAuditData): Promise<void> {
    await this.logEvent({
      category: 'system_access',
      action: data.action,
      userId: data.userId,
      eventType: `system_${data.action}`,
      resource: data.resource,
      outcome: 'success',
      severity: 'info',
      source: data.source,
      details: {
        component: data.component,
        feature: data.feature,
        parameters: data.parameters,
        duration: data.duration,
        apiEndpoint: data.apiEndpoint,
        statusCode: data.statusCode,
      },
      tags: ['system_access', data.component, data.action],
    });
  }

  async logConfigurationChange(_data: ConfigurationChangeAuditData): Promise<void> {
    await this.logEvent({
      category: 'configuration_change',
      action: data.action,
      userId: data.userId,
      eventType: `config_${data.action}`,
      resource: data.resource,
      resourceId: data.resourceId,
      outcome: 'success',
      severity: 'high',
      source: data.source,
      details: {
        configType: data.configType,
        oldConfiguration: data.oldConfiguration,
        newConfiguration: data.newConfiguration,
        changes: data.changes,
        impact: data.impact,
        approvedBy: data.approvedBy,
        rollbackPlan: data.rollbackPlan,
      },
      tags: ['configuration', data.configType, data.action],
    });
  }

  async logSecurityEvent(_data: SecurityEventAuditData): Promise<void> {
    await this.logEvent({
      category: 'security_event',
      action: data.action,
      userId: data.userId,
      eventType: `security_${data.action}`,
      resource: data.resource,
      outcome: 'success',
      severity: data.severity || 'high',
      source: data.source,
      details: {
        threatType: data.threatType,
        threatLevel: data.threatLevel,
        indicators: data.indicators,
        response: data.response,
        blocked: data.blocked,
        quarantined: data.quarantined,
        mitigations: data.mitigations,
      },
      tags: ['security', data.threatType || 'unknown', data.action],
    });
  }

  // Event Processing
  private async startEventProcessor(): Promise<void> {
    setInterval(async () => {
      if (this.processingQueue || this.eventQueue.length === 0) {
        return;
      }

      this.processingQueue = true;
      const eventsToProcess = [...this.eventQueue];
      this.eventQueue = [];

      try {
        await this.processEventBatch(eventsToProcess);
      } catch (error) {
        // console.error('Failed to process audit events:', error)
        // Re-queue failed events
        this.eventQueue.unshift(...eventsToProcess);
      } finally {
        this.processingQueue = false;
      }
    }, 1000); // Process every second
  }

  private async processEventBatch(events: SecurityAuditEvent[]): Promise<void> {
    // Store in database
    await this.storeEvents(events);

    // Send to SIEM
    if (this.config.siemIntegration.enabled) {
      await this.sendToSIEM(events);
    }

    // Send to other destinations
    for (const destination of this.config.destinations) {
      if (destination.enabled) {
        await this.sendToDestination(events, destination);
      }
    }
  }

  private async storeEvents(events: SecurityAuditEvent[]): Promise<void> {
    try {
      await db.client.securityAuditEvent.createMany({
        data: events.map((event) => ({
          ...event,
          source: JSON.stringify(event.source),
          details: JSON.stringify(event.details),
        })),
      });
    } catch (error) {
      // console.error('Failed to store audit events:', error)
      throw error;
    }
  }

  // SIEM Integration
  private initializeSIEMClients(): void {
    if (!this.config.siemIntegration.enabled) {
      return;
    }

    const siemConfig = this.config.siemIntegration;

    switch (siemConfig.provider) {
      case 'splunk':
        this.siemClients.set('splunk', new SplunkClient(siemConfig));
        break;
      case 'elastic':
        this.siemClients.set('elastic', new ElasticClient(siemConfig));
        break;
      case 'qradar':
        this.siemClients.set('qradar', new QRadarClient(siemConfig));
        break;
      case 'sentinel':
        this.siemClients.set('sentinel', new SentinelClient(siemConfig));
        break;
      case 'sumo_logic':
        this.siemClients.set('sumo_logic', new SumoLogicClient(siemConfig));
        break;
      default:
        this.siemClients.set('custom', new CustomSIEMClient(siemConfig));
    }
  }

  private async sendToSIEM(events: SecurityAuditEvent[]): Promise<void> {
    const siemClient = this.siemClients.get(this.config.siemIntegration.provider);
    if (!siemClient) {
      // console.warn('SIEM client not configured')
      return;
    }

    // Apply filters
    const filteredEvents = events.filter(
      (event) =>
        this.config.siemIntegration.filters.length === 0 ||
        this.config.siemIntegration.filters.some(
          (filter) => event.eventType.includes(filter) || event.category.includes(filter)
        )
    );

    if (filteredEvents.length === 0) {
      return;
    }

    // Send in batches
    const batchSize = this.config.siemIntegration.batchSize;
    for (let i = 0; i < filteredEvents.length; i += batchSize) {
      const batch = filteredEvents.slice(i, i + batchSize);
      try {
        await siemClient.sendEvents(batch);
      } catch (error) {
        // console.error('Failed to send events to SIEM:', error)
      }
    }
  }

  private async sendToDestination(
    events: SecurityAuditEvent[],
    destination: AuditDestination
  ): Promise<void> {
    try {
      switch (destination.type) {
        case 'file':
          await this.writeToFile(events, destination);
          break;
        case 'syslog':
          await this.sendToSyslog(events, destination);
          break;
        case 'webhook':
          await this.sendToWebhook(events, destination);
          break;
        default:
        // console.warn(`Unknown destination type: ${destination.type}`)
      }
    } catch (error) {
      // console.error(`Failed to send to destination ${destination.type}:`, error)
    }
  }

  // Destination Implementations
  private async writeToFile(
    events: SecurityAuditEvent[],
    destination: AuditDestination
  ): Promise<void> {
    const fs = await import('fs/promises');
    const path = destination.configuration.path || '/var/log/riscura/audit.log';

    for (const event of events) {
      const logLine = this.formatEvent(event, destination.format) + '\n';
      await fs.appendFile(path, logLine);
    }
  }

  private async sendToSyslog(
    events: SecurityAuditEvent[],
    destination: AuditDestination
  ): Promise<void> {
    // Simplified syslog implementation
    for (const event of events) {
      const message = this.formatEvent(event, destination.format);
      // console.log(`SYSLOG: ${message}`)
    }
  }

  private async sendToWebhook(
    events: SecurityAuditEvent[],
    destination: AuditDestination
  ): Promise<void> {
    const url = destination.configuration.url;
    const headers = destination.configuration.headers || {};

    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({
          events: events.map((event) => this.formatEvent(event, destination.format)),
          timestamp: new Date().toISOString(),
          source: 'riscura-audit',
        }),
      });
    } catch (error) {
      // console.error('Failed to send to webhook:', error)
    }
  }

  // Event Formatting
  private formatEvent(event: SecurityAuditEvent, format: string): any {
    switch (format) {
      case 'json':
        return JSON.stringify(event);
      case 'cef':
        return this.formatCEF(event);
      case 'leef':
        return this.formatLEEF(event);
      case 'csv':
        return this.formatCSV(event);
      default:
        return JSON.stringify(event);
    }
  }

  private formatCEF(event: SecurityAuditEvent): string {
    return `CEF:0|Riscura|RCSA|1.0|${event.eventType}|${event.action}|${this.mapSeverityToCEF(event.severity)}|rt=${event.timestamp.getTime()} src=${event.source.ip} duser=${event.userId || 'unknown'} outcome=${event.outcome}`;
  }

  private formatLEEF(event: SecurityAuditEvent): string {
    return `LEEF:2.0|Riscura|RCSA|1.0|${event.eventType}|devTime=${event.timestamp.toISOString()}|src=${event.source.ip}|usrName=${event.userId || 'unknown'}|cat=${event.category}`;
  }

  private formatCSV(event: SecurityAuditEvent): string {
    return [
      event.timestamp.toISOString(),
      event.userId || '',
      event.category,
      event.action,
      event.outcome,
      event.severity,
      event.source.ip,
      JSON.stringify(event.details),
    ].join(',');
  }

  private mapSeverityToCEF(severity: string): number {
    const mapping: Record<string, number> = {
      info: 3,
      low: 4,
      medium: 6,
      high: 8,
      critical: 10,
    };
    return mapping[severity] || 5;
  }

  // Real-time Alerting
  private async processRealTimeAlert(event: SecurityAuditEvent): Promise<void> {
    // Check for high-risk events
    if (event.severity === 'critical' || event.risk_score! > 8) {
      await this.sendCriticalAlert(event);
    }

    // Check for suspicious patterns
    if (await this.detectSuspiciousPattern(event)) {
      await this.sendPatternAlert(event);
    }

    // Check for compliance violations
    if (this.isComplianceViolation(event)) {
      await this.sendComplianceAlert(event);
    }
  }

  private async sendCriticalAlert(event: SecurityAuditEvent): Promise<void> {
    await notificationManager.sendNotification({
      type: 'SECURITY_ALERT',
      title: 'Critical Security Event',
      message: `Critical security event detected: ${event.action} by ${event.userId}`,
      recipientId: 'security-team',
      urgency: 'urgent',
      data: {
        eventId: event.id,
        eventType: event.eventType,
        severity: event.severity,
        riskScore: event.risk_score,
      },
    });
  }

  private async sendPatternAlert(event: SecurityAuditEvent): Promise<void> {
    await notificationManager.sendNotification({
      type: 'PATTERN_DETECTED',
      title: 'Suspicious Activity Pattern',
      message: `Suspicious pattern detected in user activity: ${event.userId}`,
      recipientId: 'security-team',
      urgency: 'high',
      data: {
        eventId: event.id,
        pattern: 'suspicious_activity',
        userId: event.userId,
      },
    });
  }

  private async sendComplianceAlert(event: SecurityAuditEvent): Promise<void> {
    await notificationManager.sendNotification({
      type: 'COMPLIANCE_VIOLATION',
      title: 'Compliance Violation Detected',
      message: `Potential compliance violation: ${event.action}`,
      recipientId: 'compliance-team',
      urgency: 'high',
      data: {
        eventId: event.id,
        violation: event.eventType,
        regulation: 'SOX', // Would determine based on event
      },
    });
  }

  // Risk Scoring
  private calculateRiskScore(event: SecurityAuditEvent): number {
    let score = 1;

    // Base score by category
    const categoryScores: Record<string, number> = {
      authentication: 3,
      authorization: 4,
      data_access: 5,
      data_modification: 7,
      system_access: 2,
      configuration_change: 8,
      security_event: 9,
    };

    score += categoryScores[event.category] || 1;

    // Severity multiplier
    const severityMultipliers: Record<string, number> = {
      info: 1,
      low: 1.2,
      medium: 1.5,
      high: 2,
      critical: 3,
    };

    score *= severityMultipliers[event.severity] || 1;

    // Failure events are riskier
    if (event.outcome === 'failure') {
      score *= 1.5;
    }

    // Administrative actions
    if (event.tags.includes('admin') || event.tags.includes('privileged')) {
      score *= 1.3;
    }

    // External access
    if (event.source.ip && !this.isInternalIP(event.source.ip)) {
      score *= 1.2;
    }

    // Off-hours access
    if (this.isOffHours(event.timestamp)) {
      score *= 1.1;
    }

    return Math.min(Math.round(score * 10) / 10, 10); // Cap at 10
  }

  private isInternalIP(ip: string): boolean {
    // Simplified internal IP detection
    return (
      ip.startsWith('192.168.') ||
      ip.startsWith('10.') ||
      ip.startsWith('172.16.') ||
      ip === '127.0.0.1'
    );
  }

  private isOffHours(timestamp: Date): boolean {
    const hour = timestamp.getHours();
    return hour < 8 || hour > 18; // Outside 8 AM - 6 PM
  }

  // Pattern Detection
  private async detectSuspiciousPattern(event: SecurityAuditEvent): Promise<boolean> {
    if (!event.userId) return false;

    // Check for multiple failed login attempts
    if (event.category === 'authentication' && event.outcome === 'failure') {
      const recentFailures = await this.getRecentFailedLogins(event.userId, 15); // 15 minutes
      return recentFailures >= 5;
    }

    // Check for unusual data access patterns
    if (event.category === 'data_access') {
      const recentAccess = await this.getRecentDataAccess(event.userId!, 60); // 1 hour
      return recentAccess > 100; // More than 100 records accessed in an hour
    }

    // Check for privilege escalation
    if (event.category === 'authorization' && event.tags.includes('elevation')) {
      return true; // Always flag privilege escalation
    }

    return false;
  }

  private async getRecentFailedLogins(_userId: string, minutes: number): Promise<number> {
    const since = new Date(Date.now() - minutes * 60 * 1000);

    const count = await db.client.securityAuditEvent.count({
      where: {
        userId,
        category: 'authentication',
        outcome: 'failure',
        timestamp: {
          gte: since,
        },
      },
    });

    return count;
  }

  private async getRecentDataAccess(_userId: string, minutes: number): Promise<number> {
    const since = new Date(Date.now() - minutes * 60 * 1000);

    const events = await db.client.securityAuditEvent.findMany({
      where: {
        userId,
        category: 'data_access',
        timestamp: {
          gte: since,
        },
      },
    });

    // Sum up record counts from details
    return events.reduce((total, event) => {
      const details = typeof event.details === 'string' ? JSON.parse(event.details) : event.details;
      return total + (details.recordCount || 1);
    }, 0);
  }

  // Compliance Checking
  private isComplianceViolation(event: SecurityAuditEvent): boolean {
    // Check for data access without proper authorization
    if (
      event.category === 'data_access' &&
      event.tags.includes('sensitive') &&
      !event.tags.includes('authorized')
    ) {
      return true;
    }

    // Check for configuration changes without approval
    if (event.category === 'configuration_change' && !event.details.approvedBy) {
      return true;
    }

    // Check for privileged access outside business hours
    if (event.tags.includes('privileged') && this.isOffHours(event.timestamp)) {
      return true;
    }

    return false;
  }

  // Utility Methods
  private shouldLogEvent(event: SecurityAuditEvent): boolean {
    // Check if event type is configured to be logged
    const eventTypeConfig = this.config.eventTypes.find((et) => et.category === event.category);

    if (!eventTypeConfig) {
      return false;
    }

    return eventTypeConfig.actions.includes(event.action) || eventTypeConfig.actions.includes('*');
  }

  private getDataAccessSeverity(
    _data: DataAccessAuditData
  ): 'info' | 'low' | 'medium' | 'high' | 'critical' {
    if (data.sensitive || data.classification === 'confidential') {
      return 'high';
    }
    if (data.exported || (data.recordCount && data.recordCount > 1000)) {
      return 'medium';
    }
    return 'info';
  }

  // Integrity Protection
  private async addIntegritySignature(event: SecurityAuditEvent): Promise<void> {
    if (!this.config.integrityProtection) {
      return;
    }

    const eventString = JSON.stringify({
      timestamp: event.timestamp,
      userId: event.userId,
      action: event.action,
      resource: event.resource,
      outcome: event.outcome,
    });

    const signature = crypto
      .createHmac('sha256', process.env.AUDIT_INTEGRITY_KEY || 'default-key')
      .update(eventString)
      .digest('hex');

    event.details = {
      ...event.details,
      _integrity: signature,
    };
  }

  async verifyEventIntegrity(event: SecurityAuditEvent): Promise<boolean> {
    if (!this.config.integrityProtection || !event.details._integrity) {
      return true; // No integrity protection or signature
    }

    const eventString = JSON.stringify({
      timestamp: event.timestamp,
      userId: event.userId,
      action: event.action,
      resource: event.resource,
      outcome: event.outcome,
    });

    const expectedSignature = crypto
      .createHmac('sha256', process.env.AUDIT_INTEGRITY_KEY || 'default-key')
      .update(eventString)
      .digest('hex');

    return expectedSignature === event.details._integrity;
  }

  // Querying and Search
  async searchEvents(_query: AuditSearchQuery): Promise<AuditSearchResult> {
    const where: any = {};

    if (query.userId) where.userId = query.userId;
    if (query.category) where.category = query.category;
    if (query.action) where.action = query.action;
    if (query.resource) where.resource = query.resource;
    if (query.outcome) where.outcome = query.outcome;
    if (query.startDate || query.endDate) {
      where.timestamp = {};
      if (query.startDate) where.timestamp.gte = query.startDate;
      if (query.endDate) where.timestamp.lte = query.endDate;
    }

    const [events, total] = await Promise.all([
      db.client.securityAuditEvent.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: query.offset || 0,
        take: query.limit || 100,
      }),
      db.client.securityAuditEvent.count({ where }),
    ]);

    return {
      events: events.map((event) => ({
        ...event,
        source: typeof event.source === 'string' ? JSON.parse(event.source) : event.source,
        details: typeof event.details === 'string' ? JSON.parse(event.details) : event.details,
      })),
      total,
      offset: query.offset || 0,
      limit: query.limit || 100,
    };
  }

  // Metrics and Analytics
  async getAuditMetrics(_period: { start: Date; end: Date }): Promise<AuditMetrics> {
    const where = {
      timestamp: {
        gte: period.start,
        lte: period.end,
      },
    };

    const [totalEvents, categoryCounts, severityCounts, outcomeCounts, riskScoreAvg] =
      await Promise.all([
        db.client.securityAuditEvent.count({ where }),
        db.client.securityAuditEvent.groupBy({
          by: ['category'],
          where,
          _count: true,
        }),
        db.client.securityAuditEvent.groupBy({
          by: ['severity'],
          where,
          _count: true,
        }),
        db.client.securityAuditEvent.groupBy({
          by: ['outcome'],
          where,
          _count: true,
        }),
        db.client.securityAuditEvent.aggregate({
          where,
          _avg: {
            risk_score: true,
          },
        }),
      ]);

    return {
      period,
      totalEvents,
      categoryCounts: Object.fromEntries(categoryCounts.map((c) => [c.category, c._count])),
      severityCounts: Object.fromEntries(severityCounts.map((s) => [s.severity, s._count])),
      outcomeCounts: Object.fromEntries(outcomeCounts.map((o) => [o.outcome, o._count])),
      averageRiskScore: riskScoreAvg._avg.risk_score || 0,
    };
  }

  // Analyze entity access patterns
  private analyzeEntityAccessPatterns(groupedData: SecurityAuditEvent[]): Record<string, any> {
    return groupedData.reduce((patterns: Record<string, any>, event: any) => {
      if (event.entityType && event.entityId) {
        const key = `${event.entityType}:${event.entityId}`;
        if (!patterns[key]) {
          patterns[key] = {
            entityType: event.entityType,
            entityId: event.entityId,
            accessCount: 0,
            uniqueUsers: new Set(),
            actions: new Set(),
            lastAccessed: event.timestamp,
            riskScore: 0,
          };
        }

        patterns[key].accessCount++;
        patterns[key].uniqueUsers.add(event.userId);
        patterns[key].actions.add(event.action);

        if (new Date(event.timestamp) > new Date(patterns[key].lastAccessed)) {
          patterns[key].lastAccessed = event.timestamp;
        }
      }
      return patterns;
    }, {});
  }

  // Convert Sets to arrays and calculate risk scores
  private calculateEntityRiskScore(_pattern: any): number {
    const accessCount = pattern.accessCount;
    const uniqueUsers = pattern.uniqueUsers.size;
    const actions = pattern.actions.size;
    const lastAccessed = new Date(pattern.lastAccessed);
    const currentTime = new Date();
    const age = (currentTime - lastAccessed) / (1000 * 60 * 60); // Age in hours

    let score = 1;

    // Base score by access count
    score += accessCount * 0.5;

    // Severity multiplier
    const severityMultipliers: Record<string, number> = {
      info: 1,
      low: 1.2,
      medium: 1.5,
      high: 2,
      critical: 3,
    };

    // Use severity from pattern if available, default to 'low'
    const severity = pattern.severity || 'low';
    score *= severityMultipliers[severity] || 1;

    // Age multiplier
    if (age > 24) {
      score *= 0.5;
    }

    // External access check removed - pattern.entityId is not a valid IP address property
    // TODO: Implement proper external access detection based on actual IP data

    return Math.min(Math.round(score * 10) / 10, 10); // Cap at 10
  }

  // User behavior analysis
  private analyzeUserBehavior(groupedData: SecurityAuditEvent[]): Record<string, any> {
    return groupedData.reduce((patterns: Record<string, any>, event: any) => {
      if (!patterns[event.userId]) {
        patterns[event.userId] = {
          userId: event.userId,
          totalActions: 0,
          uniqueEntities: new Set(),
          actions: {},
          timeDistribution: {},
          riskScore: 0,
          anomalies: [],
        };
      }

      const userPattern = patterns[event.userId];
      userPattern.totalActions++;
      userPattern.uniqueEntities.add(`${event.entityType}:${event.entityId}`);

      // Track action types
      if (!userPattern.actions[event.action]) {
        userPattern.actions[event.action] = 0;
      }
      userPattern.actions[event.action]++;

      // Track time distribution
      const hour = new Date(event.timestamp).getHours();
      if (!userPattern.timeDistribution[hour]) {
        userPattern.timeDistribution[hour] = 0;
      }
      userPattern.timeDistribution[hour]++;

      return patterns;
    }, {});
  }

  // Convert Sets to arrays and calculate user risk scores
  private calculateUserRiskScore(_pattern: any): number {
    const totalActions = pattern.totalActions;
    const uniqueEntities = pattern.uniqueEntities.size;
    const actions = Object.keys(pattern.actions).length;
    const timeDistribution = Object.values(pattern.timeDistribution).reduce(
      (total: number, count: number) => total + count,
      0
    );

    let score = 1;

    // Base score by action count
    score += actions * 0.5;

    // Severity multiplier
    const severityMultipliers: Record<string, number> = {
      info: 1,
      low: 1.2,
      medium: 1.5,
      high: 2,
      critical: 3,
    };

    score *= severityMultipliers[pattern.severity] || 1;

    // External access - removed invalid pattern.entityId reference
    // TODO: Add proper IP address validation when IP data is available

    return Math.min(Math.round(score * 10) / 10, 10); // Cap at 10
  }

  // Detect user anomalies
  private detectUserAnomalies(_pattern: any, groupedData: SecurityAuditEvent[]): string[] {
    const anomalies: string[] = [];

    // Implement anomaly detection logic based on user behavior patterns
    // This is a placeholder and should be replaced with actual implementation

    return anomalies;
  }
}

// SIEM Client Implementations
abstract class SIEMClient {
  protected config: SIEMIntegration;

  constructor(_config: SIEMIntegration) {
    this.config = config;
  }

  abstract sendEvents(events: SecurityAuditEvent[]): Promise<void>;
}

class SplunkClient extends SIEMClient {
  async sendEvents(events: SecurityAuditEvent[]): Promise<void> {
    const response = await fetch(`${this.config.endpoint}/services/collector/event`, {
      method: 'POST',
      headers: {
        Authorization: `Splunk ${this.config.authentication.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: events,
        sourcetype: 'riscura_audit',
        source: 'riscura',
      }),
    });

    if (!response.ok) {
      throw new Error(`Splunk API error: ${response.statusText}`);
    }
  }
}

class ElasticClient extends SIEMClient {
  async sendEvents(events: SecurityAuditEvent[]): Promise<void> {
    const body = events.flatMap((event) => [{ index: { _index: 'riscura-audit' } }, event]);

    const response = await fetch(`${this.config.endpoint}/_bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-ndjson',
        Authorization: `Basic ${Buffer.from(`${this.config.authentication.username}:${this.config.authentication.password}`).toString('base64')}`,
      },
      body: body.map((item) => JSON.stringify(item)).join('\n') + '\n',
    });

    if (!response.ok) {
      throw new Error(`Elasticsearch API error: ${response.statusText}`);
    }
  }
}

class QRadarClient extends SIEMClient {
  async sendEvents(events: SecurityAuditEvent[]): Promise<void> {
    for (const event of events) {
      const response = await fetch(`${this.config.endpoint}/api/siem/events`, {
        method: 'POST',
        headers: {
          SEC: this.config.authentication.token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        throw new Error(`QRadar API error: ${response.statusText}`);
      }
    }
  }
}

class SentinelClient extends SIEMClient {
  async sendEvents(events: SecurityAuditEvent[]): Promise<void> {
    const response = await fetch(`${this.config.endpoint}/api/logs`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.authentication.token}`,
        'Content-Type': 'application/json',
        'Log-Type': 'RiscuraAudit',
      },
      body: JSON.stringify(events),
    });

    if (!response.ok) {
      throw new Error(`Sentinel API error: ${response.statusText}`);
    }
  }
}

class SumoLogicClient extends SIEMClient {
  async sendEvents(events: SecurityAuditEvent[]): Promise<void> {
    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(events),
    });

    if (!response.ok) {
      throw new Error(`Sumo Logic API error: ${response.statusText}`);
    }
  }
}

class CustomSIEMClient extends SIEMClient {
  async sendEvents(events: SecurityAuditEvent[]): Promise<void> {
    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.authentication,
      },
      body: JSON.stringify(events),
    });

    if (!response.ok) {
      throw new Error(`Custom SIEM API error: ${response.statusText}`);
    }
  }
}

// Types
export interface AuthenticationAuditData {
  action: 'login' | 'logout' | 'mfa_challenge' | 'password_change' | 'session_expired';
  userId?: string;
  success: boolean;
  method: 'password' | 'sso' | 'oauth' | 'api_key' | 'certificate';
  provider?: string;
  mfaUsed?: boolean;
  deviceTrusted?: boolean;
  failureReason?: string;
  sessionDuration?: number;
  source: {
    ip: string;
    userAgent?: string;
    location?: GeoLocation;
    device?: DeviceInfo;
  };
}

export interface AuthorizationAuditData {
  action: 'access_granted' | 'access_denied' | 'permission_elevated' | 'role_changed';
  userId: string;
  resource: string;
  resourceId?: string;
  granted: boolean;
  permissions: string[];
  role: string;
  deniedReason?: string;
  elevatedAccess?: boolean;
  source: {
    ip: string;
    userAgent?: string;
  };
}

export interface DataAccessAuditData {
  action: 'read' | 'search' | 'export' | 'download' | 'view';
  userId: string;
  resource: string;
  resourceId?: string;
  dataType: string;
  classification?: 'public' | 'internal' | 'confidential' | 'restricted';
  recordCount?: number;
  query?: string;
  sensitive?: boolean;
  exported?: boolean;
  fields?: string[];
  source: {
    ip: string;
    userAgent?: string;
  };
}

export interface DataModificationAuditData {
  action: 'create' | 'update' | 'delete' | 'bulk_update' | 'bulk_delete';
  userId: string;
  resource: string;
  resourceId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  changedFields?: string[];
  reason?: string;
  approvedBy?: string;
  bulk?: boolean;
  recordCount?: number;
  source: {
    ip: string;
    userAgent?: string;
  };
}

export interface SystemAccessAuditData {
  action: 'api_call' | 'page_view' | 'feature_access' | 'download' | 'upload';
  userId?: string;
  resource?: string;
  component: string;
  feature?: string;
  parameters?: Record<string, any>;
  duration?: number;
  apiEndpoint?: string;
  statusCode?: number;
  source: {
    ip: string;
    userAgent?: string;
  };
}

export interface ConfigurationChangeAuditData {
  action: 'create' | 'update' | 'delete' | 'enable' | 'disable';
  userId: string;
  resource: string;
  resourceId?: string;
  configType: string;
  oldConfiguration?: Record<string, any>;
  newConfiguration?: Record<string, any>;
  changes?: string[];
  impact?: string;
  approvedBy?: string;
  rollbackPlan?: string;
  source: {
    ip: string;
    userAgent?: string;
  };
}

export interface SecurityEventAuditData {
  action: 'threat_detected' | 'attack_blocked' | 'suspicious_activity' | 'policy_violation';
  userId?: string;
  resource?: string;
  threatType?: string;
  threatLevel?: 'low' | 'medium' | 'high' | 'critical';
  indicators?: string[];
  response?: string;
  blocked?: boolean;
  quarantined?: boolean;
  mitigations?: string[];
  severity?: 'info' | 'low' | 'medium' | 'high' | 'critical';
  source: {
    ip: string;
    userAgent?: string;
  };
}

export interface AuditSearchQuery {
  userId?: string;
  category?: string;
  action?: string;
  resource?: string;
  outcome?: string;
  severity?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
  searchText?: string;
}

export interface AuditSearchResult {
  events: SecurityAuditEvent[];
  total: number;
  offset: number;
  limit: number;
}

export interface AuditMetrics {
  period: { start: Date; end: Date };
  totalEvents: number;
  categoryCounts: Record<string, number>;
  severityCounts: Record<string, number>;
  outcomeCounts: Record<string, number>;
  averageRiskScore: number;
}

// Factory function
export const createAuditService = (_config: AuditConfiguration): AuditService => {
  return new AuditService(config);
};

// Default audit configuration
export const createDefaultAuditConfig = (): AuditConfiguration => ({
  enabled: true,
  retentionDays: 2555, // 7 years
  logLevel: 'standard',
  eventTypes: [
    {
      category: 'authentication',
      actions: ['*'],
      includeDetails: true,
      sensitive: false,
    },
    {
      category: 'authorization',
      actions: ['*'],
      includeDetails: true,
      sensitive: false,
    },
    {
      category: 'data_access',
      actions: ['*'],
      includeDetails: true,
      sensitive: true,
    },
    {
      category: 'data_modification',
      actions: ['*'],
      includeDetails: true,
      sensitive: true,
    },
    {
      category: 'configuration_change',
      actions: ['*'],
      includeDetails: true,
      sensitive: false,
    },
    {
      category: 'security_event',
      actions: ['*'],
      includeDetails: true,
      sensitive: false,
    },
  ],
  destinations: [
    {
      type: 'database',
      configuration: {},
      enabled: true,
      format: 'json',
      encryption: false,
    },
  ],
  realTimeAlerting: true,
  integrityProtection: true,
  siemIntegration: {
    enabled: false,
    provider: 'custom',
    endpoint: '',
    authentication: {},
    batchSize: 100,
    flushInterval: 60,
    filters: [],
  },
});
