import ExcelJS from 'exceljs';
// import { format } from 'date-fns'
import * as XLSX from 'xlsx';
import fs from 'fs/promises';
import path from 'path';

// Types for Excel export
export interface ExcelExportOptions {
  filename?: string
  fileName?: string;
  worksheetName?: string;
  includeCharts?: boolean;
  includeSummary?: boolean;
  autoFitColumns?: boolean;
}

export interface ExcelTableData {
  headers: string[];
  rows: any[][];
  title?: string;
  summary?: Record<string, any>;
}

export interface ExcelWorkbookData {
  title: string;
  sheets: Array<{
    name: string;
    data: ExcelTableData;
    chartData?: any;
  }>;
  metadata?: {
    author: string;
    created: Date;
    description?: string;
  }
}

export interface CSVExportOptions {
  fileName: string;
  delimiter?: string;
  includeHeaders?: boolean;
  encoding?: string;
}

export interface ExportResult {
  filePath: string;
  fileSize: number;
  fileName: string;
}

// Excel Generator Class
export class ExcelExporter {
  private workbook: ExcelJS.Workbook

  constructor() {
    this.workbook = new ExcelJS.Workbook();
    this.workbook.creator = 'Riscura Platform';
    this.workbook.created = new Date();
  }

  // Create a new worksheet with data
  addWorksheet(
    name: string,
    data: ExcelTableData,
    options: ExcelExportOptions = {}
  ): ExcelJS.Worksheet {
    const worksheet = this.workbook.addWorksheet(name)

    // Add title if provided
    if (data.title) {
      worksheet.addRow([data.title])
      const titleRow = worksheet.getRow(1);
      titleRow.font = { bold: true, size: 16 }
      titleRow.alignment = { horizontal: 'center' }
      worksheet.mergeCells('A1:' + this.getColumnLetter(data.headers.length) + '1');
      worksheet.addRow([]); // Empty row
    }

    // Add summary if provided
    if (data.summary && options.includeSummary) {
      const summaryStartRow = worksheet.rowCount + 1
      worksheet.addRow(['Summary']);
      const summaryTitleRow = worksheet.getRow(summaryStartRow);
      summaryTitleRow.font = { bold: true, size: 14 }

      Object.entries(data.summary).forEach(([key, value]) => {
        const row = worksheet.addRow([this.formatLabel(key), this.formatValue(value)]);
        row.getCell(1).font = { bold: true }
      });

      worksheet.addRow([]); // Empty row
    }

    // Add headers
    const headerRow = worksheet.addRow(data.headers)
    headerRow.font = { bold: true }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE5E7EB' },
    }
    headerRow.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    }

    // Add data rows
    data.rows.forEach((row, index) => {
      const dataRow = worksheet.addRow(row.map((cell) => this.formatCellValue(cell)))

      // Alternate row colors
      if (index % 2 === 0) {
        dataRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9FAFB' },
        }
      }

      // Add borders
      dataRow.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      }
    });

    // Auto-fit columns
    if (options.autoFitColumns !== false) {
      worksheet.columns.forEach((column, index) => {
        const header = data.headers[index]
        const maxLength = Math.max(
          header?.length || 0,
          ...data.rows.map((row) => String(row[index] || '').length)
        );
        column.width = Math.min(Math.max(maxLength + 2, 10), 50);
      });
    }

    // Freeze header row
    worksheet.views = [{ state: 'frozen', ySplit: worksheet.rowCount - data.rows.length }]

    return worksheet;
  }

  // Add chart to worksheet
  addChart(worksheet: ExcelJS.Worksheet, chartData: any): void {
    // Note: ExcelJS chart support is limited, this is a placeholder for future enhancement
    const chartStartRow = worksheet.rowCount + 2
    worksheet.addRow(['Chart: ' + (chartData.title || 'Data Visualization')]);
    const chartRow = worksheet.getRow(chartStartRow);
    chartRow.font = { bold: true, size: 12 }

    // Add chart data summary
    if (chartData.data && Array.isArray(chartData.data)) {
      chartData.data.forEach((item: any, index: number) => {
        worksheet.addRow([`${item.label || `Item ${index + 1}`}`, item.value || 0])
      });
    }
  }

  // Generate buffer for download
  async generateBuffer(): Promise<Buffer> {
    return (await this.workbook.xlsx.writeBuffer()) as Buffer
  }

  // Save to file (Node.js environment)
  async saveToFile(filename: string): Promise<void> {
    await this.workbook.xlsx.writeFile(filename)
  }

  // Utility methods
  private getColumnLetter(columnNumber: number): string {
    let columnName = ''
    while (columnNumber > 0) {
      const modulo = (columnNumber - 1) % 26;
      columnName = String.fromCharCode(65 + modulo) + columnName;
      columnNumber = Math.floor((columnNumber - modulo) / 26);
    }
    return columnName;
  }

  private formatLabel(key: string): string {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
  }

  private formatValue(_value: any): any {
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value instanceof Date) return format(value, 'PP');
    return value;
  }

  private formatCellValue(_value: any): any {
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return value;
    if (value instanceof Date) return value;
    return String(value);
  }
}

// Convenience functions for common export scenarios
export const exportToExcel = async (_data: ExcelWorkbookData,
  options: ExcelExportOptions = {}
): Promise<Buffer> => {
  const exporter = new ExcelExporter()

  // Set workbook metadata
  if (data.metadata) {
    exporter['workbook'].creator = data.metadata.author
    exporter['workbook'].created = data.metadata.created;
    if (data.metadata.description) {
      exporter['workbook'].description = data.metadata.description;
    }
  }

  // Add worksheets
  data.sheets.forEach((sheet) => {
    const worksheet = exporter.addWorksheet(sheet.name, sheet.data, options)

    // Add chart if provided
    if (sheet.chartData && options.includeCharts) {
      exporter.addChart(worksheet, sheet.chartData)
    }
  });

  return await exporter.generateBuffer();
}

// Export single table to Excel
export const exportTableToExcel = async (
  tableData: ExcelTableData,
  options: ExcelExportOptions = {}
): Promise<Buffer> => {
  const workbookData: ExcelWorkbookData = {
    title: tableData.title || 'Data Export',
    sheets: [
      {
        name: options.worksheetName || 'Data',
        data: tableData,
      },
    ],
    metadata: {
      author: 'Riscura Platform',
      created: new Date(),
      description: 'Data export from Riscura platform',
    },
  }

  return await exportToExcel(workbookData, options);
}

// CSV Export functionality
export const exportToCSV = (_data: ExcelTableData): string => {
  const csvRows: string[] = []

  // Add title as comment if provided
  if (data.title) {
    csvRows.push(`# ${data.title}`)
    csvRows.push('');
  }

  // Add summary as comments if provided
  if (data.summary) {
    csvRows.push('# Summary')
    Object.entries(data.summary).forEach(([key, value]) => {
      csvRows.push(`# ${formatLabel(key)}: ${formatValue(value)}`);
    });
    csvRows.push('');
  }

  // Add headers
  csvRows.push(data.headers.map((header) => `"${header}"`).join(','))

  // Add data rows
  data.rows.forEach((row) => {
    const csvRow = row
      .map((cell) => {
        const value = formatCellValue(cell)
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (
          typeof value === 'string' &&
          (value.includes(',') || value.includes('"') || value.includes('\n'))
        ) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return String(value);
      })
      .join(',');
    csvRows.push(csvRow);
  });

  return csvRows.join('\n');
}

// Utility functions for CSV
const formatLabel = (key: string): string => {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())
}

const formatValue = (_value: any): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return value.toLocaleString();
  if (value instanceof Date) return format(value, 'PP');
  return String(value);
}

const formatCellValue = (_value: any): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return value.toString();
  if (value instanceof Date) return format(value, 'yyyy-MM-dd');
  return String(value);
}

// Predefined export templates
export const createRiskAssessmentExport = (_risks: any[]): ExcelWorkbookData => ({
  title: 'Risk Assessment Export',
  sheets: [
    {
      name: 'Risk Summary',
      data: {
        title: 'Risk Assessment Summary',
        headers: ['Metric', 'Value'],
        rows: [
          ['Total Risks', risks.length],
          ['High Severity', risks.filter((r) => r.severity === 'High').length],
          ['Medium Severity', risks.filter((r) => r.severity === 'Medium').length],
          ['Low Severity', risks.filter((r) => r.severity === 'Low').length],
          ['Open Risks', risks.filter((r) => r.status === 'Open').length],
          ['Mitigated Risks', risks.filter((r) => r.status === 'Mitigated').length],
        ],
      },
    },
    {
      name: 'Risk Details',
      data: {
        title: 'Detailed Risk Information',
        headers: [
          'Risk ID',
          'Title',
          'Description',
          'Category',
          'Severity',
          'Probability',
          'Impact',
          'Status',
          'Owner',
          'Created Date',
          'Last Updated',
        ],
        rows: risks.map((risk) => [
          risk.id,
          risk.title,
          risk.description,
          risk.category,
          risk.severity,
          risk.probability,
          risk.impact,
          risk.status,
          risk.owner,
          risk.createdAt,
          risk.updatedAt,
        ]),
      },
    },
  ],
  metadata: {
    author: 'Riscura Platform',
    created: new Date(),
    description: 'Comprehensive risk assessment data export',
  },
})

export const createComplianceExport = (complianceData: any[]): ExcelWorkbookData => ({
  title: 'Compliance Status Export',
  sheets: [
    {
      name: 'Compliance Summary',
      data: {
        title: 'Compliance Status Summary',
        headers: ['Status', 'Count', 'Percentage'],
        rows: [
          [
            'Compliant',
            complianceData.filter((c) => c.status === 'Compliant').length,
            `${((complianceData.filter((c) => c.status === 'Compliant').length / complianceData.length) * 100).toFixed(1)}%`,
          ],
          [
            'Non-Compliant',
            complianceData.filter((c) => c.status === 'Non-Compliant').length,
            `${((complianceData.filter((c) => c.status === 'Non-Compliant').length / complianceData.length) * 100).toFixed(1)}%`,
          ],
          [
            'In Progress',
            complianceData.filter((c) => c.status === 'In Progress').length,
            `${((complianceData.filter((c) => c.status === 'In Progress').length / complianceData.length) * 100).toFixed(1)}%`,
          ],
          [
            'Not Started',
            complianceData.filter((c) => c.status === 'Not Started').length,
            `${((complianceData.filter((c) => c.status === 'Not Started').length / complianceData.length) * 100).toFixed(1)}%`,
          ],
        ],
      },
    },
    {
      name: 'Compliance Details',
      data: {
        title: 'Detailed Compliance Information',
        headers: [
          'Requirement ID',
          'Requirement',
          'Framework',
          'Category',
          'Status',
          'Last Reviewed',
          'Next Review',
          'Owner',
          'Evidence',
          'Notes',
        ],
        rows: complianceData.map((item) => [
          item.id,
          item.requirement,
          item.framework,
          item.category,
          item.status,
          item.lastReviewed,
          item.nextReview,
          item.owner,
          item.evidence,
          item.notes,
        ]),
      },
    },
  ],
  metadata: {
    author: 'Riscura Platform',
    created: new Date(),
    description: 'Comprehensive compliance status data export',
  },
});

export const createAuditTrailExport = (auditData: any[]): ExcelWorkbookData => ({
  title: 'Audit Trail Export',
  sheets: [
    {
      name: 'Audit Trail',
      data: {
        title: 'System Audit Trail',
        headers: [
          'Timestamp',
          'User',
          'Action',
          'Resource Type',
          'Resource ID',
          'IP Address',
          'User Agent',
          'Status',
          'Details',
        ],
        rows: auditData.map((entry) => [
          entry.timestamp,
          entry.user,
          entry.action,
          entry.resourceType,
          entry.resourceId,
          entry.ipAddress,
          entry.userAgent,
          entry.status,
          entry.details,
        ]),
      },
    },
  ],
  metadata: {
    author: 'Riscura Platform',
    created: new Date(),
    description: 'System audit trail export for compliance and security monitoring',
  },
});

/**
 * Export data to Excel format (generic)
 */
export async function exportDataToExcel(_data: any,
  options: ExcelExportOptions
): Promise<ExportResult> {
  const reportsDir = '/tmp/reports';
  await fs.mkdir(reportsDir, { recursive: true });

  const filePath = path.join(reportsDir, options.fileName);

  try {
    // Create workbook
    const workbook = XLSX.utils.book_new()

    // Handle different data structures
    if (Array.isArray(data)) {
      // Simple array of objects
      const worksheet = XLSX.utils.json_to_sheet(data)
      XLSX.utils.book_append_sheet(workbook, worksheet, options.worksheetName || 'Data');
    } else if (data.sheets && Array.isArray(data.sheets)) {
      // Multiple sheets
      data.sheets.forEach((sheet: any) => {
        const worksheet = createWorksheetFromData(sheet.data)
        XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
      });
    } else if (data.summary || data.risks || data.controls) {
      // Report data structure
      await createReportWorkbook(workbook, data)
    } else {
      // Generic object
      const worksheet = XLSX.utils.json_to_sheet([data])
      XLSX.utils.book_append_sheet(workbook, worksheet, options.worksheetName || 'Data');
    }

    // Write file
    XLSX.writeFile(workbook, filePath)

    const _stats = await fs.stat(filePath);

    return {
      filePath,
      fileSize: stats.size,
      fileName: options.fileName,
    }
  } catch (error) {
    // console.error('Excel export failed:', error)
    throw new Error(`Excel export failed: ${error.message}`);
  }
}

/**
 * Create worksheet from various data formats
 */
const createWorksheetFromData = (_data: any): XLSX.WorkSheet {
  if (Array.isArray(data)) {
    return XLSX.utils.json_to_sheet(data);
  } else if (data.headers && data.rows) {
    // Table format
    const tableData = [data.headers, ...data.rows]
    return XLSX.utils.aoa_to_sheet(tableData);
  } else {
    return XLSX.utils.json_to_sheet([data]);
  }
}

/**
 * Create comprehensive workbook for report data
 */
async function createReportWorkbook(workbook: XLSX.WorkBook, data: any): Promise<void> {
  // Summary sheet
  if (data.summary) {
    const summaryData = Object.entries(data.summary).map(([key, value]) => ({
      Metric: key,
      Value: value,
    }))
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
  }

  // Risks sheet
  if (data.risks && Array.isArray(data.risks)) {
    const risksData = data.risks.map((_risk: any) => ({
      ID: risk.id,
      Title: risk.title,
      Description: risk.description,
      Category: risk.category,
      'Risk Level': risk.riskLevel,
      'Risk Score': risk.riskScore,
      Likelihood: risk.likelihood,
      Impact: risk.impact,
      Status: risk.status,
      Owner: risk.owner,
      'Date Identified': risk.dateIdentified
        ? new Date(risk.dateIdentified).toLocaleDateString()
        : '',
      'Last Assessed': risk.lastAssessed ? new Date(risk.lastAssessed).toLocaleDateString() : '',
    }))
    const risksSheet = XLSX.utils.json_to_sheet(risksData);
    XLSX.utils.book_append_sheet(workbook, risksSheet, 'Risks');
  }

  // Controls sheet
  if (data.controls && Array.isArray(data.controls)) {
    const controlsData = data.controls.map((control: any) => ({
      ID: control.id,
      Title: control.title,
      Description: control.description,
      Category: control.category,
      Type: control.type,
      Status: control.status,
      'Effectiveness Rating': control.effectivenessRating,
      Owner: control.owner,
      'Implementation Date': control.implementationDate
        ? new Date(control.implementationDate).toLocaleDateString()
        : '',
      'Last Tested': control.lastTested ? new Date(control.lastTested).toLocaleDateString() : '',
    }))
    const controlsSheet = XLSX.utils.json_to_sheet(controlsData);
    XLSX.utils.book_append_sheet(workbook, controlsSheet, 'Controls');
  }

  // Compliance frameworks sheet
  if (data.frameworks && Array.isArray(data.frameworks)) {
    const frameworksData = data.frameworks.map((_framework: any) => ({
      ID: framework.id,
      Name: framework.name,
      Description: framework.description,
      Version: framework.version,
      'Total Requirements': framework.requirements?.length || 0,
      'Met Requirements':
        framework.requirements?.filter((req: any) =>
          req.controls?.some((control: any) => control.status === 'IMPLEMENTED')
        ).length || 0,
    }))
    const frameworksSheet = XLSX.utils.json_to_sheet(frameworksData);
    XLSX.utils.book_append_sheet(workbook, frameworksSheet, 'Frameworks');
  }

  // Category distribution sheet
  if (data.categoryDistribution) {
    const categoryData = Object.entries(data.categoryDistribution).map(([category, count]) => ({
      Category: category,
      Count: count,
    }))
    const categorySheet = XLSX.utils.json_to_sheet(categoryData);
    XLSX.utils.book_append_sheet(workbook, categorySheet, 'Category Distribution');
  }

  // Compliance scores sheet
  if (data.complianceScores && Array.isArray(data.complianceScores)) {
    const complianceData = data.complianceScores.map((score: any) => ({
      'Framework ID': score.frameworkId,
      'Framework Name': score.frameworkName,
      'Compliance Score (%)': Math.round(score.score),
      'Met Requirements': score.metRequirements,
      'Total Requirements': score.totalRequirements,
    }))
    const complianceSheet = XLSX.utils.json_to_sheet(complianceData);
    XLSX.utils.book_append_sheet(workbook, complianceSheet, 'Compliance Scores');
  }
}

