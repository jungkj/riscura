import crypto from 'crypto';
import { db } from '@/lib/db';
import type { EncryptionConfiguration } from './types';
import { appConfig } from '@/config/env';
;
// Encryption configuration
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const KEY_DERIVATION_ITERATIONS = 100000;
const SALT_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32; // 256 bits / 8 = 32 bytes;
// Get encryption key from environment or generate one
const getEncryptionKey = (): Buffer => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }

  // If key is shorter than required, pad it
  if (key.length < KEY_LENGTH * 2) {
    // *2 because it's hex
    const hash = crypto.createHash('sha256');
    hash.update(key);
    return hash.digest();
  }

  return Buffer.from(key.slice(0, KEY_LENGTH * 2), 'hex');
}

/**;
 * Advanced encryption service for securing sensitive documents and data;
 */
export class EncryptionService {
  private static instance: EncryptionService;
  private config: EncryptionConfiguration;
  private masterKey!: Buffer;
  private algorithm = 'aes-256-gcm';
  private keyDerivationSalt: Buffer;
;
  private constructor(_config: EncryptionConfiguration) {
    this.config = config;
    this.keyDerivationSalt = Buffer.from(;
      process.env.ENCRYPTION_SALT || 'riscura-default-salt',;
      'utf8';
    );
    this.initializeMasterKey();
  }

