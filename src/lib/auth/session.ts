import { db } from '@/lib/db';
import { generateTokenPair, type JWTPayload } from './jwt';
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
  user: Pick<User, 'id' | 'email' | 'firstName' | 'lastName' | 'role' | 'permissions' | 'organizationId'>;
}

/**
 * Create a new session for user
 */
export async function createSession(
  user: Pick<User, 'id' | 'email' | 'role' | 'permissions' | 'organizationId'>,
  options: CreateSessionOptions = {}
): Promise<{ session: Session; tokens: ReturnType<typeof generateTokenPair> }> {
  const { ipAddress, userAgent, maxSessions = 10 } = options;

  // Clean up expired sessions for this user
  await cleanupExpiredSessions(user.id);

  // Enforce session limits
  await enforceSessionLimit(user.id, maxSessions);

  // Create new session in database
  const session = await db.client.session.create({
    data: {
      userId: user.id,
      ipAddress,
      userAgent,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  // Generate JWT tokens
  const tokenPayload: Omit<JWTPayload, 'tokenType'> = {
    userId: user.id,
    organizationId: user.organizationId,
    role: user.role,
    permissions: user.permissions,
    sessionId: session.id,
  };

  const tokens = generateTokenPair(tokenPayload);

  // Update session with token (for tracking purposes)
  await db.client.session.update({
    where: { id: session.id },
    data: { token: tokens.refreshToken },
  });

  // Update user's last login
  await db.client.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  return { session, tokens };
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
export async function refreshSession(sessionId: string): Promise<{
  session: SessionWithUser;
  tokens: ReturnType<typeof generateTokenPair>;
} | null> {
  const session = await getSession(sessionId);

  if (!session) {
    return null;
  }

  // Check if session is expired
  if (session.expiresAt < new Date()) {
    await deleteSession(sessionId);
    return null;
  }

  // Generate new tokens
  const tokenPayload: Omit<JWTPayload, 'tokenType'> = {
    userId: session.user.id,
    organizationId: session.user.organizationId,
    role: session.user.role,
    permissions: session.user.permissions,
    sessionId: session.id,
  };

  const tokens = generateTokenPair(tokenPayload);

  // Update session with new token and extend expiration
  const updatedSession = await db.client.session.update({
    where: { id: sessionId },
    data: {
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Extend by 7 days
    },
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

  return { session: updatedSession, tokens };
}

/**
 * Delete session (logout)
 */
export async function deleteSession(sessionId: string): Promise<void> {
  await db.client.session.delete({
    where: { id: sessionId },
  });
}

/**
 * Delete all sessions for a user (logout all devices)
 */
export async function deleteAllUserSessions(userId: string): Promise<void> {
  await db.client.session.deleteMany({
    where: { userId },
  });
}

/**
 * Get all active sessions for a user
 */
export async function getUserSessions(userId: string): Promise<Session[]> {
  return db.client.session.findMany({
    where: {
      userId,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(userId?: string): Promise<number> {
  const where: any = {
    expiresAt: {
      lt: new Date(),
    },
  };

  if (userId) {
    where.userId = userId;
  }

  const result = await db.client.session.deleteMany({ where });
  return result.count;
}

/**
 * Enforce session limit per user
 */
async function enforceSessionLimit(userId: string, maxSessions: number): Promise<void> {
  const sessions = await db.client.session.findMany({
    where: {
      userId,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: 'asc', // Oldest first
    },
  });

  if (sessions.length >= maxSessions) {
    // Delete oldest sessions to make room
    const sessionsToDelete = sessions.slice(0, sessions.length - maxSessions + 1);
    
    await db.client.session.deleteMany({
      where: {
        id: {
          in: sessionsToDelete.map(s => s.id),
        },
      },
    });
  }
}

/**
 * Update session activity (bump last activity time)
 */
export async function updateSessionActivity(sessionId: string): Promise<void> {
  await db.client.session.updateMany({
    where: {
      id: sessionId,
      expiresAt: {
        gt: new Date(),
      },
    },
    data: {
      // We don't have a lastActivity field, but we could add one to the schema
      // For now, we'll just ensure the session exists and is not expired
    },
  });
}

/**
 * Get session statistics for monitoring
 */
export async function getSessionStatistics(): Promise<{
  activeSessions: number;
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
  });

  const averageSessionDuration = sessions.length > 0
    ? sessions.reduce((sum, session) => {
        return sum + (session.expiresAt.getTime() - session.createdAt.getTime());
      }, 0) / sessions.length / 1000 / 60 / 60 // Convert to hours
    : 0;

  return {
    activeSessions,
    totalSessions,
    expiredSessions,
    averageSessionDuration,
  };
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
  if (!userAgent) return {};

  // Simple user agent parsing (in production, consider using a library like ua-parser-js)
  const result: { browser?: string; os?: string; device?: string } = {};

  // Browser detection
  if (userAgent.includes('Chrome')) result.browser = 'Chrome';
  else if (userAgent.includes('Firefox')) result.browser = 'Firefox';
  else if (userAgent.includes('Safari')) result.browser = 'Safari';
  else if (userAgent.includes('Edge')) result.browser = 'Edge';

  // OS detection
  if (userAgent.includes('Windows')) result.os = 'Windows';
  else if (userAgent.includes('Mac OS')) result.os = 'macOS';
  else if (userAgent.includes('Linux')) result.os = 'Linux';
  else if (userAgent.includes('Android')) result.os = 'Android';
  else if (userAgent.includes('iOS')) result.os = 'iOS';

  // Device detection
  if (userAgent.includes('Mobile')) result.device = 'Mobile';
  else if (userAgent.includes('Tablet')) result.device = 'Tablet';
  else result.device = 'Desktop';

  return result;
} 