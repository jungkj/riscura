import { Document, Risk, Control, RiskCategory } from '@/types';
import { generateId } from './utils';
import { toast } from 'sonner';

// Mock keywords for different risk categories
const riskKeywords = {
  operational: [
    'process', 'procedure', 'workflow', 'operation', 'staff', 'employee', 'training',
    'quality', 'production', 'service', 'delivery', 'customer', 'supplier', 'vendor'
  ],
  financial: [
    'budget', 'cost', 'revenue', 'profit', 'loss', 'cash', 'credit', 'debt', 'investment',
    'financial', 'accounting', 'audit', 'payment', 'invoice', 'expense', 'income'
  ],
  strategic: [
    'strategy', 'strategic', 'market', 'competition', 'competitive', 'growth', 'expansion',
    'merger', 'acquisition', 'partnership', 'innovation', 'technology', 'digital', 'transformation'
  ],
  compliance: [
    'regulation', 'regulatory', 'compliance', 'legal', 'law', 'policy', 'standard',
    'requirement', 'audit', 'inspection', 'certification', 'license', 'permit', 'gdpr', 'sox'
  ],
  technology: [
    'system', 'software', 'hardware', 'network', 'security', 'cyber', 'data', 'database',
    'server', 'cloud', 'infrastructure', 'application', 'platform', 'digital', 'it'
  ]
};

// Mock risk templates based on categories
const riskTemplates = {
  operational: [
    {
      title: 'Process Inefficiency Risk',
      description: 'Risk of operational inefficiencies due to outdated or poorly defined processes',
      likelihood: 3,
      impact: 3
    },
    {
      title: 'Staff Training Gap Risk',
      description: 'Risk of inadequate staff training leading to operational errors',
      likelihood: 2,
      impact: 3
    },
    {
      title: 'Supplier Dependency Risk',
      description: 'Risk of over-reliance on key suppliers affecting service delivery',
      likelihood: 3,
      impact: 4
    }
  ],
  financial: [
    {
      title: 'Budget Overrun Risk',
      description: 'Risk of exceeding allocated budgets due to poor cost control',
      likelihood: 3,
      impact: 4
    },
    {
      title: 'Credit Risk Exposure',
      description: 'Risk of customer defaults affecting cash flow and profitability',
      likelihood: 2,
      impact: 4
    },
    {
      title: 'Investment Loss Risk',
      description: 'Risk of financial losses from poor investment decisions',
      likelihood: 2,
      impact: 5
    }
  ],
  strategic: [
    {
      title: 'Market Competition Risk',
      description: 'Risk of losing market share to competitors with superior offerings',
      likelihood: 4,
      impact: 3
    },
    {
      title: 'Strategic Misalignment Risk',
      description: 'Risk of strategic initiatives not aligning with market demands',
      likelihood: 2,
      impact: 4
    },
    {
      title: 'Innovation Gap Risk',
      description: 'Risk of falling behind in technological innovation and digital transformation',
      likelihood: 3,
      impact: 4
    }
  ],
  compliance: [
    {
      title: 'Regulatory Violation Risk',
      description: 'Risk of non-compliance with industry regulations leading to penalties',
      likelihood: 2,
      impact: 5
    },
    {
      title: 'Policy Adherence Risk',
      description: 'Risk of employees not following established policies and procedures',
      likelihood: 3,
      impact: 3
    },
    {
      title: 'Audit Finding Risk',
      description: 'Risk of significant findings during regulatory or internal audits',
      likelihood: 2,
      impact: 4
    }
  ],
  technology: [
    {
      title: 'Cybersecurity Breach Risk',
      description: 'Risk of unauthorized access to systems and data through cyber attacks',
      likelihood: 3,
      impact: 5
    },
    {
      title: 'System Failure Risk',
      description: 'Risk of critical system failures disrupting business operations',
      likelihood: 2,
      impact: 4
    },
    {
      title: 'Data Loss Risk',
      description: 'Risk of losing critical business data due to system failures or attacks',
      likelihood: 2,
      impact: 5
    }
  ]
};

