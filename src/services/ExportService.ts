// import { CSVLink } from 'react-csv';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

export interface ExportData {
  data: any[];
  filename: string;
  headers: { label: string; key: string }[];
  title?: string;
  subtitle?: string;
}

export interface ExportOptions {
  format: 'csv' | 'pdf' | 'json' | 'xlsx';
  filename?: string;
  includeHeaders?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  filters?: Record<string, any>;
}

export class ExportService {
  private static instance: ExportService;

  public static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  // Export to CSV
  public async exportToCSV(_exportData: ExportData): Promise<void> {
    try {
      const { data, filename, headers } = exportData;

      // Validate data
      if (!data || data.length === 0) {
        toast.error('No data available to export');
        return;
      }

      // Transform data for CSV export
      const csvData = data.map((item) => {
        const row: any = {};
        headers.forEach((header) => {
          const value = this.getNestedValue(item, header.key);
          row[header.key] = this.formatValueForCSV(value);
        });
        return row;
      });

      // Add metadata row if requested
      const finalData = this.addMetadataToCSV(csvData, exportData);

      // Create CSV content
      const csvContent = this.generateCSVContent(finalData, headers);

      // Download file
      this.downloadFile(csvContent, `${filename}.csv`, 'text/csv');

      toast.success(`Successfully exported ${data.length} records to CSV`);
    } catch (error) {
      // console.error('CSV export failed:', error);
      toast.error('Failed to export CSV file');
    }
  }

