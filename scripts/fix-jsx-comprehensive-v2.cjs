#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Comprehensive JSX fix patterns - ordered by priority
const fixPatterns = [
  // 1. Fix self-closing tags with content (most critical)
  {
    name: 'DaisyButton self-closing with content',
    pattern: /<DaisyButton([^>]*?)\/>\s*\n?\s*([^<\n]+|<(?!\/DaisyButton)[^>]*>)/gm,
    replacement: '<DaisyButton$1>\n  $2\n</DaisyButton>'
  },
  {
    name: 'DaisyCard self-closing with content',
    pattern: /<DaisyCard([^>]*?)\/>\s*\n?\s*([^<\n]+|<(?!\/DaisyCard)[^>]*>)/gm,
    replacement: '<DaisyCard$1>\n  $2\n</DaisyCard>'
  },
  {
    name: 'DaisyBadge self-closing with content',
    pattern: /<DaisyBadge([^>]*?)\/>\s*\n?\s*([^<\n]+|<(?!\/DaisyBadge)[^>]*>)/gm,
    replacement: '<DaisyBadge$1>\n  $2\n</DaisyBadge>'
  },
  {
    name: 'DaisyAlert self-closing with content',
    pattern: /<DaisyAlert([^>]*?)\/>\s*\n?\s*([^<\n]+|<(?!\/DaisyAlert)[^>]*>)/gm,
    replacement: '<DaisyAlert$1>\n  $2\n</DaisyAlert>'
  },
  {
    name: 'DaisyDialog components self-closing with content',
    pattern: /<(DaisyDialog(?:Content|Header|Title|Description))([^>]*?)\/>\s*\n?\s*([^<\n]+|<(?!\/\1)[^>]*>)/gm,
    replacement: '<$1$2>\n  $3\n</$1>'
  },
  {
    name: 'DaisyCardContent self-closing with content',
    pattern: /<DaisyCardContent([^>]*?)\/>\s*\n?\s*([^<\n]+|<(?!\/DaisyCardContent)[^>]*>)/gm,
    replacement: '<DaisyCardContent$1>\n  $2\n</DaisyCardContent>'
  },
  {
    name: 'DaisyCardBody self-closing with content',
    pattern: /<DaisyCardBody([^>]*?)\/>\s*\n?\s*([^<\n]+|<(?!\/DaisyCardBody)[^>]*>)/gm,
    replacement: '<DaisyCardBody$1>\n  $2\n</DaisyCardBody>'
  },

  // 2. Fix specific component tag mismatches
  {
    name: 'SelectTrigger tag mismatch',
    pattern: /<DaisySelectTrigger([^>]*)>([\s\S]*?)<\/SelectTrigger>/g,
    replacement: '<DaisySelectTrigger$1>$2</DaisySelectTrigger>'
  },
  {
    name: 'SelectContent tag mismatch',
    pattern: /<DaisySelectContent([^>]*)>([\s\S]*?)<\/SelectContent>/g,
    replacement: '<DaisySelectContent$1>$2</DaisySelectContent>'
  },
  {
    name: 'SelectItem tag mismatch',
    pattern: /<DaisySelectItem([^>]*)>([\s\S]*?)<\/SelectItem>/g,
    replacement: '<DaisySelectItem$1>$2</DaisySelectItem>'
  },

  // 3. Fix DaisyCard structure issues
  {
    name: 'DaisyCardContent/DaisyCardBody mismatch',
    pattern: /<DaisyCardContent([^>]*)>([\s\S]*?)<\/DaisyCardBody>/g,
    replacement: '<DaisyCardContent$1>$2</DaisyCardContent>'
  },
  {
    name: 'DaisyCardBody/DaisyCardContent mismatch',
    pattern: /<DaisyCardBody([^>]*)>([\s\S]*?)<\/DaisyCardContent>/g,
    replacement: '<DaisyCardBody$1>$2</DaisyCardBody>'
  },

  // 4. Fix missing DaisyCardHeader closing tags
  {
    name: 'DaisyCardTitle without closing DaisyCardHeader',
    pattern: /(<DaisyCardTitle[^>]*>[\s\S]*?<\/DaisyCardTitle>)\s*\n\s*(<DaisyCardContent)/g,
    replacement: '$1\n        </DaisyCardHeader>\n        $2'
  },
  {
    name: 'DaisyCardDescription without closing DaisyCardHeader',
    pattern: /(<DaisyCardDescription[^>]*>[\s\S]*?<\/DaisyCardDescription>)\s*\n\s*(<DaisyCardContent)/g,
    replacement: '$1\n        </DaisyCardHeader>\n        $2'
  },

  // 5. Fix DaisyAlert structure issues
  {
    name: 'DaisyAlertDescription without closing tag',
    pattern: /(<DaisyAlertDescription[^>]*>[\s\S]*?)(\n\s*<\/DaisyAlert>)/g,
    replacement: '$1\n                </DaisyAlertDescription>$2'
  },
  {
    name: 'Duplicate DaisyAlertDescription closing tags',
    pattern: /(<\/DaisyAlertDescription>)\s*\n\s*(<\/DaisyAlertDescription>)/g,
    replacement: '$1'
  },

  // 6. Generic component name mismatches
  {
    name: 'Generic Daisy component name mismatches',
    pattern: /<(Daisy[A-Z][a-zA-Z]*)([^>]*)>([\s\S]*?)<\/((?!$1)Daisy[A-Z][a-zA-Z]*)>/g,
    replacement: '<$1$2>$3</$1>'
  }
];