// Mock control templates
const controlTemplates = [
  {
    title: 'Regular Process Review',
    description: 'Implement regular reviews of operational processes to identify inefficiencies',
    type: 'detective' as const,
    effectiveness: 'medium' as const
  },
  {
    title: 'Staff Training Program',
    description: 'Establish comprehensive training programs for all staff members',
    type: 'preventive' as const,
    effectiveness: 'high' as const
  },
  {
    title: 'Supplier Diversification',
    description: 'Maintain multiple suppliers to reduce dependency risks',
    type: 'preventive' as const,
    effectiveness: 'high' as const
  },
  {
    title: 'Budget Monitoring System',
    description: 'Implement real-time budget monitoring and reporting systems',
    type: 'detective' as const,
    effectiveness: 'high' as const
  },
  {
    title: 'Credit Assessment Procedures',
    description: 'Establish robust credit assessment and monitoring procedures',
    type: 'preventive' as const,
    effectiveness: 'high' as const
  },
  {
    title: 'Investment Committee Review',
    description: 'Require investment committee approval for significant investments',
    type: 'preventive' as const,
    effectiveness: 'medium' as const
  },
  {
    title: 'Market Intelligence System',
    description: 'Implement market monitoring and competitive intelligence systems',
    type: 'detective' as const,
    effectiveness: 'medium' as const
  },
  {
    title: 'Compliance Monitoring Program',
    description: 'Establish ongoing compliance monitoring and reporting programs',
    type: 'detective' as const,
    effectiveness: 'high' as const
  },
  {
    title: 'Security Awareness Training',
    description: 'Provide regular cybersecurity awareness training for all employees',
    type: 'preventive' as const,
    effectiveness: 'medium' as const
  },
  {
    title: 'Data Backup Procedures',
    description: 'Implement automated data backup and recovery procedures',
    type: 'corrective' as const,
    effectiveness: 'high' as const
  }
];

// Simulate text extraction from different file types
const simulateTextExtraction = (document: Document): string => {
  const fileType = document.type;
  
  // Mock extracted text based on file type
  if (fileType.includes('pdf')) {
    return `
      Risk Management Policy Document
      
      This document outlines the organization's approach to risk management.
      Key areas covered include operational processes, financial controls,
      strategic planning, compliance requirements, and technology security.
      
      The organization must maintain adequate controls to mitigate identified risks
      and ensure compliance with all applicable regulations. Regular audits and
      assessments are required to validate the effectiveness of risk controls.
      
      Staff training and awareness programs are essential for maintaining
      a strong risk management culture throughout the organization.
    `;
  }
  
  if (fileType.includes('word') || fileType.includes('document')) {
    return `
      Operational Procedures Manual
      
      This manual describes the standard operating procedures for key business processes.
      It includes guidelines for quality control, customer service delivery,
      supplier management, and staff training requirements.
      
      All employees must follow these procedures to ensure consistent service quality
      and minimize operational risks. Regular process reviews and updates are required
      to maintain effectiveness and compliance with industry standards.
    `;
  }
  
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
    return `
      Financial Risk Assessment Spreadsheet
      
      This spreadsheet contains financial data and risk calculations including:
      - Budget vs actual analysis
      - Credit risk exposures
      - Investment portfolio performance
      - Cash flow projections
      - Regulatory capital requirements
      
      Regular monitoring and reporting of these metrics is essential for
      maintaining financial stability and regulatory compliance.
    `;
  }
  
  // Default text for other file types
  return `
    Business Document Analysis
    
    This document contains information relevant to business operations,
    risk management, and compliance requirements. Key areas of focus include
    process improvement, quality control, regulatory compliance, and
    technology security measures.
  `;
};

