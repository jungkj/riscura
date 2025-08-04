import { NextResponse } from 'next/server';
import { googleConfig } from '@/config/env';

export async function GET() {
  try {
    // Check if Google OAuth is properly configured
    const configured = !!(googleConfig.clientId && googleConfig.clientSecret);

    return NextResponse.json({
      configured,
      // Only send client ID to frontend, never the secret
      clientId: configured ? googleConfig.clientId : null,
    });
  } catch (error) {
    // console.error('OAuth config check error:', error);
    return NextResponse.json({ error: 'Failed to check OAuth configuration' }, { status: 500 });
  }
}
