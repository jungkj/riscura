import { 
  AIRequest, 
  RiskAnalysis, 
  ControlRecommendation, 
  TokenUsage,
  AIError,
  AIErrorCode,
  RateLimitStatus,
  CacheEntry,
  ContentGenerationRequest,
  ExplanationRequest,
  Explanation,
  BatchAnalysisRequest,
  BatchAnalysisResult,
  AIAuditLog,
  SecurityEvent,
  PerformanceMetrics,
  AgentType,
  OpenAIAgent
} from '@/types/ai.types';
import { Risk } from '@/types';
import { getAIConfig, validateAIConfig } from '@/config/ai.config';
import { generateId } from '@/lib/utils';

// Rate Limiter Implementation
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private tokens: Map<string, number[]> = new Map();
  private config = getAIConfig();

  checkRateLimit(userId: string, tokenCount: number = 0): RateLimitStatus {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window

    // Clean old requests
    const userRequests = this.requests.get(userId) || [];
    const recentRequests = userRequests.filter(time => now - time < windowMs);
    this.requests.set(userId, recentRequests);

    // Clean old token usage
    const userTokens = this.tokens.get(userId) || [];
    const recentTokens = userTokens.filter(time => now - time < 60 * 60 * 1000); // 1 hour window
    this.tokens.set(userId, recentTokens);

    const requestsRemaining = Math.max(0, this.config.rateLimits.requestsPerMinute - recentRequests.length);
    const tokensRemaining = Math.max(0, this.config.rateLimits.tokensPerHour - recentTokens.length);

    return {
      requestsRemaining,
      tokensRemaining,
      resetTime: new Date(now + windowMs),
      isLimited: requestsRemaining === 0 || (tokenCount > 0 && tokensRemaining < tokenCount),
    };
  }

  recordRequest(userId: string, tokenCount: number): void {
    const now = Date.now();
    
    // Record request
    const userRequests = this.requests.get(userId) || [];
    userRequests.push(now);
    this.requests.set(userId, userRequests);

    // Record token usage
    const userTokens = this.tokens.get(userId) || [];
    for (let i = 0; i < tokenCount; i++) {
      userTokens.push(now);
    }
    this.tokens.set(userId, userTokens);
  }
}

// Cache Implementation
class AICache {
  private cache = new Map<string, CacheEntry>();
  private config = getAIConfig();

  private generateKey(request: AIRequest): string {
    return `${request.type}:${JSON.stringify(request.content)}:${JSON.stringify(request.context)}`;
  }

  get<T>(request: AIRequest): T | null {
    if (!this.config.performance.enableCaching) return null;

    const key = this.generateKey(request);
    const entry = this.cache.get(key);

    if (!entry) return null;

    if (entry.expiresAt < new Date()) {
      this.cache.delete(key);
      return null;
    }

    entry.hitCount++;
    return entry.data as T;
  }

  set<T>(request: AIRequest, data: T): void {
    if (!this.config.performance.enableCaching) return;

    const key = this.generateKey(request);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.performance.cacheExpiryMinutes * 60 * 1000);

    this.cache.set(key, {
      key,
      data,
      timestamp: now,
      expiresAt,
      hitCount: 0,
      size: JSON.stringify(data).length,
    });

    // Clean expired entries
    this.cleanup();
  }

  private cleanup(): void {
    const now = new Date();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
      }
    }
  }

  getStats() {
    const entries = Array.from(this.cache.values());
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    const totalHits = entries.reduce((sum, entry) => sum + entry.hitCount, 0);
    const totalRequests = entries.length + totalHits;

    return {
      totalEntries: entries.length,
      totalSize,
      hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
      missRate: totalRequests > 0 ? entries.length / totalRequests : 0,
      evictionCount: 0, // Would track this in a more sophisticated implementation
    };
  }
}

// Circuit Breaker Implementation
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private readonly threshold = 5;
  private readonly timeout = 60000; // 1 minute

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
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

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }
}

