import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyCheckbox } from '@/components/ui/DaisyCheckbox';
import { DaisyTable, DaisyTableBody, DaisyTableCell, DaisyTableHead, DaisyTableHeader, DaisyTableRow } from '@/components/ui/DaisyTable';
import { DaisySelect } from '@/components/ui/DaisySelect';
import { DaisyPopover, DaisyPopoverContent, DaisyPopoverTrigger } from '@/components/ui/DaisyPopover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDevice } from '@/lib/responsive/hooks';
import {
  Search,
  Filter,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  X,
  Download,
  RefreshCw,
  Settings,
  Eye,
  Edit,
  Trash2,
  Copy,
  Archive,
  CheckCircle,
  AlertTriangle,
  Calendar,
  User,
  Shield,
  Sparkles,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// Enhanced Types
export interface EnhancedDataTableColumn<T = any> {
  key: string;
  title: string;
  type: 'text' | 'status' | 'progress' | 'date' | 'user' | 'risk' | 'actions' | 'number' | 'currency';
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T) => React.ReactNode;
  filterOptions?: Array<{ label: string; value: string }>;
  mobileHidden?: boolean; // Hide column on mobile
}

export interface EnhancedDataTableProps<T = any> {
  title?: string;
  subtitle?: string;
  columns: EnhancedDataTableColumn<T>[];
  data: T[];
  searchable?: boolean;
  selectable?: boolean;
  filterable?: boolean;
  exportable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  loading?: boolean;
  onRowAction?: (action: string, row: T) => void;
  onBulkAction?: (action: string, rows: T[]) => void;
  className?: string;
  emptyMessage?: string;
  variant?: 'default' | 'minimal';
}

interface FilterState {
  [key: string]: string | string[];
}

interface SortState {
  column: string | null;
  direction: 'asc' | 'desc' | null;
}

// Enhanced Cell Components (same as before but with responsive classes)
const StatusCell: React.FC<{ value: string }> = ({ value }) => {
  const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'success' | 'warning', icon: React.ElementType }> = {
    'active': { variant: 'success', icon: CheckCircle },
    'inactive': { variant: 'secondary', icon: AlertTriangle },
    'pending': { variant: 'warning', icon: TrendingUp },
    'error': { variant: 'destructive', icon: AlertTriangle },
    'completed': { variant: 'success', icon: CheckCircle },
    'in_progress': { variant: 'default', icon: TrendingUp },
    'draft': { variant: 'secondary', icon: Edit },
  };

  const config = statusConfig[value] || statusConfig['draft'];
  const IconComponent = config.icon;

  return (
    <DaisyBadge variant={config.variant} className="text-xs font-medium">
      <IconComponent className="h-3 w-3 mr-1" />
      {value.replace('_', ' ').charAt(0).toUpperCase() + value.replace('_', ' ').slice(1)}
    </DaisyBadge>
  );
};

const RiskLevelCell: React.FC<{ value: string }> = ({ value }) => {
  const riskConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'success' | 'warning'; className: string }> = {
    'critical': { variant: 'destructive', className: 'bg-red-100 text-red-800 border-red-300' },
    'high': { variant: 'destructive', className: 'bg-red-50 text-red-700 border-red-200' },
    'medium': { variant: 'secondary', className: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
    'low': { variant: 'success', className: 'bg-green-50 text-green-700 border-green-200' },
  };

  const config = riskConfig[value] || riskConfig['medium'];

  return (
    <DaisyBadge className={`text-xs font-semibold uppercase tracking-wider ${config.className}`}>
      {value}
    </DaisyBadge>
  );
};

