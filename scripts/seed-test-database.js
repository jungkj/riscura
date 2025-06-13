#!/usr/bin/env node

/**
 * Test Database Seeding Script
 * Seeds the test database with consistent data for testing
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db'
    }
  }
});

const testData = {
  organizations: [
    {
      id: 'test-org-1',
      name: 'Test Organization',
      domain: 'test.com',
      plan: 'pro',
      isActive: true,
      settings: {
        riskMatrix: '5x5',
        autoArchiveRisks: false,
        requireApprovalForHighRisks: true,
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        currency: 'USD',
      }
    },
    {
      id: 'test-org-2',
      name: 'Second Test Organization',
      domain: 'test2.com',
      plan: 'enterprise',
      isActive: true,
      settings: {
        riskMatrix: '5x5',
        autoArchiveRisks: true,
        requireApprovalForHighRisks: true,
        timezone: 'EST',
        dateFormat: 'DD/MM/YYYY',
        currency: 'EUR',
      }
    }
  ],
  
  users: [
    {
      id: 'test-user-1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewarnFwk4TCjdHBK', // "password123"
      role: 'USER',
      organizationId: 'test-org-1',
      isActive: true,
      emailVerified: new Date(),
    },
    {
      id: 'test-admin-1',
      email: 'admin@example.com',
      firstName: 'Test',
      lastName: 'Admin',
      passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewarnFwk4TCjdHBK', // "password123"
      role: 'ADMIN',
      organizationId: 'test-org-1',
      isActive: true,
      emailVerified: new Date(),
    },
    {
      id: 'test-risk-manager-1',
      email: 'riskmanager@example.com',
      firstName: 'Risk',
      lastName: 'Manager',
      passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewarnFwk4TCjdHBK', // "password123"
      role: 'RISK_MANAGER',
      organizationId: 'test-org-1',
      isActive: true,
      emailVerified: new Date(),
    },
    {
      id: 'test-auditor-1',
      email: 'auditor@example.com',
      firstName: 'Test',
      lastName: 'Auditor',
      passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewarnFwk4TCjdHBK', // "password123"
      role: 'AUDITOR',
      organizationId: 'test-org-1',
      isActive: true,
      emailVerified: new Date(),
    },
    // Users for second organization
    {
      id: 'test-user-org2-1',
      email: 'user@test2.com',
      firstName: 'Org2',
      lastName: 'User',
      passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewarnFwk4TCjdHBK', // "password123"
      role: 'USER',
      organizationId: 'test-org-2',
      isActive: true,
      emailVerified: new Date(),
    }
  ],
  
  risks: [
    {
      id: 'test-risk-1',
      title: 'Test Operational Risk',
      description: 'A test operational risk for unit testing',
      category: 'OPERATIONAL',
      likelihood: 3,
      impact: 4,
      riskScore: 12,
      riskLevel: 'MEDIUM',
      status: 'IDENTIFIED',
      organizationId: 'test-org-1',
      createdBy: 'test-user-1',
      dateIdentified: new Date('2024-01-01'),
      lastAssessed: new Date('2024-01-15'),
      nextReview: new Date('2024-04-15'),
      aiConfidence: 0.85,
    },
    {
      id: 'test-risk-2',
      title: 'Test Financial Risk',
      description: 'A test financial risk for integration testing',
      category: 'FINANCIAL',
      likelihood: 2,
      impact: 5,
      riskScore: 10,
      riskLevel: 'MEDIUM',
      status: 'ASSESSED',
      organizationId: 'test-org-1',
      createdBy: 'test-risk-manager-1',
      owner: 'test-admin-1',
      dateIdentified: new Date('2024-01-05'),
      lastAssessed: new Date('2024-01-20'),
      nextReview: new Date('2024-04-20'),
      aiConfidence: 0.92,
    },
    {
      id: 'test-risk-3',
      title: 'Test Technology Risk',
      description: 'A test technology risk for E2E testing',
      category: 'TECHNOLOGY',
      likelihood: 4,
      impact: 4,
      riskScore: 16,
      riskLevel: 'HIGH',
      status: 'MITIGATED',
      organizationId: 'test-org-1',
      createdBy: 'test-user-1',
      owner: 'test-risk-manager-1',
      dateIdentified: new Date('2024-01-10'),
      lastAssessed: new Date('2024-01-25'),
      nextReview: new Date('2024-04-25'),
      aiConfidence: 0.78,
    },
    // Risk for second organization
    {
      id: 'test-risk-org2-1',
      title: 'Org2 Compliance Risk',
      description: 'A compliance risk for organization 2',
      category: 'COMPLIANCE',
      likelihood: 3,
      impact: 3,
      riskScore: 9,
      riskLevel: 'MEDIUM',
      status: 'IDENTIFIED',
      organizationId: 'test-org-2',
      createdBy: 'test-user-org2-1',
      dateIdentified: new Date('2024-01-01'),
      lastAssessed: new Date('2024-01-15'),
      nextReview: new Date('2024-04-15'),
      aiConfidence: 0.80,
    }
  ],
  
  controls: [
    {
      id: 'test-control-1',
      title: 'Test Access Control',
      description: 'Access control system for testing',
      type: 'PREVENTIVE',
      category: 'TECHNICAL',
      status: 'IMPLEMENTED',
      effectiveness: 85,
      automationLevel: 'AUTOMATED',
      organizationId: 'test-org-1',
      createdBy: 'test-admin-1',
      owner: 'test-user-1',
      implementationDate: new Date('2024-01-01'),
      lastTested: new Date('2024-01-15'),
      nextTest: new Date('2024-04-15'),
    },
    {
      id: 'test-control-2',
      title: 'Test Data Encryption',
      description: 'Data encryption control for testing',
      type: 'PREVENTIVE',
      category: 'TECHNICAL',
      status: 'IMPLEMENTED',
      effectiveness: 92,
      automationLevel: 'AUTOMATED',
      organizationId: 'test-org-1',
      createdBy: 'test-admin-1',
      owner: 'test-risk-manager-1',
      implementationDate: new Date('2024-01-05'),
      lastTested: new Date('2024-01-20'),
      nextTest: new Date('2024-04-20'),
    }
  ],
  
  questionnaires: [
    {
      id: 'test-questionnaire-1',
      title: 'Test Risk Assessment Questionnaire',
      description: 'A test questionnaire for risk assessment',
      type: 'RISK_ASSESSMENT',
      status: 'ACTIVE',
      organizationId: 'test-org-1',
      createdBy: 'test-admin-1',
      questions: [
        {
          id: 'q1',
          text: 'What is the likelihood of this risk occurring?',
          type: 'SCALE',
          required: true,
          options: ['1', '2', '3', '4', '5']
        },
        {
          id: 'q2',
          text: 'What would be the impact if this risk occurred?',
          type: 'SCALE',
          required: true,
          options: ['1', '2', '3', '4', '5']
        }
      ]
    }
  ],
  
  apiKeys: [
    {
      id: 'test-api-key-1',
      name: 'Test API Key',
      keyHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewarnFwk4TCjdHBK', // "test-api-key"
      organizationId: 'test-org-1',
      createdBy: 'test-admin-1',
      isActive: true,
      expiresAt: new Date('2025-12-31'),
      lastUsed: new Date(),
      usageCount: 0,
    }
  ]
};

async function clearDatabase() {
  console.log('🧹 Clearing test database...');
  
  // Delete in reverse order of dependencies
  await prisma.controlRiskMapping.deleteMany();
  await prisma.response.deleteMany();
  await prisma.questionnaire.deleteMany();
  await prisma.aPIKey.deleteMany();
  await prisma.control.deleteMany();
  await prisma.risk.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
  
  console.log('✅ Database cleared');
}

async function seedOrganizations() {
  console.log('🏢 Seeding organizations...');
  
  for (const org of testData.organizations) {
    await prisma.organization.upsert({
      where: { id: org.id },
      update: org,
      create: org,
    });
  }
  
  console.log(`✅ Seeded ${testData.organizations.length} organizations`);
}

async function seedUsers() {
  console.log('👥 Seeding users...');
  
  for (const user of testData.users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: user,
      create: user,
    });
  }
  
  console.log(`✅ Seeded ${testData.users.length} users`);
}

async function seedRisks() {
  console.log('⚠️ Seeding risks...');
  
  for (const risk of testData.risks) {
    await prisma.risk.upsert({
      where: { id: risk.id },
      update: risk,
      create: risk,
    });
  }
  
  console.log(`✅ Seeded ${testData.risks.length} risks`);
}

async function seedControls() {
  console.log('🛡️ Seeding controls...');
  
  for (const control of testData.controls) {
    await prisma.control.upsert({
      where: { id: control.id },
      update: control,
      create: control,
    });
  }
  
  console.log(`✅ Seeded ${testData.controls.length} controls`);
}

async function seedQuestionnaires() {
  console.log('📋 Seeding questionnaires...');
  
  for (const questionnaire of testData.questionnaires) {
    await prisma.questionnaire.upsert({
      where: { id: questionnaire.id },
      update: questionnaire,
      create: questionnaire,
    });
  }
  
  console.log(`✅ Seeded ${testData.questionnaires.length} questionnaires`);
}

async function seedApiKeys() {
  console.log('🔑 Seeding API keys...');
  
  for (const apiKey of testData.apiKeys) {
    await prisma.aPIKey.upsert({
      where: { id: apiKey.id },
      update: apiKey,
      create: apiKey,
    });
  }
  
  console.log(`✅ Seeded ${testData.apiKeys.length} API keys`);
}

async function createControlRiskMappings() {
  console.log('🔗 Creating control-risk mappings...');
  
  // Map first control to first risk
  await prisma.controlRiskMapping.upsert({
    where: {
      riskId_controlId: {
        riskId: 'test-risk-1',
        controlId: 'test-control-1',
      }
    },
    update: {
      effectiveness: 0.85,
    },
    create: {
      riskId: 'test-risk-1',
      controlId: 'test-control-1',
      effectiveness: 0.85,
    },
  });
  
  // Map second control to second risk
  await prisma.controlRiskMapping.upsert({
    where: {
      riskId_controlId: {
        riskId: 'test-risk-2',
        controlId: 'test-control-2',
      }
    },
    update: {
      effectiveness: 0.92,
    },
    create: {
      riskId: 'test-risk-2',
      controlId: 'test-control-2',
      effectiveness: 0.92,
    },
  });
  
  console.log('✅ Created control-risk mappings');
}

async function verifySeeding() {
  console.log('🔍 Verifying seeded data...');
  
  const counts = {
    organizations: await prisma.organization.count(),
    users: await prisma.user.count(),
    risks: await prisma.risk.count(),
    controls: await prisma.control.count(),
    questionnaires: await prisma.questionnaire.count(),
    apiKeys: await prisma.aPIKey.count(),
    mappings: await prisma.controlRiskMapping.count(),
  };
  
  console.log('📊 Database counts:', counts);
  
  // Verify multi-tenant isolation
  const org1Risks = await prisma.risk.count({
    where: { organizationId: 'test-org-1' }
  });
  
  const org2Risks = await prisma.risk.count({
    where: { organizationId: 'test-org-2' }
  });
  
  console.log(`🏢 Org 1 risks: ${org1Risks}, Org 2 risks: ${org2Risks}`);
  
  return counts;
}

async function main() {
  try {
    console.log('🚀 Starting test database seeding...');
    console.log(`📍 Database URL: ${process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db'}`);
    
    // Connect to database
    await prisma.$connect();
    console.log('✅ Connected to database');
    
    // Clear existing data
    await clearDatabase();
    
    // Seed data in dependency order
    await seedOrganizations();
    await seedUsers();
    await seedRisks();
    await seedControls();
    await seedQuestionnaires();
    await seedApiKeys();
    await createControlRiskMappings();
    
    // Verify seeding
    const counts = await verifySeeding();
    
    console.log('🎉 Test database seeding completed successfully!');
    console.log('📝 Test data summary:');
    console.log(`   - ${counts.organizations} organizations`);
    console.log(`   - ${counts.users} users (across ${testData.organizations.length} orgs)`);
    console.log(`   - ${counts.risks} risks`);
    console.log(`   - ${counts.controls} controls`);
    console.log(`   - ${counts.questionnaires} questionnaires`);
    console.log(`   - ${counts.apiKeys} API keys`);
    console.log(`   - ${counts.mappings} control-risk mappings`);
    
    console.log('\n🔐 Test credentials:');
    console.log('   - test@example.com / password123 (User)');
    console.log('   - admin@example.com / password123 (Admin)');
    console.log('   - riskmanager@example.com / password123 (Risk Manager)');
    console.log('   - auditor@example.com / password123 (Auditor)');
    console.log('   - user@test2.com / password123 (Org 2 User)');
    
  } catch (error) {
    console.error('❌ Error seeding test database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as seedTestDatabase, testData }; 