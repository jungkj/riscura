#!/usr/bin/env node

/**
 * Security Configuration Checker
 * Validates that all security measures are properly configured for production
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
try {
  const { config } = await import('dotenv');
  config({ path: path.join(process.cwd(), '.env') });
} catch (error) {
  console.warn('⚠️ Could not load dotenv, environment variables may not be available');
}

// Color codes for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}🛡️ ${msg}${colors.reset}\n`),
  section: (msg) => console.log(`\n${colors.bright}${msg}${colors.reset}`)
};

class SecurityChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passed = [];
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  async runAllChecks() {
    log.header('Security Configuration Checker');
    log.info(`Environment: ${this.isProduction ? 'Production' : 'Development'}`);

    // Run all security checks
    this.checkEnvironmentVariables();
    this.checkSecrets();
    this.checkDatabaseSecurity();
    this.checkFilePermissions();
    this.checkDevelopmentCode();
    this.checkSecurityHeaders();
    this.checkDependencies();
    
    // Generate report
    this.generateReport();
  }

  checkEnvironmentVariables() {
    log.section('🔐 Environment Variables');

    const requiredVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'NEXTAUTH_SECRET',
      'SESSION_SECRET',
      'CSRF_SECRET',
      'COOKIE_SECRET',
      'INTERNAL_API_KEY',
      'DATABASE_ENCRYPTION_KEY',
      'FILE_ENCRYPTION_KEY'
    ];

    const productionRequiredVars = [
      'APP_URL',
      'SENTRY_DSN'
    ];

    // Check required variables
    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        this.errors.push(`Missing required environment variable: ${varName}`);
      } else {
        this.passed.push(`Environment variable ${varName} is set`);
      }
    }

    // Check production-specific variables
    if (this.isProduction) {
      for (const varName of productionRequiredVars) {
        if (!process.env[varName]) {
          this.errors.push(`Missing production environment variable: ${varName}`);
        } else {
          this.passed.push(`Production environment variable ${varName} is set`);
        }
      }
    }

    // Check HTTPS in production
    if (this.isProduction && process.env.APP_URL && !process.env.APP_URL.startsWith('https://')) {
      this.errors.push('APP_URL must use HTTPS in production');
    }

    // Check for localhost URLs in production
    if (this.isProduction) {
      const urlVars = ['APP_URL', 'NEXTAUTH_URL', 'DATABASE_URL'];
      for (const varName of urlVars) {
        const value = process.env[varName];
        if (value && (value.includes('localhost') || value.includes('127.0.0.1'))) {
          this.errors.push(`${varName} contains localhost in production: ${value}`);
        }
      }
    }
  }

  checkSecrets() {
    log.section('🔑 Secret Validation');

    const secretVars = [
      'JWT_SECRET',
      'NEXTAUTH_SECRET',
      'SESSION_SECRET',
      'CSRF_SECRET',
      'COOKIE_SECRET',
      'INTERNAL_API_KEY',
      'DATABASE_ENCRYPTION_KEY',
      'FILE_ENCRYPTION_KEY'
    ];

    const developmentPatterns = [
      'dev-',
      'test-',
      'demo-',
      'localhost',
      '12345',
      'change-me',
      'please-change',
      'development',
      'testing',
      'secret-key'
    ];

    for (const varName of secretVars) {
      const value = process.env[varName];
      
      if (!value) {
        continue; // Already checked in environment variables
      }

      // Check minimum length
      if (value.length < 32) {
        this.errors.push(`${varName} must be at least 32 characters long`);
        continue;
      }

      // Check for development/test values in production
      if (this.isProduction) {
        const hasDevPattern = developmentPatterns.some(pattern => 
          value.toLowerCase().includes(pattern.toLowerCase())
        );

        if (hasDevPattern) {
          this.errors.push(`${varName} contains development/test value in production`);
          continue;
        }
      }

      // Check entropy (basic randomness check)
      const entropy = this.calculateEntropy(value);
      if (entropy < 4.0) {
        this.warnings.push(`${varName} may have low entropy (${entropy.toFixed(2)}). Consider using a more random value.`);
      } else {
        this.passed.push(`${varName} has sufficient entropy`);
      }
    }
  }

  checkDatabaseSecurity() {
    log.section('🗄️ Database Security');

    const dbUrl = process.env.DATABASE_URL;
    
    if (!dbUrl) {
      return; // Already checked in environment variables
    }

    // Check for SQLite in production
    if (this.isProduction && (dbUrl.includes('sqlite') || dbUrl.includes('file:'))) {
      this.warnings.push('SQLite database detected in production. Consider using PostgreSQL for better security and performance.');
    }

    // Check for SSL/TLS
    if (this.isProduction && !dbUrl.includes('ssl=true') && !dbUrl.includes('sslmode=require')) {
      this.errors.push('Database should use SSL/TLS in production');
    } else if (this.isProduction) {
      this.passed.push('Database connection uses SSL/TLS');
    }

    // Check for embedded credentials
    if (dbUrl.includes('@') && !dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
      this.warnings.push('Database URL contains embedded credentials. Consider using connection pooling or environment-based auth.');
    }
  }

  checkFilePermissions() {
    log.section('📁 File Permissions');

    const sensitiveFiles = [
      '.env',
      '.env.local',
      '.env.production',
      'prisma/schema.prisma'
    ];

    for (const file of sensitiveFiles) {
      const filePath = path.join(process.cwd(), file);
      
      if (fs.existsSync(filePath)) {
        try {
          const stats = fs.statSync(filePath);
          const mode = stats.mode & 0o777;
          
          // Check if file is readable by others
          if (mode & 0o044) {
            this.warnings.push(`${file} is readable by others (permissions: ${mode.toString(8)})`);
          } else {
            this.passed.push(`${file} has secure permissions`);
          }
        } catch (error) {
          this.warnings.push(`Could not check permissions for ${file}: ${error.message}`);
        }
      }
    }

    // Check for .env files in git
    const gitignorePath = path.join(process.cwd(), '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      if (!gitignoreContent.includes('.env')) {
        this.warnings.push('.env files may not be properly excluded from git');
      } else {
        this.passed.push('.env files are excluded from git');
      }
    }
  }

  checkDevelopmentCode() {
    log.section('🚫 Development Code Detection');

    const codePatterns = [
      {
        pattern: /console\.log|console\.debug|debugger/g,
        message: 'Debug statements found',
        severity: 'warning'
      },
      {
        pattern: /demo-token|test-api-key|development.*key/gi,
        message: 'Development tokens/keys found',
        severity: 'error'
      },
      {
        pattern: /localhost:|\bdev\.|development/gi,
        message: 'Development URLs or references found',
        severity: 'warning'
      },
      {
        pattern: /\.skip\(|\.only\(|fdescribe|fit\(/g,
        message: 'Test code modifiers found',
        severity: 'warning'
      }
    ];

    const filesToCheck = this.getCodeFiles();
    let totalIssues = 0;

    for (const filePath of filesToCheck) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        for (const { pattern, message, severity } of codePatterns) {
          const matches = content.match(pattern);
          if (matches) {
            const relativePath = path.relative(process.cwd(), filePath);
            const issueMsg = `${message} in ${relativePath} (${matches.length} occurrences)`;
            
            if (severity === 'error') {
              this.errors.push(issueMsg);
            } else {
              this.warnings.push(issueMsg);
            }
            totalIssues += matches.length;
          }
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }

    if (totalIssues === 0) {
      this.passed.push('No development code patterns detected');
    }
  }

  checkSecurityHeaders() {
    log.section('🛡️ Security Headers Configuration');

    // Check if security headers are enabled
    const securityHeadersEnabled = process.env.ENABLE_SECURITY_HEADERS !== 'false';
    
    if (!securityHeadersEnabled) {
      this.errors.push('Security headers are disabled');
    } else {
      this.passed.push('Security headers are enabled');
    }

    // Check CSP configuration
    if (process.env.CSP_REPORT_URI) {
      this.passed.push('CSP reporting is configured');
    } else if (this.isProduction) {
      this.warnings.push('CSP reporting not configured for production');
    }

    // Check HSTS configuration
    const hstsMaxAge = parseInt(process.env.HSTS_MAX_AGE || '31536000');
    if (hstsMaxAge < 31536000) {
      this.warnings.push(`HSTS max-age is less than 1 year (${hstsMaxAge})`);
    } else {
      this.passed.push('HSTS max-age is properly configured');
    }
  }

  checkDependencies() {
    log.section('📦 Dependencies Security');

    const packageJsonPath = path.join(process.cwd(), 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      this.warnings.push('package.json not found');
      return;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Check for security-related packages
      const securityPackages = [
        'helmet',
        'cors',
        'express-rate-limit',
        'csurf',
        'bcrypt',
        'jsonwebtoken'
      ];

      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      for (const pkg of securityPackages) {
        if (dependencies[pkg]) {
          this.passed.push(`Security package ${pkg} is installed`);
        }
      }

      // Check for known vulnerable packages (basic check)
      const vulnerablePackages = [
        'lodash',
        'moment',
        'request'
      ];

      for (const pkg of vulnerablePackages) {
        if (dependencies[pkg]) {
          this.warnings.push(`Package ${pkg} may have known vulnerabilities. Consider alternatives.`);
        }
      }

    } catch (error) {
      this.warnings.push(`Could not parse package.json: ${error.message}`);
    }
  }

  getCodeFiles() {
    const files = [];
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    const ignoreDirs = ['node_modules', '.git', '.next', 'dist', 'build'];

    const walkDir = (dir) => {
      try {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory() && !ignoreDirs.includes(item)) {
            walkDir(fullPath);
          } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories that can't be read
      }
    };

    walkDir(path.join(process.cwd(), 'src'));
    return files.slice(0, 100); // Limit to first 100 files for performance
  }

  calculateEntropy(str) {
    const freq = {};
    for (const char of str) {
      freq[char] = (freq[char] || 0) + 1;
    }

    let entropy = 0;
    const len = str.length;

    for (const count of Object.values(freq)) {
      const p = count / len;
      entropy -= p * Math.log2(p);
    }

    return entropy;
  }

  generateReport() {
    log.header('Security Check Results');

    // Summary
    const total = this.passed.length + this.warnings.length + this.errors.length;
    console.log(`📊 ${colors.bright}Summary:${colors.reset}`);
    console.log(`  Total checks: ${total}`);
    console.log(`  ${colors.green}Passed: ${this.passed.length}${colors.reset}`);
    console.log(`  ${colors.yellow}Warnings: ${this.warnings.length}${colors.reset}`);
    console.log(`  ${colors.red}Errors: ${this.errors.length}${colors.reset}`);

    // Errors
    if (this.errors.length > 0) {
      log.section('❌ Critical Issues (Must Fix)');
      this.errors.forEach(error => log.error(error));
    }

    // Warnings
    if (this.warnings.length > 0) {
      log.section('⚠️ Warnings (Should Fix)');
      this.warnings.forEach(warning => log.warning(warning));
    }

    // Success summary
    if (this.errors.length === 0) {
      log.section('✅ Security Status');
      if (this.warnings.length === 0) {
        log.success('All security checks passed! 🎉');
      } else {
        log.success('No critical security issues found.');
        log.warning(`Consider addressing ${this.warnings.length} warning(s) for improved security.`);
      }
    } else {
      log.section('🚨 Action Required');
      log.error(`Found ${this.errors.length} critical security issue(s) that must be fixed before production deployment.`);
    }

    // Production readiness
    log.section('🚀 Production Readiness');
    if (this.isProduction && this.errors.length === 0) {
      log.success('Production environment appears to be properly secured.');
    } else if (this.isProduction && this.errors.length > 0) {
      log.error('Production environment has security issues that must be addressed.');
    } else if (this.errors.length === 0) {
      log.info('Development environment security checks passed.');
    } else {
      log.warning('Development environment has security issues to address before production.');
    }

    // Exit with appropriate code
    process.exit(this.errors.length > 0 ? 1 : 0);
  }
}

// CLI interface
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
${colors.bright}Security Configuration Checker${colors.reset}

Usage: node scripts/check-security.js [options]

Options:
  --help, -h     Show this help message
  --verbose, -v  Show detailed output

This script validates security configuration for production deployment.

Examples:
  npm run security:check
  NODE_ENV=production npm run security:check
  `);
  process.exit(0);
}

const checker = new SecurityChecker();
checker.runAllChecks().catch(error => {
  log.error(`Security check failed: ${error.message}`);
  process.exit(1);
}); 