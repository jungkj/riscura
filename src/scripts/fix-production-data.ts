/**
 * Production Data Setup Script
 * Creates the admin@riscura.com user as a regular production user with placeholder data
 */

import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { 
  UserRole, 
  RiskLevel, 
  RiskCategory, 
  RiskStatus,
  ControlType,
  ControlFrequency,
  ControlStatus
} from '@prisma/client';

async function main() {
  console.log('🔧 Starting production data setup...');

  try {
    // 1. Check/Create Organization
    let organization = await db.client.organization.findFirst({
      where: {
        OR: [
          { name: 'RisCura' },
          { id: 'riscura-org-id' }
        ]
      }
    });

    if (!organization) {
      console.log('📦 Creating organization...');
      organization = await db.client.organization.create({
        data: {
          id: 'riscura-org-id',
          name: 'RisCura',
          industry: 'Financial Services',
          size: 'MEDIUM',
          country: 'South Africa',
          settings: {},
          features: ['risk-management', 'compliance', 'controls', 'assessments'],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log('✅ Organization created:', organization.name);
    } else {
      console.log('✅ Organization exists:', organization.name);
    }

    // 2. Check/Create Admin User
    let adminUser = await db.client.user.findUnique({
      where: { email: 'admin@riscura.com' }
    });

    if (!adminUser) {
      console.log('👤 Creating admin user...');
      const passwordHash = await hashPassword('admin123');
      
      adminUser = await db.client.user.create({
        data: {
          email: 'admin@riscura.com',
          firstName: 'Admin',
          lastName: 'User',
          role: UserRole.ADMIN,
          organizationId: organization.id,
          passwordHash,
          isActive: true,
          emailVerified: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log('✅ Admin user created');
    } else if (adminUser.organizationId !== organization.id) {
      // Update user's organization if mismatched
      console.log('🔄 Updating admin user organization...');
      adminUser = await db.client.user.update({
        where: { id: adminUser.id },
        data: { organizationId: organization.id }
      });
      console.log('✅ Admin user organization updated');
    } else {
      console.log('✅ Admin user exists with correct organization');
    }

    // 3. Check for existing data
    const [riskCount, controlCount] = await Promise.all([
      db.client.risk.count({ where: { organizationId: organization.id } }),
      db.client.control.count({ where: { organizationId: organization.id } })
    ]);

    console.log(`📊 Current data: ${riskCount} risks, ${controlCount} controls`);

    // 4. Create sample data if none exists
    if (riskCount === 0) {
      console.log('📝 Creating sample risks...');
      
      const sampleRisks = [
        {
          title: 'Data Breach Risk',
          description: 'Risk of unauthorized access to sensitive customer data',
          category: RiskCategory.OPERATIONAL,
          likelihood: 3,
          impact: 5,
          riskScore: 15,
          riskLevel: RiskLevel.HIGH,
          status: RiskStatus.ACTIVE,
          organizationId: organization.id,
          createdById: adminUser.id,
          department: 'IT Security',
          sourceOfRisk: 'Cyber Security',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: 'Regulatory Compliance Risk',
          description: 'Risk of non-compliance with GDPR and data protection regulations',
          category: RiskCategory.COMPLIANCE,
          likelihood: 2,
          impact: 4,
          riskScore: 8,
          riskLevel: RiskLevel.MEDIUM,
          status: RiskStatus.ACTIVE,
          organizationId: organization.id,
          createdById: adminUser.id,
          department: 'Legal',
          sourceOfRisk: 'Regulatory Changes',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: 'System Downtime Risk',
          description: 'Risk of critical system unavailability affecting operations',
          category: RiskCategory.OPERATIONAL,
          likelihood: 3,
          impact: 4,
          riskScore: 12,
          riskLevel: RiskLevel.HIGH,
          status: RiskStatus.ACTIVE,
          organizationId: organization.id,
          createdById: adminUser.id,
          department: 'IT Operations',
          sourceOfRisk: 'Technology',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: 'Third-Party Vendor Risk',
          description: 'Risk from dependency on third-party service providers',
          category: RiskCategory.STRATEGIC,
          likelihood: 2,
          impact: 3,
          riskScore: 6,
          riskLevel: RiskLevel.MEDIUM,
          status: RiskStatus.ACTIVE,
          organizationId: organization.id,
          createdById: adminUser.id,
          department: 'Procurement',
          sourceOfRisk: 'Third Party Risk',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: 'Market Volatility Risk',
          description: 'Risk from market fluctuations affecting investment portfolio',
          category: RiskCategory.FINANCIAL,
          likelihood: 4,
          impact: 3,
          riskScore: 12,
          riskLevel: RiskLevel.HIGH,
          status: RiskStatus.ACTIVE,
          organizationId: organization.id,
          createdById: adminUser.id,
          department: 'Finance',
          sourceOfRisk: 'Market Conditions',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      await db.client.risk.createMany({
        data: sampleRisks
      });
      
      console.log(`✅ Created ${sampleRisks.length} sample risks`);
    }

    if (controlCount === 0) {
      console.log('🛡️ Creating sample controls...');
      
      const sampleControls = [
        {
          title: 'Access Control Management',
          description: 'Regular review and update of user access permissions',
          type: ControlType.PREVENTIVE,
          frequency: ControlFrequency.MONTHLY,
          effectiveness: 85,
          status: ControlStatus.OPERATIONAL,
          organizationId: organization.id,
          createdById: adminUser.id,
          category: 'TECHNICAL',
          automationLevel: 'SEMI_AUTOMATED',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: 'Security Incident Monitoring',
          description: 'Continuous monitoring of security events and incidents',
          type: ControlType.DETECTIVE,
          frequency: ControlFrequency.CONTINUOUS,
          effectiveness: 90,
          status: ControlStatus.OPERATIONAL,
          organizationId: organization.id,
          createdById: adminUser.id,
          category: 'TECHNICAL',
          automationLevel: 'FULLY_AUTOMATED',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: 'Backup and Recovery Testing',
          description: 'Regular testing of backup and disaster recovery procedures',
          type: ControlType.CORRECTIVE,
          frequency: ControlFrequency.QUARTERLY,
          effectiveness: 75,
          status: ControlStatus.OPERATIONAL,
          organizationId: organization.id,
          createdById: adminUser.id,
          category: 'OPERATIONAL',
          automationLevel: 'SEMI_AUTOMATED',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: 'Compliance Training Program',
          description: 'Annual compliance training for all employees',
          type: ControlType.PREVENTIVE,
          frequency: ControlFrequency.ANNUALLY,
          effectiveness: 70,
          status: ControlStatus.OPERATIONAL,
          organizationId: organization.id,
          createdById: adminUser.id,
          category: 'ADMINISTRATIVE',
          automationLevel: 'MANUAL',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: 'Vendor Risk Assessment',
          description: 'Periodic assessment of third-party vendor risks',
          type: ControlType.PREVENTIVE,
          frequency: ControlFrequency.QUARTERLY,
          effectiveness: 80,
          status: ControlStatus.OPERATIONAL,
          organizationId: organization.id,
          createdById: adminUser.id,
          category: 'MANAGEMENT',
          automationLevel: 'SEMI_AUTOMATED',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      await db.client.control.createMany({
        data: sampleControls
      });
      
      console.log(`✅ Created ${sampleControls.length} sample controls`);
    }

    // 5. Final verification
    const [finalRiskCount, finalControlCount, finalTaskCount] = await Promise.all([
      db.client.risk.count({ where: { organizationId: organization.id } }),
      db.client.control.count({ where: { organizationId: organization.id } }),
      db.client.task.count({ where: { organizationId: organization.id } })
    ]);

    console.log('\n📊 Final Data Summary:');
    console.log(`  Organization: ${organization.name} (${organization.id})`);
    console.log(`  Admin User: ${adminUser.email} (${adminUser.id})`);
    console.log(`  Risks: ${finalRiskCount}`);
    console.log(`  Controls: ${finalControlCount}`);
    console.log(`  Tasks: ${finalTaskCount}`);
    
    console.log('\n✅ Production data alignment complete!');
    
  } catch (error) {
    console.error('❌ Error during data alignment:', error);
    throw error;
  } finally {
    await db.client.$disconnect();
  }
}

// Run the script
main()
  .then(() => {
    console.log('🎉 Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });