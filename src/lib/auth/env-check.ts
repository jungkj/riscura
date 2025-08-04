// Environment validation specifically for authentication
import { env } from '@/config/env'

export interface AuthEnvCheck {
  isValid: boolean;
  issues: string[];
  warnings: string[];
  googleOAuth: {
    configured: boolean;
    valid: boolean;
    issues: string[];
  }
  nextAuth: {
    configured: boolean;
    valid: boolean;
    issues: string[];
  }
  database: {
    configured: boolean;
    reachable: boolean;
    issues: string[];
  }
}

export async function checkAuthEnvironment(): Promise<AuthEnvCheck> {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Check Google OAuth configuration
  const googleOAuth = {
    configured: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
    valid: false,
    issues: [] as string[],
  }

  if (!env.GOOGLE_CLIENT_ID) {
    googleOAuth.issues.push('GOOGLE_CLIENT_ID is not set');
  } else if (env.GOOGLE_CLIENT_ID.length < 50) {
    googleOAuth.issues.push('GOOGLE_CLIENT_ID appears to be invalid (too short)');
  }

  if (!env.GOOGLE_CLIENT_SECRET) {
    googleOAuth.issues.push('GOOGLE_CLIENT_SECRET is not set');
  } else if (env.GOOGLE_CLIENT_SECRET.length < 20) {
    googleOAuth.issues.push('GOOGLE_CLIENT_SECRET appears to be invalid (too short)');
  }

  googleOAuth.valid = googleOAuth.configured && googleOAuth.issues.length === 0;

  // Check NextAuth configuration
  const nextAuth = {
    configured: !!(env.NEXTAUTH_SECRET && env.NEXTAUTH_URL),
    valid: false,
    issues: [] as string[],
  }

  if (!env.NEXTAUTH_SECRET) {
    nextAuth.issues.push('NEXTAUTH_SECRET is not set');
    issues.push('NEXTAUTH_SECRET is required for authentication');
  } else if (env.NEXTAUTH_SECRET.length < 32) {
    nextAuth.issues.push('NEXTAUTH_SECRET is too short (minimum 32 characters)');
    issues.push('NEXTAUTH_SECRET must be at least 32 characters long');
  }

  if (!env.NEXTAUTH_URL) {
    nextAuth.issues.push('NEXTAUTH_URL is not set');
    warnings.push('NEXTAUTH_URL should be set for proper OAuth callbacks');
  } else {
    try {
      const url = new URL(env.NEXTAUTH_URL);
      if (url.protocol !== 'https:' && !url.hostname.includes('localhost')) {
        nextAuth.issues.push('NEXTAUTH_URL should use HTTPS in production');
        warnings.push('Using HTTP for NEXTAUTH_URL in production is not secure');
      }
    } catch {
      nextAuth.issues.push('NEXTAUTH_URL is not a valid URL');
      issues.push('NEXTAUTH_URL must be a valid URL');
    }
  }

  nextAuth.valid = nextAuth.configured && nextAuth.issues.length === 0;

  // Check database configuration
  const database = {
    configured: !!env.DATABASE_URL,
    reachable: false,
    issues: [] as string[],
  }

  if (!env.DATABASE_URL) {
    database.issues.push('DATABASE_URL is not set');
    issues.push('DATABASE_URL is required for authentication persistence');
  } else {
    try {
      const url = new URL(env.DATABASE_URL);
      if (!url.protocol.startsWith('postgres')) {
        database.issues.push('DATABASE_URL must be a PostgreSQL connection string');
        issues.push('Only PostgreSQL databases are supported');
      }
    } catch {
      database.issues.push('DATABASE_URL is not a valid connection string');
      issues.push('DATABASE_URL must be a valid PostgreSQL connection string');
    }
  }

  // Test database connection
  if (database.configured) {
    try {
      const { db } = await import('@/lib/db')
      const healthCheck = await db.healthCheck().catch(() => ({ isHealthy: false }));
      database.reachable = healthCheck.isHealthy;

      if (!database.reachable) {
        database.issues.push('Database is not reachable');
        warnings.push('Database connection failed - authentication will use demo mode only');
      }
    } catch (error) {
      database.issues.push(
        `Database connection error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      warnings.push('Database module failed to load - check configuration');
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    warnings,
    googleOAuth,
    nextAuth,
    database,
  }
}
