import { Report } from '@prisma/client';
// import { ReportData, ReportSection } from './data-collector'
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type for autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (_options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

export class PDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private currentY: number;

  constructor() {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 20;
    this.currentY = this.margin;
  }

  async generate(report: Report, data: ReportData): Promise<Buffer> {
    // Initialize new document
    this.doc = new jsPDF();
    this.currentY = this.margin;

    // Add header
    this.addHeader(report, data);

    // Add executive summary if available
    if (data.summary) {
      this.addSummary(data.summary);
    }

    // Add sections
    for (const section of data.sections) {
      this.addSection(section);
    }

    // Add footer on all pages
    this.addFooter(report);

    // Convert to buffer
    const pdfOutput = this.doc.output('arraybuffer');
    return Buffer.from(pdfOutput);
  }

  private addHeader(report: Report, data: ReportData): void {
    // Title
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(data.title, this.margin, this.currentY);
    this.currentY += 10;

    // Subtitle with report type
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(100);
    this.doc.text(report.type.replace(/_/g, ' '), this.margin, this.currentY);
    this.currentY += 8;

    // Generated date
    this.doc.setFontSize(10);
    this.doc.text(
      `Generated: ${data.generatedAt.toLocaleDateString()} ${data.generatedAt.toLocaleTimeString()}`,
      this.margin,
      this.currentY
    );
    this.currentY += 6;

    // Period
    this.doc.text(
      `Period: ${data.period.from.toLocaleDateString()} - ${data.period.to.toLocaleDateString()}`,
      this.margin,
      this.currentY
    );
    this.currentY += 10;

    // Divider line
    this.doc.setDrawColor(200);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 10;

    // Reset text color
    this.doc.setTextColor(0);
  }

  private addSummary(summary: any): void {
    this.checkPageBreak(60);

    // Summary title
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Executive Summary', this.margin, this.currentY);
    this.currentY += 10;

    // Key metrics
    if (summary.keyMetrics) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'normal');

      Object.entries(summary.keyMetrics).forEach(([key, value]) => {
        const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
        const formattedValue =
          typeof value === 'number' && value % 1 !== 0 ? value.toFixed(2) : String(value);

        this.doc.text(`${formattedKey}: ${formattedValue}`, this.margin + 10, this.currentY);
        this.currentY += 6;
      });
    }

    // Highlights
    if (summary.highlights && summary.highlights.length > 0) {
      this.currentY += 5;
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Key Highlights:', this.margin, this.currentY);
      this.currentY += 6;

      this.doc.setFont('helvetica', 'normal');
      summary.highlights.forEach((highlight: string) => {
        const lines = this.doc.splitTextToSize(
          `• ${highlight}`,
          this.pageWidth - 2 * this.margin - 10
        );
        lines.forEach((line: string) => {
          this.checkPageBreak(6);
          this.doc.text(line, this.margin + 10, this.currentY);
          this.currentY += 6;
        });
      });
    }

    this.currentY += 10;
  }

  private addSection(section: ReportSection): void {
    this.checkPageBreak(40);

    // Section title
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(section.title, this.margin, this.currentY);
    this.currentY += 10;

    // Section content based on type
    switch (section.type) {
      case 'text':
        this.addTextSection(section.data);
        break;
      case 'table':
        this.addTableSection(section.data);
        break;
      case 'metrics':
        this.addMetricsSection(section.data);
        break;
      case 'chart':
        this.addChartSection(section.data);
        break;
    }

    this.currentY += 10;
  }

  private addTextSection(_data: string): void {
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');

    const lines = this.doc.splitTextToSize(data, this.pageWidth - 2 * this.margin);
    lines.forEach((line: string) => {
      this.checkPageBreak(6);
      this.doc.text(line, this.margin, this.currentY);
      this.currentY += 6;
    });
  }

  private addTableSection(_data: { headers: string[]; rows: any[][] }): void {
    if (!data.headers || !data.rows) return;

    this.doc.autoTable({
      head: [data.headers],
      body: data.rows,
      startY: this.currentY,
      margin: { left: this.margin, right: this.margin },
      theme: 'striped',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      didDrawPage: (_data: any) => {
        // Update current Y position after table
        this.currentY = data.cursor.y + 10;
      },
    });

    this.currentY = this.doc.lastAutoTable.finalY + 10;
  }

  private addMetricsSection(_data: Record<string, any>): void {
    const metricsPerRow = 3;
    const metricWidth = (this.pageWidth - 2 * this.margin) / metricsPerRow;
    let currentX = this.margin;
    let rowCount = 0;

    Object.entries(data).forEach(([key, value]) => {
      if (rowCount > 0 && rowCount % metricsPerRow === 0) {
        currentX = this.margin;
        this.currentY += 25;
        this.checkPageBreak(25);
      }

      // Metric box
      this.doc.setFillColor(245, 245, 245);
      this.doc.rect(currentX, this.currentY, metricWidth - 5, 20, 'F');

      // Metric value
      this.doc.setFontSize(16);
      this.doc.setFont('helvetica', 'bold');
      const formattedValue =
        typeof value === 'number' && value % 1 !== 0 ? value.toFixed(2) : String(value);
      this.doc.text(formattedValue, currentX + 5, this.currentY + 8);

      // Metric label
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'normal');
      const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
      this.doc.text(formattedKey, currentX + 5, this.currentY + 16);

      currentX += metricWidth;
      rowCount++;
    });

    this.currentY += 25;
  }

  private addChartSection(_data: any): void {
    // Since we can't directly render charts in jsPDF, we'll create a text representation
    // In a real implementation, you might generate chart images server-side
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'italic');
    this.doc.text(
      `[${data.type.toUpperCase()} CHART: ${data.data.map((d: any) => `${d.label} (${d.value})`).join(', ')}]`,
      this.margin,
      this.currentY
    );
    this.currentY += 20;
  }

  private addFooter(report: Report): void {
    const pageCount = this.doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);

      // Footer line
      this.doc.setDrawColor(200);
      this.doc.line(
        this.margin,
        this.pageHeight - 15,
        this.pageWidth - this.margin,
        this.pageHeight - 15
      );

      // Page number
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(100);
      this.doc.text(
        `Page ${i} of ${pageCount}`,
        this.pageWidth - this.margin - 20,
        this.pageHeight - 8
      );

      // Report ID
      this.doc.text(`Report ID: ${report.id}`, this.margin, this.pageHeight - 8);
    }

    // Reset text color
    this.doc.setTextColor(0);
  }

  private checkPageBreak(requiredSpace: number): void {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin - 20) {
      this.doc.addPage();
      this.currentY = this.margin;
    }
  }
}
