/**
 * Test script to validate billing system functionality
 * Run with: npx tsx src/scripts/test-billing.ts
 */

import { db } from '@/lib/db';
import { billingManager } from '@/lib/billing/manager';
import { seedSubscriptionPlans, createDefaultSubscriptionForOrganization } from '@/lib/billing/seed-plans';

async function testBillingSystem() {
  console.log('🚀 Testing Billing System...\n');

  try {
    // 1. Seed subscription plans
    console.log('1. Seeding subscription plans...');
    await seedSubscriptionPlans();
    
    // 2. Fetch and display plans
    console.log('\n2. Fetching subscription plans...');
    const plans = await billingManager.getSubscriptionPlans();
    console.log(`Found ${plans.length} plans:`);
    plans.forEach(plan => {
      console.log(`  - ${plan.name}: $${plan.price}/${plan.billingInterval}`);
      console.log(`    Features: ${plan.features.filter(f => f.included).length}/${plan.features.length}`);
      console.log(`    Users: ${plan.limits.users === -1 ? 'Unlimited' : plan.limits.users}`);
      console.log(`    Risks: ${plan.limits.risks === -1 ? 'Unlimited' : plan.limits.risks}`);
    });

    // 3. Find or create a test organization
    let testOrg = await db.client.organization.findFirst({
      where: { name: 'Test Organization' }
    });

    if (!testOrg) {
      console.log('\n3. Creating test organization...');
      testOrg = await db.client.organization.create({
        data: {
          name: 'Test Organization',
          domain: 'test.example.com',
          plan: 'free',
          isActive: true,
        }
      });
      console.log(`Created test organization: ${testOrg.id}`);
    } else {
      console.log(`\n3. Using existing test organization: ${testOrg.id}`);
    }

    // 4. Create default subscription for organization
    console.log('\n4. Creating default subscription...');
    await createDefaultSubscriptionForOrganization(testOrg.id);

    // 5. Test subscription retrieval
    console.log('\n5. Testing subscription retrieval...');
    const subscription = await billingManager.getActiveSubscription(testOrg.id);
    if (subscription) {
      console.log(`✅ Active subscription found:`);
      console.log(`   Plan ID: ${subscription.planId}`);
      console.log(`   Status: ${subscription.status}`);
      console.log(`   Period: ${subscription.currentPeriodStart} - ${subscription.currentPeriodEnd}`);
    } else {
      console.log('❌ No active subscription found');
    }

    // 6. Test usage tracking
    console.log('\n6. Testing usage tracking...');
    await billingManager.trackUsage(testOrg.id, 'aiQueries', 5, { feature: 'test' });
    console.log('✅ Usage tracked successfully');

    // 7. Test plan analytics
    console.log('\n7. Testing billing analytics...');
    const analytics = await billingManager.getBillingAnalytics(testOrg.id);
    console.log(`✅ Analytics retrieved:`);
    console.log(`   Total revenue: $${analytics.revenue.total}`);
    console.log(`   Active subscriptions: ${analytics.subscriptions.active}`);
    console.log(`   Total customers: ${analytics.customers.total}`);

    console.log('\n🎉 Billing system test completed successfully!');

  } catch (error) {
    console.error('❌ Billing system test failed:', error);
    process.exit(1);
  }
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Remove test organization and related data
    const testOrg = await db.client.organization.findFirst({
      where: { name: 'Test Organization' }
    });

    if (testOrg) {
      // Delete related records first (due to foreign key constraints)
      await db.client.organizationSubscription.deleteMany({
        where: { organizationId: testOrg.id }
      });
      
      await db.client.usageRecord.deleteMany({
        where: { organizationId: testOrg.id }
      });

      await db.client.organization.delete({
        where: { id: testOrg.id }
      });

      console.log('✅ Test organization cleaned up');
    }

    // Optionally clean up test plans (uncomment if needed)
    // await db.client.subscriptionPlan.deleteMany();
    // console.log('✅ Test plans cleaned up');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

// Main execution
async function main() {
  const command = process.argv[2];

  if (command === 'cleanup') {
    await cleanup();
  } else {
    await testBillingSystem();
  }

  await db.client.$disconnect();
}

main().catch(console.error);