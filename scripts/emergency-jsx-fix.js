#!/usr/bin/env node

/**
 * Emergency JSX Fix Script
 * Fixes the most critical JSX syntax errors that block builds
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');

// Critical files with parsing errors (from lint output)
const criticalFiles = [
  'src/pages/LandingPage.tsx',
  'src/pages/ai/DocumentAnalysisPage.tsx',
  'src/pages/auth/LoginPage.tsx',
  'src/pages/auth/OnboardingPage.tsx',
  'src/pages/auth/UnauthorizedPage.tsx',
  'src/pages/controls/ControlLibraryPage.tsx',
  'src/pages/dashboard/DaisyDashboardPage.tsx',
  'src/pages/dashboard/questionnaires/CollaborativeQuestionnairePage.tsx',
  'src/pages/probo/index.tsx',
  'src/pages/questionnaires/QuestionnairePage.tsx',
  'src/pages/reporting/ReportingPage.tsx'
];

// Common JSX fixes
const fixes = [
  {
    name: 'Fix nested DaisyBadge tags',
    find: /<DaisyBadge([^>]*)>\s*([^<]*)\s*<\/DaisyBadge>\s*<\/DaisyBadge>/g,
    replace: '<DaisyBadge$1>$2</DaisyBadge>'
  },
  {
    name: 'Fix self-closing DaisyBadge with content',
    find: /<DaisyBadge([^>]*?)>\s*([^<]+?)\s*<\/DaisyBadge>/g,
    replace: '<DaisyBadge$1>$2</DaisyBadge>'
  },
  {
    name: 'Fix missing React import',
    find: /^(?!.*import.*React)(.*jsx.*|.*tsx.*)/m,
    replace: (match, content) => {
      if (content.includes('import') && !content.includes('import React')) {
        return content.replace(/^/, 'import React from \'react\';\n');
      }
      return match;
    }
  }
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    console.log(`\n🔧 Fixing ${path.relative(projectRoot, filePath)}...`);
    
    // Apply fixes
    for (const fix of fixes) {
      const originalContent = content;
      if (typeof fix.replace === 'function') {
        content = content.replace(fix.find, fix.replace);
      } else {
        content = content.replace(fix.find, fix.replace);
      }
      
      if (content !== originalContent) {
        console.log(`   ✅ Applied: ${fix.name}`);
        modified = true;
      }
    }
    
    // Specific fixes for known problematic patterns
    
    // Fix LandingPage.tsx specific issues
    if (filePath.includes('LandingPage.tsx')) {
      // Fix the specific nested DaisyBadge at line 316-319
      const badgePattern = /<DaisyBadge className="bg-\[#191919\][^>]*>\s*Enterprise Platform\s*<\/DaisyBadge>\s*<\/DaisyBadge>/g;
      if (badgePattern.test(content)) {
        content = content.replace(badgePattern, '<DaisyBadge className="bg-[#191919] text-[#FAFAFA] px-4 py-2 mb-6 text-sm font-inter">Enterprise Platform</DaisyBadge>');
        console.log('   ✅ Fixed specific nested DaisyBadge');
        modified = true;
      }
    }
    
    // Fix unclosed motion.div tags
    const motionDivPattern = /<motion\.div([^>]*)>\s*$/gm;
    const motionDivMatches = content.match(motionDivPattern);
    if (motionDivMatches) {
      // This is complex - let's at least ensure we have matching closing tags
      const openTags = (content.match(/<motion\.div/g) || []).length;
      const closeTags = (content.match(/<\/motion\.div>/g) || []).length;
      
      if (openTags > closeTags) {
        console.log(`   ⚠️  Found ${openTags - closeTags} unclosed motion.div tags - manual fix needed`);
      }
    }
    
    // Write back if modified
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`   💾 Saved changes to ${path.basename(filePath)}`);
    } else {
      console.log(`   ➡️  No changes needed`);
    }
    
    return modified;
    
  } catch (error) {
    console.error(`   ❌ Error fixing ${filePath}: ${error.message}`);
    return false;
  }
}

function main() {
  console.log('🚨 Emergency JSX Fix - Addressing Critical Build Blockers\n');
  
  let totalFixed = 0;
  
  for (const relativePath of criticalFiles) {
    const fullPath = path.join(projectRoot, relativePath);
    
    if (fs.existsSync(fullPath)) {
      if (fixFile(fullPath)) {
        totalFixed++;
      }
    } else {
      console.log(`⚠️  File not found: ${relativePath}`);
    }
  }
  
  console.log(`\n📊 Summary: ${totalFixed} files modified`);
  
  if (totalFixed > 0) {
    console.log('\n🔄 Next steps:');
    console.log('1. Run: npm run lint:jsx');
    console.log('2. Run: npm run build:vercel');
    console.log('3. Check remaining issues and fix manually');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}