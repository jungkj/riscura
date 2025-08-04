import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { env } from '@/config/env';
import { productionGuard } from '@/lib/security/production-guard';
import crypto from 'crypto';

/**
 * CSRF Protection Implementation
 * Implements Double Submit Cookie pattern with token rotation
 */

export interface CSRFConfig {
  tokenName: string;
  cookieName: string;
  headerName: string;
  secret: string;
  tokenLength: number;
  rotationInterval: number; // in milliseconds
  sameSite: 'strict' | 'lax' | 'none';
  secure: boolean;
  httpOnly: boolean;
  maxAge: number;
}

const DEFAULT_CSRF_CONFIG: CSRFConfig = {
  tokenName: 'csrfToken',
  cookieName: 'csrf-token',
  headerName: 'x-csrf-token',
  secret: env.CSRF_SECRET,
  tokenLength: 32,
  rotationInterval: 30 * 60 * 1000, // 30 minutes
  sameSite: productionGuard.isProduction() ? 'strict' : 'lax',
  secure: productionGuard.isProduction(),
  httpOnly: false, // Must be false to allow JavaScript access
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
};

/**
 * CSRF Token Manager
 */
export class CSRFProtection {
  private static instance: CSRFProtection;
  private config: CSRFConfig;
  private tokenStore = new Map<string, { token: string; timestamp: number; sessionId?: string }>();

  private constructor(config?: Partial<CSRFConfig>) {
    this.config = { ...DEFAULT_CSRF_CONFIG, ...config };

    // Validate configuration
    if (!this.config.secret || this.config.secret.length < 32) {
      throw new Error('CSRF secret must be at least 32 characters long');
    }
  }

  public static getInstance(config?: Partial<CSRFConfig>): CSRFProtection {
    if (!CSRFProtection.instance) {
      CSRFProtection.instance = new CSRFProtection(config);
    }
    return CSRFProtection.instance;
  }

  /**
   * Generate a cryptographically secure CSRF token
   */
  generateToken(sessionId?: string): string {
    // Generate random bytes
    const randomBytes = crypto.randomBytes(this.config.tokenLength);

    // Create a timestamp for token rotation
    const timestamp = Date.now().toString();

    // Combine with session ID if provided
    const data = sessionId
      ? `${randomBytes.toString('hex')}.${timestamp}.${sessionId}`
      : `${randomBytes.toString('hex')}.${timestamp}`;

    // Create HMAC signature to prevent tampering
    const hmac = crypto.createHmac('sha256', this.config.secret);
    hmac.update(data);
    const signature = hmac.digest('hex');

    const token = `${data}.${signature}`;

    // Store token for validation
    this.tokenStore.set(token, {
      token,
      timestamp: Date.now(),
      sessionId,
    });

    // Clean expired tokens
    this.cleanExpiredTokens();

    productionGuard.logSecurityEvent('csrf_token_generated', {
      tokenId: token.substring(0, 8) + '...',
      sessionId: sessionId?.substring(0, 8) + '...',
      timestamp: new Date().toISOString(),
    });

    return token;
  }