// Main AI Service Class
export class AIService {
  private rateLimiter = new RateLimiter();
  private cache = new AICache();
  private circuitBreaker = new CircuitBreaker();
  private config = getAIConfig();
  private auditLogs: AIAuditLog[] = [];
  private securityEvents: SecurityEvent[] = [];
  private agents: Map<AgentType, OpenAIAgent> = new Map();

  constructor() {
    this.validateConfiguration();
    this.initializeAgents();
  }

  private validateConfiguration(): void {
    const validation = validateAIConfig(this.config);
    if (!validation.isValid) {
      throw new Error(`AI Configuration invalid: ${validation.errors.join(', ')}`);
    }
  }

  private async initializeAgents(): Promise<void> {
    // In a real implementation, this would initialize OpenAI agents
    // For now, we'll create mock agent configurations
    const agentConfigs = this.config.agents;
    
    Object.entries(agentConfigs).forEach(([type, config]) => {
      const agent: OpenAIAgent = {
        id: `agent-${type}-${generateId()}`,
        name: type,
        model: config.model,
        instructions: config.systemPrompt,
        tools: config.tools.map(tool => ({ type: 'function', name: tool })),
        metadata: { type, created: new Date().toISOString() },
      };
      
      this.agents.set(type as AgentType, agent);
    });
  }

  // Core Analysis Methods
  async analyzeRisk(riskData: Risk, userId: string): Promise<RiskAnalysis> {
    const request: AIRequest = {
      id: generateId('ai-req'),
      type: 'risk_analysis',
      content: JSON.stringify(riskData),
      context: { riskId: riskData.id, category: riskData.category },
      userId,
      timestamp: new Date(),
    };

    return this.executeRequest(request, async () => {
      // Check cache first
      const cached = this.cache.get<RiskAnalysis>(request);
      if (cached) return cached;

      // Perform analysis
      const analysis = await this.performRiskAnalysis(riskData);
      
      // Cache result
      this.cache.set(request, analysis);
      
      return analysis;
    });
  }

  async recommendControls(riskData: Risk, userId: string): Promise<ControlRecommendation[]> {
    const request: AIRequest = {
      id: generateId('ai-req'),
      type: 'control_recommendation',
      content: JSON.stringify(riskData),
      context: { riskId: riskData.id, riskLevel: riskData.riskScore },
      userId,
      timestamp: new Date(),
    };

    return this.executeRequest(request, async () => {
      const cached = this.cache.get<ControlRecommendation[]>(request);
      if (cached) return cached;

      const recommendations = await this.generateControlRecommendations(riskData);
      this.cache.set(request, recommendations);
      
      return recommendations;
    });
  }

  async generateContent(contentRequest: ContentGenerationRequest, userId: string): Promise<string> {
    const request: AIRequest = {
      id: generateId('ai-req'),
      type: 'content_generation',
      content: JSON.stringify(contentRequest),
      context: { contentType: contentRequest.type },
      userId,
      timestamp: new Date(),
    };

    return this.executeRequest(request, async () => {
      const cached = this.cache.get<string>(request);
      if (cached) return cached;

      const content = await this.performContentGeneration(contentRequest);
      this.cache.set(request, content);
      
      return content;
    });
  }

  async explainContent(explanationRequest: ExplanationRequest, userId: string): Promise<Explanation> {
    const request: AIRequest = {
      id: generateId('ai-req'),
      type: 'explanation',
      content: JSON.stringify(explanationRequest),
      context: { domain: explanationRequest.context.domain },
      userId,
      timestamp: new Date(),
    };

    return this.executeRequest(request, async () => {
      const cached = this.cache.get<Explanation>(request);
      if (cached) return cached;

      const explanation = await this.performExplanation(explanationRequest);
      this.cache.set(request, explanation);
      
      return explanation;
    });
  }

  async batchAnalysis(batchRequest: BatchAnalysisRequest, userId: string): Promise<BatchAnalysisResult> {
    const request: AIRequest = {
      id: generateId('ai-req'),
      type: 'batch_analysis',
      content: JSON.stringify(batchRequest),
      context: { 
        analysisType: batchRequest.analysisType,
        itemCount: batchRequest.items.length 
      },
      userId,
      timestamp: new Date(),
    };

    return this.executeRequest(request, async () => {
      const result = await this.performBatchAnalysis(batchRequest);
      // Don't cache batch analysis due to size and variability
      return result;
    });
  }

  // Private Implementation Methods
  private async executeRequest<T>(request: AIRequest, operation: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    let result: T;
    let error: AIError | null = null;

    try {
      // Check rate limits
      const rateLimitStatus = this.rateLimiter.checkRateLimit(request.userId, 1000); // Estimate 1000 tokens
      if (rateLimitStatus.isLimited) {
        throw this.createError('RATE_LIMIT_EXCEEDED', 'Rate limit exceeded', request.id, false);
      }

      // Execute with circuit breaker
      result = await this.circuitBreaker.execute(operation);
      
      // Record successful request
      this.rateLimiter.recordRequest(request.userId, 1000);
      
      return result;
    } catch (err) {
      error = err instanceof Error ? 
        this.createError('API_ERROR', err.message, request.id, true) :
        this.createError('UNKNOWN_ERROR', 'Unknown error occurred', request.id, false);
      
      // Try fallback if available
      if (this.config.fallback.enabled) {
        const fallback = this.getFallbackResponse(request.type);
        if (fallback) {
          error.fallbackUsed = true;
          this.logSecurityEvent('suspicious_activity', 'low', request.userId, 'Fallback response used');
          return fallback as T;
        }
      }
      
      throw error;
    } finally {
      // Audit logging
      this.logRequest(request, Date.now() - startTime, error);
    }
  }

