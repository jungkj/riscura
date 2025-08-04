import { ReportTemplate, ReportLayout } from './engine';

// Risk Register Template
export const riskRegisterTemplate: ReportTemplate = {
  id: 'risk-register',
  name: 'Risk Register',
  description: 'Comprehensive risk register with likelihood, impact, and mitigation status',
  category: 'risk',
  type: 'management',
  layout: {
    widgets: [
      {
        id: 'risk-summary-kpis',
        type: 'kpi',
        title: 'Risk Summary',
        position: { x: 0, y: 0, w: 3, h: 2 },
        dataSource: {
          type: 'query',
          source: 'SELECT COUNT(*) as total_risks FROM risks WHERE status = "open"',
          parameters: {},
        },
        visualization: {},
        filters: [],
      },
      {
        id: 'risk-by-category',
        type: 'chart',
        title: 'Risks by Category',
        position: { x: 3, y: 0, w: 4, h: 4 },
        dataSource: {
          type: 'query',
          source: 'SELECT category, COUNT(*) as count FROM risks GROUP BY category',
          parameters: {},
        },
        visualization: {
          chartType: 'pie',
          showLegend: true,
        },
        filters: [],
      },
      {
        id: 'risk-heatmap',
        type: 'chart',
        title: 'Risk Heat Map',
        position: { x: 7, y: 0, w: 5, h: 4 },
        dataSource: {
          type: 'query',
          source:
            'SELECT likelihood, impact, COUNT(*) as count FROM risks GROUP BY likelihood, impact',
          parameters: {},
        },
        visualization: {
          chartType: 'scatter',
          showLegend: false,
          xAxis: 'likelihood',
          yAxis: ['impact'],
        },
        filters: [],
      },
      {
        id: 'top-risks-table',
        type: 'table',
        title: 'Top Risks',
        position: { x: 0, y: 4, w: 12, h: 6 },
        dataSource: {
          type: 'query',
          source: `
            SELECT 
              r.name,
              r.category,
              r.likelihood,
              r.impact,
              (r.likelihood * r.impact) as risk_score,
              r.status,
              u.firstName || ' ' || u.lastName as owner
            FROM risks r
            LEFT JOIN users u ON r.ownerId = u.id
            ORDER BY risk_score DESC
            LIMIT 20
          `,
          parameters: {},
        },
        visualization: {},
        filters: [],
      },
    ],
    gridSettings: {
      cols: 12,
      rowHeight: 60,
      margin: [10, 10],
      containerPadding: [10, 10],
      breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
    },
  },
  requiredFields: ['risks', 'users'],
  tags: ['risk', 'register', 'management'],
  isSystem: true,
}

