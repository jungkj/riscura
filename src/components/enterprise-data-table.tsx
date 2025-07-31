'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyCheckbox } from '@/components/ui/DaisyCheckbox';
import { DaisyAvatar, DaisyAvatarFallback, DaisyAvatarImage } from '@/components/ui/DaisyAvatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  MoreVertical,
  Download,
  Eye,
  ArrowUpDown,
  SortAsc,
  SortDesc,
  Calendar,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

// ========== TYPES ==========
export interface ColumnDefinition<T = any> {
  key: string;
  label: string;
  type?: 'text' | 'status-badge' | 'user-avatar' | 'date' | 'actions';
  sortable?: boolean;
  searchable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  accessor?: (row: T) => any;
}

export interface DataTableProps<T = any> {
  data: T[];
  columns: ColumnDefinition<T>[];
  loading?: boolean;
  error?: string;
  onRowSelect?: (selectedRows: T[]) => void;
  onRowClick?: (row: T) => void;
  bulkActions?: Array<{
    key: string;
    label: string;
    icon?: React.ComponentType<any>;
    action: (selectedRows: T[]) => void;
    variant?: 'default' | 'destructive';
  }>;
  className?: string;
}

// ========== CELL RENDERERS ==========
const StatusBadgeCell: React.FC<{ value: any }> = ({ value }) => {
  const getVariant = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('high') || statusLower.includes('critical')) return 'destructive';
    if (statusLower.includes('medium') || statusLower.includes('warning')) return 'outline';
    return 'secondary';
  };

  return (
    <DaisyBadge variant={getVariant(value) as any} className="text-xs font-medium" >
  {value}
</DaisyBadge>
    </DaisyBadge>
  );
};

const UserAvatarCell: React.FC<{ value: any }> = ({ value }) => {
  if (!value) return <span className="text-text-tertiary">—</span>;
  
  const user = typeof value === 'string' ? { name: value } : value;
  const initials = user.name?.split(' ').map((n: string) => n[0]).join('') || '?';
  
  return (
    <div className="flex items-center space-x-enterprise-2">
      <DaisyAvatar className="w-6 h-6" />
        <DaisyAvatarImage src={user.avatar} alt={user.name} />
        <DaisyAvatarFallback className="text-xs">{initials}</DaisyAvatar>
      </DaisyAvatar>
      <span className="text-body-sm text-text-primary truncate">{user.name}</span>
    </div>
  );
};

