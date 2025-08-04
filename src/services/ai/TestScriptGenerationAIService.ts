import { db } from '@/lib/db';
// import { AIService } from '@/services/AIService';
import { ProboService } from '@/services/ProboService';
import {
  GenerateTestScriptRequest,
  GenerateTestScriptResponse,
  TestScriptType,
  TestFrequency,
  TestStep,
  Control,
  ControlType,
  ControlCategory,
  AutomationLevel,
} from '@/types/rcsa.types';
// import {
  ParsedTestScript,
  RawTestStep,
  ProboIntegrationResponse,
  ProboEnhancedTestData,
} from '@/types/test-script-generation.types';

// Interface for AI generation context
interface TestScriptGenerationContext {
  controlTitle: string;
  controlDescription: string;
  controlType: ControlType | string;
  controlCategory: ControlCategory | string;
  controlFrequency: string;
  automationLevel: AutomationLevel | string;
  testObjective: string;
  additionalContext: string;
  relatedRisks: string;
}

/**
 * Service for generating test scripts using AI with comprehensive type safety
 * Integrates with Probo service for enhanced control testing guidance
 */
export class TestScriptGenerationAIService {
  private aiService: AIService;
  private proboService: ProboService;

  constructor() {
    this.aiService = new AIService();
    this.proboService = new ProboService();
  }

  /**
   * Generate a comprehensive test script using AI
   * @param request - Test script generation request parameters
   * @param organizationId - Organization ID for multi-tenant isolation
   * @param userId - User ID for tracking and permissions
   * @returns Promise<GenerateTestScriptResponse> with generated test script and metadata
   */
  async generateTestScript(_request: GenerateTestScriptRequest,
    organizationId: string,
    userId: string
  ): Promise<GenerateTestScriptResponse> {
    try {
      // Fetch control details if not provided
      let control: Control | null = null;
      let _controlDescription = request.controlDescription;

      if (request.controlId) {
        control = await db.control.findFirst({
          where: {
            id: request.controlId,
            organizationId,
          },
          include: {
            risks: {
              include: {
                risk: true,
              },
            },
          },
        });

        if (!control) {
          throw new Error('Control not found');
        }

        controlDescription = controlDescription || control.description;
      }

      // Prepare context for AI generation
      const context = this.prepareContext(control, request);

      // Generate test script using AI
      const _prompt = this.buildPrompt(context);
      const systemPrompt = this.getSystemPrompt();

      const aiResponse = await this.aiService.generateContent({
        type: 'test_script_generation',
        context: {
          prompt,
          systemPrompt,
          temperature: 0.7,
          maxTokens: 2000,
          controlContext: context,
        },
        requirements: `Generate a comprehensive test script based on the provided control information. ${prompt}`,
        userId,
        organizationId,
      });

      // Track token usage
      if (aiResponse.usage) {
        await this.trackTokenUsage(
          userId,
          organizationId,
          aiResponse.usage,
          'test-script-generation'
        );
      }

      // Parse AI response into structured test script
      const parsedScript = this.parseAIResponse(aiResponse.content);

      // Enhance with Probo controls data if available
      if (control && this.proboService) {
        const enhancements = await this.enhanceWithProboData(control, parsedScript);
        if (enhancements) {
          parsedScript.steps = [...parsedScript.steps, ...enhancements.additionalSteps];
          parsedScript.suggestions = enhancements.suggestions;
        }
      }

      // Calculate confidence score
      const confidence = this.calculateConfidence(parsedScript, control);

      return {
        testScript: parsedScript,
        confidence,
        reasoning: `Generated test script based on ${control ? 'control details' : 'provided context'} with ${parsedScript.steps.length} test steps.`,
        suggestions: parsedScript.suggestions || [],
      };
    } catch (error) {
      // console.error('Test script generation error:', error);
      throw error;
    }
  }

  private prepareContext(
    control: Control | null,
    request: GenerateTestScriptRequest
  ): TestScriptGenerationContext {
    return {
      controlTitle: control?.title || 'Control',
      controlDescription: request.controlDescription || control?.description || '',
      controlType: control?.type || 'DETECTIVE',
      controlCategory: control?.category || 'OPERATIONAL',
      controlFrequency: control?.frequency || 'Monthly',
      automationLevel: control?.automationLevel || 'MANUAL',
      testObjective: request.testObjective || 'Verify control effectiveness',
      additionalContext: request.additionalContext || '',
      relatedRisks: control?.risks?.map((r) => r.risk.title).join(', ') || 'General risks',
    };
  }

