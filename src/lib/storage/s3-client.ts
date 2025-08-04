import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';

// S3 Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'riscura-documents';
const USE_LOCAL_STORAGE = process.env.NODE_ENV === 'development' && !process.env.AWS_S3_BUCKET;
const LOCAL_STORAGE_PATH = process.env.LOCAL_STORAGE_PATH || './uploads';

// Ensure local storage directory exists
if (USE_LOCAL_STORAGE) {
  fs.mkdir(LOCAL_STORAGE_PATH, { recursive: true }).catch(console.error)
}

export interface UploadResult {
  key: string;
  url: string;
  size: number;
  contentType: string;
  etag?: string;
}

export interface FileMetadata {
  originalName: string;
  size: number;
  contentType: string;
  uploadedAt: Date;
  uploadedBy: string;
  category?: string;
  tags?: string[];
  version?: number;
}

/**
 * Upload file to S3 or local storage
 */
export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  contentType: string,
  metadata: Partial<FileMetadata> = {}
): Promise<UploadResult> {
  const fileExtension = path.extname(originalName);
  const key = `${uuidv4()}${fileExtension}`;

  if (USE_LOCAL_STORAGE) {
    return uploadToLocal(buffer, key, originalName, contentType, metadata);
  } else {
    return uploadToS3(buffer, key, originalName, contentType, metadata);
  }
}

/**
 * Upload to S3
 */
async function uploadToS3(
  buffer: Buffer,
  key: string,
  originalName: string,
  contentType: string,
  metadata: Partial<FileMetadata>
): Promise<UploadResult> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    Metadata: {
      originalName,
      uploadedAt: new Date().toISOString(),
      uploadedBy: metadata.uploadedBy || 'system',
      category: metadata.category || 'general',
      tags: metadata.tags?.join(',') || '',
      version: (metadata.version || 1).toString(),
    },
    ServerSideEncryption: 'AES256',
  });

  try {
    const _result = await s3Client.send(command);
    const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;

    return {
      key,
      url,
      size: buffer.length,
      contentType,
      etag: result.ETag,
    }
  } catch (error) {
    // console.error('S3 upload error:', error)
    throw new Error('Failed to upload file to S3');
  }
}

/**
 * Upload to local storage (development)
 */
async function uploadToLocal(
  buffer: Buffer,
  key: string,
  originalName: string,
  contentType: string,
  metadata: Partial<FileMetadata>
): Promise<UploadResult> {
  try {
    const filePath = path.join(LOCAL_STORAGE_PATH, key);
    await fs.writeFile(filePath, buffer);

    // Store metadata in JSON file
    const metadataPath = path.join(LOCAL_STORAGE_PATH, `${key}.meta.json`)
    const metadataContent = {
      originalName,
      contentType,
      size: buffer.length,
      uploadedAt: new Date().toISOString(),
      uploadedBy: metadata.uploadedBy || 'system',
      category: metadata.category || 'general',
      tags: metadata.tags || [],
      version: metadata.version || 1,
    }
    await fs.writeFile(metadataPath, JSON.stringify(metadataContent, null, 2));

    const url = `/api/documents/download/${key}`;

    return {
      key,
      url,
      size: buffer.length,
      contentType,
    }
  } catch (error) {
    // console.error('Local storage upload error:', error)
    throw new Error('Failed to upload file to local storage');
  }
}

/**
 * Get file from S3 or local storage
 */
export async function getFile(key: string): Promise<{ buffer: Buffer; metadata: FileMetadata }> {
  if (USE_LOCAL_STORAGE) {
    return getFromLocal(key);
  } else {
    return getFromS3(key);
  }
}

/**
 * Get file from S3
 */
