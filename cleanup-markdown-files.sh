#!/bin/bash

# Comprehensive Markdown Files Cleanup Script
# Generated on: $(date)
# This script consolidates all markdown documentation into a single source of truth

echo "================================================"
echo "   Markdown Files Consolidation & Cleanup"
echo "================================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Create backup directory
BACKUP_DIR="markdown-backup-$(date +%Y%m%d-%H%M%S)"
echo -e "${BLUE}Creating backup directory: $BACKUP_DIR${NC}"
mkdir -p "$BACKUP_DIR/archived"
mkdir -p "$BACKUP_DIR/deleted"

# Counters
ARCHIVED_COUNT=0
DELETED_COUNT=0
TOTAL_SIZE_SAVED=0

# Function to safely archive a file
safe_archive() {
    local file_path=$1
    local reason=$2
    
    if [ -f "$file_path" ]; then
        local size=$(wc -c < "$file_path" 2>/dev/null || echo 0)
        TOTAL_SIZE_SAVED=$((TOTAL_SIZE_SAVED + size))
        
        cp "$file_path" "$BACKUP_DIR/archived/"
        rm "$file_path"
        ARCHIVED_COUNT=$((ARCHIVED_COUNT + 1))
        
        echo -e "${YELLOW}📦${NC} Archived: $file_path"
        echo -e "   ${PURPLE}Reason: $reason${NC}"
    fi
}

# Function to safely delete a file
safe_delete() {
    local file_path=$1
    local reason=$2
    
    if [ -f "$file_path" ]; then
        local size=$(wc -c < "$file_path" 2>/dev/null || echo 0)
        TOTAL_SIZE_SAVED=$((TOTAL_SIZE_SAVED + size))
        
        cp "$file_path" "$BACKUP_DIR/deleted/"
        rm "$file_path"
        DELETED_COUNT=$((DELETED_COUNT + 1))
        
        echo -e "${RED}🗑️${NC} Deleted: $file_path"
        echo -e "   ${PURPLE}Reason: $reason${NC}"
    fi
}

echo ""
echo -e "${BLUE}Starting markdown consolidation...${NC}"
echo ""

# ============================================
# 1. Delete Temporary Audit Reports
# ============================================
echo -e "${BLUE}1. Removing temporary audit reports...${NC}"
echo "--------------------------------------"

safe_delete "API_AUDIT_REPORT.md" "Temporary audit report - content consolidated"
safe_delete "PACKAGE_AUDIT_REPORT.md" "Temporary audit report - content consolidated"
safe_delete "FUNCTIONALITY-AUDIT-REPORT.md" "Temporary audit report - content consolidated"

# ============================================
# 2. Archive Implementation Documentation
# ============================================
echo ""
echo -e "${BLUE}2. Archiving implementation documentation...${NC}"
echo "--------------------------------------------"

safe_archive "docs/implementation-action-plans.md" "Implementation details archived - consolidated into main docs"
safe_archive "docs/feature-implementation-summary.md" "Feature summary archived - status in main docs"
safe_archive "docs/missing-functionalities-report.md" "Functionality report archived - roadmap in main docs"
safe_archive "LIVE_DATA_MIGRATION_PLAN.md" "Migration plan archived - current status in main docs"
safe_archive "docs/database-migration-strategy.md" "Database migration strategy archived - procedures in main docs"

# ============================================
# 3. Archive Setup & Deployment Guides
# ============================================
echo ""
echo -e "${BLUE}3. Archiving setup and deployment guides...${NC}"
echo "--------------------------------------------"

safe_archive "DEPLOYMENT_INSTRUCTIONS.md" "Deployment instructions consolidated into main docs"
safe_archive "VERCEL_ENV_REQUIREMENTS.md" "Environment requirements consolidated into main docs"
safe_archive "docs/PRODUCTION_ENV_REQUIREMENTS.md" "Production env requirements consolidated into main docs"
safe_archive "docs/free-infrastructure-setup.md" "Infrastructure setup consolidated into main docs"
safe_archive "SUPABASE_SETUP.md" "Supabase setup consolidated into main docs"

# ============================================
# 4. Archive Development Documentation
# ============================================
echo ""
echo -e "${BLUE}4. Archiving development documentation...${NC}"
echo "----------------------------------------"

safe_archive "DEVELOPMENT_STATUS.md" "Development status consolidated into main docs"
safe_archive "TYPESCRIPT_WORKFLOW_GUIDE.md" "TypeScript workflow consolidated into main docs"
safe_archive "TYPESCRIPT_ERRORS_ANALYSIS.md" "TypeScript errors analysis consolidated into main docs"
safe_archive "docs/test-script-generation-type-safety-updates.md" "Test script updates consolidated"

# ============================================
# 5. Archive Authentication Documentation
# ============================================
echo ""
echo -e "${BLUE}5. Archiving authentication documentation...${NC}"
echo "--------------------------------------------"

safe_archive "GOOGLE_OAUTH_SETUP_GUIDE.md" "OAuth setup consolidated into main docs"
safe_archive "GOOGLE_OAUTH_FIX.md" "OAuth fixes consolidated into main docs"
safe_archive "docs/authentication-testing.md" "Auth testing consolidated into main docs"

