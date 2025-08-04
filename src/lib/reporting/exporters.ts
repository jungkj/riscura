import jsPDF from 'jspdf';
import ExcelJS from 'exceljs';
import html2canvas from 'html2canvas';
// import {
  ReportData,
  ReportWidget,;
  ExportFormat,;
  ExportOptions as BaseExportOptions,;
} from '@/types/reporting';
;
export interface PDFExportOptions extends BaseExportOptions {
  title?: string;
  subtitle?: string;
  includeData?: boolean;
  pageOrientation?: 'portrait' | 'landscape';
  pageSize?: 'a4' | 'letter' | 'legal';
  watermark?: string;
}

export interface ChartExportData {
  title: string;
  type: string;
  data: any[];
  chartElement?: HTMLElement;
}

export class ReportExporter {
  // Export report to PDF
  async exportToPDF(;
    reportData: any,;
    charts: ChartExportData[] = [],;
    options: PDFExportOptions = {}
  ): Promise<Buffer> {
    const pdf = new jsPDF({
      orientation: options.pageOrientation || 'portrait',;
      unit: 'mm',;
      format: options.pageSize || 'a4',;
    });
;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const _pageHeight = pdf.internal.pageSize.getHeight();
    let currentY = 20;
;
    // Add title
    if (options.title) {
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text(options.title, pageWidth / 2, currentY, { align: 'center' });
      currentY += 15;
    }

    // Add subtitle
    if (options.subtitle) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(options.subtitle, pageWidth / 2, currentY, { align: 'center' });
      currentY += 10;
    }

    // Add generation date
    pdf.setFontSize(10);
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, 20, currentY);
    currentY += 15;
;
    // Add summary section
    if (reportData.summary) {
      currentY = this.addSummarySection(pdf, reportData.summary, currentY, pageWidth);
    }

    // Add charts
    if (options.includeCharts && charts.length > 0) {
      for (const chart of charts) {
        currentY = await this.addChartToPDF(pdf, chart, currentY, pageWidth, pageHeight);
      }
    }

    // Add data tables
    if (options.includeData && reportData.widgets) {
      for (const widget of reportData.widgets) {
        currentY = this.addDataTableToPDF(pdf, widget, currentY, pageWidth, pageHeight);
      }
    }

    // Add watermark if specified
    if (options.watermark) {
      this.addWatermark(pdf, options.watermark, pageWidth, pageHeight);
    }

    // Add footer
    this.addFooter(pdf, pageWidth, pageHeight);
