declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      organizationId: string;
      permissions: string[];
      firstName: string;
      lastName: string;
      avatar: string;
      isActive: boolean;  
      organization: any;
      sessionId: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    expires: string;
  }

  interface User {
    id: string;
    role: string;
    organizationId: string;
    permissions: string[];
    firstName: string;
    lastName: string;
    avatar?: string;
    isActive: boolean;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: string;
    organizationId?: string;
    permissions?: string[];
    firstName?: string;
    lastName?: string;
    avatar?: string;
    isActive?: boolean;
    organization?: any;
    sessionId?: string;
    name?: string | null;
    email?: string | null;
    picture?: string | null;
    sub?: string;
    iat?: number;
    exp?: number;
    jti?: string;
  }
} 