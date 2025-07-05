'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Sparkles,
  CheckCircle,
  AlertCircle,
  Clock,
  MoreHorizontal,
  Search,
  Filter,
  Download,
  Upload,
  Settings,
  Hash,
  Shield,
  FileText,
  Zap,
  Brain,
  Link2,
  Eye,
  Edit3,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { useRCSA } from '@/context/RCSAContext';
import { rcsaApiClient } from '@/lib/api/rcsa-client';
import { 
  Risk, 
  Control, 
  TestScript,
  RiskLevel,
  ControlStatus,
  TestFrequency,
  AutomationLevel
} from '@/types/rcsa.types';
import { cn } from '@/lib/utils';
import { AIControlGenerator } from '@/components/probo/AIControlGenerator';
import { useDebounce } from '@/hooks/useDebounce';
import { useVirtualizer } from '@tanstack/react-virtual';

// Notion-like color palette
const colors = {
  background: 'bg-white dark:bg-gray-900',
  surface: 'bg-gray-50 dark:bg-gray-800',
  border: 'border-gray-200 dark:border-gray-700',
  text: {
    primary: 'text-gray-900 dark:text-gray-100',
    secondary: 'text-gray-600 dark:text-gray-400',
    muted: 'text-gray-500 dark:text-gray-500'
  },
  hover: 'hover:bg-gray-100 dark:hover:bg-gray-800',
  active: 'bg-blue-50 dark:bg-blue-900/20',
  accent: {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    amber: 'text-amber-600 dark:text-amber-400',
    red: 'text-red-600 dark:text-red-400'
  }
};

// Entity types
type EntityType = 'risk' | 'control' | 'testScript';

interface EntityRow {
  id: string;
  type: EntityType;
  data: Risk | Control | TestScript;
  children?: EntityRow[];
  isExpanded?: boolean;
  level: number;
  parentId?: string;
}

// Column definitions
interface Column {
  id: string;
  label: string;
  width: number;
  minWidth: number;
  render: (row: EntityRow) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
}

