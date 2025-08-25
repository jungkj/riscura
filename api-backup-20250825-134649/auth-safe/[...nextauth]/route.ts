import NextAuth from 'next-auth';
import { getAuthOptions } from '@/lib/auth/auth-options-safe';
import { NextRequest, NextResponse } from 'next/server';

// Safe auth handler that loads options dynamically
async function handler(req: NextRequest, context: any) {
  try {
    // Get auth options dynamically
    const authOptions = await getAuthOptions();
    
    // Initialize NextAuth with the options
    const handlers = NextAuth(authOptions);
    
    // Route to appropriate handler
    if (typeof handlers === 'function') {
      return handlers(req, context);
    } else if (req.method === 'GET' && handlers.GET) {
      return handlers.GET(req, context);
    } else if (req.method === 'POST' && handlers.POST) {
      return handlers.POST(req, context);
    }
    
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error) {
    console.error('[NextAuth Safe] Error:', error);
    
    // Return a proper JSON error response
    return NextResponse.json(
      {
        error: 'Authentication system error',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? {
          stack: error instanceof Error ? error.stack : undefined,
          type: error?.constructor?.name,
        } : undefined,
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE };