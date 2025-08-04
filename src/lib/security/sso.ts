import crypto from 'crypto';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { validateRequest } from '@/lib/auth/validate';
import type {
  SSOConfiguration,
  SSOProvider,
  SAMLConfig,
  OIDCConfig,
  OAuth2Config,
  LDAPConfig,
} from './types';

export class SSOService {
  private config: SSOConfiguration;

  constructor(config: SSOConfiguration) {
    this.config = config;
  }

  // SAML Integration
  async processSAMLResponse(
    providerId: string,
    samlResponse: string,
    relayState?: string
  ): Promise<SSOLoginResult> {
    const provider = this.getProvider(providerId);
    if (!provider || provider.type !== 'saml') {
      throw new Error('Invalid SAML provider');
    }

    const samlConfig = provider.configuration as SAMLConfig;

    try {
      // Parse and validate SAML response
      const assertion = await this.parseSAMLAssertion(samlResponse, samlConfig);

      // Validate signature if required
      if (samlConfig.wantAssertionsSigned || samlConfig.wantResponseSigned) {
        if (!(await this.validateSAMLSignature(samlResponse, samlConfig.certificate))) {
          throw new Error('Invalid SAML signature');
        }
      }

      // Extract user attributes
      const userAttributes = assertion.attributes;

      // Map attributes to user profile
      const userProfile = this.mapAttributes(userAttributes, provider);

      // Provision or update user
      const user = await this.provisionUser(userProfile, provider);

      return {
        success: true,
        user,
        provider: provider.name,
        sessionData: {
          samlSessionIndex: assertion.sessionIndex,
          nameId: assertion.nameId,
          nameIdFormat: assertion.nameIdFormat,
        },
      };
    } catch (error) {
      console.error('SAML authentication failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SAML authentication failed',
      };
    }
  }