async function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let appliedFixes = [];
    
    // Create backup
    const backupPath = filePath + '.backup-' + Date.now();
    fs.writeFileSync(backupPath, content);
    
    // Apply fixes in order of priority
    for (const { name, pattern, replacement } of fixPatterns) {
      const originalContent = content;
      content = content.replace(pattern, replacement);
      
      if (content !== originalContent) {
        modified = true;
        appliedFixes.push(name);
      }
    }
    
    // Additional specific fixes for problematic patterns found in the codebase
    
    // Fix DaisyButton with self-closing and content on next lines
    const buttonFixPattern = /(<DaisyButton[^>]*className="[^"]*"[^>]*?)\s*\/>\s*\n\s*(<[^>]*>.*?)\s*\n\s*([A-Za-z ]+)\s*\n\s*(<\/DaisyButton>)/gm;
    if (buttonFixPattern.test(content)) {
      content = content.replace(buttonFixPattern, '$1>\n  $2\n  $3\n</DaisyButton>');
      modified = true;
      appliedFixes.push('DaisyButton complex fix');
    }
    
    // Fix simple DaisyButton self-closing with text content  
    const simpleButtonPattern = /(<DaisyButton[^>]*?)\s*\/>\s*\n\s*([A-Za-z][A-Za-z\s]+)\s*\n\s*(<\/DaisyButton>)/gm;
    if (simpleButtonPattern.test(content)) {
      content = content.replace(simpleButtonPattern, '$1>\n  $2\n</DaisyButton>');
      modified = true;
      appliedFixes.push('DaisyButton simple fix');
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${path.relative(process.cwd(), filePath)}`);
      console.log(`   Applied fixes: ${appliedFixes.join(', ')}`);
      
      // Clean up backup after successful fix
      fs.unlinkSync(backupPath);
      return { fixed: true, appliedFixes };
    } else {
      // Remove backup if no changes were made
      fs.unlinkSync(backupPath);
      return { fixed: false, appliedFixes: [] };
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return { fixed: false, appliedFixes: [], error: error.message };
  }
}

async function main() {
  console.log('🔧 Starting comprehensive JSX fix v2...\n');
  
  const patterns = [
    'src/**/*.tsx',
    'src/**/*.jsx'
  ];
  
  let totalFiles = 0;
  let fixedFiles = 0;
  let allAppliedFixes = new Set();
  
  console.log('🔧 Applying fixes...\n');
  
  // Apply fixes
  for (const pattern of patterns) {
    const files = glob.sync(pattern, { nodir: true });
    totalFiles += files.length;
    
    console.log(`Processing ${files.length} files matching ${pattern}...`);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await fixFile(file);
      if (result.fixed) {
        fixedFiles++;
        result.appliedFixes.forEach(fix => allAppliedFixes.add(fix));
      }
      
      // Progress indicator every 25 files
      if (i % 25 === 0 || i === files.length - 1) {
        process.stdout.write(`\rProcessed ${i + 1} / ${files.length} files`);
      }
    }
    console.log('\n');
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Total files processed: ${totalFiles}`);
  console.log(`   Files with fixes applied: ${fixedFiles}`);
  console.log(`   Files without changes: ${totalFiles - fixedFiles}`);
  
  if (allAppliedFixes.size > 0) {
    console.log(`\n🔧 Fix types applied:`);
    [...allAppliedFixes].forEach(fix => {
      console.log(`   • ${fix}`);
    });
  }
  
  if (fixedFiles > 0) {
    console.log(`\n✅ JSX fixes completed successfully!`);
    console.log(`\n🔍 Next steps:`);
    console.log(`   1. Run 'npm run type-check' to verify fixes`);
    console.log(`   2. Run 'npm run build' to test build`);
    console.log(`   3. Review changes and commit if everything looks good`);
  } else {
    console.log(`\n✨ No fixes were needed - your codebase is already clean!`);
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Process interrupted. Cleaning up...');
  process.exit(0);
});

main().catch(error => {
  console.error('\n❌ Script failed:', error);
  process.exit(1);
});