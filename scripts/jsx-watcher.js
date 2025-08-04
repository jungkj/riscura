#!/usr/bin/env node

/**
 * JSX File Watcher
 * Real-time JSX validation with file system monitoring
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import chokidar from 'chokidar';
import chalk from 'chalk';

class JSXWatcher {
  constructor(options = {}) {
    this.config = {
      srcPath: options.srcPath || 'src',
      extensions: options.extensions || ['tsx', 'jsx'],
      debounceMs: options.debounceMs || 500,
      enableNotifications: options.enableNotifications || false,
      validationLevel: options.validationLevel || 'standard', // 'quick', 'standard', 'comprehensive'
      ...options
    };
    
    this.validationQueue = new Set();
    this.debounceTimer = null;
    this.stats = {
      filesWatched: 0,
      validationRuns: 0,
      errorsFound: 0,
      lastValidation: null
    };
    
    this.isValidating = false;
    this.watcher = null;
    
    console.log(chalk.blue.bold('👁️ JSX File Watcher'));
    console.log(chalk.gray(`Watching: ${this.config.srcPath}/`));
    console.log(chalk.gray(`Extensions: ${this.config.extensions.join(', ')}`));
    console.log(chalk.gray(`Validation Level: ${this.config.validationLevel}`));
    console.log('');
  }
  
  /**
   * Start watching files
   */
  start() {
    const watchPatterns = this.config.extensions.map(ext => 
      `${this.config.srcPath}/**/*.${ext}`
    );
    
    console.log(chalk.green('🚀 Starting JSX file watcher...'));
    
    this.watcher = chokidar.watch(watchPatterns, {
      ignored: [
        '**/node_modules/**',
        '**/.next/**',
        '**/dist/**',
        '**/build/**',
        '**/*.d.ts',
        '**/__tests__/**',
        '**/*.test.*',
        '**/*.spec.*'
      ],
      persistent: true,
      ignoreInitial: false
    });
    
    this.watcher
      .on('add', (filePath) => this.handleFileChange('added', filePath))
      .on('change', (filePath) => this.handleFileChange('changed', filePath))
      .on('unlink', (filePath) => this.handleFileChange('deleted', filePath))
      .on('ready', () => {
        console.log(chalk.green(`✅ Watching ${this.stats.filesWatched} JSX/TSX files`));
        console.log(chalk.gray('Press Ctrl+C to stop watching\n'));
        
        // Run initial validation
        this.scheduleValidation();
      })
      .on('error', (error) => {
        console.error(chalk.red('❌ Watcher error:'), error);
      });
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\n🛑 Stopping JSX watcher...'));
      this.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      this.stop();
      process.exit(0);
    });
  }
  
  /**
   * Stop watching files
   */
  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    
    console.log(chalk.gray('👋 JSX watcher stopped'));
  }
  
  /**
   * Handle file system changes
   */
  handleFileChange(event, filePath) {
    const relativePath = path.relative(process.cwd(), filePath);
    
    switch (event) {
      case 'added':
        console.log(chalk.green(`➕ Added: ${relativePath}`));
        this.stats.filesWatched++;
        this.validationQueue.add(filePath);
        break;
        
      case 'changed':
        console.log(chalk.blue(`✏️ Changed: ${relativePath}`));
        this.validationQueue.add(filePath);
        break;
        
      case 'deleted':
        console.log(chalk.red(`➖ Deleted: ${relativePath}`));
        this.stats.filesWatched--;
        this.validationQueue.delete(filePath);
        return; // Don't validate deleted files
    }
    
    this.scheduleValidation();
  }
  
  /**
   * Schedule validation with debouncing
   */
  scheduleValidation() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = setTimeout(() => {
      this.runValidation();
    }, this.config.debounceMs);
  }
  
  /**
   * Run JSX validation on queued files
   */
  async runValidation() {
    if (this.isValidating || this.validationQueue.size === 0) {
      return;
    }
    
    this.isValidating = true;
    const filesToValidate = Array.from(this.validationQueue);
    this.validationQueue.clear();
    
    try {
      console.log(chalk.yellow(`🔍 Validating ${filesToValidate.length} files...`));
      this.stats.validationRuns++;
      this.stats.lastValidation = new Date().toISOString();
      
      const results = await this.validateFiles(filesToValidate);
      this.displayResults(results);
      
      if (this.config.enableNotifications) {
        this.sendNotification(results);
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Validation error:'), error.message);
    } finally {
      this.isValidating = false;
    }
  }
  
  /**
   * Validate files based on validation level
   */
  async validateFiles(files) {
    const results = {
      totalFiles: files.length,
      validFiles: 0,
      errorFiles: 0,
      warningFiles: 0,
      errors: [],
      warnings: [],
      processingTime: 0
    };
    
    const startTime = Date.now();
    
    switch (this.config.validationLevel) {
      case 'quick':
        await this.runQuickValidation(files, results);
        break;
        
      case 'comprehensive':
        await this.runComprehensiveValidation(files, results);
        break;
        
      default: // 'standard'
        await this.runStandardValidation(files, results);
        break;
    }
    
    results.processingTime = Date.now() - startTime;
    this.stats.errorsFound += results.errors.length;
    
    return results;
  }
  
  /**
   * Quick validation - syntax check only
   */
  async runQuickValidation(files, results) {
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const syntaxErrors = this.checkBasicSyntax(content, file);
        
        if (syntaxErrors.length > 0) {
          results.errorFiles++;
          results.errors.push(...syntaxErrors);
        } else {
          results.validFiles++;
        }
        
      } catch (error) {
        results.errorFiles++;
        results.errors.push({
          file,
          type: 'FILE_READ_ERROR',
          message: `Could not read file: ${error.message}`
        });
      }
    }
  }
  
  /**
   * Standard validation - syntax + ESLint
   */
  async runStandardValidation(files, results) {
    // First run quick validation
    await this.runQuickValidation(files, results);
    
    // Then run ESLint on files with no syntax errors
    const validFiles = files.filter(file => 
      !results.errors.some(error => error.file === file)
    );
    
    if (validFiles.length > 0) {
      try {
        const eslintResults = await this.runESLintOnFiles(validFiles);
        results.warnings.push(...eslintResults.warnings);
        results.errors.push(...eslintResults.errors);
        
        eslintResults.errors.forEach(error => {
          if (!results.errors.some(e => e.file === error.file)) {
            results.errorFiles++;
          }
        });
        
      } catch (error) {
        console.warn(chalk.yellow('⚠️ ESLint validation failed:'), error.message);
      }
    }
  }
  
  /**
   * Comprehensive validation - full validation suite
   */
  async runComprehensiveValidation(files, results) {
    try {
      // Use the comprehensive validator
      const fileList = files.join(' ');
      const validationResult = execSync(
        `node scripts/jsx-comprehensive-validator.js --format json --src "${fileList}"`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
      );
      
      const comprehensiveResults = JSON.parse(validationResult);
      
      results.validFiles = comprehensiveResults.stats?.processedFiles - comprehensiveResults.stats?.errorFiles || 0;
      results.errorFiles = comprehensiveResults.stats?.errorFiles || 0;
      results.errors = comprehensiveResults.errorCategories?.syntax || [];
      results.warnings = comprehensiveResults.errorCategories?.style || [];
      
    } catch (error) {
      console.warn(chalk.yellow('⚠️ Comprehensive validation failed, falling back to standard:'));
      await this.runStandardValidation(files, results);
    }
  }
  
  /**
   * Basic syntax checking
   */
  checkBasicSyntax(content, filePath) {
    const errors = [];
    
    // Check for HTML attributes in JSX
    if (content.includes(' class=')) {
      errors.push({
        file: filePath,
        type: 'HTML_ATTRIBUTE',
        message: 'Use "className" instead of "class" in JSX'
      });
    }
    
    if (content.includes(' for=')) {
      errors.push({
        file: filePath,
        type: 'HTML_ATTRIBUTE',
        message: 'Use "htmlFor" instead of "for" in JSX'
      });
    }
    
    // Check for basic bracket matching
    const openBrackets = (content.match(/{/g) || []).length;
    const closeBrackets = (content.match(/}/g) || []).length;
    
    if (openBrackets !== closeBrackets) {
      errors.push({
        file: filePath,
        type: 'BRACKET_MISMATCH',
        message: `Mismatched brackets: ${openBrackets} open, ${closeBrackets} close`
      });
    }
    
    return errors;
  }
  
  /**
   * Run ESLint on specific files
   */
  async runESLintOnFiles(files) {
    const results = { errors: [], warnings: [] };
    
    try {
      const fileList = files.join(' ');
      const eslintOutput = execSync(
        `npx eslint ${fileList} --ext .tsx,.jsx --format json --no-error-on-unmatched-pattern`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
      );
      
      const eslintResults = JSON.parse(eslintOutput);
      
      eslintResults.forEach(result => {
        result.messages?.forEach(message => {
          const issue = {
            file: result.filePath,
            type: message.ruleId || 'ESLINT_ERROR',
            message: message.message,
            line: message.line,
            column: message.column
          };
          
          if (message.severity === 2) {
            results.errors.push(issue);
          } else {
            results.warnings.push(issue);
          }
        });
      });
      
    } catch (error) {
      if (error.stdout) {
        try {
          const eslintResults = JSON.parse(error.stdout);
          // Process results even if ESLint exited with error code
          eslintResults.forEach(result => {
            result.messages?.forEach(message => {
              const issue = {
                file: result.filePath,
                type: message.ruleId || 'ESLINT_ERROR',
                message: message.message,
                line: message.line,
                column: message.column
              };
              
              if (message.severity === 2) {
                results.errors.push(issue);
              } else {
                results.warnings.push(issue);
              }
            });
          });
        } catch (parseError) {
          throw new Error(`ESLint parsing failed: ${parseError.message}`);
        }
      } else {
        throw error;
      }
    }
    
    return results;
  }
  
  /**
   * Display validation results
   */
  displayResults(results) {
    const timestamp = new Date().toLocaleTimeString();
    
    console.log(chalk.gray(`\n⏱️ [${timestamp}] Validation completed in ${results.processingTime}ms`));
    
    if (results.errors.length === 0 && results.warnings.length === 0) {
      console.log(chalk.green(`✅ All ${results.totalFiles} files are valid!`));
    } else {
      if (results.errors.length > 0) {
        console.log(chalk.red(`❌ ${results.errors.length} errors found:`));
        
        results.errors.slice(0, 5).forEach(error => {
          const relativePath = path.relative(process.cwd(), error.file);
          console.log(chalk.red(`  • ${relativePath}: ${error.message}`));
          if (error.line) {
            console.log(chalk.gray(`    Line ${error.line}${error.column ? `:${error.column}` : ''}`));
          }
        });
        
        if (results.errors.length > 5) {
          console.log(chalk.gray(`  ... and ${results.errors.length - 5} more errors`));
        }
      }
      
      if (results.warnings.length > 0) {
        console.log(chalk.yellow(`⚠️ ${results.warnings.length} warnings found`));
        
        if (results.warnings.length <= 3) {
          results.warnings.forEach(warning => {
            const relativePath = path.relative(process.cwd(), warning.file);
            console.log(chalk.yellow(`  • ${relativePath}: ${warning.message}`));
          });
        }
      }
    }
    
    console.log(chalk.gray(`📊 Files: ${results.validFiles} valid, ${results.errorFiles} with errors`));
    console.log('');
  }
  
  /**
   * Send system notification (if enabled)
   */
  sendNotification(results) {
    if (!this.config.enableNotifications) return;
    
    try {
      const title = results.errors.length > 0 ? 'JSX Validation Errors' : 'JSX Validation Passed';
      const message = results.errors.length > 0 
        ? `${results.errors.length} errors found in ${results.errorFiles} files`
        : `All ${results.totalFiles} files are valid`;
      
      // Try to send notification (platform-specific)
      if (process.platform === 'darwin') {
        execSync(`osascript -e 'display notification "${message}" with title "${title}"'`);
      } else if (process.platform === 'linux') {
        execSync(`notify-send "${title}" "${message}"`);
      }
      
    } catch (error) {
      // Fail silently if notifications aren't available
    }
  }
  
  /**
   * Display current stats
   */
  displayStats() {
    console.log(chalk.blue('\n📊 Watcher Statistics:'));
    console.log(`  Files Watched: ${this.stats.filesWatched}`);
    console.log(`  Validation Runs: ${this.stats.validationRuns}`);
    console.log(`  Total Errors Found: ${this.stats.errorsFound}`);
    console.log(`  Last Validation: ${this.stats.lastValidation || 'Never'}`);
    console.log('');
  }
}

