import OpenAI from 'openai';

// OpenAI client configuration
export interface OpenAIClientConfig {
  apiKey: string;
  baseURL?: string;
  organization?: string;
  timeout?: number;
  maxRetries?: number;
}

// Model configurations for different use cases
export const MODEL_CONFIGS = {
  'gpt-4o': {
    name: 'gpt-4o',
    maxTokens: 128000,
    inputCostPer1k: 0.005,
    outputCostPer1k: 0.015,
    supportsStreaming: true,
    contextWindow: 128000,
    description: 'Most capable model for complex reasoning',
  },
  'gpt-4o-mini': {
    name: 'gpt-4o-mini',
    maxTokens: 128000,
    inputCostPer1k: 0.00015,
    outputCostPer1k: 0.0006,
    supportsStreaming: true,
    contextWindow: 128000,
    description: 'Fast and efficient for most tasks',
  },
  'gpt-4-turbo': {
    name: 'gpt-4-turbo',
    maxTokens: 128000,
    inputCostPer1k: 0.01,
    outputCostPer1k: 0.03,
    supportsStreaming: true,
    contextWindow: 128000,
    description: 'High performance for complex tasks',
  },
  'gpt-3.5-turbo': {
    name: 'gpt-3.5-turbo',
    maxTokens: 16385,
    inputCostPer1k: 0.0015,
    outputCostPer1k: 0.002,
    supportsStreaming: true,
    contextWindow: 16385,
    description: 'Cost-effective for simpler tasks',
  },
} as const;

export type ModelName = keyof typeof MODEL_CONFIGS;

// Create OpenAI client with configuration
export function createOpenAIClient(_config: OpenAIClientConfig): OpenAI {
  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    organization: config.organization,
    timeout: config.timeout || 60000,
    maxRetries: config.maxRetries || 3,
  });
}

