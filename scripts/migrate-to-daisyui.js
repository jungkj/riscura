#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Component mapping
const componentMapping = {
  // Button imports
  "import { Button } from '@/components/ui/button'": "import { DaisyButton } from '@/components/ui/DaisyButton'",
  "import { Button } from \"@/components/ui/button\"": "import { DaisyButton } from '@/components/ui/DaisyButton'",
  
  // Card imports
  "import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'": "import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard'",
  "import { Card, CardContent } from '@/components/ui/card'": "import { DaisyCard, DaisyCardBody } from '@/components/ui/DaisyCard'",
  "import { Card } from '@/components/ui/card'": "import { DaisyCard } from '@/components/ui/DaisyCard'",
  
  // Input imports
  "import { Input } from '@/components/ui/input'": "import { DaisyInput } from '@/components/ui/DaisyInput'",
  "import { Input } from \"@/components/ui/input\"": "import { DaisyInput } from '@/components/ui/DaisyInput'",
  
  // Badge imports
  "import { Badge } from '@/components/ui/badge'": "import { DaisyBadge } from '@/components/ui/DaisyBadge'",
  "import { Badge } from \"@/components/ui/badge\"": "import { DaisyBadge } from '@/components/ui/DaisyBadge'",
  
  // Alert imports
  "import { Alert, AlertDescription } from '@/components/ui/alert'": "import { DaisyAlert } from '@/components/ui/DaisyAlert'",
  "import { Alert } from '@/components/ui/alert'": "import { DaisyAlert } from '@/components/ui/DaisyAlert'",
  
  // Progress imports
  "import { Progress } from '@/components/ui/progress'": "import { DaisyProgress } from '@/components/ui/DaisyProgress'",
  
  // Select imports
  "import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'": "import { DaisySelect } from '@/components/ui/DaisySelect'",
  "import { Select } from '@/components/ui/select'": "import { DaisySelect } from '@/components/ui/DaisySelect'",
  
  // Checkbox imports
  "import { Checkbox } from '@/components/ui/checkbox'": "import { DaisyCheckbox } from '@/components/ui/DaisyCheckbox'",
  
  // Dialog imports
  "import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'": "import { DaisyDialog, DaisyDialogContent, DaisyDialogHeader, DaisyDialogTitle, DaisyDialogDescription } from '@/components/ui/DaisyDialog'",
  
  // Label imports
  "import { Label } from '@/components/ui/label'": "import { DaisyLabel } from '@/components/ui/DaisyLabel'",
  
  // Separator imports
  "import { Separator } from '@/components/ui/separator'": "import { DaisySeparator } from '@/components/ui/DaisySeparator'",
};

// Component usage mapping
const usageMapping = {
  // Button
  '<Button': '<DaisyButton',
  '</Button>': '</DaisyButton>',
  
  // Card
  '<Card': '<DaisyCard',
  '</Card>': '</DaisyCard>',
  '<CardContent': '<DaisyCardBody',
  '</CardContent>': '</DaisyCardBody>',
  '<CardHeader': '<DaisyCardBody',
  '</CardHeader>': '',
  '<CardTitle': '<DaisyCardTitle',
  '</CardTitle>': '</DaisyCardTitle>',
  
  // Input
  '<Input': '<DaisyInput',
  
  // Badge
  '<Badge': '<DaisyBadge',
  '</Badge>': '</DaisyBadge>',
  
  // Alert
  '<Alert': '<DaisyAlert',
  '</Alert>': '</DaisyAlert>',
  '<AlertDescription>': '',
  '</AlertDescription>': '',
  
  // Progress
  '<Progress': '<DaisyProgress',
  
  // Select
  '<Select': '<DaisySelect',
  '</Select>': '</DaisySelect>',
  
  // Checkbox
  '<Checkbox': '<DaisyCheckbox',
  
  // Dialog
  '<Dialog': '<DaisyDialog',
  '</Dialog>': '</DaisyDialog>',
  '<DialogContent': '<DaisyDialogContent',
  '</DialogContent>': '</DaisyDialogContent>',
  '<DialogHeader': '<DaisyDialogHeader',
  '</DialogHeader>': '</DaisyDialogHeader>',
  '<DialogTitle': '<DaisyDialogTitle',
  '</DialogTitle>': '</DaisyDialogTitle>',
  '<DialogDescription': '<DaisyDialogDescription',
  '</DialogDescription>': '</DaisyDialogDescription>',
  
  // Label
  '<Label': '<DaisyLabel',
  '</Label>': '</DaisyLabel>',
  
  // Separator
  '<Separator': '<DaisySeparator',
  '</Separator>': '</DaisySeparator>',
};

// Files to process
const filesToProcess = process.argv.slice(2);

if (filesToProcess.length === 0) {
  console.log('Usage: node migrate-to-daisyui.js <file1> <file2> ...');
  console.log('Or: node migrate-to-daisyui.js --all');
  process.exit(1);
}

// Get all TypeScript/JavaScript files if --all flag is used
if (filesToProcess[0] === '--all') {
  const srcFiles = glob.sync('src/**/*.{tsx,jsx,ts,js}', { 
    ignore: [
      'src/components/ui/Daisy*.tsx',
      'src/pages/dashboard/DaisyDashboardPage.tsx'
    ]
  });
  filesToProcess.splice(0, 1, ...srcFiles);
}

// Process each file
filesToProcess.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Replace imports
  Object.entries(componentMapping).forEach(([oldImport, newImport]) => {
    if (content.includes(oldImport)) {
      content = content.replace(new RegExp(oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newImport);
      modified = true;
    }
  });

  // Replace component usage
  Object.entries(usageMapping).forEach(([oldUsage, newUsage]) => {
    if (content.includes(oldUsage)) {
      content = content.replace(new RegExp(oldUsage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newUsage);
      modified = true;
    }
  });

  // Additional transformations
  // Update variant props for buttons
  content = content.replace(/variant="destructive"/g, 'variant="error"');
  content = content.replace(/variant="outline"/g, 'variant="outline"');
  content = content.replace(/variant="secondary"/g, 'variant="secondary"');
  content = content.replace(/variant="ghost"/g, 'variant="ghost"');
  content = content.replace(/variant="link"/g, 'variant="link"');
  
  // Update size props
  content = content.replace(/size="sm"/g, 'size="sm"');
  content = content.replace(/size="lg"/g, 'size="lg"');
  content = content.replace(/size="icon"/g, 'shape="square" size="md"');

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Migrated: ${filePath}`);
  } else {
    console.log(`⏭️  Skipped: ${filePath} (no changes needed)`);
  }
});

console.log('\nMigration complete!');
console.log('\nNext steps:');
console.log('1. Review the changes in your code editor');
console.log('2. Run your tests to ensure everything works');
console.log('3. Update any custom styling that may need adjustment');
console.log('4. Check for any manual updates needed for complex components');