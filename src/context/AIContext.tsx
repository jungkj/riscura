import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { 
  Conversation, 
  ConversationMessage, 
  ConversationContext,
  AgentType,
  AIError,
  RiskAnalysis,
  ControlRecommendation,
  ContentGenerationRequest,
  ExplanationRequest,
  Explanation,
  BatchAnalysisRequest,
  BatchAnalysisResult,
  RateLimitStatus,
  PerformanceMetrics,
  AIAuditLog,
  SecurityEvent,
  RegenerationOptions
} from '@/types/ai.types';
import { Risk } from '@/types';
import { aiService } from '@/services/AIService';
import { useAuth } from './AuthContext';
import { generateId } from '@/lib/utils';

// AI State Interface
interface AIState {
  // Conversation Management
  conversations: Conversation[];
  currentConversation: Conversation | null;
  isConversationLoading: boolean;
  
  // Analysis Results
  riskAnalyses: Map<string, RiskAnalysis>;
  controlRecommendations: Map<string, ControlRecommendation[]>;
  
  // System Status
  isLoading: boolean;
  error: AIError | null;
  rateLimitStatus: RateLimitStatus | null;
  performanceMetrics: PerformanceMetrics | null;
  
  // Content Generation
  generatedContent: Map<string, string>;
  explanations: Map<string, Explanation>;
  
  // Batch Operations
  batchResults: Map<string, BatchAnalysisResult>;
  
  // UI State
  isARIAVisible: boolean;
  isPanelExpanded: boolean;
  selectedAgent: AgentType;
  contextEntities: {
    risks: string[];
    controls: string[];
    documents: string[];
  };
}

// AI Actions
type AIAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: AIError | null }
  | { type: 'SET_RATE_LIMIT_STATUS'; payload: RateLimitStatus }
  | { type: 'SET_PERFORMANCE_METRICS'; payload: PerformanceMetrics }
  | { type: 'START_CONVERSATION'; payload: { agentType: AgentType; context?: ConversationContext } }
  | { type: 'END_CONVERSATION' }
  | { type: 'ADD_MESSAGE'; payload: ConversationMessage }
  | { type: 'UPDATE_CONVERSATION'; payload: Conversation }
  | { type: 'SET_CONVERSATIONS'; payload: Conversation[] }
  | { type: 'ADD_RISK_ANALYSIS'; payload: { riskId: string; analysis: RiskAnalysis } }
  | { type: 'ADD_CONTROL_RECOMMENDATIONS'; payload: { riskId: string; recommendations: ControlRecommendation[] } }
  | { type: 'ADD_GENERATED_CONTENT'; payload: { key: string; content: string } }
  | { type: 'ADD_EXPLANATION'; payload: { key: string; explanation: Explanation } }
  | { type: 'ADD_BATCH_RESULT'; payload: { key: string; result: BatchAnalysisResult } }
  | { type: 'TOGGLE_ARIA_VISIBILITY' }
  | { type: 'TOGGLE_PANEL_EXPANSION' }
  | { type: 'SET_SELECTED_AGENT'; payload: AgentType }
  | { type: 'SET_CONTEXT_ENTITIES'; payload: { risks: string[]; controls: string[]; documents: string[] } }
  | { type: 'CLEAR_ERROR' };

// Initial State
const initialState: AIState = {
  conversations: [],
  currentConversation: null,
  isConversationLoading: false,
  riskAnalyses: new Map(),
  controlRecommendations: new Map(),
  isLoading: false,
  error: null,
  rateLimitStatus: null,
  performanceMetrics: null,
  generatedContent: new Map(),
  explanations: new Map(),
  batchResults: new Map(),
  isARIAVisible: false,
  isPanelExpanded: false,
  selectedAgent: 'general_assistant',
  contextEntities: {
    risks: [],
    controls: [],
    documents: [],
  },
};

