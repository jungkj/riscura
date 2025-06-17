'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Type, 
  Hash, 
  Calendar, 
  Star,
  Trash2,
  Sparkles,
  Search,
  Filter,
  Save,
  Edit3,
  X,
  Check,
  AlertCircle,
  TrendingUp,
  Shield,
  FileSpreadsheet,
  Download,
  Upload,
  MoreHorizontal
} from 'lucide-react';
import Image from 'next/image';

// Enhanced data structure
interface SpreadsheetCell {
  id: string;
  value: string | number;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect';
  options?: string[];
  isEditing?: boolean;
}

interface SpreadsheetRow {
  id: string;
  cells: SpreadsheetCell[];
  isNew?: boolean;
}

interface SpreadsheetColumn {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect';
  width: number;
  icon: React.ComponentType<any>;
  options?: string[];
}

// AI Insight interface
interface AIInsight {
  id: string;
  type: 'risk' | 'opportunity' | 'trend' | 'anomaly';
  title: string;
  description: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedRows: string[];
  recommendation: string;
}

// Sample data with enhanced structure
const INITIAL_COLUMNS: SpreadsheetColumn[] = [
  { id: 'id', name: 'Risk ID', type: 'text', width: 100, icon: Type },
  { id: 'title', name: 'Risk Title', type: 'text', width: 250, icon: Type },
  { id: 'category', name: 'Category', type: 'select', width: 140, icon: Type, options: ['Operational', 'Financial', 'Strategic', 'Compliance', 'Technological'] },
  { id: 'likelihood', name: 'Likelihood', type: 'select', width: 120, icon: Star, options: ['1', '2', '3', '4', '5'] },
  { id: 'impact', name: 'Impact', type: 'select', width: 120, icon: Star, options: ['1', '2', '3', '4', '5'] },
  { id: 'owner', name: 'Risk Owner', type: 'select', width: 160, icon: Type, options: ['Sarah Chen', 'Mike Rodriguez', 'Jennifer Liu', 'David Kim', 'Emma Davis'] },
  { id: 'dueDate', name: 'Due Date', type: 'date', width: 130, icon: Calendar },
  { id: 'status', name: 'Status', type: 'select', width: 120, icon: Type, options: ['Open', 'In Progress', 'Mitigated', 'Closed', 'On Hold'] }
];

const INITIAL_DATA: SpreadsheetRow[] = [
  {
    id: 'row1',
    cells: [
      { id: 'id', value: 'R001', type: 'text' },
      { id: 'title', value: 'Data Breach Risk', type: 'text' },
      { id: 'category', value: 'Operational', type: 'select' },
      { id: 'likelihood', value: '4', type: 'select' },
      { id: 'impact', value: '5', type: 'select' },
      { id: 'owner', value: 'Sarah Chen', type: 'select' },
      { id: 'dueDate', value: '2024-02-15', type: 'date' },
      { id: 'status', value: 'In Progress', type: 'select' }
    ]
  },
  {
    id: 'row2',
    cells: [
      { id: 'id', value: 'R002', type: 'text' },
      { id: 'title', value: 'Vendor Risk Assessment', type: 'text' },
      { id: 'category', value: 'Strategic', type: 'select' },
      { id: 'likelihood', value: '3', type: 'select' },
      { id: 'impact', value: '3', type: 'select' },
      { id: 'owner', value: 'Mike Rodriguez', type: 'select' },
      { id: 'dueDate', value: '2024-03-01', type: 'date' },
      { id: 'status', value: 'Open', type: 'select' }
    ]
  },
  {
    id: 'row3',
    cells: [
      { id: 'id', value: 'R003', type: 'text' },
      { id: 'title', value: 'Regulatory Compliance Gap', type: 'text' },
      { id: 'category', value: 'Compliance', type: 'select' },
      { id: 'likelihood', value: '2', type: 'select' },
      { id: 'impact', value: '4', type: 'select' },
      { id: 'owner', value: 'Jennifer Liu', type: 'select' },
      { id: 'dueDate', value: '2024-01-30', type: 'date' },
      { id: 'status', value: 'Mitigated', type: 'select' }
    ]
  }
];

