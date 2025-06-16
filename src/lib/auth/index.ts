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
  type PasswordStrength,
} from './password';

// Session management
export {
  createSession,
  getSession,
  getSessionByToken,
  refreshSession,
  deleteSession,
  deleteAllUserSessions,
  getUserSessions,
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
  hasPermission,
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
  // Risk management
  RISKS_READ: 'risks:read',
  RISKS_WRITE: 'risks:write',
  RISKS_DELETE: 'risks:delete',
  
  // Control management
  CONTROLS_READ: 'controls:read',
  CONTROLS_WRITE: 'controls:write',
  CONTROLS_DELETE: 'controls:delete',
  
  // Document management
  DOCUMENTS_READ: 'documents:read',
  DOCUMENTS_WRITE: 'documents:write',
  DOCUMENTS_DELETE: 'documents:delete',
  
  // Task management
  TASKS_READ: 'tasks:read',
  TASKS_WRITE: 'tasks:write',
  TASKS_DELETE: 'tasks:delete',
  
  // Workflow management
  WORKFLOWS_READ: 'workflows:read',
  WORKFLOWS_WRITE: 'workflows:write',
  WORKFLOWS_DELETE: 'workflows:delete',
  
  // Reporting
  REPORTS_READ: 'reports:read',
  REPORTS_WRITE: 'reports:write',
  REPORTS_DELETE: 'reports:delete',
  
  // Questionnaires
  QUESTIONNAIRES_READ: 'questionnaires:read',
  QUESTIONNAIRES_WRITE: 'questionnaires:write',
  QUESTIONNAIRES_DELETE: 'questionnaires:delete',
  
  // User management
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  USERS_DELETE: 'users:delete',
  
  // Organization management
  ORGANIZATIONS_READ: 'organizations:read',
  ORGANIZATIONS_WRITE: 'organizations:write',
  ORGANIZATIONS_DELETE: 'organizations:delete',
  
  // Admin permissions
  ALL: '*',
} as const;

// Role permission mappings
export const ROLE_PERMISSIONS = {
  ADMIN: [PERMISSIONS.ALL],
  RISK_MANAGER: [
    PERMISSIONS.RISKS_READ,
    PERMISSIONS.RISKS_WRITE,
    PERMISSIONS.RISKS_DELETE,
    PERMISSIONS.CONTROLS_READ,
    PERMISSIONS.CONTROLS_WRITE,
    PERMISSIONS.CONTROLS_DELETE,
    PERMISSIONS.DOCUMENTS_READ,
    PERMISSIONS.DOCUMENTS_WRITE,
    PERMISSIONS.TASKS_READ,
    PERMISSIONS.TASKS_WRITE,
    PERMISSIONS.WORKFLOWS_READ,
    PERMISSIONS.WORKFLOWS_WRITE,
    PERMISSIONS.REPORTS_READ,
  ],
  AUDITOR: [
    PERMISSIONS.RISKS_READ,
    PERMISSIONS.CONTROLS_READ,
    PERMISSIONS.DOCUMENTS_READ,
    PERMISSIONS.TASKS_READ,
    PERMISSIONS.WORKFLOWS_READ,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.REPORTS_WRITE,
    PERMISSIONS.QUESTIONNAIRES_READ,
    PERMISSIONS.QUESTIONNAIRES_WRITE,
  ],
  USER: [
    PERMISSIONS.RISKS_READ,
    PERMISSIONS.CONTROLS_READ,
    PERMISSIONS.DOCUMENTS_READ,
    PERMISSIONS.TASKS_READ,
    PERMISSIONS.WORKFLOWS_READ,
  ],
} as const;

// Utility function to get permissions for a role
export function getPermissionsForRole(role: keyof typeof ROLE_PERMISSIONS): string[] {
  return [...ROLE_PERMISSIONS[role]];
}

// Utility function to check if a user has permission
export function userHasPermission(
  userPermissions: string[],
  requiredPermission: string,
  userRole?: string
): boolean {
  // Admin has all permissions
  if (userRole === 'ADMIN' || userPermissions.includes(PERMISSIONS.ALL)) {
    return true;
  }
  
  return userPermissions.includes(requiredPermission);
}

// Utility function to check if user has any of multiple permissions
export function userHasAnyPermission(
  userPermissions: string[],
  requiredPermissions: string[],
  userRole?: string
): boolean {
  // Admin has all permissions
  if (userRole === 'ADMIN' || userPermissions.includes(PERMISSIONS.ALL)) {
    return true;
  }
  
  return requiredPermissions.some(permission => 
    userPermissions.includes(permission)
  );
}

// Utility function to check if user has all of multiple permissions
export function userHasAllPermissions(
  userPermissions: string[],
  requiredPermissions: string[],
  userRole?: string
): boolean {
  // Admin has all permissions
  if (userRole === 'ADMIN' || userPermissions.includes(PERMISSIONS.ALL)) {
    return true;
  }
  
  return requiredPermissions.every(permission => 
    userPermissions.includes(permission)
  );
}

export * from './auth-options';
export { default } from './auth-options'; 