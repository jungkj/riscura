#!/usr/bin/env node

/**
 * Secret Rotation Script
 * 
 * This script helps rotate production secrets safely.
 * It generates new secrets while preserving rollback capability.
 */

import fs from 'fs';
import path from 'path';

const SECRETS_TO_ROTATE = [
  'JWT_SECRET',
  'SESSION_SECRET',
  'CSRF_SECRET',
  'INTERNAL_API_KEY',
  'WEBHOOK_SECRET',
  'CSP_NONCE_SECRET',
  'RATE_LIMIT_SALT'
];

const ENCRYPTION_KEYS = [
  'AI_ENCRYPTION_KEY',
  'DATABASE_ENCRYPTION_KEY', 
  'FILE_ENCRYPTION_KEY',
  'WATERMARK_SECRET',
  'AUDIT_SIGNATURE_KEY'
];

console.log('🔄 Secret Rotation Script');
console.log('========================');
console.log();
console.log('⚠️  WARNING: This will generate new secrets!');
console.log('   Make sure you have a rollback plan before proceeding.');
console.log();
console.log('Secrets to rotate:', SECRETS_TO_ROTATE.join(', '));
console.log();
console.log('❌ Encryption keys NOT rotated (requires data migration):');
console.log('   ', ENCRYPTION_KEYS.join(', '));
console.log();
console.log('To proceed, run: node scripts/generate-secrets.js --rotate');
