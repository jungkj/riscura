#!/bin/bash

# =============================================================================
# Production Deployment Script for Riscura RCSA Platform
# =============================================================================
# This script handles complete production deployment with proper verification,
# monitoring setup, and rollback capabilities.
#
# Usage: ./scripts/deploy-production.sh [--force] [--skip-tests]
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
DEPLOYMENT_LOG="/tmp/riscura-deployment-$(date +%Y%m%d-%H%M%S).log"
ROLLBACK_INFO="/tmp/riscura-rollback-info.json"

# Parse command line arguments
FORCE_DEPLOY=false
SKIP_TESTS=false
DRY_RUN=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --force)
      FORCE_DEPLOY=true
      shift
      ;;
    --skip-tests)
      SKIP_TESTS=true
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [--force] [--skip-tests] [--dry-run]"
      echo ""
      echo "Options:"
      echo "  --force      Force deployment even with warnings"
      echo "  --skip-tests Skip running tests (not recommended)"
      echo "  --dry-run    Show what would be deployed without executing"
      echo "  --help       Show this help message"
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
      echo -e "${GREEN}[INFO]${NC} ${message}" | tee -a "$DEPLOYMENT_LOG"
      ;;
    "WARN")
      echo -e "${YELLOW}[WARN]${NC} ${message}" | tee -a "$DEPLOYMENT_LOG"
      ;;
    "ERROR")
      echo -e "${RED}[ERROR]${NC} ${message}" | tee -a "$DEPLOYMENT_LOG"
      ;;
    "DEBUG")
      echo -e "${BLUE}[DEBUG]${NC} ${message}" | tee -a "$DEPLOYMENT_LOG"
      ;;
  esac
  
  echo "[$timestamp] [$level] $message" >> "$DEPLOYMENT_LOG"
}

# Error handler
handle_error() {
  local line_number=$1
  log "ERROR" "Deployment failed at line $line_number"
  log "ERROR" "Check deployment log: $DEPLOYMENT_LOG"
  
  if [[ -f "$ROLLBACK_INFO" ]]; then
    log "INFO" "Rollback information available at: $ROLLBACK_INFO"
    log "INFO" "Run: ./scripts/rollback-deployment.sh to rollback"
  fi
  
  exit 1
}

trap 'handle_error $LINENO' ERR

# Banner
echo -e "${BLUE}"
cat << 'EOF'
╔════════════════════════════════════════════════════════════════════════════╗
║                    RISCURA PRODUCTION DEPLOYMENT                           ║
║                                                                            ║
║    Enterprise Risk & Compliance Management Platform                       ║
║    Deployment Script v2.0                                                 ║
╚════════════════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

log "INFO" "Starting production deployment process..."
log "INFO" "Deployment log: $DEPLOYMENT_LOG"

# Step 1: Environment Check
log "INFO" "Step 1/10: Environment verification..."

if [[ ! -f "$PROJECT_ROOT/.env.production" && "$DRY_RUN" != "true" ]]; then
  log "ERROR" "Production environment file not found: .env.production"
  log "INFO" "Create .env.production based on .env.production.example"
  exit 1
fi

# Check required commands
required_commands=("node" "npm" "git" "curl" "jq")
for cmd in "${required_commands[@]}"; do
  if ! command -v "$cmd" &> /dev/null; then
    log "ERROR" "Required command not found: $cmd"
    exit 1
  fi
done

log "INFO" "Environment verification completed"

# Step 2: Pre-deployment verification
log "INFO" "Step 2/10: Running pre-deployment verification..."

if [[ "$DRY_RUN" != "true" ]]; then
  cd "$PROJECT_ROOT"
  
  # Run pre-deployment checks
  if ! ./scripts/verify-deployment.sh --pre-deploy; then
    log "ERROR" "Pre-deployment verification failed"
    if [[ "$FORCE_DEPLOY" != "true" ]]; then
      exit 1
    else
      log "WARN" "Continuing with force deployment..."
    fi
  fi
fi

log "INFO" "Pre-deployment verification completed"

# Step 3: Backup current state
log "INFO" "Step 3/10: Creating deployment backup..."

if [[ "$DRY_RUN" != "true" ]]; then
  # Get current commit hash
  CURRENT_COMMIT=$(git rev-parse HEAD)
  CURRENT_BRANCH=$(git branch --show-current)
  DEPLOYMENT_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  
  # Store rollback information
  cat > "$ROLLBACK_INFO" << EOF
{
  "deployment_time": "$DEPLOYMENT_TIME",
  "previous_commit": "$CURRENT_COMMIT",
  "previous_branch": "$CURRENT_BRANCH",
  "backup_location": "/tmp/riscura-backup-$DEPLOYMENT_TIME",
  "deployment_log": "$DEPLOYMENT_LOG"
}
EOF

  log "INFO" "Rollback information stored: $ROLLBACK_INFO"
fi

