// Content Security Policy Middleware for Enhanced Security
import { NextRequest, NextResponse } from 'next/server';
;
export interface CSPConfig {
  defaultSrc: string[];
  scriptSrc: string[];
  styleSrc: string[];
  imgSrc: string[];
  fontSrc: string[];
  connectSrc: string[];
  frameSrc: string[];
  mediaSrc: string[];
  objectSrc: string[];
  childSrc: string[];
  workerSrc: string[];
  manifestSrc: string[];
  formAction: string[];
  frameAncestors: string[];
  baseUri: string[];
  upgradeInsecureRequests: boolean;
  blockAllMixedContent: boolean;
  reportUri?: string;
  reportTo?: string;
  requireTrustedTypesFor?: string[];
  trustedTypes?: string[];
  enableViolationReporting: boolean;
  environment: 'development' | 'staging' | 'production';
}

export interface SecurityHeaders {
  'Content-Security-Policy'?: string;
  'Content-Security-Policy-Report-Only'?: string;
  'X-Frame-Options': string;
  'X-Content-Type-Options': string;
  'X-XSS-Protection': string;
  'Referrer-Policy': string;
  'Permissions-Policy': string;
  'Strict-Transport-Security'?: string;
  'Cross-Origin-Embedder-Policy': string;
  'Cross-Origin-Opener-Policy': string;
  'Cross-Origin-Resource-Policy': string;
}

export interface CSPViolationReport {
  'csp-report': {
    'document-uri': string;
    referrer: string;
    'violated-directive': string;
    'effective-directive': string;
    'original-policy': string;
    'blocked-uri': string;
    'line-number': number;
    'column-number': number;
    'source-file': string;
    'status-code': number;
    'script-sample': string;
  }
}

class CSPManager {
  private config: CSPConfig;
  private nonce: string = '';
  private violations: CSPViolationReport[] = [];
;
  constructor(_config: Partial<CSPConfig> = {}) {
    this.config = {
      defaultSrc: ["'self'"],;
      scriptSrc: [;
        "'self'",;
        "'unsafe-inline'", // Will be removed in production;
        "'unsafe-eval'", // Will be removed in production;
        'https://cdn.jsdelivr.net',;
        'https://unpkg.com',;
        'https://cdnjs.cloudflare.com',;
      ],;
      styleSrc: [;
        "'self'",;
        "'unsafe-inline'",;
        'https://fonts.googleapis.com',;
        'https://cdn.jsdelivr.net',;
      ],;
      imgSrc: [;
        "'self'",;
        'data:',;
        'blob:',;
        'https:',;
        'https://*.amazonaws.com',;
        'https://*.cloudfront.net',;
      ],;
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdn.jsdelivr.net'],;
      connectSrc: [;
        "'self'",;
        'https://api.riscura.com',;
        'wss://api.riscura.com',;
        'https://*.amazonaws.com',;
      ],;
      frameSrc: ["'self'", 'https://www.youtube.com', 'https://player.vimeo.com'],;
      mediaSrc: ["'self'", 'https:'],;
      objectSrc: ["'none'"],;
      childSrc: ["'self'"],;
      workerSrc: ["'self'", 'blob:'],;
      manifestSrc: ["'self'"],;
      formAction: ["'self'"],;
      frameAncestors: ["'none'"],;
      baseUri: ["'self'"],;
      upgradeInsecureRequests: true,;
      blockAllMixedContent: true,;
      reportUri: '/api/security/csp-report',;
      enableViolationReporting: true,;
      environment: 'development',;
      ...config,;
    }
;
    // Adjust policies based on environment
    this.adjustForEnvironment();
  }

  private adjustForEnvironment(): void {
    if (this.config.environment === 'production') {
      // Remove unsafe directives in production
      this.config.scriptSrc = this.config.scriptSrc.filter((src) => !src.includes('unsafe'));
;
      // Add nonce-based script loading
      this.config.scriptSrc.push("'nonce-{NONCE}'");
      this.config.styleSrc.push("'nonce-{NONCE}'");
;
      // Stricter policies for production
      this.config.connectSrc = this.config.connectSrc.filter(;
        (src) => !src.includes('localhost') && !src.includes('127.0.0.1');
      );
    }

    if (this.config.environment === 'development') {
      // Allow localhost for development
      this.config.connectSrc.push(;
        'http://localhost:*',;
        'ws://localhost:*',;
        'https://localhost:*',;
        'wss://localhost:*';
      );
;
      // Allow webpack dev server
      this.config.scriptSrc.push('webpack:');
      this.config.connectSrc.push('webpack:');
    }
  }

