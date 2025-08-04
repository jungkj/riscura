// Environment configuration with validation
import { z } from 'zod';

// Production guard check
const isProduction = process.env.NODE_ENV === 'production';
const isDemoMode = process.env.DEMO_MODE === 'true' && !isProduction;

// Helper to check if a value looks like a development/test secret
function isInsecureSecret(value: string): boolean {
  const insecurePatterns = [
    'dev-',
    'test-',
    'demo-',
    'localhost',
    '12345',
    'change-me',
    'please-change',
    'development',
    'testing',
    'secret-key',
  ];

  return insecurePatterns.some((pattern) => value.toLowerCase().includes(pattern.toLowerCase()));
}

// Custom secret validator for production
const productionSecretSchema = z
  .string()
  .min(32, 'Secret must be at least 32 characters in production')
  .refine(
    (value) => !isProduction || !isInsecureSecret(value),
    'Development/test secrets are not allowed in production'
  );

// Environment schema with enhanced security
const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_URL: z
    .string()
    .url()
    .refine(
      (url) => !isProduction || !url.includes('localhost'),
      'localhost URLs not allowed in production'
    ),
  APP_NAME: z.string().default('Riscura'),
  PORT: z.string().default('3000'),
  API_VERSION: z.string().default('v1'),

  // Database - enforce SSL in production
  DATABASE_URL: isProduction
    ? z
        .string()
        .url()
        .refine(
          (url) =>
            url.includes('ssl=true') ||
            url.includes('sslmode=require') ||
            url.includes('postgresql'),
          'Database must use SSL in production'
        )
        .refine(
          (url) => !url.includes('localhost') && !url.includes('127.0.0.1'),
          'Database cannot be localhost in production'
        )
    : z.string().default('file:./dev.db'),

  // Authentication & Security - strict requirements in production
  JWT_SECRET: isProduction
    ? productionSecretSchema
    : z.string().min(32).default('dev-jwt-secret-12345678901234567890123456789012'),
  JWT_ACCESS_SECRET: isProduction
    ? productionSecretSchema
    : z.string().min(32).default('dev-jwt-access-secret-12345678901234567890123456789012'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  NEXTAUTH_SECRET: isProduction
    ? productionSecretSchema
    : z.string().min(32).default('dev-nextauth-secret-12345678901234567890123456789012'),
  NEXTAUTH_URL: z.string().url().optional(),

  SESSION_SECRET: isProduction
    ? productionSecretSchema
    : z.string().min(32).default('dev-session-secret-12345678901234567890123456789012'),
  BCRYPT_ROUNDS: z.string().transform(Number).default('12'),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // OpenAI API
  OPENAI_API_KEY: z.string().optional().default(''),
  OPENAI_ORG_ID: z.string().optional(),

  // Enhanced Security Configuration
  AI_ENCRYPTION_KEY: isProduction
    ? productionSecretSchema
    : z.string().min(32).default('dev-ai-encryption-key-12345678901234567890123456789012'),

  CSRF_SECRET: isProduction
    ? productionSecretSchema
    : z.string().min(32).default('dev-csrf-secret-12345678901234567890123456789012'),

  COOKIE_SECRET: isProduction
    ? productionSecretSchema
    : z.string().min(32).default('dev-cookie-secret-12345678901234567890123456789012'),

  INTERNAL_API_KEY: isProduction
    ? productionSecretSchema
    : z.string().min(32).default('dev-internal-api-key-12345678901234567890123456789012'),

  WEBHOOK_SECRET: isProduction
    ? productionSecretSchema
    : z.string().min(32).default('dev-webhook-secret-12345678901234567890123456789012'),

  DATABASE_ENCRYPTION_KEY: isProduction
    ? productionSecretSchema
    : z.string().min(32).default('dev-database-encryption-key-12345678901234567890123456789012'),

  FILE_ENCRYPTION_KEY: isProduction
    ? productionSecretSchema
    : z.string().min(32).default('dev-file-encryption-key-12345678901234567890123456789012'),

  // Security Feature Flags - forced on in production
  ENABLE_CSRF_PROTECTION: z
    .string()
    .transform((v) => (isProduction ? true : v !== 'false'))
    .default(isProduction ? 'true' : 'true'),

  ENABLE_RATE_LIMITING: z
    .string()
    .transform((v) => (isProduction ? true : v !== 'false'))
    .default(isProduction ? 'true' : 'true'),

  ENABLE_SECURITY_HEADERS: z
    .string()
    .transform((v) => (isProduction ? true : v !== 'false'))
    .default(isProduction ? 'true' : 'true'),

  ENABLE_EMAIL_VERIFICATION: z
    .string()
    .transform((v) => v === 'true')
    .default(isProduction ? 'true' : 'false'),

  ENABLE_2FA: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),

  // Disable development features in production
  DEBUG_MODE: z
    .string()
    .transform((v) => (isProduction ? false : v === 'true'))
    .default('false'),

  MOCK_DATA: z
    .string()
    .transform((v) => (isProduction ? false : v === 'true'))
    .default('false'),

  SKIP_EMAIL_VERIFICATION: z
    .string()
    .transform((v) => (isProduction ? false : v === 'true'))
    .default('false'),

  // Demo mode - only allowed in development
  DEMO_MODE: z
    .string()
    .transform((v) => (isProduction ? false : v === 'true'))
    .default('false')
    .refine((value) => !isProduction || !value, 'Demo mode is not allowed in production'),

  // Strict production mode
  STRICT_PRODUCTION_MODE: z
    .string()
    .transform((v) => v !== 'false')
    .default('true'),

  // Email Configuration
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).default('587'),
  SMTP_USER: z.string().email().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email().default('noreply@riscura.com'),

  // File Storage
  UPLOAD_MAX_SIZE: z.string().transform(Number).default('10485760'), // 10MB
  UPLOAD_ALLOWED_TYPES: z.string().default('pdf,docx,xlsx,png,jpg,jpeg'),
  STORAGE_TYPE: z.enum(['local', 's3', 'gcs']).default('local'),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_S3_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),

  // Redis (for rate limiting and sessions in production)
  REDIS_URL: isProduction ? z.string().url().optional() : z.string().url().optional(),

  // Rate Limiting - stricter in production
  RATE_LIMIT_MAX: z
    .string()
    .transform(Number)
    .default(isProduction ? '60' : '100'), // Lower limits in production
  RATE_LIMIT_WINDOW: z.string().transform(Number).default('900000'), // 15 minutes

  // Monitoring - optional for now
  SENTRY_DSN: z.string().url().optional(),

  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default(isProduction ? 'warn' : 'info'),

  // Feature Flags
  ENABLE_AI_FEATURES: z
    .string()
    .transform((v) => v !== 'false')
    .default('true'),
  ENABLE_COLLABORATION: z
    .string()
    .transform((v) => v === 'true')
    .default('true'),
  ENABLE_REAL_TIME: z
    .string()
    .transform((v) => v === 'true')
    .default('true'),
  ENABLE_EMAIL_NOTIFICATIONS: z
    .string()
    .transform((v) => v === 'true')
    .default('true'),

  // Content Security Policy
  CSP_REPORT_URI: z.string().url().optional(),
  CSP_REPORT_ONLY: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),

  // Additional security headers
  HSTS_MAX_AGE: z.string().transform(Number).default('31536000'), // 1 year
  HSTS_INCLUDE_SUBDOMAINS: z
    .string()
    .transform((v) => v !== 'false')
    .default('true'),
  HSTS_PRELOAD: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),

  // Rate limiting for different endpoint types
  AUTH_RATE_LIMIT_MAX: z.string().transform(Number).default('5'),
  AUTH_RATE_LIMIT_WINDOW: z.string().transform(Number).default('900000'), // 15 minutes

  UPLOAD_RATE_LIMIT_MAX: z.string().transform(Number).default('10'),
  UPLOAD_RATE_LIMIT_WINDOW: z.string().transform(Number).default('3600000'), // 1 hour

  API_RATE_LIMIT_MAX: z.string().transform(Number).default('1000'),
  API_RATE_LIMIT_WINDOW: z.string().transform(Number).default('900000'), // 15 minutes

  // Stripe Configuration - optional for now
  STRIPE_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_ID_PRO: z.string().optional(),
  STRIPE_PRICE_ID_ENTERPRISE: z.string().optional(),
});

