import { db } from '@/lib/db';
import { AIService } from '@/services/AIService';
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
  AutomationLevel
} from '@/types/rcsa.types';

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

export class TestScriptGenerationAIService {
  private aiService: AIService;
  private proboService: ProboService;

  constructor() {
    this.aiService = new AIService();
    this.proboService = new ProboService();
  }

  async generateTestScript(
    request: GenerateTestScriptRequest,
    organizationId: string,
    userId: string
  ): Promise<GenerateTestScriptResponse> {
    try {
      // Fetch control details if not provided
      let control: Control | null = null;
      let controlDescription = request.controlDescription;
      
      if (request.controlId) {
        control = await db.control.findFirst({
          where: {
            id: request.controlId,
            organizationId
          },
          include: {
            risks: {
              include: {
                risk: true
              }
            }
          }
        });
        
        if (!control) {
          throw new Error('Control not found');
        }
        
        controlDescription = controlDescription || control.description;
      }
      
      // Prepare context for AI generation
      const context = this.prepareContext(control, request);
      
      // Generate test script using AI
      const aiResponse = await this.aiService.generateContent({
        prompt: this.buildPrompt(context),
        systemPrompt: this.getSystemPrompt(),
        temperature: 0.7,
        maxTokens: 2000
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
        suggestions: parsedScript.suggestions || []
      };
    } catch (error) {
      console.error('Test script generation error:', error);
      throw error;
    }
  }

  private prepareContext(control: Control | null, request: GenerateTestScriptRequest): TestScriptGenerationContext {
    return {
      controlTitle: control?.title || 'Control',
      controlDescription: request.controlDescription || control?.description || '',
      controlType: control?.type || 'DETECTIVE',
      controlCategory: control?.category || 'OPERATIONAL',
      controlFrequency: control?.frequency || 'Monthly',
      automationLevel: control?.automationLevel || 'MANUAL',
      testObjective: request.testObjective || 'Verify control effectiveness',
      additionalContext: request.additionalContext || '',
      relatedRisks: control?.risks?.map(r => r.risk.title).join(', ') || 'General risks'
    };
  }

  private buildPrompt(context: TestScriptGenerationContext): string {
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

  private parseAIResponse(content: string): any {
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
      console.error('Failed to parse AI response:', error);
      return this.getDefaultTestScript();
    }
  }

  private validateAndNormalizeTestScript(parsed: any): any {
    return {
      title: parsed.title || 'Generated Test Script',
      description: parsed.description || 'AI-generated test script',
      testType: this.normalizeTestType(parsed.testType),
      frequency: this.normalizeFrequency(parsed.frequency),
      estimatedDuration: parsed.estimatedDuration || 30,
      steps: this.normalizeSteps(parsed.steps || []),
      expectedResults: parsed.expectedResults || 'Control operating effectively',
      automationCapable: parsed.automationCapable || false,
      tags: ['ai-generated'],
      suggestions: parsed.suggestions || []
    };
  }

  private normalizeTestType(type: string): TestScriptType {
    const typeMap: Record<string, TestScriptType> = {
      'MANUAL': TestScriptType.MANUAL,
      'AUTOMATED': TestScriptType.AUTOMATED,
      'HYBRID': TestScriptType.HYBRID,
      'INQUIRY': TestScriptType.INQUIRY,
      'OBSERVATION': TestScriptType.OBSERVATION,
      'INSPECTION': TestScriptType.INSPECTION,
      'REPERFORMANCE': TestScriptType.REPERFORMANCE
    };
    
    return typeMap[type?.toUpperCase()] || TestScriptType.MANUAL;
  }

  private normalizeFrequency(frequency: string): TestFrequency {
    const freqMap: Record<string, TestFrequency> = {
      'DAILY': TestFrequency.DAILY,
      'WEEKLY': TestFrequency.WEEKLY,
      'MONTHLY': TestFrequency.MONTHLY,
      'QUARTERLY': TestFrequency.QUARTERLY,
      'SEMI_ANNUAL': TestFrequency.SEMI_ANNUAL,
      'ANNUAL': TestFrequency.ANNUAL,
      'AD_HOC': TestFrequency.AD_HOC,
      'CONTINUOUS': TestFrequency.CONTINUOUS
    };
    
    return freqMap[frequency?.toUpperCase()] || TestFrequency.MONTHLY;
  }

  private normalizeSteps(steps: any[]): Omit<TestStep, 'id'>[] {
    if (!Array.isArray(steps) || steps.length === 0) {
      return this.getDefaultSteps();
    }
    
    return steps.map((step, index) => ({
      order: step.order || index + 1,
      description: step.description || `Step ${index + 1}`,
      expectedResult: step.expectedResult || 'Step completed successfully',
      dataRequired: step.dataRequired,
      notes: step.notes
    }));
  }

  private extractFromText(content: string): any {
    // Basic text extraction logic
    const lines = content.split('\n');
    const title = lines.find(l => l.includes('Title:'))?.replace(/Title:/i, '').trim() || 'Generated Test Script';
    const description = lines.find(l => l.includes('Description:'))?.replace(/Description:/i, '').trim() || 'AI-generated test script';
    
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
      suggestions: []
    };
  }

