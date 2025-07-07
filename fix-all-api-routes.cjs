#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all route.ts files in the API directory
const apiDir = path.join(__dirname, 'src/app/api');
const routeFiles = glob.sync('**/route.ts', { cwd: apiDir, absolute: true });

console.log(`Found ${routeFiles.length} route files to check`);

let filesFixed = 0;

routeFiles.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  let changed = false;

  // Check if this is a dynamic route (has [...] or [param] in path)
  const isDynamicRoute = filePath.includes('[') && filePath.includes(']');

  // Fix 1: Update getAuthenticatedUser calls that don't pass req
  if (content.includes('getAuthenticatedUser()')) {
    // Replace getAuthenticatedUser() with proper user access from req
    content = content.replace(
      /const user = await getAuthenticatedUser\(\);/g,
      'const user = (req as any).user;'
    );
    content = content.replace(
      /const user = getAuthenticatedUser\(\);/g,
      'const user = (req as any).user;'
    );
    changed = true;
  }

  // Fix 2: For dynamic routes, ensure params are typed as Promise and awaited
  if (isDynamicRoute) {
    // Extract the param name from the file path
    const paramMatch = filePath.match(/\[([^\]]+)\]/);
    if (paramMatch) {
      const paramName = paramMatch[1];
      
      // Fix export function pattern with wrong params type
      const exportFunctionRegex = new RegExp(
        `export\\s+(async\\s+)?function\\s+(GET|POST|PUT|DELETE|PATCH)\\s*\\([^)]*\\)\\s*{`,
        'g'
      );
      
      const matches = content.match(exportFunctionRegex);
      if (matches) {
        // Check if it's using the old pattern with nested withApiMiddleware
        if (content.includes('return withApiMiddleware(async (req') || 
            content.includes('return withApiMiddleware(async (request')) {
          
          // This file needs the full refactor
          console.log(`Fixing dynamic route pattern in: ${path.relative(process.cwd(), filePath)}`);
          
          // Replace the pattern for each HTTP method
          ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].forEach(method => {
            // Match the entire function including the withApiMiddleware call
            const methodRegex = new RegExp(
              `export\\s+async\\s+function\\s+${method}\\s*\\([^\\)]+\\)\\s*\\{[\\s\\S]*?return\\s+withApiMiddleware\\s*\\([\\s\\S]*?\\)\\s*\\(req\\);\\s*\\}`,
              'g'
            );
            
            content = content.replace(methodRegex, (match) => {
              // Extract the handler logic inside withApiMiddleware
              const handlerMatch = match.match(/withApiMiddleware\s*\(\s*async\s*\([^)]+\)\s*=>\s*\{([\s\S]*?)\}\s*,\s*(\{[^}]+\})\s*\)/);
              
              if (handlerMatch) {
                const handlerBody = handlerMatch[1];
                const options = handlerMatch[2];
                
                // Build the new function
                let newFunction = `export const ${method} = withApiMiddleware(\n`;
                newFunction += `  async (req: NextRequest, { params }: { params: Promise<{ ${paramName}: string }> }) => {\n`;
                
                // Fix the handler body
                let fixedBody = handlerBody;
                
                // Replace parameter access
                fixedBody = fixedBody.replace(/const\s+\{[^}]+\}\s*=\s*await\s+params;/g, 
                  `const { ${paramName} } = await params;`);
                
                // Fix user access
                fixedBody = fixedBody.replace(/const\s+user\s*=\s*\([^)]+\s+as\s+any\)\.user;/g,
                  'const user = (req as any).user;');
                fixedBody = fixedBody.replace(/const\s+user\s*=\s*await\s+getAuthenticatedUser\(\);/g,
                  'const user = (req as any).user;');
                
                // Replace request with req
                fixedBody = fixedBody.replace(/\brequest\b/g, 'req');
                
                newFunction += fixedBody;
                newFunction += `  },\n`;
                newFunction += `  ${options}\n`;
                newFunction += `);`;
                
                return newFunction;
              }
              
              return match;
            });
          });
          
          changed = true;
        } else {
          // Check if params type needs updating
          const paramsTypeRegex = new RegExp(
            `\\{\\s*params\\s*\\}\\s*:\\s*\\{\\s*params\\s*:\\s*(?!Promise)`,
            'g'
          );
          
          if (paramsTypeRegex.test(content)) {
            // Update params type to Promise
            content = content.replace(
              /\{\s*params\s*\}\s*:\s*\{\s*params\s*:\s*\{\s*\[key:\s*string\]\s*:\s*string\s*\}\s*\}/g,
              `{ params }: { params: Promise<{ ${paramName}: string }> }`
            );
            
            content = content.replace(
              /\{\s*params\s*\}\s*:\s*\{\s*params\s*:\s*\{\s*([^}]+)\s*\}\s*\}/g,
              `{ params }: { params: Promise<{ ${paramName}: string }> }`
            );
            
            changed = true;
          }
        }
      }
    }
  }

  // Fix 3: Ensure all routes use the correct export pattern
  // Replace export async function with export const for routes using withApiMiddleware
  const exportAsyncRegex = /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)\s*\(/g;
  const hasWithApiMiddleware = content.includes('withApiMiddleware');
  
  if (exportAsyncRegex.test(content) && hasWithApiMiddleware && !isDynamicRoute) {
    // For non-dynamic routes, use the simpler pattern
    ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].forEach(method => {
      const methodRegex = new RegExp(
        `export\\s+async\\s+function\\s+${method}\\s*\\(\\s*req:\\s*NextRequest\\s*\\)\\s*\\{([\\s\\S]*?)return\\s+withApiMiddleware\\(([\\s\\S]*?)\\)\\(req\\);\\s*\\}`,
        'g'
      );
      
      content = content.replace(methodRegex, (match, beforeReturn, middlewareContent) => {
        return `export const ${method} = withApiMiddleware(${middlewareContent});`;
      });
    });
    
    changed = true;
  }

  // Write the file if changes were made
  if (changed && content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${path.relative(process.cwd(), filePath)}`);
    filesFixed++;
  }
});

console.log(`\nFixed ${filesFixed} files`);