#!/usr/bin/env tsx
/**
 * Comprehensive Markdown Files Audit Script
 * Analyzes all .md files for consolidation opportunities
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

interface MarkdownFile {
  path: string;
  relativePath: string;
  size: number;
  lines: number;
  category: string;
  lastModified: Date;
  title: string;
  headings: string[];
  links: string[];
  hasOutdatedInfo: boolean;
  isDuplicate: boolean;
  duplicateOf?: string;
  recommendation: 'keep' | 'merge' | 'archive' | 'delete';
  reason: string;
  keyContent: string[];
}

class MarkdownAuditor {
  private files: MarkdownFile[] = [];
  private contentMap = new Map<string, string[]>();

  async audit() {
    console.log('📚 Starting Markdown Files Audit...\n');
    
    await this.collectFiles();
    await this.analyzeFiles();
    await this.checkDuplicates();
    this.generateReport();
    await this.createConsolidatedFile();
  }

  private async collectFiles() {
    const pattern = './**/*.md';
    const excludePatterns = [
      './node_modules/**',
      './.next/**',
      './dist/**',
      './.git/**',
      './promptoptimizer.md'
    ];
    
    const allFiles = await glob(pattern, { 
      ignore: excludePatterns,
      windowsPathsNoEscape: true 
    });
    
    console.log(`Found ${allFiles.length} markdown files (excluding promptoptimizer.md)\n`);
    return allFiles;
  }

  private async analyzeFiles() {
    const filePaths = await this.collectFiles();
    
    for (const filePath of filePaths) {
      const audit = await this.analyzeFile(filePath);
      this.files.push(audit);
    }
  }

  private async analyzeFile(filePath: string): Promise<MarkdownFile> {
    const stats = fs.statSync(filePath);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const relativePath = path.relative(process.cwd(), filePath);
    
    // Extract title (first # heading)
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : path.basename(filePath, '.md');
    
    // Extract all headings
    const headings = content.match(/^#{1,6}\s+.+$/gm) || [];
    
    // Extract links
    const linkMatches = content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
    const links = linkMatches.map(match => {
      const linkMatch = match.match(/\[([^\]]+)\]\(([^)]+)\)/);
      return linkMatch ? linkMatch[2] : '';
    });
    
    // Check for outdated info
    const hasOutdatedInfo = this.checkOutdatedContent(content);
    
    // Categorize file
    const category = this.categorizeFile(relativePath, content);
    
    // Extract key content points
    const keyContent = this.extractKeyContent(content);
    
    // Get recommendation
    const { recommendation, reason } = this.getRecommendation({
      relativePath,
      category,
      content,
      hasOutdatedInfo,
      lines: lines.length,
      title
    });
    
    return {
      path: filePath,
      relativePath,
      size: stats.size,
      lines: lines.length,
      category,
      lastModified: stats.mtime,
      title,
      headings,
      links,
      hasOutdatedInfo,
      isDuplicate: false,
      recommendation,
      reason,
      keyContent
    };
  }

  private categorizeFile(filePath: string, content: string): string {
    const lowerPath = filePath.toLowerCase();
    const lowerContent = content.toLowerCase();
    
    if (lowerPath.includes('claude') || lowerPath.includes('claude.md')) return 'configuration';
    if (lowerPath.includes('readme')) return 'documentation';
    if (lowerPath.includes('api')) return 'api-docs';
    if (lowerPath.includes('audit') || lowerPath.includes('report')) return 'audit-reports';
    if (lowerPath.includes('deployment') || lowerPath.includes('setup')) return 'deployment';
    if (lowerPath.includes('test')) return 'testing';
    if (lowerPath.includes('typescript') || lowerPath.includes('type')) return 'development';
    if (lowerPath.includes('stripe') || lowerPath.includes('billing')) return 'billing';
    if (lowerPath.includes('oauth') || lowerPath.includes('auth')) return 'authentication';
    if (lowerPath.includes('supabase') || lowerPath.includes('database')) return 'database';
    if (lowerPath.includes('migration') || lowerPath.includes('plan')) return 'migration';
    if (lowerPath.includes('security')) return 'security';
    if (lowerPath.includes('performance')) return 'performance';
    if (lowerPath.includes('feature') || lowerPath.includes('functionality')) return 'features';
    if (lowerPath.includes('package')) return 'dependencies';
    if (lowerPath.includes('vercel') || lowerPath.includes('env')) return 'environment';
    
    return 'general';
  }

  private checkOutdatedContent(content: string): boolean {
    const outdatedPatterns = [
      /\b(TODO|FIXME|DEPRECATED|OUTDATED|OLD|LEGACY)\b/i,
      /\b(phase\s*[12]|initial|draft|preliminary)\b/i,
      /\b(will\s+be\s+implemented|coming\s+soon|future\s+version)\b/i,
      /\b202[0-3]\b/, // Years 2020-2023
      /\bnext\.js\s*1[0-2]\b/i, // Old Next.js versions
      /\breact\s*1[6-7]\b/i // Old React versions
    ];
    
    return outdatedPatterns.some(pattern => pattern.test(content));
  }

  private extractKeyContent(content: string): string[] {
    const keyContent: string[] = [];
    
    // Extract code blocks
    const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
    codeBlocks.forEach(block => {
      if (block.length > 50) { // Only significant code blocks
        keyContent.push(`Code: ${block.substring(0, 100)}...`);
      }
    });
    
    // Extract important sections
    const importantSections = content.match(/^#{1,3}\s+.+$/gm) || [];
    keyContent.push(...importantSections.slice(0, 5)); // Top 5 headings
    
    // Extract configuration examples
    const configExamples = content.match(/\w+_\w+=/g) || [];
    if (configExamples.length > 0) {
      keyContent.push(`Config vars: ${configExamples.slice(0, 5).join(', ')}`);
    }
    
    return keyContent;
  }

  private getRecommendation(fileInfo: any): { recommendation: MarkdownFile['recommendation'], reason: string } {
    const { relativePath, category, content, hasOutdatedInfo, lines, title } = fileInfo;
    
    // Delete temporary audit reports
    if (relativePath.includes('AUDIT_REPORT') || relativePath.includes('audit-report')) {
      return { recommendation: 'delete', reason: 'Temporary audit report - content will be consolidated' };
    }
    
    // Archive very outdated files
    if (hasOutdatedInfo && lines < 50) {
      return { recommendation: 'delete', reason: 'Short outdated file with no current value' };
    }
    
    // Merge specific documentation types
    if (category === 'features' || category === 'development') {
      return { recommendation: 'merge', reason: 'Content should be consolidated into main documentation' };
    }
    
    // Keep configuration files
    if (category === 'configuration' || relativePath.includes('CLAUDE.md')) {
      return { recommendation: 'keep', reason: 'Essential configuration file' };
    }
    
    // Merge duplicate setup guides
    if (category === 'deployment' || category === 'environment') {
      return { recommendation: 'merge', reason: 'Deployment/environment info should be consolidated' };
    }
    
    // Keep main documentation
    if (relativePath === './README.md') {
      return { recommendation: 'keep', reason: 'Main project README' };
    }
    
    // Archive old audit reports
    if (category === 'audit-reports' && !relativePath.includes('API_AUDIT_REPORT')) {
      return { recommendation: 'archive', reason: 'Historical audit report - archive for reference' };
    }
    
    return { recommendation: 'merge', reason: 'Content should be consolidated' };
  }

  private checkDuplicates() {
    // Group files by similar content/purpose
    const contentGroups = new Map<string, MarkdownFile[]>();
    
    for (const file of this.files) {
      // Create a simple content hash based on headings and key terms
      const contentKey = file.headings.join('|').toLowerCase();
      
      if (!contentGroups.has(contentKey)) {
        contentGroups.set(contentKey, []);
      }
      contentGroups.get(contentKey)!.push(file);
    }
    
    // Mark duplicates
    for (const [key, files] of contentGroups) {
      if (files.length > 1) {
        // Keep the most recent, mark others as duplicates
        files.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
        for (let i = 1; i < files.length; i++) {
          files[i].isDuplicate = true;
          files[i].duplicateOf = files[0].relativePath;
          if (files[i].recommendation === 'keep') {
            files[i].recommendation = 'merge';
            files[i].reason = `Duplicate content - merge with ${files[0].relativePath}`;
          }
        }
      }
    }
  }

  private generateReport() {
    console.log('📋 Markdown Files Audit Report\n');
    console.log('=' .repeat(80));
    
    // Summary statistics
    const stats = {
      total: this.files.length,
      keep: this.files.filter(f => f.recommendation === 'keep').length,
      merge: this.files.filter(f => f.recommendation === 'merge').length,
      archive: this.files.filter(f => f.recommendation === 'archive').length,
      delete: this.files.filter(f => f.recommendation === 'delete').length,
      totalSize: this.files.reduce((sum, f) => sum + f.size, 0),
      totalLines: this.files.reduce((sum, f) => sum + f.lines, 0)
    };
    
    console.log('\n📈 Summary Statistics:');
    console.log(`Total markdown files: ${stats.total}`);
    console.log(`Keep as-is: ${stats.keep}`);
    console.log(`Merge into consolidated: ${stats.merge}`);
    console.log(`Archive: ${stats.archive}`);
    console.log(`Delete: ${stats.delete}`);
    console.log(`Total size: ${(stats.totalSize / 1024).toFixed(2)} KB`);
    console.log(`Total lines: ${stats.totalLines}`);
    
    // Files by category
    console.log('\n📂 Files by Category:');
    console.log('-'.repeat(40));
    const categories = new Map<string, number>();
    this.files.forEach(f => {
      categories.set(f.category, (categories.get(f.category) || 0) + 1);
    });
    Array.from(categories.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, count]) => {
        console.log(`${cat}: ${count} files`);
      });
    
    // Files to keep
    console.log('\n✅ Files to Keep:');
    console.log('-'.repeat(40));
    const toKeep = this.files.filter(f => f.recommendation === 'keep');
    toKeep.forEach(file => {
      console.log(`📄 ${file.relativePath}`);
      console.log(`   Category: ${file.category} | Size: ${(file.size / 1024).toFixed(2)} KB`);
      console.log(`   Reason: ${file.reason}\n`);
    });
    
    // Files to merge
    console.log('🔀 Files to Merge:');
    console.log('-'.repeat(40));
    const toMerge = this.files.filter(f => f.recommendation === 'merge');
    toMerge.forEach(file => {
      console.log(`📄 ${file.relativePath}`);
      console.log(`   Category: ${file.category} | Lines: ${file.lines}`);
      console.log(`   Title: ${file.title}`);
      console.log(`   Key content: ${file.keyContent.slice(0, 2).join('; ')}`);
      console.log(`   Reason: ${file.reason}\n`);
    });
    
    // Files to delete
    console.log('🗑️ Files to Delete:');
    console.log('-'.repeat(40));
    const toDelete = this.files.filter(f => f.recommendation === 'delete');
    toDelete.forEach(file => {
      console.log(`📄 ${file.relativePath}`);
      console.log(`   Reason: ${file.reason}\n`);
    });
  }

  private async createConsolidatedFile() {
    console.log('\n📝 Creating consolidated documentation file...\n');
    
    const consolidatedContent = this.buildConsolidatedContent();
    
    // Write the consolidated file
    const outputPath = path.join(process.cwd(), 'CONSOLIDATED_DOCUMENTATION.md');
    fs.writeFileSync(outputPath, consolidatedContent);
    
    console.log(`✅ Consolidated documentation created: ${outputPath}`);
    console.log(`📏 Size: ${(consolidatedContent.length / 1024).toFixed(2)} KB`);
    
    // Create cleanup script
    const cleanupScript = this.createCleanupScript();
    const scriptPath = path.join(process.cwd(), 'cleanup-markdown.sh');
    fs.writeFileSync(scriptPath, cleanupScript);
    
    console.log(`🧹 Cleanup script created: ${scriptPath}`);
  }

  private buildConsolidatedContent(): string {
    const content = [];
    
    // Header
    content.push('# Riscura RCSA Platform - Comprehensive Documentation');
    content.push('');
    content.push('> **Single Source of Truth**  ');
    content.push('> This document consolidates all project documentation into one comprehensive reference.');
    content.push('');
    content.push('**Last Updated:** ' + new Date().toISOString().split('T')[0]);
    content.push('**Version:** 1.0.0');
    content.push('');
    
    // Table of Contents
    content.push('## 📑 Table of Contents');
    content.push('');
    content.push('1. [Project Overview](#project-overview)');
    content.push('2. [Architecture & Technology Stack](#architecture--technology-stack)');
    content.push('3. [Development Setup](#development-setup)');
    content.push('4. [API Documentation](#api-documentation)');
    content.push('5. [Authentication & Security](#authentication--security)');
    content.push('6. [Database & Data Management](#database--data-management)');
    content.push('7. [Deployment & Infrastructure](#deployment--infrastructure)');
    content.push('8. [Testing Strategy](#testing-strategy)');
    content.push('9. [Performance & Optimization](#performance--optimization)');
    content.push('10. [Feature Roadmap](#feature-roadmap)');
    content.push('11. [Troubleshooting](#troubleshooting)');
    content.push('');
    
    // Extract and organize content from existing files
    const sections = this.organizeContentSections();
    
    sections.forEach(section => {
      content.push(section.header);
      content.push('');
      content.push(section.content);
      content.push('');
    });
    
    return content.join('\n');
  }

  private organizeContentSections() {
    const sections = [];
    
    // Find key content from different files
    const readmeFile = this.files.find(f => f.relativePath === './README.md');
    const claudeFile = this.files.find(f => f.relativePath === './CLAUDE.md');
    const apiDocsFile = this.files.find(f => f.relativePath.includes('api/README.md'));
    const devStatusFile = this.files.find(f => f.relativePath === './DEVELOPMENT_STATUS.md');
    
    // Project Overview
    sections.push({
      header: '## 🎯 Project Overview',
      content: readmeFile ? this.extractSection(readmeFile.path, 'overview') : 'Riscura RCSA Platform - Risk, Control, and Self-Assessment management system.'
    });
    
    // Architecture from CLAUDE.md
    sections.push({
      header: '## 🏗️ Architecture & Technology Stack',
      content: claudeFile ? this.extractSection(claudeFile.path, 'architecture') : 'Technology stack information not available.'
    });
    
    // Development Setup
    sections.push({
      header: '## ⚙️ Development Setup',
      content: this.consolidateSetupInstructions()
    });
    
    // API Documentation
    sections.push({
      header: '## 📡 API Documentation',
      content: apiDocsFile ? this.extractSection(apiDocsFile.path, 'api') : 'API documentation being consolidated.'
    });
    
    // Authentication & Security
    sections.push({
      header: '## 🔐 Authentication & Security',
      content: this.consolidateAuthDocs()
    });
    
    // More sections...
    
    return sections;
  }

  private extractSection(filePath: string, sectionType: string): string {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      // Extract relevant sections based on type
      return content.substring(0, 1000) + '...'; // Simplified for now
    } catch {
      return 'Content not available.';
    }
  }

  private consolidateSetupInstructions(): string {
    const setupFiles = this.files.filter(f => 
      f.category === 'deployment' || 
      f.category === 'environment' ||
      f.relativePath.includes('setup')
    );
    
    let content = '### Quick Start\n\n';
    content += '```bash\n';
    content += '# Clone and setup\n';
    content += 'git clone [repository]\n';
    content += 'cd riscura\n';
    content += 'npm install\n';
    content += 'npm run dev:setup\n';
    content += '```\n\n';
    
    // Add content from setup files
    setupFiles.forEach(file => {
      try {
        const fileContent = fs.readFileSync(file.path, 'utf-8');
        const codeBlocks = fileContent.match(/```[\s\S]*?```/g) || [];
        if (codeBlocks.length > 0) {
          content += `### From ${file.title}\n\n`;
          content += codeBlocks[0] + '\n\n';
        }
      } catch {}
    });
    
    return content;
  }

  private consolidateAuthDocs(): string {
    const authFiles = this.files.filter(f => f.category === 'authentication');
    
    let content = '### Overview\n\n';
    content += 'The application supports multiple authentication methods:\n';
    content += '- Email/Password authentication\n';
    content += '- Google OAuth 2.0\n';
    content += '- Session-based authentication\n\n';
    
    // Add OAuth setup from relevant files
    const oauthFile = authFiles.find(f => f.relativePath.includes('oauth'));
    if (oauthFile) {
      try {
        const fileContent = fs.readFileSync(oauthFile.path, 'utf-8');
        const configSection = fileContent.match(/```[\s\S]*?```/);
        if (configSection) {
          content += '### OAuth Configuration\n\n';
          content += configSection[0] + '\n\n';
        }
      } catch {}
    }
    
    return content;
  }

  private createCleanupScript(): string {
    const toDelete = this.files.filter(f => f.recommendation === 'delete');
    const toMerge = this.files.filter(f => f.recommendation === 'merge');
    
    return `#!/bin/bash

# Markdown Files Cleanup Script
# Generated on ${new Date().toISOString()}

echo "📚 Markdown Files Cleanup"
echo "========================="

# Create backup
BACKUP_DIR="markdown-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "Backup directory: $BACKUP_DIR"

# Files to delete
echo ""
echo "Removing unnecessary files..."
${toDelete.map(f => `
if [ -f "${f.relativePath}" ]; then
  cp "${f.relativePath}" "$BACKUP_DIR/"
  rm "${f.relativePath}"
  echo "✓ Deleted: ${f.relativePath}"
fi`).join('')}

# Archive merged files
echo ""
echo "Archiving merged files..."
mkdir -p "$BACKUP_DIR/archived"
${toMerge.map(f => `
if [ -f "${f.relativePath}" ]; then
  mv "${f.relativePath}" "$BACKUP_DIR/archived/"
  echo "✓ Archived: ${f.relativePath}"
fi`).join('')}

echo ""
echo "✅ Cleanup complete!"
echo "Files removed: ${toDelete.length}"
echo "Files archived: ${toMerge.length}"
echo "Backup location: $BACKUP_DIR"
echo ""
echo "📝 New consolidated documentation: CONSOLIDATED_DOCUMENTATION.md"
`;
  }
}

// Run the audit
const auditor = new MarkdownAuditor();
auditor.audit().catch(console.error);