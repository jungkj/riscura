#!/usr/bin/env node
/**
 * Build Metrics Dashboard
 * Tracks build failures, deployment success rates, and developer productivity
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BuildMetricsDashboard {
  constructor() {
    this.metricsDir = path.join(process.cwd(), '.build-metrics');
    this.buildLogFile = path.join(this.metricsDir, 'builds.json');
    this.deploymentLogFile = path.join(this.metricsDir, 'deployments.json');
    this.developerMetricsFile = path.join(this.metricsDir, 'developer-metrics.json');
    this.dashboardFile = path.join(this.metricsDir, 'dashboard.html');
    
    this.ensureDirectories();
  }

  ensureDirectories() {
    if (!fs.existsSync(this.metricsDir)) {
      fs.mkdirSync(this.metricsDir, { recursive: true });
    }
  }

  async recordBuildAttempt(buildData) {
    const timestamp = new Date().toISOString();
    const buildRecord = {
      timestamp,
      commit: this.getCurrentCommit(),
      branch: this.getCurrentBranch(),
      actor: process.env.GITHUB_ACTOR || 'local',
      ...buildData
    };

    console.log('📈 Recording build attempt...');
    
    // Load existing build records
    let builds = [];
    if (fs.existsSync(this.buildLogFile)) {
      try {
        builds = JSON.parse(fs.readFileSync(this.buildLogFile, 'utf8'));
      } catch (error) {
        console.warn('Could not load existing build records:', error.message);
      }
    }

    builds.push(buildRecord);
    
    // Keep only last 1000 builds
    builds = builds.slice(-1000);
    
    fs.writeFileSync(this.buildLogFile, JSON.stringify(builds, null, 2));
    
    console.log(`Build record saved: ${buildData.status} in ${buildData.duration || 0}s`);
    return buildRecord;
  }

  async recordDeployment(deploymentData) {
    const timestamp = new Date().toISOString();
    const deploymentRecord = {
      timestamp,
      commit: this.getCurrentCommit(),
      branch: this.getCurrentBranch(),
      actor: process.env.GITHUB_ACTOR || 'local',
      ...deploymentData
    };

    console.log('🚀 Recording deployment...');
    
    // Load existing deployment records
    let deployments = [];
    if (fs.existsSync(this.deploymentLogFile)) {
      try {
        deployments = JSON.parse(fs.readFileSync(this.deploymentLogFile, 'utf8'));
      } catch (error) {
        console.warn('Could not load existing deployment records:', error.message);
      }
    }

    deployments.push(deploymentRecord);
    
    // Keep only last 500 deployments
    deployments = deployments.slice(-500);
    
    fs.writeFileSync(this.deploymentLogFile, JSON.stringify(deployments, null, 2));
    
    console.log(`Deployment record saved: ${deploymentData.status} to ${deploymentData.environment}`);
    return deploymentRecord;
  }

  async generateMetrics() {
    console.log('📊 Generating build metrics...');
    
    const metrics = {
      timestamp: new Date().toISOString(),
      builds: this.analyzeBuildMetrics(),
      deployments: this.analyzeDeploymentMetrics(),
      developer: this.analyzeDeveloperMetrics(),
      quality: this.analyzeQualityMetrics(),
      trends: this.analyzeTrends()
    };

    // Save metrics
    const metricsFile = path.join(this.metricsDir, 'latest-metrics.json');
    fs.writeFileSync(metricsFile, JSON.stringify(metrics, null, 2));
    
    return metrics;
  }

  analyzeBuildMetrics() {
    if (!fs.existsSync(this.buildLogFile)) {
      return { totalBuilds: 0, successRate: 0, averageDuration: 0 };
    }

    try {
      const builds = JSON.parse(fs.readFileSync(this.buildLogFile, 'utf8'));
      const last30Days = builds.filter(build => {
        const buildDate = new Date(build.timestamp);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return buildDate > thirtyDaysAgo;
      });

      const successful = last30Days.filter(b => b.status === 'success').length;
      const failed = last30Days.filter(b => b.status === 'failure').length;
      const totalBuilds = last30Days.length;
      
      const durations = last30Days
        .filter(b => b.duration && b.status === 'success')
        .map(b => b.duration);
      
      const averageDuration = durations.length > 0 ? 
        durations.reduce((sum, d) => sum + d, 0) / durations.length : 0;

      // Build failure patterns
      const failureReasons = {};
      last30Days.filter(b => b.status === 'failure').forEach(build => {
        const reason = build.failureReason || 'unknown';
        failureReasons[reason] = (failureReasons[reason] || 0) + 1;
      });

      // Recent build streak
      let currentStreak = 0;
      for (let i = builds.length - 1; i >= 0; i--) {
        if (builds[i].status === 'success') {
          currentStreak++;
        } else {
          break;
        }
      }

      return {
        totalBuilds,
        successful,
        failed,
        successRate: totalBuilds > 0 ? (successful / totalBuilds * 100).toFixed(1) : 0,
        averageDuration: Math.round(averageDuration),
        failureReasons,
        currentStreak,
        last30Days: last30Days.length
      };
    } catch (error) {
      console.warn('Error analyzing build metrics:', error.message);
      return { totalBuilds: 0, successRate: 0, averageDuration: 0 };
    }
  }

  analyzeDeploymentMetrics() {
    if (!fs.existsSync(this.deploymentLogFile)) {
      return { totalDeployments: 0, successRate: 0, averageTime: 0 };
    }

    try {
      const deployments = JSON.parse(fs.readFileSync(this.deploymentLogFile, 'utf8'));
      const last30Days = deployments.filter(deployment => {
        const deployDate = new Date(deployment.timestamp);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return deployDate > thirtyDaysAgo;
      });

      const successful = last30Days.filter(d => d.status === 'success').length;
      const failed = last30Days.filter(d => d.status === 'failure').length;
      const totalDeployments = last30Days.length;
      
      // Environment breakdown
      const environments = {};
      last30Days.forEach(deployment => {
        const env = deployment.environment || 'unknown';
        if (!environments[env]) {
          environments[env] = { total: 0, successful: 0 };
        }
        environments[env].total++;
        if (deployment.status === 'success') {
          environments[env].successful++;
        }
      });

      // Rollback rate
      const rollbacks = last30Days.filter(d => d.type === 'rollback').length;
      const rollbackRate = totalDeployments > 0 ? (rollbacks / totalDeployments * 100).toFixed(1) : 0;

      return {
        totalDeployments,
        successful,
        failed,
        successRate: totalDeployments > 0 ? (successful / totalDeployments * 100).toFixed(1) : 0,
        environments,
        rollbacks,
        rollbackRate,
        last30Days: last30Days.length
      };
    } catch (error) {
      console.warn('Error analyzing deployment metrics:', error.message);
      return { totalDeployments: 0, successRate: 0, averageTime: 0 };
    }
  }

  analyzeDeveloperMetrics() {
    try {
      const jsxMetricsPath = path.join(process.cwd(), '.jsx-metrics', 'jsx-errors.json');
      let jsxData = { errorRate: 0, trendsImproving: false };
      
      if (fs.existsSync(jsxMetricsPath)) {
        const jsxResults = JSON.parse(fs.readFileSync(jsxMetricsPath, 'utf8'));
        if (jsxResults.length > 0) {
          const latest = jsxResults[jsxResults.length - 1];
          jsxData.errorRate = latest.summary.totalFiles > 0 ? 
            (latest.summary.errorFiles / latest.summary.totalFiles * 100).toFixed(1) : 0;
          
          // Check if trend is improving
          if (jsxResults.length > 1) {
            const previous = jsxResults[jsxResults.length - 2];
            const latestRate = latest.summary.errorFiles / latest.summary.totalFiles;
            const previousRate = previous.summary.errorFiles / previous.summary.totalFiles;
            jsxData.trendsImproving = latestRate < previousRate;
          }
        }
      }

      // Get commit frequency and developer activity
      const commitActivity = this.getCommitActivity();
      
      return {
        jsxErrorRate: jsxData.errorRate,
        jsxTrendsImproving: jsxData.trendsImproving,
        commitActivity,
        codeQuality: this.assessCodeQuality()
      };
    } catch (error) {
      console.warn('Error analyzing developer metrics:', error.message);
      return { jsxErrorRate: 0, trendsImproving: false };
    }
  }

  analyzeQualityMetrics() {
    try {
      // Analyze codebase structure
      const srcStats = this.analyzeSourceCode();
      
      // Check test coverage if available
      const testCoverage = this.getTestCoverage();
      
      // Check for common quality indicators
      const qualityScore = this.calculateQualityScore(srcStats, testCoverage);
      
      return {
        ...srcStats,
        testCoverage,
        qualityScore
      };
    } catch (error) {
      console.warn('Error analyzing quality metrics:', error.message);
      return { qualityScore: 0 };
    }
  }

  analyzeSourceCode() {
    try {
      const jsxFiles = execSync('find src -name "*.tsx" -o -name "*.jsx"', { encoding: 'utf8' })
        .trim().split('\n').filter(f => f.length > 0);
      
      const tsFiles = execSync('find src -name "*.ts"', { encoding: 'utf8' })
        .trim().split('\n').filter(f => f.length > 0);
      
      const componentFiles = execSync('find src/components -name "*.tsx" 2>/dev/null || echo ""', { encoding: 'utf8' })
        .trim().split('\n').filter(f => f.length > 0 && f !== '');
      
      const pageFiles = execSync('find src/app -name "page.tsx" -o -name "page.ts" 2>/dev/null || echo ""', { encoding: 'utf8' })
        .trim().split('\n').filter(f => f.length > 0 && f !== '');
      
      return {
        totalJSXFiles: jsxFiles.length,
        totalTSFiles: tsFiles.length,
        componentFiles: componentFiles.length,
        pageFiles: pageFiles.length,
        totalFiles: jsxFiles.length + tsFiles.length
      };
    } catch (error) {
      console.warn('Error analyzing source code:', error.message);
      return { totalFiles: 0 };
    }
  }

  getTestCoverage() {
    try {
      // Try to read Jest coverage report
      const coverageFile = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
      if (fs.existsSync(coverageFile)) {
        const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
        return {
          lines: coverage.total.lines.pct,
          statements: coverage.total.statements.pct,
          functions: coverage.total.functions.pct,
          branches: coverage.total.branches.pct
        };
      }
    } catch (error) {
      console.warn('Could not read test coverage:', error.message);
    }
    
    return { lines: 0, statements: 0, functions: 0, branches: 0 };
  }

  calculateQualityScore(srcStats, testCoverage) {
    let score = 0;
    
    // File organization score (0-25)
    if (srcStats.componentFiles > 0) score += 10;
    if (srcStats.pageFiles > 0) score += 5;
    if (srcStats.totalFiles > 10) score += 10;
    
    // Test coverage score (0-25)
    const avgCoverage = (testCoverage.lines + testCoverage.statements + testCoverage.functions + testCoverage.branches) / 4;
    score += Math.min(25, avgCoverage * 0.25);
    
    // Build success score (0-25)
    const buildMetrics = this.analyzeBuildMetrics();
    score += Math.min(25, buildMetrics.successRate * 0.25);
    
    // JSX quality score (0-25)
    const devMetrics = this.analyzeDeveloperMetrics();
    const jsxScore = Math.max(0, 25 - (devMetrics.jsxErrorRate * 2.5));
    score += jsxScore;
    
    return Math.round(score);
  }

  getCommitActivity() {
    try {
      const last7Days = execSync('git log --since="7 days ago" --oneline', { encoding: 'utf8' })
        .trim().split('\n').filter(line => line.length > 0).length;
      
      const last30Days = execSync('git log --since="30 days ago" --oneline', { encoding: 'utf8' })
        .trim().split('\n').filter(line => line.length > 0).length;
      
      return {
        last7Days,
        last30Days,
        averagePerDay: (last7Days / 7).toFixed(1)
      };
    } catch (error) {
      console.warn('Error getting commit activity:', error.message);
      return { last7Days: 0, last30Days: 0, averagePerDay: 0 };
    }
  }

  analyzeTrends() {
    const trends = {
      buildSuccess: [],
      deploymentSuccess: [],
      jsxQuality: []
    };
    
    try {
      // Build success trend (last 7 days)
      if (fs.existsSync(this.buildLogFile)) {
        const builds = JSON.parse(fs.readFileSync(this.buildLogFile, 'utf8'));
        const last7Days = this.getLast7Days();
        
        last7Days.forEach(date => {
          const dayBuilds = builds.filter(b => b.timestamp.startsWith(date));
          const successRate = dayBuilds.length > 0 ? 
            (dayBuilds.filter(b => b.status === 'success').length / dayBuilds.length * 100) : 0;
          
          trends.buildSuccess.push({ date, successRate, total: dayBuilds.length });
        });
      }
      
      // Similar for deployment success
      if (fs.existsSync(this.deploymentLogFile)) {
        const deployments = JSON.parse(fs.readFileSync(this.deploymentLogFile, 'utf8'));
        const last7Days = this.getLast7Days();
        
        last7Days.forEach(date => {
          const dayDeployments = deployments.filter(d => d.timestamp.startsWith(date));
          const successRate = dayDeployments.length > 0 ? 
            (dayDeployments.filter(d => d.status === 'success').length / dayDeployments.length * 100) : 0;
          
          trends.deploymentSuccess.push({ date, successRate, total: dayDeployments.length });
        });
      }
    } catch (error) {
      console.warn('Error analyzing trends:', error.message);
    }
    
    return trends;
  }

  getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  }

  generateDashboard(metrics) {
    console.log('📊 Generating HTML dashboard...');
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Build Metrics Dashboard - Riscura</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; }
        .dashboard { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header h1 { color: #333; margin-bottom: 10px; }
        .header p { color: #666; font-size: 14px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric-card h3 { color: #333; margin-bottom: 15px; font-size: 16px; }
        .metric-value { font-size: 32px; font-weight: bold; margin-bottom: 5px; }
        .metric-label { color: #666; font-size: 14px; }
        .success { color: #10b981; }
        .warning { color: #f59e0b; }
        .danger { color: #ef4444; }
        .chart-container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .status-indicator { display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-right: 8px; }
        .status-good { background: #10b981; }
        .status-warning { background: #f59e0b; }
        .status-error { background: #ef4444; }
        .details-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .details-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .failure-reasons { list-style: none; }
        .failure-reasons li { padding: 8px 0; border-bottom: 1px solid #eee; }
        .failure-reasons li:last-child { border-bottom: none; }
        .updated { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="header">
            <h1>📈 Build Metrics Dashboard</h1>
            <p>Real-time monitoring of build performance, deployment success, and code quality metrics</p>
            <p><strong>Last Updated:</strong> ${new Date(metrics.timestamp).toLocaleString()}</p>
        </div>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <h3>🏗️ Build Success Rate</h3>
                <div class="metric-value ${parseFloat(metrics.builds.successRate) >= 90 ? 'success' : parseFloat(metrics.builds.successRate) >= 70 ? 'warning' : 'danger'}">
                    ${metrics.builds.successRate}%
                </div>
                <div class="metric-label">${metrics.builds.totalBuilds} builds (30 days)</div>
                <div class="metric-label">Current streak: ${metrics.builds.currentStreak} ✅</div>
            </div>
            
            <div class="metric-card">
                <h3>🚀 Deployment Success</h3>
                <div class="metric-value ${parseFloat(metrics.deployments.successRate) >= 95 ? 'success' : parseFloat(metrics.deployments.successRate) >= 80 ? 'warning' : 'danger'}">
                    ${metrics.deployments.successRate}%
                </div>
                <div class="metric-label">${metrics.deployments.totalDeployments} deployments</div>
                <div class="metric-label">Rollback rate: ${metrics.deployments.rollbackRate}%</div>
            </div>
            
            <div class="metric-card">
                <h3>🔧 JSX Code Quality</h3>
                <div class="metric-value ${parseFloat(metrics.developer.jsxErrorRate) <= 5 ? 'success' : parseFloat(metrics.developer.jsxErrorRate) <= 15 ? 'warning' : 'danger'}">
                    ${100 - parseFloat(metrics.developer.jsxErrorRate)}%
                </div>
                <div class="metric-label">Error rate: ${metrics.developer.jsxErrorRate}%</div>
                <div class="metric-label">
                    <span class="status-indicator ${metrics.developer.jsxTrendsImproving ? 'status-good' : 'status-warning'}"></span>
                    ${metrics.developer.jsxTrendsImproving ? 'Improving' : 'Stable'}
                </div>
            </div>
            
            <div class="metric-card">
                <h3>📊 Overall Quality Score</h3>
                <div class="metric-value ${metrics.quality.qualityScore >= 80 ? 'success' : metrics.quality.qualityScore >= 60 ? 'warning' : 'danger'}">
                    ${metrics.quality.qualityScore}/100
                </div>
                <div class="metric-label">${metrics.quality.totalFiles} source files</div>
                <div class="metric-label">${metrics.quality.componentFiles} components</div>
            </div>
        </div>
        
        <div class="chart-container">
            <h3>📈 Build Success Trend (7 days)</h3>
            <canvas id="buildTrendChart" width="400" height="200"></canvas>
        </div>
        
        <div class="details-grid">
            <div class="details-card">
                <h3>🚨 Common Build Failures</h3>
                <ul class="failure-reasons">
                    ${Object.entries(metrics.builds.failureReasons || {})
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5)
                      .map(([reason, count]) => `<li><strong>${reason}:</strong> ${count} occurrences</li>`)
                      .join('')}
                    ${Object.keys(metrics.builds.failureReasons || {}).length === 0 ? '<li>No recent build failures ✅</li>' : ''}
                </ul>
            </div>
            
            <div class="details-card">
                <h3>📋 Development Activity</h3>
                <ul class="failure-reasons">
                    <li><strong>Commits (7 days):</strong> ${metrics.developer.commitActivity.last7Days}</li>
                    <li><strong>Commits (30 days):</strong> ${metrics.developer.commitActivity.last30Days}</li>
                    <li><strong>Daily average:</strong> ${metrics.developer.commitActivity.averagePerDay}</li>
                    <li><strong>Build duration:</strong> ${metrics.builds.averageDuration}s avg</li>
                </ul>
            </div>
            
            <div class="details-card">
                <h3>🌍 Deployment Environments</h3>
                <ul class="failure-reasons">
                    ${Object.entries(metrics.deployments.environments || {})
                      .map(([env, data]) => {
                        const rate = data.total > 0 ? ((data.successful / data.total) * 100).toFixed(1) : 0;
                        return `<li><strong>${env}:</strong> ${rate}% success (${data.successful}/${data.total})</li>`;
                      })
                      .join('')}
                    ${Object.keys(metrics.deployments.environments || {}).length === 0 ? '<li>No recent deployments</li>' : ''}
                </ul>
            </div>
            
            <div class="details-card">
                <h3>🧪 Test Coverage</h3>
                <ul class="failure-reasons">
                    <li><strong>Lines:</strong> ${metrics.quality.testCoverage.lines}%</li>
                    <li><strong>Statements:</strong> ${metrics.quality.testCoverage.statements}%</li>
                    <li><strong>Functions:</strong> ${metrics.quality.testCoverage.functions}%</li>
                    <li><strong>Branches:</strong> ${metrics.quality.testCoverage.branches}%</li>
                </ul>
            </div>
        </div>
        
        <div class="updated">
            Dashboard auto-refreshes every 5 minutes • 
            Generated at ${new Date().toLocaleString()}
        </div>
    </div>
    
    <script>
        // Build trend chart
        const ctx = document.getElementById('buildTrendChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ${JSON.stringify(metrics.trends.buildSuccess.map(d => new Date(d.date).toLocaleDateString()))},
                datasets: [{
                    label: 'Build Success Rate (%)',
                    data: ${JSON.stringify(metrics.trends.buildSuccess.map(d => d.successRate))},
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
        
        // Auto-refresh every 5 minutes
        setTimeout(() => {
            window.location.reload();
        }, 300000);
    </script>
</body>
</html>`;
    
    fs.writeFileSync(this.dashboardFile, html);
    console.log(`✅ Dashboard generated: ${this.dashboardFile}`);
    console.log(`Open in browser: file://${this.dashboardFile}`);
  }

  async generateReport() {
    console.log('📈 Generating comprehensive build metrics report...');
    
    const metrics = await this.generateMetrics();
    
    console.log('\n=== BUILD METRICS REPORT ===');
    console.log(`Generated: ${new Date(metrics.timestamp).toLocaleString()}`);
    console.log('');
    
    console.log('🏗️ BUILD PERFORMANCE:');
    console.log(`  Success Rate: ${metrics.builds.successRate}% (${metrics.builds.successful}/${metrics.builds.totalBuilds})`);
    console.log(`  Failed Builds: ${metrics.builds.failed}`);
    console.log(`  Current Success Streak: ${metrics.builds.currentStreak}`);
    console.log(`  Average Build Time: ${metrics.builds.averageDuration}s`);
    
    if (Object.keys(metrics.builds.failureReasons).length > 0) {
      console.log('\n  Top Failure Reasons:');
      Object.entries(metrics.builds.failureReasons)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .forEach(([reason, count]) => {
          console.log(`    ${reason}: ${count}`);
        });
    }
    
    console.log('\n🚀 DEPLOYMENT PERFORMANCE:');
    console.log(`  Success Rate: ${metrics.deployments.successRate}% (${metrics.deployments.successful}/${metrics.deployments.totalDeployments})`);
    console.log(`  Rollback Rate: ${metrics.deployments.rollbackRate}%`);
    
    if (Object.keys(metrics.deployments.environments).length > 0) {
      console.log('\n  Environment Success Rates:');
      Object.entries(metrics.deployments.environments).forEach(([env, data]) => {
        const rate = data.total > 0 ? ((data.successful / data.total) * 100).toFixed(1) : 0;
        console.log(`    ${env}: ${rate}% (${data.successful}/${data.total})`);
      });
    }
    
    console.log('\n🔧 CODE QUALITY:');
    console.log(`  JSX Error Rate: ${metrics.developer.jsxErrorRate}%`);
    console.log(`  Quality Score: ${metrics.quality.qualityScore}/100`);
    console.log(`  Total Files: ${metrics.quality.totalFiles}`);
    console.log(`  Components: ${metrics.quality.componentFiles}`);
    
    console.log('\n📋 DEVELOPMENT ACTIVITY:');
    console.log(`  Commits (7 days): ${metrics.developer.commitActivity.last7Days}`);
    console.log(`  Daily Average: ${metrics.developer.commitActivity.averagePerDay}`);
    
    console.log('\n============================\n');
    
    // Generate HTML dashboard
    this.generateDashboard(metrics);
    
    return metrics;
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
  const dashboard = new BuildMetricsDashboard();
  const command = process.argv[2] || 'report';
  
  switch (command) {
    case 'report':
      dashboard.generateReport()
        .then(() => {
          console.log('✅ Build metrics report generated successfully');
        })
        .catch(error => {
          console.error('❌ Report generation failed:', error.message);
          process.exit(1);
        });
      break;
      
    case 'record-build':
      const buildStatus = process.argv[3] || 'success';
      const buildDuration = parseInt(process.argv[4]) || 0;
      const failureReason = process.argv[5];
      
      dashboard.recordBuildAttempt({
        status: buildStatus,
        duration: buildDuration,
        failureReason: failureReason
      })
        .then(() => {
          console.log('✅ Build attempt recorded');
        })
        .catch(error => {
          console.error('❌ Failed to record build:', error.message);
        });
      break;
      
    case 'record-deployment':
      const deployStatus = process.argv[3] || 'success';
      const environment = process.argv[4] || 'preview';
      const deploymentUrl = process.argv[5];
      
      dashboard.recordDeployment({
        status: deployStatus,
        environment: environment,
        url: deploymentUrl
      })
        .then(() => {
          console.log('✅ Deployment recorded');
        })
        .catch(error => {
          console.error('❌ Failed to record deployment:', error.message);
        });
      break;
      
    default:
      console.log('Usage: build-metrics-dashboard.js [report|record-build|record-deployment]');
      console.log('  report                                    - Generate metrics report and dashboard');
      console.log('  record-build <status> <duration> [reason] - Record build attempt');
      console.log('  record-deployment <status> <env> [url]    - Record deployment');
  }
}

module.exports = BuildMetricsDashboard;
