import { NextResponse } from 'next/server';
import { env } from '@/config/env';
import { productionGuard } from '@/lib/security/production-guard';

/**
 * OWASP Security Headers Implementation
 * Implements comprehensive security headers for production environments
 */

export interface SecurityHeadersConfig {
  // Content Security Policy
  csp?: {
    reportOnly?: boolean;
    reportUri?: string;
    directives?: CSPDirectives;
  };

  // HTTP Strict Transport Security
  hsts?: {
    maxAge?: number;
    includeSubDomains?: boolean;
    preload?: boolean;
  };

  // Additional headers
  xFrameOptions?: 'DENY' | 'SAMEORIGIN' | string;
  xContentTypeOptions?: boolean;
  referrerPolicy?: string;
  permissionsPolicy?: string;
  crossOriginEmbedderPolicy?: string;
  crossOriginOpenerPolicy?: string;
  crossOriginResourcePolicy?: string;

  // Custom headers
  customHeaders?: Record<string, string>;
}

export interface CSPDirectives {
  defaultSrc?: string[];
  scriptSrc?: string[];
  styleSrc?: string[];
  imgSrc?: string[];
  connectSrc?: string[];
  fontSrc?: string[];
  objectSrc?: string[];
  mediaSrc?: string[];
  frameSrc?: string[];
  childSrc?: string[];
  workerSrc?: string[];
  manifestSrc?: string[];
  prefetchSrc?: string[];
  formAction?: string[];
  frameAncestors?: string[];
  baseUri?: string[];
  upgradeInsecureRequests?: boolean;
  blockAllMixedContent?: boolean;
  reportUri?: string[];
  reportTo?: string[];
}

/**
 * Default security configuration based on OWASP recommendations
 */
const DEFAULT_SECURITY_CONFIG: SecurityHeadersConfig = {
  csp: {
    reportOnly: !productionGuard.isProduction(),
    reportUri: env.CSP_REPORT_URI,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for Next.js in development
        "'unsafe-eval'", // Required for Next.js in development
        'https://cdn.jsdelivr.net', // For external libraries
        'https://unpkg.com', // For external libraries
        'https://www.google.com', // For reCAPTCHA
        'https://www.gstatic.com', // For Google services
        'https://js.stripe.com', // For Stripe
        'https://checkout.stripe.com', // For Stripe checkout
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for styled-components and CSS-in-JS
        'https://fonts.googleapis.com', // For Google Fonts
        'https://cdn.jsdelivr.net', // For external CSS libraries
        'https://unpkg.com', // For external CSS libraries
      ],
      imgSrc: [
        "'self'",
        'data:', // For base64 images
        'blob:', // For generated images
        'https:', // Allow all HTTPS images
        'https://images.unsplash.com', // For demo images
        'https://avatars.githubusercontent.com', // For GitHub avatars
        'https://lh3.googleusercontent.com', // For Google profile images
        'https://www.gravatar.com', // For Gravatar images
      ],
      connectSrc: [
        "'self'",
        'https://api.openai.com', // For AI features
        'https://api.stripe.com', // For payment processing
        'https://checkout.stripe.com', // For Stripe checkout
        'https://api.github.com', // For GitHub integration
        'https://www.google-analytics.com', // For analytics
        'https://vitals.vercel-analytics.com', // For Vercel analytics
        productionGuard.isProduction() ? undefined : 'ws://localhost:*', // WebSocket for development
        productionGuard.isProduction() ? undefined : 'http://localhost:*', // Local development
      ].filter(Boolean) as string[],
      fontSrc: [
        "'self'",
        'data:', // For base64 fonts
        'https://fonts.gstatic.com', // For Google Fonts
        'https://cdn.jsdelivr.net', // For external fonts
        'https://unpkg.com', // For external fonts
      ],
      objectSrc: ["'none'"], // Prevent Flash and Java applets
      mediaSrc: ["'self'", 'data:', 'blob:'],
      frameSrc: [
        "'self'",
        'https://js.stripe.com', // For Stripe elements
        'https://checkout.stripe.com', // For Stripe checkout
        'https://www.google.com', // For reCAPTCHA
      ],
      childSrc: ["'self'", 'blob:'],
      workerSrc: ["'self'", 'blob:'],
      manifestSrc: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"], // Prevent embedding in frames
      baseUri: ["'self'"],
      upgradeInsecureRequests: productionGuard.isProduction(),
      blockAllMixedContent: productionGuard.isProduction(),
      reportUri: env.CSP_REPORT_URI ? [env.CSP_REPORT_URI] : undefined,
    },
  },

  hsts: {
    maxAge: env.HSTS_MAX_AGE || 31536000, // 1 year
    includeSubDomains: env.HSTS_INCLUDE_SUBDOMAINS !== false,
    preload: env.HSTS_PRELOAD === true,
  },

  xFrameOptions: 'DENY',
  xContentTypeOptions: true,
  referrerPolicy: 'strict-origin-when-cross-origin',

  // Permissions Policy (formerly Feature Policy)
  permissionsPolicy: [
    'geolocation=()',
    'microphone=()',
    'camera=()',
    'payment=(self)',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'speaker=(self)',
    'vibrate=()',
    'fullscreen=(self)',
    'picture-in-picture=()',
  ].join(', '),

  crossOriginEmbedderPolicy: 'unsafe-none', // More permissive for third-party integrations
  crossOriginOpenerPolicy: 'same-origin-allow-popups', // For OAuth popups
  crossOriginResourcePolicy: 'cross-origin', // Allow cross-origin requests for API
};