// Parse and validate environment variables with enhanced error handling
function validateEnv() {
  // Skip validation if explicitly requested (useful for builds)
  if (process.env.SKIP_ENV_VALIDATION === '1' || process.env.SKIP_ENV_VALIDATION === 'true') {
    // console.warn('⚠️ Environment validation skipped due to SKIP_ENV_VALIDATION flag');
    return createMinimalEnv();
  }

  // During build time, use minimal validation to allow builds to succeed
  const isBuildTime =
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.npm_lifecycle_event === 'build' ||
    process.env.CI === 'true';

  if (isBuildTime) {
    // console.log('🔧 Build time detected - using minimal environment validation');
    return createMinimalEnv();
  }

  try {
    const parsed = envSchema.parse(process.env);

    // Additional production validations (only at runtime, not build time)
    if (isProduction && !isBuildTime) {
      validateProductionEnvironment(parsed);
    }

    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((err) => {
        const path = err.path.join('.');
        return `❌ ${path}: ${err.message}`;
      });

      // console.error('Environment validation failed:');
      // console.error('Missing required variables:', missingVars);
      // console.error('Please check your .env.local file and ensure all required variables are set.');
      // console.error('See env.example for reference values.');

      if (isProduction && !isBuildTime) {
        // console.error('\n🛡️ Production security requires all secrets to be properly configured.');
        // console.error('Run `npm run check:env` to validate your environment configuration.');
        throw new Error('Environment validation failed');
      } else {
        // In development mode or build time, use minimal environment with defaults
        // console.warn('⚠️ Using default environment values for missing variables.');
        // console.warn('💡 For full functionality, create a .env.local file with proper values.');
        return createMinimalEnv();
      }
    }
    throw error;
  }
}

