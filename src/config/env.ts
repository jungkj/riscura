// Environment configuration with validation
import { z } from 'zod';

// Check if we're in demo mode first (before validation)
const isDemoMode = process.env.MOCK_DATA === 'true' || process.env.NODE_ENV === 'development';

// Define environment schema with Zod for validation
const envSchema = z.object({
  // Database - make optional in demo mode
  DATABASE_URL: isDemoMode 
    ? z.string().default('file:./dev.db')
    : z.string().url('DATABASE_URL must be a valid PostgreSQL connection string'),
  
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_URL: z.string().url().default('http://localhost:3001'),
  APP_NAME: z.string().default('Riscura'),
  PORT: z.string().default('3001'),
  
  // API Configuration
  API_VERSION: z.string().default('v1'),
  
  // Authentication & Security - make less strict in demo mode
  JWT_SECRET: isDemoMode 
    ? z.string().default('dev-jwt-secret-12345678901234567890123456789012')
    : z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  NEXTAUTH_SECRET: isDemoMode
    ? z.string().default('dev-nextauth-secret-12345678901234567890123456789012')
    : z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url().optional(),
  SESSION_SECRET: isDemoMode
    ? z.string().default('dev-session-secret-12345678901234567890123456789012')
    : z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  BCRYPT_ROUNDS: z.string().transform(Number).default('12'),
  
  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  
  // OpenAI API - server-side only (removed client-side exposure)
  OPENAI_API_KEY: z.string().optional().default(''),
  OPENAI_ORG_ID: z.string().optional(),
  
  // AI Security Configuration
  AI_ENCRYPTION_KEY: z.string().default('dev-ai-encryption-key-12345678901234567890123456789012'),
  
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
  
  // Redis (optional for caching)
  REDIS_URL: z.string().url().optional(),
  
  // Rate Limiting
  RATE_LIMIT_MAX: z.string().transform(Number).default('100'),
  RATE_LIMIT_WINDOW: z.string().transform(Number).default('900000'), // 15 minutes
  
  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // Feature Flags
  ENABLE_AI_FEATURES: z.string().transform(v => v !== 'false').default('true'),
  ENABLE_COLLABORATION: z.string().transform(v => v === 'true').default('true'),
  ENABLE_REAL_TIME: z.string().transform(v => v === 'true').default('true'),
  ENABLE_EMAIL_NOTIFICATIONS: z.string().transform(v => v === 'true').default('true'),
  
  // Development
  DEBUG_MODE: z.string().transform(v => v === 'true').default('false'),
  MOCK_DATA: z.string().transform(v => v === 'true').default('false'),
  SKIP_EMAIL_VERIFICATION: z.string().transform(v => v === 'true').default('false'),
});

// Parse and validate environment variables
function validateEnv() {
  // Skip validation if explicitly requested (useful for builds)
  if (process.env.SKIP_ENV_VALIDATION === '1' || process.env.SKIP_ENV_VALIDATION === 'true') {
    console.warn('Environment validation skipped due to SKIP_ENV_VALIDATION flag');
    return {
      DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
      NODE_ENV: process.env.NODE_ENV || 'development',
      APP_URL: process.env.APP_URL || 'http://localhost:3001',
      APP_NAME: process.env.APP_NAME || 'Riscura',
      PORT: process.env.PORT || '3001',
      API_VERSION: process.env.API_VERSION || 'v1',
      JWT_SECRET: process.env.JWT_SECRET || 'dev-jwt-secret-12345678901234567890123456789012',
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'dev-nextauth-secret-12345678901234567890123456789012',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      SESSION_SECRET: process.env.SESSION_SECRET || 'dev-session-secret-12345678901234567890123456789012',
      BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '12'),
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
      OPENAI_ORG_ID: process.env.OPENAI_ORG_ID,
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: parseInt(process.env.SMTP_PORT || '587'),
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASS: process.env.SMTP_PASS,
      SMTP_FROM: process.env.SMTP_FROM || 'noreply@riscura.com',
      UPLOAD_MAX_SIZE: parseInt(process.env.UPLOAD_MAX_SIZE || '10485760'),
      UPLOAD_ALLOWED_TYPES: process.env.UPLOAD_ALLOWED_TYPES || 'pdf,docx,xlsx,png,jpg,jpeg',
      STORAGE_TYPE: process.env.STORAGE_TYPE || 'local',
      AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
      AWS_S3_REGION: process.env.AWS_S3_REGION || 'us-east-1',
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
      REDIS_URL: process.env.REDIS_URL,
      RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100'),
      RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'),
      SENTRY_DSN: process.env.SENTRY_DSN,
      LOG_LEVEL: process.env.LOG_LEVEL || 'info',
      ENABLE_AI_FEATURES: process.env.ENABLE_AI_FEATURES !== 'false',
      ENABLE_COLLABORATION: process.env.ENABLE_COLLABORATION !== 'false',
      ENABLE_REAL_TIME: process.env.ENABLE_REAL_TIME !== 'false',
      ENABLE_EMAIL_NOTIFICATIONS: process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'false',
      DEBUG_MODE: process.env.DEBUG_MODE === 'true',
      MOCK_DATA: process.env.MOCK_DATA === 'true',
      SKIP_EMAIL_VERIFICATION: process.env.SKIP_EMAIL_VERIFICATION === 'true',
    } as any;
  }

  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(
        `Environment validation failed:\n${missingVars.join('\n')}\n\n` +
        'Please check your .env.local file and ensure all required variables are set.'
      );
    }
    throw error;
  }
}

