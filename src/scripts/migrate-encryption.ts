#!/usr/bin/env tsx
/**
 * Migration script to re-encrypt API keys with new encryption method
 * Run this after deploying the encryption improvements
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { config } from 'dotenv';

// Load environment variables
config();

const prisma = new PrismaClient();

// Old encryption method (for decryption only)
function decryptOldMethod(encryptedKey: string, key: string): string | null {
  try {
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    let decrypted = decipher.update(encryptedKey, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    // console.error('Failed to decrypt with old method:', error);
    return null;
  }
}

// New encryption method
class EncryptionService {
  private encryptionKey: Buffer;
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly IV_LENGTH = 16;
  private static readonly TAG_LENGTH = 16;

  constructor(keySource: string) {
    this.encryptionKey = this.deriveKey(keySource);
  }

  private deriveKey(keySource: string): Buffer {
    const salt = crypto.createHash('sha256').update('probo-encryption-salt').digest();
    return crypto.pbkdf2Sync(keySource, salt, 100000, 32, 'sha256');
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(EncryptionService.IV_LENGTH);
    const cipher = crypto.createCipheriv(EncryptionService.ALGORITHM, this.encryptionKey, iv);

    let encrypted = cipher.update(text, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    const tag = cipher.getAuthTag();
    const combined = Buffer.concat([iv, tag, encrypted]);

    return combined.toString('base64');
  }
}

async function migrateEncryption() {
  // console.log('🔐 Starting encryption migration...\n');

  const keySource = process.env.PROBO_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET;
  if (!keySource) {
    // console.error('❌ Error: No encryption key found in environment variables');
    // console.error('   Please set PROBO_ENCRYPTION_KEY or NEXTAUTH_SECRET');
    process.exit(1);
  }

  const encryptionService = new EncryptionService(keySource);

  try {
    // Find all Probo integrations with encrypted API keys
    const integrations = await prisma.proboIntegration.findMany({
      where: {
        apiKeyEncrypted: {
          not: null,
        },
      },
    });

    // console.log(`Found ${integrations.length} integrations to migrate\n`);

    let successCount = 0;
    let failureCount = 0;

    for (const integration of integrations) {
      // console.log(`Processing integration for organization: ${integration.organizationId}`);

      try {
        // Try to decrypt with old method
        const decryptedKey = decryptOldMethod(integration.apiKeyEncrypted!, keySource);

        if (!decryptedKey) {
          // console.log('  ⚠️  Could not decrypt - may already be using new encryption');

          // Try to verify it's already in new format
          try {
            // If it's base64 and has proper length, it might be new format
            const decoded = Buffer.from(integration.apiKeyEncrypted!, 'base64');
            if (decoded.length > EncryptionService.IV_LENGTH + EncryptionService.TAG_LENGTH) {
              // console.log('  ✓ Appears to be already encrypted with new method');
              successCount++;
              continue;
            }
          } catch {
            // Not base64, definitely old format but couldn't decrypt
          }

          failureCount++;
          continue;
        }

        // Re-encrypt with new method
        const newEncrypted = encryptionService.encrypt(decryptedKey);

        // Update in database
        await prisma.proboIntegration.update({
          where: { id: integration.id },
          data: { apiKeyEncrypted: newEncrypted },
        });

        // console.log('  ✅ Successfully migrated to new encryption');
        successCount++;
      } catch (error) {
        // console.error(`  ❌ Error migrating integration: ${error}`);
        failureCount++;
      }
    }

    // console.log('\n📊 Migration Summary:');
    // console.log(`   ✅ Successful: ${successCount}`);
    // console.log(`   ❌ Failed: ${failureCount}`);
    // console.log(`   📋 Total: ${integrations.length}`);

    if (failureCount > 0) {
      // console.log('\n⚠️  Some migrations failed. Please check the logs above.');
      process.exit(1);
    } else {
      // console.log('\n🎉 Migration completed successfully!');
    }
  } catch (error) {
    // console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateEncryption().catch(console.error);
