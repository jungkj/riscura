#!/usr/bin/env node

/**
 * Fix ProtectedRoute JSX Syntax Issues
 * Addresses JSX syntax errors in files using ProtectedRoute
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');

// Files with ProtectedRoute JSX errors
const problematicFiles = [
  'src/app/dashboard/team/chat/page.tsx',
  'src/app/dashboard/team/delegate/page.tsx', 
  'src/app/dashboard/team/notifications/page.tsx',
  'src/app/dashboard/workflows/compliance-review/framework/page.tsx',
  'src/app/dashboard/workflows/risk-assessment/controls/page.tsx'
];

function fixJSXSyntax(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let modified = false;
    
    console.log(`\n🔧 Fixing ${path.relative(projectRoot, filePath)}...`);
    
    // Fix common JSX issues
    
    // 1. Fix missing React import (just in case)
    if (!content.includes('import React') && content.includes('jsx')) {
      content = 'import React from \'react\';\n' + content;
      console.log('   ✅ Added React import');
      modified = true;
    }
    
    // 2. Fix JSX expressions that must have one parent element
    // Look for multiple root elements after return statement
    const returnPattern = /return\s*\(\s*\n([^}]+)\n\s*\);?/gs;
    const matches = content.match(returnPattern);
    
    if (matches) {
      for (const match of matches) {
        // Check if there are multiple root elements
        const jsxPart = match.replace(/return\s*\(\s*\n/, '').replace(/\n\s*\);?$/, '');
        
        // Count JSX elements at root level (simplified check)
        const rootElements = jsxPart.match(/<[A-Z][a-zA-Z0-9]*[^>]*>/g);
        if (rootElements && rootElements.length > 1) {
          console.log('   ⚠️  Multiple root elements detected - may need manual fixing');
        }
      }
    }
    
    // 3. Fix unclosed JSX tags - basic approach
    const openTags = content.match(/<([A-Z][a-zA-Z0-9]*)[^>]*>/g) || [];
    const closeTags = content.match(/<\/([A-Z][a-zA-Z0-9]*)\s*>/g) || [];
    
    if (openTags.length !== closeTags.length) {
      console.log(`   ⚠️  Tag mismatch: ${openTags.length} open, ${closeTags.length} close tags`);
    }
    
    // 4. Fix specific syntax issues
    
    // Fix malformed JSX expressions
    content = content.replace(/\{\s*\n\s*([^}]*)\s*\n\s*\}/g, '{ $1 }');
    if (content !== originalContent) {
      console.log('   ✅ Fixed malformed JSX expressions');
      modified = true;
    }
    
    // Fix missing closing braces
    let braceCount = 0;
    let inJSX = false;
    let needsBracefix = false;
    
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      if (char === '<' && content[i + 1] && content[i + 1].match(/[A-Z]/)) {
        inJSX = true;
      } else if (char === '>' && inJSX) {
        inJSX = false;
      } else if (char === '{' && !inJSX) {
        braceCount++;
      } else if (char === '}' && !inJSX) {
        braceCount--;
      }
    }
    
    if (braceCount > 0) {
      console.log(`   ⚠️  ${braceCount} unclosed braces detected`);
      needsBracefix = true;
    }
    
    // 5. Ensure proper JSX component structure
    // Make sure ProtectedRoute has proper closing tag
    const protectedRoutePattern = /<ProtectedRoute[^>]*>/g;
    const protectedRouteClosePattern = /<\/ProtectedRoute>/g;
    
    const openProtected = (content.match(protectedRoutePattern) || []).length;
    const closeProtected = (content.match(protectedRouteClosePattern) || []).length;
    
    if (openProtected !== closeProtected) {
      console.log(`   ⚠️  ProtectedRoute tags mismatch: ${openProtected} open, ${closeProtected} close`);
    }
    
    // Write back if we made basic modifications
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`   💾 Applied basic fixes to ${path.basename(filePath)}`);
    } else {
      console.log(`   ℹ️  No automatic fixes applied - may need manual review`);
    }
    
    return { modified, needsManualReview: needsBracefix || openProtected !== closeProtected };
    
  } catch (error) {
    console.error(`   ❌ Error processing ${filePath}: ${error.message}`);
    return { modified: false, needsManualReview: true };
  }
}

function main() {
  console.log('🔧 Fixing ProtectedRoute JSX Syntax Issues\n');
  
  let totalFixed = 0;
  let manualReviewNeeded = 0;
  
  for (const relativePath of problematicFiles) {
    const fullPath = path.join(projectRoot, relativePath);
    
    if (fs.existsSync(fullPath)) {
      const result = fixJSXSyntax(fullPath);
      if (result.modified) totalFixed++;
      if (result.needsManualReview) manualReviewNeeded++;
    } else {
      console.log(`⚠️  File not found: ${relativePath}`);
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ ${totalFixed} files automatically fixed`);
  console.log(`   ⚠️  ${manualReviewNeeded} files need manual review`);
  
  console.log('\n🔄 Next steps:');
  console.log('1. Review files that need manual fixes');
  console.log('2. Run: npm run type-check:full');
  console.log('3. Run: npm run build:vercel');
  
  if (manualReviewNeeded > 0) {
    console.log('\n⚠️  Some files have complex JSX issues that require manual fixing');
    console.log('   Common issues to check:');
    console.log('   - Unclosed JSX tags');
    console.log('   - Multiple root elements without wrapper');
    console.log('   - Missing closing braces in JSX expressions');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}