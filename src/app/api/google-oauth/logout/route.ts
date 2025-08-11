import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    console.log('[OAuth Logout] Processing logout request');
    
    // Clear the session cookie
    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
    
    // Clear session cookie with proper options
    const cookieOptions: any = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    };
    
    // In production, set domain to handle subdomains
    if (process.env.NODE_ENV === 'production') {
      cookieOptions.domain = '.riscura.app';
    }
    
    response.cookies.set('session-token', '', cookieOptions);
    
    // Also clear any NextAuth cookies that might exist
    response.cookies.delete('next-auth.session-token');
    response.cookies.delete('__Secure-next-auth.session-token');
    response.cookies.delete('next-auth.csrf-token');
    response.cookies.delete('__Host-next-auth.csrf-token');
    
    console.log('[OAuth Logout] Session cookies cleared');
    
    return response;
  } catch (error) {
    console.error('[OAuth Logout] Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Handle GET requests for compatibility
export async function GET() {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || 'https://riscura.app';
  const response = NextResponse.redirect(`${baseUrl}/auth/login?message=Logged out successfully`);
  
  // Clear session cookie with proper options
  const cookieOptions: any = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  };
  
  // In production, set domain to handle subdomains
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.domain = '.riscura.app';
  }
  
  response.cookies.set('session-token', '', cookieOptions);
  
  return response;
}