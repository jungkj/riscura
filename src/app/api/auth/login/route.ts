import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
// Database import will be handled conditionally
// Session creation will be handled conditionally

// Login request schema
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

// Simple rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function simpleRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: limit - record.count };
}

// Generate simple CSRF token
function generateCSRFToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('Login API route called');

    // Get client IP for rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    // Simple rate limiting
    const rateLimitResult = simpleRateLimit(
      `login:${clientIP}`,
      10, // 10 login attempts
      15 * 60 * 1000 // 15 minutes
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many login attempts. Please try again later.',
        },
        { status: 429 }
      );
    }

    // Parse request body with error handling
    let body;
    try {
      body = await request.json();
      console.log('Request body parsed successfully');
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    const validationResult = loginSchema.safeParse(body);

    if (!validationResult.success) {
      console.log('Validation failed:', validationResult.error);
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { email, password, rememberMe } = validationResult.data;
    console.log('Login attempt received');

    // Handle demo credentials first to avoid database calls
    if (email === 'admin@riscura.com' && password === 'admin123') {
      console.log('Demo login detected - bypassing database');
      
      const demoUser = {
        id: 'demo-admin-id',
        email: email,
        firstName: 'Demo',
        lastName: 'Admin',
        role: 'ADMIN' as const,
        permissions: ['*'],
        organizationId: 'demo-org-id',
        isActive: true,
        emailVerified: new Date(),
      };

      // Set token expiration based on rememberMe flag
      const accessTokenExpiry = rememberMe ? 7 * 24 * 3600 : 3600; // 7 days vs 1 hour
      const refreshTokenExpiry = rememberMe ? 30 * 24 * 3600 : 86400; // 30 days vs 1 day
      
      const tokens = {
        accessToken: `demo-access-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        refreshToken: `demo-refresh-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        expiresIn: accessTokenExpiry,
        refreshExpiresIn: refreshTokenExpiry,
      };

      const csrfToken = generateCSRFToken();

      const response = NextResponse.json({
        message: 'Login successful',
        user: {
          id: demoUser.id,
          email: demoUser.email,
          firstName: demoUser.firstName,
          lastName: demoUser.lastName,
          role: demoUser.role,
          permissions: demoUser.permissions,
          organizationId: demoUser.organizationId,
          organization: {
            id: 'demo-org-id',
            name: 'Demo Organization',
            plan: 'enterprise',
          },
        },
        tokens: {
          accessToken: tokens.accessToken,
          expiresIn: tokens.expiresIn,
        },
        demoMode: true,
      });

      // Set cookies
      response.cookies.set('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: tokens.refreshExpiresIn,
        path: '/',
      });

      response.cookies.set('csrf-token', csrfToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: tokens.expiresIn,
        path: '/',
      });

      // Demo user cookie for middleware
      response.cookies.set('demo-user', JSON.stringify({
        id: demoUser.id,
        email: demoUser.email,
        role: demoUser.role,
        permissions: demoUser.permissions,
      }), {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: tokens.expiresIn,
        path: '/',
      });

      // Set remember me preference cookie
      if (rememberMe) {
        response.cookies.set('remember-me', 'true', {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: tokens.refreshExpiresIn,
          path: '/',
        });
      }

      return response;
    }

    // Try database authentication if available
    try {
      // Dynamically import db to avoid initialization errors when DATABASE_URL is not set
      const { db } = await import('@/lib/db').catch(() => ({ db: null }));
      
      if (db) {
        const isConnected = await db.healthCheck().catch(() => false);
        
        if (isConnected) {
          // Try database authentication first
          const user = await db.client.user.findUnique({
            where: { email },
            include: {
              organization: {
                select: {
                  id: true,
                  name: true,
                  plan: true,
                  isActive: true,
                },
              },
            },
          });

          if (user && user.isActive && user.passwordHash) {
            const isValidPassword = await bcrypt.compare(password, user.passwordHash);
            
            if (isValidPassword) {
              console.log('Database login successful');
              
              // Create session (simplified for demo)
              const tokens = {
                accessToken: `access-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                refreshToken: `refresh-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                expiresIn: 3600,
                refreshExpiresIn: 86400,
              };

              const csrfToken = generateCSRFToken();

              const response = NextResponse.json({
                message: 'Login successful',
                user: {
                  id: user.id,
                  email: user.email,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  role: user.role,
                  permissions: user.permissions,
                  organizationId: user.organizationId,
                  organization: {
                    id: user.organization.id,
                    name: user.organization.name,
                    plan: user.organization.plan,
                  },
                },
                tokens: {
                  accessToken: tokens.accessToken,
                  expiresIn: 3600,
                },
                demoMode: false,
              });

              // Set token expiration based on rememberMe flag
              const accessTokenExpiry = rememberMe ? 7 * 24 * 3600 : 3600; // 7 days vs 1 hour
              const refreshTokenExpiry = rememberMe ? 30 * 24 * 3600 : 86400; // 30 days vs 1 day

              // Set cookies
              response.cookies.set('refreshToken', tokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: refreshTokenExpiry,
                path: '/',
              });

              response.cookies.set('csrf-token', csrfToken, {
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: accessTokenExpiry,
                path: '/',
              });

              // Set remember me preference cookie
              if (rememberMe) {
                response.cookies.set('remember-me', 'true', {
                  httpOnly: false,
                  secure: process.env.NODE_ENV === 'production',
                  sameSite: 'strict',
                  maxAge: refreshTokenExpiry,
                  path: '/',
                });
              }

              return response;
            }
          }
        }
      } else {
        console.log('Database not available, using demo mode only');
      }
    } catch (dbError) {
      console.log('Database authentication not available:', dbError instanceof Error ? dbError.message : 'Unknown error');
    }

    // Invalid credentials
    console.log('Invalid credentials');
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );

  } catch (error) {
    console.error('Login API error:', error);
    
    // Provide more specific error information in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Login error: ${error instanceof Error ? error.message : 'Unknown error'}`
      : 'An error occurred during login. Please try again.';
    
    return NextResponse.json(
      { 
        error: errorMessage,
        debug: process.env.NODE_ENV === 'development' ? {
          stack: error instanceof Error ? error.stack : undefined,
          type: error instanceof Error ? error.constructor.name : 'Unknown'
        } : undefined
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Login API is working',
    timestamp: new Date().toISOString()
  });
} 