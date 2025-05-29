import {
  QualityScore,
  ContentImprovement,
  StyleGuide,
  ComplianceValidation,
  QualityDimensions,
  QualityBenchmarks,
  ContentType,
  ComplianceFramework,
  FrameworkValidation,
  ComplianceViolation,
  ComplianceRecommendation
} from '@/types/risk-intelligence.types';
import { generateId } from '@/lib/utils';

export class ContentQualityService {
  private readonly aiService: AIContentService;
  private readonly benchmarkService: BenchmarkService;
  private readonly complianceService: ComplianceService;
  private readonly linguisticService: LinguisticService;

  constructor(
    aiService: AIContentService,
    benchmarkService: BenchmarkService,
    complianceService: ComplianceService,
    linguisticService: LinguisticService
  ) {
    this.aiService = aiService;
    this.benchmarkService = benchmarkService;
    this.complianceService = complianceService;
    this.linguisticService = linguisticService;
  }

  /**
   * Analyze content quality and provide comprehensive scoring
   */
  async scoreContent(content: string, type: ContentType): Promise<QualityScore> {
    try {
      // Analyze individual quality dimensions
      const dimensions = await this.analyzeQualityDimensions(content, type);
      
      // Calculate overall score
      const overall = this.calculateOverallScore(dimensions);
      
      // Generate improvement suggestions
      const improvements = await this.generateImprovements(content, type, dimensions);
      
      // Get benchmark comparisons
      const benchmarks = await this.getBenchmarks(type, overall);
      
      // Calculate confidence based on content length and complexity
      const confidence = this.calculateConfidence(content, dimensions);
      
      return {
        overall,
        dimensions,
        improvements,
        benchmarks,
        confidence,
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error('Error scoring content:', error);
      throw new Error('Failed to score content quality');
    }
  }

  /**
   * Generate specific content improvements
   */
  async generateImprovements(
    content: string, 
    type: ContentType, 
    dimensions: QualityDimensions
  ): Promise<ContentImprovement[]> {
    try {
      const improvements: ContentImprovement[] = [];
      
      // Check each dimension for improvement opportunities
      if (dimensions.clarity < 75) {
        const clarityImprovements = await this.generateClarityImprovements(content);
        improvements.push(...clarityImprovements);
      }
      
      if (dimensions.completeness < 75) {
        const completenessImprovements = await this.generateCompletenessImprovements(content, type);
        improvements.push(...completenessImprovements);
      }
      
      if (dimensions.consistency < 75) {
        const consistencyImprovements = await this.generateConsistencyImprovements(content);
        improvements.push(...consistencyImprovements);
      }
      
      if (dimensions.conciseness < 75) {
        const concisenessImprovements = await this.generateConcisenessImprovements(content);
        improvements.push(...concisenessImprovements);
      }
      
      if (dimensions.accuracy < 75) {
        const accuracyImprovements = await this.generateAccuracyImprovements(content, type);
        improvements.push(...accuracyImprovements);
      }
      
      // Sort by priority and expected impact
      return improvements.sort((a, b) => {
        const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
        const aScore = priorityWeight[a.priority] * a.expectedImpact;
        const bScore = priorityWeight[b.priority] * b.expectedImpact;
        return bScore - aScore;
      });
      
    } catch (error) {
      console.error('Error generating improvements:', error);
      throw new Error('Failed to generate content improvements');
    }
  }

  /**
   * Standardize content language according to style guide
   */
  async standardizeLanguage(content: string, styleGuide: StyleGuide): Promise<string> {
    try {
      let standardizedContent = content;
      
      // Apply terminology rules
      for (const rule of styleGuide.terminology) {
        if (rule.mandatory) {
          // Replace alternative terms with preferred usage
          for (const alternative of rule.alternatives) {
            const regex = new RegExp(`\\b${alternative}\\b`, 'gi');
            standardizedContent = standardizedContent.replace(regex, rule.preferredUsage);
          }
        }
      }
      
      // Apply formatting rules
      standardizedContent = await this.applyFormattingRules(standardizedContent, styleGuide.formatting);
      
      // Apply structural improvements
      standardizedContent = await this.applyStructuralRules(standardizedContent, styleGuide.structure);
      
      // Adjust tone if needed
      if (styleGuide.tone) {
        standardizedContent = await this.adjustTone(standardizedContent, styleGuide.tone);
      }
      
      return standardizedContent;
      
    } catch (error) {
      console.error('Error standardizing language:', error);
      throw new Error('Failed to standardize content language');
    }
  }

  /**
   * Validate content against compliance frameworks
   */
  async validateCompliance(
    content: string, 
    frameworks: ComplianceFramework[]
  ): Promise<ComplianceValidation> {
    try {
      const frameworkResults: FrameworkValidation[] = [];
      const violations: ComplianceViolation[] = [];
      const recommendations: ComplianceRecommendation[] = [];
      
      // Validate against each framework
      for (const framework of frameworks) {
        const result = await this.validateAgainstFramework(content, framework);
        frameworkResults.push(result);
        
        // Collect violations and recommendations
        violations.push(...result.violations || []);
        recommendations.push(...result.recommendations || []);
      }
      
      // Calculate overall compliance score
      const overallScore = frameworkResults.reduce((sum, result) => sum + result.score, 0) / frameworkResults.length;
      const isCompliant = violations.filter(v => v.severity === 'critical' || v.severity === 'high').length === 0;
      
      return {
        isCompliant,
        overallScore,
        frameworkResults,
        violations,
        recommendations,
        lastValidated: new Date()
      };
      
    } catch (error) {
      console.error('Error validating compliance:', error);
      throw new Error('Failed to validate compliance');
    }
  }

  // Private helper methods
  private async analyzeQualityDimensions(content: string, type: ContentType): Promise<QualityDimensions> {
    // Analyze clarity
    const clarity = await this.analyzeClarity(content);
    
    // Analyze completeness
    const completeness = await this.analyzeCompleteness(content, type);
    
    // Analyze consistency
    const consistency = await this.analyzeConsistency(content);
    
    // Analyze conciseness
    const conciseness = await this.analyzeConciseness(content);
    
    // Analyze accuracy
    const accuracy = await this.analyzeAccuracy(content, type);
    
    // Analyze relevance
    const relevance = await this.analyzeRelevance(content, type);
    
    // Analyze actionability
    const actionability = await this.analyzeActionability(content, type);
    
    // Analyze measurability
    const measurability = await this.analyzeMeasurability(content, type);
    
    return {
      clarity,
      completeness,
      consistency,
      conciseness,
      accuracy,
      relevance,
      actionability,
      measurability
    };
  }

  private calculateOverallScore(dimensions: QualityDimensions): number {
    const weights = {
      clarity: 0.15,
      completeness: 0.15,
      consistency: 0.1,
      conciseness: 0.1,
      accuracy: 0.2,
      relevance: 0.15,
      actionability: 0.1,
      measurability: 0.05
    };
    
    return Math.round(
      dimensions.clarity * weights.clarity +
      dimensions.completeness * weights.completeness +
      dimensions.consistency * weights.consistency +
      dimensions.conciseness * weights.conciseness +
      dimensions.accuracy * weights.accuracy +
      dimensions.relevance * weights.relevance +
      dimensions.actionability * weights.actionability +
      dimensions.measurability * weights.measurability
    );
  }

  private async analyzeClarity(content: string): Promise<number> {
    let score = 100;
    
    // Check readability
    const readabilityScore = await this.linguisticService.calculateReadability(content);
    if (readabilityScore < 60) score -= 20;
    else if (readabilityScore < 75) score -= 10;
    
    // Check for jargon and technical terms
    const jargonDensity = await this.linguisticService.calculateJargonDensity(content);
    if (jargonDensity > 0.2) score -= 15;
    else if (jargonDensity > 0.1) score -= 8;
    
    // Check sentence complexity
    const avgSentenceLength = this.calculateAverageSentenceLength(content);
    if (avgSentenceLength > 25) score -= 10;
    else if (avgSentenceLength > 20) score -= 5;
    
    // Check for passive voice overuse
    const passiveVoicePercentage = await this.linguisticService.calculatePassiveVoice(content);
    if (passiveVoicePercentage > 0.3) score -= 10;
    else if (passiveVoicePercentage > 0.2) score -= 5;
    
    return Math.max(0, score);
  }

  private async analyzeCompleteness(content: string, type: ContentType): Promise<number> {
    let score = 100;
    
    // Check minimum content length
    const wordCount = content.split(/\s+/).length;
    const minWordCount = this.getMinWordCount(type);
    
    if (wordCount < minWordCount * 0.5) score -= 40;
    else if (wordCount < minWordCount * 0.75) score -= 20;
    else if (wordCount < minWordCount) score -= 10;
    
    // Check for required sections based on content type
    const requiredSections = this.getRequiredSections(type);
    const missingSections = requiredSections.filter(section => 
      !content.toLowerCase().includes(section.toLowerCase())
    );
    
    score -= missingSections.length * 10;
    
    // Check for supporting details
    const hasNumbers = /\d+/.test(content);
    const hasReferences = /(\[|\()\d+(\]|\))/.test(content);
    const hasExamples = /(example|instance|case|such as)/i.test(content);
    
    if (!hasNumbers && this.shouldHaveNumbers(type)) score -= 10;
    if (!hasReferences && this.shouldHaveReferences(type)) score -= 10;
    if (!hasExamples && this.shouldHaveExamples(type)) score -= 5;
    
    return Math.max(0, score);
  }

  private async analyzeConsistency(content: string): Promise<number> {
    let score = 100;
    
    // Check terminology consistency
    const terminologyConsistency = await this.linguisticService.checkTerminologyConsistency(content);
    score -= (100 - terminologyConsistency) * 0.3;
    
    // Check formatting consistency
    const formattingConsistency = this.checkFormattingConsistency(content);
    score -= (100 - formattingConsistency) * 0.2;
    
    // Check style consistency
    const styleConsistency = await this.linguisticService.checkStyleConsistency(content);
    score -= (100 - styleConsistency) * 0.2;
    
    return Math.max(0, Math.round(score));
  }

  private async analyzeConciseness(content: string): Promise<number> {
    let score = 100;
    
    // Check for redundant phrases
    const redundancyScore = await this.linguisticService.detectRedundancy(content);
    score -= redundancyScore * 0.5;
    
    // Check for wordiness
    const wordinessScore = await this.linguisticService.detectWordiness(content);
    score -= wordinessScore * 0.3;
    
    // Check sentence efficiency
    const avgWordsPerSentence = this.calculateAverageWordsPerSentence(content);
    if (avgWordsPerSentence > 25) score -= 15;
    else if (avgWordsPerSentence > 20) score -= 8;
    
    return Math.max(0, Math.round(score));
  }

  private async analyzeAccuracy(content: string, type: ContentType): Promise<number> {
    let score = 100;
    
    // Check for factual accuracy (would integrate with fact-checking services)
    const factualAccuracy = await this.aiService.checkFactualAccuracy(content, type);
    score = (score + factualAccuracy) / 2;
    
    // Check for internal consistency
    const internalConsistency = await this.aiService.checkInternalConsistency(content);
    score = (score + internalConsistency) / 2;
    
    // Check for logical flow
    const logicalFlow = await this.aiService.checkLogicalFlow(content);
    score = (score + logicalFlow) / 2;
    
    return Math.max(0, Math.round(score));
  }

  private async analyzeRelevance(content: string, type: ContentType): Promise<number> {
    let score = 100;
    
    // Check topic relevance
    const topicRelevance = await this.aiService.checkTopicRelevance(content, type);
    score = (score + topicRelevance) / 2;
    
    // Check business context relevance
    const businessRelevance = await this.aiService.checkBusinessRelevance(content);
    score = (score + businessRelevance) / 2;
    
    return Math.max(0, Math.round(score));
  }

  private async analyzeActionability(content: string, type: ContentType): Promise<number> {
    let score = 100;
    
    // Check for action verbs
    const actionVerbCount = (content.match(/\b(implement|establish|develop|create|monitor|review|assess|evaluate|ensure|maintain)\b/gi) || []).length;
    const sentenceCount = content.split(/[.!?]+/).length;
    const actionDensity = actionVerbCount / sentenceCount;
    
    if (actionDensity < 0.1 && this.shouldBeActionable(type)) score -= 20;
    else if (actionDensity < 0.2 && this.shouldBeActionable(type)) score -= 10;
    
    // Check for specific instructions
    const hasSpecificInstructions = /\b(step|procedure|process|method|approach)\b/i.test(content);
    if (!hasSpecificInstructions && this.shouldHaveInstructions(type)) score -= 15;
    
    return Math.max(0, score);
  }

  private async analyzeMeasurability(content: string, type: ContentType): Promise<number> {
    let score = 100;
    
    // Check for quantifiable metrics
    const hasMetrics = /\b(\d+%|\d+\.\d+|>=|<=|>|<|\d+\s*(days?|hours?|minutes?|months?|years?))\b/i.test(content);
    if (!hasMetrics && this.shouldBeMeasurable(type)) score -= 20;
    
    // Check for success criteria
    const hasSuccessCriteria = /\b(criteria|measure|indicator|benchmark|target|goal)\b/i.test(content);
    if (!hasSuccessCriteria && this.shouldHaveSuccessCriteria(type)) score -= 15;
    
    return Math.max(0, score);
  }

  private async getBenchmarks(type: ContentType, currentScore: number): Promise<QualityBenchmarks> {
    const benchmarks = await this.benchmarkService.getQualityBenchmarks(type);
    
    return {
      industryStandard: benchmarks.industryAverage || 75,
      organizationAverage: benchmarks.organizationAverage || 70,
      bestPractice: benchmarks.bestPractice || 90,
      complianceMinimum: benchmarks.complianceMinimum || 60
    };
  }

  private calculateConfidence(content: string, dimensions: QualityDimensions): number {
    const contentLength = content.length;
    const wordCount = content.split(/\s+/).length;
    
    // Base confidence on content length
    let confidence = Math.min(95, Math.max(30, (wordCount / 100) * 100));
    
    // Adjust based on dimension consistency
    const dimensionValues = Object.values(dimensions);
    const standardDeviation = this.calculateStandardDeviation(dimensionValues);
    if (standardDeviation < 10) confidence += 5;
    else if (standardDeviation > 20) confidence -= 10;
    
    // Adjust based on content completeness
    if (contentLength < 100) confidence -= 20;
    else if (contentLength < 300) confidence -= 10;
    
    return Math.max(30, Math.min(95, Math.round(confidence)));
  }

  // Improvement generation methods
  private async generateClarityImprovements(content: string): Promise<ContentImprovement[]> {
    const improvements: ContentImprovement[] = [];
    
    // Check for complex sentences
    const sentences = content.split(/[.!?]+/);
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      if (sentence.split(/\s+/).length > 25) {
        improvements.push({
          id: generateId('improvement'),
          type: 'clarity',
          priority: 'medium',
          description: 'Simplify overly complex sentence',
          originalText: sentence,
          suggestedText: await this.aiService.simplifySentence(sentence),
          rationale: 'Long sentences can be difficult to understand',
          expectedImpact: 5,
          confidence: 80
        });
      }
    }
    
    return improvements;
  }

