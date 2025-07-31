#!/usr/bin/env node
/**
 * Pre-deployment validation script
 * Runs comprehensive checks before Vercel deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class PreDeploymentChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().substring(11, 19);
    const prefix = {
      info: '\u2139\ufe0f',
      success: '\u2705',
      warning: '\u26a0\ufe0f',
      error: '\u274c'
    }[type] || '\u2139\ufe0f';
    
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async runCheck(name, checkFn) {
    this.log(`Running ${name}...`);
    const startTime = Date.now();
    
    try {
      await checkFn();
      const duration = Date.now() - startTime;
      this.log(`${name} completed in ${duration}ms`, 'success');
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.log(`${name} failed after ${duration}ms: ${error.message}`, 'error');
      this.errors.push({ check: name, error: error.message });
      return false;
    }
  }

  async runWarningCheck(name, checkFn) {
    this.log(`Checking ${name}...`);
    
    try {
      await checkFn();
      this.log(`${name} passed`, 'success');
      return true;
    } catch (error) {
      this.log(`${name} warning: ${error.message}`, 'warning');
      this.warnings.push({ check: name, warning: error.message });
      return false;
    }
  }

  async validateEnvironment() {
    // Check Node.js version
    const nodeVersion = process.version;
    if (!nodeVersion.startsWith('v18.') && !nodeVersion.startsWith('v20.')) {
      throw new Error(`Unsupported Node.js version: ${nodeVersion}. Use v18 or v20.`);
    }
    
    // Check npm version
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      this.log(`Node.js ${nodeVersion}, npm ${npmVersion}`);
    } catch (error) {
      throw new Error('npm not available');
    }
    
    // Check package.json
    if (!fs.existsSync('package.json')) {
      throw new Error('package.json not found');
    }
    
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    if (!pkg.scripts['build:vercel']) {
      throw new Error('build:vercel script not found in package.json');
    }
  }

  async validateDependencies() {
    // Check if node_modules exists
    if (!fs.existsSync('node_modules')) {
      throw new Error('node_modules not found. Run npm install.');
    }
    
    // Verify critical dependencies
    const criticalDeps = ['next', 'react', 'react-dom', 'typescript'];
    
    for (const dep of criticalDeps) {
      const depPath = path.join('node_modules', dep);
      if (!fs.existsSync(depPath)) {
        throw new Error(`Critical dependency missing: ${dep}`);
      }
    }
    
    // Check for security vulnerabilities
    try {
      execSync('npm audit --audit-level high', { stdio: 'pipe' });
    } catch (error) {
      // npm audit returns non-zero exit code when vulnerabilities are found
      if (error.stdout && error.stdout.includes('vulnerabilities')) {
        this.warnings.push({
          check: 'Security Audit',
          warning: 'High-severity vulnerabilities found. Run npm audit fix.'
        });
      }
    }
  }

  async validateJSXSyntax() {
    this.log('Running comprehensive JSX syntax validation...');
    
    // Run JSX monitor
    try {
      execSync('node scripts/jsx-error-monitor.js scan', { stdio: 'pipe' });
    } catch (error) {
      if (error.status === 1) {
        throw new Error('JSX syntax errors detected. Fix before deployment.');
      }
      throw new Error(`JSX validation failed: ${error.message}`);
    }
    
    // Run specific JSX linting
    try {
      execSync('npm run lint:jsx-validator', { stdio: 'pipe' });
    } catch (error) {
      throw new Error('JSX validation failed. Check syntax errors.');
    }
  }

  async validateTypeScript() {
    this.log('Running TypeScript compilation check...');
    
    // Quick type check first
    try {
      execSync('npm run type-check', { stdio: 'pipe' });
    } catch (error) {
      throw new Error('TypeScript compilation failed. Fix type errors.');
    }
    
    // Full type check for comprehensive validation
    try {
      execSync('NODE_OPTIONS="--max-old-space-size=8192" npm run type-check:full', { 
        stdio: 'pipe',
        timeout: 120000 // 2 minutes
      });
    } catch (error) {
      if (error.code === 'TIMEOUT') {
        throw new Error('TypeScript check timed out. May indicate circular dependencies.');
      }
      throw new Error('Full TypeScript validation failed.');
    }
  }

  async validateBuild() {
    this.log('Testing production build...');
    
    const startTime = Date.now();
    
    try {
      // Set environment variables for build
      const env = {
        ...process.env,
        NODE_ENV: 'production',
        NODE_OPTIONS: '--max-old-space-size=8192',
        BUILDING: 'true',
        SKIP_ENV_VALIDATION: '1'
      };
      
      execSync('npm run build:vercel', { 
        stdio: 'pipe',
        env,
        timeout: 600000 // 10 minutes
      });
      
      const buildTime = Date.now() - startTime;
      this.log(`Build completed in ${Math.round(buildTime / 1000)}s`);
      
    } catch (error) {
      if (error.code === 'TIMEOUT') {
        throw new Error('Build timed out after 10 minutes.');
      }
      
      const stderr = error.stderr ? error.stderr.toString() : '';
      const stdout = error.stdout ? error.stdout.toString() : '';
      
      let errorMessage = 'Build failed';
      
      // Parse common build errors
      if (stderr.includes('ENOSPC')) {
        errorMessage = 'Build failed: No space left on device';
      } else if (stderr.includes('heap out of memory')) {
        errorMessage = 'Build failed: Out of memory. Increase NODE_OPTIONS max-old-space-size.';
      } else if (stderr.includes('Module not found')) {
        errorMessage = 'Build failed: Module not found. Check imports.';
      } else if (stdout.includes('Unexpected token')) {
        errorMessage = 'Build failed: JSX syntax error detected.';
      } else if (stderr.includes('TypeScript')) {
        errorMessage = 'Build failed: TypeScript compilation error.';
      }
      
      throw new Error(errorMessage);
    }
  }

  async validateBuildOutput() {
    // Check if .next directory was created
    if (!fs.existsSync('.next')) {
      throw new Error('.next directory not found after build');
    }
    
    // Check for essential build files
    const requiredFiles = [
      '.next/BUILD_ID',
      '.next/static',
      '.next/server'
    ];
    
    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        throw new Error(`Required build file missing: ${file}`);
      }
    }
    
    // Check build size
    try {
      const buildSize = execSync('du -sh .next', { encoding: 'utf8' });
      this.log(`Build size: ${buildSize.trim()}`);
      
      // Extract size in MB (rough estimate)
      const sizeMatch = buildSize.match(/(\d+(?:\.\d+)?)([KMG])/i);
      if (sizeMatch) {
        const size = parseFloat(sizeMatch[1]);
        const unit = sizeMatch[2].toUpperCase();
        
        let sizeInMB = size;
        if (unit === 'K') sizeInMB = size / 1024;
        else if (unit === 'G') sizeInMB = size * 1024;
        
        if (sizeInMB > 500) {
          this.warnings.push({
            check: 'Build Size',
            warning: `Large build size: ${buildSize.trim()}. Consider optimization.`
          });
        }
      }
    } catch (error) {
      this.warnings.push({
        check: 'Build Size',
        warning: 'Could not determine build size'
      });
    }
  }

  async validateConfiguration() {
    // Check Next.js config
    if (!fs.existsSync('next.config.js')) {
      throw new Error('next.config.js not found');
    }
    
    // Check Vercel config
    if (fs.existsSync('vercel.json')) {
      try {
        const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
        if (vercelConfig.buildCommand !== 'npm run build:vercel') {
          this.warnings.push({
            check: 'Vercel Config',
            warning: 'vercel.json buildCommand should be "npm run build:vercel"'
          });
        }
      } catch (error) {
        throw new Error('Invalid vercel.json format');
      }
    }
    
    // Check for required environment variables
    const requiredEnvVars = ['NEXTAUTH_SECRET', 'DATABASE_URL'];
    
    // Don't fail on missing env vars in CI, just warn
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        this.warnings.push({
          check: 'Environment Variables',
          warning: `Missing environment variable: ${envVar}`
        });
      }
    }
  }

  async validateLinting() {
    try {
      execSync('npm run lint', { stdio: 'pipe' });
    } catch (error) {
      throw new Error('ESLint validation failed. Fix linting errors.');
    }
  }

  async generateReport() {
    const totalTime = Date.now() - this.startTime;
    const report = {
      timestamp: new Date().toISOString(),
      duration: totalTime,
      success: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      checks: {
        environment: true,
        dependencies: true,
        jsx: this.errors.filter(e => e.check.includes('JSX')).length === 0,
        typescript: this.errors.filter(e => e.check.includes('TypeScript')).length === 0,
        build: this.errors.filter(e => e.check.includes('Build')).length === 0,
        linting: this.errors.filter(e => e.check.includes('Lint')).length === 0
      }
    };
    
    // Save report
    const reportsDir = path.join(process.cwd(), '.build-metrics');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const reportFile = path.join(reportsDir, 'pre-deployment-report.json');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    return report;
  }

  async run() {
    this.log('Starting pre-deployment validation...', 'info');
    
    // Run critical checks (must pass)
    const criticalChecks = [
      ['Environment Setup', () => this.validateEnvironment()],
      ['Dependencies', () => this.validateDependencies()],
      ['JSX Syntax', () => this.validateJSXSyntax()],
      ['TypeScript', () => this.validateTypeScript()],
      ['ESLint', () => this.validateLinting()],
      ['Production Build', () => this.validateBuild()],
      ['Build Output', () => this.validateBuildOutput()]
    ];
    
    for (const [name, checkFn] of criticalChecks) {
      await this.runCheck(name, checkFn);
    }
    
    // Run warning checks (can have issues but won't fail deployment)
    const warningChecks = [
      ['Configuration', () => this.validateConfiguration()]
    ];
    
    for (const [name, checkFn] of warningChecks) {
      await this.runWarningCheck(name, checkFn);
    }
    
    // Generate final report
    const report = await this.generateReport();
    
    this.log('');
    this.log('=== PRE-DEPLOYMENT VALIDATION COMPLETE ===');
    this.log(`Duration: ${Math.round(report.duration / 1000)}s`);
    
    if (this.errors.length > 0) {
      this.log(`\n${this.errors.length} CRITICAL ERRORS:`, 'error');
      this.errors.forEach(({ check, error }) => {
        this.log(`  ${check}: ${error}`, 'error');
      });
    }
    
    if (this.warnings.length > 0) {
      this.log(`\n${this.warnings.length} WARNINGS:`, 'warning');
      this.warnings.forEach(({ check, warning }) => {
        this.log(`  ${check}: ${warning}`, 'warning');
      });
    }
    
    if (this.errors.length === 0) {
      this.log('\n\u2705 ALL CHECKS PASSED - READY FOR DEPLOYMENT', 'success');
      
      // Record successful validation
      try {
        execSync('node scripts/build-metrics-dashboard.js record-build success 0 pre-deployment-validation', { stdio: 'pipe' });
      } catch (error) {
        // Don't fail if metrics recording fails
      }
      
      return 0;
    } else {
      this.log('\n\u274c DEPLOYMENT BLOCKED - FIX ERRORS BEFORE DEPLOYING', 'error');
      
      // Record failed validation
      try {
        const firstError = this.errors[0];
        execSync(`node scripts/build-metrics-dashboard.js record-build failure 0 "${firstError.check}: ${firstError.error}"`, { stdio: 'pipe' });
      } catch (error) {
        // Don't fail if metrics recording fails
      }
      
      return 1;
    }
  }
}

// CLI Interface
if (require.main === module) {
  const checker = new PreDeploymentChecker();
  
  checker.run()
    .then(exitCode => {
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('\u274c Pre-deployment check failed:', error.message);
      process.exit(1);
    });
}

module.exports = PreDeploymentChecker;
