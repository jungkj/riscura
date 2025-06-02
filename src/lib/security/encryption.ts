import crypto from 'crypto';
import { db } from '@/lib/db';
import type { EncryptionConfiguration } from './types';

export class EncryptionService {
  private config: EncryptionConfiguration;
  private masterKey!: Buffer;
  private algorithm = 'aes-256-gcm';
  private keyDerivationSalt: Buffer;

  constructor(config: EncryptionConfiguration) {
    this.config = config;
    this.keyDerivationSalt = Buffer.from(process.env.ENCRYPTION_SALT || 'riscura-default-salt', 'utf8');
    this.initializeMasterKey();
  }

  private initializeMasterKey(): void {
    const keyMaterial = process.env.MASTER_ENCRYPTION_KEY || 'riscura-default-master-key';
    this.masterKey = crypto.pbkdf2Sync(keyMaterial, this.keyDerivationSalt, 100000, 32, 'sha256');
  }

  // Data at Rest Encryption
  async encryptData(data: string | Buffer, keyId?: string): Promise<EncryptedData> {
    try {
      const plaintext = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
      const key = keyId ? await this.getDataKey(keyId) : this.masterKey;
      
      // Generate random IV for each encryption
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv(this.algorithm, key, iv) as crypto.CipherGCM;
      
      const encrypted = Buffer.concat([
        cipher.update(plaintext),
        cipher.final()
      ]);
      
      const authTag = cipher.getAuthTag();
      
      return {
        data: encrypted,
        iv,
        authTag,
        algorithm: this.algorithm,
        keyId: keyId || 'master',
        timestamp: new Date(),
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async decryptData(encryptedData: EncryptedData): Promise<Buffer> {
    try {
      const key = encryptedData.keyId === 'master' 
        ? this.masterKey 
        : await this.getDataKey(encryptedData.keyId);
      
      const decipher = crypto.createDecipheriv(encryptedData.algorithm, key, encryptedData.iv) as crypto.DecipherGCM;
      decipher.setAuthTag(encryptedData.authTag);
      
      const decrypted = Buffer.concat([
        decipher.update(encryptedData.data),
        decipher.final()
      ]);
      
      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Field-level Encryption
  async encryptField(value: any, fieldName: string): Promise<string> {
    if (!this.config.fieldLevelEncryption.enabled) {
      return value;
    }

    if (!this.config.fieldLevelEncryption.encryptedFields.includes(fieldName)) {
      return value;
    }

    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    const encrypted = await this.encryptData(stringValue, `field:${fieldName}`);
    
    return this.serializeEncryptedData(encrypted);
  }

  async decryptField(encryptedValue: string, fieldName: string): Promise<any> {
    if (!this.config.fieldLevelEncryption.enabled) {
      return encryptedValue;
    }

    try {
      const encrypted = this.deserializeEncryptedData(encryptedValue);
      const decrypted = await this.decryptData(encrypted);
      
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
  async createSearchableIndex(value: string, fieldName: string): Promise<string[]> {
    if (!this.config.fieldLevelEncryption.searchableEncryption) {
      return [];
    }

    // Create multiple search tokens for the value
    const tokens = this.generateSearchTokens(value);
    const encryptedTokens: string[] = [];

    for (const token of tokens) {
      const encrypted = await this.encryptData(token, `search:${fieldName}`);
      encryptedTokens.push(this.serializeEncryptedData(encrypted));
    }

    return encryptedTokens;
  }

  private generateSearchTokens(value: string): string[] {
    const tokens = new Set<string>();
    const cleanValue = value.toLowerCase().trim();
    
    // Add full value
    tokens.add(cleanValue);
    
    // Add prefixes (for prefix matching)
    for (let i = 1; i <= Math.min(cleanValue.length, 10); i++) {
      tokens.add(cleanValue.substring(0, i));
    }
    
    // Add words
    const words = cleanValue.split(/\s+/);
    words.forEach(word => {
      if (word.length > 2) {
        tokens.add(word);
      }
    });
    
    return Array.from(tokens);
  }

  // Key Management
  async generateDataKey(keyId: string, purpose: string): Promise<DataKey> {
    const keyMaterial = crypto.randomBytes(32);
    const encryptedKey = await this.encryptData(keyMaterial, 'master');
    
    const dataKey: DataKey = {
      id: keyId,
      purpose,
      encryptedKey: this.serializeEncryptedData(encryptedKey),
      algorithm: this.algorithm,
      createdAt: new Date(),
      rotatedAt: new Date(),
      status: 'active',
      metadata: {},
    };

    // Store in database
    await db.client.encryptionKey.create({
      data: dataKey,
    });

    return dataKey;
  }

  async getDataKey(keyId: string): Promise<Buffer> {
    const keyRecord = await db.client.encryptionKey.findUnique({
      where: { id: keyId },
    });

    if (!keyRecord) {
      throw new Error(`Data key not found: ${keyId}`);
    }

    if (keyRecord.status !== 'active') {
      throw new Error(`Data key is not active: ${keyId}`);
    }

    const encryptedKey = this.deserializeEncryptedData(keyRecord.encryptedKey);
    const keyMaterial = await this.decryptData(encryptedKey);
    
    return keyMaterial;
  }

  async rotateKey(keyId: string): Promise<DataKey> {
    const oldKey = await db.client.encryptionKey.findUnique({
      where: { id: keyId },
    });

    if (!oldKey) {
      throw new Error(`Key not found: ${keyId}`);
    }

    // Generate new key
    const newKeyMaterial = crypto.randomBytes(32);
    const encryptedKey = await this.encryptData(newKeyMaterial, 'master');

    // Update key record
    const updatedKey = await db.client.encryptionKey.update({
      where: { id: keyId },
      data: {
        encryptedKey: this.serializeEncryptedData(encryptedKey),
        rotatedAt: new Date(),
        version: { increment: 1 },
      },
    });

    // Mark old version as rotated
    await db.client.encryptionKeyHistory.create({
      data: {
        keyId: keyId,
        version: oldKey.version,
        encryptedKey: oldKey.encryptedKey,
        rotatedAt: new Date(),
        reason: 'scheduled_rotation',
      },
    });

    return updatedKey;
  }

  // Batch operations for performance
  async encryptBatch(items: Array<{ id: string; data: any; fieldName?: string }>): Promise<Array<{ id: string; encrypted: string }>> {
    const results: Array<{ id: string; encrypted: string }> = [];

    for (const item of items) {
      try {
        const encrypted = item.fieldName 
          ? await this.encryptField(item.data, item.fieldName)
          : this.serializeEncryptedData(await this.encryptData(JSON.stringify(item.data)));
        
        results.push({
          id: item.id,
          encrypted,
        });
      } catch (error) {
        console.error(`Failed to encrypt item ${item.id}:`, error);
        results.push({
          id: item.id,
          encrypted: JSON.stringify(item.data), // Fallback to unencrypted
        });
      }
    }

    return results;
  }

  async decryptBatch(items: Array<{ id: string; encrypted: string; fieldName?: string }>): Promise<Array<{ id: string; decrypted: any }>> {
    const results: Array<{ id: string; decrypted: any }> = [];

    for (const item of items) {
      try {
        const decrypted = item.fieldName
          ? await this.decryptField(item.encrypted, item.fieldName)
          : JSON.parse((await this.decryptData(this.deserializeEncryptedData(item.encrypted))).toString('utf8'));
        
        results.push({
          id: item.id,
          decrypted,
        });
      } catch (error) {
        console.error(`Failed to decrypt item ${item.id}:`, error);
        results.push({
          id: item.id,
          decrypted: item.encrypted, // Fallback to encrypted data
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
  async encryptModel<T extends Record<string, any>>(
    model: T, 
    encryptedFields: string[]
  ): Promise<T> {
    const encrypted = { ...model } as T & Record<string, any>;
    
    for (const field of encryptedFields) {
      if (field in encrypted && encrypted[field] != null) {
        (encrypted as any)[field] = await this.encryptField(encrypted[field], field);
      }
    }
    
    return encrypted;
  }

  async decryptModel<T extends Record<string, any>>(
    model: T, 
    encryptedFields: string[]
  ): Promise<T> {
    const decrypted = { ...model } as T & Record<string, any>;
    
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
      data: encrypted.data.toString('base64'),
      iv: encrypted.iv.toString('base64'),
      authTag: encrypted.authTag.toString('base64'),
      algorithm: encrypted.algorithm,
      keyId: encrypted.keyId,
      timestamp: encrypted.timestamp.toISOString(),
    });
  }

  private deserializeEncryptedData(serialized: string): EncryptedData {
    const parsed = JSON.parse(serialized);
    return {
      data: Buffer.from(parsed.data, 'base64'),
      iv: Buffer.from(parsed.iv, 'base64'),
      authTag: Buffer.from(parsed.authTag, 'base64'),
      algorithm: parsed.algorithm,
      keyId: parsed.keyId,
      timestamp: new Date(parsed.timestamp),
    };
  }

  // Performance monitoring
  getMetrics(): EncryptionMetrics {
    return {
      operationsCount: this.operationsCount,
      totalEncryptionTime: this.totalEncryptionTime,
      totalDecryptionTime: this.totalDecryptionTime,
      averageEncryptionTime: this.operationsCount > 0 ? this.totalEncryptionTime / this.operationsCount : 0,
      averageDecryptionTime: this.operationsCount > 0 ? this.totalDecryptionTime / this.operationsCount : 0,
      keyRotations: this.keyRotations,
      lastKeyRotation: this.lastKeyRotation,
    };
  }

  private operationsCount = 0;
  private totalEncryptionTime = 0;
  private totalDecryptionTime = 0;
  private keyRotations = 0;
  private lastKeyRotation?: Date;

  private measureOperation<T>(operation: () => Promise<T>, type: 'encrypt' | 'decrypt'): Promise<T> {
    const startTime = Date.now();
    return operation().finally(() => {
      const duration = Date.now() - startTime;
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
  algorithm: string;
  keyId: string;
  timestamp: Date;
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
  static generateTLSConfig(config: EncryptionConfiguration['dataInTransit']) {
    const tlsOptions: any = {
      minVersion: config.tlsVersion,
      maxVersion: config.tlsVersion,
      secureProtocol: 'TLSv1_3_method',
    };

    if (config.cipherSuites.length > 0) {
      tlsOptions.ciphers = config.cipherSuites.join(':');
    }

    return tlsOptions;
  }

  static generateHSTSHeader(config: EncryptionConfiguration['dataInTransit']) {
    if (!config.hsts) return null;

    return {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    };
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
    enabled: true,
    algorithm: 'AES-256-GCM',
    keyRotationDays: 90,
    keyManagement: 'internal',
    backupEncryption: true,
  },
  dataInTransit: {
    enforceHTTPS: true,
    tlsVersion: '1.3',
    certificateValidation: true,
    hsts: true,
    cipherSuites: [
      'TLS_AES_256_GCM_SHA384',
      'TLS_CHACHA20_POLY1305_SHA256',
      'TLS_AES_128_GCM_SHA256',
    ],
  },
  fieldLevelEncryption: {
    enabled: true,
    encryptedFields: [
      'email',
      'phone',
      'ssn',
      'creditCardNumber',
      'personalData',
      'sensitiveNotes',
    ],
    searchableEncryption: true,
  },
});

// Factory function
export const createEncryptionService = (config?: EncryptionConfiguration): EncryptionService => {
  const finalConfig = config || createDefaultEncryptionConfig();
  return new EncryptionService(finalConfig);
};

// Global instance
export const encryptionService = createEncryptionService(); 