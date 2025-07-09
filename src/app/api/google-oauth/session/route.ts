import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session-token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ user: null });
    }
    
    // Decode the session
    try {
      const sessionData = JSON.parse(Buffer.from(sessionToken, 'base64').toString());
      
      // Check if expired
      if (new Date(sessionData.expires) < new Date()) {
        return NextResponse.json({ user: null });
      }
      
      return NextResponse.json({ user: sessionData.user });
    } catch (error) {
      return NextResponse.json({ user: null });
    }
  } catch (error) {
    return NextResponse.json({ user: null });
  }
}