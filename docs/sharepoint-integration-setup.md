# SharePoint Integration Setup Guide

This guide provides step-by-step instructions for setting up SharePoint integration for the Riscura platform using Microsoft Graph API with certificate-based authentication.

## Prerequisites

- Azure AD tenant with administrative access
- OpenSSL installed on your local machine
- Azure Key Vault access
- SharePoint site with appropriate permissions

## Step 1: Azure AD App Registration

1. **Navigate to Azure Portal**
   - Go to [Azure Portal](https://portal.azure.com)
   - Navigate to Azure Active Directory > App registrations

2. **Create New Registration**
   - Click "New registration"
   - Name: "Riscura SharePoint Integration"
   - Supported account types: "Accounts in this organizational directory only"
   - Redirect URI: Leave blank (not needed for app-only auth)
   - Click "Register"

3. **Note Important Values**
   - Application (client) ID: `YOUR_CLIENT_ID_HERE`
   - Directory (tenant) ID: `YOUR_TENANT_ID_HERE`

## Step 2: Configure API Permissions

1. **Add Graph API Permissions**
   - In your app registration, go to "API permissions"
   - Click "Add a permission"
   - Select "Microsoft Graph"
   - Choose "Application permissions"
   - Add the following permissions:
     - `Sites.Read.All` - Read items in all site collections
     - `Files.Read.All` - Read files in all site collections (optional, for broader access)
   - Click "Add permissions"

2. **Grant Admin Consent**
   - Click "Grant admin consent for [Your Organization]"
   - Confirm the action

## Step 3: Certificate Generation and Configuration

1. **Generate a Self-Signed Certificate**
   ```bash
   # Generate private key
   openssl genrsa -out riscura-sharepoint.key 2048
   
   # Generate certificate signing request
   openssl req -new -key riscura-sharepoint.key -out riscura-sharepoint.csr \
     -subj "/C=US/ST=State/L=City/O=Riscura/CN=riscura-sharepoint-integration"
   
   # Generate self-signed certificate (valid for 90 days - recommended for security)
   openssl x509 -req -days 90 -in riscura-sharepoint.csr \
     -signkey riscura-sharepoint.key -out riscura-sharepoint.crt
   
   # Create PFX file for Azure upload
   # Generate and securely store the password
   openssl rand -base64 32 > cert_password.txt
   chmod 600 cert_password.txt  # Restrict file permissions
   
   # Use the password from file (avoid shell history)
   openssl pkcs12 -export -out riscura-sharepoint.pfx \
     -inkey riscura-sharepoint.key -in riscura-sharepoint.crt \
     -password file:cert_password.txt
   ```
   
   > **Security Note**: 
   > - Add `cert_password.txt` to your `.gitignore` file to prevent accidental commits
   > - Store the certificate password in a secure secret management tool (e.g., Azure Key Vault, AWS Secrets Manager)
   > - Never commit passwords to version control
   > - Use shorter certificate validity periods (90 days recommended) for enhanced security
   > - Set up automated certificate rotation if possible

2. **Upload Certificate to Azure AD App**
   - In your app registration, go to "Certificates & secrets"
   - Click "Upload certificate"
   - Select the `riscura-sharepoint.crt` file
   - Click "Add"
   - Note the certificate thumbprint

## Step 4: Azure Key Vault Setup

1. **Create Key Vault (if not exists)**
   ```bash
   # Using Azure CLI
   az keyvault create \
     --name "riscura-keyvault" \
     --resource-group "riscura-rg" \
     --location "eastus"
   ```

2. **Import Certificate to Key Vault**
   ```bash
   # Import the PFX certificate
   az keyvault certificate import \
     --vault-name "riscura-keyvault" \
     --name "sharepoint-integration-cert" \
     --file riscura-sharepoint.pfx \
     --password "your-secure-password"
   ```

3. **Configure Access Policy**
   - Ensure your application has the following Key Vault permissions:
     - Certificate permissions: Get, List
     - Secret permissions: Get, List

## Step 5: SharePoint Site Configuration

1. **Identify Your SharePoint Site**
   - Navigate to your SharePoint site
   - Note the site URL format: `https://yourtenant.sharepoint.com/sites/yoursite`

2. **Get Site ID**
   - Use Graph Explorer or the following PowerShell:
   ```powershell
   # Install Microsoft Graph PowerShell module if needed
   Install-Module Microsoft.Graph -Scope CurrentUser
   
   # Connect to Graph
   Connect-MgGraph -Scopes "Sites.Read.All"
   
   # Get site ID
   $siteUrl = "https://yourtenant.sharepoint.com/sites/yoursite"
   $site = Get-MgSite -Search $siteUrl
   $site.Id  # This is your SHAREPOINT_SITE_ID
   ```

## Step 6: Environment Variables

Add the following environment variables to your `.env` file:

```env
# Azure AD Configuration
AZURE_AD_TENANT_ID=your-tenant-id
AZURE_AD_CLIENT_ID=your-client-id

# Azure Key Vault
AZURE_KEY_VAULT_NAME=riscura-keyvault
AZURE_KEY_VAULT_CERTIFICATE_NAME=sharepoint-integration-cert

# SharePoint Configuration
SHAREPOINT_SITE_ID=your-site-id
GRAPH_API_SCOPE=https://graph.microsoft.com/.default

# Optional: For development/testing with client secret instead of certificate
# AZURE_AD_CLIENT_SECRET=your-client-secret
```

## Step 7: Verify Setup

1. **Test Authentication**
   ```typescript
   // Production example using certificate-based authentication
   import { ClientCertificateCredential } from '@azure/identity';
   import { SecretClient } from '@azure/keyvault-secrets';
   import { DefaultAzureCredential } from '@azure/identity';
   import { Client } from '@microsoft/microsoft-graph-client';
   import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
   
   // Retrieve certificate from Azure Key Vault
   const keyVaultUrl = `https://${process.env.AZURE_KEY_VAULT_NAME}.vault.azure.net`;
   const secretClient = new SecretClient(keyVaultUrl, new DefaultAzureCredential());
   
   const certificateSecret = await secretClient.getSecret(process.env.AZURE_KEY_VAULT_CERTIFICATE_NAME!);
   const certificateBuffer = Buffer.from(certificateSecret.value!, 'base64');
   
   // Create certificate credential
   const credential = new ClientCertificateCredential(
     process.env.AZURE_AD_TENANT_ID!,
     process.env.AZURE_AD_CLIENT_ID!,
     {
       certificate: certificateBuffer,
       certificatePassword: process.env.CERTIFICATE_PASSWORD // Optional, if certificate is password-protected
     }
   );
   
   // For development/testing with client secret (not recommended for production)
   // const credential = new ClientSecretCredential(
   //   process.env.AZURE_AD_TENANT_ID!,
   //   process.env.AZURE_AD_CLIENT_ID!,
   //   process.env.AZURE_AD_CLIENT_SECRET!
   // );
   
   const authProvider = new TokenCredentialAuthenticationProvider(credential, {
     scopes: [process.env.GRAPH_API_SCOPE!]
   });
   
   const client = Client.initWithMiddleware({
     authProvider: authProvider
   });
   
   // Test: Get site information
   const site = await client.api(`/sites/${process.env.SHAREPOINT_SITE_ID}`).get();
   console.log('Site:', site);
   ```

## Security Best Practices

1. **Certificate Management**
   - Store certificates securely in Azure Key Vault
   - Rotate certificates before expiration
   - Never commit certificates to source control
   - Use managed identities when possible

2. **Permission Scoping**
   - Use minimum required permissions
   - Consider using Sites.Selected for specific site access
   - Regular audit of permissions

3. **Token Caching**
   - Implement Redis caching for access tokens
   - Set appropriate TTL based on token expiration
   - Encrypt cached tokens

4. **Audit Logging**
   - Log all SharePoint operations
   - Include user, timestamp, and operation details
   - Monitor for unusual activity patterns

## Troubleshooting

### Common Issues

1. **"Insufficient privileges" error**
   - Ensure admin consent was granted
   - Verify certificate is properly uploaded
   - Check Key Vault access policies

2. **"Invalid audience" error**
   - Verify GRAPH_API_SCOPE is correct
   - Ensure tenant ID matches your Azure AD

3. **Certificate authentication failures**
   - Verify certificate thumbprint matches
   - Check certificate expiration
   - Ensure Key Vault connectivity

### Debug Commands

```bash
# List certificates in Key Vault
az keyvault certificate list --vault-name "riscura-keyvault"

# Show certificate details
az keyvault certificate show \
  --vault-name "riscura-keyvault" \
  --name "sharepoint-integration-cert"

# Test Graph API access
curl -X GET "https://graph.microsoft.com/v1.0/sites/{site-id}" \
  -H "Authorization: Bearer {access-token}"
```

## Next Steps

1. Implement the SharePoint authentication service
2. Create file browsing and download functionality
3. Set up background job processing for imports
4. Implement progress tracking and error handling

## References

- [Microsoft Graph API Documentation](https://docs.microsoft.com/en-us/graph/)
- [Azure AD App Registration](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
- [Certificate-based Authentication](https://docs.microsoft.com/en-us/azure/active-directory/develop/certificate-credentials)
- [SharePoint Sites API](https://docs.microsoft.com/en-us/graph/api/resources/site)