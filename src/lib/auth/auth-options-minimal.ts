// Minimal NextAuth configuration for debugging
import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

// Simple configuration without database dependencies
export const authOptionsMinimal: NextAuthOptions = {
  debug: true,
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-testing',
  
  providers: [
    // Only include Google if credentials are available
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        authorization: {
          params: {
            prompt: 'consent',
            access_type: 'offline',
            response_type: 'code',
          },
        },
      })
    ] : []),
  ],
  
  // Use JWT strategy without database
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  // Simple callbacks without database access
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
    
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
};