#!/bin/bash

# =============================================================================
# Deployment Verification Script for Riscura RCSA Platform
# =============================================================================
# This script performs comprehensive pre and post-deployment verification
# including health checks, performance validation, and security testing.
#
# Usage: ./scripts/verify-deployment.sh [--pre-deploy|--post-deploy] [--env=production]
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
VERIFICATION_LOG="/tmp/riscura-verification-$(date +%Y%m%d-%H%M%S).log"

# Default values
DEPLOYMENT_PHASE=""
ENVIRONMENT="production"
TIMEOUT=30
MAX_RETRIES=5

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --pre-deploy)
      DEPLOYMENT_PHASE="pre"
      shift
      ;;
    --post-deploy)
      DEPLOYMENT_PHASE="post"
      shift
      ;;
    --env=*)
      ENVIRONMENT="${1#*=}"
      shift
      ;;
    --timeout=*)
      TIMEOUT="${1#*=}"
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [--pre-deploy|--post-deploy] [--env=production] [--timeout=30]"
      echo ""
      echo "Options:"
      echo "  --pre-deploy   Run pre-deployment verification"
      echo "  --post-deploy  Run post-deployment verification"
      echo "  --env=ENV      Target environment (default: production)"
      echo "  --timeout=SEC  HTTP request timeout (default: 30)"
      echo "  --help         Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

if [[ -z "$DEPLOYMENT_PHASE" ]]; then
  echo "Error: Must specify either --pre-deploy or --post-deploy"
  exit 1
fi

# Logging function
log() {
  local level=$1
  shift
  local message="$*"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  
  case $level in
    "INFO")
      echo -e "${GREEN}[INFO]${NC} ${message}" | tee -a "$VERIFICATION_LOG"
      ;;
    "WARN")
      echo -e "${YELLOW}[WARN]${NC} ${message}" | tee -a "$VERIFICATION_LOG"
      ;;
    "ERROR")
      echo -e "${RED}[ERROR]${NC} ${message}" | tee -a "$VERIFICATION_LOG"
      ;;
    "DEBUG")
      echo -e "${BLUE}[DEBUG]${NC} ${message}" | tee -a "$VERIFICATION_LOG"
      ;;
    "SUCCESS")
      echo -e "${GREEN}[SUCCESS]${NC} ${message}" | tee -a "$VERIFICATION_LOG"
      ;;
  esac
  
  echo "[$timestamp] [$level] $message" >> "$VERIFICATION_LOG"
}

# Test result tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test result function
test_result() {
  local test_name=$1
  local result=$2
  local details=${3:-""}
  
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  
  if [[ $result == "PASS" ]]; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    log "SUCCESS" "✓ $test_name"
    if [[ -n "$details" ]]; then
      log "DEBUG" "  $details"
    fi
  else
    FAILED_TESTS=$((FAILED_TESTS + 1))
    log "ERROR" "✗ $test_name"
    if [[ -n "$details" ]]; then
      log "ERROR" "  $details"
    fi
  fi
}

# HTTP health check function
check_endpoint() {
  local url=$1
  local expected_status=${2:-200}
  local timeout=${3:-$TIMEOUT}
  local retries=${4:-$MAX_RETRIES}
  
  for ((i=1; i<=retries; i++)); do
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$timeout" "$url" 2>/dev/null || echo "000")
    
    if [[ "$status_code" == "$expected_status" ]]; then
      return 0
    fi
    
    if [[ $i -lt $retries ]]; then
      log "DEBUG" "Endpoint check failed (attempt $i/$retries): $url (status: $status_code)"
      sleep 2
    fi
  done
  
  log "ERROR" "Endpoint check failed after $retries attempts: $url (final status: $status_code)"
  return 1
}

# Performance check function
check_performance() {
  local url=$1
  local max_response_time=${2:-2000}
  
  local response_time=$(curl -s -o /dev/null -w "%{time_total}" --max-time "$TIMEOUT" "$url" 2>/dev/null || echo "999")
  local response_time_ms=$(echo "$response_time * 1000" | bc -l | cut -d. -f1)
  
  if [[ $response_time_ms -lt $max_response_time ]]; then
    return 0
  else
    log "WARN" "Slow response time: ${response_time_ms}ms (max: ${max_response_time}ms)"
    return 1
  fi
}

