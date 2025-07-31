#!/usr/bin/env node

/**
 * JSX Validation Script
 * Validates JSX syntax errors across the codebase
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

console.log('🔍 JSX Validation Script Starting...\n');

// Configuration
const config = {
  srcPath: 'src',
  extensions: ['tsx', 'jsx'],
  eslintRules: [
    'react/jsx-closing-tag-location',
    'react/jsx-no-undef',
    'react/jsx-pascal-case',
    'react/jsx-closing-bracket-location',
    'react/jsx-tag-spacing',
    'react/jsx-no-duplicate-props',
    'react/no-unknown-property',
    'react/self-closing-comp'
  ]
};

/**
 * Find all JSX/TSX files
 */
function findJsxFiles() {
  const patterns = config.extensions.map(ext => `${config.srcPath}/**/*.${ext}`);
  let files = [];
  
  patterns.forEach(pattern => {
    files = files.concat(glob.sync(pattern));
  });
  
  return files;
}

/**
 * Check for common JSX syntax errors
 */
function validateJsxSyntax(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const errors = [];
    const lines = content.split('\n');
    
    // Check for mismatched tags
    const openTags = [];
    const tagRegex = /<(\/?)([\w.-]+)([^>]*?)(\/??)>/g;
    let match;
    
    while ((match = tagRegex.exec(content)) !== null) {
      const [fullMatch, isClosing, tagName, attributes, isSelfClosing] = match;
      const lineNumber = content.substring(0, match.index).split('\n').length;
      
      if (isClosing) {
        // Closing tag
        const lastOpen = openTags.pop();
        if (!lastOpen || lastOpen.name !== tagName) {
          errors.push({
            type: 'MISMATCHED_TAG',
            line: lineNumber,
            message: `Mismatched closing tag: expected </${lastOpen?.name || 'unknown'}>, got </${tagName}>`
          });
        }
      } else if (!isSelfClosing && !['input', 'img', 'br', 'hr', 'meta', 'link'].includes(tagName.toLowerCase())) {
        // Opening tag that should have a closing tag
        openTags.push({ name: tagName, line: lineNumber });
      }
    }
    
    // Check for unclosed tags
    openTags.forEach(tag => {
      errors.push({
        type: 'UNCLOSED_TAG',
        line: tag.line,
        message: `Unclosed tag: <${tag.name}>`
      });
    });
    
    // Check for invalid JSX attributes
    const invalidAttrRegex = /\s(class|for)=/g;
    while ((match = invalidAttrRegex.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const attr = match[1];
      const replacement = attr === 'class' ? 'className' : 'htmlFor';
      
      errors.push({
        type: 'INVALID_ATTRIBUTE',
        line: lineNumber,
        message: `Use '${replacement}' instead of '${attr}' in JSX`
      });
    }
    
    return errors;
  } catch (error) {
    return [{
      type: 'READ_ERROR',
      line: 0,
      message: `Failed to read file: ${error.message}`
    }];
  }
}

/**
 * Run ESLint on JSX files in batches to avoid command line length limits
 */
function runEslintValidation(files) {
  console.log('🔧 Running ESLint validation...');
  
  const batchSize = 50; // Process files in batches
  const allResults = [];
  
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    
    try {
      const fileList = batch.join(' ');
      const eslintCommand = `npx eslint ${fileList} --ext .tsx,.jsx --format json`;
      
      const result = execSync(eslintCommand, { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      const batchResults = JSON.parse(result);
      allResults.push(...batchResults);
    } catch (error) {
      // ESLint returns non-zero exit code when there are errors
      if (error.stdout) {
        try {
          const batchResults = JSON.parse(error.stdout);
          allResults.push(...batchResults);
        } catch (parseError) {
          console.error(`Failed to parse ESLint output for batch ${i / batchSize + 1}:`, parseError);
        }
      } else {
        console.error(`ESLint batch ${i / batchSize + 1} failed:`, error.message);
      }
    }
  }
  
  return allResults;
}

/**
 * Format and display results
 */
function displayResults(syntaxResults, eslintResults) {
  let totalErrors = 0;
  let totalWarnings = 0;
  
  console.log('📊 JSX Validation Results:\n');
  
  // Display syntax errors
  Object.entries(syntaxResults).forEach(([filePath, errors]) => {
    if (errors.length > 0) {
      console.log(`📄 ${filePath}`);
      errors.forEach(error => {
        console.log(`  ❌ Line ${error.line}: ${error.message} (${error.type})`);
        totalErrors++;
      });
      console.log('');
    }
  });
  
  // Display ESLint results
  eslintResults.forEach(result => {
    if (result.messages.length > 0) {
      console.log(`📄 ${result.filePath}`);
      result.messages.forEach(message => {
        const icon = message.severity === 2 ? '❌' : '⚠️';
        console.log(`  ${icon} Line ${message.line}:${message.column}: ${message.message} (${message.ruleId})`);
        
        if (message.severity === 2) {
          totalErrors++;
        } else {
          totalWarnings++;
        }
      });
      console.log('');
    }
  });
  
  // Summary
  console.log('📈 Summary:');
  console.log(`  Errors: ${totalErrors}`);
  console.log(`  Warnings: ${totalWarnings}`);
  
  if (totalErrors > 0) {
    console.log('\n❌ JSX validation failed! Please fix the errors above.');
    process.exit(1);
  } else if (totalWarnings > 0) {
    console.log('\n⚠️ JSX validation completed with warnings.');
  } else {
    console.log('\n✅ JSX validation passed! No issues found.');
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    // Find all JSX files
    let jsxFiles = findJsxFiles();
    console.log(`🔍 Found ${jsxFiles.length} JSX/TSX files\n`);
    
    if (jsxFiles.length === 0) {
      console.log('No JSX/TSX files found.');
      return;
    }
    
    // Test mode - limit to first 10 files if --test flag is provided
    const isTestMode = process.argv.includes('--test');
    if (isTestMode) {
      jsxFiles = jsxFiles.slice(0, 10);
      console.log(`🧪 Test mode: validating only ${jsxFiles.length} files\n`);
    }
    
    // Run syntax validation
    console.log('🧪 Running syntax validation...');
    const syntaxResults = {};
    jsxFiles.forEach(file => {
      syntaxResults[file] = validateJsxSyntax(file);
    });
    
    // Run ESLint validation
    const eslintResults = runEslintValidation(jsxFiles);
    
    // Display results
    displayResults(syntaxResults, eslintResults);
    
  } catch (error) {
    console.error('❌ JSX validation failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { validateJsxSyntax, findJsxFiles };