  // Generate cryptographically secure nonce
  public generateNonce(): string {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(16);
      crypto.getRandomValues(array);
      this.nonce = btoa(String.fromCharCode.apply(null, Array.from(array)));
    } else {
      // Fallback for Node.js environment
      this.nonce = require('crypto').randomBytes(16).toString('base64');
    }
    return this.nonce;
  }

  // Build CSP header string
  public buildCSPHeader(nonce?: string): string {
    const currentNonce = nonce || this.nonce;
    const directives: string[] = [];
;
    // Helper function to process directive values
    const processDirective = (values: string[]): string => {
      return values.map((value) => value.replace('{NONCE}', currentNonce)).join(' ');
    }
;
    // Add all directives
    directives.push(`default-src ${processDirective(this.config.defaultSrc)}`);
    directives.push(`script-src ${processDirective(this.config.scriptSrc)}`);
    directives.push(`style-src ${processDirective(this.config.styleSrc)}`);
    directives.push(`img-src ${processDirective(this.config.imgSrc)}`);
    directives.push(`font-src ${processDirective(this.config.fontSrc)}`);
    directives.push(`connect-src ${processDirective(this.config.connectSrc)}`);
    directives.push(`frame-src ${processDirective(this.config.frameSrc)}`);
    directives.push(`media-src ${processDirective(this.config.mediaSrc)}`);
    directives.push(`object-src ${processDirective(this.config.objectSrc)}`);
    directives.push(`child-src ${processDirective(this.config.childSrc)}`);
    directives.push(`worker-src ${processDirective(this.config.workerSrc)}`);
    directives.push(`manifest-src ${processDirective(this.config.manifestSrc)}`);
    directives.push(`form-action ${processDirective(this.config.formAction)}`);
    directives.push(`frame-ancestors ${processDirective(this.config.frameAncestors)}`);
    directives.push(`base-uri ${processDirective(this.config.baseUri)}`);
;
    // Add boolean directives
    if (this.config.upgradeInsecureRequests) {
      directives.push('upgrade-insecure-requests');
    }

    if (this.config.blockAllMixedContent) {
      directives.push('block-all-mixed-content');
    }

    // Add reporting directives
    if (this.config.reportUri) {
      directives.push(`report-uri ${this.config.reportUri}`);
    }

    if (this.config.reportTo) {
      directives.push(`report-to ${this.config.reportTo}`);
    }

    // Add Trusted Types directives
    if (this.config.requireTrustedTypesFor) {
      directives.push(`require-trusted-types-for ${this.config.requireTrustedTypesFor.join(' ')}`);
    }

    if (this.config.trustedTypes) {
      directives.push(`trusted-types ${this.config.trustedTypes.join(' ')}`);
    }

    return directives.join('; ');
  }

  // Build all security headers
  public buildSecurityHeaders(nonce?: string): SecurityHeaders {
    const headers: SecurityHeaders = {
      'X-Frame-Options': 'DENY',;
      'X-Content-Type-Options': 'nosniff',;
      'X-XSS-Protection': '1; mode=block',;
      'Referrer-Policy': 'strict-origin-when-cross-origin',;
      'Permissions-Policy': [;
        'camera=()',;
        'microphone=()',;
        'geolocation=()',;
        'payment=()',;
        'usb=()',;
        'magnetometer=()',;
        'accelerometer=()',;
        'gyroscope=()',;
      ].join(', '),;
      'Cross-Origin-Embedder-Policy': 'require-corp',;
      'Cross-Origin-Opener-Policy': 'same-origin',;
      'Cross-Origin-Resource-Policy': 'same-origin',;
    }
;
    // Add HSTS for HTTPS
    if (this.config.environment === 'production') {
      headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
    }

    // Add CSP header
    const cspHeader = this.buildCSPHeader(nonce);
    if (this.config.environment === 'development') {
      headers['Content-Security-Policy-Report-Only'] = cspHeader;
    } else {
      headers['Content-Security-Policy'] = cspHeader;
    }

    return headers;
  }

  // Process CSP violation reports
  public processViolationReport(report: CSPViolationReport): void {
    this.violations.push({
      ...report,;
      timestamp: Date.now(),;
    } as any);
;
    // Log violation for monitoring
    /* console.warn('CSP Violation:', {
      directive: report['csp-report']['violated-directive'],
      blockedUri: report['csp-report']['blocked-uri'],
      documentUri: report['csp-report']['document-uri'],
      sourceFile: report['csp-report']['source-file'],
      lineNumber: report['csp-report']['line-number'],
    }); */
    // Send to monitoring service in production
    if (this.config.environment === 'production') {
      this.sendViolationToMonitoring(report);
    }
  }

  private async sendViolationToMonitoring(report: CSPViolationReport): Promise<void> {
    try {
      // Send to monitoring service (e.g., Sentry, DataDog)
      await fetch('/api/monitoring/csp-violation', {
        method: 'POST',;
        headers: { 'Content-Type': 'application/json' },;
        body: JSON.stringify(report),;
      });
    } catch (error) {
      // console.error('Failed to send CSP violation to monitoring:', error)
    }
  }

  // Get violation statistics
  public getViolationStats(): {
    total: number;
    byDirective: Record<string, number>;
    byBlockedUri: Record<string, number>;
    recent: CSPViolationReport[];
  } {
    const byDirective: Record<string, number> = {}
    const byBlockedUri: Record<string, number> = {}
;
    this.violations.forEach((violation) => {
      const directive = violation['csp-report']['violated-directive'];
      const blockedUri = violation['csp-report']['blocked-uri'];
;
      byDirective[directive] = (byDirective[directive] || 0) + 1;
      byBlockedUri[blockedUri] = (byBlockedUri[blockedUri] || 0) + 1;
    });
;
    return {
      total: this.violations.length,;
      byDirective,;
      byBlockedUri,;
      recent: this.violations.slice(-10),;
    }
  }

  // Update CSP configuration
  public updateConfig(updates: Partial<CSPConfig>): void {
    this.config = { ...this.config, ...updates }
    this.adjustForEnvironment();
  }

  // Add allowed source to directive
  public addAllowedSource(directive: keyof CSPConfig, source: string): void {
    if (Array.isArray(this.config[directive])) {
      (this.config[directive] as string[]).push(source);
    }
  }

  // Remove allowed source from directive
  public removeAllowedSource(directive: keyof CSPConfig, source: string): void {
    if (Array.isArray(this.config[directive])) {
      const index = (this.config[directive] as string[]).indexOf(source);
      if (index > -1) {
        (this.config[directive] as string[]).splice(index, 1);
      }
    }
  }

  // Clear violation history
  public clearViolations(): void {
    this.violations = [];
  }
}