// Control Matrix Template
export const controlMatrixTemplate: ReportTemplate = {
  id: 'control-matrix',
  name: 'Control Matrix',
  description: 'Control effectiveness assessment matrix with gap analysis',
  category: 'control',
  type: 'management',
  layout: {
    widgets: [
      {
        id: 'control-effectiveness-kpi',
        type: 'kpi',
        title: 'Average Control Effectiveness',
        position: { x: 0, y: 0, w: 3, h: 2 },
        dataSource: {
          type: 'query',
          source: 'SELECT AVG(effectivenessScore) as avg_effectiveness FROM controls',
          parameters: {},
        },
        visualization: {},
        filters: [],
      },
      {
        id: 'controls-by-type',
        type: 'chart',
        title: 'Controls by Type',
        position: { x: 3, y: 0, w: 4, h: 3 },
        dataSource: {
          type: 'query',
          source: 'SELECT type, COUNT(*) as count FROM controls GROUP BY type',
          parameters: {},
        },
        visualization: {
          chartType: 'bar',
          showLegend: false,
        },
        filters: [],
      },
      {
        id: 'control-effectiveness-trend',
        type: 'chart',
        title: 'Control Effectiveness Trend',
        position: { x: 7, y: 0, w: 5, h: 3 },
        dataSource: {
          type: 'query',
          source: `
            SELECT 
              strftime('%Y-%m', updatedAt) as month,
              AVG(effectivenessScore) as avg_score
            FROM controls 
            WHERE updatedAt >= date('now', '-12 months')
            GROUP BY month
            ORDER BY month
          `,
          parameters: {},
        },
        visualization: {
          chartType: 'line',
          showLegend: false,
          showGrid: true,
        },
        filters: [],
      },
      {
        id: 'control-matrix-table',
        type: 'table',
        title: 'Control Matrix',
        position: { x: 0, y: 3, w: 12, h: 7 },
        dataSource: {
          type: 'query',
          source: `
            SELECT 
              c.name,
              c.type,
              c.category,
              c.effectivenessScore,
              c.testingFrequency,
              c.lastTestDate,
              u.firstName || ' ' || u.lastName as owner,
              COUNT(r.id) as risks_covered
            FROM controls c
            LEFT JOIN users u ON c.ownerId = u.id
            LEFT JOIN riskControls rc ON c.id = rc.controlId
            LEFT JOIN risks r ON rc.riskId = r.id
            GROUP BY c.id
            ORDER BY c.effectivenessScore ASC
          `,
          parameters: {},
        },
        visualization: {},
        filters: [],
      },
    ],
    gridSettings: {
      cols: 12,
      rowHeight: 60,
      margin: [10, 10],
      containerPadding: [10, 10],
      breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
    },
  },
  requiredFields: ['controls', 'users', 'risks'],
  tags: ['control', 'matrix', 'effectiveness'],
  isSystem: true,
}