  private buildPrompt(_context: TestScriptGenerationContext): string {
    return `Generate a comprehensive test script for the following control:

Control Title: ${context.controlTitle}
Control Description: ${context.controlDescription}
Control Type: ${context.controlType}
Control Category: ${context.controlCategory}
Control Frequency: ${context.controlFrequency}
Automation Level: ${context.automationLevel}
Test Objective: ${context.testObjective}
Related Risks: ${context.relatedRisks}
Additional Context: ${context.additionalContext}

Please generate a detailed test script with the following structure:
1. Test Script Title (clear and descriptive)
2. Test Script Description (purpose and scope)
3. Test Type (MANUAL, AUTOMATED, HYBRID, INQUIRY, OBSERVATION, INSPECTION, or REPERFORMANCE)
4. Recommended Frequency (DAILY, WEEKLY, MONTHLY, QUARTERLY, SEMI_ANNUAL, ANNUAL, AD_HOC, or CONTINUOUS)
5. Estimated Duration in minutes
6. Test Steps (array of steps with order, description, expected result, data required, and notes)
7. Expected Overall Results
8. Whether the test can be automated (true/false)
9. Suggestions for improving the test or control

Format the response as JSON with the following structure:
{
  "title": "string",
  "description": "string",
  "testType": "string",
  "frequency": "string",
  "estimatedDuration": number,
  "steps": [
    {
      "order": number,
      "description": "string",
      "expectedResult": "string",
      "dataRequired": "string (optional)",
      "notes": "string (optional)"
    }
  ],
  "expectedResults": "string",
  "automationCapable": boolean,
  "suggestions": ["string"]
}`;
  }

  private getSystemPrompt(): string {
    return `You are an expert in control testing and compliance. Your role is to generate comprehensive, practical test scripts that effectively validate control effectiveness. 

Key principles:
1. Test steps should be clear, specific, and actionable
2. Expected results must be measurable and verifiable
3. Consider both positive and negative test scenarios
4. Include data validation and exception handling steps
5. Recommend appropriate test frequencies based on risk and control criticality
6. Identify opportunities for test automation where feasible
7. Ensure tests align with industry standards and best practices

Always provide practical, implementable test scripts that auditors and control owners can execute effectively.`;
  }

