#!/usr/bin/env node
/**
 * JSX Error Monitor & Analytics System
 * Tracks JSX syntax errors, build failures, and developer productivity metrics
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class JSXErrorMonitor {
  constructor() {
    this.metricsDir = path.join(process.cwd(), '.jsx-metrics');
    this.logFile = path.join(this.metricsDir, 'jsx-errors.json');
    this.trendsFile = path.join(this.metricsDir, 'trends.json');
    this.configFile = path.join(this.metricsDir, 'config.json');
    
    this.ensureDirectories();
    this.loadConfig();
  }

  ensureDirectories() {
    if (!fs.existsSync(this.metricsDir)) {
      fs.mkdirSync(this.metricsDir, { recursive: true });
    }
  }

  loadConfig() {
    const defaultConfig = {
      errorPatterns: {
        unclosedTags: /<[A-Za-z][^>]*$/,
        missingClosingBrackets: /<[^/>]*[^/>]$/,
        invalidExpressions: /\{[^}]*$/,
        componentNaming: /<[a-z][A-Za-z]*/,
        missingImports: /React is not defined/,
        jsxSyntaxError: /Unexpected token/,
        unexpectedToken: /SyntaxError.*Unexpected token/
      },
      alertThresholds: {
        errorRate: 0.1, // Alert if error rate > 10%
        buildFailures: 3,  // Alert after 3 consecutive failures
        timeToFix: 1800   // Alert if errors not fixed within 30 minutes
      },
      tracking: {
        enabled: true,
        collectFileStats: true,
        trackDeveloperMetrics: true,
        retentionDays: 30
      }
    };

    if (fs.existsSync(this.configFile)) {
      try {
        const userConfig = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
        this.config = { ...defaultConfig, ...userConfig };
      } catch (error) {
        console.warn('Error loading config, using defaults:', error.message);
        this.config = defaultConfig;
      }
    } else {
      this.config = defaultConfig;
      this.saveConfig();
    }
  }

  saveConfig() {
    fs.writeFileSync(this.configFile, JSON.stringify(this.config, null, 2));
  }

  async scanForJSXErrors() {
    console.log('🔍 Scanning for JSX syntax errors...');
    
    const results = {
      timestamp: new Date().toISOString(),
      commit: this.getCurrentCommit(),
      branch: this.getCurrentBranch(),
      errors: [],
      warnings: [],
      fileStats: {},
      summary: {
        totalFiles: 0,
        errorFiles: 0,
        warningFiles: 0,
        cleanFiles: 0
      }
    };

    try {
      // Find all JSX/TSX files
      const jsxFiles = this.findJSXFiles();
      results.summary.totalFiles = jsxFiles.length;

      console.log(`Found ${jsxFiles.length} JSX/TSX files to analyze`);

      // Analyze each file
      for (const file of jsxFiles) {
        const fileAnalysis = await this.analyzeFile(file);
        
        if (fileAnalysis.errors.length > 0) {
          results.errors.push(...fileAnalysis.errors);
          results.summary.errorFiles++;
        }
        
        if (fileAnalysis.warnings.length > 0) {
          results.warnings.push(...fileAnalysis.warnings);
          results.summary.warningFiles++;
        }
        
        if (fileAnalysis.errors.length === 0 && fileAnalysis.warnings.length === 0) {
          results.summary.cleanFiles++;
        }
        
        results.fileStats[file] = {
          errors: fileAnalysis.errors.length,
          warnings: fileAnalysis.warnings.length,
          size: fs.statSync(file).size,
          lastModified: fs.statSync(file).mtime.toISOString()
        };
      }

      // Run ESLint for additional validation
      const eslintResults = await this.runESLintValidation();
      results.eslintSummary = eslintResults;

      // Save results
      await this.saveResults(results);
      
      // Update trends
      await this.updateTrends(results);
      
      // Check for alerts
      await this.checkAlerts(results);
      
      return results;
    } catch (error) {
      console.error('Error during JSX scan:', error);
      throw error;
    }
  }

  findJSXFiles() {
    try {
      const output = execSync('find src -name "*.tsx" -o -name "*.jsx"', { encoding: 'utf8' });
      return output.trim().split('\n').filter(file => file.length > 0);
    } catch (error) {
      console.warn('Error finding JSX files:', error.message);
      return [];
    }
  }

  async analyzeFile(filePath) {
    const analysis = {
      file: filePath,
      errors: [],
      warnings: []
    };

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');

      // Check for each error pattern
      for (const [errorType, pattern] of Object.entries(this.config.errorPatterns)) {
        lines.forEach((line, index) => {
          if (pattern.test(line)) {
            analysis.errors.push({
              type: errorType,
              file: filePath,
              line: index + 1,
              content: line.trim(),
              severity: this.getErrorSeverity(errorType)
            });
          }
        });
      }

      // Check for component structure issues
      this.checkComponentStructure(content, filePath, analysis);
      
    } catch (error) {
      analysis.errors.push({
        type: 'fileReadError',
        file: filePath,
        line: 0,
        content: error.message,
        severity: 'high'
      });
    }

    return analysis;
  }

  checkComponentStructure(content, filePath, analysis) {
    // Check for missing React import in older React versions
    if (content.includes('<') && !content.includes('import React') && !content.includes('from "react"')) {
      // Only warn for .jsx files or if JSX is used without React 17+ automatic runtime
      if (filePath.endsWith('.jsx')) {
        analysis.warnings.push({
          type: 'missingReactImport',
          file: filePath,
          line: 1,
          content: 'Missing React import for JSX usage',
          severity: 'medium'
        });
      }
    }

    // Check for unmatched brackets
    const openBrackets = (content.match(/{/g) || []).length;
    const closeBrackets = (content.match(/}/g) || []).length;
    
    if (openBrackets !== closeBrackets) {
      analysis.errors.push({
        type: 'unmatchedBrackets',
        file: filePath,
        line: 0,
        content: `Unmatched brackets: ${openBrackets} open, ${closeBrackets} close`,
        severity: 'high'
      });
    }
  }

  async runESLintValidation() {
    try {
      console.log('🔧 Running ESLint JSX validation...');
      
      const eslintCommand = `npx eslint src/ --ext .tsx,.jsx \
        --rule 'react/jsx-closing-tag-location: error' \
        --rule 'react/jsx-no-undef: error' \
        --rule 'react/jsx-pascal-case: error' \
        --format json`;
      
      const output = execSync(eslintCommand, { encoding: 'utf8' });
      const results = JSON.parse(output);
      
      const summary = {
        totalFiles: results.length,
        errorCount: results.reduce((sum, file) => sum + file.errorCount, 0),
        warningCount: results.reduce((sum, file) => sum + file.warningCount, 0),
        fixableErrorCount: results.reduce((sum, file) => sum + file.fixableErrorCount, 0),
        fixableWarningCount: results.reduce((sum, file) => sum + file.fixableWarningCount, 0)
      };
      
      return summary;
    } catch (error) {
      // ESLint returns non-zero exit code when errors are found
      if (error.stdout) {
        try {
          const results = JSON.parse(error.stdout);
          return {
            totalFiles: results.length,
            errorCount: results.reduce((sum, file) => sum + file.errorCount, 0),
            warningCount: results.reduce((sum, file) => sum + file.warningCount, 0),
            hasErrors: true
          };
        } catch (parseError) {
          console.warn('Could not parse ESLint output');
        }
      }
      
      return {
        totalFiles: 0,
        errorCount: 0,
        warningCount: 0,
        hasErrors: false,
        error: error.message
      };
    }
  }

  getErrorSeverity(errorType) {
    const severityMap = {
      unclosedTags: 'high',
      missingClosingBrackets: 'high',
      invalidExpressions: 'high',
      unmatchedBrackets: 'high',
      componentNaming: 'medium',
      missingImports: 'medium',
      jsxSyntaxError: 'high',
      unexpectedToken: 'high'
    };
    
    return severityMap[errorType] || 'low';
  }

  async saveResults(results) {
    // Load existing results
    let existingResults = [];
    if (fs.existsSync(this.logFile)) {
      try {
        existingResults = JSON.parse(fs.readFileSync(this.logFile, 'utf8'));
      } catch (error) {
        console.warn('Could not load existing results:', error.message);
      }
    }

    // Add new results
    existingResults.push(results);
    
    // Keep only recent results (based on retention policy)
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - this.config.tracking.retentionDays);
    
    existingResults = existingResults.filter(result => 
      new Date(result.timestamp) > retentionDate
    );

    // Save updated results
    fs.writeFileSync(this.logFile, JSON.stringify(existingResults, null, 2));
    
    console.log(`📊 Results saved. Total errors: ${results.errors.length}, warnings: ${results.warnings.length}`);
  }

  async updateTrends(results) {
    let trends = { daily: [], weekly: [], monthly: [] };
    
    if (fs.existsSync(this.trendsFile)) {
      try {
        trends = JSON.parse(fs.readFileSync(this.trendsFile, 'utf8'));
      } catch (error) {
        console.warn('Could not load trends:', error.message);
      }
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Update daily trends
    const todayTrend = trends.daily.find(d => d.date === today);
    const trendData = {
      date: today,
      totalFiles: results.summary.totalFiles,
      errorFiles: results.summary.errorFiles,
      totalErrors: results.errors.length,
      totalWarnings: results.warnings.length,
      errorRate: results.summary.totalFiles > 0 ? results.summary.errorFiles / results.summary.totalFiles : 0,
      commit: results.commit,
      branch: results.branch
    };
    
    if (todayTrend) {
      Object.assign(todayTrend, trendData);
    } else {
      trends.daily.push(trendData);
    }
    
    // Keep only last 30 days for daily trends
    trends.daily = trends.daily.slice(-30);
    
    fs.writeFileSync(this.trendsFile, JSON.stringify(trends, null, 2));
  }

  async checkAlerts(results) {
    const alerts = [];
    
    // Error rate alert
    const errorRate = results.summary.totalFiles > 0 ? 
      results.summary.errorFiles / results.summary.totalFiles : 0;
    
    if (errorRate > this.config.alertThresholds.errorRate) {
      alerts.push({
        type: 'highErrorRate',
        severity: 'warning',
        message: `High JSX error rate detected: ${(errorRate * 100).toFixed(1)}%`,
        details: {
          errorFiles: results.summary.errorFiles,
          totalFiles: results.summary.totalFiles,
          threshold: this.config.alertThresholds.errorRate
        }
      });
    }
    
    // Critical errors alert
    const criticalErrors = results.errors.filter(e => e.severity === 'high');
    if (criticalErrors.length > 0) {
      alerts.push({
        type: 'criticalErrors',
        severity: 'error',
        message: `${criticalErrors.length} critical JSX errors found`,
        details: {
          errors: criticalErrors.slice(0, 5) // Show first 5 errors
        }
      });
    }
    
    if (alerts.length > 0) {
      console.log('\n🚨 ALERTS:');
      alerts.forEach(alert => {
        console.log(`${alert.severity.toUpperCase()}: ${alert.message}`);
      });
      
      // Save alerts
      const alertsFile = path.join(this.metricsDir, 'alerts.json');
      let allAlerts = [];
      
      if (fs.existsSync(alertsFile)) {
        try {
          allAlerts = JSON.parse(fs.readFileSync(alertsFile, 'utf8'));
        } catch (error) {
          console.warn('Could not load existing alerts:', error.message);
        }
      }
      
      allAlerts.push(...alerts.map(alert => ({
        ...alert,
        timestamp: new Date().toISOString(),
        commit: results.commit,
        branch: results.branch
      })));
      
      // Keep only last 100 alerts
      allAlerts = allAlerts.slice(-100);
      
      fs.writeFileSync(alertsFile, JSON.stringify(allAlerts, null, 2));
    }
    
    return alerts;
  }

  generateReport() {
    console.log('📊 Generating JSX Error Report...');
    
    if (!fs.existsSync(this.logFile)) {
      console.log('No data available. Run scan first.');
      return;
    }
    
    const results = JSON.parse(fs.readFileSync(this.logFile, 'utf8'));
    const latest = results[results.length - 1];
    
    if (!latest) {
      console.log('No recent scan data available.');
      return;
    }
    
    console.log('\n=== JSX Error Report ===');
    console.log(`Scan Date: ${new Date(latest.timestamp).toLocaleString()}`);
    console.log(`Commit: ${latest.commit}`);
    console.log(`Branch: ${latest.branch}`);
    console.log('');
    console.log('📈 Summary:');
    console.log(`  Total Files: ${latest.summary.totalFiles}`);
    console.log(`  Clean Files: ${latest.summary.cleanFiles}`);
    console.log(`  Files with Errors: ${latest.summary.errorFiles}`);
    console.log(`  Files with Warnings: ${latest.summary.warningFiles}`);
    console.log(`  Total Errors: ${latest.errors.length}`);
    console.log(`  Total Warnings: ${latest.warnings.length}`);
    
    const errorRate = latest.summary.totalFiles > 0 ? 
      (latest.summary.errorFiles / latest.summary.totalFiles * 100).toFixed(1) : 0;
    console.log(`  Error Rate: ${errorRate}%`);
    
    if (latest.errors.length > 0) {
      console.log('\n🚨 Top Error Types:');
      const errorTypes = {};
      latest.errors.forEach(error => {
        errorTypes[error.type] = (errorTypes[error.type] || 0) + 1;
      });
      
      Object.entries(errorTypes)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([type, count]) => {
          console.log(`  ${type}: ${count}`);
        });
    }
    
    if (latest.eslintSummary) {
      console.log('\n🔧 ESLint Summary:');
      console.log(`  Files Checked: ${latest.eslintSummary.totalFiles}`);
      console.log(`  Errors: ${latest.eslintSummary.errorCount}`);
      console.log(`  Warnings: ${latest.eslintSummary.warningCount}`);
      console.log(`  Auto-fixable: ${(latest.eslintSummary.fixableErrorCount || 0) + (latest.eslintSummary.fixableWarningCount || 0)}`);
    }
    
    // Show trends if available
    if (fs.existsSync(this.trendsFile)) {
      const trends = JSON.parse(fs.readFileSync(this.trendsFile, 'utf8'));
      if (trends.daily.length > 1) {
        const recent = trends.daily.slice(-7);
        const avgErrorRate = recent.reduce((sum, day) => sum + day.errorRate, 0) / recent.length;
        console.log('\n📊 7-Day Trend:');
        console.log(`  Average Error Rate: ${(avgErrorRate * 100).toFixed(1)}%`);
        
        const improvement = recent[0].errorRate - recent[recent.length - 1].errorRate;
        if (improvement > 0) {
          console.log(`  📈 Improvement: ${(improvement * 100).toFixed(1)}% better`);
        } else if (improvement < 0) {
          console.log(`  📉 Regression: ${(Math.abs(improvement) * 100).toFixed(1)}% worse`);
        }
      }
    }
    
    console.log('\n=========================\n');
  }

  getCurrentCommit() {
    try {
      return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    } catch (error) {
      return 'unknown';
    }
  }

  getCurrentBranch() {
    try {
      return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    } catch (error) {
      return 'unknown';
    }
  }
}

// CLI Interface
if (require.main === module) {
  const monitor = new JSXErrorMonitor();
  const command = process.argv[2] || 'scan';
  
  switch (command) {
    case 'scan':
      monitor.scanForJSXErrors()
        .then(results => {
          console.log('\n✅ JSX error scan completed');
          console.log(`Found ${results.errors.length} errors and ${results.warnings.length} warnings`);
          if (results.errors.length > 0) {
            process.exit(1);
          }
        })
        .catch(error => {
          console.error('❌ Scan failed:', error.message);
          process.exit(1);
        });
      break;
      
    case 'report':
      monitor.generateReport();
      break;
      
    case 'init':
      console.log('✅ JSX Error Monitor initialized');
      console.log(`Config saved to: ${monitor.configFile}`);
      break;
      
    default:
      console.log('Usage: jsx-error-monitor.js [scan|report|init]');
      console.log('  scan   - Scan for JSX errors (default)');
      console.log('  report - Generate error report');
      console.log('  init   - Initialize configuration');
  }
}

module.exports = JSXErrorMonitor;