  /**
   * Validate CSRF token
   */
  validateToken(token: string, sessionId?: string): boolean {
    if (!token) {
      productionGuard.logSecurityEvent('csrf_validation_failed', {
        reason: 'missing_token',
      });
      return false;
    }

    // Skip validation in demo mode (development only)
    if (!productionGuard.isProduction() && productionGuard.isDemoMode()) {
      return true;
    }

    try {
      // Parse token components
      const parts = token.split('.');
      if (parts.length < 3) {
        productionGuard.logSecurityEvent('csrf_validation_failed', {
          reason: 'invalid_token_format',
          tokenId: token.substring(0, 8) + '...',
        });
        return false;
      }

      const [randomPart, timestamp, ...rest] = parts;
      const signature = rest.pop(); // Last part is always signature
      const providedSessionId = rest.join('.'); // Remaining parts form session ID

      // Reconstruct original data
      const data = providedSessionId
        ? `${randomPart}.${timestamp}.${providedSessionId}`
        : `${randomPart}.${timestamp}`;

      // Verify HMAC signature
      const hmac = crypto.createHmac('sha256', this.config.secret);
      hmac.update(data);
      const expectedSignature = hmac.digest('hex');

      if (signature !== expectedSignature) {
        productionGuard.logSecurityEvent('csrf_validation_failed', {
          reason: 'invalid_signature',
          tokenId: token.substring(0, 8) + '...',
        });
        return false;
      }

      // Check if token exists in store
      const storedToken = this.tokenStore.get(token);
      if (!storedToken) {
        productionGuard.logSecurityEvent('csrf_validation_failed', {
          reason: 'token_not_found',
          tokenId: token.substring(0, 8) + '...',
        });
        return false;
      }

      // Check token age
      const tokenAge = Date.now() - parseInt(timestamp);
      if (tokenAge > this.config.maxAge) {
        this.tokenStore.delete(token);
        productionGuard.logSecurityEvent('csrf_validation_failed', {
          reason: 'token_expired',
          tokenId: token.substring(0, 8) + '...',
          age: tokenAge,
        });
        return false;
      }

      // Validate session ID if provided
      if (sessionId && providedSessionId !== sessionId) {
        productionGuard.logSecurityEvent('csrf_validation_failed', {
          reason: 'session_mismatch',
          tokenId: token.substring(0, 8) + '...',
          expectedSession: sessionId?.substring(0, 8) + '...',
          providedSession: providedSessionId?.substring(0, 8) + '...',
        });
        return false;
      }

      // Check if token needs rotation
      if (tokenAge > this.config.rotationInterval) {
        productionGuard.logSecurityEvent('csrf_token_rotation_needed', {
          tokenId: token.substring(0, 8) + '...',
          age: tokenAge,
        });
      }

      return true;
    } catch (error) {
      productionGuard.logSecurityEvent('csrf_validation_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tokenId: token.substring(0, 8) + '...',
      });
      return false;
    }
  }

  /**
   * Rotate CSRF token (generate new one and invalidate old)
   */
  rotateToken(oldToken: string, sessionId?: string): string {
    // Invalidate old token
    if (oldToken) {
      this.tokenStore.delete(oldToken);
      productionGuard.logSecurityEvent('csrf_token_rotated', {
        oldTokenId: oldToken.substring(0, 8) + '...',
        sessionId: sessionId?.substring(0, 8) + '...',
      });
    }

    // Generate new token
    return this.generateToken(sessionId);
  }

  /**
   * Clean expired tokens from memory store
   */
  private cleanExpiredTokens(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [token, data] of this.tokenStore.entries()) {
      if (now - data.timestamp > this.config.maxAge) {
        this.tokenStore.delete(token);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      productionGuard.logSecurityEvent('csrf_tokens_cleaned', {
        cleanedCount,
        remainingCount: this.tokenStore.size,
      });
    }
  }

  /**
   * Set CSRF token in response cookies
   */
  setTokenCookie(_response: NextResponse, token: string): NextResponse {
    const cookieOptions = {
      name: this.config.cookieName,
      value: token,
      maxAge: this.config.maxAge / 1000, // Convert to seconds
      sameSite: this.config.sameSite,
      secure: this.config.secure,
      httpOnly: this.config.httpOnly,
      path: '/',
    };

    // Set the cookie
    response.cookies.set(cookieOptions);

    return response;
  }

  /**
   * Get CSRF token from request
   */
  getTokenFromRequest(_request: NextRequest): { headerToken?: string; cookieToken?: string } {
    const headerToken = request.headers.get(this.config.headerName) || undefined;
    const cookieToken = request.cookies.get(this.config.cookieName)?.value || undefined;

    return { headerToken, cookieToken };
  }

  /**
   * Validate CSRF protection for request
   */
  validateRequest(_request: NextRequest,
    sessionId?: string
  ): {
    isValid: boolean;
    reason?: string;
    shouldRotate?: boolean;
  } {
    // Skip CSRF for safe methods
    const method = request.method.toUpperCase();
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return { isValid: true };
    }

    // Skip validation in demo mode (development only)
    if (!productionGuard.isProduction() && productionGuard.isDemoMode()) {
      return { isValid: true };
    }

    const { headerToken, cookieToken } = this.getTokenFromRequest(request);

    // Both tokens must be present
    if (!headerToken || !cookieToken) {
      return {
        isValid: false,
        reason: 'Missing CSRF tokens',
      };
    }

    // Tokens must match (Double Submit Cookie pattern)
    if (headerToken !== cookieToken) {
      return {
        isValid: false,
        reason: 'CSRF tokens do not match',
      };
    }

    // Validate token signature and freshness
    const isValid = this.validateToken(headerToken, sessionId);
    if (!isValid) {
      return {
        isValid: false,
        reason: 'Invalid CSRF token',
      };
    }

    // Check if token should be rotated
    const storedToken = this.tokenStore.get(headerToken);
    const shouldRotate =
      storedToken && Date.now() - storedToken.timestamp > this.config.rotationInterval;

    return {
      isValid: true,
      shouldRotate,
    };
  }

  /**
   * Create CSRF-protected response
   */
  createProtectedResponse(
    body?: any,
    init?: ResponseInit & { sessionId?: string; rotateToken?: boolean }
  ): NextResponse {
    const { sessionId, rotateToken, ...responseInit } = init || {};

    const response = NextResponse.json(body, responseInit);

    // Generate or rotate token
    const token = rotateToken ? this.generateToken(sessionId) : this.generateToken(sessionId);

    // Set token in cookie
    this.setTokenCookie(response, token);

    // Also provide token in response body for client-side access
    if (body && typeof body === 'object') {
      body[this.config.tokenName] = token;
    }

    return response;
  }

  /**
   * Middleware for CSRF protection
   */
  middleware() {
    return async (_request: NextRequest): Promise<NextResponse | null> => {
      const validation = this.validateRequest(request);

      if (!validation.isValid) {
        productionGuard.logSecurityEvent('csrf_protection_blocked', {
          method: request.method,
          url: request.url,
          reason: validation.reason,
          ip: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        });

        return NextResponse.json(
          {
            error: 'CSRF protection failed',
            code: 'CSRF_TOKEN_INVALID',
            message: validation.reason,
          },
          { status: 403 }
        );
      }

      // If token should be rotated, we'll handle it in the response
      if (validation.shouldRotate) {
        // Add header to indicate token rotation is needed
        const response = NextResponse.next();
        response.headers.set('X-CSRF-Token-Rotation-Needed', 'true');
        return response;
      }

      return null; // Continue to next middleware
    };
  }

  /**
   * Get configuration for debugging
   */
  getConfig(): CSRFConfig {
    return { ...this.config };
  }

  /**
   * Get statistics about token store
   */
  getStats(): {
    activeTokens: number;
    oldestToken: number;
    newestToken: number;
  } {
    const now = Date.now();
    let oldest = now;
    let newest = 0;

    for (const data of this.tokenStore.values()) {
      if (data.timestamp < oldest) oldest = data.timestamp;
      if (data.timestamp > newest) newest = data.timestamp;
    }

    return {
      activeTokens: this.tokenStore.size,
      oldestToken: oldest === now ? 0 : now - oldest,
      newestToken: newest === 0 ? 0 : now - newest,
    };
  }
}

