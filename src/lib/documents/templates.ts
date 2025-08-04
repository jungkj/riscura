import { OpenAI } from 'openai';
import { db } from '@/lib/db';

// Helper function to get OpenAI client
const getOpenAIClient = () {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  return new OpenAI({
    apiKey,
    organization: process.env.OPENAI_ORG_ID,
  });
}

export interface DocumentTemplate {
  id: string;
  name: string;
  category: string;
  type: string;
  description: string;
  template: string;
  variables: TemplateVariable[];
  isActive: boolean;
  organizationId?: string;
}

export interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multi-select' | 'boolean';
  label: string;
  description?: string;
  required: boolean;
  defaultValue?: any;
  options?: string[]; // For select types
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface GenerationOptions {
  templateId: string;
  variables: Record<string, any>;
  organizationId: string;
  userId: string;
  aiEnhanced?: boolean;
  includeBoilerplate?: boolean;
}

export interface GeneratedDocument {
  title: string;
  content: string;
  category: string;
  type: string;
  metadata: Record<string, any>;
  suggestions?: string[];
}

export class DocumentTemplateService {
  // Get available templates for organization
  async getTemplates(_organizationId: string, category?: string): Promise<DocumentTemplate[]> {
    const where: any = {
      OR: [
        { organizationId: organizationId },
        { organizationId: null }, // Global templates
      ],
      isActive: true,
    };

    if (category) {
      where.category = category;
    }

    try {
      const templates = await db.client.documentTemplate.findMany({
        where,
        orderBy: [
          { organizationId: 'desc' }, // Organization templates first
          { name: 'asc' },
        ],
      });

      return templates;
    } catch (error) {
      // console.error('Error fetching templates:', error);
      return [];
    }
  }

  // Create custom template
  async createTemplate(
    template: Omit<DocumentTemplate, 'id'>,
    userId: string
  ): Promise<DocumentTemplate> {
    try {
      const created = await db.client.documentTemplate.create({
        data: {
          ...template,
          createdById: userId,
          updatedById: userId,
        },
      });

      // Log activity
      await db.client.activity.create({
        data: {
          type: 'CREATED',
          entityType: 'DOCUMENT_TEMPLATE',
          entityId: created.id,
          description: `Created document template: ${template.name}`,
          userId,
          organizationId: template.organizationId || 'global',
          metadata: {
            templateName: template.name,
            category: template.category,
            type: template.type,
          },
          isPublic: false,
        },
      });

      return created;
    } catch (error) {
      // console.error('Error creating template:', error);
      throw new Error('Failed to create template');
    }
  }

  // Generate document from template
  async generateDocument(_options: GenerationOptions): Promise<GeneratedDocument> {
    try {
      const template = await db.client.documentTemplate.findUnique({
        where: { id: options.templateId },
      });

      if (!template) {
        throw new Error('Template not found');
      }

      // Check access
      if (template.organizationId && template.organizationId !== options.organizationId) {
        throw new Error('Access denied to template');
      }

      // Validate variables
      const validatedVariables = this.validateVariables(template.variables, options.variables);

      // Generate base content
      let content = this.interpolateTemplate(template.template, validatedVariables);

      // AI enhancement if requested and available
      if (options.aiEnhanced && process.env.OPENAI_API_KEY) {
        content = await this.enhanceWithAI(content, template, validatedVariables);
      }

      // Add boilerplate if requested
      if (options.includeBoilerplate) {
        content = this.addBoilerplate(content, template);
      }

      // Generate title
      const title = this.generateTitle(template, validatedVariables);

      // Log activity
      await db.client.activity.create({
        data: {
          type: 'DOCUMENT_GENERATED',
          entityType: 'DOCUMENT_TEMPLATE',
          entityId: template.id,
          description: `Generated document from template: ${template.name}`,
          userId: options.userId,
          organizationId: options.organizationId,
          metadata: {
            templateName: template.name,
            templateId: template.id,
            aiEnhanced: options.aiEnhanced,
            variableCount: Object.keys(validatedVariables).length,
          },
          isPublic: false,
        },
      });

      return {
        title,
        content,
        category: template.category,
        type: template.type,
        metadata: {
          templateId: template.id,
          templateName: template.name,
          generatedAt: new Date().toISOString(),
          variables: validatedVariables,
          aiEnhanced: options.aiEnhanced,
        },
        suggestions:
          options.aiEnhanced && process.env.OPENAI_API_KEY
            ? await this.generateSuggestions(content, template)
            : undefined,
      };
    } catch (error) {
      // console.error('Error generating document:', error);
      throw new Error('Failed to generate document');
    }
  }

  // Validate template variables
  private validateVariables(
    templateVars: TemplateVariable[],
    inputVars: Record<string, any>
  ): Record<string, any> {
    const validated: Record<string, any> = {};

    for (const templateVar of templateVars) {
      const value = inputVars[templateVar.name];

      // Check required fields
      if (templateVar.required && (value === undefined || value === null || value === '')) {
        throw new Error(`Required variable '${templateVar.name}' is missing`);
      }

      // Use default if no value provided
      if (value === undefined || value === null || value === '') {
        validated[templateVar.name] = templateVar.defaultValue || '';
        continue;
      }

      validated[templateVar.name] = value;
    }

    return validated;
  }

