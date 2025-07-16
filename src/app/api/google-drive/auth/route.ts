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
    const authUrl = authService.getAuthUrl(user.id);
    
    return {
      authUrl,
      message: 'Redirect user to this URL for Google Drive authorization'
    };
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return {
      error: 'Failed to generate authorization URL'
    };
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
      message: 'Google Drive access revoked successfully'
    };
  } catch (error) {
    console.error('Error revoking access:', error);
    return {
      error: 'Failed to revoke Google Drive access'
    };
  }
});