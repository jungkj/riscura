import { withApiMiddleware } from '@/lib/api/middleware';
import { z } from 'zod';
import { getGoogleDriveFileService } from '@/services/googledrive/file.service';
import { getExcelValidatorService } from '@/services/excel/validator.service';
import { getImportJobService } from '@/services/import/job.service';
import { prisma } from '@/lib/prisma';

const importSchema = z.object({
  fileId: z.string().min(1),
  fileName: z.string().min(1),
});

export const POST = withApiMiddleware({
  requireAuth: true,
  bodySchema: importSchema,
  rateLimiters: ['fileUpload'],
})(async (context, { fileId, fileName }) => {
  const { user, organizationId } = context;

  try {
    // Check for active imports to prevent duplicates
    const activeImport = await prisma.importJob.findFirst({
      where: {
        organizationId,
        status: {
          in: ['QUEUED', 'PROCESSING'],
        },
        metadata: {
          path: ['fileId'],
          equals: fileId,
        },
      },
    });

    if (activeImport) {
      return {
        error: 'This file is already being imported',
        jobId: activeImport.id,
      };
    }

    // Download the file from Google Drive
    const fileService = getGoogleDriveFileService();
    const fileBuffer = await fileService.downloadFile(user.id, fileId);

    // Validate the Excel file
    const validator = getExcelValidatorService();
    const validationResult = await validator.validateRCSAFile(fileBuffer);

    if (!validationResult.isValid) {
      return {
        error: 'File validation failed',
        validationErrors: validationResult.errors,
      };
    }

    // Create import job
    const jobService = getImportJobService();
    const jobId = await jobService.createImportJob({
      organizationId,
      userId: user.id,
      integrationId: 'google-drive', // Use a generic ID for Google Drive
      siteId: 'google-drive',
      driveId: user.id, // Use user ID as drive ID
      fileId,
      fileName,
      sourceUrl: `googledrive://${fileId}`,
      metadata: {
        fileId,
        fileName,
        source: 'google-drive',
        importedBy: user.email || user.name || user.id,
        validationResult: validationResult.metadata,
      },
    });

    return {
      jobId,
      message: 'Import job created successfully',
      status: 'QUEUED',
      metadata: validationResult.metadata,
    };
  } catch (error) {
    // console.error('Error creating Google Drive import job:', error);

    if (error instanceof Error && error.message.includes('No valid Google Drive authentication')) {
      return {
        error: 'Not authenticated with Google Drive',
        code: 'AUTH_REQUIRED',
      };
    }

    return {
      error: 'Failed to start import. Please try again.',
    };
  }
});
