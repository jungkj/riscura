import type { NextAuthOptions } from 'next-auth';

export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  nextAuthSecret: string;
  nextAuthUrl: string;
  sessionSecret: string;
  bcryptRounds: number;
}

export const authOptions: NextAuthOptions = {
  providers: [],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};

export const AUTH_CONFIG: AuthConfig = {
  jwtSecret: process.env.JWT_SECRET || 'default-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  nextAuthSecret: process.env.NEXTAUTH_SECRET || 'default-secret',
  nextAuthUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  sessionSecret: process.env.SESSION_SECRET || 'default-secret',
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
};

export default AUTH_CONFIG; 