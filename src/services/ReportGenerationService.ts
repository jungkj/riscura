// import { AssessmentResults } from '@/app/api/assessments/[id]/execute/route'; // Temporarily disabled - interface not implemented yet
interface AssessmentResults {
  riskAssessment: any;
  complianceAssessment: any;
  controlEffectiveness: any;
  recommendations: any[];
  actionPlan: any[];
  executiveSummary?: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: ReportSection[];
  format: 'pdf' | 'html' | 'docx' | 'excel';
  audience: 'executive' | 'management' | 'technical' | 'regulatory';
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'summary' | 'analysis' | 'findings' | 'recommendations' | 'appendix';
  content: string;
  charts?: ChartConfig[];
  tables?: TableConfig[];
  order: number;
  required: boolean;
}

export interface ChartConfig {
  id: string;
  type: 'bar' | 'pie' | 'line' | 'scatter' | 'heatmap';
  title: string;
  data: any[];
  xAxis?: string;
  yAxis?: string;
  colors?: string[];
}

export interface TableConfig {
  id: string;
  title: string;
  headers: string[];
  rows: any[][];
  sortable?: boolean;
  filterable?: boolean;
}

export interface GeneratedReport {
  id: string;
  assessmentId: string;
  templateId: string;
  title: string;
  generatedAt: Date;
  generatedBy: string;
  format: string;
  content: string;
  metadata: {
    pageCount: number;
    sections: number;
    charts: number;
    tables: number;
    fileSize: number;
  }
  downloadUrl?: string;
}

export interface ReportGenerationOptions {
  templateId?: string;
  format?: 'pdf' | 'html' | 'docx' | 'excel';
  audience?: 'executive' | 'management' | 'technical' | 'regulatory';
  includeSections?: string[];
  excludeSections?: string[];
  customizations?: {
    logo?: string;
    branding?: any;
    footer?: string;
    watermark?: string;
  }
}

export class ReportGenerationService {
  private templates: Map<string, ReportTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    // Executive Summary Template
    const executiveTemplate: ReportTemplate = {
      id: 'executive-summary',
      name: 'Executive Summary Report',
      description: 'High-level summary for senior management',
      format: 'pdf',
      audience: 'executive',
      sections: [
        {
          id: 'exec-summary',
          title: 'Executive Summary',
          type: 'summary',
          content: '',
          order: 1,
          required: true,
        },
        {
          id: 'key-findings',
          title: 'Key Findings',
          type: 'findings',
          content: '',
          order: 2,
          required: true,
        },
        {
          id: 'risk-overview',
          title: 'Risk Overview',
          type: 'analysis',
          content: '',
          charts: [
            {
              id: 'risk-by-level',
              type: 'pie',
              title: 'Risks by Level',
              data: [],
              colors: ['#ef4444', '#f97316', '#eab308', '#22c55e'],
            },
          ],
          order: 3,
          required: true,
        },
        {
          id: 'recommendations',
          title: 'Priority Recommendations',
          type: 'recommendations',
          content: '',
          order: 4,
          required: true,
        },
      ],
    }

