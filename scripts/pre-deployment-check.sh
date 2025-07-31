#!/bin/bash

# =============================================================================
# Pre-Deployment Security and Readiness Check
# =============================================================================
# This script performs comprehensive pre-deployment verification including
# security audit, environment validation, and readiness assessment.
#
# Usage: ./scripts/pre-deployment-check.sh [--env=production] [--strict]
# =============================================================================

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CHECK_LOG="/tmp/riscura-precheck-$(date +%Y%m%d-%H%M%S).log"

# Default values
ENVIRONMENT="production"
STRICT_MODE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --env=*)
      ENVIRONMENT="${1#*=}"
      shift
      ;;
    --strict)
      STRICT_MODE=true
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [--env=production] [--strict]"
      echo ""
      echo "Options:"
      echo "  --env=ENV     Target environment (default: production)"
      echo "  --strict      Enable strict mode (fail on warnings)"
      echo "  --help        Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Logging function
log() {
  local level=$1
  shift
  local message="$*"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  
  case $level in
    "INFO")
      echo -e "${GREEN}[INFO]${NC} ${message}" | tee -a "$CHECK_LOG"
      ;;
    "WARN")
      echo -e "${YELLOW}[WARN]${NC} ${message}" | tee -a "$CHECK_LOG"
      ;;
    "ERROR")
      echo -e "${RED}[ERROR]${NC} ${message}" | tee -a "$CHECK_LOG"
      ;;
    "DEBUG")
      echo -e "${BLUE}[DEBUG]${NC} ${message}" | tee -a "$CHECK_LOG"
      ;;
    "SUCCESS")
      echo -e "${GREEN}[SUCCESS]${NC} ${message}" | tee -a "$CHECK_LOG"
      ;;
  esac
  
  echo "[$timestamp] [$level] $message" >> "$CHECK_LOG"
}

# Check result tracking
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# Check result function
check_result() {
  local check_name=$1
  local result=$2
  local details=${3:-""}
  local severity=${4:-"ERROR"}
  
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  
  case $result in
    "PASS")
      PASSED_CHECKS=$((PASSED_CHECKS + 1))
      log "SUCCESS" "✓ $check_name"
      if [[ -n "$details" ]]; then
        log "DEBUG" "  $details"
      fi
      ;;
    "WARN")
      WARNING_CHECKS=$((WARNING_CHECKS + 1))
      log "WARN" "⚠ $check_name"
      if [[ -n "$details" ]]; then
        log "WARN" "  $details"
      fi
      if [[ "$STRICT_MODE" == "true" ]]; then
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        WARNING_CHECKS=$((WARNING_CHECKS - 1))
      fi
      ;;
    "FAIL")
      FAILED_CHECKS=$((FAILED_CHECKS + 1))
      log "ERROR" "✗ $check_name"
      if [[ -n "$details" ]]; then
        log "ERROR" "  $details"
      fi
      ;;
  esac
}

