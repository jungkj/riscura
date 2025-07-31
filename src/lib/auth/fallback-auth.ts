// Fallback authentication system when database is unavailable
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { env } from '@/config/env';

// Demo users for when database is unavailable
const demoUsers = [
  {
    id: 'demo-admin-id',
    email: 'admin@riscura.com',
    password: 'admin123', // In production, this would be hashed
    name: 'Demo Admin',
    firstName: 'Demo',
    lastName: 'Admin',
    role: 'ADMIN',
    organizationId: 'demo-org-id',
    permissions: ['*'],
    avatar: null,
    isActive: true,
  },
  {
    id: 'demo-user-id',
    email: 'testuser@riscura.com',
    password: 'test123',
    name: 'Test User',
    firstName: 'Test',
    lastName: 'User',
    role: 'USER',
    organizationId: 'demo-org-id',
    permissions: ['risk:read', 'control:read'],
    avatar: null,
    isActive: true,
  },
];

export const fallbackAuthOptions: NextAuthOptions = {
  providers: [
    // Google OAuth provider (if configured)
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? [
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
          }),
        ]
      : []),

    // Credentials provider with demo users
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

        // Find demo user
        const user = demoUsers.find(
          (u) => u.email === credentials.email && u.password === credentials.password
        );

        if (user && user.isActive) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            organizationId: user.organizationId,
            permissions: user.permissions,
          };
        }

        return null;
      },
    }),
  ],
  secret: env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    secret: env.JWT_ACCESS_SECRET,
  },
  callbacks: {
    async signIn({ user, account }) {
      console.log('[FallbackAuth] Sign in attempt:', {
        provider: account?.provider,
        email: user?.email,
      });

      // Always allow sign in for fallback mode
      return true;
    },
    async jwt({ token, user }) {
      // Add user data to token on first sign in
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || 'USER';
        token.organizationId = (user as any).organizationId || 'demo-org-id';
        token.permissions = (user as any).permissions || [];
        token.fallbackMode = true;
      }

      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      if (token) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).organizationId = token.organizationId;
        (session.user as any).permissions = token.permissions;
        (session.user as any).fallbackMode = token.fallbackMode;
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
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
};

export function createFallbackAuth(): NextAuthOptions {
  console.log('[FallbackAuth] Creating fallback authentication configuration');
  console.log('[FallbackAuth] Available providers:', fallbackAuthOptions.providers.length);

  return fallbackAuthOptions;
}