// Create minimal environment for build processes and development
function createMinimalEnv() {
  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    APP_URL: process.env.APP_URL || 'http://localhost:3000',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    DATABASE_URL: process.env.DATABASE_URL || process.env.database_url || 'file:./dev.db',

    // JWT & Authentication Secrets (Development defaults)
    JWT_SECRET:
      process.env.JWT_SECRET || 'dev-jwt-secret-12345678901234567890123456789012345678901234567890',
    JWT_ACCESS_SECRET:
      process.env.JWT_ACCESS_SECRET ||
      'dev-jwt-access-secret-12345678901234567890123456789012345678901234567890',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
    NEXTAUTH_SECRET:
      process.env.NEXTAUTH_SECRET ||
      'dev-nextauth-secret-12345678901234567890123456789012345678901234567890',

    // Session & Security (Development defaults)
    SESSION_SECRET:
      process.env.SESSION_SECRET ||
      'dev-session-secret-12345678901234567890123456789012345678901234567890',
    CSRF_SECRET:
      process.env.CSRF_SECRET ||
      'dev-csrf-secret-12345678901234567890123456789012345678901234567890',
    COOKIE_SECRET:
      process.env.COOKIE_SECRET ||
      'dev-cookie-secret-12345678901234567890123456789012345678901234567890',

    // Internal API & Webhook secrets
    INTERNAL_API_KEY:
      process.env.INTERNAL_API_KEY ||
      'dev-internal-api-key-12345678901234567890123456789012345678901234567890',
    WEBHOOK_SECRET:
      process.env.WEBHOOK_SECRET ||
      'dev-webhook-secret-12345678901234567890123456789012345678901234567890',

    // OAuth providers (pass through if available)
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || undefined,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || undefined,

    // Encryption keys
    DATABASE_ENCRYPTION_KEY:
      process.env.DATABASE_ENCRYPTION_KEY ||
      'dev-db-encryption-key-12345678901234567890123456789012345678901234567890',
    FILE_ENCRYPTION_KEY:
      process.env.FILE_ENCRYPTION_KEY ||
      'dev-file-encryption-key-12345678901234567890123456789012345678901234567890',
    AI_ENCRYPTION_KEY:
      process.env.AI_ENCRYPTION_KEY ||
      'dev-ai-encryption-key-12345678901234567890123456789012345678901234567890',

    // BCrypt settings
    BCRYPT_ROUNDS: 10,

    // Debug and logging
    DEBUG_MODE: true,
    LOG_LEVEL: 'info',

    // Security features (development defaults)
    ENABLE_CSRF_PROTECTION: true,
    ENABLE_RATE_LIMITING: true,
    ENABLE_SECURITY_HEADERS: true,
    ENABLE_2FA: false,
    ENABLE_EMAIL_VERIFICATION: false,

    // Feature flags
    ENABLE_AI_FEATURES: false,
    ENABLE_COLLABORATION: true,
    ENABLE_REAL_TIME: true,
    ENABLE_EMAIL_NOTIFICATIONS: false,

    // Rate limiting defaults
    RATE_LIMIT_MAX: 100,
    RATE_LIMIT_WINDOW: 900000,
    AUTH_RATE_LIMIT_MAX: 10,
    AUTH_RATE_LIMIT_WINDOW: 900000,
    UPLOAD_RATE_LIMIT_MAX: 10,
    UPLOAD_RATE_LIMIT_WINDOW: 3600000,
    API_RATE_LIMIT_MAX: 1000,
    API_RATE_LIMIT_WINDOW: 900000,

    // File upload settings
    UPLOAD_MAX_SIZE: 10485760,
    UPLOAD_ALLOWED_TYPES: 'pdf,docx,xlsx,png,jpg,jpeg',
    STORAGE_TYPE: 'local',

    // Email settings (optional)
    SMTP_PORT: 587,
    SMTP_FROM: 'noreply@riscura.com',

    // AWS defaults
    AWS_S3_REGION: 'us-east-1',

    // Security headers
    HSTS_MAX_AGE: 31536000,
    HSTS_INCLUDE_SUBDOMAINS: true,
    HSTS_PRELOAD: false,
    CSP_REPORT_ONLY: false,

    // Optional fields that can be undefined
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    OPENAI_ORG_ID: process.env.OPENAI_ORG_ID || '',
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
    SMTP_HOST: process.env.SMTP_HOST || '',
    SMTP_USER: process.env.SMTP_USER || '',
    SMTP_PASS: process.env.SMTP_PASS || '',
    REDIS_URL: process.env.REDIS_URL || '',
    SENTRY_DSN: process.env.SENTRY_DSN || '',
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || '',
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
    CSP_REPORT_URI: process.env.CSP_REPORT_URI || '',

    // Stripe Configuration (Development defaults)
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_key_for_development',
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder_key_for_development',
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
    STRIPE_PRICE_ID_PRO: process.env.STRIPE_PRICE_ID_PRO || '',
    STRIPE_PRICE_ID_ENTERPRISE: process.env.STRIPE_PRICE_ID_ENTERPRISE || '',
  } as any;
}

