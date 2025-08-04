import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options-fixed';
import { NextRequest, NextResponse } from 'next/server';

// Wrap the handler to add error logging and ensure JSON responses
async function authHandler(req: NextRequest, context: any) {
  try {
    // Log the request for debugging
    const pathname = req.nextUrl.pathname
    // console.log(`[NextAuth] Handling ${req.method} ${pathname}`)

    // Check if this is an API call expecting JSON
    const acceptHeader = req.headers.get('accept') || ''
    const isApiCall =
      acceptHeader.includes('application/json') ||
      req.headers.get('content-type')?.includes('application/json') ||
      pathname.includes('/api/auth/');

    // Special handling for session endpoint when NextAuth is not properly configured
    if (pathname.endsWith('/api/auth/session') && req.method === 'GET') {
      // Check if we have a simple OAuth session first
      const sessionToken = req.cookies.get('session-token')?.value
      if (sessionToken) {
        try {
          const sessionData = JSON.parse(Buffer.from(sessionToken, 'base64').toString());
          if (new Date(sessionData.expires) > new Date()) {
            return NextResponse.json({
              user: sessionData.user,
              expires: sessionData.expires,
            });
          }
        } catch (e) {
          // console.log('[NextAuth] Invalid simple OAuth session token')
        }
      }

      // Return null session if no valid session found
      return NextResponse.json(null)
    }

    // Initialize NextAuth with better error handling
    let handlers
    try {
      handlers = NextAuth(authOptions);
      // console.log('[NextAuth] Handlers initialized successfully')
    } catch (initError) {
      // console.error('[NextAuth] Failed to initialize:', initError)

      // For session endpoint, return null instead of error to allow fallback
      if (pathname.endsWith('/api/auth/session')) {
        // console.log('[NextAuth] Returning null session due to initialization error')
        return NextResponse.json(null);
      }

      // For other endpoints, provide a fallback response
      return NextResponse.json(
        {
          error: 'Authentication temporarily unavailable',
          message: 'Please try again or use demo credentials (admin@riscura.com / admin123)',
          fallback: true,
          details:
            process.env.NODE_ENV === 'development'
              ? {
                  error:
                    initError instanceof Error ? initError.message : 'Unknown initialization error',
                  stack: initError instanceof Error ? initError.stack : undefined,
                }
              : undefined,
        },
        { status: 503 } // Service Unavailable instead of Internal Server Error
      )
    }

    // Get the appropriate handler
    let handler
    if (req.method === 'GET' && typeof handlers.GET === 'function') {
      handler = handlers.GET;
    } else if (req.method === 'POST' && typeof handlers.POST === 'function') {
      handler = handlers.POST;
    } else if (typeof handlers === 'function') {
      // Fallback for older NextAuth versions
      handler = handlers
    } else {
      // No handler found
      return NextResponse.json({ error: `Method ${req.method} not allowed` }, { status: 405 })
    }

    const response = await handler(req, context);

    // If NextAuth returns an HTML error page for an API call, convert to JSON
    if (response && isApiCall && response.headers.get('content-type')?.includes('text/html')) {
      // console.warn('[NextAuth] HTML response detected for API call, converting to JSON')

      // Try to parse the HTML to get error details
      let errorMessage = 'Authentication configuration error'
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
    // console.error('[NextAuth] Error in auth handler:', error)
    // console.error(
    //   '[NextAuth] Error stack:',
    //   error instanceof Error ? error.stack : 'No stack trace'
    // );

    // Log environment variables (without exposing secrets)
    // console.log('[NextAuth] Environment check:', {
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      nextAuthUrl: process.env.NEXTAUTH_URL,
      nodeEnv: process.env.NODE_ENV,
    })

    // Return a more informative error response
    return new Response(
      JSON.stringify({
        error: 'Authentication configuration error',
        message: error instanceof Error ? error.message : 'Unknown error',
        details:
          process.env.NODE_ENV === 'development'
            ? {
                nextAuthUrl: process.env.NEXTAUTH_URL,
                hasGoogleAuth: !!process.env.GOOGLE_CLIENT_ID,
              }
            : undefined,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

export { authHandler as GET, authHandler as POST, authHandler as PUT, authHandler as DELETE }
