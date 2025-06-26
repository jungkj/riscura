import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { getAuthenticatedUser, type AuthenticatedRequest } from '@/lib/auth/middleware';

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const user = getAuthenticatedUser(req);
  
  return NextResponse.json({
    success: true,
    message: 'Authentication successful',
    user: {
      id: user?.id,
      email: user?.email,
      role: user?.role,
      organizationId: user?.organizationId,
    },
  });
}); 