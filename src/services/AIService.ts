import OpenAI from 'openai';
import { 
  AIResponse, 
  TokenUsage, 
  AIRequest, 
  AgentType,
  ConversationMessage,
  RiskAnalysis,
  ControlRecommendation,
  MessageAttachment
} from '@/types/ai.types';
import { Risk } from '@/types';
import { generateId } from '@/lib/utils';

// Enhanced interfaces for proper typing
interface ContentGenerationRequest {
  type: string;
  context?: Record<string, unknown>;
  requirements?: string;
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

export class AIService {
  private client: OpenAI;
  private config: AIConfig;
  private modelConfigs: Map<string, ModelConfig>;
  private rateLimitState: RateLimitState;
  private usageMetrics: UsageMetrics;
  private circuitBreaker: CircuitBreaker;
  private cache: Map<string, CacheEntry>;

  constructor(config: Partial<AIConfig> = {}) {
    // Initialize configuration with defaults
    this.config = {
      apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
      baseURL: import.meta.env.VITE_OPENAI_BASE_URL,
      organization: import.meta.env.VITE_OPENAI_ORGANIZATION,
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

    if (!this.config.apiKey) {
      throw new AIServiceError(
        'OpenAI API key is required. Please set VITE_OPENAI_API_KEY environment variable.',
        'MISSING_API_KEY'
      );
    }

    // Initialize OpenAI client
    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseURL,
      organization: this.config.organization,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
      dangerouslyAllowBrowser: true // For client-side usage
    });

    // Initialize model configurations
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

    // Initialize rate limiting
    this.rateLimitState = {
      requestsPerMinute: 0,
      tokensPerMinute: 0,
      requestTimestamps: [],
      tokenUsage: [],
      isLimited: false,
      resetTime: new Date()
    };

    // Initialize usage metrics
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

    // Initialize circuit breaker
    this.circuitBreaker = new CircuitBreaker(5, 60000, 10000);

    // Initialize cache
    this.cache = new Map();

    // Start cleanup intervals
    this.startCleanupIntervals();
  }

  /**
   * Analyze a risk using AI
   */
  async analyzeRisk(risk: Risk): Promise<RiskAnalysis> {
    const request: AIRequest = {
      id: generateId('ai-request'),
      type: 'risk_analysis',
      content: JSON.stringify(risk),
      context: { riskId: risk.id, category: risk.category },
      userId: 'current-user', // Would come from auth context
      timestamp: new Date()
    };

    const prompt = this.buildRiskAnalysisPrompt(risk);
    const response = await this.makeCompletion(prompt, 'risk_analyzer');

    return this.parseRiskAnalysisResponse(response, risk);
  }

  /**
   * Recommend controls for a risk
   */
  async recommendControls(risk: Risk): Promise<ControlRecommendation[]> {
    const prompt = this.buildControlRecommendationPrompt(risk);
    const response = await this.makeCompletion(prompt, 'control_advisor');

    return this.parseControlRecommendationsResponse(response, risk);
  }

  /**
   * Generate content based on request
   */
  async generateContent(request: ContentGenerationRequest): Promise<ContentGenerationResult> {
    const prompt = this.buildContentGenerationPrompt(request);
    const response = await this.makeCompletion(prompt, 'general_assistant');

    return {
      id: generateId('generated-content'),
      content: response.content,
      timestamp: new Date(),
      usage: response.usage,
      confidence: 0.85
    };
  }

  /**
   * Explain content or concepts
   */
  async explainContent(request: ExplanationRequest): Promise<ExplanationResult> {
    const prompt = this.buildExplanationPrompt(request);
    const response = await this.makeCompletion(prompt, 'general_assistant');

    return {
      summary: response.content,
      complexity: request.complexity || 'simple',
      confidence: 0.9,
      timestamp: new Date(),
      usage: response.usage
    };
  }

  /**
   * Send a message and get streaming response
   */
  async sendMessage(
    content: string, 
    agentType: AgentType = 'general_assistant',
    attachments?: MessageAttachment[],
    onStream?: (chunk: string) => void
  ): Promise<ConversationMessage> {
    const prompt = this.buildConversationPrompt(content, agentType, attachments);
    
    if (onStream) {
      const response = await this.makeStreamingCompletion(prompt, agentType, onStream);
      return this.formatConversationMessage(response, 'assistant');
    } else {
      const response = await this.makeCompletion(prompt, agentType);
      return this.formatConversationMessage(response, 'assistant');
    }
  }

