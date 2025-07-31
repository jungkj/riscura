# Standard Operating Procedures for Component Refactoring

## Overview

This document establishes standardized procedures for large-scale component refactoring to prevent systematic JSX errors and ensure smooth team collaboration.

## Refactoring Classification

### Risk Levels

#### Low Risk (1-5 files)
- **Definition**: Minor component updates affecting <5 files
- **Examples**: Prop name changes, small styling updates
- **Process**: Standard git workflow with basic validation
- **Required Validation**: `npm run jsx:fix && npm run type-check`

#### Medium Risk (6-20 files)
- **Definition**: Moderate changes affecting 6-20 files
- **Examples**: Component API changes, hook refactoring
- **Process**: Enhanced validation with team notification
- **Required Validation**: Full workflow validation + build test

#### High Risk (20+ files)
- **Definition**: Large-scale changes affecting 20+ files
- **Examples**: Component library migrations, architecture changes
- **Process**: Comprehensive SOP with team coordination
- **Required Validation**: Full test suite + staged deployment

## High-Risk Refactoring SOP

### Phase 1: Planning and Preparation (Required for 20+ files)

#### 1.1 Impact Assessment
```bash
# Generate impact report
npm run refactor:analyze <component-name>

# Manual analysis
grep -r "<ComponentName" src/ --include="*.tsx" --include="*.jsx" | wc -l
grep -r "import.*ComponentName" src/ --include="*.ts" --include="*.tsx" | wc -l
```

**Impact Assessment Template:**
```markdown
## Refactoring Impact Assessment

**Component/Feature**: [Name]
**Estimated Files Affected**: [Number]
**Risk Level**: [Low/Medium/High]
**Estimated Duration**: [Hours]
**Team Members Affected**: [List]

### File Impact Breakdown
- Components: [N] files
- Pages: [N] files  
- Tests: [N] files
- Documentation: [N] files

### Dependencies
- Blocking PRs: [List]
- Required by: [List of dependent features]
- External dependencies: [List]

### Risk Factors
- [ ] Component used in critical user flows
- [ ] Changes affect API contracts
- [ ] Multiple team members working on related features
- [ ] Near upcoming release deadline
- [ ] Complex prop interface changes
```

#### 1.2 Team Coordination

**Required Notifications (24h advance):**
```markdown
🚨 **High-Risk Refactoring Notice**

**What**: [Description]
**When**: [Start Date/Time] - [End Date/Time]
**Duration**: [X] hours
**Files**: ~[N] files affected
**Branch**: [branch-name]

**🚦 Actions Required by Team:**
1. **Complete current work** on affected files by [deadline]
2. **Pull latest changes** before [start time]
3. **Avoid new PRs** targeting affected components during refactor
4. **Coordinate dependencies** with @refactoring-lead

**📞 Communication**: 
- Updates every 2 hours in #dev-team
- Emergency contact: @refactoring-lead
- Status dashboard: [link]

**🔄 Rollback Plan**: 
- Branch: [rollback-branch]
- Rollback lead: @backup-dev
- Max rollback time: [X] hours
```

#### 1.3 Branch Strategy
```bash
# Create refactoring branch from latest main
git checkout main
git pull origin main
git checkout -b refactor/[feature-name]-[date]

# Set up tracking
git push -u origin refactor/[feature-name]-[date]

# Create backup branch
git checkout -b refactor/[feature-name]-[date]-backup
git push -u origin refactor/[feature-name]-[date]-backup
```

#### 1.4 Pre-Refactoring Validation
```bash
# 1. Ensure clean starting state
npm run workflow:validate
npm run test:all
npm run build:vercel

# 2. Create baseline metrics
npm run workflow:metrics > baseline-metrics.json

# 3. Record refactoring start
npm run workflow:record refactoring-start '{"filesChanged": 79, "component": "DaisyUI"}'

# 4. Generate component usage map
npm run refactor:map-usage > component-usage-map.json
```

### Phase 2: Systematic Execution

#### 2.1 Refactoring Order (Critical)

**Recommended Order:**
1. **Update component definitions** (source files)
2. **Update direct imports** (immediate consumers)
3. **Update component usage** (JSX instances)
4. **Update tests** (test files)
5. **Update documentation** (docs/stories)

