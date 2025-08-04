import { withApiMiddleware } from '@/lib/api/middleware';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getImportJobService } from '@/services/import/job.service';
import { Prisma } from '@prisma/client';

const importSchema = z.object({
  integrationId: z.string().min(1),
  fileId: z.string().min(1),
  fileName: z.string().min(1),
});

export const POST = withApiMiddleware({
  requireAuth: true,
  bodySchema: importSchema,
  rateLimiters: ['fileUpload'],
})(async (context, { integrationId, fileId, fileName }) => {
  const { user, organizationId } = context;

  try {
    // Verify integration exists and is active
    const integration = await prisma.sharePointIntegration.findFirst({
      where: {
        id: integrationId,
        organizationId,
        isActive: true,
      },
    })

    if (!integration) {
      return {
        error: 'SharePoint integration not found or inactive',
      }
    }

    // Validate driveId before transaction
    if (!integration.driveId || integration.driveId.trim() === '') {
      return {
        error:
          'SharePoint integration is missing driveId. Please reconnect to SharePoint and select a document library.',
      }
    }

    // Use transaction to prevent race condition
    const _result = await prisma.$transaction(async (tx) => {
      // Check for active imports within transaction
      const activeImport = await tx.importJob.findFirst({
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
      })

      if (activeImport) {
        return {
          error: 'This file is already being imported',
          jobId: activeImport.id,
          isError: true,
        }
      }

      // Create import job within the same transaction
      const importJob = await tx.importJob.create({
        data: {
          organizationId,
          userId: user.id,
          type: 'sharepoint',
          status: 'QUEUED',
          sourceUrl: `sharepoint://${integration.siteId}/${fileId}`,
          metadata: {
            fileId,
            fileName,
            integrationId,
            siteId: integration.siteId,
            driveId: integration.driveId,
            importedBy: user.email || user.name || user.id,
          },
        },
      })

      return {
        jobId: importJob.id,
        isError: false,
      }
    });

    // Check if transaction returned an error
    if (result.isError) {
      return {
        error: result.error,
        jobId: result.jobId,
      }
    }

    const jobId = result.jobId;

    return {
      jobId,
      message: 'Import job created successfully',
      status: 'QUEUED',
    }
  } catch (error) {
    // console.error('Error creating import job:', error)

    return {
      error: 'Failed to start import. Please try again.',
    }
  }
});

// GET endpoint to check import history
export const GET = withApiMiddleware({
  requireAuth: true,
  rateLimiters: ['standard'],
})(async (context) => {
  const { organizationId } = context
  const { searchParams } = new URL(context.req.url);
  const integrationId = searchParams.get('integrationId');
  const limit = parseInt(searchParams.get('limit') || '10');
  const offset = parseInt(searchParams.get('offset') || '0');

  const where: Prisma.ImportJobWhereInput = {
    organizationId,
    type: 'sharepoint',
  }

  if (integrationId) {
    where.metadata = {
      path: ['integrationId'],
      equals: integrationId,
    }
  }

  const [jobs, total] = await Promise.all([
    prisma.importJob.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.importJob.count({ where }),
  ]);

  return {
    jobs: jobs.map((job) => ({
      id: job.id,
      status: job.status,
      progress: job.progress,
      progressMessage: job.progressMessage,
      fileName: job.metadata?.fileName || 'Unknown',
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      errorMessage: job.errorMessage,
      importedBy: {
        id: job.user.id,
        name: job.user.name,
        email: job.user.email,
      },
      metadata: job.metadata,
    })),
    total,
    limit,
    offset,
  }
});
