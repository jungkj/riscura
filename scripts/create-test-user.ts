import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUser() {
  console.log('🔧 Creating new test user...');

  try {
    // Find the existing organization
    const organization = await prisma.organization.findFirst({
      where: { domain: 'riscura.com' }
    });

    if (!organization) {
      console.error('❌ No organization found. Please run the seed script first.');
      return;
    }

    // Create test user credentials
    const testUserEmail = 'testuser@riscura.com';
    const testUserPassword = 'TestUser123!';
    const passwordHash = await bcrypt.hash(testUserPassword, 12);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: testUserEmail }
    });

    if (existingUser) {
      console.log(`⚠️  User ${testUserEmail} already exists. Updating...`);
      
      // Update existing user
      const updatedUser = await prisma.user.update({
        where: { email: testUserEmail },
        data: {
          firstName: 'Test',
          lastName: 'User',
          passwordHash: passwordHash,
          role: 'RISK_MANAGER',
          permissions: [
            'risks:read',
            'risks:write',
            'risks:delete',
            'controls:read',
            'controls:write',
            'controls:delete',
            'assessments:read',
            'assessments:write',
            'documents:read',
            'documents:write',
            'reports:read',
            'reports:write',
            'ai:access',
            'dashboard:access'
          ],
          isActive: true,
          emailVerified: new Date(),
          lastLogin: new Date()
        }
      });

      console.log(`✅ Test user updated: ${updatedUser.email}`);
    } else {
      // Create new user
      const newUser = await prisma.user.create({
        data: {
          email: testUserEmail,
          firstName: 'Test',
          lastName: 'User',
          passwordHash: passwordHash,
          role: 'RISK_MANAGER',
          permissions: [
            'risks:read',
            'risks:write',
            'risks:delete',
            'controls:read',
            'controls:write',
            'controls:delete',
            'assessments:read',
            'assessments:write',
            'documents:read',
            'documents:write',
            'reports:read',
            'reports:write',
            'ai:access',
            'dashboard:access'
          ],
          isActive: true,
          emailVerified: new Date(),
          organizationId: organization.id
        }
      });

      console.log(`✅ Test user created: ${newUser.email}`);
    }

    console.log('\n🎉 Test user setup completed!');
    console.log('\n📋 Test User Credentials:');
    console.log(`   • Email: ${testUserEmail}`);
    console.log(`   • Password: ${testUserPassword}`);
    console.log(`   • Role: RISK_MANAGER`);
    console.log(`   • Organization: ${organization.name}`);
    console.log('\n🔐 You can now login with these credentials to test all features!');

  } catch (error) {
    console.error('❌ Error creating test user:', error);
    throw error;
  }
}

createTestUser()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Failed to create test user:', e);
    await prisma.$disconnect();
    process.exit(1);
  }); 