import { db } from '@/lib/db';
import { generateSecureToken } from '@/lib/auth/jwt';
import { env } from '@/config/env';
import type { User, Session } from '@prisma/client';

export interface SessionData {
  sessionId: string;
  userId: string;
  organizationId: string;
  role: string;
  permissions: string[];
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
}

export interface CreateSessionOptions {
  ipAddress?: string;
  userAgent?: string;
  maxSessions?: number;
}

export interface SessionWithUser extends Session {
  user: Pick<
    User,
    'id' | 'email' | 'firstName' | 'lastName' | 'role' | 'permissions' | 'organizationId'
  >;
}

export interface SessionOptions {
  ipAddress?: string;
  userAgent?: string;
  rememberMe?: boolean;
}

export interface SessionResult {
  session: {
    id: string;
    token: string;
    expiresAt: Date;
  }
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    refreshExpiresIn: number;
  }
}

/**
 * Create a new session for user
 */
export async function createSession(
  user: { id: string; email: string; role: string; organizationId: string },
  options: SessionOptions = {}
): Promise<SessionResult> {
  const { ipAddress, userAgent, rememberMe = false } = options;

  // Set token expiration based on rememberMe flag
  const accessTokenExpiry = rememberMe ? 7 * 24 * 3600 : 3600; // 7 days vs 1 hour
  const refreshTokenExpiry = rememberMe ? 30 * 24 * 3600 : 86400; // 30 days vs 1 day
  const sessionExpiry = new Date(Date.now() + refreshTokenExpiry * 1000);

  try {
    // Generate session token
    const sessionToken = generateSecureToken()

    // Create session record
    const session = await db.client.session.create({
      data: {
        userId: user.id,
        token: sessionToken,
        expiresAt: sessionExpiry,
        ipAddress,
        userAgent,
      },
    })

    // Generate JWT tokens
    const accessToken = generateSecureToken()
    const refreshToken = generateSecureToken();

    // Clean up old sessions (keep only 10 most recent)
    await cleanupOldSessions(user.id)

    return {
      session: {
        id: session.id,
        token: session.token,
        expiresAt: session.expiresAt,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: accessTokenExpiry,
        refreshExpiresIn: refreshTokenExpiry,
      },
    }
  } catch (error) {
    // console.error('Session creation error:', error)
    throw new Error('Failed to create session');
  }
}

/**
 * Get session by ID with user data
 */
export async function getSession(sessionId: string): Promise<SessionWithUser | null> {
  return db.client.session.findUnique({
    where: { id: sessionId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          permissions: true,
          organizationId: true,
        },
      },
    },
  });
}

/**
 * Get session by refresh token
 */
export async function getSessionByToken(token: string): Promise<SessionWithUser | null> {
  return db.client.session.findUnique({
    where: { token },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          permissions: true,
          organizationId: true,
        },
      },
    },
  });
}

/**
 * Validate and refresh session
 */
export async function validateSession(sessionToken: string): Promise<{
  isValid: boolean;
  user?: any;
  session?: any;
}> {
  try {
    const session = await db.client.session.findUnique({
      where: { token: sessionToken },
      include: {
        user: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!session) {
      return { isValid: false }
    }

    // Check if session has expired
    if (session.expiresAt < new Date()) {
      // Clean up expired session
      await db.client.session.delete({
        where: { id: session.id },
      })
      return { isValid: false }
    }

    // Check if user is still active
    if (!session.user.isActive) {
      return { isValid: false }
    }

    return {
      isValid: true,
      user: session.user,
      session,
    }
  } catch (error) {
    // console.error('Session validation error:', error)
    return { isValid: false }
  }
}

/**
 * Invalidate session
 */
export async function invalidateSession(sessionToken: string): Promise<void> {
  try {
    await db.client.session.delete({
      where: { token: sessionToken },
    });
  } catch (error) {
    // console.error('Session invalidation error:', error)
    // Don't throw error if session doesn't exist
  }
}

/**
 * Invalidate all sessions for user
 */
export async function invalidateAllSessions(_userId: string): Promise<void> {
  try {
    await db.client.session.deleteMany({
      where: { userId },
    })
  } catch (error) {
    // console.error('All sessions invalidation error:', error)
    throw new Error('Failed to invalidate sessions');
  }
}

/**
 * Clean up old sessions for user
 */
export async function cleanupOldSessions(_userId: string, keepCount: number = 10): Promise<void> {
  try {
    // Get all sessions for user ordered by creation date
    const sessions = await db.client.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    })

    // Delete sessions beyond the keep count
    if (sessions.length > keepCount) {
      const sessionsToDelete = sessions.slice(keepCount)
      const sessionIdsToDelete = sessionsToDelete.map((s) => s.id);

      await db.client.session.deleteMany({
        where: {
          id: { in: sessionIdsToDelete },
        },
      });
    }
  } catch (error) {
    // console.error('Session cleanup error:', error)
    // Don't throw error, this is a maintenance operation
  }
}

