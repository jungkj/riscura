import { Report } from '@prisma/client';
// import { ReportData, ReportSection } from './data-collector';
import ExcelJS from 'exceljs';

export class ExcelGenerator {
  private workbook: ExcelJS.Workbook;
  private worksheet: ExcelJS.Worksheet;

  constructor() {
    this.workbook = new ExcelJS.Workbook();
    this.worksheet = this.workbook.addWorksheet('Report');
  }

  async generate(report: Report, data: ReportData): Promise<Buffer> {
    // Initialize new workbook
    this.workbook = new ExcelJS.Workbook();

    // Set workbook properties
    this.workbook.creator = 'Riscura Platform';
    this.workbook.created = new Date();
    this.workbook.modified = new Date();

    // Create main worksheet
    this.worksheet = this.workbook.addWorksheet('Summary', {
      properties: { tabColor: { argb: '2980B9' } },
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
    });

    // Add header
    this.addHeader(report, data);

    // Add summary
    if (data.summary) {
      this.addSummary(data.summary);
    }

    // Process sections - some may create new worksheets
    for (const section of data.sections) {
      if (section.type === 'table' && section.data.rows && section.data.rows.length > 50) {
        // Large tables get their own worksheet
        this.addTableWorksheet(section);
      } else {
        // Add to main worksheet
        this.addSectionToMainWorksheet(section);
      }
    }

    // Format the main worksheet
    this.formatWorksheet(this.worksheet);

    // Generate buffer
    const buffer = await this.workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private addHeader(report: Report, data: ReportData): void {
    let currentRow = 1;

    // Title
    this.worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
    const titleCell = this.worksheet.getCell(`A${currentRow}`);
    titleCell.value = data.title;
    titleCell.font = { name: 'Arial', size: 18, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    currentRow += 2;

    // Report info
    this.worksheet.getCell(`A${currentRow}`).value = 'Report Type:';
    this.worksheet.getCell(`B${currentRow}`).value = report.type.replace(/_/g, ' ');
    this.worksheet.getCell(`B${currentRow}`).font = { bold: true };
    currentRow++;

    this.worksheet.getCell(`A${currentRow}`).value = 'Generated:';
    this.worksheet.getCell(`B${currentRow}`).value = data.generatedAt;
    this.worksheet.getCell(`B${currentRow}`).numFmt = 'dd/mm/yyyy hh:mm:ss';
    currentRow++;

    this.worksheet.getCell(`A${currentRow}`).value = 'Period:';
    this.worksheet.getCell(`B${currentRow}`).value =
      `${data.period.from.toLocaleDateString()} - ${data.period.to.toLocaleDateString()}`;
    currentRow += 2;

    // Style header cells
    for (let i = 1; i <= currentRow; i++) {
      this.worksheet.getRow(i).font = { name: 'Arial', size: 11 };
    }
  }

  private addSummary(summary: any): void {
    const currentRow = this.worksheet.lastRow?.number || 1;
    let row = currentRow + 2;

    // Summary title
    this.worksheet.mergeCells(`A${row}:D${row}`);
    const summaryTitle = this.worksheet.getCell(`A${row}`);
    summaryTitle.value = 'Executive Summary';
    summaryTitle.font = { name: 'Arial', size: 14, bold: true };
    summaryTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'E8F4F8' },
    };
    row += 2;

    // Key metrics
    if (summary.keyMetrics) {
      this.worksheet.getCell(`A${row}`).value = 'Key Metrics';
      this.worksheet.getCell(`A${row}`).font = { bold: true };
      row++;

      Object.entries(summary.keyMetrics).forEach(([key, value]) => {
        const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
        this.worksheet.getCell(`A${row}`).value = formattedKey;
        this.worksheet.getCell(`B${row}`).value = value as number;

        // Format percentage values
        if (key.toLowerCase().includes('rate') || key.toLowerCase().includes('percentage')) {
          this.worksheet.getCell(`B${row}`).numFmt = '0.00%';
        } else if (typeof value === 'number' && value % 1 !== 0) {
          this.worksheet.getCell(`B${row}`).numFmt = '0.00';
        }

        row++;
      });
      row++;
    }

    // Highlights
    if (summary.highlights && summary.highlights.length > 0) {
      this.worksheet.getCell(`A${row}`).value = 'Key Highlights';
      this.worksheet.getCell(`A${row}`).font = { bold: true };
      row++;

      summary.highlights.forEach((highlight: string, index: number) => {
        this.worksheet.mergeCells(`A${row}:F${row}`);
        this.worksheet.getCell(`A${row}`).value = `${index + 1}. ${highlight}`;
        this.worksheet.getCell(`A${row}`).alignment = { wrapText: true };
        row++;
      });
    }
  }

