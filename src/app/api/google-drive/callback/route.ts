import { NextRequest, NextResponse } from 'next/server';
import { getGoogleDriveAuthService } from '@/services/googledrive/auth.service';
import { withApiMiddleware } from '@/lib/api/middleware';
import { z } from 'zod';

// Define query parameter schema for validation
const CallbackQuerySchema = z.object({
  code: z.string().optional(),
  state: z.string().optional(),
  error: z.string().optional(),
});

export const GET = withApiMiddleware({
  requireAuth: false, // OAuth callback doesn't require authentication
  rateLimiters: ['auth'], // Use auth rate limiter for OAuth callbacks
})(async (context, req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;

  // Validate query parameters
  const queryValidation = CallbackQuerySchema.safeParse({
    code: searchParams.get('code'),
    state: searchParams.get('state'),
    error: searchParams.get('error'),
  });

  if (!queryValidation.success) {
    return NextResponse.redirect(new URL('/import?error=google_drive_invalid_params', req.url));
  }

  const { code, state, error } = queryValidation.data;

  // Handle errors
  if (error) {
    return NextResponse.redirect(new URL(`/import?error=google_drive_auth_${error}`, req.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/import?error=google_drive_auth_failed', req.url));
  }

  try {
    const authService = getGoogleDriveAuthService();

    // Validate CSRF token and get user ID
    const userId = await authService.validateCSRFToken(state);
    if (!userId) {
      // console.warn('Invalid or expired CSRF token in Google Drive callback');
      return NextResponse.redirect(new URL('/import?error=google_drive_invalid_state', req.url));
    }

    // Exchange code for tokens
    const tokens = await authService.getTokensFromCode(code);

    // Store tokens for the user
    await authService.storeTokens(userId, tokens);

    // Redirect back to import page with success
    return NextResponse.redirect(new URL('/import?google_drive_connected=true', req.url));
  } catch (error) {
    // Sanitize error logging to avoid exposing sensitive information
    const sanitizedError =
      error instanceof Error
        ? {
            message: error.message,
            name: error.name,
          }
        : 'Unknown error';

    // console.error('Google Drive callback error:', sanitizedError);

    return NextResponse.redirect(new URL('/import?error=google_drive_connection_failed', req.url));
  }
});
