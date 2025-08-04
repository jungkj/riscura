import { env, storageConfig } from '@/config/env';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export interface StorageFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url?: string;
  checksum: string;
  metadata?: Record<string, any>;
}

export interface UploadOptions {
  filename?: string;
  metadata?: Record<string, any>;
  tags?: Record<string, string>;
  encrypt?: boolean;
  public?: boolean;
}

export interface StorageProvider {
  upload(_file: Buffer | Uint8Array, options: UploadOptions): Promise<StorageFile>;
  download(fileId: string): Promise<Buffer>;
  delete(fileId: string): Promise<void>;
  getUrl(fileId: string, expiresIn?: number): Promise<string>;
  exists(fileId: string): Promise<boolean>;
  getMetadata(fileId: string): Promise<Record<string, any>>;
}

// Local Storage Provider
export class LocalStorageProvider implements StorageProvider {
  private basePath: string;
  private fileRegistry: Map<string, string> = new Map();

  constructor(basePath: string = './uploads') {
    this.basePath = basePath;
  }

  async upload(_file: Buffer | Uint8Array, options: UploadOptions): Promise<StorageFile> {
    const fileId = this.generateFileId();
    const filename = options.filename || fileId;
    const filePath = this.getFilePath(fileId, filename);

    // Ensure directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // Write file
    await fs.writeFile(filePath, file);

    // Calculate checksum
    const checksum = crypto.createHash('sha256').update(file).digest('hex');

    // Save metadata
    const metadata = {
      ...options.metadata,
      originalName: filename,
      uploadedAt: new Date().toISOString(),
      checksum,
    };

    await fs.writeFile(`${filePath}.meta`, JSON.stringify(metadata, null, 2));

    // Register file path for retrieval
    this.fileRegistry.set(fileId, filePath);

    return {
      id: fileId,
      filename,
      originalName: filename,
      mimeType: this.getMimeType(filename),
      size: file.length,
      path: filePath,
      checksum,
      metadata,
    };
  }

  async download(fileId: string): Promise<Buffer> {
    const filePath = this.getFilePathById(fileId);
    return await fs.readFile(filePath);
  }

  async delete(fileId: string): Promise<void> {
    const filePath = this.getFilePathById(fileId);
    const metaPath = `${filePath}.meta`;

    await Promise.all([fs.unlink(filePath).catch(() => {}), fs.unlink(metaPath).catch(() => {})]);

    this.fileRegistry.delete(fileId);
  }

  async getUrl(fileId: string, expiresIn?: number): Promise<string> {
    // For local storage, return a local URL
    // In production, this would be served through your web server
    return `/api/documents/${fileId}/download`;
  }

  async exists(fileId: string): Promise<boolean> {
    try {
      const filePath = this.getFilePathById(fileId);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getMetadata(fileId: string): Promise<Record<string, any>> {
    const filePath = this.getFilePathById(fileId);
    const metaPath = `${filePath}.meta`;

    try {
      const metaData = await fs.readFile(metaPath, 'utf-8');
      return JSON.parse(metaData);
    } catch {
      return {};
    }
  }

  private generateFileId(): string {
    return crypto.randomUUID();
  }

  private getFilePath(fileId: string, filename: string): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return path.join(this.basePath, 'documents', String(year), month, day, fileId, filename);
  }

  private getFilePathById(fileId: string): string {
    const registeredPath = this.fileRegistry.get(fileId);
    if (registeredPath) {
      return registeredPath;
    }
    throw new Error(`File with ID ${fileId} not found in registry`);
  }

  private getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.txt': 'text/plain',
      '.csv': 'text/csv',
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }
}

// Storage Factory
export function createStorageProvider(): StorageProvider {
  switch (storageConfig.type) {
    case 'local':
    default:
      return new LocalStorageProvider();
  }
}

// File validation utilities
export function validateFile(
  _file: File,
  options: {
    maxSize?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
  }
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check file size
  if (options.maxSize && file.size > options.maxSize) {
    errors.push(`File size exceeds maximum allowed size of ${formatFileSize(options.maxSize)}`);
  }

  // Check file type
  if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed`);
  }

  // Check file extension
  if (options.allowedExtensions) {
    const extension = path.extname(file.name).toLowerCase();
    if (!options.allowedExtensions.includes(extension)) {
      errors.push(`File extension ${extension} is not allowed`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

export function getFileIcon(filename: string): string {
  const ext = path.extname(filename).toLowerCase();

  const iconMap: Record<string, string> = {
    '.pdf': '📄',
    '.doc': '📝',
    '.docx': '📝',
    '.xls': '📊',
    '.xlsx': '📊',
    '.png': '🖼️',
    '.jpg': '🖼️',
    '.jpeg': '🖼️',
    '.gif': '🖼️',
    '.txt': '📄',
    '.csv': '📊',
    '.zip': '🗜️',
    '.rar': '🗜️',
  };

  return iconMap[ext] || '📎';
}

// Export singleton instance
export const storage = createStorageProvider();
