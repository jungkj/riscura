import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Risk } from '@/types';
import { AIService, AIServiceError, RateLimitError } from '@/services/AIService';
import { AgentType, ConversationMessage } from '@/types/ai.types';

interface AIContextType {
  analyzeRisk: (risk: Risk) => Promise<any>;
  recommendControls: (risk: Risk) => Promise<any>;
  generateContent: (request: any) => Promise<any>;
  explainContent: (request: any) => Promise<any>;
  isLoading: boolean;
  performanceMetrics: any;
  rateLimitStatus: any;
  conversations: any[];
  sendMessage: (content: string, attachments?: any) => Promise<void>;
  selectedAgent: string;
  switchAgent: (agentType: string) => void;
  currentConversation: any;
  startConversation: (agentType: string, context?: any) => void;
  error: any;
  toggleARIA: () => void;
  aiService: AIService | null;
  streamingResponse: string;
  clearError: () => void;
  retryLastRequest: () => Promise<void>;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};

interface AIProviderProps {
  children: ReactNode;
}

export const AIProvider: React.FC<AIProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentType>('general_assistant');
  const [currentConversation, setCurrentConversation] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [error, setError] = useState<any>(null);
  const [streamingResponse, setStreamingResponse] = useState('');
  const [aiService, setAIService] = useState<AIService | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>({});
  const [rateLimitStatus, setRateLimitStatus] = useState<any>({});
  const [lastFailedRequest, setLastFailedRequest] = useState<(() => Promise<any>) | null>(null);

  // Initialize AI Service
  useEffect(() => {
    try {
      const service = new AIService({
        // Configuration will be loaded from environment variables
        defaultModel: import.meta.env.VITE_AI_DEFAULT_MODEL || 'gpt-4o-mini',
        maxTokens: parseInt(import.meta.env.VITE_AI_MAX_TOKENS) || 4000,
        temperature: parseFloat(import.meta.env.VITE_AI_TEMPERATURE) || 0.7,
        rateLimitRpm: parseInt(import.meta.env.VITE_AI_RATE_LIMIT_RPM) || 50,
        rateLimitTpm: parseInt(import.meta.env.VITE_AI_RATE_LIMIT_TPM) || 100000,
      });
      setAIService(service);
      
      // Initialize mock conversations for UI compatibility
      setConversations([
        {
          id: 'conv-1',
          title: 'Risk Assessment Discussion',
          messages: [
            { id: 'msg-1', content: 'Hello! I\'m ARIA, your AI Risk Intelligence Assistant. How can I help you today?', timestamp: new Date(), role: 'assistant' }
          ],
          updatedAt: new Date(),
          agentType: 'risk_analyzer'
        }
      ]);
    } catch (error) {
      console.error('Failed to initialize AI Service:', error);
      setError(error);
    }
  }, []);

  // Update metrics periodically
  useEffect(() => {
    if (!aiService) return;

    const updateMetrics = () => {
      try {
        const metrics = aiService.getUsageMetrics();
        const rateLimit = aiService.getRateLimitStatus();
        
        setPerformanceMetrics({
          averageResponseTime: Math.round(metrics.averageResponseTime),
          cacheHitRate: 0.85, // Would be calculated by service
          totalRequests: metrics.totalRequests,
          successRate: metrics.successRate,
          totalCost: metrics.totalCost,
          circuitBreakerState: aiService.getCircuitBreakerState()
        });

        setRateLimitStatus({
          requestsRemaining: rateLimit.requestsRemaining,
          resetTime: rateLimit.resetTime,
          limit: 50, // From config
          isLimited: rateLimit.isLimited
        });
      } catch (error) {
        console.error('Error updating metrics:', error);
      }
    };

    // Update immediately and then every 30 seconds
    updateMetrics();
    const interval = setInterval(updateMetrics, 30000);
    
    return () => clearInterval(interval);
  }, [aiService]);

  const handleError = useCallback((error: unknown, requestFn?: () => Promise<any>) => {
    console.error('AI Service Error:', error);
    
    if (error instanceof RateLimitError) {
      setError({
        type: 'rate_limit',
        message: `Rate limit exceeded. Please try again after ${error.resetTime.toLocaleTimeString()}`,
        retryAfter: error.resetTime,
        retryable: true
      });
    } else if (error instanceof AIServiceError) {
      setError({
        type: 'service_error',
        message: error.message,
        code: error.code,
        retryable: error.retryable
      });
    } else {
      setError({
        type: 'unknown_error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        retryable: false
      });
    }

    if (requestFn && error instanceof AIServiceError && error.retryable) {
      setLastFailedRequest(() => requestFn);
    }
    
    setIsLoading(false);
  }, []);

  const analyzeRisk = async (risk: Risk) => {
    if (!aiService) {
      throw new Error('AI Service not initialized. Please check your API configuration.');
    }

    const requestFn = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const analysis = await aiService.analyzeRisk(risk);
        return {
          riskId: risk.id,
          riskLevel: analysis.score.overall > 15 ? 'high' : analysis.score.overall > 8 ? 'medium' : 'low',
          category: risk.category,
          description: `AI Analysis of ${risk.title}`,
          keyFindings: [
            `Risk score: ${analysis.score.overall}`,
            `Confidence: ${(analysis.confidence * 100).toFixed(0)}%`,
            `Category: ${risk.category}`
          ],
          confidence: analysis.confidence,
          lastUpdated: new Date(),
          metadata: {
            usage: analysis.timestamp,
            model: 'gpt-4o-mini' // Default model name
          },
          analysis
        };
      } catch (error) {
        handleError(error, requestFn);
        throw error;
      } finally {
        setIsLoading(false);
      }
    };

    return requestFn();
  };

  const recommendControls = async (risk: Risk) => {
    if (!aiService) {
      throw new Error('AI Service not initialized. Please check your API configuration.');
    }

    const requestFn = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const recommendations = await aiService.recommendControls(risk);
        return recommendations.map(rec => ({
          id: rec.id,
          riskId: risk.id,
          title: rec.title,
          description: rec.description,
          priority: rec.priority === 1 ? 'high' : rec.priority === 2 ? 'medium' : 'low',
          confidence: 0.85,
          effectiveness: rec.effectiveness,
          implementationCost: rec.implementationCost,
          type: rec.type,
          category: rec.category
        }));
      } catch (error) {
        handleError(error, requestFn);
        throw error;
      } finally {
        setIsLoading(false);
      }
    };

    return requestFn();
  };

  const generateContent = async (request: any) => {
    if (!aiService) {
      throw new Error('AI Service not initialized. Please check your API configuration.');
    }

    const requestFn = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await aiService.generateContent(request);
        return {
          id: result.id,
          content: result.content,
          timestamp: result.timestamp,
          usage: result.usage,
          confidence: result.confidence
        };
      } catch (error) {
        handleError(error, requestFn);
        throw error;
      } finally {
        setIsLoading(false);
      }
    };

    return requestFn();
  };

  const explainContent = async (request: any) => {
    if (!aiService) {
      throw new Error('AI Service not initialized. Please check your API configuration.');
    }

    const requestFn = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const explanation = await aiService.explainContent(request);
        return {
          summary: explanation.summary,
          complexity: explanation.complexity,
          confidence: explanation.confidence,
          timestamp: explanation.timestamp,
          usage: explanation.usage
        };
      } catch (error) {
        handleError(error, requestFn);
        throw error;
      } finally {
        setIsLoading(false);
      }
    };

    return requestFn();
  };

  const sendMessage = async (content: string, attachments?: any) => {
    if (!aiService) {
      throw new Error('AI Service not initialized. Please check your API configuration.');
    }

    const requestFn = async () => {
      setIsLoading(true);
      setError(null);
      setStreamingResponse('');
      
      try {
        // Handle streaming response
        const onStream = (chunk: string) => {
          setStreamingResponse(prev => prev + chunk);
        };

        const response = await aiService.sendMessage(
          content, 
          selectedAgent, 
          attachments, 
          onStream
        );

        // Add user message to conversation
        const userMessage: ConversationMessage = {
          id: `msg-${Date.now()}-user`,
          role: 'user',
          content,
          timestamp: new Date(),
          attachments
        };

        // Add AI response to conversation
        const aiMessage: ConversationMessage = {
          id: response.id,
          role: 'assistant',
          content: response.content,
          timestamp: response.timestamp,
          usage: response.usage
        };

        // Update current conversation
        if (currentConversation) {
          const updatedConversation = {
            ...currentConversation,
            messages: [...currentConversation.messages, userMessage, aiMessage],
            updatedAt: new Date()
          };
          setCurrentConversation(updatedConversation);
          
          // Update conversations list
          setConversations(prev => 
            prev.map(conv => 
              conv.id === currentConversation.id ? updatedConversation : conv
            )
          );
        }

        setStreamingResponse('');
      } catch (error) {
        handleError(error, requestFn);
        setStreamingResponse('');
        throw error;
      } finally {
        setIsLoading(false);
      }
    };

    return requestFn();
  };

  const switchAgent = (agentType: string) => {
    setSelectedAgent(agentType as AgentType);
    setError(null);
    
    // Update current conversation's agent type
    if (currentConversation) {
      const updatedConversation = {
        ...currentConversation,
        agentType,
        updatedAt: new Date()
      };
      setCurrentConversation(updatedConversation);
    }
  };

  const startConversation = (agentType: string, context?: any) => {
    const newConversation = {
      id: `conv-${Date.now()}`,
      title: `New ${agentType.replace('_', ' ')} conversation`,
      messages: [{
        id: `msg-${Date.now()}`,
        role: 'assistant' as const,
        content: getWelcomeMessage(agentType as AgentType),
        timestamp: new Date()
      }],
      agentType,
      context,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setCurrentConversation(newConversation);
    setConversations(prev => [newConversation, ...prev]);
    setSelectedAgent(agentType as AgentType);
    setError(null);
  };

  const getWelcomeMessage = (agentType: AgentType): string => {
    const messages = {
      risk_analyzer: "Hello! I'm your Risk Analyzer assistant. I can help you assess risks, analyze risk scenarios, and provide detailed risk insights. What risk would you like me to analyze?",
      control_advisor: "Hi! I'm your Control Advisor. I specialize in recommending and designing effective controls for your risks. Share a risk with me and I'll suggest appropriate controls.",
      compliance_expert: "Greetings! I'm your Compliance Expert. I can help you understand regulatory requirements, assess compliance gaps, and provide guidance on compliance frameworks. How can I assist you today?",
      general_assistant: "Hello! I'm ARIA, your AI Risk Intelligence Assistant. I can help you with risk management, control design, compliance guidance, and general risk advisory. What would you like to discuss?"
    };
    return messages[agentType] || messages.general_assistant;
  };

  const toggleARIA = () => {
    // Toggle ARIA widget visibility - implementation would depend on UI structure
    console.log('Toggle ARIA widget');
  };

  const clearError = () => {
    setError(null);
    setLastFailedRequest(null);
  };

  const retryLastRequest = async () => {
    if (lastFailedRequest) {
      try {
        await lastFailedRequest();
        setLastFailedRequest(null);
      } catch (error) {
        // Error handling is done in the original request function
      }
    }
  };

  const value: AIContextType = {
    analyzeRisk,
    recommendControls,
    generateContent,
    explainContent,
    isLoading,
    performanceMetrics,
    rateLimitStatus,
    conversations,
    sendMessage,
    selectedAgent,
    switchAgent,
    currentConversation,
    startConversation,
    error,
    toggleARIA,
    aiService,
    streamingResponse,
    clearError,
    retryLastRequest
  };

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
}; 