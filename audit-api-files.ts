#!/usr/bin/env tsx
/**
 * API Directory Audit Script
 * Analyzes all API files for usage, dependencies, and cleanup opportunities
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

interface FileAudit {
  path: string;
  size: number;
  lines: number;
  category: string;
  hasExports: boolean;
  imports: string[];
  hasTodos: boolean;
  hasDeprecated: boolean;
  hasCommentedCode: boolean;
  lastModified: Date;
  recommendation: 'keep' | 'remove' | 'refactor' | 'review';
  reason: string;
  duplicateOf?: string;
}

class ApiAuditor {
  private apiDir = path.join(process.cwd(), 'src/app/api');
  private files: FileAudit[] = [];
  private importMap = new Map<string, Set<string>>();

  async audit() {
    console.log('🔍 Starting API Directory Audit...\n');
    
    // Step 1: Collect all files
    await this.collectFiles();
    
    // Step 2: Analyze each file
    await this.analyzeFiles();
    
    // Step 3: Check for duplicates
    this.checkDuplicates();
    
    // Step 4: Generate report
    this.generateReport();
  }

  private async collectFiles() {
    const pattern = path.join(this.apiDir, '**/*.{ts,js,tsx,jsx}');
    const filePaths = await glob(pattern, { windowsPathsNoEscape: true });
    console.log(`Found ${filePaths.length} files in /api directory\n`);
    return filePaths;
  }

  private async analyzeFiles() {
    const filePaths = await this.collectFiles();
    
    for (const filePath of filePaths) {
      const audit = await this.analyzeFile(filePath);
      this.files.push(audit);
    }
  }

  private async analyzeFile(filePath: string): Promise<FileAudit> {
    const stats = fs.statSync(filePath);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const relativePath = path.relative(this.apiDir, filePath);
    
    // Categorize file
    const category = this.categorizeFile(relativePath);
    
    // Check for exports
    const hasExports = /export\s+(async\s+)?(function|const|class|default)/.test(content);
    
    // Extract imports
    const imports = this.extractImports(content);
    
    // Check for TODOs
    const hasTodos = /\/\/\s*TODO|\/\*\s*TODO/.test(content);
    
    // Check for deprecated code
    const hasDeprecated = /@deprecated|DEPRECATED|\/\/\s*deprecated/i.test(content);
    
    // Check for large commented code blocks
    const hasCommentedCode = this.hasLargeCommentedCode(content);
    
    // Determine recommendation
    const { recommendation, reason } = this.getRecommendation({
      relativePath,
      category,
      hasExports,
      imports,
      hasTodos,
      hasDeprecated,
      hasCommentedCode,
      content,
      lines: lines.length
    });
    
    return {
      path: relativePath,
      size: stats.size,
      lines: lines.length,
      category,
      hasExports,
      imports,
      hasTodos,
      hasDeprecated,
      hasCommentedCode,
      lastModified: stats.mtime,
      recommendation,
      reason
    };
  }

  private categorizeFile(relativePath: string): string {
    if (relativePath.includes('auth')) return 'authentication';
    if (relativePath.includes('test') || relativePath.includes('debug')) return 'testing';
    if (relativePath.includes('webhook')) return 'webhooks';
    if (relativePath.includes('upload')) return 'file-upload';
    if (relativePath.includes('stripe') || relativePath.includes('billing')) return 'billing';
    if (relativePath.includes('monitoring') || relativePath.includes('health')) return 'monitoring';
    if (relativePath.includes('google-oauth')) return 'oauth';
    if (relativePath.includes('[...')) return 'catch-all';
    if (relativePath.includes('[') && relativePath.includes(']')) return 'dynamic-route';
    return 'endpoint';
  }

  private extractImports(content: string): string[] {
    const importRegex = /import\s+(?:[\s\S]*?)\s+from\s+['"](.+?)['"]/g;
    const imports: string[] = [];
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    return imports;
  }

  private hasLargeCommentedCode(content: string): boolean {
    // Check for multi-line commented code blocks
    const blockComments = content.match(/\/\*[\s\S]*?\*\//g) || [];
    const hasLargeBlockComments = blockComments.some(comment => comment.split('\n').length > 10);
    
    // Check for consecutive line comments
    const lines = content.split('\n');
    let consecutiveComments = 0;
    let maxConsecutive = 0;
    
    for (const line of lines) {
      if (line.trim().startsWith('//')) {
        consecutiveComments++;
        maxConsecutive = Math.max(maxConsecutive, consecutiveComments);
      } else {
        consecutiveComments = 0;
      }
    }
    
    return hasLargeBlockComments || maxConsecutive > 10;
  }

  private getRecommendation(fileInfo: any): { recommendation: FileAudit['recommendation'], reason: string } {
    const { relativePath, category, hasExports, hasDeprecated, hasCommentedCode, content, lines } = fileInfo;
    
    // Remove test/debug files in production
    if (category === 'testing') {
      if (relativePath.includes('auth-test') || relativePath.includes('auth-diagnostics')) {
        return { recommendation: 'remove', reason: 'Test/debug endpoint not needed in production' };
      }
    }
    
    // Remove deprecated files
    if (hasDeprecated && !hasExports) {
      return { recommendation: 'remove', reason: 'Deprecated file with no exports' };
    }
    
    // Check for duplicate auth endpoints
    if (relativePath.includes('auth')) {
      if (relativePath.includes('auth-safe') || relativePath.includes('auth-test')) {
        return { recommendation: 'remove', reason: 'Duplicate/test auth endpoint' };
      }
    }
    
    // Check for environment check endpoints
    if (relativePath.includes('check-env') || relativePath.includes('check-all-env')) {
      return { recommendation: 'remove', reason: 'Debug endpoint for environment checking' };
    }
    
    // Check for duplicate OAuth implementations
    if (relativePath.includes('google-oauth') && relativePath.includes('auth/google')) {
      return { recommendation: 'review', reason: 'Possible duplicate OAuth implementation' };
    }
    
    // Large files with lots of commented code
    if (hasCommentedCode && lines > 300) {
      return { recommendation: 'refactor', reason: 'Large file with significant commented code' };
    }
    
    // Files with no exports
    if (!hasExports && !relativePath.includes('route.')) {
      return { recommendation: 'review', reason: 'No exports found - may be unused' };
    }
    
    // Keep essential endpoints
    if (category === 'authentication' && relativePath.includes('[...nextauth]')) {
      return { recommendation: 'keep', reason: 'Core authentication endpoint' };
    }
    
    return { recommendation: 'keep', reason: 'Active endpoint' };
  }

  private checkDuplicates() {
    // Group files by similar names/purposes
    const groups = new Map<string, FileAudit[]>();
    
    for (const file of this.files) {
      // Extract base name for grouping
      const baseName = file.path
        .replace(/\[.*?\]/g, 'DYNAMIC')
        .replace(/route\.(ts|js|tsx|jsx)$/, '')
        .replace(/\//g, '-');
      
      if (!groups.has(baseName)) {
        groups.set(baseName, []);
      }
      groups.get(baseName)!.push(file);
    }
    
    // Check for duplicates within groups
    for (const [group, files] of groups) {
      if (files.length > 1) {
        // Mark potential duplicates
        files.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
        for (let i = 1; i < files.length; i++) {
          if (files[i].recommendation === 'keep') {
            files[i].recommendation = 'review';
            files[i].reason = `Potential duplicate of ${files[0].path}`;
            files[i].duplicateOf = files[0].path;
          }
        }
      }
    }
  }

  private generateReport() {
    console.log('📊 API Directory Audit Report\n');
    console.log('=' .repeat(80));
    
    // Summary statistics
    const stats = {
      total: this.files.length,
      keep: this.files.filter(f => f.recommendation === 'keep').length,
      remove: this.files.filter(f => f.recommendation === 'remove').length,
      refactor: this.files.filter(f => f.recommendation === 'refactor').length,
      review: this.files.filter(f => f.recommendation === 'review').length,
      totalSize: this.files.reduce((sum, f) => sum + f.size, 0),
      totalLines: this.files.reduce((sum, f) => sum + f.lines, 0)
    };
    
    console.log('\n📈 Summary Statistics:');
    console.log(`Total files: ${stats.total}`);
    console.log(`Keep: ${stats.keep}`);
    console.log(`Remove: ${stats.remove}`);
    console.log(`Refactor: ${stats.refactor}`);
    console.log(`Review: ${stats.review}`);
    console.log(`Total size: ${(stats.totalSize / 1024).toFixed(2)} KB`);
    console.log(`Total lines: ${stats.totalLines}`);
    
    // Files to remove
    console.log('\n🗑️ Files to Remove:');
    console.log('-'.repeat(80));
    const toRemove = this.files.filter(f => f.recommendation === 'remove');
    if (toRemove.length === 0) {
      console.log('No files recommended for removal');
    } else {
      toRemove.forEach(file => {
        console.log(`\n📁 ${file.path}`);
        console.log(`   Size: ${(file.size / 1024).toFixed(2)} KB | Lines: ${file.lines}`);
        console.log(`   Reason: ${file.reason}`);
      });
    }
    
    // Files to refactor
    console.log('\n🔧 Files to Refactor:');
    console.log('-'.repeat(80));
    const toRefactor = this.files.filter(f => f.recommendation === 'refactor');
    if (toRefactor.length === 0) {
      console.log('No files need refactoring');
    } else {
      toRefactor.forEach(file => {
        console.log(`\n📁 ${file.path}`);
        console.log(`   Size: ${(file.size / 1024).toFixed(2)} KB | Lines: ${file.lines}`);
        console.log(`   Reason: ${file.reason}`);
        if (file.hasTodos) console.log(`   ⚠️ Contains TODO comments`);
        if (file.hasDeprecated) console.log(`   ⚠️ Contains deprecated code`);
        if (file.hasCommentedCode) console.log(`   ⚠️ Contains large commented blocks`);
      });
    }
    
    // Files to review
    console.log('\n👀 Files to Review:');
    console.log('-'.repeat(80));
    const toReview = this.files.filter(f => f.recommendation === 'review');
    if (toReview.length === 0) {
      console.log('No files need review');
    } else {
      toReview.forEach(file => {
        console.log(`\n📁 ${file.path}`);
        console.log(`   Size: ${(file.size / 1024).toFixed(2)} KB | Lines: ${file.lines}`);
        console.log(`   Reason: ${file.reason}`);
        if (file.duplicateOf) console.log(`   🔄 Possible duplicate of: ${file.duplicateOf}`);
      });
    }
    
    // Category breakdown
    console.log('\n📂 Files by Category:');
    console.log('-'.repeat(80));
    const categories = new Map<string, number>();
    this.files.forEach(f => {
      categories.set(f.category, (categories.get(f.category) || 0) + 1);
    });
    Array.from(categories.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, count]) => {
        console.log(`${cat}: ${count} files`);
      });
    
    // Space savings
    const removableSize = toRemove.reduce((sum, f) => sum + f.size, 0);
    console.log('\n💾 Potential Space Savings:');
    console.log(`Removing ${toRemove.length} files would save ${(removableSize / 1024).toFixed(2)} KB`);
    
    // Generate cleanup script
    if (toRemove.length > 0) {
      const cleanupScript = path.join(process.cwd(), 'cleanup-api.sh');
      const scriptContent = `#!/bin/bash
# API Cleanup Script
# Generated on ${new Date().toISOString()}

echo "🧹 Cleaning up API directory..."
echo "This will remove ${toRemove.length} files"
echo ""

# Create backup directory
BACKUP_DIR="api-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Files to remove
${toRemove.map(f => `
# ${f.reason}
if [ -f "src/app/api/${f.path}" ]; then
  cp "src/app/api/${f.path}" "$BACKUP_DIR/${f.path.replace(/\//g, '_')}"
  rm "src/app/api/${f.path}"
  echo "✓ Removed: ${f.path}"
fi`).join('\n')}

echo ""
echo "✅ Cleanup complete!"
echo "Backup created in: $BACKUP_DIR"
`;
      
      fs.writeFileSync(cleanupScript, scriptContent);
      console.log(`\n✅ Cleanup script generated: ${cleanupScript}`);
      console.log('Run with: bash cleanup-api.sh');
    }
  }
}

// Run the audit
const auditor = new ApiAuditor();
auditor.audit().catch(console.error);