  public static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      const defaultConfig = createDefaultEncryptionConfig();
      EncryptionService.instance = new EncryptionService(defaultConfig);
    }
    return EncryptionService.instance;
  }

  private initializeMasterKey(): void {
    const keyMaterial = process.env.MASTER_ENCRYPTION_KEY || 'riscura-default-master-key';
    this.masterKey = crypto.pbkdf2Sync(;
      keyMaterial,;
      this.keyDerivationSalt,;
      KEY_DERIVATION_ITERATIONS,;
      32,;
      'sha512';
    );
  }

  /**;
   * Encrypt sensitive data with authenticated encryption;
   */
  public async encryptData(;
    plaintext: string | Buffer,;
    additionalData?: string;
  ): Promise<{
    encrypted: string;
    iv: string;
    tag: string;
    salt: string;
  }> {
    try {
      const data = typeof plaintext === 'string' ? Buffer.from(plaintext, 'utf8') : plaintext;
      const salt = crypto.randomBytes(SALT_LENGTH);
      const iv = crypto.randomBytes(IV_LENGTH);
;
      // Derive encryption key
      const key = crypto.pbkdf2Sync(this.masterKey, salt, KEY_DERIVATION_ITERATIONS, 32, 'sha512');
;
      // Create cipher
      const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
;
      // Add additional authenticated data if provided
      if (additionalData) {
        cipher.setAAD(Buffer.from(additionalData, 'utf8'));
      }

      // Encrypt data
      const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
;
      const tag = cipher.getAuthTag();
;
      return {
        encrypted: encrypted.toString('base64'),;
        iv: iv.toString('base64'),;
        tag: tag.toString('base64'),;
        salt: salt.toString('base64'),;
      }
    } catch (error) {
      throw new Error(;
        `Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      );
    }
  }

  /**;
   * Decrypt data with authentication verification;
   */
  public async decryptData(;
    encryptedData: {
      encrypted: string;
      iv: string;
      tag: string;
      salt: string;
    },;
    additionalData?: string;
  ): Promise<Buffer> {
    try {
      const { encrypted, iv, tag, salt } = encryptedData;
;
      // Convert from base64
      const encryptedBuffer = Buffer.from(encrypted, 'base64');
      const ivBuffer = Buffer.from(iv, 'base64');
      const tagBuffer = Buffer.from(tag, 'base64');
      const saltBuffer = Buffer.from(salt, 'base64');
;
      // Derive decryption key
      const key = crypto.pbkdf2Sync(;
        this.masterKey,;
        saltBuffer,;
        KEY_DERIVATION_ITERATIONS,;
        32,;
        'sha512';
      );
;
      // Create decipher
      const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, ivBuffer);
      decipher.setAuthTag(tagBuffer);
;
      // Add additional authenticated data if provided
      if (additionalData) {
        decipher.setAAD(Buffer.from(additionalData, 'utf8'));
      }

      // Decrypt data
      const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
;
      return decrypted;
    } catch (error) {
      throw new Error(;
        `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      );
    }
  }

  /**;
   * Encrypt file content for secure storage;
   */
  public async encryptFile(;
    fileBuffer: Buffer,;
    fileName: string,;
    userId: string;
  ): Promise<{
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
    }
  }> {
    // Calculate original file hash for integrity verification
    const originalHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
;
    // Create additional authenticated data
    const aad = JSON.stringify({
      fileName,;
      userId,;
      timestamp: new Date().toISOString(),;
      originalHash,;
    });
;
    // Encrypt file content
    const encryptionResult = await this.encryptData(fileBuffer, aad);
;
    return {
      encryptedContent: encryptionResult.encrypted,;
      iv: encryptionResult.iv,;
      tag: encryptionResult.tag,;
      salt: encryptionResult.salt,;
      hash: originalHash,;
      metadata: {
        originalSize: fileBuffer.length,;
        encryptedSize: Buffer.from(encryptionResult.encrypted, 'base64').length,;
        fileName,;
        userId,;
        timestamp: new Date().toISOString(),;
      },;
    }
  }

  /**;
   * Decrypt file content and verify integrity;
   */
  public async decryptFile(encryptedFile: {
    encryptedContent: string;
    iv: string;
    tag: string;
    salt: string;
    hash: string;
    metadata: any;
  }): Promise<{
    content: Buffer;
    verified: boolean;
    metadata: any;
  }> {
    const { encryptedContent, iv, tag, salt, hash, metadata } = encryptedFile;
;
    // Create AAD for verification
    const aad = JSON.stringify({
      fileName: metadata.fileName,;
      userId: metadata.userId,;
      timestamp: metadata.timestamp,;
      originalHash: hash,;
    });
;
    // Decrypt content
    const decryptedContent = await this.decryptData(;
      {
        encrypted: encryptedContent,;
        iv,;
        tag,;
        salt,;
      },;
      aad;
    );
;
    // Verify integrity
    const calculatedHash = crypto.createHash('sha256').update(decryptedContent).digest('hex');
    const verified = calculatedHash === hash;
;
    return {
      content: decryptedContent,;
      verified,;
      metadata,;
    }
  }

  /**;
   * Generate secure token for document access;
   */
  public generateSecureToken(;
    documentId: string,;
    userId: string,;
    permissions: string[],;
    expiresIn: number = 3600;
  ): string {
    const payload = {
      documentId,;
      userId,;
      permissions,;
      iat: Math.floor(Date.now() / 1000),;
      exp: Math.floor(Date.now() / 1000) + expiresIn,;
    }
;
    const payloadString = JSON.stringify(payload);
    const signature = crypto;
      .createHmac('sha256', this.masterKey);
      .update(payloadString);
      .digest('hex');
;
    return Buffer.from(JSON.stringify({ payload, signature })).toString('base64');
  }

  /**;
   * Verify and decode secure token;
   */
  public verifySecureToken(token: string): {
    valid: boolean;
    payload?: any;
    expired?: boolean;
  } {
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
      const { payload, signature } = decoded;
;
      // Verify signature
      const expectedSignature = crypto;
        .createHmac('sha256', this.masterKey);
        .update(JSON.stringify(payload));
        .digest('hex');
;
      if (signature !== expectedSignature) {
        return { valid: false }
      }

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        return { valid: false, expired: true, payload }
      }

      return { valid: true, payload }
    } catch (error) {
      return { valid: false }
    }
  }

  /**;
   * Create digital watermark for document tracking;
   */
  public createWatermark(documentId: string, userId: string, userEmail: string): string {
    const watermarkData = {
      documentId,;
      userId,;
      userEmail,;
      timestamp: new Date().toISOString(),;
      nonce: crypto.randomBytes(16).toString('hex'),;
    }
;
    const watermarkString = JSON.stringify(watermarkData);
    const signature = crypto;
      .createHmac('sha256', this.masterKey);
      .update(watermarkString);
      .digest('hex');
;
    return Buffer.from(JSON.stringify({ data: watermarkData, signature })).toString('base64');
  }

  /**;
   * Verify document watermark;
   */
  public verifyWatermark(watermark: string): {
    valid: boolean;
    data?: any;
  } {
    try {
      const decoded = JSON.parse(Buffer.from(watermark, 'base64').toString('utf8'));
      const { data, signature } = decoded;
;
      const expectedSignature = crypto;
        .createHmac('sha256', this.masterKey);
        .update(JSON.stringify(data));
        .digest('hex');
;
      return {
        valid: signature === expectedSignature,;
        data: signature === expectedSignature ? data : undefined,;
      }
    } catch (error) {
      return { valid: false }
    }
  }

  // Data at Rest Encryption
  async encryptDataRest(_data: string | Buffer, keyId?: string): Promise<EncryptedData> {
    try {
      const plaintext = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
      const key = keyId ? await this.getDataKey(keyId) : this.masterKey;
      const salt = crypto.randomBytes(32);
;
      // Generate random IV for each encryption
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv(this.algorithm, key, iv) as crypto.CipherGCM;
;
      const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
;
      const authTag = cipher.getAuthTag();
;
      return {
        encrypted: encrypted.toString('base64'),;
        iv: iv.toString('base64'),;
        tag: authTag.toString('base64'),;
        salt: salt.toString('base64'),;
        algorithm: this.algorithm,;
        keyId: keyId || 'master',;
        timestamp: new Date(),;
      }
    } catch (error) {
      throw new Error(;
        `Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      );
    }
  }

  async decryptDataRest(encryptedData: EncryptedData): Promise<Buffer> {
    try {
      // Get the appropriate key
      const keyId = encryptedData.keyId || 'default';
      const keyMaterial = keyId === 'default' ? this.masterKey : await this.getDataKey(keyId);
;
      // Decrypt the data
      const decipher = crypto.createDecipherGCM(;
        encryptedData.algorithm || this.algorithm,;
        keyMaterial,;
        encryptedData.iv;
      );
      decipher.setAuthTag(encryptedData.tag);
;
      let decrypted = decipher.update(encryptedData.data);
      decipher.final();
;
      return decrypted;
    } catch (error) {
      throw new Error(;
        `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      );
    }
  }

  // Field-level Encryption
  async encryptField(_value: any, fieldName: string): Promise<string> {
    if (!this.config.fieldLevelEncryption.enabled) {
      return value;
    }

    if (!this.config.fieldLevelEncryption.encryptedFields.includes(fieldName)) {
      return value;
    }

    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    const encrypted = await this.encryptData(stringValue, `field:${fieldName}`);
;
    return this.serializeEncryptedData(encrypted);
  }

  async decryptField(encryptedValue: string, fieldName: string): Promise<any> {
    if (!this.config.fieldLevelEncryption.enabled) {
      return encryptedValue;
    }

    try {
      const encrypted = this.deserializeEncryptedData(encryptedValue);
      const decrypted = await this.decryptData(encrypted);
;
      // Try to parse as JSON, fallback to string
      try {
        return JSON.parse(decrypted.toString('utf8'));
      } catch {
        return decrypted.toString('utf8');
      }
    } catch (error) {
      // If decryption fails, assume it's unencrypted data
      return encryptedValue;
    }
  }

  // Searchable Encryption (simplified implementation)
  async createSearchableIndex(_value: string, fieldName: string): Promise<string[]> {
    if (!this.config.fieldLevelEncryption.searchableEncryption) {
      return [];
    }

    // Create multiple search tokens for the value
    const tokens = this.generateSearchTokens(value);
    const encryptedTokens: string[] = [];
;
    for (const token of tokens) {
      const encrypted = await this.encryptData(token, `search:${fieldName}`);
      encryptedTokens.push(this.serializeEncryptedData(encrypted));
    }

    return encryptedTokens;
  }

  private generateSearchTokens(_value: string): string[] {
    const tokens = new Set<string>();
    const cleanValue = value.toLowerCase().trim();
;
    // Add full value
    tokens.add(cleanValue);
;
    // Add prefixes (for prefix matching)
    for (let i = 1; i <= Math.min(cleanValue.length, 10); i++) {
      tokens.add(cleanValue.substring(0, i));
    }

    // Add words
    const words = cleanValue.split(/\s+/);
    words.forEach((word) => {
      if (word.length > 2) {
        tokens.add(word);
      }
    });
;
    return Array.from(tokens);
  }

  // Key Management
  async generateDataKey(keyId: string, purpose: string, organizationId: string): Promise<DataKey> {
    const keyMaterial = crypto.randomBytes(32);
    const encryptedKey = await this.encryptDataRest(keyMaterial);
;
    const dataKey: DataKey = {
      id: keyId,;
      purpose,;
      encryptedKey: this.serializeEncryptedData(encryptedKey),;
      algorithm: this.algorithm,;
      createdAt: new Date(),;
      rotatedAt: new Date(),;
      status: 'active' as const,;
      metadata: {},;
      organizationId,;
    }
;
    // Store in database - caller needs to provide organizationId
    if (db.client) {
      await db.client.encryptionKey.create({
        data: {
          id: dataKey.id,;
          purpose: dataKey.purpose,;
          encryptedKey: dataKey.encryptedKey,;
          algorithm: dataKey.algorithm,;
          status: dataKey.status,;
          version: 1,;
          metadata: dataKey.metadata,;
          organizationId: dataKey.organizationId,;
          createdAt: dataKey.createdAt,;
          updatedAt: dataKey.createdAt,;
          rotatedAt: dataKey.rotatedAt,;
        },;
      });
    }

    return dataKey;
  }

  async getDataKey(keyId: string): Promise<Buffer> {
    if (!db.client) {
      throw new Error('Database client not initialized');
    }

    const keyRecord = await db.client.encryptionKey.findUnique({
      where: { id: keyId },;
    });
;
    if (!keyRecord) {
      throw new Error(`Data key not found: ${keyId}`);
    }

    if (keyRecord.status !== 'active') {
      throw new Error(`Data key is not active: ${keyId}`);
    }

    const encryptedKey = this.deserializeEncryptedData(keyRecord.encryptedKey);
    const keyMaterial = await this.decryptDataRest(encryptedKey);
;
    return keyMaterial;
  }

  async rotateKey(keyId: string): Promise<DataKey> {
    if (!db.client) {
      throw new Error('Database client not initialized');
    }

    const oldKey = await db.client.encryptionKey.findUnique({
      where: { id: keyId },;
    });
;
    if (!oldKey) {
      throw new Error(`Key not found: ${keyId}`);
    }

    // Generate new key
    const newKeyMaterial = crypto.randomBytes(32);
    const encryptedKey = await this.encryptDataRest(newKeyMaterial);
;
    // Update key record
    const updatedKey = await db.client.encryptionKey.update({
      where: { id: keyId },;
      data: {
        encryptedKey: this.serializeEncryptedData(encryptedKey),;
        rotatedAt: new Date(),;
        version: { increment: 1 },;
      },;
    });
;
    // Mark old version as rotated
    await db.client.encryptionKeyHistory.create({
      data: {
        keyId: keyId,;
        version: oldKey.version,;
        encryptedKey: oldKey.encryptedKey,;
        rotatedAt: new Date(),;
        reason: 'scheduled_rotation',;
      },;
    });
;
    return {
      id: updatedKey.id,;
      purpose: updatedKey.purpose,;
      encryptedKey: updatedKey.encryptedKey,;
      algorithm: updatedKey.algorithm,;
      createdAt: updatedKey.createdAt,;
      rotatedAt: updatedKey.rotatedAt,;
      status: updatedKey.status as 'active' | 'rotated' | 'revoked',;
      version: updatedKey.version,;
      metadata: updatedKey.metadata as Record<string, any>,;
      organizationId: updatedKey.organizationId,;
    }
  }

  // Batch operations for performance
  async encryptBatch(;
    items: Array<{ id: string; data: any; fieldName?: string }>;
  ): Promise<Array<{ id: string; encrypted: string }>> {
    const results: Array<{ id: string; encrypted: string }> = [];
;
    for (const item of items) {
      try {
        const encrypted = item.fieldName;
          ? await this.encryptField(item.data, item.fieldName);
          : this.serializeEncryptedData(await this.encryptData(JSON.stringify(item.data)));
;
        results.push({
          id: item.id,;
          encrypted,;
        });
      } catch (error) {
        // console.error(`Failed to encrypt item ${item.id}:`, error)
        results.push({
          id: item.id,;
          encrypted: JSON.stringify(item.data), // Fallback to unencrypted;
        });
      }
    }

    return results;
  }

  async decryptBatch(;
    items: Array<{ id: string; encrypted: string; fieldName?: string }>;
  ): Promise<Array<{ id: string; decrypted: any }>> {
    const results: Array<{ id: string; decrypted: any }> = [];
;
    for (const item of items) {
      try {
        const decrypted = item.fieldName;
          ? await this.decryptField(item.encrypted, item.fieldName);
          : JSON.parse(;
              (await this.decryptData(this.deserializeEncryptedData(item.encrypted))).toString(;
                'utf8';
              );
            );
;
        results.push({
          id: item.id,;
          decrypted,;
        });
      } catch (error) {
        // console.error(`Failed to decrypt item ${item.id}:`, error)
        results.push({
          id: item.id,;
          decrypted: item.encrypted, // Fallback to encrypted data;
        });
      }
    }

    return results;
  }

  // Data integrity verification
  async verifyIntegrity(encryptedData: EncryptedData): Promise<boolean> {
    try {
      await this.decryptData(encryptedData);
      return true;
    } catch {
      return false;
    }
  }

  // Secure data deletion
  async secureDelete(encryptedData: EncryptedData): Promise<void> {
    // Overwrite memory with random data
    if (encryptedData.data) {
      crypto.randomFillSync(encryptedData.data);
    }
    if (encryptedData.iv) {
      crypto.randomFillSync(encryptedData.iv);
    }
    if (encryptedData.authTag) {
      crypto.randomFillSync(encryptedData.authTag);
    }
  }

  // Database encryption helpers
  async encryptModel<T extends Record<string, any>>(_model: T,;
    encryptedFields: string[];
  ): Promise<T> {
    const encrypted = { ...model } as T & Record<string, any>;
;
    for (const field of encryptedFields) {
      if (field in encrypted && encrypted[field] != null) {
        (encrypted as any)[field] = await this.encryptField(encrypted[field], field);
      }
    }

    return encrypted;
  }

  async decryptModel<T extends Record<string, any>>(_model: T,;
    encryptedFields: string[];
  ): Promise<T> {
    const decrypted = { ...model } as T & Record<string, any>;
;
    for (const field of encryptedFields) {
      if (field in decrypted && decrypted[field] != null) {
        (decrypted as any)[field] = await this.decryptField(decrypted[field], field);
      }
    }

    return decrypted;
  }

  // Utility methods
  private serializeEncryptedData(encrypted: EncryptedData): string {
    return JSON.stringify({
      data: encrypted.data.toString('base64'),;
      iv: encrypted.iv.toString('base64'),;
      authTag: encrypted.authTag.toString('base64'),;
      algorithm: encrypted.algorithm,;
      keyId: encrypted.keyId,;
      timestamp: encrypted.timestamp?.toISOString(),;
    });
  }

  private deserializeEncryptedData(serialized: string): EncryptedData {
    const parsed = JSON.parse(serialized);
    return {
      data: Buffer.from(parsed.data, 'base64'),;
      iv: Buffer.from(parsed.iv, 'base64'),;
      authTag: Buffer.from(parsed.authTag, 'base64'),;
      algorithm: parsed.algorithm,;
      keyId: parsed.keyId,;
      timestamp: parsed.timestamp ? new Date(parsed.timestamp) : undefined,;
    }
  }

  // Performance monitoring
  getMetrics(): EncryptionMetrics {
    return {
      operationsCount: this.operationsCount,;
      totalEncryptionTime: this.totalEncryptionTime,;
      totalDecryptionTime: this.totalDecryptionTime,;
      // averageEncryptionTime: // Fixed expression expected error
        this.operationsCount > 0 ? this.totalEncryptionTime / this.operationsCount : 0,;
      // averageDecryptionTime: // Fixed expression expected error
        this.operationsCount > 0 ? this.totalDecryptionTime / this.operationsCount : 0,;
      keyRotations: this.keyRotations,;
      lastKeyRotation: this.lastKeyRotation,;
    }
  }

  private operationsCount = 0;
  private totalEncryptionTime = 0;
  private totalDecryptionTime = 0;
  private keyRotations = 0;
  private lastKeyRotation?: Date;