// ========== MAIN COMPONENT ==========
export const EnterpriseDataTable = <T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  error,
  onRowSelect,
  onRowClick,
  bulkActions = [],
  className,
}: DataTableProps<T>) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [sorts, setSorts] = useState<Array<{ column: string; direction: 'asc' | 'desc' }>>([]);

  const filteredData = useMemo(() => {
    let result = [...data];
    
    if (searchQuery) {
      result = result.filter(row => 
        columns.some(col => {
          if (!col.searchable) return false;
          const value = col.accessor ? col.accessor(row) : row[col.key];
          return String(value).toLowerCase().includes(searchQuery.toLowerCase());
        })
      );
    }
    
    if (sorts.length > 0) {
      result.sort((a, b) => {
        for (const sort of sorts) {
          const aValue = a[sort.column];
          const bValue = b[sort.column];
          
          let comparison = 0;
          if (aValue < bValue) comparison = -1;
          if (aValue > bValue) comparison = 1;
          
          if (comparison !== 0) {
            return sort.direction === 'desc' ? -comparison : comparison;
          }
        }
        return 0;
      });
    }
    
    return result;
  }, [data, searchQuery, sorts, columns]);

  const handleSort = useCallback((columnKey: string) => {
    setSorts(prev => {
      const existing = prev.find(s => s.column === columnKey);
      
      if (existing) {
        if (existing.direction === 'asc') {
          return prev.map(s => 
            s.column === columnKey ? { ...s, direction: 'desc' as const } : s
          );
        } else {
          return prev.filter(s => s.column !== columnKey);
        }
      } else {
        return [...prev, { column: columnKey, direction: 'asc' as const }];
      }
    });
  }, []);

  const renderCell = useCallback((column: ColumnDefinition<T>, row: T) => {
    const value = column.accessor ? column.accessor(row) : row[column.key];
    
    if (column.render) {
      return column.render(value, row);
    }
    
    switch (column.type) {
      case 'status-badge':
        return <StatusBadgeCell value={value} />;
      case 'user-avatar':
        return <UserAvatarCell value={value} />;
      case 'date':
        return (
          <div className="flex items-center space-x-enterprise-1 text-body-sm">
            <DaisyCalendar className="h-3 w-3 text-text-tertiary" />
            <span className="text-text-primary">
              {value ? new Date(value).toLocaleDateString() : '—'}
            </span>
          </div>
        );
      case 'actions':
        return (
          <DaisyDropdownMenu />
            <DaisyDropdownMenuTrigger asChild />
              <DaisyButton variant="ghost" size="sm" className="h-6 w-6 p-0" >
  <MoreVertical className="h-3 w-3" />
</DaisyCalendar>
              </DaisyButton>
            </DaisyDropdownMenuTrigger>
            <DaisyDropdownMenuContent align="end" />
              <DaisyDropdownMenuItem onClick={() => onRowClick?.(row)} />
                <Eye className="h-3 w-3 mr-enterprise-1" />
                View Details
              </DaisyDropdownMenuContent>
            </DaisyDropdownMenuContent>
          </DaisyDropdownMenu>
        );
      default:
        return (
          <span className="text-body-sm text-text-primary truncate">
            {value === null || value === undefined ? '—' : String(value)}
          </span>
        );
    }
  }, [onRowClick]);

  const getSortIcon = useCallback((columnKey: string) => {
    const sort = sorts.find(s => s.column === columnKey);
    if (!sort) return <ArrowUpDown className="h-3 w-3 text-text-tertiary" />;
    return sort.direction === 'asc' 
      ? <SortAsc className="h-3 w-3 text-interactive-primary" />
      : <SortDesc className="h-3 w-3 text-interactive-primary" />;
  }, [sorts]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-surface-primary rounded-lg border border-border">
        <div className="text-center">
          <DaisyAlertTriangle className="h-8 w-8 text-semantic-error mx-auto mb-enterprise-2" >
  <div className="text-heading-sm text-text-primary mb-enterprise-1">
</DaisyAlertTriangle>Error loading data</div>
          <div className="text-body-sm text-text-secondary">{error}</div>
        </div>
      </div>
    );
  };

  return (
    <div className={cn("enterprise-data-table bg-surface-primary rounded-lg border border-border shadow-notion-sm", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-enterprise-4 border-b border-border">
        <div className="flex items-center space-x-enterprise-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <DaisyInput
              placeholder="Search data..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-80 text-body-sm bg-surface-secondary border-0 focus:ring-1 focus:ring-interactive-primary"
            />
          </div>
          
          {selectedRows.size > 0 && bulkActions.length > 0 && (
            <div className="flex items-center space-x-enterprise-2">
              <span className="text-body-sm text-text-secondary">
                {selectedRows.size} selected
              </span>
              {bulkActions.map(action => (
                <DaisyButton
                  key={action.key}
                  variant={action.variant === 'destructive' ? 'danger' : 'outline'}
                  size="sm"
                  onClick={() => {
                    const selectedData = Array.from(selectedRows).map(index => filteredData[index]);
                    action.action(selectedData);
                  }}
                  className="text-button"
                >
                  {action.icon && <action.icon className="h-3 w-3 mr-enterprise-1" />}
                  {action.label}
                </DaisyInput>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-enterprise-2">
          <DaisyButton variant="outline" size="sm" className="text-button border-border hover:border-interactive-primary" >
  <Download className="h-3 w-3 mr-enterprise-1" />
</DaisyButton>
            Export
          </DaisyButton>
          
          <DaisyButton variant="outline" size="sm" className="text-button border-border hover:border-interactive-primary" >
  <RefreshCw className="h-3 w-3" />
</DaisyButton>
          </DaisyButton>
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-auto">
        <table className="w-full">
          <thead className="bg-surface-secondary border-b border-border sticky top-0 z-10">
            <tr>
              <th className="w-12 p-enterprise-3 text-left">
                <DaisyCheckbox
                  checked={selectedRows.size === filteredData.length && filteredData.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      const allIndices = filteredData.map((_, index) => index);
                      setSelectedRows(new Set(allIndices));
                      onRowSelect?.(filteredData);
                    } else {
                      setSelectedRows(new Set());
                      onRowSelect?.([]);
                    }
                  }}
                />
              </th>
              
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "p-enterprise-3 text-left border-r border-border/50 last:border-r-0",
                    column.sortable && "cursor-pointer hover:bg-surface-tertiary transition-colors"
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center justify-between group">
                    <span className="text-label text-text-primary font-semibold truncate">
                      {column.label}
                    </span>
                    {column.sortable && getSortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + 1} className="p-enterprise-8 text-center">
                  <div className="flex items-center justify-center space-x-enterprise-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-text-tertiary" />
                    <span className="text-body-sm text-text-secondary">Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="p-enterprise-8 text-center">
                  <div className="text-center">
                    <Search className="h-8 w-8 text-text-tertiary mx-auto mb-enterprise-2" />
                    <div className="text-heading-sm text-text-primary mb-enterprise-1">No results found</div>
                    <div className="text-body-sm text-text-secondary">
                      {searchQuery ? 'Try adjusting your search' : 'No data available'}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={cn(
                    "border-b border-border hover:bg-surface-secondary transition-colors cursor-pointer",
                    selectedRows.has(rowIndex) && "bg-interactive-primary/5 border-interactive-primary/20"
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  <td className="w-12 p-enterprise-3">
                    <DaisyCheckbox
                      checked={selectedRows.has(rowIndex)}
                      onCheckedChange={(checked) => {
                        const newSelection = new Set(selectedRows);
                        if (checked) {
                          newSelection.add(rowIndex);
                        } else {
                          newSelection.delete(rowIndex);
                        }
                        setSelectedRows(newSelection);
                        
                        const selectedData = Array.from(newSelection).map(index => filteredData[index]);
                        onRowSelect?.(selectedData);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="p-enterprise-3 border-r border-border/50 last:border-r-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {renderCell(column, row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EnterpriseDataTable; 