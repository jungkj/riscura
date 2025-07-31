#!/usr/bin/env node

/**
 * Workflow Metrics Dashboard
 * Efficiency metrics and bottleneck identification system
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

class WorkflowMetricsDashboard {
  constructor() {
    this.metricsFile = path.join(process.cwd(), '.workflow-metrics.json');
    this.reportsDir = path.join(process.cwd(), 'reports', 'workflow');
    this.baselineFile = path.join(this.reportsDir, 'baseline-metrics.json');
  }

  /**
   * Initialize metrics system
   */
  async init() {
    console.log(chalk.cyan.bold('📊 Initializing Workflow Metrics Dashboard\n'));
    
    // Create reports directory
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
    
    // Initialize metrics file
    const initialMetrics = {
      version: '1.0.0',
      initialized: new Date().toISOString(),
      
      // JSX Error Metrics
      jsxErrors: {
        totalDetected: 0,
        totalFixed: 0,
        averageResolutionTime: 0, // minutes
        errorsByType: {},
        preventionRate: 0, // percentage caught before commit
        trends: {
          daily: [],
          weekly: [],
          monthly: []
        }
      },
      
      // Build Performance Metrics
      buildMetrics: {
        totalBuilds: 0,
        successfulBuilds: 0,
        failedBuilds: 0,
        successRate: 100,
        averageBuildTime: 0, // seconds
        buildTimeHistory: [],
        failureReasons: {},
        recoveryTime: [] // time to fix failed builds
      },
      
      // Refactoring Efficiency Metrics
      refactoringMetrics: {
        totalRefactorings: 0,
        averageFilesPerRefactoring: 0,
        averageTimePerFile: 0, // minutes
        successRate: 100,
        rollbackRate: 0,
        automationEfficiency: 0, // percentage of work automated
        timesByRiskLevel: {
          low: [],
          medium: [],
          high: []
        }
      },
      
      // Team Productivity Metrics
      teamMetrics: {
        developerVelocity: 0, // story points per sprint
        codeReviewTime: 0, // hours
        deploymentFrequency: 0, // per week
        leadTime: 0, // hours from commit to production
        changeFailureRate: 0, // percentage
        meanTimeToRecovery: 0 // hours
      },
      
      // Bottleneck Analysis
      bottlenecks: {
        identifiedBottlenecks: [],
        resolvedBottlenecks: [],
        topTimeConsumers: [],
        inefficiencyPatterns: []
      },
      
      // Workflow Health Score
      healthScore: {
        overall: 85, // 0-100
        components: {
          jsxPrevention: 85,
          buildStability: 90,
          refactoringEfficiency: 80,
          teamProductivity: 85,
          automationLevel: 75
        }
      },
      
      lastUpdated: new Date().toISOString()
    };
    
    if (!fs.existsSync(this.metricsFile)) {
      fs.writeFileSync(this.metricsFile, JSON.stringify(initialMetrics, null, 2));
      console.log(chalk.green('✓ Initialized metrics tracking'));
    }
    
    // Create baseline if it doesn't exist
    if (!fs.existsSync(this.baselineFile)) {
      await this.createBaseline();
    }
    
    console.log(chalk.green.bold('\n✅ Metrics dashboard initialized!\n'));
    console.log(chalk.blue('Available commands:'));
    console.log(chalk.gray('  npm run metrics:dashboard    - View current dashboard'));
    console.log(chalk.gray('  npm run metrics:report       - Generate detailed report'));
    console.log(chalk.gray('  npm run metrics:trends       - View trend analysis'));
    console.log(chalk.gray('  npm run metrics:bottlenecks  - Identify bottlenecks'));
    console.log(chalk.gray('  npm run metrics:health       - View workflow health score'));
  }
  
  /**
   * Create performance baseline
   */
  async createBaseline() {
    console.log(chalk.blue('📍 Creating performance baseline...'));
    
    const baseline = {
      createdAt: new Date().toISOString(),
      
      // Measure current build time
      buildTime: await this.measureBuildTime(),
      
      // Measure current JSX validation time
      jsxValidationTime: await this.measureJSXValidationTime(),
      
      // Count current files
      fileCount: await this.countProjectFiles(),
      
      // Measure type check time
      typeCheckTime: await this.measureTypeCheckTime(),
      
      // Git metrics
      gitMetrics: await this.gatherGitMetrics()
    };
    
    fs.writeFileSync(this.baselineFile, JSON.stringify(baseline, null, 2));
    console.log(chalk.green('✓ Baseline created'));
    
    return baseline;
  }
  
  /**
   * Measure build time
   */
  async measureBuildTime() {
    try {
      const startTime = Date.now();
      execSync('npm run build', { stdio: 'pipe' });
      const buildTime = (Date.now() - startTime) / 1000;
      return buildTime;
    } catch (error) {
      return null; // Build failed
    }
  }
  
  /**
   * Measure JSX validation time
   */
  async measureJSXValidationTime() {
    try {
      const startTime = Date.now();
      execSync('npm run jsx:monitor', { stdio: 'pipe' });
      const validationTime = (Date.now() - startTime) / 1000;
      return validationTime;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Count project files
   */
  async countProjectFiles() {
    try {
      const result = execSync('find src -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" -o -name "*.js" | wc -l', 
                              { encoding: 'utf8' });
      return parseInt(result.trim());
    } catch (error) {
      return 0;
    }
  }
  
  /**
   * Measure type check time
   */
  async measureTypeCheckTime() {
    try {
      const startTime = Date.now();
      execSync('npm run type-check', { stdio: 'pipe' });
      const typeCheckTime = (Date.now() - startTime) / 1000;
      return typeCheckTime;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Gather Git metrics
   */
  async gatherGitMetrics() {
    try {
      const commitCount = execSync('git rev-list --count HEAD', { encoding: 'utf8' }).trim();
      const contributors = execSync('git shortlog -sn | wc -l', { encoding: 'utf8' }).trim();
      const recentCommits = execSync('git log --oneline -10', { encoding: 'utf8' });
      
      return {
        totalCommits: parseInt(commitCount),
        contributors: parseInt(contributors),
        recentActivity: recentCommits.split('\n').length
      };
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Record workflow event
   */
  recordEvent(eventType, data) {
    if (!fs.existsSync(this.metricsFile)) {
      console.log(chalk.yellow('⚠️  Metrics file not found. Run metrics:init first.'));
      return;
    }
    
    const metrics = JSON.parse(fs.readFileSync(this.metricsFile, 'utf8'));
    const timestamp = new Date().toISOString();
    
    switch (eventType) {
      case 'jsx-error-detected':
        metrics.jsxErrors.totalDetected++;
        metrics.jsxErrors.errorsByType[data.errorType] = 
          (metrics.jsxErrors.errorsByType[data.errorType] || 0) + 1;
        
        // Add to daily trend
        const today = new Date().toDateString();
        const dailyEntry = metrics.jsxErrors.trends.daily.find(d => d.date === today);
        if (dailyEntry) {
          dailyEntry.count++;
        } else {
          metrics.jsxErrors.trends.daily.push({ date: today, count: 1 });
        }
        break;
        
      case 'jsx-error-fixed':
        metrics.jsxErrors.totalFixed++;
        if (data.resolutionTime) {
          metrics.jsxErrors.averageResolutionTime = 
            (metrics.jsxErrors.averageResolutionTime + data.resolutionTime) / 2;
        }
        break;
        
      case 'build-started':
        metrics.buildMetrics.totalBuilds++;
        metrics.buildStartTime = timestamp;
        break;
        
      case 'build-completed':
        if (data.success) {
          metrics.buildMetrics.successfulBuilds++;
        } else {
          metrics.buildMetrics.failedBuilds++;
          metrics.buildMetrics.failureReasons[data.reason] = 
            (metrics.buildMetrics.failureReasons[data.reason] || 0) + 1;
        }
        
        if (data.buildTime) {
          metrics.buildMetrics.buildTimeHistory.push({
            timestamp,
            duration: data.buildTime,
            success: data.success
          });
          
          // Update average
          const successfulTimes = metrics.buildMetrics.buildTimeHistory
            .filter(b => b.success)
            .map(b => b.duration);
          metrics.buildMetrics.averageBuildTime = 
            successfulTimes.reduce((a, b) => a + b, 0) / successfulTimes.length;
        }
        
        // Update success rate
        metrics.buildMetrics.successRate = 
          (metrics.buildMetrics.successfulBuilds / metrics.buildMetrics.totalBuilds) * 100;
        break;
        
      case 'refactoring-started':
        metrics.refactoringMetrics.totalRefactorings++;
        metrics.currentRefactoring = {
          startTime: timestamp,
          filesAffected: data.filesAffected || 0,
          riskLevel: data.riskLevel || 'medium'
        };
        break;
        
      case 'refactoring-completed':
        if (metrics.currentRefactoring) {
          const duration = (new Date() - new Date(metrics.currentRefactoring.startTime)) / (1000 * 60); // minutes
          const filesAffected = metrics.currentRefactoring.filesAffected;
          
          if (filesAffected > 0) {
            const timePerFile = duration / filesAffected;
            metrics.refactoringMetrics.averageTimePerFile = 
              (metrics.refactoringMetrics.averageTimePerFile + timePerFile) / 2;
            
            metrics.refactoringMetrics.averageFilesPerRefactoring = 
              (metrics.refactoringMetrics.averageFilesPerRefactoring + filesAffected) / 2;
          }
          
          // Record time by risk level
          const riskLevel = metrics.currentRefactoring.riskLevel;
          metrics.refactoringMetrics.timesByRiskLevel[riskLevel].push({
            timestamp,
            duration,
            filesAffected,
            success: data.success !== false
          });
          
          delete metrics.currentRefactoring;
        }
        
        if (data.rollback) {
          metrics.refactoringMetrics.rollbackRate = 
            ((metrics.refactoringMetrics.rollbackRate * 
              (metrics.refactoringMetrics.totalRefactorings - 1)) + 1) / 
            metrics.refactoringMetrics.totalRefactorings;
        }
        break;
        
      case 'bottleneck-identified':
        metrics.bottlenecks.identifiedBottlenecks.push({
          timestamp,
          type: data.type,
          description: data.description,
          impact: data.impact,
          status: 'identified'
        });
        break;
        
      case 'bottleneck-resolved':
        const bottleneck = metrics.bottlenecks.identifiedBottlenecks
          .find(b => b.description === data.description);
        if (bottleneck) {
          bottleneck.status = 'resolved';
          bottleneck.resolvedAt = timestamp;
          bottleneck.solution = data.solution;
          
          metrics.bottlenecks.resolvedBottlenecks.push(bottleneck);
        }
        break;
    }
    
    // Update health score
    this.calculateHealthScore(metrics);
    
    metrics.lastUpdated = timestamp;
    fs.writeFileSync(this.metricsFile, JSON.stringify(metrics, null, 2));
  }
  
  /**
   * Calculate overall workflow health score
   */
  calculateHealthScore(metrics) {
    const scores = {
      jsxPrevention: Math.min(100, 100 - (metrics.jsxErrors.totalDetected * 2)),
      buildStability: metrics.buildMetrics.successRate,
      refactoringEfficiency: Math.max(0, 100 - (metrics.refactoringMetrics.rollbackRate * 20)),
      teamProductivity: 85, // This would be calculated from team metrics
      automationLevel: metrics.refactoringMetrics.automationEfficiency || 75
    };
    
    const overall = Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length;
    
    metrics.healthScore = {
      overall: Math.round(overall),
      components: scores
    };
  }
  
  /**
   * Display metrics dashboard
   */
  displayDashboard() {
    if (!fs.existsSync(this.metricsFile)) {
      console.log(chalk.yellow('No metrics available. Run metrics:init first.'));
      return;
    }
    
    const metrics = JSON.parse(fs.readFileSync(this.metricsFile, 'utf8'));
    
    console.log(chalk.cyan.bold('📊 Workflow Metrics Dashboard\n'));
    
    // Overall Health Score
    const healthColor = metrics.healthScore.overall >= 80 ? chalk.green : 
                       metrics.healthScore.overall >= 60 ? chalk.yellow : chalk.red;
    console.log(chalk.blue('🏅 Overall Health Score:'), healthColor(metrics.healthScore.overall + '%'));
    
    // Component Health Scores
    console.log(chalk.blue('\n🔍 Component Health:'));
    Object.entries(metrics.healthScore.components).forEach(([component, score]) => {
      const color = score >= 80 ? chalk.green : score >= 60 ? chalk.yellow : chalk.red;
      console.log(`  ${component}: ${color(score + '%')}`);
    });
    
    // JSX Error Metrics
    console.log(chalk.blue('\n🔧 JSX Error Metrics:'));
    console.log(`  Total detected: ${chalk.yellow(metrics.jsxErrors.totalDetected)}`);
    console.log(`  Total fixed: ${chalk.green(metrics.jsxErrors.totalFixed)}`);
    console.log(`  Average resolution time: ${chalk.cyan(metrics.jsxErrors.averageResolutionTime.toFixed(1))}m`);
    console.log(`  Prevention rate: ${chalk.green(metrics.jsxErrors.preventionRate)}%`);
    
    // Most common error types
    if (Object.keys(metrics.jsxErrors.errorsByType).length > 0) {
      console.log('  Top error types:');
      const sortedErrors = Object.entries(metrics.jsxErrors.errorsByType)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3);
      sortedErrors.forEach(([type, count]) => {
        console.log(`    ${type}: ${count}`);
      });
    }
    
    // Build Metrics
    console.log(chalk.blue('\n🏗️  Build Metrics:'));
    console.log(`  Total builds: ${chalk.cyan(metrics.buildMetrics.totalBuilds)}`);
    console.log(`  Success rate: ${chalk.green(metrics.buildMetrics.successRate.toFixed(1))}%`);
    console.log(`  Average build time: ${chalk.cyan(metrics.buildMetrics.averageBuildTime.toFixed(1))}s`);
    
    if (metrics.buildMetrics.totalBuilds > 0) {
      const recentBuilds = metrics.buildMetrics.buildTimeHistory.slice(-5);
      if (recentBuilds.length > 0) {
        console.log('  Recent build times:');
        recentBuilds.forEach(build => {
          const color = build.success ? chalk.green : chalk.red;
          const status = build.success ? '✓' : '✗';
          console.log(`    ${color(status)} ${build.duration.toFixed(1)}s`);
        });
      }
    }
    
    // Refactoring Metrics
    console.log(chalk.blue('\n♻️  Refactoring Metrics:'));
    console.log(`  Total refactorings: ${chalk.cyan(metrics.refactoringMetrics.totalRefactorings)}`);
    console.log(`  Average time per file: ${chalk.cyan(metrics.refactoringMetrics.averageTimePerFile.toFixed(1))}m`);
    console.log(`  Rollback rate: ${chalk.yellow(metrics.refactoringMetrics.rollbackRate.toFixed(1))}%`);
    console.log(`  Automation efficiency: ${chalk.green(metrics.refactoringMetrics.automationEfficiency)}%`);
    
    // Bottlenecks
    if (metrics.bottlenecks.identifiedBottlenecks.length > 0) {
      console.log(chalk.blue('\n⚠️  Active Bottlenecks:'));
      const activeBottlenecks = metrics.bottlenecks.identifiedBottlenecks
        .filter(b => b.status === 'identified');
      activeBottlenecks.forEach(bottleneck => {
        console.log(`  ${chalk.red('•')} ${bottleneck.description} (${bottleneck.impact})`);
      });
    }
    
    console.log(chalk.gray(`\nLast updated: ${new Date(metrics.lastUpdated).toLocaleString()}`));
  }
  
  /**
   * Generate detailed report
   */
  generateReport(type = 'full') {
    if (!fs.existsSync(this.metricsFile)) {
      console.log(chalk.yellow('No metrics available. Run metrics:init first.'));
      return;
    }
    
    const metrics = JSON.parse(fs.readFileSync(this.metricsFile, 'utf8'));
    const reportDate = new Date().toISOString().split('T')[0];
    const reportFile = path.join(this.reportsDir, `workflow-report-${reportDate}.md`);
    
    let report = `# Workflow Metrics Report\n\nGenerated: ${new Date().toLocaleString()}\n\n`;
    
    // Executive Summary
    report += `## Executive Summary\n\n`;
    report += `- **Overall Health Score**: ${metrics.healthScore.overall}%\n`;
    report += `- **JSX Errors**: ${metrics.jsxErrors.totalDetected} detected, ${metrics.jsxErrors.totalFixed} fixed\n`;
    report += `- **Build Success Rate**: ${metrics.buildMetrics.successRate.toFixed(1)}%\n`;
    report += `- **Refactoring Efficiency**: ${metrics.refactoringMetrics.totalRefactorings} completed\n\n`;
    
    // Detailed Metrics
    if (type === 'full') {
      report += `## JSX Error Analysis\n\n`;
      report += `### Error Distribution\n\n`;
      Object.entries(metrics.jsxErrors.errorsByType).forEach(([type, count]) => {
        report += `- **${type}**: ${count} occurrences\n`;
      });
      
      report += `\n### Resolution Metrics\n\n`;
      report += `- Average resolution time: ${metrics.jsxErrors.averageResolutionTime.toFixed(1)} minutes\n`;
      report += `- Prevention rate: ${metrics.jsxErrors.preventionRate}%\n\n`;
      
      report += `## Build Performance\n\n`;
      report += `- Total builds: ${metrics.buildMetrics.totalBuilds}\n`;
      report += `- Successful: ${metrics.buildMetrics.successfulBuilds}\n`;
      report += `- Failed: ${metrics.buildMetrics.failedBuilds}\n`;
      report += `- Average build time: ${metrics.buildMetrics.averageBuildTime.toFixed(1)} seconds\n\n`;
      
      if (Object.keys(metrics.buildMetrics.failureReasons).length > 0) {
        report += `### Build Failure Reasons\n\n`;
        Object.entries(metrics.buildMetrics.failureReasons).forEach(([reason, count]) => {
          report += `- **${reason}**: ${count} occurrences\n`;
        });
        report += `\n`;
      }
      
      report += `## Refactoring Analysis\n\n`;
      report += `- Total refactorings: ${metrics.refactoringMetrics.totalRefactorings}\n`;
      report += `- Average files per refactoring: ${metrics.refactoringMetrics.averageFilesPerRefactoring.toFixed(1)}\n`;
      report += `- Average time per file: ${metrics.refactoringMetrics.averageTimePerFile.toFixed(1)} minutes\n`;
      report += `- Rollback rate: ${metrics.refactoringMetrics.rollbackRate.toFixed(1)}%\n\n`;
      
      // Bottlenecks
      if (metrics.bottlenecks.identifiedBottlenecks.length > 0) {
        report += `## Identified Bottlenecks\n\n`;
        metrics.bottlenecks.identifiedBottlenecks.forEach(bottleneck => {
          const status = bottleneck.status === 'resolved' ? '✅' : '⚠️ ';
          report += `${status} **${bottleneck.description}**\n`;
          report += `   - Impact: ${bottleneck.impact}\n`;
          report += `   - Identified: ${new Date(bottleneck.timestamp).toLocaleString()}\n`;
          if (bottleneck.resolvedAt) {
            report += `   - Resolved: ${new Date(bottleneck.resolvedAt).toLocaleString()}\n`;
            report += `   - Solution: ${bottleneck.solution}\n`;
          }
          report += `\n`;
        });
      }
    }
    
    // Recommendations
    report += `## Recommendations\n\n`;
    const recommendations = this.generateRecommendations(metrics);
    recommendations.forEach(rec => {
      const priority = rec.priority === 'high' ? '🔴' : 
                      rec.priority === 'medium' ? '🟡' : '🟢';
      report += `${priority} **${rec.title}**\n`;
      report += `   ${rec.description}\n\n`;
    });
    
    fs.writeFileSync(reportFile, report);
    console.log(chalk.green(`✓ Report generated: ${reportFile}`));
    
    return reportFile;
  }
  
  /**
   * Generate recommendations based on metrics
   */
  generateRecommendations(metrics) {
    const recommendations = [];
    
    // JSX Error recommendations
    if (metrics.jsxErrors.totalDetected > 10) {
      recommendations.push({
        priority: 'high',
        title: 'Implement Real-time JSX Validation',
        description: 'High JSX error count detected. Set up file watchers and IDE integration to catch errors earlier.'
      });
    }
    
    if (metrics.jsxErrors.averageResolutionTime > 30) {
      recommendations.push({
        priority: 'medium',
        title: 'Improve JSX Error Resolution Process',
        description: 'Resolution time is above 30 minutes. Consider better tooling and automated fixes.'
      });
    }
    
    // Build recommendations
    if (metrics.buildMetrics.successRate < 90) {
      recommendations.push({
        priority: 'high',
        title: 'Improve Build Stability',
        description: 'Build success rate is below 90%. Implement stronger pre-commit validation.'
      });
    }
    
    if (metrics.buildMetrics.averageBuildTime > 120) {
      recommendations.push({
        priority: 'medium',
        title: 'Optimize Build Performance',
        description: 'Build time exceeds 2 minutes. Consider build optimization and caching strategies.'
      });
    }
    
    // Refactoring recommendations
    if (metrics.refactoringMetrics.rollbackRate > 10) {
      recommendations.push({
        priority: 'high',
        title: 'Strengthen Refactoring Process',
        description: 'High rollback rate indicates process issues. Review and improve refactoring SOPs.'
      });
    }
    
    if (metrics.refactoringMetrics.averageTimePerFile > 10) {
      recommendations.push({
        priority: 'medium',
        title: 'Improve Refactoring Efficiency',
        description: 'Time per file is high. Implement better automation and batch processing.'
      });
    }
    
    // Health score recommendations
    if (metrics.healthScore.overall < 70) {
      recommendations.push({
        priority: 'high',
        title: 'Critical Workflow Health Issues',
        description: 'Overall health score is below 70%. Immediate attention required for workflow optimization.'
      });
    }
    
    return recommendations;
  }
  
  /**
   * Analyze trends
   */
  analyzeTrends() {
    if (!fs.existsSync(this.metricsFile)) {
      console.log(chalk.yellow('No metrics available. Run metrics:init first.'));
      return;
    }
    
    const metrics = JSON.parse(fs.readFileSync(this.metricsFile, 'utf8'));
    
    console.log(chalk.cyan.bold('📈 Trend Analysis\n'));
    
    // JSX Error Trends
    if (metrics.jsxErrors.trends.daily.length > 0) {
      console.log(chalk.blue('🔧 JSX Error Trends:'));
      const recentDays = metrics.jsxErrors.trends.daily.slice(-7);
      recentDays.forEach(day => {
        const color = day.count === 0 ? chalk.green : 
                     day.count < 5 ? chalk.yellow : chalk.red;
        console.log(`  ${day.date}: ${color(day.count)} errors`);
      });
      
      const trend = this.calculateTrend(recentDays.map(d => d.count));
      const trendColor = trend > 0 ? chalk.red : trend < 0 ? chalk.green : chalk.yellow;
      console.log(`  Trend: ${trendColor(trend > 0 ? 'Increasing' : trend < 0 ? 'Decreasing' : 'Stable')}`);
    }
    
    // Build Time Trends
    if (metrics.buildMetrics.buildTimeHistory.length > 0) {
      console.log(chalk.blue('\n🏗️  Build Time Trends:'));
      const recentBuilds = metrics.buildMetrics.buildTimeHistory.slice(-10);
      const avgTimes = [];
      
      for (let i = 0; i < recentBuilds.length; i += 2) {
        const batch = recentBuilds.slice(i, i + 2);
        const avgTime = batch.reduce((sum, build) => sum + build.duration, 0) / batch.length;
        avgTimes.push(avgTime);
      }
      
      const buildTrend = this.calculateTrend(avgTimes);
      const buildTrendColor = buildTrend > 0 ? chalk.red : buildTrend < 0 ? chalk.green : chalk.yellow;
      console.log(`  Recent average: ${chalk.cyan(avgTimes[avgTimes.length - 1]?.toFixed(1) || 'N/A')}s`);
      console.log(`  Trend: ${buildTrendColor(buildTrend > 0 ? 'Slowing' : buildTrend < 0 ? 'Improving' : 'Stable')}`);
    }
  }
  
  /**
   * Calculate trend direction
   */
  calculateTrend(values) {
    if (values.length < 2) return 0;
    
    const recent = values.slice(-3);
    const earlier = values.slice(-6, -3);
    
    if (earlier.length === 0) return 0;
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
    
    return recentAvg - earlierAvg;
  }
  
  /**
   * Identify bottlenecks
   */
  identifyBottlenecks() {
    console.log(chalk.cyan.bold('🔍 Bottleneck Analysis\n'));
    
    // Run automated bottleneck detection
    const bottlenecks = [];
    
    // Check build times
    const buildTime = this.measureBuildTime();
    if (buildTime && buildTime > 120) {
      bottlenecks.push({
        type: 'build-performance',
        description: 'Build time exceeds 2 minutes',
        impact: 'High - slows development cycle',
        severity: 'medium',
        suggestions: [
          'Enable webpack caching',
          'Optimize bundle splitting',
          'Review heavy dependencies'
        ]
      });
    }
    
    // Check JSX validation time
    const jsxTime = this.measureJSXValidationTime();
    if (jsxTime && jsxTime > 30) {
      bottlenecks.push({
        type: 'jsx-validation',
        description: 'JSX validation takes over 30 seconds',
        impact: 'Medium - slows commit process',
        severity: 'low',
        suggestions: [
          'Optimize ESLint configuration',
          'Use incremental validation',
          'Cache validation results'
        ]
      });
    }
    
    // Check file count growth
    const fileCount = this.countProjectFiles();
    if (fileCount > 500) {
      bottlenecks.push({
        type: 'codebase-size',
        description: `Large codebase with ${fileCount} files`,
        impact: 'Medium - affects tooling performance',
        severity: 'low',
        suggestions: [
          'Consider code splitting',
          'Archive unused components',
          'Implement lazy loading'
        ]
      });
    }
    
    // Display results
    if (bottlenecks.length === 0) {
      console.log(chalk.green('✅ No significant bottlenecks detected'));
    } else {
      bottlenecks.forEach((bottleneck, index) => {
        const severityColor = bottleneck.severity === 'high' ? chalk.red :
                             bottleneck.severity === 'medium' ? chalk.yellow : chalk.blue;
        
        console.log(`${index + 1}. ${severityColor(bottleneck.severity.toUpperCase())} - ${chalk.bold(bottleneck.description)}`);
        console.log(`   Impact: ${bottleneck.impact}`);
        console.log(`   Suggestions:`);
        bottleneck.suggestions.forEach(suggestion => {
          console.log(`     - ${suggestion}`);
        });
        console.log();
        
        // Record bottleneck
        this.recordEvent('bottleneck-identified', {
          type: bottleneck.type,
          description: bottleneck.description,
          impact: bottleneck.impact
        });
      });
    }
  }
}

// CLI Interface
const args = process.argv.slice(2);
const command = args[0];

const dashboard = new WorkflowMetricsDashboard();

switch (command) {
  case 'init':
    await dashboard.init();
    break;
  case 'dashboard':
    dashboard.displayDashboard();
    break;
  case 'report':
    const reportType = args[1] || 'full';
    dashboard.generateReport(reportType);
    break;
  case 'trends':
    dashboard.analyzeTrends();
    break;
  case 'bottlenecks':
    dashboard.identifyBottlenecks();
    break;
  case 'record':
    const eventType = args[1];
    const eventData = args[2] ? JSON.parse(args[2]) : {};
    dashboard.recordEvent(eventType, eventData);
    break;
  default:
    console.log(chalk.cyan.bold('📊 Workflow Metrics Dashboard\n'));
    console.log(chalk.blue('Available commands:'));
    console.log(chalk.gray('  init            - Initialize metrics system'));
    console.log(chalk.gray('  dashboard       - View current metrics'));
    console.log(chalk.gray('  report [type]   - Generate detailed report'));
    console.log(chalk.gray('  trends          - Analyze trends'));
    console.log(chalk.gray('  bottlenecks     - Identify bottlenecks'));
    console.log(chalk.gray('  record <event>  - Record workflow event'));
    break;
}

export { WorkflowMetricsDashboard };
