import crypto from 'crypto';

// Encryption configuration
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const KEY_DERIVATION_ITERATIONS = 100000;
const SALT_LENGTH = 32;
const IV_LENGTH = 16;

/**
 * Secure document encryption service for handling sensitive documents
 */
export class DocumentEncryptionService {
  private static instance: DocumentEncryptionService;
  private masterKey: Buffer;

  private constructor() {
    this.masterKey = this.deriveMasterKey();
  }

  public static getInstance(): DocumentEncryptionService {
    if (!DocumentEncryptionService.instance) {
      DocumentEncryptionService.instance = new DocumentEncryptionService();
    }
    return DocumentEncryptionService.instance;
  }

  /**
   * Derive master key from environment configuration
   */
  private deriveMasterKey(): Buffer {
    const masterSecret =
      process.env.MASTER_ENCRYPTION_KEY || 'riscura-default-master-key-please-change-in-production';
    const salt = process.env.ENCRYPTION_SALT || 'riscura-default-salt-please-change-in-production';

    return crypto.pbkdf2Sync(masterSecret, salt, KEY_DERIVATION_ITERATIONS, 32, 'sha512');
  }

  /**
   * Encrypt sensitive data with authenticated encryption
   */
  public encryptData(
    plaintext: string | Buffer,
    additionalData?: string
  ): {
    encrypted: string;
    iv: string;
    tag: string;
    salt: string;
  } {
    const data = typeof plaintext === 'string' ? Buffer.from(plaintext, 'utf8') : plaintext;
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);

    // Derive encryption key
    const key = crypto.pbkdf2Sync(this.masterKey, salt, KEY_DERIVATION_ITERATIONS, 32, 'sha512');