// Utility functions for working with OpenAI
export const OpenAIUtils = {
  /**
   * Calculate cost for a completion
   */
  calculateCost(promptTokens: number, completionTokens: number, modelName: ModelName): number {
    const config = MODEL_CONFIGS[modelName];
    const promptCost = (promptTokens / 1000) * config.inputCostPer1k;
    const completionCost = (completionTokens / 1000) * config.outputCostPer1k;
    return promptCost + completionCost;
  },

  /**
   * Estimate tokens in text (rough approximation)
   */
  estimateTokens(text: string): number {
    // Rough approximation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  },

  /**
   * Validate model selection based on requirements
   */
  selectOptimalModel(requirements: {
    complexity: 'low' | 'medium' | 'high';
    maxTokens?: number;
    costSensitive?: boolean;
    needsStreaming?: boolean;
  }): ModelName {
    const {
      complexity,
      maxTokens = 4000,
      costSensitive = false,
      needsStreaming = false,
    } = requirements;

    // Filter models that support streaming if required
    const availableModels = Object.entries(MODEL_CONFIGS).filter(
      ([_, config]) => !needsStreaming || config.supportsStreaming
    );

    // Filter models that can handle the token requirement
    const suitableModels = availableModels.filter(([_, config]) => config.maxTokens >= maxTokens);

    if (suitableModels.length === 0) {
      throw new Error(`No suitable model found for ${maxTokens} tokens`);
    }

    // Select based on complexity and cost sensitivity
    if (complexity === 'high') {
      return 'gpt-4o';
    } else if (complexity === 'medium') {
      return costSensitive ? 'gpt-4o-mini' : 'gpt-4o';
    } else {
      return costSensitive ? 'gpt-3.5-turbo' : 'gpt-4o-mini';
    }
  },

  /**
   * Format messages for OpenAI API
   */
  formatMessages(
    systemPrompt: string,
    userMessage: string,
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  ): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history if provided
    if (conversationHistory && conversationHistory.length > 0) {
      messages.push(
        ...conversationHistory.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))
      );
    }

    // Add current user message
    messages.push({ role: 'user', content: userMessage });

    return messages;
  },

  /**
   * Create completion parameters with best practices
   */
  createCompletionParams(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    modelName: ModelName,
    options: {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      frequencyPenalty?: number;
      presencePenalty?: number;
      stream?: boolean;
    } = {}
  ): OpenAI.Chat.Completions.ChatCompletionCreateParams {
    const modelConfig = MODEL_CONFIGS[modelName];

    return {
      model: modelName,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: Math.min(options.maxTokens ?? 4000, modelConfig.maxTokens),
      top_p: options.topP ?? 1,
      frequency_penalty: options.frequencyPenalty ?? 0,
      presence_penalty: options.presencePenalty ?? 0,
      stream: options.stream ?? false,
    };
  },

  /**
   * Handle streaming responses
   */
  async handleStreamingResponse(
    stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>,
    onChunk: (chunk: string) => void
  ): Promise<{
    content: string;
    usage?: OpenAI.Chat.Completions.CompletionUsage;
  }> {
    let fullContent = '';
    let usage: OpenAI.Chat.Completions.CompletionUsage | undefined;

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;

      if (delta?.content) {
        fullContent += delta.content;
        onChunk(delta.content);
      }

      // Capture usage information if available
      if (chunk.usage) {
        usage = chunk.usage;
      }
    }

    return { content: fullContent, usage };
  },

  /**
   * Retry logic for API calls
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on certain error types
        if (error instanceof Error) {
          const errorMessage = error.message.toLowerCase();
          if (
            errorMessage.includes('invalid') ||
            errorMessage.includes('unauthorized') ||
            errorMessage.includes('forbidden')
          ) {
            throw error;
          }
        }

        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  },

  /**
   * Validate API key format
   */
  validateApiKey(apiKey: string): boolean {
    return /^sk-[a-zA-Z0-9]{48,}$/.test(apiKey);
  },

  /**
   * Get model capabilities
   */
  getModelCapabilities(modelName: ModelName) {
    const config = MODEL_CONFIGS[modelName];
    return {
      ...config,
      isGPT4: modelName.startsWith('gpt-4'),
      isGPT35: modelName.startsWith('gpt-3.5'),
      recommendedFor: this.getRecommendedUseCases(modelName),
    };
  },

  /**
   * Get recommended use cases for a model
   */
  getRecommendedUseCases(modelName: ModelName): string[] {
    switch (modelName) {
      case 'gpt-4o':
        return ['Complex analysis', 'Strategic planning', 'Technical documentation', 'Research'];
      case 'gpt-4o-mini':
        return ['General assistance', 'Content generation', 'Data analysis', 'Recommendations'];
      case 'gpt-4-turbo':
        return ['Advanced reasoning', 'Code generation', 'Problem solving', 'Creative tasks'];
      case 'gpt-3.5-turbo':
        return ['Simple queries', 'Basic analysis', 'Summarization', 'Classification'];
      default:
        return ['General purpose'];
    }
  },
};

// Error handling utilities
export class OpenAIError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
    public type?: string
  ) {
    super(message);
    this.name = 'OpenAIError';
  }
}

export function handleOpenAIError(__error: any): OpenAIError {
  if (error.status) {
    switch (error.status) {
      case 401:
        return new OpenAIError('Invalid API key', 'invalid_api_key', 401, 'authentication');
      case 429:
        return new OpenAIError('Rate limit exceeded', 'rate_limit', 429, 'rate_limit');
      case 500:
        return new OpenAIError('OpenAI server error', 'server_error', 500, 'server');
      default:
        return new OpenAIError(
          error.message || 'Unknown OpenAI error',
          error.code,
          error.status,
          'api_error'
        );
    }
  }

  return new OpenAIError(error.message || 'Unknown error', 'unknown', 0, 'unknown');
}

export class OpenAIClient {
  private _client: OpenAI | null = null;
  private rateLimitReset: Date | null = null;
  private requestCount = 0;
  private maxRequestsPerMinute = 50;
  private isEnabled: boolean | null = null;

  /**
   * Lazy initialization getter for OpenAI client
   * Only creates the client when it's actually needed
   */
  private get client(): OpenAI {
    if (this._client === null) {
      const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;

      if (!apiKey) {
        this.isEnabled = false;
        throw new Error(
          'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.'
        );
      }

      this._client = new OpenAI({
        apiKey: apiKey,
      });
      this.isEnabled = true;
    }
    return this._client;
  }