```bash
# Example for DaisyUI refactoring

# Step 1: Update component definitions
find src/components -name "*.tsx" -exec npm run jsx:fix:file {} \;

# Step 2: Update imports (batch process)
grep -r "from.*Button" src/ -l | head -10 | xargs npm run refactor:update-imports

# Step 3: Validate after each step
npm run jsx:monitor
npm run type-check
```

#### 2.2 Batch Processing Strategy

**Batch Size Guidelines:**
- Low complexity: 15-20 files per batch
- Medium complexity: 10-15 files per batch  
- High complexity: 5-10 files per batch

```bash
# Batch processing template
BATCH_SIZE=10
FILES=($(find src/ -name "*.tsx" -o -name "*.jsx"))

for ((i=0; i<${#FILES[@]}; i+=BATCH_SIZE)); do
  BATCH=("${FILES[@]:i:BATCH_SIZE}")
  echo "Processing batch $((i/BATCH_SIZE + 1)): ${#BATCH[@]} files"
  
  # Process batch
  for file in "${BATCH[@]}"; do
    npm run jsx:fix:file "$file"
  done
  
  # Validate batch
  npm run jsx:monitor
  if [ $? -ne 0 ]; then
    echo "Batch $((i/BATCH_SIZE + 1)) failed validation"
    break
  fi
  
  # Commit batch
  git add .
  git commit -m "refactor: batch $((i/BATCH_SIZE + 1)) - ${#BATCH[@]} files"
  
  echo "Batch $((i/BATCH_SIZE + 1)) completed successfully"
done
```

#### 2.3 Validation Checkpoints

**After Every Batch (Required):**
```bash
# 1. JSX Validation
npm run jsx:monitor
if [ $? -ne 0 ]; then
  echo "JSX errors detected - auto-fixing..."
  npm run jsx:fix
fi

# 2. Type Check
npm run type-check
if [ $? -ne 0 ]; then
  echo "Type errors detected - manual review required"
  exit 1
fi

# 3. Quick Build Test (every 3 batches)
if [ $((batch_num % 3)) -eq 0 ]; then
  npm run build
fi
```

**Progress Tracking:**
```bash
# Update progress metrics
FILES_COMPLETED=$(git diff --name-only HEAD~$batch_num | wc -l)
TOTAL_FILES=79
PROGRESS=$((FILES_COMPLETED * 100 / TOTAL_FILES))

echo "Progress: $PROGRESS% ($FILES_COMPLETED/$TOTAL_FILES files)"

# Send progress update (every 25%)
if [ $((PROGRESS % 25)) -eq 0 ]; then
  npm run workflow:notify "Refactoring $PROGRESS% complete" "info"
fi
```

### Phase 3: Quality Assurance

#### 3.1 Comprehensive Validation
```bash
# Full validation suite
npm run ci:validate

# Expected checks:
# ✓ JSX syntax validation
# ✓ TypeScript compilation
# ✓ ESLint strict mode
# ✓ Build test
# ✓ Unit tests
# ✓ Integration tests
# ✓ E2E critical path tests
```

#### 3.2 Manual Quality Checks

**UI/UX Validation Checklist:**
- [ ] **Visual Regression**: Components render correctly
- [ ] **Functionality**: All interactive elements work
- [ ] **Accessibility**: Screen reader compatibility maintained
- [ ] **Performance**: No significant performance degradation
- [ ] **Responsive**: Mobile/desktop layouts intact
- [ ] **Browser Compatibility**: Test in primary browsers

```bash
# Automated visual regression (if available)
npm run test:visual-regression

# Performance benchmarking
npm run test:performance-benchmark

# Accessibility testing
npm run test:a11y
```

#### 3.3 Stakeholder Review

**Required Reviewers for High-Risk Changes:**
1. **Tech Lead**: Architecture and implementation approach
2. **Senior Developer**: Code quality and edge cases
3. **QA Lead**: Testing strategy and user impact
4. **Product Owner**: Business logic and user experience

