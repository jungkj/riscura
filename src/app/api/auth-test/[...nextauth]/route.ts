import NextAuth from 'next-auth';
import { authOptionsMinimal } from '@/lib/auth/auth-options-minimal';
import { NextRequest, NextResponse } from 'next/server';

// Test route with minimal configuration
async function handler(req: NextRequest, context: any) {
  try {
    // console.log('[NextAuth Test] Initializing with minimal config')
    const handlers = NextAuth(authOptionsMinimal);

    // Route to appropriate handler
    if (typeof handlers === 'function') {
      return handlers(req, context)
    } else if (req.method === 'GET' && handlers.GET) {
      return handlers.GET(req, context);
    } else if (req.method === 'POST' && handlers.POST) {
      return handlers.POST(req, context);
    }

    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error) {
    // console.error('[NextAuth Test] Error:', error)
    return NextResponse.json(
      {
        error: 'Auth test failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error as any).stack : undefined,
      },
      { status: 500 }
    );
  }
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE }
