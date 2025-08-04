import { env } from '@/config/env';

/**
 * Production Guard - Prevents development code from running in production
 * and enforces secure defaults
 */
export class ProductionGuard {
  private static instance: ProductionGuard;

  private constructor() {}

  public static getInstance(): ProductionGuard {
    if (!ProductionGuard.instance) {
      ProductionGuard.instance = new ProductionGuard();
    }
    return ProductionGuard.instance;
  }

  /**
   * Check if current environment is production
   */
  isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  /**
   * Check if current environment is development
   */
  isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  }

  /**
   * Check if demo mode is explicitly enabled
   */
  isDemoMode(): boolean {
    // Demo mode should only be enabled in development or explicit staging
    return (
      !this.isProduction() &&
      (process.env.DEMO_MODE === 'true' || process.env.NODE_ENV === 'development')
    );
  }

  /**
   * Prevent development authentication bypasses in production
   */
  blockDevelopmentAuth(): void {
    if (this.isProduction()) {
      // Remove any demo authentication tokens or bypasses
      delete process.env.DEMO_MODE;
      delete process.env.BYPASS_AUTH;
      delete process.env.MOCK_AUTH;
    }
  }

  /**
   * Validate that all required production secrets are set
   */
  validateProductionSecrets(): { isValid: boolean; errors: string[] } {
    if (!this.isProduction()) {
      return { isValid: true, errors: [] };
    }

    const errors: string[] = [];
    const requiredSecrets = [
      'JWT_SECRET',
      'NEXTAUTH_SECRET',
      'SESSION_SECRET',
      'CSRF_SECRET',
      'COOKIE_SECRET',
      'INTERNAL_API_KEY',
      'DATABASE_ENCRYPTION_KEY',
      'FILE_ENCRYPTION_KEY',
    ];

    // Check for development/test values in production
    const developmentValues = [
      'dev-',
      'test-',
      'demo-',
      'localhost',
      '12345',
      'change-me',
      'please-change',
      'development',
      'testing',
    ];

    for (const secret of requiredSecrets) {
      const value = process.env[secret];

      if (!value) {
        errors.push(`Missing required secret: ${secret}`);
        continue;
      }

      if (value.length < 32) {
        errors.push(`Secret ${secret} must be at least 32 characters`);
      }

      // Check for development values
      const hasDevValue = developmentValues.some((devValue) =>
        value.toLowerCase().includes(devValue.toLowerCase())
      );

      if (hasDevValue) {
        errors.push(`Secret ${secret} contains development/test value in production`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate that URLs are production-ready
   */
  validateProductionUrls(): { isValid: boolean; errors: string[] } {
    if (!this.isProduction()) {
      return { isValid: true, errors: [] };
    }

    const errors: string[] = [];
    const urls = {
      APP_URL: process.env.APP_URL,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      DATABASE_URL: process.env.DATABASE_URL,
    };

    for (const [name, url] of Object.entries(urls)) {
      if (!url) continue;

      if (url.includes('localhost') || url.includes('127.0.0.1')) {
        errors.push(`${name} contains localhost in production: ${url}`);
      }

      if (url.startsWith('http://') && !url.includes('localhost')) {
        errors.push(`${name} should use HTTPS in production: ${url}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate database configuration for production
   */
  validateDatabaseConfig(): { isValid: boolean; errors: string[] } {
    if (!this.isProduction()) {
      return { isValid: true, errors: [] };
    }

    const errors: string[] = [];
    const dbUrl = process.env.DATABASE_URL;

    if (!dbUrl) {
      errors.push('DATABASE_URL is required in production');
      return { isValid: false, errors };
    }

    if (dbUrl.includes('sqlite') || dbUrl.includes('file:')) {
      errors.push('SQLite database not recommended for production');
    }

    if (!dbUrl.includes('ssl=true') && !dbUrl.includes('sslmode=require')) {
      errors.push('Database should use SSL in production');
    }

    if (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
      errors.push('Database should not be localhost in production');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Block development-only features in production
   */
  blockDevelopmentFeatures(): void {
    if (!this.isProduction()) {
      return;
    }

    // Disable development features
    process.env.DEBUG_MODE = 'false';
    process.env.MOCK_DATA = 'false';
    process.env.SKIP_EMAIL_VERIFICATION = 'false';
    process.env.BYPASS_RATE_LIMITING = 'false';

    // Force security features on
    process.env.ENABLE_CSRF_PROTECTION = 'true';
    process.env.ENABLE_RATE_LIMITING = 'true';
    process.env.ENABLE_SECURITY_HEADERS = 'true';
  }

  /**
   * Comprehensive production readiness check
   */
  validateProduction(): {
    isReady: boolean;
    errors: string[];
    warnings: string[];
  } {
    if (!this.isProduction()) {
      return {
        isReady: true,
        errors: [],
        warnings: ['Not in production environment'],
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check secrets
    const secretsCheck = this.validateProductionSecrets();
    errors.push(...secretsCheck.errors);

    // Check URLs
    const urlsCheck = this.validateProductionUrls();
    errors.push(...urlsCheck.errors);

    // Check database
    const dbCheck = this.validateDatabaseConfig();
    errors.push(...dbCheck.errors);

    // Check required environment variables
    const requiredVars = ['APP_URL', 'DATABASE_URL', 'JWT_SECRET', 'NEXTAUTH_SECRET'];

    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        errors.push(`Missing required environment variable: ${varName}`);
      }
    }

    // Check optional but recommended variables
    const recommendedVars = ['SMTP_HOST', 'OPENAI_API_KEY', 'SENTRY_DSN'];

    for (const varName of recommendedVars) {
      if (!process.env[varName]) {
        warnings.push(`Recommended environment variable not set: ${varName}`);
      }
    }

    return {
      isReady: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Initialize production environment
   */
  initializeProduction(): void {
    if (!this.isProduction()) {
      return;
    }

    // Skip during build time
    const isBuildTime =
      process.env.NEXT_PHASE === 'phase-production-build' ||
      process.env.npm_lifecycle_event === 'build' ||
      process.env.CI === 'true';

    if (isBuildTime) {
      // console.log('🔧 Build time detected - skipping production security initialization')
      return;
    }

    // console.log('🛡️ Initializing production security...')

    // Block development features
    this.blockDevelopmentFeatures();
    this.blockDevelopmentAuth();

    // Validate production readiness
    const validation = this.validateProduction();

    if (!validation.isReady) {
      // console.error('❌ Production validation failed:')
      validation.errors.forEach((error) => console.error(`  - ${error}`));

      if (process.env.STRICT_PRODUCTION_MODE !== 'false') {
        throw new Error(
          'Production validation failed. Set STRICT_PRODUCTION_MODE=false to bypass.'
        );
      }
    }

    if (validation.warnings.length > 0) {
      // console.warn('⚠️ Production warnings:')
      validation.warnings.forEach((warning) => console.warn(`  - ${warning}`));
    }

    // console.log('✅ Production security initialized')
  }

  /**
   * Create secure headers for production
   */
  getProductionHeaders(): Record<string, string> {
    return {
      'X-Environment': this.isProduction() ? 'production' : 'development',
      'X-Security-Level': this.isProduction() ? 'high' : 'development',
      'X-Demo-Mode': this.isDemoMode() ? 'true' : 'false',
    };
  }

  /**
   * Log security event
   */
  logSecurityEvent(event: string, details: Record<string, any> = {}): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      environment: process.env.NODE_ENV,
      isProduction: this.isProduction(),
      ...details,
    };

    if (this.isProduction()) {
      // In production, use structured logging
      // console.log(JSON.stringify(logEntry))
    } else {
      // In development, use readable format
      // console.log(`🔒 Security Event: ${event}`, details)
    }
  }

  /**
   * Sanitize environment variables for logging
   */
  sanitizeEnvForLogging(): Record<string, string> {
    const sanitized: Record<string, string> = {};
    const sensitiveKeys = [
      'JWT_SECRET',
      'NEXTAUTH_SECRET',
      'SESSION_SECRET',
      'CSRF_SECRET',
      'COOKIE_SECRET',
      'INTERNAL_API_KEY',
      'DATABASE_ENCRYPTION_KEY',
      'FILE_ENCRYPTION_KEY',
      'OPENAI_API_KEY',
      'GOOGLE_CLIENT_SECRET',
      'SMTP_PASS',
      'AWS_SECRET_ACCESS_KEY',
      'DATABASE_URL',
    ];

    for (const [key, value] of Object.entries(process.env)) {
      if (sensitiveKeys.some((sensitive) => key.includes(sensitive))) {
        sanitized[key] = value ? '***REDACTED***' : 'not set';
      } else {
        sanitized[key] = value || 'not set';
      }
    }

    return sanitized;
  }
}

// Singleton instance
export const productionGuard = ProductionGuard.getInstance();

// Auto-initialize in production (but not during build time)
if (process.env.NODE_ENV === 'production') {
  const isBuildTime =
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.npm_lifecycle_event === 'build' ||
    process.env.CI === 'true';

  if (!isBuildTime) {
    try {
      productionGuard.initializeProduction();
    } catch (error) {
      // console.error('Failed to initialize production security:', error)
      if (process.env.STRICT_PRODUCTION_MODE !== 'false') {
        process.exit(1);
      }
    }
  }
}

// Utility functions
export function throwIfProduction(message: string): void {
  if (productionGuard.isProduction()) {
    throw new Error(`Development feature blocked in production: ${message}`);
  }
}

export function warnIfProduction(message: string): void {
  if (productionGuard.isProduction()) {
    // console.warn(`⚠️ Development feature detected in production: ${message}`)
  }
}

export function onlyInDevelopment<T>(fn: () => T): T | null {
  if (productionGuard.isDevelopment()) {
    return fn();
  }
  return null;
}

export function onlyInProduction<T>(fn: () => T): T | null {
  if (productionGuard.isProduction()) {
    return fn();
  }
  return null;
}