    try {
      // Try GCM mode first
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

      // Add additional authenticated data if provided
      if (additionalData) {
        cipher.setAAD(Buffer.from(additionalData, 'utf8'));
      }

      // Encrypt data
      let encrypted = cipher.update(data);
      const final = cipher.final();
      encrypted = Buffer.concat([encrypted, final]);

      const tag = cipher.getAuthTag();

      return {
        encrypted: encrypted.toString('base64'),
        iv: iv.toString('base64'),
        tag: tag.toString('base64'),
        salt: salt.toString('base64'),
      };
    } catch (error) {
      // Fallback to CBC mode if GCM not available
      return this.encryptDataBasic(data, iv, salt, key, additionalData);
    }
  }

  /**
   * Fallback encryption using CBC mode
   */
  private encryptDataBasic(_data: Buffer,
    iv: Buffer,
    salt: Buffer,
    key: Buffer,
    additionalData?: string
  ): {
    encrypted: string;
    iv: string;
    tag: string;
    salt: string;
  } {
    // Create cipher with CBC mode
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

    // Encrypt data
    let encrypted = cipher.update(data);
    const final = cipher.final();
    encrypted = Buffer.concat([encrypted, final]);

    // Create HMAC tag for authentication
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(encrypted);
    if (additionalData) {
      hmac.update(Buffer.from(additionalData, 'utf8'));
    }
    const tag = hmac.digest();

    return {
      encrypted: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
      salt: salt.toString('base64'),
    };
  }

  /**
   * Decrypt data with authentication verification
   */
  public decryptData(
    encryptedData: {
      encrypted: string;
      iv: string;
      tag: string;
      salt: string;
    },
    additionalData?: string
  ): Buffer {
    const { encrypted, iv, tag, salt } = encryptedData;

    // Convert from base64
    const encryptedBuffer = Buffer.from(encrypted, 'base64');
    const ivBuffer = Buffer.from(iv, 'base64');
    const tagBuffer = Buffer.from(tag, 'base64');
    const saltBuffer = Buffer.from(salt, 'base64');

    // Derive decryption key
    const key = crypto.pbkdf2Sync(
      this.masterKey,
      saltBuffer,
      KEY_DERIVATION_ITERATIONS,
      32,
      'sha512'
    );

    try {
      // Try GCM mode first
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, ivBuffer);
      decipher.setAuthTag(tagBuffer);

      // Add additional authenticated data if provided
      if (additionalData) {
        decipher.setAAD(Buffer.from(additionalData, 'utf8'));
      }

      // Decrypt data
      let decrypted = decipher.update(encryptedBuffer);
      const final = decipher.final();
      decrypted = Buffer.concat([decrypted, final]);

      return decrypted;
    } catch (error) {
      // Fallback to CBC mode decryption
      return this.decryptDataBasic(encryptedBuffer, ivBuffer, tagBuffer, key, additionalData);
    }
  }

  /**
   * Fallback decryption using CBC mode
   */
  private decryptDataBasic(
    encryptedBuffer: Buffer,
    ivBuffer: Buffer,
    tagBuffer: Buffer,
    key: Buffer,
    additionalData?: string
  ): Buffer {
    // Verify HMAC tag first
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(encryptedBuffer);
    if (additionalData) {
      hmac.update(Buffer.from(additionalData, 'utf8'));
    }
    const expectedTag = hmac.digest();

    if (!crypto.timingSafeEqual(tagBuffer, expectedTag)) {
      throw new Error('Authentication failed - data may have been tampered with');
    }

    // Create decipher with CBC mode
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, ivBuffer);

    // Decrypt data
    let decrypted = decipher.update(encryptedBuffer);
    const final = decipher.final();
    decrypted = Buffer.concat([decrypted, final]);

    return decrypted;
  }

  /**
   * Encrypt file content for secure storage
   */
  public encryptFile(
    fileBuffer: Buffer,
    fileName: string,
    userId: string
  ): {
    encryptedContent: string;
    iv: string;
    tag: string;
    salt: string;
    hash: string;
    metadata: {
      originalSize: number;
      encryptedSize: number;
      fileName: string;
      userId: string;
      timestamp: string;
    };
  } {
    // Calculate original file hash for integrity verification
    const originalHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Create additional authenticated data
    const aad = JSON.stringify({
      fileName,
      userId,
      timestamp: new Date().toISOString(),
      originalHash,
    });

    // Encrypt file content
    const encryptionResult = this.encryptData(fileBuffer, aad);

    return {
      encryptedContent: encryptionResult.encrypted,
      iv: encryptionResult.iv,
      tag: encryptionResult.tag,
      salt: encryptionResult.salt,
      hash: originalHash,
      metadata: {
        originalSize: fileBuffer.length,
        encryptedSize: Buffer.from(encryptionResult.encrypted, 'base64').length,
        fileName,
        userId,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Decrypt file content and verify integrity
   */
  public decryptFile(encryptedFile: {
    encryptedContent: string;
    iv: string;
    tag: string;
    salt: string;
    hash: string;
    metadata: any;
  }): {
    content: Buffer;
    verified: boolean;
    metadata: any;
  } {
    const { encryptedContent, iv, tag, salt, hash, metadata } = encryptedFile;

    // Create AAD for verification
    const aad = JSON.stringify({
      fileName: metadata.fileName,
      userId: metadata.userId,
      timestamp: metadata.timestamp,
      originalHash: hash,
    });

    // Decrypt content
    const decryptedContent = this.decryptData(
      {
        encrypted: encryptedContent,
        iv,
        tag,
        salt,
      },
      aad
    );

    // Verify integrity
    const calculatedHash = crypto.createHash('sha256').update(decryptedContent).digest('hex');
    const verified = calculatedHash === hash;

    return {
      content: decryptedContent,
      verified,
      metadata,
    };
  }

  /**
   * Generate secure token for document access
   */
  public generateSecureToken(
    documentId: string,
    userId: string,
    permissions: string[],
    expiresIn: number = 3600
  ): string {
    const payload = {
      documentId,
      userId,
      permissions,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expiresIn,
    };

    const payloadString = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', this.masterKey)
      .update(payloadString)
      .digest('hex');

    return Buffer.from(JSON.stringify({ payload, signature })).toString('base64');
  }

  /**
   * Verify and decode secure token
   */
  public verifySecureToken(token: string): {
    valid: boolean;
    payload?: any;
    expired?: boolean;
  } {
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
      const { payload, signature } = decoded;

      // Verify signature
      const expectedSignature = crypto
        .createHmac('sha256', this.masterKey)
        .update(JSON.stringify(payload))
        .digest('hex');

      if (
        !crypto.timingSafeEqual(
          Buffer.from(signature, 'hex'),
          Buffer.from(expectedSignature, 'hex')
        )
      ) {
        return { valid: false };
      }

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        return { valid: false, expired: true, payload };
      }

      return { valid: true, payload };
    } catch (error) {
      return { valid: false };
    }
  }

  /**
   * Create digital watermark for document tracking
   */
  public createWatermark(documentId: string, userId: string, userEmail: string): string {
    const watermarkData = {
      documentId,
      userId,
      userEmail,
      timestamp: new Date().toISOString(),
      nonce: crypto.randomBytes(16).toString('hex'),
    };

    const watermarkString = JSON.stringify(watermarkData);
    const signature = crypto
      .createHmac('sha256', this.masterKey)
      .update(watermarkString)
      .digest('hex');

    return Buffer.from(JSON.stringify({ data: watermarkData, signature })).toString('base64');
  }

  /**
   * Verify document watermark
   */
  public verifyWatermark(watermark: string): {
    valid: boolean;
    data?: any;
  } {
    try {
      const decoded = JSON.parse(Buffer.from(watermark, 'base64').toString('utf8'));
      const { data, signature } = decoded;

      const expectedSignature = crypto
        .createHmac('sha256', this.masterKey)
        .update(JSON.stringify(data))
        .digest('hex');

      return {
        valid: crypto.timingSafeEqual(
          Buffer.from(signature, 'hex'),
          Buffer.from(expectedSignature, 'hex')
        ),
        data: crypto.timingSafeEqual(
          Buffer.from(signature, 'hex'),
          Buffer.from(expectedSignature, 'hex')
        )
          ? data
          : undefined,
      };
    } catch (error) {
      return { valid: false };
    }
  }
}

