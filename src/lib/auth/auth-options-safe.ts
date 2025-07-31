// Safe NextAuth configuration that handles initialization errors gracefully
import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import jwt from 'jsonwebtoken';

// Safe environment getter
const safeEnv = {
  get GOOGLE_CLIENT_ID() {
    return process.env.GOOGLE_CLIENT_ID;
  },
  get GOOGLE_CLIENT_SECRET() {
    return process.env.GOOGLE_CLIENT_SECRET;
  },
  get NEXTAUTH_SECRET() {
    return process.env.NEXTAUTH_SECRET || 'development-secret';
  },
  get JWT_ACCESS_SECRET() {
    return process.env.JWT_ACCESS_SECRET || process.env.NEXTAUTH_SECRET || 'development-secret';
  },
  get NODE_ENV() {
    return process.env.NODE_ENV;
  },
};

// Build providers array
const providers: any[] = [];

// Only add Google provider if credentials are available
if (safeEnv.GOOGLE_CLIENT_ID && safeEnv.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: safeEnv.GOOGLE_CLIENT_ID,
      clientSecret: safeEnv.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    })
  );
}

// Always add credentials provider for fallback
providers.push(
  CredentialsProvider({
    name: 'credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      // Demo credentials for testing
      if (credentials?.email === 'admin@riscura.com' && credentials?.password === 'admin123') {
        return {
          id: 'demo-admin-id',
          email: 'admin@riscura.com',
          name: 'Demo Admin',
        };
      }
      return null;
    },
  })
);

// Create auth options factory
export async function createAuthOptions(): Promise<NextAuthOptions> {
  let adapter;

  // Try to get database adapter
  try {
    const { db } = await import('@/lib/db');
    adapter = PrismaAdapter(db.client);
    console.log('[NextAuth] Database adapter loaded successfully');
  } catch (error) {
    console.error('[NextAuth] Failed to load database adapter:', error);
    console.warn('[NextAuth] Continuing without database persistence');
  }

  return {
    ...(adapter ? { adapter } : {}),
    providers,
    debug: true,
    secret: safeEnv.NEXTAUTH_SECRET,
    session: {
      strategy: 'jwt',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    jwt: {
      secret: safeEnv.JWT_ACCESS_SECRET,
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
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.id = user.id;
          token.email = user.email;
          token.name = user.name;
        }
        return token;
      },
      async session({ session, token }) {
        if (session.user) {
          (session.user as any).id = token.id;
        }
        return session;
      },
      async redirect({ url, baseUrl }) {
        if (url.startsWith('/')) return `${baseUrl}${url}`;
        else if (new URL(url).origin === baseUrl) return url;
        return baseUrl + '/dashboard';
      },
    },
    pages: {
      signIn: '/auth/login',
      error: '/auth/error',
    },
  };
}

// Create a cached version
let cachedOptions: NextAuthOptions | null = null;

export async function getAuthOptions(): Promise<NextAuthOptions> {
  if (!cachedOptions) {
    cachedOptions = await createAuthOptions();
  }
  return cachedOptions;
}
