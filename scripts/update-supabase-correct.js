#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Updating Supabase Configuration...');
console.log('');

// Correct credentials from your input
const SUPABASE_PROJECT_REF = 'zggstcxinvxsfksssdyr'; // From the URL you provided
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
  
  // Update DATABASE_URL with direct connection
  envContent = envContent.replace(
    /DATABASE_URL="[^"]*"/g,
    `DATABASE_URL="postgresql://postgres:${SUPABASE_PASSWORD}@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres"`
  );

  // Update DIRECT_URL with direct connection
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
console.log('📡 Updated Configuration:');
console.log(`  Project Reference: ${SUPABASE_PROJECT_REF}`);
console.log(`  Project URL: ${SUPABASE_URL}`);
console.log(`  Password: ${SUPABASE_PASSWORD}`);
console.log('');
console.log('🔗 Connection Strings:');
console.log(`  DATABASE_URL: postgresql://postgres:****@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres`);
console.log(`  DIRECT_URL: postgresql://postgres:****@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres`);
console.log('');
console.log('🚀 Testing connection...');
console.log(''); 