  private async performRiskAnalysis(riskData: Risk): Promise<RiskAnalysis> {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));

    // Mock analysis result - in production this would call OpenAI API
    return {
      id: generateId('analysis'),
      riskId: riskData.id,
      score: {
        likelihood: riskData.likelihood,
        impact: riskData.impact,
        overall: riskData.riskScore,
        confidence: 0.85 + Math.random() * 0.1,
      },
      assessment: {
        inherentRisk: riskData.riskScore,
        residualRisk: Math.max(1, riskData.riskScore - 2),
        riskReduction: 2,
      },
      recommendations: [
        {
          id: generateId('rec'),
          type: 'immediate',
          priority: 'high',
          action: 'Implement enhanced monitoring controls',
          rationale: 'Based on current risk level and control gaps',
          estimatedEffort: 'medium',
          expectedImpact: 3,
          dependencies: [],
          timeline: '2-4 weeks',
        }
      ],
      gaps: [
        {
          id: generateId('gap'),
          category: 'control',
          description: 'Insufficient monitoring of key risk indicators',
          impact: 'significant',
          remediation: 'Implement automated KRI monitoring dashboard',
          priority: 1,
        }
      ],
      improvements: [
        {
          id: generateId('imp'),
          area: 'Risk Assessment Process',
          description: 'Enhance risk quantification methodology',
          benefit: 'More accurate risk scoring and prioritization',
          effort: 'medium',
          roi: 1.5,
        }
      ],
      relatedRisks: [],
      indicators: [
        {
          id: generateId('kri'),
          name: 'Process Failure Rate',
          description: 'Percentage of process failures per month',
          threshold: { green: 2, amber: 5, red: 10 },
          frequency: 'monthly',
          source: 'Operations Dashboard',
        }
      ],
      treatmentStrategy: {
        recommended: 'mitigate',
        rationale: 'Risk level requires active mitigation strategies',
        alternatives: [
          {
            strategy: 'accept',
            description: 'Accept current risk level with monitoring',
            pros: ['Low cost', 'Quick implementation'],
            cons: ['Ongoing exposure', 'Potential regulatory concerns'],
          }
        ],
      },
      regulatoryConsiderations: [
        {
          regulation: 'SOX Section 404',
          applicability: 'high',
          requirements: ['Control documentation', 'Testing procedures'],
          implications: 'Enhanced internal controls required',
        }
      ],
      timestamp: new Date(),
      confidence: 0.87,
    };
  }

  private async generateControlRecommendations(riskData: Risk): Promise<ControlRecommendation[]> {
    // Mock implementation - would normally use OpenAI API
    console.log('Generating control recommendations for risk:', riskData.title);
    
    const mockRecommendations: ControlRecommendation[] = [
      {
        id: 'rec_1',
        title: 'Enhanced Access Controls',
        description: 'Implement multi-factor authentication and role-based access controls',
        type: 'preventive',
        category: 'automated',
        effectiveness: 0.92,
        implementationCost: 'high',
        operationalCost: 'medium',
        priority: 1,
        riskReduction: 3,
        implementation: {
          timeline: '3 months',
          phases: [],
          resources: [],
          risks: [],
          successCriteria: ['MFA implemented', 'RBAC configured'],
        },
        testing: {
          frequency: 'monthly',
          methodology: 'Automated testing',
          procedures: [],
          evidence: ['Test logs'],
          passFailCriteria: ['All tests pass'],
        },
        monitoring: {
          metrics: [],
          dashboards: [],
          alerting: [],
          reporting: [],
        },
        dependencies: [],
        alternatives: [],
        complianceMapping: [],
        timestamp: new Date(),
        confidence: 0.87,
      },
    ];

    return mockRecommendations;
  }

  private async performContentGeneration(request: ContentGenerationRequest): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

    // Mock content generation based on type
    const templates: Record<string, string> = {
      risk_description: `This risk involves potential ${request.context} that could impact business operations. Key factors include regulatory requirements, operational dependencies, and stakeholder expectations.`,
      control_procedure: `1. Review and validate input data\n2. Execute control activities\n3. Document results and exceptions\n4. Report to management\n5. Follow up on remediation items`,
      policy_document: `PURPOSE\nThis policy establishes guidelines for ${request.context}.\n\nSCOPE\nThis policy applies to all employees and contractors.\n\nRESPONSIBILITIES\nManagement is responsible for implementation and oversight.`,
      training_material: `Training objectives for ${request.context}:\n1. Understand key concepts\n2. Apply best practices\n3. Identify common risks\n4. Follow established procedures`,
      risk_scenario: `Scenario: ${request.context}\nPotential impacts and likelihood assessment with mitigation strategies.`,
      incident_response: `Incident Response Plan for ${request.context}:\n1. Immediate containment\n2. Assessment and investigation\n3. Communication protocol\n4. Recovery procedures\n5. Lessons learned`,
      assessment_questionnaire: `Assessment Questions for ${request.context}:\n1. What controls are in place?\n2. How effective are current measures?\n3. What gaps exist?\n4. What improvements are needed?`,
    };

    return templates[request.type] || `Generated content for ${request.type} based on ${request.context}`;
  }

  private async performExplanation(request: ExplanationRequest): Promise<Explanation> {
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    return {
      summary: `This concept relates to ${request.context.domain} and involves understanding key principles and applications.`,
      details: [
        {
          title: 'Key Concepts',
          content: 'Fundamental principles that underpin this topic',
          importance: 'high',
        }
      ],
      examples: [
        {
          scenario: 'Typical business scenario',
          application: 'How this applies in practice',
          outcome: 'Expected results and benefits',
        }
      ],
      references: [
        {
          title: 'Industry Best Practices',
          source: 'Risk Management Association',
          relevance: 0.85,
        }
      ],
      relatedConcepts: ['Risk Assessment', 'Control Design', 'Compliance'],
      confidence: 0.78,
    };
  }

  private async performBatchAnalysis(request: BatchAnalysisRequest): Promise<BatchAnalysisResult> {
    await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 5000));

    const mockUsage: TokenUsage = {
      promptTokens: request.items.length * 500,
      completionTokens: request.items.length * 300,
      totalTokens: request.items.length * 800,
      estimatedCost: request.items.length * 0.02,
    };

    return {
      id: generateId('batch'),
      summary: {
        totalItems: request.items.length,
        highRiskItems: Math.floor(request.items.length * 0.2),
        mediumRiskItems: Math.floor(request.items.length * 0.5),
        lowRiskItems: Math.floor(request.items.length * 0.3),
        averageConfidence: 0.82,
        keyFindings: ['Systematic control gaps identified', 'Risk concentration in operational areas'],
        overallRating: 'good',
      },
      results: [], // Would populate with individual analyses
      correlations: [],
      recommendations: [],
      timestamp: new Date(),
      totalUsage: mockUsage,
    };
  }

  // Utility Methods
  private createError(code: AIErrorCode, message: string, requestId?: string, retryable: boolean = false): AIError {
    return {
      code,
      message,
      timestamp: new Date(),
      requestId,
      retryable,
      fallbackUsed: false,
    };
  }

  private getFallbackResponse(requestType: string): string | null {
    return this.config.fallback.responses[requestType] || this.config.fallback.responses.error_generic;
  }

  private logRequest(request: AIRequest, duration: number, error: AIError | null): void {
    if (!this.config.security.enableAuditLogging) return;

    const log: AIAuditLog = {
      id: generateId('audit'),
      userId: request.userId,
      requestType: request.type,
      timestamp: request.timestamp,
      requestSummary: request.content.substring(0, 100),
      responseStatus: error ? 'error' : 'success',
      tokenUsage: {
        promptTokens: 500,
        completionTokens: 300,
        totalTokens: 800,
        estimatedCost: 0.02,
      },
      duration,
      metadata: { requestId: request.id },
    };

    this.auditLogs.push(log);
    
    // Keep only last 1000 logs in memory
    if (this.auditLogs.length > 1000) {
      this.auditLogs = this.auditLogs.slice(-1000);
    }
  }

  private logSecurityEvent(type: SecurityEvent['type'], severity: SecurityEvent['severity'], userId: string, details: string): void {
    const event: SecurityEvent = {
      id: generateId('security'),
      type,
      severity,
      userId,
      details,
      timestamp: new Date(),
      resolved: false,
    };

    this.securityEvents.push(event);
  }

  // Public Utility Methods
  getRateLimitStatus(userId: string): RateLimitStatus {
    return this.rateLimiter.checkRateLimit(userId);
  }

  getCacheStats() {
    return this.cache.getStats();
  }

  getPerformanceMetrics(): PerformanceMetrics {
    const recentLogs = this.auditLogs.filter(log => 
      Date.now() - log.timestamp.getTime() < 60000 // Last minute
    );

    return {
      averageResponseTime: recentLogs.reduce((sum, log) => sum + log.duration, 0) / Math.max(recentLogs.length, 1),
      requestsPerMinute: recentLogs.length,
      errorRate: recentLogs.filter(log => log.responseStatus === 'error').length / Math.max(recentLogs.length, 1),
      cacheHitRate: this.cache.getStats().hitRate,
      tokenUsageRate: recentLogs.reduce((sum, log) => sum + log.tokenUsage.totalTokens, 0),
      concurrentRequests: 0, // Would track this in real implementation
    };
  }

  getAuditLogs(userId?: string): AIAuditLog[] {
    return userId ? 
      this.auditLogs.filter(log => log.userId === userId) : 
      this.auditLogs;
  }

  getSecurityEvents(): SecurityEvent[] {
    return this.securityEvents;
  }
}

// Export singleton instance
export const aiService = new AIService(); 