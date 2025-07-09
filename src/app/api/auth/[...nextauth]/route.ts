import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { NextRequest } from 'next/server';

// Wrap the handler to add error logging
async function authHandler(req: NextRequest, context: any) {
  try {
    // @ts-ignore - NextAuth typing issue in Next.js 15
    const handler = NextAuth(authOptions);
    return handler(req, context);
  } catch (error) {
    console.error('[NextAuth] Error in auth handler:', error);
    console.error('[NextAuth] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Log environment variables (without exposing secrets)
    console.log('[NextAuth] Environment check:', {
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      nextAuthUrl: process.env.NEXTAUTH_URL,
    });
    
    // Return a more informative error response
    return new Response(
      JSON.stringify({
        error: 'Authentication configuration error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export { authHandler as GET, authHandler as POST }; 