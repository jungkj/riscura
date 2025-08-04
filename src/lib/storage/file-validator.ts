import { createHash } from 'crypto';
;
// File type configurations
export const ALLOWED_FILE_TYPES = {
  // Documents
  pdf: { extensions: ['.pdf'], mimeTypes: ['application/pdf'], maxSize: 50 * 1024 * 1024 }, // 50MB;
  word: {
    extensions: ['.doc', '.docx'],;
    mimeTypes: [;
      'application/msword',;
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',;
    ],;
    maxSize: 25 * 1024 * 1024, // 25MB;
  },;
  excel: {
    extensions: ['.xls', '.xlsx'],;
    mimeTypes: [;
      'application/vnd.ms-excel',;
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',;
    ],;
    maxSize: 25 * 1024 * 1024, // 25MB;
  },;
  powerpoint: {
    extensions: ['.ppt', '.pptx'],;
    mimeTypes: [;
      'application/vnd.ms-powerpoint',;
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',;
    ],;
    maxSize: 50 * 1024 * 1024, // 50MB;
  },;
  text: {
    extensions: ['.txt', '.md', '.csv'],;
    mimeTypes: ['text/plain', 'text/markdown', 'text/csv'],;
    maxSize: 5 * 1024 * 1024, // 5MB;
  },;
  // Images
  image: {
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],;
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'],;
    maxSize: 10 * 1024 * 1024, // 10MB;
  },;
  // Archives
  archive: {
    extensions: ['.zip', '.tar', '.gz', '.7z'],;
    mimeTypes: [;
      'application/zip',;
      'application/x-tar',;
      'application/gzip',;
      'application/x-7z-compressed',;
    ],;
    maxSize: 100 * 1024 * 1024, // 100MB;
  },;
}
;
// Security configurations
export const SECURITY_CONFIG = {
  maxFileSize: 100 * 1024 * 1024, // 100MB global max;
  maxFilesPerUpload: 10,;
  allowedCategories: ['evidence', 'policy', 'control', 'risk', 'audit', 'general', 'template'],;
  virusScanEnabled: process.env.VIRUS_SCAN_ENABLED === 'true',;
  quarantineDirectory: './quarantine',;
}
;
// Dangerous file signatures to block
const MALICIOUS_SIGNATURES = [;
  { signature: [0x4d, 0x5a], description: 'Executable file (PE format)' },;
  { signature: [0x7f, 0x45, 0x4c, 0x46], description: 'ELF executable' },;
  { signature: [0xca, 0xfe, 0xba, 0xbe], description: 'Java class file' },;
  { signature: [0x3c, 0x73, 0x63, 0x72, 0x69, 0x70, 0x74], description: 'Script tag in file' },;
];
;
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fileInfo: {
    detectedType: string;
    category: string;
    hash: string;
    isImage: boolean;
    isDocument: boolean;
    needsVirusScan: boolean;
  }
}

export interface FileValidationOptions {
  allowedTypes?: string[];
  maxSize?: number;
  category?: string;
  enforceSecurityChecks?: boolean;
  allowExecutables?: boolean;
}

/**;
 * Comprehensive file validation;
 */
export async function validateFile(;
  buffer: Buffer,;
  originalName: string,;
  mimeType: string,;
  options: FileValidationOptions = {}
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
;
  // Get file extension
  const extension = originalName.toLowerCase().substring(originalName.lastIndexOf('.'));
  const fileHash = createHash('sha256').update(buffer).digest('hex');
;
  // Detect file type
  const detectedType = detectFileType(buffer, extension, mimeType);
  const category = options.category || 'general';
;
  // Basic validations
  await performBasicValidations(buffer, originalName, mimeType, options, errors);
;
  // Security validations
  if (options.enforceSecurityChecks !== false) {
    await performSecurityValidations(buffer, originalName, errors, warnings);
  }

  // Type-specific validations
  await performTypeSpecificValidations(buffer, detectedType, errors, warnings);
;
  const fileInfo = {
    detectedType,;
    category,;
    hash: fileHash,;
    isImage: detectedType === 'image',;
    isDocument: ['pdf', 'word', 'excel', 'powerpoint', 'text'].includes(detectedType),;
    needsVirusScan: SECURITY_CONFIG.virusScanEnabled && buffer.length > 1024, // Scan files larger than 1KB;
  }
;
  return {
    isValid: errors.length === 0,;
    errors,;
    warnings,;
    fileInfo,;
  }
}

/**;
 * Detect file type based on magic numbers, extension, and MIME type;
 */
