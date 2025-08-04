'use client';

import React, { useState, useMemo } from 'react';
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard'
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyCheckbox } from '@/components/ui/DaisyCheckbox';
import { DaisyTable, DaisyTableBody, DaisyTableCell, DaisyTableHead, DaisyTableHeader, DaisyTableRow } from '@/components/ui/DaisyTable';
import { DaisyDropdownMenu, DaisyDropdownMenuContent, DaisyDropdownMenuItem, DaisyDropdownMenuTrigger } from '@/components/ui/DaisyDropdown';
import { Search, Download, MoreHorizontal, ChevronDown, Edit, Trash2, Eye, Copy, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DaisyCardTitle, DaisyDropdownMenuTrigger, DaisyTableRow } from '@/components/ui/daisy-components';

interface TableData {
  id: string;
  [key: string]: any;
}

interface ColumnConfig<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  render?: (_value: any, row: T) => React.ReactNode;
}

interface BulkAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'danger' | 'outline';
  action: (selectedRows: TableData[]) => void;
}

interface EnterpriseDataTableProps<T extends TableData> {
  data: T[];
  columns: ColumnConfig<T>[];
  title?: string;
  description?: string;
  enableSearch?: boolean;
  enableSelection?: boolean;
  enablePagination?: boolean;
  enableExport?: boolean;
  bulkActions?: BulkAction[];
  pageSize?: number;
  className?: string;
  onRowClick?: (row: T) => void;
  onRowEdit?: (row: T) => void;
  onRowDelete?: (row: T) => void;
  onExport?: (_data: T[], format: string) => void;
}

