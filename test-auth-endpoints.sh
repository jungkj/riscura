#!/bin/bash

# Test all auth endpoints
echo "🔍 Testing Authentication Endpoints"
echo "==================================="
echo ""

BASE_URL="https://riscura.app"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test function
test_endpoint() {
    local endpoint=$1
    local description=$2
    echo -e "${BLUE}Testing:${NC} $description"
    echo "URL: $BASE_URL$endpoint"
    
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint" -H "Accept: application/json")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [[ $http_code -eq 200 ]]; then
        echo -e "${GREEN}✓ Success${NC} (HTTP $http_code)"
        if echo "$body" | jq . >/dev/null 2>&1; then
            echo "$body" | jq . | head -20
        else
            echo "Non-JSON response"
        fi
    else
        echo -e "${RED}✗ Failed${NC} (HTTP $http_code)"
        if echo "$body" | jq . >/dev/null 2>&1; then
            echo "$body" | jq .
        else
            echo "HTML Error Page (first 200 chars):"
            echo "${body:0:200}..."
        fi
    fi
    echo ""
}

# Wait for deployment
echo "Waiting 30 seconds for deployment..."
sleep 30

echo "1. Testing Diagnostic Endpoints"
echo "-------------------------------"
test_endpoint "/api/auth-diagnostics" "Auth Diagnostics (Module Loading Test)"
test_endpoint "/api/auth/google-debug" "Google OAuth Debug"
test_endpoint "/api/auth/debug" "Auth Debug"

echo ""
echo "2. Testing Alternative Auth Endpoints"
echo "------------------------------------"
test_endpoint "/api/auth-test/providers" "Minimal Auth (No DB)"
test_endpoint "/api/auth-safe/providers" "Safe Auth (Error Handling)"

echo ""
echo "3. Testing Main Auth Endpoints"
echo "------------------------------"
test_endpoint "/api/auth/providers" "Main Auth Providers"
test_endpoint "/api/auth/session" "Main Auth Session"

echo ""
echo "4. Summary"
echo "----------"
echo "If the diagnostic endpoint shows errors, check:"
echo "1. Environment variables in Vercel"
echo "2. Database connection string"
echo "3. Module import errors"
echo ""
echo "Working endpoints:"
echo "- /api/auth-test/* - Uses minimal config without database"
echo "- /api/auth-safe/* - Uses safe config with error handling"
echo ""
echo "Once issues are fixed, the main /api/auth/* endpoints will work"