  private async generateCompletenessImprovements(content: string, type: ContentType): Promise<ContentImprovement[]> {
    const improvements: ContentImprovement[] = [];
    const requiredSections = this.getRequiredSections(type);
    
    for (const section of requiredSections) {
      if (!content.toLowerCase().includes(section.toLowerCase())) {
        improvements.push({
          id: generateId('improvement'),
          type: 'completeness',
          priority: 'high',
          description: `Add missing ${section} section`,
          originalText: content,
          suggestedText: `${content}\n\n## ${section}\n[Add ${section} content here]`,
          rationale: `${section} section is required for ${type} content`,
          expectedImpact: 15,
          confidence: 90
        });
      }
    }
    
    return improvements;
  }

  private async generateConsistencyImprovements(content: string): Promise<ContentImprovement[]> {
    const improvements: ContentImprovement[] = [];
    
    // Check for inconsistent terminology
    const terminologyIssues = await this.linguisticService.findTerminologyInconsistencies(content);
    
    for (const issue of terminologyIssues) {
      improvements.push({
        id: generateId('improvement'),
        type: 'consistency',
        priority: 'medium',
        description: `Standardize terminology: ${issue.inconsistentTerm}`,
        originalText: issue.context,
        suggestedText: issue.context.replace(issue.inconsistentTerm, issue.preferredTerm),
        rationale: 'Consistent terminology improves clarity and professionalism',
        expectedImpact: 8,
        confidence: 85
      });
    }
    
    return improvements;
  }

