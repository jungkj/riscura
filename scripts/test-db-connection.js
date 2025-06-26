#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  console.log('🔍 Testing database connection...');
  
  try {
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database query successful:', result);
    
    await prisma.$disconnect();
    console.log('✅ Connection closed successfully');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    if (error.message.includes('password authentication failed')) {
      console.log('\n💡 The password might be incorrect. Please check your Supabase database password.');
    } else if (error.message.includes("Can't reach database server")) {
      console.log('\n💡 The database server is not reachable. This could be due to:');
      console.log('   - Incorrect database URL');
      console.log('   - Network connectivity issues');
      console.log('   - Supabase project not active');
    }
    
    console.log('\n🔗 Check your Supabase project: https://supabase.com/dashboard/project/zggstcxinvxsfksssdyr');
  }
}

testConnection(); 