async function getFromS3(key: string): Promise<{ buffer: Buffer; metadata: FileMetadata }> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const _result = await s3Client.send(command);
    const buffer = Buffer.from(await result.Body!.transformToByteArray());

    const metadata: FileMetadata = {
      originalName: result.Metadata?.originalName || key,
      size: result.ContentLength || buffer.length,
      contentType: result.ContentType || 'application/octet-stream',
      uploadedAt: new Date(result.Metadata?.uploadedAt || Date.now()),
      uploadedBy: result.Metadata?.uploadedBy || 'system',
      category: result.Metadata?.category,
      tags: result.Metadata?.tags?.split(',').filter(Boolean),
      version: parseInt(result.Metadata?.version || '1'),
    }

    return { buffer, metadata }
  } catch (error) {
    // console.error('S3 get error:', error)
    throw new Error('Failed to retrieve file from S3');
  }
}

/**
 * Get file from local storage
 */
async function getFromLocal(key: string): Promise<{ buffer: Buffer; metadata: FileMetadata }> {
  try {
    const filePath = path.join(LOCAL_STORAGE_PATH, key);
    const metadataPath = path.join(LOCAL_STORAGE_PATH, `${key}.meta.json`);

    const buffer = await fs.readFile(filePath);
    const metadataContent = await fs.readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(metadataContent);

    return {
      buffer,
      metadata: {
        ...metadata,
        uploadedAt: new Date(metadata.uploadedAt),
      },
    }
  } catch (error) {
    // console.error('Local storage get error:', error)
    throw new Error('Failed to retrieve file from local storage');
  }
}

/**
 * Delete file from S3 or local storage
 */
export async function deleteFile(key: string): Promise<void> {
  if (USE_LOCAL_STORAGE) {
    return deleteFromLocal(key);
  } else {
    return deleteFromS3(key);
  }
}

/**
 * Delete file from S3
 */
async function deleteFromS3(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    // console.error('S3 delete error:', error)
    throw new Error('Failed to delete file from S3');
  }
}

/**
 * Delete file from local storage
 */
async function deleteFromLocal(key: string): Promise<void> {
  try {
    const filePath = path.join(LOCAL_STORAGE_PATH, key);
    const metadataPath = path.join(LOCAL_STORAGE_PATH, `${key}.meta.json`);

    await Promise.all([
      fs.unlink(filePath).catch(() => {}), // Ignore if file doesn't exist
      fs.unlink(metadataPath).catch(() => {}),
    ]);
  } catch (error) {
    // console.error('Local storage delete error:', error)
    throw new Error('Failed to delete file from local storage');
  }
}

/**
 * Generate signed URL for secure access (S3 only)
 */
export async function generateSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  if (USE_LOCAL_STORAGE) {
    return `/api/documents/download/${key}`;
  }

  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    // console.error('Signed URL generation error:', error)
    throw new Error('Failed to generate signed URL');
  }
}

/**
 * Check if file exists
 */
export async function fileExists(key: string): Promise<boolean> {
  if (USE_LOCAL_STORAGE) {
    try {
      const filePath = path.join(LOCAL_STORAGE_PATH, key);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  } else {
    try {
      const command = new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });
      await s3Client.send(command);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Get file metadata without downloading the file
 */
export async function getFileMetadata(key: string): Promise<FileMetadata> {
  if (USE_LOCAL_STORAGE) {
    try {
      const metadataPath = path.join(LOCAL_STORAGE_PATH, `${key}.meta.json`);
      const metadataContent = await fs.readFile(metadataPath, 'utf-8');
      const metadata = JSON.parse(metadataContent);
      return {
        ...metadata,
        uploadedAt: new Date(metadata.uploadedAt),
      }
    } catch (error) {
      // console.error('Local metadata get error:', error)
      throw new Error('Failed to retrieve file metadata');
    }
  } else {
    try {
      const command = new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      const _result = await s3Client.send(command);

      return {
        originalName: result.Metadata?.originalName || key,
        size: result.ContentLength || 0,
        contentType: result.ContentType || 'application/octet-stream',
        uploadedAt: new Date(result.Metadata?.uploadedAt || Date.now()),
        uploadedBy: result.Metadata?.uploadedBy || 'system',
        category: result.Metadata?.category,
        tags: result.Metadata?.tags?.split(',').filter(Boolean),
        version: parseInt(result.Metadata?.version || '1'),
      }
    } catch (error) {
      // console.error('S3 metadata get error:', error)
      throw new Error('Failed to retrieve file metadata from S3');
    }
  }
}
