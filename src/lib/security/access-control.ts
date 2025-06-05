import { NextRequest } from 'next/server';
import { documentEncryption } from './document-encryption';

// Permission types for granular access control
export type Permission = 
  | 'document:read'
  | 'document:write'
  | 'document:delete'
  | 'document:download'
  | 'document:share'
  | 'document:admin'
  | 'risk:read'
  | 'risk:write'
  | 'risk:admin'
  | 'compliance:read'
  | 'compliance:write'
  | 'compliance:admin'
  | 'user:read'
  | 'user:write'
  | 'user:admin'
  | 'org:admin'
  | '*'; // Super admin

// Role-based access control
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  ADMIN: ['*'],
  MANAGER: [
    'document:read',
    'document:write',
    'document:delete',
    'document:download',
    'document:share',
    'risk:read',
    'risk:write',
    'compliance:read',
    'compliance:write',
    'user:read'
  ],
  USER: [
    'document:read',
    'document:download',
    'risk:read',
    'compliance:read'
  ],
  AUDITOR: [
    'document:read',
    'document:download',
    'risk:read',
    'compliance:read',
    'compliance:admin'
  ],
  GUEST: [
    'document:read'
  ]
};

// Document sensitivity levels
export enum DocumentSensitivity {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  RESTRICTED = 'restricted',
  TOP_SECRET = 'top_secret'
}

// Access control policy
export interface AccessPolicy {
  documentId: string;
  sensitivity: DocumentSensitivity;
  ownerUserId: string;
  organizationId: string;
  requiredPermissions: Permission[];
  allowedRoles: string[];
  allowedUsers: string[];
  deniedUsers: string[];
  ipWhitelist?: string[];
  timeRestrictions?: {
    startTime: string; // HH:mm format
    endTime: string;
    daysOfWeek: number[]; // 0-6, Sunday = 0
  };
  downloadable: boolean;
  printable: boolean;
  watermarkRequired: boolean;
  expiresAt?: Date;
}

// Audit log entry
export interface AuditLogEntry {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId: string;
  result: 'allowed' | 'denied';
  reason?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Comprehensive access control service
 */
export class AccessControlService {
  private static instance: AccessControlService;
  private auditLog: AuditLogEntry[] = [];

  private constructor() {}

  public static getInstance(): AccessControlService {
    if (!AccessControlService.instance) {
      AccessControlService.instance = new AccessControlService();
    }
    return AccessControlService.instance;
  }

  /**
   * Check if user has required permission
   */
  public hasPermission(userPermissions: Permission[], requiredPermission: Permission): boolean {
    // Super admin has all permissions
    if (userPermissions.includes('*')) {
      return true;
    }

    // Check exact permission match
    if (userPermissions.includes(requiredPermission)) {
      return true;
    }

    // Check admin permissions
    const [resource, action] = requiredPermission.split(':');
    const adminPermission = `${resource}:admin` as Permission;
    
    return userPermissions.includes(adminPermission);
  }

  /**
   * Get user permissions based on role
   */
  public getUserPermissions(role: string, customPermissions?: Permission[]): Permission[] {
    const rolePermissions = ROLE_PERMISSIONS[role] || [];
    const allPermissions = [...rolePermissions, ...(customPermissions || [])];
    
    // Remove duplicates
    return Array.from(new Set(allPermissions));
  }