// Export singleton instance
export const csrfProtection = CSRFProtection.getInstance();

// Utility functions
export function generateCSRFToken(sessionId?: string): string {
  return csrfProtection.generateToken(sessionId);
}

export function validateCSRFToken(token: string, sessionId?: string): boolean {
  return csrfProtection.validateToken(token, sessionId);
}

export function validateCSRFRequest(_request: NextRequest,
  sessionId?: string
): {
  isValid: boolean;
  reason?: string;
  shouldRotate?: boolean;
} {
  return csrfProtection.validateRequest(request, sessionId);
}

export function createCSRFProtectedResponse(
  body?: any,
  init?: ResponseInit & { sessionId?: string; rotateToken?: boolean }
): NextResponse {
  return csrfProtection.createProtectedResponse(body, init);
}

export function rotateCSRFToken(oldToken: string, sessionId?: string): string {
  return csrfProtection.rotateToken(oldToken, sessionId);
}

/**
 * React hook utility for CSRF token management
 */
export function getCSRFTokenForClient(): string | null {
  if (typeof window === 'undefined') return null;

  // Get token from cookie
  const cookies = document.cookie.split(';');
  const csrfCookie = cookies.find((cookie) =>
    cookie.trim().startsWith(`${DEFAULT_CSRF_CONFIG.cookieName}=`)
  );

  if (csrfCookie) {
    return csrfCookie.split('=')[1];
  }

  return null;
}

/**
 * Fetch wrapper with automatic CSRF token inclusion
 */
export function fetchWithCSRF(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getCSRFTokenForClient();

  if (
    token &&
    options.method &&
    !['GET', 'HEAD', 'OPTIONS'].includes(options.method.toUpperCase())
  ) {
    options.headers = {
      ...options.headers,
      [DEFAULT_CSRF_CONFIG.headerName]: token,
    };
  }

  return fetch(url, options);
}

/**
 * Express/Next.js middleware wrapper
 */
export function withCSRFProtection(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Apply CSRF protection
    const csrfResult = await csrfProtection.middleware()(req);
    if (csrfResult) {
      return csrfResult; // CSRF validation failed
    }

    // Call the actual handler
    const response = await handler(req);

    // Check if token rotation is needed
    const rotationNeeded = response.headers.get('X-CSRF-Token-Rotation-Needed');
    if (rotationNeeded) {
      const { headerToken } = csrfProtection.getTokenFromRequest(req);
      if (headerToken) {
        const newToken = csrfProtection.rotateToken(headerToken);
        csrfProtection.setTokenCookie(response, newToken);

        // Add new token to response body if it's JSON
        try {
          const body = await response.json();
          if (body && typeof body === 'object') {
            body[DEFAULT_CSRF_CONFIG.tokenName] = newToken;
            return NextResponse.json(body, {
              status: response.status,
              headers: response.headers,
            });
          }
        } catch {
          // Not JSON response, just set cookie
        }
      }
    }

    return response;
  };
}
