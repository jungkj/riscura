import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding test organization and user...');

  try {
    // Create test organization
    const organization = await prisma.organization.upsert({
      where: { id: 'dev-org-123' },
      update: {
        name: 'Test Organization',
        isActive: true
      },
      create: {
        id: 'dev-org-123',
        name: 'Test Organization',
        domain: 'test-org-dev.com',
        plan: 'free',
        isActive: true,
        settings: {
          maxUsers: 10,
          maxRisks: 1000,
          maxControls: 1000,
          features: ['basic']
        }
      }
    });

    console.log('✅ Created/updated organization:', organization.id);

    // Create test user
    const user = await prisma.user.upsert({
      where: { id: 'dev-user-123' },
      update: {
        organizationId: 'dev-org-123'
      },
      create: {
        id: 'dev-user-123',
        email: 'testuser@riscura.com',
        firstName: 'Test',
        lastName: 'User',
        passwordHash: '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36IZeL4uxwu25J7x8S73N9K', // test123
        organizationId: 'dev-org-123',
        role: 'ADMIN',
        isActive: true,
        emailVerified: new Date()
      }
    });

    console.log('✅ Created/updated user:', user.email);

    // Create some test risks
    const risk1 = await prisma.risk.upsert({
      where: { id: 'test-risk-1' },
      update: {},
      create: {
        id: 'test-risk-1',
        title: 'Data Breach Risk',
        description: 'Risk of unauthorized access to sensitive customer data',
        category: 'OPERATIONAL',
        likelihood: 3,
        impact: 4,
        riskScore: 12,
        riskLevel: 'HIGH',
        status: 'IDENTIFIED',
        owner: 'dev-user-123',
        organizationId: 'dev-org-123',
        createdBy: 'dev-user-123',
        dateIdentified: new Date()
      }
    });

    const risk2 = await prisma.risk.upsert({
      where: { id: 'test-risk-2' },
      update: {},
      create: {
        id: 'test-risk-2',
        title: 'Compliance Violation',
        description: 'Risk of non-compliance with GDPR regulations',
        category: 'COMPLIANCE',
        likelihood: 2,
        impact: 5,
        riskScore: 10,
        riskLevel: 'MEDIUM',
        status: 'ASSESSED',
        owner: 'dev-user-123',
        organizationId: 'dev-org-123',
        createdBy: 'dev-user-123',
        dateIdentified: new Date()
      }
    });

    console.log('✅ Created test risks');

    // Create some test controls
    const control1 = await prisma.control.upsert({
      where: { id: 'test-control-1' },
      update: {},
      create: {
        id: 'test-control-1',
        title: 'Access Control Review',
        description: 'Regular review of user access permissions',
        type: 'PREVENTIVE',
        category: 'OPERATIONAL',
        frequency: 'MONTHLY',
        automationLevel: 'MANUAL',
        effectiveness: 85,
        owner: 'dev-user-123',
        status: 'ACTIVE',
        priority: 'HIGH',
        organizationId: 'dev-org-123',
        createdBy: 'dev-user-123'
      }
    });

    const control2 = await prisma.control.upsert({
      where: { id: 'test-control-2' },
      update: {},
      create: {
        id: 'test-control-2',
        title: 'Data Encryption',
        description: 'Encryption of sensitive data at rest and in transit',
        type: 'PREVENTIVE',
        category: 'TECHNICAL',
        frequency: 'CONTINUOUS',
        automationLevel: 'FULLY_AUTOMATED',
        effectiveness: 95,
        owner: 'dev-user-123',
        status: 'ACTIVE',
        priority: 'CRITICAL',
        organizationId: 'dev-org-123',
        createdBy: 'dev-user-123'
      }
    });

    console.log('✅ Created test controls');

    // Create control-risk mappings
    await prisma.controlRiskMapping.upsert({
      where: {
        riskId_controlId: {
          controlId: 'test-control-1',
          riskId: 'test-risk-1'
        }
      },
      update: {},
      create: {
        controlId: 'test-control-1',
        riskId: 'test-risk-1',
        effectiveness: 80
      }
    });

    await prisma.controlRiskMapping.upsert({
      where: {
        riskId_controlId: {
          controlId: 'test-control-2',
          riskId: 'test-risk-1'
        }
      },
      update: {},
      create: {
        controlId: 'test-control-2',
        riskId: 'test-risk-1',
        effectiveness: 90
      }
    });

    console.log('✅ Created control-risk mappings');
    console.log('🎉 Test data seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });