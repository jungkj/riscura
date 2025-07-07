#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of files that need cleanup
const filesToClean = [
  'src/app/api/test-scripts/[id]/route.ts',
  'src/app/api/test-scripts/[id]/execute/route.ts',
  'src/app/api/test-scripts/[id]/controls/route.ts',
  'src/app/api/reports/[id]/route.ts',
  'src/app/api/chat/channels/[channelId]/messages/route.ts',
  'src/app/api/compliance/assessments/[id]/gap-analysis/route.ts',
  'src/app/api/compliance/assessments/[id]/gaps/route.ts',
  'src/app/api/compliance/assessments/[id]/items/route.ts',
  'src/app/api/compliance/assessments/[id]/route.ts',
  'src/app/api/compliance/frameworks/[id]/route.ts',
  'src/app/api/compliance/frameworks/[id]/requirements/route.ts',
  'src/app/api/notifications/[id]/route.ts',
];

filesToClean.forEach(relativePath => {
  const filePath = path.join(process.cwd(), relativePath);
  
  if (fs.existsSync(filePath)) {
    console.log(`Cleaning: ${relativePath}`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove duplicate lines like "const { id } = params;"
    content = content.replace(/const\s+\{\s*id\s*\}\s*=\s*params;\s*\n/g, '');
    content = content.replace(/const\s+\{\s*channelId\s*\}\s*=\s*await\s+params;\s*\n(?=.*const\s+\{\s*channelId\s*\}\s*=\s*await\s+params;)/g, '');
    
    // Remove duplicate user checks
    content = content.replace(/const user = \(request as any\)\.user;\s*\n\s*if \(!user\) \{\s*\n\s*return ApiResponseFormatter\.authError\('User not authenticated'\);\s*\n\s*\}\s*\n\s*\n\s*const \{ channelId \} = await params;/g, 
      'const user = (request as any).user;\n      if (!user) {\n        return ApiResponseFormatter.authError(\'User not authenticated\');\n      }');
    
    // Fix duplicate closing braces
    content = content.replace(/\}\)\(req\);\s*\n\}\s*\n\s*\},\s*\n\s*\{\s*requireAuth:\s*true\s*\}\s*\n\s*\)\(req\);\s*\n\}/g, '  )(req);\n}');
    
    // Fix duplicate params extraction
    content = content.replace(/const\s+\{\s*id:\s*testScriptId\s*\}\s*=\s*params;/g, '');
    
    // Remove "No newline at end of file" comments
    content = content.replace(/^\s*\d*→?\s*No newline at end of file\s*$/gm, '');
    content = content.replace(/\n\s*No newline at end of file/g, '');
    
    // Remove line numbers
    content = content.replace(/^\s*\d+→/gm, '');
    
    // Fix any remaining duplicate variable declarations
    content = content.replace(/const user = \(request as any\)\.user;\s*\n\s*const user = \(request as any\)\.user;/g, 
      'const user = (request as any).user;');
    
    // Ensure file ends with a newline
    if (!content.endsWith('\n')) {
      content += '\n';
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`  ✓ Cleaned`);
  }
});

console.log('\nDone cleaning files!');