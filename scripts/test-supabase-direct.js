#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

console.log('🔍 Testing Supabase Connection Directly...');
console.log('');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  try {
    console.log('📡 Attempting to connect to Supabase...');
    
    // Test with a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Connection successful!');
    console.log('Result:', result);
    
    // Test if we can access the database
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('📋 Available tables:', tables.map(t => t.table_name));
    
  } catch (error) {
    console.log('❌ Connection failed!');
    console.log('Error type:', error.constructor.name);
    console.log('Error message:', error.message);
    console.log('');
    
    if (error.message.includes('FATAL: Tenant or user not found')) {
      console.log('🔧 This error typically means:');
      console.log('   1. Your Supabase project is paused/hibernating');
      console.log('   2. The database password is incorrect');
      console.log('   3. The project reference in the username is wrong');
      console.log('');
      console.log('💡 Solutions:');
      console.log('   1. Go to https://supabase.com/dashboard/project/zggstcxinvxsksssdyr');
      console.log('   2. Wake up the project if it\'s paused');
      console.log('   3. Go to Settings > Database');
      console.log('   4. Copy the exact connection string');
      console.log('   5. Regenerate the database password if needed');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testConnection(); 