// Additional production environment validations
function validateProductionEnvironment(env: any) {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for required production services
  if (!env.SMTP_HOST) {
    warnings.push('SMTP_HOST not configured - email notifications will be disabled');
  }

  if (!env.REDIS_URL) {
    warnings.push(
      'REDIS_URL not configured - using in-memory storage for sessions and rate limiting'
    );
  }

  // SENTRY_DSN is now optional
  // if (!env.SENTRY_DSN) {
  //   errors.push('SENTRY_DSN is required in production for error monitoring');
  // }

  // Check SSL/HTTPS configuration
  if (env.APP_URL && env.APP_URL.startsWith('http://') && !env.APP_URL.includes('localhost')) {
    errors.push('APP_URL must use HTTPS in production');
  }

  if (
    env.NEXTAUTH_URL &&
    env.NEXTAUTH_URL.startsWith('http://') &&
    !env.NEXTAUTH_URL.includes('localhost')
  ) {
    errors.push('NEXTAUTH_URL must use HTTPS in production');
  }

  // Log warnings
  if (warnings.length > 0) {
    // console.warn('⚠️ Production warnings:');
    warnings.forEach((warning) => console.warn(`  • ${warning}`));
  }

  // Throw on errors
  if (errors.length > 0) {
    // console.error('❌ Production validation errors:');
    errors.forEach((error) => console.error(`  • ${error}`));
    throw new Error('Production environment validation failed');
  }
}

// Export validated environment variables
export const env = validateEnv();

// Type for environment
export type Environment = typeof env;

