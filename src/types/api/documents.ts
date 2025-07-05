/**
 * Type definitions for document API responses and data structures
 */

export interface AccessLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  action: 'view' | 'download' | 'upload' | 'delete' | 'share' | 'encrypt' | 'decrypt';
  ipAddress?: string;
  userAgent?: string;
  result: 'success' | 'failure' | 'denied';
  metadata?: Record<string, any>;
}

export interface DocumentVersion {
  id: string;
  version: number;
  documentId: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  hash: string;
  createdAt: Date;
  createdBy: string;
  changelog?: string;
}

export interface SecureDocumentMetadata {
  encrypted: boolean;
  watermark?: string;
  accessLevel: 'public' | 'internal' | 'confidential' | 'restricted';
  downloadable: boolean;
  printable: boolean;
  expiresAt: Date | null;
  accessLog: AccessLogEntry[];
}

export interface SecureDocumentResponse {
  id: string;
  title: string;
  description?: string;
  fileName: string;
  fileType: string;
  size: number;
  hash: string;
  organizationId: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  category?: string;
  status: 'draft' | 'review' | 'approved' | 'archived';
  metadata: SecureDocumentMetadata;
  _count: {
    versions: number;
  };
}

export interface DocumentUploadResponse {
  success: boolean;
  message: string;
  data: SecureDocumentResponse;
  security: {
    encrypted: boolean;
    watermarked: boolean;
    auditLogged: boolean;
  };
}

export interface DocumentDownloadResponse {
  success: boolean;
  data: {
    document: SecureDocumentResponse;
    downloadUrl: string;
    downloadToken: string;
    expiresAt: Date;
    watermark?: string;
  };
}

export interface SecurityEvent {
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  result: 'success' | 'failure' | 'error';
  metadata?: Record<string, any>;
  request: any; // NextRequest type would be imported from Next.js
}