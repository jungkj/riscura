#!/usr/bin/env node

/**
 * Generate Cryptographically Secure Production Secrets
 * 
 * This script generates secure keys and secrets for production deployment.
 * It uses Node.js crypto module to ensure cryptographic security.
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

class SecretGenerator {
  constructor() {
    this.secrets = {};
  }

  /**
   * Generate random base64 string of specified length
   */
  generateSecureKey(bytes = 32) {
    return crypto.randomBytes(bytes).toString('base64url');
  }

  /**
   * Generate hex string of specified length
   */
  generateHexKey(bytes = 32) {
    return crypto.randomBytes(bytes).toString('hex');
  }

  /**
   * Generate UUID v4
   */
  generateUUID() {
    return crypto.randomUUID();
  }

  /**
   * Generate secure password
   */
  generateSecurePassword(length = 32) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      password += charset[randomIndex];
    }
    
    return password;
  }

  /**
   * Generate all required secrets
   */
  generateAllSecrets() {
    console.log('🔐 Generating cryptographically secure production secrets...\n');

    // JWT and Authentication Secrets
    this.secrets.JWT_SECRET = this.generateSecureKey(64);
    this.secrets.NEXTAUTH_SECRET = this.generateSecureKey(64);
    this.secrets.SESSION_SECRET = this.generateSecureKey(64);
    this.secrets.COOKIE_SECRET = this.generateSecureKey(32);
    
    // Encryption Keys
    this.secrets.AI_ENCRYPTION_KEY = this.generateSecureKey(32);
    this.secrets.DATABASE_ENCRYPTION_KEY = this.generateSecureKey(32);
    this.secrets.FILE_ENCRYPTION_KEY = this.generateSecureKey(32);
    
    // CSRF Protection
    this.secrets.CSRF_SECRET = this.generateSecureKey(32);
    
    // API Keys
    this.secrets.INTERNAL_API_KEY = this.generateSecureKey(48);
    this.secrets.WEBHOOK_SECRET = this.generateSecureKey(32);
    
    // Security Headers
    this.secrets.CSP_NONCE_SECRET = this.generateSecureKey(24);
    
    // Rate Limiting
    this.secrets.RATE_LIMIT_SALT = this.generateHexKey(16);
    
    // Session IDs
    this.secrets.SESSION_ID_SECRET = this.generateSecureKey(32);
    
    // Email Verification
    this.secrets.EMAIL_VERIFICATION_SECRET = this.generateSecureKey(32);
    this.secrets.PASSWORD_RESET_SECRET = this.generateSecureKey(32);
    
    // Two-Factor Authentication
    this.secrets.TOTP_SECRET = this.generateSecureKey(32);
    
    // Document Watermarking
    this.secrets.WATERMARK_SECRET = this.generateSecureKey(32);
    
    // Audit Logging
    this.secrets.AUDIT_SIGNATURE_KEY = this.generateSecureKey(32);

    console.log('✅ All secrets generated successfully!\n');
  }

  /**
   * Create .env.production template
   */
  createProductionEnvTemplate() {
    const template = `# PRODUCTION ENVIRONMENT VARIABLES
# Generated on ${new Date().toISOString()}
# 
# ⚠️  CRITICAL SECURITY NOTICE:
# - Never commit these secrets to version control
# - Store in secure environment variable management
# - Rotate secrets regularly (every 90 days)
# - Use different secrets for each environment

# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================
DATABASE_URL="postgresql://username:password@hostname:5432/database_name?sslmode=require"
DATABASE_DIRECT_URL="postgresql://username:password@hostname:5432/database_name?sslmode=require&pgbouncer=true"
SHADOW_DATABASE_URL="postgresql://username:password@shadow-hostname:5432/shadow_database?sslmode=require"

# Database Connection Pool
DATABASE_POOL_MAX=20
DATABASE_POOL_MIN=5
DATABASE_RETRY_ATTEMPTS=3

# ============================================================================
# AUTHENTICATION & SECURITY
# ============================================================================
JWT_SECRET="${this.secrets.JWT_SECRET}"
NEXTAUTH_SECRET="${this.secrets.NEXTAUTH_SECRET}"
SESSION_SECRET="${this.secrets.SESSION_SECRET}"
COOKIE_SECRET="${this.secrets.COOKIE_SECRET}"

# ============================================================================
# ENCRYPTION KEYS
# ============================================================================
AI_ENCRYPTION_KEY="${this.secrets.AI_ENCRYPTION_KEY}"
DATABASE_ENCRYPTION_KEY="${this.secrets.DATABASE_ENCRYPTION_KEY}"
FILE_ENCRYPTION_KEY="${this.secrets.FILE_ENCRYPTION_KEY}"

# ============================================================================
# CSRF PROTECTION
# ============================================================================
CSRF_SECRET="${this.secrets.CSRF_SECRET}"

# ============================================================================
# API KEYS & WEBHOOKS
# ============================================================================
INTERNAL_API_KEY="${this.secrets.INTERNAL_API_KEY}"
WEBHOOK_SECRET="${this.secrets.WEBHOOK_SECRET}"

# ============================================================================
# SECURITY CONFIGURATION
# ============================================================================
CSP_NONCE_SECRET="${this.secrets.CSP_NONCE_SECRET}"
RATE_LIMIT_SALT="${this.secrets.RATE_LIMIT_SALT}"
SESSION_ID_SECRET="${this.secrets.SESSION_ID_SECRET}"

# ============================================================================
# EMAIL & VERIFICATION
# ============================================================================
EMAIL_VERIFICATION_SECRET="${this.secrets.EMAIL_VERIFICATION_SECRET}"
PASSWORD_RESET_SECRET="${this.secrets.PASSWORD_RESET_SECRET}"

# Email Configuration (Configure for your provider)
SMTP_HOST="your-smtp-host.com"
SMTP_PORT=587
SMTP_USER="your-smtp-username"
SMTP_PASS="your-smtp-password"
SMTP_FROM="noreply@your-domain.com"

# ============================================================================
# TWO-FACTOR AUTHENTICATION
# ============================================================================
TOTP_SECRET="${this.secrets.TOTP_SECRET}"

# ============================================================================
# DOCUMENT SECURITY
# ============================================================================
WATERMARK_SECRET="${this.secrets.WATERMARK_SECRET}"

# ============================================================================
# AUDIT & MONITORING
# ============================================================================
AUDIT_SIGNATURE_KEY="${this.secrets.AUDIT_SIGNATURE_KEY}"

# Monitoring (Configure for your providers)
SENTRY_DSN="https://your-sentry-dsn@sentry.io/project-id"

# ============================================================================
# THIRD-PARTY INTEGRATIONS
# ============================================================================

# OpenAI API
OPENAI_API_KEY="sk-your-openai-api-key"
OPENAI_ORG_ID="org-your-openai-org-id"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Stripe Payment Processing
STRIPE_SECRET_KEY="sk_live_your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="whsec_your-stripe-webhook-secret"

# AWS Configuration (if using S3)
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_S3_BUCKET="your-s3-bucket-name"
AWS_S3_REGION="us-east-1"

# ============================================================================
# APPLICATION CONFIGURATION
# ============================================================================
NODE_ENV=production
APP_URL="https://your-domain.com"
APP_NAME="Riscura"
PORT=3000

# Security Features
ENABLE_CSRF_PROTECTION=true
ENABLE_RATE_LIMITING=true
ENABLE_SECURITY_HEADERS=true
ENABLE_EMAIL_VERIFICATION=true
ENABLE_2FA=true

# Feature Flags
ENABLE_AI_FEATURES=true
ENABLE_COLLABORATION=true
ENABLE_REAL_TIME=true
ENABLE_EMAIL_NOTIFICATIONS=true

# Logging
LOG_LEVEL=info
DEBUG_MODE=false
MOCK_DATA=false
`;

    return template;
  }

  /**
   * Create secrets rotation script
   */
  createRotationScript() {
    const script = `#!/usr/bin/env node

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
`;

    return script;
  }

  /**
   * Create security checklist
   */
  createSecurityChecklist() {
    const checklist = `# 🔐 Production Security Checklist

## Pre-Deployment Security Tasks

### 1. Environment Variables
- [ ] All secrets generated and stored securely
- [ ] .env.production configured with real values
- [ ] No test/demo keys in production code
- [ ] Environment variables validated

### 2. Database Security
- [ ] Database uses SSL/TLS connections
- [ ] Database user has minimal required permissions
- [ ] Connection pooling properly configured
- [ ] Database backup encryption enabled

### 3. Authentication & Authorization
- [ ] JWT secrets are cryptographically secure
- [ ] Session timeout configured appropriately
- [ ] Password policies enforced
- [ ] Multi-factor authentication enabled

### 4. Network Security
- [ ] HTTPS enforced for all connections
- [ ] Security headers configured (HSTS, CSP, etc.)
- [ ] CORS properly configured for production domains
- [ ] Rate limiting enabled and tested

### 5. Data Protection
- [ ] Sensitive data encrypted at rest
- [ ] File uploads scanned for malware
- [ ] Document watermarking enabled
- [ ] Audit logging configured

### 6. Monitoring & Alerting
- [ ] Security event monitoring enabled
- [ ] Failed authentication alerts configured
- [ ] Rate limiting alerts configured
- [ ] Error tracking (Sentry) configured

### 7. Compliance
- [ ] GDPR compliance measures implemented
- [ ] Data retention policies configured
- [ ] User consent mechanisms in place
- [ ] Right to deletion implemented

## Post-Deployment Verification

### 1. Security Headers Test
\`\`\`bash
curl -I https://your-domain.com
# Verify presence of security headers
\`\`\`

### 2. Rate Limiting Test
\`\`\`bash
# Test rate limiting
for i in {1..10}; do curl -w "Status: %{http_code}\\n" https://your-domain.com/api/test; done
\`\`\`

### 3. CSRF Protection Test
\`\`\`bash
# Test CSRF protection
curl -X POST https://your-domain.com/api/forms -H "Content-Type: application/json" -d '{}'
\`\`\`

### 4. Security Scan
- [ ] Run security vulnerability scan
- [ ] Check SSL certificate validity
- [ ] Verify security headers with securityheaders.com
- [ ] Test authentication flows

## Ongoing Security Maintenance

### Monthly Tasks
- [ ] Review security logs
- [ ] Update dependencies
- [ ] Check for security advisories
- [ ] Test backup restoration

### Quarterly Tasks
- [ ] Rotate non-encryption secrets
- [ ] Security audit
- [ ] Penetration testing
- [ ] Update security policies

### Annually
- [ ] Rotate encryption keys (with data migration)
- [ ] Full security assessment
- [ ] Update compliance documentation
- [ ] Security training for team
`;

    return checklist;
  }

  /**
   * Save all files
   */
  saveFiles() {
    // Create scripts directory if it doesn't exist
    const scriptsDir = 'scripts';
    if (!fs.existsSync(scriptsDir)) {
      fs.mkdirSync(scriptsDir, { recursive: true });
    }

    // Save .env.production template
    const envTemplate = this.createProductionEnvTemplate();
    fs.writeFileSync('.env.production.template', envTemplate);
    console.log('✅ Created .env.production.template');

    // Save rotation script
    const rotationScript = this.createRotationScript();
    fs.writeFileSync(path.join(scriptsDir, 'rotate-secrets.js'), rotationScript);
    fs.chmodSync(path.join(scriptsDir, 'rotate-secrets.js'), 0o755);
    console.log('✅ Created scripts/rotate-secrets.js');

    // Save security checklist
    const checklist = this.createSecurityChecklist();
    fs.writeFileSync('SECURITY_CHECKLIST.md', checklist);
    console.log('✅ Created SECURITY_CHECKLIST.md');

    // Save secrets to a temporary file (for immediate use)
    const secretsJson = JSON.stringify(this.secrets, null, 2);
    fs.writeFileSync('.secrets.tmp.json', secretsJson);
    console.log('✅ Created .secrets.tmp.json (DELETE after copying to environment)');
  }

  /**
   * Run the secret generation process
   */
  run() {
    this.generateAllSecrets();
    this.saveFiles();

    console.log('\n🎉 Secret generation complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Copy secrets from .secrets.tmp.json to your environment');
    console.log('2. Configure .env.production.template with your values');
    console.log('3. Delete .secrets.tmp.json after copying');
    console.log('4. Review and complete SECURITY_CHECKLIST.md');
    console.log('5. Test all security measures before deployment');
    console.log('\n⚠️  IMPORTANT: Store these secrets securely and never commit them to version control!');
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new SecretGenerator();
  generator.run();
} 