import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth-options';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;
    
    return NextResponse.json({
      authenticated: !!session,
      user: session?.user ? {
        email: session.user.email,
        name: session.user.name,
      } : null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Session-Check] Error:', error);
    // Return false authentication instead of 500 error
    return NextResponse.json(
      { 
        authenticated: false, 
        error: 'Session check error',
        timestamp: new Date().toISOString(),
      },
      { status: 200 } // Return 200 instead of 500 to prevent errors
    );
  }
} 