// Analyze text content and identify relevant risks
const analyzeTextContent = (text: string): {
  identifiedRisks: Array<{
    text: string;
    confidence: number;
    category: RiskCategory;
  }>;
  suggestedControls: Array<{
    title: string;
    description: string;
    confidence: number;
  }>;
  documentSummary: string;
} => {
  const lowerText = text.toLowerCase();
  const identifiedRisks: Array<{
    text: string;
    confidence: number;
    category: RiskCategory;
  }> = [];
  const suggestedControls: Array<{
    title: string;
    description: string;
    confidence: number;
  }> = [];
  
  // Analyze text for risk keywords and generate relevant risks
  Object.entries(riskKeywords).forEach(([category, keywords]) => {
    const matchedKeywords = keywords.filter(keyword => lowerText.includes(keyword));
    
    if (matchedKeywords.length > 0) {
      const categoryTemplates = riskTemplates[category as RiskCategory];
      const selectedTemplate = categoryTemplates[Math.floor(Math.random() * categoryTemplates.length)];
      
      // Calculate confidence based on keyword matches
      const confidence = Math.min(0.95, 0.6 + (matchedKeywords.length * 0.1));
      
      identifiedRisks.push({
        text: selectedTemplate.description,
        confidence,
        category: category as RiskCategory
      });
    }
  });
  
  // Generate suggested controls based on identified risks
  const numControls = Math.min(identifiedRisks.length + 1, 3);
  for (let i = 0; i < numControls; i++) {
    const template = controlTemplates[Math.floor(Math.random() * controlTemplates.length)];
    const confidence = 0.7 + Math.random() * 0.2; // 70-90% confidence
    
    suggestedControls.push({
      title: template.title,
      description: template.description,
      confidence
    });
  }
  
  // Generate document summary
  const documentSummary = `
    This document contains ${identifiedRisks.length} potential risk areas across 
    ${new Set(identifiedRisks.map((r: { category: RiskCategory }) => r.category)).size} categories. 
    Key themes include ${identifiedRisks.slice(0, 3).map((r: { category: RiskCategory }) => r.category).join(', ')}.
    The analysis suggests implementing ${suggestedControls.length} control measures
    to mitigate the identified risks.
  `.trim();
  
  return {
    identifiedRisks,
    suggestedControls,
    documentSummary
  };
};

// Main AI analysis function
export const mockAIAnalysis = async (document: Document): Promise<AIAnalysisResponse> => {
  const jobId = generateId('ai-job');
  const startTime = Date.now();
  
  // Simulate realistic processing delay (2-5 seconds)
  const processingDelay = 2000 + Math.random() * 3000;
  await new Promise(resolve => setTimeout(resolve, processingDelay));
  
  try {
    // Simulate text extraction
    const extractedText = simulateTextExtraction(document);
    
    // Analyze content
    const analysis = analyzeTextContent(extractedText);
    
    const processingTime = Date.now() - startTime;
    
    return {
      jobId,
      status: 'completed',
      results: analysis,
      processingTime
    };
  } catch {
    return {
      jobId,
      status: 'failed',
      processingTime: Date.now() - startTime
    };
  }
};

// Function to convert AI analysis results to Risk objects
export const convertAIRisksToRiskObjects = (
  aiRisks: Array<{
    text: string;
    confidence: number;
    category: RiskCategory;
  }>,
  _documentId: string,
  owner: string = 'AI Analysis'
): Omit<Risk, 'id' | 'createdAt' | 'updatedAt' | 'riskScore'>[] => {
  return aiRisks.map((aiRisk: {
    text: string;
    confidence: number;
    category: RiskCategory;
  }, index: number) => ({
    title: `AI Identified Risk ${index + 1}`,
    description: aiRisk.text,
    category: aiRisk.category,
    likelihood: Math.ceil(aiRisk.confidence * 5), // Convert confidence to 1-5 scale
    impact: 3, // Default impact, can be adjusted by user
    owner,
    status: 'identified' as const,
    controls: [],
    evidence: [], // Empty array, document reference can be added separately
    aiConfidence: aiRisk.confidence
  }));
};