// AI Reducer
const aiReducer = (state: AIState, action: AIAction): AIState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_RATE_LIMIT_STATUS':
      return { ...state, rateLimitStatus: action.payload };
    
    case 'SET_PERFORMANCE_METRICS':
      return { ...state, performanceMetrics: action.payload };
    
    case 'START_CONVERSATION': {
      const newConversation: Conversation = {
        id: generateId('conv'),
        userId: state.currentConversation?.userId || 'current-user',
        title: `Conversation with ${action.payload.agentType}`,
        agentType: action.payload.agentType,
        messages: [],
        context: action.payload.context || {
          workingSet: { risks: [], controls: [], documents: [] },
          preferences: {
            detailLevel: 'detailed',
            includeReferences: true,
            generateVisuals: false,
          },
        },
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      return {
        ...state,
        currentConversation: newConversation,
        conversations: [newConversation, ...state.conversations],
        isConversationLoading: false,
      };
    }
    
    case 'END_CONVERSATION': {
      const updatedConversation = state.currentConversation ? {
        ...state.currentConversation,
        status: 'completed' as const,
        updatedAt: new Date(),
      } : null;
      
      return {
        ...state,
        currentConversation: null,
        conversations: updatedConversation ? 
          state.conversations.map(c => c.id === updatedConversation.id ? updatedConversation : c) :
          state.conversations,
      };
    }
    
    case 'ADD_MESSAGE': {
      if (!state.currentConversation) return state;
      
      const conversationWithMessage = {
        ...state.currentConversation,
        messages: [...state.currentConversation.messages, action.payload],
        updatedAt: new Date(),
      };
      
      return {
        ...state,
        currentConversation: conversationWithMessage,
        conversations: state.conversations.map(c => 
          c.id === conversationWithMessage.id ? conversationWithMessage : c
        ),
      };
    }
    
    case 'UPDATE_CONVERSATION':
      return {
        ...state,
        currentConversation: action.payload,
        conversations: state.conversations.map(c => 
          c.id === action.payload.id ? action.payload : c
        ),
      };
    
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload };
    
    case 'ADD_RISK_ANALYSIS': {
      const newRiskAnalyses = new Map(state.riskAnalyses);
      newRiskAnalyses.set(action.payload.riskId, action.payload.analysis);
      return { ...state, riskAnalyses: newRiskAnalyses };
    }
    
    case 'ADD_CONTROL_RECOMMENDATIONS': {
      const newControlRecs = new Map(state.controlRecommendations);
      newControlRecs.set(action.payload.riskId, action.payload.recommendations);
      return { ...state, controlRecommendations: newControlRecs };
    }
    
    case 'ADD_GENERATED_CONTENT': {
      const newGeneratedContent = new Map(state.generatedContent);
      newGeneratedContent.set(action.payload.key, action.payload.content);
      return { ...state, generatedContent: newGeneratedContent };
    }
    
    case 'ADD_EXPLANATION': {
      const newExplanations = new Map(state.explanations);
      newExplanations.set(action.payload.key, action.payload.explanation);
      return { ...state, explanations: newExplanations };
    }
    
    case 'ADD_BATCH_RESULT': {
      const newBatchResults = new Map(state.batchResults);
      newBatchResults.set(action.payload.key, action.payload.result);
      return { ...state, batchResults: newBatchResults };
    }
    
    case 'TOGGLE_ARIA_VISIBILITY':
      return { ...state, isARIAVisible: !state.isARIAVisible };
    
    case 'TOGGLE_PANEL_EXPANSION':
      return { ...state, isPanelExpanded: !state.isPanelExpanded };
    
    case 'SET_SELECTED_AGENT':
      return { ...state, selectedAgent: action.payload };
    
    case 'SET_CONTEXT_ENTITIES':
      return { ...state, contextEntities: action.payload };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    default:
      return state;
  }
};

// Context Interface
interface AIContextType extends AIState {
  // Conversation Management
  startConversation: (agentType: AgentType, context?: ConversationContext) => void;
  endConversation: () => void;
  sendMessage: (content: string, attachments?: ConversationMessage['attachments']) => Promise<void>;
  switchAgent: (agentType: AgentType) => void;
  
  // Content Analysis
  analyzeRisk: (risk: Risk) => Promise<RiskAnalysis>;
  recommendControls: (risk: Risk) => Promise<ControlRecommendation[]>;
  
  // Content Generation
  generateContent: (request: ContentGenerationRequest) => Promise<string>;
  regenerateContent: (content: string, _options: RegenerationOptions) => Promise<string>;
  explainContent: (request: ExplanationRequest) => Promise<Explanation>;
  
  // Batch Operations
  performBatchAnalysis: (request: BatchAnalysisRequest) => Promise<BatchAnalysisResult>;
  
  // Context Management
  addRiskToContext: (riskId: string) => void;
  addControlToContext: (controlId: string) => void;
  addDocumentToContext: (documentId: string) => void;
  clearContext: () => void;
  
  // UI Controls
  toggleARIA: () => void;
  togglePanel: () => void;
  
