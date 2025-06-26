#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Fixing Supabase Connection String...');
console.log('');

// Your correct credentials
const SUPABASE_PROJECT_REF = 'zggstcxinvxsksssdyr'; // Note: corrected from zggstcxinvxsfksssdyr
const SUPABASE_PASSWORD = 'Gynaha2pf!123';

// Read the current .env.local file
const envLocalPath = path.join(process.cwd(), '.env.local');
let envContent = fs.readFileSync(envLocalPath, 'utf8');

console.log('📋 Updating connection strings...');

// Update DATABASE_URL with correct format for connection pooling
envContent = envContent.replace(
  /DATABASE_URL="[^"]*"/g,
  `DATABASE_URL="postgresql://postgres.${SUPABASE_PROJECT_REF}:${SUPABASE_PASSWORD}@aws-0-us-west-1.pooler.supabase.co:6543/postgres"`
);

// Update DIRECT_URL with direct connection format
envContent = envContent.replace(
  /DIRECT_URL="[^"]*"/g,
  `DIRECT_URL="postgresql://postgres:${SUPABASE_PASSWORD}@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres"`
);

// Write the updated content back
fs.writeFileSync(envLocalPath, envContent);

console.log('✅ Updated .env.local with correct connection strings!');
console.log('');
console.log('📡 Connection Details:');
console.log(`  Project Reference: ${SUPABASE_PROJECT_REF}`);
console.log(`  Password: ${SUPABASE_PASSWORD}`);
console.log('');
console.log('🔗 Connection Strings:');
console.log(`  DATABASE_URL: postgresql://postgres.${SUPABASE_PROJECT_REF}:****@aws-0-us-west-1.pooler.supabase.co:6543/postgres`);
console.log(`  DIRECT_URL: postgresql://postgres:****@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres`);
console.log('');
console.log('🚀 Next steps:');
console.log('1. Run: npx prisma db push');
console.log('2. Run: npm run db:seed');
console.log('3. Run: npm run create:test-user');
console.log('4. Run: npm run dev');
console.log(''); 