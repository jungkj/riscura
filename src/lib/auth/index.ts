// Authentication and Authorization Library
// Enterprise-grade security utilities for Riscura RCSA

// JWT utilities
export {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyToken,
  verifyAccessToken,
  verifyRefreshToken,
  extractTokenFromHeader,
  getTokenExpiration,
  isTokenExpired,
  getTokenRemainingTime,
  type JWTPayload,
  type TokenPair,
} from './jwt';

// Password security
export {
  hashPassword,
  verifyPassword,
  checkPasswordStrength,
  generateSecurePassword,
  checkPasswordCompromised,
  getPasswordStrengthDescription,
  getPasswordStrengthColor,
  PASSWORD_REQUIREMENTS,
  type PasswordStrengthResult,
} from './password';

// Session management
export {
  createSession,
  getSession,
  getSessionByToken,
  validateSession,
  invalidateSession,
  invalidateAllSessions,
  getActiveSessions,
  cleanupExpiredSessions,
  updateSessionActivity,
  getSessionStatistics,
  isSessionValid,
  revokeSession,
  parseUserAgent,
  type SessionData,
  type CreateSessionOptions,
  type SessionWithUser,
} from './session';

// Authentication middleware
export {
  withAuth,
  withOrgAuth,
  requireRole,
  requirePermission,
  getAuthenticatedUser,
  hasRole,
  belongsToOrganization,
  rateLimit,
  validateCSRFToken,
  generateCSRFToken,
  type AuthenticatedRequest,
  type MiddlewareOptions,
} from './middleware';

// Common authentication errors
export class AuthenticationError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class SessionError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'SessionError';
  }
}

// Auth constants
export const AUTH_CONSTANTS = {
  ACCESS_TOKEN_EXPIRES_IN: 15 * 60, // 15 minutes in seconds
  REFRESH_TOKEN_EXPIRES_IN: 7 * 24 * 60 * 60, // 7 days in seconds
  MAX_FAILED_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes in milliseconds
  MAX_SESSIONS_PER_USER: 10,
  TOKEN_REFRESH_INTERVAL: 13 * 60 * 1000, // 13 minutes in milliseconds
} as const;

// Permission constants
export const PERMISSIONS = {
  // Risk Management
  RISK_CREATE: 'risk:create',
  RISK_READ: 'risk:read',
  RISK_UPDATE: 'risk:update',
  RISK_DELETE: 'risk:delete',
  
  // Control Management
  CONTROL_CREATE: 'control:create',
  CONTROL_READ: 'control:read',
  CONTROL_UPDATE: 'control:update',
  CONTROL_DELETE: 'control:delete',
  
  // Document Management
  DOCUMENT_CREATE: 'document:create',
  DOCUMENT_READ: 'document:read',
  DOCUMENT_UPDATE: 'document:update',
  DOCUMENT_DELETE: 'document:delete',
  
  // Assessment Management
  ASSESSMENT_CREATE: 'assessment:create',
  ASSESSMENT_READ: 'assessment:read',
  ASSESSMENT_UPDATE: 'assessment:update',
  ASSESSMENT_DELETE: 'assessment:delete',
  
  // Workflow Management
  WORKFLOW_CREATE: 'workflow:create',
  WORKFLOW_READ: 'workflow:read',
  WORKFLOW_UPDATE: 'workflow:update',
  WORKFLOW_DELETE: 'workflow:delete',
  
  // Report Management
  REPORT_CREATE: 'report:create',
  REPORT_READ: 'report:read',
  REPORT_UPDATE: 'report:update',
  REPORT_DELETE: 'report:delete',
  
  // User Management
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  
  // Organization Management
  ORG_ADMIN: 'org:admin',
  ORG_SETTINGS: 'org:settings',
  ORG_BILLING: 'org:billing',
  
  // System Administration
  SYSTEM_ADMIN: 'system:admin',
  SYSTEM_MONITORING: 'system:monitoring',
  SYSTEM_BACKUP: 'system:backup',
  
  // AI Features
  AI_CHAT: 'ai:chat',
  AI_ANALYSIS: 'ai:analysis',
  AI_GENERATION: 'ai:generation',
  
  // Bulk Operations
  BULK_IMPORT: 'bulk:import',
  BULK_EXPORT: 'bulk:export',
  BULK_UPDATE: 'bulk:update',
  BULK_DELETE: 'bulk:delete',
} as const;