# Environment file validation
validate_environment_file() {
  local env_file=".env.$ENVIRONMENT"
  
  if [[ ! -f "$PROJECT_ROOT/$env_file" ]]; then
    check_result "Environment file exists" "FAIL" "$env_file not found"
    return 1
  fi
  
  check_result "Environment file exists" "PASS" "$env_file found"
  
  # Required production variables
  local required_vars=(
    "DATABASE_URL"
    "NEXTAUTH_SECRET"
    "NEXTAUTH_URL"
    "STRIPE_SECRET_KEY"
    "SENDGRID_API_KEY"
    "OPENAI_API_KEY"
    "SENTRY_DSN"
    "AWS_ACCESS_KEY_ID"
    "AWS_SECRET_ACCESS_KEY"
    "REDIS_URL"
  )
  
  local missing_vars=()
  
  for var in "${required_vars[@]}"; do
    if ! grep -q "^$var=" "$PROJECT_ROOT/$env_file"; then
      missing_vars+=("$var")
    fi
  done
  
  if [[ ${#missing_vars[@]} -eq 0 ]]; then
    check_result "Required environment variables" "PASS" "All required variables present"
  else
    check_result "Required environment variables" "FAIL" "Missing: ${missing_vars[*]}"
  fi
  
  # Check for development/test values in production
  local dev_patterns=(
    "localhost"
    "127.0.0.1"
    "test_"
    "sk_test_"
    "pk_test_"
    "development"
    "staging"
  )
  
  local dev_values_found=()
  
  for pattern in "${dev_patterns[@]}"; do
    if grep -i "$pattern" "$PROJECT_ROOT/$env_file" > /dev/null; then
      dev_values_found+=("$pattern")
    fi
  done
  
  if [[ ${#dev_values_found[@]} -eq 0 ]]; then
    check_result "Production values check" "PASS" "No development values found"
  else
    check_result "Production values check" "FAIL" "Development values found: ${dev_values_found[*]}"
  fi
}

# Security configuration validation
validate_security_config() {
  local env_file=".env.$ENVIRONMENT"
  
  # Check secret lengths
  local secrets=(
    "NEXTAUTH_SECRET:32"
    "JWT_ACCESS_SECRET:32"
    "JWT_REFRESH_SECRET:32"
    "MASTER_ENCRYPTION_KEY:32"
    "SESSION_SECRET:32"
  )
  
  for secret_spec in "${secrets[@]}"; do
    local secret_name="${secret_spec%:*}"
    local min_length="${secret_spec#*:}"
    
    if grep -q "^$secret_name=" "$PROJECT_ROOT/$env_file"; then
      local secret_value=$(grep "^$secret_name=" "$PROJECT_ROOT/$env_file" | cut -d'=' -f2 | tr -d '"')
      if [[ ${#secret_value} -ge $min_length ]]; then
        check_result "Secret length: $secret_name" "PASS" "Length: ${#secret_value} chars (>= $min_length)"
      else
        check_result "Secret length: $secret_name" "FAIL" "Length: ${#secret_value} chars (< $min_length required)"
      fi
    else
      check_result "Secret length: $secret_name" "FAIL" "Secret not found in environment"
    fi
  done
  
  # Check for default/example values
  local default_patterns=(
    "REPLACE_WITH"
    "your-secret-here"
    "example.com"
    "test123"
    "password"
    "changeme"
  )
  
  local default_values_found=()
  
  for pattern in "${default_patterns[@]}"; do
    if grep -i "$pattern" "$PROJECT_ROOT/$env_file" > /dev/null; then
      default_values_found+=("$pattern")
    fi
  done
  
  if [[ ${#default_values_found[@]} -eq 0 ]]; then
    check_result "Default values check" "PASS" "No default values found"
  else
    check_result "Default values check" "FAIL" "Default values found: ${default_values_found[*]}"
  fi
}

# Code quality checks
validate_code_quality() {
  cd "$PROJECT_ROOT"
  
  # TypeScript compilation
  if npm run type-check > /dev/null 2>&1; then
    check_result "TypeScript compilation" "PASS" "No type errors"
  else
    check_result "TypeScript compilation" "FAIL" "Type errors found"
  fi
  
  # ESLint validation
  if npm run lint > /dev/null 2>&1; then
    check_result "ESLint validation" "PASS" "No linting errors"
  else
    # Check if it's just warnings
    local lint_output=$(npm run lint 2>&1 || true)
    if echo "$lint_output" | grep -q "warning"; then
      check_result "ESLint validation" "WARN" "Linting warnings found"
    else
      check_result "ESLint validation" "FAIL" "Linting errors found"
    fi
  fi
  
  # Build test
  if NODE_ENV=production npm run build > /dev/null 2>&1; then
    check_result "Production build" "PASS" "Build completed successfully"
  else
    check_result "Production build" "FAIL" "Build failed"
  fi
  
  # Bundle size check
  if [[ -d ".next" ]]; then
    local bundle_size=$(du -sh .next 2>/dev/null | cut -f1 || echo "unknown")
    if [[ "$bundle_size" != "unknown" ]]; then
      # Extract numeric value (assuming MB)
      local size_mb=$(echo "$bundle_size" | sed 's/[^0-9.]//g')
      if (( $(echo "$size_mb < 100" | bc -l) )); then
        check_result "Bundle size" "PASS" "Size: $bundle_size"
      else
        check_result "Bundle size" "WARN" "Large bundle: $bundle_size"
      fi
    else
      check_result "Bundle size" "WARN" "Could not determine bundle size"
    fi
  fi
}

# Security audit
run_security_audit() {
  cd "$PROJECT_ROOT"
  
  # npm audit for vulnerabilities
  local audit_output=$(npm audit --audit-level high 2>&1 || true)
  if echo "$audit_output" | grep -q "found 0 vulnerabilities"; then
    check_result "Security audit" "PASS" "No high-severity vulnerabilities"
  elif echo "$audit_output" | grep -q "vulnerabilities"; then
    local vuln_count=$(echo "$audit_output" | grep "vulnerabilities" | head -1)
    check_result "Security audit" "FAIL" "$vuln_count"
  else
    check_result "Security audit" "WARN" "Could not run security audit"
  fi
  
  # Check for hardcoded secrets in code
  local secret_patterns=(
    "password\s*=\s*['\"][^'\"]{8,}"
    "secret\s*=\s*['\"][^'\"]{16,}"
    "token\s*=\s*['\"][^'\"]{20,}"
    "key\s*=\s*['\"][^'\"]{16,}"
    "sk_live_[a-zA-Z0-9]{24,}"
    "sk_test_[a-zA-Z0-9]{24,}"
  )
  
  local secrets_found=false
  
  for pattern in "${secret_patterns[@]}"; do
    if grep -r -E "$pattern" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" > /dev/null; then
      secrets_found=true
      break
    fi
  done
  
  if [[ "$secrets_found" == "false" ]]; then
    check_result "Hardcoded secrets check" "PASS" "No hardcoded secrets found"
  else
    check_result "Hardcoded secrets check" "FAIL" "Potential hardcoded secrets found"
  fi
}

# Database readiness
validate_database_readiness() {
  cd "$PROJECT_ROOT"
  
  # Check if database URL is set
  local env_file=".env.$ENVIRONMENT"
  if grep -q "^DATABASE_URL=" "$PROJECT_ROOT/$env_file"; then
    check_result "Database URL configured" "PASS" "DATABASE_URL is set"
    
    # Test database connection (if possible)
    if command -v psql &> /dev/null; then
      local db_url=$(grep "^DATABASE_URL=" "$PROJECT_ROOT/$env_file" | cut -d'=' -f2 | tr -d '"')
      if timeout 10 psql "$db_url" -c "SELECT 1;" > /dev/null 2>&1; then
        check_result "Database connectivity" "PASS" "Database connection successful"
      else
        check_result "Database connectivity" "WARN" "Could not connect to database"
      fi
    else
      check_result "Database connectivity" "WARN" "psql not available for testing"
    fi
  else
    check_result "Database URL configured" "FAIL" "DATABASE_URL not set"
  fi
  
  # Check for pending migrations
  if npm run db:generate > /dev/null 2>&1; then
    check_result "Prisma client generation" "PASS" "Prisma client generated successfully"
  else
    check_result "Prisma client generation" "FAIL" "Prisma client generation failed"
  fi
}

# Performance checks
validate_performance_config() {
  # Check Next.js configuration
  if [[ -f "$PROJECT_ROOT/next.config.js" ]]; then
    check_result "Next.js config exists" "PASS" "next.config.js found"
    
    # Check for production optimizations
    if grep -q "removeConsole.*production" "$PROJECT_ROOT/next.config.js"; then
      check_result "Console removal configured" "PASS" "Console.log removal enabled for production"
    else
      check_result "Console removal configured" "WARN" "Console.log removal not configured"
    fi
    
    if grep -q "output.*standalone" "$PROJECT_ROOT/next.config.js"; then
      check_result "Standalone output configured" "PASS" "Standalone output enabled"
    else
      check_result "Standalone output configured" "WARN" "Standalone output not configured"
    fi
  else
    check_result "Next.js config exists" "FAIL" "next.config.js not found"
  fi
  
  # Check Vercel configuration
  if [[ -f "$PROJECT_ROOT/vercel.json" ]]; then
    check_result "Vercel config exists" "PASS" "vercel.json found"
    
    # Check for security headers
    if grep -q "X-Frame-Options" "$PROJECT_ROOT/vercel.json"; then
      check_result "Security headers configured" "PASS" "Security headers found in vercel.json"
    else
      check_result "Security headers configured" "WARN" "Security headers not configured"
    fi
  else
    check_result "Vercel config exists" "WARN" "vercel.json not found"
  fi
}

# External service validation
validate_external_services() {
  local env_file=".env.$ENVIRONMENT"
  
  # Stripe configuration
  if grep -q "^STRIPE_SECRET_KEY=sk_live_" "$PROJECT_ROOT/$env_file"; then
    check_result "Stripe live keys" "PASS" "Using live Stripe keys"
  elif grep -q "^STRIPE_SECRET_KEY=sk_test_" "$PROJECT_ROOT/$env_file"; then
    check_result "Stripe live keys" "FAIL" "Using test Stripe keys in production"
  else
    check_result "Stripe live keys" "FAIL" "Stripe secret key not configured"
  fi
  
  # SendGrid API key
  if grep -q "^SENDGRID_API_KEY=SG\." "$PROJECT_ROOT/$env_file"; then
    check_result "SendGrid API key" "PASS" "SendGrid API key configured"
  else
    check_result "SendGrid API key" "FAIL" "SendGrid API key not configured"
  fi
  
  # OpenAI API key
  if grep -q "^OPENAI_API_KEY=sk-" "$PROJECT_ROOT/$env_file"; then
    check_result "OpenAI API key" "PASS" "OpenAI API key configured"
  else
    check_result "OpenAI API key" "FAIL" "OpenAI API key not configured"
  fi
  
  # Sentry DSN
  if grep -q "^SENTRY_DSN=https://" "$PROJECT_ROOT/$env_file"; then
    check_result "Sentry DSN" "PASS" "Sentry DSN configured"
  else
    check_result "Sentry DSN" "WARN" "Sentry DSN not configured"
  fi
}

# Banner
echo -e "${BLUE}"
cat << 'EOF'
╔════════════════════════════════════════════════════════════════════════════╗
║                    PRE-DEPLOYMENT SECURITY CHECK                          ║
║                                                                            ║
║    Comprehensive validation before production deployment                  ║
╚════════════════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

log "INFO" "Starting pre-deployment security and readiness check..."
log "INFO" "Environment: $ENVIRONMENT"
log "INFO" "Strict Mode: $STRICT_MODE"
log "INFO" "Check log: $CHECK_LOG"

# Run all validation checks
log "INFO" "Validating environment configuration..."
validate_environment_file

log "INFO" "Validating security configuration..."
validate_security_config

log "INFO" "Validating code quality..."
validate_code_quality

log "INFO" "Running security audit..."
run_security_audit

log "INFO" "Validating database readiness..."
validate_database_readiness

log "INFO" "Validating performance configuration..."
validate_performance_config

log "INFO" "Validating external services..."
validate_external_services

# Results summary
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    PRE-DEPLOYMENT CHECK RESULTS                           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

log "INFO" "Pre-deployment check completed"
log "INFO" "Total checks: $TOTAL_CHECKS"
log "INFO" "Passed: $PASSED_CHECKS"
log "INFO" "Warnings: $WARNING_CHECKS"
log "INFO" "Failed: $FAILED_CHECKS"

# Determine exit status
if [[ $FAILED_CHECKS -eq 0 ]]; then
  if [[ $WARNING_CHECKS -eq 0 ]]; then
    echo -e "${GREEN}✅ All checks passed! Ready for deployment.${NC}"
    log "SUCCESS" "All pre-deployment checks passed"
    exit 0
  else
    echo -e "${YELLOW}⚠️  $WARNING_CHECKS warning(s) found. Review before deployment.${NC}"
    log "WARN" "$WARNING_CHECKS warnings found"
    if [[ "$STRICT_MODE" == "true" ]]; then
      exit 1
    else
      exit 0
    fi
  fi
else
  echo -e "${RED}❌ $FAILED_CHECKS check(s) failed. Deployment not recommended.${NC}"
  log "ERROR" "$FAILED_CHECKS checks failed"
  
  echo ""
  echo "Review the check log for details: $CHECK_LOG"
  echo ""
  echo "Common issues and solutions:"
  echo "1. Missing environment variables - Copy from .env.production.example"
  echo "2. Default/test values in production - Replace with production values"
  echo "3. Short secrets - Generate new secrets with proper length"
  echo "4. Build failures - Fix TypeScript/linting errors"
  echo "5. Security vulnerabilities - Run 'npm audit fix'"
  echo ""
  
  exit 1
fi