  // Interpolate template with variables
  private interpolateTemplate(template: string, variables: Record<string, any>): string {
    let _result = template;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, String(value));
    }

    return result;
  }

  // Enhance content with AI
  private async enhanceWithAI(_content: string,
    template: DocumentTemplate,
    variables: Record<string, any>
  ): Promise<string> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return content + '\n\n[AI Enhancement: Not available in demo mode]';
      }

      const openai = getOpenAIClient();
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert document writer. Enhance the following ${template.category} document while maintaining its structure and purpose.`,
          },
          {
            role: 'user',
            content: `Please enhance this document content:\n\n${content}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      return response.choices[0]?.message?.content || content;
    } catch (error) {
      // console.error('Error enhancing with AI:', error);
      return content;
    }
  }

  // Add boilerplate content
  private addBoilerplate(_content: string, template: DocumentTemplate): string {
    const boilerplate = `
Document Type: ${template.type}
Category: ${template.category}
Generated: ${new Date().toLocaleDateString()}

---

${content}

---

This document was generated using the Riscura platform.
`;
    return boilerplate;
  }

  // Generate document title
  private generateTitle(template: DocumentTemplate, variables: Record<string, any>): string {
    let title = template.name;

    // Try to use common variables for title
    if (variables.title) {
      title = variables.title;
    } else if (variables.name) {
      title = variables.name;
    } else if (variables.project) {
      title = `${template.name} - ${variables.project}`;
    }

    return title;
  }

  // Generate AI suggestions
  private async generateSuggestions(_content: string,
    template: DocumentTemplate
  ): Promise<string[]> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return ['AI suggestions not available in demo mode'];
      }

      const openai = getOpenAIClient();
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert document reviewer. Provide 3-5 actionable suggestions to improve this document.',
          },
          {
            role: 'user',
            content: content.substring(0, 2000),
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      const suggestions = response.choices[0]?.message?.content
        ?.split('\n')
        .filter((line) => line.trim().length > 0)
        .map((line) => line.replace(/^\d+\.\s*/, '').trim())
        .filter((suggestion) => suggestion.length > 10)
        .slice(0, 5);

      return suggestions || ['No suggestions available'];
    } catch (error) {
      // console.error('Error generating suggestions:', error);
      return ['Unable to generate suggestions'];
    }
  }
}

// Default export
export const documentTemplateService = new DocumentTemplateService();

