#!/bin/bash

# OAuth Authentication Testing Script
# Tests Google OAuth configuration and authentication flow

echo "==================================="
echo "Google OAuth Authentication Test"
echo "==================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check environment variables
echo "1. Checking Environment Variables..."
echo "-----------------------------------"

if [ -f .env ]; then
    source .env
    
    if [ -n "$GOOGLE_CLIENT_ID" ] && [ "$GOOGLE_CLIENT_ID" != "your-google-client-id.apps.googleusercontent.com" ]; then
        echo -e "${GREEN}✓${NC} GOOGLE_CLIENT_ID is configured"
    else
        echo -e "${RED}✗${NC} GOOGLE_CLIENT_ID is not configured or using placeholder"
        echo "  Please add your Google OAuth Client ID to .env file"
    fi
    
    if [ -n "$GOOGLE_CLIENT_SECRET" ] && [ "$GOOGLE_CLIENT_SECRET" != "your-google-client-secret" ]; then
        echo -e "${GREEN}✓${NC} GOOGLE_CLIENT_SECRET is configured"
    else
        echo -e "${RED}✗${NC} GOOGLE_CLIENT_SECRET is not configured or using placeholder"
        echo "  Please add your Google OAuth Client Secret to .env file"
    fi
    
    if [ -n "$NEXTAUTH_URL" ]; then
        echo -e "${GREEN}✓${NC} NEXTAUTH_URL: $NEXTAUTH_URL"
    else
        echo -e "${YELLOW}!${NC} NEXTAUTH_URL not set, using default"
    fi
    
    if [ -n "$APP_URL" ]; then
        echo -e "${GREEN}✓${NC} APP_URL: $APP_URL"
    else
        echo -e "${YELLOW}!${NC} APP_URL not set"
    fi
else
    echo -e "${RED}✗${NC} .env file not found"
    exit 1
fi

echo ""
echo "2. Testing OAuth Endpoints..."
echo "----------------------------"

# Get base URL
BASE_URL="${APP_URL:-http://localhost:3001}"

# Test OAuth config endpoint
echo -n "Testing OAuth config endpoint... "
CONFIG_RESPONSE=$(curl -s "$BASE_URL/api/google-oauth/config" 2>/dev/null)
if [ $? -eq 0 ]; then
    CONFIGURED=$(echo "$CONFIG_RESPONSE" | grep -o '"configured":[^,}]*' | cut -d: -f2)
    if [ "$CONFIGURED" = "true" ]; then
        echo -e "${GREEN}✓${NC} OAuth is configured"
    else
        echo -e "${RED}✗${NC} OAuth is not configured"
    fi
else
    echo -e "${RED}✗${NC} Server not responding"
    echo "  Please ensure the development server is running: npm run dev"
    exit 1
fi

# Test debug endpoint
echo -n "Testing OAuth debug endpoint... "
DEBUG_RESPONSE=$(curl -s "$BASE_URL/api/google-oauth/debug" 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Debug endpoint accessible"
    echo ""
    echo "Debug Info:"
    echo "$DEBUG_RESPONSE" | jq '.' 2>/dev/null || echo "$DEBUG_RESPONSE"
else
    echo -e "${RED}✗${NC} Debug endpoint not accessible"
fi

echo ""
echo "3. Google Cloud Console Configuration"
echo "------------------------------------"
echo "Ensure these redirect URIs are added in Google Cloud Console:"
echo ""
echo "For Development:"
echo "  • http://localhost:3001/api/auth/callback/google"
echo "  • http://localhost:3001/api/google-oauth/callback"
echo ""
echo "For Production (riscura.app):"
echo "  • https://riscura.app/api/auth/callback/google"
echo "  • https://riscura.app/api/google-oauth/callback"
echo ""
echo "Google Cloud Console: https://console.cloud.google.com/apis/credentials"
echo ""

echo "4. Testing OAuth Flow"
echo "--------------------"
echo "To test the OAuth flow:"
echo "1. Start the development server: npm run dev"
echo "2. Visit: $BASE_URL/auth/login"
echo "3. Click 'Sign in with Google'"
echo "4. Complete Google authentication"
echo "5. Check if you're redirected to /dashboard"
echo ""

echo "5. Common Issues and Solutions"
echo "-----------------------------"
echo "• Redirect URI mismatch: Check Google Cloud Console settings"
echo "• Session not persisting: Check cookie domain configuration"
echo "• 'Not configured' error: Add OAuth credentials to .env"
echo "• Database errors: Ensure DATABASE_URL is correct and DB is running"
echo ""

echo "Test complete!"