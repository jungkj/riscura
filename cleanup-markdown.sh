#!/bin/bash

# Markdown Files Cleanup Script
# Generated on 2025-08-25T17:50:02.363Z

echo "📚 Markdown Files Cleanup"
echo "========================="

# Create backup
BACKUP_DIR="markdown-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "Backup directory: $BACKUP_DIR"

# Files to delete
echo ""
echo "Removing unnecessary files..."

if [ -f "markdown-backup-20250825-134705\deleted\PACKAGE_AUDIT_REPORT.md" ]; then
  cp "markdown-backup-20250825-134705\deleted\PACKAGE_AUDIT_REPORT.md" "$BACKUP_DIR/"
  rm "markdown-backup-20250825-134705\deleted\PACKAGE_AUDIT_REPORT.md"
  echo "✓ Deleted: markdown-backup-20250825-134705\deleted\PACKAGE_AUDIT_REPORT.md"
fi
if [ -f "markdown-backup-20250825-134705\deleted\API_AUDIT_REPORT.md" ]; then
  cp "markdown-backup-20250825-134705\deleted\API_AUDIT_REPORT.md" "$BACKUP_DIR/"
  rm "markdown-backup-20250825-134705\deleted\API_AUDIT_REPORT.md"
  echo "✓ Deleted: markdown-backup-20250825-134705\deleted\API_AUDIT_REPORT.md"
fi

# Archive merged files
echo ""
echo "Archiving merged files..."
mkdir -p "$BACKUP_DIR/archived"

if [ -f "README.md" ]; then
  mv "README.md" "$BACKUP_DIR/archived/"
  echo "✓ Archived: README.md"
fi
if [ -f "CONSOLIDATED_DOCUMENTATION.md" ]; then
  mv "CONSOLIDATED_DOCUMENTATION.md" "$BACKUP_DIR/archived/"
  echo "✓ Archived: CONSOLIDATED_DOCUMENTATION.md"
fi
if [ -f "COMPREHENSIVE_DOCUMENTATION.md" ]; then
  mv "COMPREHENSIVE_DOCUMENTATION.md" "$BACKUP_DIR/archived/"
  echo "✓ Archived: COMPREHENSIVE_DOCUMENTATION.md"
fi
if [ -f "markdown-backup-20250825-134705\CONSOLIDATION_SUMMARY.md" ]; then
  mv "markdown-backup-20250825-134705\CONSOLIDATION_SUMMARY.md" "$BACKUP_DIR/archived/"
  echo "✓ Archived: markdown-backup-20250825-134705\CONSOLIDATION_SUMMARY.md"
fi
if [ -f "markdown-backup-20250825-134705\archived\VERCEL_ENV_REQUIREMENTS.md" ]; then
  mv "markdown-backup-20250825-134705\archived\VERCEL_ENV_REQUIREMENTS.md" "$BACKUP_DIR/archived/"
  echo "✓ Archived: markdown-backup-20250825-134705\archived\VERCEL_ENV_REQUIREMENTS.md"
fi
if [ -f "markdown-backup-20250825-134705\archived\TYPESCRIPT_WORKFLOW_GUIDE.md" ]; then
  mv "markdown-backup-20250825-134705\archived\TYPESCRIPT_WORKFLOW_GUIDE.md" "$BACKUP_DIR/archived/"
  echo "✓ Archived: markdown-backup-20250825-134705\archived\TYPESCRIPT_WORKFLOW_GUIDE.md"
fi
if [ -f "markdown-backup-20250825-134705\archived\TYPESCRIPT_ERRORS_ANALYSIS.md" ]; then
  mv "markdown-backup-20250825-134705\archived\TYPESCRIPT_ERRORS_ANALYSIS.md" "$BACKUP_DIR/archived/"
  echo "✓ Archived: markdown-backup-20250825-134705\archived\TYPESCRIPT_ERRORS_ANALYSIS.md"
fi
if [ -f "markdown-backup-20250825-134705\archived\test-script-generation-type-safety-updates.md" ]; then
  mv "markdown-backup-20250825-134705\archived\test-script-generation-type-safety-updates.md" "$BACKUP_DIR/archived/"
  echo "✓ Archived: markdown-backup-20250825-134705\archived\test-script-generation-type-safety-updates.md"
fi
if [ -f "markdown-backup-20250825-134705\archived\SUPABASE_SETUP.md" ]; then
  mv "markdown-backup-20250825-134705\archived\SUPABASE_SETUP.md" "$BACKUP_DIR/archived/"
  echo "✓ Archived: markdown-backup-20250825-134705\archived\SUPABASE_SETUP.md"
fi
if [ -f "markdown-backup-20250825-134705\archived\STRIPE_INTEGRATION_SUMMARY.md" ]; then
  mv "markdown-backup-20250825-134705\archived\STRIPE_INTEGRATION_SUMMARY.md" "$BACKUP_DIR/archived/"
  echo "✓ Archived: markdown-backup-20250825-134705\archived\STRIPE_INTEGRATION_SUMMARY.md"
fi
if [ -f "markdown-backup-20250825-134705\archived\security-performance-improvements.md" ]; then
  mv "markdown-backup-20250825-134705\archived\security-performance-improvements.md" "$BACKUP_DIR/archived/"
  echo "✓ Archived: markdown-backup-20250825-134705\archived\security-performance-improvements.md"
