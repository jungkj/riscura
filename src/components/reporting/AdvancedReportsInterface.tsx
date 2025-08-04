'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { MainContentArea, ContentSection, ContentCard } from '@/components/layout/MainContentArea';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisySeparator } from '@/components/ui/DaisySeparator';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  Filter,
  Download,
  Share,
  RefreshCw,
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Search,
  CheckCircle,
  AlertTriangle,
  Clock,
  Users,
  Shield,
  Target,
  FileText,
  Activity,
} from 'lucide-react';

// ========== TYPES ==========
export interface FilterConfig {
  id: string;
  label: string;
  type: 'select' | 'multiselect' | 'daterange' | 'search';
  options?: Array<{ value: string; label: string; count?: number }>;
  value?: any;
  placeholder?: string;
}

export interface ChartConfig {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'donut' | 'heatmap' | 'progress';
  data: any;
  height?: number;
  showLegend?: boolean;
  showExport?: boolean;
}

export interface DataTableConfig {
  columns: Array<{
    id: string;
    label: string;
    type?: 'text' | 'status' | 'date' | 'number' | 'progress' | 'actions';
    sortable?: boolean;
    width?: string;
  }>;
  data: Array<Record<string, any>>;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
  };
  selection?: {
    enabled: boolean;
    selectedRows: string[];
  };
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  filters: FilterConfig[];
  charts: ChartConfig[];
  tables?: DataTableConfig[];
  lastUpdated: Date;
}

// ========== SAMPLE DATA ==========
const sampleFilters: FilterConfig[] = [
  {
    id: 'framework',
    label: 'Framework',
    type: 'multiselect',
    placeholder: 'Select frameworks',
    options: [
      { value: 'soc2', label: 'SOC 2', count: 45 },
      { value: 'iso27001', label: 'ISO 27001', count: 38 },
      { value: 'gdpr', label: 'GDPR', count: 52 },
      { value: 'hipaa', label: 'HIPAA', count: 23 },
      { value: 'pci', label: 'PCI DSS', count: 29 },
    ],
  },
  {
    id: 'risk-level',
    label: 'Risk Level',
    type: 'select',
    placeholder: 'All risk levels',
    options: [
      { value: 'critical', label: 'Critical', count: 8 },
      { value: 'high', label: 'High', count: 23 },
      { value: 'medium', label: 'Medium', count: 45 },
      { value: 'low', label: 'Low', count: 89 },
    ],
  },
  {
    id: 'date-range',
    label: 'Date Range',
    type: 'daterange',
    placeholder: 'Select date range',
  },
  {
    id: 'search',
    label: 'Search',
    type: 'search',
    placeholder: 'Search reports...',
  },
];

const sampleCharts: ChartConfig[] = [
  {
    id: 'compliance-trends',
    title: 'Compliance Trends Over Time',
    type: 'line',
    height: 300,
    showLegend: true,
    showExport: true,
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'SOC 2',
          data: [85, 87, 91, 93, 95, 96],
          color: '#6366F1',
        },
        {
          label: 'ISO 27001',
          data: [78, 82, 86, 88, 92, 94],
          color: '#10B981',
        },
        {
          label: 'GDPR',
          data: [92, 94, 96, 97, 98, 98],
          color: '#F59E0B',
        },
      ],
    },
  },
  {
    id: 'risk-distribution',
    title: 'Risk Distribution by Category',
    type: 'donut',
    height: 280,
    showLegend: true,
    showExport: true,
    data: {
      labels: ['Cybersecurity', 'Operational', 'Financial', 'Regulatory', 'Strategic'],
      datasets: [
        {
          data: [35, 25, 15, 15, 10],
          colors: ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'],
        },
      ],
    },
  },
  {
    id: 'control-effectiveness',
    title: 'Control Effectiveness',
    type: 'bar',
    height: 280,
    showLegend: false,
    showExport: true,
    data: {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      datasets: [
        {
          label: 'Effective',
          data: [92, 94, 95, 97],
          color: '#10B981',
        },
        {
          label: 'Needs Improvement',
          data: [8, 6, 5, 3],
          color: '#F59E0B',
        },
      ],
    },
  },
  {
    id: 'framework-progress',
    title: 'Framework Implementation Progress',
    type: 'progress',
    height: 200,
    showExport: true,
    data: [
      { label: 'SOC 2 Type II', value: 95, target: 100, color: '#10B981' },
      { label: 'ISO 27001', value: 87, target: 95, color: '#3B82F6' },
      { label: 'GDPR', value: 98, target: 100, color: '#10B981' },
      { label: 'HIPAA', value: 72, target: 90, color: '#F59E0B' },
      { label: 'PCI DSS', value: 89, target: 95, color: '#3B82F6' },
    ],
  },
];

