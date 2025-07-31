import { NextRequest, NextResponse } from 'next/server';

// Mock data for demonstration - will be replaced with real database queries after migration
const mockSpreadsheets = [
  {
    id: 'spreadsheet_1',
    name: 'Q4 Risk Assessment',
    description: 'Quarterly risk assessment for all business units',
    templateType: 'RCSA_ASSESSMENT',
    isTemplate: false,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    creator: {
      id: 'user_1',
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@company.com',
    },
    sheets: [
      { id: 'sheet_1', name: 'Risk Assessment', position: 0 },
      { id: 'sheet_2', name: 'Controls Matrix', position: 1 },
    ],
    permissions: [
      {
        permission: 'OWNER',
        user: {
          id: 'user_1',
          firstName: 'John',
          lastName: 'Smith',
          email: 'john.smith@company.com',
        },
      },
    ],
    _count: { sheets: 2, versions: 5 },
  },
  {
    id: 'spreadsheet_2',
    name: 'SOC 2 Controls Matrix',
    description: 'Controls matrix for SOC 2 Type II assessment',
    templateType: 'CONTROL_MATRIX',
    isTemplate: false,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    creator: {
      id: 'user_2',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@company.com',
    },
    sheets: [
      { id: 'sheet_3', name: 'Technical Controls', position: 0 },
      { id: 'sheet_4', name: 'Administrative Controls', position: 1 },
    ],
    permissions: [
      {
        permission: 'OWNER',
        user: {
          id: 'user_2',
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'sarah.johnson@company.com',
        },
      },
    ],
    _count: { sheets: 2, versions: 3 },
  },
];

// GET /api/spreadsheets - List spreadsheets
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const templateType = searchParams.get('templateType');
    const search = searchParams.get('search');

    // Filter mock data based on query parameters
    let filteredSpreadsheets = mockSpreadsheets;

    if (templateType) {
      filteredSpreadsheets = filteredSpreadsheets.filter((s) => s.templateType === templateType);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredSpreadsheets = filteredSpreadsheets.filter(
        (s) =>
          s.name.toLowerCase().includes(searchLower) ||
          s.description.toLowerCase().includes(searchLower)
      );
    }

    // Pagination
    const total = filteredSpreadsheets.length;
    const skip = (page - 1) * limit;
    const paginatedSpreadsheets = filteredSpreadsheets.slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      data: paginatedSpreadsheets,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        demoMode: true,
      },
    });
  } catch (error) {
    console.error('Spreadsheets API error:', error);
    return NextResponse.json({ error: 'Failed to retrieve spreadsheets' }, { status: 500 });
  }
}

// POST /api/spreadsheets - Create new spreadsheet
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { name, description, templateType, templateId, isTemplate = false } = body;

    if (!name || !templateType) {
      return NextResponse.json({ error: 'Name and template type are required' }, { status: 400 });
    }

    // Mock spreadsheet creation
    const newSpreadsheet = {
      id: `spreadsheet_${Date.now()}`,
      name,
      description,
      templateType,
      isTemplate,
      createdAt: new Date(),
      updatedAt: new Date(),
      creator: {
        id: 'user_demo',
        firstName: 'Demo',
        lastName: 'User',
        email: 'demo@riscura.com',
      },
      sheets: [
        {
          id: `sheet_${Date.now()}`,
          name: templateType === 'RCSA_ASSESSMENT' ? 'Risk Assessment' : 'Sheet 1',
          position: 0,
          columns: getDefaultColumns(templateType),
        },
      ],
      permissions: [
        {
          permission: 'OWNER',
          user: { id: 'user_demo', firstName: 'Demo', lastName: 'User', email: 'demo@riscura.com' },
        },
      ],
      _count: { sheets: 1, versions: 1 },
    };

    return NextResponse.json({
      success: true,
      message: 'Spreadsheet created successfully (demo mode)',
      data: newSpreadsheet,
    });
  } catch (error) {
    console.error('Spreadsheet creation error:', error);
    return NextResponse.json({ error: 'Failed to create spreadsheet' }, { status: 500 });
  }
}

