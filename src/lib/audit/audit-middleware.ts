/**
 * Audit Middleware for Automatic Logging
 * Integrates audit logging into API endpoints and request processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getAuditLogger, AuditAction, AuditEntity, AuditEvent } from './audit-logger';
import {
  extractIpAddress,
  getEntityComplianceFlags,
  inferActionFromMethod,
  inferClientType,
  extractAuditContext,
  createAuditMetadata,
} from './audit-utils';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma';

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to validate AuditAction values
 */
const isValidAuditAction = (_value: string): value is AuditAction {
  const validActions: AuditAction[] = [
    // Authentication Actions
    'LOGIN',
    'LOGOUT',
    'LOGIN_FAILED',
    'PASSWORD_CHANGE',
    'PASSWORD_RESET',
    'MFA_ENABLE',
    'MFA_DISABLE',
    'SESSION_EXPIRE',
    'ACCOUNT_LOCK',
    // Data Actions
    'CREATE',
    'READ',
    'UPDATE',
    'DELETE',
    'EXPORT',
    'IMPORT',
    'BULK_UPDATE',
    'BULK_DELETE',
    'RESTORE',
    'ARCHIVE',
    'MERGE',
    'CLONE',
    'SHARE',
    // Permission Actions
    'PERMISSION_GRANT',
    'PERMISSION_REVOKE',
    'ROLE_ASSIGN',
    'ROLE_REMOVE',
    'ACCESS_DENIED',
    'ESCALATION_REQUEST',
    'ESCALATION_APPROVE',
    // System Actions
    'SYSTEM_START',
    'SYSTEM_STOP',
    'BACKUP_CREATE',
    'BACKUP_RESTORE',
    'CONFIG_CHANGE',
    'MAINTENANCE_START',
    'MAINTENANCE_END',
    // Compliance Actions
    'AUDIT_START',
    'AUDIT_END',
    'POLICY_UPDATE',
    'VIOLATION_DETECTED',
    'COMPLIANCE_CHECK',
    'RISK_ASSESSMENT',
    'CONTROL_TEST',
    // Document Actions
    'DOCUMENT_UPLOAD',
    'DOCUMENT_DOWNLOAD',
    'DOCUMENT_VIEW',
    'DOCUMENT_EDIT',
    'DOCUMENT_DELETE',
    'DOCUMENT_SHARE',
    'DOCUMENT_APPROVE',
    // Billing Actions
    'SUBSCRIPTION_CREATE',
    'SUBSCRIPTION_UPDATE',
    'SUBSCRIPTION_CANCEL',
    'PAYMENT_SUCCESS',
    'PAYMENT_FAILED',
    'INVOICE_GENERATE',
    // AI Actions
    'AI_QUERY',
    'AI_RESPONSE',
    'AI_TRAINING',
    'AI_MODEL_UPDATE',
    'PROBO_ANALYSIS',
    'RISK_PREDICTION',
    'CONTROL_GENERATION',
  ]
  return validActions.includes(value as AuditAction);
}

/**
 * Type guard to validate AuditEntity values
 */
const isValidAuditEntity = (_value: string): value is AuditEntity {
  const validEntities: AuditEntity[] = [
    'USER',
    'ORGANIZATION',
    'ROLE',
    'PERMISSION',
    'SESSION',
    'RISK',
    'CONTROL',
    'ASSESSMENT',
    'COMPLIANCE_FRAMEWORK',
    'DOCUMENT',
    'REPORT',
    'DASHBOARD',
    'NOTIFICATION',
    'SUBSCRIPTION',
    'INVOICE',
    'PAYMENT',
    'WEBHOOK',
    'API_KEY',
    'INTEGRATION',
    'BACKUP',
    'SYSTEM',
    'POLICY',
    'PROCEDURE',
    'INCIDENT',
    'QUESTIONNAIRE',
    'AI_MODEL',
    'ANALYTICS',
    'EXPORT',
    'IMPORT',
  ];
  return validEntities.includes(value as AuditEntity);
}

// ============================================================================
// MIDDLEWARE FUNCTION
// ============================================================================

export interface AuditMiddlewareOptions {
  action?: AuditAction
  entity?: AuditEntity;
  entityId?: string | ((req: NextRequest, context?: any) => string);
  resource?: string;
  skipSuccessLogging?: boolean;
  skipFailureLogging?: boolean;
  customMetadata?: (req: NextRequest, context?: any) => Record<string, any>;
  severity?: AuditEvent['severity'];
  complianceFlags?: string[];
}

