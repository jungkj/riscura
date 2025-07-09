// Direct environment variable access for debugging
import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/auth/password';
import { UserRole } from '@prisma/client';

// Direct access to environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;
const NEXTAUTH_URL = process.env.NEXTAUTH_URL;

console.log('[NextAuth Direct] Environment check:', {
  GOOGLE_CLIENT_ID: GOOGLE_CLIENT_ID ? `${GOOGLE_CLIENT_ID.substring(0, 10)}...` : 'NOT SET',
  GOOGLE_CLIENT_SECRET: GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET',
  NEXTAUTH_SECRET: NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
  NEXTAUTH_URL: NEXTAUTH_URL || 'NOT SET',
});

// Build providers array
const providers: any[] = [];

// Add Google provider if credentials exist
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  console.log('[NextAuth Direct] Adding Google provider with direct env vars');
  providers.push(
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
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
  console.log('[NextAuth Direct] Google provider not added - missing credentials');
  console.log('GOOGLE_CLIENT_ID exists:', !!GOOGLE_CLIENT_ID);
  console.log('GOOGLE_CLIENT_SECRET exists:', !!GOOGLE_CLIENT_SECRET);
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
        // Check for demo credentials
        if (credentials.email === 'admin@riscura.com' && credentials.password === 'admin123') {
          return {
            id: 'demo-admin-id',
            email: 'admin@riscura.com',
            name: 'Demo Admin',
            firstName: 'Demo',
            lastName: 'Admin',
            role: 'ADMIN',
            organizationId: 'demo-org-id',
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

        const isPasswordValid = await verifyPassword(credentials.password, user.passwordHash);
        if (!isPasswordValid) {
          return null;
        }

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

export const authOptionsDebug: NextAuthOptions = {
  adapter: PrismaAdapter(db.client),
  providers,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: NEXTAUTH_SECRET,
  debug: true, // Enable debug mode
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('[NextAuth Direct] SignIn callback:', { 
        provider: account?.provider,
        userEmail: user?.email 
      });
      
      // Handle Google OAuth sign-in
      if (account?.provider === 'google') {
        try {
          // Check if user exists
          const existingUser = await db.client.user.findUnique({
            where: { email: user.email! }
          });

          if (!existingUser) {
            // For OAuth, prevent registration without existing account
            return `/auth/error?error=NoInvite`;
          }

          // Update last login
          await db.client.user.update({
            where: { id: existingUser.id },
            data: { lastLogin: new Date() },
          });

          return true;
        } catch (error) {
          console.error('[NextAuth Direct] Google sign-in error:', error);
          return false;
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = (user as any).role;
        token.organizationId = (user as any).organizationId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).organizationId = token.organizationId;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
};