// Helper function to get default columns based on template type
function getDefaultColumns(templateType: string) {
  switch (templateType) {
    case 'RCSA_ASSESSMENT':
      return [
        { name: 'Sources of Risk Identified', dataType: 'TEXT', isRequired: true },
        { name: 'HO Risk ID', dataType: 'TEXT' },
        { name: 'Branch Risk ID', dataType: 'TEXT' },
        { name: 'Readiness Indicator', dataType: 'DROPDOWN', dropdownOptions: ['Yes', 'No'] },
        { name: 'Risk Driver', dataType: 'TEXT' },
        { name: 'Risk Event', dataType: 'TEXT', isRequired: true },
        { name: 'Risk Impact', dataType: 'TEXT' },
        { name: 'Risk Statement', dataType: 'TEXT' },
        { name: 'Function', dataType: 'TEXT' },
        { name: 'Risk Owner', dataType: 'USER_REFERENCE' },
        {
          name: 'Level 1 Risk Category',
          dataType: 'DROPDOWN',
          dropdownOptions: ['Operational', 'Financial', 'Strategic', 'Compliance', 'Technology'],
        },
        {
          name: 'Level 2 Risk Category',
          dataType: 'DROPDOWN',
          dropdownOptions: ['Asset Quality Risk', 'Credit Risk', 'Market Risk', 'Operational Risk'],
        },
        { name: 'Likelihood Rating', dataType: 'RATING', validationRules: { min: 1, max: 5 } },
        { name: 'Likelihood Rationale', dataType: 'TEXT' },
        { name: 'Impact Rating', dataType: 'RATING', validationRules: { min: 1, max: 5 } },
        { name: 'Impact Rationale', dataType: 'TEXT' },
        {
          name: 'Inherent Risk Rating',
          dataType: 'CALCULATED',
          formula: 'likelihood * impact',
          isCalculated: true,
        },
        {
          name: 'Risk Materiality',
          dataType: 'DROPDOWN',
          dropdownOptions: ['Material', 'Non-Material'],
        },
        { name: 'Control ID', dataType: 'CONTROL_REFERENCE' },
        { name: 'Control Owner', dataType: 'USER_REFERENCE' },
        { name: 'Control Description', dataType: 'TEXT' },
        {
          name: 'Control Frequency',
          dataType: 'DROPDOWN',
          dropdownOptions: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annually'],
        },
        { name: 'Control Evidence', dataType: 'TEXT' },
        {
          name: 'Control Automation',
          dataType: 'DROPDOWN',
          dropdownOptions: ['Manual', 'Semi-Automated', 'Automated'],
        },
        {
          name: 'Control Design Effectiveness',
          dataType: 'DROPDOWN',
          dropdownOptions: ['Effective', 'Partially Effective', 'Non-Effective'],
        },
        {
          name: 'Control Operating Effectiveness',
          dataType: 'DROPDOWN',
          dropdownOptions: ['Effective', 'Partially Effective', 'Non-Effective'],
        },
        {
          name: 'Residual Risk Rating',
          dataType: 'CALCULATED',
          formula: 'inherentRisk - controlEffectiveness',
          isCalculated: true,
        },
        { name: 'Comments', dataType: 'TEXT' },
      ];

    case 'RISK_REGISTER':
      return [
        { name: 'Risk ID', dataType: 'TEXT', isRequired: true },
        { name: 'Risk Title', dataType: 'TEXT', isRequired: true },
        { name: 'Description', dataType: 'TEXT' },
        {
          name: 'Category',
          dataType: 'DROPDOWN',
          dropdownOptions: ['Operational', 'Financial', 'Strategic', 'Compliance', 'Technology'],
        },
        { name: 'Likelihood', dataType: 'RATING', validationRules: { min: 1, max: 5 } },
        { name: 'Impact', dataType: 'RATING', validationRules: { min: 1, max: 5 } },
        {
          name: 'Risk Score',
          dataType: 'CALCULATED',
          formula: 'likelihood * impact',
          isCalculated: true,
        },
        {
          name: 'Risk Level',
          dataType: 'DROPDOWN',
          dropdownOptions: ['Low', 'Medium', 'High', 'Critical'],
        },
        { name: 'Owner', dataType: 'USER_REFERENCE' },
        {
          name: 'Status',
          dataType: 'DROPDOWN',
          dropdownOptions: ['Identified', 'Assessed', 'Mitigated', 'Closed'],
        },
        { name: 'Date Identified', dataType: 'DATE' },
        { name: 'Last Review', dataType: 'DATE' },
        { name: 'Next Review', dataType: 'DATE' },
      ];

    case 'CONTROL_MATRIX':
      return [
        { name: 'Control ID', dataType: 'TEXT', isRequired: true },
        { name: 'Control Title', dataType: 'TEXT', isRequired: true },
        { name: 'Description', dataType: 'TEXT' },
        {
          name: 'Control Type',
          dataType: 'DROPDOWN',
          dropdownOptions: ['Preventive', 'Detective', 'Corrective'],
        },
        {
          name: 'Frequency',
          dataType: 'DROPDOWN',
          dropdownOptions: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annually'],
        },
        {
          name: 'Automation Level',
          dataType: 'DROPDOWN',
          dropdownOptions: ['Manual', 'Semi-Automated', 'Fully Automated'],
        },
        { name: 'Owner', dataType: 'USER_REFERENCE' },
        {
          name: 'Effectiveness',
          dataType: 'DROPDOWN',
          dropdownOptions: ['Effective', 'Partially Effective', 'Non-Effective'],
        },
        { name: 'Last Test Date', dataType: 'DATE' },
        { name: 'Next Test Date', dataType: 'DATE' },
        {
          name: 'Status',
          dataType: 'DROPDOWN',
          dropdownOptions: ['Active', 'Inactive', 'Under Review'],
        },
      ];

    default:
      return [
        { name: 'Column A', dataType: 'TEXT' },
        { name: 'Column B', dataType: 'TEXT' },
        { name: 'Column C', dataType: 'TEXT' },
      ];
  }
}
