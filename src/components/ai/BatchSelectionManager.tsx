import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Square, 
  Download, 
  Trash2, 
  CheckSquare, 
  Square as UncheckedSquare,
  Archive,
  Zap,
  Loader2 as ProgressIcon,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

import { TextSelection } from '@/hooks/useTextSelection';
import { AIAction } from './SelectableContent';
import { ContentAnalysisResult } from './ContentAnalysisPanel';
import { cn } from '@/lib/utils';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyCard, DaisyCardBody } from '@/components/ui/DaisyCard';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DaisySelect } from '@/components/ui/DaisySelect';
import { useToast } from '@/hooks/use-toast';

export interface BatchSelectionItem {
  id: string;
  selection: TextSelection;
  actions: AIAction[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'processing' | 'completed' | 'error' | 'skipped';
  results?: ContentAnalysisResult[];
  timestamp: Date;
}

export interface BatchProcessingQueue {
  id: string;
  name: string;
  items: BatchSelectionItem[];
  totalItems: number;
  completedItems: number;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  estimatedTimeRemaining?: number;
  startTime?: Date;
  endTime?: Date;
}

export interface BatchSelectionManagerProps {
  isOpen: boolean;
  onClose: () => void;
  selections: BatchSelectionItem[];
  onProcessBatch: (items: BatchSelectionItem[], actions: AIAction[]) => Promise<void>;
  onUpdateItem: (itemId: string, updates: Partial<BatchSelectionItem>) => void;
  onRemoveItem: (itemId: string) => void;
  onClearAll: () => void;
  className?: string;
  maxConcurrentTasks?: number;
}

export const BatchSelectionManager: React.FC<BatchSelectionManagerProps> = ({
  isOpen,
  onClose,
  selections,
  onProcessBatch,
  onUpdateItem,
  onRemoveItem,
  onClearAll,
  className,
  maxConcurrentTasks = 3,
}) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [processingQueue, setProcessingQueue] = useState<BatchProcessingQueue | null>(null);
  const [selectedAction, setSelectedAction] = useState<AIAction>('improve');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const queueRef = useRef<BatchProcessingQueue | null>(null);
  const { toast } = useToast();

