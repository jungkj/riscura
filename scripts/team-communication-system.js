#!/usr/bin/env node

/**
 * Team Communication System
 * Automated communication patterns for large-scale changes
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

class TeamCommunicationSystem {
  constructor() {
    this.configFile = path.join(process.cwd(), '.communication-config.json');
    this.templatesDir = path.join(process.cwd(), 'docs', 'communication-templates');
    this.defaultConfig = {
      channels: {
        slack: {
          enabled: false,
          webhookUrl: '',
          defaultChannel: '#dev-team',
          alertChannel: '#dev-alerts'
        },
        teams: {
          enabled: false,
          webhookUrl: '',
          defaultChannel: 'Development Team'
        },
        discord: {
          enabled: false,
          webhookUrl: '',
          defaultChannel: 'dev-general'
        },
        email: {
          enabled: false,
          smtpHost: '',
          smtpPort: 587,
          username: '',
          password: '',
          fromAddress: 'noreply@yourcompany.com',
          devTeamList: ['dev-team@yourcompany.com']
        }
      },
      templates: {
        refactoringStart: 'refactoring-start.md',
        refactoringProgress: 'refactoring-progress.md',
        refactoringComplete: 'refactoring-complete.md',
        emergencyAlert: 'emergency-alert.md',
        buildFailure: 'build-failure.md',
        deploymentNotice: 'deployment-notice.md'
      },
      rules: {
        highRiskThreshold: 20, // files
        mediumRiskThreshold: 6, // files
        progressUpdateInterval: 25, // percentage
        emergencyErrorThreshold: 10, // percentage
        autoNotifyOnBuildFailure: true,
        requireAcknowledgment: true
      }
    };
  }

  /**
   * Initialize communication system
   */
  async init() {
    console.log(chalk.cyan.bold('🗣️  Initializing Team Communication System\n'));

    // Create config if it doesn't exist
    if (!fs.existsSync(this.configFile)) {
      fs.writeFileSync(this.configFile, JSON.stringify(this.defaultConfig, null, 2));
      console.log(chalk.green('✓ Created communication configuration'));
    }

    // Create templates directory
    if (!fs.existsSync(this.templatesDir)) {
      fs.mkdirSync(this.templatesDir, { recursive: true });
      await this.createDefaultTemplates();
      console.log(chalk.green('✓ Created communication templates'));
    }

    // Create notification scripts
    await this.createNotificationScripts();

    console.log(chalk.green.bold('\n✅ Team communication system initialized!\n'));
    console.log(chalk.blue('Available commands:'));
    console.log(chalk.gray('  npm run comm:notify <message> <priority>    - Send notification'));
    console.log(chalk.gray('  npm run comm:refactor-start <details>       - Start refactoring notice'));
    console.log(chalk.gray('  npm run comm:progress <percentage>          - Progress update'));
    console.log(chalk.gray('  npm run comm:emergency <details>            - Emergency alert'));
    console.log(chalk.gray('  npm run comm:test                           - Test notifications'));
  }

  /**
   * Create default communication templates
   */
  async createDefaultTemplates() {
    const templates = {
      'refactoring-start.md': `# 🔧 Large-Scale Refactoring Notice

**What**: {{description}}
**When**: {{startTime}}
**Duration**: Estimated {{estimatedDuration}} hours
**Files Affected**: ~{{filesAffected}} files
**Branch**: {{branch}}
**Risk Level**: {{riskLevel}}

## 🚦 Actions Required by Team:

1. **Complete current work** on affected files by {{deadline}}
2. **Pull latest changes** before {{startTime}}
3. **Avoid new PRs** targeting affected components during refactor
4. **Coordinate dependencies** with @{{refactoringLead}}

## 📞 Communication:
- Updates every {{updateInterval}} hours in {{channel}}
- Emergency contact: @{{refactoringLead}}
- Status dashboard: {{dashboardUrl}}

## 🔄 Rollback Plan:
- Branch: {{rollbackBranch}}
- Rollback lead: @{{rollbackLead}}
- Max rollback time: {{maxRollbackTime}} hours

---
*Automated message from Workflow Optimization System*`,

      'refactoring-progress.md': `# 📊 Refactoring Progress Update

**Progress**: {{percentage}}% complete ({{completedFiles}}/{{totalFiles}} files)
**Elapsed Time**: {{elapsedTime}}
**Estimated Remaining**: {{remainingTime}}
**Current Status**: {{currentStatus}}
**Errors Found**: {{errorsFound}}
**Errors Fixed**: {{errorsFixed}}

## Recent Milestones:
{{#milestones}}
- ✅ {{description}} ({{timestamp}})
{{/milestones}}

## Next Steps:
{{nextSteps}}

{{#issues}}
## ⚠️ Issues Identified:
{{#issues}}
- {{description}} - {{status}}
{{/issues}}
{{/issues}}

---
*Next update at {{nextUpdateTime}}*`,

      'refactoring-complete.md': `# ✅ Refactoring Complete

## Summary:
- **Files Changed**: {{filesChanged}}
- **JSX Errors Fixed**: {{jsxErrorsFixed}}
- **Build Status**: {{buildStatus}}
- **Test Status**: {{testStatus}}
- **Total Time**: {{totalTime}}
- **Success Rate**: {{successRate}}%

## Actions for Team:
1. **Pull latest changes**: \`git pull origin {{branch}}\`
2. **Validate your local setup**: \`npm run workflow:validate\`
3. **Review component usage** in your branches
4. **Update dependencies** if needed

## Quality Metrics:
- Build success rate: {{buildSuccessRate}}%
- Performance impact: {{performanceImpact}}
- Test coverage: {{testCoverage}}%

## Merge to main:
**Scheduled for**: {{mergeTime}}
**Approvals required**: {{approvalsRequired}}

---
*Refactoring completed by @{{refactoringLead}}*`,

      'emergency-alert.md': `# 🚨 EMERGENCY ALERT

**Type**: {{alertType}}
**Severity**: {{severity}}
**Time**: {{timestamp}}
**Affected Systems**: {{affectedSystems}}

## Issue Description:
{{description}}

## Immediate Impact:
{{impact}}

## Actions Taken:
{{#actionsTaken}}
- {{action}} ({{timestamp}})
{{/actionsTaken}}

## Required Actions:
{{#requiredActions}}
- [ ] {{action}} - @{{assignee}}
{{/requiredActions}}

## Status: {{status}}

**Incident Lead**: @{{incidentLead}}
**Next Update**: {{nextUpdate}}

---
*This is an automated emergency alert*`,

      'build-failure.md': `# ❌ Build Failure Alert

**Build**: {{buildNumber}}
**Branch**: {{branch}}
**Commit**: {{commitHash}}
**Time**: {{timestamp}}
**Duration**: {{buildDuration}}

## Failure Details:
\`\`\`
{{errorMessage}}
\`\`\`

## Failed Stage:
{{failedStage}}

## Likely Causes:
{{#likelyCauses}}
- {{cause}}
{{/likelyCauses}}

## Recommended Actions:
1. **Check recent commits**: \`git log --oneline -5\`
2. **Run local validation**: \`npm run workflow:validate\`
3. **Fix issues and re-push**

## Build Logs:
{{buildLogsUrl}}

---
*Auto-generated build failure notification*`,

      'deployment-notice.md': `# 🚀 Deployment Notice

**Environment**: {{environment}}
**Version**: {{version}}
**Scheduled Time**: {{scheduledTime}}
**Expected Duration**: {{expectedDuration}}
**Deployment Lead**: @{{deploymentLead}}

## Changes Included:
{{#changes}}
- {{type}}: {{description}}
{{/changes}}

## Potential Impact:
{{impact}}

## Rollback Plan:
- **Rollback trigger**: {{rollbackTrigger}}
- **Rollback time**: {{rollbackTime}}
- **Rollback lead**: @{{rollbackLead}}

## Post-Deployment Monitoring:
- **Health checks**: {{healthChecks}}
- **Monitoring duration**: {{monitoringDuration}}
- **Success criteria**: {{successCriteria}}

---
*Deployment managed by automated system*`
    };

    for (const [filename, content] of Object.entries(templates)) {
      const filePath = path.join(this.templatesDir, filename);
      fs.writeFileSync(filePath, content);
    }
  }

  /**
   * Create notification scripts
   */
  async createNotificationScripts() {
    const notificationScript = `#!/usr/bin/env node

/**
 * Notification dispatcher
 * Sends messages through configured channels
 */

import fs from 'fs';
import https from 'https';
import { execSync } from 'child_process';

class NotificationDispatcher {
  constructor() {
    this.config = JSON.parse(fs.readFileSync('.communication-config.json', 'utf8'));
  }

  async sendSlackMessage(message, channel = null, priority = 'info') {
    if (!this.config.channels.slack.enabled) return;

    const webhookUrl = this.config.channels.slack.webhookUrl;
    const targetChannel = channel || (priority === 'critical' ? 
      this.config.channels.slack.alertChannel : 
      this.config.channels.slack.defaultChannel);

    const payload = {
      channel: targetChannel,
      text: message,
      username: 'Workflow Bot',
      icon_emoji: priority === 'critical' ? ':rotating_light:' : ':robot_face:'
    };

    return this.sendWebhook(webhookUrl, payload);
  }

  async sendTeamsMessage(message, priority = 'info') {
    if (!this.config.channels.teams.enabled) return;

    const webhookUrl = this.config.channels.teams.webhookUrl;
    const color = priority === 'critical' ? 'attention' : 'good';

    const payload = {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      summary: 'Workflow Notification',
      themeColor: color === 'attention' ? 'FF0000' : '00FF00',
      sections: [{
        activityTitle: 'Workflow System',
        activitySubtitle: new Date().toISOString(),
        text: message
      }]
    };

    return this.sendWebhook(webhookUrl, payload);
  }

  async sendEmail(subject, message, recipients = null) {
    if (!this.config.channels.email.enabled) return;

    const targetRecipients = recipients || this.config.channels.email.devTeamList;
    
    // Simple email implementation - in production, use proper email service
    console.log(\`📧 Email would be sent to: \${targetRecipients.join(', ')}\`);
    console.log(\`Subject: \${subject}\`);
    console.log(\`Message: \${message}\`);
  }

  async sendWebhook(url, payload) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(payload);
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      };

      const req = https.request(url, options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => responseData += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(responseData);
          } else {
            reject(new Error(\`HTTP \${res.statusCode}: \${responseData}\`));
          }
        });
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  async sendNotification(message, priority = 'info', channels = ['slack']) {
    const promises = [];

    if (channels.includes('slack')) {
      promises.push(this.sendSlackMessage(message, null, priority));
    }
    if (channels.includes('teams')) {
      promises.push(this.sendTeamsMessage(message, priority));
    }
    if (channels.includes('email') && priority === 'critical') {
      promises.push(this.sendEmail('Critical Alert', message));
    }

    try {
      await Promise.all(promises);
      console.log('✅ Notifications sent successfully');
    } catch (error) {
      console.error('❌ Failed to send notifications:', error.message);
    }
  }
}

// CLI interface
const args = process.argv.slice(2);
const message = args[0];
const priority = args[1] || 'info';
const channels = args[2] ? args[2].split(',') : ['slack'];

if (!message) {
  console.log('Usage: node notify.js "message" [priority] [channels]');
  console.log('Priority: info, warning, critical');
  console.log('Channels: slack,teams,email');
  process.exit(1);
}

const dispatcher = new NotificationDispatcher();
dispatcher.sendNotification(message, priority, channels);

export { NotificationDispatcher };
`;

    const notifyScriptPath = path.join(process.cwd(), 'scripts', 'notify.js');
    fs.writeFileSync(notifyScriptPath, notificationScript);
    
    console.log(chalk.green('✓ Created notification dispatcher script'));
  }

  /**
   * Send refactoring start notification
   */
  async sendRefactoringStart(details) {
    const template = this.loadTemplate('refactoring-start.md');
    const message = this.processTemplate(template, details);
    
    await this.sendNotification(message, 'warning', ['slack', 'teams']);
    
    // Also create GitHub issue for tracking
    await this.createTrackingIssue(details);
  }

  /**
   * Send progress update
   */
  async sendProgressUpdate(progressData) {
    const template = this.loadTemplate('refactoring-progress.md');
    const message = this.processTemplate(template, progressData);
    
    const priority = progressData.errorsFound > 5 ? 'warning' : 'info';
    await this.sendNotification(message, priority, ['slack']);
  }

  /**
   * Send completion notification
   */
  async sendRefactoringComplete(completionData) {
    const template = this.loadTemplate('refactoring-complete.md');
    const message = this.processTemplate(template, completionData);
    
    await this.sendNotification(message, 'info', ['slack', 'teams']);
    
    // Close tracking issue
    await this.closeTrackingIssue(completionData.issueNumber);
  }

  /**
   * Send emergency alert
   */
  async sendEmergencyAlert(alertData) {
    const template = this.loadTemplate('emergency-alert.md');
    const message = this.processTemplate(template, alertData);
    
    await this.sendNotification(message, 'critical', ['slack', 'teams', 'email']);
    
    // Create incident issue
    await this.createIncidentIssue(alertData);
  }

  /**
   * Load message template
   */
  loadTemplate(templateName) {
    const templatePath = path.join(this.templatesDir, templateName);
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templateName}`);
    }
    return fs.readFileSync(templatePath, 'utf8');
  }

  /**
   * Process template with data
   */
  processTemplate(template, data) {
    let processed = template;
    
    // Simple template processing - replace {{key}} with data.key
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, value);
    }
    
    // Handle conditional blocks {{#key}} ... {{/key}}
    processed = processed.replace(/{{#(\w+)}}([\s\S]*?){{\/(\w+)}}/g, (match, key, content, endKey) => {
      if (key === endKey && data[key]) {
        if (Array.isArray(data[key])) {
          return data[key].map(item => this.processTemplate(content, item)).join('');
        } else {
          return content;
        }
      }
      return '';
    });
    
    return processed;
  }

  /**
   * Create GitHub tracking issue
   */
  async createTrackingIssue(details) {
    try {
      const issueTitle = `Refactoring: ${details.description}`;
      const issueBody = `