// CLI Interface
function main() {
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--src':
        options.srcPath = args[++i];
        break;
      case '--level':
        options.validationLevel = args[++i];
        break;
      case '--debounce':
        options.debounceMs = parseInt(args[++i], 10);
        break;
      case '--notifications':
        options.enableNotifications = true;
        break;
      case '--stats':
        // Special command to show stats and exit
        const watcher = new JSXWatcher(options);
        watcher.displayStats();
        return;
      case '--help':
      case '-h':
        console.log(`
JSX File Watcher

Usage: jsx-watcher [options]

Options:
  --src PATH          Source directory to watch (default: src)
  --level LEVEL       Validation level: quick, standard, comprehensive (default: standard)
  --debounce MS       Debounce delay in milliseconds (default: 500)
  --notifications     Enable system notifications
  --stats             Show statistics and exit
  --help, -h          Show this help message

Examples:
  jsx-watcher
  jsx-watcher --src components --level comprehensive
  jsx-watcher --notifications --debounce 1000
        `);
        return;
    }
  }
  
  const watcher = new JSXWatcher(options);
  watcher.start();
}

// Install missing chokidar dependency if needed
try {
  await import('chokidar');
} catch (error) {
  console.log(chalk.yellow('⚠️ Installing chokidar dependency...'));
  try {
    execSync('npm install chokidar --save-dev', { stdio: 'inherit' });
    console.log(chalk.green('✅ chokidar installed successfully'));
  } catch (installError) {
    console.error(chalk.red('❌ Failed to install chokidar:'), installError.message);
    console.log(chalk.yellow('Please run: npm install chokidar --save-dev'));
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default JSXWatcher;