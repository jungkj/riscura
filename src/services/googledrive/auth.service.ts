import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { redis } from '@/lib/redis';

export interface GoogleDriveTokens {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

export class GoogleDriveAuthService {
  private oauth2Client: OAuth2Client;
  private tokenCacheKeyPrefix = 'googledrive:tokens:';
  
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/auth/google-drive/callback`
    );
  }

  /**
   * Generate the authorization URL for OAuth consent
   */
  getAuthUrl(userId: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/drive.file'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: userId, // Pass userId in state for callback
      prompt: 'consent' // Force consent to get refresh token
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokensFromCode(code: string): Promise<GoogleDriveTokens> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      return tokens as GoogleDriveTokens;
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw new Error('Failed to authenticate with Google Drive');
    }
  }

  /**
   * Store tokens in Redis cache
   */
  async storeTokens(userId: string, tokens: GoogleDriveTokens): Promise<void> {
    if (!redis) return;
    
    try {
      const cacheKey = `${this.tokenCacheKeyPrefix}${userId}`;
      const ttl = Math.floor((tokens.expiry_date - Date.now()) / 1000);
      
      if (ttl > 0) {
        await redis.setex(cacheKey, ttl, JSON.stringify(tokens));
      }
      
      // Store refresh token separately with no expiry
      if (tokens.refresh_token) {
        await redis.set(`${cacheKey}:refresh`, tokens.refresh_token);
      }
    } catch (error) {
      console.error('Error storing tokens:', error);
    }
  }

  /**
   * Get tokens from cache or refresh if needed
   */
  async getValidTokens(userId: string): Promise<GoogleDriveTokens | null> {
    if (!redis) return null;
    
    try {
      const cacheKey = `${this.tokenCacheKeyPrefix}${userId}`;
      
      // Try to get cached tokens
      const cachedTokens = await redis.get(cacheKey);
      if (cachedTokens) {
        return JSON.parse(cachedTokens);
      }
      
      // Try to refresh using refresh token
      const refreshToken = await redis.get(`${cacheKey}:refresh`);
      if (refreshToken) {
        return await this.refreshAccessToken(userId, refreshToken);
      }
      
      return null;
    } catch (error) {
      console.error('Error getting tokens:', error);
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(userId: string, refreshToken: string): Promise<GoogleDriveTokens | null> {
    try {
      this.oauth2Client.setCredentials({ refresh_token: refreshToken });
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      const tokens: GoogleDriveTokens = {
        access_token: credentials.access_token!,
        refresh_token: refreshToken,
        scope: credentials.scope!,
        token_type: credentials.token_type!,
        expiry_date: credentials.expiry_date!
      };
      
      await this.storeTokens(userId, tokens);
      return tokens;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }

  /**
   * Get authenticated Google Drive client
   */
  async getDriveClient(userId: string) {
    const tokens = await this.getValidTokens(userId);
    if (!tokens) {
      throw new Error('No valid Google Drive authentication found');
    }
    
    this.oauth2Client.setCredentials(tokens);
    return google.drive({ version: 'v3', auth: this.oauth2Client });
  }

  /**
   * Revoke access
   */
  async revokeAccess(userId: string): Promise<void> {
    try {
      const tokens = await this.getValidTokens(userId);
      if (tokens) {
        await this.oauth2Client.revokeCredentials();
      }
      
      // Clear cached tokens
      if (redis) {
        const cacheKey = `${this.tokenCacheKeyPrefix}${userId}`;
        await redis.del(cacheKey);
        await redis.del(`${cacheKey}:refresh`);
      }
    } catch (error) {
      console.error('Error revoking access:', error);
    }
  }
}

// Singleton instance
let authServiceInstance: GoogleDriveAuthService | null = null;

export function getGoogleDriveAuthService(): GoogleDriveAuthService {
  if (!authServiceInstance) {
    authServiceInstance = new GoogleDriveAuthService();
  }
  return authServiceInstance;
}