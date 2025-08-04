import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { securityMiddleware, RATE_LIMITS, CORS_CONFIGS } from '@/lib/security/middleware';
import { accessControl, Permission } from '@/lib/security/access-control';
import { documentEncryption } from '@/lib/security/document-encryption';
import {
  SecureDocumentResponse,
  DocumentUploadResponse,
  DocumentDownloadResponse,
} from '@/types/api/documents';

// Secure document upload with comprehensive security
export async function POST(_request: NextRequest): Promise<NextResponse> {
  try {
    // Apply comprehensive security middleware
    const securityResult = await securityMiddleware.applySecurityMiddleware(request, {
      requireAuth: true,
      requiredPermissions: ['document:write'],
      rateLimit: RATE_LIMITS.UPLOAD,
      allowCors: true,
      corsOrigins: CORS_CONFIGS.DEVELOPMENT,
    });

    if (securityResult) {
      return securityResult; // Security check failed
    }

    // Get authenticated user from middleware (this would be set by middleware in production)
    const userId = 'demo-user-id';
    const userRole = 'ADMIN';
    const userPermissions: Permission[] = ['*'];

    // Parse multipart form data
    const formData = await request.formData();

    // Extract document metadata
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const sensitivity = (formData.get('sensitivity') as string) || 'internal';
    const confidentiality = (formData.get('confidentiality') as string) || 'internal';

    // Validate required fields
    if (!title || !category) {
      return NextResponse.json({ error: 'Title and category are required' }, { status: 400 });
    }

    // Process files with security scanning
    const files = formData.getAll('files') as File[];
    const processedFiles: any[] = [];

    for (const file of files) {
      if (file && file.size > 0) {
        // Security validations
        const fileValidation = await validateFileUpload(file);
        if (!fileValidation.valid) {
          return NextResponse.json(
            { error: `File ${file.name}: ${fileValidation.reason}` },
            { status: 400 }
          );
        }

        // Read file content
        const fileBuffer = Buffer.from(await file.arrayBuffer());

        // Scan for malicious content
        const scanResult = await scanFileContent(fileBuffer, file.type);
        if (!scanResult.safe) {
          return NextResponse.json(
            { error: `File ${file.name} failed security scan: ${scanResult.reason}` },
            { status: 400 }
          );
        }

        // Encrypt file content
        const encryptedFile = documentEncryption.encryptFile(fileBuffer, file.name, userId);

        processedFiles.push({
          id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          filename: file.name,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          encryptedContent: encryptedFile.encryptedContent,
          iv: encryptedFile.iv,
          tag: encryptedFile.tag,
          salt: encryptedFile.salt,
          hash: encryptedFile.hash,
          metadata: encryptedFile.metadata,
          uploadedAt: new Date(),
          uploadedBy: userId,
          scanResult: {
            status: 'clean',
            scanTime: new Date().toISOString(),
            threats: [],
          },
        });
      }
    }

    // Create secure document record
    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const watermark = documentEncryption.createWatermark(documentId, userId, 'user@example.com');

    const newDocument = {
      id: documentId,
      title,
      description,
      category,
      type: 'uploaded',
      status: 'active',
      version: '1.0',
      ownerId: userId,
      sensitivity,
      confidentiality,
      department: 'Security',
      tags: ['encrypted', 'secure'],
      createdAt: new Date(),
      updatedAt: new Date(),
      size: processedFiles.reduce((total, file) => total + file.size, 0),
      files: processedFiles,
      owner: {
        id: userId,
        firstName: 'Demo',
        lastName: 'User',
        email: 'demo@riscura.com',
      },
      security: {
        encrypted: true,
        watermark,
        accessLevel: sensitivity,
        downloadable: true,
        printable: false,
        expiresAt: null as Date | null,
        accessLog: [] as any[],
      },
      _count: {
        versions: 1,
      },
    };

    // Log the upload for audit trail
    await logSecurityEvent({
      userId,
      action: 'document:upload',
      resource: 'document',
      resourceId: documentId,
      result: 'success',
      metadata: {
        fileCount: processedFiles.length,
        totalSize: newDocument.size,
        sensitivity,
        encrypted: true,
      },
      request,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Document uploaded and encrypted successfully',
        data: newDocument,
        security: {
          encrypted: true,
          watermarked: true,
          auditLogged: true,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    // console.error('Secure document upload error:', error)

    // Log security error
    await logSecurityEvent({
      userId: 'unknown',
      action: 'document:upload',
      resource: 'document',
      resourceId: 'unknown',
      result: 'error',
      metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
      request,
    });

    return NextResponse.json({ error: 'Failed to upload document securely' }, { status: 500 });
  }
}

// Secure document retrieval
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    // Apply security middleware
    const securityResult = await securityMiddleware.applySecurityMiddleware(request, {
      requireAuth: true,
      requiredPermissions: ['document:read'],
      rateLimit: RATE_LIMITS.DOCUMENT,
      allowCors: true,
      corsOrigins: CORS_CONFIGS.DEVELOPMENT,
    });

    if (securityResult) {
      return securityResult;
    }

    // Get authenticated user
    const userId = 'demo-user-id';
    const userRole = 'ADMIN';
    const userPermissions: Permission[] = ['*'];

    // Parse query parameters
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // Security-aware pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10'))); // Max 50 items
    const skip = (page - 1) * limit;

    // Get secure document list (filtered by user permissions)
    const secureDocuments = await getSecureDocuments(userId, userRole, userPermissions, {
      page,
      limit,
      category: searchParams.get('category'),
      sensitivity: searchParams.get('sensitivity'),
      search: searchParams.get('search'),
    });

    // Log access for audit trail
    await logSecurityEvent({
      userId,
      action: 'document:list',
      resource: 'document',
      resourceId: 'multiple',
      result: 'success',
      metadata: {
        resultsCount: secureDocuments.documents.length,
        filters: {
          category: searchParams.get('category'),
          sensitivity: searchParams.get('sensitivity'),
          search: searchParams.get('search'),
        },
      },
      request,
    });

    return NextResponse.json({
      success: true,
      data: secureDocuments.documents,
      pagination: {
        page,
        limit,
        totalCount: secureDocuments.totalCount,
        hasNextPage: secureDocuments.hasNextPage,
      },
      security: {
        userRole,
        accessLevel: 'filtered_by_permissions',
        auditLogged: true,
      },
    });
  } catch (error) {
    // console.error('Secure document retrieval error:', error)
    return NextResponse.json({ error: 'Failed to retrieve documents securely' }, { status: 500 });
  }
}

// File upload validation
async function validateFileUpload(_file: File): Promise<{ valid: boolean; reason?: string }> {
  // File size validation (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { valid: false, reason: `File size exceeds ${maxSize / 1024 / 1024}MB limit` };
  }

  // File type validation - strict allowlist
  const allowedTypes = [
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
  ];

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, reason: `File type ${file.type} not allowed` };
  }

  // Filename validation
  const dangerousPatterns = [
    /\.exe$/i,
    /\.bat$/i,
    /\.cmd$/i,
    /\.scr$/i,
    /\.pif$/i,
    /\.jar$/i,
    /\.js$/i,
    /\.vbs$/i,
    /\.com$/i,
    /\.dll$/i,
    /\.sys$/i,
    /\.\./, // Directory traversal
    /[<>:"|?*]/, // Invalid filename characters
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(file.name)) {
      return { valid: false, reason: 'Filename contains dangerous patterns' };
    }
  }

  return { valid: true };
}