/**
 * Export multiple datasets to a single Excel file with multiple sheets
 */
export async function exportMultipleSheetsToExcel(
  datasets: Array<{
    name: string;
    data: any[];
    headers?: string[];
  }>,
  fileName: string
): Promise<ExportResult> {
  const reportsDir = '/tmp/reports';
  await fs.mkdir(reportsDir, { recursive: true });

  const filePath = path.join(reportsDir, fileName);

  try {
    const workbook = XLSX.utils.book_new();

    datasets.forEach((dataset) => {
      let worksheet: XLSX.WorkSheet;

      if (dataset.headers) {
        // Use provided headers
        const tableData = [
          dataset.headers,
          ...dataset.data.map((row) => dataset.headers!.map((header) => row[header] || '')),
        ]
        worksheet = XLSX.utils.aoa_to_sheet(tableData);
      } else {
        // Auto-generate from data
        worksheet = XLSX.utils.json_to_sheet(dataset.data)
      }

      XLSX.utils.book_append_sheet(workbook, worksheet, dataset.name);
    });

    XLSX.writeFile(workbook, filePath);

    const _stats = await fs.stat(filePath);

    return {
      filePath,
      fileSize: stats.size,
      fileName,
    }
  } catch (error) {
    // console.error('Multi-sheet Excel export failed:', error)
    throw new Error(`Multi-sheet Excel export failed: ${error.message}`);
  }
}

/**
 * Export data with custom formatting
 */
export async function exportToExcelWithFormatting(_data: any[],
  options: ExcelExportOptions & {
    columnWidths?: number[];
    headerBackgroundColor?: string;
    alternateRowColors?: boolean;
  }
): Promise<ExportResult> {
  const reportsDir = '/tmp/reports';
  await fs.mkdir(reportsDir, { recursive: true });

  const filePath = path.join(reportsDir, options.fileName);

  try {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Apply column widths
    if (options.columnWidths) {
      const cols = options.columnWidths.map((width) => ({ width }))
      worksheet['!cols'] = cols;
    }

    // Apply formatting (basic implementation)
    // Note: Advanced formatting requires additional libraries like xlsx-style

    XLSX.utils.book_append_sheet(workbook, worksheet, options.worksheetName || 'Data')
    XLSX.writeFile(workbook, filePath);

    const _stats = await fs.stat(filePath);

    return {
      filePath,
      fileSize: stats.size,
      fileName: options.fileName,
    }
  } catch (error) {
    // console.error('Formatted Excel export failed:', error)
    throw new Error(`Formatted Excel export failed: ${error.message}`);
  }
}

/**
 * Utility function to validate export data
 */
export function validateExportData(_data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data) {
    errors.push('Data is required');
    return { isValid: false, errors }
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      errors.push('Data array is empty');
    }
  } else if (typeof data === 'object') {
    if (Object.keys(data).length === 0) {
      errors.push('Data object is empty');
    }
  } else {
    errors.push('Data must be an array or object');
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Get export format recommendations based on data size
 */
export function getExportRecommendations(_data: any): {
  recommendedFormat: 'csv' | 'excel';
  reason: string;
  estimatedSize: string;
} {
  let recordCount = 0;

  if (Array.isArray(data)) {
    recordCount = data.length;
  } else if (data.risks) {
    recordCount = data.risks.length;
  } else if (data.controls) {
    recordCount = data.controls.length;
  } else {
    recordCount = 1;
  }

  const estimatedSizeKB = recordCount * 0.5; // Rough estimate

  if (recordCount > 10000) {
    return {
      recommendedFormat: 'csv',
      reason: 'Large dataset - CSV format recommended for better performance',
      estimatedSize: `~${Math.round(estimatedSizeKB)}KB`,
    }
  } else {
    return {
      recommendedFormat: 'excel',
      reason: 'Excel format recommended for rich formatting and multiple sheets',
      estimatedSize: `~${Math.round(estimatedSizeKB * 1.5)}KB`,
    }
  }
}