// Configuration helpers with enhanced security
export const databaseConfig = {
  url: env.DATABASE_URL,
  logging: env.NODE_ENV === 'development' && env.DEBUG_MODE,
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

export const authConfig = {
  jwtSecret: env.JWT_SECRET,
  jwtAccessSecret: env.JWT_ACCESS_SECRET,
  jwtExpiresIn: env.JWT_EXPIRES_IN,
  nextAuthSecret: env.NEXTAUTH_SECRET,
  nextAuthUrl: env.NEXTAUTH_URL || env.APP_URL,
  sessionSecret: env.SESSION_SECRET,
  bcryptRounds: env.BCRYPT_ROUNDS,
};

export const securityConfig = {
  csrfSecret: env.CSRF_SECRET,
  cookieSecret: env.COOKIE_SECRET,
  internalApiKey: env.INTERNAL_API_KEY,
  webhookSecret: env.WEBHOOK_SECRET,
  databaseEncryptionKey: env.DATABASE_ENCRYPTION_KEY,
  fileEncryptionKey: env.FILE_ENCRYPTION_KEY,
  enableCsrfProtection: env.ENABLE_CSRF_PROTECTION,
  enableRateLimiting: env.ENABLE_RATE_LIMITING,
  enableSecurityHeaders: env.ENABLE_SECURITY_HEADERS,
  enable2FA: env.ENABLE_2FA,
  enableEmailVerification: env.ENABLE_EMAIL_VERIFICATION,
};

export const googleConfig = {
  clientId: env.GOOGLE_CLIENT_ID,
  clientSecret: env.GOOGLE_CLIENT_SECRET,
  enabled: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
};

export const aiConfig = {
  apiKey: env.OPENAI_API_KEY || '',
  organizationId: env.OPENAI_ORG_ID || '',
  encryptionKey: env.AI_ENCRYPTION_KEY,
  enabled: env.ENABLE_AI_FEATURES && !!env.OPENAI_API_KEY,
};

export const emailConfig = {
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  user: env.SMTP_USER,
  pass: env.SMTP_PASS,
  from: env.SMTP_FROM,
  enabled: env.ENABLE_EMAIL_NOTIFICATIONS && !!env.SMTP_HOST,
};

export const storageConfig = {
  type: env.STORAGE_TYPE,
  uploadMaxSize: env.UPLOAD_MAX_SIZE,
  allowedTypes: env.UPLOAD_ALLOWED_TYPES.split(','),
  s3: {
    bucket: env.AWS_S3_BUCKET,
    region: env.AWS_S3_REGION,
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
};

export const rateLimitConfig = {
  default: {
    max: env.RATE_LIMIT_MAX,
    windowMs: env.RATE_LIMIT_WINDOW,
  },
  auth: {
    max: env.AUTH_RATE_LIMIT_MAX,
    windowMs: env.AUTH_RATE_LIMIT_WINDOW,
  },
  upload: {
    max: env.UPLOAD_RATE_LIMIT_MAX,
    windowMs: env.UPLOAD_RATE_LIMIT_WINDOW,
  },
  api: {
    max: env.API_RATE_LIMIT_MAX,
    windowMs: env.API_RATE_LIMIT_WINDOW,
  },
};

export const monitoringConfig = {
  sentryDsn: env.SENTRY_DSN,
  logLevel: env.LOG_LEVEL,
  enabled: !!env.SENTRY_DSN,
};

// Utility functions
export function checkRequiredEnvironmentVariables(): {
  isValid: boolean;
  missing: string[];
  warnings: string[];
} {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Critical variables
  const critical = ['DATABASE_URL', 'JWT_SECRET', 'NEXTAUTH_SECRET'];
  for (const key of critical) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  // Recommended variables
  const recommended = ['SMTP_HOST', 'OPENAI_API_KEY'];
  for (const key of recommended) {
    if (!process.env[key]) {
      warnings.push(key);
    }
  }

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
  };
}

export function isDevelopmentEnvironment(): boolean {
  return env.NODE_ENV === 'development';
}

export function isProductionEnvironment(): boolean {
  return env.NODE_ENV === 'production';
}

export function isTestEnvironment(): boolean {
  return env.NODE_ENV === 'test';
}

export function isDemoModeEnabled(): boolean {
  return env.DEMO_MODE && !isProductionEnvironment();
}

// Security validation function
export function validateSecurityConfiguration(): {
  isSecure: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];

  if (isProductionEnvironment()) {
    // Check for HTTPS
    if (env.APP_URL && !env.APP_URL.startsWith('https://')) {
      issues.push('APP_URL should use HTTPS in production');
    }

    // Check for secure database connection
    if (!env.DATABASE_URL.includes('ssl')) {
      issues.push('Database should use SSL in production');
    }

    // Check monitoring
    if (!env.SENTRY_DSN) {
      issues.push('Error monitoring (Sentry) should be configured in production');
    }

    // Check email configuration
    if (!env.SMTP_HOST) {
      recommendations.push('Configure SMTP for email notifications');
    }

    // Check Redis for sessions
    if (!env.REDIS_URL) {
      recommendations.push('Configure Redis for better session and rate limit storage');
    }
  }

  return {
    isSecure: issues.length === 0,
    issues,
    recommendations,
  };
}

// TODO: Replace with your actual app config
export const appConfig = {
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
  DATABASE_URL: process.env.DATABASE_URL || process.env.database_url || '',
  AI_ENCRYPTION_KEY: process.env.AI_ENCRYPTION_KEY || '',
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET || '',
};

export default appConfig;
