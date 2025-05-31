import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { 
  ConversationMessage, 
  AgentType, 
  AIError,
  MessageAttachment
} from '@/types/ai.types';
import { Risk, Control, Document } from '@/types';
import { useAI } from '@/context/AIContext';
import { useAuth } from '@/context/AuthContext';
import { generateId } from '@/lib/utils';
import { 
  contextIntelligenceService, 
  IntelligentContext, 
  SmartContextSuggestion,
  ActivityContext 
} from '@/services/ContextIntelligenceService';

// Enhanced RiskContext with real data integration
export interface RiskContext {
  currentRisk?: Risk;
  currentControl?: Control;
  currentDocument?: Document;
  relatedEntities: {
    risks: string[];
    controls: string[];
    documents: string[];
  };
  pageContext?: {
    section: string;
    data: Record<string, unknown>;
  };
  // Enhanced with intelligent context
  intelligentContext?: IntelligentContext;
  contextRelevance?: number;
  smartSuggestions?: SmartContextSuggestion[];
}

export interface AISuggestion {
  id: string;
  type: 'action' | 'analysis' | 'recommendation' | 'explanation';
  title: string;
  description: string;
  action: () => Promise<void>;
  metadata?: Record<string, unknown>;
}

export interface ChatMessage extends ConversationMessage {
  isStreaming?: boolean;
  suggestions?: AISuggestion[];
  isError?: boolean;
  canRegenerate?: boolean;
  contextData?: {
    relevanceScore: number;
    keyInsights: string[];
    relatedEntities: string[];
  };
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  isConnected: boolean;
  currentStream: string;
  streamingMessageId: string | null;
  context: RiskContext;
  suggestions: AISuggestion[];
  error: AIError | null;
  typingIndicator: boolean;
  searchQuery: string;
  filteredMessages: ChatMessage[];
  conversationTemplates: ConversationTemplate[];
  rateLimitStatus: {
    requestsRemaining: number;
    tokensRemaining: number;
    resetTime: Date;
    isLimited: boolean;
  } | null;
  // Enhanced context features
  smartSuggestions: SmartContextSuggestion[];
  contextQuality: {
    relevance: number;
    completeness: number;
    freshness: number;
  };
  contextMode: 'minimal' | 'moderate' | 'comprehensive';
  autoContextUpdate: boolean;
  recentActivity: ActivityContext[];
}

export interface ConversationTemplate {
  id: string;
  title: string;
  description: string;
  initialMessage: string;
  category: 'risk_analysis' | 'control_design' | 'compliance' | 'general';
  context?: Partial<RiskContext>;
  requiredContext?: string[];
  smartPrompts?: string[];
}

export interface ChatActions {
  sendMessage: (content: string, attachments?: MessageAttachment[]) => Promise<void>;
  sendMessageWithContext: (content: string, contextOverride?: Partial<RiskContext>) => Promise<void>;
  regenerateMessage: (messageId: string) => Promise<void>;
  applySuggestion: (suggestion: AISuggestion) => Promise<void>;
  applySmartSuggestion: (suggestion: SmartContextSuggestion) => Promise<void>;
  startVoiceInput: () => void;
  stopVoiceInput: () => void;
  uploadFiles: (files: File[]) => Promise<void>;
  searchMessages: (query: string) => void;
  clearSearch: () => void;
  exportConversation: (format: 'json' | 'pdf' | 'markdown') => Promise<void>;
  setContext: (context: Partial<RiskContext>) => void;
  enrichContext: (selectedEntities: { risks?: Risk[]; controls?: Control[]; documents?: Document[] }) => Promise<void>;
  useTemplate: (template: ConversationTemplate) => void;
  clearMessages: () => void;
  switchAgent: (agentType: AgentType) => void;
  clearError: () => void;
  setContextMode: (mode: 'minimal' | 'moderate' | 'comprehensive') => void;
  refreshContext: () => Promise<void>;
  trackActivity: (activity: Omit<ActivityContext, 'timestamp'>) => void;
}

