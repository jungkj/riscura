import { createHash } from 'crypto';
import { mkdir, writeFile, unlink, stat } from 'fs/promises';
import { join } from 'path';
import { env } from '@/config/env';

export interface UploadOptions {
  organizationId: string;
  documentId?: string;
  userId: string;
  maxSize?: number;
  allowedTypes?: string[];
}

export interface UploadResult {
  url: string;
  path: string;
  size: number;
  hash: string;
}

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
}

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
];

/**
 * Upload a file to storage
 */
export async function uploadFile(
  file: File,
  path: string,
  metadata?: any
): Promise<UploadResult & { success: boolean; error?: string; checksum: string }> {
  try {
    // Validate file with basic validation
    const validation = await validateFile(file);
    if (!validation.isValid) {
      return {
        url: '',
        path: '',
        size: 0,
        hash: '',
        success: false,
        error: `File validation failed: ${validation.errors.join(', ')}`,
        checksum: '',
      };
    }

    // Generate file hash for deduplication
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    const hash = createHash('sha256').update(uint8Array).digest('hex');

    // Use provided path or generate one
    const fullPath = join(getStorageRoot(), path);

    // Ensure directory exists
    const dirPath = join(getStorageRoot(), path.split('/').slice(0, -1).join('/'));
    await mkdir(dirPath, { recursive: true });

    // Write file
    await writeFile(fullPath, uint8Array);

    // Generate URL
    const url = generateFileUrl(path);

    return {
      url,
      path,
      size: file.size,
      hash,
      success: true,
      checksum: hash,
    };
  } catch (error) {
    console.error('File upload error:', error);
    throw new Error('Failed to upload file');
  }
}

/**
 * Delete a file from storage
 */
export async function deleteFile(path: string): Promise<void> {
  try {
    const fullPath = join(getStorageRoot(), path);
    await unlink(fullPath);
  } catch (error) {
    console.error('File deletion error:', error);
    // Don't throw error if file doesn't exist
    if ((error as any).code !== 'ENOENT') {
      throw new Error('Failed to delete file');
    }
  }
}

/**
 * Check if file exists
 */
export async function fileExists(path: string): Promise<boolean> {
  try {
    const fullPath = join(getStorageRoot(), path);
    await stat(fullPath);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get file stats
 */
export async function getFileStats(path: string) {
  try {
    const fullPath = join(getStorageRoot(), path);
    return await stat(fullPath);
  } catch (error) {
    throw new Error('File not found');
  }
}

/**
 * Validate file before upload
 */
export async function validateFile(file: File): Promise<FileValidationResult> {
  const errors: string[] = [];
  const maxSize = DEFAULT_MAX_SIZE;
  const allowedTypes = DEFAULT_ALLOWED_TYPES;

  // Check file size
  if (file.size > maxSize) {
    errors.push(
      `File size ${formatFileSize(file.size)} exceeds maximum allowed size ${formatFileSize(maxSize)}`
    );
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed`);
  }

  // Check filename
  if (!file.name || file.name.length > 255) {
    errors.push('Invalid filename');
  }

  // Check for potentially dangerous extensions
  const extension = getFileExtension(file.name);
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.vbs', '.js'];
  if (dangerousExtensions.includes(extension.toLowerCase())) {
    errors.push('File type not allowed for security reasons');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate file before upload (legacy with options)
 */
export function validateFileWithOptions(file: File, options: UploadOptions): FileValidationResult {
  const errors: string[] = [];
  const maxSize = options.maxSize || DEFAULT_MAX_SIZE;
  const allowedTypes = options.allowedTypes || DEFAULT_ALLOWED_TYPES;

  // Check file size
  if (file.size > maxSize) {
    errors.push(
      `File size ${formatFileSize(file.size)} exceeds maximum allowed size ${formatFileSize(maxSize)}`
    );
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed`);
  }

  // Check filename
  if (!file.name || file.name.length > 255) {
    errors.push('Invalid filename');
  }

  // Check for potentially dangerous extensions
  const extension = getFileExtension(file.name);
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.vbs', '.js'];
  if (dangerousExtensions.includes(extension.toLowerCase())) {
    errors.push('File type not allowed for security reasons');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generate secure file path
 */
function generateFilePath(organizationId: string, filename: string): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');

  return join(organizationId, year.toString(), month, filename);
}

/**
 * Generate directory path for organization
 */
function getDirectoryPath(organizationId: string): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');

  return join(organizationId, year.toString(), month);
}

/**
 * Get storage root directory
 */
function getStorageRoot(): string {
  return env.STORAGE_PATH || join(process.cwd(), 'storage', 'uploads');
}

/**
 * Generate public URL for file
 */
function generateFileUrl(path: string): string {
  if (env.CDN_URL) {
    return `${env.CDN_URL}/${path}`;
  }
  return `${env.APP_URL}/api/files/${path}`;
}

/**
 * Get file extension from filename
 */
function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot === -1 ? '' : filename.substring(lastDot);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get MIME type from file extension
 */
export function getMimeType(filename: string): string {
  const extension = getFileExtension(filename).toLowerCase();

  const mimeTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  };

  return mimeTypes[extension] || 'application/octet-stream';
}

/**
 * Generate secure filename
 */
export function generateSecureFilename(originalName: string, hash?: string): string {
  const extension = getFileExtension(originalName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);

  if (hash) {
    return `${hash.substring(0, 16)}_${timestamp}${extension}`;
  }

  return `${timestamp}_${random}${extension}`;
}

/**
 * Clean filename for storage
 */
export function cleanFilename(filename: string): string {
  // Remove or replace dangerous characters
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 255);
}

/**
 * Generate secure path for file upload
 */
export function generateSecurePath(
  organizationId: string,
  category: string,
  filename: string
): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  const cleanName = cleanFilename(filename);
  const timestamp = Date.now();
  const secureFilename = `${timestamp}_${cleanName}`;

  return join(organizationId, category, year.toString(), month, day, secureFilename);
}
