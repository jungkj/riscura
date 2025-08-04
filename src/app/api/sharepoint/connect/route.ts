import { withApiMiddleware } from '@/lib/api/middleware';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSharePointFileService } from '@/services/sharepoint/file.service';
import { getSharePointAuthService } from '@/services/sharepoint/auth.service';

const connectSchema = z.object({
  siteUrl: z
    .string()
    .url()
    .refine((url) => url.includes('sharepoint.com'), 'Must be a valid SharePoint URL'),
});

export const POST = withApiMiddleware({
  requireAuth: true,
  bodySchema: connectSchema,
  rateLimiters: ['standard'],
})(async (context, { siteUrl }) => {
  const { user, organizationId } = context;

  try {
    // Get SharePoint services
    const authService = getSharePointAuthService();
    const fileService = getSharePointFileService();

    // Get site information from URL
    const siteInfo = await fileService.getSiteByUrl(siteUrl);

    // Validate access to the site
    const hasAccess = await authService.validateSiteAccess(siteInfo.id);
    if (!hasAccess) {
      return {
        error: 'Access denied to the specified SharePoint site',
      };
    }

    // Get default document library
    const driveId = await fileService.getDefaultDrive(siteInfo.id);

    // Check if integration already exists
    const existingIntegration = await prisma.sharePointIntegration.findUnique({
      where: {
        organizationId_siteId: {
          organizationId,
          siteId: siteInfo.id,
        },
      },
    });

    if (existingIntegration) {
      // Update existing integration
      const updatedIntegration = await prisma.sharePointIntegration.update({
        where: { id: existingIntegration.id },
        data: {
          displayName: siteInfo.displayName,
          driveId,
          isActive: true,
          lastSyncedAt: new Date(),
        },
      });

      return {
        integration: {
          id: updatedIntegration.id,
          displayName: updatedIntegration.displayName,
          siteId: updatedIntegration.siteId,
          driveId: updatedIntegration.driveId,
          isActive: updatedIntegration.isActive,
          webUrl: siteInfo.webUrl,
        },
        message: 'SharePoint connection updated successfully',
      };
    }

    // Create new integration
    const integration = await prisma.sharePointIntegration.create({
      data: {
        organizationId,
        displayName: siteInfo.displayName,
        siteId: siteInfo.id,
        driveId,
        isActive: true,
      },
    });

    return {
      integration: {
        id: integration.id,
        displayName: integration.displayName,
        siteId: integration.siteId,
        driveId: integration.driveId,
        isActive: integration.isActive,
        webUrl: siteInfo.webUrl,
      },
      message: 'SharePoint connected successfully',
    };
  } catch (error) {
    // console.error('SharePoint connection error:', error);

    if (error instanceof Error && error.message.includes('404')) {
      return {
        error: 'SharePoint site not found. Please check the URL and try again.',
      };
    }

    return {
      error: 'Failed to connect to SharePoint. Please check your permissions and try again.',
    };
  }
});

// GET endpoint to list connections
export const GET = withApiMiddleware({
  requireAuth: true,
  rateLimiters: ['standard'],
})(async (context) => {
  const { organizationId } = context;

  const integrations = await prisma.sharePointIntegration.findMany({
    where: {
      organizationId,
      isActive: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return {
    integrations: integrations.map((integration) => ({
      id: integration.id,
      displayName: integration.displayName,
      siteId: integration.siteId,
      driveId: integration.driveId,
      isActive: integration.isActive,
      lastSyncedAt: integration.lastSyncedAt,
      createdAt: integration.createdAt,
    })),
  };
});

// DELETE endpoint to disconnect
export const DELETE = withApiMiddleware({
  requireAuth: true,
  rateLimiters: ['standard'],
})(async (context) => {
  const { organizationId } = context;
  const { searchParams } = new URL(context.req.url);
  const integrationId = searchParams.get('integrationId');

  if (!integrationId) {
    return {
      error: 'Integration ID is required',
    };
  }

  // Verify ownership
  const integration = await prisma.sharePointIntegration.findFirst({
    where: {
      id: integrationId,
      organizationId,
    },
  });

  if (!integration) {
    return {
      error: 'Integration not found',
    };
  }

  // Soft delete by marking as inactive
  await prisma.sharePointIntegration.update({
    where: { id: integrationId },
    data: { isActive: false },
  });

  return {
    message: 'SharePoint disconnected successfully',
  };
});