// Enhanced conversation templates with context requirements
const defaultTemplates: ConversationTemplate[] = [
  {
    id: 'risk-analysis-comprehensive',
    title: 'Comprehensive Risk Analysis',
    description: 'Deep dive analysis of selected risks with contextual insights',
    initialMessage: 'Please provide a comprehensive analysis of the selected risks, including correlations, trends, and recommendations.',
    category: 'risk_analysis',
    requiredContext: ['risks'],
    smartPrompts: [
      'What are the key risk correlations?',
      'How do these risks compare to industry benchmarks?',
      'What control gaps exist for these risks?'
    ]
  },
  {
    id: 'control-effectiveness-review',
    title: 'Control Effectiveness Review',
    description: 'Analyze control effectiveness with performance data',
    initialMessage: 'Review the effectiveness of my selected controls and suggest improvements.',
    category: 'control_design',
    requiredContext: ['controls'],
    smartPrompts: [
      'Which controls need immediate attention?',
      'How can we improve control efficiency?',
      'What are the testing gaps?'
    ]
  },
  {
    id: 'compliance-gap-analysis',
    title: 'Compliance Gap Analysis',
    description: 'Identify compliance gaps and remediation strategies',
    initialMessage: 'Analyze compliance gaps for my current risk and control portfolio.',
    category: 'compliance',
    requiredContext: ['risks', 'controls'],
    smartPrompts: [
      'What are the critical compliance gaps?',
      'Which regulations require immediate attention?',
      'How can we prioritize remediation efforts?'
    ]
  },
  {
    id: 'contextual-risk-advice',
    title: 'Contextual Risk Advice',
    description: 'Get personalized risk management advice based on your current context',
    initialMessage: 'Based on my current work context, what risk management priorities should I focus on?',
    category: 'general',
    smartPrompts: [
      'What should I prioritize today?',
      'Are there any urgent risk issues?',
      'How can I improve my risk management efficiency?'
    ]
  }
];

