#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const files = [
  'src/app/api/compliance/assessments/[id]/gap-analysis/route.ts',
  'src/app/api/compliance/assessments/[id]/gaps/route.ts',
  'src/app/api/compliance/assessments/[id]/items/route.ts',
  'src/app/api/compliance/assessments/[id]/route.ts',
  'src/app/api/compliance/frameworks/[id]/requirements/route.ts',
  'src/app/api/compliance/frameworks/[id]/route.ts',
  'src/app/api/notifications/[id]/route.ts',
  'src/app/api/placeholder/[...size]/route.ts',
  'src/app/api/risks/[id]/route.ts'
];

files.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    
    // Update interface RouteParams to use Promise
    content = content.replace(
      /interface RouteParams {\s*params: {([^}]+)}\s*}/g,
      'interface RouteParams {\n  params: Promise<{$1}>\n}'
    );
    
    // Update function signatures that use RouteParams
    content = content.replace(
      /export async function (\w+)\(\s*req: NextRequest,\s*{ params }: RouteParams\s*\)/g,
      'export async function $1(\n  req: NextRequest,\n  { params }: RouteParams\n)'
    );
    
    // Add await params in the middleware functions
    content = content.replace(
      /return withApiMiddleware\(async \(req: NextRequest\) => {/g,
      (match) => {
        // Check if there's already an await params line
        const nextLines = content.substring(content.indexOf(match) + match.length, content.indexOf(match) + match.length + 100);
        if (!nextLines.includes('await params')) {
          return match + '\n    const resolvedParams = await params;';
        }
        return match;
      }
    );
    
    // Replace params.id with resolvedParams.id
    content = content.replace(/params\.(\w+)/g, (match, prop) => {
      // Only replace if we're inside a withApiMiddleware block
      const index = content.lastIndexOf(match);
      const beforeMatch = content.substring(0, index);
      if (beforeMatch.includes('const resolvedParams = await params')) {
        return `resolvedParams.${prop}`;
      }
      return match;
    });
    
    fs.writeFileSync(file, content);
    console.log(`✓ Fixed ${file}`);
  } catch (error) {
    console.error(`✗ Error fixing ${file}:`, error.message);
  }
});

console.log('\nDone!');