// SOX Compliance Template
export const soxComplianceTemplate: ReportTemplate = {
  id: 'sox-compliance',
  name: 'SOX Compliance Report',
  description: 'Sarbanes-Oxley compliance reporting with key controls and deficiencies',
  category: 'compliance',
  type: 'regulatory',
  layout: {
    widgets: [
      {
        id: 'sox-compliance-score',
        type: 'kpi',
        title: 'SOX Compliance Score',
        position: { x: 0, y: 0, w: 3, h: 2 },
        dataSource: {
          type: 'query',
          source: `
            SELECT 
              ROUND(
                (COUNT(CASE WHEN effectivenessScore >= 80 THEN 1 END) * 100.0 / COUNT(*)), 0
              ) as compliance_score
            FROM controls 
            WHERE category = 'SOX'
          `,
          parameters: {},
        },
        visualization: {},
        filters: [],
      },
      {
        id: 'material-weaknesses',
        type: 'kpi',
        title: 'Material Weaknesses',
        position: { x: 3, y: 0, w: 3, h: 2 },
        dataSource: {
          type: 'query',
          source: `
            SELECT COUNT(*) as count
            FROM controls 
            WHERE category = 'SOX' AND effectivenessScore < 50
          `,
          parameters: {},
        },
        visualization: {},
        filters: [],
      },
      {
        id: 'significant-deficiencies',
        type: 'kpi',
        title: 'Significant Deficiencies',
        position: { x: 6, y: 0, w: 3, h: 2 },
        dataSource: {
          type: 'query',
          source: `
            SELECT COUNT(*) as count
            FROM controls 
            WHERE category = 'SOX' AND effectivenessScore BETWEEN 50 AND 79
          `,
          parameters: {},
        },
        visualization: {},
        filters: [],
      },
      {
        id: 'sox-control-testing',
        type: 'chart',
        title: 'SOX Control Testing Status',
        position: { x: 9, y: 0, w: 3, h: 2 },
        dataSource: {
          type: 'query',
          source: `
            SELECT 
              CASE 
                WHEN lastTestDate >= date('now', '-3 months') THEN 'Current'
                WHEN lastTestDate >= date('now', '-6 months') THEN 'Overdue'
                ELSE 'Critical'
              END as status,
              COUNT(*) as count
            FROM controls 
            WHERE category = 'SOX'
            GROUP BY status
          `,
          parameters: {},
        },
        visualization: {
          chartType: 'pie',
          showLegend: true,
        },
        filters: [],
      },
      {
        id: 'sox-controls-by-process',
        type: 'chart',
        title: 'SOX Controls by Process',
        position: { x: 0, y: 2, w: 6, h: 4 },
        dataSource: {
          type: 'query',
          source: `
            SELECT 
              subCategory as process,
              COUNT(*) as total_controls,
              COUNT(CASE WHEN effectivenessScore >= 80 THEN 1 END) as effective_controls
            FROM controls 
            WHERE category = 'SOX'
            GROUP BY subCategory
          `,
          parameters: {},
        },
        visualization: {
          chartType: 'bar',
          showLegend: true,
          showGrid: true,
        },
        filters: [],
      },
      {
        id: 'sox-deficiencies-trend',
        type: 'chart',
        title: 'Deficiencies Trend',
        position: { x: 6, y: 2, w: 6, h: 4 },
        dataSource: {
          type: 'query',
          source: `
            SELECT 
              strftime('%Y-%m', updatedAt) as month,
              COUNT(CASE WHEN effectivenessScore < 80 THEN 1 END) as deficiencies
            FROM controls 
            WHERE category = 'SOX' AND updatedAt >= date('now', '-12 months')
            GROUP BY month
            ORDER BY month
          `,
          parameters: {},
        },
        visualization: {
          chartType: 'line',
          showLegend: false,
          showGrid: true,
        },
        filters: [],
      },
      {
        id: 'sox-key-controls',
        type: 'table',
        title: 'Key SOX Controls',
        position: { x: 0, y: 6, w: 12, h: 6 },
        dataSource: {
          type: 'query',
          source: `
            SELECT 
              c.name,
              c.subCategory as process,
              c.effectivenessScore,
              c.lastTestDate,
              c.testingFrequency,
              u.firstName || ' ' || u.lastName as owner,
              CASE 
                WHEN c.effectivenessScore >= 80 THEN 'Effective'
                WHEN c.effectivenessScore >= 50 THEN 'Deficient'
                ELSE 'Material Weakness'
              END as status
            FROM controls c
            LEFT JOIN users u ON c.ownerId = u.id
            WHERE c.category = 'SOX'
            ORDER BY c.effectivenessScore ASC
          `,
          parameters: {},
        },
        visualization: {},
        filters: [],
      },
    ],
    gridSettings: {
      cols: 12,
      rowHeight: 60,
      margin: [10, 10],
      containerPadding: [10, 10],
      breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
    },
  },
  requiredFields: ['controls', 'users'],
  tags: ['sox', 'compliance', 'regulatory'],
  isSystem: true,
}

