import { NextRequest, NextResponse } from 'next/server';

// Types for spreadsheet data
interface User {
  id: string
  firstName: string;
  lastName: string;
  email: string;
}

interface Cell {
  id: string;
  columnId: string;
  value: string | number;
  displayValue: string;
}

interface Row {
  id: string;
  position: number;
  linkedRiskId?: string;
  linkedControlId?: string;
  cells: Cell[];
}

interface Column {
  id: string;
  name: string;
  position: number;
  dataType: 'TEXT' | 'DROPDOWN' | 'RATING' | 'CALCULATED' | 'USER_REFERENCE';
  isRequired?: boolean;
  width: number;
  dropdownOptions?: string[];
  validationRules?: { min?: number; max?: number }
  formula?: string;
  isCalculated?: boolean;
}

interface Sheet {
  id: string;
  name: string;
  position: number;
  columns?: Column[];
  rows?: Row[];
}

interface Permission {
  permission: string;
  user: User;
}

interface Version {
  id: string;
  version: number;
  changedBy: string;
  changes: { type: string; description: string }[];
  createdAt: Date;
  description: string;
}

interface Spreadsheet {
  id: string;
  name: string;
  description: string;
  templateType: string;
  isTemplate: boolean;
  createdAt: Date;
  updatedAt: Date;
  creator: User;
  sheets: Sheet[];
  permissions: Permission[];
  versions: Version[];
}

// Mock spreadsheet data with full structure
const mockSpreadsheetData: Record<string, Spreadsheet> = {
  spreadsheet_1: {
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
      {
        id: 'sheet_1',
        name: 'Risk Assessment',
        position: 0,
        columns: [
          {
            id: 'col_1',
            name: 'Risk ID',
            position: 0,
            dataType: 'TEXT',
            isRequired: true,
            width: 100,
          },
          {
            id: 'col_2',
            name: 'Risk Event',
            position: 1,
            dataType: 'TEXT',
            isRequired: true,
            width: 200,
          },
          {
            id: 'col_3',
            name: 'Risk Category',
            position: 2,
            dataType: 'DROPDOWN',
            dropdownOptions: ['Operational', 'Financial', 'Strategic', 'Compliance', 'Technology'],
            width: 150,
          },
          {
            id: 'col_4',
            name: 'Likelihood',
            position: 3,
            dataType: 'RATING',
            validationRules: { min: 1, max: 5 },
            width: 100,
          },
          {
            id: 'col_5',
            name: 'Impact',
            position: 4,
            dataType: 'RATING',
            validationRules: { min: 1, max: 5 },
            width: 100,
          },
          {
            id: 'col_6',
            name: 'Risk Score',
            position: 5,
            dataType: 'CALCULATED',
            formula: 'likelihood * impact',
            isCalculated: true,
            width: 100,
          },
          { id: 'col_7', name: 'Risk Owner', position: 6, dataType: 'USER_REFERENCE', width: 150 },
          {
            id: 'col_8',
            name: 'Status',
            position: 7,
            dataType: 'DROPDOWN',
            dropdownOptions: ['Identified', 'Assessed', 'Mitigated', 'Closed'],
            width: 120,
          },
        ],
        rows: [
          {
            id: 'row_1',
            position: 0,
            linkedRiskId: 'risk_cyber_security',
            cells: [
              { id: 'cell_1_1', columnId: 'col_1', value: 'R.001', displayValue: 'R.001' },
              {
                id: 'cell_1_2',
                columnId: 'col_2',
                value: 'Data breach due to inadequate cybersecurity measures',
                displayValue: 'Data breach due to inadequate cybersecurity measures',
              },
              {
                id: 'cell_1_3',
                columnId: 'col_3',
                value: 'Technology',
                displayValue: 'Technology',
              },
              { id: 'cell_1_4', columnId: 'col_4', value: 3, displayValue: '3 - Possible' },
              { id: 'cell_1_5', columnId: 'col_5', value: 4, displayValue: '4 - High' },
              { id: 'cell_1_6', columnId: 'col_6', value: 12, displayValue: '12 - High' },
              { id: 'cell_1_7', columnId: 'col_7', value: 'user_1', displayValue: 'John Smith' },
              { id: 'cell_1_8', columnId: 'col_8', value: 'Assessed', displayValue: 'Assessed' },
            ],
          },
          {
            id: 'row_2',
            position: 1,
            linkedRiskId: 'risk_regulatory_compliance',
            cells: [
              { id: 'cell_2_1', columnId: 'col_1', value: 'R.002', displayValue: 'R.002' },
              {
                id: 'cell_2_2',
                columnId: 'col_2',
                value: 'GDPR compliance gap',
                displayValue: 'GDPR compliance gap',
              },
              {
                id: 'cell_2_3',
                columnId: 'col_3',
                value: 'Compliance',
                displayValue: 'Compliance',
              },
              { id: 'cell_2_4', columnId: 'col_4', value: 4, displayValue: '4 - Likely' },
              { id: 'cell_2_5', columnId: 'col_5', value: 5, displayValue: '5 - Critical' },
              { id: 'cell_2_6', columnId: 'col_6', value: 20, displayValue: '20 - Critical' },
              { id: 'cell_2_7', columnId: 'col_7', value: 'user_2', displayValue: 'Sarah Johnson' },
              {
                id: 'cell_2_8',
                columnId: 'col_8',
                value: 'In Progress',
                displayValue: 'In Progress',
              },
            ],
          },
        ],
      },
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
    versions: [
      {
        id: 'version_1',
        version: 1,
        changedBy: 'user_1',
        changes: [{ type: 'create', description: 'Initial spreadsheet creation' }],
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        description: 'Initial creation',
      },
    ],
  },
  spreadsheet_2: {
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
      {
        id: 'sheet_2',
        name: 'Technical Controls',
        position: 0,
        columns: [
          {
            id: 'col_9',
            name: 'Control ID',
            position: 0,
            dataType: 'TEXT',
            isRequired: true,
            width: 100,
          },
          {
            id: 'col_10',
            name: 'Control Title',
            position: 1,
            dataType: 'TEXT',
            isRequired: true,
            width: 200,
          },
          {
            id: 'col_11',
            name: 'Control Type',
            position: 2,
            dataType: 'DROPDOWN',
            dropdownOptions: ['Preventive', 'Detective', 'Corrective'],
            width: 120,
          },
          {
            id: 'col_12',
            name: 'Frequency',
            position: 3,
            dataType: 'DROPDOWN',
            dropdownOptions: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annually'],
            width: 120,
          },
          { id: 'col_13', name: 'Owner', position: 4, dataType: 'USER_REFERENCE', width: 150 },
          {
            id: 'col_14',
            name: 'Effectiveness',
            position: 5,
            dataType: 'DROPDOWN',
            dropdownOptions: ['Effective', 'Partially Effective', 'Non-Effective'],
            width: 150,
          },
        ],
        rows: [
          {
            id: 'row_3',
            position: 0,
            linkedControlId: 'control_access_management',
            cells: [
              { id: 'cell_3_1', columnId: 'col_9', value: 'C.001', displayValue: 'C.001' },
              {
                id: 'cell_3_2',
                columnId: 'col_10',
                value: 'Access Management Control',
                displayValue: 'Access Management Control',
              },
              {
                id: 'cell_3_3',
                columnId: 'col_11',
                value: 'Preventive',
                displayValue: 'Preventive',
              },
              { id: 'cell_3_4', columnId: 'col_12', value: 'Monthly', displayValue: 'Monthly' },
              {
                id: 'cell_3_5',
                columnId: 'col_13',
                value: 'user_2',
                displayValue: 'Sarah Johnson',
              },
              { id: 'cell_3_6', columnId: 'col_14', value: 'Effective', displayValue: 'Effective' },
            ],
          },
        ],
      },
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
    versions: [],
  },
}