  /**
   * Parse AI response content into a structured test script
   * @param content - Raw AI response content
   * @returns ParsedTestScript - Normalized and validated test script
   */
  private parseAIResponse(_content: string): ParsedTestScript {
    try {
      // Try to parse as JSON first
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return this.validateAndNormalizeTestScript(parsed);
      }

      // Fallback: extract information from text
      return this.extractFromText(content);
    } catch (error) {
      // console.error('Failed to parse AI response:', error);
      return this.getDefaultTestScript();
    }
  }

  private validateAndNormalizeTestScript(parsed: any): ParsedTestScript {
    // Validate required fields
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid test script data: expected object');
    }

    // Validate and normalize steps
    const rawSteps: RawTestStep[] = Array.isArray(parsed.steps)
      ? parsed.steps.map((step: any) => ({
          order: step.order,
          description: step.description,
          expectedResult: step.expectedResult,
          dataRequired: step.dataRequired,
          notes: step.notes,
          duration: step.duration,
          assignee: step.assignee,
          validationCriteria: step.validationCriteria,
          riskLevel: step.riskLevel,
          isOptional: step.isOptional,
          dependencies: step.dependencies,
        }))
      : [];

    return {
      title: this.validateString(parsed.title, 'Generated Test Script'),
      description: this.validateString(parsed.description, 'AI-generated test script'),
      objective: parsed.objective,
      testType: this.normalizeTestType(parsed.testType),
      frequency: this.normalizeFrequency(parsed.frequency),
      estimatedDuration: this.validateNumber(parsed.estimatedDuration, 30),
      steps: this.normalizeSteps(rawSteps),
      expectedResults: this.validateString(parsed.expectedResults, 'Control operating effectively'),
      automationCapable: Boolean(parsed.automationCapable),
      automationScript: parsed.automationScript,
      tags: this.validateTags(parsed.tags),
      prerequisites: this.validateStringArray(parsed.prerequisites),
      assumptions: this.validateStringArray(parsed.assumptions),
      scope: parsed.scope,
      expectedOutcomes: this.validateStringArray(parsed.expectedOutcomes),
      successCriteria: this.validateStringArray(parsed.successCriteria),
      dataRequirements: this.validateStringArray(parsed.dataRequirements),
      tools: this.validateStringArray(parsed.tools),
      timeline: parsed.timeline,
      suggestions: this.validateStringArray(parsed.suggestions),
    };
  }

  private normalizeTestType(_type: string): TestScriptType {
    const typeMap: Record<string, TestScriptType> = {
      MANUAL: TestScriptType.MANUAL,
      AUTOMATED: TestScriptType.AUTOMATED,
      HYBRID: TestScriptType.HYBRID,
      INQUIRY: TestScriptType.INQUIRY,
      OBSERVATION: TestScriptType.OBSERVATION,
      INSPECTION: TestScriptType.INSPECTION,
      REPERFORMANCE: TestScriptType.REPERFORMANCE,
    };

    return typeMap[type?.toUpperCase()] || TestScriptType.MANUAL;
  }

  private normalizeFrequency(frequency: string): TestFrequency {
    const freqMap: Record<string, TestFrequency> = {
      DAILY: TestFrequency.DAILY,
      WEEKLY: TestFrequency.WEEKLY,
      MONTHLY: TestFrequency.MONTHLY,
      QUARTERLY: TestFrequency.QUARTERLY,
      SEMI_ANNUAL: TestFrequency.SEMI_ANNUAL,
      ANNUAL: TestFrequency.ANNUAL,
      AD_HOC: TestFrequency.AD_HOC,
      CONTINUOUS: TestFrequency.CONTINUOUS,
    };

    return freqMap[frequency?.toUpperCase()] || TestFrequency.MONTHLY;
  }

  /**
   * Normalize raw test steps into standardized format
   * @param steps - Raw steps from AI response
   * @returns Array of normalized test steps without IDs
   */
  private normalizeSteps(steps: RawTestStep[]): Omit<TestStep, 'id'>[] {
    if (!Array.isArray(steps) || steps.length === 0) {
      return this.getDefaultSteps();
    }

    return steps.map((step, index) => ({
      order: step.order || index + 1,
      description: step.description || `Step ${index + 1}`,
      expectedResult: step.expectedResult || 'Step completed successfully',
      dataRequired: step.dataRequired,
      notes: step.notes,
    }));
  }

  private extractFromText(_content: string): ParsedTestScript {
    // Basic text extraction logic
    const lines = content.split('\n');
    const title =
      lines
        .find((l) => l.includes('Title:'))
        ?.replace(/Title:/i, '')
        .trim() || 'Generated Test Script';
    const description =
      lines
        .find((l) => l.includes('Description:'))
        ?.replace(/Description:/i, '')
        .trim() || 'AI-generated test script';

    return {
      title,
      description,
      testType: TestScriptType.MANUAL,
      frequency: TestFrequency.MONTHLY,
      estimatedDuration: 30,
      steps: this.getDefaultSteps(),
      expectedResults: 'Control operating effectively',
      automationCapable: false,
      tags: ['ai-generated'],
      suggestions: [],
    };
  }

  private getDefaultTestScript(): ParsedTestScript {
    return {
      title: 'Generated Test Script',
      description: 'Please review and customize this AI-generated test script',
      testType: TestScriptType.MANUAL,
      frequency: TestFrequency.MONTHLY,
      estimatedDuration: 30,
      steps: this.getDefaultSteps(),
      expectedResults: 'Control operating effectively',
      automationCapable: false,
      tags: ['ai-generated', 'needs-review'],
      suggestions: [
        'Review and customize test steps',
        'Add specific data requirements',
        'Define clear pass/fail criteria',
      ],
    };
  }

  private getDefaultSteps(): Omit<TestStep, 'id'>[] {
    return [
      {
        order: 1,
        description: 'Review control documentation and procedures',
        expectedResult: 'Documentation is current and complete',
        dataRequired: 'Control documentation, procedures',
        notes: 'Verify version control and approval status',
      },
      {
        order: 2,
        description: 'Select sample for testing',
        expectedResult: 'Representative sample selected based on risk',
        dataRequired: 'Population data, sampling criteria',
        notes: 'Document sampling methodology',
      },
      {
        order: 3,
        description: 'Execute test procedures',
        expectedResult: 'Control operates as designed',
        dataRequired: 'Test data, system access',
        notes: 'Document any deviations or exceptions',
      },
      {
        order: 4,
        description: 'Document results and findings',
        expectedResult: 'Complete test documentation',
        dataRequired: 'Test results, evidence',
        notes: 'Include screenshots or supporting evidence',
      },
    ];
  }

  /**
   * Enhance test script with Probo control testing guidance
   * @param control - Control to enhance test script for
   * @param testScript - Base test script to enhance
   * @returns ProboEnhancedTestData with additional steps and recommendations
   */
  private async enhanceWithProboData(
    control: Control,
    testScript: ParsedTestScript
  ): Promise<ProboEnhancedTestData | null> {
    try {
      // Validate inputs
      if (!control || !control.type) {
        // console.warn('Invalid control data for Probo enhancement');
        return null;
      }

      // Fetch Probo control recommendations
      const proboData = await this.proboService.getControlTestingGuidance(control.type);

      if (!proboData) return null;

      return {
        additionalSteps:
          proboData.testSteps?.map((step, index) => ({
            id: `probo-step-${index}`,
            order: testScript.steps.length + index + 1,
            description: step.description,
            expectedResult: step.expectedResult,
            dataRequired: step.dataRequired,
            notes: `Probo recommended: ${step.notes || ''}`,
          })) || [],
        suggestions: proboData.suggestions || [],
        complianceMappings: [`SOC2-${control.type}`, `ISO27001-${control.category}`],
        automationRecommendations:
          control.automationLevel === 'MANUAL'
            ? 'Consider implementing automated testing for this control type'
            : 'Control is suitable for automated testing',
        bestPractices: [
          'Document all test evidence',
          'Maintain test execution history',
          'Review test effectiveness quarterly',
        ],
      };
    } catch (error) {
      // console.error('Failed to enhance with Probo data:', error);

      // Return minimal enhancement data on error
      return {
        additionalSteps: [],
        suggestions: [
          'Probo integration temporarily unavailable',
          'Manual review of control testing requirements recommended',
        ],
        complianceMappings: [],
        automationRecommendations: 'Unable to determine automation suitability',
        bestPractices: [
          'Follow standard testing procedures for this control type',
          'Document all test evidence thoroughly',
        ],
      };
    }
  }

  private calculateConfidence(testScript: ParsedTestScript, control: Control | null): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence based on completeness
    if (testScript.steps.length >= 3) confidence += 0.1;
    if (testScript.steps.length >= 5) confidence += 0.1;
    if (testScript.description.length > 50) confidence += 0.1;
    if (testScript.expectedResults.length > 30) confidence += 0.1;
    if (control) confidence += 0.1; // Had control context

    // Cap at 0.95
    return Math.min(confidence, 0.95);
  }

  /**
   * Track AI token usage for cost monitoring and analytics
   * @param userId - User who initiated the request
   * @param organizationId - Organization for billing
   * @param usage - Token usage statistics from AI service
   * @param context - Context of the AI usage
   */
  private async trackTokenUsage(_userId: string,
    organizationId: string,
    usage: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    },
    context: string
  ): Promise<void> {
    try {
      // Log token usage to database
      await db.aIUsageLog.create({
        data: {
          userId,
          organizationId,
          model: 'gpt-4', // Default model, could be parameterized
          promptTokens: usage.prompt_tokens || 0,
          completionTokens: usage.completion_tokens || 0,
          totalTokens: usage.total_tokens || 0,
          context,
          timestamp: new Date(),
          cost: this.calculateCost(usage),
        },
      });
    } catch (error) {
      // console.error('Failed to track AI token usage:', error);
      // Don't throw - token tracking failure shouldn't break the main flow
    }
  }

  private validateString(_value: any, defaultValue: string): string {
    return typeof value === 'string' && value.trim() ? value : defaultValue;
  }

  private validateNumber(_value: any, defaultValue: number): number {
    const num = Number(value);
    return !isNaN(num) && num > 0 ? num : defaultValue;
  }

  private validateTags(tags: any): string[] {
    const validTags = Array.isArray(tags)
      ? tags.filter((tag) => typeof tag === 'string' && tag.trim())
      : [];
    validTags.push('ai-generated');
    return [...new Set(validTags)]; // Remove duplicates
  }

  private validateStringArray(_value: any): string[] | undefined {
    if (!value) return undefined;
    if (!Array.isArray(value)) return undefined;
    const filtered = value.filter((item) => typeof item === 'string' && item.trim());
    return filtered.length > 0 ? filtered : undefined;
  }

  private calculateCost(_usage: { prompt_tokens?: number; completion_tokens?: number }): number {
    // GPT-4 pricing (example rates - adjust to actual)
    const promptCostPer1k = 0.03;
    const completionCostPer1k = 0.06;

    const promptCost = ((usage.prompt_tokens || 0) / 1000) * promptCostPer1k;
    const completionCost = ((usage.completion_tokens || 0) / 1000) * completionCostPer1k;

    return promptCost + completionCost;
  }
}