;
    return Buffer.from(pdf.output('arraybuffer'));
  }

  // Add summary section to PDF
  private addSummarySection(pdf: jsPDF, summary: any, startY: number, pageWidth: number): number {
    let currentY = startY;
;
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Executive Summary', 20, currentY);
    currentY += 10;
;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
;
    const summaryText = [;
      `Total Widgets: ${summary.totalWidgets}`,;
      `Data Points: ${summary.dataPoints}`,;
      `Generated: ${new Date(summary.generatedAt).toLocaleString()}`,;
    ];
;
    for (const text of summaryText) {
      pdf.text(text, 20, currentY);
      currentY += 6;
    }

    return currentY + 10;
  }

  // Add chart to PDF
  private async addChartToPDF(;
    pdf: jsPDF,;
    chart: ChartExportData,;
    startY: number,;
    pageWidth: number,;
    pageHeight: number;
  ): Promise<number> {
    let currentY = startY;
;
    // Check if we need a new page
    if (currentY > pageHeight - 100) {
      pdf.addPage();
      currentY = 20;
    }

    // Add chart title
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(chart.title, 20, currentY);
    currentY += 10;
;
    // Convert chart to image and add to PDF
    if (chart.chartElement) {
      try {
        const canvas = await html2canvas(chart.chartElement, {
          backgroundColor: '#ffffff',;
          scale: 2,;
        });
;
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - 40;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
;
        // Check if image fits on current page
        if (currentY + imgHeight > pageHeight - 20) {
          pdf.addPage();
          currentY = 20;
        }

        pdf.addImage(imgData, 'PNG', 20, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 10;
      } catch (error) {
        // console.error('Failed to capture chart:', error)
        // Add placeholder text
        pdf.setFontSize(10);
        pdf.text('[Chart could not be rendered]', 20, currentY);
        currentY += 20;
      }
    } else {
      // Add chart data as table if no visual element
      currentY = this.addChartDataTable(pdf, chart.data, currentY, pageWidth);
    }

    return currentY;
  }

  // Add chart data as table
  private addChartDataTable(pdf: jsPDF, data: any[], startY: number, pageWidth: number): number {
    if (!data || data.length === 0) return startY;
;
    let currentY = startY;
    const rowHeight = 6;
    const colWidth = (pageWidth - 40) / Object.keys(data[0]).length;
;
    // Headers
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    let x = 20;
    for (const key of Object.keys(data[0])) {
      pdf.text(key, x, currentY);
      x += colWidth;
    }
    currentY += rowHeight;
;
    // Data rows
    pdf.setFont('helvetica', 'normal');
    for (const row of data.slice(0, 20)) {
      // Limit to 20 rows
      x = 20;
      for (const key of Object.keys(row)) {
        const value = String(row[key] || '');
        pdf.text(value.substring(0, 15), x, currentY); // Truncate long values;
        x += colWidth;
      }
      currentY += rowHeight;
    }

    return currentY + 10;
  }

  // Add data table to PDF
  private addDataTableToPDF(;
    pdf: jsPDF,;
    widget: any,;
    startY: number,;
    pageWidth: number,;
    pageHeight: number;
  ): number {
    let currentY = startY;
;
    // Check if we need a new page
    if (currentY > pageHeight - 60) {
      pdf.addPage();
      currentY = 20;
    }

    // Add widget title
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Data: ${widget.id}`, 20, currentY);
    currentY += 10;
;
    // Add data table
    currentY = this.addChartDataTable(pdf, widget.data, currentY, pageWidth);
;
    return currentY;
  }

  // Add watermark
  private addWatermark(pdf: jsPDF, watermark: string, pageWidth: number, pageHeight: number): void {
    const pageCount = pdf.getNumberOfPages();
;
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(50);
      pdf.setTextColor(200, 200, 200);
      pdf.text(watermark, pageWidth / 2, pageHeight / 2, {
        align: 'center',;
        angle: 45,;
      });
    }

    // Reset text color
    pdf.setTextColor(0, 0, 0);
  }

  // Add footer
  private addFooter(pdf: jsPDF, pageWidth: number, pageHeight: number): void {
    const pageCount = pdf.getNumberOfPages();
;
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.text(`Page ${i} of ${pageCount}`, pageWidth - 30, pageHeight - 10);
      pdf.text('Riscura RCSA Platform', 20, pageHeight - 10);
    }
  }

  // Export report to Excel using ExcelJS
  async exportToExcel(reportData: ReportData, options: BaseExportOptions = {}): Promise<Buffer> {
    try {
      const workbook = new ExcelJS.Workbook();
;
      // Set workbook properties
      workbook.creator = 'Riscura RCSA Platform';
      workbook.lastModifiedBy = 'Riscura';
      workbook.created = new Date();
      workbook.modified = new Date();
;
      // Create summary sheet
      const summarySheet = workbook.addWorksheet('Summary');
;
      // Add summary data
      const summaryData = [;
        ['Report Title', reportData.title],;
        ['Generated On', new Date().toLocaleDateString()],;
        ['Total Widgets', reportData.widgets.length],;
        ['Report Type', reportData.type],;
        ['Organization', reportData.organizationName || 'N/A'],;
      ];
;
      summarySheet.addRows(summaryData);
;
      // Style the summary sheet
      summarySheet.getColumn(1).width = 20;
      summarySheet.getColumn(2).width = 30;
      summarySheet.getRow(1).font = { bold: true, size: 14 }
;
      // Process each widget
      reportData.widgets.forEach((widget, index) => {
        if (!widget.data || !Array.isArray(widget.data)) return;
;
        const sheetName = widget.title?.substring(0, 31) || `Widget_${index + 1}`;
        const worksheet = workbook.addWorksheet(sheetName);
;
        // Add widget title
        worksheet.addRow([widget.title || `Widget ${index + 1}`]);
        worksheet.getRow(1).font = { bold: true, size: 12 }
        worksheet.addRow([]); // Empty row;
        // Add data based on widget type
        if (widget.type === 'table' && widget.data.length > 0) {
          // Add headers
          const headers = Object.keys(widget.data[0]);
          worksheet.addRow(headers);
;
          // Style headers
          const headerRow = worksheet.lastRow;
          if (headerRow) {
            headerRow.font = { bold: true }
            headerRow.fill = {
              type: 'pattern',;
              pattern: 'solid',;
              fgColor: { argb: 'FFE0E0E0' },;
            }
          }

          // Add data rows
          widget.data.forEach((row) => {
            const values = headers.map((header) => row[header]);
            worksheet.addRow(values);
          });
;
          // Auto-fit columns
          headers.forEach((_, colIndex) => {
            worksheet.getColumn(colIndex + 1).width = 15;
          });
        } else if (widget.type === 'chart') {
          // For charts, add the underlying data
          worksheet.addRow(['Chart Data']);
          worksheet.getRow(3).font = { bold: true }
;
          if (widget.data.length > 0) {
            const headers = Object.keys(widget.data[0]);
            worksheet.addRow(headers);
;
            widget.data.forEach((row) => {
              const values = headers.map((header) => row[header]);
              worksheet.addRow(values);
            });
          }
        } else if (widget.type === 'kpi') {
          // For KPIs, add key metrics
          worksheet.addRow(['KPI Metrics']);
          worksheet.getRow(3).font = { bold: true }
;
          if (widget.data.length > 0) {
            widget.data.forEach((kpi) => {
              worksheet.addRow([kpi.label || 'Metric', kpi.value || 0]);
            });
          }
        }
      });
;
      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
    } catch (error) {
      // console.error('Error exporting to Excel:', error)
      throw new Error(;
        `Excel export failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      );
    }
  }

  // Export report to CSV
  async exportToCSV(reportData: any, options: PDFExportOptions = {}): Promise<Buffer> {
    let csvContent = '';
;
    // Add title and metadata
    if (options.title) {
      csvContent += `Title,${options.title}\n`;
    }
    csvContent += `Generated,${new Date().toISOString()}\n\n`;
;
    // Add summary
    if (reportData.summary) {
      csvContent += 'SUMMARY\n';
      csvContent += `Total Widgets,${reportData.summary.totalWidgets}\n`;
      csvContent += `Data Points,${reportData.summary.dataPoints}\n`;
      csvContent += `Generated At,${reportData.summary.generatedAt}\n\n`;
    }

    // Add widget data
    if (reportData.widgets) {
      for (const widget of reportData.widgets) {
        if (widget.data && widget.data.length > 0) {
          csvContent += `WIDGET: ${widget.id}\n`;
;
          // Headers
          const headers = Object.keys(widget.data[0]);
          csvContent += headers.join(',') + '\n';
;
          // Data rows
          for (const row of widget.data) {
            const values = headers.map((header) => {
              const value = row[header];
              // Escape commas and quotes in CSV
              if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value || '';
            });
            csvContent += values.join(',') + '\n';
          }
          csvContent += '\n';
        }
      }
    }

    return Buffer.from(csvContent, 'utf-8');
  }

  // Convert HTML element to image
  async htmlToImage(;
    element: HTMLElement,;
    options: {
      format?: 'png' | 'jpeg';
      quality?: number;
      backgroundColor?: string;
      scale?: number;
    } = {}
  ): Promise<string> {
    const canvas = await html2canvas(element, {
      backgroundColor: options.backgroundColor || '#ffffff',;
      scale: options.scale || 2,;
    });
;
    return canvas.toDataURL(;
      options.format === 'jpeg' ? 'image/jpeg' : 'image/png',;
      options.quality || 0.9;
    );
  }

  // Optimize PDF size
  private optimizePDF(pdf: jsPDF, options: PDFExportOptions): void {
    if (options.compression) {
      // PDF compression would be implemented here
      // jsPDF doesn't have built-in compression, but you could use libraries like pdf-lib
    }
  }

  // Add chart legends and metadata
  private addChartMetadata(;
    pdf: jsPDF,;
    chart: ChartExportData,;
    startY: number,;
    pageWidth: number;
  ): number {
    let currentY = startY;
;
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'italic');
;
    // Add chart type
    pdf.text(`Chart Type: ${chart.type}`, 20, currentY);
    currentY += 6;
;
    // Add data count
    pdf.text(`Data Points: ${chart.data.length}`, 20, currentY);
    currentY += 6;
;
    return currentY + 5;
  }

  // Generate report archive (ZIP with multiple formats)
  async exportToArchive(;
    reportData: any,;
    charts: ChartExportData[] = [],;
    formats: ('pdf' | 'excel' | 'csv')[] = ['pdf', 'excel', 'csv'];
  ): Promise<Buffer> {
    // This would create a ZIP archive with multiple export formats
    // For now, just return PDF export
    return this.exportToPDF(reportData, charts);
  }
}

export const reportExporter = new ReportExporter();
;