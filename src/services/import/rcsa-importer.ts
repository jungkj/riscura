import * as XLSX from 'xlsx';
import { prisma } from '@/lib/prisma';
import { RiskStatus, RiskLikelihood, RiskImpact, ControlType, ControlStatus, ControlFrequency } from '@prisma/client';

interface ImportOptions {
  organizationId: string;
  userId: string;
  fileName: string;
  onProgress?: (progress: number, message: string) => Promise<void>;
}

interface ImportResult {
  risksImported: number;
  controlsImported: number;
  assessmentsImported: number;
  errors: string[];
  warnings: string[];
}

interface RiskRow {
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

interface ControlRow {
  controlId?: string;
  controlName?: string;
  controlDescription?: string;
  controlType?: string;
  frequency?: string;
  effectiveness?: string | number;
  riskId?: string;
  owner?: string;
}

interface AssessmentRow {
  assessmentId?: string;
  assessmentDate?: string | Date;
  controlId?: string;
  status?: string;
  findings?: string;
  recommendations?: string;
  assessor?: string;
}

/**
 * Import RCSA data from Excel buffer
 */
export async function importRCSAData(
  buffer: Buffer,
  options: ImportOptions
): Promise<ImportResult> {
  const result: ImportResult = {
    risksImported: 0,
    controlsImported: 0,
    assessmentsImported: 0,
    errors: [],
    warnings: []
  };

  try {
    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    
    // Find sheets (case-insensitive)
    const riskSheet = findSheet(workbook, ['Risk Register', 'Risks', 'Risk_Register']);
    const controlSheet = findSheet(workbook, ['Controls', 'Control', 'Control_Library']);
    const assessmentSheet = findSheet(workbook, ['Assessments', 'Assessment', 'Control_Assessments']);

    // Create a map to store imported entities
    const riskIdMap = new Map<string, string>(); // Excel ID -> Database ID
    const controlIdMap = new Map<string, string>();

    // Import risks
    if (riskSheet) {
      await options.onProgress?.(10, 'Importing risks...');
      const riskResult = await importRisks(workbook, riskSheet, options, riskIdMap);
      result.risksImported = riskResult.imported;
      result.errors.push(...riskResult.errors);
      result.warnings.push(...riskResult.warnings);
    }

    // Import controls
    if (controlSheet) {
      await options.onProgress?.(40, 'Importing controls...');
      const controlResult = await importControls(workbook, controlSheet, options, riskIdMap, controlIdMap);
      result.controlsImported = controlResult.imported;
      result.errors.push(...controlResult.errors);
      result.warnings.push(...controlResult.warnings);
    }

    // Import assessments
    if (assessmentSheet) {
      await options.onProgress?.(70, 'Importing assessments...');
      const assessmentResult = await importAssessments(workbook, assessmentSheet, options, controlIdMap);
      result.assessmentsImported = assessmentResult.imported;
      result.errors.push(...assessmentResult.errors);
      result.warnings.push(...assessmentResult.warnings);
    }

    return result;
  } catch (error) {
    console.error('RCSA import error:', error);
    result.errors.push(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

/**
 * Find sheet by name (case-insensitive)
 */
function findSheet(workbook: XLSX.WorkBook, names: string[]): string | undefined {
  for (const name of names) {
    const sheet = workbook.SheetNames.find(s => s.toLowerCase() === name.toLowerCase());
    if (sheet) return sheet;
  }
  return undefined;
}

/**
 * Import risks from Excel
 */
async function importRisks(
  workbook: XLSX.WorkBook,
  sheetName: string,
  options: ImportOptions,
  riskIdMap: Map<string, string>
): Promise<{ imported: number; errors: string[]; warnings: string[] }> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let imported = 0;

  try {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<RiskRow>(worksheet, { 
      raw: false, 
      defval: undefined,
      blankrows: false 
    });

    for (const [index, row] of data.entries()) {
      try {
        const riskName = row.riskName || row.riskId || `Risk ${index + 1}`;
        
        // Create risk
        const risk = await prisma.risk.create({
          data: {
            organizationId: options.organizationId,
            name: riskName,
            description: row.riskDescription || '',
            category: mapRiskCategory(row.category),
            likelihood: mapLikelihood(row.likelihood),
            impact: mapImpact(row.impact),
            status: RiskStatus.ACTIVE,
            department: row.department,
            owner: row.owner,
            createdBy: options.userId,
            metadata: {
              sourceFile: options.fileName,
              originalId: row.riskId,
              importedAt: new Date()
            }
          }
        });

        // Store mapping
        if (row.riskId) {
          riskIdMap.set(row.riskId, risk.id);
        }

        imported++;
      } catch (error) {
        errors.push(`Row ${index + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  } catch (error) {
    errors.push(`Failed to read risks: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return { imported, errors, warnings };
}

/**
 * Import controls from Excel
 */
async function importControls(
  workbook: XLSX.WorkBook,
  sheetName: string,
  options: ImportOptions,
  riskIdMap: Map<string, string>,
  controlIdMap: Map<string, string>
): Promise<{ imported: number; errors: string[]; warnings: string[] }> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let imported = 0;

  try {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<ControlRow>(worksheet, { 
      raw: false, 
      defval: undefined,
      blankrows: false 
    });

    for (const [index, row] of data.entries()) {
      try {
        const controlName = row.controlName || row.controlId || `Control ${index + 1}`;
        
        // Map risk ID
        let riskIds: string[] = [];
        if (row.riskId) {
          const mappedRiskId = riskIdMap.get(row.riskId);
          if (mappedRiskId) {
            riskIds = [mappedRiskId];
          } else {
            warnings.push(`Row ${index + 2}: Risk ID '${row.riskId}' not found`);
          }
        }

        // Create control
        const control = await prisma.control.create({
          data: {
            organizationId: options.organizationId,
            name: controlName,
            description: row.controlDescription || '',
            type: mapControlType(row.controlType),
            status: ControlStatus.ACTIVE,
            frequency: mapControlFrequency(row.frequency),
            effectiveness: mapEffectiveness(row.effectiveness),
            owner: row.owner,
            createdBy: options.userId,
            metadata: {
              sourceFile: options.fileName,
              originalId: row.controlId,
              importedAt: new Date()
            },
            // Connect to risks if available
            risks: riskIds.length > 0 ? {
              connect: riskIds.map(id => ({ id }))
            } : undefined
          }
        });

        // Store mapping
        if (row.controlId) {
          controlIdMap.set(row.controlId, control.id);
        }

        imported++;
      } catch (error) {
        errors.push(`Row ${index + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  } catch (error) {
    errors.push(`Failed to read controls: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return { imported, errors, warnings };
}

/**
 * Import assessments from Excel
 */
async function importAssessments(
  workbook: XLSX.WorkBook,
  sheetName: string,
  options: ImportOptions,
  controlIdMap: Map<string, string>
): Promise<{ imported: number; errors: string[]; warnings: string[] }> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let imported = 0;

  try {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<AssessmentRow>(worksheet, { 
      raw: false, 
      defval: undefined,
      blankrows: false 
    });

    for (const [index, row] of data.entries()) {
      try {
        // Map control ID
        if (!row.controlId) {
          errors.push(`Row ${index + 2}: Control ID is required`);
          continue;
        }

        const mappedControlId = controlIdMap.get(row.controlId);
        if (!mappedControlId) {
          errors.push(`Row ${index + 2}: Control ID '${row.controlId}' not found`);
          continue;
        }

        // Parse date
        const assessmentDate = row.assessmentDate ? new Date(row.assessmentDate) : new Date();
        if (isNaN(assessmentDate.getTime())) {
          errors.push(`Row ${index + 2}: Invalid date format`);
          continue;
        }

        // Create control assessment
        await prisma.controlAssessment.create({
          data: {
            organizationId: options.organizationId,
            controlId: mappedControlId,
            assessmentDate,
            status: mapAssessmentStatus(row.status),
            findings: row.findings || '',
            recommendations: row.recommendations || '',
            assessedBy: row.assessor || options.userId,
            createdBy: options.userId,
            metadata: {
              sourceFile: options.fileName,
              originalId: row.assessmentId,
              importedAt: new Date()
            }
          }
        });

        imported++;
      } catch (error) {
        errors.push(`Row ${index + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  } catch (error) {
    errors.push(`Failed to read assessments: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return { imported, errors, warnings };
}

// Mapping functions

function mapRiskCategory(category?: string): string {
  if (!category) return 'OPERATIONAL';
  
  const normalized = category.toUpperCase();
  const validCategories = ['OPERATIONAL', 'FINANCIAL', 'STRATEGIC', 'COMPLIANCE', 'REPUTATIONAL'];
  
  return validCategories.includes(normalized) ? normalized : 'OPERATIONAL';
}

function mapLikelihood(value?: string | number): RiskLikelihood {
  if (!value) return RiskLikelihood.MEDIUM;
  
  const numValue = typeof value === 'number' ? value : parseRiskScore(value);
  
  switch (numValue) {
    case 1: return RiskLikelihood.VERY_LOW;
    case 2: return RiskLikelihood.LOW;
    case 3: return RiskLikelihood.MEDIUM;
    case 4: return RiskLikelihood.HIGH;
    case 5: return RiskLikelihood.VERY_HIGH;
    default: return RiskLikelihood.MEDIUM;
  }
}

function mapImpact(value?: string | number): RiskImpact {
  if (!value) return RiskImpact.MODERATE;
  
  const numValue = typeof value === 'number' ? value : parseRiskScore(value);
  
  switch (numValue) {
    case 1: return RiskImpact.NEGLIGIBLE;
    case 2: return RiskImpact.MINOR;
    case 3: return RiskImpact.MODERATE;
    case 4: return RiskImpact.MAJOR;
    case 5: return RiskImpact.SEVERE;
    default: return RiskImpact.MODERATE;
  }
}

function mapControlType(type?: string): ControlType {
  if (!type) return ControlType.DETECTIVE;
  
  const normalized = type.toUpperCase();
  
  if (normalized.includes('PREVENT')) return ControlType.PREVENTIVE;
  if (normalized.includes('DETECT')) return ControlType.DETECTIVE;
  if (normalized.includes('CORRECT')) return ControlType.CORRECTIVE;
  
  return ControlType.DETECTIVE;
}

function mapControlFrequency(frequency?: string): ControlFrequency {
  if (!frequency) return ControlFrequency.MONTHLY;
  
  const normalized = frequency.toUpperCase();
  
  if (normalized.includes('DAILY')) return ControlFrequency.DAILY;
  if (normalized.includes('WEEKLY')) return ControlFrequency.WEEKLY;
  if (normalized.includes('MONTHLY')) return ControlFrequency.MONTHLY;
  if (normalized.includes('QUARTERLY')) return ControlFrequency.QUARTERLY;
  if (normalized.includes('ANNUAL') || normalized.includes('YEARLY')) return ControlFrequency.ANNUALLY;
  if (normalized.includes('CONTINUOUS') || normalized.includes('REAL')) return ControlFrequency.CONTINUOUS;
  
  return ControlFrequency.MONTHLY;
}

function mapEffectiveness(value?: string | number): number {
  if (!value) return 3;
  
  const numValue = typeof value === 'number' ? value : parseRiskScore(value);
  return Math.max(1, Math.min(5, numValue));
}

function mapAssessmentStatus(status?: string): string {
  if (!status) return 'SATISFACTORY';
  
  const normalized = status.toUpperCase();
  
  if (normalized.includes('SATISF') || normalized.includes('EFFECT')) return 'SATISFACTORY';
  if (normalized.includes('NEEDS') || normalized.includes('IMPROVEMENT')) return 'NEEDS_IMPROVEMENT';
  if (normalized.includes('UNSATISF') || normalized.includes('INEFFECT')) return 'UNSATISFACTORY';
  
  return 'SATISFACTORY';
}

function parseRiskScore(value: string): number {
  const strValue = value.toLowerCase().trim();
  
  const textToScore: { [key: string]: number } = {
    'very low': 1, 'verylow': 1, 'very_low': 1,
    'low': 2,
    'medium': 3, 'moderate': 3,
    'high': 4,
    'very high': 5, 'veryhigh': 5, 'very_high': 5, 'critical': 5
  };
  
  if (textToScore[strValue]) {
    return textToScore[strValue];
  }
  
  const numValue = parseInt(strValue);
  return isNaN(numValue) ? 3 : Math.max(1, Math.min(5, numValue));
}