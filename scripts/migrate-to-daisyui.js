#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Component mapping
const componentMapping = {
  // Button imports
  "import { Button } from '@/components/ui/button'": "import { DaisyButton } from '@/components/ui/DaisyButton'",
  "import { Button } from \"@/components/ui/button\"": "import { DaisyButton } from '@/components/ui/DaisyButton'",
  
  // Card imports - with quotes
  "import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'": "import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard'",
  "import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'": "import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard'",
  "import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'": "import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard'",
  "import { Card, CardContent } from '@/components/ui/card'": "import { DaisyCard, DaisyCardBody } from '@/components/ui/DaisyCard'",
  "import { Card } from '@/components/ui/card'": "import { DaisyCard } from '@/components/ui/DaisyCard'",
  "import { Card, CardContent, CardHeader } from '@/components/ui/card'": "import { DaisyCard, DaisyCardBody } from '@/components/ui/DaisyCard'",
  
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
  
  // Tabs imports
  "import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'": "import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs'",
  "import { Tabs } from '@/components/ui/tabs'": "import { DaisyTabs } from '@/components/ui/DaisyTabs'",
  
  // Textarea imports
  "import { Textarea } from '@/components/ui/textarea'": "import { DaisyTextarea } from '@/components/ui/DaisyTextarea'",
  
  // Switch imports
  "import { Switch } from '@/components/ui/switch'": "import { DaisySwitch } from '@/components/ui/DaisySwitch'",
  
  // Avatar imports
  "import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'": "import { DaisyAvatar, DaisyAvatarFallback, DaisyAvatarImage } from '@/components/ui/DaisyAvatar'",
  "import { Avatar, AvatarFallback } from '@/components/ui/avatar'": "import { DaisyAvatar, DaisyAvatarFallback } from '@/components/ui/DaisyAvatar'",
  
  // Tooltip imports
  "import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'": "import { DaisyTooltip, DaisyTooltipContent, DaisyTooltipTrigger, DaisyTooltipWrapper } from '@/components/ui/DaisyTooltip'",
  "import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'": "import { DaisyTooltip, DaisyTooltipContent, DaisyTooltipTrigger } from '@/components/ui/DaisyTooltip'",
  
  // Dropdown menu imports
  "import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'": "import { DaisyDropdownMenu, DaisyDropdownMenuContent, DaisyDropdownMenuItem, DaisyDropdownMenuSeparator, DaisyDropdownMenuTrigger } from '@/components/ui/DaisyDropdown'",
  "import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'": "import { DaisyDropdownMenu, DaisyDropdownMenuContent, DaisyDropdownMenuItem, DaisyDropdownMenuTrigger } from '@/components/ui/DaisyDropdown'",
  "import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'": "import { DaisyDropdownMenu, DaisyDropdownMenuContent, DaisyDropdownMenuItem, DaisyDropdownMenuTrigger, DaisyDropdownMenuSeparator } from '@/components/ui/DaisyDropdown'",
  "import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'": "import { DaisyDropdownMenu, DaisyDropdownMenuContent, DaisyDropdownMenuItem, DaisyDropdownMenuLabel, DaisyDropdownMenuSeparator, DaisyDropdownMenuTrigger } from '@/components/ui/DaisyDropdown'",
  "import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'": "import { DaisyDropdownMenu, DaisyDropdownMenuContent, DaisyDropdownMenuGroup, DaisyDropdownMenuItem, DaisyDropdownMenuLabel, DaisyDropdownMenuSeparator, DaisyDropdownMenuTrigger } from '@/components/ui/DaisyDropdown'",
  
  // Accordion imports
  "import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'": "import { DaisyAccordion, DaisyAccordionContent, DaisyAccordionItem, DaisyAccordionTrigger } from '@/components/ui/DaisyAccordion'",
  
  // Radio group imports
  "import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'": "import { DaisyRadioGroup, DaisyRadioGroupItem } from '@/components/ui/DaisyRadioGroup'",
  
  // Popover imports
  "import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'": "import { DaisyPopover, DaisyPopoverContent, DaisyPopoverTrigger } from '@/components/ui/DaisyPopover'",
  
  // Calendar imports
  "import { Calendar } from '@/components/ui/calendar'": "import { DaisyCalendar } from '@/components/ui/DaisyCalendar'",
  
  // Skeleton imports
  "import { Skeleton } from '@/components/ui/skeleton'": "import { DaisySkeleton } from '@/components/ui/DaisySkeleton'",
  
  // Slider imports
  "import { Slider } from '@/components/ui/slider'": "import { DaisySlider } from '@/components/ui/DaisySlider'",
  
  // ScrollArea imports
  "import { ScrollArea } from '@/components/ui/scroll-area'": "import { DaisyScrollArea } from '@/components/ui/DaisyScrollArea'",
  
  // LoadingSpinner imports
  "import { LoadingSpinner } from '@/components/ui/loading-spinner'": "import { LoadingSpinner } from '@/components/ui/DaisyLoadingSpinner'",
  "import { LoadingSpinner, PageLoadingSpinner } from '@/components/ui/loading-spinner'": "import { LoadingSpinner, PageLoadingSpinner } from '@/components/ui/DaisyLoadingSpinner'",
  "import { LoadingSpinner, InlineLoadingSpinner } from '@/components/ui/loading-spinner'": "import { LoadingSpinner, InlineLoadingSpinner } from '@/components/ui/DaisyLoadingSpinner'",
  
  // AlertDialog imports
  "import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'": "import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/DaisyAlertDialog'",
  
  // Sheet imports
  "import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'": "import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/DaisySheet'",
  "import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'": "import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/DaisySheet'",
  
  // Alert with Title imports
  "import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'": "import { DaisyAlert } from '@/components/ui/DaisyAlert'",
  
  // Table imports
  "import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'": "import { DaisyTable, DaisyTableBody, DaisyTableCell, DaisyTableHead, DaisyTableHeader, DaisyTableRow } from '@/components/ui/DaisyTable'",
  
  // Dialog with Trigger imports
  "import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'": "import { DaisyDialog, DaisyDialogContent, DaisyDialogHeader, DaisyDialogTitle, DaisyDialogTrigger } from '@/components/ui/DaisyDialog'",
  "import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'": "import { DaisyDialog, DaisyDialogContent, DaisyDialogDescription, DaisyDialogHeader, DaisyDialogTitle, DaisyDialogTrigger } from '@/components/ui/DaisyDialog'",
  "import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'": "import { DaisyDialog, DaisyDialogContent, DaisyDialogHeader, DaisyDialogTitle } from '@/components/ui/DaisyDialog'",
  "import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'": "import { DaisyDialog, DaisyDialogContent, DaisyDialogDescription, DaisyDialogHeader, DaisyDialogTitle } from '@/components/ui/DaisyDialog'",
  
  // Select with all parts imports
  "import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'": "import { DaisySelect, DaisySelectContent, DaisySelectItem, DaisySelectTrigger, DaisySelectValue } from '@/components/ui/DaisySelect'",
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
  '<CardDescription>': '<p className="text-sm text-base-content/70">',
  '</CardDescription>': '</p>',
  
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
  '<DialogTrigger': '<DaisyDialogTrigger',
  '</DialogTrigger>': '</DaisyDialogTrigger>',
  
  // Label
  '<Label': '<DaisyLabel',
  '</Label>': '</DaisyLabel>',
  
  // Separator
  '<Separator': '<DaisySeparator',
  '</Separator>': '</DaisySeparator>',
  
  // Tabs
  '<Tabs': '<DaisyTabs',
  '</Tabs>': '</DaisyTabs>',
  '<TabsList': '<DaisyTabsList',
  '</TabsList>': '</DaisyTabsList>',
  '<TabsTrigger': '<DaisyTabsTrigger',
  '</TabsTrigger>': '</DaisyTabsTrigger>',
  '<TabsContent': '<DaisyTabsContent',
  '</TabsContent>': '</DaisyTabsContent>',
  
  // Textarea
  '<Textarea': '<DaisyTextarea',
  
  // Switch
  '<Switch': '<DaisySwitch',
  
  // Avatar
  '<Avatar': '<DaisyAvatar',
  '</Avatar>': '</DaisyAvatar>',
  '<AvatarImage': '<DaisyAvatarImage',
  '<AvatarFallback': '<DaisyAvatarFallback',
  '</AvatarFallback>': '</DaisyAvatarFallback>',
  
  // Tooltip
  '<Tooltip': '<DaisyTooltip',
  '</Tooltip>': '</DaisyTooltip>',
  '<TooltipTrigger': '<DaisyTooltipTrigger',
  '</TooltipTrigger>': '</DaisyTooltipTrigger>',
  '<TooltipContent': '<DaisyTooltipContent',
  '</TooltipContent>': '</DaisyTooltipContent>',
  '<TooltipProvider>': '',
  '</TooltipProvider>': '',
  
  // AlertDialog
  '<AlertDialog': '<AlertDialog',
  '</AlertDialog>': '</AlertDialog>',
  '<AlertDialogTrigger': '<AlertDialogTrigger',
  '</AlertDialogTrigger>': '</AlertDialogTrigger>',
  '<AlertDialogContent': '<AlertDialogContent',
  '</AlertDialogContent>': '</AlertDialogContent>',
  '<AlertDialogHeader': '<AlertDialogHeader',
  '</AlertDialogHeader>': '</AlertDialogHeader>',
  '<AlertDialogTitle': '<AlertDialogTitle',
  '</AlertDialogTitle>': '</AlertDialogTitle>',
  '<AlertDialogDescription': '<AlertDialogDescription',
  '</AlertDialogDescription>': '</AlertDialogDescription>',
  '<AlertDialogFooter': '<AlertDialogFooter',
  '</AlertDialogFooter>': '</AlertDialogFooter>',
  '<AlertDialogAction': '<AlertDialogAction',
  '</AlertDialogAction>': '</AlertDialogAction>',
  '<AlertDialogCancel': '<AlertDialogCancel',
  '</AlertDialogCancel>': '</AlertDialogCancel>',
  
  // Sheet
  '<Sheet': '<Sheet',
  '</Sheet>': '</Sheet>',
  '<SheetTrigger': '<SheetTrigger',
  '</SheetTrigger>': '</SheetTrigger>',
  '<SheetContent': '<SheetContent',
  '</SheetContent>': '</SheetContent>',
  '<SheetHeader': '<SheetHeader',
  '</SheetHeader>': '</SheetHeader>',
  '<SheetTitle': '<SheetTitle',
  '</SheetTitle>': '</SheetTitle>',
  '<SheetDescription': '<SheetDescription',
  '</SheetDescription>': '</SheetDescription>',
  '<SheetClose': '<SheetClose',
  '</SheetClose>': '</SheetClose>',
  
  // Table
  '<Table': '<DaisyTable',
  '</Table>': '</DaisyTable>',
  '<TableHeader': '<DaisyTableHeader',
  '</TableHeader>': '</DaisyTableHeader>',
  '<TableBody': '<DaisyTableBody',
  '</TableBody>': '</DaisyTableBody>',
  '<TableRow': '<DaisyTableRow',
  '</TableRow>': '</DaisyTableRow>',
  '<TableHead': '<DaisyTableHead',
  '</TableHead>': '</DaisyTableHead>',
  '<TableCell': '<DaisyTableCell',
  '</TableCell>': '</DaisyTableCell>',
  
  // Alert with Title
  '<AlertTitle': '<DaisyCardTitle',
  '</AlertTitle>': '</DaisyCardTitle>',
  
  // Dropdown
  '<DropdownMenu': '<DaisyDropdownMenu',
  '</DropdownMenu>': '</DaisyDropdownMenu>',
  '<DropdownMenuTrigger': '<DaisyDropdownMenuTrigger',
  '</DropdownMenuTrigger>': '</DaisyDropdownMenuTrigger>',
  '<DropdownMenuContent': '<DaisyDropdownMenuContent',
  '</DropdownMenuContent>': '</DaisyDropdownMenuContent>',
  '<DropdownMenuItem': '<DaisyDropdownMenuItem',
  '</DropdownMenuItem>': '</DaisyDropdownMenuItem>',
  '<DropdownMenuSeparator': '<DaisyDropdownMenuSeparator',
  '</DropdownMenuSeparator>': '</DaisyDropdownMenuSeparator>',
  '<DropdownMenuLabel': '<DaisyDropdownMenuLabel',
  '</DropdownMenuLabel>': '</DaisyDropdownMenuLabel>',
  '<DropdownMenuGroup': '<DaisyDropdownMenuGroup',
  '</DropdownMenuGroup>': '</DaisyDropdownMenuGroup>',
  
  // Accordion
  '<Accordion': '<DaisyAccordion',
  '</Accordion>': '</DaisyAccordion>',
  '<AccordionItem': '<DaisyAccordionItem',
  '</AccordionItem>': '</DaisyAccordionItem>',
  '<AccordionTrigger': '<DaisyAccordionTrigger',
  '</AccordionTrigger>': '</DaisyAccordionTrigger>',
  '<AccordionContent': '<DaisyAccordionContent',
  '</AccordionContent>': '</DaisyAccordionContent>',
  
  // Radio Group
  '<RadioGroup': '<DaisyRadioGroup',
  '</RadioGroup>': '</DaisyRadioGroup>',
  '<RadioGroupItem': '<DaisyRadioGroupItem',
  
  // Popover
  '<Popover': '<DaisyPopover',
  '</Popover>': '</DaisyPopover>',
  '<PopoverTrigger': '<DaisyPopoverTrigger',
  '</PopoverTrigger>': '</DaisyPopoverTrigger>',
  '<PopoverContent': '<DaisyPopoverContent',
  '</PopoverContent>': '</DaisyPopoverContent>',
  
  // Calendar
  '<Calendar': '<DaisyCalendar',
  
  // Skeleton
  '<Skeleton': '<DaisySkeleton',
  
  // Slider
  '<Slider': '<DaisySlider',
  
  // ScrollArea
  '<ScrollArea': '<DaisyScrollArea',
  '</ScrollArea>': '</DaisyScrollArea>',
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