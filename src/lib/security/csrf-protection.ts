// CSRF Protection System for Enhanced Security
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import React from 'react';
;
export interface CSRFConfig {
  tokenLength: number;
  cookieName: string;
  headerName: string;
  fieldName: string;
  cookieOptions: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    maxAge: number;
    path: string;
    domain?: string;
  }
  exemptMethods: string[];
  exemptPaths: string[];
  doubleSubmitCookie: boolean;
  enableOriginCheck: boolean;
  trustedOrigins: string[];
  rotationInterval: number;
  enableMetrics: boolean;
}

export interface CSRFValidationResult {
  isValid: boolean;
  token?: string;
  reason?: string;
  timestamp: number;
  clientIP: string;
  userAgent: string;
  origin?: string;
}

export interface CSRFMetrics {
  totalRequests: number;
  validRequests: number;
  invalidRequests: number;
  tokensGenerated: number;
  tokensValidated: number;
  suspiciousActivity: number;
  topInvalidReasons: Record<string, number>;
  byIP: Record<string, { valid: number; invalid: number }>;
}

class CSRFProtection {
  private config: CSRFConfig;
  private tokenStore: Map<string, { token: string; timestamp: number; used: boolean }> = new Map();
  private metrics: CSRFMetrics = {
    totalRequests: 0,;
    validRequests: 0,;
    invalidRequests: 0,;
    tokensGenerated: 0,;
    tokensValidated: 0,;
    suspiciousActivity: 0,;
    topInvalidReasons: {},;
    byIP: {},;
  }
  private secretKey: string;
;
  constructor(config?: Partial<CSRFConfig>) {
    this.config = {
      tokenLength: 32,;
      cookieName: '__Host-csrf-token',;
      headerName: 'X-CSRF-Token',;
      fieldName: '_csrf',;
      cookieOptions: {
        httpOnly: true,;
        secure: process.env.NODE_ENV === 'production',;
        sameSite: 'strict',;
        maxAge: 60 * 60 * 24, // 24 hours;
        path: '/',;
      },;
      exemptMethods: ['GET', 'HEAD', 'OPTIONS'],;
      exemptPaths: ['/api/health', '/api/metrics', '/api/csrf-token'],;
      doubleSubmitCookie: true,;
      enableOriginCheck: true,;
      trustedOrigins: [],;
      rotationInterval: 60 * 60 * 1000, // 1 hour;
      enableMetrics: true,;
      ...config,;
    }
;
    // Generate or retrieve secret key
    this.secretKey = process.env.CSRF_SECRET || this.generateSecretKey();
;
    // Setup token rotation
    this.setupTokenRotation();
  }

