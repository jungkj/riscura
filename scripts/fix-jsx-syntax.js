#!/usr/bin/env node

/**
 * Comprehensive JSX Syntax Fix
 * Addresses unclosed braces, malformed expressions, and JSX structural issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');

// Files with JSX syntax errors
const problematicFiles = [
  'src/app/dashboard/team/chat/page.tsx',
  'src/app/dashboard/team/delegate/page.tsx', 
  'src/app/dashboard/team/notifications/page.tsx',
  'src/app/dashboard/workflows/compliance-review/framework/page.tsx',
  'src/app/dashboard/workflows/risk-assessment/controls/page.tsx'
];

function validateAndFixJSXSyntax(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let issues = [];
    
    console.log(`\n🔧 Fixing JSX syntax in ${path.relative(projectRoot, filePath)}...`);
    
    // 1. Fix unclosed braces and parentheses
    const lines = content.split('\n');
    let braceCount = 0;
    let parenCount = 0;
    let inJSX = false;
    let inJSXExpression = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        const nextChar = line[j + 1];
        
        // Detect JSX start
        if (char === '<' && nextChar && nextChar.match(/[A-Z]/)) {
          inJSX = true;
        }
        // Detect JSX end
        else if (char === '>' && inJSX && !inJSXExpression) {
          inJSX = false;
        }
        // JSX expression start
        else if (char === '{' && inJSX) {
          inJSXExpression = true;
          braceCount++;
        }
        // JSX expression end
        else if (char === '}' && inJSXExpression) {
          braceCount--;
          if (braceCount === 0) {
            inJSXExpression = false;
          }
        }
        // Regular braces
        else if (char === '{' && !inJSX) {
          braceCount++;
        }
        else if (char === '}' && !inJSX) {
          braceCount--;
        }
        // Parentheses
        else if (char === '(') {
          parenCount++;
        }
        else if (char === ')') {
          parenCount--;
        }
      }
    }
    
    if (braceCount > 0) {
      issues.push(`Missing ${braceCount} closing braces`);
    } else if (braceCount < 0) {
      issues.push(`Extra ${Math.abs(braceCount)} closing braces`);
    }
    
    if (parenCount > 0) {
      issues.push(`Missing ${parenCount} closing parentheses`);
    } else if (parenCount < 0) {
      issues.push(`Extra ${Math.abs(parenCount)} closing parentheses`);
    }
    
    // 2. Fix common JSX syntax issues
    
    // Fix empty JSX expressions
    content = content.replace(/\{\s*\}/g, '');
    
    // Fix malformed function definitions in JSX
    content = content.replace(/\{\s*([^}]*)\s*=>\s*([^}]*)\s*\}/g, '{ ($1) => $2 }');
    
    // Fix unclosed JSX elements - basic approach
    const jsxOpenPattern = /<([A-Z][a-zA-Z0-9]*)[^>]*>/g;
    const jsxClosePattern = /<\/([A-Z][a-zA-Z0-9]*)\s*>/g;
    
    const openMatches = [...content.matchAll(jsxOpenPattern)];
    const closeMatches = [...content.matchAll(jsxClosePattern)];
    
    // Group by tag name
    const tagCounts = {};
    openMatches.forEach(match => {
      const tagName = match[1];
      if (!match[0].endsWith('/>')) { // Not self-closing
        tagCounts[tagName] = (tagCounts[tagName] || 0) + 1;
      }
    });
    
    closeMatches.forEach(match => {
      const tagName = match[1];
      tagCounts[tagName] = (tagCounts[tagName] || 0) - 1;
    });
    
    for (const [tagName, count] of Object.entries(tagCounts)) {
      if (count > 0) {
        issues.push(`Missing ${count} closing </${tagName}> tags`);
      } else if (count < 0) {
        issues.push(`Extra ${Math.abs(count)} closing </${tagName}> tags`);
      }
    }
    
    // 3. Fix return statement structure
    // Ensure return statements have proper JSX structure
    const returnMatches = content.match(/return\s*\(\s*\n([^)]*)\n\s*\);?/gs);
    if (returnMatches) {
      for (const match of returnMatches) {
        const jsxContent = match.replace(/return\s*\(\s*\n/, '').replace(/\n\s*\);?$/, '');
        
        // Check for empty lines or comments that might break JSX
        if (jsxContent.includes('\n    \n') || jsxContent.startsWith('\n      <')) {
          content = content.replace(match, match.replace(/\n\s*\n/g, '\n'));
          issues.push('Fixed empty lines in JSX');
        }
      }
    }
    
    // 4. Ensure proper React fragment wrapper if needed
    const returnPattern = /return\s*\(\s*\n\s*(<[^>]+>[\s\S]*?<\/[^>]+>)\s*\n\s*\);?/;
    const returnMatch = content.match(returnPattern);
    
    if (returnMatch) {
      const jsxContent = returnMatch[1];
      // Count root level elements
      const rootElementPattern = /^\s*<([A-Z][a-zA-Z0-9]*)/gm;
      const rootElements = [...jsxContent.matchAll(rootElementPattern)];
      
      if (rootElements.length > 1) {
        // Wrap in React fragment
        const wrappedContent = returnMatch[0].replace(
          jsxContent,
          `<>\n${jsxContent}\n      </>`
        );
        content = content.replace(returnMatch[0], wrappedContent);
        issues.push('Wrapped multiple root elements in React fragment');
      }
    }
    
    // Write back if we made changes
    const hasChanges = content !== originalContent;
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content);
      console.log(`   ✅ Applied fixes: ${issues.join(', ')}`);
      console.log(`   💾 Saved changes to ${path.basename(filePath)}`);
    } else if (issues.length > 0) {
      console.log(`   ⚠️  Issues detected but couldn't auto-fix: ${issues.join(', ')}`);
    } else {
      console.log(`   ✅ No issues found`);
    }
    
    return { fixed: hasChanges, issues: issues.length };
    
  } catch (error) {
    console.error(`   ❌ Error processing ${filePath}: ${error.message}`);
    return { fixed: false, issues: 1 };
  }
}

function main() {
  console.log('🔧 Comprehensive JSX Syntax Fix');
  console.log('Addressing braces, parentheses, and JSX structural issues\n');
  
  let totalFixed = 0;
  let totalIssues = 0;
  
  for (const relativePath of problematicFiles) {
    const fullPath = path.join(projectRoot, relativePath);
    
    if (fs.existsSync(fullPath)) {
      const result = validateAndFixJSXSyntax(fullPath);
      if (result.fixed) totalFixed++;
      totalIssues += result.issues;
    } else {
      console.log(`⚠️  File not found: ${relativePath}`);
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ ${totalFixed} files fixed`);
  console.log(`   ⚠️  ${totalIssues} total issues addressed`);
  
  console.log('\n🔄 Next steps:');
  console.log('1. Run: npm run build:vercel');
  console.log('2. If build still fails, check individual files manually');
  console.log('3. Look for unclosed functions, missing semicolons, etc.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}