const fs = require('fs');
const path = require('path');

function fixApiResponseFormatterCalls(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Pattern 1: ApiResponseFormatter.success(data, "message")
  // Should be: ApiResponseFormatter.success(data)
  const successWithStringPattern = /ApiResponseFormatter\.success\(\s*([^,]+),\s*["']([^"']+)["']\s*\)/g;
  if (successWithStringPattern.test(content)) {
    content = content.replace(successWithStringPattern, (match, data, message) => {
      console.log(`Fixed success call with string message in ${filePath}`);
      modified = true;
      return `ApiResponseFormatter.success(${data.trim()})`;
    });
  }

  // Pattern 2: ApiResponseFormatter.success(data, "message", options, status)
  // Should be: ApiResponseFormatter.success(data, { status })
  const successWithMultipleArgsPattern = /ApiResponseFormatter\.success\(\s*([^,]+),\s*["']([^"']+)["']\s*,\s*({[^}]+})\s*,\s*(\d+)\s*\)/g;
  if (successWithMultipleArgsPattern.test(content)) {
    content = content.replace(successWithMultipleArgsPattern, (match, data, message, options, status) => {
      console.log(`Fixed success call with multiple args in ${filePath}`);
      modified = true;
      return `ApiResponseFormatter.success(${data.trim()}, { status: ${status} })`;
    });
  }

  // Pattern 3: ApiResponseFormatter.error with wrong argument order
  // Correct order: error(code, message, options)
  const errorPattern = /ApiResponseFormatter\.error\(\s*'([^']+)'\s*,\s*(\d+)\s*,\s*'([^']+)'\s*(?:,\s*([^)]+))?\s*\)/g;
  if (errorPattern.test(content)) {
    content = content.replace(errorPattern, (match, message, status, code, details) => {
      console.log(`Fixed error call argument order in ${filePath}`);
      modified = true;
      if (details) {
        return `ApiResponseFormatter.error('${code}', '${message}', { status: ${status}, details: ${details.trim()} })`;
      } else {
        return `ApiResponseFormatter.error('${code}', '${message}', { status: ${status} })`;
      }
    });
  }

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
        if (fixApiResponseFormatterCalls(filePath)) {
          totalFixed++;
        }
      }
    }
  }

  console.log('Scanning for ApiResponseFormatter issues...');
  walkDir(apiDir);
  console.log(`\nFixed ${totalFixed} files`);
}

findAndFixFiles();