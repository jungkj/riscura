#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Comprehensive JSX fix patterns
const fixPatterns = [
  // Fix unclosed DaisyUI components
  {
    pattern: /<(Daisy[A-Z][a-zA-Z]*)((?:\s+[a-zA-Z-]+(?:=(?:"[^"]*"|'[^']*'|\{[^}]*\}))?)*)\s*>\s*$/gm,
    replacement: '<$1$2 />'
  },
  // Fix mismatched closing tags
  {
    pattern: /<(Daisy[A-Z][a-zA-Z]*)([^>]*)>\s*<\/((?!$1)[A-Z][a-zA-Z]*)>/g,
    replacement: '<$1$2></$1>'
  },
  // Fix DaisyCardHeader without closing tag before DaisyCardContent
  {
    pattern: /(<DaisyCardTitle[^>]*>[\s\S]*?<\/DaisyCardTitle>)\s*\n\s*(<DaisyCardContent)/g,
    replacement: '$1\n        </DaisyCardHeader>\n        $2'
  },
  // Fix DaisyCardDescription without closing header
  {
    pattern: /(<DaisyCardDescription[^>]*>[\s\S]*?<\/DaisyCardDescription>)\s*\n\s*(<DaisyCardContent)/g,
    replacement: '$1\n        </DaisyCardHeader>\n        $2'
  },
  // Fix SelectTrigger/SelectContent mismatches
  {
    pattern: /<DaisySelectTrigger([^>]*)>([\s\S]*?)<\/SelectTrigger>/g,
    replacement: '<DaisySelectTrigger$1>$2</DaisySelectTrigger>'
  },
  {
    pattern: /<DaisySelectContent([^>]*)>([\s\S]*?)<\/SelectContent>/g,
    replacement: '<DaisySelectContent$1>$2</DaisySelectContent>'
  },
  {
    pattern: /<DaisySelectItem([^>]*)>([\s\S]*?)<\/SelectItem>/g,
    replacement: '<DaisySelectItem$1>$2</DaisySelectItem>'
  },
  // Fix DaisyCardContent/DaisyCardBody mismatches
  {
    pattern: /<DaisyCardContent([^>]*)>([\s\S]*?)<\/DaisyCardBody>/g,
    replacement: '<DaisyCardContent$1>$2</DaisyCardContent>'
  },
  // Fix DaisyAlertDescription without closing tag
  {
    pattern: /(<DaisyAlertDescription[^>]*>[\s\S]*?)\n\s*<\/DaisyAlert>/g,
    replacement: '$1\n                </DaisyAlertDescription>\n              </DaisyAlert>'
  }
];

async function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    fixPatterns.forEach(({ pattern, replacement }) => {
      const newContent = content.replace(pattern, replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🔧 Starting comprehensive JSX fix...\n');
  
  const patterns = [
    'src/**/*.tsx',
    'src/**/*.jsx'
  ];
  
  let totalFiles = 0;
  let fixedFiles = 0;
  
  for (const pattern of patterns) {
    const files = glob.sync(pattern, { nodir: true });
    totalFiles += files.length;
    
    for (const file of files) {
      if (await fixFile(file)) {
        fixedFiles++;
      }
    }
  }
  
  console.log(`\n✅ Complete! Fixed ${fixedFiles} of ${totalFiles} files.`);
}

main().catch(console.error);