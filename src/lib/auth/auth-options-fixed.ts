// Fixed NextAuth configuration with proper error handling
import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { verifyPassword } from '@/lib/auth/password';
import { env } from '@/config/env';
import { UserRole } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { generateAccessToken } from './jwt';
import { createSession, validateSession } from './session';
import { ROLE_PERMISSIONS } from './index';
import { db } from '@/lib/db';

// Build providers array conditionally based on available credentials
const providers: any[] = [];

// Debug logging for Google OAuth configuration
console.log('[NextAuth] Google OAuth configuration check:', {
  hasClientId: !!env.GOOGLE_CLIENT_ID,
  hasClientSecret: !!env.GOOGLE_CLIENT_SECRET,
  clientIdLength: env.GOOGLE_CLIENT_ID?.length || 0,
  clientSecretLength: env.GOOGLE_CLIENT_SECRET?.length || 0,
  // Log first few chars to verify it's being loaded
  clientIdPreview: env.GOOGLE_CLIENT_ID ? `${env.GOOGLE_CLIENT_ID.substring(0, 10)}...` : 'not set',
});

// Only add Google provider if credentials are available
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  console.log('[NextAuth] Adding Google provider');
  providers.push(
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    })
  );
} else {
  console.log('[NextAuth] Google provider not added - missing credentials');
}

// Always add credentials provider
providers.push(
  CredentialsProvider({
    name: 'credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        return null;
      }

      try {
        // Check for demo credentials first
        if (credentials.email === 'admin@riscura.com' && credentials.password === 'admin123') {
          return {
            id: 'demo-admin-id',
            email: 'admin@riscura.com',
            name: 'Demo Admin',
            firstName: 'Demo',
            lastName: 'Admin',
            role: 'ADMIN',
            organizationId: 'demo-org-id',
            permissions: ['*'],
          };
        }

        // Database authentication with health check
        const isHealthy = await db.healthCheck().catch(() => ({ isHealthy: false }));

        if (!isHealthy.isHealthy) {
          console.warn('[NextAuth] Database not available, falling back to demo mode only');
          return null;
        }

        const user = await db.client.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: {
            organization: true,
          },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        if (!user.isActive) {
          throw new Error('Account is deactivated');
        }

        if (!user.emailVerified && env.NODE_ENV === 'production') {
          throw new Error('Email not verified');
        }

        const isPasswordValid = await verifyPassword(credentials.password, user.passwordHash);
        if (!isPasswordValid) {
          return null;
        }

        // Update last login
        await db.client.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          image: user.avatar,
        } as any;
      } catch (error) {
        console.error('Authentication error:', error);
        return null;
      }
    },
  })
);

// Initialize database adapter with proper error handling
async function getDatabaseAdapter() {
  // During build time, skip database initialization
  if (process.env.BUILDING === 'true' || process.env.NEXT_PHASE === 'phase-production-build') {
    console.log('[NextAuth] Skipping database adapter during build');
    return null;
  }

  if (typeof window !== 'undefined') {
    return null; // Client side
  }

  try {
    // Check database connection first
    const healthCheck = await db.healthCheck().catch(() => ({ isHealthy: false }));

    if (healthCheck.isHealthy) {
      console.log('[NextAuth] Database adapter initialized successfully');
      return PrismaAdapter(db.client);
    } else {
      console.warn('[NextAuth] Database not available, running without adapter');
      return null;
    }
  } catch (error) {
    console.error('[NextAuth] Failed to initialize database adapter:', error);
    return null;
  }
}

