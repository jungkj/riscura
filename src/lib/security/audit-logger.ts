// Comprehensive Audit Logging System for Security and Compliance
import { NextRequest } from 'next/server';

export interface AuditEvent {
  id: string;
  timestamp: number;
  eventType: AuditEventType;
  category: AuditCategory;
  severity: AuditSeverity;
  userId?: string;
  sessionId?: string;
  clientIP: string;
  userAgent: string;
  resource: string;
  action: string;
  outcome: 'success' | 'failure' | 'partial';
  details: Record<string, any>;
  metadata: {
    requestId?: string;
    correlationId?: string;
    source: string;
    environment: string;
    version: string;
  };
  sensitiveFields?: string[];
  retentionDays: number;
}

export type AuditEventType =
  | 'authentication'
  | 'authorization'
  | 'data_access'
  | 'data_modification'
  | 'system_access'
  | 'configuration_change'
  | 'security_event'
  | 'compliance_event'
  | 'user_activity'
  | 'api_access'
  | 'file_access'
  | 'admin_action';

export type AuditCategory =
  | 'security'
  | 'compliance'
  | 'operational'
  | 'business'
  | 'technical'
  | 'privacy';

export type AuditSeverity =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'info';

export interface AuditFilter {
  startDate?: Date;
  endDate?: Date;
  eventTypes?: AuditEventType[];
  categories?: AuditCategory[];
  severities?: AuditSeverity[];
  userIds?: string[];
  clientIPs?: string[];
  resources?: string[];
  outcomes?: Array<'success' | 'failure' | 'partial'>;
  searchText?: string;
}

export interface AuditReport {
  totalEvents: number;
  eventsByType: Record<AuditEventType, number>;
  eventsByCategory: Record<AuditCategory, number>;
  eventsBySeverity: Record<AuditSeverity, number>;
  eventsByOutcome: Record<string, number>;
  topUsers: Array<{ userId: string; count: number }>;
  topIPs: Array<{ ip: string; count: number }>;
  topResources: Array<{ resource: string; count: number }>;
  timeline: Array<{ date: string; count: number }>;
  suspiciousActivities: AuditEvent[];
}

export interface AuditLoggerConfig {
  enableConsoleLogging: boolean;
  enableFileLogging: boolean;
  enableDatabaseLogging: boolean;
  enableRemoteLogging: boolean;
  logLevel: AuditSeverity;
  maxLogFileSize: number;
  maxLogFiles: number;
  remoteEndpoint?: string;
  encryptLogs: boolean;
  compressLogs: boolean;
  bufferSize: number;
  flushInterval: number;
  enableRealTimeAlerts: boolean;
  alertThresholds: Record<AuditEventType, number>;
}

class AuditLogger {
  private config: AuditLoggerConfig;
  private eventBuffer: AuditEvent[] = [];
  private eventStore: Map<string, AuditEvent> = new Map();
  private correlationMap: Map<string, string[]> = new Map();
  private flushTimer?: NodeJS.Timeout;
  private alertCounts: Record<AuditEventType, number> = {} as any;
  private lastFlush = Date.now();

  constructor(config?: Partial<AuditLoggerConfig>) {
    this.config = {
      enableConsoleLogging: true,
      enableFileLogging: process.env.NODE_ENV === 'production',
      enableDatabaseLogging: true,
      enableRemoteLogging: process.env.NODE_ENV === 'production',
      logLevel: 'info',
      maxLogFileSize: 100 * 1024 * 1024, // 100MB
      maxLogFiles: 10,
      encryptLogs: process.env.NODE_ENV === 'production',
      compressLogs: true,
      bufferSize: 1000,
      flushInterval: 30000, // 30 seconds
      enableRealTimeAlerts: true,
      alertThresholds: {
        authentication: 10,
        authorization: 5,
        security_event: 1,
        data_access: 100,
        data_modification: 50,
        system_access: 20,
        configuration_change: 5,
        compliance_event: 1,
        user_activity: 1000,
        api_access: 500,
        file_access: 200,
        admin_action: 10,
      },
      ...config,
    };

    this.initializeLogger();
  }

