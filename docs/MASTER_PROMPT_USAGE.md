# Riscura Master Prompt System

This document explains how to use the comprehensive master prompt system for consistent AI interactions across the Riscura platform.

## Overview

The master prompt system ensures all AI interactions maintain consistency with Riscura's enterprise risk management standards while providing specialized expertise across different domains.

## Core Components

### 1. Master Prompt Configuration (`src/config/master-prompt.ts`)

The master prompt includes:
- **System Identity**: ARIA (AI Risk Intelligence Assistant) 
- **Mission & Values**: Enterprise risk management focus
- **Professional Standards**: Enterprise-grade requirements
- **Response Framework**: Structured 5-section format
- **Quality Standards**: Accuracy, completeness, consistency
- **Specialized Methodologies**: Risk, compliance, and control frameworks

### 2. Agent-Specific Modifiers

Four specialized agents with distinct expertise:

```typescript
const AGENT_MODIFIERS = {
  risk_analyzer: {
    focus: "Risk identification, assessment, and quantification",
    specialization: "Advanced risk modeling and scenario analysis",
    tone: "Analytical and thorough"
  },
  control_advisor: {
    focus: "Control design, implementation, and optimization", 
    specialization: "Control effectiveness and efficiency optimization",
    tone: "Practical and implementation-focused"
  },
  compliance_expert: {
    focus: "Regulatory compliance and audit preparation",
    specialization: "Multi-jurisdictional compliance requirements", 
    tone: "Precise and regulation-focused"
  },
  general_assistant: {
    focus: "General risk management guidance and support",
    specialization: "Broad risk management knowledge and best practices",
    tone: "Helpful and comprehensive"
  }
};
```

## Usage Examples

### 1. Risk Analysis with Organizational Context

```typescript
import { AIService } from '@/services/AIService';

const aiService = new AIService();

// Enhanced risk analysis with organizational context
const riskAnalysis = await aiService.analyzeRisk(risk, {
  industry: 'Financial Services',
  size: 'Large Enterprise',
  geography: 'United States',
  riskAppetite: 'Conservative',
  frameworks: ['COSO', 'Basel III', 'SOX']
});
```

### 2. Control Recommendations with Context

```typescript
const controlRecommendations = await aiService.recommendControls(risk, {
  industry: 'Healthcare',
  size: 'Mid-Market',
  geography: 'European Union',
  riskAppetite: 'Moderate',
  frameworks: ['ISO 31000', 'GDPR', 'HIPAA']
});
```

### 3. Contextual Conversations

```typescript
const response = await aiService.sendMessage(
  "What are the key compliance requirements for data processing?",
  'compliance_expert',
  [], // attachments
  undefined, // streaming callback
  {
    industry: 'Technology',
    geography: 'Global',
    frameworks: ['GDPR', 'CCPA', 'SOC 2']
  }
);
```

### 4. Building Custom Contextual Prompts

```typescript
import { buildContextualPrompt } from '@/config/master-prompt';

const contextualPrompt = buildContextualPrompt(
  'risk_analyzer',
  'Analyze cybersecurity risks for cloud migration',
  {
    industry: 'Financial Services',
    size: 'Large Enterprise',
    riskAppetite: 'Conservative',
    frameworks: ['NIST', 'ISO 27001']
  }
);
```

## Response Structure

All AI responses follow the structured framework:

### 1. Executive Summary
- Key findings in 2-3 sentences
- Primary recommendations  
- Risk level/priority indication

### 2. Detailed Analysis
- Comprehensive assessment
- Supporting evidence and rationale
- Relevant framework references
- Quantitative metrics (where applicable)

### 3. Recommendations
- Prioritized action items
- Implementation considerations
- Resource requirements
- Timeline suggestions

### 4. Monitoring & Validation
- Key indicators to track
- Success metrics
- Review frequency
- Escalation triggers

### 5. Confidence & Assumptions
- Confidence level (High/Medium/Low)
- Key assumptions made
- Data limitations
- Areas requiring validation

## Confidence Levels

The system automatically calculates confidence based on:

- **High Confidence (80-100%)**:
  - Well-established best practices
  - Comprehensive data availability
  - Clear regulatory guidance
  - Proven implementation approaches

- **Medium Confidence (60-79%)**:
  - Generally accepted practices
  - Adequate data availability
  - Some regulatory ambiguity
  - Standard implementation approaches

