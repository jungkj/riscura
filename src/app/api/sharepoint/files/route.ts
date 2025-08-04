import { withApiMiddleware } from '@/lib/api/middleware';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSharePointFileService } from '@/services/sharepoint/file.service';

const listFilesSchema = z.object({
  integrationId: z.string().min(1),
  path: z.string().optional(),
});

export const POST = withApiMiddleware({
  requireAuth: true,
  bodySchema: listFilesSchema,
  rateLimiters: ['standard'],
})(async (context, { integrationId, path }) => {
  const { organizationId } = context;

  try {
    // Get integration details
    const integration = await prisma.sharePointIntegration.findFirst({
      where: {
        id: integrationId,
        organizationId,
        isActive: true,
      },
    });

    if (!integration) {
      return {
        error: 'SharePoint integration not found',
      };
    }

    // Get file service
    const fileService = getSharePointFileService();

    // List Excel files - use listAllExcelFiles for backward compatibility
    const files = await fileService.listAllExcelFiles(
      integration.siteId,
      integration.driveId || undefined,
      path,
      500 // Reasonable limit for UI display
    );

    // Update last synced timestamp
    await prisma.sharePointIntegration.update({
      where: { id: integrationId },
      data: { lastSyncedAt: new Date() },
    });

    return {
      files: files.map((file) => ({
        id: file.id,
        name: file.name,
        size: file.size,
        modifiedDate: file.modifiedDate,
        webUrl: file.webUrl,
        path: file.path,
      })),
      integration: {
        id: integration.id,
        displayName: integration.displayName,
      },
    };
  } catch (error) {
    // console.error('Error listing SharePoint files:', error)

    return {
      error: 'Failed to list files from SharePoint. Please check your connection and try again.',
    };
  }
});

// Search files endpoint
const searchFilesSchema = z.object({
  integrationId: z.string().min(1),
  query: z.string().min(1),
  fileTypes: z.array(z.string()).optional(),
});

export const PUT = withApiMiddleware({
  requireAuth: true,
  bodySchema: searchFilesSchema,
  rateLimiters: ['standard'],
})(async (context, { integrationId, query, fileTypes }) => {
  const { organizationId } = context;

  try {
    // Get integration details
    const integration = await prisma.sharePointIntegration.findFirst({
      where: {
        id: integrationId,
        organizationId,
        isActive: true,
      },
    });

    if (!integration) {
      return {
        error: 'SharePoint integration not found',
      };
    }

    // Get file service
    const fileService = getSharePointFileService();

    // Search for files
    const files = await fileService.searchFiles(
      integration.siteId,
      query,
      fileTypes || ['xlsx', 'xls']
    );

    return {
      files: files.map((file) => ({
        id: file.id,
        name: file.name,
        size: file.size,
        modifiedDate: file.modifiedDate,
        webUrl: file.webUrl,
      })),
      query,
      resultCount: files.length,
    };
  } catch (error) {
    // console.error('Error searching SharePoint files:', error)

    return {
      error: 'Failed to search files in SharePoint. Please try again.',
    };
  }
});