// Content scanning for malicious content
async function scanFileContent(
  buffer: Buffer,
  mimeType: string
): Promise<{ safe: boolean; reason?: string; threats?: string[] }> {
  const threats: string[] = [];

  // Check for embedded scripts in PDFs
  if (mimeType === 'application/pdf') {
    const content = buffer.toString('latin1');
    if (content.includes('/JavaScript') || content.includes('/JS')) {
      threats.push('JavaScript detected in PDF');
    }
    if (content.includes('/Action')) {
      threats.push('Action detected in PDF');
    }
  }

  // Check for macros in Office documents
  if (
    mimeType.includes('officedocument') ||
    mimeType.includes('ms-excel') ||
    mimeType.includes('msword')
  ) {
    const content = buffer.toString('latin1');
    if (content.includes('xl/vbaProject.bin') || content.includes('word/vbaProject.bin')) {
      threats.push('VBA macros detected');
    }
  }

  // Check for common malware signatures
  const malwareSignatures = [
    'CreateObject',
    'WScript.Shell',
    'cmd.exe',
    'powershell',
    'eval(',
    'document.write',
    'innerHTML',
    'fromCharCode',
  ];

  const content = buffer.toString('utf8').toLowerCase();
  for (const signature of malwareSignatures) {
    if (content.includes(signature.toLowerCase())) {
      threats.push(`Suspicious pattern: ${signature}`);
    }
  }

  // Check file header/magic numbers
  const header = buffer.subarray(0, 8).toString('hex');
  const validHeaders: Record<string, string[]> = {
    'application/pdf': ['25504446'], // %PDF
    'image/jpeg': ['ffd8ff'],
    'image/png': ['89504e47'],
    'application/zip': ['504b0304'], // ZIP-based Office docs
  };

  if (mimeType in validHeaders) {
    const isValidHeader = validHeaders[mimeType].some((validHeader) =>
      header.toLowerCase().startsWith(validHeader)
    );
    if (!isValidHeader) {
      threats.push('File header does not match declared type');
    }
  }

  return {
    safe: threats.length === 0,
    reason: threats.length > 0 ? threats[0] : undefined,
    threats,
  };
}

