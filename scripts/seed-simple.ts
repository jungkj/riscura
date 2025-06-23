#!/usr/bin/env tsx

/**
 * Simplified Database Seeding Script
 * 
 * This script seeds essential data for database initialization:
 * 1. Basic organization
 * 2. Admin user
 * 3. Core Probo controls (if schema supports it)
 */

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting simplified database seeding...\n');
  
  try {
    // Check if data already exists
    const orgCount = await prisma.organization.count();
    if (orgCount > 0) {
      console.log('📊 Database already has organizations. Skipping seeding.');
      return;
    }
    
    // Step 1: Create default organization
    console.log('🏢 Creating default organization...');
    const organization = await prisma.organization.create({
      data: {
        name: 'Riscura Demo Organization',
        domain: 'demo.riscura.com',
        plan: 'enterprise',
        isActive: true,
        settings: {
          features: {
            aiEnabled: true,
            proboIntegration: true,
          },
          compliance: {
            frameworks: ['SOC2', 'ISO27001'],
          },
        },
      },
    });
    console.log(`✅ Created organization: ${organization.name}`);
    
    // Step 2: Create admin user
    console.log('👤 Creating admin user...');
    const passwordHash = await hash('admin123!', 12);
    
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@riscura.demo',
        firstName: 'Admin',
        lastName: 'User',
        passwordHash,
        role: 'ADMIN',
        isActive: true,
        emailVerified: new Date(),
        organizationId: organization.id,
      },
    });
    console.log(`✅ Created admin user: ${adminUser.email}`);
    
    // Step 3: Create sample risk
    console.log('⚠️  Creating sample risk...');
    const sampleRisk = await prisma.risk.create({
      data: {
        title: 'Data Security Risk',
        description: 'Risk of unauthorized access to sensitive data',
        category: 'TECHNOLOGY',
        likelihood: 3,
        impact: 4,
        riskScore: 12,
        riskLevel: 'HIGH',
        status: 'IDENTIFIED',
        dateIdentified: new Date(),
        organizationId: organization.id,
        createdBy: adminUser.id,
      },
    });
    console.log(`✅ Created sample risk: ${sampleRisk.title}`);
    
    // Step 4: Create sample control
    console.log('🔒 Creating sample control...');
    const sampleControl = await prisma.control.create({
      data: {
        title: 'Multi-Factor Authentication',
        description: 'Implement MFA for all user accounts',
        type: 'PREVENTIVE',
        category: 'TECHNICAL',
        frequency: 'Continuous',
        status: 'IMPLEMENTED',
        effectiveness: 0.9,
        effectivenessRating: 'FULLY_EFFECTIVE',
        automationLevel: 'FULLY_AUTOMATED',
        organizationId: organization.id,
        createdBy: adminUser.id,
      },
    });
    console.log(`✅ Created sample control: ${sampleControl.title}`);
    
    // Step 5: Try to create a Probo control (if schema supports it)
    try {
      console.log('🛡️  Creating sample Probo control...');
      await prisma.proboControl.create({
        data: {
          controlId: 'enforce-mfa',
          name: 'Enforce Multi-Factor Authentication',
          category: 'Access Control',
          importance: 'MANDATORY',
          standards: ['SOC2', 'ISO27001'],
          description: 'Require multi-factor authentication for all user accounts',
          status: 'IMPLEMENTED',
          organizationId: organization.id,
        },
      });
      console.log('✅ Created sample Probo control');
    } catch (error) {
      console.log('⚠️  Probo control creation skipped (schema may not support it)');
    }
    
    console.log('\n✅ Simplified database seeding completed successfully!');
    console.log('\n🔑 Login credentials:');
    console.log('   Email: admin@riscura.demo');
    console.log('   Password: admin123!');
    console.log('\n📊 Seeded data summary:');
    
    const counts = await Promise.all([
      prisma.organization.count(),
      prisma.user.count(),
      prisma.risk.count(),
      prisma.control.count(),
    ]);
    
    console.log(`   🏢 Organizations: ${counts[0]}`);
    console.log(`   👤 Users: ${counts[1]}`);
    console.log(`   ⚠️  Risks: ${counts[2]}`);
    console.log(`   🔒 Controls: ${counts[3]}`);
    
  } catch (error) {
    console.error('❌ Simplified seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
main()
  .then(() => {
    console.log('\n🎉 Database is ready for use!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Seeding failed:', error);
    process.exit(1);
  }); 