  // Export to PDF
  public async exportToPDF(_exportData: ExportData, elementId?: string): Promise<void> {
    try {
      const { data, filename, title, subtitle } = exportData;

      if (!data || data.length === 0) {
        toast.error('No data available to export');
        return;
      }

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const _pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Add title
      if (title) {
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 15;
      }

      // Add subtitle
      if (subtitle) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text(subtitle, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 10;
      }

      // Add metadata
      pdf.setFontSize(10);
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, 20, yPosition);
      yPosition += 5;
      pdf.text(`Total records: ${data.length}`, 20, yPosition);
      yPosition += 15;

      // If specific element should be captured
      if (elementId) {
        await this.exportElementToPDF(pdf, elementId, yPosition);
      } else {
        // Generate table from data
        await this.generatePDFTable(pdf, exportData, yPosition);
      }

      // Save PDF
      pdf.save(`${filename}.pdf`);
      toast.success(`Successfully exported ${data.length} records to PDF`);
    } catch (error) {
      // console.error('PDF export failed:', error);
      toast.error('Failed to export PDF file');
    }
  }

  // Export to JSON
  public async exportToJSON(_exportData: ExportData): Promise<void> {
    try {
      const { data, filename } = exportData;

      if (!data || data.length === 0) {
        toast.error('No data available to export');
        return;
      }

      const exportObject = {
        metadata: {
          exportDate: new Date().toISOString(),
          recordCount: data.length,
          exportedBy: 'Riscura Platform',
        },
        data: data,
      };

      const jsonContent = JSON.stringify(exportObject, null, 2);
      this.downloadFile(jsonContent, `${filename}.json`, 'application/json');

      toast.success(`Successfully exported ${data.length} records to JSON`);
    } catch (error) {
      // console.error('JSON export failed:', error);
      toast.error('Failed to export JSON file');
    }
  }

  // Export risks data
  public async exportRisks(_risks: any[],
    options: ExportOptions = { format: 'csv' }
  ): Promise<void> {
    try {
      const exportData: ExportData = {
        data: risks,
        filename: options.filename || `risks-export-${new Date().toISOString().split('T')[0]}`,
        headers: [
          { label: 'Risk ID', key: 'id' },
          { label: 'Title', key: 'title' },
          { label: 'Description', key: 'description' },
          { label: 'Category', key: 'category' },
          { label: 'Status', key: 'status' },
          { label: 'Risk Level', key: 'riskLevel' },
          { label: 'Impact', key: 'impact' },
          { label: 'Likelihood', key: 'likelihood' },
          { label: 'Risk Score', key: 'riskScore' },
          { label: 'Owner', key: 'owner.name' },
          { label: 'Framework', key: 'framework' },
          { label: 'Due Date', key: 'dueDate' },
          { label: 'Last Updated', key: 'lastUpdated' },
          { label: 'Treatment', key: 'treatment' },
          { label: 'Progress', key: 'progress' },
        ],
        title: 'Risk Register Export',
        subtitle: `Generated from Riscura Risk Management Platform`,
      };

      await this.performExport(exportData, options);
      toast.success(
        `Successfully exported ${risks.length} risks as ${options.format.toUpperCase()}`
      );
    } catch (error) {
      // console.error('Error exporting risks:', error);
      toast.error('Failed to export risks. Please try again.');
      throw error;
    }
  }

  // Export controls data
  public async exportControls(
    controls: any[],
    options: ExportOptions = { format: 'csv' }
  ): Promise<void> {
    try {
      const exportData: ExportData = {
        data: controls,
        filename: options.filename || `controls-export-${new Date().toISOString().split('T')[0]}`,
        headers: [
          { label: 'Control ID', key: 'id' },
          { label: 'Title', key: 'title' },
          { label: 'Description', key: 'description' },
          { label: 'Category', key: 'category' },
          { label: 'Status', key: 'status' },
          { label: 'Effectiveness', key: 'effectiveness' },
          { label: 'Effectiveness Score', key: 'effectivenessScore' },
          { label: 'Owner', key: 'owner.name' },
          { label: 'Priority', key: 'priority' },
          { label: 'Testing Frequency', key: 'testingFrequency' },
          { label: 'Last Tested', key: 'lastTested' },
          { label: 'Next Testing Due', key: 'nextTestingDue' },
          { label: 'Framework', key: 'framework' },
          { label: 'Evidence Count', key: 'evidenceCount' },
          { label: 'Control Type', key: 'controlType' },
        ],
        title: 'Controls Library Export',
        subtitle: `Generated from Riscura Controls Management Platform`,
      };

      await this.performExport(exportData, options);
      toast.success(
        `Successfully exported ${controls.length} controls as ${options.format.toUpperCase()}`
      );
    } catch (error) {
      // console.error('Error exporting controls:', error);
      toast.error('Failed to export controls. Please try again.');
      throw error;
    }
  }

  // Export security dashboard report
  public async exportSecurityReport(_options: ExportOptions = { format: 'pdf' }): Promise<void> {
    try {
      // Mock security data for demonstration
      const securityData = [
        { metric: 'Security Score', value: '94%', status: 'Excellent' },
        { metric: 'Active Threats', value: '3', status: 'Monitoring' },
        { metric: 'Compliance Rate', value: '96.2%', status: 'Good' },
        { metric: 'Controls Implemented', value: '127/135', status: 'On Track' },
        { metric: 'Threat: Suspicious login attempts', value: 'Medium', status: 'Investigating' },
        { metric: 'Threat: Unusual data access pattern', value: 'High', status: 'Active' },
        { metric: 'Threat: Failed backup verification', value: 'Low', status: 'Resolved' },
        { metric: 'SOC 2 Compliance', value: '98%', status: 'Compliant' },
        { metric: 'ISO 27001 Compliance', value: '95%', status: 'Compliant' },
        { metric: 'GDPR Compliance', value: '94%', status: 'Compliant' },
      ];

      const exportData: ExportData = {
        data: securityData,
        filename: options.filename || `security-report-${new Date().toISOString().split('T')[0]}`,
        headers: [
          { label: 'Metric', key: 'metric' },
          { label: 'Value', key: 'value' },
          { label: 'Status', key: 'status' },
        ],
        title: 'Security Dashboard Report',
        subtitle: 'Comprehensive security posture and compliance status report',
      };

      await this.performExport(exportData, options);
      toast.success('Security report exported successfully');
    } catch (error) {
      // console.error('Error exporting security report:', error);
      toast.error('Failed to export security report. Please try again.');
      throw error;
    }
  }

  // Export dashboard data
  public async exportDashboard(elementId: string, filename: string): Promise<void> {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        toast.error('Dashboard element not found');
        return;
      }

      // Convert element to canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      // Create PDF from canvas
      const pdf = new jsPDF('l', 'mm', 'a4');
      const imgWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${filename}.pdf`);

      toast.success('Dashboard exported successfully');
    } catch (error) {
      // console.error('Dashboard export failed:', error);
      toast.error('Failed to export dashboard');
    }
  }

  // Utility methods
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private formatValueForCSV(_value: any): string {
    if (value === null || value === undefined) return '';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object' && value instanceof Date) {
      return value.toLocaleDateString();
    }
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  private addMetadataToCSV(_data: any[], exportData: ExportData): any[] {
    // Add summary row at the beginning
    const metadata = {
      'Export Date': new Date().toLocaleDateString(),
      'Total Records': data.length,
      'Exported By': 'Riscura Platform',
    };

    return [metadata, ...data];
  }

  private generateCSVContent(_data: any[], headers: any[]): string {
    const headerRow = headers.map((h) => h.label).join(',');
    const dataRows = data.map((row) =>
      headers
        .map((h) => {
          const value = row[h.key] || '';
          // Escape commas and quotes in CSV
          return `"${String(value).replace(/"/g, '""')}"`;
        })
        .join(',')
    );

    return [headerRow, ...dataRows].join('\n');
  }

  private async generatePDFTable(
    pdf: jsPDF,
    exportData: ExportData,
    startY: number
  ): Promise<void> {
    const { data, headers } = exportData;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const startX = 20;
    const cellWidth = (pageWidth - 40) / Math.min(headers.length, 4); // Limit columns for readability
    let currentY = startY;

    // Table headers
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');

    const visibleHeaders = headers.slice(0, 4); // Show first 4 columns
    visibleHeaders.forEach((header, index) => {
      pdf.text(header.label, startX + index * cellWidth, currentY);
    });

    currentY += 10;

    // Table data
    pdf.setFont('helvetica', 'normal');
    data.forEach((row, rowIndex) => {
      if (currentY > 250) {
        // New page if needed
        pdf.addPage();
        currentY = 20;
      }

      visibleHeaders.forEach((header, colIndex) => {
        const value = this.getNestedValue(row, header.key);
        const text = this.formatValueForCSV(value);
        const truncatedText = text.length > 30 ? text.substring(0, 27) + '...' : text;

        pdf.text(truncatedText, startX + colIndex * cellWidth, currentY);
      });

      currentY += 8;
    });
  }

  private async exportElementToPDF(pdf: jsPDF, elementId: string, startY: number): Promise<void> {
    const element = document.getElementById(elementId);
    if (element) {
      const canvas = await html2canvas(element);
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pdf.internal.pageSize.getWidth() - 40;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 20, startY, imgWidth, imgHeight);
    }
  }

  private downloadFile(_content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private async performExport(_data: ExportData, options: ExportOptions): Promise<void> {
    switch (options.format) {
      case 'csv':
        await this.exportToCSV(data);
        break;
      case 'json':
        await this.exportToJSON(data);
        break;
      case 'pdf':
        await this.exportToPDF(data);
        break;
      case 'xlsx':
        await this.exportAsXLSX(data, options);
        break;
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  private async exportAsXLSX(_data: ExportData, options: ExportOptions): Promise<void> {
    // For a real implementation, you would use a library like SheetJS
    // This is a simplified version that creates a CSV-like format

    const xlsxContent = [
      data.headers.map((h) => h.label).join('\t'),
      ...data.data.map((row) =>
        data.headers
          .map((h) => {
            const value = this.getNestedValue(row, h.key);
            return this.formatValueForCSV(value);
          })
          .join('\t')
      ),
    ].join('\n');

    this.downloadFile(xlsxContent, `${options.filename}.xls`, 'application/vnd.ms-excel');
    toast.success('Excel export completed (simplified format)');
  }
}

export default ExportService.getInstance();