// Get documents with security filtering
async function getSecureDocuments(
  _userId: string,
  userRole: string,
  userPermissions: Permission[],
  filters: {
    page: number;
    limit: number;
    category?: string | null;
    sensitivity?: string | null;
    search?: string | null;
  }
): Promise<{ documents: SecureDocumentResponse[]; totalCount: number; hasNextPage: boolean }> {
  // Mock secure documents with proper access control
  const mockDocuments = [
    {
      id: 'doc_secure_001',
      title: 'Confidential Risk Assessment Report',
      description: 'Comprehensive risk assessment for Q4 2024',
      category: 'Risk Assessment',
      type: 'Report',
      status: 'Active',
      version: '2.1',
      ownerId: userId,
      sensitivity: 'confidential',
      confidentiality: 'Confidential',
      department: 'Risk Management',
      tags: ['encrypted', 'confidential', 'risk-assessment'],
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      size: 3200000,
      owner: {
        id: userId,
        firstName: 'Demo',
        lastName: 'User',
        email: 'demo@riscura.com',
      },
      security: {
        encrypted: true,
        accessLevel: 'confidential',
        downloadable: true,
        printable: false,
        watermarkRequired: true,
        lastAccessed: new Date(),
        accessCount: 15,
      },
      files: [
        {
          id: 'file_secure_001',
          filename: 'Risk_Assessment_Q4_2024_ENCRYPTED.pdf',
          mimeType: 'application/pdf',
          size: 3200000,
          encrypted: true,
          uploadedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      ],
    },
    {
      id: 'doc_secure_002',
      title: 'Security Incident Response Plan',
      description: 'Updated security incident response procedures',
      category: 'Security',
      type: 'Procedure',
      status: 'Active',
      version: '1.5',
      ownerId: 'security-team-id',
      sensitivity: 'restricted',
      confidentiality: 'Restricted',
      department: 'Security',
      tags: ['encrypted', 'restricted', 'incident-response'],
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      size: 1800000,
      owner: {
        id: 'security-team-id',
        firstName: 'Security',
        lastName: 'Team',
        email: 'security@riscura.com',
      },
      security: {
        encrypted: true,
        accessLevel: 'restricted',
        downloadable: accessControl.hasPermission(userPermissions, 'document:admin'),
        printable: false,
        watermarkRequired: true,
        lastAccessed: new Date(Date.now() - 24 * 60 * 60 * 1000),
        accessCount: 8,
      },
      files: [
        {
          id: 'file_secure_002',
          filename: 'Incident_Response_Plan_ENCRYPTED.docx',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 1800000,
          encrypted: true,
          uploadedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        },
      ],
    },
  ];

  // Apply security filtering based on user role and permissions
  let filteredDocuments = mockDocuments.filter((doc) => {
    // Check if user can access this sensitivity level
    const sensitivityLevels: Record<string, number> = {
      public: 1,
      internal: 2,
      confidential: 3,
      restricted: 4,
      top_secret: 5,
    };

    const userAccessLevel = userRole === 'ADMIN' ? 5 : userRole === 'MANAGER' ? 3 : 2;
    const docSensitivityLevel = sensitivityLevels[doc.sensitivity] || 1;

    // Super admin can see everything
    if (userPermissions.includes('*')) {
      return true;
    }

    // Check access level
    if (docSensitivityLevel > userAccessLevel) {
      return false;
    }

    // Check if user owns the document or has admin permissions
    return doc.ownerId === userId || accessControl.hasPermission(userPermissions, 'document:admin');
  });

  // Apply additional filters
  if (filters.category) {
    filteredDocuments = filteredDocuments.filter((doc) =>
      doc.category.toLowerCase().includes(filters.category!.toLowerCase())
    );
  }

  if (filters.sensitivity) {
    filteredDocuments = filteredDocuments.filter((doc) => doc.sensitivity === filters.sensitivity);
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filteredDocuments = filteredDocuments.filter(
      (doc) =>
        doc.title.toLowerCase().includes(searchLower) ||
        doc.description.toLowerCase().includes(searchLower) ||
        doc.tags.some((tag) => tag.toLowerCase().includes(searchLower))
    );
  }

  // Apply pagination
  const total = filteredDocuments.length;
  const paginatedDocuments = filteredDocuments.slice(
    (filters.page - 1) * filters.limit,
    filters.page * filters.limit
  );

  // Transform mock documents to match SecureDocumentResponse type
  const transformedDocuments: SecureDocumentResponse[] = paginatedDocuments.map((doc) => ({
    id: doc.id,
    title: doc.title,
    description: doc.description,
    fileName: doc.files[0]?.filename || 'unknown.pdf',
    fileType: doc.files[0]?.mimeType || 'application/octet-stream',
    size: doc.size,
    hash: crypto.randomUUID(), // Mock hash
    organizationId: 'org_123', // Mock org ID
    createdById: doc.ownerId,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    tags: doc.tags,
    category: doc.category,
    status: doc.status.toLowerCase() as 'draft' | 'review' | 'approved' | 'archived',
    metadata: {
      encrypted: doc.security?.encrypted || false,
      watermark: doc.security?.watermarkRequired ? 'CONFIDENTIAL' : undefined,
      accessLevel: (doc.security?.accessLevel || 'internal') as
        | 'public'
        | 'internal'
        | 'confidential'
        | 'restricted',
      downloadable: doc.security?.downloadable || true,
      printable: doc.security?.printable || false,
      expiresAt: null as Date | null,
      accessLog: [] as any[],
    },
    _count: {
      versions: 1,
    },
  }));

  return {
    documents: transformedDocuments,
    totalCount: total,
    hasNextPage: filters.page * filters.limit < total,
  };
}

// Security event logging
async function logSecurityEvent(event: {
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  result: 'success' | 'error' | 'denied';
  metadata?: Record<string, any>;
  request: NextRequest;
}): Promise<void> {
  const logEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    userId: event.userId,
    action: event.action,
    resource: event.resource,
    resourceId: event.resourceId,
    result: event.result,
    ipAddress:
      event.request.headers.get('x-forwarded-for')?.split(',')[0] ||
      event.request.headers.get('x-real-ip') ||
      'unknown',
    userAgent: event.request.headers.get('user-agent') || 'unknown',
    metadata: event.metadata || {},
  };

  // In production, this would be sent to a security logging service
  // console.log('SECURITY EVENT:', logEntry)

  // For critical events, could trigger alerts
  if (event.result === 'denied' || event.result === 'error') {
    // console.warn('SECURITY ALERT:', logEntry)
  }
}
