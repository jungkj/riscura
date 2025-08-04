import * as XLSX from 'xlsx';
// import { parseRiskScore } from '@/lib/utils/risk-score'

export interface ValidationError {
  type: 'error' | 'warning';
  sheet?: string;
  row?: number;
  column?: string;
  field?: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  metadata: {
    rowCount: number;
    fileSize: number;
    sheets: string[];
    riskCount?: number;
    controlCount?: number;
    assessmentCount?: number;
  }
}

interface RiskData {
  riskId?: string;
  riskName?: string;
  riskDescription?: string;
  category?: string;
  likelihood?: string | number;
  impact?: string | number;
  inherentRisk?: string | number;
  owner?: string;
  department?: string;
}

interface ControlData {
  controlId?: string;
  controlName?: string;
  controlDescription?: string;
  controlType?: string;
  frequency?: string;
  effectiveness?: string | number;
  riskId?: string;
  owner?: string;
}

interface AssessmentData {
  assessmentId?: string;
  assessmentDate?: string | Date;
  controlId?: string;
  status?: string;
  findings?: string;
  recommendations?: string;
  assessor?: string;
}

export class ExcelValidatorService {
  private readonly requiredSheets = ['Risk Register', 'Controls', 'Assessments'];
  private readonly alternateSheetNames = {
    'Risk Register': ['Risks', 'Risk_Register', 'RiskRegister'],
    Controls: ['Control', 'Control_Library', 'ControlLibrary'],
    Assessments: ['Assessment', 'Control_Assessments', 'ControlAssessments'],
  }

