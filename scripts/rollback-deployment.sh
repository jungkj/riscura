#!/bin/bash

# =============================================================================
# Deployment Rollback Script for Riscura RCSA Platform
# =============================================================================
# This script handles emergency rollback of production deployments with
# comprehensive verification and monitoring integration.
#
# Usage: ./scripts/rollback-deployment.sh [--confirm] [--rollback-info=/path/to/info]
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
ROLLBACK_LOG="/tmp/riscura-rollback-$(date +%Y%m%d-%H%M%S).log"
DEFAULT_ROLLBACK_INFO="/tmp/riscura-rollback-info.json"

# Default values
CONFIRM_ROLLBACK=false
ROLLBACK_INFO_FILE=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --confirm)
      CONFIRM_ROLLBACK=true
      shift
      ;;
    --rollback-info=*)
      ROLLBACK_INFO_FILE="${1#*=}"
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [--confirm] [--rollback-info=/path/to/info]"
      echo ""
      echo "Options:"
      echo "  --confirm              Skip confirmation prompt"
      echo "  --rollback-info=PATH   Path to rollback info file"
      echo "  --help                 Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Set default rollback info file if not specified
if [[ -z "$ROLLBACK_INFO_FILE" ]]; then
  ROLLBACK_INFO_FILE="$DEFAULT_ROLLBACK_INFO"
fi

# Logging function
log() {
  local level=$1
  shift
  local message="$*"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  
  case $level in
    "INFO")
      echo -e "${GREEN}[INFO]${NC} ${message}" | tee -a "$ROLLBACK_LOG"
      ;;
    "WARN")
      echo -e "${YELLOW}[WARN]${NC} ${message}" | tee -a "$ROLLBACK_LOG"
      ;;
    "ERROR")
      echo -e "${RED}[ERROR]${NC} ${message}" | tee -a "$ROLLBACK_LOG"
      ;;
    "DEBUG")
      echo -e "${BLUE}[DEBUG]${NC} ${message}" | tee -a "$ROLLBACK_LOG"
      ;;
    "SUCCESS")
      echo -e "${GREEN}[SUCCESS]${NC} ${message}" | tee -a "$ROLLBACK_LOG"
      ;;
  esac
  
  echo "[$timestamp] [$level] $message" >> "$ROLLBACK_LOG"
}

# Error handler
handle_error() {
  local line_number=$1
  log "ERROR" "Rollback failed at line $line_number"
  log "ERROR" "Check rollback log: $ROLLBACK_LOG"
  log "ERROR" "Manual intervention may be required"
  exit 1
}

trap 'handle_error $LINENO' ERR

# Banner
echo -e "${RED}"
cat << 'EOF'
╔════════════════════════════════════════════════════════════════════════════╗
║                        ⚠️  DEPLOYMENT ROLLBACK  ⚠️                         ║
║                                                                            ║
║    Emergency rollback procedure for production deployment                 ║
║    This will revert the application to the previous stable state          ║
╚════════════════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

log "INFO" "Starting deployment rollback process..."
log "INFO" "Rollback log: $ROLLBACK_LOG"

# Check if rollback info file exists
if [[ ! -f "$ROLLBACK_INFO_FILE" ]]; then
  log "ERROR" "Rollback information file not found: $ROLLBACK_INFO_FILE"
  log "ERROR" "Cannot proceed without rollback information"
  echo ""
  echo "Available rollback info files:"
  find /tmp -name "riscura-rollback-info-*.json" -type f 2>/dev/null | head -5
  exit 1
fi

# Parse rollback information
log "INFO" "Reading rollback information from: $ROLLBACK_INFO_FILE"

if ! command -v jq &> /dev/null; then
  log "ERROR" "jq command not found. Install with: apt-get install jq"
  exit 1
fi

# Extract rollback information
DEPLOYMENT_TIME=$(jq -r '.deployment_time' "$ROLLBACK_INFO_FILE")
PREVIOUS_COMMIT=$(jq -r '.previous_commit' "$ROLLBACK_INFO_FILE")
PREVIOUS_BRANCH=$(jq -r '.previous_branch' "$ROLLBACK_INFO_FILE")
BACKUP_LOCATION=$(jq -r '.backup_location' "$ROLLBACK_INFO_FILE")
DEPLOYMENT_LOG_PATH=$(jq -r '.deployment_log' "$ROLLBACK_INFO_FILE")