  private async generateConcisenessImprovements(content: string): Promise<ContentImprovement[]> {
    const improvements: ContentImprovement[] = [];
    
    // Find redundant phrases
    const redundantPhrases = await this.linguisticService.findRedundantPhrases(content);
    
    for (const phrase of redundantPhrases) {
      improvements.push({
        id: generateId('improvement'),
        type: 'clarity',
        priority: 'low',
        description: `Remove redundant phrase: "${phrase.redundantText}"`,
        originalText: phrase.context,
        suggestedText: phrase.context.replace(phrase.redundantText, phrase.suggestedText),
        rationale: 'Removing redundancy improves clarity and readability',
        expectedImpact: 3,
        confidence: 75
      });
    }
    
    return improvements;
  }

  private async generateAccuracyImprovements(content: string, type: ContentType): Promise<ContentImprovement[]> {
    const improvements: ContentImprovement[] = [];
    
    // Check for potential inaccuracies
    const accuracyIssues = await this.aiService.findAccuracyIssues(content, type);
    
    for (const issue of accuracyIssues) {
      improvements.push({
        id: generateId('improvement'),
        type: 'clarity',
        priority: issue.severity === 'high' ? 'high' : 'medium',
        description: `Address potential accuracy issue: ${issue.description}`,
        originalText: issue.context,
        suggestedText: issue.suggestedCorrection,
        rationale: issue.rationale,
        expectedImpact: issue.severity === 'high' ? 20 : 10,
        confidence: issue.confidence
      });
    }
    
    return improvements;
  }

