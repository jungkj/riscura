import { withApiMiddleware } from '@/lib/api/middleware';
import { getGoogleDriveAuthService } from '@/services/googledrive/auth.service';

// GET - Generate authorization URL
export const GET = withApiMiddleware({
  requireAuth: true,
  rateLimiters: ['standard']
})(async (context) => {
  const { user } = context;
  
  try {
    const authService = getGoogleDriveAuthService();
    const authUrl = await authService.getAuthUrl(user.id);
    
    return {
      data: {
        authUrl,
        message: 'Redirect user to this URL for Google Drive authorization'
      }
    };
  } catch (error) {
    console.error('Error generating Google Drive auth URL:', {
      userId: user.id,
      operation: 'generateAuthUrl',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    throw new Error('Failed to generate authorization URL');
  }
});

// DELETE - Revoke access
export const DELETE = withApiMiddleware({
  requireAuth: true,
  rateLimiters: ['standard']
})(async (context) => {
  const { user } = context;
  
  try {
    const authService = getGoogleDriveAuthService();
    await authService.revokeAccess(user.id);
    
    return {
      data: {
        success: true,
        message: 'Google Drive access revoked successfully'
      }
    };
  } catch (error) {
    console.error('Error revoking Google Drive access:', {
      userId: user.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    throw new Error('Failed to revoke Google Drive access');
  }
});