;
  private measureOperation<T>(;
    operation: () => Promise<T>,;
    type: 'encrypt' | 'decrypt';
  ): Promise<T> {
    const startTime = Date.now();
    return operation().finally(() => {
      const _duration = Date.now() - startTime;
      this.operationsCount++;
      if (type === 'encrypt') {
        this.totalEncryptionTime += duration;
      } else {
        this.totalDecryptionTime += duration;
      }
    });
  }
}

// Types
export interface EncryptedData {
  data: Buffer;
  iv: Buffer;
  authTag: Buffer;
  algorithm?: string;
  keyId?: string;
  timestamp?: Date;
}

export interface DataKey {
  id: string;
  purpose: string;
  encryptedKey: string;
  algorithm: string;
  createdAt: Date;
  rotatedAt: Date;
  status: 'active' | 'rotated' | 'revoked';
  version?: number;
  metadata: Record<string, any>;
  organizationId: string;
}

export interface EncryptionMetrics {
  operationsCount: number;
  totalEncryptionTime: number;
  totalDecryptionTime: number;
  averageEncryptionTime: number;
  averageDecryptionTime: number;
  keyRotations: number;
  lastKeyRotation?: Date;
}

// TLS/HTTPS Configuration Helpers
export class TLSConfigurationManager {
  static generateTLSConfig(_config: EncryptionConfiguration['dataInTransit']) {
    const tlsOptions: any = {
      minVersion: config.tlsVersion,;
      maxVersion: config.tlsVersion,;
      secureProtocol: 'TLSv1_3_method',;
    }
;
    if (config.cipherSuites.length > 0) {
      tlsOptions.ciphers = config.cipherSuites.join(':');
    }

    return tlsOptions;
  }

