import React from 'react';
import { EnhancedDataTable, EnhancedDataTableColumn } from './enhanced-data-table';
import { EnhancedList, EnhancedListItem } from './enhanced-list';
import { SimpleBarChart, MetricCard } from './enhanced-charts';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { 
  TrendingUp, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  BarChart3,
  List,
  Table,
  PieChart
} from 'lucide-react';

// Sample Data
const sampleTableData = [
  {
    id: '1',
    title: 'Data Privacy Risk Assessment',
    status: 'active',
    priority: 'high',
    assignee: { name: 'Sarah Chen', email: 'sarah@company.com' },
    progress: 75,
    date: new Date('2024-01-15'),
    category: 'Privacy'
  },
  {
    id: '2',
    title: 'SOX Compliance Review',
    status: 'completed',
    priority: 'critical',
    assignee: { name: 'Mike Johnson', email: 'mike@company.com' },
    progress: 100,
    date: new Date('2024-01-10'),
    category: 'Compliance'
  },
  {
    id: '3',
    title: 'Vendor Risk Evaluation',
    status: 'pending',
    priority: 'medium',
    assignee: { name: 'Emma Davis', email: 'emma@company.com' },
    progress: 30,
    date: new Date('2024-01-20'),
    category: 'Vendor'
  },
  {
    id: '4',
    title: 'Security Control Testing',
    status: 'in_progress',
    priority: 'high',
    assignee: { name: 'Alex Rodriguez', email: 'alex@company.com' },
    progress: 60,
    date: new Date('2024-01-18'),
    category: 'Security'
  },
  {
    id: '5',
    title: 'Risk Register Update',
    status: 'draft',
    priority: 'low',
    assignee: { name: 'Lisa Wang', email: 'lisa@company.com' },
    progress: 15,
    date: new Date('2024-01-25'),
    category: 'Documentation'
  }
];

const sampleListData: EnhancedListItem[] = [
  {
    id: '1',
    title: 'Q4 Risk Assessment',
    description: 'Comprehensive assessment of operational, financial, and strategic risks for Q4 2024.',
    status: 'active',
    priority: 'high',
    assignee: { name: 'Sarah Chen', email: 'sarah@company.com' },
    date: new Date('2024-01-15'),
    progress: 75
  },
  {
    id: '2',
    title: 'Compliance Audit Preparation',
    description: 'Gathering evidence and documentation to support internal controls testing.',
    status: 'pending',
    priority: 'critical',
    assignee: { name: 'Mike Johnson', email: 'mike@company.com' },
    date: new Date('2024-01-20'),
    progress: 45
  },
  {
    id: '3',
    title: 'Vendor Security Review',
    description: 'Evaluating security controls and data protection measures of potential vendor.',
    status: 'completed',
    priority: 'medium',
    assignee: { name: 'Emma Davis', email: 'emma@company.com' },
    date: new Date('2024-01-12'),
    progress: 100
  }
];

const sampleChartData = [
  { label: 'Critical', value: 12, color: '#EF4444' },
  { label: 'High', value: 28, color: '#F59E0B' },
  { label: 'Medium', value: 45, color: '#199BEC' },
  { label: 'Low', value: 32, color: '#10B981' }
];

const sampleMetrics = [
  {
    title: 'Total Risks',
    value: 247,
    change: { value: 5.2, period: 'this month' },
    trend: 'up' as const,
    icon: AlertTriangle,
    color: '#EF4444'
  },
  {
    title: 'Controls Tested',
    value: 89,
    change: { value: 12.3, period: 'this week' },
    trend: 'up' as const,
    icon: Shield,
    color: '#10B981'
  },
  {
    title: 'Compliance Score',
    value: '94%',
    change: { value: 2.1, period: 'last quarter' },
    trend: 'up' as const,
    icon: CheckCircle,
    color: '#199BEC'
  },
  {
    title: 'Open Issues',
    value: 23,
    change: { value: -8.7, period: 'this month' },
    trend: 'down' as const,
    icon: TrendingUp,
    color: '#F59E0B'
  }
];

