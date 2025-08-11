import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

export async function GET(req: NextRequest) {
  try {
    // First check for OAuth session token
    const oauthToken = req.cookies.get('session-token')?.value;
    if (oauthToken) {
      try {
        const sessionData = JSON.parse(Buffer.from(oauthToken, 'base64').toString());
        const isExpired = new Date(sessionData.expires) < new Date();
        
        if (!isExpired && sessionData.user) {
          // Return session in NextAuth-like format for compatibility
          return NextResponse.json({
            user: sessionData.user,
            expires: sessionData.expires
          });
        }
      } catch (error) {
        console.error('[Session] Failed to parse OAuth token:', error);
      }
    }
    
    // Then check for NextAuth session
    const session = await getServerSession(authOptions);
    if (session) {
      return NextResponse.json(session);
    }
    
    // No valid session found - return null (not an error)
    return NextResponse.json(null);
  } catch (error) {
    console.error('[Session] Error checking session:', error);
    // Return null instead of throwing to prevent 500 errors
    return NextResponse.json(null, { status: 200 });
  }
}