  /**
   * Check document access with comprehensive security checks
   */
  public async checkDocumentAccess(
    userId: string,
    userRole: string,
    userPermissions: Permission[],
    documentId: string,
    action: string,
    request: NextRequest
  ): Promise<{
    allowed: boolean;
    reason?: string;
    requiresWatermark?: boolean;
    token?: string;
  }> {
    try {
      // Get document access policy (this would typically come from database)
      const policy = await this.getDocumentPolicy(documentId);
      
      if (!policy) {
        await this.logAccess(userId, action, 'document', documentId, 'denied', 'Document not found', request);
        return { allowed: false, reason: 'Document not found' };
      }

      // Check basic permission
      const hasRequiredPermission = policy.requiredPermissions.some(perm => 
        this.hasPermission(userPermissions, perm)
      );

      if (!hasRequiredPermission) {
        await this.logAccess(userId, action, 'document', documentId, 'denied', 'Insufficient permissions', request);
        return { allowed: false, reason: 'Insufficient permissions' };
      }

      // Check role-based access
      if (policy.allowedRoles.length > 0 && !policy.allowedRoles.includes(userRole)) {
        await this.logAccess(userId, action, 'document', documentId, 'denied', 'Role not allowed', request);
        return { allowed: false, reason: 'Role not allowed' };
      }

      // Check user whitelist/blacklist
      if (policy.deniedUsers.includes(userId)) {
        await this.logAccess(userId, action, 'document', documentId, 'denied', 'User explicitly denied', request);
        return { allowed: false, reason: 'Access denied' };
      }

      if (policy.allowedUsers.length > 0 && !policy.allowedUsers.includes(userId)) {
        await this.logAccess(userId, action, 'document', documentId, 'denied', 'User not in whitelist', request);
        return { allowed: false, reason: 'User not authorized' };
      }

      // Check IP whitelist
      if (policy.ipWhitelist && policy.ipWhitelist.length > 0) {
        const clientIP = this.getClientIP(request);
        if (!policy.ipWhitelist.includes(clientIP)) {
          await this.logAccess(userId, action, 'document', documentId, 'denied', 'IP not whitelisted', request);
          return { allowed: false, reason: 'Access from this location not allowed' };
        }
      }

      // Check time restrictions
      if (policy.timeRestrictions) {
        const now = new Date();
        const currentDay = now.getDay();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        if (!policy.timeRestrictions.daysOfWeek.includes(currentDay) ||
            currentTime < policy.timeRestrictions.startTime ||
            currentTime > policy.timeRestrictions.endTime) {
          await this.logAccess(userId, action, 'document', documentId, 'denied', 'Outside allowed time window', request);
          return { allowed: false, reason: 'Access not allowed at this time' };
        }
      }

      // Check document expiration
      if (policy.expiresAt && new Date() > policy.expiresAt) {
        await this.logAccess(userId, action, 'document', documentId, 'denied', 'Document expired', request);
        return { allowed: false, reason: 'Document has expired' };
      }

      // Check action-specific restrictions
      if (action === 'download' && !policy.downloadable) {
        await this.logAccess(userId, action, 'document', documentId, 'denied', 'Download not allowed', request);
        return { allowed: false, reason: 'Download not permitted' };
      }

      // Generate secure access token
      const token = documentEncryption.generateSecureToken(
        documentId,
        userId,
        userPermissions,
        3600 // 1 hour expiration
      );

      await this.logAccess(userId, action, 'document', documentId, 'allowed', undefined, request);

      return {
        allowed: true,
        requiresWatermark: policy.watermarkRequired,
        token
      };

    } catch (error) {
      await this.logAccess(userId, action, 'document', documentId, 'denied', 'System error', request);
      return { allowed: false, reason: 'System error' };
    }
  }

  /**
   * Get document access policy (mock implementation - would typically query database)
   */
  private async getDocumentPolicy(documentId: string): Promise<AccessPolicy | null> {
    // Mock implementation - in production this would query the database
    return {
      documentId,
      sensitivity: DocumentSensitivity.CONFIDENTIAL,
      ownerUserId: 'admin-user-id',
      organizationId: 'org-123',
      requiredPermissions: ['document:read'],
      allowedRoles: ['ADMIN', 'MANAGER', 'USER'],
      allowedUsers: [],
      deniedUsers: [],
      downloadable: true,
      printable: false,
      watermarkRequired: true,
      timeRestrictions: {
        startTime: '08:00',
        endTime: '18:00',
        daysOfWeek: [1, 2, 3, 4, 5] // Monday to Friday
      }
    };
  }

  /**
   * Extract client IP address
   */
  private getClientIP(request: NextRequest): string {
    return (
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      'unknown'
    );
  }

  /**
   * Log access attempt for audit trail
   */
  private async logAccess(
    userId: string,
    action: string,
    resource: string,
    resourceId: string,
    result: 'allowed' | 'denied',
    reason?: string,
    request?: NextRequest
  ): Promise<void> {
    const logEntry: AuditLogEntry = {
      id: crypto.randomUUID(),
      userId,
      userEmail: 'user@example.com', // Would get from user context
      action,
      resource,
      resourceId,
      result,
      reason,
      ipAddress: request ? this.getClientIP(request) : 'unknown',
      userAgent: request?.headers.get('user-agent') || 'unknown',
      timestamp: new Date(),
      metadata: {
        documentSensitivity: resource === 'document' ? 'confidential' : undefined
      }
    };

    // Store in audit log (in production, this would go to database or logging service)
    this.auditLog.push(logEntry);

    // In production, also send to external security monitoring
    if (result === 'denied') {
      console.warn('ACCESS DENIED:', logEntry);
      // Could integrate with SIEM systems here
    }
  }

