/**
 * OAuth Authentication Fix Script
 * Run with: npx tsx fix-oauth-auth.ts
 */

import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

const fixes = {
  envVariables: {
    required: [
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'NEXTAUTH_URL',
      'NEXTAUTH_SECRET'
    ],
    check: () => {
      const missing: string[] = [];
      const placeholders: string[] = [];
      
      fixes.envVariables.required.forEach(key => {
        const value = process.env[key];
        if (!value) {
          missing.push(key);
        } else if (
          value.includes('your-') || 
          value.includes('placeholder') ||
          value.includes('test_')
        ) {
          placeholders.push(key);
        }
      });
      
      return { missing, placeholders };
    }
  },
  
  urlConsistency: {
    check: () => {
      const issues: string[] = [];
      const appUrl = process.env.APP_URL;
      const nextAuthUrl = process.env.NEXTAUTH_URL;
      
      if (appUrl !== nextAuthUrl) {
        issues.push(`URL mismatch: APP_URL (${appUrl}) !== NEXTAUTH_URL (${nextAuthUrl})`);
      }
      
      if (process.env.NODE_ENV === 'production') {
        if (!appUrl?.startsWith('https://')) {
          issues.push('Production APP_URL must use HTTPS');
        }
        if (!process.env.COOKIE_DOMAIN) {
          issues.push('COOKIE_DOMAIN not set for production');
        }
      }
      
      return issues;
    }
  },
  
  redirectUris: {
    getRequired: () => {
      const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || 'http://localhost:3001';
      return [
        `${baseUrl}/api/auth/callback/google`,
        `${baseUrl}/api/google-oauth/callback`
      ];
    }
  }
};

async function runDiagnostics() {
  console.log('🔍 Running OAuth Authentication Diagnostics...\n');
  
  // Check environment variables
  console.log('1. Environment Variables Check:');
  console.log('-------------------------------');
  const envCheck = fixes.envVariables.check();
  
  if (envCheck.missing.length > 0) {
    console.log('❌ Missing variables:');
    envCheck.missing.forEach(v => console.log(`   - ${v}`));
  }
  
  if (envCheck.placeholders.length > 0) {
    console.log('⚠️  Using placeholder values:');
    envCheck.placeholders.forEach(v => console.log(`   - ${v}`));
  }
  
  if (envCheck.missing.length === 0 && envCheck.placeholders.length === 0) {
    console.log('✅ All required variables are configured');
  }
  
  // Check URL consistency
  console.log('\n2. URL Configuration Check:');
  console.log('---------------------------');
  const urlIssues = fixes.urlConsistency.check();
  
  if (urlIssues.length > 0) {
    urlIssues.forEach(issue => console.log(`⚠️  ${issue}`));
  } else {
    console.log('✅ URL configuration is consistent');
  }
  
  // Show required redirect URIs
  console.log('\n3. Required Google OAuth Redirect URIs:');
  console.log('---------------------------------------');
  const redirectUris = fixes.redirectUris.getRequired();
  console.log('Add these to Google Cloud Console:');
  redirectUris.forEach(uri => console.log(`   • ${uri}`));
  
  // Provide fix instructions
  console.log('\n📝 Fix Instructions:');
  console.log('-------------------');
  
  if (envCheck.missing.length > 0 || envCheck.placeholders.length > 0) {
    console.log('\n1. Add Google OAuth credentials to .env:');
    console.log('   GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com');
    console.log('   GOOGLE_CLIENT_SECRET=your-actual-client-secret');
  }
  
  if (urlIssues.length > 0) {
    console.log('\n2. Fix URL configuration in .env:');
    console.log('   APP_URL=http://localhost:3001  # for development');
    console.log('   NEXTAUTH_URL=http://localhost:3001  # must match APP_URL');
    console.log('   # For production:');
    console.log('   APP_URL=https://riscura.app');
    console.log('   NEXTAUTH_URL=https://riscura.app');
    console.log('   COOKIE_DOMAIN=.riscura.app');
  }
  
  console.log('\n3. Configure Google Cloud Console:');
  console.log('   Visit: https://console.cloud.google.com/apis/credentials');
  console.log('   Select your OAuth 2.0 Client ID');
  console.log('   Add the redirect URIs listed above');
  
  console.log('\n4. Test the authentication:');
  console.log('   npm run dev');
  console.log('   Visit: http://localhost:3001/auth/login');
  console.log('   Click "Sign in with Google"');
  
  console.log('\n✨ Diagnostics complete!');
}

// Run the diagnostics
runDiagnostics().catch(console.error);