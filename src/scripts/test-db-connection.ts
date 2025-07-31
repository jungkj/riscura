import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testDatabaseConnection() {
  console.log('🔍 Testing Supabase PostgreSQL connection...\n');

  try {
    // Test 1: Basic connection
    console.log('1️⃣ Testing basic connection...');
    await prisma.$connect();
    console.log('✅ Successfully connected to Supabase PostgreSQL!\n');

    // Test 2: Query database version
    console.log('2️⃣ Checking database version...');
    const result = await prisma.$queryRaw<Array<{ version: string }>>`SELECT version()`;
    console.log('✅ Database version:', result[0].version, '\n');

    // Test 3: Count records in main tables
    console.log('3️⃣ Checking record counts...');
    const counts = {
      organizations: await prisma.organization.count(),
      users: await prisma.user.count(),
      risks: await prisma.risk.count(),
      controls: await prisma.control.count(),
      documents: await prisma.document.count(),
      chatChannels: await prisma.chatChannel.count(),
      chatMessages: await prisma.chatMessage.count(),
    };

    console.log('📊 Record counts:');
    Object.entries(counts).forEach(([table, count]) => {
      console.log(`   ${table}: ${count}`);
    });
    console.log();

    // Test 4: Check if we can create and delete a test record
    console.log('4️⃣ Testing write operations...');
    const testOrg = await prisma.organization.create({
      data: {
        name: 'Test Organization - Delete Me',
        plan: 'free',
      },
    });
    console.log('✅ Created test organization:', testOrg.id);

    await prisma.organization.delete({
      where: { id: testOrg.id },
    });
    console.log('✅ Successfully deleted test organization\n');

    // Test 5: Check database size (Supabase free tier limit is 500MB)
    console.log('5️⃣ Checking database size...');
    const dbSize = await prisma.$queryRaw<Array<{ db_size: string }>>`
      SELECT pg_database_size(current_database())::bigint / 1024 / 1024 || ' MB' as db_size
    `;
    console.log('💾 Current database size:', dbSize[0].db_size);
    console.log('📝 Note: Supabase free tier limit is 500MB\n');

    // Test 6: Check connection pool
    console.log('6️⃣ Connection pool status...');
    const poolStatus = await prisma.$queryRaw<Array<{ connections: number }>>`
      SELECT count(*) as connections 
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `;
    console.log('🔗 Active connections:', poolStatus[0].connections);
    console.log('📝 Note: Supabase free tier connection limit is 60\n');

    console.log('✅ All database tests passed successfully!');
    console.log('\n📌 Supabase Free Tier Limits:');
    console.log('   - Database size: 500MB');
    console.log('   - File storage: 1GB');
    console.log('   - Bandwidth: 2GB/month');
    console.log('   - Edge functions: 500K invocations/month');
    console.log('   - Realtime: 200 concurrent connections');
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection();
