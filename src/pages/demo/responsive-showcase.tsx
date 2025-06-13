'use client';

import React, { useState } from 'react';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { EnhancedDataTable } from '@/components/ui/enhanced-data-table';
import { EnhancedList } from '@/components/ui/enhanced-list';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDevice } from '@/lib/responsive/hooks';
import {
  Smartphone,
  Tablet,
  Monitor,
  Users,
  Target,
  Shield,
  FileText,
  BarChart3,
  Plus,
  Download,
  Filter,
  Search,
  Settings,
  Star,
  Heart,
  MessageSquare,
  Calendar,
  Clock,
  User,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  XCircle,
  Hand,
} from 'lucide-react';

// Sample data for demonstrations
const sampleTableData = [
  {
    id: '1',
    name: 'Risk Assessment Framework',
    status: 'active',
    priority: 'high',
    assignee: { name: 'John Doe', email: 'john@example.com', avatar: '' },
    progress: 85,
    dueDate: new Date('2024-01-15'),
    category: 'Compliance',
    tags: ['Critical', 'In Progress'],
  },
  {
    id: '2',
    name: 'Security Control Review',
    status: 'pending',
    priority: 'medium',
    assignee: { name: 'Jane Smith', email: 'jane@example.com', avatar: '' },
    progress: 60,
    dueDate: new Date('2024-01-20'),
    category: 'Security',
    tags: ['Review', 'Security'],
  },
  {
    id: '3',
    name: 'Vendor Assessment',
    status: 'completed',
    priority: 'low',
    assignee: { name: 'Mike Johnson', email: 'mike@example.com', avatar: '' },
    progress: 100,
    dueDate: new Date('2024-01-10'),
    category: 'Vendor Management',
    tags: ['Completed', 'External'],
  },
  {
    id: '4',
    name: 'Data Privacy Audit',
    status: 'active',
    priority: 'high',
    assignee: { name: 'Sarah Wilson', email: 'sarah@example.com', avatar: '' },
    progress: 45,
    dueDate: new Date('2024-01-25'),
    category: 'Privacy',
    tags: ['GDPR', 'Audit'],
  },
  {
    id: '5',
    name: 'Business Continuity Plan',
    status: 'draft',
    priority: 'medium',
    assignee: { name: 'Tom Brown', email: 'tom@example.com', avatar: '' },
    progress: 30,
    dueDate: new Date('2024-02-01'),
    category: 'Business Continuity',
    tags: ['Planning', 'Strategy'],
  },
];

const sampleListData = [
  {
    id: '1',
    title: 'ISO 27001 Implementation',
    description: 'Complete implementation of ISO 27001 security management framework',
    status: 'active' as const,
    priority: 'high' as const,
    assignee: {
      name: 'John Doe',
      email: 'john@example.com',
      avatar: '',
    },
    dueDate: new Date('2024-02-15'),
    progress: 75,
    tags: ['ISO 27001', 'Security', 'Framework'],
    metadata: {
      created: new Date('2023-11-01'),
      updated: new Date('2024-01-08'),
      department: 'Information Security',
      budget: '$50,000',
    },
  },
  {
    id: '2',
    title: 'GDPR Compliance Review',
    description: 'Annual review of GDPR compliance procedures and documentation',
    status: 'pending' as const,
    priority: 'medium' as const,
    assignee: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      avatar: '',
    },
    dueDate: new Date('2024-01-30'),
    progress: 60,
    tags: ['GDPR', 'Compliance', 'Review'],
    metadata: {
      created: new Date('2023-12-01'),
      updated: new Date('2024-01-05'),
      department: 'Legal',
      budget: '$25,000',
    },
  },
  {
    id: '3',
    title: 'Risk Assessment Update',
    description: 'Quarterly update of enterprise risk assessment matrix',
    status: 'completed' as const,
    priority: 'low' as const,
    assignee: {
      name: 'Mike Johnson',
      email: 'mike@example.com',
      avatar: '',
    },
    dueDate: new Date('2024-01-15'),
    progress: 100,
    tags: ['Risk Management', 'Quarterly', 'Assessment'],
    metadata: {
      created: new Date('2023-10-01'),
      updated: new Date('2024-01-15'),
      department: 'Risk Management',
      budget: '$15,000',
    },
  },
];

