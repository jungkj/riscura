import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUser() {
  console.log('🔧 Creating new test user for Supabase...');

  try {
    // Find or create organization
    let organization = await prisma.organization.findFirst({
      where: { domain: 'riscura.com' }
    });

    if (!organization) {
      console.log('📝 Creating organization...');
      organization = await prisma.organization.create({
        data: {
          name: 'Riscura Demo Organization',
          domain: 'riscura.com',
          plan: 'enterprise',
          isActive: true,
          settings: {
            enableAI: true,
            enableBilling: false,
            enableRealTimeCollaboration: true
          }
        }
      });
      console.log('✅ Organization created:', organization.name);
    }

    // Test user credentials
    const testUserEmail = 'testuser@riscura.com';
    const testUserPassword = 'test123';
    const passwordHash = await bcrypt.hash(testUserPassword, 12);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: testUserEmail }
    });

    if (existingUser) {
      console.log('⚠️  Test user already exists. Updating password...');
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { passwordHash }
      });
      console.log('✅ Test user password updated');
    } else {
      console.log('📝 Creating test user...');
      const testUser = await prisma.user.create({
        data: {
          email: testUserEmail,
          passwordHash,
          firstName: 'Test',
          lastName: 'User',
          role: 'ADMIN',
          organizationId: organization.id,
          isActive: true,
          emailVerified: new Date()
        }
      });
      console.log('✅ Test user created:', testUser.email);
    }

    console.log('');
    console.log('🎉 Test User Credentials:');
    console.log('========================');
    console.log('Email: testuser@riscura.com');
    console.log('Password: test123');
    console.log('');
    console.log('🔗 Login URL: http://localhost:3001/auth/login');
    console.log('');

  } catch (error) {
    console.error('❌ Error creating test user:', error);
    console.log('');
    console.log('💡 Make sure you have:');
    console.log('1. Set up Supabase credentials in .env.local');
    console.log('2. Run: npx prisma db push');
    console.log('3. Run: npm run db:seed');
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser(); 