// Create singleton instance
export const cspManager = new CSPManager();
;
// Middleware function for Next.js
export function cspMiddleware(_request: NextRequest, config?: Partial<CSPConfig>): NextResponse {
  const manager = config ? new CSPManager(config) : cspManager;
;
  // Generate nonce for this request
  const nonce = manager.generateNonce();
;
  // Get security headers
  const securityHeaders = manager.buildSecurityHeaders(nonce);
;
  // Create response
  const response = NextResponse.next();
;
  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    if (value) {
      response.headers.set(key, value);
    }
  });
;
  // Add nonce to request for use in components
  response.headers.set('X-Nonce', nonce);
;
  return response;
}

// React hook for accessing nonce in components
export function useCSPNonce(): string {
  if (typeof window !== 'undefined') {
    // Client-side: get from meta tag
    const metaTag = document.querySelector('meta[name="csp-nonce"]');
    return metaTag?.getAttribute('content') || '';
  }

  // Server-side: would be provided by middleware
  return '';
}

// Utility function to create nonce-aware script tags
export function createNonceScript(;
  src: string,;
  nonce?: string,;
  attributes: Record<string, string> = {}
): string {
  const nonceAttr = nonce ? ` nonce="${nonce}"` : '';
  const attrs = Object.entries(attributes);
    .map(([key, value]) => ` ${key}="${value}"`);
    .join('');
;
  return `<script src="${src}"${nonceAttr}${attrs}></script>`;
}

// Utility function to create nonce-aware style tags
export function createNonceStyle(;
  href: string,;
  nonce?: string,;
  attributes: Record<string, string> = {}
): string {
  const nonceAttr = nonce ? ` nonce="${nonce}"` : '';
  const attrs = Object.entries(attributes);
    .map(([key, value]) => ` ${key}="${value}"`);
    .join('');
;
  return `<link rel="stylesheet" href="${href}"${nonceAttr}${attrs}>`;
}

// Environment-specific configurations
export const cspConfigs = {
  development: {
    environment: 'development' as const,;
    enableViolationReporting: true,;
    scriptSrc: [;
      "'self'",;
      "'unsafe-inline'",;
      "'unsafe-eval'",;
      'http://localhost:*',;
      'https://localhost:*',;
      'webpack:',;
    ],;
    connectSrc: [;
      "'self'",;
      'http://localhost:*',;
      'ws://localhost:*',;
      'https://localhost:*',;
      'wss://localhost:*',;
      'webpack:',;
    ],;
  },;
  staging: {
    environment: 'staging' as const,;
    enableViolationReporting: true,;
    scriptSrc: ["'self'", "'nonce-{NONCE}'", 'https://staging-cdn.riscura.com'],;
    connectSrc: ["'self'", 'https://staging-api.riscura.com', 'wss://staging-api.riscura.com'],;
  },;
  production: {
    environment: 'production' as const,;
    enableViolationReporting: true,;
    upgradeInsecureRequests: true,;
    blockAllMixedContent: true,;
    scriptSrc: ["'self'", "'nonce-{NONCE}'", 'https://cdn.riscura.com'],;
    connectSrc: ["'self'", 'https://api.riscura.com', 'wss://api.riscura.com'],;
    reportUri: 'https://monitoring.riscura.com/csp-report',;
  },;
}
;
// Export class for custom instances
export { CSPManager }
;