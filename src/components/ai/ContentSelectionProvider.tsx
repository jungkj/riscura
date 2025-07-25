import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { SelectableContent } from './SelectableContent';
import { AIActionToolbar } from './AIActionToolbar';
import { ContentAnalysisPanel } from './ContentAnalysisPanel';
import { BatchSelectionManager } from './BatchSelectionManager';
import { useContentAnalysis } from '@/hooks/useContentAnalysis';
import { TextSelection } from '@/hooks/useTextSelection';
import { AIAction } from './SelectableContent';

interface ContentSelectionContextValue {
  // Selection state
  currentSelection: TextSelection | null;
  toolbarPosition: { x: number; y: number } | null;
  isToolbarVisible: boolean;
  
  // Actions
  handleSelection: (selection: TextSelection) => void;
  handleAIAction: (action: AIAction, selection: TextSelection) => void;
  addToBatch: (selection: TextSelection, actions: AIAction[], priority?: 'low' | 'medium' | 'high' | 'urgent') => void;
  clearSelection: () => void;
  
  // Panel controls
  showAnalysisPanel: () => void;
  hideAnalysisPanel: () => void;
  showBatchManager: () => void;
  hideBatchManager: () => void;
  
  // Analysis state
  analysisResults: ReturnType<typeof useContentAnalysis>['analysisResults'];
  batchSelections: ReturnType<typeof useContentAnalysis>['batchSelections'];
  isProcessing: boolean;
  stats: ReturnType<typeof useContentAnalysis>['stats'];
}

const ContentSelectionContext = createContext<ContentSelectionContextValue | null>(null);

export function useContentSelection() {
  const context = useContext(ContentSelectionContext);
  if (!context) {
    throw new Error('useContentSelection must be used within a ContentSelectionProvider');
  }
  return context;
}

interface ContentSelectionProviderProps {
  children: React.ReactNode;
  enableBatching?: boolean;
  enableAnalysis?: boolean;
  maxHistory?: number;
  availableActions?: AIAction[];
}

export const ContentSelectionProvider: React.FC<ContentSelectionProviderProps> = ({
  children,
  enableBatching = true,
  enableAnalysis = true,
  maxHistory = 50,
  availableActions = ['explain', 'improve', 'regenerate', 'alternatives', 'compliance-check'],
}) => {
  const [currentSelection, setCurrentSelection] = useState<TextSelection | null>(null);
  const [toolbarPosition, setToolbarPosition] = useState<{ x: number; y: number } | null>(null);
  const [isToolbarVisible, setIsToolbarVisible] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout>();

  const {
    analysisResults,
    batchSelections,
    isAnalysisPanelOpen,
    isBatchManagerOpen,
    isProcessing,
    analyzeSelection,
    addToBatch: addToBatchAnalysis,
    processBatch,
    updateBatchItem,
    removeBatchItem,
    clearBatch,
    approveResult,
    rejectResult,
    provideFeedback,
    retryResult,
    setIsAnalysisPanelOpen,
    setIsBatchManagerOpen,
    stats,
  } = useContentAnalysis({
    maxHistory,
    enableBatching,
  });

  // Handle text selection
  const handleSelection = useCallback((selection: TextSelection) => {
    setCurrentSelection(selection);
    
    // Calculate toolbar position based on selection bounds
    const rect = selection.boundingRect;
    setToolbarPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10, // Position above selection
    });
    
    setIsToolbarVisible(true);
    
    // Clear any existing hide timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    
    // Auto-hide toolbar after 10 seconds of inactivity
    hideTimeoutRef.current = setTimeout(() => {
      setIsToolbarVisible(false);
      setCurrentSelection(null);
      setToolbarPosition(null);
    }, 10000);
  }, []);

  // Handle AI action
  const handleAIAction = useCallback(async (action: AIAction, selection: TextSelection) => {
    if (!enableAnalysis) return;
    
    // Hide toolbar immediately
    setIsToolbarVisible(false);
    
    try {
      await analyzeSelection(selection, action);
    } catch (error) {
      console.error('Failed to analyze selection:', error);
    }
  }, [enableAnalysis, analyzeSelection]);

  // Add to batch processing
  const addToBatch = useCallback((
    selection: TextSelection, 
    actions: AIAction[], 
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
  ) => {
    if (!enableBatching) return;
    
    addToBatchAnalysis(selection, actions, priority);
    
    // Hide toolbar
    setIsToolbarVisible(false);
    setCurrentSelection(null);
    setToolbarPosition(null);
  }, [enableBatching, addToBatchAnalysis]);

  // Clear current selection
  const clearSelection = useCallback(() => {
    setCurrentSelection(null);
    setToolbarPosition(null);
    setIsToolbarVisible(false);
    
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
  }, []);

  // Panel controls
  const showAnalysisPanel = useCallback(() => {
    setIsAnalysisPanelOpen(true);
  }, [setIsAnalysisPanelOpen]);

  const hideAnalysisPanel = useCallback(() => {
    setIsAnalysisPanelOpen(false);
  }, [setIsAnalysisPanelOpen]);

  const showBatchManager = useCallback(() => {
    setIsBatchManagerOpen(true);
  }, [setIsBatchManagerOpen]);

  const hideBatchManager = useCallback(() => {
    setIsBatchManagerOpen(false);
  }, [setIsBatchManagerOpen]);

  // Context value
  const contextValue: ContentSelectionContextValue = {
    currentSelection,
    toolbarPosition,
    isToolbarVisible,
    handleSelection,
    handleAIAction,
    addToBatch,
    clearSelection,
    showAnalysisPanel,
    hideAnalysisPanel,
    showBatchManager,
    hideBatchManager,
    analysisResults,
    batchSelections,
    isProcessing,
    stats,
  };

  return (
    <ContentSelectionContext.Provider value={contextValue}>
      {children}
      
      {/* AI Action Toolbar */}
      {isToolbarVisible && currentSelection && toolbarPosition && (
        <AIActionToolbar
          context={currentSelection}
          onActionComplete={(result) => console.log('Action completed:', result)}
        />
      )}
      
      {/* Analysis Results Panel */}
      {enableAnalysis && (
        <ContentAnalysisPanel
          isOpen={isAnalysisPanelOpen}
          onClose={hideAnalysisPanel}
          results={analysisResults}
          onApprove={approveResult}
          onReject={rejectResult}
          onFeedback={provideFeedback}
          onRetry={retryResult}
        />
      )}
      
      {/* Batch Processing Manager */}
      {enableBatching && (
        <BatchSelectionManager
          isOpen={isBatchManagerOpen}
          onClose={hideBatchManager}
          selections={batchSelections}
          onProcessBatch={processBatch}
          onUpdateItem={updateBatchItem}
          onRemoveItem={removeBatchItem}
          onClearAll={clearBatch}
        />
      )}
    </ContentSelectionContext.Provider>
  );
};