  // Helper methods
  private calculateAverageSentenceLength(content: string): number {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const totalWords = content.split(/\s+/).length;
    return totalWords / sentences.length;
  }

  private calculateAverageWordsPerSentence(content: string): number {
    return this.calculateAverageSentenceLength(content);
  }

  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }

  private getMinWordCount(type: ContentType): number {
    const minWords = {
      risk_description: 50,
      control_procedure: 100,
      policy_document: 200,
      assessment_questionnaire: 150,
      incident_report: 80,
      risk_scenario: 75,
      training_material: 300
    };
    return minWords[type] || 100;
  }

  private getRequiredSections(type: ContentType): string[] {
    const sections = {
      risk_description: ['description', 'impact', 'likelihood'],
      control_procedure: ['purpose', 'procedure', 'responsibilities'],
      policy_document: ['purpose', 'scope', 'policy'],
      assessment_questionnaire: ['objective', 'questions'],
      incident_report: ['summary', 'impact', 'response'],
      risk_scenario: ['scenario', 'impact', 'mitigation'],
      training_material: ['objectives', 'content', 'assessment']
    };
    return sections[type] || [];
  }

  private shouldHaveNumbers(type: ContentType): boolean {
    return ['risk_description', 'control_procedure', 'assessment_questionnaire'].includes(type);
  }

  private shouldHaveReferences(type: ContentType): boolean {
    return ['policy_document', 'training_material'].includes(type);
  }

  private shouldHaveExamples(type: ContentType): boolean {
    return ['training_material', 'control_procedure'].includes(type);
  }

  private shouldBeActionable(type: ContentType): boolean {
    return ['control_procedure', 'incident_report', 'training_material'].includes(type);
  }

  private shouldHaveInstructions(type: ContentType): boolean {
    return ['control_procedure', 'training_material'].includes(type);
  }

  private shouldBeMeasurable(type: ContentType): boolean {
    return ['risk_description', 'control_procedure', 'assessment_questionnaire'].includes(type);
  }

  private shouldHaveSuccessCriteria(type: ContentType): boolean {
    return ['control_procedure', 'training_material'].includes(type);
  }

  private checkFormattingConsistency(content: string): number {
    // Simple formatting consistency check
    const headingPattern = /^#+\s/gm;
    const headings = content.match(headingPattern) || [];
    
    // Check if headings follow consistent pattern
    const inconsistentHeadings = headings.filter((heading, index, arr) => {
      if (index === 0) return false;
      const currentLevel = heading.match(/^#+/)?.[0].length || 0;
      const prevLevel = arr[index - 1].match(/^#+/)?.[0].length || 0;
      return Math.abs(currentLevel - prevLevel) > 1;
    });
    
    const consistencyScore = headings.length > 0 ? 
      Math.max(0, 100 - (inconsistentHeadings.length / headings.length * 100)) : 100;
    
    return consistencyScore;
  }

  // Additional helper methods for style guide and compliance
  private async applyFormattingRules(content: string, rules: any[]): Promise<string> {
    let formatted = content;
    
    for (const rule of rules) {
      // Apply formatting rules based on rule configuration
      // This would be more sophisticated in practice
      if (rule.element === 'heading' && rule.requirement === 'title_case') {
        formatted = formatted.replace(/^#+\s+(.+)/gm, (match, title) => {
          const titleCase = title.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
          );
          return match.replace(title, titleCase);
        });
      }
    }
    
    return formatted;
  }

  private async applyStructuralRules(content: string, rules: any[]): Promise<string> {
    // Apply structural rules - simplified implementation
    return content;
  }

  private async adjustTone(content: string, targetTone: string): Promise<string> {
    // Use AI service to adjust tone
    return await this.aiService.adjustTone(content, targetTone);
  }

  private async validateAgainstFramework(content: string, framework: ComplianceFramework): Promise<FrameworkValidation> {
    // Validate content against specific compliance framework
    const violations: ComplianceViolation[] = [];
    const recommendations: ComplianceRecommendation[] = [];
    
    // This would integrate with specific compliance checking logic
    const score = Math.random() * 40 + 60; // Simplified scoring
    const compliant = violations.filter(v => v.severity === 'critical').length === 0;
    
    return {
      frameworkId: framework.id,
      name: framework.name,
      compliant,
      score,
      requirements: [],
      violations,
      recommendations
    };
  }
}