const sampleTableData: DataTableConfig = {
  columns: [
    { id: 'control', label: 'Control', type: 'text', sortable: true, width: '25%' },
    { id: 'framework', label: 'Framework', type: 'text', sortable: true, width: '15%' },
    { id: 'status', label: 'Status', type: 'status', sortable: true, width: '15%' },
    { id: 'risk-level', label: 'Risk Level', type: 'status', sortable: true, width: '12%' },
    { id: 'owner', label: 'Owner', type: 'text', sortable: true, width: '15%' },
    { id: 'last-review', label: 'Last Review', type: 'date', sortable: true, width: '12%' },
    { id: 'actions', label: 'Actions', type: 'actions', width: '6%' },
  ],
  data: [
    {
      id: 'ctrl-001',
      control: 'Access Control Management',
      framework: 'SOC 2',
      status: 'compliant',
      'risk-level': 'low',
      owner: 'John Smith',
      'last-review': '2024-01-15',
    },
    {
      id: 'ctrl-002',
      control: 'Data Encryption at Rest',
      framework: 'GDPR',
      status: 'non-compliant',
      'risk-level': 'high',
      owner: 'Sarah Johnson',
      'last-review': '2024-01-10',
    },
    {
      id: 'ctrl-003',
      control: 'Incident Response Plan',
      framework: 'ISO 27001',
      status: 'partially-compliant',
      'risk-level': 'medium',
      owner: 'Mike Davis',
      'last-review': '2024-01-20',
    },
    // Add more sample data...
  ],
  pagination: {
    page: 1,
    pageSize: 10,
    total: 47,
  },
  selection: {
    enabled: true,
    selectedRows: [],
  },
};

