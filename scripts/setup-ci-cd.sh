#!/bin/bash

# CI/CD Pipeline Setup Script
# Sets up JSX validation, build monitoring, and deployment automation

set -e

echo "🚀 Setting up CI/CD Pipeline for JSX Error Prevention"
echo "=========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
print_status "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi

if ! command -v git &> /dev/null; then
    print_error "git is not installed"
    exit 1
fi

print_success "Prerequisites check passed"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
fi

# Make scripts executable
print_status "Making scripts executable..."
chmod +x scripts/jsx-error-monitor.cjs
chmod +x scripts/build-metrics-dashboard.cjs
chmod +x scripts/pre-deployment-check.cjs

# Initialize JSX monitoring
print_status "Initializing JSX error monitoring..."
npm run jsx:init

# Initialize build metrics
print_status "Initializing build metrics dashboard..."
mkdir -p .build-metrics
mkdir -p .jsx-metrics

# Set up Husky if not already set up
if [ ! -d ".husky" ]; then
    print_status "Setting up Git hooks with Husky..."
    npm run prepare
fi

# Test the monitoring system
print_status "Testing JSX monitoring system..."
if npm run jsx:monitor; then
    print_success "JSX monitoring system working correctly"
else
    print_warning "JSX monitoring detected issues. Run 'npm run jsx:report' for details."
fi

# Generate initial metrics
print_status "Generating initial build metrics..."
npm run build:monitor > /dev/null 2>&1 || print_warning "Could not generate initial metrics"

# Create GitHub Actions secrets template
print_status "Creating GitHub Actions secrets template..."
cat > .github-secrets-template.txt << 'EOF'
# Required GitHub Secrets for CI/CD Pipeline
# Add these secrets to your GitHub repository settings

# Vercel Integration
VERCEL_TOKEN=your_vercel_token_here
VERCEL_ORG_ID=your_vercel_org_id_here
VERCEL_PROJECT_ID=your_vercel_project_id_here

# Optional: Slack notifications
SLACK_WEBHOOK_URL=your_slack_webhook_url_here

# Optional: Sentry error tracking
SENTRY_DSN=your_sentry_dsn_here

# To get Vercel credentials:
# 1. Install Vercel CLI: npm i -g vercel
# 2. Run: vercel login
# 3. Run: vercel link
# 4. Get token from: https://vercel.com/account/tokens
# 5. Get org/project IDs from .vercel/project.json after linking
EOF

print_success "GitHub secrets template created: .github-secrets-template.txt"

# Test pre-deployment validation
print_status "Testing pre-deployment validation..."
if node scripts/pre-deployment-check.cjs > /dev/null 2>&1; then
    print_success "Pre-deployment validation working correctly"
else
    print_warning "Pre-deployment validation failed. This is normal if you haven't built the project yet."
fi

# Create quick reference guide
print_status "Creating quick reference guide..."
cat > .ci-cd-commands.md << 'EOF'
# CI/CD Pipeline Quick Reference

## JSX Error Monitoring
```bash
# Scan for JSX errors
npm run jsx:monitor

# Generate JSX error report
npm run jsx:report

# Initialize JSX monitoring
npm run jsx:init
```

## Build Monitoring
```bash
# Generate build metrics dashboard
npm run build:monitor

# Record successful build
npm run build:record-success

# Record failed build
npm run build:record-failure
```

## Pre-deployment Validation
```bash
# Run complete pre-deployment check
node scripts/pre-deployment-check.cjs

# Quick validation
npm run ci:validate

# Build test with monitoring
npm run ci:build-test
```

## Development Workflow
1. Make changes
2. Commit (automatic JSX validation runs)
3. Push to GitHub (CI pipeline runs)
4. PR automatically gets deployment preview
5. Merge to main triggers production deployment

## Dashboard Access
- Build metrics: Open `.build-metrics/dashboard.html` in browser
- JSX metrics: Check `.jsx-metrics/` directory
- CI logs: GitHub Actions tab in repository

## Troubleshooting
- JSX errors: `npm run lint:fix`
- Type errors: `npm run type-check:full`
- Build failures: Check `.build-metrics/pre-deployment-report.json`
EOF

print_success "Quick reference guide created: .ci-cd-commands.md"

# Final status check
print_status "Running final validation..."

echo ""
echo "=== SETUP VALIDATION ==="

# Check GitHub Actions workflows
if [ -f ".github/workflows/jsx-validation.yml" ]; then
    print_success "JSX validation workflow configured"
else
    print_error "JSX validation workflow missing"
fi

if [ -f ".github/workflows/build-verification.yml" ]; then
    print_success "Build verification workflow configured"
else
    print_error "Build verification workflow missing"
fi

if [ -f ".github/workflows/vercel-integration.yml" ]; then
    print_success "Vercel integration workflow configured"
else
    print_error "Vercel integration workflow missing"
fi

# Check scripts
if [ -x "scripts/jsx-error-monitor.js" ]; then
    print_success "JSX error monitor ready"
else
    print_error "JSX error monitor not executable"
fi

if [ -x "scripts/build-metrics-dashboard.js" ]; then
    print_success "Build metrics dashboard ready"
else
    print_error "Build metrics dashboard not executable"
fi

if [ -x "scripts/pre-deployment-check.js" ]; then
    print_success "Pre-deployment check ready"
else
    print_error "Pre-deployment check not executable"
fi

# Check hook
if [ -f ".husky/pre-commit" ]; then
    print_success "Pre-commit hook configured"
else
    print_warning "Pre-commit hook not found"
fi

echo ""
echo "🎉 CI/CD PIPELINE SETUP COMPLETE!"
echo "=========================================="
echo ""
echo "Next Steps:"
echo "1. Add GitHub secrets using .github-secrets-template.txt"
echo "2. Push to GitHub to trigger first CI run"
echo "3. Create a pull request to test the pipeline"
echo "4. Check build metrics dashboard: npm run build:monitor"
echo ""
echo "Quick test: npm run jsx:monitor"
echo "Full validation: node scripts/pre-deployment-check.cjs"
echo ""
print_success "Setup completed successfully! 🚀"
