import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { z } from 'zod';
import * as XLSX from 'xlsx';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth/session';

// Excel import schema
const ExcelImportSchema = z.object({
  risks: z.array(
    z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      category: z.string().optional(),
      likelihood: z.number().min(1).max(5).optional(),
      impact: z.number().min(1).max(5).optional(),
      status: z.string().optional(),
      owner: z.string().optional(),
      department: z.string().optional(),
    })
  ),
});

export const POST = withApiMiddleware({
  requireAuth: true,
  rateLimiters: ['fileUpload'],
})(async (context) => {
  const { user, organizationId } = context;
  const req = context.req as NextRequest;

  try {
    // Get the uploaded file from the form data
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return {
        success: false,
        error: 'No file uploaded',
      };
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return {
        success: false,
        error: 'File size exceeds 10MB limit',
      };
    }

    // Check file type
    const fileType = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(fileType || '')) {
      return {
        success: false,
        error: 'Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV file',
      };
    }

    // Read the file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // Map Excel columns to risk fields
    const risks = jsonData.map((row: any) => {
      // Try to auto-detect common column names
      const risk = {
        name: row['Risk Name'] || row['Name'] || row['Title'] || row['Risk'] || '',
        description: row['Description'] || row['Risk Description'] || row['Details'] || '',
        category: row['Category'] || row['Type'] || row['Risk Category'] || 'Operational',
        likelihood: parseRiskScore(row['Likelihood'] || row['Probability'] || row['L'] || 3),
        impact: parseRiskScore(row['Impact'] || row['I'] || 3),
        status: row['Status'] || 'Active',
        owner: row['Owner'] || row['Risk Owner'] || row['Assigned To'] || user.name || '',
        department: row['Department'] || row['Business Unit'] || row['Area'] || '',
      };

      return risk;
    });

    // Filter out empty rows
    const validRisks = risks.filter((risk) => risk.name || risk.description);

    if (validRisks.length === 0) {
      return {
        success: false,
        error: 'No valid risks found in the file. Please check the column headers.',
      };
    }

    // Create risks in the database
    const createdRisks = await Promise.all(
      validRisks.map(async (risk) => {
        return await prisma.risk.create({
          data: {
            name: risk.name || 'Untitled Risk',
            description: risk.description || '',
            category: risk.category,
            likelihood: risk.likelihood,
            impact: risk.impact,
            status: risk.status,
            organizationId,
            createdById: user.id,
            metadata: {
              importedFrom: file.name,
              importedAt: new Date().toISOString(),
              owner: risk.owner,
              department: risk.department,
            },
          },
        });
      })
    );

    return {
      success: true,
      message: `Successfully imported ${createdRisks.length} risks`,
      risksImported: createdRisks.length,
      data: {
        risks: createdRisks.map((r) => ({
          id: r.id,
          name: r.name,
          category: r.category,
          status: r.status,
        })),
      },
    };
  } catch (error) {
    // console.error('Excel import error:', error);
    return {
      success: false,
      error: 'Failed to import Excel file. Please check the file format and try again.',
    };
  }
});

// Helper function to parse risk scores from various formats
const parseRiskScore = (_value: any): number {
  if (typeof value === 'number') {
    return Math.min(Math.max(Math.round(value), 1), 5);
  }

  const strValue = String(value).toLowerCase().trim();

  // Handle text values
  const textToScore: Record<string, number> = {
    'very low': 1,
    vl: 1,
    negligible: 1,
    low: 2,
    l: 2,
    minor: 2,
    medium: 3,
    m: 3,
    moderate: 3,
    mod: 3,
    high: 4,
    h: 4,
    major: 4,
    'very high': 5,
    vh: 5,
    critical: 5,
    severe: 5,
  };

  if (textToScore[strValue]) {
    return textToScore[strValue];
  }

  // Try to parse as number
  const num = parseInt(strValue);
  if (!isNaN(num)) {
    return Math.min(Math.max(num, 1), 5);
  }

  // Default to medium
  return 3;
}
