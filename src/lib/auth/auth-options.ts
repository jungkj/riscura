// TODO: Replace with your actual NextAuth options
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
import { db, isDatabaseAvailable } from '@/lib/db';

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
          // Database authentication
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

// Initialize database adapter with better error handling
let dbAdapter;
try {
  // During build time, skip database initialization
  if (process.env.BUILDING === 'true' || process.env.NEXT_PHASE === 'phase-production-build') {
    console.log('[NextAuth] Skipping database adapter during build');
    dbAdapter = null;
  } else if (typeof window === 'undefined') {
    // Only initialize on server side
    try {
      dbAdapter = PrismaAdapter(db.client);
      console.log('[NextAuth] Database adapter initialized successfully');
    } catch (adapterError) {
      console.error('[NextAuth] Failed to initialize Prisma adapter:', adapterError);
      console.warn('[NextAuth] Continuing without database adapter - using JWT-only sessions');
      dbAdapter = null;
    }
  }
} catch (error) {
  console.error('[NextAuth] Unexpected error during adapter initialization:', error);
  console.warn('[NextAuth] Running without database adapter - OAuth may not persist sessions');
  dbAdapter = null;
}

export const authOptions: NextAuthOptions = {
  ...(dbAdapter ? { adapter: dbAdapter } : {}),
  providers,
  debug: process.env.NODE_ENV === 'development',
  secret: env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  logger: {
    error(code, metadata) {
      console.error('[NextAuth Error]', { code, metadata });
    },
    warn(code) {
      console.warn('[NextAuth Warning]', code);
    },
    debug(code, metadata) {
      console.log('[NextAuth Debug]', { code, metadata });
    },
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        console.log('[NextAuth] signIn callback:', {
          provider: account?.provider,
          email: user?.email,
        });
        
        // For credentials, user is already validated in authorize function
        if (account?.provider === 'credentials') {
          return true;
        }
        
        // Handle Google OAuth sign-in
        if (account?.provider === 'google') {
          // Check if database is available
          if (!isDatabaseAvailable()) {
            console.warn('[NextAuth] Database not available for OAuth verification');
            return false;
          }
          
          try {
            // Check if user exists
            const existingUser = await db.client.user.findUnique({
              where: { email: user.email! }
            });

            if (!existingUser) {
              console.log('[NextAuth] No existing user found for email:', user.email);
              return false;
            }

            // Update last login
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
      } catch (error) {
        console.error('[NextAuth] SignIn callback error:', error);
        return false;
      }
    },
    async jwt({ token, user }) {
      try {
        // Add user info to JWT token on first sign-in
        if (user) {
          token.id = user.id;
          token.email = user.email;
          token.name = user.name;
          
          // Try to get additional user data from database if available
          if (isDatabaseAvailable()) {
            try {
              const dbUser = await db.client.user.findUnique({
                where: { email: user.email! },
                include: { organization: true },
              });
              
              if (dbUser) {
                token.id = dbUser.id;
                token.role = dbUser.role;
                token.organizationId = dbUser.organizationId;
                token.firstName = dbUser.firstName;
                token.lastName = dbUser.lastName;
                token.avatar = dbUser.avatar;
                token.isActive = dbUser.isActive;
              }
            } catch (dbError) {
              console.error('[NextAuth] Database error in JWT callback:', dbError);
              // Continue with basic token info
            }
          }
        }

        return token;
      } catch (error) {
        console.error('[NextAuth] JWT callback error:', error);
        return token;
      }
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

        // Validate session is still active
        if (token.sessionId) {
          const isValid = await validateSession(token.sessionId as string);
          if (!isValid) {
            throw new Error('Session expired');
          }
        }
      }

      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl + '/dashboard';
    }
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
      
      // Create activity log
      if (user.id && user.id !== 'demo-admin-id') {
        try {
          await db.client.activity.create({
            data: {
              type: 'USER_LOGIN',
              description: `User logged in via ${account?.provider || 'credentials'}`,
              userId: user.id,
              organizationId: user.organizationId as string,
              metadata: {
                provider: account?.provider,
                isNewUser,
                timestamp: new Date().toISOString(),
              },
            },
          });
        } catch (error) {
          console.error('Failed to log sign-in activity:', error);
        }
      }
    },
    async signOut({ token }) {
      // Log sign-out
      if (token?.id && token.id !== 'demo-admin-id') {
        try {
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
        } catch (error) {
          console.error('Failed to log sign-out activity:', error);
        }
      }
    },
  },
  debug: env.NODE_ENV === 'development',
};

export default authOptions; 