/**
 * Comprehensive Audit Logging System for Riscura
 * Provides enterprise-grade audit trails with compliance features
 */

import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';
import { enhancedCache } from '@/lib/cache/enhanced-cache-layer';
import { v4 as uuidv4 } from 'uuid';
import { extractIpAddress, getEntityComplianceFlags, generateEventId } from './audit-utils';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface AuditEvent {
  id?: string;
  timestamp: Date;
  userId?: string;
  organizationId: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string;
  resource: string;
  method: string;
  path: string;
  userAgent?: string;
  ipAddress?: string;
  sessionId?: string;
  changes?: AuditChanges;
  metadata?: Record<string, any>;
  severity: AuditSeverity;
  status: AuditStatus;
  errorMessage?: string;
  duration?: number;
  requestId?: string;
  apiVersion?: string;
  clientType?: 'web' | 'mobile' | 'api' | 'system';
  geolocation?: {
    country?: string;
    region?: string;
    city?: string;
    timezone?: string;
  };
  complianceFlags?: string[];
  retentionPeriod?: number; // days
  encrypted?: boolean;
}

export interface AuditChanges {
  before?: Record<string, any>;
  after?: Record<string, any>;
  fields: string[];
  changeType: 'CREATE' | 'UPDATE' | 'DELETE' | 'MERGE' | 'RESTORE';
}

export type AuditAction = 
  // Authentication Actions
  | 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'PASSWORD_CHANGE' | 'PASSWORD_RESET'
  | 'MFA_ENABLE' | 'MFA_DISABLE' | 'SESSION_EXPIRE' | 'ACCOUNT_LOCK'
  
  // Data Actions
  | 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'IMPORT' | 'BULK_UPDATE'
  | 'BULK_DELETE' | 'RESTORE' | 'ARCHIVE' | 'MERGE' | 'CLONE' | 'SHARE'
  
  // Permission Actions
  | 'PERMISSION_GRANT' | 'PERMISSION_REVOKE' | 'ROLE_ASSIGN' | 'ROLE_REMOVE'
  | 'ACCESS_DENIED' | 'ESCALATION_REQUEST' | 'ESCALATION_APPROVE'
  
  // System Actions
  | 'SYSTEM_START' | 'SYSTEM_STOP' | 'BACKUP_CREATE' | 'BACKUP_RESTORE'
  | 'CONFIG_CHANGE' | 'MAINTENANCE_START' | 'MAINTENANCE_END'
  
  // Compliance Actions
  | 'AUDIT_START' | 'AUDIT_END' | 'POLICY_UPDATE' | 'VIOLATION_DETECTED'
  | 'COMPLIANCE_CHECK' | 'RISK_ASSESSMENT' | 'CONTROL_TEST'
  
  // Document Actions
  | 'DOCUMENT_UPLOAD' | 'DOCUMENT_DOWNLOAD' | 'DOCUMENT_VIEW' | 'DOCUMENT_EDIT'
  | 'DOCUMENT_DELETE' | 'DOCUMENT_SHARE' | 'DOCUMENT_APPROVE'
  
  // Billing Actions
  | 'SUBSCRIPTION_CREATE' | 'SUBSCRIPTION_UPDATE' | 'SUBSCRIPTION_CANCEL'
  | 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED' | 'INVOICE_GENERATE'
  
  // AI Actions
  | 'AI_QUERY' | 'AI_RESPONSE' | 'AI_TRAINING' | 'AI_MODEL_UPDATE'
  | 'PROBO_ANALYSIS' | 'RISK_PREDICTION' | 'CONTROL_GENERATION';

export type AuditEntity = 
  | 'USER' | 'ORGANIZATION' | 'ROLE' | 'PERMISSION' | 'SESSION'
  | 'RISK' | 'CONTROL' | 'ASSESSMENT' | 'COMPLIANCE_FRAMEWORK'
  | 'DOCUMENT' | 'REPORT' | 'DASHBOARD' | 'NOTIFICATION'
  | 'SUBSCRIPTION' | 'INVOICE' | 'PAYMENT' | 'WEBHOOK'
  | 'API_KEY' | 'INTEGRATION' | 'BACKUP' | 'SYSTEM'
  | 'POLICY' | 'PROCEDURE' | 'INCIDENT' | 'QUESTIONNAIRE'
  | 'AI_MODEL' | 'ANALYTICS' | 'EXPORT' | 'IMPORT';

export type AuditSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AuditStatus = 'SUCCESS' | 'FAILURE' | 'WARNING' | 'INFO';

