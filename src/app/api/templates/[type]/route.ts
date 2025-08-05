import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import * as XLSX from 'xlsx';

// Template types
const TEMPLATE_TYPES = ['rcsa', 'controls', 'vendor-assessment'] as const;
type TemplateType = (typeof TEMPLATE_TYPES)[number];

// Generate template based on type
const generateTemplate = (_type: TemplateType) => {
  const workbook = XLSX.utils.book_new();

  switch (_type) {
    case 'rcsa': {
      // RCSA Template
      const headers = [
        'Risk ID',
        'Risk Name',
        'Risk Description',
        'Category',
        'Department',
        'Risk Owner',
        'Likelihood (1-5)',
        'Impact (1-5)',
        'Inherent Risk Score',
        'Control Description',
        'Control Type',
        'Control Effectiveness',
        'Residual Likelihood',
        'Residual Impact',
        'Residual Risk Score',
        'Status',
        'Last Review Date',
        'Next Review Date',
        'Comments',
      ];

      const sampleData = [
        [
          'RSK-001',
          'Data Breach',
          'Unauthorized access to sensitive customer data',
          'Information Security',
          'IT',
          'John Smith',
          '3',
          '5',
          '15',
          'Encryption at rest and in transit',
          'Preventive',
          'High',
          '2',
          '5',
          '10',
          'Active',
          '2024-01-15',
          '2024-07-15',
          'Quarterly review scheduled',
        ],
        [
          'RSK-002',
          'System Downtime',
          'Critical system unavailability affecting operations',
          'Operational',
          'IT',
          'Jane Doe',
          '4',
          '4',
          '16',
          'Redundant systems and backup procedures',
          'Preventive',
          'Medium',
          '2',
          '4',
          '8',
          'Active',
          '2024-01-20',
          '2024-04-20',
          'DR test planned for Q2',
        ],
      ];

      const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);

      // Set column widths
      ws['!cols'] = [
        { wch: 10 }, // Risk ID
        { wch: 20 }, // Risk Name
        { wch: 40 }, // Risk Description
        { wch: 20 }, // Category
        { wch: 15 }, // Department
        { wch: 15 }, // Risk Owner
        { wch: 15 }, // Likelihood
        { wch: 15 }, // Impact
        { wch: 20 }, // Inherent Risk Score
        { wch: 40 }, // Control Description
        { wch: 15 }, // Control Type
        { wch: 20 }, // Control Effectiveness
        { wch: 20 }, // Residual Likelihood
        { wch: 20 }, // Residual Impact
        { wch: 20 }, // Residual Risk Score
        { wch: 10 }, // Status
        { wch: 15 }, // Last Review
        { wch: 15 }, // Next Review
        { wch: 30 }, // Comments
      ];

      XLSX.utils.book_append_sheet(workbook, ws, 'RCSA Template');

      // Add instructions sheet
      const instructionsData = [
        ['RCSA Template Instructions'],
        [''],
        ['This template helps you document your Risk and Control Self-Assessment (RCSA).'],
        [''],
        ['Column Descriptions:'],
        ['Risk ID', 'Unique identifier for the risk (e.g., RSK-001)'],
        ['Risk Name', 'Short, descriptive name for the risk'],
        ['Risk Description', 'Detailed description of the risk and its potential impact'],
        ['Category', 'Risk category (e.g., Operational, Financial, Compliance, Strategic)'],
        ['Department', 'Business unit or department that owns the risk'],
        ['Risk Owner', 'Person responsible for managing the risk'],
        ['Likelihood (1-5)', '1=Very Low, 2=Low, 3=Medium, 4=High, 5=Very High'],
        ['Impact (1-5)', '1=Negligible, 2=Minor, 3=Moderate, 4=Major, 5=Severe'],
        ['Inherent Risk Score', 'Likelihood × Impact (calculated automatically if using formulas)'],
        ['Control Description', 'Description of controls in place to mitigate the risk'],
        ['Control Type', 'Preventive, Detective, or Corrective'],
        ['Control Effectiveness', 'High, Medium, or Low'],
        ['Residual Likelihood', 'Likelihood after controls (1-5)'],
        ['Residual Impact', 'Impact after controls (1-5)'],
        ['Residual Risk Score', 'Residual Likelihood × Residual Impact'],
        ['Status', 'Active, Closed, or Under Review'],
        ['Last Review Date', 'Date of last risk assessment (YYYY-MM-DD)'],
        ['Next Review Date', 'Scheduled next review date (YYYY-MM-DD)'],
        ['Comments', 'Additional notes or action items'],
      ];

      const instructionsWs = XLSX.utils.aoa_to_sheet(instructionsData);
      instructionsWs['!cols'] = [{ wch: 25 }, { wch: 60 }];
      XLSX.utils.book_append_sheet(workbook, instructionsWs, 'Instructions');

      break;
    }

    case 'controls': {
      // Controls Template
      const headers = [
        'Control ID',
        'Control Name',
        'Control Description',
        'Control Type',
        'Control Category',
        'Associated Risks',
        'Control Owner',
        'Implementation Status',
        'Effectiveness Rating',
        'Test Frequency',
        'Last Test Date',
        'Next Test Date',
        'Test Results',
        'Evidence Location',
        'Notes',
      ];

      const sampleData = [
        [
          'CTL-001',
          'Access Control Policy',
          'Multi-factor authentication for all system access',
          'Preventive',
          'Access Control',
          'RSK-001, RSK-003',
          'Security Team',
          'Implemented',
          'High',
          'Quarterly',
          '2024-01-10',
          '2024-04-10',
          'Pass',
          'SharePoint/Security/Evidence/Q1-2024',
          'No issues identified',
        ],
      ];

      const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
      ws['!cols'] = headers.map(() => ({ wch: 20 }));
      XLSX.utils.book_append_sheet(workbook, ws, 'Controls Template');
      break;
    }

    case 'vendor-assessment': {
      // Vendor Assessment Template
      const headers = [
        'Vendor ID',
        'Vendor Name',
        'Service Description',
        'Criticality',
        'Risk Rating',
        'Assessment Date',
        'Next Assessment',
        'Contract Expiry',
        'Data Classification',
        'Compliance Status',
        'Security Certifications',
        'Issues Identified',
        'Remediation Status',
        'Contact Person',
        'Notes',
      ];

      const sampleData = [
        [
          'VND-001',
          'Cloud Provider Inc',
          'Cloud hosting and storage services',
          'Critical',
          'Low',
          '2024-01-05',
          '2025-01-05',
          '2025-12-31',
          'Confidential',
          'Compliant',
          'SOC 2, ISO 27001',
          'None',
          'N/A',
          'vendor.contact@provider.com',
          'Annual review scheduled',
        ],
      ];

      const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
      ws['!cols'] = headers.map(() => ({ wch: 20 }));
      XLSX.utils.book_append_sheet(workbook, ws, 'Vendor Assessment');
      break;
    }
  }

  return workbook;
};

export const GET = withApiMiddleware({
  requireAuth: true,
  rateLimiters: ['standard'],
})(async (context, params) => {
  const { type } = params as { type: string };

  // Validate template type
  if (!TEMPLATE_TYPES.includes(type as TemplateType)) {
    return {
      success: false,
      error: `Invalid template type. Valid types are: ${TEMPLATE_TYPES.join(', ')}`,
    };
  }

  try {
    // Generate the template
    const workbook = generateTemplate(type as TemplateType);

    // Convert to buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Create filename
    const filename = `riscura-${type}-template-${new Date().toISOString().split('T')[0]}.xlsx`;

    // Return the file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    // console.error('Template generation error:', error)
    return {
      success: false,
      error: 'Failed to generate template',
    };
  }
});