  async generateSAMLRequest(providerId: string, returnUrl: string): Promise<SAMLRequest> {
    const provider = this.getProvider(providerId);
    if (!provider || provider.type !== 'saml') {
      throw new Error('Invalid SAML provider');
    }

    const samlConfig = provider.configuration as SAMLConfig;
    const requestId = `_${uuidv4()}`;
    const timestamp = new Date().toISOString();

    const authnRequest = this.buildSAMLAuthnRequest({
      id: requestId,
      timestamp,
      entityId: samlConfig.entityId,
      acsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/sso/saml/callback`,
      destination: samlConfig.ssoUrl,
      nameIdFormat: samlConfig.nameIdFormat,
    });

    // Store request for validation
    await this.storeSAMLRequest(requestId, providerId, returnUrl);

    return {
      requestId,
      authnRequest,
      redirectUrl: samlConfig.ssoUrl,
      relayState: returnUrl,
    };
  }

  // OIDC Integration
  async processOIDCCallback(
    providerId: string,
    authorizationCode: string,
    state: string
  ): Promise<SSOLoginResult> {
    const provider = this.getProvider(providerId);
    if (!provider || provider.type !== 'oidc') {
      throw new Error('Invalid OIDC provider');
    }

    const oidcConfig = provider.configuration as OIDCConfig;

    try {
      // Validate state
      const storedState = await this.getStoredState(state);
      if (!storedState) {
        throw new Error('Invalid state parameter');
      }

      // Exchange authorization code for tokens
      const tokenResponse = await this.exchangeOIDCCode(authorizationCode, oidcConfig);

      // Validate ID token
      const userInfo = await this.validateOIDCToken(tokenResponse.id_token, oidcConfig);

      // Get additional user info if needed
      if (tokenResponse.access_token && oidcConfig.scopes.includes('profile')) {
        const additionalInfo = await this.getOIDCUserInfo(tokenResponse.access_token, oidcConfig);
        Object.assign(userInfo, additionalInfo);
      }

      // Map attributes to user profile
      const userProfile = this.mapAttributes(userInfo, provider);

      // Provision or update user
      const user = await this.provisionUser(userProfile, provider);

      return {
        success: true,
        user,
        provider: provider.name,
        sessionData: {
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token,
          expiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000),
        },
      };
    } catch (error) {
      console.error('OIDC authentication failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'OIDC authentication failed',
      };
    }
  }

  async generateOIDCAuthUrl(providerId: string, returnUrl: string): Promise<string> {
    const provider = this.getProvider(providerId);
    if (!provider || provider.type !== 'oidc') {
      throw new Error('Invalid OIDC provider');
    }

    const oidcConfig = provider.configuration as OIDCConfig;
    const state = uuidv4();
    const nonce = uuidv4();

    // Store state for validation
    await this.storeState(state, providerId, returnUrl, nonce);

    const params = new URLSearchParams({
      response_type: oidcConfig.responseType,
      client_id: oidcConfig.clientId,
      redirect_uri: oidcConfig.redirectUri,
      scope: oidcConfig.scopes.join(' '),
      state,
      nonce,
    });

    return `${oidcConfig.issuer}/auth?${params.toString()}`;
  }

  // OAuth2 Integration
  async processOAuth2Callback(
    providerId: string,
    authorizationCode: string,
    state: string
  ): Promise<SSOLoginResult> {
    const provider = this.getProvider(providerId);
    if (!provider || provider.type !== 'oauth2') {
      throw new Error('Invalid OAuth2 provider');
    }

    const oauth2Config = provider.configuration as OAuth2Config;

    try {
      // Validate state
      const storedState = await this.getStoredState(state);
      if (!storedState) {
        throw new Error('Invalid state parameter');
      }

      // Exchange authorization code for access token
      const tokenResponse = await this.exchangeOAuth2Code(authorizationCode, oauth2Config);

      // Get user info
      const userInfo = await this.getOAuth2UserInfo(tokenResponse.access_token, oauth2Config);

      // Map attributes to user profile
      const userProfile = this.mapAttributes(userInfo, provider);

      // Provision or update user
      const user = await this.provisionUser(userProfile, provider);

      return {
        success: true,
        user,
        provider: provider.name,
        sessionData: {
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token,
        },
      };
    } catch (error) {
      console.error('OAuth2 authentication failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'OAuth2 authentication failed',
      };
    }
  }

  async generateOAuth2AuthUrl(providerId: string, returnUrl: string): Promise<string> {
    const provider = this.getProvider(providerId);
    if (!provider || provider.type !== 'oauth2') {
      throw new Error('Invalid OAuth2 provider');
    }

    const oauth2Config = provider.configuration as OAuth2Config;
    const state = uuidv4();

    // Store state for validation
    await this.storeState(state, providerId, returnUrl);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: oauth2Config.clientId,
      redirect_uri: oauth2Config.redirectUri,
      scope: oauth2Config.scopes.join(' '),
      state,
    });

    return `${oauth2Config.authorizationUrl}?${params.toString()}`;
  }

  // LDAP Integration
  async authenticateLDAP(
    providerId: string,
    username: string,
    password: string
  ): Promise<SSOLoginResult> {
    const provider = this.getProvider(providerId);
    if (!provider || provider.type !== 'ldap') {
      throw new Error('Invalid LDAP provider');
    }

    const ldapConfig = provider.configuration as LDAPConfig;

    try {
      // Create LDAP client
      const ldapClient = await this.createLDAPClient(ldapConfig);

      // Search for user
      const userDN = await this.findLDAPUser(ldapClient, username, ldapConfig);
      if (!userDN) {
        throw new Error('User not found in LDAP');
      }

      // Authenticate user
      await this.bindLDAPUser(ldapClient, userDN, password);

      // Get user attributes
      const userAttributes = await this.getLDAPUserAttributes(ldapClient, userDN, ldapConfig);

      // Close LDAP connection
      await ldapClient.unbind();

      // Map attributes to user profile
      const userProfile = this.mapAttributes(userAttributes, provider);

      // Provision or update user
      const user = await this.provisionUser(userProfile, provider);

      return {
        success: true,
        user,
        provider: provider.name,
        sessionData: {
          ldapDN: userDN,
        },
      };
    } catch (error) {
      console.error('LDAP authentication failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'LDAP authentication failed',
      };
    }
  }

  // User Provisioning
  private async provisionUser(userProfile: UserProfile, provider: SSOProvider): Promise<any> {
    if (!this.config.autoProvisioning) {
      // Check if user exists
      const existingUser = await db.client.user.findUnique({
        where: { email: userProfile.email },
      });

      if (!existingUser) {
        throw new Error('User not found and auto-provisioning is disabled');
      }

      return existingUser;
    }

    // Auto-provision or update user
    const userData = {
      email: userProfile.email,
      firstName: userProfile.firstName,
      lastName: userProfile.lastName,
      isActive: true,
      emailVerified: true, // SSO users are pre-verified
      ssoProvider: provider.id,
      ssoSubject: userProfile.subject,
      role: this.mapRole(userProfile.groups || [], provider),
      lastLoginAt: new Date(),
      metadata: {
        ssoAttributes: userProfile.attributes,
        ssoProvider: provider.name,
      },
    };

    const user = await db.client.user.upsert({
      where: { email: userProfile.email },
      update: {
        ...userData,
        updatedAt: new Date(),
      },
      create: {
        ...userData,
        id: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Log provisioning event
    await this.logSSOEvent('user_provisioned', {
      userId: user.id,
      provider: provider.name,
      action: 'auto_provisioned',
    });

    return user;
  }

  // Attribute Mapping
  private mapAttributes(attributes: Record<string, any>, provider: SSOProvider): UserProfile {
    const mapping = this.config.attributeMapping;

    return {
      subject: attributes[mapping.subject || 'sub'] || attributes.nameId || attributes.username,
      email: attributes[mapping.email || 'email'] || attributes.mail,
      firstName:
        attributes[mapping.firstName || 'given_name'] ||
        attributes.givenName ||
        attributes.firstName,
      lastName:
        attributes[mapping.lastName || 'family_name'] || attributes.surname || attributes.lastName,
      groups: this.extractGroups(attributes, mapping),
      attributes,
    };
  }

  private extractGroups(
    attributes: Record<string, any>,
    mapping: Record<string, string>
  ): string[] {
    const groupsField = mapping.groups || 'groups';
    const groups = attributes[groupsField];

    if (Array.isArray(groups)) {
      return groups;
    } else if (typeof groups === 'string') {
      return groups.split(',').map((g) => g.trim());
    }

    return [];
  }

  private mapRole(groups: string[], provider: SSOProvider): string {
    const roleMapping = this.config.roleMapping;

    for (const [role, mappedGroups] of Object.entries(roleMapping)) {
      const groupList = Array.isArray(mappedGroups) ? mappedGroups : [mappedGroups];
      if (groups.some((group) => groupList.includes(group))) {
        return role;
      }
    }

    return 'user'; // Default role
  }

  // Provider Management
  private getProvider(providerId: string): SSOProvider | null {
    return this.config.providers.find((p) => p.id === providerId && p.enabled) || null;
  }

  async updateProvider(providerId: string, updates: Partial<SSOProvider>): Promise<SSOProvider> {
    const providerIndex = this.config.providers.findIndex((p) => p.id === providerId);
    if (providerIndex === -1) {
      throw new Error('Provider not found');
    }

    this.config.providers[providerIndex] = {
      ...this.config.providers[providerIndex],
      ...updates,
    };

    // Save to database
    await this.saveConfiguration();

    return this.config.providers[providerIndex];
  }

  async testProvider(providerId: string): Promise<ProviderTestResult> {
    const provider = this.getProvider(providerId);
    if (!provider) {
      return { success: false, error: 'Provider not found' };
    }

    try {
      switch (provider.type) {
        case 'saml':
          return await this.testSAMLProvider(provider.configuration as SAMLConfig);
        case 'oidc':
          return await this.testOIDCProvider(provider.configuration as OIDCConfig);
        case 'oauth2':
          return await this.testOAuth2Provider(provider.configuration as OAuth2Config);
        case 'ldap':
          return await this.testLDAPProvider(provider.configuration as LDAPConfig);
        default:
          return { success: false, error: 'Unsupported provider type' };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Provider test failed',
      };
    }
  }

  // Helper Methods
  private async parseSAMLAssertion(
    samlResponse: string,
    config: SAMLConfig
  ): Promise<SAMLAssertion> {
    // Simplified SAML parsing - in production, use a proper SAML library
    const decoded = Buffer.from(samlResponse, 'base64').toString('utf8');

    // Extract assertion data (this is a simplified implementation)
    return {
      nameId: this.extractXMLValue(decoded, 'NameID'),
      nameIdFormat: this.extractXMLAttribute(decoded, 'NameID', 'Format'),
      sessionIndex: this.extractXMLAttribute(decoded, 'AuthnStatement', 'SessionIndex'),
      attributes: this.extractSAMLAttributesFromXML(decoded),
    };
  }

  private extractXMLValue(xml: string, tagName: string): string {
    const regex = new RegExp(`<${tagName}[^>]*>([^<]*)</${tagName}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1] : '';
  }

  private extractXMLAttribute(xml: string, tagName: string, attrName: string): string {
    const regex = new RegExp(`<${tagName}[^>]*${attrName}="([^"]*)"`, 'i');
    const match = xml.match(regex);
    return match ? match[1] : '';
  }

  private extractSAMLAttributesFromXML(xml: string): Record<string, any> {
    // Simplified attribute extraction
    const attributes: Record<string, any> = {};
    const attrRegex =
      /<saml:Attribute[^>]*Name="([^"]*)"[^>]*>[\s\S]*?<saml:AttributeValue[^>]*>([^<]*)<\/saml:AttributeValue>/gi;