  private addSectionToMainWorksheet(section: ReportSection): void {
    const currentRow = this.worksheet.lastRow?.number || 1;
    let row = currentRow + 2;

    // Section title
    this.worksheet.mergeCells(`A${row}:F${row}`);
    const titleCell = this.worksheet.getCell(`A${row}`);
    titleCell.value = section.title;
    titleCell.font = { name: 'Arial', size: 12, bold: true };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'D5E8F4' },
    };
    row += 2;

    // Add content based on type
    switch (section.type) {
      case 'text':
        this.addTextContent(section.data, row);
        break;
      case 'table':
        this.addTableContent(section.data, row);
        break;
      case 'metrics':
        this.addMetricsContent(section.data, row);
        break;
      case 'chart':
        this.addChartData(section.data, row);
        break;
    }
  }

  private addTextContent(_data: string, startRow: number): void {
    this.worksheet.mergeCells(`A${startRow}:F${startRow}`);
    const cell = this.worksheet.getCell(`A${startRow}`);
    cell.value = data;
    cell.alignment = { wrapText: true, vertical: 'top' };
  }

  private addTableContent(_data: { headers: string[]; rows: any[][] }, startRow: number): void {
    if (!data.headers || !data.rows) return;

    // Add headers
    data.headers.forEach((header, index) => {
      const cell = this.worksheet.getCell(startRow, index + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '2980B9' },
      };
      cell.font = { color: { argb: 'FFFFFF' }, bold: true };
      cell.alignment = { horizontal: 'center' };
    });

    // Add data rows
    data.rows.forEach((row, rowIndex) => {
      row.forEach((value, colIndex) => {
        const cell = this.worksheet.getCell(startRow + rowIndex + 1, colIndex + 1);
        cell.value = value;

        // Alternate row colors
        if (rowIndex % 2 === 0) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F5F5F5' },
          };
        }
      });
    });

    // Add borders to table
    const lastRow = startRow + data.rows.length;
    const lastCol = data.headers.length;

    for (let r = startRow; r <= lastRow; r++) {
      for (let c = 1; c <= lastCol; c++) {
        const cell = this.worksheet.getCell(r, c);
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      }
    }
  }

  private addMetricsContent(_data: Record<string, any>, startRow: number): void {
    let row = startRow;
    const metricsPerRow = 3;
    let colOffset = 0;

    Object.entries(data).forEach(([key, value], index) => {
      if (index > 0 && index % metricsPerRow === 0) {
        row += 3;
        colOffset = 0;
      }

      const col = 1 + colOffset * 2;

      // Metric label
      const labelCell = this.worksheet.getCell(row, col);
      labelCell.value = key.replace(/([A-Z])/g, ' $1').trim();
      labelCell.font = { size: 10 };

      // Metric value
      const valueCell = this.worksheet.getCell(row + 1, col);
      valueCell.value = value;
      valueCell.font = { size: 14, bold: true };

      // Format based on type
      if (key.toLowerCase().includes('rate') || key.toLowerCase().includes('percentage')) {
        valueCell.numFmt = '0.00%';
      } else if (typeof value === 'number' && value % 1 !== 0) {
        valueCell.numFmt = '#,##0.00';
      } else if (typeof value === 'number') {
        valueCell.numFmt = '#,##0';
      }

      // Add background
      this.worksheet.mergeCells(row, col, row + 1, col);
      for (let r = row; r <= row + 1; r++) {
        this.worksheet.getCell(r, col).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'E8F4F8' },
        };
      }

      colOffset++;
    });
  }

  private addChartData(_data: any, startRow: number): void {
    // Add chart data as a table for now
    // In a real implementation, you might add actual Excel charts
    const headers = ['Category', 'Value'];
    const rows = data.data.map((item: any) => [item.label, item.value]);

    this.addTableContent({ headers, rows }, startRow);

    // Add a note about the chart
    const noteRow = startRow + rows.length + 2;
    this.worksheet.mergeCells(`A${noteRow}:F${noteRow}`);
    const noteCell = this.worksheet.getCell(`A${noteRow}`);
    noteCell.value = `Note: This data represents a ${data.type} chart in the PDF version`;
    noteCell.font = { italic: true, size: 10 };
  }

  private addTableWorksheet(section: ReportSection): void {
    // Create new worksheet for large table
    const ws = this.workbook.addWorksheet(section.title, {
      properties: { tabColor: { argb: '27AE60' } },
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
    });

    // Add title
    ws.mergeCells('A1:F1');
    const titleCell = ws.getCell('A1');
    titleCell.value = section.title;
    titleCell.font = { name: 'Arial', size: 14, bold: true };
    titleCell.alignment = { horizontal: 'center' };

    // Add table
    this.addTableContent(section.data, 3);

    // Auto-fit columns
    this.formatWorksheet(ws);
  }

  private formatWorksheet(worksheet: ExcelJS.Worksheet): void {
    // Auto-fit columns based on content
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = Math.min(maxLength + 2, 50); // Cap at 50 characters
    });

    // Set minimum column width
    worksheet.columns.forEach((column) => {
      if (column.width && column.width < 10) {
        column.width = 10;
      }
    });

    // Add print settings
    worksheet.pageSetup = {
      paperSize: 9, // A4
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    };

    // Add header/footer
    worksheet.headerFooter = {
      oddHeader: '&C&"Arial,Bold"&14Risk Management Report',
      oddFooter: '&L&D &T&C&P of &N',
    };
  }
}
