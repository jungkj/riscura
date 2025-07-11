import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session-token')?.value;
    
    console.log('[OAuth Session] Checking session:', {
      hasToken: !!sessionToken,
      cookies: req.cookies.getAll().map(c => ({ name: c.name, hasValue: !!c.value })),
    });
    
    if (!sessionToken) {
      return NextResponse.json({ user: null });
    }
    
    // Decode the session
    try {
      const sessionData = JSON.parse(Buffer.from(sessionToken, 'base64').toString());
      
      // Check if expired
      if (new Date(sessionData.expires) < new Date()) {
        console.log('[OAuth Session] Session expired:', {
          expires: sessionData.expires,
          now: new Date().toISOString(),
        });
        return NextResponse.json({ user: null });
      }
      
      console.log('[OAuth Session] Valid session found:', {
        userEmail: sessionData.user?.email,
        expires: sessionData.expires,
      });
      
      return NextResponse.json({ user: sessionData.user });
    } catch (error) {
      console.error('[OAuth Session] Failed to decode session:', error);
      return NextResponse.json({ user: null });
    }
  } catch (error) {
    console.error('[OAuth Session] Unexpected error:', error);
    return NextResponse.json({ user: null });
  }
}