export default function EnterpriseDataTable<T extends TableData>({
  data,
  columns,
  title = 'Data Table',
  description,
  enableSearch = true,
  enableSelection = true,
  enablePagination = true,
  enableExport = true,
  bulkActions = [],
  pageSize = 10,
  className = '',
  onRowClick,
  onRowEdit,
  onRowDelete,
  onExport
}: EnterpriseDataTableProps<T>) {
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof T; direction: 'asc' | 'desc' } | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  
  const filteredAndSortedData = useMemo(() => {
    let _result = [...data];
    
    if (searchTerm) {
      result = result.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    
    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return result;
  }, [data, searchTerm, sortConfig]);
  
  const totalPages = Math.ceil(filteredAndSortedData.length / pageSize);
  const paginatedData = enablePagination
    ? filteredAndSortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : filteredAndSortedData;
  
  const handleSort = (key: keyof T) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }
  
  const handleRowSelection = (rowId: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(rowId);
    } else {
      newSelected.delete(rowId);
    }
    setSelectedRows(newSelected);
  }
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(paginatedData.map(row => row.id)));
    } else {
      setSelectedRows(new Set());
    }
  }
  
  const handleBulkAction = (_action: BulkAction) => {
    const selectedData = data.filter(row => selectedRows.has(row.id));
    action.action(selectedData);
    setSelectedRows(new Set());
    
    toast({
      title: 'Bulk Action Complete',
      description: `${action.label} applied to ${selectedData.length} item(s).`,
    });
  }
  
  const handleExport = (format: string) => {
    const exportData = selectedRows.size > 0
      ? data.filter(row => selectedRows.has(row.id))
      : filteredAndSortedData;
    
    if (onExport) {
      onExport(exportData, format);
    } else {
      const csv = [
        columns.map(col => col.header).join(','),
        ...exportData.map(row =>
          columns.map(col => `"${row[col.key] || ''}"`).join(',')
        )
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/\s+/g, '-').toLowerCase()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    
    toast({
      title: 'Export Complete',
      description: 'Data exported successfully.',
    });
  }
  
  const handleReset = () => {
    setSearchTerm('');
    setSortConfig(null);
    setSelectedRows(new Set());
    setCurrentPage(1);
  }
  
  const isAllSelected = paginatedData.length > 0 && paginatedData.every(row => selectedRows.has(row.id));
  const isIndeterminate = selectedRows.size > 0 && !isAllSelected;

  return (
    <DaisyCard className={className} >
  <DaisyCardBody className="pb-3" >
</DaisyCard>
        <div className="flex items-center justify-between">
          <div>
            <DaisyCardTitle className="text-lg">{title}</DaisyCardTitle>
            {Boolean(description) && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {Boolean(enableExport) && (
              <DaisyDropdownMenu >
                  <DaisyDropdownMenuTrigger asChild >
                    <DaisyButton variant="outline" size="sm" >
  <Download className="h-4 w-4 mr-2" />
</DaisyDropdownMenu>
                    Export
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </DaisyButton>
                </DaisyDropdownMenuTrigger>
                <DaisyDropdownMenuContent >
                    <DaisyDropdownMenuItem onClick={() => handleExport('csv')} />
                    Export as CSV
                  </DaisyDropdownMenuContent>
                  <DaisyDropdownMenuItem onClick={() => handleExport('json')} />
                    Export as JSON
                  </DaisyDropdownMenuItem>
                </DaisyDropdownMenuContent>
              </DaisyDropdownMenu>
            )}
            
            <DaisyButton variant="outline" size="sm" onClick={handleReset} >
  <RefreshCw className="h-4 w-4 mr-2" />
</DaisyButton>
              Reset
            </DaisyButton>
          </div>
        </div>
        
        <div className="flex flex-col space-y-4 mt-4">
          {Boolean(enableSearch) && (
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-500" />
              <DaisyInput
                placeholder="Search all columns..."
                value={searchTerm}
                onChange={(e) = />
setSearchTerm(e.target.value)}
                className="max-w-sm" />
            </div>
          )}
          
          {Boolean(enableSelection) && selectedRows.size > 0 && bulkActions.length > 0 && (
            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
              <DaisyBadge variant="secondary">{selectedRows.size} selected</DaisyInput>
              {bulkActions.map((action) => (
                <DaisyButton
                  key={action.id}
                  variant={action.variant || 'outline'}
                  size="sm"
                  onClick={() =>
          handleBulkAction(action)} />
                  {action.icon}
                  {action.label}
                
        </DaisyButton>
              ))}
            </div>
          )}
        </div>
      

      <DaisyCardBody className="p-0" >
  <div className="border rounded-lg">
</DaisyCardBody>
          <DaisyTable >
              <DaisyTableHeader >
                <DaisyTableRow >
                  {Boolean(enableSelection) && (
                  <DaisyTableHead className="w-12" >
                      <DaisyCheckbox
                      checked={isAllSelected}
                      ref={(el) = />
{
                        if (el && el instanceof HTMLInputElement) {
                          el.indeterminate = isIndeterminate;
                        }
                      }}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all" />
                  </DaisyTable>
                )}
                {columns.map((column) => (
                  <DaisyTableHead key={column.key as string} >
                      {column.sortable !== false ? (
                      <DaisyButton
                        variant="ghost"
                        onClick={() => handleSort(column.key)}
                        className="h-8 p-0 hover:bg-transparent" />
                        {column.header}
                        {sortConfig?.key === column.key && (
                          sortConfig.direction === 'asc' 
                            ? <ArrowUp className="ml-2 h-4 w-4" />
                            : <ArrowDown className="ml-2 h-4 w-4" />
                        )}
                        {sortConfig?.key !== column.key && (
                          <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                        )}
                      </DaisyTableHead>
                    ) : (
                      column.header
                    )}
                  </DaisyTableHead>
                ))}
                <DaisyTableHead className="w-20">Actions</DaisyTableHead>
              </DaisyTableRow>
            </DaisyTableHeader>
            <DaisyTableBody >
                {paginatedData.length > 0 ? (
                paginatedData.map((row) => (
                  <DaisyTableRow
                    key={row.id}
                    className={`hover:bg-gray-50 ${selectedRows.has(row.id) ? 'bg-blue-50' : ''}`}
                  >
                    {Boolean(enableSelection) && (
                      <DaisyTableCell >
                          <DaisyCheckbox
                          checked={selectedRows.has(row.id)}
                          onCheckedChange={(checked) = />
handleRowSelection(row.id, checked as boolean)}
                          aria-label="Select row" />
                      </DaisyTableBody>
                    )}
                    {columns.map((column) => (
                      <DaisyTableCell
                        key={column.key as string}
                        onClick={() => onRowClick?.(row)}
                        className="cursor-pointer" />
                        {column.render
                          ? column.render(row[column.key], row)
                          : String(row[column.key] || '')
                        }
                      </DaisyTableCell>
                    ))}
                    <DaisyTableCell >
                        <DaisyDropdownMenu >
                          <DaisyDropdownMenuTrigger asChild >
                            <DaisyButton variant="ghost" className="h-8 w-8 p-0" >
  <MoreHorizontal className="h-4 w-4" />
</DaisyTableCell>
                          </DaisyButton>
                        </DaisyDropdownMenuTrigger>
                        <DaisyDropdownMenuContent align="end" >
                            <DaisyDropdownMenuItem onClick={() => onRowClick?.(row)} />
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DaisyDropdownMenuContent>
                          <DaisyDropdownMenuItem onClick={() => navigator.clipboard.writeText(row.id)} />
                            <Copy className="mr-2 h-4 w-4" />
                            Copy ID
                          </DaisyDropdownMenuItem>
                          {Boolean(onRowEdit) && (
                            <DaisyDropdownMenuItem onClick={() => onRowEdit(row)} />
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DaisyDropdownMenuItem>
                          )}
                          {Boolean(onRowDelete) && (
                            <DaisyDropdownMenuItem 
                              onClick={() => onRowDelete(row)}
                              className="text-red-600" />
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DaisyDropdownMenuItem>
                          )}
                        </DaisyDropdownMenuContent>
                      </DaisyDropdownMenu>
                    </DaisyTableCell>
                  </DaisyTableRow>
                ))
              ) : (
                <DaisyTableRow >
                    <DaisyTableCell colSpan={columns.length + (enableSelection ? 2 : 1)} className="h-24 text-center" >
                      No results found.
                  </DaisyTableRow>
                </DaisyTableRow>
              )}
            </DaisyTableBody>
          </DaisyTable>
        </div>
        
        {Boolean(enablePagination) && totalPages > 1 && (
          <div className="flex items-center justify-between space-x-2 p-4">
            <div className="text-sm text-gray-700">
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filteredAndSortedData.length)} of{' '}
              {filteredAndSortedData.length} results
            </div>
            
            <div className="flex items-center space-x-2">
              <DaisyButton
                variant="outline"
                size="sm"
                onClick={() =>
          setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1} />
                Previous
              
        </DaisyButton>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let page: number;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }

  return (
                    <DaisyButton
                      key={page}
                      variant={currentPage === page ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() =>
          setCurrentPage(page)}
                      className="w-8 h-8 p-0" />
                      {page}
                    
        </DaisyButton>
                  );
                })}
              </div>
              
              <DaisyButton
                variant="outline"
                size="sm"
                onClick={() =>
          setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages} />
                Next
              
        </DaisyButton>
            </div>
          </div>
        )}
      </DaisyCardBody>
    </DaisyCard>
  );
}