    let match;
    while ((match = attrRegex.exec(xml)) !== null) {
      attributes[match[1]] = match[2];
    }

    return attributes;
  }

  private async validateSAMLSignature(samlResponse: string, certificate: string): Promise<boolean> {
    // Simplified signature validation - use proper SAML library in production
    try {
      // Extract signature from SAML response
      const decoded = Buffer.from(samlResponse, 'base64').toString('utf8');
      const signatureValue = this.extractXMLValue(decoded, 'SignatureValue');

      if (!signatureValue) {
        return false;
      }

      // Verify signature with certificate
      const verify = crypto.createVerify('RSA-SHA256');
      verify.update(decoded);

      return verify.verify(certificate, signatureValue, 'base64');
    } catch {
      return false;
    }
  }

  private buildSAMLAuthnRequest(params: SAMLRequestParams): string {
    const authnRequest = `
      <samlp:AuthnRequest
        xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
        xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
        ID="${params.id}"
        Version="2.0"
        IssueInstant="${params.timestamp}"
        Destination="${params.destination}"
        AssertionConsumerServiceURL="${params.acsUrl}"
        ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">
        <saml:Issuer>${params.entityId}</saml:Issuer>
        <samlp:NameIDPolicy Format="${params.nameIdFormat}" AllowCreate="true" />
      </samlp:AuthnRequest>
    `;

    return Buffer.from(authnRequest).toString('base64');
  }

  private async exchangeOIDCCode(code: string, config: OIDCConfig): Promise<any> {
    const response = await fetch(`${config.issuer}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange OIDC code');
    }

    return response.json();
  }

  private async validateOIDCToken(idToken: string, config: OIDCConfig): Promise<any> {
    // Simplified token validation - use proper JWT library in production
    const [header, payload, signature] = idToken.split('.');
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));

    // Basic validation
    if (decodedPayload.iss !== config.issuer) {
      throw new Error('Invalid token issuer');
    }

    if (decodedPayload.aud !== config.clientId) {
      throw new Error('Invalid token audience');
    }

    if (decodedPayload.exp < Date.now() / 1000) {
      throw new Error('Token expired');
    }

    return decodedPayload;
  }

  private async getOIDCUserInfo(accessToken: string, config: OIDCConfig): Promise<any> {
    const response = await fetch(`${config.issuer}/userinfo`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get OIDC user info');
    }

    return response.json();
  }

  private async createLDAPClient(config: LDAPConfig): Promise<any> {
    // Simplified LDAP client - use proper LDAP library in production
    return {
      bind: async (dn: string, password: string) => {
        // LDAP bind implementation
      },
      search: async (baseDN: string, filter: string, attributes: string[]) => {
        // LDAP search implementation
        return [];
      },
      unbind: async () => {
        // LDAP unbind implementation
      },
    };
  }

  // State Management
  private async storeState(
    state: string,
    providerId: string,
    returnUrl: string,
    nonce?: string
  ): Promise<void> {
    await db.client.ssoState.create({
      data: {
        state,
        providerId,
        returnUrl,
        nonce,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        createdAt: new Date(),
      },
    });
  }

  private async getStoredState(state: string): Promise<any> {
    const stateRecord = await db.client.ssoState.findUnique({
      where: { state },
    });

    if (!stateRecord || stateRecord.expiresAt < new Date()) {
      return null;
    }

    // Clean up used state
    await db.client.ssoState.delete({
      where: { state },
    });

    return stateRecord;
  }

  private async storeSAMLRequest(
    requestId: string,
    providerId: string,
    returnUrl: string
  ): Promise<void> {
    await db.client.samlRequest.create({
      data: {
        requestId,
        providerId,
        returnUrl,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        createdAt: new Date(),
      },
    });
  }

  // Configuration Management
  private async saveConfiguration(): Promise<void> {
    await db.client.securityConfiguration.upsert({
      where: { id: 'sso_config' },
      update: {
        ssoConfig: this.config,
        lastUpdated: new Date(),
      },
      create: {
        id: 'sso_config',
        organizationId: 'system',
        ssoConfig: this.config,
        lastUpdated: new Date(),
        updatedBy: 'system',
      },
    });
  }

  // Logging and Monitoring
  private async logSSOEvent(eventType: string, data: Record<string, any>): Promise<void> {
    await db.client.securityAuditEvent.create({
      data: {
        id: uuidv4(),
        organizationId: data.organizationId || 'system',
        userId: data.userId,
        eventType: `sso_${eventType}`,
        category: 'authentication',
        action: eventType,
        outcome: 'success',
        severity: 'info',
        details: data,
        timestamp: new Date(),
        source: {
          ip: '0.0.0.0', // Would get from request
          userAgent: 'SSO Service',
        },
        tags: ['sso', eventType],
      },
    });
  }

  // Test Methods
  private async testSAMLProvider(config: SAMLConfig): Promise<ProviderTestResult> {
    try {
      // Test SAML metadata endpoint
      const response = await fetch(config.ssoUrl);
      if (response.ok) {
        return { success: true, message: 'SAML provider accessible' };
      } else {
        return { success: false, error: 'SAML provider not accessible' };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'SAML test failed' };
    }
  }

  private async testOIDCProvider(config: OIDCConfig): Promise<ProviderTestResult> {
    try {
      // Test OIDC discovery endpoint
      const response = await fetch(`${config.issuer}/.well-known/openid_configuration`);
      if (response.ok) {
        const metadata = await response.json();
        return {
          success: true,
          message: 'OIDC provider accessible',
          metadata: {
            endpoints: {
              authorization: metadata.authorization_endpoint,
              token: metadata.token_endpoint,
              userinfo: metadata.userinfo_endpoint,
            },
          },
        };
      } else {
        return { success: false, error: 'OIDC provider not accessible' };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'OIDC test failed' };
    }
  }

  private async testOAuth2Provider(config: OAuth2Config): Promise<ProviderTestResult> {
    try {
      // Test OAuth2 authorization endpoint
      const response = await fetch(config.authorizationUrl, { method: 'HEAD' });
      if (response.ok || response.status === 405) {
        // 405 is OK for HEAD request
        return { success: true, message: 'OAuth2 provider accessible' };
      } else {
        return { success: false, error: 'OAuth2 provider not accessible' };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'OAuth2 test failed',
      };
    }
  }

  private async testLDAPProvider(config: LDAPConfig): Promise<ProviderTestResult> {
    try {
      // Test LDAP connection
      const client = await this.createLDAPClient(config);
      await client.bind(config.bindDN, config.bindPassword);
      await client.unbind();

      return { success: true, message: 'LDAP provider accessible' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'LDAP test failed' };
    }
  }

  private async findLDAPUser(
    client: any,
    username: string,
    config: LDAPConfig
  ): Promise<string | null> {
    const filter = config.userFilter.replace('{username}', username);
    const results = await client.search(config.baseDN, filter, ['dn']);

    return results.length > 0 ? results[0].dn : null;
  }

  private async bindLDAPUser(client: any, userDN: string, password: string): Promise<void> {
    await client.bind(userDN, password);
  }

  private async getLDAPUserAttributes(
    client: any,
    userDN: string,
    config: LDAPConfig
  ): Promise<Record<string, any>> {
    const attributes = Object.values(config.attributes);
    const results = await client.search(userDN, '(objectClass=*)', attributes);

    return results.length > 0 ? results[0] : {};
  }

  private async exchangeOAuth2Code(code: string, config: OAuth2Config): Promise<any> {
    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange OAuth2 code');
    }

    return response.json();
  }

  private async getOAuth2UserInfo(accessToken: string, config: OAuth2Config): Promise<any> {
    const response = await fetch(config.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get OAuth2 user info');
    }

    return response.json();
  }
}

// Types
export interface SSOLoginResult {
  success: boolean;
  user?: any;
  provider?: string;
  sessionData?: Record<string, any>;
  error?: string;
}

export interface UserProfile {
  subject: string;
  email: string;
  firstName: string;
  lastName: string;
  groups?: string[];
  attributes: Record<string, any>;
}

export interface SAMLRequest {
  requestId: string;
  authnRequest: string;
  redirectUrl: string;
  relayState: string;
}

export interface SAMLAssertion {
  nameId: string;
  nameIdFormat: string;
  sessionIndex: string;
  attributes: Record<string, any>;
}

export interface SAMLRequestParams {
  id: string;
  timestamp: string;
  entityId: string;
  acsUrl: string;
  destination: string;
  nameIdFormat: string;
}

export interface ProviderTestResult {
  success: boolean;
  message?: string;
  error?: string;
  metadata?: Record<string, any>;
}

// Factory function
export const createSSOService = (config: SSOConfiguration): SSOService => {
  return new SSOService(config);
};

// Default SSO configuration
export const createDefaultSSOConfig = (): SSOConfiguration => ({
  enabled: false,
  providers: [],
  autoProvisioning: true,
  attributeMapping: {
    subject: 'sub',
    email: 'email',
    firstName: 'given_name',
    lastName: 'family_name',
    groups: 'groups',
  },
  roleMapping: {
    admin: 'administrators',
    user: 'users',
  },
  sessionTimeout: 8 * 60 * 60, // 8 hours
  enforceSSO: false,
  fallbackToLocal: true,
});
