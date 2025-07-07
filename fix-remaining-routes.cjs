#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all route.ts files in the API directory
const apiDir = path.join(__dirname, 'src/app/api');
const routeFiles = glob.sync('**/route.ts', { cwd: apiDir, absolute: true });

console.log(`Found ${routeFiles.length} route files to check`);

let filesFixed = 0;

// List of files that need special attention
const dynamicRoutes = [
  'src/app/api/compliance/assessments/[id]/gap-analysis/route.ts',
  'src/app/api/compliance/assessments/[id]/gaps/route.ts',
  'src/app/api/compliance/assessments/[id]/items/route.ts',
  'src/app/api/compliance/assessments/[id]/route.ts',
  'src/app/api/compliance/frameworks/[id]/route.ts',
  'src/app/api/compliance/frameworks/[id]/requirements/route.ts',
  'src/app/api/notifications/[id]/route.ts',
  'src/app/api/risks/[id]/route.ts',
  'src/app/api/test-scripts/[id]/route.ts',
  'src/app/api/test-scripts/[id]/execute/route.ts',
  'src/app/api/test-scripts/[id]/controls/route.ts',
];

routeFiles.forEach(filePath => {
  const relativePath = path.relative(process.cwd(), filePath);
  
  // Check if this is one of our problematic dynamic routes
  if (dynamicRoutes.some(route => relativePath.includes(route))) {
    console.log(`Fixing dynamic route: ${relativePath}`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    // Extract param name from path
    const paramMatch = filePath.match(/\[([^\]]+)\]/);
    const paramName = paramMatch ? paramMatch[1] : 'id';
    
    // Fix pattern: export async function METHOD with nested withApiMiddleware
    ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].forEach(method => {
      // Look for the old pattern
      const oldPatternRegex = new RegExp(
        `export\\s+async\\s+function\\s+${method}\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?return\\s+withApiMiddleware\\s*\\([\\s\\S]*?\\)\\s*\\(req\\);\\s*\\}`,
        'g'
      );
      
      if (oldPatternRegex.test(content)) {
        console.log(`  Fixing ${method} method`);
        
        // Replace with new pattern
        content = content.replace(oldPatternRegex, (match) => {
          // Extract the handler body
          const handlerMatch = match.match(/withApiMiddleware\s*\(\s*async\s*\([^)]*\)\s*=>\s*\{([\s\S]*?)\}\s*\)/);
          
          if (handlerMatch) {
            const handlerBody = handlerMatch[1];
            
            // Extract options if present
            const optionsMatch = match.match(/\}\s*,\s*(\{[^}]+\})\s*\)/);
            const options = optionsMatch ? optionsMatch[1] : '{ requireAuth: true }';
            
            // Build new function
            let newFunction = `export const ${method} = withApiMiddleware(\n`;
            newFunction += `  async (req: NextRequest, { params }: { params: Promise<{ ${paramName}: string }> }) => {\n`;
            
            // Fix the handler body
            let fixedBody = handlerBody;
            
            // Remove resolvedParams line and use await params directly
            fixedBody = fixedBody.replace(/const\s+resolvedParams\s*=\s*await\s+params;/g, '');
            fixedBody = fixedBody.replace(/resolvedParams\.id/g, `(await params).${paramName}`);
            fixedBody = fixedBody.replace(/resolvedParams\[['"]id['"]\]/g, `(await params).${paramName}`);
            
            // Fix params access
            fixedBody = fixedBody.replace(/params\.id/g, `(await params).${paramName}`);
            fixedBody = fixedBody.replace(/params\[['"]id['"]\]/g, `(await params).${paramName}`);
            
            // Ensure we have the id extracted
            if (!fixedBody.includes(`await params`)) {
              fixedBody = `    const { ${paramName} } = await params;\n` + fixedBody;
            }
            
            newFunction += fixedBody;
            newFunction += `  },\n`;
            newFunction += `  ${options}\n`;
            newFunction += `);`;
            
            return newFunction;
          }
          
          return match;
        });
        
        changed = true;
      }
    });
    
    // Fix ApiResponseFormatter calls that have wrong signatures
    content = content.replace(
      /ApiResponseFormatter\.success\s*\([^,]+,\s*['"`]([^'"`]+)['"`]\s*\)/g,
      'ApiResponseFormatter.success($1)'
    );
    
    content = content.replace(
      /ApiResponseFormatter\.error\s*\(([^,]+),\s*(\d+)\s*\)/g,
      'ApiResponseFormatter.error($1, { status: $2 })'
    );
    
    if (changed) {
      fs.writeFileSync(filePath, content);
      console.log(`  ✓ Fixed`);
      filesFixed++;
    }
  }
});

// Now fix the remaining issues with reports/[id]/route.ts
const reportsRoute = path.join(apiDir, 'reports/[id]/route.ts');
if (fs.existsSync(reportsRoute)) {
  console.log('Fixing reports/[id]/route.ts params access...');
  let content = fs.readFileSync(reportsRoute, 'utf8');
  
  // Fix params access in DELETE and POST methods
  content = content.replace(/await ReportService\.deleteReport\(params\.id,/g, 
    'await ReportService.deleteReport((await params).id,');
    
  content = content.replace(/await ReportService\.generateReport\(\s*params\.id,/g,
    'await ReportService.generateReport((await params).id,');
  
  fs.writeFileSync(reportsRoute, content);
  console.log('  ✓ Fixed params access');
}

console.log(`\nFixed ${filesFixed} files`);