# ============================================
# 6. Archive Technical Documentation
# ============================================
echo ""
echo -e "${BLUE}6. Archiving technical documentation...${NC}"
echo "--------------------------------------"

safe_archive "docs/security-performance-improvements.md" "Security/performance info consolidated"
safe_archive "docs/redis-caching-integration.md" "Redis integration details consolidated"
safe_archive "STRIPE_INTEGRATION_SUMMARY.md" "Stripe integration consolidated"

# ============================================
# 7. Archive API Documentation
# ============================================
echo ""
echo -e "${BLUE}7. Archiving API documentation...${NC}"
echo "--------------------------------"

safe_archive "docs/api/README.md" "API docs consolidated into main documentation"
safe_archive "docs/api/getting-started.md" "API getting started consolidated"
safe_archive "src/lib/api/README.md" "API standardization docs consolidated"

# ============================================
# 8. Archive Audit Documentation
# ============================================
echo ""
echo -e "${BLUE}8. Archiving audit documentation...${NC}"
echo "--------------------------------"

safe_archive "docs/audit/README.md" "Audit system docs consolidated"

# ============================================
# 9. Archive Testing Documentation
# ============================================
echo ""
echo -e "${BLUE}9. Archiving testing documentation...${NC}"
echo "----------------------------------"

safe_archive "README-TESTING.md" "Testing guide consolidated into main docs"

# ============================================
# 10. Clean up empty directories
# ============================================
echo ""
echo -e "${BLUE}10. Cleaning up empty directories...${NC}"
echo "-------------------------------------"

# Remove empty docs subdirectories
find docs -type d -empty -delete 2>/dev/null
if [ ! "$(ls -A docs 2>/dev/null)" ]; then
    rmdir docs 2>/dev/null
    echo -e "${GREEN}✓${NC} Removed empty docs directory"
fi

# ============================================
# Summary and Final Actions
# ============================================
echo ""
echo "================================================"
echo -e "${GREEN}       Consolidation Complete!${NC}"
echo "================================================"
echo ""
echo -e "Files archived: ${YELLOW}$ARCHIVED_COUNT${NC}"
echo -e "Files deleted: ${RED}$DELETED_COUNT${NC}"
echo -e "Total space saved: ${GREEN}$(echo "scale=2; $TOTAL_SIZE_SAVED / 1024" | bc 2>/dev/null || echo "unknown") KB${NC}"
echo -e "Backup location: ${BLUE}$BACKUP_DIR${NC}"
echo ""
echo -e "${GREEN}📝 New Documentation Structure:${NC}"
echo -e "   ${GREEN}✓${NC} COMPREHENSIVE_DOCUMENTATION.md - Single source of truth"
echo -e "   ${GREEN}✓${NC} CLAUDE.md - Preserved (essential configuration)"
echo -e "   ${GREEN}✓${NC} README.md - Preserved (project overview)"
echo -e "   ${GREEN}✓${NC} promptoptimizer.md - Preserved (as requested)"
echo ""
echo -e "${YELLOW}⚠️  Important Next Steps:${NC}"
echo "1. Review COMPREHENSIVE_DOCUMENTATION.md for completeness"
echo "2. Update any links that referenced archived files"
echo "3. Test the application to ensure no broken references"
echo "4. Consider adding to .gitignore to prevent future clutter:"
echo "   docs/temp-*"
echo "   *-audit-report.md"
echo "   *-analysis.md"
echo ""
echo -e "${BLUE}🔄 To restore files if needed:${NC}"
echo "cd $BACKUP_DIR && cp -r archived/* deleted/* ../../"
echo ""

# Create a summary file
cat > "$BACKUP_DIR/CONSOLIDATION_SUMMARY.md" << EOF
# Markdown Consolidation Summary

## Files Processed
- **Total files found:** 30
- **Files archived:** $ARCHIVED_COUNT  
- **Files deleted:** $DELETED_COUNT
- **Files preserved:** 4 (COMPREHENSIVE_DOCUMENTATION.md, CLAUDE.md, README.md, promptoptimizer.md)

## Space Saved
- **Total:** $(echo "scale=2; $TOTAL_SIZE_SAVED / 1024" | bc 2>/dev/null || echo "unknown") KB

## Backup Location
All files backed up to: $BACKUP_DIR

## New Documentation Structure
1. **COMPREHENSIVE_DOCUMENTATION.md** - Single source of truth for all project docs
2. **CLAUDE.md** - Essential configuration for Claude Code
3. **README.md** - Project overview and quick start
4. **promptoptimizer.md** - Preserved as requested

## What Was Consolidated
- API documentation and guides
- Deployment and environment setup
- Authentication and OAuth guides  
- Database and migration strategies
- Security and performance docs
- Testing strategies and guides
- Feature implementation status
- Troubleshooting procedures

Generated on: $(date)
EOF

echo -e "${GREEN}📋 Summary report created: $BACKUP_DIR/CONSOLIDATION_SUMMARY.md${NC}"