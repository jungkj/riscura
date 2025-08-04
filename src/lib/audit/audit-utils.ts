/**
 * Shared Audit Utilities
 * Common functions used across audit logging components
 */

import { NextRequest } from 'next/server';
import { AuditEntity } from './audit-logger';

/**
 * Extract IP address from request headers
 */
export function extractIpAddress(_request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Get compliance flags for different entities
 */
export function getEntityComplianceFlags(entity: AuditEntity): string[] {
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
    AUDIT: ['SOC2', 'ISO27001', 'SOX'],
    NOTIFICATION: ['GDPR', 'SOC2'],
    WEBHOOK: ['SOC2'],
    BACKUP: ['SOC2', 'ISO27001'],
    EXPORT: ['GDPR', 'SOC2'],
    IMPORT: ['SOC2'],
    SESSION: ['SOC2', 'GDPR'],
    ROLE: ['SOC2', 'ISO27001'],
    PERMISSION: ['SOC2', 'ISO27001'],
    ANALYTICS: ['SOC2'],
    AI_MODEL: ['SOC2'],
    DASHBOARD: ['SOC2'],
    QUESTIONNAIRE: ['SOC2'],
    INCIDENT: ['SOC2', 'ISO27001'],
    POLICY: ['SOC2', 'ISO27001'],
    PROCEDURE: ['SOC2', 'ISO27001'],
  };

  return complianceMap[entity] || ['SOC2'];
}

/**
 * Infer action from HTTP method
 */
export function inferActionFromMethod(method: string): string {
  const methodMap: Record<string, string> = {
    GET: 'READ',
    POST: 'CREATE',
    PUT: 'UPDATE',
    PATCH: 'UPDATE',
    DELETE: 'DELETE',
  };
  return methodMap[method.toUpperCase()] || 'READ';
}

/**
 * Infer client type from user agent
 */
export function inferClientType(userAgent?: string): 'web' | 'mobile' | 'api' | 'unknown' {
  if (!userAgent) return 'unknown';

  if (
    userAgent.includes('Mobile') ||
    userAgent.includes('Android') ||
    userAgent.includes('iPhone')
  ) {
    return 'mobile';
  }

  if (userAgent.includes('curl') || userAgent.includes('Postman') || userAgent.includes('axios')) {
    return 'api';
  }

  return 'web';
}

/**
 * Generate secure event ID using UUID
 */
export function generateEventId(): string {
  // Fallback to timestamp-based ID if UUID is not available
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback implementation
  return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate audit context from request
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
 * Create audit metadata for operations
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