  private initializeLogger(): void {
    // Setup flush timer
    this.flushTimer = setInterval(() => {
      this.flushBuffer();
    }, this.config.flushInterval);

    // Initialize alert counters
    Object.keys(this.config.alertThresholds).forEach(eventType => {
      this.alertCounts[eventType as AuditEventType] = 0;
    });

    // Setup graceful shutdown
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
  }

  // Main logging function
  public async log(event: Partial<AuditEvent>): Promise<void> {
    const fullEvent: AuditEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      clientIP: '127.0.0.1',
      userAgent: 'Unknown',
      resource: 'Unknown',
      action: 'Unknown',
      outcome: 'success',
      details: {},
      retentionDays: this.getRetentionDays(event.category || 'operational'),
      metadata: {
        source: 'audit-logger',
        environment: process.env.NODE_ENV || 'development',
        version: process.env.APP_VERSION || '1.0.0',
      },
      ...event,
    } as AuditEvent;

    // Validate event
    if (!this.validateEvent(fullEvent)) {
      console.error('Invalid audit event:', fullEvent);
      return;
    }

    // Check log level
    if (!this.shouldLog(fullEvent.severity)) {
      return;
    }

    // Add to buffer
    this.eventBuffer.push(fullEvent);
    this.eventStore.set(fullEvent.id, fullEvent);

    // Handle correlation
    if (fullEvent.metadata.correlationId) {
      this.addToCorrelation(fullEvent.metadata.correlationId, fullEvent.id);
    }

    // Console logging (immediate)
    if (this.config.enableConsoleLogging) {
      this.logToConsole(fullEvent);
    }

    // Real-time alerts
    if (this.config.enableRealTimeAlerts) {
      this.checkAlertThresholds(fullEvent);
    }