// Export validated environment variables
export const env = validateEnv();

// Database configuration helper
export const databaseConfig = {
  url: env.DATABASE_URL,
  logging: env.NODE_ENV === 'development',
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

// Authentication configuration helper
export const authConfig = {
  jwtSecret: env.JWT_SECRET,
  jwtExpiresIn: env.JWT_EXPIRES_IN,
  nextAuthSecret: env.NEXTAUTH_SECRET,
  nextAuthUrl: env.NEXTAUTH_URL || env.APP_URL,
  sessionSecret: env.SESSION_SECRET,
  bcryptRounds: env.BCRYPT_ROUNDS,
};

// Google OAuth configuration helper
export const googleConfig = {
  clientId: env.GOOGLE_CLIENT_ID,
  clientSecret: env.GOOGLE_CLIENT_SECRET,
  enabled: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
};

// OpenAI configuration helper
export const aiConfig = {
  apiKey: env.OPENAI_API_KEY || '',
  organizationId: env.OPENAI_ORG_ID || '',
  enabled: env.ENABLE_AI_FEATURES && !!env.OPENAI_API_KEY,
};

// Email configuration helper
export const emailConfig = {
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  user: env.SMTP_USER,
  pass: env.SMTP_PASS,
  from: env.SMTP_FROM,
  enabled: env.ENABLE_EMAIL_NOTIFICATIONS && !!env.SMTP_HOST,
};

// File storage configuration helper
export const storageConfig = {
  maxSize: env.UPLOAD_MAX_SIZE,
  allowedTypes: env.UPLOAD_ALLOWED_TYPES.split(','),
  type: env.STORAGE_TYPE,
  aws: {
    bucket: env.AWS_S3_BUCKET,
    region: env.AWS_S3_REGION,
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
};

// Rate limiting configuration helper
export const rateLimitConfig = {
  max: env.RATE_LIMIT_MAX,
  windowMs: env.RATE_LIMIT_WINDOW,
};

// Feature flags helper
export const features = {
  ai: env.ENABLE_AI_FEATURES,
  collaboration: env.ENABLE_COLLABORATION,
  realTime: env.ENABLE_REAL_TIME,
  emailNotifications: env.ENABLE_EMAIL_NOTIFICATIONS,
  mockData: env.MOCK_DATA,
  debugMode: env.DEBUG_MODE,
  skipEmailVerification: env.SKIP_EMAIL_VERIFICATION,
};

// Application configuration helper
export const appConfig = {
  name: env.APP_NAME,
  url: env.APP_URL,
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  apiVersion: env.API_VERSION,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
};

// Logging configuration helper
export const loggingConfig = {
  level: env.LOG_LEVEL,
  enableConsole: env.NODE_ENV !== 'production',
  enableFile: env.NODE_ENV === 'production',
  sentryDsn: env.SENTRY_DSN,
};

// Redis configuration helper (if available)
export const redisConfig = env.REDIS_URL ? {
  url: env.REDIS_URL,
  enabled: true,
} : {
  enabled: false,
  url: '',
};

// Export type for TypeScript usage
export type Environment = typeof env;

// Environment validation check
export function checkRequiredEnvironmentVariables(): {
  isValid: boolean;
  missing: string[];
  warnings: string[];
} {
  const missing: string[] = [];
  const warnings: string[] = [];
  
  // Check critical variables
  if (!env.DATABASE_URL) missing.push('DATABASE_URL');
  if (!env.JWT_SECRET) missing.push('JWT_SECRET');
  if (!env.NEXTAUTH_SECRET) missing.push('NEXTAUTH_SECRET');
  if (!env.OPENAI_API_KEY && env.ENABLE_AI_FEATURES) missing.push('OPENAI_API_KEY (required when AI features are enabled)');
  
  // Check optional but recommended variables
  if (!env.SMTP_HOST && env.ENABLE_EMAIL_NOTIFICATIONS) {
    warnings.push('SMTP_HOST not configured - email notifications will be disabled');
  }
  
  if (!env.REDIS_URL && env.NODE_ENV === 'production') {
    warnings.push('REDIS_URL not configured - session storage will use database');
  }
  
  return {
    isValid: missing.length === 0,
    missing,
    warnings,
  };
}

// Development environment helper
export function isDevelopmentEnvironment(): boolean {
  return env.NODE_ENV === 'development';
}

// Production environment helper
export function isProductionEnvironment(): boolean {
  return env.NODE_ENV === 'production';
}

// Test environment helper
export function isTestEnvironment(): boolean {
  return env.NODE_ENV === 'test';
} 