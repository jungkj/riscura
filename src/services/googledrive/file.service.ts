import { drive_v3 } from 'googleapis';
import { getGoogleDriveAuthService } from './auth.service';

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
  iconLink?: string;
  parents?: string[];
}

export class GoogleDriveFileService {
  /**
   * List Excel files from Google Drive
   */
  async listExcelFiles(userId: string, folderId?: string): Promise<GoogleDriveFile[]> {
    try {
      const authService = getGoogleDriveAuthService();
      const drive = await authService.getDriveClient(userId);
      
      // Query for Excel files
      let query = "(mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' or mimeType='application/vnd.ms-excel')";
      
      if (folderId) {
        // Validate folderId to prevent injection attacks
        // Google Drive folder IDs are alphanumeric with hyphens and underscores
        const isValidFolderId = /^[a-zA-Z0-9_-]+$/.test(folderId);
        if (!isValidFolderId) {
          throw new Error('Invalid folder ID format');
        }
        query += ` and '${folderId}' in parents`;
      }
      
      const response = await drive.files.list({
        q: query,
        fields: 'files(id, name, mimeType, size, modifiedTime, webViewLink, iconLink, parents)',
        orderBy: 'modifiedTime desc',
        pageSize: 100
      });
      
      return (response.data.files || []) as GoogleDriveFile[];
    } catch (error) {
      console.error('Error listing Google Drive files:', error);
      throw new Error('Failed to list files from Google Drive');
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(userId: string, fileId: string): Promise<GoogleDriveFile> {
    try {
      const authService = getGoogleDriveAuthService();
      const drive = await authService.getDriveClient(userId);
      
      const response = await drive.files.get({
        fileId,
        fields: 'id, name, mimeType, size, modifiedTime, webViewLink, iconLink, parents'
      });
      
      return response.data as GoogleDriveFile;
    } catch (error) {
      console.error('Error getting file metadata:', error);
      throw new Error('Failed to get file information');
    }
  }

  /**
   * Download file content
   */
  async downloadFile(userId: string, fileId: string): Promise<Buffer> {
    try {
      const authService = getGoogleDriveAuthService();
      const drive = await authService.getDriveClient(userId);
      
      const response = await drive.files.get(
        {
          fileId,
          alt: 'media'
        },
        {
          responseType: 'arraybuffer'
        }
      );
      
      return Buffer.from(response.data as ArrayBuffer);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw new Error('Failed to download file from Google Drive');
    }
  }

  /**
   * List folders
   */
  async listFolders(userId: string, parentId?: string): Promise<GoogleDriveFile[]> {
    try {
      const authService = getGoogleDriveAuthService();
      const drive = await authService.getDriveClient(userId);
      
      let query = "mimeType='application/vnd.google-apps.folder'";
      
      if (parentId) {
        query += ` and '${parentId}' in parents`;
      } else {
        query += " and 'root' in parents";
      }
      
      const response = await drive.files.list({
        q: query,
        fields: 'files(id, name, mimeType, modifiedTime, iconLink)',
        orderBy: 'name'
      });
      
      return (response.data.files || []) as GoogleDriveFile[];
    } catch (error) {
      console.error('Error listing folders:', error);
      throw new Error('Failed to list folders from Google Drive');
    }
  }

  /**
   * Search for files
   */
  async searchFiles(userId: string, query: string): Promise<GoogleDriveFile[]> {
    try {
      const authService = getGoogleDriveAuthService();
      const drive = await authService.getDriveClient(userId);
      
      // Comprehensive sanitization to prevent injection and syntax errors
      // Google Drive query syntax special characters that need escaping
      const sanitizedQuery = query
        .replace(/\\/g, '\\\\')     // Escape backslashes first
        .replace(/'/g, "\\'")       // Escape single quotes
        .replace(/"/g, '\\"')       // Escape double quotes
        .replace(/\(/g, '\\(')      // Escape opening parentheses
        .replace(/\)/g, '\\)')      // Escape closing parentheses
        .replace(/\*/g, '\\*')      // Escape asterisks
        .replace(/\?/g, '\\?')      // Escape question marks
        .replace(/\[/g, '\\[')      // Escape opening brackets
        .replace(/\]/g, '\\]')      // Escape closing brackets
        .replace(/\{/g, '\\{')      // Escape opening braces
        .replace(/\}/g, '\\}');     // Escape closing braces
      
      // Search for Excel files containing the query
      const searchQuery = `(mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' or mimeType='application/vnd.ms-excel') and name contains '${sanitizedQuery}'`;
      
      const response = await drive.files.list({
        q: searchQuery,
        fields: 'files(id, name, mimeType, size, modifiedTime, webViewLink, iconLink)',
        orderBy: 'modifiedTime desc',
        pageSize: 50
      });
      
      return (response.data.files || []) as GoogleDriveFile[];
    } catch (error) {
      console.error('Error searching files:', error);
      throw new Error('Failed to search files in Google Drive');
    }
  }

  /**
   * Check if user has access to Google Drive
   */
  async checkAccess(userId: string): Promise<boolean> {
    try {
      const authService = getGoogleDriveAuthService();
      const drive = await authService.getDriveClient(userId);
      
      // Try to get About information
      await drive.about.get({ fields: 'user' });
      return true;
    } catch (error) {
      console.error('Error checking access:', error);
      return false;
    }
  }
}

// Singleton instance
let fileServiceInstance: GoogleDriveFileService | null = null;

export function getGoogleDriveFileService(): GoogleDriveFileService {
  if (!fileServiceInstance) {
    fileServiceInstance = new GoogleDriveFileService();
  }
  return fileServiceInstance;
}