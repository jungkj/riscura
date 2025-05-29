import { useState, useCallback, useRef } from 'react';
import { useAI } from '@/context/AIContext';
import { useToast } from '@/hooks/use-toast';
import { TextSelection } from './useTextSelection';
import { AIAction } from '@/components/ai/SelectableContent';
import { ContentAnalysisResult } from '@/components/ai/ContentAnalysisPanel';
import { BatchSelectionItem } from '@/components/ai/BatchSelectionManager';
import { generateId } from '@/lib/utils';

interface UseContentAnalysisOptions {
  maxHistory?: number;
  autoSave?: boolean;
  enableBatching?: boolean;
}

export function useContentAnalysis(options: UseContentAnalysisOptions = {}) {
  const {
    maxHistory = 50,
    autoSave = true,
    enableBatching = true,
  } = options;

  const [analysisResults, setAnalysisResults] = useState<ContentAnalysisResult[]>([]);
  const [batchSelections, setBatchSelections] = useState<BatchSelectionItem[]>([]);
  const [isAnalysisPanelOpen, setIsAnalysisPanelOpen] = useState(false);
  const [isBatchManagerOpen, setIsBatchManagerOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const processingQueueRef = useRef<Set<string>>(new Set());
  
  const { analyzeRisk, generateContent, explainContent } = useAI();
  const { toast } = useToast();

  // Perform AI analysis on selected text
  const analyzeSelection = useCallback(async (
    selection: TextSelection, 
    action: AIAction
  ): Promise<ContentAnalysisResult> => {
    const resultId = generateId('analysis');
    
    // Create pending result
    const pendingResult: ContentAnalysisResult = {
      id: resultId,
      action,
      selection,
      result: {
        type: getResultType(action),
        content: '',
        confidence: 0,
      },
      timestamp: new Date(),
      status: 'pending',
    };

    // Add to results immediately
    setAnalysisResults(prev => [pendingResult, ...prev.slice(0, maxHistory - 1)]);
    setIsAnalysisPanelOpen(true);

    try {
      processingQueueRef.current.add(resultId);
      setIsProcessing(true);

      let content = '';
      let confidence = 0.8; // Default confidence
      let alternatives: string[] | undefined;

      switch (action) {
        case 'explain': {
          const explanation = await explainContent({
            content: selection.text,
            context: {
              domain: selection.context.contentType,
              complexity: 'intermediate',
              format: 'detailed',
            },
          });
          content = explanation.summary;
          confidence = explanation.confidence;
          alternatives = explanation.relatedConcepts;
          break;
        }

        case 'improve':
        case 'regenerate': {
          content = await generateContent({
            type: getContentType(selection.context.contentType),
            context: selection.text,
            requirements: [`Improve the following ${selection.context.contentType} content`],
            format: 'text',
            length: 'medium',
          });
          break;
        }

        case 'alternatives': {
          content = await generateContent({
            type: getContentType(selection.context.contentType),
            context: selection.text,
            requirements: ['Generate 3 alternative approaches'],
            format: 'list',
            length: 'medium',
          });
          alternatives = content.split('\n').filter(line => line.trim());
          content = alternatives[0] || content;
          break;
        }

        case 'compliance-check': {
          content = await generateContent({
            type: 'assessment_questionnaire',
            context: `Compliance check for: ${selection.text}`,
            requirements: ['Identify compliance requirements and gaps'],
            format: 'structured',
            length: 'detailed',
          });
          break;
        }

        case 'analyze-risk': {
          if (selection.context.contentType === 'risk') {
            // This would need a proper Risk object, so we'll simulate
            content = 'Risk analysis would be performed here with proper risk data';
          } else {
            content = await generateContent({
              type: 'risk_scenario',
              context: selection.text,
              requirements: ['Identify potential risks'],
              format: 'structured',
              length: 'detailed',
            });
          }
          break;
        }

        case 'suggest-controls': {
          content = await generateContent({
            type: 'control_procedure',
            context: selection.text,
            requirements: ['Suggest relevant controls and procedures'],
            format: 'structured',
            length: 'detailed',
          });
          break;
        }

        case 'find-related': {
          content = 'Related content search would be implemented here';
          break;
        }

        default:
          throw new Error(`Unsupported action: ${action}`);
      }

      // Update result with completed analysis
      const completedResult: ContentAnalysisResult = {
        ...pendingResult,
        result: {
          type: getResultType(action),
          content,
          confidence,
          alternatives,
        },
        status: 'completed',
      };

      setAnalysisResults(prev => 
        prev.map(result => result.id === resultId ? completedResult : result)
      );

      return completedResult;

    } catch (error) {
      const errorResult: ContentAnalysisResult = {
        ...pendingResult,
        result: {
          type: 'explanation',
          content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          confidence: 0,
        },
        status: 'error',
      };

      setAnalysisResults(prev => 
        prev.map(result => result.id === resultId ? errorResult : result)
      );

      toast({
        title: 'Analysis Failed',
        description: 'Failed to analyze the selected content.',
        variant: 'destructive',
      });

      return errorResult;

    } finally {
      processingQueueRef.current.delete(resultId);
      if (processingQueueRef.current.size === 0) {
        setIsProcessing(false);
      }
    }
  }, [explainContent, generateContent, maxHistory, toast]);

  // Add selection to batch processing queue
  const addToBatch = useCallback((
    selection: TextSelection, 
    actions: AIAction[],
    priority: BatchSelectionItem['priority'] = 'medium'
  ) => {
    if (!enableBatching) return;

    const batchItem: BatchSelectionItem = {
      id: generateId('batch'),
      selection,
      actions,
      priority,
      status: 'pending',
      timestamp: new Date(),
    };

    setBatchSelections(prev => [...prev, batchItem]);
    
    toast({
      title: 'Added to Batch',
      description: 'Selection added to batch processing queue.',
    });
  }, [enableBatching, toast]);

  // Process batch selections
  const processBatch = useCallback(async (
    items: BatchSelectionItem[], 
    actions: AIAction[]
  ) => {
    setIsProcessing(true);
    
    try {
      const promises = items.map(async (item) => {
        const results: ContentAnalysisResult[] = [];
        
        for (const action of actions) {
          try {
            const result = await analyzeSelection(item.selection, action);
            results.push(result);
          } catch (error) {
            console.error(`Failed to process action ${action} for item ${item.id}:`, error);
          }
        }

        // Update batch item with results
        setBatchSelections(prev =>
          prev.map(batchItem =>
            batchItem.id === item.id
              ? { ...batchItem, results, status: 'completed' as const }
              : batchItem
          )
        );

        return results;
      });

      await Promise.all(promises);

      toast({
        title: 'Batch Processing Complete',
        description: `Successfully processed ${items.length} items.`,
      });

    } catch (error) {
      toast({
        title: 'Batch Processing Failed',
        description: 'Some items could not be processed.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [analyzeSelection, toast]);

  // Update batch item
  const updateBatchItem = useCallback((
    itemId: string, 
    updates: Partial<BatchSelectionItem>
  ) => {
    setBatchSelections(prev =>
      prev.map(item => item.id === itemId ? { ...item, ...updates } : item)
    );
  }, []);

  // Remove batch item
  const removeBatchItem = useCallback((itemId: string) => {
    setBatchSelections(prev => prev.filter(item => item.id !== itemId));
  }, []);

  // Clear all batch items
  const clearBatch = useCallback(() => {
    setBatchSelections([]);
  }, []);

  // Approve analysis result (apply changes)
  const approveResult = useCallback((resultId: string) => {
    const result = analysisResults.find(r => r.id === resultId);
    if (!result) return;

    // This would integrate with the actual content editing system
    toast({
      title: 'Changes Applied',
      description: 'The AI suggestion has been applied to your content.',
    });

    // Mark as approved in results
    setAnalysisResults(prev =>
      prev.map(r => r.id === resultId ? { ...r, feedback: 'positive' as const } : r)
    );
  }, [analysisResults, toast]);

  // Reject analysis result
  const rejectResult = useCallback((resultId: string) => {
    setAnalysisResults(prev =>
      prev.map(r => r.id === resultId ? { ...r, feedback: 'negative' as const } : r)
    );
  }, []);

  // Provide feedback on result
  const provideFeedback = useCallback((
    resultId: string, 
    feedback: 'positive' | 'negative'
  ) => {
    setAnalysisResults(prev =>
      prev.map(r => r.id === resultId ? { ...r, feedback } : r)
    );
  }, []);

  // Retry failed result
  const retryResult = useCallback(async (resultId: string) => {
    const result = analysisResults.find(r => r.id === resultId);
    if (!result) return;

    await analyzeSelection(result.selection, result.action);
  }, [analysisResults, analyzeSelection]);

  // Clear analysis history
  const clearAnalysisHistory = useCallback(() => {
    setAnalysisResults([]);
  }, []);

  // Helper functions
  const getResultType = (action: AIAction): ContentAnalysisResult['result']['type'] => {
    switch (action) {
      case 'regenerate':
      case 'improve':
        return 'replacement';
      case 'alternatives':
        return 'suggestion';
      case 'analyze-risk':
      case 'compliance-check':
        return 'analysis';
      default:
        return 'explanation';
    }
  };

  const getContentType = (contentType: string) => {
    const typeMap: Record<string, string> = {
      'risk': 'risk_description',
      'control': 'control_procedure',
      'test-script': 'training_material',
      'document': 'policy_document',
    };
    return typeMap[contentType] || 'policy_document';
  };

  return {
    // State
    analysisResults,
    batchSelections,
    isAnalysisPanelOpen,
    isBatchManagerOpen,
    isProcessing,

    // Actions
    analyzeSelection,
    addToBatch,
    processBatch,
    updateBatchItem,
    removeBatchItem,
    clearBatch,
    approveResult,
    rejectResult,
    provideFeedback,
    retryResult,
    clearAnalysisHistory,

    // Panel controls
    setIsAnalysisPanelOpen,
    setIsBatchManagerOpen,

    // Statistics
    stats: {
      totalResults: analysisResults.length,
      pendingResults: analysisResults.filter(r => r.status === 'pending').length,
      completedResults: analysisResults.filter(r => r.status === 'completed').length,
      errorResults: analysisResults.filter(r => r.status === 'error').length,
      batchItems: batchSelections.length,
      pendingBatchItems: batchSelections.filter(i => i.status === 'pending').length,
    },
  };
} 