  /**
   * Make a completion request with error handling and rate limiting
   */
  private async makeCompletion(prompt: string, agentType: AgentType, model?: string): Promise<AIResponse> {
    const startTime = Date.now();
    const modelName = model || this.config.defaultModel;
    const modelConfig = this.modelConfigs.get(modelName);

    if (!modelConfig) {
      throw new AIServiceError(`Unsupported model: ${modelName}`, 'UNSUPPORTED_MODEL');
    }

    // Check rate limits
    await this.checkRateLimit();

    // Check cache
    const cacheKey = this.generateCacheKey(prompt, modelName, agentType);
    const cachedResponse = this.getFromCache(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Execute with circuit breaker
    const response = await this.circuitBreaker.execute(async () => {
      try {
        const systemPrompt = this.getSystemPrompt(agentType);
        
        const completion = await this.client.chat.completions.create({
          model: modelName,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          max_tokens: Math.min(this.config.maxTokens, modelConfig.maxTokens),
          temperature: this.config.temperature,
          top_p: this.config.topP,
          frequency_penalty: this.config.frequencyPenalty,
          presence_penalty: this.config.presencePenalty,
          user: 'riscura-user'
        });

        const usage = completion.usage;
        const tokenUsage: TokenUsage = {
          promptTokens: usage?.prompt_tokens || 0,
          completionTokens: usage?.completion_tokens || 0,
          totalTokens: usage?.total_tokens || 0,
          estimatedCost: this.calculateCost(usage?.prompt_tokens || 0, usage?.completion_tokens || 0, modelConfig)
        };

        const aiResponse: AIResponse = {
          id: completion.id,
          content: completion.choices[0]?.message?.content || '',
          confidence: 0.85,
          timestamp: new Date(),
          usage: tokenUsage,
          metadata: {
            model: modelName,
            agentType,
            responseTime: Date.now() - startTime
          }
        };

        // Update metrics
        this.updateUsageMetrics(tokenUsage, Date.now() - startTime, true);
        this.updateRateLimit(tokenUsage.totalTokens);

        // Cache response
        this.setCache(cacheKey, aiResponse, 900000); // 15 minutes TTL

        return aiResponse;

      } catch (error: unknown) {
        this.updateUsageMetrics({ promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCost: 0 }, Date.now() - startTime, false);
        
        const err = error as { status?: number; message?: string };
        if (err.status === 429) {
          const resetTime = new Date(Date.now() + 60000);
          throw new RateLimitError('Rate limit exceeded', resetTime);
        }
        
        if (err.status && err.status >= 500) {
          throw new AIServiceError(`OpenAI service error: ${err.message}`, 'SERVICE_ERROR', err.status, true);
        }
        
        throw new AIServiceError(`AI request failed: ${err.message}`, 'REQUEST_FAILED', err.status);
      }
    });

    return response;
  }

  /**
   * Make a streaming completion request
   */
  private async makeStreamingCompletion(
    prompt: string, 
    agentType: AgentType, 
    onStream: (chunk: string) => void,
    model?: string
  ): Promise<AIResponse> {
    const startTime = Date.now();
    const modelName = model || this.config.defaultModel;
    const modelConfig = this.modelConfigs.get(modelName);

    if (!modelConfig?.supportsStreaming) {
      // Fallback to regular completion
      return this.makeCompletion(prompt, agentType, model);
    }

    // Check rate limits
    await this.checkRateLimit();

    return await this.circuitBreaker.execute(async () => {
      try {
        const systemPrompt = this.getSystemPrompt(agentType);
        
        const stream = await this.client.chat.completions.create({
          model: modelName,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          max_tokens: Math.min(this.config.maxTokens, modelConfig.maxTokens),
          temperature: this.config.temperature,
          top_p: this.config.topP,
          frequency_penalty: this.config.frequencyPenalty,
          presence_penalty: this.config.presencePenalty,
          stream: true,
          user: 'riscura-user'
        });

        let fullContent = '';
        let totalTokens = 0;

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            fullContent += content;
            onStream(content);
          }
        }

        // Estimate token usage for streaming (no usage data returned)
        const estimatedTokens = Math.ceil(fullContent.length / 4);
        totalTokens = estimatedTokens;

        const tokenUsage: TokenUsage = {
          promptTokens: Math.ceil(prompt.length / 4),
          completionTokens: estimatedTokens,
          totalTokens: Math.ceil(prompt.length / 4) + estimatedTokens,
          estimatedCost: this.calculateCost(Math.ceil(prompt.length / 4), estimatedTokens, modelConfig)
        };

        const aiResponse: AIResponse = {
          id: generateId('ai-response'),
          content: fullContent,
          confidence: 0.85,
          timestamp: new Date(),
          usage: tokenUsage,
          metadata: {
            model: modelName,
            agentType,
            responseTime: Date.now() - startTime,
            streaming: true
          }
        };

        // Update metrics
        this.updateUsageMetrics(tokenUsage, Date.now() - startTime, true);
        this.updateRateLimit(tokenUsage.totalTokens);

        return aiResponse;

      } catch (error: unknown) {
        this.updateUsageMetrics({ promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCost: 0 }, Date.now() - startTime, false);
        
        const err = error as { status?: number; message?: string };
        if (err.status === 429) {
          const resetTime = new Date(Date.now() + 60000);
          throw new RateLimitError('Rate limit exceeded', resetTime);
        }
        
        throw new AIServiceError(`Streaming request failed: ${err.message}`, 'STREAMING_FAILED', err.status);
      }
    });
  }

  // System prompts for different agents
  private getSystemPrompt(agentType: AgentType): string {
    const prompts = {
      risk_analyzer: `You are an expert Risk Analyzer for enterprise risk management. You specialize in:
- Quantitative and qualitative risk assessment
- Risk scoring using likelihood and impact matrices
- Root cause analysis and risk correlation
- Industry best practices (COSO, ISO 31000, NIST)
- Regulatory compliance requirements

Provide detailed, actionable risk analysis with specific recommendations. Use professional language appropriate for enterprise risk management. Always include confidence levels and supporting rationale.`,

      control_advisor: `You are an expert Control Advisor for enterprise risk management. You specialize in:
- Control design and implementation strategies
- Control effectiveness assessment
- Preventive, detective, and corrective controls
- Control frameworks (COSO, COBIT, SOX)
- Control testing methodologies

Provide practical, implementable control recommendations with clear implementation guidance. Focus on cost-effectiveness and organizational fit.`,

      compliance_expert: `You are an expert Compliance Specialist for enterprise governance. You specialize in:
- Regulatory requirements analysis (SOX, GDPR, HIPAA, etc.)
- Compliance gap analysis and remediation
- Audit preparation and evidence collection
- Industry-specific compliance frameworks
- Risk-based compliance strategies

Provide clear, actionable compliance guidance with specific regulatory references and implementation timelines.`,

      general_assistant: `You are ARIA, an AI Risk Intelligence Assistant for enterprise risk management. You provide:
- General risk management guidance
- Best practice recommendations
- Industry insights and trends
- Process optimization suggestions
- Strategic risk advisory

Maintain a professional, helpful tone while providing comprehensive risk management support across all domains.`
    };

    return prompts[agentType] || prompts.general_assistant;
  }

  // Prompt builders for different use cases
  private buildRiskAnalysisPrompt(risk: Risk): string {
    return `Analyze the following risk for a comprehensive assessment:

Risk Details:
- Title: ${risk.title}
- Description: ${risk.description}
- Category: ${risk.category}
- Current Likelihood: ${risk.likelihood}/5
- Current Impact: ${risk.impact}/5
- Current Risk Score: ${risk.riskScore}
- Status: ${risk.status}
- Owner: ${risk.owner}

Please provide:
1. Detailed risk assessment and validation of current scoring
2. Key risk factors and potential triggers
3. Risk dependencies and correlations
4. Quantitative analysis where applicable
5. Risk treatment recommendations
6. Key risk indicators (KRIs) suggestions
7. Confidence level in your analysis

Format your response as a structured analysis suitable for enterprise risk management.`;
  }

  private buildControlRecommendationPrompt(risk: Risk): string {
    return `Recommend optimal controls for the following risk:

Risk Details:
- Title: ${risk.title}
- Description: ${risk.description}
- Category: ${risk.category}
- Likelihood: ${risk.likelihood}/5
- Impact: ${risk.impact}/5
- Risk Score: ${risk.riskScore}

Please recommend 3-5 controls that should include:
1. A mix of preventive, detective, and corrective controls
2. Implementation difficulty and cost considerations
3. Expected effectiveness in reducing risk
4. Control testing methodologies
5. Key performance indicators for each control
6. Implementation timeline and dependencies

Prioritize practical, cost-effective solutions appropriate for enterprise implementation.`;
  }

  private buildContentGenerationPrompt(request: ContentGenerationRequest): string {
    return `Generate ${request.type} content for enterprise risk management.

Context: ${JSON.stringify(request.context || {})}

Requirements: ${request.requirements || 'Standard enterprise format with professional tone'}

Please ensure the content is:
- Professional and appropriate for enterprise use
- Technically accurate and up-to-date
- Actionable and practical
- Properly structured and formatted
- Compliant with industry standards`;
  }

  private buildExplanationPrompt(request: ExplanationRequest): string {
    const complexity = request.complexity || 'simple';
    const complexityMap = {
      simple: 'Explain in simple terms suitable for general business users',
      detailed: 'Provide a detailed explanation suitable for risk management professionals',
      expert: 'Provide an expert-level explanation with technical details and industry references'
    };

    return `${complexityMap[complexity as keyof typeof complexityMap]}:

Content to explain: ${request.content}

Provide a clear, well-structured explanation that includes:
- Key concepts and definitions
- Practical implications
- Relevant examples
- Best practices where applicable`;
  }

  private buildConversationPrompt(content: string, agentType: AgentType, attachments?: MessageAttachment[]): string {
    let prompt = content;

    if (attachments && attachments.length > 0) {
      prompt += '\n\nAttached context:\n';
      attachments.forEach((attachment, index) => {
        prompt += `${index + 1}. ${attachment.title}: ${JSON.stringify(attachment.data)}\n`;
      });
    }

    return prompt;
  }

  // Response parsers
  private parseRiskAnalysisResponse(response: AIResponse, risk: Risk): RiskAnalysis {
    // Parse the AI response into structured risk analysis
    // This would include more sophisticated parsing in production
    return {
      id: generateId('risk-analysis'),
      riskId: risk.id,
      score: {
        likelihood: risk.likelihood,
        impact: risk.impact,
        overall: risk.riskScore,
        confidence: response.confidence
      },
      assessment: {
        inherentRisk: risk.riskScore * 1.2,
        residualRisk: risk.riskScore,
        riskReduction: 20
      },
      recommendations: [],
      gaps: [],
      improvements: [],
      relatedRisks: [],
      indicators: [],
      treatmentStrategy: {
        recommended: 'mitigate',
        rationale: 'Based on current risk level and organizational risk appetite',
        alternatives: []
      },
      regulatoryConsiderations: [],
      timestamp: new Date(),
      confidence: response.confidence
    };
  }

  private parseControlRecommendationsResponse(response: AIResponse, risk: Risk): ControlRecommendation[] {
    // Parse AI response into structured control recommendations
    // This would include more sophisticated parsing in production
    return [{
      id: generateId('control-recommendation'),
      title: `AI-Recommended Control for ${risk.title}`,
      description: response.content.substring(0, 200) + '...',
      type: 'preventive',
      category: 'automated',
      effectiveness: 85,
      implementationCost: 'medium',
      operationalCost: 'low',
      priority: 1,
      riskReduction: 70,
      implementation: {
        timeline: '3-6 months',
        phases: [],
        resources: [],
        risks: [],
        successCriteria: []
      },
      testing: {
        frequency: 'monthly',
        methodology: 'automated',
        procedures: [],
        evidence: [],
        passFailCriteria: []
      },
      monitoring: {
        metrics: [],
        dashboards: [],
        alerting: [],
        reporting: []
      },
      dependencies: [],
      alternatives: [],
      complianceMapping: [],
      timestamp: new Date(),
      confidence: 0.85
    }];
  }

  private formatConversationMessage(response: AIResponse, role: 'user' | 'assistant' | 'system'): ConversationMessage {
    return {
      id: response.id,
      role,
      content: response.content,
      timestamp: response.timestamp,
      usage: response.usage,
      metadata: response.metadata
    };
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
} 