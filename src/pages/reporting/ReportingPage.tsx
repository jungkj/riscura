import { useState } from 'react';
import { 
  Calendar, 
  Download, 
  FileText, 
  Filter, 
  Plus, 
  RefreshCw, 
  Send
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel,
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  BarChart, 
  Bar, 
  PieChart as RechartsPie, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart as RechartsLine,
  Line
} from 'recharts';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyLabel } from '@/components/ui/DaisyLabel';
import { toast } from '@/hooks/use-toast';

export default function ReportingPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportPeriod, setReportPeriod] = useState('quarterly');
  
  // Mock data for charts
  const riskTrendData = [
    { month: 'Jan', high: 8, medium: 15, low: 20 },
    { month: 'Feb', high: 10, medium: 14, low: 18 },
    { month: 'Mar', high: 9, medium: 16, low: 22 },
    { month: 'Apr', high: 12, medium: 13, low: 17 },
    { month: 'May', high: 15, medium: 18, low: 14 },
    { month: 'Jun', high: 14, medium: 19, low: 16 },
  ];
  
  const riskCategoryData = [
    { name: 'Operational', value: 35, color: 'hsl(var(--chart-1))' },
    { name: 'Financial', value: 25, color: 'hsl(var(--chart-2))' },
    { name: 'Compliance', value: 20, color: 'hsl(var(--chart-3))' },
    { name: 'Strategic', value: 15, color: 'hsl(var(--chart-4))' },
    { name: 'Technology', value: 5, color: 'hsl(var(--chart-5))' },
  ];
  
  const controlEffectivenessData = [
    { name: 'High', value: 60, color: '#22c55e' },
    { name: 'Medium', value: 30, color: '#eab308' },
    { name: 'Low', value: 10, color: '#ef4444' },
  ];
  
  const complianceTrendData = [
    { month: 'Jan', score: 86 },
    { month: 'Feb', score: 88 },
    { month: 'Mar', score: 87 },
    { month: 'Apr', score: 90 },
    { month: 'May', score: 92 },
    { month: 'Jun', score: 94 },
  ];
  
  // Mock data for saved reports
  const savedReports = [
    {
      id: '1',
      name: 'Q1 Risk Summary',
      description: 'First quarter risk assessment summary',
      type: 'quarterly',
      createdAt: '2025-04-05T10:30:00Z',
      createdBy: 'John Smith'
    },
    {
      id: '2',
      name: 'Technology Risk Report',
      description: 'Analysis of technology risks and controls',
      type: 'custom',
      createdAt: '2025-03-20T15:45:00Z',
      createdBy: 'Sarah Johnson'
    },
    {
      id: '3',
      name: 'Compliance Status',
      description: 'Current compliance status against regulations',
      type: 'monthly',
      createdAt: '2025-04-01T09:15:00Z',
      createdBy: 'David Lee'
    },
    {
      id: '4',
      name: 'Executive Summary',
      description: 'High-level risk overview for leadership',
      type: 'quarterly',
      createdAt: '2025-04-02T14:30:00Z',
      createdBy: 'John Smith'
    },
  ];
  
  // Function to handle report generation
  const handleGenerateReport = () => {
    setIsGenerating(true);
    
    // Simulate report generation process
    setTimeout(() => {
      setIsGenerating(false);
      toast({
        title: 'Report Generated',
        description: 'Your report has been successfully generated.',
      });
    }, 2000);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reporting</h1>
          <p className="text-muted-foreground">
            Generate custom reports and analyze risk data.
          </p>
        </div>
        <DaisyButton onClick={() => handleGenerateReport()} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              New Report
            </>
          )}
        </DaisyButton>
      </div>
      
      <DaisyTabs defaultValue="builder" className="space-y-6">
        <DaisyTabsList>
          <DaisyTabsTrigger value="builder">Report Builder</DaisyTabsTrigger>
          <DaisyTabsTrigger value="library">Report Library</DaisyTabsTrigger>
          <DaisyTabsTrigger value="scheduled">Scheduled Reports</DaisyTabsTrigger>
        </DaisyTabsList>
        
        <DaisyTabsContent value="builder" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <DaisyCard className="lg:col-span-3">
              <DaisyCardHeader>
                <DaisyCardTitle>Report Preview</DaisyCardTitle>
                <DaisyCardDescription>
                  Preview of your report based on current selections
                </p>
              
              <DaisyCardContent className="space-y-6">
                {/* Risk by Category Chart */}
                <div className="rounded-lg border p-4">
                  <h3 className="text-lg font-medium mb-4">Risk by Category</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={riskCategoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {riskCategoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <DaisyTooltip />
                        <Legend />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Risk Trend Chart */}
                <div className="rounded-lg border p-4">
                  <h3 className="text-lg font-medium mb-4">Risk Trend</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={riskTrendData}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <DaisyTooltip />
                        <Legend />
                        <Bar dataKey="high" stackId="a" fill="#ef4444" name="High Risk" />
                        <Bar dataKey="medium" stackId="a" fill="#eab308" name="Medium Risk" />
                        <Bar dataKey="low" stackId="a" fill="#22c55e" name="Low Risk" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Control Effectiveness */}
                <div className="rounded-lg border p-4">
                  <h3 className="text-lg font-medium mb-4">Control Effectiveness</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="h-60">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPie>
                          <Pie
                            data={controlEffectivenessData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {controlEffectivenessData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <DaisyTooltip />
                          <Legend />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-3">Control Effectiveness Summary</h4>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm">High Effectiveness</span>
                            <span className="text-sm font-medium">60%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2.5">
                            <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '60%' }}></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm">Medium Effectiveness</span>
                            <span className="text-sm font-medium">30%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2.5">
                            <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: '30%' }}></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm">Low Effectiveness</span>
                            <span className="text-sm font-medium">10%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2.5">
                            <div className="bg-red-500 h-2.5 rounded-full" style={{ width: '10%' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Compliance Trend */}
                <div className="rounded-lg border p-4">
                  <h3 className="text-lg font-medium mb-4">Compliance Trend</h3>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLine
                        data={complianceTrendData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis domain={[80, 100]} />
                        <DaisyTooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#3b82f6"
                          activeDot={{ r: 8 }}
                          name="Compliance Score"
                        />
                      </RechartsLine>
                    </ResponsiveContainer>
                  </div>
                </div>
              </DaisyCardBody>
              <DaisyCardFooter className="justify-end space-x-2">
                <DaisyButton variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </DaisyButton>
                <DaisyButton variant="outline">
                  <Send className="h-4 w-4 mr-2" />
                  Share
                </DaisyButton>
                <DaisyButton onClick={() => handleGenerateReport()} disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Report'
                  )}
                </DaisyButton>
              </CardFooter>
            </DaisyCard>
            
            <DaisyCard className="lg:col-span-1">
              <DaisyCardHeader>
                <DaisyCardTitle>Report Settings</DaisyCardTitle>
              
              <DaisyCardContent className="space-y-4">
                <div className="space-y-2">
                  <DaisyLabel>Report Title</DaisyLabel>
                  <input
                    type="text"
                    placeholder="Enter report title"
                    className="w-full px-3 py-2 border rounded-md"
                    defaultValue="Quarterly Risk Assessment"
                  />
                </div>
                
                <div className="space-y-2">
                  <DaisyLabel>Report Type</DaisyLabel>
                  <DaisySelect defaultValue="executive">
                    <DaisySelectTrigger>
                      <DaisySelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <DaisySelectContent>
                      <DaisySelectItem value="executive">Executive Summary</SelectItem>
                      <DaisySelectItem value="detailed">Detailed Analysis</SelectItem>
                      <DaisySelectItem value="compliance">Compliance Report</SelectItem>
                    </SelectContent>
                  </DaisySelect>
                </div>
                
                <div className="space-y-2">
                  <DaisyLabel>Time Period</DaisyLabel>
                  <DaisySelect 
                    defaultValue={reportPeriod}
                    onValueChange={setReportPeriod}
                  >
                    <DaisySelectTrigger>
                      <DaisySelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <DaisySelectContent>
                      <DaisySelectItem value="monthly">Last Month</SelectItem>
                      <DaisySelectItem value="quarterly">Last Quarter</SelectItem>
                      <DaisySelectItem value="yearly">Last Year</SelectItem>
                      <DaisySelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </DaisySelect>
                </div>
                
                <div className="space-y-2">
                  <DaisyLabel>Report Sections</DaisyLabel>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="risk-summary" className="rounded" defaultChecked />
                      <label htmlFor="risk-summary" className="text-sm">Risk Summary</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="control-effectiveness" className="rounded" defaultChecked />
                      <label htmlFor="control-effectiveness" className="text-sm">Control Effectiveness</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="compliance-status" className="rounded" defaultChecked />
                      <label htmlFor="compliance-status" className="text-sm">Compliance Status</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="risk-trends" className="rounded" defaultChecked />
                      <label htmlFor="risk-trends" className="text-sm">Risk Trends</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="recommendations" className="rounded" defaultChecked />
                      <label htmlFor="recommendations" className="text-sm">Recommendations</label>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <DaisyLabel>Risk Categories</DaisyLabel>
                  <DaisySelect defaultValue="all">
                    <DaisySelectTrigger>
                      <DaisySelectValue placeholder="Select categories" />
                    </SelectTrigger>
                    <DaisySelectContent>
                      <DaisySelectItem value="all">All Categories</SelectItem>
                      <DaisySelectItem value="operational">Operational</SelectItem>
                      <DaisySelectItem value="financial">Financial</SelectItem>
                      <DaisySelectItem value="compliance">Compliance</SelectItem>
                      <DaisySelectItem value="strategic">Strategic</SelectItem>
                      <DaisySelectItem value="technology">Technology</SelectItem>
                    </SelectContent>
                  </DaisySelect>
                </div>
                
                <div className="pt-4">
                  <DaisyButton className="w-full" onClick={() => handleGenerateReport()} disabled={isGenerating}>
                    {isGenerating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Generate Report'
                    )}
                  </DaisyButton>
                </div>
              </DaisyCardBody>
            </DaisyCard>
          </div>
        </DaisyTabsContent>
        
        <DaisyTabsContent value="library" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Saved Reports</h2>
            <div className="flex gap-2">
              <DaisyDropdownMenu>
                <DaisyDropdownMenuTrigger asChild>
                  <DaisyButton variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </DaisyButton>
                </DaisyDropdownMenuTrigger>
                <DaisyDropdownMenuContent align="end">
                  <DaisyDropdownMenuLabel>Filter by Type</DaisyDropdownMenuLabel>
                  <DaisyDropdownMenuSeparator />
                  <DaisyDropdownMenuItem>All Reports</DaisyDropdownMenuItem>
                  <DaisyDropdownMenuItem>Monthly Reports</DaisyDropdownMenuItem>
                  <DaisyDropdownMenuItem>Quarterly Reports</DaisyDropdownMenuItem>
                  <DaisyDropdownMenuItem>Custom Reports</DaisyDropdownMenuItem>
                </DaisyDropdownMenuContent>
              </DaisyDropdownMenu>
              <DaisyButton size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Report
              </DaisyButton>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedReports.map((report) => (
              <DaisyCard key={report.id}>
                <DaisyCardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <DaisyCardTitle>{report.name}</DaisyCardTitle>
                    <DaisyBadge variant="outline">
                      {report.type === 'monthly' ? 'Monthly' : 
                       report.type === 'quarterly' ? 'Quarterly' : 'Custom'}
                    </DaisyBadge>
                  </div>
                  <DaisyCardDescription>{report.description}</p>
                
                <DaisyCardContent className="pb-2">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <DaisyCalendar className="h-4 w-4" />
                    <span>
                      Created on {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <FileText className="h-4 w-4" />
                    <span>By {report.createdBy}</span>
                  </div>
                </DaisyCardBody>
                <DaisyCardFooter>
                  <div className="flex gap-2 w-full">
                    <DaisyButton variant="outline" className="flex-1">
                      <FileText className="h-4 w-4 mr-2" />
                      View
                    </DaisyButton>
                    <DaisyButton variant="outline" className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </DaisyButton>
                  </div>
                </CardFooter>
              </DaisyCard>
            ))}
          </div>
        </DaisyTabsContent>
        
        <DaisyTabsContent value="scheduled" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Scheduled Reports</h2>
            <DaisyButton size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Schedule Report
            </DaisyButton>
          </div>
          
          <DaisyCard>
            <DaisyCardContent className="p-0">
              <DaisyTable>
                <DaisyTableHeader>
                  <DaisyTableRow>
                    <DaisyTableHead>Report Name</DaisyTableHead>
                    <DaisyTableHead>Frequency</DaisyTableHead>
                    <DaisyTableHead>Recipients</DaisyTableHead>
                    <DaisyTableHead>Next Run</DaisyTableHead>
                    <DaisyTableHead>Status</DaisyTableHead>
                    <DaisyTableHead className="text-right">Actions</DaisyTableHead>
                  </DaisyTableRow>
                </DaisyTableHeader>
                <DaisyTableBody>
                  <DaisyTableRow>
                    <DaisyTableCell>
                      <div className="font-medium">Monthly Risk Report</div>
                      <div className="text-sm text-muted-foreground">
                        Summary of all risks and controls
                      </div>
                    </DaisyTableCell>
                    <DaisyTableCell>
                      <DaisyBadge variant="outline">Monthly</DaisyBadge>
                    </DaisyTableCell>
                    <DaisyTableCell>
                      <div className="flex -space-x-2">
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-[10px] text-white">JS</div>
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-[10px] text-white">RL</div>
                        <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center text-[10px] text-white">+3</div>
                      </div>
                    </DaisyTableCell>
                    <DaisyTableCell>May 1, 2025</DaisyTableCell>
                    <DaisyTableCell>
                      <DaisyBadge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">Active</DaisyBadge>
                    </DaisyTableCell>
                    <DaisyTableCell className="text-right">
                      <DaisyDropdownMenu>
                        <DaisyDropdownMenuTrigger asChild>
                          <DaisyButton variant="ghost" size="sm">
                            <span className="sr-only">Open menu</span>
                            <Filter className="h-4 w-4" />
                          </DaisyButton>
                        </DaisyDropdownMenuTrigger>
                        <DaisyDropdownMenuContent align="end">
                          <DaisyDropdownMenuItem>Edit Schedule</DaisyDropdownMenuItem>
                          <DaisyDropdownMenuItem>Run Now</DaisyDropdownMenuItem>
                          <DaisyDropdownMenuItem>Pause Schedule</DaisyDropdownMenuItem>
                          <DaisyDropdownMenuItem className="text-red-600">Delete</DaisyDropdownMenuItem>
                        </DaisyDropdownMenuContent>
                      </DaisyDropdownMenu>
                    </DaisyTableCell>
                  </DaisyTableRow>
                  
                  <DaisyTableRow>
                    <DaisyTableCell>
                      <div className="font-medium">Quarterly Compliance Status</div>
                      <div className="text-sm text-muted-foreground">
                        Regulatory compliance overview
                      </div>
                    </DaisyTableCell>
                    <DaisyTableCell>
                      <DaisyBadge variant="outline">Quarterly</DaisyBadge>
                    </DaisyTableCell>
                    <DaisyTableCell>
                      <div className="flex -space-x-2">
                        <div className="w-6 h-6 rounded-full bg-[#191919] flex items-center justify-center text-[10px] text-white">MG</div>
                        <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-[10px] text-white">DL</div>
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-[10px] text-white">JS</div>
                      </div>
                    </DaisyTableCell>
                    <DaisyTableCell>July 1, 2025</DaisyTableCell>
                    <DaisyTableCell>
                      <DaisyBadge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">Active</DaisyBadge>
                    </DaisyTableCell>
                    <DaisyTableCell className="text-right">
                      <DaisyDropdownMenu>
                        <DaisyDropdownMenuTrigger asChild>
                          <DaisyButton variant="ghost" size="sm">
                            <span className="sr-only">Open menu</span>
                            <Filter className="h-4 w-4" />
                          </DaisyButton>
                        </DaisyDropdownMenuTrigger>
                        <DaisyDropdownMenuContent align="end">
                          <DaisyDropdownMenuItem>Edit Schedule</DaisyDropdownMenuItem>
                          <DaisyDropdownMenuItem>Run Now</DaisyDropdownMenuItem>
                          <DaisyDropdownMenuItem>Pause Schedule</DaisyDropdownMenuItem>
                          <DaisyDropdownMenuItem className="text-red-600">Delete</DaisyDropdownMenuItem>
                        </DaisyDropdownMenuContent>
                      </DaisyDropdownMenu>
                    </DaisyTableCell>
                  </DaisyTableRow>
                  
                  <DaisyTableRow>
                    <DaisyTableCell>
                      <div className="font-medium">Executive Dashboard</div>
                      <div className="text-sm text-muted-foreground">
                        High-level overview for leadership
                      </div>
                    </DaisyTableCell>
                    <DaisyTableCell>
                      <DaisyBadge variant="outline">Weekly</DaisyBadge>
                    </DaisyTableCell>
                    <DaisyTableCell>
                      <div className="flex -space-x-2">
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-[10px] text-white">RL</div>
                        <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-[10px] text-white">+5</div>
                      </div>
                    </DaisyTableCell>
                    <DaisyTableCell>Apr 25, 2025</DaisyTableCell>
                    <DaisyTableCell>
                      <DaisyBadge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300">Paused</DaisyBadge>
                    </DaisyTableCell>
                    <DaisyTableCell className="text-right">
                      <DaisyDropdownMenu>
                        <DaisyDropdownMenuTrigger asChild>
                          <DaisyButton variant="ghost" size="sm">
                            <span className="sr-only">Open menu</span>
                            <Filter className="h-4 w-4" />
                          </DaisyButton>
                        </DaisyDropdownMenuTrigger>
                        <DaisyDropdownMenuContent align="end">
                          <DaisyDropdownMenuItem>Edit Schedule</DaisyDropdownMenuItem>
                          <DaisyDropdownMenuItem>Run Now</DaisyDropdownMenuItem>
                          <DaisyDropdownMenuItem>Resume Schedule</DaisyDropdownMenuItem>
                          <DaisyDropdownMenuItem className="text-red-600">Delete</DaisyDropdownMenuItem>
                        </DaisyDropdownMenuContent>
                      </DaisyDropdownMenu>
                    </DaisyTableCell>
                  </DaisyTableRow>
                </DaisyTableBody>
              </DaisyTable>
            </DaisyCardBody>
          </DaisyCard>
        </DaisyTabsContent>
      </DaisyTabs>
    </div>
  );
}