fi
if [ -f "markdown-backup-20250825-134705\archived\redis-caching-integration.md" ]; then
  mv "markdown-backup-20250825-134705\archived\redis-caching-integration.md" "$BACKUP_DIR/archived/"
  echo "✓ Archived: markdown-backup-20250825-134705\archived\redis-caching-integration.md"
fi
if [ -f "markdown-backup-20250825-134705\archived\README.md" ]; then
  mv "markdown-backup-20250825-134705\archived\README.md" "$BACKUP_DIR/archived/"
  echo "✓ Archived: markdown-backup-20250825-134705\archived\README.md"
fi
if [ -f "markdown-backup-20250825-134705\archived\README-TESTING.md" ]; then
  mv "markdown-backup-20250825-134705\archived\README-TESTING.md" "$BACKUP_DIR/archived/"
  echo "✓ Archived: markdown-backup-20250825-134705\archived\README-TESTING.md"
fi
if [ -f "markdown-backup-20250825-134705\archived\PRODUCTION_ENV_REQUIREMENTS.md" ]; then
  mv "markdown-backup-20250825-134705\archived\PRODUCTION_ENV_REQUIREMENTS.md" "$BACKUP_DIR/archived/"
  echo "✓ Archived: markdown-backup-20250825-134705\archived\PRODUCTION_ENV_REQUIREMENTS.md"
fi
if [ -f "markdown-backup-20250825-134705\archived\LIVE_DATA_MIGRATION_PLAN.md" ]; then
  mv "markdown-backup-20250825-134705\archived\LIVE_DATA_MIGRATION_PLAN.md" "$BACKUP_DIR/archived/"
  echo "✓ Archived: markdown-backup-20250825-134705\archived\LIVE_DATA_MIGRATION_PLAN.md"
fi
if [ -f "markdown-backup-20250825-134705\archived\implementation-action-plans.md" ]; then
  mv "markdown-backup-20250825-134705\archived\implementation-action-plans.md" "$BACKUP_DIR/archived/"
  echo "✓ Archived: markdown-backup-20250825-134705\archived\implementation-action-plans.md"
fi
if [ -f "markdown-backup-20250825-134705\archived\GOOGLE_OAUTH_SETUP_GUIDE.md" ]; then
  mv "markdown-backup-20250825-134705\archived\GOOGLE_OAUTH_SETUP_GUIDE.md" "$BACKUP_DIR/archived/"
  echo "✓ Archived: markdown-backup-20250825-134705\archived\GOOGLE_OAUTH_SETUP_GUIDE.md"
fi
if [ -f "markdown-backup-20250825-134705\archived\GOOGLE_OAUTH_FIX.md" ]; then
  mv "markdown-backup-20250825-134705\archived\GOOGLE_OAUTH_FIX.md" "$BACKUP_DIR/archived/"
  echo "✓ Archived: markdown-backup-20250825-134705\archived\GOOGLE_OAUTH_FIX.md"
fi
if [ -f "markdown-backup-20250825-134705\archived\getting-started.md" ]; then
  mv "markdown-backup-20250825-134705\archived\getting-started.md" "$BACKUP_DIR/archived/"
  echo "✓ Archived: markdown-backup-20250825-134705\archived\getting-started.md"
fi
if [ -f "markdown-backup-20250825-134705\archived\free-infrastructure-setup.md" ]; then
  mv "markdown-backup-20250825-134705\archived\free-infrastructure-setup.md" "$BACKUP_DIR/archived/"
  echo "✓ Archived: markdown-backup-20250825-134705\archived\free-infrastructure-setup.md"
fi
if [ -f "markdown-backup-20250825-134705\archived\feature-implementation-summary.md" ]; then
  mv "markdown-backup-20250825-134705\archived\feature-implementation-summary.md" "$BACKUP_DIR/archived/"
  echo "✓ Archived: markdown-backup-20250825-134705\archived\feature-implementation-summary.md"
fi
if [ -f "markdown-backup-20250825-134705\archived\DEVELOPMENT_STATUS.md" ]; then
  mv "markdown-backup-20250825-134705\archived\DEVELOPMENT_STATUS.md" "$BACKUP_DIR/archived/"
  echo "✓ Archived: markdown-backup-20250825-134705\archived\DEVELOPMENT_STATUS.md"
fi
if [ -f "markdown-backup-20250825-134705\archived\DEPLOYMENT_INSTRUCTIONS.md" ]; then
  mv "markdown-backup-20250825-134705\archived\DEPLOYMENT_INSTRUCTIONS.md" "$BACKUP_DIR/archived/"
  echo "✓ Archived: markdown-backup-20250825-134705\archived\DEPLOYMENT_INSTRUCTIONS.md"
fi
if [ -f "markdown-backup-20250825-134705\archived\database-migration-strategy.md" ]; then
  mv "markdown-backup-20250825-134705\archived\database-migration-strategy.md" "$BACKUP_DIR/archived/"
  echo "✓ Archived: markdown-backup-20250825-134705\archived\database-migration-strategy.md"
fi
if [ -f "markdown-backup-20250825-134705\archived\authentication-testing.md" ]; then
  mv "markdown-backup-20250825-134705\archived\authentication-testing.md" "$BACKUP_DIR/archived/"
  echo "✓ Archived: markdown-backup-20250825-134705\archived\authentication-testing.md"
fi

echo ""
echo "✅ Cleanup complete!"
echo "Files removed: 2"
echo "Files archived: 26"
echo "Backup location: $BACKUP_DIR"
echo ""
echo "📝 New consolidated documentation: CONSOLIDATED_DOCUMENTATION.md"