## Refactoring Details

- **Files Affected**: ${details.filesAffected}
- **Estimated Duration**: ${details.estimatedDuration} hours
- **Risk Level**: ${details.riskLevel}
- **Lead**: @${details.refactoringLead}

## Progress Checklist

- [ ] Pre-refactoring validation complete
- [ ] Team notified and coordinated
- [ ] Refactoring execution started
- [ ] Quality assurance complete
- [ ] Post-refactoring validation complete
- [ ] Team notified of completion

## Communication

- **Updates**: Every ${details.updateInterval} hours
- **Channel**: ${details.channel}
- **Emergency Contact**: @${details.refactoringLead}

---
*This issue is automatically managed by the Workflow Optimization System*
      `;
      
      execSync(`gh issue create --title "${issueTitle}" --body "${issueBody}" --label "refactoring,in-progress"`, 
               { stdio: 'inherit' });
      
      console.log(chalk.green('✓ Created GitHub tracking issue'));
    } catch (error) {
      console.log(chalk.yellow('⚠️  Could not create GitHub issue (gh CLI may not be available)'));
    }
  }

  /**
   * Close tracking issue
   */
  async closeTrackingIssue(issueNumber) {
    if (!issueNumber) return;
    
    try {
      execSync(`gh issue close ${issueNumber} --comment "Refactoring completed successfully"`, 
               { stdio: 'inherit' });
      console.log(chalk.green('✓ Closed GitHub tracking issue'));
    } catch (error) {
      console.log(chalk.yellow('⚠️  Could not close GitHub issue'));
    }
  }

  /**
   * Create incident issue
   */
  async createIncidentIssue(alertData) {
    try {
      const issueTitle = `🚨 INCIDENT: ${alertData.alertType}`;
      const issueBody = `
