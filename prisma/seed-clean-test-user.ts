import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creating clean test user...');

  try {
    // Create a fresh test organization
    const testOrganization = await prisma.organization.upsert({
      where: { domain: 'testuser.riscura.com' },
      update: {},
      create: {
        name: 'Test User Organization',
        domain: 'testuser.riscura.com',
        plan: 'pro',
        isActive: true,
        settings: {
          riskMatrixSize: 5,
          defaultRiskCategories: ['Operational', 'Financial', 'Strategic', 'Compliance', 'Technology'],
          allowGuestAccess: false,
          requireTwoFactor: false,
        },
      },
    });

    console.log(`✅ Test organization created: ${testOrganization.name}`);

    // Create a clean test user with no pre-built data
    const testUserPassword = await bcrypt.hash('TestUser123!', 12);
    const testUser = await prisma.user.upsert({
      where: { email: 'testuser@riscura.com' },
      update: {},
      create: {
        email: 'testuser@riscura.com',
        firstName: 'Test',
        lastName: 'User',
        passwordHash: testUserPassword,
        role: 'RISK_MANAGER',
        permissions: ['READ', 'WRITE', 'DELETE'],
        isActive: true,
        emailVerified: new Date(),
        organizationId: testOrganization.id,
      },
    });

    console.log(`✅ Clean test user created: ${testUser.email}`);

    console.log('🎉 Clean test user setup completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   • Organization: ${testOrganization.name}`);
    console.log(`   • Test User: ${testUser.email}`);
    console.log('\n🔐 Test User Login Credentials:');
    console.log('   • Email: testuser@riscura.com');
    console.log('   • Password: TestUser123!');
    console.log('\n📝 Notes:');
    console.log('   • This user has no pre-built risks, controls, or documents');
    console.log('   • Perfect for testing feature creation from scratch');
    console.log('   • Has MANAGER role with full permissions');

  } catch (error) {
    console.error('❌ Error creating clean test user:', error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Clean test user creation failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  }); 