// Supporting service interfaces
interface AIContentService {
  checkFactualAccuracy(content: string, type: ContentType): Promise<number>;
  checkInternalConsistency(content: string): Promise<number>;
  checkLogicalFlow(content: string): Promise<number>;
  checkTopicRelevance(content: string, type: ContentType): Promise<number>;
  checkBusinessRelevance(content: string): Promise<number>;
  simplifySentence(sentence: string): Promise<string>;
  findAccuracyIssues(content: string, type: ContentType): Promise<any[]>;
  adjustTone(content: string, tone: string): Promise<string>;
}

interface BenchmarkService {
  getQualityBenchmarks(type: ContentType): Promise<any>;
}

interface ComplianceService {
  validateContent(content: string, framework: ComplianceFramework): Promise<FrameworkValidation>;
}

interface LinguisticService {
  calculateReadability(content: string): Promise<number>;
  calculateJargonDensity(content: string): Promise<number>;
  calculatePassiveVoice(content: string): Promise<number>;
  checkTerminologyConsistency(content: string): Promise<number>;
  checkStyleConsistency(content: string): Promise<number>;
  detectRedundancy(content: string): Promise<number>;
  detectWordiness(content: string): Promise<number>;
  findTerminologyInconsistencies(content: string): Promise<any[]>;
  findRedundantPhrases(content: string): Promise<any[]>;
}

interface ComplianceFramework {
  id: string;
  name: string;
  requirements: any[];
} 