  /**
   * Get audit log entries
   */
  public getAuditLog(filters?: {
    userId?: string;
    action?: string;
    result?: 'allowed' | 'denied';
    startDate?: Date;
    endDate?: Date;
  }): AuditLogEntry[] {
    let filteredLog = [...this.auditLog];

    if (filters) {
      if (filters.userId) {
        filteredLog = filteredLog.filter(entry => entry.userId === filters.userId);
      }
      if (filters.action) {
        filteredLog = filteredLog.filter(entry => entry.action === filters.action);
      }
      if (filters.result) {
        filteredLog = filteredLog.filter(entry => entry.result === filters.result);
      }
      if (filters.startDate) {
        filteredLog = filteredLog.filter(entry => entry.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        filteredLog = filteredLog.filter(entry => entry.timestamp <= filters.endDate!);
      }
    }

    return filteredLog.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Check if user can perform administrative actions
   */
  public canPerformAdminAction(userPermissions: Permission[], action: string): boolean {
    // Super admin can do anything
    if (userPermissions.includes('*')) {
      return true;
    }

    // Check specific admin permissions
    const adminActions: Record<string, Permission> = {
      'create-user': 'user:admin',
      'delete-user': 'user:admin',
      'modify-permissions': 'user:admin',
      'view-audit-log': 'org:admin',
      'system-settings': 'org:admin',
      'security-settings': 'org:admin'
    };

    const requiredPermission = adminActions[action];
    return requiredPermission ? userPermissions.includes(requiredPermission) : false;
  }

  /**
   * Generate document sharing link with time-limited access
   */
  public generateSharingLink(
    documentId: string,
    sharedByUserId: string,
    permissions: Permission[],
    expiresIn: number = 24 * 60 * 60 // 24 hours in seconds
  ): string {
    const shareToken = documentEncryption.generateSecureToken(
      documentId,
      `shared:${sharedByUserId}`,
      permissions,
      expiresIn
    );

    // In production, store sharing link in database with expiration
    const shareId = crypto.randomUUID();
    
    return `${process.env.APP_URL}/share/${shareId}?token=${encodeURIComponent(shareToken)}`;
  }

  /**
   * Verify sharing link
   */
  public verifySharingLink(shareId: string, token: string): {
    valid: boolean;
    documentId?: string;
    permissions?: Permission[];
    expired?: boolean;
  } {
    try {
      const tokenResult = documentEncryption.verifySecureToken(token);
      
      if (!tokenResult.valid) {
        return { valid: false, expired: tokenResult.expired };
      }

      return {
        valid: true,
        documentId: tokenResult.payload.documentId,
        permissions: tokenResult.payload.permissions,
        expired: false
      };
    } catch (error) {
      return { valid: false };
    }
  }
}

// Export singleton instance
export const accessControl = AccessControlService.getInstance();

// Utility functions
export function hasAnyPermission(userPermissions: Permission[], requiredPermissions: Permission[]): boolean {
  return requiredPermissions.some(perm => accessControl.hasPermission(userPermissions, perm));
}

export function hasAllPermissions(userPermissions: Permission[], requiredPermissions: Permission[]): boolean {
  return requiredPermissions.every(perm => accessControl.hasPermission(userPermissions, perm));
}

export function getSensitivityLevel(sensitivity: DocumentSensitivity): number {
  const levels = {
    [DocumentSensitivity.PUBLIC]: 1,
    [DocumentSensitivity.INTERNAL]: 2,
    [DocumentSensitivity.CONFIDENTIAL]: 3,
    [DocumentSensitivity.RESTRICTED]: 4,
    [DocumentSensitivity.TOP_SECRET]: 5
  };
  return levels[sensitivity] || 1;
}

export function canAccessSensitivityLevel(userRole: string, documentSensitivity: DocumentSensitivity): boolean {
  const roleMaxLevels = {
    GUEST: 1,
    USER: 2,
    MANAGER: 3,
    AUDITOR: 4,
    ADMIN: 5
  };

  const userMaxLevel = roleMaxLevels[userRole] || 1;
  const documentLevel = getSensitivityLevel(documentSensitivity);

  return userMaxLevel >= documentLevel;
} 