    // Detailed Technical Template
    const technicalTemplate: ReportTemplate = {
      id: 'technical-detailed',
      name: 'Detailed Technical Report',
      description: 'Comprehensive technical analysis',
      format: 'html',
      audience: 'technical',
      sections: [
        {
          id: 'methodology',
          title: 'Assessment Methodology',
          type: 'analysis',
          content: '',
          order: 1,
          required: true,
        },
        {
          id: 'risk-analysis',
          title: 'Risk Analysis',
          type: 'analysis',
          content: '',
          charts: [
            {
              id: 'risk-heatmap',
              type: 'heatmap',
              title: 'Risk Heat Map',
              data: [],
            },
            {
              id: 'risk-trends',
              type: 'line',
              title: 'Risk Trends',
              data: [],
            },
          ],
          tables: [
            {
              id: 'risk-register',
              title: 'Risk Register',
              headers: ['Risk ID', 'Title', 'Category', 'Likelihood', 'Impact', 'Score', 'Level'],
              rows: [],
              sortable: true,
              filterable: true,
            },
          ],
          order: 2,
          required: true,
        },
        {
          id: 'control-effectiveness',
          title: 'Control Effectiveness Analysis',
          type: 'analysis',
          content: '',
          charts: [
            {
              id: 'control-effectiveness',
              type: 'bar',
              title: 'Control Effectiveness Distribution',
              data: [],
            },
          ],
          tables: [
            {
              id: 'control-assessment',
              title: 'Control Assessment Results',
              headers: ['Control ID', 'Title', 'Type', 'Effectiveness', 'Coverage', 'Gaps'],
              rows: [],
              sortable: true,
              filterable: true,
            },
          ],
          order: 3,
          required: true,
        },
        {
          id: 'compliance-assessment',
          title: 'Compliance Framework Assessment',
          type: 'analysis',
          content: '',
          charts: [
            {
              id: 'compliance-scores',
              type: 'bar',
              title: 'Compliance Component Scores',
              data: [],
            },
          ],
          order: 4,
          required: true,
        },
        {
          id: 'detailed-findings',
          title: 'Detailed Findings',
          type: 'findings',
          content: '',
          order: 5,
          required: true,
        },
        {
          id: 'recommendations-detailed',
          title: 'Detailed Recommendations',
          type: 'recommendations',
          content: '',
          tables: [
            {
              id: 'recommendations-table',
              title: 'Recommendations',
              headers: ['ID', 'Title', 'Priority', 'Type', 'Timeline', 'Cost', 'Benefit'],
              rows: [],
              sortable: true,
            },
          ],
          order: 6,
          required: true,
        },
        {
          id: 'action-plan',
          title: 'Implementation Action Plan',
          type: 'recommendations',
          content: '',
          tables: [
            {
              id: 'action-items',
              title: 'Action Items',
              headers: ['ID', 'Title', 'Owner', 'Due Date', 'Priority', 'Status', 'Progress'],
              rows: [],
              sortable: true,
            },
          ],
          order: 7,
          required: true,
        },
        {
          id: 'appendices',
          title: 'Appendices',
          type: 'appendix',
          content: '',
          order: 8,
          required: false,
        },
      ],
    }

    // Regulatory Compliance Template
    const regulatoryTemplate: ReportTemplate = {
      id: 'regulatory-compliance',
      name: 'Regulatory Compliance Report',
      description: 'Report for regulatory submission',
      format: 'pdf',
      audience: 'regulatory',
      sections: [
        {
          id: 'compliance-statement',
          title: 'Compliance Statement',
          type: 'summary',
          content: '',
          order: 1,
          required: true,
        },
        {
          id: 'framework-assessment',
          title: 'Framework Assessment',
          type: 'analysis',
          content: '',
          order: 2,
          required: true,
        },
        {
          id: 'material-weaknesses',
          title: 'Material Weaknesses',
          type: 'findings',
          content: '',
          order: 3,
          required: true,
        },
        {
          id: 'remediation-plan',
          title: 'Remediation Plan',
          type: 'recommendations',
          content: '',
          order: 4,
          required: true,
        },
        {
          id: 'management-assertion',
          title: 'Management Assertion',
          type: 'summary',
          content: '',
          order: 5,
          required: true,
        },
      ],
    }

