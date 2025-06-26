import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUserWithSubscription() {
  try {
    console.log('Creating test user with subscription...');

    // Create organization
    const organization = await prisma.organization.create({
      data: {
        name: 'Test Organization',
        domain: 'test-org.com',
        plan: 'free',
        isActive: true,
        settings: {}
      }
    });

    console.log('Organization created:', organization.id);

    // Hash password
    const hashedPassword = await bcrypt.hash('test123', 12);

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'testuser@riscura.com',
        passwordHash: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'USER',
        organizationId: organization.id,
        isActive: true,
        permissions: ['read:risks', 'write:risks', 'read:controls', 'write:controls']
      }
    });

    console.log('User created:', user.id);

    // Create a trial subscription
    const subscription = await prisma.organizationSubscription.create({
      data: {
        organizationId: organization.id,
        stripeSubscriptionId: 'sub_test_trial_123',
        status: 'TRIALING',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      }
    });

    console.log('Subscription created:', subscription.id);

    console.log('\n✅ Test user with subscription created successfully!');
    console.log('\nLogin credentials:');
    console.log('Email: testuser@riscura.com');
    console.log('Password: test123');
    console.log('\nSubscription status: TRIALING (14 days remaining)');

  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUserWithSubscription(); 