const UserCell: React.FC<{ value: { name: string; email?: string; avatar?: string } }> = ({ value }) => {
  const device = useDevice();
  
  return (
    <div className="flex items-center gap-2">
      <div className="h-6 w-6 rounded-full bg-[#199BEC]/10 flex items-center justify-center flex-shrink-0">
        <User className="h-3 w-3 text-[#199BEC]" />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-medium text-[#191919] font-inter truncate">{value.name}</span>
        {value.email && device.type !== 'mobile' && (
          <span className="text-xs text-gray-500 font-inter truncate">{value.email}</span>
        )}
      </div>
    </div>
  );
};

const ProgressCell: React.FC<{ value: number }> = ({ value }) => {
  const device = useDevice();
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className={cn("flex items-center gap-3", device.type === 'mobile' ? "min-w-[100px]" : "")}>
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div
          className={cn("h-2 rounded-full transition-all duration-300", getProgressColor(value))}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs text-gray-600 font-medium font-inter min-w-[2rem]">
        {value}%
      </span>
    </div>
  );
};

const DateCell: React.FC<{ value: Date | string }> = ({ value }) => {
  const device = useDevice();
  const date = typeof value === 'string' ? new Date(value) : value;
  const isOverdue = date < new Date();
  const isUpcoming = date < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return (
    <div className="flex items-center gap-2">
      <DaisyCalendar className={cn("h-3 w-3 flex-shrink-0", 
        isOverdue ? 'text-red-500' : 
        isUpcoming ? 'text-yellow-500' : 
        'text-gray-400'
      )} />
      <span className={cn("text-sm font-inter",
        isOverdue ? 'text-red-600 font-medium' : 
        isUpcoming ? 'text-yellow-600' : 
        'text-gray-600',
        device.type === 'mobile' ? 'text-xs' : ''
      )}>
        {device.type === 'mobile' ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : date.toLocaleDateString()}
      </span>
    </div>
  );
};

const NumberCell: React.FC<{ value: number; format?: 'currency' | 'percentage' | 'default' }> = ({ value, format = 'default' }) => {
  const formatNumber = () => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
      case 'percentage':
        return `${value}%`;
      default:
        return value.toLocaleString();
    }
  };

  return (
    <span className="text-sm font-medium text-[#191919] font-inter tabular-nums">
      {formatNumber()}
    </span>
  );
};