// Enhanced SelectableContent component that uses the context
interface EnhancedSelectableContentProps {
  children: React.ReactNode;
  contentType: 'risk' | 'control' | 'test-script' | 'document' | 'text';
  contentId: string;
  className?: string;
  sectionType?: string;
  metadata?: Record<string, unknown>;
  disabled?: boolean;
  showQualityScore?: boolean;
  highlightColor?: string;
}

export const EnhancedSelectableContent: React.FC<EnhancedSelectableContentProps> = ({
  children,
  contentType,
  contentId,
  className,
  sectionType,
  metadata,
  disabled = false,
  showQualityScore = false,
  highlightColor,
}) => {
  const { handleSelection } = useContentSelection();

  return (
    <DaisySelectableContent
      contentType={contentType}
      contentId={contentId}
      onSelection={handleSelection}
      aiActionsEnabled={true}
      className={className}
      sectionType={sectionType}
      metadata={metadata}
      disabled={disabled}
      showQualityScore={showQualityScore}
      highlightColor={highlightColor}
    >
      {children}
    </SelectableContent>
  );
};

// Quick action buttons for batch and analysis panels
export const ContentSelectionControls: React.FC<{ className?: string }> = ({ className }) => {
  const { 
    showAnalysisPanel, 
    showBatchManager, 
    stats,
    isProcessing 
  } = useContentSelection();

  if (!stats.totalResults && !stats.batchItems) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 right-4 flex gap-2 z-40 ${className}`}>
      {stats.totalResults > 0 && (
        <button
          onClick={showAnalysisPanel}
          className="relative bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg hover:bg-primary/90 transition-colors"
          disabled={isProcessing}
        >
          Analysis Results
          {stats.pendingResults > 0 && (
            <span className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {stats.pendingResults}
            </span>
          )}
        </button>
      )}
      
      {stats.batchItems > 0 && (
        <button
          onClick={showBatchManager}
          className="relative bg-secondary text-secondary-foreground px-4 py-2 rounded-lg shadow-lg hover:bg-secondary/90 transition-colors"
          disabled={isProcessing}
        >
          Batch Queue
          {stats.pendingBatchItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {stats.pendingBatchItems}
            </span>
          )}
        </button>
      )}
    </div>
  );
}; 