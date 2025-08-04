#!/usr/bin/env tsx

/**
 * DaisyUI Component Audit Script
 *
 * This script scans the codebase for common DaisyUI component usage issues
 * and provides recommendations for fixes.
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

interface ComponentIssue {
  file: string;
  line: number;
  column: number;
  issue: string;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
}

interface AuditResults {
  issues: ComponentIssue[];
  summary: {
    totalFiles: number;
    issuesFound: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
  };
}

// Common DaisyUI components that should not be self-closed
const CONTAINER_COMPONENTS = [
  'DaisyCard',
  'DaisyCardBody',
  'DaisyCardTitle',
  'DaisyCardActions',
  'DaisyDialog',
  'DaisyDialogContent',
  'DaisyDialogHeader',
  'DaisyDialogTitle',
  'DaisyDialogDescription',
  'DaisyDialogFooter',
  'DaisyTabs',
  'DaisyTabsContent',
  'DaisyTabsList',
  'DaisyTabsTrigger',
  'DaisyScrollArea',
  'DaisyAccordion',
  'DaisyAccordionContent',
  'DaisyAccordionItem',
  'DaisyAccordionTrigger',
];

// Components that can be self-closed
const SELF_CLOSING_COMPONENTS = [
  'DaisyInput',
  'DaisyButton', // Can be self-closed if no children
  'DaisyCheckbox',
  'DaisyRadio',
  'DaisySeparator',
  'DaisyProgress',
  'DaisySlider',
  'DaisySelectValue', // This is actually expected to be self-closed
];

// Required props for specific components
const REQUIRED_PROPS = {
  DaisyButton: ['onClick', 'type'],
  DaisyInput: ['value', 'onChange'],
  DaisySelect: ['value', 'onValueChange'],
  DaisyTabs: ['value', 'onValueChange'],
};

class DaisyUIAuditor {
  private issues: ComponentIssue[] = [];
  private processedFiles = 0;

  async auditDirectory(directory: string): Promise<AuditResults> {
    console.log(`🔍 Auditing DaisyUI components in: ${directory}`);

    const files = await glob('**/*.{tsx,ts,jsx,js}', {
      cwd: directory,
      ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/build/**'],
    });

    this.processedFiles = files.length;
    console.log(`📁 Found ${files.length} files to audit`);

    for (const file of files) {
      const fullPath = path.join(directory, file);
      await this.auditFile(fullPath);
    }

    return this.generateResults();
  }

  private async auditFile(filePath: string): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      // Skip non-React files
      if (!content.includes('react') && !content.includes('React') && !content.includes('Daisy')) {
        return;
      }

      lines.forEach((line, index) => {
        const lineNumber = index + 1;

        // Check for self-closing container components
        this.checkSelfClosingContainerComponents(filePath, line, lineNumber);

        // Check for missing required props
        this.checkMissingRequiredProps(filePath, line, lineNumber);

        // Check for incorrect className usage
        this.checkClassNameUsage(filePath, line, lineNumber);

        // Check for improper DaisySelect usage
        this.checkDaisySelectUsage(filePath, line, lineNumber);

        // Check for DaisyCard nesting issues
        this.checkDaisyCardNesting(filePath, lines, index);

        // Check for fragment usage issues
        this.checkFragmentUsage(filePath, line, lineNumber);
      });
    } catch (error) {
      console.error(`❌ Error reading file ${filePath}:`, error);
    }
  }

  private checkSelfClosingContainerComponents(file: string, line: string, lineNumber: number) {
    CONTAINER_COMPONENTS.forEach((component) => {
      const selfClosingRegex = new RegExp(`<${component}[^>]*\\/>`, 'g');
      if (selfClosingRegex.test(line)) {
        this.addIssue({
          file,
          line: lineNumber,
          column: line.indexOf(`<${component}`),
          issue: `Self-closing ${component} component detected`,
          severity: 'error',
          suggestion: `Use proper opening/closing tags: <${component}>...</${component}>`,
        });
      }
    });
  }

  private checkMissingRequiredProps(file: string, line: string, lineNumber: number) {
    Object.entries(REQUIRED_PROPS).forEach(([component, props]) => {
      if (line.includes(`<${component}`) && !line.includes('/>')) {
        props.forEach((prop) => {
          if (!line.includes(prop) && !line.includes(`${prop}=`)) {
            this.addIssue({
              file,
              line: lineNumber,
              column: line.indexOf(`<${component}`),
              issue: `${component} missing recommended prop: ${prop}`,
              severity: 'warning',
              suggestion: `Add ${prop} prop to ${component}`,
            });
          }
        });
      }
    });
  }

  private checkClassNameUsage(file: string, line: string, lineNumber: number) {
    // Check for 'class' instead of 'className'
    if (line.includes(' class=') && !line.includes('className=')) {
      this.addIssue({
        file,
        line: lineNumber,
        column: line.indexOf(' class='),
        issue: 'Use className instead of class in JSX',
        severity: 'error',
        suggestion: 'Replace class= with className=',
      });
    }

    // Check for template literals in className that could be simplified
    const templateLiteralRegex = /className=\{\`([^`]+)\`\}/;
    const match = templateLiteralRegex.exec(line);
    if (match && !match[1].includes('${')) {
      this.addIssue({
        file,
        line: lineNumber,
        column: line.indexOf('className='),
        issue: 'Unnecessary template literal in className',
        severity: 'info',
        suggestion: `Use simple string: className="${match[1]}"`,
      });
    }
  }

  private checkDaisySelectUsage(file: string, line: string, lineNumber: number) {
    if (line.includes('<DaisySelect') && !line.includes('onValueChange')) {
      this.addIssue({
        file,
        line: lineNumber,
        column: line.indexOf('<DaisySelect'),
        issue: 'DaisySelect missing onValueChange prop',
        severity: 'warning',
        suggestion: 'Add onValueChange prop to handle value changes',
      });
    }

    // Check for missing DaisySelectTrigger
    if (line.includes('<DaisySelect') && file.includes('DaisySelect')) {
      // This would need more sophisticated parsing to check if DaisySelectTrigger is present
      // For now, just flag as info
      this.addIssue({
        file,
        line: lineNumber,
        column: line.indexOf('<DaisySelect'),
        issue: 'Verify DaisySelect has proper sub-components',
        severity: 'info',
        suggestion:
          'Ensure DaisySelectTrigger, DaisySelectValue, and DaisySelectContent are present',
      });
    }
  }

  private checkDaisyCardNesting(file: string, lines: string[], currentIndex: number) {
    const line = lines[currentIndex];

    if (line.includes('<DaisyCard')) {
      // Look ahead for DaisyCardBody
      let foundCardBody = false;
      let foundCardTitle = false;

      for (let i = currentIndex + 1; i < Math.min(currentIndex + 10, lines.length); i++) {
        if (lines[i].includes('</DaisyCard>')) break;
        if (lines[i].includes('<DaisyCardBody')) foundCardBody = true;
        if (lines[i].includes('<DaisyCardTitle')) foundCardTitle = true;
      }

      if (foundCardTitle && !foundCardBody) {
        this.addIssue({
          file,
          line: currentIndex + 1,
          column: line.indexOf('<DaisyCard'),
          issue: 'DaisyCardTitle should be inside DaisyCardBody',
          severity: 'warning',
          suggestion: 'Wrap DaisyCardTitle with DaisyCardBody',
        });
      }
    }
  }

  private checkFragmentUsage(file: string, line: string, lineNumber: number) {
    // Check for improper fragment usage
    if (line.trim() === 'return <>' || line.trim() === 'return (<>') {
      this.addIssue({
        file,
        line: lineNumber,
        column: line.indexOf('<>'),
        issue: 'Consider using a proper container instead of fragments',
        severity: 'info',
        suggestion: 'Use <div> or specific container component for better structure',
      });
    }
  }

  private addIssue(issue: ComponentIssue) {
    this.issues.push(issue);
  }

  private generateResults(): AuditResults {
    const errorCount = this.issues.filter((i) => i.severity === 'error').length;
    const warningCount = this.issues.filter((i) => i.severity === 'warning').length;
    const infoCount = this.issues.filter((i) => i.severity === 'info').length;

    return {
      issues: this.issues,
      summary: {
        totalFiles: this.processedFiles,
        issuesFound: this.issues.length,
        errorCount,
        warningCount,
        infoCount,
      },
    };
  }
}

// Report generation
function generateReport(results: AuditResults) {
  console.log('\n📊 DAISY UI COMPONENT AUDIT REPORT');
  console.log('=====================================');

  console.log(`\n📈 Summary:`);
  console.log(`   • Files scanned: ${results.summary.totalFiles}`);
  console.log(`   • Issues found: ${results.summary.issuesFound}`);
  console.log(`   • Errors: ${results.summary.errorCount}`);
  console.log(`   • Warnings: ${results.summary.warningCount}`);
  console.log(`   • Info: ${results.summary.infoCount}`);

  if (results.issues.length === 0) {
    console.log('\n✅ No issues found! Your DaisyUI components are properly standardized.');
    return;
  }

  // Group issues by file
  const issuesByFile = results.issues.reduce(
    (acc, issue) => {
      if (!acc[issue.file]) acc[issue.file] = [];
      acc[issue.file].push(issue);
      return acc;
    },
    {} as Record<string, ComponentIssue[]>
  );

  console.log(`\n🔍 Issues by file:`);
  Object.entries(issuesByFile).forEach(([file, issues]) => {
    console.log(`\n📄 ${file.replace(process.cwd(), '.')}`);
    issues.forEach((issue) => {
      const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
      console.log(`   ${icon} Line ${issue.line}: ${issue.issue}`);
      if (issue.suggestion) {
        console.log(`      💡 ${issue.suggestion}`);
      }
    });
  });

  // Top issues summary
  const issueCounts = results.issues.reduce(
    (acc, issue) => {
      acc[issue.issue] = (acc[issue.issue] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  console.log(`\n🏆 Most common issues:`);
  Object.entries(issueCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .forEach(([issue, count]) => {
      console.log(`   • ${issue}: ${count} occurrences`);
    });

  console.log(`\n🛠️  Next steps:`);
  console.log(`   1. Fix all errors (${results.summary.errorCount}) first`);
  console.log(`   2. Address warnings (${results.summary.warningCount}) for better practices`);
  console.log(`   3. Review info items (${results.summary.infoCount}) for optimization`);
  console.log(`   4. Run 'npm run type-check:full' after fixes`);
  console.log(`   5. Test components in development mode`);
}

// CLI execution
async function main() {
  const auditor = new DaisyUIAuditor();
  const srcPath = path.join(process.cwd(), 'src');

  console.log('🚀 Starting DaisyUI Component Audit...\n');

  try {
    const results = await auditor.auditDirectory(srcPath);
    generateReport(results);

    // Exit with error code if critical issues found
    if (results.summary.errorCount > 0) {
      console.log('\n🚨 Critical issues found. Please fix errors before committing.');
      process.exit(1);
    } else {
      console.log('\n✅ Audit completed successfully!');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  main().catch(console.error);
}

export { DaisyUIAuditor, type ComponentIssue, type AuditResults };