  // System Information
  refreshStatus: () => void;
  getAuditLogs: () => AIAuditLog[];
  getSecurityEvents: () => SecurityEvent[];
  clearError: () => void;
}

// Create Context
const AIContext = createContext<AIContextType>({} as AIContextType);

// Custom Hook
export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within AIProvider');
  }
  return context;
};

// Provider Component
export const AIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(aiReducer, initialState);
  const { user } = useAuth();

  // Load initial data and status
  useEffect(() => {
    if (user) {
      refreshStatus();
    }
  }, [user]);

  // Auto-refresh performance metrics
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        const metrics = aiService.getPerformanceMetrics();
        dispatch({ type: 'SET_PERFORMANCE_METRICS', payload: metrics });
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  // Conversation Management
  const startConversation = (agentType: AgentType, context?: ConversationContext) => {
    dispatch({ type: 'START_CONVERSATION', payload: { agentType, context } });
  };

  const endConversation = () => {
    dispatch({ type: 'END_CONVERSATION' });
  };

  const sendMessage = async (content: string, attachments?: ConversationMessage['attachments']) => {
    if (!state.currentConversation || !user) return;

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // Add user message
      const userMessage: ConversationMessage = {
        id: generateId('msg'),
        role: 'user',
        content,
        timestamp: new Date(),
        attachments,
      };

      dispatch({ type: 'ADD_MESSAGE', payload: userMessage });

      // Simulate AI response (in production, this would call the actual agent)
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

      const aiMessage: ConversationMessage = {
        id: generateId('msg'),
        role: 'assistant',
        content: `I understand you're asking about: "${content}". Based on your context and the ${state.selectedAgent} agent capabilities, here's my analysis and recommendations...`,
        timestamp: new Date(),
        usage: {
          promptTokens: 150,
          completionTokens: 250,
          totalTokens: 400,
          estimatedCost: 0.008,
        },
      };

      dispatch({ type: 'ADD_MESSAGE', payload: aiMessage });
    } catch (error) {
      const aiError: AIError = {
        code: 'API_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        retryable: true,
        fallbackUsed: false,
      };
      dispatch({ type: 'SET_ERROR', payload: aiError });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const switchAgent = (agentType: AgentType) => {
    dispatch({ type: 'SET_SELECTED_AGENT', payload: agentType });
    if (state.currentConversation) {
      const updatedConversation = {
        ...state.currentConversation,
        agentType,
        title: `Conversation with ${agentType}`,
        updatedAt: new Date(),
      };
      dispatch({ type: 'UPDATE_CONVERSATION', payload: updatedConversation });
    }
  };

  // Content Analysis
  const analyzeRisk = async (risk: Risk): Promise<RiskAnalysis> => {
    if (!user) throw new Error('User not authenticated');

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const analysis = await aiService.analyzeRisk(risk, user.id);
      dispatch({ type: 'ADD_RISK_ANALYSIS', payload: { riskId: risk.id, analysis } });
      return analysis;
    } catch (error) {
      const aiError: AIError = {
        code: 'API_ERROR',
        message: error instanceof Error ? error.message : 'Analysis failed',
        timestamp: new Date(),
        retryable: true,
        fallbackUsed: false,
      };
      dispatch({ type: 'SET_ERROR', payload: aiError });
      throw aiError;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const recommendControls = async (risk: Risk): Promise<ControlRecommendation[]> => {
    if (!user) throw new Error('User not authenticated');

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const recommendations = await aiService.recommendControls(risk, user.id);
      dispatch({ type: 'ADD_CONTROL_RECOMMENDATIONS', payload: { riskId: risk.id, recommendations } });
      return recommendations;
    } catch (error) {
      const aiError: AIError = {
        code: 'API_ERROR',
        message: error instanceof Error ? error.message : 'Recommendations failed',
        timestamp: new Date(),
        retryable: true,
        fallbackUsed: false,
      };
      dispatch({ type: 'SET_ERROR', payload: aiError });
      throw aiError;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Content Generation
  const generateContent = async (request: ContentGenerationRequest): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const content = await aiService.generateContent(request, user.id);
      const key = `${request.type}-${Date.now()}`;
      dispatch({ type: 'ADD_GENERATED_CONTENT', payload: { key, content } });
      return content;
    } catch (error) {
      const aiError: AIError = {
        code: 'API_ERROR',
        message: error instanceof Error ? error.message : 'Content generation failed',
        timestamp: new Date(),
        retryable: true,
        fallbackUsed: false,
      };
      dispatch({ type: 'SET_ERROR', payload: aiError });
      throw aiError;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const regenerateContent = async (content: string, _options: RegenerationOptions): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    const request: ContentGenerationRequest = {
      type: 'risk_description', // Default type
      context: content,
      requirements: {
        length: 'standard',
        tone: 'professional',
        audience: 'managers',
        includeReferences: false,
        includeExamples: false,
      },
    };

    return generateContent(request);
  };

  const explainContent = async (request: ExplanationRequest): Promise<Explanation> => {
    if (!user) throw new Error('User not authenticated');

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const explanation = await aiService.explainContent(request, user.id);
      const key = `explanation-${Date.now()}`;
      dispatch({ type: 'ADD_EXPLANATION', payload: { key, explanation } });
      return explanation;
    } catch (error) {
      const aiError: AIError = {
        code: 'API_ERROR',
        message: error instanceof Error ? error.message : 'Explanation failed',
        timestamp: new Date(),
        retryable: true,
        fallbackUsed: false,
      };
      dispatch({ type: 'SET_ERROR', payload: aiError });
      throw aiError;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Batch Operations
  const performBatchAnalysis = async (request: BatchAnalysisRequest): Promise<BatchAnalysisResult> => {
    if (!user) throw new Error('User not authenticated');

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const result = await aiService.batchAnalysis(request, user.id);
      const key = `batch-${Date.now()}`;
      dispatch({ type: 'ADD_BATCH_RESULT', payload: { key, result } });
      return result;
    } catch (error) {
      const aiError: AIError = {
        code: 'API_ERROR',
        message: error instanceof Error ? error.message : 'Batch analysis failed',
        timestamp: new Date(),
        retryable: true,
        fallbackUsed: false,
      };
      dispatch({ type: 'SET_ERROR', payload: aiError });
      throw aiError;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Context Management
  const addRiskToContext = (riskId: string) => {
    const newRisks = [...state.contextEntities.risks, riskId];
    dispatch({ 
      type: 'SET_CONTEXT_ENTITIES', 
      payload: { ...state.contextEntities, risks: newRisks } 
    });
  };

  const addControlToContext = (controlId: string) => {
    const newControls = [...state.contextEntities.controls, controlId];
    dispatch({ 
      type: 'SET_CONTEXT_ENTITIES', 
      payload: { ...state.contextEntities, controls: newControls } 
    });
  };

  const addDocumentToContext = (documentId: string) => {
    const newDocuments = [...state.contextEntities.documents, documentId];
    dispatch({ 
      type: 'SET_CONTEXT_ENTITIES', 
      payload: { ...state.contextEntities, documents: newDocuments } 
    });
  };

  const clearContext = () => {
    dispatch({ 
      type: 'SET_CONTEXT_ENTITIES', 
      payload: { risks: [], controls: [], documents: [] } 
    });
  };

  // UI Controls
  const toggleARIA = () => {
    dispatch({ type: 'TOGGLE_ARIA_VISIBILITY' });
  };

  const togglePanel = () => {
    dispatch({ type: 'TOGGLE_PANEL_EXPANSION' });
  };

  // System Information
  const refreshStatus = () => {
    if (!user) return;

    // Get rate limit status
    const rateLimitStatus = aiService.getRateLimitStatus(user.id);
    dispatch({ type: 'SET_RATE_LIMIT_STATUS', payload: rateLimitStatus });

    // Get performance metrics
    const metrics = aiService.getPerformanceMetrics();
    dispatch({ type: 'SET_PERFORMANCE_METRICS', payload: metrics });
  };

  const getAuditLogs = (): AIAuditLog[] => {
    return user ? aiService.getAuditLogs(user.id) : [];
  };

  const getSecurityEvents = (): SecurityEvent[] => {
    return aiService.getSecurityEvents();
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Context Value
  const contextValue: AIContextType = {
    ...state,
    startConversation,
    endConversation,
    sendMessage,
    switchAgent,
    analyzeRisk,
    recommendControls,
    generateContent,
    regenerateContent,
    explainContent,
    performBatchAnalysis,
    addRiskToContext,
    addControlToContext,
    addDocumentToContext,
    clearContext,
    toggleARIA,
    togglePanel,
    refreshStatus,
    getAuditLogs,
    getSecurityEvents,
    clearError,
  };

  return (
    <AIContext.Provider value={contextValue}>
      {children}
    </AIContext.Provider>
  );
}; 