  /**
   * Check if OpenAI is enabled (has API key)
   */
  private checkEnabled(): boolean {
    if (this.isEnabled === null) {
      const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
      this.isEnabled = !!apiKey;
    }
    return this.isEnabled;
  }

  async createChatCompletion(
    params: OpenAI.Chat.ChatCompletionCreateParams
  ): Promise<OpenAI.Chat.ChatCompletion> {
    if (!this.checkEnabled()) {
      throw new Error(
        'OpenAI client is not configured. Please set OPENAI_API_KEY environment variable.'
      );
    }

    await this.checkRateLimit();

    try {
      const response = await this.client.chat.completions.create(params);
      this.updateRateLimit();
      return response;
    } catch (__error: any) {
      if (error.status === 429) {
        this.rateLimitReset = new Date(Date.now() + 60000); // 1 minute cooldown
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      throw error;
    }
  }

  async createEmbedding(
    params: OpenAI.EmbeddingCreateParams
  ): Promise<OpenAI.CreateEmbeddingResponse> {
    if (!this.checkEnabled()) {
      throw new Error(
        'OpenAI client is not configured. Please set OPENAI_API_KEY environment variable.'
      );
    }

    await this.checkRateLimit();

    try {
      const response = await this.client.embeddings.create(params);
      this.updateRateLimit();
      return response;
    } catch (__error: any) {
      if (error.status === 429) {
        this.rateLimitReset = new Date(Date.now() + 60000);
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      throw error;
    }
  }

  private async checkRateLimit(): Promise<void> {
    if (this.rateLimitReset && new Date() < this.rateLimitReset) {
      const waitTime = this.rateLimitReset.getTime() - Date.now();
      throw new Error(`Rate limited. Please wait ${Math.ceil(waitTime / 1000)} seconds.`);
    }

    // Reset counter every minute
    const now = Date.now();
    if (!this.rateLimitReset || now - this.rateLimitReset.getTime() > 60000) {
      this.requestCount = 0;
      this.rateLimitReset = new Date(now + 60000);
    }

    if (this.requestCount >= this.maxRequestsPerMinute) {
      throw new Error('Rate limit exceeded. Please try again in a minute.');
    }
  }

  private updateRateLimit(): void {
    this.requestCount++;
  }

  // Helper methods for common AI operations
  async analyzeText(text: string, prompt: string): Promise<string> {
    const response = await this.createChatCompletion({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert analyst. Provide clear, actionable analysis.',
        },
        {
          role: 'user',
          content: `${prompt}\n\nText to analyze: ${text}`,
        },
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });

    return response.choices[0]?.message?.content || '';
  }

  async generateRecommendations(_context: string, requirements: string): Promise<string[]> {
    const response = await this.createChatCompletion({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert advisor. Provide specific, actionable recommendations in a numbered list format.',
        },
        {
          role: 'user',
          content: `Context: ${context}\n\nRequirements: ${requirements}\n\nProvide 3-5 specific recommendations:`,
        },
      ],
      max_tokens: 800,
      temperature: 0.4,
    });

    const content = response.choices[0]?.message?.content || '';
    return this.parseRecommendations(content);
  }

  private parseRecommendations(_content: string): string[] {
    const lines = content.split('\n');
    const recommendations: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (
        trimmed &&
        (trimmed.match(/^\d+\./) || trimmed.startsWith('-') || trimmed.startsWith('•'))
      ) {
        recommendations.push(trimmed.replace(/^\d+\.\s*/, '').replace(/^[-•]\s*/, ''));
      }
    }

    return recommendations.slice(0, 5); // Limit to 5 recommendations
  }
}

// Create a singleton instance - won't throw if API key is missing
let openaiClientInstance: OpenAIClient | null = null;

export const getOpenAIClient = (): OpenAIClient => {
  if (!openaiClientInstance) {
    openaiClientInstance = new OpenAIClient();
  }
  return openaiClientInstance;
};

// For backward compatibility
export const openaiClient = getOpenAIClient();
