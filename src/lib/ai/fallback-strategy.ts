import { Risk, Control } from '@/types';
import { generateId } from '@/lib/utils';

interface FallbackResponse {
  content: string;
  confidence: number;
  fallbackType: 'template' | 'static' | 'cached' | 'offline';
  disclaimer: string;
  actionable: boolean;
}

interface RiskTemplate {
  category: string;
  commonFactors: string[];
  mitigationStrategies: string[];
  controls: string[];
}

export class AIFallbackStrategy {
  private riskTemplates: Map<string, RiskTemplate> = new Map();
  private staticResponses: Map<string, string> = new Map();
  private offlineKnowledgeBase: Map<string, any> = new Map();

  constructor() {
    this.initializeTemplates();
    this.initializeStaticResponses();
    this.initializeOfflineKnowledge();
  }

  /**
   * Provide fallback response for risk analysis when AI is unavailable
   */
  async getRiskAnalysisFallback(risk: Risk): Promise<FallbackResponse> {
    const template = this.riskTemplates.get(risk.category.toLowerCase());

    if (template) {
      const content = this.generateRiskAnalysisFromTemplate(risk, template);
      return {
        content,
        confidence: 0.6,
        fallbackType: 'template',
        disclaimer:
          'This response is generated from pre-configured templates. AI analysis is currently unavailable.',
        actionable: true,
      };
    }

    // Fallback to basic analysis
    const basicAnalysis = this.generateBasicRiskAnalysis(risk);
    return {
      content: basicAnalysis,
      confidence: 0.4,
      fallbackType: 'static',
      disclaimer: 'This is a basic risk analysis. Enhanced AI insights are currently unavailable.',
      actionable: true,
    };
  }

  /**
   * Provide fallback control recommendations
   */
  async getControlRecommendationsFallback(risk: Risk): Promise<FallbackResponse> {
    const template = this.riskTemplates.get(risk.category.toLowerCase());

    if (template) {
      const content = this.generateControlRecommendationsFromTemplate(risk, template);
      return {
        content,
        confidence: 0.7,
        fallbackType: 'template',
        disclaimer:
          'Control recommendations based on industry best practices. AI optimization unavailable.',
        actionable: true,
      };
    }

    const basicRecommendations = this.generateBasicControlRecommendations(risk);
    return {
      content: basicRecommendations,
      confidence: 0.5,
      fallbackType: 'static',
      disclaimer:
        'Basic control recommendations. Enhanced AI suggestions are currently unavailable.',
      actionable: true,
    };
  }

  /**
   * Provide fallback for general AI assistance
   */
  async getGeneralAssistanceFallback(query: string): Promise<FallbackResponse> {
    const queryType = this.categorizeQuery(query);
    const staticResponse = this.staticResponses.get(queryType);

    if (staticResponse) {
      return {
        content: staticResponse,
        confidence: 0.6,
        fallbackType: 'static',
        disclaimer:
          'This response is from our knowledge base. AI assistance is currently unavailable.',
        actionable: false,
      };
    }

    return {
      content: this.getGenericFallbackResponse(),
      confidence: 0.3,
      fallbackType: 'static',
      disclaimer:
        'AI assistance is currently unavailable. Please try again later or contact support.',
      actionable: false,
    };
  }

  /**
   * Check if offline knowledge can answer the query
   */
  async getOfflineKnowledgeResponse(query: string): Promise<FallbackResponse | null> {
    const keywords = this.extractKeywords(query);

    for (const keyword of keywords) {
      const knowledge = this.offlineKnowledgeBase.get(keyword.toLowerCase());
      if (knowledge) {
        return {
          content: knowledge.content,
          confidence: knowledge.confidence || 0.8,
          fallbackType: 'offline',
          disclaimer: 'Response from offline knowledge base. Real-time AI analysis unavailable.',
          actionable: knowledge.actionable || false,
        };
      }
    }

    return null;
  }

  /**
   * Get system status and recovery suggestions
   */
  getSystemStatusFallback(): FallbackResponse {
    return {
      content: `
**AI Service Status**: Currently experiencing issues

**Available Features**:
- Basic risk analysis using templates
- Standard control recommendations
- Offline knowledge base queries
- Manual risk assessments

**Recommended Actions**:
1. Use manual risk assessment tools
2. Refer to compliance frameworks documentation
3. Check back in 15-30 minutes for AI service restoration
4. Contact support if issues persist

**Emergency Contacts**:
- Support: support@riscura.com
- Technical Issues: tech@riscura.com
      `,
      confidence: 1.0,
      fallbackType: 'static',
      disclaimer: 'System status information is current as of the last update.',
      actionable: true,
    };
  }