/**
 * Production-specific security configuration with stricter rules
 */
const PRODUCTION_SECURITY_CONFIG: SecurityHeadersConfig = {
  ...DEFAULT_SECURITY_CONFIG,
  csp: {
    ...DEFAULT_SECURITY_CONFIG.csp,
    reportOnly: false,
    directives: {
      ...DEFAULT_SECURITY_CONFIG.csp?.directives,
      scriptSrc: [
        "'self'",
        "'nonce-{NONCE}'", // Use nonces instead of unsafe-inline in production
        'https://cdn.jsdelivr.net',
        'https://www.google.com',
        'https://www.gstatic.com',
        'https://js.stripe.com',
        'https://checkout.stripe.com',
      ],
      styleSrc: [
        "'self'",
        "'nonce-{NONCE}'", // Use nonces instead of unsafe-inline in production
        'https://fonts.googleapis.com',
        'https://cdn.jsdelivr.net',
      ],
      connectSrc: [
        "'self'",
        'https://api.openai.com',
        'https://api.stripe.com',
        'https://checkout.stripe.com',
        'https://api.github.com',
        'https://www.google-analytics.com',
        'https://vitals.vercel-analytics.com',
      ],
      upgradeInsecureRequests: true,
      blockAllMixedContent: true,
    },
  },
  crossOriginEmbedderPolicy: 'require-corp',
  crossOriginResourcePolicy: 'same-site',
};

/**
 * Security Headers Manager
 */
export class SecurityHeaders {
  private static instance: SecurityHeaders;
  private config: SecurityHeadersConfig;
  private nonce?: string;

  private constructor(config?: SecurityHeadersConfig) {
    this.config = productionGuard.isProduction()
      ? { ...PRODUCTION_SECURITY_CONFIG, ...config }
      : { ...DEFAULT_SECURITY_CONFIG, ...config };
  }

  public static getInstance(config?: SecurityHeadersConfig): SecurityHeaders {
    if (!SecurityHeaders.instance) {
      SecurityHeaders.instance = new SecurityHeaders(config);
    }
    return SecurityHeaders.instance;
  }

  /**
   * Generate a nonce for CSP
   */
  generateNonce(): string {
    this.nonce = require('crypto').randomBytes(16).toString('base64');
    return this.nonce;
  }

  /**
   * Get current nonce
   */
  getCurrentNonce(): string {
    if (!this.nonce) {
      this.nonce = this.generateNonce();
    }
    return this.nonce;
  }

  /**
   * Build Content Security Policy header value
   */
  private buildCSP(directives: CSPDirectives, nonce?: string): string {
    const cspParts: string[] = [];

    Object.entries(directives).forEach(([directive, value]) => {
      if (value === undefined) return;

      let directiveName = directive;

      // Convert camelCase to kebab-case
      directiveName = directiveName.replace(/([A-Z])/g, '-$1').toLowerCase();

      if (typeof value === 'boolean') {
        if (value) {
          cspParts.push(directiveName);
        }
      } else if (Array.isArray(value)) {
        let sources = value;

        // Replace nonce placeholder with actual nonce
        if (nonce) {
          sources = sources.map((source) => source.replace('{NONCE}', nonce));
        }

        cspParts.push(`${directiveName} ${sources.join(' ')}`);
      } else if (typeof value === 'string') {
        cspParts.push(`${directiveName} ${value}`);
      }
    });

    return cspParts.join('; ');
  }

  /**
   * Build HSTS header value
   */
  private buildHSTS(): string {
    const { maxAge, includeSubDomains, preload } = this.config.hsts || {};

    let hsts = `max-age=${maxAge || 31536000}`;

    if (includeSubDomains !== false) {
      hsts += '; includeSubDomains';
    }

    if (preload) {
      hsts += '; preload';
    }

    return hsts;
  }