// Role definitions with default permissions
export const ROLE_PERMISSIONS = {
  ADMIN: ['*'] as string[], // All permissions
  RISK_MANAGER: [
    PERMISSIONS.RISK_CREATE,
    PERMISSIONS.RISK_READ,
    PERMISSIONS.RISK_UPDATE,
    PERMISSIONS.RISK_DELETE,
    PERMISSIONS.CONTROL_CREATE,
    PERMISSIONS.CONTROL_READ,
    PERMISSIONS.CONTROL_UPDATE,
    PERMISSIONS.CONTROL_DELETE,
    PERMISSIONS.DOCUMENT_CREATE,
    PERMISSIONS.DOCUMENT_READ,
    PERMISSIONS.DOCUMENT_UPDATE,
    PERMISSIONS.ASSESSMENT_CREATE,
    PERMISSIONS.ASSESSMENT_READ,
    PERMISSIONS.ASSESSMENT_UPDATE,
    PERMISSIONS.WORKFLOW_CREATE,
    PERMISSIONS.WORKFLOW_READ,
    PERMISSIONS.WORKFLOW_UPDATE,
    PERMISSIONS.REPORT_CREATE,
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.AI_CHAT,
    PERMISSIONS.AI_ANALYSIS,
    PERMISSIONS.BULK_IMPORT,
    PERMISSIONS.BULK_EXPORT,
  ],
  AUDITOR: [
    PERMISSIONS.RISK_READ,
    PERMISSIONS.CONTROL_READ,
    PERMISSIONS.DOCUMENT_READ,
    PERMISSIONS.ASSESSMENT_READ,
    PERMISSIONS.WORKFLOW_READ,
    PERMISSIONS.REPORT_CREATE,
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.AI_CHAT,
    PERMISSIONS.BULK_EXPORT,
  ],
  USER: [
    PERMISSIONS.RISK_READ,
    PERMISSIONS.CONTROL_READ,
    PERMISSIONS.DOCUMENT_READ,
    PERMISSIONS.ASSESSMENT_READ,
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.AI_CHAT,
  ],
} as const;

/**
 * Check if user has specific permission
 */
export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  return userPermissions.includes('*') || userPermissions.includes(requiredPermission);
}

/**
 * Check if user has any of the required permissions
 */
export function hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
  if (userPermissions.includes('*')) return true;
  return requiredPermissions.some(permission => userPermissions.includes(permission));
}

/**
 * Check if user has all of the required permissions
 */
export function hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
  if (userPermissions.includes('*')) return true;
  return requiredPermissions.every(permission => userPermissions.includes(permission));
}

/**
 * Get default permissions for a role
 */
export function getDefaultPermissions(role: keyof typeof ROLE_PERMISSIONS): string[] {
  return [...(ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.USER)];
}

/**
 * Check if role exists
 */
export function isValidRole(role: string): role is keyof typeof ROLE_PERMISSIONS {
  return role in ROLE_PERMISSIONS;
}

/**
 * Get all available permissions
 */
export function getAllPermissions(): string[] {
  return Object.values(PERMISSIONS);
}

/**
 * Group permissions by category
 */
export function getPermissionsByCategory(): Record<string, string[]> {
  const categories: Record<string, string[]> = {};
  
  Object.entries(PERMISSIONS).forEach(([key, permission]) => {
    const category = permission.split(':')[0];
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(permission);
  });
  
  return categories;
}

/**
 * Format permission for display
 */
export function formatPermission(permission: string): string {
  const [category, action] = permission.split(':');
  const capitalizedCategory = category.charAt(0).toUpperCase() + category.slice(1);
  const capitalizedAction = action.charAt(0).toUpperCase() + action.slice(1);
  
  return `${capitalizedCategory} ${capitalizedAction}`;
}

/**
 * Check if user can access resource
 */
export function canAccessResource(
  userPermissions: string[],
  resourceType: string,
  action: string
): boolean {
  const permission = `${resourceType}:${action}`;
  return hasPermission(userPermissions, permission);
}

/**
 * Get user's effective permissions (including role-based)
 */
export function getEffectivePermissions(
  userRole: string,
  explicitPermissions: string[] = []
): string[] {
  const rolePermissions = getDefaultPermissions(userRole as keyof typeof ROLE_PERMISSIONS);
  const allPermissions = [...rolePermissions, ...explicitPermissions];
  
  // Remove duplicates and return
  return [...new Set(allPermissions)];
}

// Type exports
export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];
export type Role = keyof typeof ROLE_PERMISSIONS;

export * from './auth-options';
export { default } from './auth-options'; 