/**
 * Middleware wrapper that automatically logs audit events
 */
export function withAuditLogging<T extends any[]>(
  handler: (req: NextRequest, ...args: T) => Promise<NextResponse>,
  options: AuditMiddlewareOptions = {}
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Extract basic request information
    const method = req.method
    const path = req.nextUrl.pathname;
    const userAgent = req.headers.get('user-agent') || undefined;
    const ipAddress = extractIpAddress(req);
    const organizationId = req.headers.get('organization-id') || 'unknown';

    // Get session information
    let session
    let userId: string | undefined;
    try {
      session = await getServerSession(authOptions);
      userId = session?.user?.id;
    } catch (error) {
      // Session retrieval failed, continue without user context
      // console.warn('Failed to retrieve session for audit logging:', error)
    }

    const auditLogger = getAuditLogger(prisma);

    // Determine entity ID
    let entityId = options.entityId
    if (typeof entityId === 'function') {
      try {
        entityId = entityId(req, args[0]);
      } catch (error) {
        // console.warn('Failed to extract entity ID for audit logging:', error)
        entityId = undefined;
      }
    }

    // Prepare base audit event
    const baseEvent = {
      userId,
      organizationId,
      action:
        options.action ||
        (() => {
          const inferredAction = inferActionFromMethod(method)
          return isValidAuditAction(inferredAction) ? inferredAction : 'READ';
        })(),
      entity:
        options.entity ||
        (() => {
          const defaultEntity = 'API_KEY';
          return isValidAuditEntity(defaultEntity) ? defaultEntity : 'SYSTEM';
        })(),
      entityId: typeof entityId === 'string' ? entityId : undefined,
      resource: options.resource || path.split('/')[2] || 'unknown',
      method,
      path,
      userAgent,
      ipAddress,
      requestId,
      apiVersion: '1.0',
      clientType: inferClientType(userAgent),
      severity: options.severity || 'MEDIUM',
      complianceFlags: options.complianceFlags || ['SOC2'],
    }

    let response: NextResponse;
    let error: Error | null = null;

    try {
      // Execute the handler
      response = await handler(req, ...args)

      // Log successful operation if not skipped
      if (!options.skipSuccessLogging) {
        await auditLogger.log({
          ...baseEvent,
          status: 'SUCCESS',
          duration: Date.now() - startTime,
          metadata: {
            statusCode: response.status,
            responseSize: response.headers.get('content-length'),
            ...options.customMetadata?.(req, args[0]),
          },
        })
      }

      return response;
    } catch (err) {
      error = err as Error;

      // Log failed operation if not skipped
      if (!options.skipFailureLogging) {
        await auditLogger.log({
          ...baseEvent,
          status: 'FAILURE',
          errorMessage: error.message,
          duration: Date.now() - startTime,
          severity: 'HIGH', // Failures are always high severity
          metadata: {
            errorStack: error.stack,
            errorType: error.constructor.name,
            ...options.customMetadata?.(req, args[0]),
          },
        })
      }

      throw error;
    }
  }
}

// ============================================================================
// SPECIFIC AUDIT DECORATORS
// ============================================================================

/**
 * Decorator for authentication endpoints
 */
export function withAuthAudit(_action: Extract<
    AuditAction,
    'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'PASSWORD_CHANGE' | 'PASSWORD_RESET'
  >
) {
  return function <T extends any[]>(
    handler: (req: NextRequest, ...args: T) => Promise<NextResponse>
  ) {
    return withAuditLogging(handler, {
      action,
      entity: 'USER',
      resource: 'authentication',
      severity: action === 'LOGIN_FAILED' ? 'HIGH' : 'MEDIUM',
      complianceFlags: ['SOX', 'GDPR', 'SOC2'],
      customMetadata: (req) => ({
        authenticationMethod: req.headers.get('authorization') ? 'bearer' : 'session',
        loginAttempt: action === 'LOGIN' || action === 'LOGIN_FAILED',
      }),
    })
  }
}

/**
 * Decorator for data modification endpoints
 */