  static generateHSTSHeader(_config: EncryptionConfiguration['dataInTransit']) {
    if (!config.hsts) return null;
;
    return {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',;
    }
  }

  static validateCertificate(cert: string): boolean {
    try {
      // Basic certificate validation
      const x509 = crypto.createPublicKey(cert);
      return !!x509;
    } catch {
      return false;
    }
  }
}

// Default encryption configuration
export const createDefaultEncryptionConfig = (): EncryptionConfiguration => ({
  dataAtRest: {
    enabled: true,;
    algorithm: 'AES-256-GCM',;
    keyRotationDays: 90,;
    keyManagement: 'internal',;
    backupEncryption: true,;
  },;
  dataInTransit: {
    enforceHTTPS: true,;
    tlsVersion: '1.3',;
    certificateValidation: true,;
    hsts: true,;
    cipherSuites: [;
      'TLS_AES_256_GCM_SHA384',;
      'TLS_CHACHA20_POLY1305_SHA256',;
      'TLS_AES_128_GCM_SHA256',;
    ],;
  },;
  fieldLevelEncryption: {
    enabled: true,;
    encryptedFields: [;
      'email',;
      'phone',;
      'ssn',;
      'creditCardNumber',;
      'personalData',;
      'sensitiveNotes',;
    ],;
    searchableEncryption: true,;
  },;
});
;
// Factory function
export const createEncryptionService = (config?: EncryptionConfiguration): EncryptionService => {
  const finalConfig = config || createDefaultEncryptionConfig();
  return new EncryptionService(finalConfig);
}
;
// Global instance
export const encryptionService = EncryptionService.getInstance();
;
/**;
 * Field-level encryption for sensitive database fields;
 */
