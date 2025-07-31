#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of files with specific known issues to fix
const filesToFix = [
  'src/app/(dashboard)/rcsa/page.tsx',
  'src/app/page.tsx',
  'src/app/auth/error/page.tsx',
  'src/app/auth/login/page.tsx',
  'src/app/billing/upgrade/page.tsx',
  'src/app/auth/forgot-password/page.tsx'
];

// Specific fix patterns for the remaining issues
const specificFixes = [
  // Fix self-closing tags with content and misplaced closing tags
  {
    name: 'Fix DaisyButton self-closing with content on multiple lines',
    pattern: /(<DaisyButton[^>]*?)\s*\/>\s*\n\s*([^<\n]+)\s*\n\s*([^<\n]+)\s*\n\s*(<\/DaisyButton>)/gm,
    replacement: '$1>\n  $2\n  $3\n</DaisyButton>'
  },
  {
    name: 'Fix DaisyButton self-closing with icon and text',
    pattern: /(<DaisyButton[^>]*?)\s*\/>\s*\n\s*(<[^>]*>[\s\S]*?)\s*\n\s*([A-Za-z][A-Za-z\s]+)\s*\n\s*(<\/DaisyButton>)/gm,
    replacement: '$1>\n  $2\n  $3\n</DaisyButton>'
  },
  {
    name: 'Fix DaisyCard/DaisyCardBody/DaisyCardContent structure',
    pattern: /(<DaisyCard[^>]*?)\s*\/>\s*\n\s*(<DaisyCard(?:Body|Content)[^>]*?)\s*\/>\s*\n\s*(<\/DaisyCard>)\s*\n\s*(<\/DaisyCard(?:Body|Content)>)/gm,
    replacement: '$1>\n  $2>\n  </DaisyCardBody>\n</DaisyCard>'
  },
  {
    name: 'Fix DaisyDialog self-closing with content',
    pattern: /(<DaisyDialog[^>]*?)\s*\/>\s*\n\s*(<DaisyDialog[^>]*?)\s*\/>\s*\n\s*(<\/DaisyDialog[^>]*>)/gm,
    replacement: '$1>\n  $2>\n  </DaisyDialogContent>\n</DaisyDialog>'
  },
  {
    name: 'Fix DaisyAlert self-closing with content',
    pattern: /(<DaisyAlert[^>]*?)\s*\/>\s*\n\s*([^<\n]+)\s*\n\s*(<\/DaisyAlert>)/gm,
    replacement: '$1>\n  $2\n</DaisyAlert>'
  },
  {
    name: 'Fix DaisyBadge self-closing with content',
    pattern: /(<DaisyBadge[^>]*?)\s*\/>\s*\n\s*([^<\n]+)\s*\n\s*(<\/DaisyBadge>)/gm,
    replacement: '$1>\n  $2\n</DaisyBadge>'
  },
  {
    name: 'Fix duplicate closing tags',
    pattern: /(<\/Daisy[A-Z][a-zA-Z]*>)\s*\n\s*(<\/Daisy[A-Z][a-zA-Z]*>)/g,
    replacement: '$1'
  },
  {
    name: 'Fix wrong component in closing tag',
    pattern: /<\/DaisyTable>/g,
    replacement: '</DaisyDialogHeader>'
  },
  {
    name: 'Fix DaisyInput in closing position',
    pattern: /<\/DaisyInput>/g,
    replacement: '</DaisyButton>'
  },
  {
    name: 'Fix misplaced closing paragraph tag',
    pattern: /<\/p>/g,
    replacement: '</DaisyCardDescription>'
  }
];

function fixSpecificFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let appliedFixes = [];
    
    // Create backup
    const backupPath = filePath + '.backup-specific-' + Date.now();
    fs.writeFileSync(backupPath, content);
    
    // Apply specific fixes
    for (const { name, pattern, replacement } of specificFixes) {
      const originalContent = content;
      content = content.replace(pattern, replacement);
      
      if (content !== originalContent) {
        modified = true;
        appliedFixes.push(name);
      }
    }
    
    // Manual fixes for specific known issues based on system reminders
    
    // Fix RCSA page specific issues
    if (filePath.includes('rcsa/page.tsx')) {
      // Fix the DaisyButton with className ending and content following
      content = content.replace(
        /(<DaisyButton[^>]*className="[^"]*"[^>]*?)\s*\/>\s*\n\s*(<Upload[^>]*>)\s*\n\s*([A-Za-z\s]+)\s*\n\s*(<\/DaisyButton>)/gm,
        '$1>\n              $2\n              $3\n            </DaisyButton>'
      );
      
      // Fix DaisyDialog structure
      content = content.replace(
        /(<DaisyDialog[^>]*>)\s*\/>\s*\n\s*(<DaisyDialogContent[^>]*>)\s*\/>\s*\n\s*(<DaisyDialogHeader[^>]*>)\s*\/>\s*\n\s*<\/DaisyTable>/gm,
        '$1\n          $2\n            $3\n              <DaisyDialogTitle>Import RCSA Data</DaisyDialogTitle>\n              <DaisyDialogDescription>\n                Upload your RCSA Excel file or paste data to automatically analyze and import risks and controls\n              </DaisyDialogDescription>\n            </DaisyDialogHeader>'
      );
      
      modified = true;
      appliedFixes.push('RCSA page specific fixes');
    }
    
    // Fix landing page specific issues
    if (filePath.includes('app/page.tsx')) {
      // Fix DaisyCard structure issues
      content = content.replace(
        /(<DaisyCard[^>]*>)\s*\/>\s*\n\s*(<DaisyCard[^>]*>)\s*\/>\s*\n\s*(<\/DaisyCard>)\s*\n\s*(<\/DaisyCard[^>]*>)/gm,
        '$1\n        $2\n        </DaisyCardBody>\n      </DaisyCard>'
      );
      
      // Fix DaisyBadge duplicate closing tags
      content = content.replace(
        /(<DaisyBadge[^>]*>)\s*\n\s*([^<\n]+)\s*\n\s*(<\/DaisyBadge>)\s*\n\s*(<\/DaisyBadge>)/gm,
        '$1\n  $2\n</DaisyBadge>'
      );
      
      modified = true;
      appliedFixes.push('Landing page specific fixes');
    }
    
    // Fix auth error page specific issues
    if (filePath.includes('auth/error/page.tsx')) {
      // Fix complex nested structure issues
      content = content.replace(
        /(<DaisyCard[^>]*>)\s*\/>\s*\n\s*(<DaisyCardHeader[^>]*>)\s*\/>\s*\n\s*(<\/DaisyCard>)/gm,
        '$1\n          $2\n            <div className="mx-auto rounded-full bg-red-100 dark:bg-red-900/30 p-3 w-fit">\n              <DaisyAlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />\n            </div>'
      );
      
      modified = true;
      appliedFixes.push('Auth error page specific fixes');
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${path.relative(process.cwd(), filePath)}`);
      console.log(`   Applied fixes: ${appliedFixes.join(', ')}`);
      
      // Clean up backup after successful fix
      fs.unlinkSync(backupPath);
      return true;
    } else {
      // Remove backup if no changes were made
      fs.unlinkSync(backupPath);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🔧 Starting specific JSX issue fixes...\n');
  
  let fixedFiles = 0;
  
  for (const file of filesToFix) {
    const fullPath = path.resolve(file);
    if (fixSpecificFile(fullPath)) {
      fixedFiles++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Files processed: ${filesToFix.length}`);
  console.log(`   Files fixed: ${fixedFiles}`);
  
  if (fixedFiles > 0) {
    console.log(`\n✅ Specific JSX fixes completed!`);
    console.log(`\n🔍 Next steps:`);
    console.log(`   1. Run 'npm run type-check' to verify fixes`);
    console.log(`   2. Review the changes manually`);
    console.log(`   3. Test the build process`);
  } else {
    console.log(`\n✨ No additional fixes were needed!`);
  }
}

main().catch(error => {
  console.error('\n❌ Script failed:', error);
  process.exit(1);
});