import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Risk } from '@/types';

interface AIContextType {
  analyzeRisk: (risk: Risk) => Promise<any>;
  recommendControls: (risk: Risk) => Promise<any>;
  generateContent: (request: any) => Promise<any>;
  explainContent: (request: any) => Promise<any>;
  isLoading: boolean;
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

  const value: AIContextType = {
    analyzeRisk,
    recommendControls,
    generateContent,
    explainContent,
    isLoading
  };

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
}; 