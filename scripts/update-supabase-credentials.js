#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Updating Supabase credentials...');

// Your provided credentials
const SUPABASE_PROJECT_REF = 'zggstcxinvxsksssdyr';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnZ3N0Y3hpbnZ4c2Zrc3NzZHlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTg3ODUsImV4cCI6MjA2NTgzNDc4NX0.IiuBpHnDdZ4c7zIn4yCH96TpR0UTFiFdUCRyLj7LvUg';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnZ3N0Y3hpbnZ4c2Zrc3NzZHlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI1ODc4NSwiZXhwIjoyMDY1ODM0Nzg1fQ.l2EKRvndZ0Ur6x97wzfIlYcEDrw9RX3cBTYO0PQ5vhc';

// Read the current .env.local file
const envPath = path.join(process.cwd(), '.env.local');
let envContent = fs.readFileSync(envPath, 'utf8');

console.log('⚠️  IMPORTANT: You need to get your database password from Supabase!');
console.log('');
console.log('📋 To get your database password:');
console.log('1. Go to https://supabase.com/dashboard/project/zggstcxinvxsksssdyr');
console.log('2. Go to Settings > Database');
console.log('3. Copy the password from the connection string');
console.log('4. Replace [YOUR-PASSWORD] in the .env.local file');
console.log('');

// Update the known values
envContent = envContent.replace(
  /DATABASE_URL="postgresql:\/\/postgres:\[YOUR-PASSWORD\]@db\.\[YOUR-PROJECT-REF\]\.supabase\.co:5432\/postgres"/g,
  `DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres"`
);

envContent = envContent.replace(
  /DIRECT_URL="postgresql:\/\/postgres:\[YOUR-PASSWORD\]@db\.\[YOUR-PROJECT-REF\]\.supabase\.co:5432\/postgres"/g,
  `DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres"`
);

envContent = envContent.replace(
  /NEXT_PUBLIC_SUPABASE_URL="https:\/\/\[YOUR-PROJECT-REF\]\.supabase\.co"/g,
  `NEXT_PUBLIC_SUPABASE_URL="https://${SUPABASE_PROJECT_REF}.supabase.co"`
);

envContent = envContent.replace(
  /NEXT_PUBLIC_SUPABASE_ANON_KEY="\[YOUR-ANON-KEY\]"/g,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY}"`
);

envContent = envContent.replace(
  /SUPABASE_SERVICE_ROLE_KEY="\[YOUR-SERVICE-ROLE-KEY\]"/g,
  `SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"`
);

// Write the updated content back
fs.writeFileSync(envPath, envContent);

console.log('✅ Updated .env.local with your Supabase credentials!');
console.log('');
console.log('🔑 Next steps:');
console.log('1. Get your database password from Supabase dashboard');
console.log('2. Replace [YOUR-PASSWORD] in .env.local with your actual password');
console.log('3. Run: npx prisma db push');
console.log('4. Run: npm run db:seed');
console.log('5. Run: npm run create:test-user');
console.log('6. Run: npm run dev');
console.log('');
console.log('🔗 Supabase Dashboard: https://supabase.com/dashboard/project/zggstcxinvxsksssdyr'); 