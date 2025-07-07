#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all dynamic route files
const findDynamicRoutes = () => {
  const output = execSync('find src/app/api -name "route.ts" -path "*\\[*\\]*"', { encoding: 'utf8' });
  return output.trim().split('\n').filter(Boolean);
};

// Check if file needs fixing
const needsFix = (content) => {
  // Pattern 1: export const METHOD = withApiMiddleware(async (req, { params }) => {
  if (/export const \w+ = withApiMiddleware\(async \(req.*,\s*{\s*params\s*}\)/.test(content)) {
    return true;
  }
  
  // Pattern 2: export const METHOD = withAPI(handler, { ... }) where handler has params
  if (/export const \w+ = withAPI\(/.test(content) && /async \(req.*,\s*{\s*params\s*}\)/.test(content)) {
    return true;
  }
  
  // Pattern 3: export function METHOD(req, { params }) { return withApiMiddleware(
  if (/export async function \w+\(.*{\s*params\s*}.*\)\s*{\s*return withApiMiddleware/.test(content)) {
    // Check if it's already wrapped correctly
    if (!/withApiMiddleware\(async \(req.*\)\s*=>\s*{[\s\S]*params\./.test(content)) {
      return true;
    }
  }
  
  return false;
};

// Fix the file content
const fixFile = (content, filePath) => {
  console.log(`Fixing ${filePath}...`);
  
  // Pattern 1: export const METHOD = withApiMiddleware(async (req, { params }) => {
  content = content.replace(
    /export const (\w+) = withApiMiddleware\(async \((req[^,]*),\s*{\s*params\s*}:\s*RouteParams\)\s*=>\s*{/g,
    (match, method, reqParam) => {
      return `export async function ${method}(\n  ${reqParam},\n  { params }: RouteParams\n) {\n  return withApiMiddleware(async (${reqParam}) => {`;
    }
  );
  
  // Pattern 2: Fix withAPI patterns
  content = content.replace(
    /export const (\w+) = withAPI\(\s*async \((req[^,]*),\s*{\s*params\s*}:\s*([^)]+)\)\s*=>\s*{([\s\S]*?)},\s*(\{[^}]+\})\s*\);/g,
    (match, method, reqParam, paramsType, handlerBody, config) => {
      return `export async function ${method}(\n  ${reqParam},\n  { params }: ${paramsType}\n) {\n  return withAPI(\n    async (${reqParam}) => {${handlerBody}},\n    ${config}\n  )(req);\n}`;
    }
  );
  
  // Pattern 3: Fix function declarations that return withApiMiddleware
  content = content.replace(
    /export async function (\w+)\(\s*(req[^,]*),\s*{\s*params\s*}:\s*([^)]+)\)\s*{\s*return withApiMiddleware\(async \((req[^)]*)\)\s*=>\s*{/g,
    (match, method, reqParam1, paramsType, reqParam2) => {
      return `export async function ${method}(\n  ${reqParam1},\n  { params }: ${paramsType}\n) {\n  return withApiMiddleware(async (${reqParam2}) => {`;
    }
  );
  
  // Close the functions properly
  // Count opening and closing braces to ensure proper closure
  let braceCount = 0;
  let inString = false;
  let escapeNext = false;
  let quoteChar = null;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    if ((char === '"' || char === "'" || char === '`') && !inString) {
      inString = true;
      quoteChar = char;
    } else if (char === quoteChar && inString) {
      inString = false;
      quoteChar = null;
    }
    
    if (!inString) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
    }
  }
  
  // If we have unclosed braces, we need to add the closing
  if (braceCount > 0) {
    content = content.replace(/}\s*\)\s*;?\s*$/m, '})(req);\n}');
  }
  
  return content;
};

// Main execution
const main = () => {
  const files = findDynamicRoutes();
  console.log(`Found ${files.length} dynamic route files`);
  
  let fixedCount = 0;
  
  files.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      if (needsFix(content)) {
        const fixed = fixFile(content, filePath);
        fs.writeFileSync(filePath, fixed);
        fixedCount++;
        console.log(`✓ Fixed ${filePath}`);
      } else {
        console.log(`- Skipped ${filePath} (already correct or different pattern)`);
      }
    } catch (error) {
      console.error(`✗ Error fixing ${filePath}:`, error.message);
    }
  });
  
  console.log(`\nFixed ${fixedCount} files`);
};

main();