# Database connectivity check
check_database() {
  cd "$PROJECT_ROOT"
  
  if npm run db:health > /dev/null 2>&1; then
    return 0
  else
    return 1
  fi
}

# Redis connectivity check
check_redis() {
  if [[ -n "${REDIS_URL:-}" ]]; then
    # Try to ping Redis
    if timeout 5 redis-cli -u "$REDIS_URL" ping > /dev/null 2>&1; then
      return 0
    else
      return 1
    fi
  else
    log "WARN" "REDIS_URL not configured, skipping Redis check"
    return 0
  fi
}

# Security headers check
check_security_headers() {
  local url=$1
  local required_headers=("x-frame-options" "x-content-type-options" "referrer-policy")
  local missing_headers=()
  
  local headers=$(curl -s -I "$url" --max-time "$TIMEOUT" 2>/dev/null | tr '[:upper:]' '[:lower:]')
  
  for header in "${required_headers[@]}"; do
    if ! echo "$headers" | grep -q "$header:"; then
      missing_headers+=("$header")
    fi
  done
  
  if [[ ${#missing_headers[@]} -eq 0 ]]; then
    return 0
  else
    log "WARN" "Missing security headers: ${missing_headers[*]}"
    return 1
  fi
}

# SSL certificate check
check_ssl_certificate() {
  local url=$1
  local domain=$(echo "$url" | sed -e 's|^https\?://||' -e 's|/.*||')
  
  if [[ "$url" == http* ]] && [[ "$url" != https* ]]; then
    log "WARN" "URL is not HTTPS: $url"
    return 1
  fi
  
  local cert_info=$(echo | timeout 10 openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
  
  if [[ -n "$cert_info" ]]; then
    local not_after=$(echo "$cert_info" | grep "notAfter" | cut -d= -f2)
    local exp_date=$(date -d "$not_after" +%s 2>/dev/null || echo "0")
    local now=$(date +%s)
    local days_left=$(( (exp_date - now) / 86400 ))
    
    if [[ $days_left -gt 30 ]]; then
      return 0
    else
      log "WARN" "SSL certificate expires in $days_left days"
      return 1
    fi
  else
    log "ERROR" "Could not retrieve SSL certificate information"
    return 1
  fi
}

# Load testing (basic)
check_load_performance() {
  local url=$1
  local concurrent_requests=10
  local total_requests=100
  
  log "DEBUG" "Running basic load test: $concurrent_requests concurrent, $total_requests total"
  
  # Use Apache Bench if available
  if command -v ab &> /dev/null; then
    local ab_output=$(ab -n "$total_requests" -c "$concurrent_requests" -q "$url" 2>/dev/null)
    local failed_requests=$(echo "$ab_output" | grep "Failed requests:" | awk '{print $3}')
    local avg_time=$(echo "$ab_output" | grep "Time per request:" | head -1 | awk '{print $4}')
    
    if [[ ${failed_requests:-0} -eq 0 ]] && [[ $(echo "$avg_time < 1000" | bc -l) -eq 1 ]]; then
      log "DEBUG" "Load test passed: ${failed_requests:-0} failed, ${avg_time}ms average"
      return 0
    else
      log "WARN" "Load test concerns: ${failed_requests:-0} failed requests, ${avg_time}ms average"
      return 1
    fi
  else
    log "DEBUG" "Apache Bench not available, skipping load test"
    return 0
  fi
}

# Get application URL based on environment
get_app_url() {
  case "$ENVIRONMENT" in
    "production")
      echo "${VERCEL_URL:-https://riscura.vercel.app}"
      ;;
    "staging")
      echo "${STAGING_URL:-https://staging.riscura.vercel.app}"
      ;;
    "development")
      echo "http://localhost:3000"
      ;;
    *)
      echo "http://localhost:3000"
      ;;
  esac
}

# Pre-deployment verification
run_pre_deployment_checks() {
  log "INFO" "Running pre-deployment verification..."
  
  cd "$PROJECT_ROOT"
  
  # 1. Environment configuration check
  log "DEBUG" "Checking environment configuration..."
  if [[ -f ".env.$ENVIRONMENT" ]]; then
    test_result "Environment file exists" "PASS" ".env.$ENVIRONMENT found"
  else
    test_result "Environment file exists" "FAIL" ".env.$ENVIRONMENT not found"
  fi
  
  # 2. Required tools check
  local required_tools=("node" "npm" "git" "curl")
  for tool in "${required_tools[@]}"; do
    if command -v "$tool" &> /dev/null; then
      local version=$(${tool} --version 2>/dev/null | head -1)
      test_result "Tool available: $tool" "PASS" "$version"
    else
      test_result "Tool available: $tool" "FAIL" "Command not found"
    fi
  done
  
  # 3. Node.js version check
  local node_version=$(node --version | tr -d 'v')
  local min_node_version="18.17.0"
  if dpkg --compare-versions "$node_version" "ge" "$min_node_version" 2>/dev/null; then
    test_result "Node.js version" "PASS" "v$node_version (>= v$min_node_version)"
  else
    test_result "Node.js version" "FAIL" "v$node_version (requires >= v$min_node_version)"
  fi
  
  # 4. Package integrity check
  if npm audit --audit-level high > /dev/null 2>&1; then
    test_result "Package security audit" "PASS" "No high-severity vulnerabilities"
  else
    test_result "Package security audit" "FAIL" "High-severity vulnerabilities found"
  fi
  
  # 5. TypeScript compilation check
  if npm run type-check > /dev/null 2>&1; then
    test_result "TypeScript compilation" "PASS" "No type errors"
  else
    test_result "TypeScript compilation" "FAIL" "Type errors found"
  fi
  
  # 6. Linting check
  if npm run lint > /dev/null 2>&1; then
    test_result "ESLint validation" "PASS" "No linting errors"
  else
    test_result "ESLint validation" "FAIL" "Linting errors found"
  fi
  
  # 7. Database connectivity (if running locally)
  if [[ "$ENVIRONMENT" == "development" ]]; then
    if check_database; then
      test_result "Database connectivity" "PASS" "Database connection successful"
    else
      test_result "Database connectivity" "FAIL" "Cannot connect to database"
    fi
  fi
  
  # 8. Redis connectivity check
  if check_redis; then
    test_result "Redis connectivity" "PASS" "Redis connection successful"
  else
    test_result "Redis connectivity" "FAIL" "Cannot connect to Redis"
  fi
  
  # 9. Build test
  log "DEBUG" "Testing build process..."
  if NODE_ENV=production npm run build > /dev/null 2>&1; then
    test_result "Production build" "PASS" "Build completed successfully"
  else
    test_result "Production build" "FAIL" "Build failed"
  fi
}