// Function to convert AI controls to Control objects
export const convertAIControlsToControlObjects = (
  aiControls: Array<{
    title: string;
    description: string;
    confidence: number;
  }>,
  owner: string = 'AI Analysis'
): Omit<Control, 'id' | 'createdAt' | 'updatedAt'>[] => {
  return aiControls.map((aiControl: {
    title: string;
    description: string;
    confidence: number;
  }) => ({
    title: aiControl.title,
    description: aiControl.description,
    type: 'preventive' as const, // Default type, can be adjusted
    effectiveness: aiControl.confidence > 0.8 ? 'high' as const : 
                  aiControl.confidence > 0.6 ? 'medium' as const : 'low' as const,
    owner,
    frequency: 'Monthly', // Default frequency
    evidence: [],
    linkedRisks: [],
    status: 'planned' as const
  }));
};

// Batch analysis for multiple documents
export const batchAIAnalysis = async (documents: Document[]): Promise<AIAnalysisResponse[]> => {
  const results: AIAnalysisResponse[] = [];
  
  // Process documents sequentially to simulate realistic processing
  for (const document of documents) {
    const result = await mockAIAnalysis(document);
    results.push(result);
  }
  
  return results;
};

// Real AI Integration Service - replacing mock AI functionality

// AI API Configuration
const AI_API_BASE = '/api/ai';

