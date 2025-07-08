import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/db';
import { 
  AIResponse, 
  TokenUsage, 
  AIRequest, 
  AgentType,
  ConversationMessage,
  MessageAttachment
} from '@/types/ai.types';
import type { 
  RiskAnalysis as ImportedRiskAnalysis,
  ControlRecommendation as ImportedControlRecommendation
} from '@/types/ai.types';
import { Risk } from '@/types';
import { generateId } from '@/lib/utils';
import { RISCURA_MASTER_PROMPT, AGENT_MODIFIERS, buildContextualPrompt } from '@/config/master-prompt';

// Enhanced interfaces for proper typing
interface ContentGenerationRequest {
  type: string;
  context?: Record<string, unknown>;
  requirements?: string;
  userId?: string;
  organizationId?: string;
}

interface ContentGenerationResult {
  id: string;
  content: string;
  timestamp: Date;
  usage: TokenUsage;
  confidence: number;
}

interface ExplanationRequest {
  content: string;
  complexity?: 'simple' | 'detailed' | 'expert';
}

interface ExplanationResult {
  summary: string;
  complexity: 'simple' | 'detailed' | 'expert';
  confidence: number;
  timestamp: Date;
  usage: TokenUsage;
}

interface CacheEntry {
  response: AIResponse;
  timestamp: number;
  ttl: number;
}

// Configuration interfaces
export interface AIConfig {
  apiKey: string;
  baseURL?: string;
  organization?: string;
  defaultModel: string;
  maxTokens: number;
  temperature: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  timeout: number;
  maxRetries: number;
  rateLimitRpm: number;
  rateLimitTpm: number;
}

export interface ModelConfig {
  name: string;
  maxTokens: number;
  inputCostPer1k: number;
  outputCostPer1k: number;
  supportsStreaming: boolean;
  contextWindow: number;
}

// Rate limiting and usage tracking
interface RateLimitState {
  requestsPerMinute: number;
  tokensPerMinute: number;
  requestTimestamps: number[];
  tokenUsage: { timestamp: number; tokens: number }[];
  isLimited: boolean;
  resetTime: Date;
}

interface UsageMetrics {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  successRate: number;
  averageResponseTime: number;
  requestsThisHour: number;
  tokensThisHour: number;
  costThisHour: number;
}

// Error types
export class AIServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public retryable: boolean = false,
    public severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    public userMessage?: string
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

export class RateLimitError extends AIServiceError {
  constructor(message: string, resetTime: Date) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, true, 'medium', 'Rate limit reached. Please wait a moment before trying again.');
    this.resetTime = resetTime;
  }
  resetTime: Date;
}

export class NetworkError extends AIServiceError {
  constructor(message: string) {
    super(message, 'NETWORK_ERROR', 0, true, 'medium', 'Connection issue detected. Retrying automatically...');
  }
}

// Connection status enum
export enum ConnectionStatus {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  RECONNECTING = 'RECONNECTING',
  DEGRADED = 'DEGRADED'
}

// Circuit breaker states
enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

class CircuitBreaker {
  private state = CircuitState.CLOSED;
  private failures = 0;
  private nextAttempt = 0;
  
  constructor(
    private failureThreshold = 5,
    private timeout = 60000,
    private monitoringPeriod = 10000
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new AIServiceError(
          'Circuit breaker is OPEN. Service temporarily unavailable.',
          'CIRCUIT_BREAKER_OPEN',
          503,
          true
        );
      }
      this.state = CircuitState.HALF_OPEN;
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = CircuitState.CLOSED;
  }

  private onFailure() {
    this.failures++;
    if (this.failures >= this.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttempt = Date.now() + this.timeout;
    }
  }

  getState() {
    return this.state;
  }
}

export interface LocalRiskAnalysis {
  riskScore: number;
  confidenceLevel: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  analysis: {
    likelihood: number;
    impact: number;
    factors: string[];
    recommendations: string[];
    mitigationStrategies: string[];
  };
  historicalComparison: {
    similarRisks: Array<{
      id: string;
      title: string;
      similarity: number;
      outcome: string;
    }>;
    trendAnalysis: string;
  };
  complianceImpact: {
    frameworks: string[];
    requirements: string[];
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
  };
}

export interface ControlRecommendation {
  id: string;
  title: string;
  description: string;
  type: 'PREVENTIVE' | 'DETECTIVE' | 'CORRECTIVE';
  category: string;
  priority: number;
  implementationComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
  estimatedCost: string;
  effectiveness: number;
  reasoning: string;
  dependencies: string[];
  metrics: string[];
}