**Review Checklist Template:**
```markdown
## Refactoring Review Checklist

### Technical Review
- [ ] **Code Quality**: Follows established patterns
- [ ] **Performance**: No regressions identified
- [ ] **Security**: No new vulnerabilities introduced
- [ ] **Testing**: Adequate test coverage maintained
- [ ] **Documentation**: Updated as needed

### Business Review  
- [ ] **User Experience**: No degradation in UX
- [ ] **Feature Completeness**: All functionality preserved
- [ ] **Accessibility**: WCAG compliance maintained
- [ ] **Browser Support**: Tested in target browsers

### Process Review
- [ ] **Communication**: Team properly notified
- [ ] **Timeline**: Completed within estimated timeframe
- [ ] **Dependencies**: No blocking issues created
- [ ] **Rollback**: Rollback plan validated

**Approval Required**: [ ] Tech Lead  [ ] Senior Dev  [ ] QA Lead  [ ] Product Owner
```

### Phase 4: Deployment and Monitoring

#### 4.1 Staged Deployment

**Deployment Strategy:**
1. **Development**: Feature branch validation
2. **Staging**: Full integration testing
3. **Canary**: Limited production exposure (10% traffic)
4. **Full Production**: Complete rollout

```bash
# Stage 1: Development deployment
git checkout main
git merge refactor/[feature-name]-[date]
npm run build:vercel
npm run test:e2e

# Stage 2: Staging deployment  
git tag staging/refactor-[feature-name]-$(date +%Y%m%d)
git push origin staging/refactor-[feature-name]-$(date +%Y%m%d)

# Wait for staging validation...

# Stage 3: Production deployment
git tag production/refactor-[feature-name]-$(date +%Y%m%d)
npm run production:deploy
```

#### 4.2 Post-Deployment Monitoring

**Monitoring Checklist (First 24 hours):**
```bash
# 1. Error rate monitoring
npm run monitoring:errors

# 2. Performance monitoring
npm run monitoring:performance

# 3. User behavior monitoring
npm run monitoring:user-behavior

# 4. Build success rate
npm run monitoring:build-success
```

**Alert Thresholds:**
- Error rate increase >5%: Warning
- Error rate increase >10%: Critical
- Performance degradation >20%: Warning
- Performance degradation >50%: Critical
- User drop-off increase >15%: Critical

#### 4.3 Success Criteria Validation

```bash
# Record refactoring completion
npm run workflow:record refactoring-complete '{
  "filesChanged": 79,
  "errorsIntroduced": 0,
  "buildSuccessRate": 100,
  "performanceImpact": "+2%",
  "timeToComplete": "4.2h"
}'

# Generate completion report
npm run refactor:report > refactoring-completion-report.md
```

**Success Criteria:**
- [ ] **Zero critical errors** in production
- [ ] **Build success rate** maintained at >95%
- [ ] **Performance** within 10% of baseline
- [ ] **User satisfaction** scores maintained
- [ ] **Team velocity** not significantly impacted

## Medium-Risk Refactoring SOP

### Simplified Process (6-20 files)

#### 1. Pre-Refactoring
```bash
# Quick impact assessment
grep -r "ComponentName" src/ -l | wc -l

# Team notification (4h advance)
echo "Medium refactoring starting: ComponentName (X files)"

# Baseline validation
npm run workflow:validate
```

#### 2. Execution
```bash
# Single batch processing
npm run jsx:fix
npm run type-check
npm run build

# Commit with descriptive message
git add .
git commit -m "refactor(ComponentName): update X files for [reason]"
```

#### 3. Validation
```bash
# Standard validation suite
npm run ci:validate
npm run test:affected
```

#### 4. Review
- **Required**: 1 senior developer review
- **Timeline**: Same day completion preferred
- **Deployment**: Standard merge to main

## Low-Risk Refactoring SOP

### Minimal Process (1-5 files)

```bash
# Standard git workflow
npm run jsx:fix:file [file-path]
npm run type-check
git add .
git commit -m "refactor: update ComponentName prop interface"

# Standard PR process
git push origin feature/update-component-name
# Create PR with standard template
```

## Emergency Rollback Procedures

### Immediate Rollback (Production Issues)

#### 1. Detection
```bash
# Automated detection triggers
if error_rate > 10% || performance_degradation > 50%; then
  echo "CRITICAL: Initiating emergency rollback"
  npm run emergency:rollback
fi
```