// Generic AI API request function
async function aiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${AI_API_BASE}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'AI service unavailable' }));
      throw new Error(errorData.error || `AI API Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error(`AI API request failed for ${endpoint}:`, error);
    toast.error(`AI service error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

// ============================================================================
// AI AGENT TYPES
// ============================================================================

export interface AIAgent {
  id: string;
  name: string;
  description: string;
  type: 'RISK_ANALYST' | 'COMPLIANCE_EXPERT' | 'CONTROL_AUDITOR' | 'POLICY_REVIEWER' | 'GENERAL_ASSISTANT';
  capabilities: string[];
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  isActive: boolean;
}

export interface AIAnalysisRequest {
  type: 'RISK_ANALYSIS' | 'CONTROL_GAP' | 'COMPLIANCE_CHECK' | 'POLICY_REVIEW' | 'THREAT_ASSESSMENT';
  context: any;
  data?: any;
  options?: {
    depth?: 'QUICK' | 'DETAILED' | 'COMPREHENSIVE';
    format?: 'TEXT' | 'STRUCTURED' | 'REPORT';
    includeRecommendations?: boolean;
  };
}

export interface AIAnalysisResponse {
  id: string;
  type: string;
  analysis: string;
  confidence: number;
  recommendations?: Array<{
    title: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    effort: 'LOW' | 'MEDIUM' | 'HIGH';
    impact: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
  insights?: Array<{
    category: string;
    finding: string;
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
  }>;
  metadata: {
    processingTime: number;
    tokensUsed: number;
    model: string;
    timestamp: string;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    type?: string;
    confidence?: number;
    sources?: string[];
  };
}

export interface ChatSession {
  id: string;
  title: string;
  agentId: string;
  messages: ChatMessage[];
  context?: any;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// AI RISK ANALYSIS SERVICE
// ============================================================================

export const aiRiskAnalysis = {
  // Analyze risk scenario
  async analyzeRisk(riskData: {
    title: string;
    description: string;
    category?: string;
    context?: any;
  }): Promise<AIAnalysisResponse> {
    return aiRequest<AIAnalysisResponse>('/analysis/risk', {
      method: 'POST',
      body: JSON.stringify({
        type: 'RISK_ANALYSIS',
        context: riskData,
        options: {
          depth: 'DETAILED',
          format: 'STRUCTURED',
          includeRecommendations: true,
        },
      }),
    });
  },

  // Generate risk assessment questions
  async generateRiskQuestions(riskCategory: string, context?: any): Promise<{
    questions: Array<{
      id: string;
      question: string;
      type: 'TEXT' | 'MULTIPLE_CHOICE' | 'SCALE' | 'YES_NO';
      options?: string[];
      required: boolean;
      category: string;
    }>;
  }> {
    return aiRequest('/generation/risk-questions', {
      method: 'POST',
      body: JSON.stringify({
        category: riskCategory,
        context,
      }),
    });
  },

  // Assess risk likelihood and impact
  async assessRiskScoring(riskData: any): Promise<{
    likelihood: number;
    impact: number;
    riskScore: number;
    justification: string;
    factors: Array<{
      factor: string;
      weight: number;
      rationale: string;
    }>;
  }> {
    return aiRequest('/analysis/risk-scoring', {
      method: 'POST',
      body: JSON.stringify(riskData),
    });
  },

  // Identify risk dependencies
  async identifyRiskDependencies(riskId: string, organizationRisks: any[]): Promise<{
    dependencies: Array<{
      riskId: string;
      relationship: 'CAUSES' | 'AMPLIFIES' | 'MITIGATES' | 'CORRELATES';
      strength: number;
      explanation: string;
    }>;
    clusters: Array<{
      name: string;
      risks: string[];
      commonFactors: string[];
    }>;
  }> {
    return aiRequest('/analysis/risk-dependencies', {
      method: 'POST',
      body: JSON.stringify({
        targetRiskId: riskId,
        organizationRisks,
      }),
    });
  },
};

// ============================================================================
// AI CONTROL ANALYSIS SERVICE
// ============================================================================

export const aiControlAnalysis = {
  // Analyze control effectiveness
  async analyzeControlEffectiveness(controlData: {
    id: string;
    title: string;
    description: string;
    type: string;
    implementationDetails?: any;
    testResults?: any[];
  }): Promise<AIAnalysisResponse> {
    return aiRequest<AIAnalysisResponse>('/analysis/control', {
      method: 'POST',
      body: JSON.stringify({
        type: 'CONTROL_GAP',
        context: controlData,
        options: {
          depth: 'COMPREHENSIVE',
          format: 'STRUCTURED',
          includeRecommendations: true,
        },
      }),
    });
  },

  // Suggest control improvements
  async suggestControlImprovements(controlId: string, performanceData: any): Promise<{
    improvements: Array<{
      area: string;
      current: string;
      recommended: string;
      rationale: string;
      priority: 'LOW' | 'MEDIUM' | 'HIGH';
      effort: 'LOW' | 'MEDIUM' | 'HIGH';
      impact: 'LOW' | 'MEDIUM' | 'HIGH';
    }>;
    alternativeControls: Array<{
      title: string;
      description: string;
      advantages: string[];
      considerations: string[];
    }>;
  }> {
    return aiRequest('/analysis/control-improvements', {
      method: 'POST',
      body: JSON.stringify({
        controlId,
        performanceData,
      }),
    });
  },

  // Generate control testing procedures
  async generateTestingProcedures(controlData: any): Promise<{
    procedures: Array<{
      step: number;
      description: string;
      expectedOutcome: string;
      evidenceRequired: string[];
      frequency: string;
    }>;
    sampleSize: number;
    testingApproach: string;
    successCriteria: string[];
  }> {
    return aiRequest('/generation/testing-procedures', {
      method: 'POST',
      body: JSON.stringify(controlData),
    });
  },
};

// ============================================================================
// AI COMPLIANCE ANALYSIS SERVICE
// ============================================================================

export const aiComplianceAnalysis = {
  // Analyze compliance gaps
  async analyzeComplianceGaps(framework: string, currentState: any): Promise<AIAnalysisResponse> {
    return aiRequest<AIAnalysisResponse>('/analysis/compliance', {
      method: 'POST',
      body: JSON.stringify({
        type: 'COMPLIANCE_CHECK',
        context: {
          framework,
          currentState,
        },
        options: {
          depth: 'COMPREHENSIVE',
          format: 'REPORT',
          includeRecommendations: true,
        },
      }),
    });
  },

  // Map controls to compliance requirements
  async mapControlsToRequirements(framework: string, controls: any[]): Promise<{
    mappings: Array<{
      requirementId: string;
      requirementText: string;
      mappedControls: Array<{
        controlId: string;
        controlTitle: string;
        coverage: 'FULL' | 'PARTIAL' | 'MINIMAL';
        gaps: string[];
      }>;
      overallCoverage: number;
      recommendations: string[];
    }>;
    summary: {
      totalRequirements: number;
      fullyCovered: number;
      partiallyCovered: number;
      notCovered: number;
      overallComplianceScore: number;
    };
  }> {
    return aiRequest('/analysis/compliance-mapping', {
      method: 'POST',
      body: JSON.stringify({
        framework,
        controls,
      }),
    });
  },
};

// ============================================================================
// AI DOCUMENT ANALYSIS SERVICE
// ============================================================================

export const aiDocumentAnalysis = {
  // Analyze policy document
  async analyzePolicyDocument(documentContent: string, documentType: string): Promise<AIAnalysisResponse> {
    return aiRequest<AIAnalysisResponse>('/analysis/document', {
      method: 'POST',
      body: JSON.stringify({
        type: 'POLICY_REVIEW',
        context: {
          content: documentContent,
          documentType,
        },
        options: {
          depth: 'DETAILED',
          format: 'STRUCTURED',
          includeRecommendations: true,
        },
      }),
    });
  },

  // Extract key information from documents
  async extractDocumentMetadata(documentContent: string): Promise<{
    title: string;
    summary: string;
    keyPoints: string[];
    entities: Array<{
      type: 'PERSON' | 'ORGANIZATION' | 'PROCESS' | 'SYSTEM' | 'REQUIREMENT';
      name: string;
      context: string;
    }>;
    risks: Array<{
      description: string;
      category: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH';
    }>;
    controls: Array<{
      description: string;
      type: string;
      effectiveness: string;
    }>;
    tags: string[];
  }> {
    return aiRequest('/analysis/document-extraction', {
      method: 'POST',
      body: JSON.stringify({
        content: documentContent,
      }),
    });
  },
};

// ============================================================================
// AI CHAT SERVICE
// ============================================================================

export const aiChatService = {
  // Start new chat session
  async startChatSession(agentId: string, initialContext?: any): Promise<ChatSession> {
    return aiRequest<ChatSession>('/chat/sessions', {
      method: 'POST',
      body: JSON.stringify({
        agentId,
        context: initialContext,
      }),
    });
  },

  // Send message to chat session
  async sendMessage(sessionId: string, message: string, context?: any): Promise<{
    response: ChatMessage;
    session: ChatSession;
  }> {
    return aiRequest('/chat/message', {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        message,
        context,
      }),
    });
  },

  // Get chat sessions
  async getChatSessions(limit: number = 20): Promise<ChatSession[]> {
    return aiRequest<ChatSession[]>(`/chat/sessions?limit=${limit}`);
  },

  // Delete chat session
  async deleteChatSession(sessionId: string): Promise<{ success: boolean }> {
    return aiRequest(`/chat/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// AI INSIGHT GENERATION SERVICE
// ============================================================================

export const aiInsightService = {
  // Generate dashboard insights
  async generateDashboardInsights(dashboardData: any): Promise<{
    insights: Array<{
      type: 'TREND' | 'ANOMALY' | 'OPPORTUNITY' | 'RISK' | 'ACHIEVEMENT';
      title: string;
      description: string;
      severity: 'INFO' | 'WARNING' | 'CRITICAL';
      confidence: number;
      actionable: boolean;
      recommendations?: string[];
    }>;
    summary: string;
    keyMetrics: Array<{
      metric: string;
      value: string;
      trend: 'UP' | 'DOWN' | 'STABLE';
      significance: string;
    }>;
  }> {
    return aiRequest('/insights/dashboard', {
      method: 'POST',
      body: JSON.stringify(dashboardData),
    });
  },

  // Generate predictive insights
  async generatePredictiveInsights(historicalData: any, predictionPeriod: string): Promise<{
    predictions: Array<{
      metric: string;
      currentValue: number;
      predictedValue: number;
      confidence: number;
      factors: string[];
      timeline: string;
    }>;
    scenarios: Array<{
      name: string;
      description: string;
      probability: number;
      impact: 'LOW' | 'MEDIUM' | 'HIGH';
      recommendations: string[];
    }>;
  }> {
    return aiRequest('/insights/predictive', {
      method: 'POST',
      body: JSON.stringify({
        data: historicalData,
        period: predictionPeriod,
      }),
    });
  },
};

// ============================================================================
// AI AGENT MANAGEMENT
// ============================================================================

export const aiAgentService = {
  // Get available AI agents
  async getAvailableAgents(): Promise<AIAgent[]> {
    return aiRequest<AIAgent[]>('/agents');
  },

  // Get specific agent
  async getAgent(agentId: string): Promise<AIAgent> {
    return aiRequest<AIAgent>(`/agents/${agentId}`);
  },

  // Update agent configuration
  async updateAgent(agentId: string, updates: Partial<AIAgent>): Promise<AIAgent> {
    return aiRequest<AIAgent>(`/agents/${agentId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
};

// ============================================================================
// AI USAGE TRACKING
// ============================================================================

export const aiUsageService = {
  // Get usage statistics
  async getUsageStats(period: string = '30d'): Promise<{
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    breakdown: Array<{
      service: string;
      requests: number;
      tokens: number;
      cost: number;
    }>;
    trends: Array<{
      date: string;
      requests: number;
      tokens: number;
      cost: number;
    }>;
  }> {
    return aiRequest(`/usage/stats?period=${period}`);
  },

  // Get current usage limits
  async getUsageLimits(): Promise<{
    monthly: {
      requests: { used: number; limit: number };
      tokens: { used: number; limit: number };
      cost: { used: number; limit: number };
    };
    daily: {
      requests: { used: number; limit: number };
      tokens: { used: number; limit: number };
    };
  }> {
    return aiRequest('/usage/limits');
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Check if AI features are enabled
export function isAIEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_AI_FEATURES === 'true';
}

// Handle AI API errors gracefully
export function handleAIError(error: unknown, fallbackMessage: string = 'AI service temporarily unavailable'): string {
  if (!isAIEnabled()) {
    return 'AI features are currently disabled';
  }
  
  if (error instanceof Error) {
    // Don't expose internal AI errors to users
    if (error.message.includes('API key') || error.message.includes('quota')) {
      return 'AI service temporarily unavailable due to usage limits';
    }
    return error.message;
  }
  
  return fallbackMessage;
}

// Format AI response for display
export function formatAIResponse(response: any): string {
  if (typeof response === 'string') {
    return response;
  }
  
  if (response?.analysis) {
    return response.analysis;
  }
  
  if (response?.content) {
    return response.content;
  }
  
  return JSON.stringify(response, null, 2);
}

// Calculate confidence score display
export function formatConfidenceScore(confidence: number): string {
  if (confidence >= 0.9) return 'Very High';
  if (confidence >= 0.7) return 'High';
  if (confidence >= 0.5) return 'Medium';
  if (confidence >= 0.3) return 'Low';
  return 'Very Low';
}

// ============================================================================
// MAIN AI SERVICE EXPORT
// ============================================================================

export const aiService = {
  // Core analysis services
  risk: aiRiskAnalysis,
  control: aiControlAnalysis,
  compliance: aiComplianceAnalysis,
  document: aiDocumentAnalysis,
  
  // Interactive services
  chat: aiChatService,
  insights: aiInsightService,
  
  // Management services
  agents: aiAgentService,
  usage: aiUsageService,
  
  // Utility functions
  isEnabled: isAIEnabled,
  handleError: handleAIError,
  formatResponse: formatAIResponse,
  formatConfidence: formatConfidenceScore,
};

// Default export
export default aiService; 