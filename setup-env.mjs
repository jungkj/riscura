#!/usr/bin/env node

/**
 * Environment Setup Script for Riscura Platform
 * This script helps create a proper .env.local file for development
 */

import fs from 'fs';
import path from 'path';

console.log('🚀 Setting up Riscura Development Environment...\n');

const envContent = `# Riscura Platform - Development Environment
# Generated on ${new Date().toISOString()}

# ============================================================================
# AI CONFIGURATION
# ============================================================================
# Set to false to disable AI features and avoid console warnings
NEXT_PUBLIC_ENABLE_AI_FEATURES=false
NEXT_PUBLIC_OPENAI_API_KEY=sk-placeholder

# ============================================================================
# APPLICATION CONFIGURATION  
# ============================================================================
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Demo Mode (set to true for demo without database)
MOCK_DATA=true

# ============================================================================
# DATABASE CONFIGURATION (Optional in demo mode)
# ============================================================================
DATABASE_URL=file:./dev.db

# ============================================================================
# AUTHENTICATION SECRETS (Demo values - change for production)
# ============================================================================
JWT_ACCESS_SECRET=demo-access-secret-key-change-in-production
JWT_REFRESH_SECRET=demo-refresh-secret-key-change-in-production
SESSION_SECRET=demo-session-secret-key-change-in-production

# ============================================================================
# FEATURE FLAGS
# ============================================================================
ENABLE_AI_FEATURES=false
ENABLE_BILLING=false
ENABLE_REAL_TIME_COLLABORATION=true
ENABLE_EMAIL_NOTIFICATIONS=false

# ============================================================================
# CORS CONFIGURATION
# ============================================================================
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
`;

const envPath = path.join(process.cwd(), '.env.local');

try {
  if (fs.existsSync(envPath)) {
    console.log('⚠️  .env.local already exists. Creating backup...');
    const backupPath = `${envPath}.backup.${Date.now()}`;
    fs.copyFileSync(envPath, backupPath);
    console.log(`✅ Backup saved to: ${backupPath}\n`);
  }

  fs.writeFileSync(envPath, envContent);
  
  console.log('✅ Environment file created successfully!');
  console.log(`📁 Location: ${envPath}\n`);
  
  console.log('🎯 Quick Start:');
  console.log('1. Run: npm run dev');
  console.log('2. Open: http://localhost:3000/auth/login');
  console.log('3. Use demo credentials:');
  console.log('   Email: admin@riscura.com');
  console.log('   Password: admin123\n');
  
  console.log('🔧 To enable AI features:');
  console.log('1. Get an OpenAI API key from https://platform.openai.com/');
  console.log('2. Update NEXT_PUBLIC_OPENAI_API_KEY in .env.local');
  console.log('3. Set NEXT_PUBLIC_ENABLE_AI_FEATURES=true\n');
  
  console.log('🗄️  To use a real database:');
  console.log('1. Set up PostgreSQL');
  console.log('2. Update DATABASE_URL in .env.local');
  console.log('3. Set MOCK_DATA=false');
  console.log('4. Run: npx prisma db push\n');
  
  console.log('🎉 Setup complete! Happy coding!');

} catch (error) {
  console.error('❌ Error creating environment file:', error.message);
  process.exit(1);
} 