  // Toggle item selection
  const toggleItemSelection = useCallback((itemId: string) => {
    setSelectedItems((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  // Select all items
  const selectAll = useCallback(() => {
    setSelectedItems(new Set(selections.map((item: BatchSelectionItem) => item.id)));
  }, [selections]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  // Get priority color
  const getPriorityColor = (priority: BatchSelectionItem['priority']) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'high': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
      case 'medium': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'low': return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  // Get status icon
  const getStatusIcon = (status: BatchSelectionItem['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'error': return <DaisyAlertCircle className="h-4 w-4 text-red-600" />;
      case 'processing': return <DaisyProgressIcon className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'skipped': return <Square className="h-4 w-4 text-gray-400" />;
      default: return <Square className="h-4 w-4 text-gray-400" />;
    }
  };

  // Start batch processing
  const startBatchProcessing = useCallback(async () => {
    const itemsToProcess = selections.filter((item: BatchSelectionItem) => selectedItems.has(item.id));
    
    if (itemsToProcess.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select items to process.",
        variant: "destructive",
      });
      return;
    }

    const queue: BatchProcessingQueue = {
      id: `batch-${Date.now()}`,
      name: `Batch Processing ${new Date().toLocaleTimeString()}`,
      items: itemsToProcess,
      totalItems: itemsToProcess.length,
      completedItems: 0,
      status: 'running' as const,
      startTime: new Date(),
    };

    setProcessingQueue(queue);
    queueRef.current = queue;
    setProcessingProgress(0);
    setIsPaused(false);

    try {
      await onProcessBatch(itemsToProcess, [selectedAction]);
      
      // Update queue status
      queue.status = 'completed' as const;
      queue.endTime = new Date();
      queue.completedItems = itemsToProcess.length;
      setProcessingQueue({ ...queue });
      setProcessingProgress(100);

      toast({
        title: "Batch processing complete",
        description: `Successfully processed ${itemsToProcess.length} items.`,
      });
    } catch (error) {
      queue.status = 'error' as const;
      setProcessingQueue({ ...queue });
      
      toast({
        title: "Batch processing failed",
        description: "Some items could not be processed.",
        variant: "destructive",
      });
    }
  }, [selections, selectedItems, selectedAction, onProcessBatch, toast]);

  // Pause/Resume processing
  const togglePause = useCallback(() => {
    setIsPaused(!isPaused);
    if (processingQueue) {
      const newStatus: 'running' | 'paused' = isPaused ? 'running' : 'paused';
      const updatedQueue = { 
        ...processingQueue, 
        status: newStatus 
      };
      setProcessingQueue(updatedQueue);
    }
  }, [isPaused, processingQueue]);

  // Stop processing
  const stopProcessing = useCallback(() => {
    if (processingQueue) {
      const updatedQueue = { 
        ...processingQueue, 
        status: 'idle' as const,
        endTime: new Date(),
      };
      setProcessingQueue(updatedQueue);
      setProcessingProgress(0);
      setIsPaused(false);
    }
  }, [processingQueue]);

  // Export batch results
  const exportResults = useCallback(() => {
    const exportData = {
      timestamp: new Date().toISOString(),
      totalSelections: selections.length,
      selectedItems: Array.from(selectedItems),
      queue: processingQueue,
      results: selections.map((item: BatchSelectionItem) => ({
        id: item.id,
        contentType: item.selection.context.contentType,
        contentId: item.selection.context.contentId,
        text: item.selection.text,
        actions: item.actions,
        priority: item.priority,
        status: item.status,
        results: item.results?.length || 0,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `batch-selections-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export complete",
      description: "Batch selection data has been exported.",
    });
  }, [selections, selectedItems, processingQueue, toast]);

  // Calculate statistics
  const stats = {
    total: selections.length,
    selected: selectedItems.size,
    pending: selections.filter((item: BatchSelectionItem) => item.status === 'pending').length,
    processing: selections.filter((item: BatchSelectionItem) => item.status === 'processing').length,
    completed: selections.filter((item: BatchSelectionItem) => item.status === 'completed').length,
    errors: selections.filter((item: BatchSelectionItem) => item.status === 'error').length,
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={cn(
              'fixed inset-4 md:inset-10 bg-background border rounded-lg shadow-xl z-50',
              'flex flex-col max-h-[90vh]',
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <Zap className="h-6 w-6 text-primary" />
                <div>
                  <h2 className="text-xl font-semibold">Batch Selection Manager</h2>
                  <p className="text-sm text-muted-foreground">
                    Process multiple selections with AI actions
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <DaisyButton variant="outline" onClick={exportResults}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </DaisyButton>
                <DaisyButton variant="outline" onClick={onClose}>
                  Close
                </DaisyButton>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="p-4 bg-muted/30 border-b">
              <div className="grid grid-cols-6 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold">{stats.total}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-blue-600">{stats.selected}</div>
                  <div className="text-xs text-muted-foreground">Selected</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-600">{stats.pending}</div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-yellow-600">{stats.processing}</div>
                  <div className="text-xs text-muted-foreground">Processing</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-green-600">{stats.completed}</div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-red-600">{stats.errors}</div>
                  <div className="text-xs text-muted-foreground">Errors</div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="p-4 border-b bg-card space-y-4">
              {/* Selection Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DaisyButton variant="outline" size="sm" onClick={selectAll}>
                    Select All
                  </DaisyButton>
                  <DaisyButton variant="outline" size="sm" onClick={clearSelection}>
                    Clear
                  </DaisyButton>
                  <DaisyButton variant="outline" size="sm" onClick={onClearAll}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All
                  </DaisyButton>
                </div>
                
                <div className="flex items-center gap-2">
                  <DaisySelect value={selectedAction} onValueChange={(value: AIAction) => setSelectedAction(value)}>
                    <DaisySelectTrigger className="w-40">
                      <DaisySelectValue />
                    </SelectTrigger>
                    <DaisySelectContent>
                      <DaisySelectItem value="explain">Explain</SelectItem>
                      <DaisySelectItem value="improve">Improve</SelectItem>
                      <DaisySelectItem value="regenerate">Regenerate</SelectItem>
                      <DaisySelectItem value="alternatives">Alternatives</SelectItem>
                      <DaisySelectItem value="compliance-check">Compliance Check</SelectItem>
                    </SelectContent>
                  </DaisySelect>
                </div>
              </div>

              {/* Processing Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {!processingQueue || processingQueue.status === 'idle' ? (
                    <DaisyButton onClick={startBatchProcessing} disabled={selectedItems.size === 0}>
                      <Play className="h-4 w-4 mr-2" />
                      Start Processing
                    </DaisyButton>
                  ) : (
                    <>
                      <DaisyButton onClick={togglePause} variant="outline">
                        {isPaused ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
                        {isPaused ? 'Resume' : 'Pause'}
                      </DaisyButton>
                      <DaisyButton onClick={stopProcessing} variant="danger">
                        <Square className="h-4 w-4 mr-2" />
                        Stop
                      </DaisyButton>
                    </>
                  )}
                </div>

                {processingQueue && processingQueue.status !== 'idle' && (
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      {processingQueue.completedItems} / {processingQueue.totalItems}
                    </div>
                    <DaisyProgress value={processingProgress} className="w-32" />
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {selections.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <Archive className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Selections</h3>
                  <p className="text-muted-foreground">
                    Make text selections with AI actions to see them here for batch processing.
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-full p-4">
                  <div className="space-y-3">
                    {selections.map((item: BatchSelectionItem) => (
                      <DaisyCard 
                        key={item.id}
                        className={cn(
                          'transition-all duration-200 cursor-pointer',
                          selectedItems.has(item.id) && 'ring-2 ring-primary ring-offset-2'
                        )}
                        onClick={() => toggleItemSelection(item.id)}
                      >
                        <DaisyCardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              {selectedItems.has(item.id) ? (
                                <CheckSquare className="h-4 w-4 text-primary" />
                              ) : (
                                <UncheckedSquare className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                {getStatusIcon(item.status)}
                                <DaisyBadge 
                                  className={getPriorityColor(item.priority)}
                                >
                                  {item.priority}
                                </DaisyBadge>
                                <DaisyBadge>
                                  {item.selection.context.contentType}
                                </DaisyBadge>
                              </div>
                              
                              <div className="text-sm font-medium mb-1">
                                "{item.selection.text.slice(0, 80)}..."
                              </div>
                              
                              <div className="text-xs text-muted-foreground mb-2">
                                {item.selection.context.contentType} • {item.selection.context.contentId}
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Actions:</span>
                                {item.actions.map((action: AIAction) => (
                                  <DaisyBadge key={action} className="text-xs">
                                    {action}
                                  </DaisyBadge>
                                ))}
                              </div>
                              
                              {item.results && item.results.length > 0 && (
                                <div className="mt-2 text-xs text-muted-foreground">
                                  {item.results.length} result(s) available
                                </div>
                              )}
                            </div>
                            
                            <DaisyButton
                              variant="ghost"
                              size="sm"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                onRemoveItem(item.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </DaisyButton>
                          </div>
                        </DaisyCardBody>
                      </DaisyCard>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}; 