// GET /api/spreadsheets/[id] - Get spreadsheet by ID
export async function GET(_request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const resolvedParams = await params
    const { id } = resolvedParams;
    const { searchParams } = new URL(request.url);
    const includeSheets = searchParams.get('includeSheets') === 'true';
    const sheetId = searchParams.get('sheetId');

    const spreadsheet = mockSpreadsheetData[id as keyof typeof mockSpreadsheetData];

    if (!spreadsheet) {
      return NextResponse.json({ error: 'Spreadsheet not found' }, { status: 404 });
    }

    // If specific sheet requested, filter to that sheet
    const responseData: Spreadsheet = { ...spreadsheet }
    if (sheetId && includeSheets) {
      responseData.sheets = spreadsheet.sheets.filter((sheet) => sheet.id === sheetId);
    } else if (!includeSheets) {
      // Remove detailed sheet data if not requested
      responseData.sheets = spreadsheet.sheets.map((sheet) => ({
        id: sheet.id,
        name: sheet.name,
        position: sheet.position,
        columns: [] as any[],
        rows: [] as any[],
      }))
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      meta: {
        demoMode: true,
      },
    });
  } catch (error) {
    // console.error('Spreadsheet API error:', error)
    return NextResponse.json({ error: 'Failed to retrieve spreadsheet' }, { status: 500 });
  }
}

// PUT /api/spreadsheets/[id] - Update spreadsheet
export async function PUT(_request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const resolvedParams = await params
    const { id } = resolvedParams;
    const body = await request.json();
    const { name, description } = body;

    const spreadsheet = mockSpreadsheetData[id as keyof typeof mockSpreadsheetData];

    if (!spreadsheet) {
      return NextResponse.json({ error: 'Spreadsheet not found' }, { status: 404 });
    }

    // Mock update
    const updatedSpreadsheet = {
      ...spreadsheet,
      name: name || spreadsheet.name,
      description: description || spreadsheet.description,
      updatedAt: new Date(),
    }

    return NextResponse.json({
      success: true,
      message: 'Spreadsheet updated successfully (demo mode)',
      data: updatedSpreadsheet,
    });
  } catch (error) {
    // console.error('Spreadsheet update error:', error)
    return NextResponse.json({ error: 'Failed to update spreadsheet' }, { status: 500 });
  }
}

// DELETE /api/spreadsheets/[id] - Delete spreadsheet
export async function DELETE(_request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const resolvedParams = await params
    const { id } = resolvedParams;

    const spreadsheet = mockSpreadsheetData[id as keyof typeof mockSpreadsheetData];

    if (!spreadsheet) {
      return NextResponse.json({ error: 'Spreadsheet not found' }, { status: 404 });
    }

    // Mock deletion
    return NextResponse.json({
      success: true,
      message: 'Spreadsheet deleted successfully (demo mode)',
    })
  } catch (error) {
    // console.error('Spreadsheet deletion error:', error)
    return NextResponse.json({ error: 'Failed to delete spreadsheet' }, { status: 500 });
  }
}