// ISO 27001 Template
export const iso27001Template: ReportTemplate = {
  id: 'iso-27001',
  name: 'ISO 27001 Compliance Report',
  description: 'Information security management system compliance assessment',
  category: 'compliance',
  type: 'regulatory',
  layout: {
    widgets: [
      {
        id: 'iso-compliance-kpi',
        type: 'kpi',
        title: 'ISO 27001 Compliance',
        position: { x: 0, y: 0, w: 3, h: 2 },
        dataSource: {
          type: 'query',
          source: `
            SELECT 
              ROUND(
                (COUNT(CASE WHEN effectivenessScore >= 75 THEN 1 END) * 100.0 / COUNT(*)), 0
              ) as compliance_score
            FROM controls 
            WHERE category = 'ISO27001'
          `,
          parameters: {},
        },
        visualization: {},
        filters: [],
      },
      {
        id: 'security-incidents-kpi',
        type: 'kpi',
        title: 'Security Incidents (MTD)',
        position: { x: 3, y: 0, w: 3, h: 2 },
        dataSource: {
          type: 'query',
          source: `
            SELECT COUNT(*) as count
            FROM risks 
            WHERE category = 'Security' 
            AND status = 'incident'
            AND createdAt >= date('now', 'start of month')
          `,
          parameters: {},
        },
        visualization: {},
        filters: [],
      },
      {
        id: 'controls-by-domain',
        type: 'chart',
        title: 'Controls by ISO Domain',
        position: { x: 6, y: 0, w: 6, h: 4 },
        dataSource: {
          type: 'query',
          source: `
            SELECT 
              subCategory as domain,
              COUNT(*) as total,
              COUNT(CASE WHEN effectivenessScore >= 75 THEN 1 END) as compliant
            FROM controls 
            WHERE category = 'ISO27001'
            GROUP BY subCategory
          `,
          parameters: {},
        },
        visualization: {
          chartType: 'bar',
          showLegend: true,
          showGrid: true,
        },
        filters: [],
      },
      {
        id: 'vulnerability-assessment',
        type: 'chart',
        title: 'Vulnerability Assessment',
        position: { x: 0, y: 2, w: 6, h: 4 },
        dataSource: {
          type: 'query',
          source: `
            SELECT 
              CASE 
                WHEN likelihood * impact >= 15 THEN 'Critical'
                WHEN likelihood * impact >= 10 THEN 'High'
                WHEN likelihood * impact >= 5 THEN 'Medium'
                ELSE 'Low'
              END as severity,
              COUNT(*) as count
            FROM risks 
            WHERE category = 'Security'
            GROUP BY severity
          `,
          parameters: {},
        },
        visualization: {
          chartType: 'pie',
          showLegend: true,
        },
        filters: [],
      },
      {
        id: 'iso-controls-table',
        type: 'table',
        title: 'ISO 27001 Controls Status',
        position: { x: 0, y: 6, w: 12, h: 6 },
        dataSource: {
          type: 'query',
          source: `
            SELECT 
              c.name,
              c.subCategory as domain,
              c.effectivenessScore,
              c.lastTestDate,
              u.firstName || ' ' || u.lastName as owner,
              CASE 
                WHEN c.effectivenessScore >= 75 THEN 'Compliant'
                WHEN c.effectivenessScore >= 50 THEN 'Partially Compliant'
                ELSE 'Non-Compliant'
              END as status
            FROM controls c
            LEFT JOIN users u ON c.ownerId = u.id
            WHERE c.category = 'ISO27001'
            ORDER BY c.subCategory, c.effectivenessScore ASC
          `,
          parameters: {},
        },
        visualization: {},
        filters: [],
      },
    ],
    gridSettings: {
      cols: 12,
      rowHeight: 60,
      margin: [10, 10],
      containerPadding: [10, 10],
      breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
    },
  },
  requiredFields: ['controls', 'users', 'risks'],
  tags: ['iso27001', 'security', 'compliance'],
  isSystem: true,
}