export const authOptions: NextAuthOptions = {
  // Database adapter will be set dynamically
  providers,
  debug: process.env.NODE_ENV === 'development',
  secret: env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    secret: env.JWT_ACCESS_SECRET,
    maxAge: 30 * 24 * 60 * 60, // 30 days
    encode: async ({ secret, token }) => {
      const payload = {
        ...token,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      };
      return jwt.sign(payload, secret, { algorithm: 'HS256' });
    },
    decode: async ({ secret, token }) => {
      try {
        return jwt.verify(token!, secret) as any;
      } catch (error) {
        return null;
      }
    },
  },
  logger: {
    error(code, metadata) {
      console.error('[NextAuth Error]', { code, metadata });
    },
    warn(code) {
      console.warn('[NextAuth Warning]', code);
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[NextAuth Debug]', { code, metadata });
      }
    },
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('[NextAuth] signIn callback:', {
        provider: account?.provider,
        email: user?.email,
        accountId: account?.providerAccountId,
      });

      // Handle Google OAuth sign-in
      if (account?.provider === 'google') {
        try {
          // Check database connection
          const isHealthy = await db.healthCheck().catch(() => ({ isHealthy: false }));

          if (!isHealthy.isHealthy) {
            // Database not available, allow OAuth login without persistence
            console.warn('[NextAuth] Database not available, OAuth login without persistence');
            return true;
          }

          // Check if user exists
          const existingUser = await db.client.user.findUnique({
            where: { email: user.email! },
          });

          if (!existingUser) {
            console.log('[NextAuth] No existing user found for email:', user.email);
            // For OAuth, we need an organization invite or allow self-registration
            return `/auth/error?error=NoInvite`;
          }

          // Link OAuth account to existing user
          await db.client.user.update({
            where: { email: user.email! },
            data: {
              emailVerified: new Date(),
              lastLogin: new Date(),
            },
          });

          return true;
        } catch (error) {
          console.error('OAuth sign-in error:', error);
          return false;
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      // Add organization and role info to JWT token
      if (user) {
        try {
          // Get user data from database for JWT
          const isHealthy = await db.healthCheck().catch(() => ({ isHealthy: false }));

          if (isHealthy.isHealthy) {
            const dbUser = await db.client.user.findUnique({
              where: { id: user.id },
              include: { organization: true },
            });

            if (dbUser) {
              token.id = dbUser.id;
              token.role = dbUser.role;
              token.organizationId = dbUser.organizationId;
              token.permissions = dbUser.permissions;
              token.firstName = dbUser.firstName;
              token.lastName = dbUser.lastName;
              token.avatar = dbUser.avatar;
            }
          } else {
            // Database not available, use demo data
            token.id = user.id;
            token.role = 'USER';
            token.organizationId = 'demo-org-id';
            token.permissions = [];
          }
        } catch (error) {
          console.error('JWT callback error:', error);
        }
      }

      // Refresh user data periodically (but less frequently to avoid DB strain)
      if (
        token.id &&
        (!token.lastRefresh || Date.now() - (token.lastRefresh as number) > 15 * 60 * 1000)
      ) {
        try {
          const isHealthy = await db.healthCheck().catch(() => ({ isHealthy: false }));

          if (isHealthy.isHealthy) {
            const dbUser = await db.client.user.findUnique({
              where: { id: token.id as string },
              include: { organization: true },
            });

            if (dbUser) {
              token.role = dbUser.role;
              token.organizationId = dbUser.organizationId;
              token.permissions = dbUser.permissions;
              token.firstName = dbUser.firstName;
              token.lastName = dbUser.lastName;
              token.avatar = dbUser.avatar;
              token.isActive = dbUser.isActive;
              token.organization = dbUser.organization;
              token.lastRefresh = Date.now();
            }
          }
        } catch (error) {
          console.error('Token refresh error:', error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      if (token) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as UserRole;
        (session.user as any).organizationId = token.organizationId as string;
        (session.user as any).permissions = token.permissions as string[];
        (session.user as any).firstName = token.firstName as string;
        (session.user as any).lastName = token.lastName as string;
        (session.user as any).avatar = token.avatar as string;
        (session.user as any).isActive = token.isActive as boolean;
        (session.user as any).organization = token.organization as any;
        (session.user as any).sessionId = token.sessionId as string;

        // Validate session is still active (but less frequently)
        if (
          token.sessionId &&
          (!token.lastSessionCheck ||
            Date.now() - (token.lastSessionCheck as number) > 30 * 60 * 1000)
        ) {
          try {
            const isValid = await validateSession(token.sessionId as string);
            if (!isValid) {
              throw new Error('Session expired');
            }
            token.lastSessionCheck = Date.now();
          } catch (error) {
            console.error('Session validation error:', error);
          }
        }
      }

      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl + '/dashboard';
    },
  },
  pages: {
    signIn: '/auth/login',
    signUp: '/auth/register',
    error: '/auth/error',
    verifyRequest: '/auth/verify-email',
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      // Log successful sign-in
      console.log(`User ${user.email} signed in with ${account?.provider || 'credentials'}`);

      // Create activity log if database is available
      if (user.id && user.id !== 'demo-admin-id') {
        try {
          const isHealthy = await db.healthCheck().catch(() => ({ isHealthy: false }));

          if (isHealthy.isHealthy) {
            await db.client.activity.create({
              data: {
                type: 'USER_LOGIN',
                description: `User logged in via ${account?.provider || 'credentials'}`,
                userId: user.id,
                organizationId: (user as any).organizationId as string,
                metadata: {
                  provider: account?.provider,
                  isNewUser,
                  timestamp: new Date().toISOString(),
                },
              },
            });
          }
        } catch (error) {
          console.error('Failed to log sign-in activity:', error);
        }
      }
    },
    async signOut({ token }) {
      // Log sign-out if database is available
      if (token?.id && token.id !== 'demo-admin-id') {
        try {
          const isHealthy = await db.healthCheck().catch(() => ({ isHealthy: false }));

          if (isHealthy.isHealthy) {
            await db.client.activity.create({
              data: {
                type: 'USER_LOGOUT',
                description: 'User logged out',
                userId: token.id as string,
                organizationId: token.organizationId as string,
                metadata: {
                  timestamp: new Date().toISOString(),
                },
              },
            });
          }
        } catch (error) {
          console.error('Failed to log sign-out activity:', error);
        }
      }
    },
  },
  debug: env.NODE_ENV === 'development',
};

// Initialize adapter dynamically
getDatabaseAdapter()
  .then((adapter) => {
    if (adapter) {
      authOptions.adapter = adapter;
    }
  })
  .catch((error) => {
    console.error('[NextAuth] Failed to set database adapter:', error);
  });

export default authOptions;