  /**
   * Get all security headers
   */
  getHeaders(nonce?: string): Record<string, string> {
    const headers: Record<string, string> = {};

    // Content Security Policy
    if (this.config.csp?.directives) {
      const cspValue = this.buildCSP(this.config.csp.directives, nonce);
      const headerName = this.config.csp.reportOnly
        ? 'Content-Security-Policy-Report-Only'
        : 'Content-Security-Policy';
      headers[headerName] = cspValue;
    }

    // HTTP Strict Transport Security (HTTPS only)
    if (productionGuard.isProduction() && this.config.hsts) {
      headers['Strict-Transport-Security'] = this.buildHSTS();
    }

    // X-Frame-Options
    if (this.config.xFrameOptions) {
      headers['X-Frame-Options'] = this.config.xFrameOptions;
    }

    // X-Content-Type-Options
    if (this.config.xContentTypeOptions) {
      headers['X-Content-Type-Options'] = 'nosniff';
    }

    // Referrer-Policy
    if (this.config.referrerPolicy) {
      headers['Referrer-Policy'] = this.config.referrerPolicy;
    }

    // Permissions-Policy
    if (this.config.permissionsPolicy) {
      headers['Permissions-Policy'] = this.config.permissionsPolicy;
    }

    // Cross-Origin-Embedder-Policy
    if (this.config.crossOriginEmbedderPolicy) {
      headers['Cross-Origin-Embedder-Policy'] = this.config.crossOriginEmbedderPolicy;
    }

    // Cross-Origin-Opener-Policy
    if (this.config.crossOriginOpenerPolicy) {
      headers['Cross-Origin-Opener-Policy'] = this.config.crossOriginOpenerPolicy;
    }

    // Cross-Origin-Resource-Policy
    if (this.config.crossOriginResourcePolicy) {
      headers['Cross-Origin-Resource-Policy'] = this.config.crossOriginResourcePolicy;
    }

    // Security-related headers
    headers['X-DNS-Prefetch-Control'] = 'off';
    headers['X-Download-Options'] = 'noopen';
    headers['X-Permitted-Cross-Domain-Policies'] = 'none';

    // Custom application headers
    headers['X-Powered-By'] = 'Riscura Security Platform';
    headers['X-Content-Type-Options'] = 'nosniff';
    headers['X-XSS-Protection'] = '1; mode=block';

    // Add custom headers
    if (this.config.customHeaders) {
      Object.assign(headers, this.config.customHeaders);
    }

    return headers;
  }

  /**
   * Apply security headers to NextResponse
   */
  applyToResponse(_response: NextResponse, nonce?: string): NextResponse {
    const headers = this.getHeaders(nonce);

    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    // Log CSP violations in development
    if (!productionGuard.isProduction() && this.config.csp?.reportOnly) {
      // console.log('🛡️ Security headers applied (report-only mode)');
    }

    return response;
  }

  /**
   * Create a new response with security headers
   */
  createSecureResponse(body?: any, init?: ResponseInit & { nonce?: string }): NextResponse {
    const { nonce, ...responseInit } = init || {};
    const response = NextResponse.json(body, responseInit);
    return this.applyToResponse(response, nonce);
  }

  /**
   * Update configuration
   */
  updateConfig(_config: Partial<SecurityHeadersConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get CSP nonce for inline scripts/styles
   */
  getCSPNonce(): string {
    if (!this.nonce) {
      this.nonce = this.generateNonce();
    }
    return this.nonce;
  }

  /**
   * Validate security headers configuration
   */
  validateConfig(): { isValid: boolean; warnings: string[]; errors: string[] } {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check CSP configuration
    if (!this.config.csp?.directives?.defaultSrc) {
      warnings.push('CSP default-src directive not configured');
    }

    if (
      this.config.csp?.directives?.scriptSrc?.includes("'unsafe-eval'") &&
      productionGuard.isProduction()
    ) {
      warnings.push("'unsafe-eval' in script-src is not recommended for production");
    }

    if (
      this.config.csp?.directives?.scriptSrc?.includes("'unsafe-inline'") &&
      productionGuard.isProduction()
    ) {
      warnings.push("'unsafe-inline' in script-src is not recommended for production");
    }

    // Check HSTS configuration
    if (productionGuard.isProduction() && !this.config.hsts) {
      warnings.push('HSTS not configured for production');
    }

    // Check frame options
    if (!this.config.xFrameOptions || this.config.xFrameOptions === 'SAMEORIGIN') {
      warnings.push('Consider using X-Frame-Options: DENY for better security');
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors,
    };
  }
}

// Export singleton instance
export const securityHeaders = SecurityHeaders.getInstance();

// Utility functions
export function applySecurityHeaders(_response: NextResponse, nonce?: string): NextResponse {
  return securityHeaders.applyToResponse(response, nonce);
}

export function createSecureResponse(
  body?: any,
  init?: ResponseInit & { nonce?: string }
): NextResponse {
  return securityHeaders.createSecureResponse(body, init);
}

export function generateCSPNonce(): string {
  return securityHeaders.generateNonce();
}

export function getSecurityHeaders(nonce?: string): Record<string, string> {
  return securityHeaders.getHeaders(nonce);
}

/**
 * Middleware helper for applying security headers
 */
export function withSecurityHeaders(
  handler: () => NextResponse | Promise<NextResponse>
): () => Promise<NextResponse> {
  return async () => {
    const response = await handler();
    return applySecurityHeaders(response);
  };
}

/**
 * CSP report endpoint handler
 */
export function handleCSPReport(report: any): void {
  if (!productionGuard.isProduction()) {
    // console.warn('🚨 CSP Violation Report:', report);
    return;
  }

  // In production, log to monitoring service
  productionGuard.logSecurityEvent('csp_violation', {
    report,
    timestamp: new Date().toISOString(),
    userAgent: report['user-agent'],
    blockedUri: report['blocked-uri'],
    violatedDirective: report['violated-directive'],
    originalPolicy: report['original-policy'],
  });
}