  /**
   * Validate RCSA Excel file
   */
  async validateRCSAFile(buffer: Buffer): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    try {
      // Parse Excel file
      const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })

      // Basic file validation
      const fileSize = buffer.length
      if (fileSize > 50 * 1024 * 1024) {
        // 50MB limit
        errors.push({
          type: 'error',
          message: 'File size exceeds 50MB limit',
        })
      }

      // Get sheet names
      const sheetNames = workbook.SheetNames

      // Validate required sheets
      const foundSheets = this.validateSheets(workbook, errors)

      // Initialize metadata
      const metadata: ValidationResult['metadata'] = {
        rowCount: 0,
        fileSize: fileSize,
        sheets: sheetNames,
      }

      // If we have the required sheets, validate their content
      if (foundSheets.riskSheet) {
        const riskData = this.parseSheet<RiskData>(workbook, foundSheets.riskSheet)
        this.validateRiskData(riskData, errors, warnings);
        metadata.riskCount = riskData.length;
        metadata.rowCount += riskData.length;
      }

      if (foundSheets.controlSheet) {
        const controlData = this.parseSheet<ControlData>(workbook, foundSheets.controlSheet);
        this.validateControlData(controlData, errors, warnings);
        metadata.controlCount = controlData.length;
        metadata.rowCount += controlData.length;
      }

      if (foundSheets.assessmentSheet) {
        const assessmentData = this.parseSheet<AssessmentData>(
          workbook,
          foundSheets.assessmentSheet
        );
        this.validateAssessmentData(assessmentData, errors, warnings);
        metadata.assessmentCount = assessmentData.length;
        metadata.rowCount += assessmentData.length;
      }

      // Cross-sheet validation
      if (foundSheets.riskSheet && foundSheets.controlSheet) {
        this.validateCrossReferences(workbook, foundSheets, errors, warnings)
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        metadata,
      }
    } catch (error) {
      errors.push({
        type: 'error',
        message: `Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });

      return {
        isValid: false,
        errors,
        warnings,
        metadata: {
          rowCount: 0,
          fileSize: buffer.length,
          sheets: [],
        },
      }
    }
  }

  /**
   * Validate sheet presence and structure
   */
  private validateSheets(
    workbook: XLSX.WorkBook,
    errors: ValidationError[]
  ): { riskSheet?: string; controlSheet?: string; assessmentSheet?: string } {
    const foundSheets: { riskSheet?: string; controlSheet?: string; assessmentSheet?: string } = {}

    for (const requiredSheet of this.requiredSheets) {
      let sheetFound = false;

      // Check exact name first
      if (workbook.SheetNames.includes(requiredSheet)) {
        sheetFound = true
        this.assignFoundSheet(foundSheets, requiredSheet, requiredSheet);
      } else {
        // Check alternate names
        const alternates =
          this.alternateSheetNames[requiredSheet as keyof typeof this.alternateSheetNames]
        for (const altName of alternates) {
          if (workbook.SheetNames.some((s) => s.toLowerCase() === altName.toLowerCase())) {
            sheetFound = true;
            const actualName = workbook.SheetNames.find(
              (s) => s.toLowerCase() === altName.toLowerCase()
            )!;
            this.assignFoundSheet(foundSheets, requiredSheet, actualName);
            break;
          }
        }
      }

      if (!sheetFound) {
        errors.push({
          type: 'error',
          message: `Required sheet '${requiredSheet}' not found. Accepted names: ${requiredSheet}, ${this.alternateSheetNames[requiredSheet as keyof typeof this.alternateSheetNames].join(', ')}`,
        });
      }
    }

    return foundSheets;
  }

  /**
   * Helper to assign found sheets
   */
  private assignFoundSheet(
    foundSheets: { riskSheet?: string; controlSheet?: string; assessmentSheet?: string },
    requiredName: string,
    actualName: string
  ): void {
    switch (requiredName) {
      case 'Risk Register':
        foundSheets.riskSheet = actualName;
        break;
      case 'Controls':
        foundSheets.controlSheet = actualName;
        break;
      case 'Assessments':
        foundSheets.assessmentSheet = actualName;
        break;
    }
  }

  /**
   * Parse sheet data with runtime validation
   */
  private parseSheet<T>(workbook: XLSX.WorkBook, sheetName: string): T[] {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      throw new Error(`Sheet "${sheetName}" not found in the workbook`);
    }

    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      defval: undefined,
      blankrows: false,
    });

    // Runtime validation to ensure the parsed data is an array
    if (!Array.isArray(jsonData)) {
      throw new Error(
        `Invalid data format for sheet "${sheetName}": expected an array but got ${typeof jsonData}`
      )
    }

    return jsonData as T[];
  }

  /**
   * Validate risk data
   */
  private validateRiskData(_data: RiskData[],
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    if (data.length === 0) {
      errors.push({
        type: 'error',
        sheet: 'Risk Register',
        message: 'Risk Register sheet is empty',
      });
      return;
    }

    const seenRiskIds = new Set<string>();

    data.forEach((row, index) => {
      const rowNum = index + 2; // Excel rows start at 1, plus header row

      // Validate required fields
      if (!row.riskId && !row.riskName) {
        errors.push({
          type: 'error',
          sheet: 'Risk Register',
          row: rowNum,
          message: 'Risk must have either Risk ID or Risk Name',
        })
      }

      if (row.riskId) {
        if (seenRiskIds.has(row.riskId)) {
          errors.push({
            type: 'error',
            sheet: 'Risk Register',
            row: rowNum,
            field: 'riskId',
            message: `Duplicate Risk ID: ${row.riskId}`,
          });
        }
        seenRiskIds.add(row.riskId);
      }

      // Validate risk scores
      if (row.likelihood !== undefined) {
        const likelihood = parseRiskScore(row.likelihood)
        if (likelihood < 1 || likelihood > 5) {
          warnings.push({
            type: 'warning',
            sheet: 'Risk Register',
            row: rowNum,
            field: 'likelihood',
            message: 'Likelihood should be between 1 and 5',
          });
        }
      }

      if (row.impact !== undefined) {
        const impact = parseRiskScore(row.impact);
        if (impact < 1 || impact > 5) {
          warnings.push({
            type: 'warning',
            sheet: 'Risk Register',
            row: rowNum,
            field: 'impact',
            message: 'Impact should be between 1 and 5',
          });
        }
      }

      // Validate category
      if (!row.category) {
        warnings.push({
          type: 'warning',
          sheet: 'Risk Register',
          row: rowNum,
          field: 'category',
          message: 'Risk category is missing',
        })
      }
    });
  }

  /**
   * Validate control data
   */
  private validateControlData(_data: ControlData[],
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    if (data.length === 0) {
      errors.push({
        type: 'error',
        sheet: 'Controls',
        message: 'Controls sheet is empty',
      });
      return;
    }

    const seenControlIds = new Set<string>();

    data.forEach((row, index) => {
      const rowNum = index + 2;

      // Validate required fields
      if (!row.controlId && !row.controlName) {
        errors.push({
          type: 'error',
          sheet: 'Controls',
          row: rowNum,
          message: 'Control must have either Control ID or Control Name',
        })
      }

      if (row.controlId) {
        if (seenControlIds.has(row.controlId)) {
          errors.push({
            type: 'error',
            sheet: 'Controls',
            row: rowNum,
            field: 'controlId',
            message: `Duplicate Control ID: ${row.controlId}`,
          });
        }
        seenControlIds.add(row.controlId);
      }

      // Validate control type
      if (!row.controlType) {
        warnings.push({
          type: 'warning',
          sheet: 'Controls',
          row: rowNum,
          field: 'controlType',
          message: 'Control type is missing',
        })
      }

      // Validate effectiveness
      if (row.effectiveness !== undefined) {
        const effectiveness = parseRiskScore(row.effectiveness)
        if (effectiveness < 1 || effectiveness > 5) {
          warnings.push({
            type: 'warning',
            sheet: 'Controls',
            row: rowNum,
            field: 'effectiveness',
            message: 'Effectiveness should be between 1 and 5',
          });
        }
      }

      // Validate risk linkage
      if (!row.riskId) {
        warnings.push({
          type: 'warning',
          sheet: 'Controls',
          row: rowNum,
          field: 'riskId',
          message: 'Control is not linked to any risk',
        })
      }
    });
  }

  /**
   * Validate assessment data
   */
  private validateAssessmentData(_data: AssessmentData[],
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    if (data.length === 0) {
      warnings.push({
        type: 'warning',
        sheet: 'Assessments',
        message: 'Assessments sheet is empty',
      });
      return;
    }

    data.forEach((row, index) => {
      const rowNum = index + 2;

      // Validate required fields
      if (!row.controlId) {
        errors.push({
          type: 'error',
          sheet: 'Assessments',
          row: rowNum,
          field: 'controlId',
          message: 'Assessment must reference a Control ID',
        })
      }

      // Validate date
      if (!row.assessmentDate) {
        warnings.push({
          type: 'warning',
          sheet: 'Assessments',
          row: rowNum,
          field: 'assessmentDate',
          message: 'Assessment date is missing',
        })
      } else {
        const date = new Date(row.assessmentDate);
        if (isNaN(date.getTime())) {
          errors.push({
            type: 'error',
            sheet: 'Assessments',
            row: rowNum,
            field: 'assessmentDate',
            message: 'Invalid date format',
          });
        }
      }

      // Validate status
      if (!row.status) {
        warnings.push({
          type: 'warning',
          sheet: 'Assessments',
          row: rowNum,
          field: 'status',
          message: 'Assessment status is missing',
        })
      }
    });
  }

  /**
   * Validate cross-references between sheets
   */
  private validateCrossReferences(
    workbook: XLSX.WorkBook,
    foundSheets: { riskSheet?: string; controlSheet?: string; assessmentSheet?: string },
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    // Get all risk IDs
    const riskData = this.parseSheet<RiskData>(workbook, foundSheets.riskSheet!)
    const validRiskIds = new Set(riskData.map((r) => r.riskId).filter(Boolean));

    // Get all control IDs
    const controlData = this.parseSheet<ControlData>(workbook, foundSheets.controlSheet!)
    const validControlIds = new Set(controlData.map((c) => c.controlId).filter(Boolean));

    // Validate control risk references
    controlData.forEach((control, index) => {
      if (control.riskId && !validRiskIds.has(control.riskId)) {
        warnings.push({
          type: 'warning',
          sheet: 'Controls',
          row: index + 2,
          field: 'riskId',
          message: `Referenced Risk ID '${control.riskId}' not found in Risk Register`,
        })
      }
    });

    // Validate assessment control references
    if (foundSheets.assessmentSheet) {
      const assessmentData = this.parseSheet<AssessmentData>(workbook, foundSheets.assessmentSheet)
      assessmentData.forEach((assessment, index) => {
        if (assessment.controlId && !validControlIds.has(assessment.controlId)) {
          errors.push({
            type: 'error',
            sheet: 'Assessments',
            row: index + 2,
            field: 'controlId',
            message: `Referenced Control ID '${assessment.controlId}' not found in Controls sheet`,
          });
        }
      });
    }
  }
}

// Singleton instance
let validatorInstance: ExcelValidatorService | null = null

export function getExcelValidatorService(): ExcelValidatorService {
  if (!validatorInstance) {
    validatorInstance = new ExcelValidatorService();
  }
  return validatorInstance;
}