export interface ComplianceGap {
  framework: string;
  requirement: string;
  currentStatus: string;
  gapDescription: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendedActions: string[];
  timeline: string;
  resources: string[];
}

export interface AIInsight {
  type: 'RISK_TREND' | 'CONTROL_EFFECTIVENESS' | 'COMPLIANCE_STATUS' | 'RECOMMENDATION';
  title: string;
  description: string;
  confidence: number;
  data: any;
  actionable: boolean;
  priority: number;
}

export interface ChatResponse {
  message: string;
  type: 'text' | 'data' | 'chart' | 'recommendation';
  data?: any;
  followUpQuestions?: string[];
  actions?: Array<{
    label: string;
    action: string;
    parameters?: any;
  }>;
}

export class AIService {
  private _openai: OpenAI | null = null;
  private _anthropic: Anthropic | null = null;
  private conversationHistory: Map<string, Array<{ role: string; content: string }>> = new Map();
  private config: AIConfig;
  private modelConfigs: Map<string, ModelConfig>;
  private rateLimitState: RateLimitState;
  private usageMetrics: UsageMetrics;
  private circuitBreaker: CircuitBreaker;
  private cache: Map<string, CacheEntry>;

  /**
   * Lazy initialization getter for OpenAI client
   * Only creates the client when it's actually needed
   */
  private get openai(): OpenAI {
    if (!this._openai) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new AIServiceError(
          'OpenAI API key not configured',
          'MISSING_API_KEY',
          500,
          false,
          'critical',
          'AI service is not properly configured'
        );
      }
      this._openai = new OpenAI({
        apiKey,
        organization: this.config.organization || undefined,
        baseURL: this.config.baseURL || undefined,
        timeout: this.config.timeout,
        maxRetries: this.config.maxRetries
      });
    }
    return this._openai;
  }

  /**
   * Lazy initialization getter for Anthropic client
   * Only creates the client when it's actually needed
   */
  private get anthropic(): Anthropic {
    if (!this._anthropic) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new AIServiceError(
          'Anthropic API key not configured',
          'MISSING_API_KEY',
          500,
          false,
          'critical',
          'AI service is not properly configured'
        );
      }
      this._anthropic = new Anthropic({
        apiKey,
        baseURL: this.config.baseURL || undefined,
        timeout: this.config.timeout,
        maxRetries: this.config.maxRetries
      });
    }
    return this._anthropic;
  }

  constructor(config: Partial<AIConfig> = {}) {
    this.config = {
      apiKey: '',
      baseURL: '/api/ai/proxy',
      organization: '',
      defaultModel: 'gpt-4o-mini',
      maxTokens: 4000,
      temperature: 0.7,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
      timeout: 60000,
      maxRetries: 3,
      rateLimitRpm: 50,
      rateLimitTpm: 100000,
      ...config
    };

    // Initialize configuration and model configs
    // AI clients will be initialized lazily when first used to prevent build-time errors

    this.modelConfigs = new Map([
      ['gpt-4o', {
        name: 'gpt-4o',
        maxTokens: 4096,
        inputCostPer1k: 0.005,
        outputCostPer1k: 0.015,
        supportsStreaming: true,
        contextWindow: 128000
      }],
      ['gpt-4o-mini', {
        name: 'gpt-4o-mini',
        maxTokens: 4096,
        inputCostPer1k: 0.00015,
        outputCostPer1k: 0.0006,
        supportsStreaming: true,
        contextWindow: 128000
      }],
      ['gpt-4-turbo', {
        name: 'gpt-4-turbo',
        maxTokens: 4096,
        inputCostPer1k: 0.01,
        outputCostPer1k: 0.03,
        supportsStreaming: true,
        contextWindow: 128000
      }],
      ['gpt-3.5-turbo', {
        name: 'gpt-3.5-turbo',
        maxTokens: 4096,
        inputCostPer1k: 0.0015,
        outputCostPer1k: 0.002,
        supportsStreaming: true,
        contextWindow: 16385
      }]
    ]);

    this.rateLimitState = {
      requestsPerMinute: 0,
      tokensPerMinute: 0,
      requestTimestamps: [],
      tokenUsage: [],
      isLimited: false,
      resetTime: new Date()
    };

    this.usageMetrics = {
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      successRate: 1,
      averageResponseTime: 0,
      requestsThisHour: 0,
      tokensThisHour: 0,
      costThisHour: 0
    };

    this.circuitBreaker = new CircuitBreaker(5, 60000, 10000);

    this.cache = new Map();

    this.startCleanupIntervals();
  }

  /**
   * Analyze a risk using AI to provide intelligent scoring and recommendations
   */
  async analyzeRisk(riskData: any, organizationId: string): Promise<ImportedRiskAnalysis> {
    try {
      // Get historical risk data for context
      const historicalRisks = await this.getHistoricalRiskData(organizationId, riskData.category);
      
      // Get organization context
      const orgContext = await this.getOrganizationContext(organizationId);

      const prompt = this.buildRiskAnalysisPrompt(riskData, historicalRisks, orgContext);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are ARIA, an expert AI risk management analyst. Analyze risks with precision, considering industry best practices, regulatory requirements, and organizational context. Provide actionable insights and quantitative assessments.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const analysis = this.parseRiskAnalysisResponse(response.choices[0].message.content || '');
      
      // Note: historicalComparison is part of LocalRiskAnalysis but not ImportedRiskAnalysis
      // For now, we'll use a cast to maintain compatibility
      const localAnalysis = analysis as any;
      localAnalysis.historicalComparison = await this.generateHistoricalComparison(riskData, historicalRisks);
      
      return analysis;
    } catch (error) {
      console.error('Risk analysis failed:', error);
      throw new Error('AI risk analysis failed');
    }
  }

  /**
   * Recommend controls for a specific risk using AI
   */
  async recommendControls(risk: any, organizationId: string): Promise<ControlRecommendation[]> {
    try {
      // Get existing controls for context
      const existingControls = await this.getExistingControls(organizationId, risk.category);
      
      // Get industry best practices
      const industryContext = await this.getIndustryContext(organizationId);

      const prompt = this.buildControlRecommendationPrompt(risk, existingControls, industryContext);

      const response = await this.anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
      });

      const recommendations = this.parseControlRecommendations(
        response.content[0].type === 'text' ? response.content[0].text : JSON.stringify(response.content[0])
      );
      
      // Rank recommendations by effectiveness and feasibility
      return this.rankControlRecommendations(recommendations, risk);
    } catch (error) {
      console.error('Control recommendation failed:', error);
      throw new Error('AI control recommendation failed');
    }
  }

  /**
   * Identify compliance gaps using AI analysis
   */
  async identifyComplianceGaps(framework: string, organizationId: string): Promise<ComplianceGap[]> {
    try {
      // Get current compliance status
      const complianceData = await this.getComplianceData(organizationId, framework);
      
      // Get framework requirements
      const frameworkRequirements = await this.getFrameworkRequirements(framework);

      const prompt = this.buildComplianceGapPrompt(complianceData, frameworkRequirements, framework);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are ARIA, a compliance expert AI. Analyze compliance status against frameworks and identify gaps with specific, actionable recommendations.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2000,
      });

      return this.parseComplianceGaps(response.choices[0].message.content || '');
    } catch (error) {
      console.error('Compliance gap analysis failed:', error);
      throw new Error('AI compliance analysis failed');
    }
  }

  /**
   * Generate AI-powered risk report with insights
   */
  async generateRiskReport(risks: any[], organizationId: string): Promise<string> {
    try {
      const riskSummary = this.summarizeRisks(risks);
      const trends = await this.analyzeRiskTrends(risks, organizationId);
      
      const prompt = `Generate a comprehensive executive risk report based on the following data:

Risk Summary: ${JSON.stringify(riskSummary)}
Trends Analysis: ${JSON.stringify(trends)}

Include:
1. Executive Summary
2. Key Risk Indicators
3. Trend Analysis
4. Priority Recommendations
5. Strategic Insights

Format as a professional report with clear sections and actionable recommendations.`;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 3000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
      });

      return response.content[0].type === 'text' ? response.content[0].text : JSON.stringify(response.content[0]);
    } catch (error) {
      console.error('Risk report generation failed:', error);
      throw new Error('AI report generation failed');
    }
  }

  /**
   * Process natural language queries about risk data
   */
  async processNaturalLanguageQuery(
    query: string, 
    userId: string, 
    organizationId: string
  ): Promise<ChatResponse> {
    try {
      // Get conversation history
      const history = this.conversationHistory.get(userId) || [];
      
      // Analyze query intent
      const intent = await this.analyzeQueryIntent(query);
      
      // Get relevant data based on intent
      const contextData = await this.getRelevantData(intent, organizationId);
      
      const prompt = this.buildChatPrompt(query, history, contextData, intent);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are ARIA, an intelligent risk management assistant. You help users understand their risk landscape, provide insights, and recommend actions. Be conversational, helpful, and data-driven. Always provide specific, actionable information when possible.`
          },
          ...history.slice(-10), // Keep last 10 messages for context
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });

      const chatResponse = this.parseChatResponse(response.choices[0].message.content || '', intent, contextData);
      
      // Update conversation history
      history.push({ role: 'user', content: query });
      history.push({ role: 'assistant', content: chatResponse.message });
      this.conversationHistory.set(userId, history);
      
      return chatResponse;
    } catch (error) {
      console.error('Natural language query failed:', error);
      return {
        message: 'I apologize, but I encountered an error processing your request. Please try rephrasing your question.',
        type: 'text'
      };
    }
  }

  /**
   * Generate AI insights for dashboard
   */
  async generateInsights(organizationId: string): Promise<AIInsight[]> {
    try {
      const [risks, controls, compliance] = await Promise.all([
        this.getOrganizationRisks(organizationId),
        this.getOrganizationControls(organizationId),
        this.getOrganizationCompliance(organizationId)
      ]);

      const insights: AIInsight[] = [];

      // Risk trend insights
      const riskTrends = await this.analyzeRiskTrends(risks, organizationId);
      if (riskTrends.significantChanges.length > 0) {
        insights.push({
          type: 'RISK_TREND',
          title: 'Risk Trend Alert',
          description: riskTrends.summary,
          confidence: riskTrends.confidence,
          data: riskTrends,
          actionable: true,
          priority: riskTrends.severity === 'HIGH' ? 1 : 2
        });
      }

      // Control effectiveness insights
      const controlInsights = await this.analyzeControlEffectiveness(controls);
      if (controlInsights.ineffectiveControls.length > 0) {
        insights.push({
          type: 'CONTROL_EFFECTIVENESS',
          title: 'Control Effectiveness Issues',
          description: `${controlInsights.ineffectiveControls.length} controls need attention`,
          confidence: 0.85,
          data: controlInsights,
          actionable: true,
          priority: 1
        });
      }

      // Compliance insights
      const complianceInsights = await this.analyzeComplianceStatus(compliance);
      if (complianceInsights.criticalGaps.length > 0) {
        insights.push({
          type: 'COMPLIANCE_STATUS',
          title: 'Critical Compliance Gaps',
          description: `${complianceInsights.criticalGaps.length} critical gaps identified`,
          confidence: 0.9,
          data: complianceInsights,
          actionable: true,
          priority: 1
        });
      }

      return insights.sort((a, b) => a.priority - b.priority);
    } catch (error) {
      console.error('Insight generation failed:', error);
      return [];
    }
  }

  /**
   * Predict future risk trends using AI
   */
  async predictRiskTrends(organizationId: string, timeframe: '30d' | '90d' | '1y'): Promise<any> {
    try {
      const historicalData = await this.getHistoricalRiskTrends(organizationId, timeframe);
      
      const prompt = `Analyze the following historical risk data and predict future trends:

${JSON.stringify(historicalData)}

Provide predictions for:
1. Risk score trends
2. Category-specific patterns
3. Potential emerging risks
4. Recommended preventive actions

Format as JSON with confidence levels and specific predictions.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a predictive analytics expert specializing in risk management. Provide data-driven predictions with confidence intervals.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Risk trend prediction failed:', error);
      throw new Error('AI trend prediction failed');
    }
  }

  // Private helper methods

  private async getHistoricalRiskData(organizationId: string, category: string) {
    if (!prisma) {
      throw new Error('Prisma client not initialized');
    }
    return await prisma.risk.findMany({
      where: {
        organizationId,
        category: category as any, // Cast to avoid enum type issues
        createdAt: {
          gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // Last year
        }
      },
      select: {
        id: true,
        title: true,
        riskScore: true,
        riskLevel: true,
        status: true,
        createdAt: true,
        description: true
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }

  private async getOrganizationContext(organizationId: string) {
    if (!prisma) {
      throw new Error('Prisma client not initialized');
    }
    return await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        name: true,
        domain: true,
        plan: true,
        settings: true
      }
    });
  }

  private async getExistingControls(organizationId: string, category: string) {
    if (!prisma) {
      throw new Error('Prisma client not initialized');
    }
    return await prisma.control.findMany({
      where: {
        organizationId,
        category: category as any // Cast to avoid enum type issues
      },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        effectivenessRating: true,
        status: true
      }
    });
  }

  private async getIndustryContext(organizationId: string) {
    if (!prisma) {
      throw new Error('Prisma client not initialized');
    }
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true, domain: true }
    });
    
    // Return industry-specific best practices
    // Note: industry field doesn't exist in organization model, using domain as fallback
    return {
      industry: org?.domain || 'unknown',
      commonRisks: [], // Would be populated from industry database
      regulations: [], // Industry-specific regulations
      bestPractices: [] // Industry best practices
    };
  }

  private buildRiskAnalysisPrompt(riskData: any, historicalRisks: any[], orgContext: any): string {
    return `Analyze the following risk for a ${orgContext?.industry} organization:

Risk Details:
${JSON.stringify(riskData)}

Historical Similar Risks:
${JSON.stringify(historicalRisks.slice(0, 5))}

Organization Context:
${JSON.stringify(orgContext)}

Provide a comprehensive analysis including:
1. Risk score (0-100) with detailed calculation
2. Likelihood and impact assessments (1-5 scale)
3. Key risk factors and drivers
4. Mitigation strategies and recommendations
5. Compliance implications
6. Comparison with historical similar risks

Format the response as structured JSON with clear sections for each analysis component.`;
  }

  private buildControlRecommendationPrompt(risk: any, existingControls: any[], industryContext: any): string {
    return `Recommend controls for the following risk:

Risk: ${JSON.stringify(risk)}

Existing Controls: ${JSON.stringify(existingControls)}

Industry Context: ${JSON.stringify(industryContext)}

Provide 3-5 control recommendations with:
1. Control title and description
2. Type (preventive/detective/corrective)
3. Implementation complexity and cost estimate
4. Effectiveness rating (1-10)
5. Dependencies and prerequisites
6. Success metrics

Format as JSON array of control recommendations.`;
  }

  private buildComplianceGapPrompt(complianceData: any, requirements: any[], framework: string): string {
    return `Identify compliance gaps for ${framework}:

Current Compliance Status: ${JSON.stringify(complianceData)}

Framework Requirements: ${JSON.stringify(requirements)}

Analyze gaps and provide:
1. Gap description and severity
2. Current vs required status
3. Recommended actions with timeline
4. Resource requirements
5. Risk of non-compliance

Format as JSON array of gap analyses.`;
  }

  private buildChatPrompt(query: string, history: any[], contextData: any, intent: any): string {
    return `User Query: ${query}

Intent: ${JSON.stringify(intent)}

Relevant Data: ${JSON.stringify(contextData)}

Conversation History: ${JSON.stringify(history.slice(-5))}

Provide a helpful, conversational response that:
1. Directly answers the user's question
2. Uses the relevant data to support your response
3. Offers actionable insights or next steps
4. Suggests follow-up questions if appropriate

Be specific and data-driven while maintaining a conversational tone.`;
  }

  private async analyzeQueryIntent(query: string): Promise<any> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Analyze the user query and determine the intent. Return JSON with intent type, entities, and data requirements.'
        },
        {
          role: 'user',
          content: `Analyze this query: "${query}"`
        }
      ],
      temperature: 0.1,
      max_tokens: 300,
    });

    try {
      return JSON.parse(response.choices[0].message.content || '{}');
    } catch {
      return { type: 'general', entities: [], dataNeeded: [] };
    }
  }

  private async getRelevantData(intent: any, organizationId: string): Promise<any> {
    // Based on intent, fetch relevant data from database
    const data: any = {};

    if (intent.type?.includes('risk')) {
      data.risks = await prisma.risk.findMany({
        where: { organizationId },
        take: 20,
        orderBy: { riskScore: 'desc' }
      });
    }

    if (intent.type?.includes('control')) {
      data.controls = await prisma.control.findMany({
        where: { organizationId },
        take: 20
      });
    }

    if (intent.type?.includes('compliance')) {
      data.compliance = await prisma.complianceFramework.findMany({
        where: { organizationId }
      });
    }

    return data;
  }

  private parseRiskAnalysisResponse(response: string): ImportedRiskAnalysis {
    try {
      return JSON.parse(response);
    } catch {
      // Fallback parsing if JSON fails - using ImportedRiskAnalysis structure
      return {
        id: 'fallback-analysis',
        riskId: 'unknown',
        score: {
          likelihood: 3,
          impact: 3,
          overall: 50,
          confidence: 0.7
        },
        assessment: {
          inherentRisk: 50,
          residualRisk: 50,
          riskReduction: 0
        },
        recommendations: [],
        gaps: [],
        improvements: [],
        relatedRisks: [],
        indicators: [],
        treatmentStrategy: {
          recommended: 'mitigate',
          rationale: 'Default mitigation strategy',
          alternatives: []
        },
        regulatoryConsiderations: [],
        timestamp: new Date(),
        confidence: 0.7
      };
    }
  }

  private parseControlRecommendations(response: string): ControlRecommendation[] {
    try {
      return JSON.parse(response);
    } catch {
      return [];
    }
  }

  private parseComplianceGaps(response: string): ComplianceGap[] {
    try {
      return JSON.parse(response);
    } catch {
      return [];
    }
  }

  private parseChatResponse(response: string, intent: any, contextData: any): ChatResponse {
    return {
      message: response,
      type: 'text',
      followUpQuestions: [
        'Would you like more details about any specific risk?',
        'Do you need help with control implementation?',
        'Should I analyze compliance status?'
      ]
    };
  }

  private async generateHistoricalComparison(riskData: any, historicalRisks: any[]) {
    // Simple similarity matching based on title and category
    const similarRisks = historicalRisks
      .map(risk => ({
        id: risk.id,
        title: risk.title,
        similarity: this.calculateSimilarity(riskData.title, risk.title),
        outcome: risk.status
      }))
      .filter(risk => risk.similarity > 0.3)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);

    return {
      similarRisks,
      trendAnalysis: 'Based on historical data, similar risks have shown varied outcomes.'
    };
  }

  private calculateSimilarity(text1: string, text2: string): number {
    // Simple word overlap similarity
    const words1 = text1.toLowerCase().split(' ');
    const words2 = text2.toLowerCase().split(' ');
    const intersection = words1.filter(word => words2.includes(word));
    return intersection.length / Math.max(words1.length, words2.length);
  }

  /**
   * Build a meaningful prompt for content generation from request requirements and type
   */
  private buildContentGenerationPrompt(request: ContentGenerationRequest): string {
    const { type, requirements, context } = request;
    
    let prompt = `Generate ${type} content based on the following requirements:\n\n`;
    prompt += `Requirements: ${requirements}\n\n`;
    
    if (context) {
      // Extract relevant context information
      if (context.domain) {
        prompt += `Domain/Industry: ${context.domain}\n`;
      }
      if (context.audience) {
        prompt += `Target Audience: ${context.audience}\n`;
      }
      if (context.tone) {
        prompt += `Tone: ${context.tone}\n`;
      }
      if (context.format) {
        prompt += `Format: ${context.format}\n`;
      }
      if (context.length) {
        prompt += `Length: ${context.length}\n`;
      }
      if (context.additionalContext) {
        prompt += `Additional Context: ${context.additionalContext}\n`;
      }
    }
    
    prompt += '\nPlease provide high-quality, relevant content that meets these requirements.';
    
    return prompt;
  }

  private rankControlRecommendations(recommendations: ControlRecommendation[], risk: any): ControlRecommendation[] {
    return recommendations.sort((a, b) => {
      // Sort by effectiveness and inverse complexity
      const scoreA = a.effectiveness - (a.implementationComplexity === 'HIGH' ? 3 : a.implementationComplexity === 'MEDIUM' ? 1 : 0);
      const scoreB = b.effectiveness - (b.implementationComplexity === 'HIGH' ? 3 : b.implementationComplexity === 'MEDIUM' ? 1 : 0);
      return scoreB - scoreA;
    });
  }

  private summarizeRisks(risks: any[]) {
    return {
      total: risks.length,
      byLevel: risks.reduce((acc, risk) => {
        acc[risk.riskLevel] = (acc[risk.riskLevel] || 0) + 1;
        return acc;
      }, {}),
      averageScore: risks.reduce((sum, risk) => sum + (risk.riskScore || 0), 0) / risks.length,
      topCategories: this.getTopCategories(risks)
    };
  }

  private getTopCategories(risks: any[]) {
    const categories = risks.reduce((acc, risk) => {
      acc[risk.category] = (acc[risk.category] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(categories)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));
  }

  // Additional helper methods for data fetching
  private async getComplianceData(organizationId: string, framework: string) {
    return await prisma.complianceFramework.findFirst({
      where: { organizationId, name: framework },
      include: { requirements: true }
    });
  }

  private async getFrameworkRequirements(framework: string) {
    // This would typically come from a frameworks database
    return [];
  }

  private async getOrganizationRisks(organizationId: string) {
    return await prisma.risk.findMany({
      where: { organizationId },
      orderBy: { riskScore: 'desc' }
    });
  }

  private async getOrganizationControls(organizationId: string) {
    return await prisma.control.findMany({
      where: { organizationId }
    });
  }

  private async getOrganizationCompliance(organizationId: string) {
    return await prisma.complianceFramework.findMany({
      where: { organizationId }
    });
  }

  private async analyzeRiskTrends(risks: any[], organizationId: string) {
    // Simplified trend analysis
    return {
      significantChanges: [],
      summary: 'Risk levels remain stable',
      confidence: 0.8,
      severity: 'LOW'
    };
  }

  private async analyzeControlEffectiveness(controls: any[]) {
    const ineffectiveControls = controls.filter(control => 
      control.effectivenessRating && control.effectivenessRating < 3
    );

    return {
      ineffectiveControls,
      averageEffectiveness: controls.reduce((sum, c) => sum + (c.effectivenessRating || 0), 0) / controls.length
    };
  }

  private async analyzeComplianceStatus(compliance: any[]) {
    return {
      criticalGaps: [],
      overallScore: 85
    };
  }

  private async getHistoricalRiskTrends(organizationId: string, timeframe: string) {
    const daysBack = timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 365;
    
    return await prisma.risk.findMany({
      where: {
        organizationId,
        createdAt: {
          gte: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
        }
      },
      select: {
        riskScore: true,
        riskLevel: true,
        category: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  // Rate limiting and usage tracking
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Clean old timestamps
    this.rateLimitState.requestTimestamps = this.rateLimitState.requestTimestamps.filter(ts => ts > oneMinuteAgo);
    this.rateLimitState.tokenUsage = this.rateLimitState.tokenUsage.filter(usage => usage.timestamp > oneMinuteAgo);

    // Check request rate limit
    if (this.rateLimitState.requestTimestamps.length >= this.config.rateLimitRpm) {
      this.rateLimitState.isLimited = true;
      this.rateLimitState.resetTime = new Date(this.rateLimitState.requestTimestamps[0] + 60000);
      throw new RateLimitError('Request rate limit exceeded', this.rateLimitState.resetTime);
    }

    // Check token rate limit
    const recentTokens = this.rateLimitState.tokenUsage.reduce((sum, usage) => sum + usage.tokens, 0);
    if (recentTokens >= this.config.rateLimitTpm) {
      this.rateLimitState.isLimited = true;
      this.rateLimitState.resetTime = new Date(this.rateLimitState.tokenUsage[0].timestamp + 60000);
      throw new RateLimitError('Token rate limit exceeded', this.rateLimitState.resetTime);
    }

    // Add current request
    this.rateLimitState.requestTimestamps.push(now);
    this.rateLimitState.isLimited = false;
  }

  private updateRateLimit(tokens: number): void {
    this.rateLimitState.tokenUsage.push({
      timestamp: Date.now(),
      tokens
    });
  }

  private updateUsageMetrics(usage: TokenUsage, responseTime: number, success: boolean): void {
    this.usageMetrics.totalRequests++;
    this.usageMetrics.totalTokens += usage.totalTokens;
    this.usageMetrics.totalCost += usage.estimatedCost;
    
    // Update success rate (running average)
    const successValue = success ? 1 : 0;
    this.usageMetrics.successRate = ((this.usageMetrics.successRate * (this.usageMetrics.totalRequests - 1)) + successValue) / this.usageMetrics.totalRequests;
    
    // Update average response time (running average)
    this.usageMetrics.averageResponseTime = ((this.usageMetrics.averageResponseTime * (this.usageMetrics.totalRequests - 1)) + responseTime) / this.usageMetrics.totalRequests;
    
    // Update hourly metrics
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    // This would be more sophisticated in production, tracking by hour
    this.usageMetrics.requestsThisHour++;
    this.usageMetrics.tokensThisHour += usage.totalTokens;
    this.usageMetrics.costThisHour += usage.estimatedCost;
  }

  private calculateCost(promptTokens: number, completionTokens: number, modelConfig: ModelConfig): number {
    const promptCost = (promptTokens / 1000) * modelConfig.inputCostPer1k;
    const completionCost = (completionTokens / 1000) * modelConfig.outputCostPer1k;
    return promptCost + completionCost;
  }

  // Caching
  private generateCacheKey(prompt: string, model: string, agentType: string): string {
    // Simple hash function for caching
    const str = `${prompt}-${model}-${agentType}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }

  private getFromCache(key: string): AIResponse | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.response;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, response: AIResponse, ttl: number): void {
    this.cache.set(key, {
      response,
      timestamp: Date.now(),
      ttl
    });
  }

  // Cleanup and maintenance
  private startCleanupIntervals(): void {
    // Clean cache every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, cached] of this.cache.entries()) {
        if (now - cached.timestamp > cached.ttl) {
          this.cache.delete(key);
        }
      }
    }, 300000);

    // Reset hourly metrics every hour
    setInterval(() => {
      this.usageMetrics.requestsThisHour = 0;
      this.usageMetrics.tokensThisHour = 0;
      this.usageMetrics.costThisHour = 0;
    }, 3600000);
  }

  // Public getters for monitoring
  public getRateLimitStatus() {
    return {
      requestsRemaining: Math.max(0, this.config.rateLimitRpm - this.rateLimitState.requestTimestamps.length),
      tokensRemaining: Math.max(0, this.config.rateLimitTpm - this.rateLimitState.tokenUsage.reduce((sum, usage) => sum + usage.tokens, 0)),
      resetTime: this.rateLimitState.resetTime,
      isLimited: this.rateLimitState.isLimited
    };
  }

  public getUsageMetrics(): UsageMetrics {
    return { ...this.usageMetrics };
  }

  public getCircuitBreakerState() {
    return this.circuitBreaker.getState();
  }

  public getAvailableModels(): ModelConfig[] {
    return Array.from(this.modelConfigs.values());
  }

  public updateConfig(newConfig: Partial<AIConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Calculate confidence level based on response content
   */
  private calculateConfidence(content: string): number {
    // Simple confidence calculation based on content characteristics
    let confidence = 0.7; // Base confidence
    
    // Increase confidence for longer, more detailed responses
    if (content.length > 500) confidence += 0.1;
    if (content.length > 1000) confidence += 0.1;
    
    // Increase confidence for structured responses
    if (content.includes('1.') || content.includes('•') || content.includes('-')) confidence += 0.05;
    
    // Increase confidence for responses with specific frameworks or standards
    const frameworks = ['COSO', 'ISO 31000', 'NIST', 'COBIT', 'SOX', 'GDPR'];
    for (const framework of frameworks) {
      if (content.includes(framework)) {
        confidence += 0.02;
        break;
      }
    }
    
    // Decrease confidence for responses indicating uncertainty
    if (content.toLowerCase().includes('uncertain') || 
        content.toLowerCase().includes('may be') ||
        content.toLowerCase().includes('might be')) {
      confidence -= 0.1;
    }
    
    // Ensure confidence is within bounds
    return Math.max(0.3, Math.min(0.95, confidence));
  }

  /**
   * Generate content based on a request
   */
  async generateContent(request: ContentGenerationRequest): Promise<ContentGenerationResult> {
    try {
      // Validate required fields
      if (!request.context || Object.keys(request.context).length === 0) {
        throw new AIServiceError(
          'Missing context in content generation request',
          'INVALID_REQUEST',
          400,
          false,
          'medium',
          'Request context is required'
        );
      }

      if (!request.requirements || request.requirements.trim().length === 0) {
        throw new AIServiceError(
          'Missing requirements in content generation request',
          'INVALID_REQUEST',
          400,
          false,
          'medium',
          'Requirements field is required'
        );
      }

      // Build meaningful prompt from requirements and type
      const prompt = this.buildContentGenerationPrompt(request);
      
      // Use provided userId and organizationId, or generate defaults if not provided
      const userId = request.userId || generateId();
      const organizationId = request.organizationId || generateId();
      
      const response = await this.processNaturalLanguageQuery(
        prompt,
        userId,
        organizationId
      );

      // Calculate dynamic confidence based on response content
      const confidence = this.calculateConfidence(response.message);

      return {
        id: generateId(),
        content: response.message,
        timestamp: new Date(),
        usage: response.usage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        confidence
      };
    } catch (error) {
      console.error('Content generation failed:', error);
      
      // Re-throw AIServiceError instances
      if (error instanceof AIServiceError) {
        throw error;
      }
      
      throw new AIServiceError(
        'Failed to generate content',
        'CONTENT_GENERATION_FAILED',
        500,
        false,
        'high',
        'Unable to generate content at this time'
      );
    }
  }
} 