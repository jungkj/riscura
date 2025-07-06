import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting simple database seed...');

  // Clean existing data
  await prisma.session.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.organization.deleteMany({});

  console.log('🧹 Cleaned existing data');

  // Create default organization
  const organization = await prisma.organization.create({
    data: {
      name: 'Riscura Admin Organization',
      domain: 'admin.riscura.com',
      plan: 'enterprise',
      isActive: true,
      settings: {
        features: {
          aiInsights: true,
          advancedReporting: true,
          customWorkflows: true,
          apiAccess: true,
        },
        branding: {
          primaryColor: '#3b82f6',
          logo: null,
        },
        security: {
          mfaRequired: false,
          passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSymbols: false,
          },
        },
      },
    },
  });

  console.log(`✅ Created organization: ${organization.name}`);

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@riscura.com',
      firstName: 'Admin',
      lastName: 'User',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      isActive: true,
      emailVerified: new Date(),
      organizationId: organization.id,
      permissions: [
        'manage_users',
        'manage_risks',
        'manage_controls',
        'manage_documents',
        'manage_workflows',
        'manage_reports',
        'manage_organization',
        'view_analytics',
        'export_data',
        'manage_integrations',
      ],
    },
  });

  console.log(`✅ Created admin user: ${adminUser.email}`);

  // Create notification preferences for admin user
  await prisma.notificationPreference.create({
    data: {
      userId: adminUser.id,
      email: true,
      push: true,
      inApp: true,
      digest: 'DAILY',
      categories: {
        risks: true,
        compliance: true,
        reports: true,
        riskAlerts: true,
        controlReminders: true,
        reportGeneration: true,
        systemUpdates: true,
      },
      quietHours: {
        enabled: false,
        start: "22:00",
        end: "08:00",
        timezone: "UTC",
      },
    },
  });

  console.log('✅ Created notification preferences for admin user');

  console.log('🎉 Database seed completed successfully!');
  console.log('');
  console.log('📋 Admin Login Credentials:');
  console.log('   Email: admin@riscura.com');
  console.log('   Password: admin123');
  console.log('');
  console.log('🏢 Organization: Riscura Admin Organization');
  console.log('');
  console.log('🚀 You can now start the application and login with these credentials!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 