// Executive Summary Template
export const executiveSummaryTemplate: ReportTemplate = {
  id: 'executive-summary',
  name: 'Executive Risk Summary',
  description: 'High-level executive dashboard with key risk metrics and trends',
  category: 'executive',
  type: 'management',
  layout: {
    widgets: [
      {
        id: 'risk-appetite-kpi',
        type: 'kpi',
        title: 'Risk Appetite Utilization',
        position: { x: 0, y: 0, w: 3, h: 2 },
        dataSource: {
          type: 'query',
          source: `
            SELECT 
              ROUND(
                (SUM(likelihood * impact) * 100.0 / (COUNT(*) * 25)), 0
              ) as utilization
            FROM risks 
            WHERE status = 'open'
          `,
          parameters: {},
        },
        visualization: {},
        filters: [],
      },
      {
        id: 'residual-risk-kpi',
        type: 'kpi',
        title: 'Average Residual Risk',
        position: { x: 3, y: 0, w: 3, h: 2 },
        dataSource: {
          type: 'query',
          source: `
            SELECT 
              ROUND(AVG(likelihood * impact), 1) as avg_risk
            FROM risks 
            WHERE status = 'open'
          `,
          parameters: {},
        },
        visualization: {},
        filters: [],
      },
      {
        id: 'control-maturity-kpi',
        type: 'kpi',
        title: 'Control Maturity',
        position: { x: 6, y: 0, w: 3, h: 2 },
        dataSource: {
          type: 'query',
          source: 'SELECT ROUND(AVG(effectivenessScore), 0) as maturity FROM controls',
          parameters: {},
        },
        visualization: {},
        filters: [],
      },
      {
        id: 'incidents-kpi',
        type: 'kpi',
        title: 'Incidents This Quarter',
        position: { x: 9, y: 0, w: 3, h: 2 },
        dataSource: {
          type: 'query',
          source: `
            SELECT COUNT(*) as count
            FROM risks 
            WHERE status = 'incident'
            AND createdAt >= date('now', 'start of month', '-2 months')
          `,
          parameters: {},
        },
        visualization: {},
        filters: [],
      },
      {
        id: 'risk-trend-chart',
        type: 'chart',
        title: 'Risk Trend (Last 12 Months)',
        position: { x: 0, y: 2, w: 8, h: 4 },
        dataSource: {
          type: 'query',
          source: `
            SELECT 
              strftime('%Y-%m', createdAt) as month,
              COUNT(*) as new_risks,
              COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_risks
            FROM risks 
            WHERE createdAt >= date('now', '-12 months')
            GROUP BY month
            ORDER BY month
          `,
          parameters: {},
        },
        visualization: {
          chartType: 'line',
          showLegend: true,
          showGrid: true,
        },
        filters: [],
      },
      {
        id: 'top-risks-by-impact',
        type: 'chart',
        title: 'Top Risk Categories',
        position: { x: 8, y: 2, w: 4, h: 4 },
        dataSource: {
          type: 'query',
          source: `
            SELECT 
              category,
              SUM(likelihood * impact) as total_impact
            FROM risks 
            WHERE status = 'open'
            GROUP BY category
            ORDER BY total_impact DESC
            LIMIT 5
          `,
          parameters: {},
        },
        visualization: {
          chartType: 'bar',
          showLegend: false,
        },
        filters: [],
      },
      {
        id: 'executive-summary-text',
        type: 'text',
        title: 'Key Insights',
        position: { x: 0, y: 6, w: 12, h: 3 },
        dataSource: {
          type: 'static',
          source: `Risk Management Summary:

• Overall risk exposure remains within acceptable limits
• Control effectiveness has improved by 5% this quarter
• 3 new risks identified, 2 risks closed
• Recommend increased focus on cybersecurity controls
• Next assessment scheduled for Q2`,
          parameters: {},
        },
        visualization: {},
        filters: [],
      },
    ],
    gridSettings: {
      cols: 12,
      rowHeight: 60,
      margin: [10, 10],
      containerPadding: [10, 10],
      breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
    },
  },
  requiredFields: ['risks', 'controls'],
  tags: ['executive', 'summary', 'dashboard'],
  isSystem: true,
}

// Export all templates
export const reportTemplates: ReportTemplate[] = [
  riskRegisterTemplate,
  controlMatrixTemplate,
  soxComplianceTemplate,
  iso27001Template,
  executiveSummaryTemplate,
]

// Template categories
export const templateCategories = {
  risk: [riskRegisterTemplate],
  control: [controlMatrixTemplate],
  compliance: [soxComplianceTemplate, iso27001Template],
  executive: [executiveSummaryTemplate],
}

// Get template by ID
export function getTemplateById(id: string): ReportTemplate | undefined {
  return reportTemplates.find((template) => template.id === id)
}

// Get templates by category
export function getTemplatesByCategory(category: string): ReportTemplate[] {
  return reportTemplates.filter((template) => template.category === category)
}

// Get templates by type
export function getTemplatesByType(_type: string): ReportTemplate[] {
  return reportTemplates.filter((template) => template.type === type)
}