log "INFO" "Rollback information:"
log "INFO" "  Deployment Time: $DEPLOYMENT_TIME"
log "INFO" "  Previous Commit: $PREVIOUS_COMMIT"
log "INFO" "  Previous Branch: $PREVIOUS_BRANCH"
log "INFO" "  Backup Location: $BACKUP_LOCATION"

# Confirmation prompt
if [[ "$CONFIRM_ROLLBACK" != "true" ]]; then
  echo ""
  echo -e "${YELLOW}⚠️  WARNING: This will rollback the production deployment ⚠️${NC}"
  echo ""
  echo "This action will:"
  echo "1. Revert application code to commit: $PREVIOUS_COMMIT"
  echo "2. Redeploy the previous version to production"
  echo "3. Potentially lose any data changes since deployment"
  echo ""
  read -p "Are you sure you want to proceed with rollback? (type 'ROLLBACK' to confirm): " confirmation
  
  if [[ "$confirmation" != "ROLLBACK" ]]; then
    log "INFO" "Rollback cancelled by user"
    exit 0
  fi
fi

log "INFO" "Rollback confirmed. Proceeding with emergency rollback..."

# Step 1: Verify current state
log "INFO" "Step 1/8: Verifying current state..."

cd "$PROJECT_ROOT"

# Get current commit for rollback record
CURRENT_COMMIT_BEFORE_ROLLBACK=$(git rev-parse HEAD)
CURRENT_BRANCH_BEFORE_ROLLBACK=$(git branch --show-current)

log "DEBUG" "Current commit before rollback: $CURRENT_COMMIT_BEFORE_ROLLBACK"
log "DEBUG" "Current branch before rollback: $CURRENT_BRANCH_BEFORE_ROLLBACK"

# Step 2: Create rollback record
log "INFO" "Step 2/8: Creating rollback record..."

ROLLBACK_RECORD="/tmp/riscura-rollback-record-$(date +%Y%m%d-%H%M%S).json"

cat > "$ROLLBACK_RECORD" << EOF
{
  "rollback_time": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "original_deployment_time": "$DEPLOYMENT_TIME",
  "commit_before_rollback": "$CURRENT_COMMIT_BEFORE_ROLLBACK",
  "branch_before_rollback": "$CURRENT_BRANCH_BEFORE_ROLLBACK",
  "rollback_to_commit": "$PREVIOUS_COMMIT",
  "rollback_to_branch": "$PREVIOUS_BRANCH",
  "rollback_reason": "Emergency rollback procedure",
  "rollback_log": "$ROLLBACK_LOG",
  "rollback_info_source": "$ROLLBACK_INFO_FILE"
}
EOF

log "INFO" "Rollback record created: $ROLLBACK_RECORD"

# Step 3: Revert code changes
log "INFO" "Step 3/8: Reverting code changes..."

# Stash any uncommitted changes
if ! git diff --quiet || ! git diff --cached --quiet; then
  log "DEBUG" "Stashing uncommitted changes..."
  git stash push -m "Emergency rollback stash - $(date)"
fi

# Checkout the previous commit
log "DEBUG" "Checking out previous commit: $PREVIOUS_COMMIT"
git checkout "$PREVIOUS_COMMIT"

# If we were on a specific branch, create/update it
if [[ "$PREVIOUS_BRANCH" != "HEAD" ]] && [[ -n "$PREVIOUS_BRANCH" ]]; then
  log "DEBUG" "Switching to branch: $PREVIOUS_BRANCH"
  git checkout -B "$PREVIOUS_BRANCH" || git checkout "$PREVIOUS_BRANCH"
fi

log "SUCCESS" "Code reverted to previous state"

# Step 4: Reinstall dependencies
log "INFO" "Step 4/8: Reinstalling dependencies..."

# Clean install with production settings
log "DEBUG" "Cleaning node_modules..."
rm -rf node_modules package-lock.json

log "DEBUG" "Installing dependencies..."
npm ci

log "SUCCESS" "Dependencies reinstalled"

