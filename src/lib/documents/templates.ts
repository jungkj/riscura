import { OpenAI } from 'openai';
import { env } from '@/config/env';
import { db } from '@/lib/db';

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
  organization: env.OPENAI_ORG_ID,
});

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
  async getTemplates(organizationId: string, category?: string): Promise<DocumentTemplate[]> {
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

    const templates = await db.client.documentTemplate.findMany({
      where,
      orderBy: [
        { organizationId: 'desc' }, // Organization templates first
        { name: 'asc' },
      ],
    });

    return templates;
  }

  // Create custom template
  async createTemplate(template: Omit<DocumentTemplate, 'id'>, userId: string): Promise<DocumentTemplate> {
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
  }

  // Generate document from template
  async generateDocument(options: GenerationOptions): Promise<GeneratedDocument> {
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

    // AI enhancement if requested
    if (options.aiEnhanced) {
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
      suggestions: options.aiEnhanced ? await this.generateSuggestions(content, template) : undefined,
    };
  }

  // Validate template variables
  private validateVariables(templateVars: TemplateVariable[], inputVars: Record<string, any>): Record<string, any> {
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

      // Type validation
      switch (templateVar.type) {
        case 'number':
          const numValue = Number(value);
          if (isNaN(numValue)) {
            throw new Error(`Variable '${templateVar.name}' must be a number`);
          }
          if (templateVar.validation?.min !== undefined && numValue < templateVar.validation.min) {
            throw new Error(`Variable '${templateVar.name}' must be at least ${templateVar.validation.min}`);
          }
          if (templateVar.validation?.max !== undefined && numValue > templateVar.validation.max) {
            throw new Error(`Variable '${templateVar.name}' must be at most ${templateVar.validation.max}`);
          }
          validated[templateVar.name] = numValue;
          break;

        case 'date':
          const dateValue = new Date(value);
          if (isNaN(dateValue.getTime())) {
            throw new Error(`Variable '${templateVar.name}' must be a valid date`);
          }
          validated[templateVar.name] = dateValue.toISOString().split('T')[0];
          break;

        case 'select':
          if (templateVar.options && !templateVar.options.includes(value)) {
            throw new Error(`Variable '${templateVar.name}' must be one of: ${templateVar.options.join(', ')}`);
          }
          validated[templateVar.name] = value;
          break;

        case 'multi-select':
          if (!Array.isArray(value)) {
            throw new Error(`Variable '${templateVar.name}' must be an array`);
          }
          if (templateVar.options) {
            for (const item of value) {
              if (!templateVar.options.includes(item)) {
                throw new Error(`Variable '${templateVar.name}' contains invalid option: ${item}`);
              }
            }
          }
          validated[templateVar.name] = value;
          break;

        case 'boolean':
          validated[templateVar.name] = Boolean(value);
          break;

        case 'text':
        default:
          if (templateVar.validation?.pattern) {
            const regex = new RegExp(templateVar.validation.pattern);
            if (!regex.test(String(value))) {
              throw new Error(`Variable '${templateVar.name}' does not match required pattern`);
            }
          }
          validated[templateVar.name] = String(value);
          break;
      }
    }

    return validated;
  }

  // Interpolate template with variables
  private interpolateTemplate(template: string, variables: Record<string, any>): string {
    let content = template;

    // Replace simple variables {{variable}}
    content = content.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return variables[varName] !== undefined ? String(variables[varName]) : match;
    });

    // Replace conditional blocks {{#if variable}} content {{/if}}
    content = content.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, varName, blockContent) => {
      return variables[varName] ? blockContent : '';
    });

    // Replace loops {{#each array}} content {{/each}}
    content = content.replace(/\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, varName, blockContent) => {
      const array = variables[varName];
      if (!Array.isArray(array)) return '';
      
      return array.map((item, index) => {
        return blockContent
          .replace(/\{\{this\}\}/g, String(item))
          .replace(/\{\{@index\}\}/g, String(index));
      }).join('');
    });

    return content;
  }

  // AI enhancement of generated content
  private async enhanceWithAI(content: string, template: DocumentTemplate, variables: Record<string, any>): Promise<string> {
    const prompt = `
You are an expert business document writer specializing in risk management and compliance. 
Enhance the following document content to be more professional, comprehensive, and actionable.

Document Type: ${template.category} - ${template.type}
Template: ${template.name}

Current content:
${content}

Variables used:
${JSON.stringify(variables, null, 2)}

Instructions:
1. Improve clarity and professional language
2. Add relevant industry best practices
3. Ensure compliance considerations are addressed
4. Make recommendations more specific and actionable
5. Maintain the original structure and intent
6. Add relevant examples where appropriate

Return only the enhanced document content:
`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert business document writer specializing in risk management, compliance, and corporate governance. Enhance documents to be professional, comprehensive, and actionable."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 3000,
      });

      return response.choices[0]?.message?.content || content;
    } catch (error) {
      console.error('AI enhancement failed:', error);
      return content;
    }
  }

  // Add standard boilerplate
  private addBoilerplate(content: string, template: DocumentTemplate): string {
    const header = `
# ${template.name}

**Document Type:** ${template.category} - ${template.type}
**Generated:** ${new Date().toLocaleDateString()}
**Version:** 1.0

---

`;

    const footer = `

---

**Disclaimer:** This document has been generated from a template and should be reviewed and customized as appropriate for your organization's specific needs and requirements.

**Review Requirements:** This document should be reviewed by appropriate subject matter experts and stakeholders before implementation.

**Maintenance:** This document should be reviewed and updated regularly to ensure continued relevance and accuracy.
`;

    return header + content + footer;
  }

  // Generate document title
  private generateTitle(template: DocumentTemplate, variables: Record<string, any>): string {
    let title = template.name;

    // Try to make title more specific based on variables
    if (variables.organizationName) {
      title = `${variables.organizationName} - ${title}`;
    }
    if (variables.department) {
      title = `${title} - ${variables.department}`;
    }
    if (variables.year) {
      title = `${title} ${variables.year}`;
    }

    return title;
  }

  // Generate AI suggestions
  private async generateSuggestions(content: string, template: DocumentTemplate): Promise<string[]> {
    const prompt = `
Analyze the following ${template.category} document and provide 3-5 specific suggestions for improvement:

Document content:
${content.substring(0, 2000)}...

Focus on:
1. Risk management best practices
2. Compliance considerations
3. Operational improvements
4. Governance enhancements
5. Stakeholder communication

Return a JSON array of suggestions:
`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert risk management consultant. Provide specific, actionable suggestions for document improvement."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 1000,
      });

      const suggestions = JSON.parse(response.choices[0]?.message?.content || '[]');
      return Array.isArray(suggestions) ? suggestions : [];
    } catch (error) {
      console.error('Suggestion generation failed:', error);
      return [];
    }
  }
}

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
      { name: 'riskCategories', type: 'multi-select', label: 'Risk Categories', required: true, 
        options: ['Operational', 'Financial', 'Strategic', 'Compliance', 'Technology', 'Reputational'] },
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
      { name: 'controlType', type: 'select', label: 'Control Type', required: true,
        options: ['Preventive', 'Detective', 'Corrective', 'Directive'] },
      { name: 'testingPeriod', type: 'text', label: 'Testing Period', required: true },
      { name: 'testingFrequency', type: 'select', label: 'Testing Frequency', required: true,
        options: ['Monthly', 'Quarterly', 'Semi-annually', 'Annually'] },
      { name: 'populationSize', type: 'number', label: 'Population Size', required: false },
      { name: 'sampleSize', type: 'number', label: 'Sample Size', required: false },
      { name: 'reportingManager', type: 'text', label: 'Reporting Manager', required: true },
      { name: 'reportingTimeframe', type: 'number', label: 'Reporting Timeframe (days)', required: true, defaultValue: 5 },
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
      { name: 'policyCommitment', type: 'text', label: 'Policy Commitment Statement', required: true },
      { name: 'monitoringMethod', type: 'text', label: 'Monitoring Method', required: true },
      { name: 'effectiveDate', type: 'date', label: 'Effective Date', required: true },
      { name: 'reviewDate', type: 'date', label: 'Review Date', required: true },
      { name: 'policyOwner', type: 'text', label: 'Policy Owner', required: true },
      { name: 'approvedBy', type: 'text', label: 'Approved By', required: true },
    ],
    isActive: true,
  }
];

// Export singleton service
export const documentTemplateService = new DocumentTemplateService(); 