    // Flush buffer if full
    if (this.eventBuffer.length >= this.config.bufferSize) {
      await this.flushBuffer();
    }
  }

  // Convenience methods for different event types
  public async logAuthentication(
    userId: string,
    action: string,
    outcome: 'success' | 'failure',
    details: Record<string, any> = {},
    request?: NextRequest
  ): Promise<void> {
    await this.log({
      eventType: 'authentication',
      category: 'security',
      severity: outcome === 'failure' ? 'medium' : 'info',
      userId,
      action,
      outcome,
      resource: 'authentication',
      details,
      ...this.extractRequestInfo(request),
    });
  }

  public async logAuthorization(
    userId: string,
    resource: string,
    action: string,
    outcome: 'success' | 'failure',
    details: Record<string, any> = {},
    request?: NextRequest
  ): Promise<void> {
    await this.log({
      eventType: 'authorization',
      category: 'security',
      severity: outcome === 'failure' ? 'high' : 'info',
      userId,
      resource,
      action,
      outcome,
      details,
      ...this.extractRequestInfo(request),
    });
  }

  public async logDataAccess(
    userId: string,
    resource: string,
    action: string,
    outcome: 'success' | 'failure' | 'partial' = 'success',
    details: Record<string, any> = {},
    request?: NextRequest
  ): Promise<void> {
    await this.log({
      eventType: 'data_access',
      category: 'compliance',
      severity: 'info',
      userId,
      resource,
      action,
      outcome,
      details,
      retentionDays: 2555, // 7 years for compliance
      ...this.extractRequestInfo(request),
    });
  }

  public async logDataModification(
    userId: string,
    resource: string,
    action: string,
    outcome: 'success' | 'failure' | 'partial' = 'success',
    details: Record<string, any> = {},
    request?: NextRequest
  ): Promise<void> {
    await this.log({
      eventType: 'data_modification',
      category: 'compliance',
      severity: outcome === 'failure' ? 'medium' : 'info',
      userId,
      resource,
      action,
      outcome,
      details,
      retentionDays: 2555, // 7 years for compliance
      ...this.extractRequestInfo(request),
    });
  }

  public async logSecurityEvent(
    eventType: string,
    severity: AuditSeverity,
    details: Record<string, any> = {},
    request?: NextRequest
  ): Promise<void> {
    await this.log({
      eventType: 'security_event',
      category: 'security',
      severity,
      resource: 'security',
      action: eventType,
      outcome: 'success',
      details,
      ...this.extractRequestInfo(request),
    });
  }

  public async logAdminAction(
    userId: string,
    action: string,
    resource: string,
    outcome: 'success' | 'failure' | 'partial' = 'success',
    details: Record<string, any> = {},
    request?: NextRequest
  ): Promise<void> {
    await this.log({
      eventType: 'admin_action',
      category: 'operational',
      severity: 'medium',
      userId,
      resource,
      action,
      outcome,
      details,
      retentionDays: 2555, // 7 years for admin actions
      ...this.extractRequestInfo(request),
    });
  }

  public async logAPIAccess(
    endpoint: string,
    method: string,
    statusCode: number,
    userId?: string,
    details: Record<string, any> = {},
    request?: NextRequest
  ): Promise<void> {
    const outcome = statusCode < 400 ? 'success' : 'failure';
    const severity = statusCode >= 500 ? 'high' : statusCode >= 400 ? 'medium' : 'info';

    await this.log({
      eventType: 'api_access',
      category: 'technical',
      severity,
      userId,
      resource: endpoint,
      action: method,
      outcome,
      details: {
        statusCode,
        ...details,
      },
      ...this.extractRequestInfo(request),
    });
  }

  // Extract information from NextRequest
  private extractRequestInfo(request?: NextRequest): Partial<AuditEvent> {
    if (!request) return {};

    return {
      clientIP: this.getClientIP(request),
      userAgent: request.headers.get('user-agent') || 'Unknown',
      sessionId: request.cookies.get('session-id')?.value,
      metadata: {
        requestId: request.headers.get('x-request-id') || undefined,
        source: 'web-request',
        environment: process.env.NODE_ENV || 'development',
        version: process.env.APP_VERSION || '1.0.0',
      },
    };
  }

  // Get client IP from request
  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfConnectingIP = request.headers.get('cf-connecting-ip');
    
    if (cfConnectingIP) return cfConnectingIP;
    if (realIP) return realIP;
    if (forwarded) return forwarded.split(',')[0].trim();
    
    return request.ip || '127.0.0.1';
  }

  // Generate unique event ID
  private generateEventId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2);
    return `audit_${timestamp}_${random}`;
  }

  // Validate audit event
  private validateEvent(event: AuditEvent): boolean {
    if (!event.eventType || !event.category || !event.severity) {
      return false;
    }

    if (!event.resource || !event.action) {
      return false;
    }

    if (!['success', 'failure', 'partial'].includes(event.outcome)) {
      return false;
    }

    return true;
  }

  // Check if event should be logged based on severity
  private shouldLog(severity: AuditSeverity): boolean {
    const levels = ['info', 'low', 'medium', 'high', 'critical'];
    const configLevel = levels.indexOf(this.config.logLevel);
    const eventLevel = levels.indexOf(severity);
    
    return eventLevel >= configLevel;
  }

  // Get retention days based on category
  private getRetentionDays(category: AuditCategory): number {
    const retentionMap: Record<AuditCategory, number> = {
      security: 2555, // 7 years
      compliance: 2555, // 7 years
      operational: 365, // 1 year
      business: 1095, // 3 years
      technical: 90, // 3 months
      privacy: 2555, // 7 years
    };

    return retentionMap[category] || 365;
  }

  // Add event to correlation group
  private addToCorrelation(correlationId: string, eventId: string): void {
    if (!this.correlationMap.has(correlationId)) {
      this.correlationMap.set(correlationId, []);
    }
    this.correlationMap.get(correlationId)!.push(eventId);
  }

  // Log to console with formatting
  private logToConsole(event: AuditEvent): void {
    const timestamp = new Date(event.timestamp).toISOString();
    const level = event.severity.toUpperCase();
    const message = `[${timestamp}] ${level} ${event.eventType}:${event.action} - ${event.outcome}`;
    
    const logData = {
      ...event,
      // Mask sensitive fields
      details: this.maskSensitiveFields(event.details, event.sensitiveFields),
    };

    switch (event.severity) {
      case 'critical':
      case 'high':
        console.error(message, logData);
        break;
      case 'medium':
        console.warn(message, logData);
        break;
      default:
        console.log(message, logData);
    }
  }

  // Mask sensitive fields in log data
  private maskSensitiveFields(
    data: Record<string, any>,
    sensitiveFields?: string[]
  ): Record<string, any> {
    if (!sensitiveFields || sensitiveFields.length === 0) {
      return data;
    }

    const masked = { ...data };
    sensitiveFields.forEach(field => {
      if (field in masked) {
        masked[field] = '***MASKED***';
      }
    });

    return masked;
  }

  // Check alert thresholds
  private checkAlertThresholds(event: AuditEvent): void {
    this.alertCounts[event.eventType]++;
    
    const threshold = this.config.alertThresholds[event.eventType];
    if (this.alertCounts[event.eventType] >= threshold) {
      this.sendAlert(event.eventType, this.alertCounts[event.eventType]);
      this.alertCounts[event.eventType] = 0; // Reset counter
    }
  }

  // Send alert for threshold breach
  private async sendAlert(eventType: AuditEventType, count: number): Promise<void> {
    const alert = {
      type: 'audit_threshold_breach',
      eventType,
      count,
      threshold: this.config.alertThresholds[eventType],
      timestamp: Date.now(),
    };

    console.warn('Audit alert:', alert);

    // Send to monitoring system
    if (this.config.remoteEndpoint) {
      try {
        await fetch(`${this.config.remoteEndpoint}/alerts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alert),
        });
      } catch (error) {
        console.error('Failed to send audit alert:', error);
      }
    }
  }

  // Flush event buffer
  private async flushBuffer(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    const events = [...this.eventBuffer];
    this.eventBuffer = [];

    try {
      // File logging
      if (this.config.enableFileLogging) {
        await this.writeToFile(events);
      }

      // Database logging
      if (this.config.enableDatabaseLogging) {
        await this.writeToDatabase(events);
      }

      // Remote logging
      if (this.config.enableRemoteLogging && this.config.remoteEndpoint) {
        await this.writeToRemote(events);
      }

      this.lastFlush = Date.now();
    } catch (error) {
      console.error('Failed to flush audit events:', error);
      // Put events back in buffer for retry
      this.eventBuffer.unshift(...events);
    }
  }

  // Write events to file
  private async writeToFile(events: AuditEvent[]): Promise<void> {
    // Implementation would depend on file system access
    // In Next.js, this might be handled by a separate service
    console.log(`Writing ${events.length} events to file`);
  }

  // Write events to database
  private async writeToDatabase(events: AuditEvent[]): Promise<void> {
    // Implementation would use your database client
    console.log(`Writing ${events.length} events to database`);
  }

  // Write events to remote endpoint
  private async writeToRemote(events: AuditEvent[]): Promise<void> {
    if (!this.config.remoteEndpoint) return;

    try {
      await fetch(`${this.config.remoteEndpoint}/audit-events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AUDIT_API_KEY}`,
        },
        body: JSON.stringify({ events }),
      });
    } catch (error) {
      console.error('Failed to write to remote endpoint:', error);
      throw error;
    }
  }

  // Query audit events
  public async query(filter: AuditFilter = {}): Promise<AuditEvent[]> {
    let events = Array.from(this.eventStore.values());

    // Apply filters
    if (filter.startDate) {
      events = events.filter(e => e.timestamp >= filter.startDate!.getTime());
    }

    if (filter.endDate) {
      events = events.filter(e => e.timestamp <= filter.endDate!.getTime());
    }

    if (filter.eventTypes && filter.eventTypes.length > 0) {
      events = events.filter(e => filter.eventTypes!.includes(e.eventType));
    }

    if (filter.categories && filter.categories.length > 0) {
      events = events.filter(e => filter.categories!.includes(e.category));
    }

    if (filter.severities && filter.severities.length > 0) {
      events = events.filter(e => filter.severities!.includes(e.severity));
    }

    if (filter.userIds && filter.userIds.length > 0) {
      events = events.filter(e => e.userId && filter.userIds!.includes(e.userId));
    }

    if (filter.clientIPs && filter.clientIPs.length > 0) {
      events = events.filter(e => filter.clientIPs!.includes(e.clientIP));
    }

    if (filter.resources && filter.resources.length > 0) {
      events = events.filter(e => filter.resources!.includes(e.resource));
    }

    if (filter.outcomes && filter.outcomes.length > 0) {
      events = events.filter(e => filter.outcomes!.includes(e.outcome));
    }

    if (filter.searchText) {
      const searchLower = filter.searchText.toLowerCase();
      events = events.filter(e =>
        e.action.toLowerCase().includes(searchLower) ||
        e.resource.toLowerCase().includes(searchLower) ||
        JSON.stringify(e.details).toLowerCase().includes(searchLower)
      );
    }

    return events.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Generate audit report
  public async generateReport(filter: AuditFilter = {}): Promise<AuditReport> {
    const events = await this.query(filter);

    const report: AuditReport = {
      totalEvents: events.length,
      eventsByType: {} as Record<AuditEventType, number>,
      eventsByCategory: {} as Record<AuditCategory, number>,
      eventsBySeverity: {} as Record<AuditSeverity, number>,
      eventsByOutcome: {},
      topUsers: [],
      topIPs: [],
      topResources: [],
      timeline: [],
      suspiciousActivities: [],
    };

    // Count by type, category, severity, outcome
    events.forEach(event => {
      report.eventsByType[event.eventType] = (report.eventsByType[event.eventType] || 0) + 1;
      report.eventsByCategory[event.category] = (report.eventsByCategory[event.category] || 0) + 1;
      report.eventsBySeverity[event.severity] = (report.eventsBySeverity[event.severity] || 0) + 1;
      report.eventsByOutcome[event.outcome] = (report.eventsByOutcome[event.outcome] || 0) + 1;
    });

    // Top users, IPs, resources
    const userCounts = new Map<string, number>();
    const ipCounts = new Map<string, number>();
    const resourceCounts = new Map<string, number>();

    events.forEach(event => {
      if (event.userId) {
        userCounts.set(event.userId, (userCounts.get(event.userId) || 0) + 1);
      }
      ipCounts.set(event.clientIP, (ipCounts.get(event.clientIP) || 0) + 1);
      resourceCounts.set(event.resource, (resourceCounts.get(event.resource) || 0) + 1);
    });

    report.topUsers = Array.from(userCounts.entries())
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    report.topIPs = Array.from(ipCounts.entries())
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    report.topResources = Array.from(resourceCounts.entries())
      .map(([resource, count]) => ({ resource, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Timeline (daily counts)
    const dailyCounts = new Map<string, number>();
    events.forEach(event => {
      const date = new Date(event.timestamp).toISOString().split('T')[0];
      dailyCounts.set(date, (dailyCounts.get(date) || 0) + 1);
    });

    report.timeline = Array.from(dailyCounts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Suspicious activities (high/critical severity failures)
    report.suspiciousActivities = events.filter(event =>
      (event.severity === 'high' || event.severity === 'critical') &&
      event.outcome === 'failure'
    ).slice(0, 20);

    return report;
  }

  // Get correlated events
  public getCorrelatedEvents(correlationId: string): AuditEvent[] {
    const eventIds = this.correlationMap.get(correlationId) || [];
    return eventIds
      .map(id => this.eventStore.get(id))
      .filter(event => event !== undefined) as AuditEvent[];
  }

  // Shutdown logger
  public async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    // Final flush
    await this.flushBuffer();
    
    console.log('Audit logger shutdown complete');
  }

  // Get logger statistics
  public getStatistics(): {
    totalEvents: number;
    bufferSize: number;
    lastFlush: number;
    alertCounts: Record<AuditEventType, number>;
  } {
    return {
      totalEvents: this.eventStore.size,
      bufferSize: this.eventBuffer.length,
      lastFlush: this.lastFlush,
      alertCounts: { ...this.alertCounts },
    };
  }
}

// Create singleton instance
export const auditLogger = new AuditLogger();

// Convenience functions
export const logAuth = auditLogger.logAuthentication.bind(auditLogger);
export const logAuthz = auditLogger.logAuthorization.bind(auditLogger);
export const logDataAccess = auditLogger.logDataAccess.bind(auditLogger);
export const logDataModification = auditLogger.logDataModification.bind(auditLogger);
export const logSecurityEvent = auditLogger.logSecurityEvent.bind(auditLogger);
export const logAdminAction = auditLogger.logAdminAction.bind(auditLogger);
export const logAPIAccess = auditLogger.logAPIAccess.bind(auditLogger);

// Export class for custom instances
export { AuditLogger }; 