const tableColumns: EnhancedDataTableColumn[] = [
  {
    key: 'title',
    title: 'Title',
    type: 'text',
    sortable: true,
    filterable: true
  },
  {
    key: 'status',
    title: 'Status',
    type: 'status',
    sortable: true,
    filterable: true,
    filterOptions: [
      { label: 'Active', value: 'active' },
      { label: 'Completed', value: 'completed' },
      { label: 'Pending', value: 'pending' },
      { label: 'In Progress', value: 'in_progress' },
      { label: 'Draft', value: 'draft' }
    ]
  },
  {
    key: 'priority',
    title: 'Priority',
    type: 'risk',
    sortable: true,
    filterable: true,
    filterOptions: [
      { label: 'Critical', value: 'critical' },
      { label: 'High', value: 'high' },
      { label: 'Medium', value: 'medium' },
      { label: 'Low', value: 'low' }
    ]
  },
  {
    key: 'assignee',
    title: 'Assignee',
    type: 'user',
    sortable: true,
    filterable: true
  },
  {
    key: 'progress',
    title: 'Progress',
    type: 'progress',
    sortable: true
  },
  {
    key: 'date',
    title: 'Due Date',
    type: 'date',
    sortable: true
  },
  {
    key: 'category',
    title: 'Category',
    type: 'text',
    sortable: true,
    filterable: true
  },
  {
    key: 'actions',
    title: 'Actions',
    type: 'actions',
    align: 'right'
  }
];

