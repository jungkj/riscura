import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '@/lib/db';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  refreshExpiresAt: Date;
}

export interface JWTPayload {
  userId: string;
  organizationId: string;
  email: string;
  role: string;
  permissions: string[];
  sessionId: string;
  tokenType: 'access' | 'refresh';
  deviceInfo?: {
    userAgent: string;
    ip: string;
    deviceId: string;
  }
  mfaVerified?: boolean;
  lastActivity: Date;
}

export interface SessionInfo {
  id: string;
  userId: string;
  organizationId: string;
  deviceInfo: {
    userAgent: string;
    ip: string;
    deviceId: string;
    location?: string;
  }
  isActive: boolean;
  lastActivity: Date;
  createdAt: Date;
  expiresAt: Date;
  refreshTokenHash: string;
  mfaVerified: boolean;
  riskScore: number;
}

export interface SecuritySettings {
  accessTokenTTL: number; // seconds
  refreshTokenTTL: number; // seconds
  maxActiveSessions: number;
  enableTokenRotation: boolean;
  requireMFAForSensitive: boolean;
  enableRiskBasedAuth: boolean;
  allowedDevices: number;
  sessionTimeout: number;
  enableDeviceTracking: boolean;
}

export class EnhancedJWTService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly tokenBlacklist = new Set<string>();
  private readonly activeSessions = new Map<string, SessionInfo>();

  private readonly defaultSettings: SecuritySettings = {
    accessTokenTTL: 15 * 60, // 15 minutes
    refreshTokenTTL: 7 * 24 * 60 * 60, // 7 days
    maxActiveSessions: 5,
    enableTokenRotation: true,
    requireMFAForSensitive: true,
    enableRiskBasedAuth: true,
    allowedDevices: 3,
    sessionTimeout: 30 * 60, // 30 minutes of inactivity
    enableDeviceTracking: true,
  }

  constructor(settings?: Partial<SecuritySettings>) {
    this.accessTokenSecret =
      process.env.JWT_ACCESS_SECRET || crypto.randomBytes(64).toString('hex');
    this.refreshTokenSecret =
      process.env.JWT_REFRESH_SECRET || crypto.randomBytes(64).toString('hex');

    if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
      // console.warn('JWT secrets not set in environment variables. Using generated secrets.')
    }
  }

  /**
   * Generate token pair with enhanced security
   */
  async generateTokenPair(_userId: string,
    organizationId: string,
    email: string,
    role: string,
    permissions: string[],
    deviceInfo: {
      userAgent: string;
      ip: string;
      deviceId?: string;
    },
    mfaVerified: boolean = false
  ): Promise<TokenPair> {
    // Generate unique session ID
    const sessionId = crypto.randomUUID()
    const deviceId = deviceInfo.deviceId || this.generateDeviceId(deviceInfo);

    // Calculate risk score
    const riskScore = await this.calculateRiskScore(userId, deviceInfo.ip, deviceId)

    // Check session limits
    await this.enforceSessionLimits(userId)

    const now = new Date();
    const accessExpiresAt = new Date(now.getTime() + this.defaultSettings.accessTokenTTL * 1000);
    const refreshExpiresAt = new Date(now.getTime() + this.defaultSettings.refreshTokenTTL * 1000);

    // Create JWT payload
    const basePayload: Omit<JWTPayload, 'tokenType'> = {
      userId,
      organizationId,
      email,
      role,
      permissions,
      sessionId,
      deviceInfo: {
        ...deviceInfo,
        deviceId,
      },
      mfaVerified,
      lastActivity: now,
    }

    // Generate tokens
    const accessToken = jwt.sign({ ...basePayload, tokenType: 'access' }, this.accessTokenSecret, {
      expiresIn: this.defaultSettings.accessTokenTTL,
      issuer: 'riscura',
      audience: organizationId,
      subject: userId,
      jwtid: crypto.randomUUID(),
    })

    const refreshToken = jwt.sign(
      { ...basePayload, tokenType: 'refresh' },
      this.refreshTokenSecret,
      {
        expiresIn: this.defaultSettings.refreshTokenTTL,
        issuer: 'riscura',
        audience: organizationId,
        subject: userId,
        jwtid: crypto.randomUUID(),
      }
    );

    // Store session information
    const sessionInfo: SessionInfo = {
      id: sessionId,
      userId,
      organizationId,
      deviceInfo: {
        ...deviceInfo,
        deviceId,
      },
      isActive: true,
      lastActivity: now,
      createdAt: now,
      expiresAt: refreshExpiresAt,
      refreshTokenHash: crypto.createHash('sha256').update(refreshToken).digest('hex'),
      mfaVerified,
      riskScore,
    }

    await this.storeSession(sessionInfo);
    this.activeSessions.set(sessionId, sessionInfo);

    return {
      accessToken,
      refreshToken,
      expiresAt: accessExpiresAt,
      refreshExpiresAt,
    }
  }

  /**
   * Verify and decode token with security checks
   */
  async verifyToken(token: string, tokenType: 'access' | 'refresh'): Promise<JWTPayload | null> {
    try {
      // Check if token is blacklisted
      if (this.tokenBlacklist.has(this.getTokenHash(token))) {
        throw new Error('Token has been revoked')
      }

      const secret = tokenType === 'access' ? this.accessTokenSecret : this.refreshTokenSecret;

      const decoded = jwt.verify(token, secret) as JWTPayload;

      // Verify token type matches
      if (decoded.tokenType !== tokenType) {
        throw new Error('Invalid token type')
      }

      // Check if session is still active
      const session = await this.getSession(decoded.sessionId)
      if (!session || !session.isActive) {
        throw new Error('Session is no longer active');
      }

      // Check session timeout
      const now = new Date()
      const timeSinceLastActivity = now.getTime() - session.lastActivity.getTime();
      if (timeSinceLastActivity > this.defaultSettings.sessionTimeout * 1000) {
        await this.terminateSession(decoded.sessionId);
        throw new Error('Session has timed out');
      }

      // Update last activity
      await this.updateSessionActivity(decoded.sessionId)

      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Refresh token pair with rotation
   */
  async refreshTokenPair(refreshToken: string): Promise<TokenPair | null> {
    const decoded = await this.verifyToken(refreshToken, 'refresh');
    if (!decoded) {
      return null;
    }

    // Invalidate old refresh token
    await this.revokeToken(refreshToken)

    // Generate new token pair
    return this.generateTokenPair(
      decoded.userId,
      decoded.organizationId,
      decoded.email,
      decoded.role,
      decoded.permissions,
      decoded.deviceInfo!,
      decoded.mfaVerified
    )
  }

  /**
   * Revoke token (add to blacklist)
   */
  async revokeToken(token: string): Promise<void> {
    const tokenHash = this.getTokenHash(token);
    this.tokenBlacklist.add(tokenHash);

    // Store in persistent storage
    await this.storeRevokedToken(tokenHash)
  }

  /**
   * Terminate specific session
   */
  async terminateSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.isActive = false;
      await this.updateSession(sessionId, { isActive: false });
      this.activeSessions.delete(sessionId);
    }
  }

  /**
   * Terminate all sessions for a user
   */
  async terminateAllSessions(_userId: string, exceptSessionId?: string): Promise<void> {
    const userSessions = await this.getUserSessions(userId);

    for (const session of userSessions) {
      if (session.id !== exceptSessionId) {
        await this.terminateSession(session.id);
      }
    }
  }

  /**
   * Get active sessions for a user
   */
  async getUserSessions(_userId: string): Promise<SessionInfo[]> {
    // TODO: Implement database query
    return Array.from(this.activeSessions.values()).filter((s) => s.userId === userId)
  }

  /**
   * Calculate risk score based on device and location
   */
  private async calculateRiskScore(_userId: string, ip: string, deviceId: string): Promise<number> {
    let riskScore = 0;

    // Check if device is known
    const knownDevice = await this.isKnownDevice(userId, deviceId)
    if (!knownDevice) {
      riskScore += 30;
    }

    // Check if IP is from unusual location
    const usualLocation = await this.isUsualLocation(userId, ip)
    if (!usualLocation) {
      riskScore += 20;
    }

    // Check login time patterns
    const usualTime = await this.isUsualLoginTime(userId)
    if (!usualTime) {
      riskScore += 10;
    }

    // Check recent failed login attempts
    const recentFailures = await this.getRecentFailedAttempts(userId)
    riskScore += Math.min(recentFailures * 5, 40);

    return Math.min(riskScore, 100);
  }

  /**
   * Generate consistent device ID
   */
  private generateDeviceId(deviceInfo: { userAgent: string; ip: string }): string {
    const deviceString = `${deviceInfo.userAgent}-${deviceInfo.ip}`;
    return crypto.createHash('sha256').update(deviceString).digest('hex').substring(0, 16);
  }

  /**
   * Enforce session limits per user
   */
  private async enforceSessionLimits(_userId: string): Promise<void> {
    const userSessions = await this.getUserSessions(userId);
    const activeSessions = userSessions.filter((s) => s.isActive);

    if (activeSessions.length >= this.defaultSettings.maxActiveSessions) {
      // Terminate oldest sessions
      const sortedSessions = activeSessions.sort(
        (a, b) => a.lastActivity.getTime() - b.lastActivity.getTime()
      )
      const sessionsToTerminate = sortedSessions.slice(
        0,
        sortedSessions.length - this.defaultSettings.maxActiveSessions + 1
      );

      for (const session of sessionsToTerminate) {
        await this.terminateSession(session.id);
      }
    }
  }

  /**
   * Get token hash for blacklisting
   */
  private getTokenHash(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // Database interface methods (to be implemented with actual database)
  private async storeSession(session: SessionInfo): Promise<void> {
    // TODO: Implement with database
    // console.log(`Storing session ${session.id} for user ${session.userId}`)
  }

  private async getSession(sessionId: string): Promise<SessionInfo | null> {
    return this.activeSessions.get(sessionId) || null;
  }

  private async updateSession(sessionId: string, updates: Partial<SessionInfo>): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      Object.assign(session, updates);
      this.activeSessions.set(sessionId, session);
    }
  }

  private async updateSessionActivity(sessionId: string): Promise<void> {
    await this.updateSession(sessionId, { lastActivity: new Date() });
  }

  private async storeRevokedToken(tokenHash: string): Promise<void> {
    // TODO: Implement with database
    // console.log(`Storing revoked token hash: ${tokenHash}`)
  }

  private async isKnownDevice(_userId: string, deviceId: string): Promise<boolean> {
    // TODO: Implement device tracking
    return false
  }

  private async isUsualLocation(_userId: string, ip: string): Promise<boolean> {
    // TODO: Implement location tracking
    return true
  }

  private async isUsualLoginTime(_userId: string): Promise<boolean> {
    // TODO: Implement time pattern analysis
    return true
  }

  private async getRecentFailedAttempts(_userId: string): Promise<number> {
    // TODO: Implement failed attempt tracking
    return 0
  }

  /**
   * Cleanup expired tokens and sessions
   */
  async cleanupExpired(): Promise<void> {
    const now = new Date();

    // Remove expired sessions
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.expiresAt < now) {
        await this.terminateSession(sessionId)
      }
    }

    // TODO: Cleanup expired blacklisted tokens from database
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics(): {
    activeSessions: number
    blacklistedTokens: number;
    averageRiskScore: number;
    suspiciousActivities: number;
  } {
    const sessions = Array.from(this.activeSessions.values());
    const averageRiskScore =
      sessions.length > 0 ? sessions.reduce((sum, s) => sum + s.riskScore, 0) / sessions.length : 0;

    return {
      activeSessions: sessions.length,
      blacklistedTokens: this.tokenBlacklist.size,
      averageRiskScore,
      suspiciousActivities: sessions.filter((s) => s.riskScore > 50).length,
    }
  }
}

// Singleton instance
let jwtService: EnhancedJWTService

export const getJWTService = (): EnhancedJWTService => {
  if (!jwtService) {
    jwtService = new EnhancedJWTService();
  }
  return jwtService;
}

// Middleware for request validation
export const validateJWTMiddleware = async (
  token: string,
  requiredPermissions?: string[],
  requireMFA?: boolean
): Promise<{ valid: boolean; payload?: JWTPayload; error?: string }> => {
  try {
    const jwtService = getJWTService();
    const payload = await jwtService.verifyToken(token, 'access');

    if (!payload) {
      return { valid: false, error: 'Invalid or expired token' }
    }

    // Check MFA requirement
    if (requireMFA && !payload.mfaVerified) {
      return { valid: false, error: 'MFA verification required' }
    }

    // Check permissions
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasPermission = requiredPermissions.some((permission) =>
        payload.permissions.includes(permission)
      )

      if (!hasPermission) {
        return { valid: false, error: 'Insufficient permissions' }
      }
    }

    return { valid: true, payload }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Token validation failed',
    }
  }
}