export function withDataAudit(_entity: AuditEntity,
  action?: Extract<AuditAction, 'CREATE' | 'UPDATE' | 'DELETE' | 'READ'>,
  entityIdExtractor?: (req: NextRequest, context?: any) => string
) {
  return function <T extends any[]>(
    handler: (req: NextRequest, ...args: T) => Promise<NextResponse>
  ) {
    return withAuditLogging(handler, {
      action: action || 'READ',
      entity,
      entityId: entityIdExtractor,
      resource: entity.toLowerCase(),
      severity: action === 'DELETE' ? 'HIGH' : 'MEDIUM',
      complianceFlags: getEntityComplianceFlags(entity),
      customMetadata: (req, context) => ({
        dataOperation: true,
        entityType: entity,
        bulkOperation: req.nextUrl.pathname.includes('bulk'),
        contextData: context ? JSON.stringify(context) : undefined,
      }),
    });
  }
}

/**
 * Decorator for permission-sensitive endpoints
 */
export function withPermissionAudit(requiredPermission: string, entity: AuditEntity = 'API_KEY') {
  return function <T extends any[]>(
    handler: (req: NextRequest, ...args: T) => Promise<NextResponse>
  ) {
    return withAuditLogging(handler, {
      action: 'READ', // Default to READ, will be overridden by actual action
      entity,
      resource: 'permission-protected',
      severity: 'MEDIUM',
      complianceFlags: ['SOC2', 'ISO27001'],
      customMetadata: (req) => ({
        requiredPermission,
        permissionCheck: true,
        endpoint: req.nextUrl.pathname,
      }),
    });
  }
}

/**
 * Decorator for system administration endpoints
 */
export function withSystemAudit(_action: Extract<
    AuditAction,
    'SYSTEM_START' | 'SYSTEM_STOP' | 'CONFIG_CHANGE' | 'BACKUP_CREATE' | 'MAINTENANCE_START'
  >
) {
  return function <T extends any[]>(
    handler: (req: NextRequest, ...args: T) => Promise<NextResponse>
  ) {
    return withAuditLogging(handler, {
      action,
      entity: 'SYSTEM',
      resource: 'system',
      severity: 'HIGH',
      complianceFlags: ['SOC2', 'ISO27001'],
      customMetadata: (req) => ({
        systemOperation: true,
        administrativeAction: true,
        timestamp: new Date().toISOString(),
      }),
    });
  }
}

/**
 * Decorator for compliance-related endpoints
 */
export function withComplianceAudit(_action: Extract<
    AuditAction,
    'COMPLIANCE_CHECK' | 'AUDIT_START' | 'AUDIT_END' | 'POLICY_UPDATE' | 'VIOLATION_DETECTED'
  >,
  framework?: string
) {
  return function <T extends any[]>(
    handler: (req: NextRequest, ...args: T) => Promise<NextResponse>
  ) {
    return withAuditLogging(handler, {
      action,
      entity: 'COMPLIANCE_FRAMEWORK',
      resource: 'compliance',
      severity: action === 'VIOLATION_DETECTED' ? 'CRITICAL' : 'HIGH',
      complianceFlags: framework ? [framework, 'SOC2'] : ['SOC2', 'ISO27001', 'SOX'],
      customMetadata: (req) => ({
        complianceAction: true,
        framework,
        auditTrail: true,
        regulatoryImplications: true,
      }),
    });
  }
}

// ============================================================================
// AUDIT QUERY HELPERS
// ============================================================================

// ============================================================================
// BATCH AUDIT OPERATIONS
// ============================================================================

/**
 * Helper for logging multiple related audit events
 */
export async function logBatchAuditEvents(
  events: Array<Omit<AuditEvent, 'id' | 'timestamp'>>
): Promise<void> {
  const auditLogger = getAuditLogger(prisma)

  for (const event of events) {
    await auditLogger.log(event);
  }
}

/**
 * Helper for logging bulk operations
 */
export async function logBulkOperation(_action: Extract<AuditAction, 'BULK_UPDATE' | 'BULK_DELETE'>,
  entity: AuditEntity,
  entityIds: string[],
  userId: string,
  organizationId: string,
  metadata?: Record<string, any>
): Promise<void> {
  const auditLogger = getAuditLogger(prisma);

  await auditLogger.log({
    userId,
    organizationId,
    action,
    entity,
    resource: entity.toLowerCase(),
    method: action === 'BULK_UPDATE' ? 'PATCH' : 'DELETE',
    path: `/bulk/${entity.toLowerCase()}`,
    severity: 'HIGH',
    status: 'SUCCESS',
    metadata: {
      bulkOperation: true,
      affectedEntityIds: entityIds,
      affectedCount: entityIds.length,
      ...metadata,
    },
    complianceFlags: getEntityComplianceFlags(entity),
  });
}