export const DataTablesDemo = () => {
  const handleRowAction = (action: string, row: any) => {
    // console.log('Row action:', action, row);
  };

  const handleBulkAction = (action: string, rows: any[]) => {
    // console.log('Bulk action:', action, rows);
  };

  const handleListItemClick = (item: EnhancedListItem) => {
    // console.log('List item clicked:', item);
  };

  const handleListItemAction = (action: string, item: EnhancedListItem) => {
    // console.log('List item action:', action, item);
  };

  return (
    <div className="p-8 space-y-8 bg-white min-h-screen">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-[#191919] font-inter mb-4">
          Enhanced Data Components
        </h1>
        <p className="text-gray-600 font-inter max-w-2xl mx-auto">
          Redesigned data tables, lists, and charts with clean Notion-like minimalistic design.
          All components follow the standardized design system with consistent styling and interactions.
        </p>
      </div>

      {/* Metrics Grid */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-[#199BEC]" />
          <h2 className="text-xl font-bold text-[#191919] font-inter">Key Metrics</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {sampleMetrics.map((metric, index) => (
            <MetricCard
              key={index}
              title={metric.title}
              value={metric.value}
              change={metric.change}
              trend={metric.trend}
              icon={metric.icon}
              color={metric.color} />
          ))}
        </div>
      </section>

      {/* Charts Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <PieChart className="h-5 w-5 text-[#199BEC]" />
          <h2 className="text-xl font-bold text-[#191919] font-inter">Data Visualization</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SimpleBarChart
            title="Risk Distribution"
            subtitle="Breakdown of risks by severity level"
            data={sampleChartData}
            height={200} />
          <DaisyCard className="border border-gray-200" >
  <DaisyCardBody >
</DaisyCard>
              <DaisyCardTitle className="text-[#191919] font-inter">Chart Features</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <div className="space-y-3">
</DaisyCardBody>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-700 font-inter">Clean minimal design</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-700 font-inter">Consistent color palette</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-700 font-inter">Smooth animations</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-700 font-inter">Interactive legends</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-700 font-inter">Responsive design</span>
                </div>
              </div>
            </DaisyCardBody>
          </DaisyCard>
        </div>
      </section>

      {/* Enhanced Data Table */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <DaisyTable className="h-5 w-5 text-[#199BEC]" >
            <h2 className="text-xl font-bold text-[#191919] font-inter">Enhanced Data Table</h2>
        </div>
        <EnhancedDataTable
          title="Risk Management Tasks"
          subtitle="Comprehensive view of all risk management activities with advanced filtering and sorting"
          columns={tableColumns}
          data={sampleTableData}
          onRowAction={handleRowAction}
          onBulkAction={handleBulkAction}
          searchable={true}
          filterable={true}
          exportable={true}
          selectable={true}
          pagination={true}
          pageSize={5} />
      </section>

      {/* Enhanced List */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <List className="h-5 w-5 text-[#199BEC]" />
          <h2 className="text-xl font-bold text-[#191919] font-inter">Enhanced List</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EnhancedList
            title="Recent Activities"
            subtitle="Latest risk management activities and updates"
            items={sampleListData}
            variant="detailed"
            onItemAction={handleListItemAction}
            showStatus={true}
            showAssignee={true}
            showDate={true}
            showProgress={true} />
          <DaisyCard className="border border-gray-200" >
  <DaisyCardBody >
</DaisyTable>
              <DaisyCardTitle className="text-[#191919] font-inter">List Features</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <div className="space-y-4">
</DaisyCardBody>
                <div>
                  <h4 className="font-semibold text-sm text-[#191919] font-inter mb-2">Design Elements</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <DaisyBadge variant="success" className="text-xs">Status Badges</DaisyBadge>
                      <span className="text-xs text-gray-600 font-inter">Color-coded status indicators</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DaisyBadge variant="error" className="text-xs">Priority</DaisyBadge>
                      <span className="text-xs text-gray-600 font-inter">Risk level indicators</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DaisyBadge variant="outline" className="text-xs">Progress</DaisyBadge>
                      <span className="text-xs text-gray-600 font-inter">Visual progress bars</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-[#191919] font-inter mb-2">Interactions</h4>
                  <div className="space-y-1 text-xs text-gray-600 font-inter">
                    <div>• Hover effects with subtle animations</div>
                    <div>• Click to view details</div>
                    <div>• Actions menu on hover</div>
                    <div>• Multiple variants (compact, default, detailed)</div>
                  </div>
                </div>
              </div>
            </DaisyCardBody>
          </DaisyCard>
        </div>
      </section>

      {/* Design System Summary */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[#191919] font-inter">Design System Integration</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DaisyCard className="border border-gray-200" >
  <DaisyCardBody className="p-4" >
  </DaisyCard>
</DaisyCardBody>
              <h3 className="font-semibold text-sm text-[#191919] font-inter mb-2">Colors</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#191919] rounded"></div>
                  <span className="text-xs text-gray-600 font-inter">Primary Text #191919</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#199BEC] rounded"></div>
                  <span className="text-xs text-gray-600 font-inter">Primary Action #199BEC</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#FAFAFA] border border-gray-200 rounded"></div>
                  <span className="text-xs text-gray-600 font-inter">Card Background #FAFAFA</span>
                </div>
              </div>
            </DaisyCardBody>
          </DaisyCard>
          
          <DaisyCard className="border border-gray-200" >
  <DaisyCardBody className="p-4" >
  </DaisyCard>
</DaisyCardBody>
              <h3 className="font-semibold text-sm text-[#191919] font-inter mb-2">Typography</h3>
              <div className="space-y-1 text-xs text-gray-600 font-inter">
                <div>• Inter font family throughout</div>
                <div>• Consistent font weights</div>
                <div>• Proper hierarchy</div>
                <div>• Readable line heights</div>
              </div>
            </DaisyCardBody>
          </DaisyCard>
          
          <DaisyCard className="border border-gray-200" >
  <DaisyCardBody className="p-4" >
  </DaisyCard>
</DaisyCardBody>
              <h3 className="font-semibold text-sm text-[#191919] font-inter mb-2">Interactions</h3>
              <div className="space-y-1 text-xs text-gray-600 font-inter">
                <div>• 200ms transition duration</div>
                <div>• Subtle hover animations</div>
                <div>• Blue focus rings (#199BEC)</div>
                <div>• Consistent spacing (8px grid)</div>
              </div>
            </DaisyCardBody>
          </DaisyCard>
        </div>
      </section>
    </div>
  );
}; 