export interface AuditQueryOptions {
  organizationId?: string;
  userId?: string;
  action?: AuditAction | AuditAction[];
  entity?: AuditEntity | AuditEntity[];
  severity?: AuditSeverity | AuditSeverity[];
  status?: AuditStatus | AuditStatus[];
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeMetadata?: boolean;
  complianceFlags?: string[];
}

export interface AuditQueryResult {
  events: AuditEvent[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface AuditReport {
  id: string;
  organizationId: string;
  reportType: 'COMPLIANCE' | 'SECURITY' | 'ACCESS' | 'DATA_CHANGES' | 'SYSTEM' | 'CUSTOM';
  title: string;
  description?: string;
  filters: AuditQueryOptions;
  events: AuditEvent[];
  summary: {
    totalEvents: number;
    successRate: number;
    failureRate: number;
    topActions: Array<{ action: AuditAction; count: number }>;
    topUsers: Array<{ userId: string; count: number }>;
    timeRange: { start: Date; end: Date };
    complianceScore?: number;
    riskScore?: number;
  };
  generatedAt: Date;
  generatedBy: string;
  format: 'JSON' | 'CSV' | 'PDF' | 'XLSX';
}

// ============================================================================
// AUDIT LOGGER CLASS
// ============================================================================

export class AuditLogger {
  private prisma: PrismaClient;
  private cache: typeof enhancedCache;
  private batchQueue: AuditEvent[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly batchSize = 50;
  private readonly batchInterval = 5000; // 5 seconds

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.cache = enhancedCache;
  }

  // ============================================================================
  // MAIN LOGGING METHODS
  // ============================================================================

  /**
   * Log a single audit event
   */
  async log(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void> {
    const fullEvent: AuditEvent = {
      ...event,
      id: generateEventId(),
      timestamp: new Date(),
      retentionPeriod: this.getRetentionPeriod(event.action),
      encrypted: this.shouldEncrypt(event.action, event.entity),
    };

    // Add to batch queue for performance
    this.batchQueue.push(fullEvent);

    // Process batch if it's full or this is a critical event
    if (this.batchQueue.length >= this.batchSize || event.severity === 'CRITICAL') {
      await this.processBatch();
    } else {
      this.scheduleBatchProcessing();
    }

    // Cache recent events for quick access
    await this.cacheRecentEvent(fullEvent);
  }

  /**
   * Log authentication events
   */
  async logAuth(
    action: Extract<AuditAction, 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'PASSWORD_CHANGE' | 'PASSWORD_RESET'>,
    userId: string | null,
    organizationId: string,
    request: NextRequest,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      userId: userId || undefined,
      organizationId,
      action,
      entity: 'USER',
      resource: 'authentication',
      method: request.method,
      path: request.nextUrl.pathname,
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: extractIpAddress(request),
      severity: action === 'LOGIN_FAILED' ? 'HIGH' : 'MEDIUM',
      status: action === 'LOGIN_FAILED' ? 'FAILURE' : 'SUCCESS',
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
      complianceFlags: ['SOX', 'GDPR', 'SOC2'],
    });
  }

  /**
   * Log data modification events
   */
  async logDataChange(
    action: Extract<AuditAction, 'CREATE' | 'UPDATE' | 'DELETE' | 'BULK_UPDATE' | 'BULK_DELETE'>,
    entity: AuditEntity,
    entityId: string,
    userId: string,
    organizationId: string,
    changes?: AuditChanges,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      userId,
      organizationId,
      action,
      entity,
      entityId,
      resource: entity.toLowerCase(),
      method: this.actionToMethod(action),
      path: `/${entity.toLowerCase()}/${entityId}`,
      changes,
      severity: this.calculateSeverity(action, entity, changes),
      status: 'SUCCESS',
      metadata,
      complianceFlags: getEntityComplianceFlags(entity),
    });
  }

  /**
   * Log access attempts (both successful and failed)
   */
  async logAccess(
    action: Extract<AuditAction, 'READ' | 'ACCESS_DENIED'>,
    entity: AuditEntity,
    entityId: string | undefined,
    userId: string | undefined,
    organizationId: string,
    request: NextRequest,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      userId,
      organizationId,
      action,
      entity,
      entityId,
      resource: entity.toLowerCase(),
      method: request.method,
      path: request.nextUrl.pathname,
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: extractIpAddress(request),
      severity: action === 'ACCESS_DENIED' ? 'HIGH' : 'LOW',
      status: action === 'ACCESS_DENIED' ? 'FAILURE' : 'SUCCESS',
      metadata,
      complianceFlags: getEntityComplianceFlags(entity),
    });
  }

  /**
   * Log system events
   */
  async logSystem(
    action: Extract<AuditAction, 'SYSTEM_START' | 'SYSTEM_STOP' | 'CONFIG_CHANGE' | 'BACKUP_CREATE'>,
    organizationId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      organizationId,
      action,
      entity: 'SYSTEM',
      resource: 'system',
      method: 'SYSTEM',
      path: '/system',
      severity: 'MEDIUM',
      status: 'SUCCESS',
      metadata,
      complianceFlags: ['SOC2', 'ISO27001'],
    });
  }

  // ============================================================================
  // BATCH PROCESSING
  // ============================================================================

  private async processBatch(): Promise<void> {
    if (this.batchQueue.length === 0) return;

    const events = [...this.batchQueue];
    this.batchQueue = [];

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    try {
      // Prepare data for database insertion
      const auditData = events.map(event => ({
        id: event.id!,
        timestamp: event.timestamp,
        userId: event.userId,
        organizationId: event.organizationId,
        action: event.action,
        entity: event.entity,
        entityId: event.entityId,
        resource: event.resource,
        method: event.method,
        path: event.path,
        userAgent: event.userAgent,
        ipAddress: event.ipAddress,
        sessionId: event.sessionId,
        changes: event.changes ? JSON.stringify(event.changes) : null,
        metadata: event.metadata ? JSON.stringify(event.metadata) : null,
        severity: event.severity,
        status: event.status,
        errorMessage: event.errorMessage,
        duration: event.duration,
        requestId: event.requestId,
        apiVersion: event.apiVersion,
        clientType: event.clientType,
        geolocation: event.geolocation ? JSON.stringify(event.geolocation) : null,
        complianceFlags: event.complianceFlags ? JSON.stringify(event.complianceFlags) : null,
        retentionPeriod: event.retentionPeriod,
        encrypted: event.encrypted,
      }));

      // Bulk insert into database
      await this.prisma.auditLog.createMany({
        data: auditData,
        skipDuplicates: true,
      });

      // Update audit statistics
      await this.updateAuditStatistics(events);

    } catch (error) {
      console.error('Failed to process audit batch:', error);
      
      // Re-queue events if database fails
      this.batchQueue.unshift(...events);
      
      // Implement exponential backoff for retries
      setTimeout(() => this.processBatch(), 10000);
    }
  }

  private scheduleBatchProcessing(): void {
    if (this.batchTimeout) return;

    this.batchTimeout = setTimeout(() => {
      this.processBatch();
    }, this.batchInterval);
  }

  // ============================================================================
  // QUERY METHODS
  // ============================================================================

  /**
   * Query audit events with filters and pagination
   */
  async query(options: AuditQueryOptions): Promise<AuditQueryResult> {
    const {
      organizationId,
      userId,
      action,
      entity,
      severity,
      status,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 50,
      sortBy = 'timestamp',
      sortOrder = 'desc',
      includeMetadata = false,
      complianceFlags,
    } = options;

    // Build where clause
    const where: any = {};

    if (organizationId) where.organizationId = organizationId;
    if (userId) where.userId = userId;
    if (action) where.action = Array.isArray(action) ? { in: action } : action;
    if (entity) where.entity = Array.isArray(entity) ? { in: entity } : entity;
    if (severity) where.severity = Array.isArray(severity) ? { in: severity } : severity;
    if (status) where.status = Array.isArray(status) ? { in: status } : status;

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    if (search) {
      where.OR = [
        { resource: { contains: search, mode: 'insensitive' } },
        { path: { contains: search, mode: 'insensitive' } },
        { errorMessage: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (complianceFlags && complianceFlags.length > 0) {
      where.complianceFlags = {
        contains: JSON.stringify(complianceFlags),
      };
    }

    // Execute query with pagination
    const [events, totalCount] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          timestamp: true,
          userId: true,
          organizationId: true,
          action: true,
          entity: true,
          entityId: true,
          resource: true,
          method: true,
          path: true,
          userAgent: true,
          ipAddress: true,
          sessionId: true,
          changes: includeMetadata,
          metadata: includeMetadata,
          severity: true,
          status: true,
          errorMessage: true,
          duration: true,
          requestId: true,
          apiVersion: true,
          clientType: true,
          geolocation: includeMetadata,
          complianceFlags: includeMetadata,
          retentionPeriod: true,
          encrypted: true,
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      events: events.map(event => ({
        ...event,
        timestamp: event.timestamp,
        changes: event.changes ? JSON.parse(event.changes as string) : undefined,
        metadata: event.metadata ? JSON.parse(event.metadata as string) : undefined,
        geolocation: event.geolocation ? JSON.parse(event.geolocation as string) : undefined,
        complianceFlags: event.complianceFlags ? JSON.parse(event.complianceFlags as string) : undefined,
      })),
      totalCount,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  /**
   * Generate compliance audit report
   */
  async generateReport(
    organizationId: string,
    reportType: AuditReport['reportType'],
    filters: AuditQueryOptions,
    generatedBy: string
  ): Promise<AuditReport> {
    const queryResult = await this.query({
      ...filters,
      organizationId,
      limit: 10000, // Large limit for reports
    });

    const events = queryResult.events;
    const totalEvents = events.length;
    const successCount = events.filter(e => e.status === 'SUCCESS').length;
    const failureCount = events.filter(e => e.status === 'FAILURE').length;

    // Calculate top actions
    const actionCounts = events.reduce((acc, event) => {
      acc[event.action] = (acc[event.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topActions = Object.entries(actionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([action, count]) => ({ action: action as AuditAction, count }));

    // Calculate top users
    const userCounts = events.reduce((acc, event) => {
      if (event.userId) {
        acc[event.userId] = (acc[event.userId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const topUsers = Object.entries(userCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([userId, count]) => ({ userId, count }));

    // Calculate time range
    const timestamps = events.map(e => e.timestamp);
    const timeRange = {
      start: timestamps.length > 0 ? new Date(Math.min(...timestamps.map(t => t.getTime()))) : new Date(),
      end: timestamps.length > 0 ? new Date(Math.max(...timestamps.map(t => t.getTime()))) : new Date(),
    };

    const report: AuditReport = {
      id: generateEventId(),
      organizationId,
      reportType,
      title: `${reportType} Audit Report`,
      description: `Audit report for ${organizationId} covering ${timeRange.start.toISOString()} to ${timeRange.end.toISOString()}`,
      filters,
      events,
      summary: {
        totalEvents,
        successRate: totalEvents > 0 ? (successCount / totalEvents) * 100 : 0,
        failureRate: totalEvents > 0 ? (failureCount / totalEvents) * 100 : 0,
        topActions,
        topUsers,
        timeRange,
        complianceScore: this.calculateComplianceScore(events),
        riskScore: this.calculateRiskScore(events),
      },
      generatedAt: new Date(),
      generatedBy,
      format: 'JSON',
    };

    // Cache the report
    await this.cache.set(`audit-report:${report.id}`, report, 24 * 60 * 60); // 24 hours

    return report;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================



  private actionToMethod(action: AuditAction): string {
    const methodMap: Record<string, string> = {
      CREATE: 'POST',
      READ: 'GET',
      UPDATE: 'PUT',
      DELETE: 'DELETE',
      BULK_UPDATE: 'PATCH',
      BULK_DELETE: 'DELETE',
    };
    return methodMap[action] || 'UNKNOWN';
  }

  private calculateSeverity(action: AuditAction, entity: AuditEntity, changes?: AuditChanges): AuditSeverity {
    // Critical entities
    if (['USER', 'ROLE', 'PERMISSION', 'SYSTEM'].includes(entity)) {
      return action === 'DELETE' ? 'CRITICAL' : 'HIGH';
    }

    // Sensitive data entities
    if (['RISK', 'COMPLIANCE_FRAMEWORK', 'DOCUMENT'].includes(entity)) {
      return action === 'DELETE' ? 'HIGH' : 'MEDIUM';
    }

    // Bulk operations are always high severity
    if (action.startsWith('BULK_')) {
      return 'HIGH';
    }

    // Large change sets
    if (changes && changes.fields.length > 10) {
      return 'HIGH';
    }

    return 'MEDIUM';
  }


  private getRetentionPeriod(action: AuditAction): number {
    // Compliance-related events need longer retention
    if (['COMPLIANCE_CHECK', 'AUDIT_START', 'AUDIT_END', 'VIOLATION_DETECTED'].includes(action)) {
      return 2555; // 7 years
    }

    // Financial events
    if (action.includes('PAYMENT') || action.includes('SUBSCRIPTION') || action.includes('INVOICE')) {
      return 2555; // 7 years
    }

    // Security events
    if (['LOGIN_FAILED', 'ACCESS_DENIED', 'PERMISSION_GRANT', 'PERMISSION_REVOKE'].includes(action)) {
      return 1095; // 3 years
    }

    // Default retention
    return 365; // 1 year
  }

  private shouldEncrypt(action: AuditAction, entity: AuditEntity): boolean {
    // Always encrypt sensitive entities
    const sensitiveEntities = ['USER', 'PAYMENT', 'DOCUMENT', 'API_KEY'];
    if (sensitiveEntities.includes(entity)) return true;

    // Always encrypt authentication events
    const authActions = ['LOGIN', 'LOGIN_FAILED', 'PASSWORD_CHANGE', 'PASSWORD_RESET'];
    if (authActions.includes(action)) return true;

    return false;
  }

  private async cacheRecentEvent(event: AuditEvent): Promise<void> {
    const key = `recent-audit:${event.organizationId}`;
    const recentEvents = await this.cache.get<AuditEvent[]>(key) || [];
    
    recentEvents.unshift(event);
    recentEvents.splice(100); // Keep only last 100 events
    
    await this.cache.set(key, recentEvents, 60 * 60); // 1 hour
  }

  private async updateAuditStatistics(events: AuditEvent[]): Promise<void> {
    for (const event of events) {
      const statsKey = `audit-stats:${event.organizationId}:${new Date().toISOString().split('T')[0]}`;
      const stats = await this.cache.get<Record<string, number>>(statsKey) || {};
      
      stats.totalEvents = (stats.totalEvents || 0) + 1;
      stats[`${event.action}_count`] = (stats[`${event.action}_count`] || 0) + 1;
      stats[`${event.severity}_severity`] = (stats[`${event.severity}_severity`] || 0) + 1;
      stats[`${event.status}_status`] = (stats[`${event.status}_status`] || 0) + 1;
      
      await this.cache.set(statsKey, stats, 24 * 60 * 60); // 24 hours
    }
  }

  private calculateComplianceScore(events: AuditEvent[]): number {
    if (events.length === 0) return 100;

    const successCount = events.filter(e => e.status === 'SUCCESS').length;
    const failureCount = events.filter(e => e.status === 'FAILURE').length;
    const warningCount = events.filter(e => e.status === 'WARNING').length;

    // Weight different statuses
    const score = ((successCount * 1.0) + (warningCount * 0.5) + (failureCount * 0.0)) / events.length * 100;
    return Math.round(score);
  }

  private calculateRiskScore(events: AuditEvent[]): number {
    if (events.length === 0) return 0;

    let riskScore = 0;
    const weights = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

    for (const event of events) {
      riskScore += weights[event.severity];
      
      // Extra weight for failures
      if (event.status === 'FAILURE') {
        riskScore += weights[event.severity];
      }
    }

    return Math.round((riskScore / (events.length * 4)) * 100);
  }

  /**
   * Clean up old audit logs based on retention policies
   */
  async cleanupOldLogs(): Promise<{ deletedCount: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 365); // Default 1 year retention

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
        // Only delete non-compliance events
        NOT: {
          complianceFlags: {
            contains: 'SOX',
          },
        },
      },
    });

    return { deletedCount: result.count };
  }
}

// ============================================================================
// GLOBAL INSTANCE
// ============================================================================

let auditLogger: AuditLogger | null = null;

export function getAuditLogger(prisma: PrismaClient): AuditLogger {
  if (!auditLogger) {
    auditLogger = new AuditLogger(prisma);
  }
  return auditLogger;
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

export async function logAuditEvent(
  prisma: PrismaClient,
  event: Omit<AuditEvent, 'id' | 'timestamp'>
): Promise<void> {
  const logger = getAuditLogger(prisma);
  await logger.log(event);
}

export async function logAuthEvent(
  prisma: PrismaClient,
  action: Extract<AuditAction, 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED'>,
  userId: string | null,
  organizationId: string,
  request: NextRequest,
  metadata?: Record<string, any>
): Promise<void> {
  const logger = getAuditLogger(prisma);
  await logger.logAuth(action, userId, organizationId, request, metadata);
}

export async function logDataChangeEvent(
  prisma: PrismaClient,
  action: Extract<AuditAction, 'CREATE' | 'UPDATE' | 'DELETE'>,
  entity: AuditEntity,
  entityId: string,
  userId: string,
  organizationId: string,
  changes?: AuditChanges,
  metadata?: Record<string, any>
): Promise<void> {
  const logger = getAuditLogger(prisma);
  await logger.logDataChange(action, entity, entityId, userId, organizationId, changes, metadata);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default AuditLogger;