// Custom hook for enhanced ARIA chat with deep context integration
export const useARIAChat = (initialContext?: RiskContext) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { 
    sendMessage: aiSendMessage, 
    isLoading: aiLoading, 
    error: aiError,
    clearError: aiClearError,
    selectedAgent,
    switchAgent
  } = useAI();

  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    isConnected: true,
    currentStream: '',
    streamingMessageId: null,
    context: initialContext || {
      relatedEntities: { risks: [], controls: [], documents: [] }
    },
    suggestions: [],
    error: null,
    typingIndicator: false,
    searchQuery: '',
    filteredMessages: [],
    conversationTemplates: defaultTemplates,
    rateLimitStatus: null,
    smartSuggestions: [],
    contextQuality: { relevance: 0, completeness: 0, freshness: 0 },
    contextMode: 'moderate',
    autoContextUpdate: true,
    recentActivity: []
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const contextUpdateTimer = useRef<NodeJS.Timeout>();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  // Initialize context intelligence
  useEffect(() => {
    if (user && state.autoContextUpdate) {
      refreshContext();
      
      // Set up periodic context updates
      contextUpdateTimer.current = setInterval(refreshContext, 30000); // Every 30 seconds
      
      return () => {
        if (contextUpdateTimer.current) {
          clearInterval(contextUpdateTimer.current);
        }
      };
    }
  }, [user, state.autoContextUpdate]);

  // Track page navigation for context updates
  useEffect(() => {
    if (user && state.autoContextUpdate && pathname) {
      trackActivity({
        action: 'navigate',
        entityType: 'document', // Page navigation
        entityId: pathname,
        context: { page: pathname, search: searchParams?.toString() || '' }
      });
      
      // Refresh context on navigation
      setTimeout(refreshContext, 1000);
    }
  }, [pathname]);

  // Enhanced context refresh
  const refreshContext = useCallback(async () => {
    if (!user || !pathname) return;

    try {
      // Get intelligent context
      const intelligentContext = await contextIntelligenceService.getIntelligentContext(
        user.id,
        pathname,
        {
          risks: state.context.intelligentContext?.current.selectedEntities.risks || [],
          controls: state.context.intelligentContext?.current.selectedEntities.controls || [],
          documents: state.context.intelligentContext?.current.selectedEntities.documents || []
        },
        {
          maxTokens: 4000,
          prioritizeRecent: true,
          includeAnalytics: true,
          includeRelated: true,
          summarizationLevel: state.contextMode,
          agentType: selectedAgent
        }
      );

      // Get smart suggestions
      const smartSuggestions = await contextIntelligenceService.getSmartSuggestions(
        user.id,
        intelligentContext
      );

      // Analyze context quality
      const analysis = await contextIntelligenceService.analyzeContext(
        intelligentContext,
        state.messages.length > 0 ? state.messages[state.messages.length - 1].content : '',
        selectedAgent
      );

      setState(prev => ({
        ...prev,
        context: {
          ...prev.context,
          intelligentContext,
          contextRelevance: analysis.relevanceScore,
          smartSuggestions
        },
        smartSuggestions,
        contextQuality: {
          relevance: analysis.relevanceScore,
          completeness: analysis.completeness,
          freshness: analysis.freshness
        }
      }));
    } catch (error) {
      console.error('Error refreshing context:', error);
    }
  }, [user, pathname, selectedAgent, state.contextMode, state.context.intelligentContext, state.messages]);

  // Track user activity
  const trackActivity = useCallback((activity: Omit<ActivityContext, 'timestamp'>) => {
    if (!user) return;

    const fullActivity: ActivityContext = {
      ...activity,
      timestamp: new Date()
    };

    // Update local state
    setState(prev => ({
      ...prev,
      recentActivity: [fullActivity, ...prev.recentActivity.slice(0, 49)] // Keep last 50
    }));

    // Update context intelligence service
    contextIntelligenceService.updateContext(user.id, fullActivity);
  }, [user]);

  // Enhanced send message with context injection
  const sendMessage = useCallback(async (content: string, attachments?: MessageAttachment[]) => {
    if (!content.trim() || state.isLoading) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Track message activity
      trackActivity({
        action: 'send_message',
        entityType: 'document', // Message
        entityId: generateId('message'),
        context: { 
          content: content.substring(0, 100), // First 100 chars
          agentType: selectedAgent,
          hasAttachments: !!attachments?.length
        }
      });

      // Create user message
      const userMessage: ChatMessage = {
        id: generateId('message'),
        role: 'user',
        content,
        timestamp: new Date(),
        attachments
      };

      setState(prev => ({ 
        ...prev, 
        messages: [...prev.messages, userMessage],
        typingIndicator: true
      }));

      // Generate context-enhanced prompt
      let enhancedContent = content;
      if (state.context.intelligentContext && state.contextMode !== 'minimal') {
        const contextString = await contextIntelligenceService.generateSmartContext(
          state.context.intelligentContext,
          content,
          selectedAgent,
          {
            maxTokens: 2000,
            prioritizeRecent: true,
            includeAnalytics: true,
            includeRelated: true,
            summarizationLevel: state.contextMode,
            agentType: selectedAgent
          }
        );

        if (contextString) {
          enhancedContent = `Context:\n${contextString}\n\nUser Query: ${content}`;
        }
      }

      // Send to AI with enhanced context
      await aiSendMessage(enhancedContent, attachments);

      setState(prev => ({ ...prev, typingIndicator: false }));

      // Refresh context after message
      setTimeout(refreshContext, 2000);

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error as AIError,
        typingIndicator: false
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.isLoading, state.context.intelligentContext, state.contextMode, selectedAgent, trackActivity, aiSendMessage, refreshContext]);

  // Send message with context override
  const sendMessageWithContext = useCallback(async (
    content: string, 
    contextOverride?: Partial<RiskContext>
  ) => {
    if (contextOverride) {
      setState(prev => ({
        ...prev,
        context: { ...prev.context, ...contextOverride }
      }));
      
      // Refresh context with new data
      await refreshContext();
    }

    await sendMessage(content);
  }, [sendMessage, refreshContext]);

  // Enrich context with selected entities
  const enrichContext = useCallback(async (selectedEntities: {
    risks?: Risk[];
    controls?: Control[];
    documents?: Document[];
  }) => {
    if (!user) return;

    // Track context enrichment activity
    trackActivity({
      action: 'enrich_context',
      entityType: 'document',
      entityId: 'context_enrichment',
      context: {
        risksCount: selectedEntities.risks?.length || 0,
        controlsCount: selectedEntities.controls?.length || 0,
        documentsCount: selectedEntities.documents?.length || 0
      }
    });

    // Update context with selected entities
    setState(prev => ({
      ...prev,
      context: {
        ...prev.context,
        currentRisk: selectedEntities.risks?.[0],
        currentControl: selectedEntities.controls?.[0],
        currentDocument: selectedEntities.documents?.[0],
        relatedEntities: {
          risks: selectedEntities.risks?.map(r => r.id) || prev.context.relatedEntities.risks,
          controls: selectedEntities.controls?.map(c => c.id) || prev.context.relatedEntities.controls,
          documents: selectedEntities.documents?.map(d => d.id) || prev.context.relatedEntities.documents
        }
      }
    }));

    // Refresh intelligent context
    await refreshContext();
  }, [user, trackActivity, refreshContext]);

  // Apply smart suggestion
  const applySmartSuggestion = useCallback(async (suggestion: SmartContextSuggestion) => {
    trackActivity({
      action: 'apply_suggestion',
      entityType: 'document',
      entityId: suggestion.id,
      context: { 
        suggestionType: suggestion.type,
        relevanceScore: suggestion.relevanceScore
      }
    });

    if (suggestion.quickAction) {
      await suggestion.quickAction.action();
    }

    // Remove applied suggestion
    setState(prev => ({
      ...prev,
      smartSuggestions: prev.smartSuggestions.filter(s => s.id !== suggestion.id)
    }));
  }, [trackActivity]);

  // Set context mode
  const setContextMode = useCallback((mode: 'minimal' | 'moderate' | 'comprehensive') => {
    setState(prev => ({ ...prev, contextMode: mode }));
    
    trackActivity({
      action: 'change_context_mode',
      entityType: 'document',
      entityId: 'context_mode',
      context: { mode }
    });

    // Refresh context with new mode
    setTimeout(refreshContext, 1000);
  }, [trackActivity, refreshContext]);

  // Use template with enhanced context
  const useTemplate = useCallback(async (template: ConversationTemplate) => {
    trackActivity({
      action: 'use_template',
      entityType: 'document',
      entityId: template.id,
      context: { 
        category: template.category,
        requiredContext: template.requiredContext 
      }
    });

    // Check if required context is available
    if (template.requiredContext) {
      const missingContext = template.requiredContext.filter(required => {
        switch (required) {
          case 'risks':
            return !state.context.relatedEntities.risks.length;
          case 'controls':
            return !state.context.relatedEntities.controls.length;
          case 'documents':
            return !state.context.relatedEntities.documents.length;
          default:
            return false;
        }
      });

      if (missingContext.length > 0) {
        setState(prev => ({
          ...prev,
          error: {
            type: 'missing_context',
            message: `This template requires: ${missingContext.join(', ')}. Please select the required entities first.`,
            code: 'MISSING_CONTEXT',
            timestamp: new Date(),
            retryable: false,
            fallbackUsed: false
          }
        }));
        return;
      }
    }

    // Apply template context if provided
    if (template.context) {
      setState(prev => ({
        ...prev,
        context: { ...prev.context, ...template.context }
      }));
    }

    // Send template message
    await sendMessage(template.initialMessage);
  }, [state.context, trackActivity, sendMessage]);

  // Enhanced search with context awareness
  const searchMessages = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
    
    if (!query.trim()) {
      setState(prev => ({ ...prev, filteredMessages: [] }));
      return;
    }

    const filtered = state.messages.filter(message =>
      message.content.toLowerCase().includes(query.toLowerCase()) ||
      (message.metadata && 'agentType' in message.metadata && 
       typeof message.metadata.agentType === 'string' && 
       message.metadata.agentType.includes(query.toLowerCase())) ||
      (message.contextData?.relatedEntities && message.contextData.relatedEntities.some(entity => 
        entity.toLowerCase().includes(query.toLowerCase())
      ))
    );

    setState(prev => ({ ...prev, filteredMessages: filtered }));
  }, [state.messages]);

  const actions: ChatActions = {
    sendMessage,
    sendMessageWithContext,
    regenerateMessage: async (messageId: string) => {
      // Implementation for message regeneration
      console.log('Regenerating message:', messageId);
    },
    applySuggestion: async (suggestion: AISuggestion) => {
      await suggestion.action();
    },
    applySmartSuggestion,
    startVoiceInput: () => {
      // Implementation for voice input
      console.log('Starting voice input...');
    },
    stopVoiceInput: () => {
      // Implementation for stopping voice input
      console.log('Stopping voice input...');
    },
    uploadFiles: async (files: File[]) => {
      // Implementation for file upload
      console.log('Uploading files:', files);
    },
    searchMessages,
    clearSearch: () => {
      setState(prev => ({ ...prev, searchQuery: '', filteredMessages: [] }));
    },
    exportConversation: async (format: 'json' | 'pdf' | 'markdown') => {
      // Implementation for export
      console.log('Exporting conversation as:', format);
    },
    setContext: (context: Partial<RiskContext>) => {
      setState(prev => ({
        ...prev,
        context: { ...prev.context, ...context }
      }));
    },
    enrichContext,
    useTemplate,
    clearMessages: () => {
      setState(prev => ({ ...prev, messages: [] }));
    },
    switchAgent: (agentType: AgentType) => {
      switchAgent(agentType);
      trackActivity({
        action: 'switch_agent',
        entityType: 'document',
        entityId: agentType,
        context: { agentType }
      });
    },
    clearError: () => {
      setState(prev => ({ ...prev, error: null }));
      aiClearError();
    },
    setContextMode,
    refreshContext,
    trackActivity
  };

  return {
    state: {
      ...state,
      isLoading: state.isLoading || aiLoading,
      error: state.error || aiError
    },
    actions,
    messagesEndRef
  };
}; 