#### 2. Rollback Execution
```bash
# Emergency rollback script
#!/bin/bash

echo "🚨 EMERGENCY ROLLBACK IN PROGRESS"

# 1. Immediate notification
npm run workflow:notify "EMERGENCY ROLLBACK: Refactoring" "critical"

# 2. Revert to last known good state
LAST_GOOD_COMMIT=$(git log --grep="refactor:" --invert-grep -n 1 --format="%H")
git revert $LAST_GOOD_COMMIT..HEAD --no-edit

# 3. Emergency build and deploy
npm run build:emergency
npm run deploy:emergency

# 4. Validate rollback
npm run test:critical-path

echo "✅ EMERGENCY ROLLBACK COMPLETE"
```

#### 3. Post-Rollback Analysis
```bash
# Generate incident report
npm run incident:generate-report > rollback-incident-$(date +%Y%m%d).md

# Record lessons learned
npm run workflow:record rollback-incident '{
  "cause": "[root cause]",
  "impact": "[impact description]",
  "resolution_time": "[minutes]",
  "lessons_learned": "[key learnings]"
}'
```

### Planned Rollback (Non-Critical Issues)

```bash
# 1. Assessment phase (allow 2-4 hours for fix attempts)
echo "Issues detected - attempting fixes before rollback"

# 2. Fix attempts
npm run jsx:fix
npm run type-check:full
npm run build

# 3. If fixes fail after 4 hours, proceed with rollback
if [ $FIX_ATTEMPTS -gt 3 ]; then
  echo "Fix attempts exhausted - proceeding with rollback"
  git revert [commit-range] --no-edit
fi
```

## Refactoring Tools and Scripts

### Custom Refactoring Scripts

#### 1. Component Usage Mapper
```javascript
// scripts/refactor-usage-mapper.js
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

export class ComponentUsageMapper {
  async mapComponentUsage(componentName) {
    const files = await glob('src/**/*.{tsx,jsx,ts,js}');
    const usageMap = {
      imports: [],
      jsxUsage: [],
      typeUsage: [],
      testUsage: []
    };

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Find imports
      const importRegex = new RegExp(`import.*${componentName}.*from`, 'g');
      if (importRegex.test(content)) {
        usageMap.imports.push(file);
      }
      
      // Find JSX usage
      const jsxRegex = new RegExp(`<${componentName}[\\s>]`, 'g');
      if (jsxRegex.test(content)) {
        usageMap.jsxUsage.push(file);
      }
      
      // Find type usage
      const typeRegex = new RegExp(`${componentName}Props|typeof ${componentName}`, 'g');
      if (typeRegex.test(content)) {
        usageMap.typeUsage.push(file);
      }
      
      // Find test usage
      if (file.includes('.test.') || file.includes('.spec.')) {
        const testRegex = new RegExp(componentName, 'g');
        if (testRegex.test(content)) {
          usageMap.testUsage.push(file);
        }
      }
    }
    
    return usageMap;
  }
}
```

#### 2. Batch File Processor
```javascript
// scripts/batch-processor.js
import { execSync } from 'child_process';
import chalk from 'chalk';

export class BatchProcessor {
  async processBatch(files, batchSize = 10, processor) {
    const batches = [];
    for (let i = 0; i < files.length; i += batchSize) {
      batches.push(files.slice(i, i + batchSize));
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(chalk.blue(`Processing batch ${i + 1}/${batches.length}: ${batch.length} files`));
      
      try {
        await processor(batch);
        successCount += batch.length;
        console.log(chalk.green(`✓ Batch ${i + 1} completed successfully`));
      } catch (error) {
        errorCount += batch.length;
        console.log(chalk.red(`✗ Batch ${i + 1} failed: ${error.message}`));
        
        // Option to continue or stop
        const shouldContinue = await this.promptContinue();
        if (!shouldContinue) break;
      }
    }
    
    return { successCount, errorCount };
  }
  
  async promptContinue() {
    // Implementation would use inquirer or similar
    return true; // Default to continue
  }
}
```

