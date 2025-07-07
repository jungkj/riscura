const fs = require('fs');
const path = require('path');

function fixApiResponseErrorCalls(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Pattern 1: ApiResponseFormatter.error(message, { status: XXX })
  // Should be: ApiResponseFormatter.error('ERROR_CODE', message, { status: XXX })
  const errorWithMessageOnlyPattern = /ApiResponseFormatter\.error\((['"`])((?:(?!\1).)*)\1,\s*\{\s*status:\s*(\d+)\s*\}\)/g;
  
  content = content.replace(errorWithMessageOnlyPattern, (match, quote, message, status) => {
    console.log(`Fixed error call in ${filePath}: "${message}"`);
    modified = true;
    
    // Determine appropriate error code based on status
    let errorCode = 'SERVER_ERROR';
    if (status === '400') errorCode = 'BAD_REQUEST';
    else if (status === '401') errorCode = 'AUTH_ERROR';
    else if (status === '403') errorCode = 'FORBIDDEN';
    else if (status === '404') errorCode = 'NOT_FOUND';
    else if (status === '409') errorCode = 'CONFLICT';
    else if (status === '422') errorCode = 'UNPROCESSABLE_ENTITY';
    else if (status === '500') errorCode = 'SERVER_ERROR';
    
    return `ApiResponseFormatter.error('${errorCode}', ${quote}${message}${quote}, { status: ${status} })`;
  });

  // Pattern 2: ApiResponseFormatter.error(error.message, { status: XXX })
  // Should be: ApiResponseFormatter.error('ERROR_CODE', error.message, { status: XXX })
  const errorWithVariablePattern = /ApiResponseFormatter\.error\(([^',"`]+\.message),\s*\{\s*status:\s*(\d+)\s*\}\)/g;
  
  content = content.replace(errorWithVariablePattern, (match, errorMessage, status) => {
    console.log(`Fixed error call with variable in ${filePath}`);
    modified = true;
    
    let errorCode = 'SERVER_ERROR';
    if (status === '500') errorCode = 'SERVER_ERROR';
    
    return `ApiResponseFormatter.error('${errorCode}', ${errorMessage}, { status: ${status} })`;
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }

  return modified;
}

function findAndFixFiles() {
  const apiDir = path.join(__dirname, 'src', 'app', 'api');
  let totalFixed = 0;

  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        if (fixApiResponseErrorCalls(filePath)) {
          totalFixed++;
        }
      }
    }
  }

  console.log('Scanning for ApiResponseFormatter.error issues...');
  walkDir(apiDir);
  console.log(`\nFixed ${totalFixed} files`);
}

findAndFixFiles();