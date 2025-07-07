#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all route.ts files in the API directory
const apiDir = path.join(__dirname, 'src/app/api');
const routeFiles = glob.sync('**/route.ts', { cwd: apiDir, absolute: true });

console.log(`Found ${routeFiles.length} route files to check`);

let filesFixed = 0;

// Dynamic routes that need fixing
const dynamicRoutes = [];

routeFiles.forEach(filePath => {
  const relativePath = path.relative(process.cwd(), filePath);
  
  // Check if this is a dynamic route
  if (filePath.includes('[') && filePath.includes(']')) {
    dynamicRoutes.push(relativePath);
  }
});

console.log(`Found ${dynamicRoutes.length} dynamic routes to fix`);

dynamicRoutes.forEach(relativePath => {
  const filePath = path.join(process.cwd(), relativePath);
  console.log(`\nFixing: ${relativePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // Extract param name from path
  const paramMatch = filePath.match(/\[([^\]]+)\]/);
  const paramName = paramMatch ? paramMatch[1] : 'id';
  
  // Fix each HTTP method
  ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].forEach(method => {
    // Look for the method export
    const methodRegex = new RegExp(
      `export\\s+(?:const|async function)\\s+${method}[\\s\\S]*?(?:^\\);$|^}$)`,
      'gm'
    );
    
    const methodMatch = content.match(methodRegex);
    if (methodMatch) {
      console.log(`  Fixing ${method} method`);
      
      // Replace with the correct pattern
      const newPattern = `export async function ${method}(
  req: NextRequest,
  { params }: { params: Promise<{ ${paramName}: string }> }
) {
  return withApiMiddleware(
    async (request: NextRequest) => {
      const { ${paramName} } = await params;
      const user = (request as any).user;
      
      // Original handler logic will go here
    },
    { requireAuth: true }
  )(req);
}`;
      
      // Extract the existing handler logic
      const handlerBodyMatch = methodMatch[0].match(/const user = \(req as any\)\.user;[\s\S]*?(?=\s*},\s*\{\s*requireAuth|$)/);
      
      if (handlerBodyMatch) {
        let handlerBody = handlerBodyMatch[0];
        
        // Fix references to params
        handlerBody = handlerBody.replace(/\(await params\)\.(id|[a-zA-Z]+)/g, paramName);
        handlerBody = handlerBody.replace(/resolvedParams\.(id|[a-zA-Z]+)/g, paramName);
        handlerBody = handlerBody.replace(/params\.(id|[a-zA-Z]+)/g, paramName);
        
        // Replace req with request
        handlerBody = handlerBody.replace(/\breq\./g, 'request.');
        handlerBody = handlerBody.replace(/\(req as any\)/g, '(request as any)');
        
        // Build the complete new method
        const completeMethod = `export async function ${method}(
  req: NextRequest,
  { params }: { params: Promise<{ ${paramName}: string }> }
) {
  return withApiMiddleware(
    async (request: NextRequest) => {
      const { ${paramName} } = await params;
      ${handlerBody}
    },
    { requireAuth: true }
  )(req);
}`;
        
        // Replace the old method with the new one
        content = content.replace(methodMatch[0], completeMethod);
        changed = true;
      }
    }
  });
  
  if (changed) {
    // Clean up any remaining issues
    content = content.replace(/\n\s*No newline at end of file/g, '');
    content = content.replace(/^\d+→/gm, '');
    
    fs.writeFileSync(filePath, content);
    console.log(`  ✓ Fixed and saved`);
    filesFixed++;
  }
});

console.log(`\nFixed ${filesFixed} files`);

// Now let's manually fix some specific problematic files
const specificFixes = [
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
  'src/app/api/reports/[id]/route.ts',
  'src/app/api/reports/[id]/download/route.ts',
];

console.log('\n\nApplying specific fixes to known problematic files...');

// Fix gap-analysis route
const gapAnalysisPath = path.join(process.cwd(), 'src/app/api/compliance/assessments/[id]/gap-analysis/route.ts');
if (fs.existsSync(gapAnalysisPath)) {
  console.log('Fixing gap-analysis route...');
  const content = `import { NextRequest } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { complianceService } from '@/services/ComplianceService';
import { ApiResponseFormatter } from '@/lib/api/response-formatter';

// GET /api/compliance/assessments/[id]/gap-analysis - Perform gap analysis
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiMiddleware(
    async (request: NextRequest) => {
      const { id } = await params;
      const user = (request as any).user;
      if (!user) {
        return ApiResponseFormatter.authError('User not authenticated');
      }

      try {
        const analysis = await complianceService.performGapAnalysis(id);
        return ApiResponseFormatter.success(analysis, "Gap analysis completed successfully");
      } catch (error) {
        console.error('Gap analysis error:', error);
        if (error instanceof Error) {
          return ApiResponseFormatter.error(error.message, { status: 500 });
        }
        return ApiResponseFormatter.error('Failed to perform gap analysis', { status: 500 });
      }
    },
    { requireAuth: true }
  )(req);
}`;
  
  fs.writeFileSync(gapAnalysisPath, content);
  console.log('  ✓ Fixed gap-analysis route');
}

console.log('\nDone!');