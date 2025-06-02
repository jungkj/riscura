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
import { RISCURA_MASTER_PROMPT, AGENT_MODIFIERS, buildContextualPrompt } from '@/config/master-prompt';

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
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
      baseURL: process.env.NEXT_PUBLIC_OPENAI_BASE_URL,
      organization: process.env.NEXT_PUBLIC_OPENAI_ORGANIZATION,
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
        'OpenAI API key is required. Please set NEXT_PUBLIC_OPENAI_API_KEY environment variable.',
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
  async analyzeRisk(risk: Risk, organizationalContext?: {
    industry?: string;
    size?: string;
    geography?: string;
    riskAppetite?: string;
    frameworks?: string[];
  }): Promise<RiskAnalysis> {
    const prompt = this.buildRiskAnalysisPrompt(risk, organizationalContext);
    const response = await this.makeCompletion(prompt, 'risk_analyzer', undefined, organizationalContext);
    
    return this.parseRiskAnalysisResponse(response, risk);
  }

  /**
   * Get control recommendations for a risk
   */
  async recommendControls(risk: Risk, organizationalContext?: {
    industry?: string;
    size?: string;
    geography?: string;
    riskAppetite?: string;
    frameworks?: string[];
  }): Promise<ControlRecommendation[]> {
    const prompt = this.buildControlRecommendationPrompt(risk, organizationalContext);
    const response = await this.makeCompletion(prompt, 'control_advisor', undefined, organizationalContext);
    
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
   * Send a message with optional streaming
   */
  async sendMessage(
    content: string, 
    agentType: AgentType = 'general_assistant',
    attachments?: MessageAttachment[],
    onStream?: (chunk: string) => void,
    organizationalContext?: {
      industry?: string;
      size?: string;
      geography?: string;
      riskAppetite?: string;
      frameworks?: string[];
    }
  ): Promise<ConversationMessage> {
    const prompt = this.buildConversationPrompt(content, agentType, attachments);
    
    let response: AIResponse;
    if (onStream) {
      response = await this.makeStreamingCompletion(prompt, agentType, onStream, undefined, organizationalContext);
    } else {
      response = await this.makeCompletion(prompt, agentType, undefined, organizationalContext);
    }
    
    return this.formatConversationMessage(response, 'assistant');
  }

  /**
   * Make a completion request with error handling and rate limiting
   */
  private async makeCompletion(prompt: string, agentType: AgentType, model?: string, organizationalContext?: any): Promise<AIResponse> {
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
        const systemPrompt = this.getSystemPrompt(agentType, organizationalContext);
        
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
    model?: string,
    organizationalContext?: any
  ): Promise<AIResponse> {
    const startTime = Date.now();
    const modelName = model || this.config.defaultModel;
    const modelConfig = this.modelConfigs.get(modelName);
    
    if (!modelConfig) {
      throw new AIServiceError(
        `Model ${modelName} is not available`,
        'MODEL_NOT_FOUND'
      );
    }

    await this.checkRateLimit();

    let accumulatedContent = '';
    let promptTokens = 0;
    let completionTokens = 0;

    const response = await this.circuitBreaker.execute(async () => {
      try {
        const systemPrompt = this.getSystemPrompt(agentType, organizationalContext);
        
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
          stream: true
        });

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta;
          if (delta?.content) {
            accumulatedContent += delta.content;
            onStream(delta.content);
          }
          
          // Extract usage information from the final chunk
          if (chunk.usage) {
            promptTokens = chunk.usage.prompt_tokens;
            completionTokens = chunk.usage.completion_tokens;
          }
        }

        // Estimate tokens if not provided
        if (promptTokens === 0) {
          promptTokens = Math.ceil((systemPrompt.length + prompt.length) / 4);
        }
        if (completionTokens === 0) {
          completionTokens = Math.ceil(accumulatedContent.length / 4);
        }

        const usage: TokenUsage = {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
          estimatedCost: this.calculateCost(promptTokens, completionTokens, modelConfig)
        };

        const responseTime = Date.now() - startTime;
        this.updateRateLimit(usage.totalTokens);
        this.updateUsageMetrics(usage, responseTime, true);

        return {
          id: generateId('ai-response'),
          content: accumulatedContent,
          model: modelName,
          usage,
          timestamp: new Date(),
          confidence: this.calculateConfidence(accumulatedContent)
        };

      } catch (error) {
        const responseTime = Date.now() - startTime;
        this.updateUsageMetrics({ 
          promptTokens: 0, 
          completionTokens: 0, 
          totalTokens: 0, 
          estimatedCost: 0 
        }, responseTime, false);
        
        if (error instanceof Error) {
          if (error.message.includes('rate limit')) {
            throw new RateLimitError(error.message, new Date(Date.now() + 60000));
          }
          if (error.message.includes('network') || error.message.includes('timeout')) {
            throw new NetworkError(error.message);
          }
          throw new AIServiceError(
            `OpenAI API error: ${error.message}`,
            'API_ERROR',
            undefined,
            true
          );
        }
        throw error;
      }
    });

    return response;
  }

  // System prompts for different agents - now using master prompt
  private getSystemPrompt(agentType: AgentType, organizationalContext?: {
    industry?: string;
    size?: string;
    geography?: string;
    riskAppetite?: string;
    frameworks?: string[];
  }): string {
    const modifier = AGENT_MODIFIERS[agentType] || AGENT_MODIFIERS.general_assistant;
    
    const context = organizationalContext ? `
ORGANIZATIONAL CONTEXT:
- Industry: ${organizationalContext.industry || 'Not specified'}
- Organization Size: ${organizationalContext.size || 'Not specified'}
- Geographic Presence: ${organizationalContext.geography || 'Not specified'}
- Risk Appetite: ${organizationalContext.riskAppetite || 'Not specified'}
- Applied Frameworks: ${organizationalContext.frameworks?.join(', ') || 'Not specified'}
` : '';

    return `${RISCURA_MASTER_PROMPT.systemIdentity}

${RISCURA_MASTER_PROMPT.mission}

SPECIALIZED ROLE: ${modifier.focus}
EXPERTISE: ${modifier.specialization}
COMMUNICATION TONE: ${modifier.tone}

${RISCURA_MASTER_PROMPT.professionalStandards}

${RISCURA_MASTER_PROMPT.expertiseDomains}

${RISCURA_MASTER_PROMPT.responseFramework}

${RISCURA_MASTER_PROMPT.qualityStandards}

${agentType === 'risk_analyzer' ? RISCURA_MASTER_PROMPT.riskMethodology : ''}
${agentType === 'compliance_expert' ? RISCURA_MASTER_PROMPT.complianceFramework : ''}
${agentType === 'control_advisor' ? RISCURA_MASTER_PROMPT.controlPrinciples : ''}

${RISCURA_MASTER_PROMPT.confidenceGuidelines}

${RISCURA_MASTER_PROMPT.regulatoryFrameworks}

${RISCURA_MASTER_PROMPT.outputGuidelines}

${RISCURA_MASTER_PROMPT.escalationTriggers}

${context}

Please provide responses that follow the established framework and maintain consistency with Riscura's enterprise risk management standards.`;
  }

  // Enhanced prompt builders that incorporate master prompt structure
  private buildRiskAnalysisPrompt(risk: Risk, organizationalContext?: any): string {
    const basePrompt = `RISK ANALYSIS REQUEST

RISK DETAILS:
- Title: ${risk.title}
- Description: ${risk.description}
- Category: ${risk.category}
- Current Likelihood: ${risk.likelihood}/5
- Current Impact: ${risk.impact}/5
- Current Risk Score: ${risk.riskScore}
- Status: ${risk.status}
- Owner: ${risk.owner}

ANALYSIS REQUIREMENTS:
Following the Riscura risk assessment methodology, please provide:

1. EXECUTIVE SUMMARY
   - Risk validation and current scoring assessment
   - Key findings and priority level
   - Primary recommendations

2. DETAILED ANALYSIS
   - Root cause analysis
   - Risk triggers and warning signs
   - Potential consequences breakdown
   - Risk velocity and persistence assessment
   - Risk interdependencies and correlations

3. RECOMMENDATIONS
   - Risk response strategy options (avoid, mitigate, transfer, accept)
   - Prioritized action items
   - Implementation considerations
   - Resource requirements and timeline

4. MONITORING & VALIDATION
   - Key Risk Indicators (KRIs) suggestions
   - Monitoring frequency recommendations
   - Escalation triggers
   - Success metrics

5. CONFIDENCE & ASSUMPTIONS
   - Analysis confidence level (High/Medium/Low)
   - Key assumptions made
   - Data limitations identified
   - Areas requiring expert validation

Format as a professional risk assessment report suitable for enterprise review.`;

    return basePrompt;
  }

  private buildControlRecommendationPrompt(risk: Risk, organizationalContext?: any): string {
    const basePrompt = `CONTROL DESIGN REQUEST

RISK INFORMATION:
- Risk: ${risk.title}
- Description: ${risk.description}
- Category: ${risk.category}
- Current Risk Score: ${risk.riskScore}
- Risk Owner: ${risk.owner}

CONTROL DESIGN REQUIREMENTS:
Following Riscura's control design principles, please recommend:

1. EXECUTIVE SUMMARY
   - Control strategy overview
   - Expected risk reduction
   - Implementation priority

2. DETAILED ANALYSIS
   - Primary Controls (3-5 controls)
     * Control objective and description
     * Control type (preventive/detective/corrective)
     * Control category (manual/automated/hybrid)
     * Expected effectiveness (% risk reduction)
   - Alternative control options
   - Control interdependencies

3. RECOMMENDATIONS
   - Phased implementation roadmap
   - Resource requirements and costs
   - Dependencies and prerequisites
   - Timeline and milestones
   - Quick wins vs. long-term solutions

4. MONITORING & VALIDATION
   - Key Control Indicators (KCIs)
   - Testing methodology and frequency
   - Success criteria and metrics
   - Evidence requirements

5. CONFIDENCE & ASSUMPTIONS
   - Control design confidence level
   - Implementation risk assessment
   - Key assumptions
   - Areas requiring expert review

Include cost-benefit analysis and implementation guidance.`;

    return basePrompt;
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
} 