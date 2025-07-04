import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth-options';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Get session from NextAuth
    const session = await getServerSession(authOptions) as any;

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
        organizationId: session.user.organizationId,
      },
    });
  } catch (error) {
    console.error('Authentication test error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
} 