    this.templates.set('executive-summary', executiveTemplate);
    this.templates.set('technical-detailed', technicalTemplate);
    this.templates.set('regulatory-compliance', regulatoryTemplate);
  }

  async generateReport(
    assessmentId: string,
    results: AssessmentResults,
    options: ReportGenerationOptions = {},
    generatedBy: string
  ): Promise<GeneratedReport> {
    // Select template
    const templateId = options.templateId || this.selectDefaultTemplate(options.audience)
    const template = this.templates.get(templateId);

    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Generate report content
    const reportContent = await this.generateReportContent(template, results, options)

    // Create report metadata
    const metadata = {
      pageCount: this.estimatePageCount(reportContent),
      sections: template.sections.length,
      charts: this.countCharts(template),
      tables: this.countTables(template),
      fileSize: this.estimateFileSize(reportContent),
    }

    const report: GeneratedReport = {
      id: `report_${assessmentId}_${Date.now()}`,
      assessmentId,
      templateId,
      title: this.generateReportTitle(template, results),
      generatedAt: new Date(),
      generatedBy,
      format: options.format || template.format,
      content: reportContent,
      metadata,
    }

    return report;
  }

  private async generateReportContent(
    template: ReportTemplate,
    results: AssessmentResults,
    options: ReportGenerationOptions
  ): Promise<string> {
    let content = this.generateReportHeader(template, options);

    // Filter sections based on options
    const sectionsToInclude = template.sections.filter((section) => {
      if (options.includeSections && !options.includeSections.includes(section.id)) {
        return false
      }
      if (options.excludeSections && options.excludeSections.includes(section.id)) {
        return false;
      }
      return true;
    });

    // Generate each section
    for (const section of sectionsToInclude.sort((a, b) => a.order - b.order)) {
      content += await this.generateSection(section, results, template.format)
    }

    content += this.generateReportFooter(template, options);

    return content;
  }

  private async generateSection(
    section: ReportSection,
    results: AssessmentResults,
    format: string
  ): Promise<string> {
    let sectionContent = '';

    // Add section header
    sectionContent += this.formatSectionHeader(section.title, format)

    // Generate section content based on type
    switch (section.type) {
      case 'summary':
        sectionContent += this.generateSummaryContent(section, results, format)
        break;
      case 'analysis':
        sectionContent += this.generateAnalysisContent(section, results, format);
        break;
      case 'findings':
        sectionContent += this.generateFindingsContent(section, results, format);
        break;
      case 'recommendations':
        sectionContent += this.generateRecommendationsContent(section, results, format);
        break;
      case 'appendix':
        sectionContent += this.generateAppendixContent(section, results, format);
        break;
    }

    // Add charts
    if (section.charts) {
      for (const chart of section.charts) {
        sectionContent += this.generateChart(chart, results, format)
      }
    }

    // Add tables
    if (section.tables) {
      for (const table of section.tables) {
        sectionContent += this.generateTable(table, results, format)
      }
    }

    return sectionContent;
  }

  private generateSummaryContent(
    section: ReportSection,
    results: AssessmentResults,
    format: string
  ): string {
    switch (section.id) {
      case 'exec-summary':
        return this.formatContent(
          results.executiveSummary || this.generateExecutiveSummaryContent(results),
          format
        );

      case 'compliance-statement':
        return this.formatContent(
          this.generateComplianceStatement(results.complianceAssessment),
          format
        );

      case 'management-assertion':
        return this.formatContent(this.generateManagementAssertion(results), format);

      default:
        return this.formatContent('Summary content not available.', format);
    }
  }

  private generateAnalysisContent(
    section: ReportSection,
    results: AssessmentResults,
    format: string
  ): string {
    let content = section.content;

    // Replace placeholders with actual data
    content = content.replace(
      '{{riskAnalysis}}',
      this.generateRiskAnalysisContent(results.riskAssessment)
    )
    content = content.replace(
      '{{controlAnalysis}}',
      this.generateControlAnalysisContent(results.controlEffectiveness)
    );
    content = content.replace(
      '{{complianceAnalysis}}',
      this.generateComplianceAnalysisContent(results.complianceAssessment)
    );

    return this.formatContent(content, format);
  }

  private generateFindingsContent(
    section: ReportSection,
    results: AssessmentResults,
    format: string
  ): string {
    const keyFindings = this.generateKeyFindings(results);
    const detailedFindings = this.generateDetailedFindings(results);

    let content = section.content;
    content = content.replace('{{keyFindings}}', keyFindings);
    content = content.replace('{{detailedFindings}}', detailedFindings);

    return this.formatContent(content, format);
  }

  private generateRecommendationsContent(
    section: ReportSection,
    results: AssessmentResults,
    format: string
  ): string {
    const recommendations = this.generateRecommendationsText(results.recommendations);
    const actionPlan = this.generateActionPlanContent(results.actionPlan);

    let content = section.content;
    content = content.replace('{{recommendations}}', recommendations);
    content = content.replace('{{actionPlan}}', actionPlan);

    return this.formatContent(content, format);
  }

  private generateAppendixContent(
    section: ReportSection,
    results: AssessmentResults,
    format: string
  ): string {
    const materialWeaknesses = this.generateMaterialWeaknessesContent(results.complianceAssessment);
    const remediationPlan = this.generateRemediationPlanContent(results);

    let content = section.content;
    content = content.replace('{{materialWeaknesses}}', materialWeaknesses);
    content = content.replace('{{remediationPlan}}', remediationPlan);

    return this.formatContent(content, format);
  }

  private generateChart(chart: ChartConfig, results: AssessmentResults, format: string): string {
    if (format === 'html') {
      return this.generateHTMLChart(chart);
    }

    return this.generateChartPlaceholder(chart);
  }

  private generateTable(_table: TableConfig, results: AssessmentResults, format: string): string {
    if (format === 'html') {
      return this.generateHTMLTable(table);
    }

    return this.generateTablePlaceholder(table);
  }

  // Content generation helper methods
  private generateComplianceStatement(complianceAssessment: any): string {
    return `
Based on our assessment of the ${complianceAssessment.framework} framework, 
the organization has achieved an overall compliance score of ${complianceAssessment.overallScore}% 
with a rating of ${complianceAssessment.overallRating.toUpperCase()}.

${
  complianceAssessment.materialWeaknesses.length > 0
    ? `${complianceAssessment.materialWeaknesses.length} material weakness(es) have been identified that require immediate attention.`
    : 'No material weaknesses were identified during this assessment.'
}

This assessment was conducted in accordance with applicable standards and provides 
a comprehensive evaluation of the organization's control environment.
    `.trim()
  }

  private generateManagementAssertion(_results: AssessmentResults): string {
    return `
Management acknowledges the findings and recommendations contained in this assessment report. 
We are committed to addressing the identified deficiencies and implementing the recommended 
improvements within the specified timeframes.

The organization will allocate appropriate resources to ensure effective remediation of 
identified gaps and continuous improvement of our risk management and control environment.

This assessment represents management's commitment to maintaining effective internal controls 
and compliance with applicable regulatory requirements.
    `.trim();
  }

  private generateMethodologyContent(): string {
    return `
This assessment was conducted using a comprehensive methodology that includes:

1. Risk Identification and Assessment
   - Systematic identification of risks across all business areas
   - Likelihood and impact analysis using standardized scales
   - Risk scoring and categorization

2. Control Effectiveness Evaluation
   - Assessment of control design and implementation
   - Testing of control operating effectiveness
   - Gap analysis and coverage assessment

3. Compliance Framework Analysis
   - Evaluation against applicable framework requirements
   - Maturity assessment and gap identification
   - Benchmarking against industry standards

4. AI-Enhanced Analysis
   - Automated risk scoring and validation
   - Pattern recognition and correlation analysis
   - Predictive analytics for risk trends

The assessment leveraged both automated tools and manual review processes to ensure 
comprehensive coverage and accurate results.
    `.trim();
  }

  private generateRiskAnalysisContent(riskAssessment: any): string {
    return `
Risk Assessment Summary:

Total Risks Assessed: ${riskAssessment.totalRisks}
Risk Distribution:
- Critical: ${riskAssessment.risksByLevel.CRITICAL || 0}
- High: ${riskAssessment.risksByLevel.HIGH || 0}
- Medium: ${riskAssessment.risksByLevel.MEDIUM || 0}
- Low: ${riskAssessment.risksByLevel.LOW || 0}

Inherent vs. Residual Risk:
- Total Inherent Risk: ${riskAssessment.inherentVsResidual.totalInherentRisk}
- Total Residual Risk: ${riskAssessment.inherentVsResidual.totalResidualRisk}
- Overall Risk Reduction: ${riskAssessment.inherentVsResidual.overallRiskReduction}%
- Average Control Effectiveness: ${riskAssessment.inherentVsResidual.averageControlEffectiveness}%

The risk assessment identified ${riskAssessment.risksByLevel.CRITICAL + riskAssessment.risksByLevel.HIGH} 
high-priority risks requiring immediate attention. Control effectiveness analysis shows an average 
effectiveness of ${riskAssessment.inherentVsResidual.averageControlEffectiveness}%, indicating 
${riskAssessment.inherentVsResidual.averageControlEffectiveness >= 70 ? 'adequate' : 'insufficient'} 
risk mitigation capabilities.
    `.trim();
  }

  private generateControlAnalysisContent(controlEffectiveness: any): string {
    return `
Control Effectiveness Assessment:

Total Controls Assessed: ${controlEffectiveness.totalControls}
Average Effectiveness Rating: ${controlEffectiveness.averageEffectiveness}%

Control Distribution by Effectiveness:
- High (80%+): ${controlEffectiveness.controlsByEffectiveness.high || 0}
- Medium (60-79%): ${controlEffectiveness.controlsByEffectiveness.medium || 0}
- Low (<60%): ${controlEffectiveness.controlsByEffectiveness.low || 0}

Control Gaps Identified: ${controlEffectiveness.gaps.length}

The control effectiveness assessment reveals ${controlEffectiveness.averageEffectiveness >= 70 ? 'adequate' : 'insufficient'} 
overall control performance. ${controlEffectiveness.gaps.length} significant gaps have been identified 
that require remediation to improve the overall control environment.

Key areas for improvement include:
${controlEffectiveness.gaps
  .slice(0, 5)
  .map((gap: any) => `- ${gap.description}`)
  .join('\n')}
    `.trim();
  }

  private generateComplianceAnalysisContent(complianceAssessment: any): string {
    return `
Compliance Framework Assessment - ${complianceAssessment.framework}:

Overall Score: ${complianceAssessment.overallScore}%
Overall Rating: ${complianceAssessment.overallRating.toUpperCase()}

Component Scores:
${complianceAssessment.componentScores
  .map((comp: any) => `- ${comp.componentName}: ${comp.score}% (${comp.rating})`)
  .join('\n')}

Compliance Gaps: ${complianceAssessment.gaps.length}
Material Weaknesses: ${complianceAssessment.materialWeaknesses.length}

The compliance assessment indicates ${complianceAssessment.overallScore >= 70 ? 'adequate' : 'insufficient'} 
adherence to ${complianceAssessment.framework} requirements. 
${
  complianceAssessment.materialWeaknesses.length > 0
    ? `${complianceAssessment.materialWeaknesses.length} material weakness(es) require immediate remediation.`
    : 'No material weaknesses were identified.'
}
    `.trim();
  }

  private generateKeyFindings(_results: AssessmentResults): string {
    const findings = [];

    // Risk findings
    const criticalRisks = results.riskAssessment.risksByLevel.CRITICAL || 0
    if (criticalRisks > 0) {
      findings.push(`${criticalRisks} critical risk(s) identified requiring immediate attention`);
    }

    // Control findings
    const lowEffectivenessControls = results.controlEffectiveness.controlsByEffectiveness.low || 0
    if (lowEffectivenessControls > 0) {
      findings.push(
        `${lowEffectivenessControls} control(s) with low effectiveness requiring improvement`
      );
    }

    // Compliance findings
    if (results.complianceAssessment.materialWeaknesses.length > 0) {
      findings.push(
        `${results.complianceAssessment.materialWeaknesses.length} material weakness(es) in compliance framework`
      )
    }

    // Positive findings
    if (results.riskAssessment.inherentVsResidual.overallRiskReduction > 50) {
      findings.push(
        `Strong risk mitigation with ${results.riskAssessment.inherentVsResidual.overallRiskReduction}% overall risk reduction`
      )
    }

    return findings.length > 0
      ? findings.map((f) => `• ${f}`).join('\n')
      : '• No significant findings identified';
  }

  private generateDetailedFindings(_results: AssessmentResults): string {
    return `
Detailed Assessment Findings:

RISK MANAGEMENT:
${this.generateRiskFindings(results.riskAssessment)}

CONTROL EFFECTIVENESS:
${this.generateControlFindings(results.controlEffectiveness)}

COMPLIANCE FRAMEWORK:
${this.generateComplianceFindings(results.complianceAssessment)}
    `.trim();
  }

  private generateRiskFindings(riskAssessment: any): string {
    const findings = [];

    findings.push(`• ${riskAssessment.totalRisks} total risks assessed across all categories`);

    if (riskAssessment.risksByLevel.CRITICAL > 0) {
      findings.push(
        `• ${riskAssessment.risksByLevel.CRITICAL} critical risks requiring immediate mitigation`
      );
    }

    findings.push(
      `• Overall risk reduction of ${riskAssessment.inherentVsResidual.overallRiskReduction}% achieved through existing controls`
    );

    if (riskAssessment.topRisks.length > 0) {
      findings.push(
        `• Top risk: "${riskAssessment.topRisks[0].title}" with score ${riskAssessment.topRisks[0].riskScore}`
      );
    }

    return findings.join('\n');
  }

  private generateControlFindings(controlEffectiveness: any): string {
    const findings = [];

    findings.push(
      `• ${controlEffectiveness.totalControls} controls evaluated with average effectiveness of ${controlEffectiveness.averageEffectiveness}%`
    );

    if (controlEffectiveness.gaps.length > 0) {
      findings.push(
        `• ${controlEffectiveness.gaps.length} control gaps identified requiring remediation`
      );
      findings.push(`• Most critical gap: ${controlEffectiveness.gaps[0]?.description || 'N/A'}`);
    }

    const highEffectivenessControls = controlEffectiveness.controlsByEffectiveness.high || 0;
    findings.push(`• ${highEffectivenessControls} controls demonstrate high effectiveness (≥80%)`);

    return findings.join('\n');
  }

  private generateComplianceFindings(complianceAssessment: any): string {
    const findings = [];

    findings.push(
      `• Overall ${complianceAssessment.framework} compliance score: ${complianceAssessment.overallScore}%`
    );
    findings.push(`• Compliance rating: ${complianceAssessment.overallRating.toUpperCase()}`);

    if (complianceAssessment.materialWeaknesses.length > 0) {
      findings.push(
        `• ${complianceAssessment.materialWeaknesses.length} material weakness(es) identified`
      );
    }

    if (complianceAssessment.gaps.length > 0) {
      findings.push(`• ${complianceAssessment.gaps.length} compliance gaps requiring attention`);
    }

    const lowestComponent = complianceAssessment.componentScores.reduce(
      (min: any, comp: any) => (comp.score < min.score ? comp : min),
      complianceAssessment.componentScores[0]
    );

    if (lowestComponent) {
      findings.push(
        `• Lowest scoring component: ${lowestComponent.componentName} (${lowestComponent.score}%)`
      );
    }

    return findings.join('\n');
  }

  private generateRecommendationsText(recommendations: any[]): string {
    if (recommendations.length === 0) {
      return 'No specific recommendations generated.';
    }

    const criticalRecs = recommendations.filter((r: any) => r.priority === 'critical');
    const highRecs = recommendations.filter((r: any) => r.priority === 'high');

    let content = `Priority Recommendations:\n\n`;

    if (criticalRecs.length > 0) {
      content += `CRITICAL PRIORITY (${criticalRecs.length}):\n`;
      criticalRecs.slice(0, 5).forEach((rec: any, index: number) => {
        content += `${index + 1}. ${rec.title}\n`;
        content += `   ${rec.description}\n`;
        content += `   Timeline: ${rec.timeline} days | Cost: $${rec.cost?.toLocaleString() || 'TBD'}\n\n`;
      });
    }

    if (highRecs.length > 0) {
      content += `HIGH PRIORITY (${highRecs.length}):\n`;
      highRecs.slice(0, 5).forEach((rec: any, index: number) => {
        content += `${index + 1}. ${rec.title}\n`;
        content += `   ${rec.description}\n`;
        content += `   Timeline: ${rec.timeline} days | Cost: $${rec.cost?.toLocaleString() || 'TBD'}\n\n`;
      });
    }

    return content.trim();
  }

  private generateActionPlanContent(actionPlan: any[]): string {
    if (actionPlan.length === 0) {
      return 'No action items generated.';
    }

    const criticalActions = actionPlan.filter((a: any) => a.priority === 'critical');
    const highActions = actionPlan.filter((a: any) => a.priority === 'high');

    let content = `Implementation Action Plan:\n\n`;

    content += `IMMEDIATE ACTIONS (Critical Priority - ${criticalActions.length}):\n`;
    criticalActions.slice(0, 5).forEach((_action: any, index: number) => {
      content += `${index + 1}. ${action.title}\n`;
      content += `   Owner: ${action.owner}\n`;
      content += `   Due Date: ${new Date(action.dueDate).toLocaleDateString()}\n`;
      content += `   Estimated Cost: $${action.estimatedCost?.toLocaleString() || 'TBD'}\n\n`;
    });

    content += `SHORT-TERM ACTIONS (High Priority - ${highActions.length}):\n`;
    highActions.slice(0, 5).forEach((_action: any, index: number) => {
      content += `${index + 1}. ${action.title}\n`;
      content += `   Owner: ${action.owner}\n`;
      content += `   Due Date: ${new Date(action.dueDate).toLocaleDateString()}\n`;
      content += `   Estimated Cost: $${action.estimatedCost?.toLocaleString() || 'TBD'}\n\n`;
    });

    const totalCost = actionPlan.reduce(
      (sum: number, action: any) => sum + (action.estimatedCost || 0),
      0
    );
    content += `Total Estimated Implementation Cost: $${totalCost.toLocaleString()}\n`;

    return content.trim();
  }

  private generateMaterialWeaknessesContent(complianceAssessment: any): string {
    if (complianceAssessment.materialWeaknesses.length === 0) {
      return 'No material weaknesses identified during this assessment.';
    }

    let content = `Material Weaknesses Identified:\n\n`;

    complianceAssessment.materialWeaknesses.forEach((mw: any, index: number) => {
      content += `${index + 1}. ${mw.title}\n`;
      content += `   Description: ${mw.description}\n`;
      content += `   Business Impact: ${mw.businessImpact}\n`;
      content += `   Financial Impact: $${mw.financialImpact?.toLocaleString() || 'TBD'}\n`;
      content += `   Likelihood: ${mw.likelihood}\n`;
      content += `   Remediation Timeline: ${mw.remediation?.timeline || 'TBD'} days\n\n`;
    });

    return content.trim();
  }

  private generateRemediationPlanContent(_results: AssessmentResults): string {
    const materialWeaknesses = results.complianceAssessment.materialWeaknesses || [];
    const criticalRecommendations = results.recommendations.filter(
      (r) => r.priority === 'critical'
    );

    let content = `Remediation Plan:\n\n`;

    if (materialWeaknesses.length > 0) {
      content += `MATERIAL WEAKNESS REMEDIATION:\n`;
      materialWeaknesses.forEach((mw: any, index: number) => {
        content += `${index + 1}. ${mw.title}\n`;
        content += `   Remediation: ${mw.remediation?.description || 'TBD'}\n`;
        content += `   Owner: ${mw.remediation?.owner || 'TBD'}\n`;
        content += `   Timeline: ${mw.remediation?.timeline || 'TBD'} days\n`;
        content += `   Budget: $${mw.remediation?.budget?.toLocaleString() || 'TBD'}\n\n`;
      });
    }

    if (criticalRecommendations.length > 0) {
      content += `CRITICAL ISSUE REMEDIATION:\n`;
      criticalRecommendations.slice(0, 5).forEach((rec, index) => {
        content += `${index + 1}. ${rec.title}\n`;
        content += `   Implementation: ${rec.implementation?.join(', ') || 'TBD'}\n`;
        content += `   Timeline: ${rec.timeline} days\n`;
        content += `   Cost: $${rec.cost?.toLocaleString() || 'TBD'}\n\n`;
      });
    }

    return content.trim();
  }

  // Formatting helper methods
  private formatContent(_content: string, format: string): string {
    switch (format) {
      case 'html':
        return `<div class="content">${content.replace(/\n/g, '<br>')}</div>\n`
      case 'pdf':
      case 'docx':
        return content + '\n\n';
      default:
        return content + '\n\n';
    }
  }

  private formatSectionHeader(title: string, format: string): string {
    switch (format) {
      case 'html':
        return `<h2 class="section-header">${title}</h2>\n`;
      case 'pdf':
      case 'docx':
        return `\n${title}\n${'='.repeat(title.length)}\n\n`;
      default:
        return `\n${title}\n${'='.repeat(title.length)}\n\n`;
    }
  }

  private generateReportHeader(template: ReportTemplate, options: ReportGenerationOptions): string {
    const format = options.format || template.format;

    switch (format) {
      case 'html':
        return `
<!DOCTYPE html>
<html>
<head>
    <title>${template.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 40px; }
        .section-header { color: #333; border-bottom: 2px solid #007acc; padding-bottom: 5px; }
        .content { margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .chart-placeholder { background: #f9f9f9; padding: 20px; text-align: center; margin: 20px 0; }
    </style>
</head>
<body>
<div class="header">
    <h1>${template.name}</h1>
    <p>Generated on ${new Date().toLocaleDateString()}</p>
</div>
`;
      default:
        return `${template.name}\nGenerated on ${new Date().toLocaleDateString()}\n\n`;
    }
  }

  private generateReportFooter(template: ReportTemplate, options: ReportGenerationOptions): string {
    const format = options.format || template.format;

    switch (format) {
      case 'html':
        return `
<div class="footer">
    <p><em>This report was generated automatically by the ARIA Risk Assessment platform.</em></p>
</div>
</body>
</html>`;
      default:
        return '\n\nThis report was generated automatically by the ARIA Risk Assessment platform.';
    }
  }

  private generateHTMLChart(chart: ChartConfig): string {
    return `
<div class="chart-placeholder">
    <h3>${chart.title}</h3>
    <p>Chart Type: ${chart.type.toUpperCase()}</p>
    <p>Data Points: ${chart.data.length}</p>
    <p><em>Chart visualization would be rendered here in the actual implementation.</em></p>
</div>
`;
  }

  private generateChartPlaceholder(chart: ChartConfig): string {
    return `\n[CHART: ${chart.title} - ${chart.type.toUpperCase()} - ${chart.data.length} data points]\n\n`;
  }

  private generateHTMLTable(_table: TableConfig): string {
    let html = `<h3>${table.title}</h3>\n<table>\n<thead>\n<tr>\n`;

    table.headers.forEach((header) => {
      html += `<th>${header}</th>\n`;
    });

    html += '</tr>\n</thead>\n<tbody>\n';

    table.rows.forEach((row) => {
      html += '<tr>\n';
      row.forEach((cell) => {
        html += `<td>${cell}</td>\n`;
      });
      html += '</tr>\n';
    });

    html += '</tbody>\n</table>\n';

    return html;
  }

  private generateTablePlaceholder(_table: TableConfig): string {
    let text = `\n${table.title}\n${'-'.repeat(table.title.length)}\n`;

    // Add headers
    text += table.headers.join(' | ') + '\n'
    text += table.headers.map(() => '---').join(' | ') + '\n';

    // Add rows (limit to first 10 for readability)
    table.rows.slice(0, 10).forEach((row) => {
      text += row.join(' | ') + '\n'
    });

    if (table.rows.length > 10) {
      text += `... and ${table.rows.length - 10} more rows\n`;
    }

    return text + '\n';
  }

  // Utility methods
  private selectDefaultTemplate(audience?: string): string {
    switch (audience) {
      case 'executive':
        return 'executive-summary'
      case 'technical':
        return 'technical-detailed';
      case 'regulatory':
        return 'regulatory-compliance';
      default:
        return 'executive-summary';
    }
  }

  private generateReportTitle(template: ReportTemplate, results: AssessmentResults): string {
    const framework = results.complianceAssessment.framework;
    const date = new Date().toLocaleDateString();
    return `${framework} ${template.name} - ${date}`;
  }

  private estimatePageCount(_content: string): number {
    // Rough estimation: 500 words per page
    const wordCount = content.split(/\s+/).length
    return Math.ceil(wordCount / 500);
  }

  private countCharts(template: ReportTemplate): number {
    return template.sections.reduce((count, section) => count + (section.charts?.length || 0), 0);
  }

  private countTables(template: ReportTemplate): number {
    return template.sections.reduce((count, section) => count + (section.tables?.length || 0), 0);
  }

  private estimateFileSize(_content: string): number {
    // Rough estimation in bytes
    return content.length * 2; // Account for formatting and metadata
  }

  private generateExecutiveSummaryContent(_results: AssessmentResults): string {
    const riskSummary = results.riskAssessment
      ? `Total Risks: ${results.riskAssessment.totalRisks || 0}, Critical: ${results.riskAssessment.risksByLevel?.CRITICAL || 0}`
      : 'Risk assessment data not available';

    const complianceSummary = results.complianceAssessment
      ? `Compliance Score: ${results.complianceAssessment.overallScore || 0}%, Rating: ${results.complianceAssessment.overallRating || 'N/A'}`
      : 'Compliance assessment data not available';

    const controlSummary = results.controlEffectiveness
      ? `Total Controls: ${results.controlEffectiveness.totalControls || 0}, Average Effectiveness: ${results.controlEffectiveness.averageEffectiveness || 0}%`
      : 'Control effectiveness data not available';

    return `
EXECUTIVE SUMMARY

${riskSummary}
${complianceSummary}
${controlSummary}

This assessment was conducted to evaluate the organization's risk posture, compliance status, and control effectiveness. 
The results provide insights into areas requiring immediate attention and recommendations for improvement.
    `.trim();
  }

  // Public methods for template management
  getAvailableTemplates(): ReportTemplate[] {
    return Array.from(this.templates.values())
  }

  getTemplate(templateId: string): ReportTemplate | undefined {
    return this.templates.get(templateId);
  }

  addCustomTemplate(template: ReportTemplate): void {
    this.templates.set(template.id, template);
  }
}

export const reportGenerationService = new ReportGenerationService();
