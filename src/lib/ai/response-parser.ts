import { RiskAnalysis, ControlRecommendation } from '@/types/ai.types';
import { Risk, Control } from '@/types';

export interface ParsedResponse<T = any> {
  success: boolean;
  data: T | null;
  error?: string;
  confidence?: number;
}

// Response parsing utilities for AI-generated content
export class ResponseParser {
  /**
   * Parse JSON response from AI with fallback handling
   */
  static parseJSON<T>(response: string): ParsedResponse<T> {
    try {
      // Clean response - remove markdown code blocks if present
      const cleanedResponse = this.cleanResponse(response);
      
      // Try to parse as JSON
      const data = JSON.parse(cleanedResponse);
      
      return {
        success: true,
        data,
        confidence: 0.9
      };
    } catch (error) {
      // Attempt to extract JSON from within the response
      const extractedJSON = this.extractJSON(response);
      
      if (extractedJSON) {
        try {
          const data = JSON.parse(extractedJSON);
          return {
            success: true,
            data,
            confidence: 0.7
          };
        } catch (e) {
          // JSON extraction failed
        }
      }
      
      return {
        success: false,
        data: null,
        error: `Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 0
      };
    }
  }

  /**
   * Parse risk analysis response
   */
  static parseRiskAnalysis(response: string): ParsedResponse<any> {
    const jsonResult = this.parseJSON(response);
    
    if (jsonResult.success) {
      return jsonResult;
    }
    
    // Fallback parsing for non-JSON responses
    try {
      const fallbackData = {
        riskScore: this.extractNumber(response, /risk\s*score[:\s]*(\d+(?:\.\d+)?)/i) || 50,
        confidenceLevel: this.extractNumber(response, /confidence[:\s]*(\d+(?:\.\d+)?)/i) || 0.7,
        riskLevel: this.extractRiskLevel(response) || 'MEDIUM',
        analysis: {
          likelihood: this.extractNumber(response, /likelihood[:\s]*(\d+(?:\.\d+)?)/i) || 3,
          impact: this.extractNumber(response, /impact[:\s]*(\d+(?:\.\d+)?)/i) || 3,
          factors: this.extractList(response, /factors?[:\s]*\n?([^:]*?)(?:\n\n|\n[A-Z]|$)/i),
          recommendations: this.extractList(response, /recommendations?[:\s]*\n?([^:]*?)(?:\n\n|\n[A-Z]|$)/i),
          mitigationStrategies: this.extractList(response, /mitigation[:\s]*\n?([^:]*?)(?:\n\n|\n[A-Z]|$)/i)
        },
        complianceImpact: {
          frameworks: this.extractList(response, /frameworks?[:\s]*\n?([^:]*?)(?:\n\n|\n[A-Z]|$)/i),
          requirements: this.extractList(response, /requirements?[:\s]*\n?([^:]*?)(?:\n\n|\n[A-Z]|$)/i),
          severity: this.extractRiskLevel(response) || 'MEDIUM'
        }
      };
      
      return {
        success: true,
        data: fallbackData,
        confidence: 0.5
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Failed to parse risk analysis: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Parse control recommendations response
   */
  static parseControlRecommendations(response: string): ParsedResponse<any[]> {
    const jsonResult = this.parseJSON<any[]>(response);
    
    if (jsonResult.success && Array.isArray(jsonResult.data)) {
      return jsonResult;
    }
    
    // Fallback parsing
    try {
      const recommendations: any[] = [];
      const controlBlocks = response.split(/(?:control|recommendation)\s*\d*[:\-]/gi);
      
      for (let i = 1; i < controlBlocks.length && i <= 5; i++) {
        const block = controlBlocks[i];
        const recommendation = {
          id: `ctrl-${i}`,
          title: this.extractTitle(block) || `Control Recommendation ${i}`,
          description: this.extractDescription(block) || block.trim().substring(0, 200),
          type: this.extractControlType(block) || 'PREVENTIVE',
          category: this.extractCategory(block) || 'General',
          priority: i,
          implementationComplexity: this.extractComplexity(block) || 'MEDIUM',
          estimatedCost: this.extractCost(block) || 'Medium',
          effectiveness: this.extractNumber(block, /effectiveness[:\s]*(\d+(?:\.\d+)?)/i) || (10 - i),
          reasoning: this.extractReasoning(block) || 'AI-generated recommendation',
          dependencies: this.extractList(block, /dependencies?[:\s]*([^:]*?)(?:\n\n|\n[A-Z]|$)/i),
          metrics: this.extractList(block, /metrics?[:\s]*([^:]*?)(?:\n\n|\n[A-Z]|$)/i)
        };
        
        recommendations.push(recommendation);
      }
      
      return {
        success: true,
        data: recommendations,
        confidence: 0.6
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Failed to parse control recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Parse compliance gaps response
   */
  static parseComplianceGaps(response: string): ParsedResponse<any[]> {
    const jsonResult = this.parseJSON<any[]>(response);
    
    if (jsonResult.success && Array.isArray(jsonResult.data)) {
      return jsonResult;
    }
    
    // Fallback parsing
    try {
      const gaps: any[] = [];
      const gapBlocks = response.split(/gap\s*\d*[:\-]/gi);
      
      for (let i = 1; i < gapBlocks.length && i <= 10; i++) {
        const block = gapBlocks[i];
        const gap = {
          framework: this.extractFramework(block) || 'Unknown Framework',
          requirement: this.extractRequirement(block) || `Requirement ${i}`,
          currentStatus: this.extractCurrentStatus(block) || 'Partially implemented',
          gapDescription: this.extractDescription(block) || block.trim().substring(0, 200),
          severity: this.extractSeverity(block) || 'MEDIUM',
          recommendedActions: this.extractList(block, /actions?[:\s]*([^:]*?)(?:\n\n|\n[A-Z]|$)/i),
          timeline: this.extractTimeline(block) || `${i * 2}-${i * 3} months`,
          resources: this.extractList(block, /resources?[:\s]*([^:]*?)(?:\n\n|\n[A-Z]|$)/i)
        };
        
        gaps.push(gap);
      }
      
      return {
        success: true,
        data: gaps,
        confidence: 0.6
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Failed to parse compliance gaps: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Parse chat response with intent classification
   */
  static parseChatResponse(response: string, intent?: any, contextData?: any): ParsedResponse<any> {
    try {
      const chatResponse = {
        message: response.trim(),
        type: this.classifyResponseType(response),
        data: contextData || null,
        followUpQuestions: this.extractFollowUpQuestions(response),
        actions: this.extractActions(response)
      };
      
      return {
        success: true,
        data: chatResponse,
        confidence: 0.8
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Failed to parse chat response: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Parse trend predictions response
   */
  static parseTrendPredictions(response: string): ParsedResponse<any> {
    const jsonResult = this.parseJSON(response);
    
    if (jsonResult.success) {
      return jsonResult;
    }
    
    // Fallback parsing
    try {
      const fallbackData = {
        trends: this.extractTrends(response),
        insights: this.extractList(response, /insights?[:\s]*([^:]*?)(?:\n\n|\n[A-Z]|$)/i),
        recommendations: this.extractList(response, /recommendations?[:\s]*([^:]*?)(?:\n\n|\n[A-Z]|$)/i),
        alerts: this.extractAlerts(response)
      };
      
      return {
        success: true,
        data: fallbackData,
        confidence: 0.5
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Failed to parse trend predictions: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Helper methods for extraction

  private static cleanResponse(response: string): string {
    // Remove markdown code blocks
    let cleaned = response.replace(/```(?:json|javascript)?\n?([\s\S]*?)\n?```/g, '$1');
    
    // Remove leading/trailing whitespace
    cleaned = cleaned.trim();
    
    // Remove any explanatory text before JSON
    const jsonStart = cleaned.search(/[{\[]/);
    if (jsonStart > 0) {
      cleaned = cleaned.substring(jsonStart);
    }
    
    return cleaned;
  }

  private static extractJSON(response: string): string | null {
    // Try to find JSON objects or arrays in the response
    const jsonMatches = response.match(/[{\[][\s\S]*[}\]]/g);
    
    if (jsonMatches && jsonMatches.length > 0) {
      // Return the largest JSON-like string
      return jsonMatches.reduce((a, b) => a.length > b.length ? a : b);
    }
    
    return null;
  }

  private static extractNumber(text: string, regex: RegExp): number | null {
    const match = text.match(regex);
    return match ? parseFloat(match[1]) : null;
  }

  private static extractRiskLevel(text: string): string | null {
    const levels = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    const lowerText = text.toLowerCase();
    
    for (const level of levels) {
      if (lowerText.includes(level.toLowerCase())) {
        return level;
      }
    }
    
    return null;
  }

  private static extractList(text: string, regex: RegExp): string[] {
    const match = text.match(regex);
    if (!match || !match[1]) return [];
    
    const listText = match[1].trim();
    const items = listText
      .split(/\n|•|-|\d+\./)
      .map(item => item.trim())
      .filter(item => item.length > 0 && !item.match(/^[:\-•\d\s]*$/));
    
    return items.slice(0, 5); // Limit to 5 items
  }

  private static extractTitle(text: string): string | null {
    const lines = text.trim().split('\n');
    const firstLine = lines[0]?.trim();
    
    if (firstLine && firstLine.length > 0 && firstLine.length < 100) {
      return firstLine.replace(/^[:\-•\d\s]*/, '').trim();
    }
    
    return null;
  }

  private static extractDescription(text: string): string | null {
    const lines = text.trim().split('\n');
    const description = lines.slice(0, 3).join(' ').trim();
    
    return description.length > 10 ? description.substring(0, 200) : null;
  }

  private static extractControlType(text: string): string {
    const types = ['PREVENTIVE', 'DETECTIVE', 'CORRECTIVE'];
    const lowerText = text.toLowerCase();
    
    for (const type of types) {
      if (lowerText.includes(type.toLowerCase())) {
        return type;
      }
    }
    
    return 'PREVENTIVE';
  }

  private static extractCategory(text: string): string {
    const categories = ['Technical', 'Administrative', 'Physical', 'Automated', 'Manual'];
    const lowerText = text.toLowerCase();
    
    for (const category of categories) {
      if (lowerText.includes(category.toLowerCase())) {
        return category;
      }
    }
    
    return 'General';
  }

  private static extractComplexity(text: string): string {
    const complexities = ['HIGH', 'MEDIUM', 'LOW'];
    const lowerText = text.toLowerCase();
    
    for (const complexity of complexities) {
      if (lowerText.includes(`${complexity.toLowerCase()} complexity`)) {
        return complexity;
      }
    }
    
    return 'MEDIUM';
  }

  private static extractCost(text: string): string {
    const costs = ['High', 'Medium', 'Low'];
    const lowerText = text.toLowerCase();
    
    for (const cost of costs) {
      if (lowerText.includes(`${cost.toLowerCase()} cost`)) {
        return cost;
      }
    }
    
    return 'Medium';
  }

  private static extractReasoning(text: string): string | null {
    const reasoningMatch = text.match(/(?:reasoning|rationale|because)[:\s]*([^:]*?)(?:\n\n|\n[A-Z]|$)/i);
    return reasoningMatch ? reasoningMatch[1].trim() : null;
  }

  private static extractFramework(text: string): string | null {
    const frameworks = ['ISO 27001', 'SOC 2', 'NIST', 'PCI DSS', 'GDPR', 'HIPAA'];
    const lowerText = text.toLowerCase();
    
    for (const framework of frameworks) {
      if (lowerText.includes(framework.toLowerCase())) {
        return framework;
      }
    }
    
    return null;
  }

  private static extractRequirement(text: string): string | null {
    const reqMatch = text.match(/requirement[:\s]*([^:]*?)(?:\n\n|\n[A-Z]|$)/i);
    return reqMatch ? reqMatch[1].trim() : null;
  }

  private static extractCurrentStatus(text: string): string | null {
    const statusMatch = text.match(/(?:current|status)[:\s]*([^:]*?)(?:\n\n|\n[A-Z]|$)/i);
    return statusMatch ? statusMatch[1].trim() : null;
  }

  private static extractSeverity(text: string): string {
    const severities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    const lowerText = text.toLowerCase();
    
    for (const severity of severities) {
      if (lowerText.includes(`${severity.toLowerCase()} severity`)) {
        return severity;
      }
    }
    
    return 'MEDIUM';
  }

  private static extractTimeline(text: string): string | null {
    const timelineMatch = text.match(/timeline[:\s]*([^:]*?)(?:\n\n|\n[A-Z]|$)/i);
    return timelineMatch ? timelineMatch[1].trim() : null;
  }

  private static classifyResponseType(response: string): string {
    const lowerResponse = response.toLowerCase();
    
    if (lowerResponse.includes('chart') || lowerResponse.includes('graph')) {
      return 'chart';
    } else if (lowerResponse.includes('recommend') || lowerResponse.includes('suggest')) {
      return 'recommendation';
    } else if (lowerResponse.includes('data') || lowerResponse.includes('show')) {
      return 'data';
    } else {
      return 'text';
    }
  }

  private static extractFollowUpQuestions(response: string): string[] {
    const defaultQuestions = [
      'Would you like more details about any specific aspect?',
      'Do you need help with implementation?',
      'What other areas would you like to explore?'
    ];
    
    // Try to extract questions from response
    const questionMatches = response.match(/\?[^?]*$/g);
    if (questionMatches && questionMatches.length > 0) {
      return questionMatches.slice(0, 3);
    }
    
    return defaultQuestions.slice(0, 2);
  }

  private static extractActions(response: string): Array<{ label: string; action: string; parameters?: any }> {
    const actions: Array<{ label: string; action: string; parameters?: any }> = [];
    
    if (response.toLowerCase().includes('analyze')) {
      actions.push({
        label: 'Analyze Risk',
        action: 'analyze_risk'
      });
    }
    
    if (response.toLowerCase().includes('recommend')) {
      actions.push({
        label: 'Get Recommendations',
        action: 'get_recommendations'
      });
    }
    
    return actions;
  }

  private static extractTrends(response: string): any[] {
    // Simple trend extraction - would be enhanced based on actual response patterns
    return [
      {
        category: 'Overall Risk',
        direction: 'stable',
        confidence: 0.8,
        description: 'Risk levels have remained relatively stable',
        predictions: []
      }
    ];
  }

  private static extractAlerts(response: string): any[] {
    // Simple alert extraction - would be enhanced based on actual response patterns
    const alerts: any[] = [];
    
    if (response.toLowerCase().includes('critical') || response.toLowerCase().includes('urgent')) {
      alerts.push({
        type: 'emerging_risk',
        description: 'Critical issue identified',
        severity: 'high',
        recommendedActions: ['Immediate assessment required']
      });
    }
    
    return alerts;
  }
}