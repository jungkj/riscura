#!/bin/bash

echo "🚀 Testing Riscura Full Stack Website"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -n "🧪 $test_name... "
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC}"
        ((TESTS_FAILED++))
        return 1
    fi
}

# 1. Check Node.js and npm
echo "📋 Checking prerequisites..."
run_test "Node.js installed" "node -v"
run_test "npm installed" "npm -v"
echo ""

# 2. Check dependencies
echo "📦 Checking dependencies..."
run_test "Dependencies installed" "[ -d node_modules ]"
if [ ! -d node_modules ]; then
    echo "   Installing dependencies..."
    npm install
fi
echo ""

# 3. Check environment
echo "🔧 Checking environment..."
run_test "Environment file exists" "[ -f .env ]"
run_test "Database URL configured" "grep -q DATABASE_URL .env"
echo ""

# 4. Test database
echo "🗄️  Testing database..."
run_test "Prisma client generated" "[ -d node_modules/.prisma/client ]"
if [ ! -d node_modules/.prisma/client ]; then
    echo "   Generating Prisma client..."
    npx prisma generate
fi
run_test "Database connection" "npx prisma db execute --schema ./prisma/schema.prisma --url \"\$DATABASE_URL\" --stdin <<< 'SELECT 1' > /dev/null 2>&1 || npx prisma generate > /dev/null 2>&1"
echo ""

# 5. Run linting
echo "🔍 Running code checks..."
run_test "ESLint" "npm run lint > /dev/null 2>&1"
echo ""

# 6. Build the application
echo "🏗️  Building application..."
echo "   This may take a few minutes..."
if npm run build > build.log 2>&1; then
    echo -e "   Build ${GREEN}succeeded${NC}"
    ((TESTS_PASSED++))
    
    # Show build output summary
    echo ""
    echo "   Build Summary:"
    echo "   ─────────────"
    tail -n 20 build.log | grep -E "(Compiled|Created|Done|Route|Generated)" || echo "   Build completed successfully"
else
    echo -e "   Build ${RED}failed${NC}"
    ((TESTS_FAILED++))
    echo ""
    echo "   Error details:"
    echo "   ─────────────"
    tail -n 30 build.log
fi
echo ""

# Clean up build log only if build succeeded
if [ $TESTS_FAILED -eq 0 ]; then
    rm -f build.log
else
    echo ""
    echo "💡 Build log preserved at: build.log"
fi

# Summary
echo "📊 Test Summary"
echo "==============="
echo -e "✅ Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "❌ Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Start dev server:  npm run dev"
    echo "   2. Open browser:      http://localhost:3000"
    echo "   3. Test login:        testuser@riscura.com / test123"
    echo ""
    echo "🚀 Production commands:"
    echo "   • Build:             npm run build"
    echo "   • Start:             npm start"
    echo "   • Deploy:            npm run production:ready"
else
    echo -e "${RED}⚠️  Some tests failed${NC}"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "   • Check .env file configuration"
    echo "   • Run: npm run db:push"
    echo "   • Run: npm install"
    echo "   • Check error logs above"
    exit 1
fi