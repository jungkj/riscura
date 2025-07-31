'use client';

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from 'react';
import { Risk } from '@/types';
import { AIService, AIServiceError, RateLimitError, ConnectionStatus } from '@/services/AIService';
import { AgentType, ConversationMessage, MessageAttachment } from '@/types/ai.types';
import { AI_AGENTS } from '@/config/ai-agents';
import { tokenManagementService, type UsageAlert } from '@/services/TokenManagementService';

// Enhanced interfaces for token management integration
interface TokenUsageMetrics {
  dailyTokens: number;
  dailyLimit: number;
  dailyPercentage: number;
  dailyCost: number;
  weeklyTokens: number;
  weeklyLimit: number;
  weeklyPercentage: number;
  weeklyCost: number;
  monthlyTokens: number;
  monthlyLimit: number;
  monthlyPercentage: number;
  monthlyCost: number;
  currentTier: string;
}

interface RealTimeUsageStats {
  sessionTokens: number;
  sessionCost: number;
  sessionDuration: number;
  todayTokens: number;
  todayCost: number;
  todayConversations: number;
  costProjections: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

interface ConversationUsage {
  id: string;
  title: string;
  agentType: string;
  tokens: number;
  cost: number;
  messageCount: number;
  startTime: Date;
  lastActivity: Date;
}

interface ContentGenerationRequest {
  type: string;
  context?: Record<string, unknown>;
  requirements?: string;
}

interface ExplanationRequest {
  content: string;
  complexity?: 'simple' | 'detailed' | 'expert';
}

// Enhanced conversation interface
interface Conversation {
  id: string;
  title: string;
  messages: ConversationMessage[];
  updatedAt: Date;
  agentType: string;
}

// Enhanced performance metrics
interface PerformanceMetrics {
  averageResponseTime: number;
  cacheHitRate: number;
  totalRequests: number;
  successRate: number;
  totalCost: number;
  circuitBreakerState: string;
}

// Enhanced rate limit status
interface RateLimitStatus {
  requestsRemaining: number;
  resetTime: Date;
  limit: number;
  isLimited: boolean;
}

// Enhanced error interface
interface EnhancedError {
  type: string;
  message: string;
  code?: string;
  retryable: boolean;
  severity?: string;
  userMessage?: string;
  retryAfter?: Date;
}

interface AIContextType {
  analyzeRisk: (risk: Risk) => Promise<unknown>;
  recommendControls: (risk: Risk) => Promise<unknown>;
  generateContent: (request: ContentGenerationRequest) => Promise<unknown>;
  explainContent: (request: ExplanationRequest) => Promise<unknown>;
  isLoading: boolean;
  performanceMetrics: PerformanceMetrics;
  rateLimitStatus: RateLimitStatus;
  conversations: Conversation[];
  sendMessage: (content: string, attachments?: MessageAttachment[]) => Promise<void>;
  selectedAgent: AgentType;
  switchAgent: (agentType: AgentType) => void;
  currentConversation: Conversation | null;
  startConversation: (agentType: AgentType, context?: Record<string, unknown>) => void;
  error: EnhancedError | null;
  toggleARIA: () => void;
  aiService: AIService | null;
  streamingResponse: string;
  clearError: () => void;
  retryLastRequest: () => Promise<void>;
  // Token management features
  tokenUsageMetrics: TokenUsageMetrics;
  realTimeUsageStats: RealTimeUsageStats;
  usageAlerts: UsageAlert[];
  acknowledgeAlert: (alertId: string) => void;
  generateUsageReport: (period: 'daily' | 'weekly' | 'monthly', format?: 'json' | 'csv') => string;
  exportUsageData: (format: 'json' | 'csv') => void;
  upgradeTier: (tierName: string) => boolean;
  canMakeRequest: () => { allowed: boolean; reason?: string };
  conversationUsages: ConversationUsage[];
  // Enhanced error handling
  connectionStatus: ConnectionStatus;
  isReconnecting: boolean;
  lastError: EnhancedError | null;
  errorHistory: EnhancedError[];
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
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [error, setError] = useState<EnhancedError | null>(null);
  const [streamingResponse, setStreamingResponse] = useState('');
  const [aiService, setAIService] = useState<AIService | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    averageResponseTime: 0,
    cacheHitRate: 0,
    totalRequests: 0,
    successRate: 1,
    totalCost: 0,
    circuitBreakerState: 'CLOSED',
  });
  const [rateLimitStatus, setRateLimitStatus] = useState<RateLimitStatus>({
    requestsRemaining: 50,
    resetTime: new Date(),
    limit: 50,
    isLimited: false,
  });
  const [lastFailedRequest, setLastFailedRequest] = useState<(() => Promise<unknown>) | null>(null);

  // Enhanced error handling state
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    ConnectionStatus.CONNECTED
  );
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [lastError, setLastError] = useState<EnhancedError | null>(null);
  const [errorHistory, setErrorHistory] = useState<EnhancedError[]>([]);

  // Token management state
  const [tokenUsageMetrics, setTokenUsageMetrics] = useState<TokenUsageMetrics>({
    dailyTokens: 0,
    dailyLimit: 0,
    dailyPercentage: 0,
    dailyCost: 0,
    weeklyTokens: 0,
    weeklyLimit: 0,
    weeklyPercentage: 0,
    weeklyCost: 0,
    monthlyTokens: 0,
    monthlyLimit: 0,
    monthlyPercentage: 0,
    monthlyCost: 0,
    currentTier: 'free',
  });

  const [realTimeUsageStats, setRealTimeUsageStats] = useState<RealTimeUsageStats>({
    sessionTokens: 0,
    sessionCost: 0,
    sessionDuration: 0,
    todayTokens: 0,
    todayCost: 0,
    todayConversations: 0,
    costProjections: {
      daily: 0,
      weekly: 0,
      monthly: 0,
    },
  });

  const [usageAlerts, setUsageAlerts] = useState<UsageAlert[]>([]);
  const [conversationUsages, setConversationUsages] = useState<ConversationUsage[]>([]);

  const userId = 'current-user'; // Would come from auth context

  // Enhanced error handling utility
  const enhanceError = useCallback((error: unknown, context: string): EnhancedError => {
    if (error instanceof AIServiceError) {
      return {
        type: 'service_error',
        message: error.message,
        code: error.code,
        retryable: error.retryable,
        severity: error.severity,
        userMessage: error.userMessage,
      };
    }

    if (error instanceof RateLimitError) {
      return {
        type: 'rate_limit',
        message: error.message,
        code: error.code,
        retryable: error.retryable,
        severity: error.severity,
        userMessage: error.userMessage,
        retryAfter: error.resetTime,
      };
    }

    return {
      type: 'unknown_error',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      retryable: false,
      userMessage: `${context} failed. Please try again or contact support.`,
    };
  }, []);

  // Initialize AI Service with enhanced error handling
  useEffect(() => {
    // Check if AI features are enabled
    const aiEnabled = process.env.NEXT_PUBLIC_ENABLE_AI_FEATURES !== 'false';
    const hasApiKey =
      process.env.NEXT_PUBLIC_OPENAI_API_KEY &&
      process.env.NEXT_PUBLIC_OPENAI_API_KEY !== 'sk-placeholder' &&
      process.env.NEXT_PUBLIC_OPENAI_API_KEY !== 'your-openai-api-key';

    if (!aiEnabled || !hasApiKey) {
      // Only log once in development, suppress in production
      if (process.env.NODE_ENV === 'development' && !hasApiKey) {
        console.warn(
          'AI features disabled: Missing OpenAI API key. Set NEXT_PUBLIC_OPENAI_API_KEY in your environment.'
        );
      }

      setConnectionStatus(ConnectionStatus.DISCONNECTED);
      setError({
        type: 'service_disabled',
        message: 'AI features are disabled in demo mode',
        retryable: false,
      });

      // Initialize mock conversations for UI compatibility
      setConversations([
        {
          id: 'conv-1',
          title: 'Risk Assessment Discussion',
          messages: [
            {
              id: 'msg-1',
              content:
                "Hello! I'm ARIA, your AI Risk Intelligence Assistant. AI features are currently disabled. You can still explore the dashboard and other features!",
              timestamp: new Date(),
              role: 'assistant',
            },
          ],
          updatedAt: new Date(),
          agentType: 'risk_analyzer',
        },
      ]);
      return;
    }

    try {
      const service = new AIService({
        defaultModel: process.env.NEXT_PUBLIC_AI_DEFAULT_MODEL || 'gpt-4o-mini',
        maxTokens: parseInt(process.env.NEXT_PUBLIC_AI_MAX_TOKENS || '4000') || 4000,
        temperature: parseFloat(process.env.NEXT_PUBLIC_AI_TEMPERATURE || '0.7') || 0.7,
        rateLimitRpm: parseInt(process.env.NEXT_PUBLIC_AI_RATE_LIMIT_RPM || '50') || 50,
        rateLimitTpm: parseInt(process.env.NEXT_PUBLIC_AI_RATE_LIMIT_TPM || '100000') || 100000,
      });
      setAIService(service);
      setConnectionStatus(ConnectionStatus.CONNECTED);

      // Initialize mock conversations for UI compatibility
      setConversations([
        {
          id: 'conv-1',
          title: 'Risk Assessment Discussion',
          messages: [
            {
              id: 'msg-1',
              content:
                "Hello! I'm ARIA, your AI Risk Intelligence Assistant. How can I help you today?",
              timestamp: new Date(),
              role: 'assistant',
            },
          ],
          updatedAt: new Date(),
          agentType: 'risk_analyzer',
        },
      ]);
    } catch (error) {
      console.error('Failed to initialize AI Service:', error);
      const enhancedError = enhanceError(error, 'AI Service initialization');
      setError(enhancedError);
      setLastError(enhancedError);
      setConnectionStatus(ConnectionStatus.DISCONNECTED);
    }
  }, [enhanceError]);

  // Update token usage metrics periodically
  useEffect(() => {
    const updateTokenMetrics = () => {
      const userUsage = tokenManagementService.getUserUsage(userId);
      const realTimeStats = tokenManagementService.getRealTimeStats(userId);
      const alerts = tokenManagementService.getActiveAlerts(userId);

      if (userUsage) {
        setTokenUsageMetrics({
          dailyTokens: userUsage.dailyTokens,
          dailyLimit: userUsage.tier.quotas.dailyTokenLimit,
          dailyPercentage: (userUsage.dailyTokens / userUsage.tier.quotas.dailyTokenLimit) * 100,
          dailyCost: userUsage.dailyCost,
          weeklyTokens: userUsage.weeklyTokens,
          weeklyLimit: userUsage.tier.quotas.weeklyTokenLimit,
          weeklyPercentage: (userUsage.weeklyTokens / userUsage.tier.quotas.weeklyTokenLimit) * 100,
          weeklyCost: userUsage.weeklyCost,
          monthlyTokens: userUsage.monthlyTokens,
          monthlyLimit: userUsage.tier.quotas.monthlyTokenLimit,
          monthlyPercentage:
            (userUsage.monthlyTokens / userUsage.tier.quotas.monthlyTokenLimit) * 100,
          monthlyCost: userUsage.monthlyCost,
          currentTier: userUsage.tier.name,
        });
      }

      setRealTimeUsageStats({
        sessionTokens: realTimeStats.currentSession.tokens,
        sessionCost: realTimeStats.currentSession.cost,
        sessionDuration: realTimeStats.currentSession.duration,
        todayTokens: realTimeStats.today.tokens,
        todayCost: realTimeStats.today.cost,
        todayConversations: realTimeStats.today.conversations,
        costProjections: {
          daily: realTimeStats.costProjection.dailyProjected,
          weekly: realTimeStats.costProjection.weeklyProjected,
          monthly: realTimeStats.costProjection.monthlyProjected,
        },
      });

      setUsageAlerts(alerts);
    };

    // Update immediately and then every 30 seconds
    updateTokenMetrics();
    const interval = setInterval(updateTokenMetrics, 30000);

    return () => clearInterval(interval);
  }, [userId]);

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
          circuitBreakerState: aiService.getCircuitBreakerState(),
        });

        setRateLimitStatus({
          requestsRemaining: rateLimit.requestsRemaining,
          resetTime: rateLimit.resetTime,
          limit: 50, // From config
          isLimited: rateLimit.isLimited,
        });
      } catch (error) {
        console.error('Error updating metrics:', error);
        // Use default values if methods don't exist
        setPerformanceMetrics({
          averageResponseTime: 0,
          cacheHitRate: 0.85,
          totalRequests: 0,
          successRate: 1,
          totalCost: 0,
          circuitBreakerState: 'CLOSED',
        });

        setRateLimitStatus({
          requestsRemaining: 50,
          resetTime: new Date(),
          limit: 50,
          isLimited: false,
        });
      }
    };

    // Update immediately and then every 30 seconds
    updateMetrics();
    const interval = setInterval(updateMetrics, 30000);

    return () => clearInterval(interval);
  }, [aiService]);

  const handleError = useCallback((error: unknown, requestFn?: () => Promise<unknown>) => {
    console.error('AI Service Error:', error);

    if (error instanceof RateLimitError) {
      setError({
        type: 'rate_limit',
        message: `Rate limit exceeded. Please try again after ${error.resetTime.toLocaleTimeString()}`,
        retryAfter: error.resetTime,
        retryable: true,
      });
    } else if (error instanceof AIServiceError) {
      setError({
        type: 'service_error',
        message: error.message,
        code: error.code,
        retryable: error.retryable,
      });
    } else {
      setError({
        type: 'unknown_error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        retryable: false,
      });
    }

    if (requestFn && error instanceof AIServiceError && error.retryable) {
      setLastFailedRequest(() => requestFn);
    }

    setIsLoading(false);
  }, []);

  // Token management methods
  const acknowledgeAlert = useCallback((alertId: string) => {
    tokenManagementService.acknowledgeAlert(alertId);
    setUsageAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
  }, []);

  const generateUsageReport = useCallback(
    (period: 'daily' | 'weekly' | 'monthly', format: 'json' | 'csv' = 'json'): string => {
      const report = tokenManagementService.generateUsageReport(userId, period);
      if (format === 'json') {
        return JSON.stringify(report, null, 2);
      } else {
        return tokenManagementService.exportUsageData(userId, 'csv', period);
      }
    },
    [userId]
  );

  const exportUsageData = useCallback(
    (format: 'json' | 'csv') => {
      const data = tokenManagementService.exportUsageData(userId, format, 'monthly');
      const blob = new Blob([data], {
        type: format === 'json' ? 'application/json' : 'text/csv',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `riscura-usage-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [userId]
  );

  const upgradeTier = useCallback(
    (tierName: string): boolean => {
      const success = tokenManagementService.upgradeUserTier(userId, tierName);
      if (success) {
        // Refresh token metrics
        const userUsage = tokenManagementService.getUserUsage(userId);
        if (userUsage) {
          setTokenUsageMetrics((prev) => ({
            ...prev,
            currentTier: userUsage.tier.name,
            dailyLimit: userUsage.tier.quotas.dailyTokenLimit,
            weeklyLimit: userUsage.tier.quotas.weeklyTokenLimit,
            monthlyLimit: userUsage.tier.quotas.monthlyTokenLimit,
            dailyPercentage: (userUsage.dailyTokens / userUsage.tier.quotas.dailyTokenLimit) * 100,
            weeklyPercentage:
              (userUsage.weeklyTokens / userUsage.tier.quotas.weeklyTokenLimit) * 100,
            monthlyPercentage:
              (userUsage.monthlyTokens / userUsage.tier.quotas.monthlyTokenLimit) * 100,
          }));
        }
      }
      return success;
    },
    [userId]
  );

  const canMakeRequest = useCallback((): { allowed: boolean; reason?: string } => {
    const result = tokenManagementService.canMakeRequest(userId);
    return { allowed: result.allowed, reason: result.reason };
  }, [userId]);

  const analyzeRisk = async (risk: Risk) => {
    if (!aiService) {
      throw new Error('AI Service not initialized. Please check your API configuration.');
    }

    // Check quota before making request
    const quotaCheck = canMakeRequest();
    if (!quotaCheck.allowed) {
      throw new Error(quotaCheck.reason || 'Usage quota exceeded');
    }

    const requestFn = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const analysis = await aiService.analyzeRisk(risk);
        return {
          riskId: risk.id,
          riskLevel:
            analysis.score.overall > 15 ? 'high' : analysis.score.overall > 8 ? 'medium' : 'low',
          category: risk.category,
          description: `AI Analysis of ${risk.title}`,
          keyFindings: [
            `Risk score: ${analysis.score.overall}`,
            `Confidence: ${(analysis.confidence * 100).toFixed(0)}%`,
            `Category: ${risk.category}`,
          ],
          confidence: analysis.confidence,
          lastUpdated: new Date(),
          metadata: {
            usage: analysis.timestamp,
            model: 'gpt-4o-mini', // Default model name
          },
          analysis,
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
        return recommendations.map((rec) => ({
          id: rec.id,
          riskId: risk.id,
          title: rec.title,
          description: rec.description,
          priority: rec.priority === 1 ? 'high' : rec.priority === 2 ? 'medium' : 'low',
          confidence: 0.85,
          effectiveness: rec.effectiveness,
          implementationCost: rec.implementationCost,
          type: rec.type,
          category: rec.category,
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

  const generateContent = async (request: ContentGenerationRequest) => {
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
          confidence: result.confidence,
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

  const explainContent = async (request: ExplanationRequest) => {
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
          usage: explanation.usage,
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

  const sendMessage = async (content: string, attachments?: MessageAttachment[]) => {
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
          setStreamingResponse((prev) => prev + chunk);
        };

        const response = await aiService.sendMessage(content, selectedAgent, attachments, onStream);

        // Add user message to conversation
        const userMessage: ConversationMessage = {
          id: `msg-${Date.now()}-user`,
          role: 'user',
          content,
          timestamp: new Date(),
          attachments,
        };

        // Add AI response to conversation
        const aiMessage: ConversationMessage = {
          id: response.id,
          role: 'assistant',
          content: response.content,
          timestamp: response.timestamp,
          usage: response.usage,
        };

        // Update current conversation
        if (currentConversation) {
          const updatedConversation = {
            ...currentConversation,
            messages: [...currentConversation.messages, userMessage, aiMessage],
            updatedAt: new Date(),
          };
          setCurrentConversation(updatedConversation);

          // Update conversations list
          setConversations((prev) =>
            prev.map((conv) => (conv.id === currentConversation.id ? updatedConversation : conv))
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
        updatedAt: new Date(),
      };
      setCurrentConversation(updatedConversation);
    }
  };

  const startConversation = (agentType: string, context?: Record<string, unknown>) => {
    const newConversation = {
      id: `conv-${Date.now()}`,
      title: `New ${agentType.replace('_', ' ')} conversation`,
      messages: [
        {
          id: `msg-${Date.now()}`,
          role: 'assistant' as const,
          content: getWelcomeMessage(agentType as AgentType),
          timestamp: new Date(),
        },
      ],
      agentType,
      context,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setCurrentConversation(newConversation);
    setConversations((prev) => [newConversation, ...prev]);
    setSelectedAgent(agentType as AgentType);
    setError(null);
  };

  const getWelcomeMessage = (agentType: AgentType): string => {
    const agent = AI_AGENTS[agentType];
    return agent?.welcomeMessage || AI_AGENTS.general_assistant.welcomeMessage;
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
    retryLastRequest,
    tokenUsageMetrics,
    realTimeUsageStats,
    usageAlerts,
    acknowledgeAlert,
    generateUsageReport,
    exportUsageData,
    upgradeTier,
    canMakeRequest,
    conversationUsages,
    connectionStatus,
    isReconnecting,
    lastError,
    errorHistory,
  };

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
};
