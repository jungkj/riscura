#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of files with syntax errors that need fixing
const filesToFix = [
  'src/app/api/compliance/assessments/[id]/gap-analysis/route.ts',
  'src/app/api/compliance/assessments/[id]/gaps/route.ts',
  'src/app/api/compliance/assessments/[id]/items/route.ts',
  'src/app/api/compliance/assessments/[id]/route.ts',
  'src/app/api/compliance/frameworks/[id]/route.ts',
  'src/app/api/compliance/frameworks/[id]/requirements/route.ts',
  'src/app/api/notifications/[id]/route.ts',
];

filesToFix.forEach(relativePath => {
  const filePath = path.join(__dirname, relativePath);
  
  if (fs.existsSync(filePath)) {
    console.log(`Fixing syntax errors in: ${relativePath}`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix 1: Missing quotes around success messages
    content = content.replace(
      /return ApiResponseFormatter\.success\((Gap analysis completed successfully)\)/g,
      'return ApiResponseFormatter.success(analysis, "Gap analysis completed successfully")'
    );
    
    content = content.replace(
      /return ApiResponseFormatter\.success\((Requirements retrieved successfully)\)/g,
      'return ApiResponseFormatter.success(requirements, "Requirements retrieved successfully")'
    );
    
    content = content.replace(
      /return ApiResponseFormatter\.success\((Assessment retrieved successfully)\)/g,
      'return ApiResponseFormatter.success(assessment, "Assessment retrieved successfully")'
    );
    
    content = content.replace(
      /return ApiResponseFormatter\.success\((Framework retrieved successfully)\)/g,
      'return ApiResponseFormatter.success(framework, "Framework retrieved successfully")'
    );
    
    content = content.replace(
      /return ApiResponseFormatter\.success\((Notification retrieved successfully)\)/g,
      'return ApiResponseFormatter.success(notifications[0], "Notification retrieved successfully")'
    );
    
    content = content.replace(
      /return ApiResponseFormatter\.success\((Notification marked as read)\)/g,
      'return ApiResponseFormatter.success(notification, "Notification marked as read")'
    );
    
    content = content.replace(
      /return ApiResponseFormatter\.success\((Notification dismissed)\)/g,
      'return ApiResponseFormatter.success(notification, "Notification dismissed")'
    );
    
    // Fix 2: Bulk create requirements message
    content = content.replace(
      /return ApiResponseFormatter\.success\(\$\{count\} requirements created successfully\)/g,
      'return ApiResponseFormatter.success({ count }, `${count} requirements created successfully`)'
    );
    
    // Fix 3: Remove "No newline at end of file" lines
    content = content.replace(/^\s*\d+→\s*No newline at end of file\s*$/gm, '');
    
    // Fix 4: Fix broken lines and structure
    content = content.replace(/\s*},\s*\n\s*{ requireAuth: true }\s*\n\);\s*$/gm, (match) => {
      // Check if this is inside a proper structure
      const lines = content.split('\n');
      const matchLine = lines.findIndex(line => line.includes(match));
      
      // Look for the nearest POST/GET/PUT/DELETE/PATCH declaration
      let methodLine = -1;
      for (let i = matchLine; i >= 0; i--) {
        if (lines[i].includes('export const') && (
          lines[i].includes('GET') || 
          lines[i].includes('POST') || 
          lines[i].includes('PUT') || 
          lines[i].includes('DELETE') || 
          lines[i].includes('PATCH')
        )) {
          methodLine = i;
          break;
        }
      }
      
      if (methodLine >= 0) {
        return `
    });

    return ApiResponseFormatter.success(gap, 'Gap created successfully');
  },
  { requireAuth: true }
);`;
      }
      
      return match;
    });
    
    // Fix 5: Broken closing braces in gaps route
    content = content.replace(
      /const filters = \{\s*\.\.\.\(status && \{ status   \},/g,
      'const filters = {\n      ...(status && { status }),\n      ...(severity && { severity })\n    };\n\n    const gaps = await complianceService.getAssessmentGaps((await params).id, filters);\n\n    return ApiResponseFormatter.success(gaps, "Gaps retrieved successfully");'
    );
    
    // Fix 6: Fix broken POST method closures
    content = content.replace(
      /assessedBy: user\.id,\s*$/gm,
      'assessedBy: user.id\n    });\n\n    return ApiResponseFormatter.success(item, "Requirement assessed successfully");'
    );
    
    content = content.replace(
      /frameworkId: \(await params\)\.id,\s*$/gm,
      'frameworkId: (await params).id\n    });\n\n    return ApiResponseFormatter.success(requirement, "Requirement created successfully");'
    );
    
    content = content.replace(
      /targetDate: validatedData\.targetDate \? new Date\(validatedData\.targetDate\) : undefined,\s*$/gm,
      'targetDate: validatedData.targetDate ? new Date(validatedData.targetDate) : undefined\n    });\n\n    return ApiResponseFormatter.success(gap, "Gap created successfully");'
    );
    
    // Fix 7: Remove duplicate closing braces
    content = content.replace(/\n\s*\d+→\s*\},\s*\n\s*\d+→\s*{ requireAuth: true }\s*\n\s*\d+→\s*\);\s*\n\s*\d+→/g, '');
    
    // Clean up file - remove line numbers
    content = content.replace(/^\s*\d+→/gm, '');
    
    fs.writeFileSync(filePath, content);
    console.log(`  ✓ Fixed`);
  }
});

console.log('\nDone fixing syntax errors.');