// ========== FILTER BAR COMPONENT ==========
const FilterBar: React.FC<{
  filters: FilterConfig[];
  onFilterChange: (filterId: string, value: any) => void;
  onExport: () => void;
  onRefresh: () => void;
}> = ({ filters, onFilterChange, onExport, onRefresh }) => {
  return (
    <div className="bg-white border border-border rounded-lg p-enterprise-4 mb-enterprise-6">
      <div className="flex flex-wrap items-center gap-enterprise-4">
        {/* Date Range Preset */}
        <div className="flex items-center space-x-enterprise-2">
          <DaisyCalendar className="h-4 w-4 text-text-tertiary" />
<DaisySelect defaultValue="last-30-days" >
              <DaisySelectTrigger className="w-40">
                <DaisySelectValue />
</DaisyCalendar>
            <DaisySelectContent >
                <DaisySelectItem value="today">Today</DaisySelectItem>
              <DaisySelectItem value="yesterday">Yesterday</DaisySelectItem>
              <DaisySelectItem value="last-7-days">Last 7 days</DaisySelectItem>
              <DaisySelectItem value="last-30-days">Last 30 days</DaisySelectItem>
              <DaisySelectItem value="last-90-days">Last 90 days</DaisySelectItem>
              <DaisySelectItem value="last-year">Last year</DaisySelectItem>
              <DaisySelectItem value="custom">Custom range</DaisySelectItem>
            </DaisySelectContent>
          </DaisySelect>
        </div>

        <DaisySeparator orientation="vertical" className="h-6" />
{/* Dynamic Filters */}
        {filters.map((filter) => (
          <div key={filter.id} className="flex items-center space-x-enterprise-2">
            <span className="text-body-sm text-text-secondary font-medium">
              {filter.label}:
            </span>
            {filter.type === 'select' && (
              <DaisySelect onValueChange={(value) => onFilterChange(filter.id, value)} />
                <DaisySelectTrigger className="w-40">
                    <DaisySelectValue placeholder={filter.placeholder} />
</DaisySeparator>
                <DaisySelectContent >
                    {filter.options?.map((option) => (
                    <DaisySelectItem key={option.value} value={option.value} >
                        <div className="flex items-center justify-between w-full">
                        <span>{option.label}</span>
                        {option.count && (
                          <DaisyBadge variant="secondary" className="ml-enterprise-2 text-caption" >
  {option.count}
</DaisySelectContent>
                          </DaisyBadge>
                        )}
                      </div>
                    </DaisySelectItem>
                  ))}
                </DaisySelectContent>
              </DaisySelect>
            )}
            {filter.type === 'search' && (
              <div className="relative">
                <Search className="absolute left-enterprise-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                <input
                  type="text"
                  placeholder={filter.placeholder}
                  className="pl-8 pr-enterprise-3 py-enterprise-2 border border-border rounded-lg text-body-sm w-64"
                  onChange={(e) => onFilterChange(filter.id, e.target.value)} />
              </div>
            )}
          </div>
        ))}

        <div className="ml-auto flex items-center space-x-enterprise-2">
          <DaisyButton variant="outline" size="sm" onClick={onRefresh} >
  <RefreshCw className="h-4 w-4 mr-enterprise-1" />
</DaisyButton>
            Refresh
          </DaisyButton>
          <DaisyButton variant="outline" size="sm" >
  <Filter className="h-4 w-4 mr-enterprise-1" />
</DaisyButton>
            More Filters
          </DaisyButton>
          <DaisyButton variant="outline" size="sm" onClick={onExport} >
  <Download className="h-4 w-4 mr-enterprise-1" />
</DaisyButton>
            Export
          </DaisyButton>
          <DaisyButton variant="outline" size="sm" >
  <Share className="h-4 w-4 mr-enterprise-1" />
</DaisyButton>
            Share
          </DaisyButton>
        </div>
      </div>
    </div>
  );
};

