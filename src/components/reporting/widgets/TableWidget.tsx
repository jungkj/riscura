'use client';

import React, { useState, useEffect } from 'react';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { Copy, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { ReportWidget } from '@/lib/reporting/engine';

interface TableWidgetProps {
  widget: ReportWidget;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<ReportWidget>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export function TableWidget({
  widget,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
}: TableWidgetProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  useEffect(() => {
    loadData();
  }, [widget.dataSource]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setData(getSampleData());
    } catch (err) {
      setError('Failed to load table data');
    } finally {
      setLoading(false);
    }
  };

  const getSampleData = () => [
    { id: 1, risk: 'Data Breach', likelihood: 4, impact: 5, status: 'Open', owner: 'John Doe' },
    { id: 2, risk: 'System Outage', likelihood: 3, impact: 4, status: 'Mitigated', owner: 'Jane Smith' },
    { id: 3, risk: 'Compliance Violation', likelihood: 2, impact: 5, status: 'Open', owner: 'Bob Wilson' },
    { id: 4, risk: 'Market Volatility', likelihood: 5, impact: 3, status: 'Monitored', owner: 'Alice Brown' },
    { id: 5, risk: 'Vendor Risk', likelihood: 3, impact: 3, status: 'Open', owner: 'Charlie Davis' },
    { id: 6, risk: 'Cyber Attack', likelihood: 4, impact: 5, status: 'Critical', owner: 'Diana Lee' },
    { id: 7, risk: 'Regulatory Change', likelihood: 2, impact: 4, status: 'Monitored', owner: 'Frank Miller' },
    { id: 8, risk: 'Staff Turnover', likelihood: 3, impact: 2, status: 'Open', owner: 'Grace Taylor' },
  ];

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortColumn) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      
      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
  }, [data, sortColumn, sortDirection]);

  const paginatedData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'text-red-600 bg-red-100';
      case 'critical': return 'text-red-800 bg-red-200';
      case 'mitigated': return 'text-green-600 bg-green-100';
      case 'monitored': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <DaisyCard 
      className={`h-full ${isSelected ? 'ring-2 ring-blue-500' : ''} cursor-pointer`}
      onClick={onSelect}
    >
      <DaisyCardHeader className="pb-2 flex flex-row items-center justify-between">
        <DaisyCardTitle className="text-sm font-medium">{widget.title}</DaisyCardTitle>
        <div className="flex items-center space-x-1">
          <DaisyButton
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
          >
            <Copy className="w-3 h-3" />
          </DaisyButton>
          <DaisyButton
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="w-3 h-3" />
          </DaisyButton>
        </div>
      
      <DaisyCardContent className="pt-0">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-sm text-gray-500">Loading...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-sm text-red-500">{error}</div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="overflow-auto max-h-64">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    {columns.map((column) => (
                      <th
                        key={column}
                        className="text-left p-2 cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort(column)}
                      >
                        <div className="flex items-center space-x-1">
                          <span className="capitalize">{column}</span>
                          {sortColumn === column && (
                            sortDirection === 'asc' ? 
                              <ChevronUp className="w-3 h-3" /> : 
                              <ChevronDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((row, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      {columns.map((column) => (
                        <td key={column} className="p-2">
                          {column === 'status' ? (
                            <span className={`px-2 py-1 rounded text-xs ${getStatusColor(row[column])}`}>
                              {row[column]}
                            </span>
                          ) : (
                            <span>{row[column]}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex space-x-1">
                  <DaisyButton
                    variant="ghost"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Previous
                  </DaisyButton>
                  <DaisyButton
                    variant="ghost"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                  </DaisyButton>
                </div>
              </div>
            )}
          </div>
        )}
      </DaisyCardContent>
    </DaisyCard>
  );
} 