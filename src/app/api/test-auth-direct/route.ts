import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// Direct test to see what happens when we manually set auth
export async function GET() {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get('session-token')?.value;

  if (!sessionToken) {
    return NextResponse.json({ error: 'No session token found' });
  }

  try {
    const sessionData = JSON.parse(Buffer.from(sessionToken, 'base64').toString());

    // Create a test response that sets a properly formatted session
    const response = NextResponse.json({
      message: 'Redirecting to dashboard with fixed session',
      sessionData,
      fixes: ['Converting role to lowercase', 'Ensuring proper format'],
    });

    // Set a new session cookie with the role in lowercase
    const fixedSession = {
      ...sessionData,
      user: {
        ...sessionData.user,
        role: sessionData.user.role.toLowerCase(), // Fix: convert to lowercase
      },
    };

    const newToken = Buffer.from(JSON.stringify(fixedSession)).toString('base64');

    response.cookies.set('session-token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 24 * 60 * 60,
      path: '/',
    });

    // Add redirect header
    response.headers.set('Location', '/dashboard');
    response.headers.set('Refresh', '2; url=/dashboard');

    return response;
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to process session',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
