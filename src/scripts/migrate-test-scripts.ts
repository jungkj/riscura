#!/usr/bin/env node

/**
 * Migration script to create test scripts schema
 * Run with: npx tsx src/scripts/migrate-test-scripts.ts
 *
 * Options:
 *   --org-id <id>    Organization ID to use for test data (optional)
 *   --skip-test      Skip creating test data
 */

import { execSync } from 'child_process';
import { db } from '@/lib/db';

// Parse command line arguments
const args = process.argv.slice(2);
const orgIdIndex = args.indexOf('--org-id');
const skipTest = args.includes('--skip-test');
const organizationId = orgIdIndex !== -1 && args[orgIdIndex + 1] ? args[orgIdIndex + 1] : null;

async function runMigration() {
  // console.log('🚀 Starting test scripts migration...\n');

  try {
    // 1. Generate Prisma client
    // console.log('📦 Generating Prisma client...');
    execSync('npm run db:generate', { stdio: 'inherit' });

    // 2. Push schema changes to database
    // console.log('\n🔄 Pushing schema changes to database...');
    execSync('npm run db:push', { stdio: 'inherit' });

    // 3. Verify new models exist
    // console.log('\n✅ Verifying migration...');

    if (!skipTest) {
      // Determine organization ID for test data
      let testOrgId = organizationId;

      if (!testOrgId) {
        // Try to find an existing organization
        const existingOrg = await db.organization.findFirst({
          select: { id: true, name: true },
        });

        if (existingOrg) {
          testOrgId = existingOrg.id;
          // console.log(`📋 Using existing organization: ${existingOrg.name} (${existingOrg.id})`);
        } else {
          // Create a test organization if none exists
          // console.log('📋 No organization found. Creating test organization...');
          const testOrg = await db.organization.create({
            data: {
              name: 'Test Organization - Migration',
              plan: 'free',
              isActive: true,
            },
          });
          testOrgId = testOrg.id;
          // console.log(`✅ Created test organization: ${testOrg.name} (${testOrg.id})`);
        }
      }

      // Test creating a sample test script
      const testScript = await db.testScript.create({
        data: {
          title: 'Sample Test Script - Migration Verification',
          description: 'This is a sample test script created during migration to verify the schema',
          steps: [
            {
              id: '1',
              order: 1,
              description: 'Verify test script model exists',
              expectedResult: 'Model created successfully',
              dataRequired: 'None',
              notes: 'Migration verification step',
            },
          ],
          expectedResults: 'Test script model functioning correctly',
          testType: 'MANUAL',
          frequency: 'AD_HOC',
          estimatedDuration: 5,
          automationCapable: false,
          tags: ['migration', 'verification'],
          organizationId: testOrgId,
        },
      });

      // console.log('✅ Test script created:', testScript.id);

      // Clean up
      await db.testScript.delete({
        where: { id: testScript.id },
      });

      // console.log('🧹 Test data cleaned up');
    } else {
      // console.log('⏭️  Skipping test data creation (--skip-test flag used)');
    }

    // console.log('\n🎉 Migration completed successfully!');
    // console.log('\nNext steps:');
    // console.log('1. Run the application to test the new RCSA spreadsheet');
    // console.log('2. Create test scripts for your controls');
    // console.log('3. Use AI generation to quickly build test scripts');
  } catch (error) {
    // console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

// Run the migration
runMigration().catch(console.error);
