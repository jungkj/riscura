import { UserRole } from '@prisma/client';
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
      organizationId: string;
      permissions: string[];
      firstName: string;
      lastName: string;
      avatar?: string | null;
      isActive: boolean;
      organization: any;
      sessionId?: string;
    };
  }
} 