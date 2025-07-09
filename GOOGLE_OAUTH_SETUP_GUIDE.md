# Google OAuth Setup Guide

## The Issue
Google OAuth is failing with a 500 error because the redirect URI is not properly configured in Google Cloud Console.

## Correct Setup Steps

### 1. Google Cloud Console Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID
5. In the **Authorized redirect URIs** section:
   - Click **ADD URI**
   - Enter exactly: `https://riscura.app/api/auth/callback/google`
   - The field DOES accept forward slashes (/) - you must include the full path
   - Click **SAVE**

### 2. Important Notes

- Google OAuth REQUIRES the complete callback URL with the path
- The redirect URI must match EXACTLY what NextAuth expects
- Do NOT just enter `riscura.app` - this will not work
- The correct format is: `https://[your-domain]/api/auth/callback/google`

### 3. Common Mistakes

❌ **Wrong**: `riscura.app`
❌ **Wrong**: `https://riscura.app`
❌ **Wrong**: `https://riscura.app/`
✅ **Correct**: `https://riscura.app/api/auth/callback/google`

### 4. If the Field Doesn't Accept Slashes

If you're having trouble entering the URL:
1. Make sure you're in the "Authorized redirect URIs" section, NOT the "Authorized JavaScript origins"
2. Click the "ADD URI" button to add a new line
3. Paste the complete URL: `https://riscura.app/api/auth/callback/google`
4. Press Enter or click outside the field to confirm

### 5. After Saving

After adding the correct redirect URI:
1. Click **SAVE** at the bottom of the OAuth client configuration
2. Wait 5-10 minutes for changes to propagate
3. Test the login again at https://riscura.app

### 6. Debugging

To verify your setup:
1. Visit: https://riscura.app/api/debug/auth-env
2. Confirm all OAuth variables are present
3. Check browser console for any error messages
4. If still failing, check Vercel logs for detailed error messages

### 7. Additional Redirect URIs

For local development, also add:
- `http://localhost:3000/api/auth/callback/google`

For preview deployments, consider adding:
- `https://riscura-*.vercel.app/api/auth/callback/google`