## Incident Details

- **Type**: ${alertData.alertType}
- **Severity**: ${alertData.severity}
- **Time**: ${alertData.timestamp}
- **Affected Systems**: ${alertData.affectedSystems}

## Description

${alertData.description}

## Impact

${alertData.impact}

## Incident Response

- **Incident Lead**: @${alertData.incidentLead}
- **Status**: ${alertData.status}
- **Next Update**: ${alertData.nextUpdate}

---
*This is an automated incident report*
      `;
      
      execSync(`gh issue create --title "${issueTitle}" --body "${issueBody}" --label "incident,critical"`, 
               { stdio: 'inherit' });
      
      console.log(chalk.green('✓ Created incident tracking issue'));
    } catch (error) {
      console.log(chalk.yellow('⚠️  Could not create incident issue'));
    }
  }

  /**
   * Send notification through configured channels
   */
  async sendNotification(message, priority = 'info', channels = ['slack']) {
    const notifyScript = path.join(process.cwd(), 'scripts', 'notify.js');
    
    try {
      execSync(`node "${notifyScript}" "${message}" ${priority} ${channels.join(',')}`, 
               { stdio: 'inherit' });
    } catch (error) {
      console.log(chalk.red('❌ Failed to send notification:'), error.message);
    }
  }

  /**
   * Test notification system
   */
  async testNotifications() {
    console.log(chalk.cyan.bold('🧪 Testing notification system\n'));
    
    const testMessages = [
      { message: 'Test info message', priority: 'info' },
      { message: 'Test warning message', priority: 'warning' },
      { message: 'Test critical message', priority: 'critical' }
    ];
    
    for (const test of testMessages) {
      console.log(chalk.blue(`Testing ${test.priority} notification...`));
      await this.sendNotification(test.message, test.priority);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause
    }
    
    console.log(chalk.green.bold('\n✅ Notification tests completed'));
  }

  /**
   * Configure notification channels
   */
  async configure() {
    console.log(chalk.cyan.bold('⚙️  Communication System Configuration\n'));
    
    const config = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
    
    console.log(chalk.blue('Current configuration:'));
    console.log(JSON.stringify(config, null, 2));
    
    console.log(chalk.yellow('\nTo configure channels, edit:'), this.configFile);
    console.log(chalk.gray('\nConfiguration options:'));
    console.log(chalk.gray('  - Slack webhook URL and channels'));
    console.log(chalk.gray('  - Teams webhook URL'));
    console.log(chalk.gray('  - Email SMTP settings'));
    console.log(chalk.gray('  - Notification rules and thresholds'));
  }
}

// CLI Interface
const args = process.argv.slice(2);
const command = args[0];

const communicationSystem = new TeamCommunicationSystem();

switch (command) {
  case 'init':
    await communicationSystem.init();
    break;
  case 'test':
    await communicationSystem.testNotifications();
    break;
  case 'configure':
    await communicationSystem.configure();
    break;
  case 'refactor-start':
    const startDetails = args[1] ? JSON.parse(args[1]) : {};
    await communicationSystem.sendRefactoringStart(startDetails);
    break;
  case 'progress':
    const progressData = args[1] ? JSON.parse(args[1]) : {};
    await communicationSystem.sendProgressUpdate(progressData);
    break;
  case 'complete':
    const completionData = args[1] ? JSON.parse(args[1]) : {};
    await communicationSystem.sendRefactoringComplete(completionData);
    break;
  case 'emergency':
    const alertData = args[1] ? JSON.parse(args[1]) : {};
    await communicationSystem.sendEmergencyAlert(alertData);
    break;
  case 'notify':
    const message = args[1];
    const priority = args[2] || 'info';
    const channels = args[3] ? args[3].split(',') : ['slack'];
    await communicationSystem.sendNotification(message, priority, channels);
    break;
  default:
    console.log(chalk.cyan.bold('🗣️  Team Communication System\n'));
    console.log(chalk.blue('Available commands:'));
    console.log(chalk.gray('  init                  - Initialize communication system'));
    console.log(chalk.gray('  configure            - Configure notification channels'));
    console.log(chalk.gray('  test                 - Test all notification channels'));
    console.log(chalk.gray('  refactor-start <data> - Send refactoring start notice'));
    console.log(chalk.gray('  progress <data>      - Send progress update'));
    console.log(chalk.gray('  complete <data>      - Send completion notice'));
    console.log(chalk.gray('  emergency <data>     - Send emergency alert'));
    console.log(chalk.gray('  notify <msg> <pri> <ch> - Send custom notification'));
    break;
}

export { TeamCommunicationSystem };