/**
 * Clean up expired sessions globally
 */
export async function cleanupExpiredSessions(): Promise<void> {
  try {
    await db.client.session.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    })
  } catch (error) {
    // console.error('Expired sessions cleanup error:', error)
  }
}

/**
 * Get active sessions for user
 */
export async function getActiveSessions(_userId: string): Promise<any[]> {
  try {
    return await db.client.session.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
        ipAddress: true,
        userAgent: true,
      },
    });
  } catch (error) {
    // console.error('Get active sessions error:', error)
    return [];
  }
}

/**
 * Update session activity
 */
export async function updateSessionActivity(
  sessionToken: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    await db.client.session.update({
      where: { token: sessionToken },
      data: {
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    // console.error('Session activity update error:', error)
    // Don't throw error, this is optional
  }
}

/**
 * Get session statistics for monitoring
 */
export async function getSessionStatistics(): Promise<{
  activeSessions: number
  totalSessions: number;
  expiredSessions: number;
  averageSessionDuration: number;
}> {
  const now = new Date();

  const [activeSessions, totalSessions, expiredSessions] = await Promise.all([
    db.client.session.count({
      where: {
        expiresAt: { gt: now },
      },
    }),
    db.client.session.count(),
    db.client.session.count({
      where: {
        expiresAt: { lt: now },
      },
    }),
  ]);

  // Calculate average session duration (simplified)
  const sessions = await db.client.session.findMany({
    select: {
      createdAt: true,
      expiresAt: true,
    },
    take: 100, // Sample for performance
    orderBy: {
      createdAt: 'desc',
    },
  })

  const averageSessionDuration =
    sessions.length > 0
      ? sessions.reduce((sum, session) => {
          return sum + (session.expiresAt.getTime() - session.createdAt.getTime());
        }, 0) /
        sessions.length /
        1000 /
        60 /
        60 // Convert to hours
      : 0;

  return {
    activeSessions,
    totalSessions,
    expiredSessions,
    averageSessionDuration,
  }
}

/**
 * Check if session is valid and not expired
 */
export async function isSessionValid(sessionId: string): Promise<boolean> {
  const session = await db.client.session.findUnique({
    where: { id: sessionId },
    select: { expiresAt: true },
  });

  return session ? session.expiresAt > new Date() : false;
}

/**
 * Delete session by ID
 */
export async function deleteSession(sessionId: string): Promise<void> {
  try {
    await db.client.session.delete({
      where: { id: sessionId },
    });
  } catch (error) {
    // console.error('Session deletion error:', error)
    throw new Error('Failed to delete session');
  }
}

/**
 * Revoke session by ID (for admin use)
 */
export async function revokeSession(sessionId: string): Promise<boolean> {
  try {
    await deleteSession(sessionId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get device information from user agent
 */
export function parseUserAgent(userAgent?: string): {
  browser?: string;
  os?: string;
  device?: string;
} {
  if (!userAgent) return {}

  // Simple user agent parsing (in production, consider using a library like ua-parser-js)
  const result: { browser?: string; os?: string; device?: string } = {}

  // Browser detection
  if (userAgent.includes('Chrome')) result.browser = 'Chrome'
  else if (userAgent.includes('Firefox')) result.browser = 'Firefox';
  else if (userAgent.includes('Safari')) result.browser = 'Safari';
  else if (userAgent.includes('Edge')) result.browser = 'Edge';

  // OS detection
  if (userAgent.includes('Windows')) result.os = 'Windows'
  else if (userAgent.includes('Mac OS')) result.os = 'macOS';
  else if (userAgent.includes('Linux')) result.os = 'Linux';
  else if (userAgent.includes('Android')) result.os = 'Android';
  else if (userAgent.includes('iOS')) result.os = 'iOS';

  // Device detection
  if (userAgent.includes('Mobile')) result.device = 'Mobile'
  else if (userAgent.includes('Tablet')) result.device = 'Tablet';
  else result.device = 'Desktop';

  return result;
}
