import * as ExcelJS from 'exceljs';

export interface RCSARowData {
  // Risk Information
  sourcesOfRisk?: string;
  riskDriver?: string;
  riskEvent?: string;
  riskImpact?: string;
  riskStatement?: string;

  // Risk Taxonomy
  function?: string;
  riskOwner?: string;
  level1RiskCategory?: string;
  level2RiskCategory?: string;

  // Risk Assessment
  likelihoodRating?: string;
  likelihoodRationale?: string;
  impactRating?: string;
  impactRationale?: string;
  inherentRiskRating?: string;
  riskMateriality?: string;

  // Key Controls
  controlId?: string;
  controlOwner?: string;
  controlDescription?: string;
  controlFrequency?: string;
  controlEvidence?: string;
  controlAutomation?: string;
  controlDesignEffectiveness?: string;
  controlOperatingEffectiveness?: string;
  residualRiskRating?: string;
}

export interface ParsedRCSAData {
  rows: RCSARowData[];
  errors: string[];
  warnings: string[];
}

export const COLUMN_MAPPINGS = {
  // Risk Information
  sourcesOfRisk: ['sources of risk', 'risk source', 'source'],
  riskDriver: ['risk driver', 'driver'],
  riskEvent: ['risk event', 'event'],
  riskImpact: ['risk impact', 'impact'],
  riskStatement: ['risk statement', 'statement'],

  // Risk Taxonomy
  function: ['function', 'business function', 'dept', 'department'],
  riskOwner: ['name', 'risk owner', 'owner name'],
  level1RiskCategory: ['level 1 risk category', 'l1 risk', 'risk category', 'risk type'],
  level2RiskCategory: ['level 2 risk category', 'l2 risk', 'risk subcategory', 'risk sub category'],

  // Risk Assessment
  likelihoodRating: ['likelihood rating', 'likelihood', 'probability'],
  likelihoodRationale: ['likelihood rating rationale', 'likelihood rationale'],
  impactRating: ['impact rating', 'impact'],
  impactRationale: ['impact rating rationale', 'impact rationale'],
  inherentRiskRating: ['inherent risk rating', 'inherent risk'],
  riskMateriality: ['risk materiality', 'materiality classification', 'materiality'],

  // Key Controls
  controlId: ['control id', 'control identifier', 'control #'],
  controlOwner: ['control owner'],
  controlDescription: ['control description', 'control statement'],
  controlFrequency: ['control frequency', 'frequency'],
  controlEvidence: ['control evidence', 'evidence'],
  controlAutomation: ['control automation', 'automation level', 'automation'],
  controlDesignEffectiveness: ['control design effectiveness', 'design effectiveness'],
  controlOperatingEffectiveness: ['control operating effectiveness', 'operating effectiveness'],
  residualRiskRating: ['residual risk rating', 'residual risk'],
};

const findColumnIndex = (headers: string[], mappings: string[]): number {
  const normalizedHeaders = headers.map((h) => h?.toString().toLowerCase().trim() || '');

  for (const mapping of mappings) {
    const index = normalizedHeaders.findIndex((h) => h.includes(mapping.toLowerCase()));
    if (index >= 0) return index;
  }

  return -1;
}

export async function parseRCSAExcel(buffer: Buffer): Promise<ParsedRCSAData> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.getWorksheet(1);
  if (!worksheet) {
    return {
      rows: [],
      errors: ['No worksheet found in the Excel file'],
      warnings: [],
    };
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  const rows: RCSARowData[] = [];

  // Find header row
  let headerRowIndex = -1;
  let columnIndices: { [key: string]: number } = {};

  // Search for headers in first 10 rows
  for (let i = 1; i <= Math.min(10, worksheet.rowCount); i++) {
    const row = worksheet.getRow(i);
    const values = row.values as any[];

    if (values && values.length > 5) {
      const headers = values.slice(1); // ExcelJS arrays are 1-indexed

      // Try to find key columns
      const hasRiskColumns = findColumnIndex(headers, ['risk event', 'risk statement']) >= 0;
      const hasControlColumns =
        findColumnIndex(headers, ['control id', 'control description']) >= 0;

      if (hasRiskColumns || hasControlColumns) {
        headerRowIndex = i;

        // Map all columns
        for (const [field, mappings] of Object.entries(COLUMN_MAPPINGS)) {
          const index = findColumnIndex(headers, mappings);
          if (index >= 0) {
            columnIndices[field] = index + 1; // Adjust for 1-based indexing
          }
        }

        break;
      }
    }
  }

  if (headerRowIndex === -1) {
    return {
      rows: [],
      errors: ['Could not find valid headers in the Excel file'],
      warnings: [],
    };
  }

  // Log found columns
  const foundColumns = Object.keys(columnIndices);
  const missingColumns = Object.keys(COLUMN_MAPPINGS).filter((col) => !foundColumns.includes(col));

  if (missingColumns.length > 0) {
    warnings.push(`Missing columns: ${missingColumns.join(', ')}`);
  }

  // Parse data rows
  for (let i = headerRowIndex + 1; i <= worksheet.rowCount; i++) {
    const row = worksheet.getRow(i);
    const values = row.values as any[];

    if (!values || values.length <= 1) continue;

    // Check if row has any data
    const hasData = Object.values(columnIndices).some((idx) => values[idx]?.toString().trim());
    if (!hasData) continue;

    const rowData: RCSARowData = {};

    // Extract data for each mapped column
    for (const [field, index] of Object.entries(columnIndices)) {
      const value = values[index];
      if (value !== null && value !== undefined) {
        rowData[field as keyof RCSARowData] = value.toString().trim();
      }
    }

    // Validate row
    if (!rowData.riskEvent && !rowData.riskStatement && !rowData.controlId) {
      warnings.push(`Row ${i}: No risk or control information found`);
      continue;
    }

    rows.push(rowData);
  }

  if (rows.length === 0) {
    errors.push('No valid data rows found in the Excel file');
  }

  return {
    rows,
    errors,
    warnings,
  };
}

export function parseRCSAText(text: string): ParsedRCSAData {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line);
  const errors: string[] = [];
  const warnings: string[] = [];
  const rows: RCSARowData[] = [];

  if (lines.length === 0) {
    return {
      rows: [],
      errors: ['No data provided'],
      warnings: [],
    };
  }

  // Try to parse as tab-delimited or comma-delimited
  const delimiter = lines[0].includes('\t') ? '\t' : ',';

  // Parse header row
  const headers = lines[0].split(delimiter).map((h) => h.trim().toLowerCase());
  const columnIndices: { [key: string]: number } = {};

  // Map columns
  for (const [field, mappings] of Object.entries(COLUMN_MAPPINGS)) {
    const index = findColumnIndex(headers, mappings);
    if (index >= 0) {
      columnIndices[field] = index;
    }
  }

  if (Object.keys(columnIndices).length === 0) {
    return {
      rows: [],
      errors: ['Could not identify any valid columns in the pasted data'],
      warnings: [],
    };
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map((v) => v.trim());
    const rowData: RCSARowData = {};

    for (const [field, index] of Object.entries(columnIndices)) {
      if (values[index]) {
        rowData[field as keyof RCSARowData] = values[index];
      }
    }

    if (Object.keys(rowData).length > 0) {
      rows.push(rowData);
    }
  }

  return {
    rows,
    errors,
    warnings,
  };
}