// ========== CHART COMPONENT ==========
const ChartPlaceholder: React.FC<{ chart: ChartConfig }> = ({ chart }) => {
  const getChartIcon = (type: string) => {
    switch (type) {
      case 'line': return LineChart;
      case 'bar': return BarChart3;
      case 'donut': return PieChart;
      case 'progress': return Target;
      default: return BarChart3;
    }
  };

  const ChartIcon = getChartIcon(chart.type);

  return (
    <ContentCard
      title={chart.title}
      action={chart.showExport ? {
        label: 'Export',
        onClick: () => console.log('Export chart:', chart.id),
        icon: Download,
        variant: 'ghost',
      } : undefined}
      className="shadow-notion-sm"
    >
      <div 
        className="flex items-center justify-center bg-surface-secondary rounded-lg"
        style={{ height: chart.height || 280 }}
      >
        <div className="text-center">
          <ChartIcon className="h-12 w-12 text-text-tertiary mx-auto mb-enterprise-2" />
          <p className="text-body-sm text-text-secondary font-medium">{chart.type.charAt(0).toUpperCase() + chart.type.slice(1)} Chart</p>
          <p className="text-caption text-text-tertiary">Visualization ready for integration</p>
        </div>
      </div>

      {chart.type === 'progress' && chart.data && (
        <div className="mt-enterprise-4 space-y-enterprise-3">
          {chart.data.map((item: any, index: number) => (
            <div key={index} className="space-y-enterprise-1">
              <div className="flex items-center justify-between text-body-sm">
                <span className="text-text-primary font-medium">{item.label}</span>
                <span className="text-text-secondary">{item.value}%</span>
              </div>
              <div className="flex items-center space-x-enterprise-2">
                <div className="flex-1 bg-surface-secondary rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(item.value / 100) * 100}%`,
                      backgroundColor: item.color,
                    }} />
                </div>
                <span className="text-caption text-text-tertiary">
                  Target: {item.target}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </ContentCard>
  );
};

// ========== DATA TABLE COMPONENT ==========
const DataTable: React.FC<{
  config: DataTableConfig;
  onSort: (columnId: string, direction: 'asc' | 'desc') => void;
  onRowSelect: (rowId: string, selected: boolean) => void;
  onRowAction: (rowId: string, action: string) => void;
  onPageChange: (page: number) => void;
}> = ({ config, onSort, onRowSelect, onRowAction, onPageChange }) => {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const handleSort = (columnId: string) => {
    const newDirection = sortColumn === columnId && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(columnId);
    setSortDirection(newDirection);
    onSort(columnId, newDirection);
  };

  const getStatusBadge = (value: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'compliant': 'default',
      'non-compliant': 'destructive',
      'partially-compliant': 'secondary',
      'critical': 'destructive',
      'high': 'destructive',
      'medium': 'secondary',
      'low': 'outline',
    };

    const colors: Record<string, string> = {
      'compliant': 'text-semantic-success',
      'non-compliant': 'text-semantic-error',
      'partially-compliant': 'text-semantic-warning',
      'critical': 'text-semantic-error',
      'high': 'text-semantic-error',
      'medium': 'text-semantic-warning',
      'low': 'text-text-secondary',
    };

    return (
      <DaisyBadge variant={variants[value] || 'outline'} className={cn("text-caption", colors[value])} >
  {value.replace('-', ' ')}
</DaisyBadge>
      </DaisyBadge>
    );
  };

  const renderCellContent = (column: any, value: any, row: any) => {
    switch (column.type) {
      case 'status':
        return getStatusBadge(value);
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : value;
      case 'actions':
        return (
          <div className="flex items-center space-x-enterprise-1">
            <DaisyButton
              variant="ghost"
              size="sm"
              onClick={() => onRowAction(row.id, 'view')}
              className="h-6 w-6 p-0" />
              <Eye className="h-3 w-3" />
            </DaisyButton>
            <DaisyButton
              variant="ghost"
              size="sm"
              onClick={() => onRowAction(row.id, 'edit')}
              className="h-6 w-6 p-0" />
              <Edit className="h-3 w-3" />
            </DaisyButton>
            <DaisyButton
              variant="ghost"
              size="sm"
              onClick={() => onRowAction(row.id, 'more')}
              className="h-6 w-6 p-0" />
              <MoreHorizontal className="h-3 w-3" />
            </DaisyButton>
          </div>
        );
      default:
        return value;
    }
  };

  return (
    <ContentCard className="shadow-notion-sm">
      <div className="space-y-enterprise-4">
        {/* Table Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-enterprise-4">
            <h3 className="text-body-base font-semibold text-text-primary">
              Compliance Controls
            </h3>
            <DaisyBadge variant="outline" className="text-caption" >
  {config.pagination?.total || config.data.length} items
</DaisyBadge>
            </DaisyBadge>
          </div>
          
          <div className="flex items-center space-x-enterprise-2">
            {config.selection?.selectedRows && config.selection.selectedRows.length > 0 && (
              <div className="flex items-center space-x-enterprise-2">
                <span className="text-body-sm text-text-secondary">
                  {config.selection.selectedRows.length} selected
                </span>
                <DaisyButton variant="outline" size="sm">
          Bulk Actions

        </DaisyButton>
                </DaisyButton>
              </div>
            )}
            <DaisyButton variant="outline" size="sm" >
  <Filter className="h-4 w-4 mr-enterprise-1" />
</DaisyButton>
              Filter
            </DaisyButton>
          </div>
        </div>

        {/* Table */}
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Table Header */}
              <thead className="bg-surface-secondary border-b border-border">
                <tr>
                  {config.selection?.enabled && (
                    <th className="w-8 px-enterprise-3 py-enterprise-3">
                      <input
                        type="checkbox"
                        className="rounded border-border"
                        onChange={(e) => {
                          // Handle select all
                        }} />
                    </th>
                  )}
                  {config.columns.map((column) => (
                    <th
                      key={column.id}
                      className={cn(
                        "text-left px-enterprise-3 py-enterprise-3 text-body-sm font-medium text-text-primary",
                        column.sortable && "cursor-pointer hover:bg-surface-primary",
                        column.width && `w-[${column.width}]`
                      )}
                      onClick={() => column.sortable && handleSort(column.id)}
                    >
                      <div className="flex items-center space-x-enterprise-1">
                        <span>{column.label}</span>
                        {column.sortable && (
                          <ArrowUpDown className="h-3 w-3 text-text-tertiary" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Table Body */}
              <tbody>
                {config.data.map((row, index) => (
                  <tr
                    key={row.id || index}
                    className="border-b border-border last:border-b-0 hover:bg-surface-secondary/50 transition-colors"
                  >
                    {config.selection?.enabled && (
                      <td className="px-enterprise-3 py-enterprise-3">
                        <input
                          type="checkbox"
                          className="rounded border-border"
                          checked={config.selection?.selectedRows?.includes(row.id)}
                          onChange={(e) => onRowSelect(row.id, e.target.checked)} />
                      </td>
                    )}
                    {config.columns.map((column) => (
                      <td
                        key={column.id}
                        className="px-enterprise-3 py-enterprise-3 text-body-sm text-text-primary"
                      >
                        {renderCellContent(column, row[column.id], row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {config.pagination && (
          <div className="flex items-center justify-between">
            <div className="text-body-sm text-text-secondary">
              Showing {((config.pagination.page - 1) * config.pagination.pageSize) + 1} to{' '}
              {Math.min(config.pagination.page * config.pagination.pageSize, config.pagination.total)} of{' '}
              {config.pagination.total} results
            </div>
            
            <div className="flex items-center space-x-enterprise-2">
              <DaisyButton
                variant="outline"
                size="sm"
                disabled={config.pagination.page === 1}
                onClick={() =>
          onPageChange(config.pagination!.page - 1)} />
                Previous
              
        </DaisyButton>
              
              <div className="flex items-center space-x-enterprise-1">
                {[1, 2, 3, 4, 5].map((page) => (
                  <DaisyButton
                    key={page}
                    variant={config.pagination!.page === page ? 'default' : 'outline'}
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() =>
          onPageChange(page)} />
                    {page}
                  
        </DaisyButton>
                ))}
              </div>
              
              <DaisyButton
                variant="outline"
                size="sm"
                disabled={config.pagination.page * config.pagination.pageSize>
          = config.pagination.total}
                onClick={() => onPageChange(config.pagination!.page + 1)} />
                Next
              
        </DaisyButton>
            </div>
          </div>
        )}
      </div>
    </ContentCard>
  );
};

// ========== MAIN REPORTS INTERFACE COMPONENT ==========
export const AdvancedReportsInterface: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [filters, setFilters] = useState<Record<string, any>>({});

  const handleFilterChange = (filterId: string, value: any) => {
    setFilters(prev => ({ ...prev, [filterId]: value }));
  };

  const handleExport = () => {
    console.log('Exporting report...');
  };

  const handleRefresh = () => {
    console.log('Refreshing data...');
  };

  const handleSort = (columnId: string, direction: 'asc' | 'desc') => {
    console.log('Sorting:', columnId, direction);
  };

  const handleRowSelect = (rowId: string, selected: boolean) => {
    console.log('Row selection:', rowId, selected);
  };

  const handleRowAction = (rowId: string, action: string) => {
    console.log('Row action:', rowId, action);
  };

  const handlePageChange = (page: number) => {
    console.log('Page change:', page);
  };

  return (
    <MainContentArea
      title="Analytics & Reports"
      subtitle="Comprehensive reporting and analytics for compliance and risk management"
      breadcrumbs={[
        { label: 'Reports', href: '/dashboard/reports' },
        { label: 'Analytics Dashboard', current: true },
      ]}
      primaryAction={{
        label: 'Create Report',
        onClick: () => console.log('Create report'),
        icon: FileText,
      }}
      secondaryActions={[
        {
          label: 'Schedule',
          onClick: () => console.log('Schedule report'),
          icon: Clock,
          variant: 'outline',
        },
        {
          label: 'Templates',
          onClick: () => console.log('View templates'),
          icon: FileText,
          variant: 'outline',
        },
      ]}
      stats={[
        {
          label: 'active reports',
          value: 24,
          trend: 'up',
          trendValue: '12%',
          variant: 'default',
        },
        {
          label: 'compliance score',
          value: '94.2%',
          trend: 'up',
          trendValue: '2.1%',
          variant: 'success',
        },
        {
          label: 'critical findings',
          value: 3,
          trend: 'down',
          trendValue: '40%',
          variant: 'destructive',
        },
      ]}
      maxWidth="2xl"
    >
      {/* Filter Bar */}
      <FilterBar
        filters={sampleFilters}
        onFilterChange={handleFilterChange}
        onExport={handleExport}
        onRefresh={handleRefresh} />

      {/* Content Tabs */}
      <DaisyTabs value={activeTab} onValueChange={setActiveTab} >
          <DaisyTabsList className="mb-enterprise-6" >
            <DaisyTabsTrigger value="dashboard">Dashboard</DaisyTabs>
          <DaisyTabsTrigger value="compliance">Compliance</DaisyTabsTrigger>
          <DaisyTabsTrigger value="risk">Risk Analysis</DaisyTabsTrigger>
          <DaisyTabsTrigger value="audit">Audit Reports</DaisyTabsTrigger>
          <DaisyTabsTrigger value="custom">Custom Reports</DaisyTabsTrigger>
        </DaisyTabsList>

        <DaisyTabsContent value="dashboard" className="space-y-enterprise-6" >
            {/* Charts Grid */}
          <ContentSection 
            title="Key Metrics Overview"
            subtitle="Real-time analytics and performance indicators"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-enterprise-6">
              {sampleCharts.map((chart) => (
                <ChartPlaceholder key={chart.id} chart={chart} />
              ))}
            </div>
          </ContentSection>

          {/* Data Table */}
          <ContentSection 
            title="Detailed Analysis"
            subtitle="Comprehensive data view with filtering and export capabilities"
          >
            <DataTable
              config={sampleTableData}
              onSort={handleSort}
              onRowSelect={handleRowSelect}
              onRowAction={handleRowAction}
              onPageChange={handlePageChange} />
          </ContentSection>
        </DaisyTabsContent>

        <DaisyTabsContent value="compliance" className="space-y-enterprise-6" >
            <div className="text-center py-enterprise-12">
            <CheckCircle className="h-12 w-12 text-text-tertiary mx-auto mb-enterprise-4" />
            <h3 className="text-heading-base font-semibold text-text-primary mb-enterprise-2">
              Compliance Reports
            </h3>
            <p className="text-body-base text-text-secondary">
              Framework-specific compliance reporting and analysis.
            </p>
          </div>
        </DaisyTabsContent>

        <DaisyTabsContent value="risk" className="space-y-enterprise-6" >
            <div className="text-center py-enterprise-12">
            <DaisyAlertTriangle className="h-12 w-12 text-text-tertiary mx-auto mb-enterprise-4" >
  <h3 className="text-heading-base font-semibold text-text-primary mb-enterprise-2">
</DaisyTabsContent>
              Risk Analysis
            </h3>
            <p className="text-body-base text-text-secondary">
              Comprehensive risk assessment and trend analysis.
            </p>
          </div>
        </DaisyTabsContent>

        <DaisyTabsContent value="audit" className="space-y-enterprise-6" >
            <div className="text-center py-enterprise-12">
            <Activity className="h-12 w-12 text-text-tertiary mx-auto mb-enterprise-4" />
            <h3 className="text-heading-base font-semibold text-text-primary mb-enterprise-2">
              Audit Reports
            </h3>
            <p className="text-body-base text-text-secondary">
              Audit trail and compliance verification reports.
            </p>
          </div>
        </DaisyTabsContent>

        <DaisyTabsContent value="custom" className="space-y-enterprise-6" >
            <div className="text-center py-enterprise-12">
            <FileText className="h-12 w-12 text-text-tertiary mx-auto mb-enterprise-4" />
            <h3 className="text-heading-base font-semibold text-text-primary mb-enterprise-2">
              Custom Reports
            </h3>
            <p className="text-body-base text-text-secondary">
              Build and customize reports for specific requirements.
            </p>
          </div>
        </DaisyTabsContent>
      </DaisyTabs>
    </MainContentArea>
  );
};

export default AdvancedReportsInterface; 