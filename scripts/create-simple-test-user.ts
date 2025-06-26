import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createSimpleTestUser() {
  try {
    console.log('Creating simple test user...');

    // Check if organization exists, create if not
    let organization = await prisma.organization.findFirst({
      where: { name: 'Test Organization' }
    });

    if (!organization) {
      organization = await prisma.organization.create({
        data: {
          name: 'Test Organization',
          domain: 'test-org.com',
          plan: 'free',
          isActive: true,
          settings: {}
        }
      });
      console.log('Organization created:', organization.id);
    } else {
      console.log('Using existing organization:', organization.id);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('test123', 12);

    // Delete existing user if exists
    await prisma.user.deleteMany({
      where: { email: 'testuser@riscura.com' }
    });

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

    console.log('\n✅ Test user created successfully!');
    console.log('\nLogin credentials:');
    console.log('Email: testuser@riscura.com');
    console.log('Password: test123');

  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSimpleTestUser(); 