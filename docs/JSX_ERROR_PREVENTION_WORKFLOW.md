# JSX Error Prevention Workflow

## Overview

This document outlines the optimized workflow to prevent JSX syntax errors, particularly during large-scale refactoring operations like the DaisyUI migration.

## Problem Analysis

### Root Cause of JSX Errors
- **Component Name Changes**: During refactoring, component names are updated but closing tags remain unchanged
- **Manual Process**: Relying on manual find-and-replace operations across 79+ files
- **Late Detection**: Errors discovered during build/commit phase rather than in real-time
- **Inconsistent Validation**: Not all developers run validation before committing

### Error Patterns Identified
1. **Self-closing tag mismatches**: `<Button>` → `<Button />` 
2. **Component name mismatches**: `<OldComponent>` → `</NewComponent>`
3. **Missing closing brackets**: `<Component prop="value"`
4. **Invalid JSX attributes**: `class` instead of `className`

## Prevention Workflow

### Phase 1: Real-Time Prevention (During Development)

#### 1.1 IDE Configuration
```json
// .vscode/settings.json
{
  "eslint.validate": ["typescript", "typescriptreact"],
  "eslint.run": "onType",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.includePackageJsonAutoImports": "auto"
}
```

#### 1.2 Real-Time File Watching
```bash
# Start real-time JSX monitoring
npm run workflow:watch

# Or use the file watcher directly
node scripts/jsx-watcher.js
```

#### 1.3 Automated JSX Fixes on Save
- **ESLint integration**: Fixes common JSX issues automatically
- **Prettier formatting**: Ensures consistent tag formatting
- **Custom JSX rules**: Enforces project-specific conventions

### Phase 2: Pre-Commit Validation

#### 2.1 Git Hook Setup
```bash
# Initialize workflow system (sets up all hooks)
npm run workflow:init
```

#### 2.2 Pre-Commit Checks
1. **JSX Syntax Validation**
   ```bash
   npm run jsx:monitor
   ```
2. **Automatic Fix Attempt**
   ```bash
   npm run jsx:fix
   ```
3. **Type Checking**
   ```bash
   npm run type-check:full
   ```
4. **Lint Validation**
   ```bash
   npm run lint:strict
   ```

#### 2.3 Fail-Safe Mechanism
- If auto-fix succeeds: Commit proceeds with fixed files
- If auto-fix fails: Commit blocked with detailed error report
- Developer gets specific line numbers and fix suggestions

### Phase 3: Pre-Push Comprehensive Validation

#### 3.1 Full Build Test
```bash
# Comprehensive validation before push
npm run ci:validate
```

#### 3.2 Validation Steps
1. **JSX Monitoring**: `npm run jsx:monitor`
2. **Type Check**: `npm run type-check:full`
3. **Strict Linting**: `npm run lint:strict`
4. **Build Test**: `npm run build:vercel`
5. **Test Execution**: `npm run test:ci`

### Phase 4: CI/CD Integration

#### 4.1 GitHub Actions Workflow
```yaml
name: JSX Validation
on: [push, pull_request]

jobs:
  jsx-validation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - name: JSX Validation
        run: npm run jsx:monitor
      - name: Auto-fix JSX errors
        run: npm run jsx:fix
        if: failure()
      - name: Commit fixes
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add -A
          git diff --staged --quiet || git commit -m "fix: Auto-fix JSX syntax errors [skip ci]"
          git push
        if: failure()
```

## Refactoring Standard Operating Procedures

### Pre-Refactoring Checklist

#### 1. Planning Phase
- [ ] **Scope Assessment**: Identify all files that will be affected
- [ ] **Impact Analysis**: Estimate number of components/files to change
- [ ] **Risk Evaluation**: Identify high-risk changes (>20 files = high risk)
- [ ] **Team Communication**: Notify team of upcoming large-scale changes
- [ ] **Branch Strategy**: Create dedicated refactoring branch
- [ ] **Backup Strategy**: Ensure all work is committed and pushed

#### 2. Pre-Execution Setup
```bash
# 1. Record refactoring start
npm run workflow:record refactoring-start '{"filesChanged": 79}'

# 2. Create baseline metrics
npm run workflow:validate > pre-refactor-baseline.txt

# 3. Run initial JSX validation
npm run jsx:monitor
```

#### 3. Execution Phase

##### 3.1 Systematic Approach
1. **Change component definitions first**
2. **Use automated tools for bulk updates**
3. **Validate after each logical group of changes**
4. **Commit frequently with descriptive messages**