// Example usage with sample data
export function RiskDataTableExample() {
  const sampleData = Array.from({ length: 50 }, (_, i) => ({
    id: `risk-${i + 1}`,
    title: `Risk ${i + 1}: Data Security Breach`,
    category: ['Operational', 'Financial', 'Strategic', 'Compliance'][i % 4],
    status: ['Open', 'In Progress', 'Mitigated', 'Closed'][i % 4],
    priority: ['Low', 'Medium', 'High', 'Critical'][i % 4],
    owner: ['John Smith', 'Sarah Johnson', 'Mike Chen'][i % 3],
    riskScore: Math.floor(Math.random() * 20) + 5,
    lastAssessed: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }))
  
  const columns: ColumnConfig<any>[] = [
    {
      key: 'title',
      header: 'Risk Title',
      sortable: true
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (value) => <DaisyBadge variant="outline">{value}</DaisyBadge>
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (value) => {
        const variants = {
          'Open': 'destructive',
          'In Progress': 'secondary',
          'Mitigated': 'default',
          'Closed': 'outline'
        } as const;
        return <DaisyBadge variant={variants[value as keyof typeof variants]}>{value}</DaisyBadge>;
      }
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      render: (value) => {
        const colors = {
          'Low': 'text-green-600',
          'Medium': 'text-yellow-600',
          'High': 'text-orange-600',
          'Critical': 'text-red-600'
        } as const;
        return <span className={colors[value as keyof typeof colors]}>{value}</span>;
      }
    },
    {
      key: 'owner',
      header: 'Owner',
      sortable: true
    },
    {
      key: 'riskScore',
      header: 'Risk Score',
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-2">
          <span className="font-medium">{value}</span>
          <div className={`w-2 h-2 rounded-full ${
            value >= 15 ? 'bg-red-500' : 
            value >= 10 ? 'bg-orange-500' : 
            value >= 5 ? 'bg-yellow-500' : 'bg-green-500'
          }`} />
        </div>
      )
    },
    {
      key: 'lastAssessed',
      header: 'Last Assessed',
      sortable: true
    }
  ];
  
  const bulkActions: BulkAction[] = [
    {
      id: 'archive',
      label: 'Archive',
      icon: <Download className="h-4 w-4 mr-2" />,
      action: (rows) => console.log('Archiving:', rows),
      variant: 'outline'
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4 mr-2" />,
      action: (rows) => console.log('Deleting:', rows),
      variant: 'danger'
    }
  ];

  return (
    <EnterpriseDataTable
      data={sampleData}
      columns={columns}
      title="Risk Management Dashboard"
      description="Comprehensive view of organizational risks"
      bulkActions={bulkActions}
      onRowClick={(row) => console.log('Row clicked:', row)}
      onRowEdit={(row) => console.log('Edit row:', row)}
      onRowDelete={(row) => console.log('Delete row:', row)}
      onExport={(data, format) => console.log('Export:', data.length, 'rows as', format)} />
  );
} 