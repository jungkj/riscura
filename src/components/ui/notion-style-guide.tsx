'use client';

import React from 'react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Input } from './input';
import { Textarea } from './textarea';
import { Badge } from './badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from './breadcrumb';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from './pagination';
import { Progress } from './progress';
import { 
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
} from 'lucide-react';

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
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Color Palette</CardTitle>
            <CardDescription>Primary colors used throughout the application</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
          </CardContent>
        </Card>

        {/* Typography */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Typography</CardTitle>
            <CardDescription>Inter font family with consistent hierarchy</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
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
          </CardContent>
        </Card>

        {/* Buttons */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Button Components</CardTitle>
            <CardDescription>Primary, secondary, tertiary, and ghost button styles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-[#191919]">Primary</h4>
                <Button className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Primary Action
                </Button>
                <Button size="sm" className="w-full">Small Primary</Button>
                <Button size="lg" className="w-full">Large Primary</Button>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-[#191919]">Secondary</h4>
                <Button variant="secondary" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Secondary Action
                </Button>
                <Button variant="secondary" size="sm" className="w-full">Small Secondary</Button>
                <Button variant="secondary" size="lg" className="w-full">Large Secondary</Button>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-[#191919]">Tertiary</h4>
                <Button variant="tertiary" className="w-full">
                  <Settings className="w-4 h-4 mr-2" />
                  Tertiary Action
                </Button>
                <Button variant="tertiary" size="sm" className="w-full">Small Tertiary</Button>
                <Button variant="tertiary" size="lg" className="w-full">Large Tertiary</Button>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-[#191919]">Ghost</h4>
                <Button variant="ghost" className="w-full">
                  <User className="w-4 h-4 mr-2" />
                  Ghost Action
                </Button>
                <Button variant="ghost" size="sm" className="w-full">Small Ghost</Button>
                <Button variant="ghost" size="lg" className="w-full">Large Ghost</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Components */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Form Components</CardTitle>
            <CardDescription>Clean input fields with blue focus states</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#191919] mb-2">
                    Standard Input
                  </label>
                  <Input placeholder="Enter your text here..." />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#191919] mb-2">
                    Search Input
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input placeholder="Search..." className="pl-10" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#191919] mb-2">
                    Disabled Input
                  </label>
                  <Input placeholder="Disabled input" disabled />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#191919] mb-2">
                  Textarea
                </label>
                <Textarea 
                  placeholder="Enter your message here..."
                  className="min-h-[120px]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Display */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Data Display Components</CardTitle>
            <CardDescription>Badges, progress indicators, and status elements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Badges */}
            <div>
              <h4 className="font-semibold text-[#191919] mb-3">Status Badges</h4>
              <div className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="destructive">Error</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="purple">AI Insights</Badge>
                <Badge variant="blue">Information</Badge>
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
                  <Progress value={94} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Risk Assessment</span>
                    <span>67%</span>
                  </div>
                  <Progress value={67} className="h-2" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Components */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Navigation Components</CardTitle>
            <CardDescription>Tabs, breadcrumbs, and pagination</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Breadcrumbs */}
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
              <Tabs defaultValue="overview" className="w-full">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="risks">Risks</TabsTrigger>
                  <TabsTrigger value="controls">Controls</TabsTrigger>
                  <TabsTrigger value="compliance">Compliance</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="mt-4">
                  <p className="text-gray-600">Overview content goes here...</p>
                </TabsContent>
                <TabsContent value="risks" className="mt-4">
                  <p className="text-gray-600">Risk management content goes here...</p>
                </TabsContent>
                <TabsContent value="controls" className="mt-4">
                  <p className="text-gray-600">Controls content goes here...</p>
                </TabsContent>
                <TabsContent value="compliance" className="mt-4">
                  <p className="text-gray-600">Compliance content goes here...</p>
                </TabsContent>
              </Tabs>
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
          </CardContent>
        </Card>

        {/* Table Component */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Data Table</CardTitle>
            <CardDescription>Clean table design for data display</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Risk ID</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Owner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">RSK-001</TableCell>
                  <TableCell>Data breach vulnerability</TableCell>
                  <TableCell>
                    <Badge variant="destructive">High</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="warning">In Progress</Badge>
                  </TableCell>
                  <TableCell>Sarah Chen</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">RSK-002</TableCell>
                  <TableCell>Access control weakness</TableCell>
                  <TableCell>
                    <Badge variant="warning">Medium</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="success">Resolved</Badge>
                  </TableCell>
                  <TableCell>John Smith</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">RSK-003</TableCell>
                  <TableCell>Compliance gap identified</TableCell>
                  <TableCell>
                    <Badge variant="secondary">Low</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="blue">Under Review</Badge>
                  </TableCell>
                  <TableCell>Alex Johnson</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Card Layouts */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Card Layouts</CardTitle>
            <CardDescription>Various card designs for different content types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Metric Card */}
              <Card>
                <CardContent className="p-6">
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
                </CardContent>
              </Card>
              
              {/* Status Card */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    High Priority
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    4 high-risk items require immediate attention.
                  </p>
                  <Button size="sm" className="w-full">
                    Review Now
                  </Button>
                </CardContent>
              </Card>
              
              {/* AI Insights Card */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    AI Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-100 mb-4">
                    <p className="text-sm text-purple-700">
                      ARIA detected potential compliance gaps in your SOX controls.
                    </p>
                  </div>
                  <Button variant="secondary" size="sm" className="w-full">
                    View Details
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Usage Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Guidelines</CardTitle>
            <CardDescription>Best practices for implementing the design system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 