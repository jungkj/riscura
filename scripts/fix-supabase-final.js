#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Fixing Supabase Connection with Correct Project Reference...');
console.log('');

// Correct credentials from Supabase dashboard
const SUPABASE_PROJECT_REF = 'zggstcxinvxsfksssdyr'; // Correct reference with 'xsfk'
const SUPABASE_PASSWORD = 'Gynaha2pf!123';
const SUPABASE_URL = 'https://zggstcxinvxsfksssdyr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnZ3N0Y3hpbnZ4c2Zrc3NzZHlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTg3ODUsImV4cCI6MjA2NTgzNDc4NX0.IiuBpHnDdZ4c7zIn4yCH96TpR0UTFiFdUCRyLj7LvUg';

// Function to update environment file
function updateEnvFile(filePath, fileName) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ${fileName} not found, skipping...`);
    return;
  }

  let envContent = fs.readFileSync(filePath, 'utf8');
  
  // Update DATABASE_URL (using pooler for better connection handling)
  envContent = envContent.replace(
    /DATABASE_URL="[^"]*"/g,
    `DATABASE_URL="postgresql://postgres.${SUPABASE_PROJECT_REF}:${SUPABASE_PASSWORD}@aws-0-us-west-1.pooler.supabase.com:6543/postgres"`
  );

  // Update DIRECT_URL (using direct connection)
  envContent = envContent.replace(
    /DIRECT_URL="[^"]*"/g,
    `DIRECT_URL="postgresql://postgres:${SUPABASE_PASSWORD}@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres"`
  );

  // Update Supabase URL
  envContent = envContent.replace(
    /NEXT_PUBLIC_SUPABASE_URL="[^"]*"/g,
    `NEXT_PUBLIC_SUPABASE_URL="${SUPABASE_URL}"`
  );

  // Update Supabase Anon Key
  envContent = envContent.replace(
    /NEXT_PUBLIC_SUPABASE_ANON_KEY="[^"]*"/g,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY}"`
  );

  // Add missing variables if they don't exist
  if (!envContent.includes('NEXT_PUBLIC_SUPABASE_URL=')) {
    envContent += `\nNEXT_PUBLIC_SUPABASE_URL="${SUPABASE_URL}"`;
  }
  if (!envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
    envContent += `\nNEXT_PUBLIC_SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY}"`;
  }

  fs.writeFileSync(filePath, envContent);
  console.log(`✅ Updated ${fileName}`);
}

// Update both .env and .env.local files
const envPath = path.join(process.cwd(), '.env');
const envLocalPath = path.join(process.cwd(), '.env.local');

updateEnvFile(envPath, '.env');
updateEnvFile(envLocalPath, '.env.local');

console.log('');
console.log('📡 Connection Details:');
console.log(`  Project Reference: ${SUPABASE_PROJECT_REF}`);
console.log(`  Password: ${SUPABASE_PASSWORD}`);
console.log(`  URL: ${SUPABASE_URL}`);
console.log('');
console.log('🔗 Updated Connection Strings:');
console.log(`  DATABASE_URL: postgresql://postgres.${SUPABASE_PROJECT_REF}:****@aws-0-us-west-1.pooler.supabase.com:6543/postgres`);
console.log(`  DIRECT_URL: postgresql://postgres:****@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres`);
console.log('');
console.log('🚀 Next steps:');
console.log('1. Run: npx prisma db push');
console.log('2. Run: npm run db:seed');
console.log('3. Run: npm run create:test-user');
console.log('4. Run: npm run dev');
console.log('');
console.log('🔐 Test User Credentials:');
console.log('  Email: testuser@riscura.com');
console.log('  Password: test123');
console.log(''); 