log "INFO" "Backup creation completed"

# Step 4: Dependencies installation
log "INFO" "Step 4/10: Installing dependencies..."

if [[ "$DRY_RUN" != "true" ]]; then
  cd "$PROJECT_ROOT"
  
  # Clean install with production optimizations
  log "DEBUG" "Cleaning node_modules and package-lock.json..."
  npm run clean:all
  
  log "DEBUG" "Installing production dependencies..."
  NODE_ENV=production npm ci --only=production
  
  # Install dev dependencies for build process
  npm ci
fi

log "INFO" "Dependencies installation completed"

# Step 5: Build process
log "INFO" "Step 5/10: Building application..."

if [[ "$DRY_RUN" != "true" ]]; then
  cd "$PROJECT_ROOT"
  
  # Generate Prisma client
  log "DEBUG" "Generating Prisma client..."
  npm run db:generate
  
  # Run type checking if not skipping tests
  if [[ "$SKIP_TESTS" != "true" ]]; then
    log "DEBUG" "Running type checking..."
    npm run type-check:full
  fi
  
  # Build for production
  log "DEBUG" "Building application for production..."
  NODE_ENV=production npm run build:prod
  
  # Validate build
  if [[ ! -d ".next" ]]; then
    log "ERROR" "Build failed - .next directory not found"
    exit 1
  fi
  
  log "DEBUG" "Build validation completed"
fi

log "INFO" "Application build completed"

# Step 6: Database migrations
log "INFO" "Step 6/10: Running database migrations..."

if [[ "$DRY_RUN" != "true" ]]; then
  cd "$PROJECT_ROOT"
  
  log "DEBUG" "Deploying database migrations..."
  npm run db:migrate:deploy
  
  log "DEBUG" "Database migration completed"
fi

log "INFO" "Database migrations completed"

# Step 7: Security validation
log "INFO" "Step 7/10: Security validation..."

if [[ "$DRY_RUN" != "true" ]]; then
  cd "$PROJECT_ROOT"
  
  # Run security checks
  log "DEBUG" "Running security audit..."
  npm run security:audit
  
  # Validate security configuration
  log "DEBUG" "Validating security configuration..."
  npm run security:check:prod
fi

log "INFO" "Security validation completed"

# Step 8: Performance optimization
log "INFO" "Step 8/10: Performance optimization..."

if [[ "$DRY_RUN" != "true" ]]; then
  cd "$PROJECT_ROOT"
  
  # Optimize images
  log "DEBUG" "Optimizing images..."
  npm run optimize:images
  
  # Clear caches
  log "DEBUG" "Clearing application caches..."
  npm run cache:clear
fi

log "INFO" "Performance optimization completed"

# Step 9: Deployment to Vercel
log "INFO" "Step 9/10: Deploying to Vercel..."

if [[ "$DRY_RUN" == "true" ]]; then
  log "INFO" "DRY RUN: Would deploy to Vercel production"
else
  # Check if Vercel CLI is available
  if ! command -v vercel &> /dev/null; then
    log "ERROR" "Vercel CLI not found. Install with: npm i -g vercel"
    exit 1
  fi
  
  # Deploy to production
  log "DEBUG" "Deploying to Vercel production..."
  vercel --prod --yes --token="${VERCEL_TOKEN:-}"
  
  # Wait for deployment to be ready
  log "DEBUG" "Waiting for deployment to be ready..."
  sleep 30
fi

log "INFO" "Vercel deployment completed"

# Step 10: Post-deployment verification
log "INFO" "Step 10/10: Post-deployment verification..."

if [[ "$DRY_RUN" != "true" ]]; then
  # Run post-deployment verification
  if ! ./scripts/verify-deployment.sh --post-deploy; then
    log "ERROR" "Post-deployment verification failed"
    log "ERROR" "Consider running rollback: ./scripts/rollback-deployment.sh"
    exit 1
  fi
  
  # Record successful deployment
  npm run deployment:record-success
fi

log "INFO" "Post-deployment verification completed"

# Cleanup
if [[ "$DRY_RUN" != "true" ]]; then
  # Clean up temporary files older than 7 days
  find /tmp -name "riscura-*" -type f -mtime +7 -delete 2>/dev/null || true
fi

# Success message
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                     DEPLOYMENT COMPLETED SUCCESSFULLY                     ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

log "INFO" "Deployment completed successfully!"
log "INFO" "Deployment log saved to: $DEPLOYMENT_LOG"

if [[ "$DRY_RUN" != "true" ]]; then
  log "INFO" "Application is now live in production"
  log "INFO" "Monitor deployment: npm run monitoring:init"
  log "INFO" "View metrics: npm run monitoring:verify"
fi

echo ""
echo "Next steps:"
echo "1. Monitor application metrics and alerts"
echo "2. Verify all critical user flows"
echo "3. Check error rates and performance metrics"
echo "4. Notify team of successful deployment"
echo ""

exit 0