const tableColumns = [
  {
    key: 'name' as const,
    title: 'Name',
    type: 'text' as const,
    sortable: true,
    mobileHidden: false,
  },
  {
    key: 'status' as const,
    title: 'Status',
    type: 'status' as const,
    sortable: true,
    mobileHidden: false,
  },
  {
    key: 'priority' as const,
    title: 'Priority',
    type: 'text' as const,
    sortable: true,
    mobileHidden: true,
  },
  {
    key: 'assignee' as const,
    title: 'Assignee',
    type: 'user' as const,
    sortable: false,
    mobileHidden: true,
  },
  {
    key: 'progress' as const,
    title: 'Progress',
    type: 'progress' as const,
    sortable: true,
    mobileHidden: false,
  },
  {
    key: 'dueDate' as const,
    title: 'Due Date',
    type: 'date' as const,
    sortable: true,
    mobileHidden: true,
  },
];

const ResponsiveShowcasePage: React.FC = () => {
  const device = useDevice();
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [activeDemo, setActiveDemo] = useState<'table' | 'list' | 'layout'>('layout');

  const user = {
    name: 'Demo User',
    email: 'demo@riscura.com',
    avatar: '',
    role: 'Admin',
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Demo', href: '/demo' },
    { label: 'Responsive Showcase' },
  ];

  const headerActions = (
    <>
      <Button variant="tertiary" className="gap-2">
        <Download className="h-4 w-4" />
        {device.type !== 'mobile' && 'Export'}
      </Button>
      <Button variant="secondary" className="gap-2">
        <Filter className="h-4 w-4" />
        {device.type !== 'mobile' && 'Filter'}
      </Button>
      <Button className="gap-2">
        <Plus className="h-4 w-4" />
        {device.type !== 'mobile' && 'New Item'}
      </Button>
    </>
  );

  const getDeviceIcon = () => {
    switch (device.type) {
      case 'mobile': return Smartphone;
      case 'tablet': return Tablet;
      case 'desktop': return Monitor;
      default: return Monitor;
    }
  };

  const DeviceIcon = getDeviceIcon();

  return (
    <ResponsiveLayout
      pageTitle="Responsive Design Showcase"
      pageSubtitle="Demonstrating adaptive UI components across all device types"
      breadcrumbs={breadcrumbs}
      actions={headerActions}
      user={user}
      notifications={3}
      theme={theme}
      onThemeChange={setTheme}
      currentPath="/demo/responsive-showcase"
      onNavigate={(href) => console.log('Navigate to:', href)}
    >
      <div className="space-y-6">
        {/* Device Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <DeviceIcon className="h-6 w-6 text-[#199BEC]" />
              <div>
                <CardTitle className="flex items-center gap-2">
                  Current Device: {device.type.charAt(0).toUpperCase() + device.type.slice(1)}
                  <Badge variant="secondary" className="ml-2">
                    {device.width}x{device.height}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {device.isTouchDevice ? 'Touch' : 'Mouse'} device in {device.orientation} orientation
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Breakpoint:</span>
                <p className="font-mono text-[#199BEC]">{device.breakpoint}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Touch Device:</span>
                <p className="font-mono">{device.isTouchDevice ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Pixel Ratio:</span>
                <p className="font-mono">{device.pixelRatio}x</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Orientation:</span>
                <p className="font-mono capitalize">{device.orientation}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Component Demonstrations</CardTitle>
            <CardDescription>
              Explore how different components adapt to your device
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={activeDemo === 'layout' ? 'default' : 'tertiary'}
                onClick={() => setActiveDemo('layout')}
                className="gap-2"
              >
                <Monitor className="h-4 w-4" />
                Layout Features
              </Button>
              <Button
                variant={activeDemo === 'table' ? 'default' : 'tertiary'}
                onClick={() => setActiveDemo('table')}
                className="gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Data Table
              </Button>
              <Button
                variant={activeDemo === 'list' ? 'default' : 'tertiary'}
                onClick={() => setActiveDemo('list')}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Enhanced List
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Layout Features Demo */}
        {activeDemo === 'layout' && (
          <Card>
            <CardHeader>
              <CardTitle>Responsive Layout Features</CardTitle>
              <CardDescription>
                Layout adapts automatically based on your device type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-semibold text-[#191919] mb-2 flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      Mobile (&lt; 768px)
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Overlay sidebar with sheet</li>
                      <li>• Touch-friendly 44px buttons</li>
                      <li>• Card-based table view</li>
                      <li>• Bottom action bar</li>
                      <li>• Swipe gestures</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-semibold text-[#191919] mb-2 flex items-center gap-2">
                      <Tablet className="h-4 w-4" />
                      Tablet (768px - 1024px)
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Collapsed icon sidebar</li>
                      <li>• Balanced layouts</li>
                      <li>• Hybrid interactions</li>
                      <li>• Optimized spacing</li>
                      <li>• Touch + hover states</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-semibold text-[#191919] mb-2 flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      Desktop (&gt; 1024px)
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Full expanded sidebar</li>
                      <li>• Keyboard shortcuts</li>
                      <li>• Hover interactions</li>
                      <li>• Wide screen layouts</li>
                      <li>• Advanced features</li>
                    </ul>
                  </div>
                </div>

                {/* Keyboard Shortcuts (Desktop Only) */}
                {device.type === 'desktop' && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-[#191919] mb-3 flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Available Keyboard Shortcuts
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span>Toggle Sidebar</span>
                        <Badge variant="outline" className="font-mono">Ctrl/Cmd + B</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Command Palette</span>
                        <Badge variant="outline" className="font-mono">Ctrl/Cmd + K</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Help</span>
                        <Badge variant="outline" className="font-mono">Ctrl/Cmd + /</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Close/Escape</span>
                        <Badge variant="outline" className="font-mono">Esc</Badge>
                      </div>
                    </div>
                  </div>
                )}

                {/* Touch Gestures (Mobile/Tablet) */}
                {device.isTouchDevice && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-[#191919] mb-3 flex items-center gap-2">
                      <Hand className="h-4 w-4" />
                      Touch Gestures
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span>Open Sidebar</span>
                        <Badge variant="outline">Swipe Right →</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Close Sidebar</span>
                        <Badge variant="outline">Swipe Left ←</Badge>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Table Demo */}
        {activeDemo === 'table' && (
          <Card>
            <CardHeader>
              <CardTitle>Responsive Data Table</CardTitle>
              <CardDescription>
                {device.type === 'mobile' 
                  ? 'Table automatically converts to card layout on mobile devices'
                  : 'Full table view with all columns and features visible'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EnhancedDataTable
                data={sampleTableData}
                columns={tableColumns}
                searchable
                filterable
                exportable
                selectable
                onRowAction={(action, row) => console.log('Row action:', action, row)}
                onBulkAction={(action, rows) => console.log('Bulk action:', action, rows)}
                className="border rounded-lg"
              />
            </CardContent>
          </Card>
        )}

        {/* Enhanced List Demo */}
        {activeDemo === 'list' && (
          <Card>
            <CardHeader>
              <CardTitle>Responsive Enhanced List</CardTitle>
              <CardDescription>
                List items automatically adapt their layout and information density
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EnhancedList
                items={sampleListData}
                searchable
                filterable
                sortable
                onItemAction={(action, item) => console.log('Item action:', action, item)}
                onItemSelect={(item) => console.log('Item selected:', item)}
                className="space-y-3"
              />
            </CardContent>
          </Card>
        )}

        {/* Implementation Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Implementation Summary</CardTitle>
            <CardDescription>
              Technical details of the responsive design system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-[#191919] mb-2">Breakpoints</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>Mobile: &lt; 768px</div>
                    <div>Tablet: 768px - 1024px</div>
                    <div>Desktop: &gt; 1024px</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-[#191919] mb-2">Design System</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>8px grid spacing</div>
                    <div>200ms transitions</div>
                    <div>Inter font family</div>
                    <div>44px minimum touch targets</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-[#191919] mb-2">Key Features</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                  <Badge variant="outline" className="justify-start">Device Detection</Badge>
                  <Badge variant="outline" className="justify-start">Responsive Hooks</Badge>
                  <Badge variant="outline" className="justify-start">Touch Gestures</Badge>
                  <Badge variant="outline" className="justify-start">Keyboard Shortcuts</Badge>
                  <Badge variant="outline" className="justify-start">Safe Area Support</Badge>
                  <Badge variant="outline" className="justify-start">Adaptive Components</Badge>
                  <Badge variant="outline" className="justify-start">Auto Layout</Badge>
                  <Badge variant="outline" className="justify-start">Theme Integration</Badge>
                  <Badge variant="outline" className="justify-start">Accessibility</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ResponsiveLayout>
  );
};

export default ResponsiveShowcasePage; 