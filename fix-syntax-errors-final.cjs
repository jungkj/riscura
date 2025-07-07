const fs = require('fs');
const path = require('path');

function fixSyntaxErrors(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix the pattern where formatValidationErrors is on a new line without proper closing
  // Pattern: { status: 400, details: formatValidationErrors(validationResult.error })
  //          );
  // Should be: { status: 400, details: formatValidationErrors(validationResult.error) });
  const brokenErrorPattern = /(\{ status: \d+, details: formatValidationErrors\([^)]+\) \})\s*\n\s*\);/g;
  if (brokenErrorPattern.test(content)) {
    content = content.replace(brokenErrorPattern, (match, errorCall) => {
      console.log(`Fixed broken error call syntax in ${filePath}`);
      modified = true;
      return `${errorCall});`;
    });
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }

  return modified;
}

function findAndFixFiles() {
  const files = [
    'src/app/api/test-scripts/[id]/controls/route.ts',
    'src/app/api/test-scripts/[id]/execute/route.ts',
    'src/app/api/test-scripts/[id]/route.ts',
    'src/app/api/test-scripts/generate/route.ts'
  ];
  
  let totalFixed = 0;

  console.log('Fixing syntax errors in specific files...');
  
  for (const file of files) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      if (fixSyntaxErrors(filePath)) {
        totalFixed++;
      }
    }
  }

  console.log(`\nFixed ${totalFixed} files`);
}

findAndFixFiles();