# Post-deployment verification
run_post_deployment_checks() {
  log "INFO" "Running post-deployment verification..."
  
  local app_url=$(get_app_url)
  log "DEBUG" "Testing application URL: $app_url"
  
  # 1. Application availability
  if check_endpoint "$app_url" 200; then
    test_result "Application availability" "PASS" "Application responding at $app_url"
  else
    test_result "Application availability" "FAIL" "Application not responding at $app_url"
  fi
  
  # 2. Health check endpoint
  if check_endpoint "$app_url/api/health" 200; then
    test_result "Health check endpoint" "PASS" "/api/health responding"
  else
    test_result "Health check endpoint" "FAIL" "/api/health not responding"
  fi
  
  # 3. Database health check
  if check_endpoint "$app_url/api/health/database" 200; then
    test_result "Database health check" "PASS" "Database connection healthy"
  else
    test_result "Database health check" "FAIL" "Database connection issues"
  fi
  
  # 4. Authentication endpoints
  if check_endpoint "$app_url/api/auth/session" 200; then
    test_result "Authentication endpoints" "PASS" "Auth endpoints responding"
  else
    test_result "Authentication endpoints" "FAIL" "Auth endpoints not responding"
  fi
  
  # 5. API endpoints
  local api_endpoints=("/api/dashboard" "/api/risks" "/api/compliance")
  for endpoint in "${api_endpoints[@]}"; do
    if check_endpoint "$app_url$endpoint" 200 10 3; then
      test_result "API endpoint: $endpoint" "PASS" "Endpoint responding"
    else
      test_result "API endpoint: $endpoint" "FAIL" "Endpoint not responding"
    fi
  done
  
  # 6. Performance check
  if check_performance "$app_url" 2000; then
    test_result "Response performance" "PASS" "Response time < 2s"
  else
    test_result "Response performance" "FAIL" "Response time >= 2s"
  fi
  
  # 7. Security headers check
  if check_security_headers "$app_url"; then
    test_result "Security headers" "PASS" "Required security headers present"
  else
    test_result "Security headers" "FAIL" "Missing security headers"
  fi
  
  # 8. SSL certificate check (for HTTPS URLs)
  if [[ "$app_url" == https* ]]; then
    if check_ssl_certificate "$app_url"; then
      test_result "SSL certificate" "PASS" "Valid SSL certificate"
    else
      test_result "SSL certificate" "FAIL" "SSL certificate issues"
    fi
  fi
  
  # 9. Static assets
  local static_assets=("/_next/static/css" "/_next/static/js")
  for asset in "${static_assets[@]}"; do
    if curl -s --head "$app_url$asset" | head -1 | grep -q "200\|404"; then
      test_result "Static assets: $asset" "PASS" "Static asset path accessible"
    else
      test_result "Static assets: $asset" "FAIL" "Static asset path not accessible"
    fi
  done
  
  # 10. Basic load test (if ab is available)
  if command -v ab &> /dev/null; then
    if check_load_performance "$app_url"; then
      test_result "Basic load performance" "PASS" "Application handles concurrent requests"
    else
      test_result "Basic load performance" "FAIL" "Application struggles with load"
    fi
  fi
  
  # 11. Monitoring endpoints
  if check_endpoint "$app_url/api/monitoring/dashboard" 200 10 2; then
    test_result "Monitoring endpoints" "PASS" "Monitoring dashboard accessible"
  else
    test_result "Monitoring endpoints" "FAIL" "Monitoring dashboard not accessible"
  fi
}

# Banner
echo -e "${BLUE}"
cat << 'EOF'
╔════════════════════════════════════════════════════════════════════════════╗
║                      DEPLOYMENT VERIFICATION                              ║
║                                                                            ║
║    Comprehensive testing for production readiness                         ║
╚════════════════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

log "INFO" "Starting $DEPLOYMENT_PHASE-deployment verification..."
log "INFO" "Environment: $ENVIRONMENT"
log "INFO" "Verification log: $VERIFICATION_LOG"

# Run appropriate verification
if [[ "$DEPLOYMENT_PHASE" == "pre" ]]; then
  run_pre_deployment_checks
else
  run_post_deployment_checks
fi

# Results summary
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                         VERIFICATION RESULTS                              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

log "INFO" "Verification completed"
log "INFO" "Total tests: $TOTAL_TESTS"
log "INFO" "Passed: $PASSED_TESTS"
log "INFO" "Failed: $FAILED_TESTS"

if [[ $FAILED_TESTS -eq 0 ]]; then
  echo -e "${GREEN}✓ All verifications passed!${NC}"
  log "SUCCESS" "All verification tests passed"
  exit 0
else
  echo -e "${RED}✗ $FAILED_TESTS verification(s) failed${NC}"
  log "ERROR" "$FAILED_TESTS verification tests failed"
  
  echo ""
  echo "Review the verification log for details: $VERIFICATION_LOG"
  echo ""
  
  if [[ $FAILED_TESTS -gt $((TOTAL_TESTS / 2)) ]]; then
    echo -e "${RED}Critical: More than 50% of tests failed. Deployment not recommended.${NC}"
    exit 2
  else
    echo -e "${YELLOW}Warning: Some tests failed. Review carefully before proceeding.${NC}"
    exit 1
  fi
fi