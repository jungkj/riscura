#!/bin/bash

# Comprehensive API Directory Cleanup Script
# Generated on: $(date)
# This script removes unnecessary test, debug, and duplicate API endpoints

echo "========================================="
echo "   API Directory Comprehensive Cleanup"
echo "========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create backup directory
BACKUP_DIR="api-backup-$(date +%Y%m%d-%H%M%S)"
echo -e "${BLUE}Creating backup directory: $BACKUP_DIR${NC}"
mkdir -p "$BACKUP_DIR"

# Counter for removed files
REMOVED_COUNT=0
TOTAL_SIZE_SAVED=0

# Function to safely remove a file/directory
safe_remove() {
    local path=$1
    local reason=$2
    
    if [ -e "$path" ]; then
        # Calculate size before removal
        local size=$(du -sb "$path" 2>/dev/null | cut -f1)
        TOTAL_SIZE_SAVED=$((TOTAL_SIZE_SAVED + size))
        
        # Create backup
        cp -r "$path" "$BACKUP_DIR/" 2>/dev/null
        
        # Remove the file/directory
        rm -rf "$path"
        REMOVED_COUNT=$((REMOVED_COUNT + 1))
        
        echo -e "${GREEN}✓${NC} Removed: $path"
        echo -e "  ${YELLOW}Reason: $reason${NC}"
    else
        echo -e "${YELLOW}⚠${NC} Not found: $path"
    fi
}

echo ""
echo -e "${BLUE}Starting cleanup...${NC}"
echo ""

# ============================================
# 1. Remove Test/Debug Endpoints
# ============================================
echo -e "${BLUE}1. Removing test/debug endpoints...${NC}"
echo "----------------------------------------"

safe_remove "src/app/api/test" "Test directory not needed in production"
safe_remove "src/app/api/test-auth" "Test authentication endpoint"
safe_remove "src/app/api/test-auth-direct" "Test authentication endpoint"
safe_remove "src/app/api/test-db" "Database test endpoint"
safe_remove "src/app/api/test-oauth-session" "OAuth test endpoint"
safe_remove "src/app/api/test-pooled" "Database pool test endpoint"
safe_remove "src/app/api/test-scripts" "Test scripts directory"
safe_remove "src/app/api/test-set-cookie" "Cookie test endpoint"
safe_remove "src/app/api/test-workaround" "Test workaround endpoint"

safe_remove "src/app/api/debug" "Debug directory not needed in production"
safe_remove "src/app/api/debug-db-url" "Database debug endpoint"
safe_remove "src/app/api/debug-oauth-session" "OAuth debug endpoint"

safe_remove "src/app/api/check-env" "Environment check endpoint"
safe_remove "src/app/api/check-all-env" "Environment check endpoint"
safe_remove "src/app/api/check-user" "User check debug endpoint"
safe_remove "src/app/api/env-check" "Environment check endpoint"

safe_remove "src/app/api/demo" "Demo endpoint not needed"

# ============================================
# 2. Remove Duplicate Auth Implementations
# ============================================
echo ""
echo -e "${BLUE}2. Removing duplicate auth implementations...${NC}"
echo "---------------------------------------------"

safe_remove "src/app/api/auth-test" "Duplicate test auth implementation"
safe_remove "src/app/api/auth-safe" "Duplicate safe auth implementation"
safe_remove "src/app/api/auth-diagnostics" "Auth diagnostics debug endpoint"

# ============================================
# 3. Remove Duplicate OAuth Implementations
# ============================================
echo ""
echo -e "${BLUE}3. Consolidating OAuth implementations...${NC}"
echo "-----------------------------------------"

# Keep only one OAuth implementation - decide which one is primary
# Remove duplicates:
safe_remove "src/app/api/auth/google" "Duplicate - using google-oauth implementation"
safe_remove "src/app/api/auth/callback/google" "Duplicate - using google-oauth/callback"

# Remove Google OAuth debug endpoint in production
if [ "$NODE_ENV" = "production" ]; then
    safe_remove "src/app/api/google-oauth/debug" "Debug endpoint not needed in production"
fi

# ============================================
# 4. Remove Unnecessary Session Check Endpoints
# ============================================
echo ""
echo -e "${BLUE}4. Removing redundant session endpoints...${NC}"
echo "------------------------------------------"

safe_remove "src/app/api/auth/session-check" "Redundant - use /api/auth/session"

# ============================================
# 5. Clean up empty directories
# ============================================
echo ""
echo -e "${BLUE}5. Cleaning up empty directories...${NC}"
echo "------------------------------------"

find src/app/api -type d -empty -delete 2>/dev/null
echo -e "${GREEN}✓${NC} Empty directories removed"

# ============================================
# Summary
# ============================================
echo ""
echo "========================================="
echo -e "${GREEN}       Cleanup Complete!${NC}"
echo "========================================="
echo ""
echo -e "Files/directories removed: ${GREEN}$REMOVED_COUNT${NC}"
echo -e "Space saved: ${GREEN}$(echo "scale=2; $TOTAL_SIZE_SAVED / 1024" | bc) KB${NC}"
echo -e "Backup location: ${BLUE}$BACKUP_DIR${NC}"
echo ""
echo -e "${YELLOW}⚠️  Important Notes:${NC}"
echo "1. Review the backup directory before deleting it"
echo "2. Test your application thoroughly after cleanup"
echo "3. Update any references to removed endpoints"
echo "4. Consider adding these paths to .gitignore:"
echo "   - src/app/api/test*"
echo "   - src/app/api/debug*"
echo "   - src/app/api/check-*"
echo ""

# Create a restore script
cat > "$BACKUP_DIR/restore.sh" << 'EOF'
#!/bin/bash
# Restore script for API cleanup
echo "Restoring API files from backup..."
cp -r * ../../src/app/api/
echo "Restore complete!"
EOF

chmod +x "$BACKUP_DIR/restore.sh"
echo -e "${BLUE}Restore script created: $BACKUP_DIR/restore.sh${NC}"