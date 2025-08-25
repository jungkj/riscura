#!/bin/bash
# API Cleanup Script
# Generated on 2025-08-25T17:30:01.835Z

echo "🧹 Cleaning up API directory..."
echo "This will remove 4 files"
echo ""

# Create backup directory
BACKUP_DIR="api-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Files to remove

# Debug endpoint for environment checking
if [ -f "src/app/api/check-env\route.ts" ]; then
  cp "src/app/api/check-env\route.ts" "$BACKUP_DIR/check-env\route.ts"
  rm "src/app/api/check-env\route.ts"
  echo "✓ Removed: check-env\route.ts"
fi

# Debug endpoint for environment checking
if [ -f "src/app/api/check-all-env\route.ts" ]; then
  cp "src/app/api/check-all-env\route.ts" "$BACKUP_DIR/check-all-env\route.ts"
  rm "src/app/api/check-all-env\route.ts"
  echo "✓ Removed: check-all-env\route.ts"
fi

# Duplicate/test auth endpoint
if [ -f "src/app/api/auth-test\[...nextauth]\route.ts" ]; then
  cp "src/app/api/auth-test\[...nextauth]\route.ts" "$BACKUP_DIR/auth-test\[...nextauth]\route.ts"
  rm "src/app/api/auth-test\[...nextauth]\route.ts"
  echo "✓ Removed: auth-test\[...nextauth]\route.ts"
fi

# Duplicate/test auth endpoint
if [ -f "src/app/api/auth-safe\[...nextauth]\route.ts" ]; then
  cp "src/app/api/auth-safe\[...nextauth]\route.ts" "$BACKUP_DIR/auth-safe\[...nextauth]\route.ts"
  rm "src/app/api/auth-safe\[...nextauth]\route.ts"
  echo "✓ Removed: auth-safe\[...nextauth]\route.ts"
fi

echo ""
echo "✅ Cleanup complete!"
echo "Backup created in: $BACKUP_DIR"
