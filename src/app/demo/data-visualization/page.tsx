'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  Activity, 
  Table, 
  Layout,
  TrendingUp,
  Shield,
  AlertTriangle,
  Eye,
  Download
} from 'lucide-react';

// Import our advanced components
import InteractiveRiskHeatmap from '@/components/charts/InteractiveRiskHeatmap';
import TrendAnalysisChart from '@/components/charts/TrendAnalysisChart';
import ComplianceProgressChart from '@/components/charts/ComplianceProgressChart';
import RealTimeMonitoringChart from '@/components/charts/RealTimeMonitoringChart';
import EnterpriseDataTable, { RiskDataTableExample } from '@/components/data-table/EnterpriseDataTable';
import CustomDashboardBuilder from '@/components/dashboard/CustomDashboardBuilder';

export default function DataVisualizationDemo() {
  const [activeDemo, setActiveDemo] = useState('charts');
  
  const demos = [
    {
      id: 'charts',
      title: 'Interactive Charts',
      description: 'Advanced chart components with drill-down capabilities',
      icon: <BarChart3 className="w-5 h-5" />,
      count: 4
    },
    {
      id: 'datatable',
      title: 'Enterprise Data Table',
      description: 'Advanced data table with filtering, sorting, and bulk operations',
      icon: <Table className="w-5 h-5" />,
      count: 1
    },
    {
      id: 'dashboard',
      title: 'Dashboard Builder',
      description: 'Drag-and-drop dashboard customization',
      icon: <Layout className="w-5 h-5" />,
      count: 1
    }
  ];
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            Advanced Data Visualization & Interactive Components
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive suite of interactive charts, data tables, and dashboard components 
            built for enterprise risk management platforms.
          </p>
          
          <div className="flex items-center justify-center space-x-4">
            {demos.map(demo => (
              <Card 
                key={demo.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  activeDemo === demo.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setActiveDemo(demo.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {demo.icon}
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold">{demo.title}</h3>
                      <p className="text-sm text-gray-600">{demo.description}</p>
                      <Badge variant="outline" className="mt-1">
                        {demo.count} component{demo.count > 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        <Separator />
        
        {/* Demo Content */}
        <Tabs value={activeDemo} onValueChange={setActiveDemo}>
          {/* Interactive Charts */}
          <TabsContent value="charts" className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Interactive Chart Components</h2>
              <p className="text-gray-600">
                Advanced visualization components with real-time updates, drill-down capabilities, and interactive features.
              </p>
            </div>
            
            {/* Risk Heatmap */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-red-600" />
                      <span>Interactive Risk Heatmap</span>
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Dynamic risk visualization with drill-down capabilities and customizable views
                    </p>
                  </div>
                  <Badge variant="outline">Advanced</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <InteractiveRiskHeatmap height={400} />
              </CardContent>
            </Card>
            
            {/* Trend Analysis */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <LineChart className="w-5 h-5 text-blue-600" />
                      <span>Trend Analysis Chart</span>
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Time-series visualization with forecasting and multiple metric support
                    </p>
                  </div>
                  <Badge variant="outline">Time Series</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <TrendAnalysisChart height={400} />
              </CardContent>
            </Card>
            
            {/* Compliance Progress */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="w-5 h-5 text-green-600" />
                      <span>Compliance Progress Chart</span>
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Multi-framework compliance tracking with progress indicators
                    </p>
                  </div>
                  <Badge variant="outline">Compliance</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ComplianceProgressChart height={400} />
              </CardContent>
            </Card>
            
            {/* Real-Time Monitoring */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Activity className="w-5 h-5 text-purple-600" />
                      <span>Real-Time Monitoring Chart</span>
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Live data visualization with WebSocket updates and alert thresholds
                    </p>
                  </div>
                  <Badge variant="outline">Real-Time</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <RealTimeMonitoringChart height={400} />
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Enterprise Data Table */}
          <TabsContent value="datatable" className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Enterprise Data Table</h2>
              <p className="text-gray-600">
                Advanced data table with server-side operations, bulk actions, and inline editing capabilities.
              </p>
            </div>
            
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Table className="w-5 h-5 text-indigo-600" />
                      <span>Risk Management Data Table</span>
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Full-featured data table with advanced filtering, sorting, pagination, and bulk operations
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Badge variant="outline">Sortable</Badge>
                    <Badge variant="outline">Filterable</Badge>
                    <Badge variant="outline">Exportable</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <RiskDataTableExample />
              </CardContent>
            </Card>
            
            {/* Features Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Eye className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Advanced Filtering</h3>
                      <p className="text-sm text-gray-600">Multi-column search and filter capabilities</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Bulk Operations</h3>
                      <p className="text-sm text-gray-600">Select multiple rows for batch actions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Download className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Export Functions</h3>
                      <p className="text-sm text-gray-600">Export to CSV, JSON, and Excel formats</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Dashboard Builder */}
          <TabsContent value="dashboard" className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Custom Dashboard Builder</h2>
              <p className="text-gray-600">
                Drag-and-drop dashboard customization with responsive layouts and persistent configurations.
              </p>
            </div>
            
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Layout className="w-5 h-5 text-orange-600" />
                      <span>Interactive Dashboard Builder</span>
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Full-featured dashboard builder with widget library, drag-and-drop functionality, and responsive layouts
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Badge variant="outline">Drag & Drop</Badge>
                    <Badge variant="outline">Responsive</Badge>
                    <Badge variant="outline">Persistent</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[600px] border rounded-lg overflow-hidden">
                  <CustomDashboardBuilder />
                </div>
              </CardContent>
            </Card>
            
            {/* Dashboard Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Widget Library</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4 text-blue-600" />
                      <span>Interactive Charts (Bar, Line, Pie)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-green-600" />
                      <span>Metric Cards and KPI Displays</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-red-600" />
                      <span>Risk Management Widgets</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                      <span>Alert and Monitoring Components</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Advanced Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Responsive breakpoint management</li>
                    <li>• Widget resize and repositioning</li>
                    <li>• Layout persistence and sharing</li>
                    <li>• Export/import dashboard configurations</li>
                    <li>• Real-time preview and edit modes</li>
                    <li>• Mobile-optimized layouts</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Technical Implementation */}
        <Card>
          <CardHeader>
            <CardTitle>Technical Implementation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Chart Libraries</h4>
                <ul className="text-sm space-y-1">
                  <li>• Recharts for interactive charts</li>
                  <li>• D3.js for advanced visualizations</li>
                  <li>• Custom tooltip and legend components</li>
                  <li>• Real-time data binding</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Data Management</h4>
                <ul className="text-sm space-y-1">
                  <li>• React Table for advanced data operations</li>
                  <li>• Server-side pagination and sorting</li>
                  <li>• Advanced filtering and search</li>
                  <li>• Export functionality</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Dashboard System</h4>
                <ul className="text-sm space-y-1">
                  <li>• React DnD for drag-and-drop</li>
                  <li>• React Grid Layout for responsive grids</li>
                  <li>• Widget system architecture</li>
                  <li>• Configuration persistence</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-gray-600">
            Built with React, TypeScript, Tailwind CSS, and modern data visualization libraries.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Ready for production deployment in enterprise risk management platforms.
          </p>
        </div>
      </div>
    </div>
  );
} 