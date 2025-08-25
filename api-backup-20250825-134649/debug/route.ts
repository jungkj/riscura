import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const debug = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasJwtSecret: !!process.env.JWT_ACCESS_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      nextAuthUrl: process.env.NEXTAUTH_URL,
      cookies: req.cookies ? Object.fromEntries(
        Array.from(req.cookies).map(([name, cookie]) => [
          name, 
          cookie.value && cookie.value.length > 50 ? `${cookie.value.substring(0, 50)}...` : cookie.value
        ])
      ) : {},
      headers: {
        host: req.headers.get('host'),
        userAgent: req.headers.get('user-agent'),
        origin: req.headers.get('origin'),
        referer: req.headers.get('referer')
      }
    };

    return NextResponse.json({ 
      success: true, 
      debug,
      message: 'Debug info retrieved successfully'
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}