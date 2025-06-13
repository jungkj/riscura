#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const requiredIndexes = [
  // User and organization indexes
  'CREATE INDEX IF NOT EXISTS idx_users_organization_email ON "User"("organizationId", "email");',
  'CREATE INDEX IF NOT EXISTS idx_users_active ON "User"("isActive", "createdAt");',
  
  // Risk indexes
  'CREATE INDEX IF NOT EXISTS idx_risks_organization_created ON "Risk"("organizationId", "createdAt");',
  'CREATE INDEX IF NOT EXISTS idx_risks_organization_severity ON "Risk"("organizationId", "severity");',
  'CREATE INDEX IF NOT EXISTS idx_risks_status ON "Risk"("status", "updatedAt");',
  
  // Control indexes
  'CREATE INDEX IF NOT EXISTS idx_controls_organization_status ON "Control"("organizationId", "status");',
  'CREATE INDEX IF NOT EXISTS idx_controls_type ON "Control"("type", "createdAt");',
  
  // Document indexes
  'CREATE INDEX IF NOT EXISTS idx_documents_organization_type ON "Document"("organizationId", "type");',
  'CREATE INDEX IF NOT EXISTS idx_documents_status ON "Document"("status", "uploadedAt");',
  
  // Activity indexes
  'CREATE INDEX IF NOT EXISTS idx_activities_user_created ON "Activity"("userId", "createdAt");',
  'CREATE INDEX IF NOT EXISTS idx_activities_organization_type ON "Activity"("organizationId", "type");',
  
  // Session indexes
  'CREATE INDEX IF NOT EXISTS idx_sessions_user_expires ON "Session"("userId", "expiresAt");',
  'CREATE INDEX IF NOT EXISTS idx_sessions_active ON "Session"("expiresAt") WHERE "expiresAt" > NOW();',
];

async function createOptimizationIndexes() {
  console.log('🏗️ Creating database optimization indexes...\n');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const indexSql of requiredIndexes) {
    try {
      await prisma.$executeRawUnsafe(indexSql);
      const indexName = indexSql.split(' ')[5] || 'unknown';
      console.log(`✅ Created index: ${indexName}`);
      successCount++;
    } catch (error) {
      console.warn(`⚠️ Index creation failed: ${error.message}`);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Index Creation Summary:`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ⚠️ Failed: ${errorCount}`);
  console.log(`   📝 Total: ${requiredIndexes.length}`);
  
  // Analyze table sizes
  console.log('\n📈 Database Analysis:');
  try {
    const tables = ['User', 'Risk', 'Control', 'Document', 'Activity', 'Session'];
    
    for (const table of tables) {
      try {
        const count = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${table}"`);
        console.log(`   ${table}: ${count[0].count} records`);
      } catch (error) {
        console.log(`   ${table}: Table not found or error`);
      }
    }
  } catch (error) {
    console.warn('Could not analyze table sizes:', error.message);
  }
  
  console.log('\n🚀 Performance Recommendations:');
  console.log('   • Monitor slow queries with query logging');
  console.log('   • Consider connection pooling for high traffic');
  console.log('   • Implement query result caching');
  console.log('   • Regular VACUUM and ANALYZE for PostgreSQL');
  console.log('   • Monitor index usage and remove unused indexes');
  
  console.log('\n✅ Database optimization completed!');
}

async function main() {
  try {
    await createOptimizationIndexes();
  } catch (error) {
    console.error('❌ Database optimization failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { createOptimizationIndexes }; 