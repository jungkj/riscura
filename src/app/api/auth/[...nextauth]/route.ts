import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

// @ts-ignore - NextAuth typing issue in Next.js 15
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 