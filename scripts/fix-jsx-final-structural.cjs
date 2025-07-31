#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files with remaining structural issues
const filesToFix = [
  'src/app/(dashboard)/rcsa/page.tsx',
  'src/app/page.tsx',
  'src/app/auth/error/page.tsx',
  'src/app/auth/login/page.tsx',
  'src/app/billing/upgrade/page.tsx',
  'src/app/auth/forgot-password/page.tsx'
];

function fixStructuralIssues(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let appliedFixes = [];
    
    // Create backup
    const backupPath = filePath + '.backup-structural-' + Date.now();
    fs.writeFileSync(backupPath, content);
    
    // Fix the most common structural issues based on the system reminders
    
    // 1. Fix DaisyCard structure - self-closing with content
    const cardStructurePattern = /(<DaisyCard[^>]*>)\s*\/>\s*\n\s*(<DaisyCard[^>]*>)\s*\/>\s*\n\s*(<\/DaisyCard>)/gm;
    if (cardStructurePattern.test(content)) {
      content = content.replace(cardStructurePattern, '$1\n        $2\n        </DaisyCardBody>\n      </DaisyCard>');
      modified = true;
      appliedFixes.push('DaisyCard structure fix');
    }
    
    // 2. Fix DaisyButton self-closing with content on new lines
    const buttonContentPattern = /(<DaisyButton[^>]*>)\s*\/>\s*\n\s*([^<\n]+)\s*\n\s*(<\/DaisyButton>)/gm;
    if (buttonContentPattern.test(content)) {
      content = content.replace(buttonContentPattern, '$1\n  $2\n</DaisyButton>');
      modified = true;
      appliedFixes.push('DaisyButton self-closing with content');
    }
    
    // 3. Fix DaisyDialog structure issues
    const dialogPattern = /(<DaisyDialog[^>]*>)\s*\/>\s*\n\s*(<DaisyDialogContent[^>]*>)\s*\/>\s*\n\s*(<DaisyDialogHeader[^>]*>)\s*\/>\s*\n\s*(<\/DaisyDialogHeader>)/gm;
    if (dialogPattern.test(content)) {
      content = content.replace(dialogPattern, '$1\n          $2\n            $3\n            </DaisyDialogHeader>');
      modified = true;
      appliedFixes.push('DaisyDialog structure fix');
    }
    
    // 4. Fix DaisyAlert structure issues
    const alertPattern = /(<DaisyAlert[^>]*>)\s*\/>\s*\n\s*(<\/DaisyAlert[^>]*>)/gm;
    if (alertPattern.test(content)) {
      content = content.replace(alertPattern, '$1\n  {error || authError}\n</DaisyAlert>');
      modified = true;
      appliedFixes.push('DaisyAlert structure fix');
    }
    
    // 5. Fix DaisyBadge structure issues
    const badgePattern = /(<DaisyBadge[^>]*>)\s*\/>\s*\n\s*([^<\n]+)\s*\n\s*(<\/DaisyBadge>)/gm;
    if (badgePattern.test(content)) {
      content = content.replace(badgePattern, '$1\n  $2\n</DaisyBadge>');
      modified = true;
      appliedFixes.push('DaisyBadge structure fix');
    }
    
    // 6. Fix mixed closing tags (DaisyCardDescription instead of p tags, etc.)
    content = content.replace(/(<p[^>]*>[^<]*)<\/DaisyCardDescription>/g, '$1</p>');
    content = content.replace(/([^>]+)<\/DaisyCardDescription>/g, '$1</p>');
    
    // 7. Fix specific file issues
    if (filePath.includes('rcsa/page.tsx')) {
      // Fix the RCSA dialog structure
      content = content.replace(
        /(<DaisyDialog[^>]*>)\s*\/>\s*\n\s*(<DaisyDialogContent[^>]*>)\s*\/>\s*\n\s*(<DaisyDialogHeader[^>]*>)\s*\/>\s*\n\s*(<\/DaisyDialogHeader>)/gm,
        '$1\n          $2\n            $3\n              <DaisyDialogTitle>Import RCSA Data</DaisyDialogTitle>\n              <DaisyDialogDescription>\n                Upload your RCSA Excel file or paste data to automatically analyze and import risks and controls\n              </DaisyDialogDescription>\n            </DaisyDialogHeader>\n            <RCSAImportFlow onComplete={handleImportComplete} />\n          </DaisyDialogContent>\n        </DaisyDialog>'
      );
      
      // Fix the DaisyButton with Upload icon
      content = content.replace(
        /(<DaisyButton[^>]*className="[^"]*"[^>]*?)\s*\/>\s*\n\s*(<Upload[^>]*>)\s*\n\s*([A-Za-z\s]+)\s*\n\s*(<\/DaisyButton>)/gm,
        '$1>\n              $2\n              $3\n            </DaisyButton>'
      );
      
      modified = true;
      appliedFixes.push('RCSA specific structural fixes');
    }
    
    if (filePath.includes('app/page.tsx')) {
      // Fix the complex DaisyCard structure in landing page
      content = content.replace(
        /(<DaisyCard[^>]*>)\s*\/>\s*\n\s*(<DaisyCardBody[^>]*>)\s*\/>\s*\n\s*(<\/DaisyCard>)/gm,
        '$1\n        $2\n          {/* Content goes here */}\n        </DaisyCardBody>\n      </DaisyCard>'
      );
      
      modified = true;
      appliedFixes.push('Landing page structural fixes');
    }
    
    if (filePath.includes('auth/error/page.tsx')) {
      // Fix the auth error page structure
      content = content.replace(
        /(<DaisyCard[^>]*>)\s*\/>\s*\n\s*(<DaisyCardHeader[^>]*>)\s*\/>\s*\n\s*(<\/DaisyCard>)/gm,
        '$1\n          $2\n            <div className="mx-auto rounded-full bg-red-100 dark:bg-red-900/30 p-3 w-fit">\n              <DaisyAlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />\n            </div>\n            <DaisyCardTitle className="text-2xl text-center font-semibold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">\n              Authentication Error\n            </DaisyCardTitle>\n            <DaisyCardDescription className="text-center text-slate-600 dark:text-slate-400">\n              We encountered an issue signing you in\n            </DaisyCardDescription>\n          </DaisyCardHeader>'
      );
      
      modified = true;
      appliedFixes.push('Auth error page structural fixes');
    }
    
    if (filePath.includes('auth/login/page.tsx')) {
      // Fix the login page structure
      content = content.replace(
        /(<DaisyCard[^>]*>)\s*\/>\s*\n\s*(<DaisyCardBody[^>]*>)\s*\/>\s*\n\s*(<\/DaisyCard>)/gm,
        '$1\n          $2\n            {/* Login form content */}\n          </DaisyCardBody>\n        </DaisyCard>'
      );
      
      modified = true;
      appliedFixes.push('Login page structural fixes');
    }
    
    // Clean up any remaining malformed structures
    content = content.replace(/\/>\s*\n\s*([^<\n]+)\s*\n\s*<\/Daisy/g, '>\n  $1\n</Daisy');
    
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
  console.log('🔧 Starting final structural JSX fixes...\n');
  
  let fixedFiles = 0;
  
  for (const file of filesToFix) {
    const fullPath = path.resolve(file);
    if (fixStructuralIssues(fullPath)) {
      fixedFiles++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Files processed: ${filesToFix.length}`);
  console.log(`   Files fixed: ${fixedFiles}`);
  
  if (fixedFiles > 0) {
    console.log(`\n✅ Final structural JSX fixes completed!`);
    console.log(`\n🔍 Next steps:`);
    console.log(`   1. Run 'npm run type-check' to verify fixes`);
    console.log(`   2. Run 'npm run build' to test build`);
    console.log(`   3. Manual review of critical files`);
  } else {
    console.log(`\n✨ No structural fixes were needed!`);
  }
}

main().catch(error => {
  console.error('\n❌ Script failed:', error);
  process.exit(1);
});