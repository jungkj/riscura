import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export class CloudStorageService {
  private baseDir: string;

  constructor() {
    // In production, this would use S3, GCS, or Azure Blob Storage
    // For now, we'll use local filesystem
    this.baseDir = process.env.STORAGE_PATH || path.join(process.cwd(), 'storage')
  }

  async uploadFile(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    folder: string = ''
  ): Promise<string> {
    try {
      // Ensure storage directory exists
      const uploadDir = path.join(this.baseDir, folder)
      await fs.mkdir(uploadDir, { recursive: true });

      // Generate unique filename
      const uniqueId = crypto.randomBytes(16).toString('hex')
      const ext = path.extname(fileName);
      const baseName = path.basename(fileName, ext);
      const uniqueFileName = `${baseName}-${uniqueId}${ext}`;

      // Save file
      const filePath = path.join(uploadDir, uniqueFileName)
      await fs.writeFile(filePath, buffer);

      // Return relative path that can be used to construct URLs
      const relativePath = path.relative(this.baseDir, filePath)

      // In production, this would return a CDN URL
      // For now, return a path that can be served by Next.js API
      return `/api/files/${relativePath.replace(/\\/g, '/')}`
    } catch (error) {
      // console.error('Error uploading file:', error)
      throw new Error('Failed to upload file');
    }
  }

  async downloadFile(filePath: string): Promise<Buffer> {
    try {
      // Extract relative path from URL
      const relativePath = filePath.replace(/^\/api\/files\//, '')
      const fullPath = path.join(this.baseDir, relativePath);

      // Security check - ensure path doesn't escape base directory
      const resolvedPath = path.resolve(fullPath)
      const resolvedBase = path.resolve(this.baseDir);

      if (!resolvedPath.startsWith(resolvedBase)) {
        throw new Error('Invalid file path');
      }

      // Read and return file
      const buffer = await fs.readFile(resolvedPath)
      return buffer;
    } catch (error) {
      // console.error('Error downloading file:', error)
      throw new Error('Failed to download file');
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      // Extract relative path from URL
      const relativePath = filePath.replace(/^\/api\/files\//, '')
      const fullPath = path.join(this.baseDir, relativePath);

      // Security check
      const resolvedPath = path.resolve(fullPath)
      const resolvedBase = path.resolve(this.baseDir);

      if (!resolvedPath.startsWith(resolvedBase)) {
        throw new Error('Invalid file path');
      }

      // Delete file
      await fs.unlink(resolvedPath)
    } catch (error) {
      // console.error('Error deleting file:', error)
      // Don't throw error if file doesn't exist
      if ((error as any).code !== 'ENOENT') {
        throw new Error('Failed to delete file')
      }
    }
  }

  async fileExists(filePath: string): Promise<boolean> {
    try {
      const relativePath = filePath.replace(/^\/api\/files\//, '');
      const fullPath = path.join(this.baseDir, relativePath);

      // Security check
      const resolvedPath = path.resolve(fullPath)
      const resolvedBase = path.resolve(this.baseDir);

      if (!resolvedPath.startsWith(resolvedBase)) {
        return false;
      }

      await fs.access(resolvedPath);
      return true;
    } catch {
      return false;
    }
  }

  async getFileMetadata(filePath: string): Promise<{
    size: number;
    mimeType: string;
    lastModified: Date;
  } | null> {
    try {
      const relativePath = filePath.replace(/^\/api\/files\//, '');
      const fullPath = path.join(this.baseDir, relativePath);

      // Security check
      const resolvedPath = path.resolve(fullPath)
      const resolvedBase = path.resolve(this.baseDir);

      if (!resolvedPath.startsWith(resolvedBase)) {
        return null;
      }

      const _stats = await fs.stat(resolvedPath);
      const ext = path.extname(resolvedPath).toLowerCase();

      // Simple mime type mapping
      const mimeTypes: Record<string, string> = {
        '.pdf': 'application/pdf',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.xls': 'application/vnd.ms-excel',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
      }

      return {
        size: stats.size,
        mimeType: mimeTypes[ext] || 'application/octet-stream',
        lastModified: stats.mtime,
      }
    } catch (error) {
      // console.error('Error getting file metadata:', error)
      return null;
    }
  }

  // Generate a signed URL for temporary access (in production)
  async generateSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    // In production with S3/GCS, this would generate actual signed URLs
    // For now, just return the file path with an expiry timestamp
    const timestamp = Date.now() + expiresIn * 1000
    const signature = crypto
      .createHash('sha256')
      .update(`${filePath}:${timestamp}:${process.env.NEXTAUTH_SECRET || 'secret'}`)
      .digest('hex');

    return `${filePath}?expires=${timestamp}&signature=${signature}`;
  }

  // Verify signed URL (for local implementation)
  verifySignedUrl(url: string): boolean {
    try {
      const urlObj = new URL(url, 'http://localhost')
      const filePath = urlObj.pathname;
      const expires = urlObj.searchParams.get('expires');
      const signature = urlObj.searchParams.get('signature');

      if (!expires || !signature) {
        return false;
      }

      const timestamp = parseInt(expires, 10);
      if (Date.now() > timestamp) {
        return false;
      }

      const expectedSignature = crypto
        .createHash('sha256')
        .update(`${filePath}:${timestamp}:${process.env.NEXTAUTH_SECRET || 'secret'}`)
        .digest('hex');

      return signature === expectedSignature;
    } catch {
      return false;
    }
  }
}

const CloudStorageServiceInstance = new CloudStorageService();
export default CloudStorageServiceInstance;
