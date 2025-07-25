# Google Drive Integration Setup Guide

This guide provides step-by-step instructions for setting up Google Drive integration for the Riscura platform.

## Prerequisites

- Google Cloud Console access
- Admin access to create OAuth applications

## Step 1: Create a Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit [Google Cloud Console](https://console.cloud.google.com)
   - Sign in with your Google account

2. **Create a New Project** (or select existing)
   - Click the project dropdown at the top
   - Click "New Project"
   - Name: "Riscura Integration"
   - Click "Create"

## Step 2: Enable Google Drive API

1. **Navigate to APIs & Services**
   - In the left sidebar, click "APIs & Services" > "Library"

2. **Enable Google Drive API**
   - Search for "Google Drive API"
   - Click on it and press "Enable"

## Step 3: Create OAuth 2.0 Credentials

1. **Go to Credentials**
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"

2. **Configure OAuth Consent Screen** (if not done)
   - Choose "External" or "Internal" based on your needs
   - Fill in required information:
     - App name: "Riscura RCSA Platform"
     - User support email: Your email
     - Developer contact: Your email
   - Add scopes:
     - `https://www.googleapis.com/auth/drive.readonly`
     - `https://www.googleapis.com/auth/drive.file`

3. **Create OAuth Client ID**
   - Application type: "Web application"
   - Name: "Riscura Web Client"
   - Authorized redirect URIs:
     - For development: `http://localhost:3001/api/google-drive/callback`
     - For production: `https://yourdomain.com/api/google-drive/callback`
   - Click "Create"

4. **Note the Credentials**
   - Client ID: `GOOGLE_CLIENT_ID`
   - Client Secret: `GOOGLE_CLIENT_SECRET`

## Step 4: Configure Environment Variables

Add the following to your `.env` file:

```env
# Google Drive Integration
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3001/api/google-drive/callback"
```

## Step 5: Test the Integration

1. **Start your development server**
   ```bash
   npm run dev
   ```

2. **Navigate to Import Page**
   - Go to `/import` in your application
   - Select "Google Drive Import"

3. **Connect Google Drive**
   - Click "Connect Google Drive"
   - Authorize the application
   - You'll be redirected back to the import page

4. **Import Files**
   - Browse your Google Drive files
   - Select Excel files to import
   - Process with AI analysis

## Security Considerations

1. **OAuth Scopes**
   - We only request read-only access to files
   - Users must explicitly share files with the app

2. **Token Storage**
   - Access tokens are cached in Redis with expiration
   - Refresh tokens are stored securely
   - Tokens are user-specific and isolated

3. **Data Privacy**
   - Files are only accessed when explicitly selected
   - No background syncing or monitoring
   - Files are processed and not stored permanently

## Troubleshooting

### "Access blocked" error
- Ensure OAuth consent screen is properly configured
- For production, you may need to verify your domain

### "Invalid redirect URI" error
- Check that the redirect URI in Google Console matches exactly
- Include the full path including `/api/google-drive/callback`

### Files not showing up
- Ensure the user has Excel files in their Drive
- Check that the files are not in shared drives (requires different scope)
- Try the search function if files are deeply nested

## Production Deployment

1. **Update Redirect URI**
   - Add your production URL to authorized redirect URIs
   - Update `GOOGLE_REDIRECT_URI` in production environment

2. **Verify Domain** (if using external users)
   - Complete domain verification in Google Console
   - Submit for OAuth app review if needed

3. **Monitor Usage**
   - Check API quotas in Google Console
   - Default quota is usually sufficient for most use cases

## API Quotas

- **Default Quotas**:
  - 1,000,000,000 queries per day
  - 1,000 queries per 100 seconds per user
  - These are typically more than sufficient

## Next Steps

1. Test importing various Excel file formats
2. Monitor error logs for any authentication issues
3. Consider implementing Google Workspace domain-wide delegation for enterprise customers

For more information, see the [Google Drive API documentation](https://developers.google.com/drive/api/v3/about-sdk).