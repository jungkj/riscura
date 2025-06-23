#!/usr/bin/env node

import { execSync } from 'child_process';

console.log('🌱 Seeding clean test user...');

try {
  // Run the Prisma seed command for clean test user
  execSync('npx tsx prisma/seed-clean-test-user.ts', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('✅ Clean test user seeded successfully!');
  console.log('📧 Email: testuser@riscura.com');
  console.log('🔑 Password: TestUser123!');
  console.log('🏢 Organization: Test User Organization');
  
} catch (error) {
  console.error('❌ Error seeding clean test user:', error.message);
  process.exit(1);
} 