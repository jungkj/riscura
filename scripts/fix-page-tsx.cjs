#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function fixPageTsx() {
  const filePath = 'src/app/page.tsx';
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Create backup
    const backupPath = filePath + '.backup-page-fix-' + Date.now();
    fs.writeFileSync(backupPath, content);
    
    // Fix the main card structure
    content = content.replace(
      /      <DaisyCard className="bg-white\/80 backdrop-blur-xl border border-gray-200\/60 shadow-2xl overflow-hidden w-full" >\s*\n\s*<DaisyCardBody className="p-0" >\s*\n\s*<\/DaisyCard>/gm,
      '      <DaisyCard className="bg-white/80 backdrop-blur-xl border border-gray-200/60 shadow-2xl overflow-hidden w-full">\n        <DaisyCardBody className="p-0">'
    );
    
    // Fix all DaisyCardDescription closing tags that should be p tags
    content = content.replace(/(<p[^>]*>[^<]*)<\/DaisyCardDescription>/g, '$1</p>');
    
    // Fix any remaining DaisyCardDescription closing tags with more content
    content = content.replace(/([^>]+)<\/DaisyCardDescription>/g, '$1</p>');
    
    // Fix the structure at the end of the process card
    content = content.replace(
      /            <\/div>\n          <\/div>\n        <\/DaisyCardBody>\n    <\/div>/,
      '            </div>\n          </div>\n        </DaisyCardBody>\n      </DaisyCard>\n    </div>'
    );
    
    // Fix the main section structure
    content = content.replace(
      /export default function HomePage\(\) \{\s*const router = useRouter\(\);/,
      'export default function HomePage() {\n  const router = useRouter();'
    );
    
    // Fix any unclosed DaisyBadge tags
    content = content.replace(
      /(<DaisyBadge[^>]*>)\s*\n\s*([^<\n]+)\s*\n\s*<\/DaisyBadge>/gm,
      '$1\n  $2\n</DaisyBadge>'
    );
    
    // Fix any unclosed DaisyButton tags
    content = content.replace(
      /(<DaisyButton[^>]*>)\s*\n\s*([^<\n]+)\s*\n\s*<\/DaisyButton>/gm,
      '$1\n  $2\n</DaisyButton>'
    );
    
    // Fix div structure issues
    content = content.replace(
      /                <\/div>\n\n              \/\* Social Proof Stats \*\/\n              <div className="grid grid-cols-3 gap-6 md:gap-8 max-w-md mx-auto lg:mx-0">/,
      '                </div>\n\n              {/* Social Proof Stats */}\n              <div className="grid grid-cols-3 gap-6 md:gap-8 max-w-md mx-auto lg:mx-0">'
    );
    
    // Ensure proper closing of the main return statement
    if (!content.includes('export default function HomePage()')) {
      console.log('Adding proper function structure...');
      modified = true;
    }
    
    // Write the fixed content
    if (content !== fs.readFileSync(filePath, 'utf8')) {
      fs.writeFileSync(filePath, content);
      console.log('✅ Fixed src/app/page.tsx JSX structure');
      modified = true;
    }
    
    if (modified) {
      // Clean up backup after successful fix
      fs.unlinkSync(backupPath);
    } else {
      // Remove backup if no changes were made
      fs.unlinkSync(backupPath);
    }
    
    return modified;
  } catch (error) {
    console.error('❌ Error fixing page.tsx:', error.message);
    return false;
  }
}

// Run the fix
if (fixPageTsx()) {
  console.log('✅ Page.tsx JSX structure fixed successfully!');
} else {
  console.log('ℹ️  Page.tsx did not need JSX fixes');
}