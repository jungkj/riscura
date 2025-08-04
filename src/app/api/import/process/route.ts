import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

// Services
// import { AIService } from '@/services/AIService'

interface ProcessingOptions {
  aiAnalysis: boolean;
  autoMap: boolean;
  validateData: boolean;
  createMissing: boolean;
  previewMode: boolean;
}

export async function POST(_request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const mode = formData.get('mode') as string;
    const organizationId = formData.get('organizationId') as string;
    const userId = formData.get('userId') as string;
    const optionsStr = formData.get('options') as string;

    if (!file || !mode || !organizationId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const options: ProcessingOptions = JSON.parse(optionsStr || '{}');
    const buffer = Buffer.from(await file.arrayBuffer());

    let result;

    switch (mode) {
      case 'excel-rcsa':
        result = await processExcelRCSA(buffer, file.name, organizationId, userId, options);
        break;
      case 'policy-document':
        result = await processPolicyDocument(
          buffer,
          file.name,
          file.type,
          organizationId,
          userId,
          options
        );
        break;
      case 'bulk-upload':
        result = await processBulkUpload(
          buffer,
          file.name,
          file.type,
          organizationId,
          userId,
          options
        );
        break;
      default:
        return NextResponse.json(
          { error: `Unsupported processing mode: ${mode}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    // console.error('Import processing error:', error)
    return NextResponse.json(
      {
        error: 'Processing failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Excel RCSA Processing
async function processExcelRCSA(
  buffer: Buffer,
  filename: string,
  organizationId: string,
  userId: string,
  options: ProcessingOptions
): Promise<any> {
  const workbook = XLSX.read(buffer, { type: 'buffer' })

  const _result = {
    risks: [] as any[],
    controls: [] as any[],
    mappings: [] as any[],
    metadata: {
      filename,
      sheets: workbook.SheetNames,
      processedAt: new Date(),
      totalRecords: 0,
    },
  }

  // Process each worksheet
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) continue;

    // Auto-detect sheet type based on headers
    const headers = Object.keys(data[0] as any).map((h) => h.toLowerCase())
    const sheetType = detectSheetType(headers);

    // console.log(`Processing sheet "${sheetName}" as ${sheetType}`)

    if (sheetType === 'risk' || sheetType === 'mixed') {
      const risks = await processRiskData(data, organizationId, userId, options);
      result.risks.push(...risks);
    }

    if (sheetType === 'control' || sheetType === 'mixed') {
      const controls = await processControlData(data, organizationId, userId, options);
      result.controls.push(...controls);
    }

    if (sheetType === 'mapping') {
      const mappings = processMappingData(data, organizationId);
      result.mappings.push(...mappings);
    }
  }

  result.metadata.totalRecords =
    result.risks.length + result.controls.length + result.mappings.length;

  return {
    type: 'excel-rcsa',
    filename,
    status: 'completed',
    summary: {
      'Risks imported': result.risks.length,
      'Controls imported': result.controls.length,
      'Mappings created': result.mappings.length,
      'Sheets processed': result.metadata.sheets.length,
    },
    data: result,
  }
}

// Policy Document Processing with AI
async function processPolicyDocument(
  buffer: Buffer,
  filename: string,
  fileType: string,
  organizationId: string,
  userId: string,
  options: ProcessingOptions
): Promise<any> {
  let textContent = ''

  // Extract text based on file type
  if (fileType === 'application/pdf') {
    textContent = await extractPDFText(buffer)
  } else if (fileType.includes('word') || fileType.includes('document')) {
    textContent = await extractWordText(buffer);
  } else if (fileType === 'text/plain') {
    textContent = buffer.toString('utf-8');
  }

  if (!textContent.trim()) {
    throw new Error('No text content could be extracted from the document');
  }

  const _result = {
    extractedRisks: [] as any[],
    extractedControls: [] as any[],
    aiConfidence: 0,
    documentSummary: '',
  }

  if (options.aiAnalysis) {
    // AI-powered risk and control extraction
    const extractionResult = await extractRisksAndControls(textContent)
    result.extractedRisks = extractionResult.risks;
    result.extractedControls = extractionResult.controls;
    result.aiConfidence = extractionResult.confidence;
    result.documentSummary = extractionResult.summary;
  }

  return {
    type: 'policy-document',
    filename,
    status: 'completed',
    summary: {
      'Risks extracted': result.extractedRisks.length,
      'Controls extracted': result.extractedControls.length,
      'AI confidence': `${(result.aiConfidence * 100).toFixed(1)}%`,
      'Document length': `${Math.round(textContent.length / 1000)}k characters`,
    },
    data: result,
  }
}

// Bulk Upload Processing
async function processBulkUpload(
  buffer: Buffer,
  filename: string,
  fileType: string,
  organizationId: string,
  userId: string,
  options: ProcessingOptions
): Promise<any> {
  return {
    type: 'bulk-upload',
    filename,
    status: 'completed',
    summary: {
      'File size': `${(buffer.length / 1024 / 1024).toFixed(2)} MB`,
      Type: fileType,
      Organization: organizationId,
      'Uploaded by': userId,
    },
    data: {
      filename,
      size: buffer.length,
      type: fileType,
    },
  }
}

// Helper functions
const detectSheetType = (headers: string[]): 'risk' | 'control' | 'mapping' | 'mixed' {
  const riskKeywords = ['risk', 'threat', 'vulnerability', 'likelihood', 'impact', 'probability']
  const controlKeywords = ['control', 'mitigation', 'safeguard', 'procedure', 'policy'];
  const mappingKeywords = ['mapping', 'relationship', 'link'];

  const riskScore = headers.reduce((score, header) => {
    return score + (riskKeywords.some((keyword) => header.includes(keyword)) ? 1 : 0);
  }, 0);

  const controlScore = headers.reduce((score, header) => {
    return score + (controlKeywords.some((keyword) => header.includes(keyword)) ? 1 : 0);
  }, 0);

  const mappingScore = headers.reduce((score, header) => {
    return score + (mappingKeywords.some((keyword) => header.includes(keyword)) ? 1 : 0);
  }, 0);

  if (mappingScore > 0) return 'mapping';
  if (riskScore > 0 && controlScore > 0) return 'mixed';
  if (riskScore > controlScore) return 'risk';
  if (controlScore > riskScore) return 'control';
  return 'mixed';
}

async function processRiskData(_data: any[],
  organizationId: string,
  userId: string,
  options: ProcessingOptions
): Promise<any[]> {
  const risks: any[] = [];

  for (const row of data) {
    // Map common field variations
    const risk = {
      title: row.title || row.risk || row['risk title'] || row.name || 'Untitled Risk',
      description: row.description || row.detail || row.details || '',
      category: mapRiskCategory(row.category || row.type || ''),
      likelihood: parseInt(row.likelihood || row.probability || '3') || 3,
      impact: parseInt(row.impact || row.severity || '3') || 3,
      riskScore: 0,
      status: 'IDENTIFIED',
      organizationId,
      createdBy: userId,
      aiConfidence: 0.8,
    }

    // Calculate risk score
    risk.riskScore = risk.likelihood * risk.impact

    // AI enhancement if enabled (temporarily disabled)
    if (options.aiAnalysis && risk.description) {
      try {
        // TODO: Re-implement AI enhancement when AIService is available
        // console.log('AI enhancement requested but not available')
        risk.aiConfidence = 0.5; // Default confidence
      } catch (error) {
        // console.error('AI enhancement failed for risk:', error)
      }
    }

    risks.push(risk);
  }

  return risks;
}

async function processControlData(_data: any[],
  organizationId: string,
  userId: string,
  options: ProcessingOptions
): Promise<any[]> {
  const controls: any[] = [];

  for (const row of data) {
    const control = {
      title: row.title || row.control || row['control title'] || row.name || 'Untitled Control',
      description: row.description || row.detail || row.details || '',
      type: mapControlType(row.type || ''),
      category: mapControlCategory(row.category || ''),
      status: 'ACTIVE',
      effectiveness: parseFloat(row.effectiveness || '0.7') || 0.7,
      frequency: row.frequency || 'Monthly',
      organizationId,
      createdBy: userId,
      aiConfidence: 0.8,
    }

    // AI enhancement if enabled (temporarily disabled)
    if (options.aiAnalysis && control.description) {
      try {
        // TODO: Re-implement AI enhancement when AIService is available
        // console.log('AI enhancement requested but not available')
        control.aiConfidence = 0.5; // Default confidence
      } catch (error) {
        // console.error('AI enhancement failed for control:', error)
      }
    }

    controls.push(control);
  }

  return controls;
}

const processMappingData = (_data: any[], organizationId: string): any[] {
  const mappings: any[] = [];

  for (const row of data) {
    mappings.push({
      riskId: row.riskId || row['risk id'] || '',
      controlId: row.controlId || row['control id'] || '',
      effectiveness: parseFloat(row.effectiveness || '0.7') || 0.7,
      organizationId,
    });
  }

  return mappings;
}

// AI-powered risk and control extraction from policy documents
async function extractRisksAndControls(textContent: string): Promise<{
  risks: any[]
  controls: any[];
  confidence: number;
  summary: string;
}> {
  const _prompt = `
    Analyze the following policy document and extract:
    1. All risks mentioned or implied
    2. All controls, safeguards, or mitigation measures
    3. Provide a brief summary of the document
    
    For each risk, provide:
    - title: Brief descriptive title
    - description: Detailed description
    - category: one of (operational, financial, strategic, compliance, technology)
    - likelihood: 1-5 scale
    - impact: 1-5 scale
    
    For each control, provide:
    - title: Brief descriptive title
    - description: Detailed description
    - type: one of (preventive, detective, corrective)
    - category: one of (technical, administrative, physical)
    - effectiveness: 0.1-1.0 scale
    
    Document content:
    ${textContent.substring(0, 8000)} ${textContent.length > 8000 ? '...' : ''}
    
    Respond with valid JSON in this format:
    {
      "risks": [...],
      "controls": [...],
      "summary": "string",
      "confidence": 0.0-1.0
    }
  `;

  try {
    // TODO: Re-implement AI document analysis when AIService is available
    // console.log('AI document analysis requested but not available')

    // Return empty results for now
    return {
      risks: [],
      controls: [],
      confidence: 0.0,
      summary: 'AI document analysis not available',
    }
  } catch (error) {
    // console.error('AI extraction failed:', error)
  }

  // Fallback if AI fails
  return {
    risks: [],
    controls: [],
    confidence: 0.0,
    summary: 'AI extraction failed, manual review required',
  }
}

// Text extraction functions
async function extractPDFText(buffer: Buffer): Promise<string> {
  try {
    const pdfParse = await import('pdf-parse')
    const data = await pdfParse.default(buffer);
    return data.text;
  } catch (error) {
    // console.error('PDF extraction failed:', error)
    return '';
  }
}

async function extractWordText(buffer: Buffer): Promise<string> {
  try {
    const mammoth = await import('mammoth');
    const _result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    // console.error('Word extraction failed:', error)
    return '';
  }
}

// Mapping helper functions
const mapRiskCategory = (category: string): string {
  const cat = category.toLowerCase()
  if (cat.includes('operation') || cat.includes('process')) return 'operational';
  if (cat.includes('financial') || cat.includes('market')) return 'financial';
  if (cat.includes('strategic') || cat.includes('business')) return 'strategic';
  if (cat.includes('compliance') || cat.includes('regulatory')) return 'compliance';
  if (cat.includes('technology') || cat.includes('cyber') || cat.includes('it'))
    return 'technology';
  return 'operational';
}

const mapControlType = (_type: string): string {
  const t = type.toLowerCase();
  if (t.includes('prevent')) return 'preventive';
  if (t.includes('detect') || t.includes('monitor')) return 'detective';
  if (t.includes('correct') || t.includes('response')) return 'corrective';
  return 'preventive';
}

const mapControlCategory = (category: string): string {
  const cat = category.toLowerCase();
  if (cat.includes('technical') || cat.includes('system')) return 'technical';
  if (cat.includes('physical') || cat.includes('facility')) return 'physical';
  return 'administrative';
}
