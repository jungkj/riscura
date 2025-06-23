// Mock auth configuration
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export const getCurrentUser = async (): Promise<User | null> => {
  // Mock user for development
  return {
    id: 'user_123',
    email: 'user@example.com',
    name: 'John Doe',
    role: 'admin'
  };
};

export const requireAuth = () => {
  // Mock auth middleware
  return true;
};

export const hasPermission = (user: User, permission: string): boolean => {
  // Mock permission check
  return true;
};

// Mock NextAuth configuration - compatibility export
export const authOptions = {
  // Mock NextAuth options for development
  session: { strategy: 'jwt' as const },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
}; 