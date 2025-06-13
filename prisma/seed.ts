import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Create default organization
    const organization = await prisma.organization.upsert({
      where: { domain: 'riscura.com' },
      update: {},
      create: {
        name: 'Riscura Demo Organization',
        domain: 'riscura.com',
        plan: 'enterprise',
        isActive: true,
        settings: {
          riskMatrixSize: 5,
          defaultRiskCategories: ['Operational', 'Financial', 'Strategic', 'Compliance', 'Technology'],
        },
      },
    });

    console.log(`✅ Organization created: ${organization.name}`);

    // Create admin user
    const adminPasswordHash = await bcrypt.hash('Admin123!', 12);
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@riscura.com' },
      update: {},
      create: {
        email: 'admin@riscura.com',
        firstName: 'System',
        lastName: 'Administrator',
        passwordHash: adminPasswordHash,
        role: 'ADMIN',
        permissions: ['ALL'],
        isActive: true,
        emailVerified: new Date(),
        organizationId: organization.id,
      },
    });

    console.log(`✅ Admin user created: ${adminUser.email}`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   • Organization: ${organization.name}`);
    console.log(`   • Admin User: ${adminUser.email}`);
    console.log('\n🔐 Default Login Credentials:');
    console.log('   • Admin: admin@riscura.com / Admin123!');

  } catch (error) {
    console.error('❌ Error during database seeding:', error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  }); 