# Step 5: Rebuild application
log "INFO" "Step 5/8: Rebuilding application..."

# Generate Prisma client
log "DEBUG" "Generating Prisma client..."
npm run db:generate

# Build application
log "DEBUG" "Building application..."
NODE_ENV=production npm run build:prod

# Verify build
if [[ ! -d ".next" ]]; then
  log "ERROR" "Build failed - .next directory not found"
  exit 1
fi

log "SUCCESS" "Application rebuilt successfully"

# Step 6: Database rollback check
log "INFO" "Step 6/8: Checking database state..."

# Check if we need to rollback database migrations
# This is a cautious approach - we don't automatically rollback DB changes
log "WARN" "Database migrations are NOT automatically rolled back"
log "WARN" "If database schema changes were made, manual intervention may be required"
log "INFO" "Current database state preserved"

# Step 7: Redeploy to production
log "INFO" "Step 7/8: Redeploying to production..."

# Check if Vercel CLI is available
if ! command -v vercel &> /dev/null; then
  log "ERROR" "Vercel CLI not found. Install with: npm i -g vercel"
  exit 1
fi

# Deploy the rolled back version
log "DEBUG" "Deploying rolled back version to production..."
vercel --prod --yes --token="${VERCEL_TOKEN:-}"

# Wait for deployment
log "DEBUG" "Waiting for deployment to complete..."
sleep 30

log "SUCCESS" "Rollback deployment completed"

# Step 8: Verify rollback
log "INFO" "Step 8/8: Verifying rollback..."

# Run post-deployment verification
if ./scripts/verify-deployment.sh --post-deploy; then
  log "SUCCESS" "Rollback verification passed"
else
  log "ERROR" "Rollback verification failed"
  log "ERROR" "Application may not be functioning correctly"
  exit 1
fi

# Update monitoring systems
if command -v npm &> /dev/null; then
  npm run deployment:record-success 2>/dev/null || true
fi

log "SUCCESS" "Rollback verification completed"

# Generate rollback summary
log "INFO" "Generating rollback summary..."

cat << EOF > "/tmp/riscura-rollback-summary-$(date +%Y%m%d-%H%M%S).txt"
RISCURA PRODUCTION ROLLBACK SUMMARY
===================================

Rollback Time: $(date)
Original Deployment: $DEPLOYMENT_TIME
Rolled Back From: $CURRENT_COMMIT_BEFORE_ROLLBACK
Rolled Back To: $PREVIOUS_COMMIT

Rollback Process:
✓ Code reverted to previous stable commit
✓ Dependencies reinstalled
✓ Application rebuilt
✓ Redeployed to production
✓ Rollback verification passed

Files:
- Rollback Log: $ROLLBACK_LOG
- Rollback Record: $ROLLBACK_RECORD
- Original Rollback Info: $ROLLBACK_INFO_FILE

Notes:
- Database migrations were NOT rolled back automatically
- Any data changes since deployment are preserved
- Monitor application closely for any issues

Next Steps:
1. Verify all critical application flows
2. Check error rates and performance metrics
3. Notify stakeholders of rollback completion
4. Investigate root cause of deployment issues
5. Plan remediation for next deployment attempt
EOF

# Success message
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                      ROLLBACK COMPLETED SUCCESSFULLY                      ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

log "SUCCESS" "Emergency rollback completed successfully!"
log "INFO" "Application has been reverted to previous stable state"
log "INFO" "Rollback log: $ROLLBACK_LOG"
log "INFO" "Rollback record: $ROLLBACK_RECORD"

echo ""
echo "Post-Rollback Actions Required:"
echo "1. 🔍 Monitor application performance and error rates"
echo "2. 📊 Check key business metrics and user flows"
echo "3. 📧 Notify team and stakeholders of rollback completion"
echo "4. 🔍 Investigate root cause of deployment failure"
echo "5. 📋 Document lessons learned and update deployment process"
echo "6. 🛠️  Plan fix for issues that triggered rollback"
echo ""

echo "Monitoring Commands:"
echo "- Health Check: curl https://your-domain.com/api/health"
echo "- Metrics: npm run monitoring:verify"
echo "- Logs: tail -f $ROLLBACK_LOG"
echo ""

exit 0