  private initializeTemplates(): void {
    this.riskTemplates.set('operational', {
      category: 'Operational',
      commonFactors: [
        'Process inefficiencies',
        'Human error',
        'System failures',
        'Resource constraints',
        'Quality issues',
      ],
      mitigationStrategies: [
        'Implement process standardization',
        'Provide comprehensive training',
        'Establish monitoring systems',
        'Create backup procedures',
        'Regular quality audits',
      ],
      controls: [
        'Standard Operating Procedures (SOPs)',
        'Training programs',
        'Quality control checkpoints',
        'Incident response procedures',
        'Performance monitoring',
      ],
    });

    this.riskTemplates.set('financial', {
      category: 'Financial',
      commonFactors: [
        'Market volatility',
        'Credit risk',
        'Liquidity constraints',
        'Foreign exchange fluctuations',
        'Interest rate changes',
      ],
      mitigationStrategies: [
        'Diversify investment portfolio',
        'Implement hedging strategies',
        'Maintain adequate reserves',
        'Regular financial monitoring',
        'Stress testing',
      ],
      controls: [
        'Financial policies and procedures',
        'Segregation of duties',
        'Regular reconciliations',
        'Independent reviews',
        'Risk limits and thresholds',
      ],
    });

    this.riskTemplates.set('technology', {
      category: 'Technology',
      commonFactors: [
        'Cybersecurity threats',
        'System outages',
        'Data breaches',
        'Legacy system issues',
        'Integration challenges',
      ],
      mitigationStrategies: [
        'Implement cybersecurity framework',
        'Regular system updates',
        'Data backup and recovery',
        'Security awareness training',
        'Third-party security assessments',
      ],
      controls: [
        'Access controls and authentication',
        'Network security monitoring',
        'Data encryption',
        'Incident response plan',
        'Regular security testing',
      ],
    });

    this.riskTemplates.set('compliance', {
      category: 'Compliance',
      commonFactors: [
        'Regulatory changes',
        'Non-compliance penalties',
        'Audit findings',
        'Policy gaps',
        'Training deficiencies',
      ],
      mitigationStrategies: [
        'Regular compliance monitoring',
        'Legal and regulatory updates',
        'Policy reviews and updates',
        'Compliance training programs',
        'Internal audit functions',
      ],
      controls: [
        'Compliance management system',
        'Regular policy reviews',
        'Training and awareness programs',
        'Monitoring and reporting',
        'Corrective action procedures',
      ],
    });
  }

  private initializeStaticResponses(): void {
    this.staticResponses.set(
      'risk_assessment',
      `
Risk assessment is a systematic process of identifying, analyzing, and evaluating risks that could affect your organization's objectives. Here's a basic framework:

1. **Risk Identification**: Identify potential risks across all business areas
2. **Risk Analysis**: Assess the likelihood and impact of each risk
3. **Risk Evaluation**: Determine risk significance and prioritization
4. **Risk Treatment**: Develop strategies to manage identified risks
5. **Monitoring**: Continuously monitor and review risks

For detailed guidance, please refer to your organization's risk management policy or contact the risk management team.
    `
    );

    this.staticResponses.set(
      'control_framework',
      `
Control frameworks provide structured approaches to managing risks. Common frameworks include:

- **COSO**: Comprehensive framework for internal controls
- **ISO 27001**: Information security management
- **NIST**: Cybersecurity framework
- **SOX**: Financial reporting controls

Each framework provides specific guidance on control design, implementation, and monitoring.
    `
    );

    this.staticResponses.set(
      'compliance_help',
      `
For compliance-related questions:

1. Review relevant regulatory requirements
2. Check current policies and procedures
3. Consult with legal or compliance team
4. Review recent audit findings
5. Contact external advisors if needed

Common compliance frameworks include SOC 2, ISO 27001, GDPR, and industry-specific regulations.
    `
    );
  }

  private initializeOfflineKnowledge(): void {
    this.offlineKnowledgeBase.set('risk matrix', {
      content: `Risk matrices help evaluate risks by plotting likelihood against impact:
      
- **High Impact + High Likelihood**: Critical risks requiring immediate attention
- **High Impact + Low Likelihood**: Significant risks needing contingency plans  
- **Low Impact + High Likelihood**: Operational risks requiring management
- **Low Impact + Low Likelihood**: Minimal risks for monitoring

Use a 5x5 matrix for detailed analysis or 3x3 for simplified assessment.`,
      confidence: 0.9,
      actionable: true,
    });

    this.offlineKnowledgeBase.set('control testing', {
      content: `Control testing verifies control effectiveness:

**Types of Tests**:
1. **Design Testing**: Verify controls are properly designed
2. **Operating Effectiveness**: Test if controls work in practice
3. **Compliance Testing**: Ensure controls meet requirements

**Testing Methods**:
- Inquiry and observation
- Document examination
- Re-performance
- Data analytics`,
      confidence: 0.85,
      actionable: true,
    });
  }

