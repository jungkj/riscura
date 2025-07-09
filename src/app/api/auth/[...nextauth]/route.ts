import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { NextRequest, NextResponse } from 'next/server';

// Create handlers with proper error handling
const handlers = NextAuth(authOptions);

// Wrap the handler to add error logging and ensure JSON responses
async function authHandler(req: NextRequest, context: any) {
  try {
    // Log the request for debugging
    const pathname = req.nextUrl.pathname;
    console.log(`[NextAuth] Handling ${req.method} ${pathname}`);
    
    // Check if this is an API call expecting JSON
    const acceptHeader = req.headers.get('accept') || '';
    const isApiCall = acceptHeader.includes('application/json') || 
                      req.headers.get('content-type')?.includes('application/json') ||
                      pathname.includes('/api/auth/');
    
    // Get the appropriate handler
    let handler;
    if (req.method === 'GET' && typeof handlers.GET === 'function') {
      handler = handlers.GET;
    } else if (req.method === 'POST' && typeof handlers.POST === 'function') {
      handler = handlers.POST;
    } else if (typeof handlers === 'function') {
      // Fallback for older NextAuth versions
      handler = handlers;
    } else {
      // No handler found
      return NextResponse.json(
        { error: `Method ${req.method} not allowed` },
        { status: 405 }
      );
    }
    
    const response = await handler(req, context);
    
    // If NextAuth returns an HTML error page for an API call, convert to JSON
    if (response && isApiCall && response.headers.get('content-type')?.includes('text/html')) {
      console.warn('[NextAuth] HTML response detected for API call, converting to JSON');
      
      // Try to parse the HTML to get error details
      let errorMessage = 'Authentication configuration error';
      try {
        const text = await response.text();
        if (text.includes('Configuration')) {
          errorMessage = 'NextAuth configuration error - check server logs';
        } else if (text.includes('Database')) {
          errorMessage = 'Database connection error';
        }
      } catch {}
      
      return NextResponse.json(
        {
          error: errorMessage,
          message: 'The authentication system encountered an error',
          status: response.status || 500,
        },
        {
          status: response.status || 500,
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, must-revalidate',
          },
        }
      );
    }
    
    return response;
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
      nodeEnv: process.env.NODE_ENV,
    });
    
    // Return a more informative error response
    return new Response(
      JSON.stringify({
        error: 'Authentication configuration error',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? {
          nextAuthUrl: process.env.NEXTAUTH_URL,
          hasGoogleAuth: !!process.env.GOOGLE_CLIENT_ID,
        } : undefined,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export { authHandler as GET, authHandler as POST, authHandler as PUT, authHandler as DELETE }; 