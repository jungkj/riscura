'use client';

import React from 'react';
import { Button } from './button';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Input } from './input';
import { Textarea } from './textarea';
import { Badge } from './badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from './breadcrumb';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from './pagination';
import { Progress } from './progress';
import { DaisyCard, DaisyCardBody, DaisyCardTitle, DaisyCardDescription, DaisyButton, DaisyBadge, DaisyInput, DaisyTextarea, DaisyTabs, DaisyTabsList, DaisyTabsTrigger, DaisyTabsContent, DaisyTable, DaisyTableHeader, DaisyTableBody, DaisyTableRow, DaisyTableHead, DaisyTableCell, DaisyProgress } from '@/components/ui/daisy-components';
import { Brain } from 'lucide-react';
// import { 
  Home, 
  Search, 
  Plus, 
  Download, 
  Settings, 
  User,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Brain
} from 'lucide-react'

export function NotionStyleGuide() {

  return (
    <div className="min-h-screen bg-white p-8 space-y-12 font-inter">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#191919] mb-4">
            Riscura Design System
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A comprehensive component library following Notion-like minimalistic design principles 
            for our RCSA automation platform.
          </p>
        </div>

        {/* Color Palette */}
        <DaisyCard className="mb-12" >
  <DaisyCardBody >
</DaisyCard>
            <DaisyCardTitle>Color Palette</DaisyCardTitle>
            <DaisyCardDescription>Primary colors used throughout the application</p>
          
          <DaisyCardBody >
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
</DaisyCardDescription>
              <div className="text-center">
                <div className="w-full h-20 bg-[#191919] rounded-lg mb-2"></div>
                <p className="text-sm font-medium">#191919</p>
                <p className="text-xs text-gray-500">Primary Text</p>
              </div>
              <div className="text-center">
                <div className="w-full h-20 bg-[#199BEC] rounded-lg mb-2"></div>
                <p className="text-sm font-medium">#199BEC</p>
                <p className="text-xs text-gray-500">Primary Blue</p>
              </div>
              <div className="text-center">
                <div className="w-full h-20 bg-[#FAFAFA] border border-gray-200 rounded-lg mb-2"></div>
                <p className="text-sm font-medium">#FAFAFA</p>
                <p className="text-xs text-gray-500">Card Background</p>
              </div>
              <div className="text-center">
                <div className="w-full h-20 bg-white border border-gray-200 rounded-lg mb-2"></div>
                <p className="text-sm font-medium">#FFFFFF</p>
                <p className="text-xs text-gray-500">Main Background</p>
              </div>
            </div>
          </DaisyCardBody>
        </DaisyCard>

        {/* Typography */}
        <DaisyCard className="mb-12" >
  <DaisyCardBody >
</DaisyCard>
            <DaisyCardTitle>Typography</DaisyCardTitle>
            <DaisyCardDescription>Inter font family with consistent hierarchy</p>
          
          <DaisyCardBody className="space-y-4" >
  <div>
</DaisyCardDescription>
              <h1 className="text-4xl font-bold text-[#191919] mb-2">Heading 1</h1>
              <p className="text-sm text-gray-500">text-4xl font-bold</p>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-[#191919] mb-2">Heading 2</h2>
              <p className="text-sm text-gray-500">text-3xl font-bold</p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#191919] mb-2">Heading 3</h3>
              <p className="text-sm text-gray-500">text-xl font-bold</p>
            </div>
            <div>
              <p className="text-base font-medium text-[#191919] mb-2">Body Text Medium</p>
              <p className="text-sm text-gray-500">text-base font-medium</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Secondary Text</p>
              <p className="text-sm text-gray-500">text-sm text-gray-600</p>
            </div>
          </DaisyCardBody>
        </DaisyCard>

        {/* Buttons */}
        <DaisyCard className="mb-12" >
  <DaisyCardBody >
</DaisyCard>
            <DaisyCardTitle>Button Components</DaisyCardTitle>
            <DaisyCardDescription>Primary, secondary, tertiary, and ghost button styles</p>
          
          <DaisyCardBody >
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
</DaisyCardDescription>
              <div className="space-y-3">
                <h4 className="font-semibold text-[#191919]">Primary</h4>
                <DaisyButton className="w-full" >
  <Plus className="w-4 h-4 mr-2" />
</DaisyButton>
                  Primary Action
                </DaisyButton>
                <DaisyButton size="sm" className="w-full">
          Small Primary
        </DaisyButton>
                <DaisyButton size="lg" className="w-full">
          Large Primary
        </DaisyButton>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-[#191919]">Secondary</h4>
                <DaisyButton variant="secondary" className="w-full" >
  <Download className="w-4 h-4 mr-2" />
</DaisyButton>
                  Secondary Action
                </DaisyButton>
                <DaisyButton variant="secondary" size="sm" className="w-full">
          Small Secondary
        </DaisyButton>
                <DaisyButton variant="secondary" size="lg" className="w-full">
          Large Secondary
        </DaisyButton>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-[#191919]">Tertiary</h4>
                <DaisyButton variant="tertiary" className="w-full" >
  <Settings className="w-4 h-4 mr-2" />
</DaisyButton>
                  Tertiary Action
                </DaisyButton>
                <DaisyButton variant="tertiary" size="sm" className="w-full">
          Small Tertiary
        </DaisyButton>
                <DaisyButton variant="tertiary" size="lg" className="w-full">
          Large Tertiary
        </DaisyButton>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-[#191919]">Ghost</h4>
                <DaisyButton variant="ghost" className="w-full" >
  <User className="w-4 h-4 mr-2" />
</DaisyButton>
                  Ghost Action
                </DaisyButton>
                <DaisyButton variant="ghost" size="sm" className="w-full">
          Small Ghost
        </DaisyButton>
                <DaisyButton variant="ghost" size="lg" className="w-full">
          Large Ghost
        </DaisyButton>
              </div>
            </div>
          </DaisyCardBody>
        </DaisyCard>

        {/* Form Components */}
        <DaisyCard className="mb-12" >
  <DaisyCardBody >
</DaisyCard>
            <DaisyCardTitle>Form Components</DaisyCardTitle>
            <DaisyCardDescription>Clean input fields with blue focus states</p>
          
          <DaisyCardBody className="space-y-6" >
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
</DaisyCardDescription>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#191919] mb-2">
                    Standard Input
                  </label>
                  <DaisyInput placeholder="Enter your text here..." />
</div>
                
                <div>
                  <label className="block text-sm font-medium text-[#191919] mb-2">
                    Search Input
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <DaisyInput placeholder="Search..." className="pl-10" />
</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#191919] mb-2">
                    Disabled Input
                  </label>
                  <DaisyInput placeholder="Disabled input" disabled />
</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#191919] mb-2">
                  Textarea
                </label>
                <DaisyTextarea 
                  placeholder="Enter your message here..."
                  className="min-h-[120px]" />
</div>
            </div>
          </DaisyInput>
        </DaisyCard>

        {/* Data Display */}
        <DaisyCard className="mb-12" >
  <DaisyCardBody >
</DaisyCard>
            <DaisyCardTitle>Data Display Components</DaisyCardTitle>
            <DaisyCardDescription>Badges, progress indicators, and status elements</p>
          
          <DaisyCardBody className="space-y-6" >
  {/* Badges */}
</DaisyCardDescription>
            <div>
              <h4 className="font-semibold text-[#191919] mb-3">Status Badges</h4>
              <div className="flex flex-wrap gap-2">
                <DaisyBadge>Default</DaisyBadge>
                <DaisyBadge variant="secondary">Secondary</DaisyBadge>
                <DaisyBadge variant="success">Success</DaisyBadge>
                <DaisyBadge variant="warning">Warning</DaisyBadge>
                <DaisyBadge variant="error">Error</DaisyBadge>
                <DaisyBadge variant="outline">Outline</DaisyBadge>
                <DaisyBadge variant="purple">AI Insights</DaisyBadge>
                <DaisyBadge variant="blue">Information</DaisyBadge>
              </div>
            </div>
            
            {/* Progress */}
            <div>
              <h4 className="font-semibold text-[#191919] mb-3">Progress Indicators</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Compliance Score</span>
                    <span>94%</span>
                  </div>
                  <DaisyProgress value={94} className="h-2" />
</div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Risk Assessment</span>
                    <span>67%</span>
                  </div>
                  <DaisyProgress value={67} className="h-2" />
</div>
              </div>
            </div>
          </DaisyProgress>
        </DaisyCard>

        {/* Navigation Components */}
        <DaisyCard className="mb-12" >
  <DaisyCardBody >
</DaisyCard>
            <DaisyCardTitle>Navigation Components</DaisyCardTitle>
            <DaisyCardDescription>Tabs, breadcrumbs, and pagination</p>
          
          <DaisyCardBody className="space-y-8" >
  {/* Breadcrumbs */}
</DaisyCardDescription>
            <div>
              <h4 className="font-semibold text-[#191919] mb-3">Breadcrumb Navigation</h4>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/">
                      <Home className="w-4 h-4" />
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Risk Management</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            
            {/* Tabs */}
            <div>
              <h4 className="font-semibold text-[#191919] mb-3">Tab Navigation</h4>
              <DaisyTabs defaultValue="overview" className="w-full" >
                  <DaisyTabsList >
                    <DaisyTabsTrigger value="overview">Overview</DaisyTabs>
                  <DaisyTabsTrigger value="risks">Risks</DaisyTabsTrigger>
                  <DaisyTabsTrigger value="controls">Controls</DaisyTabsTrigger>
                  <DaisyTabsTrigger value="compliance">Compliance</DaisyTabsTrigger>
                </DaisyTabsList>
                <DaisyTabsContent value="overview" className="mt-4" >
                    <p className="text-gray-600">Overview content goes here...</p>
                </DaisyTabsContent>
                <DaisyTabsContent value="risks" className="mt-4" >
                    <p className="text-gray-600">Risk management content goes here...</p>
                </DaisyTabsContent>
                <DaisyTabsContent value="controls" className="mt-4" >
                    <p className="text-gray-600">Controls content goes here...</p>
                </DaisyTabsContent>
                <DaisyTabsContent value="compliance" className="mt-4" >
                    <p className="text-gray-600">Compliance content goes here...</p>
                </DaisyTabsContent>
              </DaisyTabs>
            </div>
            
            {/* Pagination */}
            <div>
              <h4 className="font-semibold text-[#191919] mb-3">Pagination</h4>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" isActive>1</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#">2</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#">3</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext href="#" />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </DaisyCardBody>
        </DaisyCard>

        {/* Table Component */}
        <DaisyCard className="mb-12" >
  <DaisyCardBody >
</DaisyCard>
            <DaisyCardTitle>Data Table</DaisyCardTitle>
            <DaisyCardDescription>Clean table design for data display</p>
          
          <DaisyCardBody >
  <DaisyTable >
</DaisyCardDescription>
              <DaisyTableHeader >
                  <DaisyTableRow >
                    <DaisyTableHead>Risk ID</DaisyTableHeader>
                  <DaisyTableHead>Description</DaisyTableHead>
                  <DaisyTableHead>Severity</DaisyTableHead>
                  <DaisyTableHead>Status</DaisyTableHead>
                  <DaisyTableHead>Owner</DaisyTableHead>
                </DaisyTableRow>
              </DaisyTableHeader>
              <DaisyTableBody >
                  <DaisyTableRow >
                    <DaisyTableCell className="font-medium">RSK-001</DaisyTableBody>
                  <DaisyTableCell>Data breach vulnerability</DaisyTableCell>
                  <DaisyTableCell >
                      <DaisyBadge variant="error">High</DaisyTableCell>
                  </DaisyTableCell>
                  <DaisyTableCell >
                      <DaisyBadge variant="warning">In Progress</DaisyTableCell>
                  </DaisyTableCell>
                  <DaisyTableCell>Sarah Chen</DaisyTableCell>
                </DaisyTableRow>
                <DaisyTableRow >
                    <DaisyTableCell className="font-medium">RSK-002</DaisyTableRow>
                  <DaisyTableCell>Access control weakness</DaisyTableCell>
                  <DaisyTableCell >
                      <DaisyBadge variant="warning">Medium</DaisyTableCell>
                  </DaisyTableCell>
                  <DaisyTableCell >
                      <DaisyBadge variant="success">Resolved</DaisyTableCell>
                  </DaisyTableCell>
                  <DaisyTableCell>John Smith</DaisyTableCell>
                </DaisyTableRow>
                <DaisyTableRow >
                    <DaisyTableCell className="font-medium">RSK-003</DaisyTableRow>
                  <DaisyTableCell>Compliance gap identified</DaisyTableCell>
                  <DaisyTableCell >
                      <DaisyBadge variant="secondary">Low</DaisyTableCell>
                  </DaisyTableCell>
                  <DaisyTableCell >
                      <DaisyBadge variant="blue">Under Review</DaisyTableCell>
                  </DaisyTableCell>
                  <DaisyTableCell>Alex Johnson</DaisyTableCell>
                </DaisyTableRow>
              </DaisyTableBody>
            </DaisyTable>
          </DaisyCardBody>
        </DaisyCard>

        {/* Card Layouts */}
        <DaisyCard className="mb-12" >
  <DaisyCardBody >
</DaisyCard>
            <DaisyCardTitle>Card Layouts</DaisyCardTitle>
            <DaisyCardDescription>Various card designs for different content types</p>
          
          <DaisyCardBody >
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
</DaisyCardDescription>
              {/* Metric Card */}
              <DaisyCard >
  <DaisyCardBody className="p-6" >
  </DaisyCard>
</DaisyCardBody>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Shield className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Risks</p>
                    <p className="text-3xl font-bold text-[#191919] mb-2">23</p>
                    <p className="text-xs text-gray-500">+2 this week</p>
                  </div>
                </DaisyCardBody>
              </DaisyCard>
              
              {/* Status Card */}
              <DaisyCard >
  <DaisyCardBody className="pb-4" >
</DaisyCard>
                  <DaisyCardTitle className="flex items-center gap-2" >
  <DaisyAlertTriangle className="h-5 w-5 text-orange-600" >
  </DaisyCardTitle>
</DaisyAlert>
                    High Priority
                  </DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <p className="text-sm text-gray-600 mb-4">
</DaisyCardBody>
                    4 high-risk items require immediate attention.
                  </p>
                  <DaisyButton size="sm" className="w-full">
          Review Now

        </DaisyButton>
                  </DaisyButton>
                </DaisyCardBody>
              </DaisyCard>
              
              {/* AI Insights Card */}
              <DaisyCard >
  <DaisyCardBody className="pb-4" >
</DaisyCard>
                  <DaisyCardTitle className="flex items-center gap-2" >
  <Brain className="h-5 w-5 text-purple-600" />
</DaisyCardTitle>
                    AI Insights
                  </DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <div className="p-3 bg-purple-50 rounded-lg border border-purple-100 mb-4">
</DaisyCardBody>
                    <p className="text-sm text-purple-700">
                      ARIA detected potential compliance gaps in your SOX controls.
                    </p>
                  </div>
                  <DaisyButton variant="secondary" size="sm" className="w-full">
          View Details

        </DaisyButton>
                  </DaisyButton>
                </DaisyCardBody>
              </DaisyCard>
            </div>
          </DaisyCardBody>
        </DaisyCard>

        {/* Usage Guidelines */}
        <DaisyCard >
  <DaisyCardBody >
</DaisyCard>
            <DaisyCardTitle>Usage Guidelines</DaisyCardTitle>
            <DaisyCardDescription>Best practices for implementing the design system</p>
          
          <DaisyCardBody className="space-y-4" >
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
</DaisyCardDescription>
              <div>
                <h4 className="font-semibold text-[#191919] mb-3">✅ Do</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Use consistent spacing (4px, 8px, 16px, 24px, 32px)</li>
                  <li>• Apply Inter font family throughout</li>
                  <li>• Use blue (#199BEC) for primary actions</li>
                  <li>• Maintain cream (#FAFAFA) for card backgrounds</li>
                  <li>• Keep borders minimal (1px) except for emphasis</li>
                  <li>• Use subtle shadows for depth</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-[#191919] mb-3">❌ Don't</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Use thick borders (2px+) in content areas</li>
                  <li>• Mix different font families</li>
                  <li>• Use bright or saturated colors</li>
                  <li>• Create overly complex layouts</li>
                  <li>• Ignore hover and focus states</li>
                  <li>• Use inconsistent spacing</li>
                </ul>
              </div>
            </div>
          </DaisyCardBody>
        </DaisyCard>
      </div>
    </div>
  );
} 