- **Low Confidence (40-59%)**:
  - Emerging practices
  - Limited data availability
  - Significant regulatory uncertainty
  - Complex implementation requirements

## Quality Standards

All responses maintain:

- **Accuracy**: Precise, fact-based information
- **Completeness**: Address all relevant aspects
- **Consistency**: Uniform terminology and methodology
- **Clarity**: Professional, audience-appropriate language
- **Timeliness**: Current regulatory environment awareness
- **Relevance**: Actionable insights that drive outcomes

## Supported Frameworks

The system references established frameworks:

### Risk Management
- COSO Enterprise Risk Management
- ISO 31000:2018 Risk Management Guidelines
- NIST Risk Management Framework
- COBIT (for IT-related risks)

### Regulatory Compliance
- SOX (Sarbanes-Oxley Act)
- GDPR (General Data Protection Regulation)
- HIPAA (Health Insurance Portability and Accountability Act)
- Basel III (Banking regulations)
- NIST Cybersecurity Framework
- ISO 27001 (Information Security)
- PCI DSS (Payment Card Industry)

## Integration Guidelines

### 1. Service Integration

```typescript
// Update existing AI service calls to include context
const result = await aiService.analyzeRisk(risk, organizationalContext);
```

### 2. Component Integration

```typescript
// In React components, pass organizational context
const handleAnalyze = async () => {
  const context = {
    industry: organization.industry,
    size: organization.size,
    frameworks: organization.appliedFrameworks
  };
  
  const analysis = await aiService.analyzeRisk(selectedRisk, context);
  setAnalysisResult(analysis);
};
```

### 3. API Endpoint Integration

```typescript
// In API routes
export async function POST(request: Request) {
  const { risk, organizationalContext } = await request.json();
  
  const aiService = new AIService();
  const analysis = await aiService.analyzeRisk(risk, organizationalContext);
  
  return Response.json(analysis);
}
```

## Customization

### Adding New Agent Types

1. Update `AgentType` in types
2. Add configuration to `AGENT_MODIFIERS`
3. Update specialized prompt sections
4. Add specific methodologies if needed

### Extending Organizational Context

```typescript
interface ExtendedOrganizationalContext {
  industry?: string;
  size?: string;
  geography?: string;
  riskAppetite?: string;
  frameworks?: string[];
  maturityLevel?: string;        // New field
  businessModel?: string;        // New field
  regulatoryEnvironment?: string; // New field
}
```

## Best Practices

1. **Always Provide Context**: Include organizational context for better responses
2. **Select Appropriate Agent**: Choose the right agent type for the task
3. **Validate Confidence Levels**: Review low-confidence responses with experts
4. **Monitor Quality**: Track response quality and user satisfaction
5. **Update Regularly**: Keep frameworks and regulations current
6. **Escalate When Needed**: Follow escalation triggers for critical issues

## Troubleshooting

### Common Issues

1. **Low Confidence Responses**
   - Add more organizational context
   - Verify data completeness
   - Consider expert validation

2. **Generic Responses**
   - Ensure agent type matches use case
   - Provide specific organizational context
   - Include relevant frameworks

3. **Inconsistent Quality**
   - Review prompt templates
   - Validate organizational context
   - Check confidence calculation logic

### Error Handling

```typescript
try {
  const analysis = await aiService.analyzeRisk(risk, context);
} catch (error) {
  if (error instanceof RateLimitError) {
    // Handle rate limiting
  } else if (error instanceof NetworkError) {
    // Handle network issues
  } else {
    // Handle other AI service errors
  }
}
```

## Environment Variables

Ensure these are configured in `.env.local`:

```bash
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_OPENAI_BASE_URL=https://api.openai.com/v1  # Optional
NEXT_PUBLIC_OPENAI_ORGANIZATION=your_org_id             # Optional
```

## Performance Considerations

- **Caching**: Responses are cached to reduce API calls
- **Rate Limiting**: Built-in rate limiting prevents API quota issues  
- **Circuit Breaker**: Automatic failure handling and recovery
- **Token Management**: Optimized token usage for cost efficiency

This master prompt system ensures consistent, high-quality AI interactions across all Riscura applications while maintaining enterprise-grade standards and regulatory compliance awareness. 