#### 3. Refactoring Progress Tracker
```javascript
// scripts/refactor-progress.js
import fs from 'fs';
import chalk from 'chalk';

export class RefactorProgressTracker {
  constructor(totalFiles) {
    this.totalFiles = totalFiles;
    this.processedFiles = 0;
    this.errors = [];
    this.startTime = Date.now();
  }
  
  updateProgress(filesProcessed, errors = []) {
    this.processedFiles += filesProcessed;
    this.errors.push(...errors);
    
    const percentage = Math.round((this.processedFiles / this.totalFiles) * 100);
    const elapsed = (Date.now() - this.startTime) / 1000 / 60; // minutes
    const estimated = (elapsed / this.processedFiles) * this.totalFiles;
    const remaining = estimated - elapsed;
    
    console.log(chalk.blue(`
📊 Progress: ${percentage}% (${this.processedFiles}/${this.totalFiles})`));
    console.log(chalk.gray(`⏱️  Elapsed: ${elapsed.toFixed(1)}m, Remaining: ${remaining.toFixed(1)}m`));
    
    if (this.errors.length > 0) {
      console.log(chalk.yellow(`⚠️  Errors: ${this.errors.length}`));
    }
    
    // Send team update every 25%
    if (percentage % 25 === 0 && percentage > 0) {
      this.sendTeamUpdate(percentage);
    }
  }
  
  sendTeamUpdate(percentage) {
    const message = `🔄 Refactoring ${percentage}% complete (${this.processedFiles}/${this.totalFiles} files)`;
    console.log(chalk.cyan(`Sending team update: ${message}`));
    // Implementation would send to Slack/Teams/etc.
  }
  
  generateReport() {
    const elapsed = (Date.now() - this.startTime) / 1000 / 60; // minutes
    const rate = this.processedFiles / elapsed; // files per minute
    
    return {
      totalFiles: this.totalFiles,
      processedFiles: this.processedFiles,
      errorCount: this.errors.length,
      elapsedMinutes: elapsed,
      filesPerMinute: rate,
      successRate: ((this.processedFiles - this.errors.length) / this.processedFiles) * 100
    };
  }
}
```

## Team Training and Adoption

### Onboarding Checklist

**New Team Member Refactoring Training:**
- [ ] **Read Documentation**: Complete SOP and workflow docs
- [ ] **Tool Familiarity**: Practice with jsx:fix, workflow:validate
- [ ] **Shadow Refactoring**: Observe experienced team member
- [ ] **Guided Practice**: Complete low-risk refactoring with mentor
- [ ] **Independent Practice**: Complete medium-risk refactoring solo
- [ ] **Certification**: Demonstrate high-risk refactoring competency

### Regular Training

**Monthly Refactoring Review:**
- Review recent refactoring metrics and lessons learned
- Practice emergency rollback procedures
- Update SOPs based on new learnings
- Share best practices and optimization tips

**Quarterly Deep Dive:**
- Comprehensive review of refactoring efficiency
- Tool updates and new automation opportunities
- Advanced refactoring techniques workshop
- Cross-team collaboration improvement strategies

## Continuous Improvement

### Metrics Collection

**Key Performance Indicators:**
```javascript
// Automatically tracked metrics
const refactoringMetrics = {
  averageTimePerFile: 0, // minutes
  errorRate: 0, // percentage
  rollbackRate: 0, // percentage
  teamSatisfactionScore: 0, // 1-10
  automationEfficiency: 0, // percentage of manual work eliminated
};
```

### Regular Reviews

**Weekly Refactoring Retrospective:**
- What went well?
- What could be improved?
- Which tools were most/least helpful?
- Any process bottlenecks identified?
- New automation opportunities?

**Monthly Process Optimization:**
- Analyze refactoring metrics trends
- Identify recurring issues and solutions
- Update SOPs based on learnings
- Plan tool improvements and new automations

### Success Stories Documentation

**Template for Success Story:**
```markdown
## Refactoring Success Story: [Title]

**Date**: [Date]
**Team Member**: [Name]
**Scope**: [X] files changed
**Duration**: [X] hours
**Risk Level**: [Low/Medium/High]

### Challenge
[Description of what was being refactored and why]

### Approach
[How the SOP was applied and any customizations]

### Results
- Files processed: [X]
- Errors prevented: [X]
- Time saved vs. manual: [X] hours
- Team impact: [Description]

### Key Learnings
[What worked well and what could be improved]

### Recommendations
[Suggestions for future similar refactoring]
```

By following these SOPs, teams can confidently execute large-scale refactoring while minimizing risk and maximizing efficiency.