export default function NotionSpreadsheet() {
  const [columns, setColumns] = useState<SpreadsheetColumn[]>(INITIAL_COLUMNS);
  const [rows, setRows] = useState<SpreadsheetRow[]>(INITIAL_DATA);
  const [filteredRows, setFilteredRows] = useState<SpreadsheetRow[]>(INITIAL_DATA);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCell, setSelectedCell] = useState<{rowId: string, columnId: string} | null>(null);
  const [isAddColumnDialogOpen, setIsAddColumnDialogOpen] = useState(false);
  const [isAIInsightsOpen, setIsAIInsightsOpen] = useState(false);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const [newColumn, setNewColumn] = useState({
    name: '',
    type: 'text' as 'text' | 'number' | 'date' | 'select',
    options: ''
  });

  const inputRef = useRef<HTMLInputElement>(null);

  // Filter data based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredRows(rows);
      return;
    }

    const filtered = rows.filter(row =>
      row.cells.some(cell =>
        String(cell.value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredRows(filtered);
  }, [rows, searchTerm]);

  // Generate AI insights based on current data
  const generateAIInsights = useCallback(async () => {
    setIsGeneratingInsights(true);
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const insights: AIInsight[] = [
      {
        id: 'insight1',
        type: 'risk',
        title: 'High-Risk Pattern Detected',
        description: 'Multiple high-impact risks are assigned to Sarah Chen, creating a potential bottleneck.',
        confidence: 0.87,
        severity: 'high',
        affectedRows: ['row1'],
        recommendation: 'Consider redistributing risks or providing additional resources to the risk owner.'
      },
      {
        id: 'insight2',
        type: 'trend',
        title: 'Overdue Risk Items',
        description: 'Risk R003 is approaching its due date and still shows "In Progress" status.',
        confidence: 0.95,
        severity: 'medium',
        affectedRows: ['row3'],
        recommendation: 'Follow up with Jennifer Liu to ensure timely completion or update timeline.'
      },
      {
        id: 'insight3',
        type: 'opportunity',
        title: 'Compliance Excellence',
        description: 'Strong performance in compliance risk management with consistent mitigation.',
        confidence: 0.78,
        severity: 'low',
        affectedRows: ['row3'],
        recommendation: 'Document and share best practices across other risk categories.'
      }
    ];

    setAiInsights(insights);
    setIsGeneratingInsights(false);
  }, []);

  // Add new row
  const addRow = useCallback(() => {
    const newRowId = `row${Date.now()}`;
    const newRow: SpreadsheetRow = {
      id: newRowId,
      isNew: true,
      cells: columns.map(col => ({
        id: col.id,
        value: '',
        type: col.type,
        options: col.options
      }))
    };
    
    setRows(prev => [...prev, newRow]);
    setHasUnsavedChanges(true);
  }, [columns]);

  // Delete row
  const deleteRow = useCallback((rowId: string) => {
    setRows(prev => prev.filter(row => row.id !== rowId));
    setHasUnsavedChanges(true);
  }, []);

  // Add new column
  const addColumn = useCallback(() => {
    if (!newColumn.name.trim()) return;

    const columnId = newColumn.name.toLowerCase().replace(/\s+/g, '_');
    const column: SpreadsheetColumn = {
      id: columnId,
      name: newColumn.name,
      type: newColumn.type,
      width: 150,
      icon: Type,
      options: newColumn.type === 'select' ? newColumn.options.split(',').map(opt => opt.trim()) : undefined
    };

    setColumns(prev => [...prev, column]);
    
    // Add empty cells for this column to all existing rows
    setRows(prev => prev.map(row => ({
      ...row,
      cells: [...row.cells, {
        id: columnId,
        value: '',
        type: newColumn.type,
        options: column.options
      }]
    })));

    setNewColumn({ name: '', type: 'text', options: '' });
    setIsAddColumnDialogOpen(false);
    setHasUnsavedChanges(true);
  }, [newColumn]);

  // Update cell value
  const updateCellValue = useCallback((rowId: string, columnId: string, value: string | number) => {
    setRows(prev => prev.map(row => {
      if (row.id === rowId) {
        return {
          ...row,
          cells: row.cells.map(cell => 
            cell.id === columnId ? { ...cell, value } : cell
          )
        };
      }
      return row;
    }));
    setHasUnsavedChanges(true);
  }, []);

  // Save data (simulate API call)
  const saveData = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    setHasUnsavedChanges(false);
    setRows(prev => prev.map(row => ({ ...row, isNew: false })));
  }, []);

  // Render cell based on type
  const renderCell = useCallback((row: SpreadsheetRow, column: SpreadsheetColumn) => {
    const cell = row.cells.find(c => c.id === column.id);
    if (!cell) return null;

    const isSelected = selectedCell?.rowId === row.id && selectedCell?.columnId === column.id;
    const isEditing = cell.isEditing;

    if (isEditing) {
      switch (column.type) {
        case 'select':
          return (
            <Select
              value={String(cell.value)}
              onValueChange={(value) => {
                updateCellValue(row.id, column.id, value);
                setSelectedCell(null);
              }}
            >
              <SelectTrigger className="h-8 text-xs border-0 shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {column.options?.map(option => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        case 'date':
          return (
            <Input
              ref={inputRef}
              type="date"
              value={String(cell.value)}
              onChange={(e) => updateCellValue(row.id, column.id, e.target.value)}
              onBlur={() => setSelectedCell(null)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === 'Escape') {
                  setSelectedCell(null);
                }
              }}
              className="h-8 text-xs border-0 shadow-none"
              autoFocus
            />
          );
        default:
          return (
            <Input
              ref={inputRef}
              value={String(cell.value)}
              onChange={(e) => updateCellValue(row.id, column.id, e.target.value)}
              onBlur={() => setSelectedCell(null)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === 'Escape') {
                  setSelectedCell(null);
                }
              }}
              className="h-8 text-xs border-0 shadow-none"
              autoFocus
            />
          );
      }
    }

    // Display mode
    const displayValue = () => {
      if (column.type === 'select' && column.id === 'category') {
        return (
          <Badge className={`text-xs ${getCategoryColor(String(cell.value))}`}>
            {String(cell.value)}
          </Badge>
        );
      }
      if (column.type === 'select' && column.id === 'status') {
        return (
          <Badge className={`text-xs ${getStatusColor(String(cell.value))}`}>
            {String(cell.value)}
          </Badge>
        );
      }
      if (column.id === 'likelihood' || column.id === 'impact') {
        return renderStars(Number(cell.value));
      }
      return <span className="text-sm text-gray-900">{String(cell.value)}</span>;
    };

    return (
      <div
        className={`h-full w-full flex items-center px-3 cursor-pointer hover:bg-blue-50 ${
          isSelected ? 'bg-blue-100 ring-2 ring-blue-500' : ''
        }`}
        onClick={() => setSelectedCell({ rowId: row.id, columnId: column.id })}
        onDoubleClick={() => {
          setRows(prev => prev.map(r => ({
            ...r,
            cells: r.cells.map(c => 
              c.id === column.id && r.id === row.id 
                ? { ...c, isEditing: true }
                : { ...c, isEditing: false }
            )
          })));
        }}
      >
        {displayValue()}
      </div>
    );
  }, [selectedCell, updateCellValue]);

  // Helper functions for styling
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star 
            key={star} 
            className={`w-3 h-3 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
          />
        ))}
      </div>
    );
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'Open': 'bg-red-100 text-red-800',
      'In Progress': 'bg-yellow-100 text-yellow-800',
      'Mitigated': 'bg-green-100 text-green-800',
      'Closed': 'bg-gray-100 text-gray-800',
      'On Hold': 'bg-purple-100 text-purple-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Operational': 'bg-blue-100 text-blue-800',
      'Financial': 'bg-green-100 text-green-800',
      'Strategic': 'bg-purple-100 text-purple-800',
      'Compliance': 'bg-orange-100 text-orange-800',
      'Technological': 'bg-indigo-100 text-indigo-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getInsightSeverityColor = (severity: string) => {
    const colors = {
      'low': 'bg-green-100 text-green-800 border-green-200',
      'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'high': 'bg-orange-100 text-orange-800 border-orange-200',
      'critical': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[severity as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'risk': return AlertCircle;
      case 'trend': return TrendingUp;
      case 'opportunity': return Star;
      case 'anomaly': return Shield;
      default: return AlertCircle;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#199BEC]" />
            <h1 className="text-xl font-semibold text-gray-900">Risk Register</h1>
          </div>
          <Badge className="bg-[#199BEC]/10 text-[#199BEC] border-[#199BEC]/30">
            <Sparkles className="w-3 h-3 mr-1" />
            AI Enhanced
          </Badge>
          {hasUnsavedChanges && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
              Unsaved Changes
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search across all data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64 h-8 text-sm"
            />
          </div>
          
          <Button variant="secondary" size="sm" className="h-8">
            <Filter className="w-4 h-4 mr-1" />
            Filter
          </Button>
          
          <Button variant="secondary" size="sm" className="h-8">
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
          
          <Button 
            variant="secondary" 
            size="sm" 
            className="h-8 text-[#199BEC] border-[#199BEC]/30 hover:bg-[#199BEC]/10"
            onClick={() => {
              setIsAIInsightsOpen(true);
              if (aiInsights.length === 0) {
                generateAIInsights();
              }
            }}
          >
            <Image 
              src="/images/logo/riscura.png" 
              alt="Riscura" 
              width={14} 
              height={14} 
              className="mr-1"
            />
            AI Insights
          </Button>

          {hasUnsavedChanges && (
            <Button 
              size="sm" 
              className="h-8 bg-[#199BEC] hover:bg-[#199BEC]/90"
              onClick={saveData}
            >
              <Save className="w-4 h-4 mr-1" />
              Save
            </Button>
          )}
        </div>
      </div>

      {/* Enhanced Spreadsheet */}
      <div className="flex-1 overflow-auto bg-gray-50/30">
        <div className="min-w-fit">
          {/* Enhanced Headers */}
          <div className="flex sticky top-0 z-20 bg-white border-b-2 border-gray-300 shadow-sm">
            <div className="w-12 h-10 flex items-center justify-center border-r border-gray-200 bg-gray-100">
              <span className="text-xs font-medium text-gray-500">#</span>
            </div>
            {columns.map((column) => (
              <div 
                key={column.id} 
                className="h-10 flex items-center px-3 border-r border-gray-200 bg-gray-50/80 hover:bg-gray-100 transition-colors"
                style={{ width: column.width }}
              >
                <column.icon className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-700 truncate">{column.name}</span>
              </div>
            ))}
            <div className="w-12 h-10 flex items-center justify-center bg-gray-50/80 hover:bg-gray-100 transition-colors">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-[#199BEC]/10"
                onClick={() => setIsAddColumnDialogOpen(true)}
              >
                <Plus className="w-4 h-4 text-[#199BEC]" />
              </Button>
            </div>
          </div>

          {/* Enhanced Data Rows */}
          {filteredRows.map((row, index) => (
            <div key={row.id} className={`flex group hover:bg-blue-50/30 border-b border-gray-200 ${row.isNew ? 'bg-green-50/30' : ''}`}>
              <div className="w-12 h-12 flex items-center justify-center border-r border-gray-200 bg-gray-50/50">
                <span className="text-xs text-gray-500 font-medium">{index + 1}</span>
              </div>
              {columns.map((column) => (
                <div 
                  key={column.id} 
                  className="h-12 border-r border-gray-200 bg-white hover:bg-blue-50/50 transition-colors"
                  style={{ width: column.width }}
                >
                  {renderCell(row, column)}
                </div>
              ))}
              <div className="w-12 h-12 flex items-center justify-center bg-white">
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                  onClick={() => deleteRow(row.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}

          {/* Enhanced Add Row */}
          <div className="flex border-b border-gray-200 bg-white hover:bg-green-50/30 transition-colors">
            <div className="w-12 h-10 flex items-center justify-center border-r border-gray-200 bg-gray-50/50">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-[#199BEC]/10"
                onClick={addRow}
              >
                <Plus className="w-4 h-4 text-[#199BEC]" />
              </Button>
            </div>
            <div className="flex-1 h-10 bg-gray-50/30 flex items-center px-3">
              <span className="text-sm text-gray-500">Click + to add new row</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Column Dialog */}
      <Dialog open={isAddColumnDialogOpen} onOpenChange={setIsAddColumnDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Column</DialogTitle>
            <DialogDescription>
              Create a new column for your spreadsheet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Column Name</label>
              <Input
                value={newColumn.name}
                onChange={(e) => setNewColumn(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter column name"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Column Type</label>
              <Select value={newColumn.type} onValueChange={(value: 'text' | 'number' | 'date' | 'select') => 
                setNewColumn(prev => ({ ...prev, type: value }))
              }>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="select">Select</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newColumn.type === 'select' && (
              <div>
                <label className="text-sm font-medium">Options (comma-separated)</label>
                <Input
                  value={newColumn.options}
                  onChange={(e) => setNewColumn(prev => ({ ...prev, options: e.target.value }))}
                  placeholder="Option 1, Option 2, Option 3"
                  className="mt-1"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsAddColumnDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addColumn} disabled={!newColumn.name.trim()}>
              Add Column
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Insights Dialog */}
      <Dialog open={isAIInsightsOpen} onOpenChange={setIsAIInsightsOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Image 
                src="/images/logo/riscura.png" 
                alt="Riscura" 
                width={20} 
                height={20}
              />
              AI Insights & Recommendations
            </DialogTitle>
            <DialogDescription>
              AI-powered analysis of your risk data with actionable recommendations.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto space-y-4">
            {isGeneratingInsights ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#199BEC] mx-auto mb-4"></div>
                  <p className="text-gray-600">Analyzing your data...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {aiInsights.map((insight) => {
                  const IconComponent = getInsightIcon(insight.type);
                  return (
                    <Card key={insight.id} className={`border-l-4 ${getInsightSeverityColor(insight.severity)}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full ${getInsightSeverityColor(insight.severity)}`}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-gray-900">{insight.title}</h4>
                              <Badge variant="secondary" className={getInsightSeverityColor(insight.severity)}>
                                {insight.severity}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {Math.round(insight.confidence * 100)}% confidence
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <h5 className="text-sm font-medium text-blue-900 mb-1">Recommendation</h5>
                              <p className="text-sm text-blue-800">{insight.recommendation}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsAIInsightsOpen(false)}>
              Close
            </Button>
            <Button onClick={generateAIInsights} disabled={isGeneratingInsights}>
              <Sparkles className="w-4 h-4 mr-2" />
              Refresh Insights
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 