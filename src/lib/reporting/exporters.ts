import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

export interface ExportOptions {
  format?: 'pdf' | 'excel' | 'csv';
  title?: string;
  subtitle?: string;
  includeCharts?: boolean;
  includeData?: boolean;
  pageOrientation?: 'portrait' | 'landscape';
  pageSize?: 'a4' | 'letter' | 'legal';
  compression?: boolean;
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
  async exportToPDF(
    reportData: any,
    charts: ChartExportData[] = [],
    options: ExportOptions = {}
  ): Promise<Buffer> {
    const pdf = new jsPDF({
      orientation: options.pageOrientation || 'portrait',
      unit: 'mm',
      format: options.pageSize || 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let currentY = 20;

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

    return Buffer.from(pdf.output('arraybuffer'));
  }

  // Add summary section to PDF
  private addSummarySection(pdf: jsPDF, summary: any, startY: number, pageWidth: number): number {
    let currentY = startY;

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Executive Summary', 20, currentY);
    currentY += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const summaryText = [
      `Total Widgets: ${summary.totalWidgets}`,
      `Data Points: ${summary.dataPoints}`,
      `Generated: ${new Date(summary.generatedAt).toLocaleString()}`,
    ];

    for (const text of summaryText) {
      pdf.text(text, 20, currentY);
      currentY += 6;
    }

    return currentY + 10;
  }

  // Add chart to PDF
  private async addChartToPDF(
    pdf: jsPDF,
    chart: ChartExportData,
    startY: number,
    pageWidth: number,
    pageHeight: number
  ): Promise<number> {
    let currentY = startY;

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

    // Convert chart to image and add to PDF
    if (chart.chartElement) {
      try {
        const canvas = await html2canvas(chart.chartElement, {
          backgroundColor: '#ffffff',
          scale: 2,
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - 40;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Check if image fits on current page
        if (currentY + imgHeight > pageHeight - 20) {
          pdf.addPage();
          currentY = 20;
        }

        pdf.addImage(imgData, 'PNG', 20, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 10;
      } catch (error) {
        console.error('Failed to capture chart:', error);
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

    let currentY = startY;
    const rowHeight = 6;
    const colWidth = (pageWidth - 40) / Object.keys(data[0]).length;

    // Headers
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    let x = 20;
    for (const key of Object.keys(data[0])) {
      pdf.text(key, x, currentY);
      x += colWidth;
    }
    currentY += rowHeight;

    // Data rows
    pdf.setFont('helvetica', 'normal');
    for (const row of data.slice(0, 20)) { // Limit to 20 rows
      x = 20;
      for (const key of Object.keys(row)) {
        const value = String(row[key] || '');
        pdf.text(value.substring(0, 15), x, currentY); // Truncate long values
        x += colWidth;
      }
      currentY += rowHeight;
    }

    return currentY + 10;
  }

  // Add data table to PDF
  private addDataTableToPDF(
    pdf: jsPDF,
    widget: any,
    startY: number,
    pageWidth: number,
    pageHeight: number
  ): number {
    let currentY = startY;

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

    // Add data table
    currentY = this.addChartDataTable(pdf, widget.data, currentY, pageWidth);

    return currentY;
  }

  // Add watermark
  private addWatermark(pdf: jsPDF, watermark: string, pageWidth: number, pageHeight: number): void {
    const pageCount = pdf.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(50);
      pdf.setTextColor(200, 200, 200);
      pdf.text(watermark, pageWidth / 2, pageHeight / 2, {
        align: 'center',
        angle: 45,
      });
    }
    
    // Reset text color
    pdf.setTextColor(0, 0, 0);
  }

  // Add footer
  private addFooter(pdf: jsPDF, pageWidth: number, pageHeight: number): void {
    const pageCount = pdf.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.text(`Page ${i} of ${pageCount}`, pageWidth - 30, pageHeight - 10);
      pdf.text('Riscura RCSA Platform', 20, pageHeight - 10);
    }
  }

  // Export report to Excel
  async exportToExcel(
    reportData: any,
    options: ExportOptions = {}
  ): Promise<Buffer> {
    const workbook = XLSX.utils.book_new();

    // Summary worksheet
    if (reportData.summary) {
      const summaryData = this.prepareSummaryData(reportData.summary);
      const summaryWS = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summaryWS, 'Summary');
    }

    // Widget data worksheets
    if (reportData.widgets) {
      for (let i = 0; i < reportData.widgets.length; i++) {
        const widget = reportData.widgets[i];
        if (widget.data && widget.data.length > 0) {
          const ws = XLSX.utils.json_to_sheet(widget.data);
          
          // Add title row
          XLSX.utils.sheet_add_aoa(ws, [[widget.id || `Widget ${i + 1}`]], { origin: 'A1' });
          
          // Style the title
          if (!ws['!merges']) ws['!merges'] = [];
          const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
          ws['!merges'].push({
            s: { r: 0, c: 0 },
            e: { r: 0, c: range.e.c },
          });

          const sheetName = `Widget_${i + 1}`.substring(0, 31); // Excel sheet name limit
          XLSX.utils.book_append_sheet(workbook, ws, sheetName);
        }
      }
    }

    // Charts data worksheet
    const chartsData = this.prepareChartsData(reportData);
    if (chartsData.length > 0) {
      const chartsWS = XLSX.utils.json_to_sheet(chartsData);
      XLSX.utils.book_append_sheet(workbook, chartsWS, 'Charts_Data');
    }

    // KPIs worksheet
    const kpisData = await this.prepareKPIsData(reportData);
    if (kpisData.length > 0) {
      const kpisWS = XLSX.utils.json_to_sheet(kpisData);
      XLSX.utils.book_append_sheet(workbook, kpisWS, 'KPIs');
    }

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
      compression: options.compression !== false,
    });

    return excelBuffer;
  }

  // Prepare summary data for Excel
  private prepareSummaryData(summary: any): any[] {
    return [
      { Metric: 'Total Widgets', Value: summary.totalWidgets },
      { Metric: 'Data Points', Value: summary.dataPoints },
      { Metric: 'Generated At', Value: new Date(summary.generatedAt).toLocaleString() },
    ];
  }

  // Prepare charts data for Excel
  private prepareChartsData(reportData: any): any[] {
    const chartsData: any[] = [];

    if (reportData.widgets) {
      for (const widget of reportData.widgets) {
        if (widget.data && Array.isArray(widget.data)) {
          for (const dataPoint of widget.data) {
            chartsData.push({
              Widget: widget.id,
              ...dataPoint,
            });
          }
        }
      }
    }

    return chartsData;
  }

  // Prepare KPIs data for Excel
  private async prepareKPIsData(reportData: any): Promise<any[]> {
    // This would fetch KPI data from the database
    // For now, return empty array
    return [];
  }

  // Export report to CSV
  async exportToCSV(
    reportData: any,
    options: ExportOptions = {}
  ): Promise<Buffer> {
    let csvContent = '';

    // Add title and metadata
    if (options.title) {
      csvContent += `Title,${options.title}\n`;
    }
    csvContent += `Generated,${new Date().toISOString()}\n\n`;

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
          
          // Headers
          const headers = Object.keys(widget.data[0]);
          csvContent += headers.join(',') + '\n';
          
          // Data rows
          for (const row of widget.data) {
            const values = headers.map(header => {
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
  async htmlToImage(element: HTMLElement, options: {
    format?: 'png' | 'jpeg';
    quality?: number;
    backgroundColor?: string;
    scale?: number;
  } = {}): Promise<string> {
    const canvas = await html2canvas(element, {
      backgroundColor: options.backgroundColor || '#ffffff',
      scale: options.scale || 2,
    });

    return canvas.toDataURL(
      options.format === 'jpeg' ? 'image/jpeg' : 'image/png',
      options.quality || 0.9
    );
  }

  // Optimize PDF size
  private optimizePDF(pdf: jsPDF, options: ExportOptions): void {
    if (options.compression) {
      // PDF compression would be implemented here
      // jsPDF doesn't have built-in compression, but you could use libraries like pdf-lib
    }
  }

  // Add chart legends and metadata
  private addChartMetadata(
    pdf: jsPDF,
    chart: ChartExportData,
    startY: number,
    pageWidth: number
  ): number {
    let currentY = startY;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'italic');

    // Add chart type
    pdf.text(`Chart Type: ${chart.type}`, 20, currentY);
    currentY += 6;

    // Add data count
    pdf.text(`Data Points: ${chart.data.length}`, 20, currentY);
    currentY += 6;

    return currentY + 5;
  }

  // Generate report archive (ZIP with multiple formats)
  async exportToArchive(
    reportData: any,
    charts: ChartExportData[] = [],
    formats: ('pdf' | 'excel' | 'csv')[] = ['pdf', 'excel', 'csv']
  ): Promise<Buffer> {
    // This would create a ZIP archive with multiple export formats
    // For now, just return PDF export
    return this.exportToPDF(reportData, charts);
  }
}

export const reportExporter = new ReportExporter(); 