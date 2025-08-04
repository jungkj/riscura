#!/usr/bin/env node

/**
 * JSX Syntax Diagnostic Script
 * Quickly identifies the most critical JSX syntax errors blocking builds
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const srcDir = path.join(projectRoot, 'src');

// Critical JSX error patterns that block builds
const criticalPatterns = [
  {
    name: 'Unclosed JSX Tags',
    regex: /<([a-zA-Z][a-zA-Z0-9]*)[^>]*(?<!\/|>)$/gm,
    severity: 'CRITICAL',
    description: 'JSX tags that are not properly closed'
  },
  {
    name: 'Missing React Import',
    regex: /^(?!.*import.*React).*(<[A-Z][a-zA-Z0-9]*|jsx)/m,
    severity: 'HIGH',
    description: 'Files using JSX without importing React'
  },
  {
    name: 'Invalid JSX Syntax',
    regex: /<[^>]*[^\/]>\s*<\/[^>]*>/g,
    severity: 'MEDIUM',
    description: 'Potentially malformed JSX elements'
  },
  {
    name: 'Unescaped Curly Braces',
    regex: /\{[^}]*\{[^}]*\}/g,
    severity: 'MEDIUM',
    description: 'Nested curly braces that may cause parsing issues'
  }
];

// Get all TSX/JSX files
function getAllFiles(dir, extensions = ['.tsx', '.jsx']) {
  const files = [];
  
  function scanDirectory(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scanDirectory(fullPath);
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  scanDirectory(dir);
  return files;
}

// Analyze a single file for JSX issues
function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    for (const pattern of criticalPatterns) {
      const matches = content.match(pattern.regex);
      if (matches) {
        issues.push({
          pattern: pattern.name,
          severity: pattern.severity,
          description: pattern.description,
          matches: matches.length,
          samples: matches.slice(0, 3) // Show first 3 matches
        });
      }
    }
    
    return issues;
  } catch (error) {
    return [{
      pattern: 'File Read Error',
      severity: 'CRITICAL',
      description: `Cannot read file: ${error.message}`,
      matches: 1,
      samples: []
    }];
  }
}

// Main execution
function runDiagnostic() {
  console.log('🔍 Running JSX Syntax Diagnostic...\n');
  
  const files = getAllFiles(srcDir);
  console.log(`Found ${files.length} TSX/JSX files to analyze\n`);
  
  const results = {};
  let totalIssues = 0;
  
  for (const file of files) {
    const issues = analyzeFile(file);
    if (issues.length > 0) {
      const relativePath = path.relative(projectRoot, file);
      results[relativePath] = issues;
      totalIssues += issues.reduce((sum, issue) => sum + issue.matches, 0);
    }
  }
  
  // Report results
  if (totalIssues === 0) {
    console.log('✅ No critical JSX syntax errors found!');
    return;
  }
  
  console.log(`🚨 Found ${totalIssues} potential JSX issues in ${Object.keys(results).length} files\n`);
  
  // Sort files by severity and issue count
  const sortedFiles = Object.entries(results).sort(([, a], [, b]) => {
    const severityWeight = { CRITICAL: 3, HIGH: 2, MEDIUM: 1 };
    const aWeight = a.reduce((sum, issue) => sum + (severityWeight[issue.severity] || 0) * issue.matches, 0);
    const bWeight = b.reduce((sum, issue) => sum + (severityWeight[issue.severity] || 0) * issue.matches, 0);
    return bWeight - aWeight;
  });
  
  // Show top 10 most problematic files
  console.log('📋 Top files requiring immediate attention:\n');
  
  for (const [filePath, issues] of sortedFiles.slice(0, 10)) {
    console.log(`📄 ${filePath}`);
    
    for (const issue of issues) {
      const severity = issue.severity === 'CRITICAL' ? '🔴' : 
                     issue.severity === 'HIGH' ? '🟡' : '🟠';
      console.log(`  ${severity} ${issue.pattern}: ${issue.matches} issues`);
      console.log(`     ${issue.description}`);
      
      if (issue.samples.length > 0) {
        console.log(`     Sample: ${issue.samples[0].substring(0, 80)}...`);
      }
    }
    console.log();
  }
  
  // Generate quick fix commands
  console.log('🛠️  Quick Fix Commands:\n');
  console.log('1. Run ESLint with JSX rules:');
  console.log('   npm run lint:jsx');
  console.log();
  console.log('2. Run comprehensive JSX validation:');
  console.log('   npm run lint:validate-jsx');
  console.log();
  console.log('3. Auto-fix JSX issues:');
  console.log('   npm run lint:fix');
  console.log();
  console.log('4. Build with memory optimization:');
  console.log('   npm run build:vercel');
  console.log();
  
  // Exit with error code if critical issues found
  const criticalIssues = Object.values(results).flat()
    .filter(issue => issue.severity === 'CRITICAL')
    .reduce((sum, issue) => sum + issue.matches, 0);
    
  if (criticalIssues > 0) {
    console.log(`❌ ${criticalIssues} CRITICAL issues found that will block builds`);
    process.exit(1);
  } else {
    console.log('ℹ️  No critical build-blocking issues found');
    process.exit(0);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDiagnostic();
}