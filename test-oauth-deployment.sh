#!/bin/bash

# OAuth Deployment Test Script
echo "🚀 OAuth Deployment Test Script"
echo "================================"

# Configuration
BASE_URL="https://riscura.app"
TIMEOUT=300  # 5 minutes timeout for deployment

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test endpoint
test_endpoint() {
    local endpoint=$1
    local expected_type=$2
    echo -n "Testing $endpoint... "
    
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint" -H "Accept: application/json")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [[ $http_code -eq 200 ]]; then
        # Check if response is JSON
        if echo "$body" | jq . >/dev/null 2>&1; then
            echo -e "${GREEN}✓ OK${NC} (HTTP $http_code, JSON response)"
            return 0
        else
            echo -e "${RED}✗ FAIL${NC} (HTTP $http_code, Non-JSON response)"
            echo "Response preview: ${body:0:100}..."
            return 1
        fi
    elif [[ $http_code -eq 405 ]]; then
        echo -e "${YELLOW}⚠ Method Not Allowed${NC} (HTTP $http_code)"
        return 2
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $http_code)"
        return 1
    fi
}

# Function to test debug endpoint
test_debug_endpoint() {
    echo -n "Testing /api/auth/debug... "
    
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/auth/debug" -H "Accept: application/json")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [[ $http_code -eq 200 ]] && echo "$body" | jq . >/dev/null 2>&1; then
        echo -e "${GREEN}✓ OK${NC} (HTTP $http_code)"
        echo "Debug info:"
        echo "$body" | jq '{
            nextAuthUrl: .environment.NEXTAUTH_URL,
            hasGoogleAuth: .environment.hasGoogleClientId,
            urlMismatch: .checks.urlMismatch,
            currentOrigin: .checks.currentOrigin
        }'
        return 0
    else
        echo -e "${YELLOW}⚠ Not accessible${NC} (HTTP $http_code)"
        return 1
    fi
}

# Wait for deployment
echo "Waiting for deployment to complete..."
echo "This typically takes 1-3 minutes on Vercel"
echo ""

# Initial wait
sleep 30

# Test loop
attempt=0
max_attempts=10
all_passed=false

while [[ $attempt -lt $max_attempts ]]; do
    attempt=$((attempt + 1))
    echo "Attempt $attempt of $max_attempts:"
    echo "------------------------"
    
    # Test each endpoint
    session_ok=false
    providers_ok=false
    log_ok=false
    
    if test_endpoint "/api/auth/session" "json"; then
        session_ok=true
    fi
    
    if test_endpoint "/api/auth/providers" "json"; then
        providers_ok=true
    fi
    
    # Test _log endpoint (POST method)
    echo -n "Testing /api/auth/_log (POST)... "
    response=$(curl -s -X POST -w "\n%{http_code}" "$BASE_URL/api/auth/_log" \
        -H "Accept: application/json" \
        -H "Content-Type: application/json" \
        -d '{"error": "test"}')
    http_code=$(echo "$response" | tail -n1)
    
    if [[ $http_code -eq 200 ]]; then
        echo -e "${GREEN}✓ OK${NC} (HTTP $http_code)"
        log_ok=true
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $http_code)"
    fi
    
    # Test debug endpoint
    test_debug_endpoint
    
    echo ""
    
    # Check if all passed
    if [[ "$session_ok" == "true" ]] && [[ "$providers_ok" == "true" ]] && [[ "$log_ok" == "true" ]]; then
        all_passed=true
        break
    fi
    
    # Wait before next attempt
    if [[ $attempt -lt $max_attempts ]]; then
        echo "Waiting 30 seconds before next attempt..."
        sleep 30
    fi
    echo ""
done

# Final results
echo "================================"
echo "Final Results:"
echo "================================"

if [[ "$all_passed" == "true" ]]; then
    echo -e "${GREEN}✅ All OAuth endpoints are working correctly!${NC}"
    echo ""
    echo "You can now test Google OAuth at:"
    echo "$BASE_URL/oauth-debug"
    exit 0
else
    echo -e "${RED}❌ Some endpoints are still failing${NC}"
    echo ""
    echo "Troubleshooting steps:"
    echo "1. Check Vercel deployment logs: https://vercel.com/dashboard"
    echo "2. Verify environment variables are set in Vercel project settings"
    echo "3. Check browser console for detailed error messages"
    echo "4. Try accessing $BASE_URL/api/auth/debug for diagnostics"
    exit 1
fi