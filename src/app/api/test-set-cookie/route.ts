import { NextResponse } from 'next/server';

export async function GET() {
  const testToken = Buffer.from(
    JSON.stringify({
      test: true,
      timestamp: new Date().toISOString(),
      expires: new Date(Date.now() + 60000).toISOString(), // 1 minute
    })
  ).toString('base64');

  const response = NextResponse.json({
    message: 'Test cookie set',
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60,
      path: '/',
    },
    environment: process.env.NODE_ENV,
    domain: process.env.COOKIE_DOMAIN || 'not set',
  });

  // Set the test cookie
  response.cookies.set('test-session-cookie', testToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60, // 1 minute
    path: '/',
  });

  return response;
}
