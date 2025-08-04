import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { 
  X, 
  Check,
  RotateCcw,
  Copy,
  Download,
  Sparkles,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

import { TextSelection } from '@/hooks/useTextSelection';
import { AIAction } from './SelectableContent';
import { cn } from '@/lib/utils';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisyScrollArea } from '@/components/ui/DaisyScrollArea';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { useToast } from '@/hooks/use-toast';

export interface ContentAnalysisResult {
  id: string;
  action: AIAction;
  selection: TextSelection;
  result: {
    type: 'explanation' | 'suggestion' | 'replacement' | 'analysis';
    content: string;
    confidence: number;
    alternatives?: string[];
    metadata?: Record<string, unknown>;
  };
  timestamp: Date;
  status: 'pending' | 'completed' | 'error';
  feedback?: 'positive' | 'negative';
}

export interface ContentAnalysisPanelProps {
  isOpen: boolean;
  onClose: () => void;
  results: ContentAnalysisResult[];
  onApprove?: (resultId: string) => void;
  onReject?: (resultId: string) => void;
  onFeedback?: (resultId: string, feedback: 'positive' | 'negative') => void;
  onRetry?: (resultId: string) => void;
  className?: string;
  width?: number;
  position?: 'right' | 'left';
}

export const ContentAnalysisPanel: React.FC<ContentAnalysisPanelProps> = ({
  isOpen,
  onClose,
  results,
  onApprove,
  onReject,
  onFeedback,
  onRetry,
  className,
  width = 400,
  position = 'right',
}) => {
  const [panelWidth, setPanelWidth] = useState(width);
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Handle panel resizing
  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const deltaX = position === 'right' ? -info.delta.x : info.delta.x;
    const newWidth = Math.max(300, Math.min(800, panelWidth + deltaX));
    setPanelWidth(newWidth);
    setIsDragging(false);
  }, [panelWidth, position]);

  // Copy content to clipboard
  const copyToClipboard = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copied to clipboard",
        description: "Content has been copied to your clipboard.",
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Failed to copy content to clipboard.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Export analysis results
  const exportResults = useCallback(() => {
    const exportData = {
      timestamp: new Date().toISOString(),
      totalResults: results.length,
      results: results.map(result => ({
        action: result.action,
        content: result.result.content,
        confidence: result.result.confidence,
        timestamp: result.timestamp,
        feedback: result.feedback,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-analysis-results-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export complete",
      description: "Analysis results have been exported to JSON.",
    });
  }, [results, toast]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const ResultCard: React.FC<{ result: ContentAnalysisResult }> = ({ result }) => {
    const getStatusColor = (status: ContentAnalysisResult['status']) => {
      switch (status) {
        case 'completed': return 'text-green-600';
        case 'error': return 'text-red-600';
        case 'pending': return 'text-yellow-600';
        default: return 'text-muted-foreground';
      }
    };

    const getActionLabel = (action: AIAction) => {
      const labels = {
        explain: 'Explanation',
        regenerate: 'Regenerated Content',
        improve: 'Improvement',
        alternatives: 'Alternatives',
        'compliance-check': 'Compliance Check',
        'find-related': 'Related Content',
        'analyze-risk': 'Risk Analysis',
        'suggest-controls': 'Control Suggestions',
      };
      return labels[action] || action;
    };

    return (
      <DaisyCard className="mb-4 transition-all duration-200" >
  <DaisyCardBody className="pb-3" >
</DaisyCard>
          <div className="flex items-center justify-between">
            <DaisyCardTitle className="text-sm flex items-center gap-2" >
  <span>
</DaisyCardTitle>{getActionLabel(result.action)}</span>
              <DaisyBadge variant="outline" className={getStatusColor(result.status)} >
  {result.status}
</DaisyBadge>
              </DaisyBadge>
            </DaisyCardTitle>
            <div className="flex items-center gap-1">
              <DaisyButton 
                variant="ghost" 
                size="sm"
                onClick={() => copyToClipboard(result.result.content)} />
                <Copy className="h-3 w-3" />
              </DaisyButton>
              {result.status === 'error' && onRetry && (
                <DaisyButton 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onRetry(result.id)} />
                  <RotateCcw className="h-3 w-3" />
                </DaisyButton>
              )}
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Selected: "{result.selection.text.slice(0, 50)}..."
          </div>
        
        <DaisyCardBody >
  <div className="space-y-3">
</DaisyCardBody>
            {/* Result Content */}
            <div className="text-sm">
              {result.result.type === 'replacement' ? (
                <div className="space-y-2">
                  <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded border-l-2 border-red-300">
                    <div className="text-xs text-muted-foreground mb-1">Original:</div>
                    <div className="line-through opacity-75">{result.selection.text}</div>
                  </div>
                  <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded border-l-2 border-green-300">
                    <div className="text-xs text-muted-foreground mb-1">Suggested:</div>
                    <div>{result.result.content}</div>
                  </div>
                </div>
              ) : (
                <div className="whitespace-pre-wrap">{result.result.content}</div>
              )}
            </div>

            {/* Confidence Score */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Confidence:</span>
              <div className="flex-1 bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${result.result.confidence * 100}%` }} />
              </div>
              <span className="text-xs font-medium">
                {Math.round(result.result.confidence * 100)}%
              </span>
            </div>

            {/* Alternatives */}
            {result.result.alternatives && result.result.alternatives.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Alternatives:</div>
                {result.result.alternatives.slice(0, 2).map((alt, index) => (
                  <div key={index} className="text-xs p-2 bg-muted/50 rounded">
                    {alt}
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2">
                {onFeedback && (
                  <>
                    <DaisyButton
                      variant="ghost"
                      size="sm"
                      onClick={() => onFeedback(result.id, 'positive')}
                      className={cn(
                        'h-7 px-2',
                        result.feedback === 'positive' && 'bg-green-100 text-green-700'
                      )} />
                      <ThumbsUp className="h-3 w-3" />
                    </DaisyButton>
                    <DaisyButton
                      variant="ghost"
                      size="sm"
                      onClick={() => onFeedback(result.id, 'negative')}
                      className={cn(
                        'h-7 px-2',
                        result.feedback === 'negative' && 'bg-red-100 text-red-700'
                      )} />
                      <ThumbsDown className="h-3 w-3" />
                    </DaisyButton>
                  </>
                )}
              </div>
              
              {result.result.type === 'replacement' && (
                <div className="flex items-center gap-2">
                  {onReject && (
                    <DaisyButton variant="outline" size="sm" onClick={() =>
          onReject(result.id)} />
                      Reject
                    
        </DaisyButton>
                  )}
                  {onApprove && (
                    <DaisyButton size="sm" onClick={() => onApprove(result.id)} />
                      <Check className="h-3 w-3 mr-1" />
                      Apply
                    </DaisyButton>
                  )}
                </div>
              )}
            </div>
          </div>
        </DaisyCardBody>
      </DaisyCard>
    );
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
            onClick={onClose} />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            initial={{ 
              x: position === 'right' ? '100%' : '-100%',
              opacity: 0 
            }}
            animate={{ 
              x: 0,
              opacity: 1 
            }}
            exit={{ 
              x: position === 'right' ? '100%' : '-100%',
              opacity: 0 
            }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            drag={position === 'right' ? 'x' : 'x'}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.1}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            className={cn(
              'fixed top-0 bottom-0 bg-background border-l shadow-xl z-50 flex flex-col',
              position === 'right' ? 'right-0' : 'left-0 border-r border-l-0',
              isDragging && 'cursor-ew-resize',
              className
            )}
            style={{ width: panelWidth }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-card">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">AI Analysis</h2>
                <DaisyBadge variant="secondary">{results.length}</DaisyBadge>
              </div>
              
              <div className="flex items-center gap-1">
                <DaisyButton variant="ghost" size="sm" onClick={exportResults} >
  <Download className="h-4 w-4" />
</DaisyButton>
                </DaisyButton>
                <DaisyButton variant="ghost" size="sm" onClick={onClose} >
  <X className="h-4 w-4" />
</DaisyButton>
                </DaisyButton>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {results.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <DaisyAlertTriangle className="h-12 w-12 text-muted-foreground/50 mb-4" >
  <h3 className="font-medium mb-2">
</DaisyAlertTriangle>No Analysis Results</h3>
                  <p className="text-sm text-muted-foreground">
                    Select text and use AI actions to see analysis results here.
                  </p>
                </div>
              ) : (
                <DaisyTabs defaultValue="all" className="h-full flex flex-col" >
                    <DaisyTabsList className="grid grid-cols-3 m-4 mb-0" >
                      <DaisyTabsTrigger value="all">All ({results.length})</DaisyTabs>
                    <DaisyTabsTrigger value="pending" >
                        Pending ({results.filter(r => r.status === 'pending').length})
                    </DaisyTabsTrigger>
                    <DaisyTabsTrigger value="completed" >
                        Completed ({results.filter(r => r.status === 'completed').length})
                    </DaisyTabsTrigger>
                  </DaisyTabsList>

                  <DaisyScrollArea className="flex-1 px-4" >
                      <DaisyTabsContent value="all" className="mt-4" >
                        {results.map(result => (
                        <ResultCard key={result.id} result={result} />
                      ))}
                    </DaisyScrollArea>

                    <DaisyTabsContent value="pending" className="mt-4" >
                        {results.filter(r => r.status === 'pending').map(result => (
                        <ResultCard key={result.id} result={result} />
                      ))}
                    </DaisyTabsContent>

                    <DaisyTabsContent value="completed" className="mt-4" >
                        {results.filter(r => r.status === 'completed').map(result => (
                        <ResultCard key={result.id} result={result} />
                      ))}
                    </DaisyTabsContent>
                  </DaisyScrollArea>
                </DaisyTabs>
              )}
            </div>

            {/* Resize Handle */}
            <div
              className={cn(
                'absolute top-0 bottom-0 w-1 cursor-ew-resize hover:bg-primary/20 transition-colors',
                position === 'right' ? 'left-0' : 'right-0'
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}; 