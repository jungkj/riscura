import jwt from 'jsonwebtoken';
import { env } from '@/config/env';

export interface JWTPayload {
  userId: string;
  organizationId: string;
  role: string;
  permissions: string[];
  sessionId: string;
  tokenType: 'access' | 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

// Token expiration times
const ACCESS_TOKEN_EXPIRES_IN = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRES_IN = '7d'; // 7 days

/**
 * Generate JWT access token
 */
export function generateAccessToken(payload: Omit<JWTPayload, 'tokenType'>): string {
  return jwt.sign(
    {
      ...payload,
      tokenType: 'access',
    },
    env.JWT_SECRET,
    {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
      issuer: env.APP_NAME,
      audience: env.APP_URL,
    }
  );
}

/**
 * Generate JWT refresh token
 */
export function generateRefreshToken(payload: Omit<JWTPayload, 'tokenType'>): string {
  return jwt.sign(
    {
      ...payload,
      tokenType: 'refresh',
    },
    env.JWT_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
      issuer: env.APP_NAME,
      audience: env.APP_URL,
    }
  );
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(payload: Omit<JWTPayload, 'tokenType'>): TokenPair {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
    expiresIn: 15 * 60, // 15 minutes in seconds
    refreshExpiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
  };
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      issuer: env.APP_NAME,
      audience: env.APP_URL,
    });

    if (typeof decoded === 'string') {
      throw new Error('Invalid token format');
    }

    return decoded as JWTPayload;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    } else if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    } else if (error instanceof jwt.NotBeforeError) {
      throw new Error('Token not active');
    }
    throw error;
  }
}

/**
 * Verify access token specifically
 */
export function verifyAccessToken(token: string): JWTPayload {
  const payload = verifyToken(token);
  
  if (payload.tokenType !== 'access') {
    throw new Error('Invalid token type');
  }

  return payload;
}

/**
 * Verify refresh token specifically
 */
export function verifyRefreshToken(token: string): JWTPayload {
  const payload = verifyToken(token);
  
  if (payload.tokenType !== 'refresh') {
    throw new Error('Invalid token type');
  }

  return payload;
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string): string {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Invalid authorization header');
  }

  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

/**
 * Get token expiration time
 */
export function getTokenExpiration(token: string): Date {
  const decoded = jwt.decode(token) as any;
  if (!decoded || !decoded.exp) {
    throw new Error('Invalid token');
  }

  return new Date(decoded.exp * 1000);
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const expiration = getTokenExpiration(token);
    return expiration.getTime() <= Date.now();
  } catch {
    return true;
  }
}

/**
 * Get remaining token lifetime in seconds
 */
export function getTokenRemainingTime(token: string): number {
  try {
    const expiration = getTokenExpiration(token);
    const remaining = Math.floor((expiration.getTime() - Date.now()) / 1000);
    return Math.max(0, remaining);
  } catch {
    return 0;
  }
} 