##### 3.2 Validation Checkpoints
```bash
# After every 10-15 file changes
npm run jsx:fix --dry-run  # Preview fixes
npm run jsx:fix           # Apply fixes
npm run type-check        # Quick type check
npm run lint:fix          # Fix linting issues
```

##### 3.3 Component Refactoring Pattern
```bash
# For each component group:
1. Update component definition
2. npm run jsx:fix:file <component-file>
3. Find all usages: grep -r "<OldComponentName" src/
4. Update usage files in batches
5. npm run jsx:fix --dry-run
6. Review and apply fixes
```

#### 4. Post-Execution Validation
```bash
# 1. Full validation suite
npm run ci:validate

# 2. Build test
npm run build:vercel

# 3. Test suite
npm run test:all

# 4. Record completion
npm run workflow:record refactoring-complete '{"errorsIntroduced": 0}'
```

### Emergency Rollback Procedure

If refactoring introduces widespread errors:

```bash
# 1. Immediate assessment
npm run jsx:monitor
npm run type-check:full

# 2. Auto-fix attempt
npm run jsx:fix

# 3. If auto-fix fails, rollback
git log --oneline -10  # Find last good commit
git reset --hard <last-good-commit>

# 4. Incremental re-approach
# Break the refactor into smaller chunks
```

## Team Communication Patterns

### Large-Scale Change Communication

#### 1. Pre-Change Notification
**Template for Team Notification:**
```markdown
🔧 **Large-Scale Refactoring Notice**

**What**: DaisyUI component migration
**When**: Starting [DATE] at [TIME]
**Duration**: Estimated [X] hours
**Files Affected**: ~79 files
**Branch**: feature/daisyui-refactoring

**Impact on Team**:
- Potential merge conflicts in component files
- Build may be temporarily unstable
- JSX syntax checks will be more strict

**Actions Required**:
- [ ] Complete current PRs targeting affected files
- [ ] Pull latest changes before starting new work
- [ ] Run `npm run workflow:validate` before committing

**Communication Channel**: #dev-team
**Updates**: Every 2 hours or at major milestones
```

#### 2. Progress Updates
**Hourly Update Template:**
```markdown
📊 **Refactoring Progress Update**

Completed: [X]/79 files (Y%)
Errors Fixed: [N] JSX syntax issues
Current Status: [Working on component group Z]
Next Milestone: [ETA for next major checkpoint]
Blocked Issues: [Any blockers or concerns]
```

#### 3. Completion Notification
```markdown
✅ **Refactoring Complete**

Summary:
- Files Changed: 79
- JSX Errors Fixed: [N]
- Build Status: ✅ Passing
- Test Status: ✅ All tests passing

Actions for Team:
- Pull latest changes: `git pull origin feature/daisyui-refactoring`
- Validate your local setup: `npm run workflow:validate`
- Review component usage in your branches

Merge to main: Scheduled for [DATE/TIME]
```

### Communication Channels

#### Slack/Teams Integration
```bash
# Set up webhook notifications
npm run workflow:init
# Configure webhook URL in .workflow-config.json

# Manual notifications
npm run workflow:notify "Refactoring started" "high"
npm run workflow:notify "Milestone reached: 50% complete" "medium"
```

#### Pull Request Templates
```markdown
## Large-Scale Refactoring PR

### Changes Summary
- Component library migration: [OLD] → [NEW]
- Files affected: [N] files
- JSX fixes applied: [N] automatic fixes

### Validation Checklist
- [ ] JSX syntax validation passed
- [ ] Type checking passed
- [ ] Build test passed
- [ ] All tests passing
- [ ] No console errors in dev mode

### Review Focus Areas
1. Component prop interfaces
2. Style/className changes
3. Accessibility attributes
4. Performance implications

### Testing Instructions
1. `npm run workflow:validate`
2. `npm run dev`
3. Test critical user flows: [LIST]

### Rollback Plan
If issues are found post-merge:
1. Immediate rollback: `git revert [commit-hash]`
2. Emergency hotfix branch: `hotfix/jsx-rollback`
3. Communication: Notify team immediately
```

## Efficiency Metrics

### Key Performance Indicators (KPIs)

#### 1. Error Prevention Rate
```javascript
// Metric: Percentage of JSX errors caught before commit
PreventionRate = (ErrorsCaughtPreCommit / TotalJSXErrors) * 100

// Target: >90%
// Current baseline: Track with npm run workflow:metrics
```

