import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

export interface PDFGenerationOptions {
  fileName: string;
  organizationId: string;
  template?: string;
  orientation?: 'portrait' | 'landscape';
  format?: 'A4' | 'Letter';
  margins?: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  }
  headerTemplate?: string;
  footerTemplate?: string;
  displayHeaderFooter?: boolean;
}

export interface PDFGenerationResult {
  filePath: string;
  fileSize: number;
  fileName: string;
}

const DEFAULT_OPTIONS: Partial<PDFGenerationOptions> = {
  orientation: 'portrait',
  format: 'A4',
  margins: {
    top: '1in',
    right: '1in',
    bottom: '1in',
    left: '1in',
  },
  displayHeaderFooter: true,
}

/**
 * Generate PDF from HTML template and data
 */
export async function generatePDF(
  templateName: string,
  data: any,
  options: PDFGenerationOptions
): Promise<PDFGenerationResult> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options }

  // Ensure reports directory exists
  const reportsDir = '/tmp/reports'
  await fs.mkdir(reportsDir, { recursive: true });

  const filePath = path.join(reportsDir, options.fileName);

  let browser: puppeteer.Browser | null = null;

  try {
    // Generate HTML content
    const htmlContent = await generateHTMLContent(templateName, data, mergedOptions)

    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage();

    // Set content
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
    })

    // Generate PDF
    const pdf = await page.pdf({
      path: filePath,
      format: mergedOptions.format as any,
      landscape: mergedOptions.orientation === 'landscape',
      margin: mergedOptions.margins,
      displayHeaderFooter: mergedOptions.displayHeaderFooter,
      headerTemplate: mergedOptions.headerTemplate || getDefaultHeaderTemplate(data),
      footerTemplate: mergedOptions.footerTemplate || getDefaultFooterTemplate(),
      printBackground: true,
    })

    const stats = await fs.stat(filePath);

    return {
      filePath,
      fileSize: stats.size,
      fileName: options.fileName,
    }
  } catch (error) {
    // console.error('PDF generation failed:', error)
    throw new Error(`PDF generation failed: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Generate HTML content from template and data
 */
async function generateHTMLContent(
  templateName: string,
  data: any,
  options: PDFGenerationOptions
): Promise<string> {
  const baseStyles = getBaseStyles();

  switch (templateName) {
    case 'risk_assessment_standard':
      return generateRiskAssessmentHTML(data, baseStyles);

    case 'compliance_status_standard':
      return generateComplianceStatusHTML(data, baseStyles);

    case 'control_effectiveness_standard':
      return generateControlEffectivenessHTML(data, baseStyles);

    case 'executive_summary_standard':
      return generateExecutiveSummaryHTML(data, baseStyles);

    case 'audit_trail_standard':
      return generateAuditTrailHTML(data, baseStyles);

    default:
      return generateGenericReportHTML(data, baseStyles);
  }
}

/**
 * Generate Risk Assessment Report HTML
 */
const generateRiskAssessmentHTML = (data: any, baseStyles: string): string {
  const { summary, risks, categoryDistribution, topRisks } = data;

  const periodText = data.filters?.dateRange
    ? data.filters.dateRange.from.toLocaleDateString() +
      ' - ' +
      data.filters.dateRange.to.toLocaleDateString()
    : 'All Time';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Risk Assessment Report</title>
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="report-container">
        <!-- Header -->
        <div class="report-header">
          <h1>Risk Assessment Report</h1>
          <p class="report-subtitle">Comprehensive Risk Analysis and Mitigation Overview</p>
          <div class="report-meta">
            <span>Generated: ${new Date().toLocaleDateString()}</span>
            <span>Period: ${periodText}</span>
          </div>
        </div>

        <!-- Executive Summary -->
        <div class="section">
          <h2>Executive Summary</h2>
          <div class="metrics-grid">
            <div class="metric-card critical">
              <div class="metric-value">${summary.totalRisks}</div>
              <div class="metric-label">Total Risks</div>
            </div>
            <div class="metric-card high">
              <div class="metric-value">${summary.criticalRisks}</div>
              <div class="metric-label">Critical Risks</div>
            </div>
            <div class="metric-card medium">
              <div class="metric-value">${summary.highRisks}</div>
              <div class="metric-label">High Risks</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${summary.averageRiskScore}</div>
              <div class="metric-label">Avg Risk Score</div>
            </div>
          </div>
        </div>

        <!-- Risk Distribution -->
        <div class="section">
          <h2>Risk Distribution by Category</h2>
          <div class="chart-container">
            ${generateCategoryChart(categoryDistribution)}
          </div>
        </div>

        <!-- Top Risks -->
        <div class="section">
          <h2>Top 10 Risks</h2>
          <table class="data-table">
            <thead>
              <tr>
                <th>Risk Title</th>
                <th>Category</th>
                <th>Likelihood</th>
                <th>Impact</th>
                <th>Risk Score</th>
                <th>Status</th>
                <th>Owner</th>
              </tr>
            </thead>
            <tbody>
              ${topRisks
                .map(
                  (_risk: any) => `
                <tr>
                  <td>${risk.title}</td>
                  <td><span class="category-badge">${risk.category}</span></td>
                  <td>${risk.likelihood}</td>
                  <td>${risk.impact}</td>
                  <td><span class="risk-score ${getRiskScoreClass(risk.riskScore)}">${risk.riskScore}</span></td>
                  <td><span class="status-badge ${risk.status.toLowerCase()}">${risk.status}</span></td>
                  <td>${risk.owner || 'Unassigned'}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>

        <!-- Detailed Risk List -->
        <div class="section">
          <h2>All Risks</h2>
          <div class="risk-list">
            ${risks
              .map(
                (_risk: any) => `
              <div class="risk-item">
                <div class="risk-header">
                  <h3>${risk.title}</h3>
                  <span class="risk-score ${getRiskScoreClass(risk.riskScore)}">${risk.riskScore}</span>
                </div>
                <div class="risk-details">
                  <p>${risk.description}</p>
                  <div class="risk-meta">
                    <span><strong>Category:</strong> ${risk.category}</span>
                    <span><strong>Status:</strong> ${risk.status}</span>
                    <span><strong>Owner:</strong> ${risk.owner || 'Unassigned'}</span>
                    <span><strong>Last Assessed:</strong> ${risk.lastAssessed ? new Date(risk.lastAssessed).toLocaleDateString() : 'Never'}</span>
                  </div>
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate Compliance Status Report HTML
 */
const generateComplianceStatusHTML = (data: any, baseStyles: string): string {
  const { frameworks, complianceScores, overallCompliance } = data;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Compliance Status Report</title>
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="report-container">
        <div class="report-header">
          <h1>Compliance Status Report</h1>
          <p class="report-subtitle">Framework Compliance Overview and Gap Analysis</p>
          <div class="report-meta">
            <span>Generated: ${new Date().toLocaleDateString()}</span>
            <span>Overall Compliance: ${Math.round(overallCompliance)}%</span>
          </div>
        </div>

        <div class="section">
          <h2>Compliance Overview</h2>
          <div class="compliance-overview">
            <div class="overall-score">
              <div class="score-circle">
                <span class="score-value">${Math.round(overallCompliance)}%</span>
              </div>
              <p>Overall Compliance Score</p>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Framework Compliance Scores</h2>
          <table class="data-table">
            <thead>
              <tr>
                <th>Framework</th>
                <th>Compliance Score</th>
                <th>Met Requirements</th>
                <th>Total Requirements</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${complianceScores
                .map(
                  (score: any) => `
                <tr>
                  <td>${score.frameworkName}</td>
                  <td>
                    <div class="compliance-bar">
                      <div class="compliance-fill" style="width: ${score.score}%"></div>
                      <span class="compliance-text">${Math.round(score.score)}%</span>
                    </div>
                  </td>
                  <td>${score.metRequirements}</td>
                  <td>${score.totalRequirements}</td>
                  <td><span class="status-badge ${getComplianceStatus(score.score)}">${getComplianceStatusText(score.score)}</span></td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Framework Details</h2>
          ${frameworks
            .map(
              (_framework: any) => `
            <div class="framework-detail">
              <h3>${framework.name}</h3>
              <p>${framework.description || 'No description available'}</p>
              <div class="requirements-summary">
                <span><strong>Total Requirements:</strong> ${framework.requirements?.length || 0}</span>
                <span><strong>Version:</strong> ${framework.version || 'N/A'}</span>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate Control Effectiveness Report HTML
 */
const generateControlEffectivenessHTML = (data: any, baseStyles: string): string {
  const { controls, effectivenessStats, totalControls, averageEffectiveness } = data;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Control Effectiveness Report</title>
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="report-container">
        <div class="report-header">
          <h1>Control Effectiveness Report</h1>
          <p class="report-subtitle">Control Testing Results and Effectiveness Analysis</p>
          <div class="report-meta">
            <span>Generated: ${new Date().toLocaleDateString()}</span>
            <span>Total Controls: ${totalControls}</span>
          </div>
        </div>

        <div class="section">
          <h2>Effectiveness Summary</h2>
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-value">${totalControls}</div>
              <div class="metric-label">Total Controls</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${averageEffectiveness.toFixed(1)}</div>
              <div class="metric-label">Avg Effectiveness</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${effectivenessStats['EFFECTIVE'] || 0}</div>
              <div class="metric-label">Effective</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${effectivenessStats['INEFFECTIVE'] || 0}</div>
              <div class="metric-label">Ineffective</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Control Details</h2>
          <table class="data-table">
            <thead>
              <tr>
                <th>Control Title</th>
                <th>Category</th>
                <th>Type</th>
                <th>Status</th>
                <th>Effectiveness</th>
                <th>Owner</th>
                <th>Last Tested</th>
              </tr>
            </thead>
            <tbody>
              ${controls
                .map(
                  (control: any) => `
                <tr>
                  <td>${control.title}</td>
                  <td><span class="category-badge">${control.category}</span></td>
                  <td>${control.type}</td>
                  <td><span class="status-badge ${control.status.toLowerCase()}">${control.status}</span></td>
                  <td><span class="effectiveness-badge ${control.effectivenessRating?.toLowerCase()}">${control.effectivenessRating}</span></td>
                  <td>${control.owner || 'Unassigned'}</td>
                  <td>${control.lastTested ? new Date(control.lastTested).toLocaleDateString() : 'Never'}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate Executive Summary Report HTML
 */
const generateExecutiveSummaryHTML = (data: any, baseStyles: string): string {
  const { executiveSummary } = data;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Executive Summary</title>
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="report-container">
        <div class="report-header">
          <h1>Executive Summary</h1>
          <p class="report-subtitle">High-Level Risk and Compliance Overview</p>
          <div class="report-meta">
            <span>Generated: ${new Date().toLocaleDateString()}</span>
          </div>
        </div>

        <div class="section">
          <h2>Key Metrics</h2>
          <div class="executive-metrics">
            <div class="exec-metric">
              <div class="exec-value">${executiveSummary.totalRisks}</div>
              <div class="exec-label">Total Risks</div>
              <div class="exec-sublabel">${executiveSummary.criticalRisks} Critical</div>
            </div>
            <div class="exec-metric">
              <div class="exec-value">${Math.round(executiveSummary.averageCompliance)}%</div>
              <div class="exec-label">Compliance</div>
              <div class="exec-sublabel">Average Score</div>
            </div>
            <div class="exec-metric">
              <div class="exec-value">${executiveSummary.totalControls}</div>
              <div class="exec-label">Controls</div>
              <div class="exec-sublabel">${executiveSummary.controlEffectiveness.toFixed(1)} Avg Rating</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Risk Overview</h2>
          <p>The organization currently manages ${executiveSummary.totalRisks} identified risks, 
             with ${executiveSummary.criticalRisks} classified as critical priority.</p>
        </div>

        <div class="section">
          <h2>Compliance Status</h2>
          <p>Overall compliance score stands at ${Math.round(executiveSummary.averageCompliance)}%, 
             indicating ${getComplianceStatusText(executiveSummary.averageCompliance)} compliance posture.</p>
        </div>

        <div class="section">
          <h2>Control Effectiveness</h2>
          <p>The organization maintains ${executiveSummary.totalControls} controls with an average 
             effectiveness rating of ${executiveSummary.controlEffectiveness.toFixed(1)} out of 4.0.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate Audit Trail Report HTML
 */
const generateAuditTrailHTML = (data: any, baseStyles: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Audit Trail Report</title>
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="report-container">
        <div class="report-header">
          <h1>Audit Trail Report</h1>
          <p class="report-subtitle">System Activity and Change Log</p>
          <div class="report-meta">
            <span>Generated: ${new Date().toLocaleDateString()}</span>
          </div>
        </div>

        <div class="section">
          <h2>Activity Summary</h2>
          <p>Audit trail functionality is currently being implemented. This report will contain detailed logs of user activities, system changes, and access records.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate generic report HTML
 */
const generateGenericReportHTML = (data: any, baseStyles: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Report</title>
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="report-container">
        <div class="report-header">
          <h1>Report</h1>
          <div class="report-meta">
            <span>Generated: ${new Date().toLocaleDateString()}</span>
          </div>
        </div>

        <div class="section">
          <h2>Report Data</h2>
          <pre>${JSON.stringify(data, null, 2)}</pre>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Get base CSS styles for reports
 */
const getBaseStyles = (): string {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background: white;
    }

    .report-container {
      max-width: 100%;
      padding: 20px;
    }

    .report-header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e0e0e0;
    }

    .report-header h1 {
      font-size: 28px;
      font-weight: 700;
      color: #1a365d;
      margin-bottom: 8px;
    }

    .report-subtitle {
      font-size: 16px;
      color: #666;
      margin-bottom: 16px;
    }

    .report-meta {
      display: flex;
      justify-content: center;
      gap: 24px;
      font-size: 14px;
      color: #888;
    }

    .section {
      margin-bottom: 40px;
      page-break-inside: avoid;
    }

    .section h2 {
      font-size: 20px;
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }

    .metric-card {
      background: #f7fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
    }

    .metric-card.critical {
      border-color: #e53e3e;
      background: #fed7d7;
    }

    .metric-card.high {
      border-color: #dd6b20;
      background: #feebc8;
    }

    .metric-card.medium {
      border-color: #d69e2e;
      background: #faf089;
    }

    .metric-value {
      font-size: 32px;
      font-weight: 700;
      color: #1a365d;
      margin-bottom: 8px;
    }

    .metric-label {
      font-size: 14px;
      color: #666;
      font-weight: 500;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 14px;
    }

    .data-table th,
    .data-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }

    .data-table th {
      background: #f7fafc;
      font-weight: 600;
      color: #2d3748;
    }

    .data-table tr:hover {
      background: #f7fafc;
    }

    .category-badge {
      background: #edf2f7;
      color: #4a5568;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .status-badge.active {
      background: #c6f6d5;
      color: #22543d;
    }

    .status-badge.mitigated {
      background: #bee3f8;
      color: #2a4365;
    }

    .status-badge.identified {
      background: #feebc8;
      color: #744210;
    }

    .risk-score {
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 600;
      color: white;
    }

    .risk-score.critical {
      background: #e53e3e;
    }

    .risk-score.high {
      background: #dd6b20;
    }

    .risk-score.medium {
      background: #d69e2e;
    }

    .risk-score.low {
      background: #38a169;
    }

    .compliance-bar {
      position: relative;
      background: #e2e8f0;
      border-radius: 4px;
      height: 20px;
      min-width: 100px;
    }

    .compliance-fill {
      background: #38a169;
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .compliance-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 12px;
      font-weight: 600;
      color: #2d3748;
    }

    .executive-metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 30px;
      margin-bottom: 30px;
    }

    .exec-metric {
      text-align: center;
      padding: 30px;
      background: #f7fafc;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }

    .exec-value {
      font-size: 48px;
      font-weight: 700;
      color: #1a365d;
      margin-bottom: 8px;
    }

    .exec-label {
      font-size: 18px;
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 4px;
    }

    .exec-sublabel {
      font-size: 14px;
      color: #666;
    }

    .risk-list {
      space-y: 16px;
    }

    .risk-item {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 16px;
    }

    .risk-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .risk-header h3 {
      font-size: 16px;
      font-weight: 600;
      color: #2d3748;
    }

    .risk-details p {
      margin-bottom: 12px;
      color: #4a5568;
    }

    .risk-meta {
      display: flex;
      gap: 16px;
      font-size: 14px;
      color: #666;
    }

    @media print {
      .report-container {
        padding: 0;
      }
      
      .section {
        page-break-inside: avoid;
      }
    }
  `;
}

/**
 * Generate category chart HTML
 */
const generateCategoryChart = (distribution: Record<string, number>): string {
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);

  return `
    <div class="chart-bars">
      ${Object.entries(distribution)
        .map(([category, count]) => {
          const percentage = total > 0 ? (count / total) * 100 : 0;
          return `
          <div class="chart-bar">
            <div class="bar-label">${category}</div>
            <div class="bar-container">
              <div class="bar-fill" style="width: ${percentage}%"></div>
              <span class="bar-value">${count}</span>
            </div>
          </div>
        `;
        })
        .join('')}
    </div>
    <style>
      .chart-bars {
        margin: 20px 0;
      }
      .chart-bar {
        margin-bottom: 12px;
      }
      .bar-label {
        font-weight: 600;
        margin-bottom: 4px;
        color: #2d3748;
      }
      .bar-container {
        position: relative;
        background: #e2e8f0;
        border-radius: 4px;
        height: 24px;
      }
      .bar-fill {
        background: #4299e1;
        height: 100%;
        border-radius: 4px;
        transition: width 0.3s ease;
      }
      .bar-value {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 12px;
        font-weight: 600;
        color: #2d3748;
      }
    </style>
  `;
}

/**
 * Get default header template
 */
const getDefaultHeaderTemplate = (data: any): string {
  return `
    <div style="font-size: 10px; padding: 10px; border-bottom: 1px solid #e0e0e0; width: 100%; display: flex; justify-content: space-between;">
      <span>Riscura Risk Management Platform</span>
      <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
    </div>
  `;
}

/**
 * Get default footer template
 */
const getDefaultFooterTemplate = (): string {
  return `
    <div style="font-size: 10px; padding: 10px; border-top: 1px solid #e0e0e0; width: 100%; text-align: center;">
      <span>Generated on ${new Date().toLocaleDateString()} - Confidential</span>
    </div>
  `;
}

/**
 * Helper functions
 */
const getRiskScoreClass = (score: number): string {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

const getComplianceStatus = (score: number): string {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'fair';
  return 'poor';
}

const getComplianceStatusText = (score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Fair';
  return 'Needs Improvement';
}
