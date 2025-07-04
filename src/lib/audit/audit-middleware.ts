/**
 * Audit Middleware for Automatic Logging
 * Integrates audit logging into API endpoints and request processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getAuditLogger, AuditAction, AuditEntity, AuditEvent } from './audit-logger';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma';

// ============================================================================
// MIDDLEWARE FUNCTION
// ============================================================================

export interface AuditMiddlewareOptions {
  action?: AuditAction;
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
    const method = req.method;
    const path = req.nextUrl.pathname;
    const userAgent = req.headers.get('user-agent') || undefined;
    const ipAddress = extractIpAddress(req);
    const organizationId = req.headers.get('organization-id') || 'unknown';
    
    // Get session information
    let session;
    let userId: string | undefined;
    try {
      session = await getServerSession(authOptions);
      userId = session?.user?.id;
    } catch (error) {
      // Session retrieval failed, continue without user context
      console.warn('Failed to retrieve session for audit logging:', error);
    }

    const auditLogger = getAuditLogger(prisma);
    
    // Determine entity ID
    let entityId = options.entityId;
    if (typeof entityId === 'function') {
      try {
        entityId = entityId(req, args[0]);
      } catch (error) {
        console.warn('Failed to extract entity ID for audit logging:', error);
        entityId = undefined;
      }
    }

    // Prepare base audit event
    const baseEvent = {
      userId,
      organizationId,
      action: options.action || inferActionFromMethod(method),
      entity: options.entity || 'API',
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
    };

    let response: NextResponse;
    let error: Error | null = null;

    try {
      // Execute the handler
      response = await handler(req, ...args);
      
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
        });
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
        });
      }

      throw error;
    }
  };
}

// ============================================================================
// SPECIFIC AUDIT DECORATORS
// ============================================================================

/**
 * Decorator for authentication endpoints
 */
export function withAuthAudit(
  action: Extract<AuditAction, 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'PASSWORD_CHANGE' | 'PASSWORD_RESET'>
) {
  return function<T extends any[]>(
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
    });
  };
}

/**
 * Decorator for data modification endpoints
 */
export function withDataAudit(
  entity: AuditEntity,
  action?: Extract<AuditAction, 'CREATE' | 'UPDATE' | 'DELETE' | 'READ'>,
  entityIdExtractor?: (req: NextRequest, context?: any) => string
) {
  return function<T extends any[]>(
    handler: (req: NextRequest, ...args: T) => Promise<NextResponse>
  ) {
    return withAuditLogging(handler, {
      action: action || inferActionFromMethod(req.method),
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
  };
}

/**
 * Decorator for permission-sensitive endpoints
 */
export function withPermissionAudit(
  requiredPermission: string,
  entity: AuditEntity = 'API'
) {
  return function<T extends any[]>(
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
  };
}

/**
 * Decorator for system administration endpoints
 */
export function withSystemAudit(
  action: Extract<AuditAction, 'SYSTEM_START' | 'SYSTEM_STOP' | 'CONFIG_CHANGE' | 'BACKUP_CREATE' | 'MAINTENANCE_START'>
) {
  return function<T extends any[]>(
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
  };
}

/**
 * Decorator for compliance-related endpoints
 */
export function withComplianceAudit(
  action: Extract<AuditAction, 'COMPLIANCE_CHECK' | 'AUDIT_START' | 'AUDIT_END' | 'POLICY_UPDATE' | 'VIOLATION_DETECTED'>,
  framework?: string
) {
  return function<T extends any[]>(
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
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function extractIpAddress(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    request.ip ||
    'unknown'
  );
}

function inferActionFromMethod(method: string): AuditAction {
  const methodMap: Record<string, AuditAction> = {
    GET: 'READ',
    POST: 'CREATE',
    PUT: 'UPDATE',
    PATCH: 'UPDATE',
    DELETE: 'DELETE',
  };
  return methodMap[method.toUpperCase()] || 'READ';
}

function inferClientType(userAgent?: string): AuditEvent['clientType'] {
  if (!userAgent) return 'unknown' as any;
  
  if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
    return 'mobile';
  }
  
  if (userAgent.includes('curl') || userAgent.includes('Postman') || userAgent.includes('axios')) {
    return 'api';
  }
  
  return 'web';
}

function getEntityComplianceFlags(entity: AuditEntity): string[] {
  const complianceMap: Record<string, string[]> = {
    USER: ['SOX', 'GDPR', 'SOC2', 'HIPAA'],
    RISK: ['SOX', 'SOC2', 'ISO27001'],
    CONTROL: ['SOC2', 'ISO27001', 'NIST'],
    COMPLIANCE_FRAMEWORK: ['SOX', 'SOC2', 'ISO27001'],
    DOCUMENT: ['GDPR', 'SOC2', 'HIPAA'],
    PAYMENT: ['PCI_DSS', 'SOX'],
    SUBSCRIPTION: ['SOX', 'PCI_DSS'],
    SYSTEM: ['SOC2', 'ISO27001'],
    ORGANIZATION: ['SOX', 'GDPR', 'SOC2'],
    API_KEY: ['SOC2', 'ISO27001'],
    INTEGRATION: ['SOC2'],
    ASSESSMENT: ['SOC2', 'ISO27001'],
    REPORT: ['SOC2'],
  };

  return complianceMap[entity] || ['SOC2'];
}

// ============================================================================
// AUDIT QUERY HELPERS
// ============================================================================

/**
 * Helper to extract common audit context from requests
 */
export function extractAuditContext(req: NextRequest) {
  return {
    userAgent: req.headers.get('user-agent') || undefined,
    ipAddress: extractIpAddress(req),
    organizationId: req.headers.get('organization-id') || 'unknown',
    sessionId: req.headers.get('x-session-id') || undefined,
    requestId: req.headers.get('x-request-id') || `req_${Date.now()}`,
    clientType: inferClientType(req.headers.get('user-agent') || undefined),
    timestamp: new Date(),
  };
}

/**
 * Helper to create audit metadata for specific operations
 */
export function createAuditMetadata(
  operation: string,
  additionalData?: Record<string, any>
): Record<string, any> {
  return {
    operation,
    timestamp: new Date().toISOString(),
    auditVersion: '1.0',
    ...additionalData,
  };
}

// ============================================================================
// BATCH AUDIT OPERATIONS
// ============================================================================

/**
 * Helper for logging multiple related audit events
 */
export async function logBatchAuditEvents(
  events: Array<Omit<AuditEvent, 'id' | 'timestamp'>>
): Promise<void> {
  const auditLogger = getAuditLogger(prisma);
  
  for (const event of events) {
    await auditLogger.log(event);
  }
}

/**
 * Helper for logging bulk operations
 */
export async function logBulkOperation(
  action: Extract<AuditAction, 'BULK_UPDATE' | 'BULK_DELETE'>,
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

// ============================================================================
// EXPORTS
// ============================================================================

export {
  withAuditLogging,
  withAuthAudit,
  withDataAudit,
  withPermissionAudit,
  withSystemAudit,
  withComplianceAudit,
  extractAuditContext,
  createAuditMetadata,
  logBatchAuditEvents,
  logBulkOperation,
};