#### 2. Resolution Time
```javascript
// Metric: Average time from error detection to resolution
ResolutionTime = TotalFixTime / NumberOfErrors

// Target: <15 minutes per error
// Includes: Detection + Fix + Validation
```

#### 3. Refactoring Efficiency
```javascript
// Metric: Files successfully refactored per hour
RefactoringRate = FilesChanged / TimeSpent

// Target: >10 files/hour for systematic changes
// Includes: Change + Validation + Commit
```

#### 4. Build Success Rate
```javascript
// Metric: Percentage of builds that pass without JSX errors
BuildSuccessRate = (SuccessfulBuilds / TotalBuilds) * 100

// Target: >95%
// Tracked automatically with build hooks
```

### Bottleneck Identification

#### Common Bottlenecks and Solutions

1. **Manual File Discovery**
   - Problem: Finding all files that use a component
   - Solution: Automated grep-based discovery
   ```bash
   npm run find:component-usage <ComponentName>
   ```

2. **Context Switching**
   - Problem: Switching between fixing and validating
   - Solution: Integrated fix-and-validate commands
   ```bash
   npm run jsx:fix-and-validate
   ```

3. **Build Time Delays**
   - Problem: Waiting for full builds to validate changes
   - Solution: Incremental validation
   ```bash
   npm run validate:incremental
   ```

4. **Merge Conflicts**
   - Problem: Multiple developers working on same components
   - Solution: Component ownership and coordination
   ```bash
   npm run check:conflicts-before-refactor
   ```

### Metrics Dashboard

#### Real-Time Monitoring
```bash
# View current workflow health
npm run workflow:metrics

# Example output:
# 📊 Workflow Metrics Dashboard
# 🔧 JSX Error Trends:
#   Daily errors: 0
#   Weekly errors: 12
#   Monthly errors: 45
# 🏗️ Build Metrics:
#   Success rate: 98%
#   Average build time: 45s
#   Deployment frequency: 3/week
# ♻️ Refactoring Impact:
#   Files changed in last refactor: 79
#   Errors introduced: 0
#   Time to resolution: 4.2h
```

#### Weekly Reports
```bash
# Generate weekly efficiency report
npm run workflow:report weekly

# Includes:
# - Error prevention trends
# - Resolution time improvements
# - Team productivity metrics
# - Optimization suggestions
```

## Automated Workflow Triggers

### File-Based Triggers

#### 1. Component File Changes
```javascript
// Monitor component directories for changes
chokidar.watch('src/components/**/*.{tsx,jsx}', {
  ignored: /node_modules/
}).on('change', (path) => {
  // Trigger JSX validation for changed file
  exec(`npm run jsx:fix:file "${path}"`);
  
  // Find and validate dependent files
  exec(`npm run find:dependents "${path}" | xargs npm run jsx:validate:files`);
});
```

#### 2. Bulk Change Detection
```javascript
// Detect when >5 files change in short timeframe
const changeThreshold = 5;
const timeWindow = 300000; // 5 minutes

if (changedFiles.length > changeThreshold) {
  // Trigger comprehensive validation
  exec('npm run workflow:validate');
  
  // Send team notification
  sendNotification('Large-scale changes detected', 'warning');
}
```

### Git-Based Triggers

#### 1. Pre-Commit Hook
```bash
#!/bin/sh
# .git/hooks/pre-commit

echo "🔍 Running JSX validation..."

# Get staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(tsx?|jsx?)$')

if [ -n "$STAGED_FILES" ]; then
  # Validate staged JSX files
  echo "$STAGED_FILES" | xargs npm run jsx:validate:files
  
  if [ $? -ne 0 ]; then
    echo "❌ JSX validation failed. Auto-fixing..."
    echo "$STAGED_FILES" | xargs npm run jsx:fix:files
    
    echo "✅ JSX errors fixed. Please review and commit again."
    exit 1
  fi
fi

exit 0
```

#### 2. Branch Protection
```javascript
// GitHub webhook handler for PR validation
app.post('/webhook/pr-validation', (req, res) => {
  const { pull_request } = req.body;
  
  if (pull_request.changed_files > 20) {
    // Large PR detected - require additional validation
    triggerComprehensiveValidation(pull_request.head.sha);
    
    // Add PR comment with validation results
    addPRComment(pull_request.number, {
      body: '🔍 Large PR detected. Running comprehensive JSX validation...'
    });
  }
});
```

