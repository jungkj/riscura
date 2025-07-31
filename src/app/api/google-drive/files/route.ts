import { withApiMiddleware } from '@/lib/api/middleware';
import { z } from 'zod';
import { getGoogleDriveFileService } from '@/services/googledrive/file.service';

const listFilesSchema = z.object({
  folderId: z.string().optional(),
});

// POST - List Excel files
export const POST = withApiMiddleware({
  requireAuth: true,
  bodySchema: listFilesSchema,
  rateLimiters: ['standard'],
})(async (context, { folderId }) => {
  const { user } = context;

  try {
    const fileService = getGoogleDriveFileService();
    const files = await fileService.listExcelFiles(user.id, folderId);

    return {
      files: files.map((file) => ({
        id: file.id,
        name: file.name,
        size: file.size ? parseInt(file.size) : 0,
        modifiedDate: file.modifiedTime,
        mimeType: file.mimeType,
        webViewLink: file.webViewLink,
      })),
    };
  } catch (error) {
    console.error('Error listing Google Drive files:', error);

    if (error instanceof Error && error.message.includes('No valid Google Drive authentication')) {
      return {
        error: 'Not authenticated with Google Drive',
        code: 'AUTH_REQUIRED',
      };
    }

    return {
      error: 'Failed to list files from Google Drive',
    };
  }
});

// Search files
const searchFilesSchema = z.object({
  query: z.string().min(1),
});

export const PUT = withApiMiddleware({
  requireAuth: true,
  bodySchema: searchFilesSchema,
  rateLimiters: ['standard'],
})(async (context, { query }) => {
  const { user } = context;

  try {
    const fileService = getGoogleDriveFileService();
    const files = await fileService.searchFiles(user.id, query);

    return {
      files: files.map((file) => ({
        id: file.id,
        name: file.name,
        size: file.size ? parseInt(file.size) : 0,
        modifiedDate: file.modifiedTime,
        mimeType: file.mimeType,
        webViewLink: file.webViewLink,
      })),
      query,
    };
  } catch (error) {
    console.error('Error searching Google Drive files:', error);
    return {
      error: 'Failed to search files in Google Drive',
    };
  }
});
