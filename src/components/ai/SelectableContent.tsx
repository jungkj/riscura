import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTextSelection, TextSelection, SelectionContext } from '@/hooks/useTextSelection';
import { AIActionToolbar } from './AIActionToolbar';
import { cn } from '@/lib/utils';

export interface SelectableContentProps {
  children: React.ReactNode;
  contentType: 'risk' | 'control' | 'test-script' | 'document' | 'text';
  contentId: string;
  onSelection?: (selection: TextSelection) => void;
  onAIAction?: (action: AIAction, selection: TextSelection) => void;
  aiActionsEnabled?: boolean;
  className?: string;
  sectionType?: string;
  metadata?: Record<string, unknown>;
  highlightColor?: string;
  disabled?: boolean;
  showQualityScore?: boolean;
}

export type AIAction =
  | 'explain'
  | 'regenerate'
  | 'improve'
  | 'alternatives'
  | 'compliance-check'
  | 'find-related'
  | 'analyze-risk'
  | 'suggest-controls';

interface SelectionHighlight {
  id: string;
  selection: TextSelection;
  color: string;
  temporary?: boolean;
}

export const SelectableContent: React.FC<DaisySelectableContentProps> = ({
  children,
  contentType,
  contentId,
  onSelection,
  onAIAction,
  aiActionsEnabled = true,
  className,
  sectionType,
  metadata,
  highlightColor = 'bg-blue-100 dark:bg-blue-900/30',
  disabled = false,
  showQualityScore = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  const [highlights, setHighlights] = useState<DaisySelectionHighlight[]>([]);
  const [qualityScore, setQualityScore] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const selectionContext: SelectionContext = {
    contentType,
    contentId,
    sectionType,
    metadata,
  };

  const { currentSelection, isSelecting, hasSelection, clearSelection } = useTextSelection(
    containerRef,
    selectionContext,
    {
      enabled: !disabled,
      persistSelection: true,
      debounceMs: 200,
    }
  );

  // Calculate quality score (mock implementation)
  const calculateQualityScore = useCallback(() => {
    if (!containerRef.current || !showQualityScore) return;

    const text = containerRef.current.textContent || '';
    const wordCount = text.split(/\s+/).length;
    const sentenceCount = text.split(/[.!?]+/).length;
    const avgWordsPerSentence = wordCount / Math.max(sentenceCount, 1);

    // Simple scoring algorithm (in production, this would use AI)
    let score = 0.5;

    // Prefer moderate sentence length
    if (avgWordsPerSentence >= 8 && avgWordsPerSentence <= 20) score += 0.2;

    // Prefer adequate length
    if (wordCount >= 20 && wordCount <= 200) score += 0.2;

    // Check for specific keywords based on content type
    const keywords = {
      risk: ['risk', 'likelihood', 'impact', 'mitigation', 'control'],
      control: ['control', 'procedure', 'monitor', 'test', 'evidence'],
      'test-script': ['test', 'verify', 'validate', 'document', 'result'],
    };

    const contentKeywords = keywords[contentType as keyof typeof keywords] || [];
    const keywordCount = contentKeywords.filter((keyword) =>
      text.toLowerCase().includes(keyword)
    ).length;

    score += Math.min(keywordCount * 0.05, 0.1);

    setQualityScore(Math.min(score, 1));
  }, [contentType, showQualityScore]);

  // Handle selection changes
  useEffect(() => {
    if (currentSelection) {
      onSelection?.(currentSelection);

      if (aiActionsEnabled) {
        // Position toolbar near the selection
        const rect = currentSelection.boundingRect;
        const containerRect = containerRef.current?.getBoundingClientRect();

        if (containerRect) {
          const x = Math.max(
            10,
            Math.min(rect.left - containerRect.left + rect.width / 2, containerRect.width - 200)
          );
          const y = rect.top - containerRect.top - 60;

          setToolbarPosition({ x, y });
          setShowToolbar(true);
        }
      }
    } else {
      setShowToolbar(false);
    }
  }, [currentSelection, onSelection, aiActionsEnabled]);

  // Calculate quality score when content changes
  useEffect(() => {
    calculateQualityScore();
  }, [calculateQualityScore, children]);

  // Handle AI actions
  const handleAIAction = useCallback(
    async (action: AIAction) => {
      if (!currentSelection || !onAIAction) return;

      setIsProcessing(true);
      setShowToolbar(false);

      try {
        await onAIAction(action, currentSelection);

        // Add temporary highlight for processed selection
        const highlight: SelectionHighlight = {
          id: `highlight-${Date.now()}`,
          selection: currentSelection,
          color: getActionColor(action),
          temporary: true,
        };

        setHighlights((prev) => [...prev, highlight]);

        // Remove temporary highlight after animation
        setTimeout(() => {
          setHighlights((prev) => prev.filter((h) => h.id !== highlight.id));
        }, 2000);
      } finally {
        setIsProcessing(false);
        clearSelection();
      }
    },
    [currentSelection, onAIAction, clearSelection]
  );

  // Get color based on action type
  const getActionColor = (action: AIAction): string => {
    const colors = {
      explain: 'bg-blue-100 dark:bg-blue-900/30',
      regenerate: 'bg-purple-100 dark:bg-purple-900/30',
      improve: 'bg-green-100 dark:bg-green-900/30',
      alternatives: 'bg-yellow-100 dark:bg-yellow-900/30',
      'compliance-check': 'bg-red-100 dark:bg-red-900/30',
      'find-related': 'bg-indigo-100 dark:bg-indigo-900/30',
      'analyze-risk': 'bg-orange-100 dark:bg-orange-900/30',
      'suggest-controls': 'bg-teal-100 dark:bg-teal-900/30',
    };
    return colors[action] || highlightColor;
  };

  // Get available actions based on content type
  const getAvailableActions = (): AIAction[] => {
    const baseActions: AIAction[] = ['explain', 'improve', 'alternatives'];

    switch (contentType) {
      case 'risk':
        return [...baseActions, 'analyze-risk', 'suggest-controls', 'compliance-check'];
      case 'control':
        return [...baseActions, 'regenerate', 'compliance-check', 'find-related'];
      case 'test-script':
        return [...baseActions, 'regenerate', 'improve'];
      default:
        return baseActions;
    }
  };

  // Handle clicks outside to clear selection
  const handleContainerClick = useCallback((event: React.MouseEvent) => {
    // Don't clear selection if clicking on toolbar
    if (event.target instanceof Element && event.target.closest('[data-toolbar]')) {
      return;
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative',
        isSelecting && 'select-text',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
      onClick={handleContainerClick}
      data-selectable-content
      data-content-type={contentType}
      data-content-id={contentId}
    >
      {/* Quality Score Indicator */}
      {showQualityScore && qualityScore !== null && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-2 right-2 z-10"
        >
          <div
            className={cn(
              'px-2 py-1 rounded-full text-xs font-medium',
              qualityScore >= 0.8
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                : qualityScore >= 0.6
                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
            )}
          >
            Quality: {Math.round(qualityScore * 100)}%
          </div>
        </motion.div>
      )}

      {/* Content with Selection Highlighting */}
      <div
        className={cn(
          'relative',
          hasSelection && 'selection:bg-blue-200 dark:selection:bg-blue-800',
          isProcessing && 'pointer-events-none'
        )}
        style={
          {
            '--selection-color': highlightColor,
          } as React.CSSProperties
        }
      >
        {children}
      </div>

      {/* Persistent Highlights */}
      <AnimatePresence>
        {highlights.map((highlight) => (
          <motion.div
            key={highlight.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            className={cn('absolute pointer-events-none rounded', highlight.color)}
            style={{
              left: highlight.selection.boundingRect.left,
              top: highlight.selection.boundingRect.top,
              width: highlight.selection.boundingRect.width,
              height: highlight.selection.boundingRect.height,
            }}
          />
        ))}
      </AnimatePresence>

      {/* AI Action Toolbar */}
      <AnimatePresence>
        {showToolbar && currentSelection && aiActionsEnabled && (
          <AIActionToolbar
            context={{
              selection: currentSelection,
              position: toolbarPosition,
              availableActions: getAvailableActions(),
              isProcessing,
            }}
            selectedData={currentSelection ? [currentSelection] : []}
            onActionComplete={async (result) => {
              // Handle action completion
              console.log('AI Action completed:', result);
            }}
          />
        )}
      </AnimatePresence>

      {/* Selection Loading Overlay */}
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-20"
        >
          <div className="flex items-center gap-2 bg-card border rounded-lg px-4 py-2 shadow-lg">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
            <span className="text-sm font-medium">Processing selection...</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};
