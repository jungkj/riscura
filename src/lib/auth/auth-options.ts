// TODO: Replace with your actual NextAuth options
import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/auth/password';
import { env } from '@/config/env';
import { UserRole } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { generateAccessToken } from './jwt';
import { createSession, validateSession } from './session';
import { ROLE_PERMISSIONS } from './index';

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

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db.client),
  providers,
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
        exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
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
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle Google OAuth sign-in
      if (account?.provider === 'google') {
        try {
          // Check if user exists
          const existingUser = await db.client.user.findUnique({
            where: { email: user.email! }
          });

          if (!existingUser) {
            // For OAuth, we need an organization invite or allow self-registration
            // For now, prevent OAuth registration without existing account
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
        // Get user data from database for JWT
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
      }

      // Refresh user data periodically
      if (token.id && (!token.lastRefresh || Date.now() - (token.lastRefresh as number) > 5 * 60 * 1000)) {
        try {
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
        } catch (error) {
          console.error('Token refresh error:', error);
        }
      }

      // TODO: Create session record for enhanced security
      // if (account && token.organizationId) {
      //   await createSession({...});
      // }

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