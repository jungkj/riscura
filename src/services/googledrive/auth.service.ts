import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
// import { redis } from '@/lib/redis';
import crypto from 'crypto';

export interface GoogleDriveTokens {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

interface CSRFState {
  userId: string;
  token: string;
  createdAt: number;
}

export class GoogleDriveAuthService {
  private oauth2Client: OAuth2Client;
  private tokenCacheKeyPrefix = 'googledrive:tokens:';

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/google-drive/callback`
    );
  }

  /**
   * Generate the authorization URL for OAuth consent with CSRF protection
   */
  async getAuthUrl(_userId: string): Promise<string> {
    const scopes = [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/drive.file',
    ];

    // Generate CSRF token
    const csrfToken = crypto.randomBytes(32).toString('hex');

    // Store CSRF state in Redis with 10 minute expiration
    const stateData: CSRFState = {
      userId,
      token: csrfToken,
      createdAt: Date.now(),
    };

    const stateKey = `googledrive:csrf:${csrfToken}`;
    await redis.setex(stateKey, 600, JSON.stringify(stateData)); // 10 minute TTL

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: csrfToken, // Use CSRF token as state
      prompt: 'consent', // Force consent to get refresh token
    });
  }

  /**
   * Validate CSRF token and return associated user ID
   */
  async validateCSRFToken(token: string): Promise<string | null> {
    if (!token || typeof token !== 'string') {
      return null;
    }

    const stateKey = `googledrive:csrf:${token}`;
    const stateData = await redis.get(stateKey);

    if (!stateData) {
      return null;
    }

    try {
      const state: CSRFState = JSON.parse(stateData);

      // Validate token age (10 minutes max)
      if (Date.now() - state.createdAt > 600000) {
        await redis.del(stateKey);
        return null;
      }

      // Delete token after validation (one-time use)
      await redis.del(stateKey);

      return state.userId;
    } catch (error) {
      // console.error('Error parsing CSRF state:', error);
      return null;
    }
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokensFromCode(code: string): Promise<GoogleDriveTokens> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      return tokens as GoogleDriveTokens;
    } catch (error) {
      // console.error('Error exchanging code for tokens:', error);
      throw new Error('Failed to authenticate with Google Drive');
    }
  }

  /**
   * Store tokens in Redis cache
   */
  async storeTokens(_userId: string, tokens: GoogleDriveTokens): Promise<void> {
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
      // console.error('Error storing tokens:', error);
    }
  }

  /**
   * Get tokens from cache or refresh if needed
   */
  async getValidTokens(_userId: string): Promise<GoogleDriveTokens | null> {
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
      // console.error('Error getting tokens:', error);
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(_userId: string,
    refreshToken: string
  ): Promise<GoogleDriveTokens | null> {
    try {
      this.oauth2Client.setCredentials({ refresh_token: refreshToken });
      const { credentials } = await this.oauth2Client.refreshAccessToken();

      const tokens: GoogleDriveTokens = {
        access_token: credentials.access_token!,
        refresh_token: refreshToken,
        scope: credentials.scope!,
        token_type: credentials.token_type!,
        expiry_date: credentials.expiry_date!,
      };

      await this.storeTokens(userId, tokens);
      return tokens;
    } catch (error) {
      // console.error('Error refreshing token:', error);
      return null;
    }
  }

  /**
   * Get authenticated Google Drive client
   */
  async getDriveClient(_userId: string) {
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
  async revokeAccess(_userId: string): Promise<void> {
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
      // console.error('Error revoking access:', error);
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