const detectFileType = (buffer: Buffer, extension: string, mimeType: string): string {
  // Check magic numbers first (most reliable)
  const magicType = detectByMagicNumbers(buffer);
  if (magicType) return magicType;
;
  // Check by MIME type
  for (const [type, config] of Object.entries(ALLOWED_FILE_TYPES)) {
    if (config.mimeTypes.includes(mimeType)) {
      return type;
    }
  }

  // Check by extension as fallback
  for (const [type, config] of Object.entries(ALLOWED_FILE_TYPES)) {
    if (config.extensions.includes(extension)) {
      return type;
    }
  }

  return 'unknown';
}

/**;
 * Detect file type by magic numbers;
 */
const detectByMagicNumbers = (buffer: Buffer): string | null {
  if (buffer.length < 4) return null;
;
  // PDF
  if (buffer.slice(0, 4).toString() === '%PDF') return 'pdf';
;
  // PNG
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47);
    return 'image';
;
  // JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image';
;
  // GIF
  if (buffer.slice(0, 3).toString() === 'GIF') return 'image';
;
  // ZIP (also covers DOCX, XLSX, PPTX)
  if (buffer[0] === 0x50 && buffer[1] === 0x4b) {
    // Check if it's an Office document
    const content = buffer.toString('utf8');
    if (content.includes('word/')) return 'word';
    if (content.includes('xl/')) return 'excel';
    if (content.includes('ppt/')) return 'powerpoint';
    return 'archive';
  }

  // DOC (older format)
  if (buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0) {
    return 'word';
  }

  return null;
}

/**;
 * Perform basic file validations;
 */
async function performBasicValidations(;
  buffer: Buffer,;
  originalName: string,;
  mimeType: string,;
  options: FileValidationOptions,;
  errors: string[];
): Promise<void> {
  // File size validation
  const maxSize = options.maxSize || SECURITY_CONFIG.maxFileSize;
  if (buffer.length > maxSize) {
    errors.push(;
      `File size ${formatFileSize(buffer.length)} exceeds maximum allowed size ${formatFileSize(maxSize)}`;
    );
  }

  // Empty file check
  if (buffer.length === 0) {
    errors.push('File is empty');
  }

  // Filename validation
  if (!originalName || originalName.trim().length === 0) {
    errors.push('Filename is required');
  }

  // Check for dangerous filename patterns
  const dangerousPatterns = [;
    /\.\./, // Directory traversal;
    /[<>:"|?*]/, // Invalid filename characters;
    /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, // Reserved Windows names;
  ];
;
  for (const pattern of dangerousPatterns) {
    if (pattern.test(originalName)) {
      errors.push('Filename contains invalid characters or patterns');
      break;
    }
  }

  // Category validation
  if (options.category && !SECURITY_CONFIG.allowedCategories.includes(options.category)) {
    errors.push(`Invalid category: ${options.category}`);
  }
}

/**;
 * Perform security validations;
 */
async function performSecurityValidations(;
  buffer: Buffer,;
  originalName: string,;
  errors: string[],;
  warnings: string[];
): Promise<void> {
  // Check for malicious file signatures
  for (const malicious of MALICIOUS_SIGNATURES) {
    if (hasSignature(buffer, malicious.signature)) {
      errors.push(`Potentially malicious file detected: ${malicious.description}`);
    }
  }

  // Check for embedded scripts or macros
  const content = buffer.toString('utf8', 0, Math.min(buffer.length, 10000)); // Check first 10KB;
  const scriptPatterns = [;
    /<script[\s\S]*?<\/script>/gi,;
    /javascript:/gi,;
    /vbscript:/gi,;
    /on\w+\s*=/gi,;
    /eval\s*\(/gi,;
    /ActiveXObject/gi,;
  ];
;
  for (const pattern of scriptPatterns) {
    if (pattern.test(content)) {
      warnings.push('File may contain embedded scripts or active content');
      break;
    }
  }

  // Check for macro indicators in Office documents
  if (;
    originalName.toLowerCase().endsWith('.docm') ||;
    originalName.toLowerCase().endsWith('.xlsm') ||;
    originalName.toLowerCase().endsWith('.pptm');
  ) {
    warnings.push('File contains macros - verify source before opening');
  }

  // Check for suspicious file extensions
  const doubleExtensions = originalName.match(/\.[^.]+\.[^.]+$/);
  if (doubleExtensions) {
    warnings.push('File has multiple extensions - verify file type');
  }
}

/**;
 * Perform type-specific validations;
 */
async function performTypeSpecificValidations(;
  buffer: Buffer,;
  fileType: string,;
  errors: string[],;
  warnings: string[];
): Promise<void> {
  if (fileType === 'unknown') {
    errors.push('File type not supported or could not be determined');
    return;
  }

  const typeConfig = ALLOWED_FILE_TYPES[fileType as keyof typeof ALLOWED_FILE_TYPES];
  if (!typeConfig) {
    errors.push(`File type ${fileType} is not allowed`);
    return;
  }

  // Check file size against type-specific limits
  if (buffer.length > typeConfig.maxSize) {
    errors.push(;
      `File size exceeds limit for ${fileType} files (${formatFileSize(typeConfig.maxSize)})`;
    );
  }

  // Type-specific validations
  switch (fileType) {
    case 'pdf':;
      await validatePDF(buffer, errors, warnings);
      break;
    case 'image':;
      await validateImage(buffer, errors, warnings);
      break;
    case 'word':;
    case 'excel':;
    case 'powerpoint':;
      await validateOfficeDocument(buffer, errors, warnings);
      break;
  }
}

/**;
 * Validate PDF files;
 */
async function validatePDF(buffer: Buffer, errors: string[], warnings: string[]): Promise<void> {
  const content = buffer.toString('utf8', 0, Math.min(buffer.length, 1000));
;
  // Check PDF version
  const versionMatch = content.match(/%PDF-(\d\.\d)/);
  if (versionMatch) {
    const version = parseFloat(versionMatch[1]);
    if (version < 1.4) {
      warnings.push('PDF version is very old - consider updating');
    }
  }

  // Check for JavaScript in PDF
  if (content.includes('/JavaScript') || content.includes('/JS')) {
    warnings.push('PDF contains JavaScript - verify source before opening');
  }

  // Check for forms
  if (content.includes('/AcroForm') || content.includes('/XFA')) {
    warnings.push('PDF contains interactive forms');
  }
}

/**;
 * Validate image files;
 */
async function validateImage(buffer: Buffer, errors: string[], warnings: string[]): Promise<void> {
  // Check for EXIF data that might contain sensitive information
  if (buffer.includes(Buffer.from('Exif'))) {
    warnings.push('Image contains EXIF metadata - consider stripping before upload');
  }

  // Basic image structure validation
  const magicNumbers = buffer.slice(0, 4);
;
  // JPEG validation
  if (magicNumbers[0] === 0xff && magicNumbers[1] === 0xd8) {
    if (!buffer.slice(-2).equals(Buffer.from([0xff, 0xd9]))) {
      errors.push('JPEG file appears to be corrupted or truncated');
    }
  }

  // PNG validation
  if (magicNumbers.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))) {
    if (!buffer.slice(4, 8).equals(Buffer.from([0x0d, 0x0a, 0x1a, 0x0a]))) {
      errors.push('PNG file has invalid header');
    }
  }
}

