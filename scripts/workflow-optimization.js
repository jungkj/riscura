#!/usr/bin/env node

/**
 * Workflow Optimization Hub
 * Centralized system for preventing JSX errors and optimizing development workflows
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

class WorkflowOptimizer {
  constructor() {
    this.metricsFile = path.join(process.cwd(), '.workflow-metrics.json');
    this.configFile = path.join(process.cwd(), '.workflow-config.json');
    this.defaultConfig = {
      jsxValidation: {
        preCommit: true,
        prePush: true,
        realTime: true,
        autoFix: true
      },
      refactoringRules: {
        requireReviewForMassChanges: true,
        massChangeThreshold: 5,
        requireTestsForComponentChanges: true,
        componentChangePattern: /components\//
      },
      notifications: {
        slack: false,
        teams: false,
        discord: false,
        webhookUrl: null
      },
      metrics: {
        trackBuildTimes: true,
        trackErrorRates: true,
        trackRefactoringImpact: true
      }
    };
  }

  /**
   * Initialize workflow optimization system
   */
  async init() {
    console.log(chalk.cyan.bold('🚀 Initializing Workflow Optimization System\n'));
    
    // Create config if it doesn't exist
    if (!fs.existsSync(this.configFile)) {
      fs.writeFileSync(this.configFile, JSON.stringify(this.defaultConfig, null, 2));
      console.log(chalk.green('✓ Created workflow configuration'));
    }
    
    // Initialize metrics file
    if (!fs.existsSync(this.metricsFile)) {
      const initialMetrics = {
        jsxErrors: {
          daily: [],
          weekly: [],
          monthly: []
        },
        buildMetrics: {
          successRate: 100,
          averageBuildTime: 0,
          deploymentFrequency: 0
        },
        refactoringMetrics: {
          filesChanged: 0,
          errorsIntroduced: 0,
          timeToResolution: 0
        },
        lastUpdated: new Date().toISOString()
      };
      fs.writeFileSync(this.metricsFile, JSON.stringify(initialMetrics, null, 2));
      console.log(chalk.green('✓ Initialized metrics tracking'));
    }
    
    // Set up git hooks
    await this.setupGitHooks();
    
    // Set up file watchers
    await this.setupFileWatchers();
    
    console.log(chalk.green.bold('\n✅ Workflow optimization system initialized!\n'));
    console.log(chalk.blue('Available commands:'));
    console.log(chalk.gray('  npm run workflow:validate    - Run full validation'));
    console.log(chalk.gray('  npm run workflow:metrics     - View current metrics'));
    console.log(chalk.gray('  npm run workflow:health      - Check workflow health'));
    console.log(chalk.gray('  npm run workflow:optimize    - Run optimization suggestions'));
  }

  /**
   * Set up git hooks for JSX validation
   */
  async setupGitHooks() {
    const hooksDir = path.join(process.cwd(), '.git', 'hooks');
    
    if (!fs.existsSync(hooksDir)) {
      console.log(chalk.yellow('⚠️  Git hooks directory not found'));
      return;
    }

    // Pre-commit hook
    const preCommitHook = `#!/bin/sh
# JSX Validation Pre-commit Hook

echo "🔍 Running JSX validation..."

# Run JSX validator
npm run jsx:monitor
JSX_EXIT_CODE=$?

if [ $JSX_EXIT_CODE -ne 0 ]; then
  echo "❌ JSX validation failed. Auto-fixing..."
  npm run jsx:fix
  
  echo "✅ JSX errors auto-fixed. Please review changes and commit again."
  exit 1
fi

echo "✅ JSX validation passed"
exit 0
`;

    const preCommitPath = path.join(hooksDir, 'pre-commit');
    fs.writeFileSync(preCommitPath, preCommitHook);
    execSync(`chmod +x "${preCommitPath}"`);
    
    console.log(chalk.green('✓ Set up pre-commit JSX validation hook'));

    // Pre-push hook for comprehensive validation
    const prePushHook = `#!/bin/sh
# Comprehensive validation before push

echo "🚀 Running comprehensive validation..."

# Type check
npm run type-check:full
if [ $? -ne 0 ]; then
  echo "❌ Type check failed"
  exit 1
fi

# Lint check
npm run lint:strict
if [ $? -ne 0 ]; then
  echo "❌ Lint check failed"
  exit 1
fi

# Build test
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Build failed"
  exit 1
fi

echo "✅ All validations passed"
exit 0
`;

    const prePushPath = path.join(hooksDir, 'pre-push');
    fs.writeFileSync(prePushPath, prePushHook);
    execSync(`chmod +x "${prePushPath}"`);
    
    console.log(chalk.green('✓ Set up pre-push comprehensive validation hook'));
  }

  /**
   * Set up file watchers for real-time validation
   */
  async setupFileWatchers() {
    // This would typically use chokidar or similar for file watching
    // For now, we'll create a monitoring script that can be run periodically
    
    const watcherScript = `#!/usr/bin/env node

/**
 * Real-time JSX file watcher
 * Monitors JSX/TSX files for syntax errors
 */

import chokidar from 'chokidar';
import { execSync } from 'child_process';
import chalk from 'chalk';
import path from 'path';

const watcher = chokidar.watch('src/**/*.{tsx,jsx}', {
  ignored: /node_modules/,
  persistent: true
});

console.log(chalk.blue('👀 Watching JSX/TSX files for changes...'));

watcher.on('change', async (filePath) => {
  console.log(chalk.yellow(\`📝 File changed: \${filePath}\`));
  
  try {
    // Quick validation of the changed file
    execSync(\`npm run jsx:fix:file "\${filePath}"\`, { stdio: 'inherit' });
    console.log(chalk.green(\`✅ \${path.basename(filePath)} validated\`));
  } catch (error) {
    console.log(chalk.red(\`❌ Validation failed for \${path.basename(filePath)}\`));
  }
});

process.on('SIGINT', () => {
  console.log(chalk.blue('\n👋 File watcher stopped'));
  process.exit(0);
});
`;

    const watcherPath = path.join(process.cwd(), 'scripts', 'jsx-watcher.js');
    fs.writeFileSync(watcherPath, watcherScript);
    
    console.log(chalk.green('✓ Created real-time JSX file watcher'));
  }

  /**
   * Validate current workflow health
   */
  async validateWorkflow() {
    console.log(chalk.cyan.bold('🔍 Running Workflow Validation\n'));
    
    const results = {
      jsxValidation: false,
      typeCheck: false,
      linting: false,
      buildTest: false,
      gitHooks: false
    };

    try {
      // JSX Validation
      console.log(chalk.blue('📋 Running JSX validation...'));
      execSync('npm run jsx:monitor', { stdio: 'pipe' });
      results.jsxValidation = true;
      console.log(chalk.green('✓ JSX validation passed'));
    } catch (error) {
      console.log(chalk.red('❌ JSX validation failed'));
    }

    try {
      // Type Check
      console.log(chalk.blue('🔍 Running type check...'));
      execSync('npm run type-check:full', { stdio: 'pipe' });
      results.typeCheck = true;
      console.log(chalk.green('✓ Type check passed'));
    } catch (error) {
      console.log(chalk.red('❌ Type check failed'));
    }

    try {
      // Linting
      console.log(chalk.blue('🧹 Running lint check...'));
      execSync('npm run lint:strict', { stdio: 'pipe' });
      results.linting = true;
      console.log(chalk.green('✓ Linting passed'));
    } catch (error) {
      console.log(chalk.red('❌ Linting failed'));
    }

    try {
      // Build Test
      console.log(chalk.blue('🏗️  Running build test...'));
      execSync('npm run build', { stdio: 'pipe' });
      results.buildTest = true;
      console.log(chalk.green('✓ Build test passed'));
    } catch (error) {
      console.log(chalk.red('❌ Build test failed'));
    }

    // Check git hooks
    const preCommitPath = path.join(process.cwd(), '.git', 'hooks', 'pre-commit');
    const prePushPath = path.join(process.cwd(), '.git', 'hooks', 'pre-push');
    
    if (fs.existsSync(preCommitPath) && fs.existsSync(prePushPath)) {
      results.gitHooks = true;
      console.log(chalk.green('✓ Git hooks configured'));
    } else {
      console.log(chalk.red('❌ Git hooks missing'));
    }

    // Summary
    const passed = Object.values(results).filter(Boolean).length;
    const total = Object.keys(results).length;
    const percentage = Math.round((passed / total) * 100);

    console.log(chalk.cyan.bold('\n📊 Workflow Health Summary:'));
    console.log(`Health Score: ${percentage >= 80 ? chalk.green(percentage + '%') : chalk.red(percentage + '%')}`);
    console.log(`Passed: ${chalk.green(passed)}/${total}`);

    if (percentage < 100) {
      console.log(chalk.yellow('\n💡 Recommendations:'));
      if (!results.jsxValidation) console.log(chalk.gray('  - Run: npm run jsx:fix'));
      if (!results.typeCheck) console.log(chalk.gray('  - Fix TypeScript errors'));
      if (!results.linting) console.log(chalk.gray('  - Run: npm run lint:fix'));
      if (!results.buildTest) console.log(chalk.gray('  - Fix build errors'));
      if (!results.gitHooks) console.log(chalk.gray('  - Run: npm run workflow:init'));
    }

    return results;
  }

  /**
   * Display current workflow metrics
   */
  displayMetrics() {
    if (!fs.existsSync(this.metricsFile)) {
      console.log(chalk.yellow('No metrics data available. Run workflow:init first.'));
      return;
    }

    const metrics = JSON.parse(fs.readFileSync(this.metricsFile, 'utf8'));
    
    console.log(chalk.cyan.bold('📈 Workflow Metrics Dashboard\n'));
    
    // JSX Error Trends
    console.log(chalk.blue('🔧 JSX Error Trends:'));
    console.log(`  Daily errors: ${metrics.jsxErrors.daily.length}`);
    console.log(`  Weekly errors: ${metrics.jsxErrors.weekly.length}`);
    console.log(`  Monthly errors: ${metrics.jsxErrors.monthly.length}`);
    
    // Build Metrics
    console.log(chalk.blue('\n🏗️  Build Metrics:'));
    console.log(`  Success rate: ${chalk.green(metrics.buildMetrics.successRate + '%')}`);
    console.log(`  Average build time: ${metrics.buildMetrics.averageBuildTime}s`);
    console.log(`  Deployment frequency: ${metrics.buildMetrics.deploymentFrequency}/week`);
    
    // Refactoring Impact
    console.log(chalk.blue('\n♻️  Refactoring Impact:'));
    console.log(`  Files changed in last refactor: ${metrics.refactoringMetrics.filesChanged}`);
    console.log(`  Errors introduced: ${metrics.refactoringMetrics.errorsIntroduced}`);
    console.log(`  Time to resolution: ${metrics.refactoringMetrics.timeToResolution}h`);
    
    console.log(chalk.gray(`\nLast updated: ${new Date(metrics.lastUpdated).toLocaleString()}`));
  }

  /**
   * Record workflow event for metrics
   */
  recordEvent(type, data) {
    if (!fs.existsSync(this.metricsFile)) return;
    
    const metrics = JSON.parse(fs.readFileSync(this.metricsFile, 'utf8'));
    const now = new Date().toISOString();
    
    switch (type) {
      case 'jsx-error':
        metrics.jsxErrors.daily.push({ timestamp: now, ...data });
        break;
      case 'build-success':
        metrics.buildMetrics.successRate = Math.min(100, metrics.buildMetrics.successRate + 1);
        break;
      case 'build-failure':
        metrics.buildMetrics.successRate = Math.max(0, metrics.buildMetrics.successRate - 5);
        break;
      case 'refactoring-start':
        metrics.refactoringMetrics.filesChanged = data.filesChanged || 0;
        metrics.refactoringMetrics.startTime = now;
        break;
      case 'refactoring-complete':
        if (metrics.refactoringMetrics.startTime) {
          const startTime = new Date(metrics.refactoringMetrics.startTime);
          const endTime = new Date(now);
          metrics.refactoringMetrics.timeToResolution = (endTime - startTime) / (1000 * 60 * 60); // hours
        }
        metrics.refactoringMetrics.errorsIntroduced = data.errorsIntroduced || 0;
        break;
    }
    
    metrics.lastUpdated = now;
    fs.writeFileSync(this.metricsFile, JSON.stringify(metrics, null, 2));
  }

  /**
   * Provide optimization suggestions
   */
  async getOptimizationSuggestions() {
    console.log(chalk.cyan.bold('💡 Workflow Optimization Suggestions\n'));
    
    const suggestions = [];
    
    // Check recent git history for patterns
    try {
      const recentCommits = execSync('git log --oneline -10', { encoding: 'utf8' });
      
      if (recentCommits.includes('JSX') || recentCommits.includes('syntax')) {
        suggestions.push({
          priority: 'high',
          type: 'jsx-prevention',
          title: 'Implement real-time JSX validation',
          description: 'Recent commits show JSX syntax fixes. Set up file watchers to catch these early.',
          action: 'npm run workflow:watch'
        });
      }
      
      if (recentCommits.includes('fix:') || recentCommits.includes('Fix')) {
        suggestions.push({
          priority: 'medium',
          type: 'quality-gates',
          title: 'Strengthen pre-commit hooks',
          description: 'Many fix commits detected. Enhance automated validation before commits.',
          action: 'Review and strengthen git hooks'
        });
      }
    } catch (error) {
      // Git not available or other error
    }
    
    // Check for large file changes
    try {
      const changedFiles = execSync('git diff --name-only HEAD~5', { encoding: 'utf8' }).split('\n').filter(Boolean);
      
      if (changedFiles.length > 20) {
        suggestions.push({
          priority: 'high',
          type: 'refactoring-process',
          title: 'Implement staged refactoring process',
          description: `${changedFiles.length} files changed recently. Consider breaking large refactors into smaller chunks.`,
          action: 'Create refactoring checklist and review process'
        });
      }
    } catch (error) {
      // Git not available or other error
    }
    
    // Always-applicable suggestions
    suggestions.push(
      {
        priority: 'medium',
        type: 'automation',
        title: 'Enable automated dependency updates',
        description: 'Set up Dependabot or Renovate for automatic dependency management.',
        action: 'Configure dependency update automation'
      },
      {
        priority: 'low',
        type: 'monitoring',
        title: 'Implement build performance monitoring',
        description: 'Track build times and identify optimization opportunities.',
        action: 'Set up build performance metrics'
      }
    );
    
    // Display suggestions
    suggestions.forEach((suggestion, index) => {
      const priorityColor = suggestion.priority === 'high' ? chalk.red : 
                           suggestion.priority === 'medium' ? chalk.yellow : chalk.blue;
      
      console.log(`${index + 1}. ${priorityColor(suggestion.priority.toUpperCase())} - ${chalk.bold(suggestion.title)}`);
      console.log(`   ${chalk.gray(suggestion.description)}`);
      console.log(`   ${chalk.cyan('Action:')} ${suggestion.action}\n`);
    });
    
    return suggestions;
  }
}

// CLI Interface
const args = process.argv.slice(2);
const command = args[0];

const optimizer = new WorkflowOptimizer();

switch (command) {
  case 'init':
    await optimizer.init();
    break;
  case 'validate':
    await optimizer.validateWorkflow();
    break;
  case 'metrics':
    optimizer.displayMetrics();
    break;
  case 'optimize':
    await optimizer.getOptimizationSuggestions();
    break;
  case 'record':
    const eventType = args[1];
    const eventData = args[2] ? JSON.parse(args[2]) : {};
    optimizer.recordEvent(eventType, eventData);
    break;
  default:
    console.log(chalk.cyan.bold('🚀 Workflow Optimizer\n'));
    console.log(chalk.blue('Available commands:'));
    console.log(chalk.gray('  init      - Initialize workflow optimization'));
    console.log(chalk.gray('  validate  - Run workflow health check'));
    console.log(chalk.gray('  metrics   - Display current metrics'));
    console.log(chalk.gray('  optimize  - Get optimization suggestions'));
    console.log(chalk.gray('  record    - Record workflow event'));
    break;
}

export { WorkflowOptimizer };