  private generateRiskAnalysisFromTemplate(risk: Risk, template: RiskTemplate): string {
    return `
**Risk Analysis: ${risk.title}**

**Category**: ${template.category}

**Common Risk Factors in ${template.category} Category**:
${template.commonFactors.map((factor) => `• ${factor}`).join('\n')}

**Recommended Mitigation Strategies**:
${template.mitigationStrategies.map((strategy) => `• ${strategy}`).join('\n')}

**Suggested Controls**:
${template.controls.map((control) => `• ${control}`).join('\n')}

**Current Risk Details**:
- Likelihood: ${risk.likelihood}/5
- Impact: ${risk.impact}/5
- Risk Score: ${risk.riskScore}

**Recommendations**:
Based on the risk score of ${risk.riskScore}, this risk should be ${this.getRiskPriority(risk.riskScore)}.
    `;
  }

  private generateControlRecommendationsFromTemplate(risk: Risk, template: RiskTemplate): string {
    return `
**Control Recommendations for: ${risk.title}**

**Primary Controls**:
${template.controls.map((control, index) => `${index + 1}. ${control}`).join('\n')}

**Implementation Priority**:
Given the risk score of ${risk.riskScore}, implement controls in this order:
1. **Immediate**: Critical preventive controls
2. **Short-term**: Detective controls and monitoring
3. **Medium-term**: Corrective controls and process improvements

**Control Effectiveness Factors**:
- Regular testing and validation
- Clear roles and responsibilities
- Adequate resources and training
- Continuous monitoring and improvement
    `;
  }

  private generateBasicRiskAnalysis(risk: Risk): string {
    return `
**Basic Risk Analysis: ${risk.title}**

**Risk Information**:
- Category: ${risk.category}
- Likelihood: ${risk.likelihood}/5
- Impact: ${risk.impact}/5
- Current Status: ${risk.status}
- Risk Score: ${risk.riskScore}

**Priority Level**: ${this.getRiskPriority(risk.riskScore)}

**General Recommendations**:
1. Monitor risk regularly
2. Review existing controls
3. Consider additional mitigation measures
4. Update risk assessment as needed

For detailed analysis and specific recommendations, please use the AI-powered risk analysis feature when available.
    `;
  }

  private generateBasicControlRecommendations(risk: Risk): string {
    return `
**Basic Control Recommendations: ${risk.title}**

**Standard Control Categories**:
1. **Preventive Controls**: Prevent risk occurrence
2. **Detective Controls**: Identify risk events
3. **Corrective Controls**: Respond to risk events

**Implementation Steps**:
1. Assess current control environment
2. Identify control gaps
3. Design appropriate controls
4. Implement and test controls
5. Monitor control effectiveness

**Next Steps**:
- Consult risk management policies
- Review industry best practices
- Consider regulatory requirements
- Plan control implementation timeline
    `;
  }

  private getRiskPriority(riskScore: number): string {
    if (riskScore >= 15) return 'Critical Priority - Immediate action required';
    if (riskScore >= 10) return 'High Priority - Action required within 30 days';
    if (riskScore >= 6) return 'Medium Priority - Action required within 90 days';
    return 'Low Priority - Monitor and review regularly';
  }

  private categorizeQuery(query: string): string {
    const queryLower = query.toLowerCase();

    if (
      queryLower.includes('risk') &&
      (queryLower.includes('assess') || queryLower.includes('analysis'))
    ) {
      return 'risk_assessment';
    }
    if (
      queryLower.includes('control') &&
      (queryLower.includes('framework') || queryLower.includes('standard'))
    ) {
      return 'control_framework';
    }
    if (queryLower.includes('compliance') || queryLower.includes('regulatory')) {
      return 'compliance_help';
    }

    return 'general';
  }

  private extractKeywords(query: string): string[] {
    const words = query.toLowerCase().split(/\s+/);
    const keywords = words.filter(
      (word) =>
        word.length > 3 &&
        !['the', 'and', 'but', 'for', 'are', 'with', 'this', 'that', 'what', 'how'].includes(word)
    );
    return keywords;
  }

  private getGenericFallbackResponse(): string {
    return `
I apologize, but AI assistance is currently unavailable. Here are some alternative resources:

**Immediate Help**:
- Check the knowledge base for common questions
- Review your organization's risk management policies
- Contact your risk management team
- Use manual assessment tools

**Documentation Resources**:
- Risk management framework documentation
- Compliance requirements and guidelines
- Control implementation guides
- Emergency procedures manual

**Contact Information**:
- Support Team: Available for immediate assistance
- Risk Management: For specialized guidance
- Compliance Team: For regulatory questions

Please try again later as AI services are typically restored within 30 minutes.
    `;
  }
}