export class FieldEncryption {
  private static instance: FieldEncryption;
  private encryptionService: EncryptionService;
;
  private constructor() {
    this.encryptionService = EncryptionService.getInstance();
  }

  public static getInstance(): FieldEncryption {
    if (!FieldEncryption.instance) {
      FieldEncryption.instance = new FieldEncryption();
    }
    return FieldEncryption.instance;
  }

  /**;
   * Encrypt sensitive field for database storage;
   */
  public async encryptField(_value: string, fieldName: string, recordId: string): Promise<string> {
    const aad = `${fieldName}:${recordId}`;
    const encrypted = await this.encryptionService.encryptData(value, aad);
    return JSON.stringify(encrypted);
  }

  /**;
   * Decrypt sensitive field from database;
   */
  public async decryptField(;
    encryptedValue: string,;
    fieldName: string,;
    recordId: string;
  ): Promise<string> {
    try {
      const encryptedData = JSON.parse(encryptedValue);
      const aad = `${fieldName}:${recordId}`;
      const decrypted = await this.encryptionService.decryptData(encryptedData, aad);
      return decrypted.toString('utf8');
    } catch (error) {
      throw new Error(;
        `Failed to decrypt field ${fieldName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      );
    }
  }
}

// Export singleton instances
export const fieldEncryption = FieldEncryption.getInstance();
;
// Utility functions
export function generateSecureId(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(32);
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(salt.toString('hex') + ':' + derivedKey.toString('hex'));
    });
  });
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(':');
    crypto.pbkdf2(password, Buffer.from(salt, 'hex'), 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(key === derivedKey.toString('hex'));
    });
  });
}

/**;
 * Encrypt sensitive data;
 */
export async function encrypt(plaintext: string): Promise<string> {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
;
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
    cipher.setAAD(Buffer.from('riscura-mfa', 'utf8'));
;
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
;
    const tag = cipher.getAuthTag();
;
    // Combine iv, tag, and encrypted data
    const combined = Buffer.concat([iv, tag, Buffer.from(encrypted, 'hex')]);
    return combined.toString('base64');
  } catch (error) {
    throw new Error('Encryption failed');
  }
}

/**;
 * Decrypt sensitive data;
 */
export async function decrypt(encryptedData: string): Promise<string> {
  try {
    const key = getEncryptionKey();
    const combined = Buffer.from(encryptedData, 'base64');
;
    // Extract iv, tag, and encrypted data
    const iv = combined.slice(0, IV_LENGTH);
    const tag = combined.slice(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const encrypted = combined.slice(IV_LENGTH + TAG_LENGTH);
;
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    decipher.setAAD(Buffer.from('riscura-mfa', 'utf8'));
    decipher.setAuthTag(tag);
;
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');
;
    return decrypted;
  } catch (error) {
    throw new Error('Decryption failed');
  }
}

/**;
 * Generate a secure random key for encryption;
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

/**;
 * Hash sensitive data (one-way);
 */
export function hashData(_data: string, salt?: string): string {
  const saltBuffer = salt ? Buffer.from(salt, 'hex') : crypto.randomBytes(16);
  const hash = crypto.pbkdf2Sync(data, saltBuffer, 10000, 32, 'sha256');
  return saltBuffer.toString('hex') + ':' + hash.toString('hex');
}

/**;
 * Verify hashed data;
 */
export function verifyHash(_data: string, hashedData: string): boolean {
  const [salt, hash] = hashedData.split(':');
  const hashBuffer = Buffer.from(hash, 'hex');
  const saltBuffer = Buffer.from(salt, 'hex');
;
  const verifyHash = crypto.pbkdf2Sync(data, saltBuffer, 10000, 32, 'sha256');
;
  return crypto.timingSafeEqual(hashBuffer, verifyHash);
}
