import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Login request schema
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
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

    const { email, password } = validationResult.data;
    console.log('Login attempt for email:', email);

    // Demo credentials check
    if (email === 'admin@riscura.com' && password === 'admin123') {
      console.log('Demo login successful');
      
      const demoUser = {
        id: 'demo-admin-id',
        email: email,
        firstName: 'Demo',
        lastName: 'Admin',
        role: 'ADMIN',
        permissions: ['*'],
        organizationId: 'demo-org-id',
        isActive: true,
        emailVerified: new Date(),
      };

      const tokens = {
        accessToken: 'demo-access-token-' + Date.now(),
        refreshToken: 'demo-refresh-token-' + Date.now(),
        expiresIn: 3600,
        refreshExpiresIn: 86400,
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

      return response;
    }

    // Invalid credentials
    console.log('Invalid credentials for email:', email);
    return NextResponse.json(
      { error: 'Invalid credentials. Please use demo credentials: admin@riscura.com / admin123' },
      { status: 401 }
    );

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login. Please try again or use demo credentials.' },
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