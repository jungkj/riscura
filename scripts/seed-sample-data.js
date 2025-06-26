#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedSampleData() {
  console.log('🌱 Seeding Sample Data...');
  console.log('');

  try {
    // Check if data already exists
    const existingRisks = await prisma.risk.count();
    if (existingRisks > 0) {
      console.log('⚠️  Sample data already exists. Skipping seeding.');
      console.log(`📊 Found ${existingRisks} existing risks.`);
      return;
    }

    // Get the organization and users
    const organization = await prisma.organization.findFirst();
    const adminUser = await prisma.user.findFirst({ where: { email: 'admin@riscura.com' } });
    const testUser = await prisma.user.findFirst({ where: { email: 'testuser@riscura.com' } });

    if (!organization || !adminUser || !testUser) {
      console.log('❌ Required users or organization not found. Please run the seed script first.');
      return;
    }

    console.log('📊 Creating sample risks...');
    
    // Create sample risks
    const risks = await Promise.all([
      prisma.risk.create({
        data: {
          title: 'Data Breach Risk',
          description: 'Risk of unauthorized access to sensitive customer data through cyber attacks or insider threats',
          category: 'TECHNOLOGY',
          likelihood: 3,
          impact: 5,
          riskScore: 15,
          riskLevel: 'HIGH',
          status: 'IDENTIFIED',
          dateIdentified: new Date(),
          organizationId: organization.id,
          createdBy: adminUser.id,
          owner: testUser.id
        }
      }),
      prisma.risk.create({
        data: {
          title: 'Regulatory Compliance Risk',
          description: 'Risk of non-compliance with GDPR, SOX, and other regulatory requirements',
          category: 'COMPLIANCE',
          likelihood: 2,
          impact: 4,
          riskScore: 8,
          riskLevel: 'MEDIUM',
          status: 'ASSESSED',
          dateIdentified: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          organizationId: organization.id,
          createdBy: testUser.id,
          owner: adminUser.id
        }
      }),
      prisma.risk.create({
        data: {
          title: 'Market Volatility Risk',
          description: 'Risk from fluctuating market conditions affecting revenue and business operations',
          category: 'FINANCIAL',
          likelihood: 4,
          impact: 3,
          riskScore: 12,
          riskLevel: 'MEDIUM',
          status: 'MITIGATED',
          dateIdentified: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          organizationId: organization.id,
          createdBy: adminUser.id,
          owner: testUser.id
        }
      }),
      prisma.risk.create({
        data: {
          title: 'Supply Chain Disruption',
          description: 'Risk of supply chain disruptions affecting product delivery and customer satisfaction',
          category: 'OPERATIONAL',
          likelihood: 3,
          impact: 4,
          riskScore: 12,
          riskLevel: 'MEDIUM',
          status: 'IDENTIFIED',
          dateIdentified: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          organizationId: organization.id,
          createdBy: testUser.id,
          owner: adminUser.id
        }
      }),
      prisma.risk.create({
        data: {
          title: 'Key Personnel Loss',
          description: 'Risk of losing critical personnel affecting business continuity and knowledge transfer',
          category: 'STRATEGIC',
          likelihood: 2,
          impact: 5,
          riskScore: 10,
          riskLevel: 'MEDIUM',
          status: 'ASSESSED',
          dateIdentified: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          organizationId: organization.id,
          createdBy: adminUser.id,
          owner: testUser.id
        }
      })
    ]);

    console.log('🛡️ Creating sample controls...');
    
    // Create sample controls
    const controls = await Promise.all([
      prisma.control.create({
        data: {
          title: 'Multi-Factor Authentication',
          description: 'MFA system for all user accounts to prevent unauthorized access',
          type: 'PREVENTIVE',
          category: 'OPERATIONAL',
          frequency: 'CONTINUOUS',
          automationLevel: 'FULLY_AUTOMATED',
          effectiveness: 0.85,
          effectivenessRating: 'LARGELY_EFFECTIVE',
          status: 'OPERATIONAL',
          lastTestDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          nextTestDate: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000),
          organizationId: organization.id,
          createdBy: adminUser.id,
          owner: testUser.id
        }
      }),
      prisma.control.create({
        data: {
          title: 'Data Encryption',
          description: 'End-to-end encryption for all data transmission and storage',
          type: 'PREVENTIVE',
          category: 'OPERATIONAL',
          frequency: 'CONTINUOUS',
          automationLevel: 'FULLY_AUTOMATED',
          effectiveness: 0.95,
          effectivenessRating: 'FULLY_EFFECTIVE',
          status: 'OPERATIONAL',
          lastTestDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          nextTestDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000),
          organizationId: organization.id,
          createdBy: testUser.id,
          owner: adminUser.id
        }
      }),
      prisma.control.create({
        data: {
          title: 'Regular Security Audits',
          description: 'Quarterly security assessments and penetration testing',
          type: 'DETECTIVE',
          category: 'OPERATIONAL',
          frequency: 'QUARTERLY',
          automationLevel: 'MANUAL',
          effectiveness: 0.78,
          effectivenessRating: 'LARGELY_EFFECTIVE',
          status: 'OPERATIONAL',
          lastTestDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          nextTestDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          organizationId: organization.id,
          createdBy: adminUser.id,
          owner: testUser.id
        }
      }),
      prisma.control.create({
        data: {
          title: 'Employee Security Training',
          description: 'Regular security awareness training for all employees',
          type: 'PREVENTIVE',
          category: 'ADMINISTRATIVE',
          frequency: 'QUARTERLY',
          automationLevel: 'MANUAL',
          effectiveness: 0.72,
          effectivenessRating: 'LARGELY_EFFECTIVE',
          status: 'OPERATIONAL',
          lastTestDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
          nextTestDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
          organizationId: organization.id,
          createdBy: testUser.id,
          owner: adminUser.id
        }
      }),
      prisma.control.create({
        data: {
          title: 'Backup and Recovery',
          description: 'Automated backup systems with regular recovery testing',
          type: 'CORRECTIVE',
          category: 'OPERATIONAL',
          frequency: 'DAILY',
          automationLevel: 'FULLY_AUTOMATED',
          effectiveness: 0.88,
          effectivenessRating: 'LARGELY_EFFECTIVE',
          status: 'OPERATIONAL',
          lastTestDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          nextTestDate: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000),
          organizationId: organization.id,
          createdBy: adminUser.id,
          owner: testUser.id
        }
      })
    ]);

    console.log('📄 Creating sample documents...');
    
    // Create sample documents
    const documents = await Promise.all([
      prisma.document.create({
        data: {
          name: 'Enterprise Risk Management Policy',
          type: 'POLICY',
          size: 2048576, // 2MB
          organizationId: organization.id,
          uploadedBy: adminUser.id
        }
      }),
      prisma.document.create({
        data: {
          name: 'Security Incident Response Plan',
          type: 'PROCEDURE',
          size: 1536000, // 1.5MB
          organizationId: organization.id,
          uploadedBy: testUser.id
        }
      }),
      prisma.document.create({
        data: {
          name: 'Compliance Assessment Report',
          type: 'REPORT',
          size: 3072000, // 3MB
          organizationId: organization.id,
          uploadedBy: adminUser.id
        }
      })
    ]);

    console.log('📋 Creating sample questionnaires...');
    
    // Create sample questionnaires
    const sampleQuestions = [
      {
        id: 'q1',
        text: 'Describe your current security controls.',
        type: 'text',
        required: true
      }
    ];
    const questionnaires = await Promise.all([
      prisma.questionnaire.create({
        data: {
          title: 'ISO 27001 Security Assessment',
          description: 'Comprehensive security assessment questionnaire based on ISO 27001 standards',
          status: 'ACTIVE',
          organizationId: organization.id,
          createdBy: adminUser.id,
          questions: sampleQuestions
        }
      }),
      prisma.questionnaire.create({
        data: {
          title: 'GDPR Compliance Check',
          description: 'Data protection and privacy compliance questionnaire for GDPR requirements',
          status: 'ACTIVE',
          organizationId: organization.id,
          createdBy: testUser.id,
          questions: sampleQuestions
        }
      }),
      prisma.questionnaire.create({
        data: {
          title: 'Vendor Security Assessment',
          description: 'Security assessment questionnaire for third-party vendors',
          status: 'DRAFT',
          organizationId: organization.id,
          createdBy: adminUser.id,
          questions: sampleQuestions
        }
      })
    ]);

    console.log('📈 Creating sample activities...');
    
    // TODO: Fix activity creation - foreign key constraints require actual entity IDs
    // For now, skip activities to focus on main entities
    console.log('⏭️  Skipping activities due to foreign key constraints');
    const createdActivities = [];
    
    /*
    // Create simple activities without complex entity relationships
    const activities = [
      prisma.activity.create({
        data: {
          type: 'CREATED',
          description: 'Created new risk: Data Breach Risk',
          entityType: 'RISK',
          entityId: 'sample-risk-1',
          organizationId: organization.id,
          userId: adminUser.id
        }
      }),
      prisma.activity.create({
        data: {
          type: 'APPROVED',
          description: 'Implemented control: Multi-Factor Authentication',
          entityType: 'CONTROL',
          entityId: 'sample-control-1',
          organizationId: organization.id,
          userId: testUser.id
        }
      }),
      prisma.activity.create({
        data: {
          type: 'UPLOADED',
          description: 'Uploaded document: Enterprise Risk Management Policy',
          entityType: 'DOCUMENT',
          entityId: 'sample-document-1',
          organizationId: organization.id,
          userId: adminUser.id
        }
      }),
      prisma.activity.create({
        data: {
          type: 'APPROVED',
          description: 'Approved questionnaire: ISO 27001 Security Assessment',
          entityType: 'QUESTIONNAIRE',
          entityId: 'sample-questionnaire-1',
          organizationId: organization.id,
          userId: adminUser.id
        }
      })
    ];
    
    const createdActivities = await Promise.all(activities);
    */

    console.log('');
    console.log('✅ Sample data created successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`  • Risks: ${risks.length}`);
    console.log(`  • Controls: ${controls.length}`);
    console.log(`  • Documents: ${documents.length}`);
    console.log(`  • Questionnaires: ${questionnaires.length}`);
    console.log(`  • Activities: ${createdActivities.length}`);
    console.log('');
    console.log('🚀 Your database now has real data to display!');

  } catch (error) {
    console.error('❌ Error seeding sample data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedSampleData(); 