  // Generate cryptographically secure secret key
  private generateSecretKey(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  // Generate CSRF token
  public generateToken(sessionId?: string): string {
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(this.config.tokenLength);
    const payload = `${timestamp}:${sessionId || 'anonymous'}:${randomBytes.toString('hex')}`;
;
    // Create HMAC signature
    const hmac = crypto.createHmac('sha256', this.secretKey);
    hmac.update(payload);
    const signature = hmac.digest('hex');
;
    const _token = `${Buffer.from(payload).toString('base64')}.${signature}`;
;
    // Store token for validation
    this.tokenStore.set(token, {
      token,;
      timestamp,;
      used: false,;
    });
;
    if (this.config.enableMetrics) {
      this.metrics.tokensGenerated++;
    }

    return token;
  }

  // Validate CSRF token
  public validateToken(token: string, sessionId?: string): boolean {
    if (!token) return false;
;
    try {
      const [payloadBase64, signature] = token.split('.');
      if (!payloadBase64 || !signature) return false;
;
      const payload = Buffer.from(payloadBase64, 'base64').toString();
;
      // Verify HMAC signature
      const hmac = crypto.createHmac('sha256', this.secretKey);
      hmac.update(payload);
      const expectedSignature = hmac.digest('hex');
;
      if (;
        !crypto.timingSafeEqual(;
          Buffer.from(signature, 'hex'),;
          Buffer.from(expectedSignature, 'hex');
        );
      ) {
        return false;
      }

      // Parse payload
      const [timestampStr, tokenSessionId, randomHex] = payload.split(':');
      const timestamp = parseInt(timestampStr, 10);
;
      // Check token age
      const maxAge = this.config.cookieOptions.maxAge * 1000;
      if (Date.now() - timestamp > maxAge) {
        return false;
      }

      // Check session ID if provided
      if (sessionId && tokenSessionId !== sessionId && tokenSessionId !== 'anonymous') {
        return false;
      }

      // Check if token was already used (for one-time tokens)
      const storedToken = this.tokenStore.get(token);
      if (storedToken && storedToken.used) {
        return false;
      }

      // Mark token as used
      if (storedToken) {
        storedToken.used = true;
      }

      if (this.config.enableMetrics) {
        this.metrics.tokensValidated++;
      }

      return true;
    } catch (error) {
      // console.error('CSRF token validation error:', error)
      return false;
    }
  }

  // Middleware function for CSRF protection
  public async middleware(_request: NextRequest): Promise<NextResponse | null> {
    if (!this.config.enableMetrics) {
      this.metrics.totalRequests++;
    }

    const method = request.method;
    const pathname = new URL(request.url).pathname;
    const clientIP = this.getClientIP(request);
    const origin = request.headers.get('origin');
    const userAgent = request.headers.get('user-agent') || '';
;
    // Skip exempt methods
    if (this.config.exemptMethods.includes(method)) {
      return null;
    }

    // Skip exempt paths
    if (this.config.exemptPaths.some((path) => pathname.startsWith(path))) {
      return null;
    }

    const validationResult: CSRFValidationResult = {
      isValid: false,;
      timestamp: Date.now(),;
      clientIP,;
      userAgent,;
      origin: origin || undefined,;
    }
;
    // Origin check
    if (this.config.enableOriginCheck && origin) {
      if (!this.isOriginTrusted(origin, request)) {
        validationResult.reason = 'Untrusted origin';
        this.recordInvalidRequest(validationResult);
        return this.createErrorResponse('Invalid origin', 403);
      }
    }

    // Get CSRF token from various sources
    const _token = this.extractToken(request);
    if (!token) {
      validationResult.reason = 'Missing CSRF token';
      this.recordInvalidRequest(validationResult);
      return this.createErrorResponse('CSRF token required', 403);
    }

    validationResult.token = token;
;
    // Validate token
    const sessionId = this.extractSessionId(request);
    const isValidToken = this.validateToken(token, sessionId);
;
    if (!isValidToken) {
      validationResult.reason = 'Invalid CSRF token';
      this.recordInvalidRequest(validationResult);
      return this.createErrorResponse('Invalid CSRF token', 403);
    }

    // Double-submit cookie validation
    if (this.config.doubleSubmitCookie) {
      const cookieToken = this.extractCookieToken(request);
      if (token !== cookieToken) {
        validationResult.reason = 'Token mismatch';
        this.recordInvalidRequest(validationResult);
        return this.createErrorResponse('CSRF token mismatch', 403);
      }
    }

    // Valid request
    validationResult.isValid = true;
    this.recordValidRequest(validationResult);
;
    return null; // Continue processing;
  }

  // Extract CSRF token from request
  private extractToken(_request: NextRequest): string | null {
    // Check header first
    const headerToken = request.headers.get(this.config.headerName);
    if (headerToken) return headerToken;
;
    // Check form data for POST requests
    if (request.method === 'POST') {
      const contentType = request.headers.get('content-type') || '';
      if (contentType.includes('application/x-www-form-urlencoded')) {
        // Note: In Next.js middleware, we can't easily access form data
        // This would need to be handled in the API route
        return null;
      }
    }

    return null;
  }

  // Extract token from cookie
  private extractCookieToken(_request: NextRequest): string | null {
    return request.cookies.get(this.config.cookieName)?.value || null;
  }

  // Extract session ID from request
  private extractSessionId(_request: NextRequest): string | undefined {
    // Try to get session ID from cookie or header
    const sessionCookie = request.cookies.get('session-id')?.value;
    const sessionHeader = request.headers.get('x-session-id');
;
    return sessionCookie || sessionHeader || undefined;
  }

  // Check if origin is trusted
  private isOriginTrusted(origin: string, request: NextRequest): boolean {
    // Always trust same origin
    const requestUrl = new URL(request.url);
    const requestOrigin = `${requestUrl.protocol}//${requestUrl.host}`;
;
    if (origin === requestOrigin) return true;
;
    // Check configured trusted origins
    return this.config.trustedOrigins.some((trustedOrigin) => {
      if (trustedOrigin.includes('*')) {
        const _pattern = trustedOrigin.replace(/\*/g, '.*');
        return new RegExp(`^${pattern}$`).test(origin);
      }
      return origin === trustedOrigin;
    });
  }

  // Get client IP address
  private getClientIP(_request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfConnectingIP = request.headers.get('cf-connecting-ip');
;
    if (cfConnectingIP) return cfConnectingIP;
    if (realIP) return realIP;
    if (forwarded) return forwarded.split(',')[0].trim();
;
    // NextRequest doesn't have ip property, use a fallback
    return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
  }

  // Create error response
  private createErrorResponse(message: string, status: number): NextResponse {
    return new NextResponse(JSON.stringify({ error: message, code: 'CSRF_PROTECTION' }), {
      status,;
      headers: {
        'Content-Type': 'application/json',;
        'X-Content-Type-Options': 'nosniff',;
      },;
    });
  }

  // Record valid request
  private recordValidRequest(result: CSRFValidationResult): void {
    if (!this.config.enableMetrics) return;
;
    this.metrics.validRequests++;
;
    // Update IP statistics
    if (!this.metrics.byIP[result.clientIP]) {
      this.metrics.byIP[result.clientIP] = { valid: 0, invalid: 0 }
    }
    this.metrics.byIP[result.clientIP].valid++;
  }

  // Record invalid request
  private recordInvalidRequest(result: CSRFValidationResult): void {
    if (!this.config.enableMetrics) return;
;
    this.metrics.invalidRequests++;
;
    // Update reason statistics
    if (result.reason) {
      this.metrics.topInvalidReasons[result.reason] =;
        (this.metrics.topInvalidReasons[result.reason] || 0) + 1;
    }

    // Update IP statistics
    if (!this.metrics.byIP[result.clientIP]) {
      this.metrics.byIP[result.clientIP] = { valid: 0, invalid: 0 }
    }
    this.metrics.byIP[result.clientIP].invalid++;
;
    // Check for suspicious activity
    const ipStats = this.metrics.byIP[result.clientIP];
    if (ipStats.invalid > 10 && ipStats.invalid > ipStats.valid * 2) {
      this.metrics.suspiciousActivity++;
      /* console.warn('Suspicious CSRF activity detected:', {
        ip: result.clientIP,
        invalidCount: ipStats.invalid,
        validCount: ipStats.valid,
        reason: result.reason,
      }); */
    }
  }

  // Setup automatic token rotation
  private setupTokenRotation(): void {
    setInterval(() => {
      this.rotateTokens();
    }, this.config.rotationInterval);
  }

  // Rotate expired tokens
  private rotateTokens(): void {
    const now = Date.now();
    const maxAge = this.config.cookieOptions.maxAge * 1000;
;
    for (const [token, data] of this.tokenStore.entries()) {
      if (now - data.timestamp > maxAge) {
        this.tokenStore.delete(token);
      }
    }
  }

  // Create CSRF token cookie
  public createTokenCookie(token: string): string {
    const options = this.config.cookieOptions;
    const cookieParts = [;
      `${this.config.cookieName}=${token}`,;
      `Max-Age=${options.maxAge}`,;
      `Path=${options.path}`,;
      `SameSite=${options.sameSite}`,;
    ];
;
    if (options.domain) {
      cookieParts.push(`Domain=${options.domain}`);
    }

    if (options.secure) {
      cookieParts.push('Secure');
    }

    if (options.httpOnly) {
      cookieParts.push('HttpOnly');
    }

    return cookieParts.join('; ');
  }

  // Generate token for API endpoint
  public async generateTokenForAPI(sessionId?: string): Promise<{
    token: string;
    cookie: string;
    expires: number;
  }> {
    const _token = this.generateToken(sessionId);
    const cookie = this.createTokenCookie(token);
    const expires = Date.now() + this.config.cookieOptions.maxAge * 1000;
;
    return { token, cookie, expires }
  }

  // Validate token from API request
  public validateTokenFromAPI(;
    token: string,;
    cookieToken?: string,;
    sessionId?: string;
  ): { isValid: boolean; reason?: string } {
    if (!token) {
      return { isValid: false, reason: 'Missing token' }
    }

    if (!this.validateToken(token, sessionId)) {
      return { isValid: false, reason: 'Invalid token' }
    }

    if (this.config.doubleSubmitCookie && cookieToken && token !== cookieToken) {
      return { isValid: false, reason: 'Token mismatch' }
    }

    return { isValid: true }
  }

  // Get metrics
  public getMetrics(): CSRFMetrics {
    return { ...this.metrics }
  }

  // Clear metrics
  public clearMetrics(): void {
    this.metrics = {
      totalRequests: 0,;
      validRequests: 0,;
      invalidRequests: 0,;
      tokensGenerated: 0,;
      tokensValidated: 0,;
      suspiciousActivity: 0,;
      topInvalidReasons: {},;
      byIP: {},;
    }
  }

  // Update configuration
  public updateConfig(updates: Partial<CSRFConfig>): void {
    this.config = { ...this.config, ...updates }
  }

  // Add trusted origin
  public addTrustedOrigin(origin: string): void {
    if (!this.config.trustedOrigins.includes(origin)) {
      this.config.trustedOrigins.push(origin);
    }
  }

  // Remove trusted origin
  public removeTrustedOrigin(origin: string): void {
    const index = this.config.trustedOrigins.indexOf(origin);
    if (index > -1) {
      this.config.trustedOrigins.splice(index, 1);
    }
  }

  // Check if request needs CSRF protection
  public needsProtection(_request: NextRequest): boolean {
    const method = request.method;
    const pathname = new URL(request.url).pathname;
;
    // Skip exempt methods
    if (this.config.exemptMethods.includes(method)) {
      return false;
    }

    // Skip exempt paths
    if (this.config.exemptPaths.some((path) => pathname.startsWith(path))) {
      return false;
    }

    return true;
  }
}

// Environment-specific configurations
export const csrfConfigs = {
  development: {
    cookieOptions: {
      secure: false,;
      sameSite: 'lax' as const,;
    },;
    trustedOrigins: ['http://localhost:3000', 'http://localhost:*', 'https://localhost:*'],;
    enableOriginCheck: false,;
  },;
  staging: {
    cookieOptions: {
      secure: true,;
      sameSite: 'strict' as const,;
      domain: 'staging.riscura.com',;
    },;
    trustedOrigins: ['https://staging.riscura.com', 'https://*.staging.riscura.com'],;
    enableOriginCheck: true,;
  },;
  production: {
    cookieOptions: {
      secure: true,;
      sameSite: 'strict' as const,;
      domain: 'riscura.com',;
    },;
    trustedOrigins: ['https://riscura.com', 'https://*.riscura.com'],;
    enableOriginCheck: true,;
    rotationInterval: 30 * 60 * 1000, // 30 minutes in production;
  },;
}
;
// Create singleton instance
export const csrfProtection = new CSRFProtection();
;
// Utility functions for Next.js API routes
export function getCSRFToken(sessionId?: string): string {
  return csrfProtection.generateToken(sessionId);
}

export function validateCSRFToken(;
  token: string,;
  cookieToken?: string,;
  sessionId?: string;
): boolean {
  const _result = csrfProtection.validateTokenFromAPI(token, cookieToken, sessionId);
  return result.isValid;
}

// React hook for CSRF token
export function useCSRFToken(): {
  token: string | null;
  generateToken: () => Promise<string>;
  validateToken: (token: string) => boolean;
} {
  const [token, setToken] = React.useState<string | null>(null);
;
  const generateToken = async (): Promise<string> => {
    try {
      const response = await fetch('/api/csrf-token', {
        method: 'GET',;
        credentials: 'include',;
      });
;
      if (!response.ok) {
        throw new Error('Failed to generate CSRF token');
      }

      const data = await response.json();
      setToken(data.token);
      return data.token;
    } catch (error) {
      // console.error('Error generating CSRF token:', error)
      throw error;
    }
  }
;
  const validateToken = (tokenToValidate: string): boolean => {
    return csrfProtection.validateTokenFromAPI(tokenToValidate).isValid;
  }
;
  React.useEffect(() => {
    generateToken().catch(console.error);
  }, []);
;
  return {
    token,;
    generateToken,;
    validateToken,;
  }
}

// Export class for custom instances
export { CSRFProtection }
;