const ActionsCell: React.FC<{ row: any; onAction: (action: string, row: any) => void }> = ({ row, onAction }) => {
  const device = useDevice();
  
  return (
    <DaisyDropdownMenu>
      <DaisyDropdownMenuTrigger asChild>
        <DaisyButton 
          variant="ghost" 
          size="sm" 
          className={cn(
            "p-0 hover:bg-gray-100",
            device.type === 'mobile' ? "h-10 w-10" : "h-8 w-8"
          )}
        >
          <MoreHorizontal className="h-4 w-4" />
        </DaisyButton>
      </DaisyDropdownMenuTrigger>
      <DaisyDropdownMenuContent align="end" className="w-48">
        <DaisyDropdownMenuItem onClick={() => onAction('view', row)}>
          <Eye className="h-4 w-4 mr-2" />
          View Details
        </DaisyDropdownMenuItem>
        <DaisyDropdownMenuItem onClick={() => onAction('edit', row)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </DaisyDropdownMenuItem>
        <DaisyDropdownMenuItem onClick={() => onAction('copy', row)}>
          <Copy className="h-4 w-4 mr-2" />
          Copy
        </DaisyDropdownMenuItem>
        <DaisyDropdownMenuSeparator />
        <DaisyDropdownMenuItem onClick={() => onAction('archive', row)}>
          <Archive className="h-4 w-4 mr-2" />
          Archive
        </DaisyDropdownMenuItem>
        <DaisyDropdownMenuItem 
          onClick={() => onAction('delete', row)}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </DaisyDropdownMenuItem>
      </DaisyDropdownMenuContent>
    </DaisyDropdownMenu>
  );
};

// Mobile Card View Component
const MobileCardView: React.FC<{
  data: any[];
  columns: EnhancedDataTableColumn[];
  onRowAction?: (action: string, row: any) => void;
  selectedRows: string[];
  onSelectRow: (rowId: string, checked: boolean) => void;
  selectable: boolean;
}> = ({ data, columns, onRowAction, selectedRows, onSelectRow, selectable }) => {
  const renderCell = (column: EnhancedDataTableColumn, value: any, row: any) => {
    if (column.render) {
      return column.render(value, row);
    }

    switch (column.type) {
      case 'status':
        return <StatusCell value={value} />;
      case 'user':
        return <UserCell value={value} />;
      case 'risk':
        return <RiskLevelCell value={value} />;
      case 'progress':
        return <DaisyProgressCell value={value} />;
      case 'date':
        return <DateCell value={value} />;
      case 'number':
        return <NumberCell value={value} />;
      case 'currency':
        return <NumberCell value={value} format="currency" />;
      case 'actions':
        return <ActionsCell row={row} onAction={onRowAction || (() => {})} />;
      default:
        return <span className="text-sm text-[#191919] font-inter">{String(value)}</span>;
    }
  };

  return (
    <div className="space-y-3 p-4">
      {data.map((row, index) => (
        <div key={row.id || index} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          {/* Header with selection and title */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              {selectable && (
                <DaisyCheckbox
                  checked={selectedRows.includes(row.id)}
                  onCheckedChange={(checked) => onSelectRow(row.id, !!checked)}
                  className="mt-1"
                />
              )}
              <div className="flex-1">
                {/* Find the title column */}
                {columns
                  .filter(col => col.key === 'title' || col.type === 'text')
                  .slice(0, 1)
                  .map((column) => (
                    <h3 key={column.key} className="font-semibold text-[#191919] font-inter text-base">
                      {renderCell(column, row[column.key], row)}
                    </h3>
                  ))}
              </div>
            </div>
            {/* Actions */}
            {columns.find(col => col.type === 'actions') && onRowAction && (
              <ActionsCell row={row} onAction={onRowAction} />
            )}
          </div>

          {/* Key information */}
          <div className="grid grid-cols-1 gap-2">
            {columns
              .filter(col => col.type !== 'actions' && col.key !== 'title' && !col.mobileHidden)
              .slice(0, 4) // Show only first 4 fields on mobile
              .map((column) => (
                <div key={column.key} className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 font-inter">
                    {column.title}
                  </span>
                  <div className="text-right">
                    {renderCell(column, row[column.key], row)}
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Advanced Filters Component (responsive)
const AdvancedFilters: React.FC<{
  columns: EnhancedDataTableColumn[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
}> = ({ columns, filters, onFiltersChange, onClearFilters }) => {
  const device = useDevice();
  const filterableColumns = columns.filter(col => col.filterable);
  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <DaisyPopover>
      <DaisyPopoverTrigger asChild>
        <DaisyButton variant="tertiary" size={device.type === 'mobile' ? 'default' : 'sm'} className="gap-2">
          <Filter className="h-4 w-4" />
          {device.type !== 'mobile' && 'Filters'}
          {hasActiveFilters && (
            <DaisyBadge variant="default" className="text-xs px-1.5 py-0.5 h-4 min-w-4">
              {Object.keys(filters).length}
            </DaisyBadge>
          )}
        </DaisyButton>
      </DaisyPopoverTrigger>
      <DaisyPopoverContent className="w-80 p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm text-[#191919] font-inter">Advanced Filters</h4>
            {hasActiveFilters && (
              <DaisyButton
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-xs"
              >
                Clear All
              </DaisyButton>
            )}
          </div>
          
          <div className="space-y-3">
            {filterableColumns.map((column) => (
              <div key={column.key} className="space-y-1">
                <label className="text-xs font-medium text-gray-700 font-inter">
                  {column.title}
                </label>
                {column.filterOptions ? (
                  <DaisySelect
                    value={String(filters[column.key] || '')}
                    onValueChange={(value) => {
                      const newFilters = { ...filters };
                      if (value) {
                        newFilters[column.key] = value;
                      } else {
                        delete newFilters[column.key];
                      }
                      onFiltersChange(newFilters);
                    }}
                  >
                    <DaisySelectTrigger className="h-8">
                      <DaisySelectValue placeholder="Select..." />
                    </DaisySelectTrigger>
                    <DaisySelectContent>
                      <DaisySelectItem value="">All</SelectItem>
                      {column.filterOptions.map((option) => (
                        <DaisySelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </DaisySelect>
                ) : (
                  <DaisyInput
                    placeholder={`Filter by ${column.title.toLowerCase()}...`}
                    value={String(filters[column.key] || '')}
                    onChange={(e) => {
                      const newFilters = { ...filters };
                      if (e.target.value) {
                        newFilters[column.key] = e.target.value;
                      } else {
                        delete newFilters[column.key];
                      }
                      onFiltersChange(newFilters);
                    }}
                    className="h-8 text-sm"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </DaisyPopoverContent>
    </DaisyPopover>
  );
};

// Main Enhanced Data Table Component
export const EnhancedDataTable: React.FC<EnhancedDataTableProps> = ({
  title,
  subtitle,
  columns,
  data,
  searchable = true,
  selectable = true,
  filterable = true,
  exportable = true,
  pagination = true,
  pageSize = 10,
  loading = false,
  onRowAction,
  onBulkAction,
  className,
  emptyMessage = "No data available",
  variant = 'default',
}) => {
  const device = useDevice();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({});
  const [sort, setSort] = useState<SortState>({ column: null, direction: null });
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Responsive page size
  const responsivePageSize = device.type === 'mobile' ? Math.min(pageSize, 5) : pageSize;

  // Filter columns for mobile view
  const visibleColumns = device.type === 'mobile' 
    ? columns.filter(col => !col.mobileHidden)
    : columns;

  // Filter and search data
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply search
    if (searchQuery) {
      result = result.filter((row) =>
        Object.values(row).some((value) =>
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Apply column filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        result = result.filter((row) => {
          const rowValue = row[key as keyof typeof row];
          return String(rowValue).toLowerCase().includes(String(value).toLowerCase());
        });
      }
    });

    // Apply sorting
    if (sort.column && sort.direction) {
      result.sort((a, b) => {
        const aValue = a[sort.column as keyof typeof a];
        const bValue = b[sort.column as keyof typeof b];
        
        let comparison = 0;
        if (aValue < bValue) comparison = -1;
        if (aValue > bValue) comparison = 1;
        
        return sort.direction === 'desc' ? -comparison : comparison;
      });
    }

    return result;
  }, [data, searchQuery, filters, sort]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / responsivePageSize);
  const startIndex = (currentPage - 1) * responsivePageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + responsivePageSize);

  const handleSort = (columnKey: string) => {
    setSort(prev => ({
      column: columnKey,
      direction: prev.column === columnKey && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedRows(checked ? paginatedData.map((row: any) => row.id) : []);
  };

  const handleSelectRow = (rowId: string, checked: boolean) => {
    setSelectedRows(prev => 
      checked ? [...prev, rowId] : prev.filter(id => id !== rowId)
    );
  };

  const getSortIcon = (columnKey: string) => {
    if (sort.column !== columnKey) {
      return <ArrowUpDown className="h-3 w-3 text-gray-400" />;
    }
    return sort.direction === 'asc' ? 
      <ChevronUp className="h-3 w-3 text-[#199BEC]" /> : 
      <ChevronDown className="h-3 w-3 text-[#199BEC]" />;
  };

  const renderCell = (column: EnhancedDataTableColumn, value: any, row: any) => {
    if (column.render) {
      return column.render(value, row);
    }

    switch (column.type) {
      case 'status':
        return <StatusCell value={value} />;
      case 'user':
        return <UserCell value={value} />;
      case 'risk':
        return <RiskLevelCell value={value} />;
      case 'progress':
        return <DaisyProgressCell value={value} />;
      case 'date':
        return <DateCell value={value} />;
      case 'number':
        return <NumberCell value={value} />;
      case 'currency':
        return <NumberCell value={value} format="currency" />;
      case 'actions':
        return <ActionsCell row={row} onAction={onRowAction || (() => {})} />;
      default:
        return <span className="text-sm text-[#191919] font-inter">{String(value)}</span>;
    }
  };

  return (
    <div className={cn("space-y-4 bg-white", device.type === 'mobile' ? 'space-y-3' : 'space-y-6', className)}>
      {/* Header */}
      {(title || subtitle) && (
        <div className={cn("space-y-1", device.type === 'mobile' ? 'px-4' : '')}>
          {title && (
            <h2 className={cn("font-bold text-[#191919] font-inter", device.type === 'mobile' ? 'text-xl' : 'text-2xl')}>
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600 font-inter">{subtitle}</p>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className={cn(
        "flex flex-col gap-3",
        device.type === 'mobile' ? 'px-4' : 'flex-row items-center justify-between gap-4'
      )}>
        <div className={cn("flex gap-3", device.type === 'mobile' ? 'flex-col' : 'items-center')}>
          {/* Search */}
          {searchable && (
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <DaisyInput
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn("pl-10", device.type === 'mobile' ? 'w-full' : 'w-64')}
              />
            </div>
          )}

          {/* Filters and Active Filter Indicators */}
          <div className="flex flex-wrap items-center gap-2">
            {filterable && (
              <AdvancedFilters
                columns={visibleColumns}
                filters={filters}
                onFiltersChange={setFilters}
                onClearFilters={() => setFilters({})}
              />
            )}

            {/* Active Filter Indicators */}
            {Object.entries(filters).map(([key, value]) => (
              value && (
                <DaisyBadge key={key} variant="secondary" className="text-xs">
                  {visibleColumns.find(col => col.key === key)?.title}: {String(value)}
                  <DaisyButton
                    variant="ghost"
                    size="sm"
                    className="h-3 w-3 p-0 ml-1"
                    onClick={() => {
                      const newFilters = { ...filters };
                      delete newFilters[key];
                      setFilters(newFilters);
                    }}
                  >
                    <X className="h-2 w-2" />
                  </DaisyButton>
                </DaisyBadge>
              )
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className={cn("flex gap-2", device.type === 'mobile' ? 'flex-wrap' : 'items-center')}>
          {/* Bulk Actions */}
          {selectedRows.length > 0 && (
            <div className="flex items-center gap-2">
              <DaisyBadge variant="outline" className="text-xs">
                {selectedRows.length} selected
              </DaisyBadge>
              <DaisyDropdownMenu>
                <DaisyDropdownMenuTrigger asChild>
                  <DaisyButton variant="tertiary" size={device.type === 'mobile' ? 'default' : 'sm'}>
                    Actions
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </DaisyButton>
                </DaisyDropdownMenuTrigger>
                <DaisyDropdownMenuContent>
                  <DaisyDropdownMenuItem onClick={() => onBulkAction?.('export', selectedRows.map(id => data.find((row: any) => row.id === id)!))}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Selected
                  </DaisyDropdownMenuItem>
                  <DaisyDropdownMenuItem onClick={() => onBulkAction?.('archive', selectedRows.map(id => data.find((row: any) => row.id === id)!))}>
                    <Archive className="h-4 w-4 mr-2" />
                    Archive Selected
                  </DaisyDropdownMenuItem>
                  <DaisyDropdownMenuSeparator />
                  <DaisyDropdownMenuItem 
                    onClick={() => onBulkAction?.('delete', selectedRows.map(id => data.find((row: any) => row.id === id)!))}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected
                  </DaisyDropdownMenuItem>
                </DaisyDropdownMenuContent>
              </DaisyDropdownMenu>
            </div>
          )}

          {/* Table Actions */}
          {device.type !== 'mobile' && (
            <>
              <DaisyButton variant="tertiary" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </DaisyButton>
              
              {exportable && (
                <DaisyButton variant="tertiary" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </DaisyButton>
              )}

              <DaisyButton variant="tertiary" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Columns
              </DaisyButton>
            </>
          )}
        </div>
      </div>

      {/* Table or Mobile Cards */}
      {device.type === 'mobile' ? (
        // Mobile Card View
        <>
          {loading ? (
            <div className="py-12 text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#199BEC]" />
              <p className="text-sm text-gray-500 mt-2 font-inter">Loading...</p>
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="py-12 text-center">
              <div className="p-4 rounded-full bg-gray-100 inline-block mb-3">
                <Sparkles className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 font-inter">{emptyMessage}</p>
            </div>
          ) : (
            <MobileCardView
              data={paginatedData}
              columns={visibleColumns}
              onRowAction={onRowAction}
              selectedRows={selectedRows}
              onSelectRow={handleSelectRow}
              selectable={selectable}
            />
          )}
        </>
      ) : (
        // Desktop Table View
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <DaisyTable>
              <DaisyTableHeader>
                <DaisyTableRow>
                  {selectable && (
                    <DaisyTableHead className="w-12">
                      <DaisyCheckbox
                        checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </DaisyTableHead>
                  )}
                  {visibleColumns.map((column) => (
                    <DaisyTableHead
                      key={column.key}
                      className={cn(
                        column.sortable && "cursor-pointer hover:bg-gray-50 transition-colors",
                        column.align === 'center' && "text-center",
                        column.align === 'right' && "text-right"
                      )}
                      onClick={() => column.sortable && handleSort(column.key)}
                      style={{ width: column.width }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-700">
                          {column.title}
                        </span>
                        {column.sortable && getSortIcon(column.key)}
                      </div>
                    </DaisyTableHead>
                  ))}
                </DaisyTableRow>
              </DaisyTableHeader>

              <DaisyTableBody>
                {loading ? (
                  <DaisyTableRow>
                    <DaisyTableCell colSpan={visibleColumns.length + (selectable ? 1 : 0)} className="py-12">
                      <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#199BEC]" />
                        <p className="text-sm text-gray-500 mt-2 font-inter">Loading...</p>
                      </div>
                    </DaisyTableCell>
                  </DaisyTableRow>
                ) : paginatedData.length === 0 ? (
                  <DaisyTableRow>
                    <DaisyTableCell colSpan={visibleColumns.length + (selectable ? 1 : 0)} className="py-12">
                      <div className="text-center">
                        <div className="p-4 rounded-full bg-gray-100 inline-block mb-3">
                          <Sparkles className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500 font-inter">{emptyMessage}</p>
                      </div>
                    </DaisyTableCell>
                  </DaisyTableRow>
                ) : (
                  paginatedData.map((row: any, index) => (
                    <DaisyTableRow
                      key={row.id || index}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {selectable && (
                        <DaisyTableCell>
                          <DaisyCheckbox
                            checked={selectedRows.includes(row.id)}
                            onCheckedChange={(checked) => handleSelectRow(row.id, !!checked)}
                          />
                        </DaisyTableCell>
                      )}
                      {visibleColumns.map((column) => (
                        <DaisyTableCell
                          key={column.key}
                          className={cn(
                            column.align === 'center' && "text-center",
                            column.align === 'right' && "text-right"
                          )}
                        >
                          {renderCell(column, row[column.key], row)}
                        </DaisyTableCell>
                      ))}
                    </DaisyTableRow>
                  ))
                )}
              </DaisyTableBody>
            </DaisyTable>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className={cn(
          "flex items-center justify-between py-4",
          device.type === 'mobile' ? 'px-4 flex-col gap-3' : ''
        )}>
          <div className="text-sm text-gray-600 font-inter">
            Showing {startIndex + 1} to {Math.min(startIndex + responsivePageSize, filteredData.length)} of {filteredData.length} results
          </div>
          
          <div className="flex items-center gap-2">
            <DaisyButton
              variant="tertiary"
              size={device.type === 'mobile' ? 'default' : 'sm'}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              {device.type !== 'mobile' && 'Previous'}
            </DaisyButton>
            
            {device.type !== 'mobile' && (
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <DaisyButton
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'tertiary'}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </DaisyButton>
                  );
                })}
              </div>
            )}
            
            <DaisyButton
              variant="tertiary"
              size={device.type === 'mobile' ? 'default' : 'sm'}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              {device.type !== 'mobile' && 'Next'}
              <ChevronRight className="h-4 w-4" />
            </DaisyButton>
          </div>
        </div>
      )}
    </div>
  );
}; 