/**;
 * Validate Office documents;
 */
async function validateOfficeDocument(;
  buffer: Buffer,;
  errors: string[],;
  warnings: string[];
): Promise<void> {
  const content = buffer.toString('utf8');
;
  // Check for external references
  if (content.includes('http://') || content.includes('https://')) {
    warnings.push('Document contains external links');
  }

  // Check for embedded objects
  if (content.includes('OLE') || content.includes('oleObject')) {
    warnings.push('Document contains embedded objects');
  }

  // Check for macro indicators
  if (content.includes('vbaProject') || content.includes('macro')) {
    warnings.push('Document may contain macros');
  }
}

/**;
 * Check if buffer starts with specific signature;
 */
const hasSignature = (buffer: Buffer, signature: number[]): boolean {
  if (buffer.length < signature.length) return false;
;
  for (let i = 0; i < signature.length; i++) {
    if (buffer[i] !== signature[i]) return false;
  }

  return true;
}

/**;
 * Format file size for human reading;
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
;
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
;
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**;
 * Generate file thumbnail (placeholder for future image processing);
 */
export async function generateThumbnail(buffer: Buffer, fileType: string): Promise<Buffer | null> {
  // TODO: Implement thumbnail generation using sharp or similar library
  // For now, return null - thumbnails will be generated on the frontend
  return null;
}

/**;
 * Extract text content for search indexing;
 */
export async function extractTextContent(buffer: Buffer, fileType: string): Promise<string> {
  // TODO: Implement text extraction using appropriate libraries
  // For now, return empty string - will be implemented in future versions
  return '';
}

/**;
 * Virus scan using ClamAV or similar (placeholder);
 */
export async function performVirusScan(;
  buffer: Buffer;
): Promise<{ isClean: boolean; threat?: string }> {
  if (!SECURITY_CONFIG.virusScanEnabled) {
    return { isClean: true }
  }

  // TODO: Implement actual virus scanning
  // For now, perform basic signature checks
  const content = buffer.toString('hex').toLowerCase();
;
  // Check for known malware signatures (simplified)
  const knownThreats = [;
    'eicar', // EICAR test file;
    '5a4d', // MZ header (executables) - basic check;
  ];
;
  for (const threat of knownThreats) {
    if (content.includes(threat)) {
      return { isClean: false, threat: 'Potential threat detected' }
    }
  }

  return { isClean: true }
}
