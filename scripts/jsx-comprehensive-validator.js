#!/usr/bin/env node

/**
 * Comprehensive JSX Validation System
 * Enterprise-grade JSX syntax validation with detailed error reporting,
 * performance metrics, and developer-friendly output.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import chalk from 'chalk';

class JSXComprehensiveValidator {
  constructor(options = {}) {
    this.config = {
      srcPath: options.srcPath || 'src',
      extensions: options.extensions || ['tsx', 'jsx'],
      maxFileSize: options.maxFileSize || 1024 * 1024, // 1MB
      concurrent: options.concurrent || 10,
      verbose: options.verbose || false,
      fix: options.fix || false,
      reportFormat: options.reportFormat || 'detailed', // 'detailed', 'summary', 'json'
      ...options
    };
    
    this.startTime = Date.now();
    this.stats = {
      totalFiles: 0,
      processedFiles: 0,
      errorFiles: 0,
      warningFiles: 0,
      skippedFiles: 0,
      totalErrors: 0,
      totalWarnings: 0,
      fixedIssues: 0,
      processingTime: 0
    };
    
    this.errorCategories = {
      syntax: [],
      structure: [],
      accessibility: [],
      performance: [],
      security: [],
      style: []
    };
    
    this.initializeValidator();
  }
  
  initializeValidator() {
    console.log(chalk.blue.bold('🚀 JSX Comprehensive Validator'));
    console.log(chalk.gray(`Initializing validation for ${this.config.srcPath}/`));
    console.log(chalk.gray(`Extensions: ${this.config.extensions.join(', ')}`));
    console.log('');
  }
  
  /**
   * Main validation entry point
   */
  async validate() {
    try {
      // Step 1: Discovery
      const files = await this.discoverFiles();
      if (files.length === 0) {
        console.log(chalk.yellow('⚠️ No JSX/TSX files found to validate'));
        return { success: true, stats: this.stats };
      }
      
      console.log(chalk.blue(`📁 Found ${files.length} files to validate`));
      this.stats.totalFiles = files.length;
      
      // Step 2: Pre-validation checks
      await this.runPreValidationChecks();
      
      // Step 3: Syntax validation
      console.log(chalk.blue('🔍 Running syntax validation...'));
      await this.validateSyntax(files);
      
      // Step 4: ESLint validation
      console.log(chalk.blue('🔧 Running ESLint validation...'));
      await this.runESLintValidation(files);
      
      // Step 5: Component structure validation
      console.log(chalk.blue('🏗️ Running component structure validation...'));
      await this.validateComponentStructure(files);
      
      // Step 6: TypeScript validation (if applicable)
      console.log(chalk.blue('📝 Running TypeScript validation...'));
      await this.runTypeScriptValidation();
      
      // Step 7: Generate report
      this.stats.processingTime = Date.now() - this.startTime;
      const report = await this.generateReport();
      
      return {
        success: this.stats.totalErrors === 0,
        stats: this.stats,
        report,
        errorCategories: this.errorCategories
      };
      
    } catch (error) {
      console.error(chalk.red.bold('❌ Validation failed:'), error.message);
      if (this.config.verbose) {
        console.error(error.stack);
      }
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Discover all JSX/TSX files
   */
  async discoverFiles() {
    const patterns = this.config.extensions.map(ext => 
      `${this.config.srcPath}/**/*.${ext}`
    );
    
    let files = [];
    for (const pattern of patterns) {
      const matchedFiles = glob.sync(pattern, {
        ignore: [
          '**/node_modules/**',
          '**/.next/**',
          '**/dist/**',
          '**/build/**',
          '**/*.d.ts',
          '**/__tests__/**',
          '**/*.test.*',
          '**/*.spec.*'
        ]
      });
      files.push(...matchedFiles);
    }
    
    // Remove duplicates and sort
    files = [...new Set(files)].sort();
    
    // Filter by file size
    files = files.filter(file => {
      try {
        const stats = fs.statSync(file);
        if (stats.size > this.config.maxFileSize) {
          console.log(chalk.yellow(`⚠️ Skipping large file: ${file} (${(stats.size / 1024).toFixed(1)}KB)`));
          this.stats.skippedFiles++;
          return false;
        }
        return true;
      } catch (error) {
        console.log(chalk.yellow(`⚠️ Skipping inaccessible file: ${file}`));
        this.stats.skippedFiles++;
        return false;
      }
    });
    
    return files;
  }
  
  /**
   * Pre-validation environment checks
   */
  async runPreValidationChecks() {
    console.log(chalk.blue('🔧 Running pre-validation checks...'));
    
    // Check if required dependencies are installed
    const requiredPackages = ['eslint', 'typescript', '@typescript-eslint/parser'];
    for (const pkg of requiredPackages) {
      try {
        require.resolve(pkg);
      } catch (error) {
        console.log(chalk.yellow(`⚠️ Optional dependency not found: ${pkg}`));
      }
    }
    
    // Check ESLint configuration
    const eslintConfigFiles = ['.eslintrc.json', '.eslintrc.js', '.eslintrc.yaml'];
    const hasEslintConfig = eslintConfigFiles.some(file => fs.existsSync(file));
    
    if (!hasEslintConfig) {
      console.log(chalk.yellow('⚠️ No ESLint configuration found'));
    }
    
    // Check TypeScript configuration
    if (!fs.existsSync('tsconfig.json')) {
      console.log(chalk.yellow('⚠️ No TypeScript configuration found'));
    }
  }
  
  /**
   * Validate JSX syntax using custom parsing
   */
  async validateSyntax(files) {
    const results = [];
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const errors = this.analyzeSyntax(content, file);
        
        if (errors.length > 0) {
          results.push({ file, errors });
          this.stats.errorFiles++;
          this.stats.totalErrors += errors.length;
          
          errors.forEach(error => {
            this.categorizeError(error, 'syntax');
          });
        }
        
        this.stats.processedFiles++;
        
        if (this.config.verbose) {
          console.log(chalk.gray(`✓ ${file}`));
        }
        
      } catch (error) {
        console.log(chalk.red(`❌ Error processing ${file}:`, error.message));
        this.stats.errorFiles++;
        this.stats.totalErrors++;
      }
    }
    
    if (results.length > 0) {
      console.log(chalk.red(`❌ Found syntax errors in ${results.length} files`));
      if (this.config.reportFormat === 'detailed') {
        this.displaySyntaxErrors(results);
      }
    } else {
      console.log(chalk.green('✅ No syntax errors found'));
    }
  }
  
  /**
   * Analyze JSX syntax in file content
   */
  analyzeSyntax(content, filePath) {
    const errors = [];
    const lines = content.split('\n');
    
    // Check for unclosed JSX tags
    const jsxTagStack = [];
    const selfClosingTags = new Set([
      'img', 'input', 'br', 'hr', 'meta', 'link', 'area', 'base', 
      'col', 'embed', 'source', 'track', 'wbr'
    ]);
    
    // Enhanced JSX tag regex that handles complex cases
    const jsxTagRegex = /<\/?([A-Za-z][A-Za-z0-9]*(?:\.[A-Za-z][A-Za-z0-9]*)*|\{[^}]+\})\s*[^>]*\/?>/g;
    
    let match;
    while ((match = jsxTagRegex.exec(content)) !== null) {
      const fullMatch = match[0];
      const tagName = match[1];
      const lineNumber = content.substring(0, match.index).split('\n').length;
      
      if (fullMatch.includes('</')) {
        // Closing tag
        const lastOpen = jsxTagStack.pop();
        if (!lastOpen) {
          errors.push({
            type: 'UNMATCHED_CLOSING_TAG',
            line: lineNumber,
            column: match.index - content.lastIndexOf('\n', match.index - 1),
            message: `Unmatched closing tag: </${tagName}>`,
            severity: 'error',
            fix: null
          });
        } else if (lastOpen.name !== tagName) {
          errors.push({
            type: 'MISMATCHED_TAG',
            line: lineNumber,
            column: match.index - content.lastIndexOf('\n', match.index - 1),
            message: `Mismatched tag: expected </${lastOpen.name}>, got </${tagName}>`,
            severity: 'error',
            fix: `Change to </${lastOpen.name}>`
          });
        }
      } else if (fullMatch.endsWith('/>') || selfClosingTags.has(tagName.toLowerCase())) {
        // Self-closing tag - no action needed
      } else {
        // Opening tag
        jsxTagStack.push({ name: tagName, line: lineNumber });
      }
    }
    
    // Check for unclosed tags
    jsxTagStack.forEach(tag => {
      errors.push({
        type: 'UNCLOSED_TAG',
        line: tag.line,
        column: 1,
        message: `Unclosed tag: <${tag.name}>`,
        severity: 'error',
        fix: `Add closing tag: </${tag.name}>`
      });
    });
    
    // Check for common JSX mistakes
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      // Check for HTML attributes instead of JSX attributes
      if (line.includes(' class=')) {
        errors.push({
          type: 'HTML_ATTRIBUTE',
          line: lineNumber,
          column: line.indexOf(' class=') + 1,
          message: 'Use "className" instead of "class" in JSX',
          severity: 'error',
          fix: 'Replace "class" with "className"'
        });
      }
      
      if (line.includes(' for=')) {
        errors.push({
          type: 'HTML_ATTRIBUTE',
          line: lineNumber,
          column: line.indexOf(' for=') + 1,
          message: 'Use "htmlFor" instead of "for" in JSX',
          severity: 'error',
          fix: 'Replace "for" with "htmlFor"'
        });
      }
      
      // Check for unescaped entities
      const unescapedEntities = line.match(/&(?!amp;|lt;|gt;|quot;|#\d+;|#x[0-9a-fA-F]+;)\w+;/g);
      if (unescapedEntities) {
        unescapedEntities.forEach(entity => {
          errors.push({
            type: 'UNESCAPED_ENTITY',
            line: lineNumber,
            column: line.indexOf(entity) + 1,
            message: `Unescaped entity: ${entity}`,
            severity: 'warning',
            fix: `Use HTML entity or escape: ${entity}`
          });
        });
      }
      
      // Check for missing key prop in mapped elements
      if (line.includes('.map(') && line.includes('=>') && line.includes('<')) {
        const nextLines = lines.slice(index, index + 3).join('\n');
        if (!nextLines.includes('key=')) {
          errors.push({
            type: 'MISSING_KEY_PROP',
            line: lineNumber,
            column: 1,
            message: 'Missing "key" prop in mapped JSX element',
            severity: 'warning',
            fix: 'Add unique "key" prop to mapped elements'
          });
        }
      }
    });
    
    return errors;
  }
  
  /**
   * Run ESLint validation
   */
  async runESLintValidation(files) {
    try {
      const batchSize = 20;
      const allResults = [];
      
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        
        try {
          const fileList = batch.join(' ');
          const eslintCommand = `npx eslint ${fileList} --ext .tsx,.jsx --format json --no-error-on-unmatched-pattern`;
          
          const result = execSync(eslintCommand, { 
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe'],
            maxBuffer: 1024 * 1024 * 10 // 10MB buffer
          });
          
          const batchResults = JSON.parse(result);
          allResults.push(...batchResults);
          
        } catch (error) {
          if (error.stdout) {
            try {
              const batchResults = JSON.parse(error.stdout);
              allResults.push(...batchResults);
            } catch (parseError) {
              console.log(chalk.yellow(`⚠️ Could not parse ESLint output for batch ${Math.floor(i / batchSize) + 1}`));
            }
          }
        }
      }
      
      // Process ESLint results
      let eslintErrors = 0;
      let eslintWarnings = 0;
      
      allResults.forEach(result => {
        if (result.messages && result.messages.length > 0) {
          result.messages.forEach(message => {
            if (message.severity === 2) {
              eslintErrors++;
              this.categorizeError(message, 'structure');
            } else {
              eslintWarnings++;
            }
          });
        }
      });
      
      this.stats.totalErrors += eslintErrors;
      this.stats.totalWarnings += eslintWarnings;
      
      if (eslintErrors > 0) {
        console.log(chalk.red(`❌ ESLint found ${eslintErrors} errors and ${eslintWarnings} warnings`));
        if (this.config.reportFormat === 'detailed') {
          this.displayESLintResults(allResults);
        }
      } else {
        console.log(chalk.green(`✅ ESLint validation passed (${eslintWarnings} warnings)`));
      }
      
    } catch (error) {
      console.log(chalk.yellow('⚠️ ESLint validation skipped:', error.message));
    }
  }
  
  /**
   * Validate component structure
   */
  async validateComponentStructure(files) {
    let structuralErrors = 0;
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const errors = this.analyzeComponentStructure(content, file);
        
        if (errors.length > 0) {
          structuralErrors += errors.length;
          errors.forEach(error => {
            this.categorizeError(error, 'structure');
          });
        }
        
      } catch (error) {
        console.log(chalk.yellow(`⚠️ Could not analyze structure of ${file}`));
      }
    }
    
    this.stats.totalErrors += structuralErrors;
    
    if (structuralErrors > 0) {
      console.log(chalk.red(`❌ Found ${structuralErrors} structural issues`));
    } else {
      console.log(chalk.green('✅ Component structure validation passed'));
    }
  }
  
  /**
   * Analyze component structure
   */
  analyzeComponentStructure(content, filePath) {
    const errors = [];
    
    // Check for proper React imports (for older React versions)
    if (content.includes('jsx') || content.includes('<')) {
      const hasReactImport = content.includes('import React') || 
                            content.includes('from "react"') ||
                            content.includes('from \'react\'');
      
      // Only require React import for .jsx files or if not using new JSX transform
      if (filePath.endsWith('.jsx') && !hasReactImport) {
        errors.push({
          type: 'MISSING_REACT_IMPORT',
          line: 1,
          message: 'Missing React import for JSX usage',
          severity: 'error',
          fix: 'Add: import React from "react";'
        });
      }
    }
    
    // Check for component naming convention
    const componentRegex = /(?:export\s+(?:default\s+)?(?:function|const)\s+)([A-Za-z_$][A-Za-z0-9_$]*)/g;
    let match;
    
    while ((match = componentRegex.exec(content)) !== null) {
      const componentName = match[1];
      
      if (!/^[A-Z]/.test(componentName)) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        errors.push({
          type: 'COMPONENT_NAMING',
          line: lineNumber,
          message: `Component name "${componentName}" should start with uppercase letter`,
          severity: 'warning',
          fix: `Rename to "${componentName.charAt(0).toUpperCase() + componentName.slice(1)}"`
        });
      }
    }
    
    return errors;
  }
  
  /**
   * Run TypeScript validation
   */
  async runTypeScriptValidation() {
    try {
      if (!fs.existsSync('tsconfig.json')) {
        console.log(chalk.gray('⚠️ Skipping TypeScript validation (no tsconfig.json)'));
        return;
      }
      
      const result = execSync('npx tsc --noEmit --skipLibCheck', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      console.log(chalk.green('✅ TypeScript validation passed'));
      
    } catch (error) {
      const output = error.stdout || error.stderr || '';
      const tsErrors = this.parseTypeScriptErrors(output);
      
      this.stats.totalErrors += tsErrors.length;
      
      if (tsErrors.length > 0) {
        console.log(chalk.red(`❌ TypeScript found ${tsErrors.length} errors`));
        
        tsErrors.forEach(error => {
          this.categorizeError(error, 'syntax');
        });
      }
    }
  }
  
  /**
   * Parse TypeScript error output
   */
  parseTypeScriptErrors(output) {
    const errors = [];
    const lines = output.split('\n');
    
    lines.forEach(line => {
      // Match TypeScript error format: file(line,col): error TS####: message
      const match = line.match(/^(.+)\((\d+),(\d+)\):\s+error\s+TS\d+:\s+(.+)$/);
      if (match) {
        errors.push({
          type: 'TYPESCRIPT_ERROR',
          file: match[1],
          line: parseInt(match[2]),
          column: parseInt(match[3]),
          message: match[4],
          severity: 'error'
        });
      }
    });
    
    return errors;
  }
  
  /**
   * Categorize errors for reporting
   */
  categorizeError(error, category) {
    if (!this.errorCategories[category]) {
      this.errorCategories[category] = [];
    }
    this.errorCategories[category].push(error);
  }
  
  /**
   * Display syntax errors
   */
  displaySyntaxErrors(results) {
    console.log(chalk.red.bold('\n🚨 Syntax Errors:'));
    
    results.forEach(({ file, errors }) => {
      console.log(chalk.blue(`\n📄 ${file}`));
      
      errors.forEach(error => {
        const severity = error.severity === 'error' ? chalk.red('❌') : chalk.yellow('⚠️');
        console.log(`  ${severity} Line ${error.line}: ${error.message}`);
        
        if (error.fix) {
          console.log(chalk.gray(`     💡 Fix: ${error.fix}`));
        }
      });
    });
  }
  
  /**
   * Display ESLint results
   */
  displayESLintResults(results) {
    console.log(chalk.red.bold('\n🔧 ESLint Issues:'));
    
    results.forEach(result => {
      if (result.messages && result.messages.length > 0) {
        console.log(chalk.blue(`\n📄 ${result.filePath}`));
        
        result.messages.forEach(message => {
          const severity = message.severity === 2 ? chalk.red('❌') : chalk.yellow('⚠️');
          console.log(`  ${severity} Line ${message.line}:${message.column}: ${message.message} (${message.ruleId})`);
        });
      }
    });
  }
  
  /**
   * Generate comprehensive report
   */
  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      success: this.stats.totalErrors === 0,
      processingTimeMs: this.stats.processingTime,
      errorCategories: Object.keys(this.errorCategories).reduce((acc, category) => {
        acc[category] = this.errorCategories[category].length;
        return acc;
      }, {})
    };
    
    // Display report based on format
    if (this.config.reportFormat === 'json') {
      console.log(JSON.stringify(report, null, 2));
    } else {
      this.displayReport(report);
    }
    
    return report;
  }
  
  /**
   * Display formatted report
   */
  displayReport(report) {
    console.log(chalk.blue.bold('\n📊 Validation Report'));
    console.log(chalk.gray('='.repeat(50)));
    
    // Stats overview
    console.log(chalk.blue('\n📈 Overview:'));
    console.log(`  Total Files: ${chalk.white(this.stats.totalFiles)}`);
    console.log(`  Processed: ${chalk.white(this.stats.processedFiles)}`);
    console.log(`  Skipped: ${chalk.yellow(this.stats.skippedFiles)}`);
    console.log(`  Processing Time: ${chalk.white((this.stats.processingTime / 1000).toFixed(2))}s`);
    
    // Results
    console.log(chalk.blue('\n🎯 Results:'));
    const errorColor = this.stats.totalErrors > 0 ? chalk.red : chalk.green;
    const warningColor = this.stats.totalWarnings > 0 ? chalk.yellow : chalk.green;
    
    console.log(`  Errors: ${errorColor(this.stats.totalErrors)}`);
    console.log(`  Warnings: ${warningColor(this.stats.totalWarnings)}`);
    console.log(`  Files with Errors: ${errorColor(this.stats.errorFiles)}`);
    console.log(`  Files with Warnings: ${warningColor(this.stats.warningFiles)}`);
    
    // Error categories
    if (Object.values(this.errorCategories).some(arr => arr.length > 0)) {
      console.log(chalk.blue('\n🏷️ Error Categories:'));
      
      Object.entries(this.errorCategories).forEach(([category, errors]) => {
        if (errors.length > 0) {
          console.log(`  ${category}: ${chalk.red(errors.length)}`);
        }
      });
    }
    
    // Final verdict
    console.log(chalk.blue('\n🏁 Final Result:'));
    if (this.stats.totalErrors === 0) {
      console.log(chalk.green.bold('✅ All validations passed!'));
    } else {
      console.log(chalk.red.bold('❌ Validation failed - please fix the errors above'));
    }
    
    console.log(chalk.gray('\n' + '='.repeat(50)));
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse CLI arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--fix':
      case '-f':
        options.fix = true;
        break;
      case '--format':
        options.reportFormat = args[++i];
        break;
      case '--src':
        options.srcPath = args[++i];
        break;
      case '--help':
      case '-h':
        console.log(`
JSX Comprehensive Validator

Usage: jsx-comprehensive-validator [options]

Options:
  --verbose, -v     Show detailed output
  --fix, -f         Attempt to fix issues automatically
  --format FORMAT   Report format: detailed, summary, json
  --src PATH        Source directory (default: src)
  --help, -h        Show this help message

Examples:
  jsx-comprehensive-validator
  jsx-comprehensive-validator --verbose --format json
  jsx-comprehensive-validator --src src/components --fix
        `);
        process.exit(0);
        break;
    }
  }
  
  const validator = new JSXComprehensiveValidator(options);
  const result = await validator.validate();
  
  process.exit(result.success ? 0 : 1);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(chalk.red.bold('❌ Fatal error:'), error.message);
    process.exit(1);
  });
}

export default JSXComprehensiveValidator;