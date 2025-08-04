import { ClientSecretCredential, DefaultAzureCredential } from '@azure/identity';
import { Client, AuthenticationProvider } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch'; // Required for microsoft-graph-client
// import { redis } from '@/lib/redis';
// import { SecretClient } from '@azure/keyvault-secrets';
import { CertificateClient } from '@azure/keyvault-certificates';

export class SharePointAuthService {
  private credential: ClientSecretCredential | DefaultAzureCredential;
  private keyVaultUrl: string;
  private tokenCacheKey = 'sharepoint:access_token';
  private tokenExpiryKey = 'sharepoint:token_expiry';

  constructor() {
    // Validate required environment variables
    if (!process.env.AZURE_KEY_VAULT_NAME) {
      throw new Error('AZURE_KEY_VAULT_NAME environment variable is required');
    }

    this.keyVaultUrl = `https://${process.env.AZURE_KEY_VAULT_NAME}.vault.azure.net`;

    // Initialize credential based on environment
    if (process.env.AZURE_AD_CLIENT_SECRET) {
      // Development: Use client secret
      if (!process.env.AZURE_AD_TENANT_ID || !process.env.AZURE_AD_CLIENT_ID) {
        throw new Error(
          'AZURE_AD_TENANT_ID and AZURE_AD_CLIENT_ID are required when using client secret authentication'
        );
      }

      this.credential = new ClientSecretCredential(
        process.env.AZURE_AD_TENANT_ID,
        process.env.AZURE_AD_CLIENT_ID,
        process.env.AZURE_AD_CLIENT_SECRET
      );
    } else {
      // Production: Use certificate from Key Vault
      this.credential = new DefaultAzureCredential();
    }
  }

  /**
   * Get authenticated Microsoft Graph client
   */
  async getGraphClient(): Promise<Client> {
    // Create custom auth provider that uses Azure credentials
    const authProvider: AuthenticationProvider = {
      getAccessToken: async () => {
        const _token = await this.getAccessToken();
        return token;
      },
    };

    return Client.initWithMiddleware({
      authProvider: authProvider,
      defaultVersion: 'v1.0',
    });
  }

  /**
   * Get cached access token or acquire new one
   */
  async getAccessToken(): Promise<string> {
    try {
      // Check cache first
      const cachedToken = await this.getCachedToken();
      if (cachedToken) {
        return cachedToken;
      }

      // Acquire new token
      const tokenResponse = await this.credential.getToken(
        process.env.GRAPH_API_SCOPE || 'https://graph.microsoft.com/.default'
      );

      if (!tokenResponse) {
        throw new Error('Failed to acquire access token');
      }

      // Cache the token
      const expiresInSeconds = Math.floor((tokenResponse.expiresOnTimestamp - Date.now()) / 1000);
      await this.cacheToken(tokenResponse.token, expiresInSeconds);

      return tokenResponse.token;
    } catch (error) {
      // console.error('Error acquiring access token:', error);
      throw new Error('Failed to authenticate with SharePoint');
    }
  }

  /**
   * Get certificate from Key Vault for production authentication
   */
  private async getCertificateFromKeyVault(): Promise<string> {
    try {
      // Validate required environment variable
      if (!process.env.AZURE_KEY_VAULT_CERTIFICATE_NAME) {
        throw new Error(
          'AZURE_KEY_VAULT_CERTIFICATE_NAME environment variable is required for certificate authentication'
        );
      }

      // Ensure credential is properly typed
      if (!(this.credential instanceof DefaultAzureCredential)) {
        throw new Error('DefaultAzureCredential is required for Key Vault access');
      }

      const certificateClient = new CertificateClient(this.keyVaultUrl, this.credential);

      const certificate = await certificateClient.getCertificate(
        process.env.AZURE_KEY_VAULT_CERTIFICATE_NAME
      );

      if (!certificate.cer) {
        throw new Error('Certificate not found in Key Vault');
      }

      // Convert certificate to base64 string
      return Buffer.from(certificate.cer).toString('base64');
    } catch (error) {
      // console.error('Error retrieving certificate from Key Vault:', error);
      throw error;
    }
  }

  /**
   * Get cached token from Redis
   */
  private async getCachedToken(): Promise<string | null> {
    if (!redis) {
      return null;
    }

    try {
      const _token = await redis.get(this.tokenCacheKey);
      if (!token) {
        return null;
      }

      // Check if token is expired
      const expiry = await redis.get(this.tokenExpiryKey);
      if (!expiry || Date.now() >= parseInt(expiry)) {
        // Token expired, clear cache
        await redis.del(this.tokenCacheKey);
        await redis.del(this.tokenExpiryKey);
        return null;
      }

      return token;
    } catch (error) {
      // console.error('Redis cache error:', error);
      return null;
    }
  }

  /**
   * Cache token in Redis with expiration
   */
  private async cacheToken(token: string, expiresInSeconds: number): Promise<void> {
    if (!redis) {
      return;
    }

    try {
      // Set a buffer of 5 minutes before actual expiry
      const bufferSeconds = 300;
      const effectiveExpiry = Math.max(expiresInSeconds - bufferSeconds, 60);

      await redis.setex(this.tokenCacheKey, effectiveExpiry, token);
      await redis.setex(
        this.tokenExpiryKey,
        effectiveExpiry,
        (Date.now() + effectiveExpiry * 1000).toString()
      );
    } catch (error) {
      // console.error('Redis cache error:', error);
    }
  }

  /**
   * Validate SharePoint site access
   */
  async validateSiteAccess(siteId: string): Promise<boolean> {
    try {
      const client = await this.getGraphClient();
      const site = await client.api(`/sites/${siteId}`).select('id,displayName,webUrl').get();

      return !!site;
    } catch (error) {
      // console.error('Site validation error:', error);
      return false;
    }
  }

  /**
   * Clear cached tokens
   */
  async clearCache(): Promise<void> {
    if (!redis) {
      return;
    }

    try {
      await redis.del(this.tokenCacheKey);
      await redis.del(this.tokenExpiryKey);
    } catch (error) {
      // console.error('Redis cache clear error:', error);
    }
  }
}

// Singleton instance
let authServiceInstance: SharePointAuthService | null = null;

export function getSharePointAuthService(): SharePointAuthService {
  if (!authServiceInstance) {
    authServiceInstance = new SharePointAuthService();
  }
  return authServiceInstance;
}