  private getDefaultTestScript(): any {
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
      suggestions: ['Review and customize test steps', 'Add specific data requirements', 'Define clear pass/fail criteria']
    };
  }

  private getDefaultSteps(): Omit<TestStep, 'id'>[] {
    return [
      {
        order: 1,
        description: 'Review control documentation and procedures',
        expectedResult: 'Documentation is current and complete',
        dataRequired: 'Control documentation, procedures',
        notes: 'Verify version control and approval status'
      },
      {
        order: 2,
        description: 'Select sample for testing',
        expectedResult: 'Representative sample selected based on risk',
        dataRequired: 'Population data, sampling criteria',
        notes: 'Document sampling methodology'
      },
      {
        order: 3,
        description: 'Execute test procedures',
        expectedResult: 'Control operates as designed',
        dataRequired: 'Test data, system access',
        notes: 'Document any deviations or exceptions'
      },
      {
        order: 4,
        description: 'Document results and findings',
        expectedResult: 'Complete test documentation',
        dataRequired: 'Test results, evidence',
        notes: 'Include screenshots or supporting evidence'
      }
    ];
  }

  private async enhanceWithProboData(control: Control, testScript: any): Promise<any> {
    try {
      // Fetch Probo control recommendations
      const proboData = await this.proboService.getControlTestingGuidance(control.type);
      
      if (!proboData) return null;
      
      return {
        additionalSteps: proboData.testSteps?.map((step: any, index: number) => ({
          order: testScript.steps.length + index + 1,
          description: step.description,
          expectedResult: step.expectedResult,
          dataRequired: step.dataRequired,
          notes: `Probo recommended: ${step.notes || ''}`
        })) || [],
        suggestions: proboData.suggestions || []
      };
    } catch (error) {
      console.error('Failed to enhance with Probo data:', error);
      return null;
    }
  }

  private calculateConfidence(testScript: any, control: Control | null): number {
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

  private async trackTokenUsage(
    userId: string,
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
          cost: this.calculateCost(usage)
        }
      });
    } catch (error) {
      console.error('Failed to track AI token usage:', error);
      // Don't throw - token tracking failure shouldn't break the main flow
    }
  }

  private calculateCost(usage: {
    prompt_tokens?: number;
    completion_tokens?: number;
  }): number {
    // GPT-4 pricing (example rates - adjust to actual)
    const promptCostPer1k = 0.03;
    const completionCostPer1k = 0.06;
    
    const promptCost = ((usage.prompt_tokens || 0) / 1000) * promptCostPer1k;
    const completionCost = ((usage.completion_tokens || 0) / 1000) * completionCostPer1k;
    
    return promptCost + completionCost;
  }
}