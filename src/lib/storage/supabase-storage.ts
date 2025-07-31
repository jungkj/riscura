import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Lazy initialization variables
let supabaseStorageInstance: SupabaseClient | null = null;

// Check if we're in a build environment
const isBuildTime =
  process.env.BUILDING === 'true' || process.env.NEXT_PHASE === 'phase-production-build';

// Lazy initialization for Supabase storage client
export const supabaseStorage: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    if (!supabaseStorageInstance && !isBuildTime) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing Supabase environment variables for storage');
      }

      supabaseStorageInstance = createClient(supabaseUrl, supabaseServiceKey);
    }

    if (isBuildTime) {
      // Return dummy implementations for build time
      if (prop === 'storage') {
        return {
          from: () => ({
            upload: () => Promise.resolve({ data: { id: 'dummy', path: 'dummy' }, error: null }),
            download: () => Promise.resolve({ data: new Blob(), error: null }),
            remove: () => Promise.resolve({ error: null }),
            list: () => Promise.resolve({ data: [], error: null }),
            getPublicUrl: () => ({ data: { publicUrl: 'https://dummy.url' } }),
            createSignedUrl: () =>
              Promise.resolve({ data: { signedUrl: 'https://dummy.url' }, error: null }),
          }),
          getBucket: () => Promise.resolve({ data: null, error: null }),
          createBucket: () => Promise.resolve({ error: null }),
        };
      }
      return () => {};
    }

    return supabaseStorageInstance ? (supabaseStorageInstance as any)[prop] : undefined;
  },
});

export interface UploadFileOptions {
  bucket: 'documents' | 'attachments' | 'reports' | 'avatars';
  file: File | Blob;
  fileName?: string;
  organizationId: string;
  userId: string;
  metadata?: Record<string, any>;
}

export interface StorageFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  publicUrl: string;
  bucket: string;
  path: string;
  metadata?: Record<string, any>;
}

export class SupabaseStorageService {
  private static instance: SupabaseStorageService;

  private constructor() {}

  static getInstance(): SupabaseStorageService {
    if (!this.instance) {
      this.instance = new SupabaseStorageService();
    }
    return this.instance;
  }

  /**
   * Initialize storage buckets (run once during setup)
   */
  async initializeBuckets() {
    const buckets = ['documents', 'attachments', 'reports', 'avatars'];

    for (const bucketName of buckets) {
      const { data: existingBucket } = await supabaseStorage.storage.getBucket(bucketName);

      if (!existingBucket) {
        const { error } = await supabaseStorage.storage.createBucket(bucketName, {
          public: false, // Keep files private
          fileSizeLimit: 10485760, // 10MB limit per file
          allowedMimeTypes: this.getAllowedMimeTypes(bucketName),
        });

        if (error) {
          console.error(`Failed to create bucket ${bucketName}:`, error);
        } else {
          console.log(`Created bucket: ${bucketName}`);
        }
      }
    }
  }

  /**
   * Upload a file to Supabase Storage
   */
  async uploadFile(options: UploadFileOptions): Promise<StorageFile> {
    const { bucket, file, fileName, organizationId, userId, metadata } = options;

    // Generate unique file path
    const fileExt = file.name ? file.name.split('.').pop() : 'bin';
    const uniqueFileName = fileName || `${uuidv4()}.${fileExt}`;
    const filePath = `${organizationId}/${userId}/${uniqueFileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabaseStorage.storage.from(bucket).upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      metadata: {
        ...metadata,
        organizationId,
        userId,
        uploadedAt: new Date().toISOString(),
      },
    });

    if (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    // Get public URL (with auth)
    const { data: urlData } = supabaseStorage.storage.from(bucket).getPublicUrl(data.path);

    return {
      id: data.id,
      name: fileName || file.name || uniqueFileName,
      size: file.size,
      type: file.type,
      url: data.path,
      publicUrl: urlData.publicUrl,
      bucket,
      path: filePath,
      metadata,
    };
  }

  /**
   * Get a signed URL for temporary file access
   */
  async getSignedUrl(bucket: string, path: string, expiresIn = 3600): Promise<string> {
    const { data, error } = await supabaseStorage.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw new Error(`Failed to create signed URL: ${error.message}`);
    }

    return data.signedUrl;
  }

  /**
   * Download a file
   */
  async downloadFile(bucket: string, path: string): Promise<Blob> {
    const { data, error } = await supabaseStorage.storage.from(bucket).download(path);

    if (error) {
      throw new Error(`Failed to download file: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete a file
   */
  async deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await supabaseStorage.storage.from(bucket).remove([path]);

    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * List files in a directory
   */
  async listFiles(bucket: string, prefix: string): Promise<StorageFile[]> {
    const { data, error } = await supabaseStorage.storage.from(bucket).list(prefix, {
      limit: 100,
      offset: 0,
    });

    if (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }

    return data.map((file) => ({
      id: file.id,
      name: file.name,
      size: file.metadata?.size || 0,
      type: file.metadata?.mimetype || 'application/octet-stream',
      url: `${prefix}/${file.name}`,
      publicUrl: '',
      bucket,
      path: `${prefix}/${file.name}`,
      metadata: file.metadata,
    }));
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(organizationId: string): Promise<{
    totalSize: number;
    fileCount: number;
    byBucket: Record<string, { size: number; count: number }>;
  }> {
    const buckets = ['documents', 'attachments', 'reports', 'avatars'];
    const stats = {
      totalSize: 0,
      fileCount: 0,
      byBucket: {} as Record<string, { size: number; count: number }>,
    };

    for (const bucket of buckets) {
      const files = await this.listFiles(bucket, organizationId);
      const bucketSize = files.reduce((sum, file) => sum + file.size, 0);

      stats.byBucket[bucket] = {
        size: bucketSize,
        count: files.length,
      };

      stats.totalSize += bucketSize;
      stats.fileCount += files.length;
    }

    return stats;
  }

  /**
   * Get allowed MIME types for each bucket
   */
  private getAllowedMimeTypes(bucket: string): string[] | undefined {
    const mimeTypes: Record<string, string[]> = {
      documents: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv',
      ],
      attachments: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/zip',
        'application/x-zip-compressed',
        'text/plain',
      ],
      reports: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ],
      avatars: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    };

    return mimeTypes[bucket];
  }
}

// Export singleton instance
export const storageService = SupabaseStorageService.getInstance();
