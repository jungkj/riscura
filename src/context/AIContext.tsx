import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Risk } from '@/types';

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
  const [selectedAgent, setSelectedAgent] = useState('general_assistant');
  const [currentConversation, setCurrentConversation] = useState<any>(null);

  const performanceMetrics = {
    averageResponseTime: 1200,
    cacheHitRate: 0.85,
    totalRequests: 150,
    successRate: 0.98
  };

  const rateLimitStatus = {
    requestsRemaining: 42,
    resetTime: new Date(Date.now() + 3600000),
    limit: 50
  };

  const conversations = [
    {
      id: 'conv-1',
      title: 'Risk Assessment Discussion',
      messages: [
        { id: 'msg-1', content: 'Hello', timestamp: new Date() },
        { id: 'msg-2', content: 'How can I help?', timestamp: new Date() }
      ],
      updatedAt: new Date(),
      agentType: 'risk_analyzer'
    },
    {
      id: 'conv-2',
      title: 'Control Design Session',
      messages: [
        { id: 'msg-3', content: 'Design controls', timestamp: new Date() }
      ],
      updatedAt: new Date(),
      agentType: 'control_advisor'
    }
  ];

  const analyzeRisk = async (risk: Risk) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        riskId: risk.id,
        riskLevel: risk.riskScore > 15 ? 'high' : risk.riskScore > 8 ? 'medium' : 'low',
        category: risk.category,
        description: `Analysis of ${risk.title}`,
        keyFindings: [`Risk score: ${risk.riskScore}`, `Category: ${risk.category}`],
        confidence: 0.8,
        lastUpdated: new Date(),
        metadata: {}
      };
    } finally {
      setIsLoading(false);
    }
  };

  const recommendControls = async (risk: Risk) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return [{
        id: `control-rec-${risk.id}`,
        riskId: risk.id,
        title: `Control for ${risk.title}`,
        description: 'Recommended control measure',
        priority: 'high',
        confidence: 0.8
      }];
    } finally {
      setIsLoading(false);
    }
  };

  const generateContent = async (request: any) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        id: `content-${Date.now()}`,
        content: `Generated content for ${request.type || 'request'}`,
        timestamp: new Date()
      };
    } finally {
      setIsLoading(false);
    }
  };

  const explainContent = async (request: any) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        summary: `Explanation for: ${request.content?.substring(0, 100) || 'content'}...`,
        complexity: 'simple',
        confidence: 0.8,
        timestamp: new Date()
      };
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (content: string, attachments?: any) => {
    console.log('Sending message:', content, attachments);
    // Mock implementation - would integrate with actual chat service
  };

  const switchAgent = (agentType: string) => {
    setSelectedAgent(agentType);
    console.log('Switched to agent:', agentType);
  };

  const startConversation = (agentType: string, context?: any) => {
    const newConversation = {
      id: `conv-${Date.now()}`,
      title: `New ${agentType} conversation`,
      messages: [],
      agentType,
      context,
      createdAt: new Date()
    };
    setCurrentConversation(newConversation);
    setSelectedAgent(agentType);
  };

  const toggleARIA = () => {
    console.log('Toggle ARIA widget');
    // Mock implementation - would toggle widget visibility
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
    error: null,
    toggleARIA
  };

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
}; 