### CI/CD Triggers

#### 1. Build Failure Recovery
```yaml
# .github/workflows/jsx-recovery.yml
name: JSX Error Recovery

on:
  workflow_run:
    workflows: ["Build and Test"]
    types: [completed]
    
jobs:
  jsx-recovery:
    if: ${{ github.event.workflow_run.conclusion == 'failure' }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Attempt JSX Auto-Fix
        run: |
          npm ci
          npm run jsx:fix
          
      - name: Create Auto-Fix PR
        if: success()
        uses: peter-evans/create-pull-request@v4
        with:
          title: "fix: Auto-fix JSX syntax errors"
          body: |
            This PR contains automatic JSX syntax fixes.
            
            Generated in response to build failure.
            Please review changes before merging.
          branch: auto-fix/jsx-errors
```

#### 2. Deployment Health Checks
```bash
# Post-deployment validation
#!/bin/bash
# scripts/post-deploy-health-check.sh

echo "🏥 Running post-deployment health check..."

# Check for console errors
curl -s "https://your-app.com" | grep -i "error" && {
  echo "❌ Console errors detected"
  npm run workflow:record build-failure
  exit 1
}

# Validate core user flows
npm run test:e2e:critical-path

if [ $? -eq 0 ]; then
  echo "✅ Deployment health check passed"
  npm run workflow:record deployment-success
else
  echo "❌ Deployment health check failed"
  npm run workflow:record deployment-failure
  exit 1
fi
```

### Notification Systems

#### 1. Slack Integration
```javascript
// scripts/slack-notifier.js
import { WebClient } from '@slack/web-api';

const slack = new WebClient(process.env.SLACK_TOKEN);

async function sendJSXErrorAlert(errorCount, files) {
  await slack.chat.postMessage({
    channel: '#dev-alerts',
    text: `🚨 JSX Error Alert`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*JSX Validation Failed*\n${errorCount} errors found in ${files.length} files`
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Auto-Fix' },
            action_id: 'jsx_auto_fix',
            style: 'primary'
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: 'View Details' },
            action_id: 'jsx_view_details'
          }
        ]
      }
    ]
  });
}
```

#### 2. Email Notifications
```javascript
// For critical workflow failures
import nodemailer from 'nodemailer';

async function sendCriticalAlert(subject, details) {
  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    }
  });
  
  await transporter.sendMail({
    from: 'noreply@yourapp.com',
    to: 'dev-team@yourapp.com',
    subject: `🚨 Critical Workflow Alert: ${subject}`,
    html: `
      <h2>Workflow Alert</h2>
      <p><strong>Time:</strong> ${new Date().toISOString()}</p>
      <p><strong>Details:</strong></p>
      <pre>${JSON.stringify(details, null, 2)}</pre>
      
      <h3>Immediate Actions Required:</h3>
      <ol>
        <li>Check current build status</li>
        <li>Run workflow validation: <code>npm run workflow:validate</code></li>
        <li>Review recent commits for JSX changes</li>
      </ol>
    `
  });
}
```

## Implementation Checklist

### Immediate Actions (Week 1)
- [ ] Set up workflow optimization system: `npm run workflow:init`
- [ ] Configure IDE settings for real-time JSX validation
- [ ] Set up pre-commit hooks for JSX validation
- [ ] Create team communication templates
- [ ] Document refactoring procedures

### Short-term Goals (Week 2-3)
- [ ] Implement file watchers for real-time monitoring
- [ ] Set up CI/CD JSX validation workflow
- [ ] Create metrics dashboard
- [ ] Train team on new procedures
- [ ] Establish notification systems

### Long-term Optimization (Month 1-2)
- [ ] Analyze metrics and optimize bottlenecks
- [ ] Implement advanced automation triggers
- [ ] Create comprehensive reporting system
- [ ] Establish continuous improvement process
- [ ] Document lessons learned and best practices

## Success Metrics

### Target Outcomes
- **95% reduction** in JSX syntax errors reaching production
- **80% faster** error resolution time
- **50% reduction** in refactoring-related build failures
- **Zero** large-scale refactoring rollbacks
- **100% team adoption** of workflow procedures

### Monitoring Plan
- Daily automated metrics collection
- Weekly team retrospectives on workflow effectiveness
- Monthly optimization reviews and improvements
- Quarterly comprehensive workflow assessment
