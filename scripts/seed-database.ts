#!/usr/bin/env tsx

/**
 * Database Seeding Script
 * 
 * This script seeds the database with:
 * 1. Default organizations and users
 * 2. Probo mitigation data
 * 3. Sample risk assessments
 * 4. Control templates
 * 5. Compliance frameworks
 */

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

interface SeedOptions {
  force?: boolean;
  minimal?: boolean;
  verbose?: boolean;
  skipProbo?: boolean;
}

class DatabaseSeeder {
  private options: SeedOptions;
  
  constructor(options: SeedOptions = {}) {
    this.options = options;
  }
  
  /**
   * Main seeding process
   */
  async seed(): Promise<void> {
    console.log('🌱 Starting database seeding...\n');
    
    try {
      // Check if database already has data
      if (!this.options.force) {
        const hasData = await this.checkExistingData();
        if (hasData) {
          console.log('📊 Database already contains data. Use --force to reseed.');
          return;
        }
      }
      
      // Step 1: Seed organizations
      const organizations = await this.seedOrganizations();
      
      // Step 2: Seed users
      const users = await this.seedUsers(organizations);
      
      // Step 3: Seed Probo mitigations
      if (!this.options.skipProbo) {
        await this.seedProboMitigations();
      }
      
      // Step 4: Seed compliance frameworks
      await this.seedComplianceFrameworks();
      
      // Step 5: Seed sample data (if not minimal)
      if (!this.options.minimal) {
        await this.seedSampleData(organizations, users);
      }
      
      console.log('✅ Database seeding completed successfully!\n');
      
    } catch (error) {
      console.error('❌ Database seeding failed:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
  
  /**
   * Check if database already has data
   */
  private async checkExistingData(): Promise<boolean> {
    const [orgCount, userCount] = await Promise.all([
      prisma.organization.count(),
      prisma.user.count(),
    ]);
    
    return orgCount > 0 || userCount > 0;
  }
  
  /**
   * Seed organizations
   */
  private async seedOrganizations(): Promise<any[]> {
    console.log('🏢 Seeding organizations...');
    
    const organizations = [
      {
        id: 'org-demo-001',
        name: 'Riscura Demo Organization',
        slug: 'riscura-demo',
        description: 'Demo organization for Riscura platform',
        industry: 'Technology',
        size: 'MEDIUM',
        settings: {
          complianceFrameworks: ['SOC2', 'ISO27001'],
          riskTolerance: 'MEDIUM',
          autoAssignControls: true,
        },
      },
      {
        id: 'org-sample-002',
        name: 'Sample Healthcare Corp',
        slug: 'sample-healthcare',
        description: 'Sample healthcare organization',
        industry: 'Healthcare',
        size: 'LARGE',
        settings: {
          complianceFrameworks: ['HIPAA', 'SOC2'],
          riskTolerance: 'LOW',
          autoAssignControls: true,
        },
      },
    ];
    
    const createdOrgs = [];
    
    for (const org of organizations) {
      try {
        const created = await prisma.organization.upsert({
          where: { id: org.id },
          update: org,
          create: org,
        });
        
        createdOrgs.push(created);
        
        if (this.options.verbose) {
          console.log(`   ✓ Created organization: ${org.name}`);
        }
      } catch (error) {
        console.error(`   ❌ Failed to create organization ${org.name}:`, error);
      }
    }
    
    console.log(`✅ Created ${createdOrgs.length} organizations`);
    return createdOrgs;
  }
  
  /**
   * Seed users
   */
  private async seedUsers(organizations: any[]): Promise<any[]> {
    console.log('👥 Seeding users...');
    
    const defaultPassword = await hash('demo123!', 12);
    
    const users = [
      {
        id: 'user-admin-001',
        email: 'admin@riscura.demo',
        name: 'Admin User',
        role: 'ADMIN',
        password: defaultPassword,
        organizationId: organizations[0]?.id,
        emailVerified: new Date(),
        settings: {
          notifications: true,
          theme: 'system',
          language: 'en',
        },
      },
      {
        id: 'user-manager-001',
        email: 'manager@riscura.demo',
        name: 'Risk Manager',
        role: 'MANAGER',
        password: defaultPassword,
        organizationId: organizations[0]?.id,
        emailVerified: new Date(),
        settings: {
          notifications: true,
          theme: 'light',
          language: 'en',
        },
      },
      {
        id: 'user-analyst-001',
        email: 'analyst@riscura.demo',
        name: 'Compliance Analyst',
        role: 'USER',
        password: defaultPassword,
        organizationId: organizations[0]?.id,
        emailVerified: new Date(),
        settings: {
          notifications: true,
          theme: 'dark',
          language: 'en',
        },
      },
    ];
    
    const createdUsers = [];
    
    for (const user of users) {
      try {
        const created = await prisma.user.upsert({
          where: { email: user.email },
          update: { ...user, password: undefined }, // Don't update password on existing users
          create: user,
        });
        
        createdUsers.push(created);
        
        if (this.options.verbose) {
          console.log(`   ✓ Created user: ${user.email}`);
        }
      } catch (error) {
        console.error(`   ❌ Failed to create user ${user.email}:`, error);
      }
    }
    
    console.log(`✅ Created ${createdUsers.length} users`);
    console.log('📧 Demo login credentials:');
    console.log('   admin@riscura.demo / demo123!');
    console.log('   manager@riscura.demo / demo123!');
    console.log('   analyst@riscura.demo / demo123!');
    
    return createdUsers;
  }
  
  /**
   * Seed Probo mitigations
   */
  private async seedProboMitigations(): Promise<void> {
    console.log('🛡️  Seeding Probo mitigations...');
    
    try {
      // Load Probo mitigations from data file
      const mitigationsPath = join(process.cwd(), 'src/data/mitigations.json');
      const mitigationsData = JSON.parse(readFileSync(mitigationsPath, 'utf-8'));
      
      let createdCount = 0;
      
      for (const mitigation of mitigationsData) {
        try {
          await prisma.proboControl.upsert({
            where: { 
              proboId: mitigation.id || `probo-${mitigation.title.toLowerCase().replace(/\\s+/g, '-')}` 
            },
            update: {
              title: mitigation.title,
              description: mitigation.description,
              category: mitigation.category,
              importance: mitigation.importance,
              frameworks: mitigation.frameworks || [],
              implementationGuidance: mitigation.implementationGuidance || mitigation.description,
              evidenceRequirements: mitigation.evidenceRequirements || [],
              estimatedHours: mitigation.estimatedHours || 4,
              tags: mitigation.tags || [],
            },
            create: {
              proboId: mitigation.id || `probo-${mitigation.title.toLowerCase().replace(/\\s+/g, '-')}`,
              title: mitigation.title,
              description: mitigation.description,
              category: mitigation.category,
              importance: mitigation.importance,
              frameworks: mitigation.frameworks || [],
              implementationGuidance: mitigation.implementationGuidance || mitigation.description,
              evidenceRequirements: mitigation.evidenceRequirements || [],
              estimatedHours: mitigation.estimatedHours || 4,
              tags: mitigation.tags || [],
              isActive: true,
            },
          });
          
          createdCount++;
          
          if (this.options.verbose && createdCount % 10 === 0) {
            console.log(`   ✓ Processed ${createdCount} mitigations...`);
          }
        } catch (error) {
          console.error(`   ❌ Failed to create mitigation ${mitigation.title}:`, error);
        }
      }
      
      console.log(`✅ Created ${createdCount} Probo mitigations`);
      
    } catch (error) {
      console.error('❌ Failed to load Probo mitigations:', error);
      console.log('⚠️  Continuing without Probo mitigations...');
    }
  }
  
  /**
   * Seed compliance frameworks
   */
  private async seedComplianceFrameworks(): Promise<void> {
    console.log('📋 Seeding compliance frameworks...');
    
    const frameworks = [
      {
        id: 'soc2-type-ii',
        name: 'SOC 2 Type II',
        description: 'System and Organization Controls 2 Type II',
        version: '2017',
        categories: ['Security', 'Availability', 'Processing Integrity', 'Confidentiality', 'Privacy'],
        requirements: 64,
        isActive: true,
      },
      {
        id: 'iso27001-2013',
        name: 'ISO 27001:2013',
        description: 'Information Security Management System',
        version: '2013',
        categories: ['Information Security Policy', 'Organization of Information Security', 'Human Resource Security'],
        requirements: 114,
        isActive: true,
      },
      {
        id: 'gdpr-2018',
        name: 'GDPR',
        description: 'General Data Protection Regulation',
        version: '2018',
        categories: ['Data Protection Principles', 'Rights of Data Subjects', 'Data Controller Obligations'],
        requirements: 99,
        isActive: true,
      },
      {
        id: 'hipaa-security',
        name: 'HIPAA Security Rule',
        description: 'Health Insurance Portability and Accountability Act',
        version: '2003',
        categories: ['Administrative Safeguards', 'Physical Safeguards', 'Technical Safeguards'],
        requirements: 42,
        isActive: true,
      },
    ];
    
    let createdCount = 0;
    
    for (const framework of frameworks) {
      try {
        await prisma.complianceFramework.upsert({
          where: { id: framework.id },
          update: framework,
          create: framework,
        });
        
        createdCount++;
        
        if (this.options.verbose) {
          console.log(`   ✓ Created framework: ${framework.name}`);
        }
      } catch (error) {
        console.error(`   ❌ Failed to create framework ${framework.name}:`, error);
      }
    }
    
    console.log(`✅ Created ${createdCount} compliance frameworks`);
  }
  
  /**
   * Seed sample data
   */
  private async seedSampleData(organizations: any[], users: any[]): Promise<void> {
    console.log('📊 Seeding sample data...');
    
    if (organizations.length === 0 || users.length === 0) {
      console.log('⚠️  Skipping sample data - no organizations or users found');
      return;
    }
    
    const org = organizations[0];
    const user = users[0];
    
    // Create sample risk assessments
    await this.seedSampleRisks(org.id, user.id);
    
    // Create sample controls
    await this.seedSampleControls(org.id, user.id);
    
    // Create sample vendors
    await this.seedSampleVendors(org.id, user.id);
    
    console.log('✅ Sample data seeding completed');
  }
  
  /**
   * Seed sample risks
   */
  private async seedSampleRisks(organizationId: string, userId: string): Promise<void> {
    const risks = [
      {
        title: 'Data Breach Risk',
        description: 'Risk of unauthorized access to sensitive customer data',
        category: 'CYBER_SECURITY',
        likelihood: 'MEDIUM',
        impact: 'HIGH',
        riskScore: 75,
        status: 'ACTIVE',
        organizationId,
        createdBy: userId,
      },
      {
        title: 'Third-Party Vendor Risk',
        description: 'Risk associated with third-party service providers',
        category: 'THIRD_PARTY',
        likelihood: 'HIGH',
        impact: 'MEDIUM',
        riskScore: 60,
        status: 'ACTIVE',
        organizationId,
        createdBy: userId,
      },
      {
        title: 'Compliance Violation Risk',
        description: 'Risk of non-compliance with regulatory requirements',
        category: 'COMPLIANCE',
        likelihood: 'LOW',
        impact: 'HIGH',
        riskScore: 45,
        status: 'ACTIVE',
        organizationId,
        createdBy: userId,
      },
    ];
    
    for (const risk of risks) {
      try {
        await prisma.risk.create({ data: risk });
        
        if (this.options.verbose) {
          console.log(`   ✓ Created risk: ${risk.title}`);
        }
      } catch (error) {
        console.error(`   ❌ Failed to create risk ${risk.title}:`, error);
      }
    }
  }
  
     /**
    * Seed sample controls
    */
   private async seedSampleControls(organizationId: string, userId: string): Promise<void> {
     const controls = [
       {
         title: 'Multi-Factor Authentication',
         description: 'Implement MFA for all user accounts',
         category: 'TECHNICAL',
         type: 'PREVENTIVE',
         status: 'IMPLEMENTED',
         frequency: 'Continuous',
         effectiveness: 0.9,
         effectivenessRating: 'FULLY_EFFECTIVE',
         automationLevel: 'FULLY_AUTOMATED',
         organizationId,
         createdBy: userId,
       },
       {
         title: 'Data Encryption at Rest',
         description: 'Encrypt all sensitive data stored in databases',
         category: 'TECHNICAL',
         type: 'PREVENTIVE',
         status: 'PLANNED',
         frequency: 'Continuous',
         effectiveness: 0.95,
         effectivenessRating: 'FULLY_EFFECTIVE',
         automationLevel: 'FULLY_AUTOMATED',
         organizationId,
         createdBy: userId,
       },
       {
         title: 'Security Incident Response Plan',
         description: 'Documented procedures for handling security incidents',
         category: 'ADMINISTRATIVE',
         type: 'CORRECTIVE',
         status: 'OPERATIONAL',
         frequency: 'As Needed',
         effectiveness: 0.7,
         effectivenessRating: 'LARGELY_EFFECTIVE',
         automationLevel: 'MANUAL',
         organizationId,
         createdBy: userId,
       },
     ];
    
    for (const control of controls) {
      try {
        await prisma.control.create({ data: control });
        
        if (this.options.verbose) {
          console.log(`   ✓ Created control: ${control.title}`);
        }
      } catch (error) {
        console.error(`   ❌ Failed to create control ${control.title}:`, error);
      }
    }
  }
  
  /**
   * Seed sample vendors
   */
  private async seedSampleVendors(organizationId: string, userId: string): Promise<void> {
    const vendors = [
      {
        name: 'AWS',
        description: 'Amazon Web Services - Cloud Infrastructure',
        category: 'CLOUD_PROVIDER',
        riskLevel: 'LOW',
        status: 'ACTIVE',
        organizationId,
        createdBy: userId,
        contactInfo: {
          website: 'https://aws.amazon.com',
          email: 'support@aws.amazon.com',
        },
        assessmentData: {
          soc2Compliant: true,
          gdprCompliant: true,
          lastAssessment: new Date(),
        },
      },
      {
        name: 'Slack',
        description: 'Team Communication Platform',
        category: 'COMMUNICATION',
        riskLevel: 'MEDIUM',
        status: 'ACTIVE',
        organizationId,
        createdBy: userId,
        contactInfo: {
          website: 'https://slack.com',
          email: 'support@slack.com',
        },
        assessmentData: {
          soc2Compliant: true,
          gdprCompliant: true,
          lastAssessment: new Date(),
        },
      },
    ];
    
    for (const vendor of vendors) {
      try {
        await prisma.vendor.create({ data: vendor });
        
        if (this.options.verbose) {
          console.log(`   ✓ Created vendor: ${vendor.name}`);
        }
      } catch (error) {
        console.error(`   ❌ Failed to create vendor ${vendor.name}:`, error);
      }
    }
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(): SeedOptions {
  const args = process.argv.slice(2);
  const options: SeedOptions = {};
  
  for (const arg of args) {
    switch (arg) {
      case '--force':
        options.force = true;
        break;
      case '--minimal':
        options.minimal = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--skip-probo':
        options.skipProbo = true;
        break;
      case '--help':
        console.log(`
Database Seeding Script

Usage: tsx scripts/seed-database.ts [options]

Options:
  --force       Force seeding even if data exists
  --minimal     Only seed essential data (no samples)
  --verbose     Enable verbose output
  --skip-probo  Skip Probo mitigation seeding
  --help        Show this help message

Examples:
  tsx scripts/seed-database.ts                 # Basic seeding
  tsx scripts/seed-database.ts --force         # Force reseed
  tsx scripts/seed-database.ts --minimal       # Essential data only
        `);
        process.exit(0);
        break;
      default:
        console.warn(`Unknown argument: ${arg}`);
        break;
    }
  }
  
  return options;
}

/**
 * Main execution
 */
async function main() {
  try {
    const options = parseArgs();
    const seeder = new DatabaseSeeder(options);
    
    await seeder.seed();
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Start your application');
    console.log('2. Login with demo credentials');
    console.log('3. Explore the Probo integration features');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n💥 Seeding failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Ensure database is running and accessible');
    console.log('2. Check that migrations have been applied');
    console.log('3. Verify Probo mitigation data file exists');
    console.log('\nFor help: tsx scripts/seed-database.ts --help');
    
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { DatabaseSeeder }; 