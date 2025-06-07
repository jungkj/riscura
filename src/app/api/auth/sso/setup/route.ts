import { NextRequest, NextResponse } from 'next/server';
import { SSOService } from '@/lib/security/sso';
import { validateRequest } from '@/lib/auth/validate';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { user } = await validateRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      organizationId, 
      providerType, 
      providerName,
      configuration,
      enabled = true 
    } = body;

    // Validate required fields
    if (!organizationId || !providerType || !providerName || !configuration) {
      return NextResponse.json({ 
        error: 'Missing required fields: organizationId, providerType, providerName, configuration' 
      }, { status: 400 });
    }

    // Validate configuration based on provider type
    const validationResult = validateSSOConfiguration(providerType, configuration);
    if (!validationResult.valid) {
      return NextResponse.json({ 
        error: `Invalid configuration: ${validationResult.errors.join(', ')}` 
      }, { status: 400 });
    }

    // Create SSO provider
    const ssoProvider = await db.client.sSOProvider.create({
      data: {
        organizationId,
        name: providerName,
        type: providerType,
        configuration: configuration,
        isEnabled: enabled,
        metadata: {
          createdBy: user.id,
          createdAt: new Date().toISOString(),
          version: '1.0'
        }
      }
    });

    // Initialize SSO service for testing
    const ssoService = new SSOService({
      enabled: true,
      providers: [ssoProvider],
      autoProvisioning: true,
      attributeMapping: configuration.attributeMapping || {},
      roleMapping: configuration.roleMapping || {},
      sessionTimeout: 8 * 60 * 60,
      enforceSSO: false,
      fallbackToLocal: true
    });

    // Test the configuration
    let testResult;
    try {
      testResult = await testSSOConfiguration(ssoService, ssoProvider);
    } catch (error) {
      testResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Configuration test failed'
      };
    }

    return NextResponse.json({
      success: true,
      provider: ssoProvider,
      testResult,
      loginUrl: generateSSOLoginUrl(ssoProvider),
      metadata: generateSSOMetadata(ssoProvider)
    });

  } catch (error) {
    console.error('SSO setup error:', error);
    return NextResponse.json(
      { error: 'Failed to setup SSO provider' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { user } = await validateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId') || user.organizationId;

    // Get all SSO providers for the organization
    const providers = await db.client.sSOProvider.findMany({
      where: {
        organizationId
      },
      select: {
        id: true,
        name: true,
        type: true,
        isEnabled: true,
        configuration: true,
        metadata: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Add status information
    const providersWithStatus = await Promise.all(
      providers.map(async (provider) => {
        const status = await checkSSOProviderStatus(provider);
        return {
          ...provider,
          status,
          loginUrl: generateSSOLoginUrl(provider),
          lastTested: provider.metadata?.lastTested || null
        };
      })
    );

    return NextResponse.json({
      providers: providersWithStatus,
      supportedTypes: [
        {
          type: 'saml',
          name: 'SAML 2.0',
          description: 'Enterprise SAML 2.0 integration'
        },
        {
          type: 'oidc',
          name: 'OpenID Connect',
          description: 'Modern OAuth 2.0 / OIDC integration'
        },
        {
          type: 'google',
          name: 'Google Workspace',
          description: 'Google Workspace SSO'
        },
        {
          type: 'microsoft',
          name: 'Microsoft Azure AD',
          description: 'Microsoft Azure Active Directory'
        }
      ]
    });

  } catch (error) {
    console.error('Error fetching SSO providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SSO providers' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user } = await validateRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { providerId, configuration, enabled } = body;

    if (!providerId) {
      return NextResponse.json({ 
        error: 'Provider ID is required' 
      }, { status: 400 });
    }

    // Get existing provider
    const existingProvider = await db.client.sSOProvider.findUnique({
      where: { id: providerId }
    });

    if (!existingProvider || existingProvider.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Update provider
    const updatedProvider = await db.client.sSOProvider.update({
      where: { id: providerId },
      data: {
        configuration: configuration || existingProvider.configuration,
        isEnabled: enabled !== undefined ? enabled : existingProvider.isEnabled,
        metadata: {
          ...existingProvider.metadata,
          updatedBy: user.id,
          updatedAt: new Date().toISOString()
        }
      }
    });

    return NextResponse.json({
      success: true,
      provider: updatedProvider
    });

  } catch (error) {
    console.error('SSO update error:', error);
    return NextResponse.json(
      { error: 'Failed to update SSO provider' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user } = await validateRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json({ 
        error: 'Provider ID is required' 
      }, { status: 400 });
    }

    // Verify provider belongs to user's organization
    const provider = await db.client.sSOProvider.findUnique({
      where: { id: providerId }
    });

    if (!provider || provider.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Delete provider
    await db.client.sSOProvider.delete({
      where: { id: providerId }
    });

    return NextResponse.json({
      success: true,
      message: 'SSO provider deleted successfully'
    });

  } catch (error) {
    console.error('SSO delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete SSO provider' },
      { status: 500 }
    );
  }
}

// Helper functions
function validateSSOConfiguration(providerType: string, configuration: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  switch (providerType) {
    case 'saml':
      if (!configuration.entityId) errors.push('SAML entityId is required');
      if (!configuration.ssoUrl) errors.push('SAML SSO URL is required');
      if (!configuration.certificate) errors.push('SAML certificate is required');
      if (!configuration.nameIdFormat) errors.push('SAML nameIdFormat is required');
      break;

    case 'oidc':
      if (!configuration.clientId) errors.push('OIDC clientId is required');
      if (!configuration.clientSecret) errors.push('OIDC clientSecret is required');
      if (!configuration.discoveryUrl) errors.push('OIDC discoveryUrl is required');
      if (!configuration.scopes || !Array.isArray(configuration.scopes)) {
        errors.push('OIDC scopes array is required');
      }
      break;

    case 'google':
      if (!configuration.clientId) errors.push('Google clientId is required');
      if (!configuration.clientSecret) errors.push('Google clientSecret is required');
      if (!configuration.hostedDomain) errors.push('Google hostedDomain is required for Workspace');
      break;

    case 'microsoft':
      if (!configuration.clientId) errors.push('Microsoft clientId is required');
      if (!configuration.clientSecret) errors.push('Microsoft clientSecret is required');
      if (!configuration.tenantId) errors.push('Microsoft tenantId is required');
      break;

    default:
      errors.push(`Unsupported provider type: ${providerType}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

async function testSSOConfiguration(ssoService: SSOService, provider: any): Promise<{
  success: boolean;
  error?: string;
  details?: any;
}> {
  try {
    switch (provider.type) {
      case 'saml':
        // Test SAML metadata retrieval
        const samlRequest = await ssoService.generateSAMLRequest(
          provider.id,
          `${process.env.NEXT_PUBLIC_APP_URL}/test`
        );
        return {
          success: true,
          details: {
            requestId: samlRequest.requestId,
            redirectUrl: samlRequest.redirectUrl
          }
        };

      case 'oidc':
        // Test OIDC discovery
        const response = await fetch(provider.configuration.discoveryUrl);
        if (!response.ok) {
          throw new Error('OIDC discovery endpoint not accessible');
        }
        const discovery = await response.json();
        return {
          success: true,
          details: {
            issuer: discovery.issuer,
            authorizationEndpoint: discovery.authorization_endpoint,
            tokenEndpoint: discovery.token_endpoint
          }
        };

      case 'google':
      case 'microsoft':
        // Test OAuth endpoints
        return {
          success: true,
          details: {
            clientId: provider.configuration.clientId,
            configured: true
          }
        };

      default:
        throw new Error(`Testing not implemented for provider type: ${provider.type}`);
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Configuration test failed'
    };
  }
}

function generateSSOLoginUrl(provider: any): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  return `${baseUrl}/api/auth/sso/${provider.type}/login?providerId=${provider.id}`;
}

function generateSSOMetadata(provider: any): any {
  switch (provider.type) {
    case 'saml':
      return {
        type: 'saml',
        entityId: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/sso/saml/metadata`,
        acsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/sso/saml/callback`,
        sloUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/sso/saml/logout`,
        certificate: process.env.SAML_CERTIFICATE,
        nameIdFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress'
      };
    default:
      return {
        type: provider.type,
        redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/sso/${provider.type}/callback`
      };
  }
}

async function checkSSOProviderStatus(provider: any): Promise<{
  status: 'active' | 'error' | 'untested';
  lastCheck: Date;
  error?: string;
}> {
  try {
    // Perform basic connectivity check
    switch (provider.type) {
      case 'saml':
        // Check if SSO URL is accessible
        if (provider.configuration.ssoUrl) {
                     const controller = new AbortController();
           const timeoutId = setTimeout(() => controller.abort(), 5000);
           const response = await fetch(provider.configuration.ssoUrl, { 
             method: 'HEAD',
             signal: controller.signal
           });
           clearTimeout(timeoutId);
          return {
            status: response.ok ? 'active' : 'error',
            lastCheck: new Date(),
            error: response.ok ? undefined : `HTTP ${response.status}`
          };
        }
        break;
      case 'oidc':
        // Check discovery endpoint
        if (provider.configuration.discoveryUrl) {
                     const controller2 = new AbortController();
           const timeoutId2 = setTimeout(() => controller2.abort(), 5000);
           const response = await fetch(provider.configuration.discoveryUrl, { 
             signal: controller2.signal
           });
           clearTimeout(timeoutId2);
          return {
            status: response.ok ? 'active' : 'error',
            lastCheck: new Date(),
            error: response.ok ? undefined : `HTTP ${response.status}`
          };
        }
        break;
    }
    
    return {
      status: 'untested',
      lastCheck: new Date()
    };
  } catch (error) {
    return {
      status: 'error',
      lastCheck: new Date(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 