import { NextRequest, NextResponse } from 'next/server';
import { getGoogleDriveAuthService } from '@/services/googledrive/auth.service';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // userId
  const error = searchParams.get('error');
  
  // Handle errors
  if (error) {
    return NextResponse.redirect(
      new URL(`/import?error=google_drive_auth_${error}`, request.url)
    );
  }
  
  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/import?error=google_drive_auth_failed', request.url)
    );
  }
  
  try {
    const authService = getGoogleDriveAuthService();
    
    // Exchange code for tokens
    const tokens = await authService.getTokensFromCode(code);
    
    // Store tokens for the user
    await authService.storeTokens(state, tokens);
    
    // Redirect back to import page with success
    return NextResponse.redirect(
      new URL('/import?google_drive_connected=true', request.url)
    );
  } catch (error) {
    console.error('Google Drive callback error:', error);
    return NextResponse.redirect(
      new URL('/import?error=google_drive_connection_failed', request.url)
    );
  }
}