// Predefined templates
export const BUILTIN_TEMPLATES: Omit<DocumentTemplate, 'id' | 'organizationId'>[] = [
  {
    name: 'Risk Assessment Report',
    category: 'report',
    type: 'detailed',
    description: 'Comprehensive risk assessment report template',
    template: `# Risk Assessment Report

## Executive Summary
This risk assessment was conducted for {{organizationName}} {{department}} department to identify, evaluate, and prioritize risks that may impact business objectives.

## Scope
**Assessment Period:** {{startDate}} to {{endDate}}
**Business Unit:** {{businessUnit}}
**Department:** {{department}}
**Assessor:** {{assessorName}}

## Risk Categories Assessed
{{#each riskCategories}}
- {{this}}
{{/each}}

## Key Findings
{{#if highRisks}}
### High Priority Risks
{{#each highRisks}}
**Risk:** {{this.title}}
**Impact:** {{this.impact}}
**Likelihood:** {{this.likelihood}}
**Mitigation:** {{this.mitigation}}

{{/each}}
{{/if}}

## Recommendations
1. Implement immediate controls for high-priority risks
2. Develop mitigation strategies for medium-priority risks
3. Monitor and review low-priority risks quarterly
4. Establish regular risk assessment cycles

## Next Steps
- Schedule risk treatment planning session
- Assign risk owners
- Establish monitoring procedures
- Plan follow-up assessment

## Approval
This assessment requires review and approval from the Risk Committee.
`,
    variables: [
      { name: 'organizationName', type: 'text', label: 'Organization Name', required: true },
      { name: 'department', type: 'text', label: 'Department', required: true },
      { name: 'businessUnit', type: 'text', label: 'Business Unit', required: false },
      { name: 'startDate', type: 'date', label: 'Assessment Start Date', required: true },
      { name: 'endDate', type: 'date', label: 'Assessment End Date', required: true },
      { name: 'assessorName', type: 'text', label: 'Lead Assessor', required: true },
      {
        name: 'riskCategories',
        type: 'multi-select',
        label: 'Risk Categories',
        required: true,
        options: [
          'Operational',
          'Financial',
          'Strategic',
          'Compliance',
          'Technology',
          'Reputational',
        ],
      },
    ],
    isActive: true,
  },
  {
    name: 'Control Testing Procedure',
    category: 'procedure',
    type: 'operational',
    description: 'Standard procedure for testing internal controls',
    template: `# Control Testing Procedure

## Purpose
This procedure outlines the methodology for testing the effectiveness of internal controls within {{organizationName}}.

## Scope
**Control Area:** {{controlArea}}
**Testing Period:** {{testingPeriod}}
**Frequency:** {{testingFrequency}}

## Control Details
**Control ID:** {{controlId}}
**Control Owner:** {{controlOwner}}
**Control Type:** {{controlType}}
**Control Frequency:** {{controlFrequency}}

## Testing Methodology
{{#if testingType}}
**Testing Approach:** {{testingType}}
{{/if}}

### Sample Selection
- Population size: {{populationSize}}
- Sample size: {{sampleSize}}
- Selection method: {{selectionMethod}}

### Testing Procedures
1. Review control documentation
2. Interview control operator
3. Examine supporting evidence
4. Test control execution
5. Document findings

## Expected Evidence
{{#each evidenceTypes}}
- {{this}}
{{/each}}

## Evaluation Criteria
- **Effective:** Control operates as designed with no exceptions
- **Partially Effective:** Control operates with minor exceptions that do not compromise objective
- **Ineffective:** Control fails to operate as designed or has significant exceptions

## Documentation Requirements
All testing must be documented with:
- Test steps performed
- Evidence examined
- Exceptions identified
- Conclusions reached

## Reporting
Results must be reported to {{reportingManager}} within {{reportingTimeframe}} days of test completion.
`,
    variables: [
      { name: 'organizationName', type: 'text', label: 'Organization Name', required: true },
      { name: 'controlArea', type: 'text', label: 'Control Area', required: true },
      { name: 'controlId', type: 'text', label: 'Control ID', required: true },
      { name: 'controlOwner', type: 'text', label: 'Control Owner', required: true },
      {
        name: 'controlType',
        type: 'select',
        label: 'Control Type',
        required: true,
        options: ['Preventive', 'Detective', 'Corrective', 'Directive'],
      },
      { name: 'testingPeriod', type: 'text', label: 'Testing Period', required: true },
      {
        name: 'testingFrequency',
        type: 'select',
        label: 'Testing Frequency',
        required: true,
        options: ['Monthly', 'Quarterly', 'Semi-annually', 'Annually'],
      },
      { name: 'populationSize', type: 'number', label: 'Population Size', required: false },
      { name: 'sampleSize', type: 'number', label: 'Sample Size', required: false },
      { name: 'reportingManager', type: 'text', label: 'Reporting Manager', required: true },
      {
        name: 'reportingTimeframe',
        type: 'number',
        label: 'Reporting Timeframe (days)',
        required: true,
        defaultValue: 5,
      },
    ],
    isActive: true,
  },
  {
    name: 'Policy Document',
    category: 'policy',
    type: 'internal',
    description: 'Corporate policy document template',
    template: `# {{policyTitle}}

## 1. Purpose and Scope
### 1.1 Purpose
This policy establishes {{organizationName}}'s requirements for {{policySubject}}.

### 1.2 Scope
This policy applies to {{scopeDescription}}.

## 2. Policy Statement
{{organizationName}} is committed to {{policyCommitment}}.

## 3. Definitions
{{#each definitions}}
**{{this.term}}:** {{this.definition}}
{{/each}}

## 4. Roles and Responsibilities
{{#each roles}}
### {{this.role}}
{{this.responsibility}}
{{/each}}

## 5. Policy Requirements
{{#each requirements}}
### {{this.title}}
{{this.description}}
{{/each}}

## 6. Compliance and Monitoring
### 6.1 Compliance
All employees must comply with this policy. Non-compliance may result in disciplinary action.

### 6.2 Monitoring
Compliance with this policy will be monitored through {{monitoringMethod}}.

## 7. Related Documents
{{#each relatedDocs}}
- {{this}}
{{/each}}

## 8. Policy Approval
**Effective Date:** {{effectiveDate}}
**Review Date:** {{reviewDate}}
**Policy Owner:** {{policyOwner}}
**Approved By:** {{approvedBy}}

## 9. Revision History
| Version | Date | Changes | Approved By |
|---------|------|---------|-------------|
| 1.0 | {{effectiveDate}} | Initial version | {{approvedBy}} |
`,
    variables: [
      { name: 'policyTitle', type: 'text', label: 'Policy Title', required: true },
      { name: 'organizationName', type: 'text', label: 'Organization Name', required: true },
      { name: 'policySubject', type: 'text', label: 'Policy Subject', required: true },
      { name: 'scopeDescription', type: 'text', label: 'Scope Description', required: true },
      {
        name: 'policyCommitment',
        type: 'text',
        label: 'Policy Commitment Statement',
        required: true,
      },
      { name: 'monitoringMethod', type: 'text', label: 'Monitoring Method', required: true },
      { name: 'effectiveDate', type: 'date', label: 'Effective Date', required: true },
      { name: 'reviewDate', type: 'date', label: 'Review Date', required: true },
      { name: 'policyOwner', type: 'text', label: 'Policy Owner', required: true },
      { name: 'approvedBy', type: 'text', label: 'Approved By', required: true },
    ],
    isActive: true,
  },
];
