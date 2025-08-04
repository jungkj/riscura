#!/usr/bin/env node
import 'dotenv/config';
import { getSharePointAuthService } from '../services/sharepoint/auth.service';
import { getSharePointFileService } from '../services/sharepoint/file.service';

async function testSharePointIntegration() {
  // console.log('🔧 Testing SharePoint Integration...\n');

  // Check environment variables
  // console.log('1️⃣ Checking environment configuration...');
  const requiredEnvVars = ['AZURE_AD_TENANT_ID', 'AZURE_AD_CLIENT_ID', 'GRAPH_API_SCOPE'];

  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
  if (missingVars.length > 0) {
    // console.error('❌ Missing required environment variables:', missingVars.join(', '));
    // console.log('\nPlease set the following in your .env file:');
    missingVars.forEach((varName) => {
      // console.log(`${varName}=your-value-here`);
    });
    process.exit(1);
  }

  // console.log('✅ Environment variables configured\n');

  // Test authentication
  // console.log('2️⃣ Testing authentication...');
  try {
    const authService = getSharePointAuthService();
    const token = await authService.getAccessToken();
    // console.log('✅ Successfully acquired access token');
    // Do not log sensitive token information
  } catch (error) {
    // console.error('❌ Authentication failed:', error);
    // console.log('\nTroubleshooting tips:');
    // console.log('- Ensure your Azure AD app is properly configured');
    // console.log('- Check that you have granted admin consent for permissions');
    // console.log('- Verify your client ID and tenant ID are correct');
    process.exit(1);
  }

  // Test Graph API access
  // console.log('\n3️⃣ Testing Microsoft Graph API access...');
  try {
    const authService = getSharePointAuthService();
    const graphClient = await authService.getGraphClient();

    // Try to get user info (requires User.Read permission)
    const response = await graphClient
      .api('/me')
      .get()
      .catch(() => null);

    if (response) {
      // console.log('✅ Graph API access confirmed (user context)');
    } else {
      // Try app-only context
      const sitesResponse = await graphClient.api('/sites').top(1).get();
      // console.log('✅ Graph API access confirmed (app-only context)');
    }
  } catch (error) {
    // console.error('❌ Graph API access failed:', error);
    process.exit(1);
  }

  // Test SharePoint site access (if SHAREPOINT_SITE_ID is configured)
  if (process.env.SHAREPOINT_SITE_ID) {
    // console.log('\n4️⃣ Testing SharePoint site access...');
    try {
      const fileService = getSharePointFileService();
      const siteInfo = await fileService.getSiteInfo(process.env.SHAREPOINT_SITE_ID);
      // console.log('✅ Successfully accessed SharePoint site');
      // console.log(`   Site: ${siteInfo.displayName}`);
      // console.log(`   URL: ${siteInfo.webUrl}`);

      // Try to list files
      // console.log('\n5️⃣ Attempting to list Excel files...');
      const files = await fileService.listExcelFiles(process.env.SHAREPOINT_SITE_ID);
      // console.log(`✅ Found ${files.length} Excel files`);

      if (files.length > 0) {
        // console.log('\n   Sample files:');
        files.slice(0, 3).forEach((file) => {
          // console.log(`   - ${file.name} (${Math.round(file.size / 1024)}KB)`);
        });
      }
    } catch (error) {
      // console.error('❌ SharePoint site access failed:', error);
      // console.log('\nTroubleshooting tips:');
      // console.log('- Ensure Sites.Read.All permission is granted');
      // console.log('- Verify the SHAREPOINT_SITE_ID is correct');
      // console.log('- Check that the app has access to the specified site');
    }
  } else {
    // console.log('\n⚠️  SHAREPOINT_SITE_ID not configured - skipping site-specific tests');
  }

  // console.log('\n✨ SharePoint integration test complete!');
}

// Run the test
testSharePointIntegration().catch(console.error);
