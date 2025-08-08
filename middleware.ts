import { NextRequest, NextResponse } from 'next/server';
import { generateCSPNonce } from '@/lib/security/headers';

/**
 * Rate limiting store
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Get client IP address
 */
function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Apply rate limiting
 */
function applyRateLimit(
  request: NextRequest, 
  config: { windowMs: number; maxRequests: number }
): { allowed: boolean; resetTime: number } {
  const clientIP = getClientIP(request);
  const key = `${clientIP}:${request.nextUrl.pathname}`;
  const now = Date.now();
  
  const existing = rateLimitStore.get(key);
  
  if (!existing || now > existing.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return { allowed: true, resetTime: now + config.windowMs };
  }
  
  if (existing.count >= config.maxRequests) {
    return { allowed: false, resetTime: existing.resetTime };
  }
  
  rateLimitStore.set(key, { ...existing, count: existing.count + 1 });
  return { allowed: true, resetTime: existing.resetTime };
}

/**
 * Apply security headers
 */
function applySecurityHeaders(response: NextResponse, nonce?: string): NextResponse {
  // Security headers
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    nonce ? `script-src 'self' 'nonce-${nonce}'` : "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' https://fonts.gstatic.com data:",
    "connect-src 'self' https://api.openai.com https://api.stripe.com",
    "frame-src 'self' https://js.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', cspDirectives);
  
  return response;
}

/**
 * Main middleware function
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static assets and specific API routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname === '/api/health' ||
    pathname.startsWith('/api/test') ||
    pathname.startsWith('/api/google-oauth/') ||
    pathname.startsWith('/sw.js') ||
    pathname === '/manifest.json' ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/auth/refresh') ||
    pathname.startsWith('/api/auth/session')
  ) {
    return NextResponse.next();
  }
  
  // Generate CSP nonce
  const nonce = generateCSPNonce();
  
  // Create response
  let response = NextResponse.next();
  
  try {
    // Debug logging for API routes
    if (pathname.startsWith('/api/')) {
      console.log(`Middleware: Processing ${request.method} ${pathname}`);
    }
    
    // Apply rate limiting
    let rateLimitConfig = { windowMs: 15 * 60 * 1000, maxRequests: 100 }; // Default API limits
    
    if (pathname.startsWith('/api/auth/login')) {
      rateLimitConfig = { windowMs: 15 * 60 * 1000, maxRequests: 10 }; // 10 login attempts per 15 minutes
    } else if (pathname.startsWith('/api/auth/register')) {
      rateLimitConfig = { windowMs: 60 * 60 * 1000, maxRequests: 3 }; // 3 registrations per hour
    } else if (pathname.startsWith('/api/auth/')) {
      rateLimitConfig = { windowMs: 15 * 60 * 1000, maxRequests: 20 }; // Other auth endpoints
    } else if (pathname.startsWith('/api/upload/')) {
      rateLimitConfig = { windowMs: 60 * 60 * 1000, maxRequests: 10 };
    }
    
    const rateLimit = applyRateLimit(request, rateLimitConfig);
    
    if (!rateLimit.allowed) {
      const resetTimeSeconds = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
      
      response = NextResponse.json(
        { 
          error: 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: resetTimeSeconds 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': resetTimeSeconds.toString(),
            'X-RateLimit-Limit': rateLimitConfig.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
          }
        }
      );
    } else {
      // Add rate limit headers to successful responses
      response.headers.set('X-RateLimit-Limit', rateLimitConfig.maxRequests.toString());
      response.headers.set('X-RateLimit-Reset', rateLimit.resetTime.toString());
    }
    
    // Authentication check for protected routes
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
      // Check for various session tokens
      const nextAuthToken = request.cookies.get('next-auth.session-token')?.value || 
                           request.cookies.get('__Secure-next-auth.session-token')?.value;
      const oauthToken = request.cookies.get('session-token')?.value;
      const demoUserCookie = request.cookies.get('demo-user')?.value;
      
      console.log(`[Middleware] Auth check for ${pathname}:`, {
        hasNextAuthToken: !!nextAuthToken,
        hasOAuthToken: !!oauthToken,
        allCookies: request.cookies.getAll().map(c => c.name),
      });
      
      // If no tokens found, redirect to login
      if (!nextAuthToken && !oauthToken && !demoUserCookie) {
        console.log(`[Middleware] No valid session found, redirecting to login`);
        const url = request.nextUrl.clone();
        url.pathname = '/auth/login';
        url.searchParams.set('from', pathname); // Use 'from' parameter for consistency
        return NextResponse.redirect(url);
      }
      
      // Validate OAuth session token if present
      if (oauthToken && !nextAuthToken) {
        try {
          const sessionData = JSON.parse(Buffer.from(oauthToken, 'base64').toString());
          const isExpired = new Date(sessionData.expires) < new Date();
          
          console.log(`[Middleware] OAuth session validation:`, {
            userEmail: sessionData.user?.email,
            expires: sessionData.expires,
            isExpired,
            now: new Date().toISOString(),
          });
          
          if (isExpired) {
            console.log(`[Middleware] OAuth session expired, clearing and redirecting`);
            const url = request.nextUrl.clone();
            url.pathname = '/auth/login';
            url.searchParams.set('from', pathname);
            url.searchParams.set('reason', 'session_expired');
            response = NextResponse.redirect(url);
            
            // Clear expired session cookie
            response.cookies.set('session-token', '', {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 0,
              path: '/',
            });
            
            return response;
          } else {
            console.log(`[Middleware] Valid OAuth session found for ${sessionData.user?.email}`);
          }
        } catch (error) {
          console.error('[Middleware] Failed to validate OAuth session:', error);
          // Clear invalid session token
          const url = request.nextUrl.clone();
          url.pathname = '/auth/login';
          url.searchParams.set('from', pathname);
          url.searchParams.set('reason', 'invalid_session');
          response = NextResponse.redirect(url);
          
          response.cookies.set('session-token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 0,
            path: '/',
          });
          
          return response;
        }
      }
      
      console.log(`[Middleware] Authentication passed for ${pathname}`);
    }
    
    // Apply security headers
    response = applySecurityHeaders(response, nonce);
    response.headers.set('X-CSP-Nonce', nonce);
    
    return response;
    
  } catch (error) {
    console.error('Middleware error:', error);
    
    response = NextResponse.json(
      { 
        error: 'Internal server error',
        code: 'MIDDLEWARE_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
    
    return applySecurityHeaders(response, nonce);
  }
}

/**
 * Cleanup old rate limit entries periodically
 */
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }, 60000);
}

/**
 * Configure which paths the middleware should run on
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 