export interface AIConfig {
  openaiApiKey: string;
  agentEndpoint: string;
  maxTokens: number;
  temperature: number;
  rateLimits: {
    requestsPerMinute: number;
    tokensPerHour: number;
    maxConcurrentRequests: number;
  };
  fallback: {
    enabled: boolean;
    responses: Record<string, string>;
  };
  security: {
    enableAuditLogging: boolean;
    sanitizeRequests: boolean;
    encryptResponses: boolean;
  };
  performance: {
    enableCaching: boolean;
    cacheExpiryMinutes: number;
    enableStreaming: boolean;
    backgroundProcessing: boolean;
  };
  agents: {
    riskAnalyzer: {
      model: string;
      systemPrompt: string;
      tools: string[];
    };
    controlAdvisor: {
      model: string;
      systemPrompt: string;
      tools: string[];
    };
    complianceExpert: {
      model: string;
      systemPrompt: string;
      tools: string[];
    };
  };
}

// Production configuration
export const aiConfig: AIConfig = {
  openaiApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
  agentEndpoint: process.env.NEXT_PUBLIC_AI_AGENT_ENDPOINT || 'https://api.openai.com/v1/agents',
  maxTokens: 4000,
  temperature: 0.7,
  rateLimits: {
    requestsPerMinute: 50,
    tokensPerHour: 100000,
    maxConcurrentRequests: 5,
  },
  fallback: {
    enabled: true,
    responses: {
      risk_analysis:
        "I'm currently analyzing this risk. Please check back in a moment for detailed insights.",
      control_recommendation:
        'Based on best practices, I recommend implementing preventive controls for this risk.',
      content_generation: "I'm generating content for your request. This may take a moment.",
      error_generic:
        "I'm experiencing technical difficulties. Please try again or contact support.",
    },
  },
  security: {
    enableAuditLogging: true,
    sanitizeRequests: true,
    encryptResponses: false, // In-memory only, no storage
  },
  performance: {
    enableCaching: true,
    cacheExpiryMinutes: 15,
    enableStreaming: true,
    backgroundProcessing: true,
  },
  agents: {
    riskAnalyzer: {
      model: 'gpt-4-turbo-preview',
      systemPrompt: `You are ARIA, an expert Risk Intelligence Assistant specializing in Enterprise Risk Management (ERM) and Risk and Control Self-Assessment (RCSA). Your expertise includes:

CORE CAPABILITIES:
- Risk identification, assessment, and quantification
- Risk categorization across operational, financial, strategic, compliance, and technology domains
- Risk appetite and tolerance analysis
- Inherent vs. residual risk evaluation
- Risk heat mapping and matrix analysis

FRAMEWORKS & STANDARDS:
- ISO 31000:2018 Risk Management Guidelines
- COSO ERM Framework
- Basel III/IV for financial institutions
- SOX compliance requirements
- NIST Cybersecurity Framework
- Industry-specific risk frameworks

ANALYSIS APPROACH:
- Provide quantitative risk scores (1-5 likelihood × 1-5 impact)
- Identify risk interdependencies and correlations
- Suggest risk treatment strategies (accept, avoid, mitigate, transfer)
- Recommend KRIs (Key Risk Indicators)
- Consider regulatory and compliance implications

Always provide actionable, evidence-based recommendations with confidence scores.`,
      tools: ['risk_calculator', 'framework_lookup', 'correlation_analyzer'],
    },
    controlAdvisor: {
      model: 'gpt-4-turbo-preview',
      systemPrompt: `You are ARIA's Control Advisory specialist, expert in internal controls, governance, and risk mitigation strategies. Your expertise includes:

CONTROL EXPERTISE:
- Control design and effectiveness assessment
- Three lines of defense model
- Preventive, detective, and corrective controls
- Control testing methodologies
- Control gap analysis and remediation

GOVERNANCE FRAMEWORKS:
- COSO Internal Control Framework
- COBIT for IT governance
- SOX Section 404 compliance
- Internal audit best practices
- GRC (Governance, Risk & Compliance) integration

CONTROL RECOMMENDATIONS:
- Design controls that are proportionate to risk
- Consider cost-benefit analysis
- Ensure segregation of duties
- Implement monitoring and alerting mechanisms
- Provide control testing procedures
- Suggest automation opportunities

Always recommend practical, implementable controls with clear ownership and testing procedures.`,
      tools: ['control_library', 'effectiveness_calculator', 'gap_analyzer'],
    },
    complianceExpert: {
      model: 'gpt-4-turbo-preview',
      systemPrompt: `You are ARIA's Compliance Intelligence specialist, expert in regulatory requirements, policy frameworks, and compliance management. Your expertise includes:

REGULATORY EXPERTISE:
- Financial services regulations (Basel, MiFID, Dodd-Frank)
- Data protection laws (GDPR, CCPA, PIPEDA)
- Industry standards (PCI DSS, HIPAA, SOX)
- International frameworks (ISO 27001, ISO 9001)
- Emerging regulatory requirements

COMPLIANCE STRATEGIES:
- Regulatory mapping and gap analysis
- Policy development and implementation
- Compliance monitoring and testing
- Regulatory change management
- Incident response and reporting

ADVISORY APPROACH:
- Assess regulatory applicability and impact
- Identify compliance gaps and remediation steps
- Recommend monitoring and reporting mechanisms
- Suggest policy updates and training needs
- Provide regulatory interpretation and guidance

Always ensure recommendations are current, practical, and aligned with business objectives.`,
      tools: ['regulation_database', 'compliance_mapper', 'policy_generator'],
    },
  },
};

// Development configuration with mock endpoints
export const developmentAIConfig: AIConfig = {
  ...aiConfig,
  agentEndpoint: 'mock://localhost/ai-agents',
  rateLimits: {
    requestsPerMinute: 100,
    tokensPerHour: 500000,
    maxConcurrentRequests: 10,
  },
  fallback: {
    enabled: true,
    responses: {
      ...aiConfig.fallback.responses,
      development_mode: 'Running in development mode with mock AI responses.',
    },
  },
};

// Configuration selector based on environment
export const getAIConfig = (): AIConfig => {
  return process.env.NODE_ENV === 'development' ? developmentAIConfig : aiConfig;
};

// Validation utilities
export const validateAIConfig = (_config: AIConfig): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!config.openaiApiKey && process.env.NODE_ENV === 'production') {
    errors.push('OpenAI API key is required in production');
  }

  if (config.rateLimits.requestsPerMinute < 1) {
    errors.push('Rate limit must be at least 1 request per minute');
  }

  if (config.maxTokens < 100 || config.maxTokens > 8000) {
    errors.push('Max tokens must be between 100 and 8000');
  }

  if (config.temperature < 0 || config.temperature > 2) {
    errors.push('Temperature must be between 0 and 2');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export default aiConfig;