export function NotionRCSASpreadsheet() {
  const router = useRouter();
  const { risks, controls, refreshData } = useRCSA();
  const [testScripts, setTestScripts] = useState<TestScript[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [currentEntity, setCurrentEntity] = useState<EntityRow | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fetch test scripts
  useEffect(() => {
    fetchTestScripts();
  }, []);

  const fetchTestScripts = async () => {
    try {
      const response = await rcsaApiClient.getTestScripts();
      if (response.success && response.data) {
        setTestScripts(response.data.data || []);
      }
    } catch (error) {
      toast.error('Failed to load test scripts');
    } finally {
      setLoading(false);
    }
  };

  // Build hierarchical data structure
  const rows = useMemo(() => {
    const rowsMap = new Map<string, EntityRow>();
    const topLevelRows: EntityRow[] = [];

    // Add risks as top-level
    risks.forEach(risk => {
      const riskRow: EntityRow = {
        id: `risk-${risk.id}`,
        type: 'risk',
        data: risk,
        children: [],
        isExpanded: expandedRows.has(`risk-${risk.id}`),
        level: 0
      };
      rowsMap.set(riskRow.id, riskRow);
      topLevelRows.push(riskRow);
    });

    // Add controls under their associated risks
    controls.forEach(control => {
      const controlRow: EntityRow = {
        id: `control-${control.id}`,
        type: 'control',
        data: control,
        children: [],
        isExpanded: expandedRows.has(`control-${control.id}`),
        level: 1,
        parentId: control.risks?.[0]?.riskId ? `risk-${control.risks[0].riskId}` : undefined
      };

      if (controlRow.parentId && rowsMap.has(controlRow.parentId)) {
        rowsMap.get(controlRow.parentId)!.children!.push(controlRow);
      } else {
        // Orphaned controls
        controlRow.level = 0;
        topLevelRows.push(controlRow);
      }
      rowsMap.set(controlRow.id, controlRow);
    });

    // Add test scripts under their associated controls
    testScripts.forEach(testScript => {
      testScript.controls?.forEach(controlTestScript => {
        const testScriptRow: EntityRow = {
          id: `testscript-${testScript.id}`,
          type: 'testScript',
          data: testScript,
          level: 2,
          parentId: `control-${controlTestScript.controlId}`
        };

        if (rowsMap.has(testScriptRow.parentId!)) {
          const parent = rowsMap.get(testScriptRow.parentId!)!;
          if (!parent.children!.some(child => child.id === testScriptRow.id)) {
            parent.children!.push(testScriptRow);
          }
        }
      });
    });

    // Filter based on search
    if (debouncedSearchQuery) {
      return filterRows(topLevelRows, debouncedSearchQuery.toLowerCase());
    }

    return topLevelRows;
  }, [risks, controls, testScripts, expandedRows, debouncedSearchQuery]);

  // Flatten rows for virtual scrolling
  const flattenedRows = useMemo(() => {
    const flattened: EntityRow[] = [];
    
    const addRow = (row: EntityRow) => {
      flattened.push(row);
      if (row.isExpanded && row.children) {
        row.children.forEach(addRow);
      }
    };
    
    rows.forEach(addRow);
    return flattened;
  }, [rows]);

  // Virtual scrolling
  const virtualizer = useVirtualizer({
    count: flattenedRows.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 52,
    overscan: 10
  });

  // Filter rows based on search
  const filterRows = (rows: EntityRow[], query: string): EntityRow[] => {
    return rows.reduce((filtered, row) => {
      const matchesQuery = 
        (row.type === 'risk' && (row.data as Risk).title.toLowerCase().includes(query)) ||
        (row.type === 'control' && (row.data as Control).title.toLowerCase().includes(query)) ||
        (row.type === 'testScript' && (row.data as TestScript).title.toLowerCase().includes(query));
      
      const filteredChildren = row.children ? filterRows(row.children, query) : [];
      
      if (matchesQuery || filteredChildren.length > 0) {
        filtered.push({
          ...row,
          children: filteredChildren,
          isExpanded: filteredChildren.length > 0 // Auto-expand if children match
        });
      }
      
      return filtered;
    }, [] as EntityRow[]);
  };

  // Column definitions
  const columns: Column[] = [
    {
      id: 'title',
      label: 'Title',
      width: 400,
      minWidth: 300,
      render: (row) => (
        <div className="flex items-center gap-2" style={{ paddingLeft: `${row.level * 24}px` }}>
          {row.children && row.children.length > 0 && (
            <button
              onClick={() => toggleExpand(row.id)}
              className={cn(
                'p-0.5 rounded transition-transform duration-200',
                colors.hover,
                row.isExpanded ? 'rotate-0' : '-rotate-90'
              )}
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          )}
          
          <div className="flex items-center gap-2">
            {row.type === 'risk' && <Shield className="h-4 w-4 text-blue-500" />}
            {row.type === 'control' && <CheckCircle className="h-4 w-4 text-green-500" />}
            {row.type === 'testScript' && <FileText className="h-4 w-4 text-purple-500" />}
            
            <span className={cn('font-medium', colors.text.primary)}>
              {row.type === 'risk' && (row.data as Risk).title}
              {row.type === 'control' && (row.data as Control).title}
              {row.type === 'testScript' && (row.data as TestScript).title}
            </span>
          </div>
        </div>
      ),
      sortable: true
    },
    {
      id: 'status',
      label: 'Status',
      width: 150,
      minWidth: 120,
      render: (row) => {
        if (row.type === 'risk') {
          const risk = row.data as Risk;
          return (
            <div className={cn(
              'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
              risk.riskLevel === 'CRITICAL' && 'bg-red-100 text-red-700 dark:bg-red-900/30',
              risk.riskLevel === 'HIGH' && 'bg-orange-100 text-orange-700 dark:bg-orange-900/30',
              risk.riskLevel === 'MEDIUM' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30',
              risk.riskLevel === 'LOW' && 'bg-green-100 text-green-700 dark:bg-green-900/30'
            )}>
              {risk.riskLevel || 'Not Assessed'}
            </div>
          );
        }
        if (row.type === 'control') {
          const control = row.data as Control;
          return (
            <div className={cn(
              'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
              control.status === 'EFFECTIVE' && 'bg-green-100 text-green-700 dark:bg-green-900/30',
              control.status === 'NEEDS_IMPROVEMENT' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30',
              control.status === 'INEFFECTIVE' && 'bg-red-100 text-red-700 dark:bg-red-900/30',
              control.status === 'PLANNED' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30'
            )}>
              {control.status}
            </div>
          );
        }
        if (row.type === 'testScript') {
          const testScript = row.data as TestScript;
          return (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className={colors.text.secondary}>{testScript.frequency}</span>
            </div>
          );
        }
        return null;
      },
      filterable: true
    },
    {
      id: 'automation',
      label: 'Automation',
      width: 120,
      minWidth: 100,
      render: (row) => {
        if (row.type === 'control') {
          const control = row.data as Control;
          return (
            <div className="flex items-center gap-1">
              {control.automationLevel === 'AUTOMATED' && <Zap className="h-4 w-4 text-blue-500" />}
              <span className={colors.text.secondary}>{control.automationLevel}</span>
            </div>
          );
        }
        if (row.type === 'testScript') {
          const testScript = row.data as TestScript;
          return testScript.automationCapable ? (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Yes</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-gray-400">
              <AlertCircle className="h-4 w-4" />
              <span>No</span>
            </div>
          );
        }
        return null;
      }
    },
    {
      id: 'aiGenerate',
      label: 'AI Actions',
      width: 150,
      minWidth: 120,
      render: (row) => (
        <div className="flex items-center gap-1">
          {row.type === 'risk' && (
            <button
              onClick={() => handleGenerateControl(row)}
              className={cn(
                'inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium',
                'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30',
                'transition-colors duration-200'
              )}
            >
              <Sparkles className="h-3 w-3" />
              Generate Control
            </button>
          )}
          {row.type === 'control' && (
            <button
              onClick={() => handleGenerateTestScript(row)}
              className={cn(
                'inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium',
                'bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-900/30',
                'transition-colors duration-200'
              )}
            >
              <Brain className="h-3 w-3" />
              Generate Test
            </button>
          )}
        </div>
      )
    },
    {
      id: 'actions',
      label: '',
      width: 100,
      minWidth: 80,
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleView(row)}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              colors.hover,
              colors.text.secondary
            )}
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleEdit(row)}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              colors.hover,
              colors.text.secondary
            )}
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleMore(row)}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              colors.hover,
              colors.text.secondary
            )}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  // Event handlers
  const toggleExpand = (rowId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  };

  const handleGenerateControl = (row: EntityRow) => {
    setCurrentEntity(row);
    setShowAIGenerator(true);
  };

  const handleGenerateTestScript = async (row: EntityRow) => {
    const control = row.data as Control;
    try {
      toast.loading('Generating test script...');
      const response = await rcsaApiClient.generateTestScript({
        controlId: control.id,
        controlDescription: control.description
      });
      
      if (response.success && response.data) {
        toast.success('Test script generated successfully');
        // Create the test script
        const createResponse = await rcsaApiClient.createTestScript({
          ...response.data.testScript,
          controlIds: [control.id]
        });
        
        if (createResponse.success) {
          await fetchTestScripts();
          toast.success('Test script created and linked to control');
        }
      }
    } catch (error) {
      toast.error('Failed to generate test script');
    }
  };

  const handleView = (row: EntityRow) => {
    if (row.type === 'risk') {
      router.push(`/risks/${(row.data as Risk).id}`);
    } else if (row.type === 'control') {
      router.push(`/controls/${(row.data as Control).id}`);
    } else if (row.type === 'testScript') {
      router.push(`/test-scripts/${(row.data as TestScript).id}`);
    }
  };

  const handleEdit = (row: EntityRow) => {
    // Open edit modal or navigate to edit page
    handleView(row);
  };

  const handleMore = (row: EntityRow) => {
    // Show context menu with more options
    console.log('More options for:', row);
  };

  const handleControlGenerated = async (control: any) => {
    await refreshData();
    setShowAIGenerator(false);
    toast.success('Control generated successfully');
  };

  return (
    <div className={cn('flex flex-col h-full', colors.background)}>
      {/* Header */}
      <div className={cn('flex items-center justify-between p-4 border-b', colors.border)}>
        <div className="flex items-center gap-4">
          <h1 className={cn('text-2xl font-semibold', colors.text.primary)}>
            RCSA Spreadsheet
          </h1>
          <div className={cn('text-sm', colors.text.secondary)}>
            {flattenedRows.length} items
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className={cn('absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4', colors.text.muted)} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                'pl-9 pr-3 py-2 rounded-lg border bg-white dark:bg-gray-800',
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
                colors.border,
                colors.text.primary
              )}
            />
          </div>
          
          {/* Actions */}
          <button className={cn('p-2 rounded-lg', colors.hover)}>
            <Filter className="h-4 w-4" />
          </button>
          <button className={cn('p-2 rounded-lg', colors.hover)}>
            <Download className="h-4 w-4" />
          </button>
          <button className={cn('p-2 rounded-lg', colors.hover)}>
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Spreadsheet */}
      <div className="flex-1 overflow-hidden">
        {/* Column headers */}
        <div className={cn('flex border-b sticky top-0 z-10', colors.border, colors.surface)}>
          {columns.map(column => (
            <div
              key={column.id}
              className={cn(
                'px-4 py-3 font-medium text-sm',
                colors.text.secondary
              )}
              style={{ width: column.width, minWidth: column.minWidth }}
            >
              {column.label}
            </div>
          ))}
        </div>

        {/* Virtual scrolling container */}
        <div
          ref={scrollContainerRef}
          className="h-full overflow-auto"
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative'
            }}
          >
            {virtualizer.getVirtualItems().map(virtualItem => {
              const row = flattenedRows[virtualItem.index];
              return (
                <div
                  key={virtualItem.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`
                  }}
                >
                  <div className={cn(
                    'flex items-center border-b',
                    colors.border,
                    selectedRows.has(row.id) && colors.active,
                    'hover:bg-gray-50 dark:hover:bg-gray-800/50',
                    'transition-colors duration-150'
                  )}>
                    {columns.map(column => (
                      <div
                        key={column.id}
                        className="px-4 py-3"
                        style={{ width: column.width, minWidth: column.minWidth }}
                      >
                        {column.render(row)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* AI Generator Modal */}
      <AnimatePresence>
        {showAIGenerator && currentEntity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAIGenerator(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <AIControlGenerator
                riskId={(currentEntity.data as Risk).id}
                onControlGenerated={handleControlGenerated}
                onClose={() => setShowAIGenerator(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}