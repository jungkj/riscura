#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Supabase Connection Diagnostics');
console.log('==================================');
console.log('');

// Read current .env file
const envPath = path.join(process.cwd(), '.env');
const envLocalPath = path.join(process.cwd(), '.env.local');

let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}
if (fs.existsSync(envLocalPath)) {
  envContent += '\n' + fs.readFileSync(envLocalPath, 'utf8');
}

// Extract database URLs
const databaseUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/);
const directUrlMatch = envContent.match(/DIRECT_URL="([^"]+)"/);

console.log('📋 Current Configuration:');
console.log('');

if (databaseUrlMatch) {
  const dbUrl = databaseUrlMatch[1];
  console.log('DATABASE_URL found:');
  console.log(`  ${dbUrl.replace(/:[^:@]+@/, ':****@')}`);
  console.log('');
  
  // Parse the URL
  try {
    const url = new URL(dbUrl);
    console.log('URL Components:');
    console.log(`  Protocol: ${url.protocol}`);
    console.log(`  Host: ${url.hostname}`);
    console.log(`  Port: ${url.port}`);
    console.log(`  Database: ${url.pathname}`);
    console.log(`  Username: ${url.username}`);
    console.log(`  Password: ${url.password ? '****' : 'not set'}`);
    console.log('');
  } catch (error) {
    console.log('❌ Invalid DATABASE_URL format');
    console.log('');
  }
} else {
  console.log('❌ DATABASE_URL not found');
  console.log('');
}

if (directUrlMatch) {
  const directUrl = directUrlMatch[1];
  console.log('DIRECT_URL found:');
  console.log(`  ${directUrl.replace(/:[^:@]+@/, ':****@')}`);
  console.log('');
} else {
  console.log('❌ DIRECT_URL not found');
  console.log('');
}

console.log('🔧 Troubleshooting Steps:');
console.log('');
console.log('1. Go to your Supabase dashboard:');
console.log('   https://supabase.com/dashboard/project/zggstcxinvxsksssdyr');
console.log('');
console.log('2. Navigate to Settings > Database');
console.log('');
console.log('3. Copy the "Connection string" from the "Connection pooling" section');
console.log('   It should look like:');
console.log('   postgresql://postgres.zggstcxinvxsksssdyr:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.co:6543/postgres');
console.log('');
console.log('4. Make sure your project is not paused (check the project status)');
console.log('');
console.log('5. If the project is paused, wake it up by visiting the dashboard');
console.log('');
console.log('6. Try regenerating the database password if needed');
console.log('');
console.log('7. Update your .env.local file with the correct connection string');
console.log('');
console.log('💡 Common Issues:');
console.log('   - Project is paused/hibernating');
console.log('   - Wrong password (using JWT secret instead of DB password)');
console.log('   - Wrong project reference in username');
console.log('   - Wrong pooler host');
console.log(''); 