/**
 * Field-level encryption for sensitive database fields
 */
export class FieldEncryption {
  private static instance: FieldEncryption;
  private encryptionService: DocumentEncryptionService;

  private constructor() {
    this.encryptionService = DocumentEncryptionService.getInstance();
  }

  public static getInstance(): FieldEncryption {
    if (!FieldEncryption.instance) {
      FieldEncryption.instance = new FieldEncryption();
    }
    return FieldEncryption.instance;
  }

  /**
   * Encrypt sensitive field for database storage
   */
  public encryptField(value: string, fieldName: string, recordId: string): string {
    const aad = `${fieldName}:${recordId}`;
    const encrypted = this.encryptionService.encryptData(value, aad);
    return JSON.stringify(encrypted);
  }

  /**
   * Decrypt sensitive field from database
   */
  public decryptField(encryptedValue: string, fieldName: string, recordId: string): string {
    try {
      const encryptedData = JSON.parse(encryptedValue);
      const aad = `${fieldName}:${recordId}`;
      const decrypted = this.encryptionService.decryptData(encryptedData, aad);
      return decrypted.toString('utf8');
    } catch (error) {
      throw new Error(
        `Failed to decrypt field ${fieldName}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

// Export singleton instances
export const documentEncryption = DocumentEncryptionService.getInstance();
export const fieldEncryption = FieldEncryption.getInstance();

// Utility functions for security
export function generateSecureId(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function generateSecurePassword(): string {
  // Generate secure password with mixed case, numbers, and symbols
  const length = 16;
  const charset =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let password = '';

  for (let i = 0; i < length; i++) {
    password += charset.charAt(crypto.randomInt(0, charset.length));
  }

  return password;
}

export async function secureHashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(32);
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      else resolve(salt.toString('hex') + ':' + derivedKey.toString('hex'));
    });
  });
}

export async function secureVerifyPassword(password: string, hash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(':');
    if (!salt || !key) {
      resolve(false);
      return;
    }

    crypto.pbkdf2(password, Buffer.from(salt, 'hex'), 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      else resolve(crypto.timingSafeEqual(Buffer.from(key, 'hex'), derivedKey));
    });
  });
}
