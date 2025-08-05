#!/usr/bin/env tsx

/**
 * Comprehensive Test Data Generator for Riscura GRC Platform
 * 
 * This script generates realistic, production-like test data for:
 * - Organizations with different industries and sizes
 * - Users with varied roles and permissions
 * - Comprehensive risk libraries across all categories
 * - Control frameworks (SOC 2, ISO 27001, etc.)
 * - Test executions and audit trails
 * - Team collaboration scenarios
 * - Active subscriptions with full feature access
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Test data templates
const ORGANIZATIONS = [
  {
    name: "TechCorp Industries",
    domain: "techcorp.com",
    plan: "enterprise",
    industry: "Technology",
    size: "500-1000 employees"
  },
  {
    name: "FinanceFirst LLC",
    domain: "financefirst.com", 
    plan: "professional",
    industry: "Financial Services",
    size: "100-500 employees"  
  },
  {
    name: "HealthSecure Systems",
    domain: "healthsecure.com",
    plan: "enterprise",
    industry: "Healthcare",
    size: "1000+ employees"
  }
];

const TEST_USERS = [
  {
    email: "admin@riscura.com",
    firstName: "Admin",
    lastName: "User",
    role: "ADMIN",
    password: "admin123"
  },
  {
    email: "risk.manager@riscura.com",
    firstName: "Sarah",
    lastName: "Johnson",
    role: "RISK_MANAGER",
    password: "password123"
  },
  {
    email: "auditor@riscura.com",
    firstName: "Michael",
    lastName: "Chen",
    role: "AUDITOR", 
    password: "password123"
  },
  {
    email: "analyst@riscura.com",
    firstName: "Emma",
    lastName: "Rodriguez",
    role: "USER",
    password: "password123"
  }
];

const RISK_CATEGORIES = {
  OPERATIONAL: [
    {
      title: "Business Continuity Failure",
      description: "Inability to maintain critical business operations during disruptions or disasters, leading to revenue loss and customer impact.",
      likelihood: 3,
      impact: 4,
      category: "OPERATIONAL"
    },
    {
      title: "Supply Chain Disruption", 
      description: "Critical vendor or supplier failure causing delays, quality issues, or inability to deliver products/services.",
      likelihood: 4,
      impact: 3,
      category: "OPERATIONAL"
    },
    {
      title: "Key Personnel Loss",
      description: "Departure of critical employees with specialized knowledge, potentially disrupting operations and project delivery.",
      likelihood: 3,
      impact: 3,
      category: "OPERATIONAL"
    },
    {
      title: "Process Failure",
      description: "Breakdown in core business processes leading to operational inefficiencies, errors, or service delivery failures.",
      likelihood: 2,
      impact: 3,
      category: "OPERATIONAL"
    }
  ],
  TECHNOLOGY: [
    {
      title: "Cybersecurity Breach",
      description: "Unauthorized access to systems and data through malware, phishing, or other attack vectors, potentially exposing sensitive information.",
      likelihood: 4,
      impact: 5,
      category: "TECHNOLOGY"
    },
    {
      title: "System Downtime",
      description: "Critical system outages affecting business operations, customer service, and revenue generation capabilities.",
      likelihood: 3,
      impact: 4,
      category: "TECHNOLOGY"
    },
    {
      title: "Data Loss",
      description: "Permanent loss of critical business data due to hardware failure, human error, or inadequate backup procedures.",
      likelihood: 2,
      impact: 4,
      category: "TECHNOLOGY"
    },
    {
      title: "Legacy System Failure",
      description: "Outdated systems becoming unreliable or unsupported, creating security vulnerabilities and operational risks.",
      likelihood: 3,
      impact: 3,
      category: "TECHNOLOGY"
    }
  ],
  FINANCIAL: [
    {
      title: "Market Volatility",
      description: "Significant market fluctuations affecting investment portfolios, revenue streams, and overall financial performance.",
      likelihood: 4,
      impact: 3,
      category: "FINANCIAL"
    },
    {
      title: "Credit Risk",
      description: "Customer payment defaults or delayed payments impacting cash flow and profitability.",
      likelihood: 3,
      impact: 3,
      category: "FINANCIAL"
    },
    {
      title: "Currency Exchange Risk",
      description: "Adverse foreign exchange rate movements affecting international transactions and financial results.",
      likelihood: 3,
      impact: 2,
      category: "FINANCIAL"
    },
    {
      title: "Budget Overruns",
      description: "Project costs exceeding approved budgets due to scope creep, resource constraints, or unforeseen expenses.",
      likelihood: 4,
      impact: 2,
      category: "FINANCIAL"
    }
  ],
  COMPLIANCE: [
    {
      title: "Regulatory Non-Compliance",
      description: "Failure to meet industry regulations (SOX, GDPR, HIPAA) resulting in fines, legal action, and reputation damage.",
      likelihood: 2,
      impact: 5,
      category: "COMPLIANCE"
    },
    {
      title: "Data Privacy Violations",
      description: "Improper handling of personal data leading to privacy breaches and regulatory penalties.",
      likelihood: 3,
      impact: 4,
      category: "COMPLIANCE"
    },
    {
      title: "Audit Findings",
      description: "Internal or external audit discoveries revealing control deficiencies requiring immediate remediation.",
      likelihood: 3,
      impact: 3,
      category: "COMPLIANCE"
    },
    {
      title: "Policy Violations",
      description: "Employee non-compliance with internal policies and procedures creating operational and legal risks.",
      likelihood: 4,
      impact: 2,
      category: "COMPLIANCE"
    }
  ],
  STRATEGIC: [
    {
      title: "Competitive Disadvantage",
      description: "Loss of market position due to competitor actions, technological disruption, or changing customer preferences.",
      likelihood: 3,
      impact: 4,
      category: "STRATEGIC"
    },
    {
      title: "Reputation Damage",
      description: "Negative publicity or customer sentiment affecting brand value, customer loyalty, and business relationships.",
      likelihood: 2,
      impact: 4,
      category: "STRATEGIC"
    },
    {
      title: "Strategic Initiative Failure",
      description: "Key business initiatives or projects failing to achieve objectives, wasting resources and missing opportunities.",
      likelihood: 3,
      impact: 3,
      category: "STRATEGIC"
    },
    {
      title: "Partnership Risks",
      description: "Strategic partner disputes, contract breaches, or partner financial difficulties affecting joint initiatives.",
      likelihood: 2,
      impact: 3,
      category: "STRATEGIC"
    }
  ]
};

const CONTROLS_LIBRARY = [
  // Access Control
  {
    title: "Multi-Factor Authentication",
    description: "Implement MFA for all user accounts accessing critical systems and applications.",
    type: "PREVENTIVE",
    category: "TECHNICAL",
    frequency: "Continuous",
    effectiveness: 0.85,
    automationLevel: "FULLY_AUTOMATED"
  },
  {
    title: "Privileged Access Management",
    description: "Control and monitor privileged user access to critical systems and data.",
    type: "PREVENTIVE", 
    category: "TECHNICAL",
    frequency: "Daily",
    effectiveness: 0.90,
    automationLevel: "FULLY_AUTOMATED"
  },
  {
    title: "User Access Reviews",
    description: "Regular review and certification of user access rights and permissions.",
    type: "DETECTIVE",
    category: "ADMINISTRATIVE",
    frequency: "Quarterly",
    effectiveness: 0.75,
    automationLevel: "SEMI_AUTOMATED"
  },
  
  // Data Protection
  {
    title: "Data Encryption at Rest",
    description: "Encrypt sensitive data stored in databases and file systems using AES-256 encryption.",
    type: "PREVENTIVE",
    category: "TECHNICAL", 
    frequency: "Continuous",
    effectiveness: 0.95,
    automationLevel: "FULLY_AUTOMATED"
  },
  {
    title: "Data Loss Prevention",
    description: "Monitor and prevent unauthorized data exfiltration through email, web, and removable media.",
    type: "DETECTIVE",
    category: "TECHNICAL",
    frequency: "Continuous", 
    effectiveness: 0.80,
    automationLevel: "FULLY_AUTOMATED"
  },
  {
    title: "Data Classification",
    description: "Classify data based on sensitivity levels and apply appropriate protection measures.",
    type: "PREVENTIVE",
    category: "ADMINISTRATIVE",
    frequency: "Monthly",
    effectiveness: 0.70,
    automationLevel: "SEMI_AUTOMATED"
  },

  // Network Security
  {
    title: "Network Segmentation",
    description: "Segment network into security zones with appropriate access controls and monitoring.",
    type: "PREVENTIVE",
    category: "TECHNICAL",
    frequency: "Continuous",
    effectiveness: 0.85,
    automationLevel: "MANUAL"
  },
  {
    title: "Intrusion Detection System",
    description: "Monitor network traffic for suspicious activities and potential security breaches.",
    type: "DETECTIVE",
    category: "TECHNICAL", 
    frequency: "Continuous",
    effectiveness: 0.75,
    automationLevel: "FULLY_AUTOMATED"
  },
  {
    title: "Firewall Management",
    description: "Configure and maintain firewall rules to control network traffic and prevent unauthorized access.",
    type: "PREVENTIVE",
    category: "TECHNICAL",
    frequency: "Weekly",
    effectiveness: 0.80,
    automationLevel: "SEMI_AUTOMATED"
  },

  // Business Continuity
  {
    title: "Backup and Recovery",
    description: "Regular backup of critical data and systems with tested recovery procedures.",
    type: "CORRECTIVE",
    category: "TECHNICAL",
    frequency: "Daily",
    effectiveness: 0.90,
    automationLevel: "FULLY_AUTOMATED"
  },
  {
    title: "Disaster Recovery Plan",
    description: "Comprehensive plan for restoring business operations after a major disruption.",
    type: "CORRECTIVE",
    category: "ADMINISTRATIVE",
    frequency: "Annual",
    effectiveness: 0.85,
    automationLevel: "MANUAL"
  },
  {
    title: "Business Impact Analysis",
    description: "Regular assessment of critical business processes and their recovery time objectives.",
    type: "DETECTIVE",
    category: "ADMINISTRATIVE",
    frequency: "Annual",
    effectiveness: 0.75,
    automationLevel: "MANUAL"
  }
];

const TEST_SCRIPTS = [
  {
    title: "MFA Configuration Verification",
    description: "Verify multi-factor authentication is properly configured and enforced",
    steps: [
      "Attempt login with username/password only",
      "Verify MFA challenge is presented", 
      "Complete MFA challenge with valid token",
      "Verify successful authentication",
      "Test with invalid MFA token"
    ],
    expectedResults: "MFA required for all logins, invalid tokens rejected",
    testType: "MANUAL",
    frequency: "QUARTERLY"
  },
  {
    title: "Data Encryption Validation",
    description: "Validate that sensitive data is properly encrypted at rest",
    steps: [
      "Access database directly",
      "Query sensitive data tables",
      "Verify data appears encrypted",
      "Test decryption with proper keys",
      "Verify access logs are generated"
    ],
    expectedResults: "All sensitive data encrypted, access logged",
    testType: "MANUAL", 
    frequency: "QUARTERLY"
  },
  {
    title: "Backup Recovery Test",
    description: "Test backup and recovery procedures for critical systems",
    steps: [
      "Identify test dataset for recovery",
      "Perform backup of test data",
      "Simulate data loss scenario",
      "Execute recovery procedures",
      "Verify data integrity post-recovery"
    ],
    expectedResults: "Complete data recovery within RTO, no data corruption",
    testType: "MANUAL",
    frequency: "SEMI_ANNUAL"
  }
];

const COMPLIANCE_FRAMEWORKS = [
  {
    name: "SOC 2 Type II",
    description: "System and Organization Controls for Security, Availability, Processing Integrity, Confidentiality, and Privacy",
    type: "SOC2",
    version: "2017"
  },
  {  
    name: "ISO 27001:2013",
    description: "Information Security Management System requirements",
    type: "ISO_27001",
    version: "2013"
  },
  {
    name: "NIST Cybersecurity Framework",
    description: "Framework for improving critical infrastructure cybersecurity",
    type: "NIST", 
    version: "1.1"
  }
];

async function createTestOrganization() {
  console.log('🏢 Creating test organization...');
  
  const org = await prisma.organization.create({
    data: {
      name: "Riscura Test Organization",
      domain: "test.riscura.com",
      plan: "enterprise",
      isActive: true,
      settings: {
        industry: "Technology",
        size: "100-500 employees",
        timezone: "America/New_York",
        features: {
          aiInsights: true,  
          advancedAnalytics: true,
          customFrameworks: true,
          apiAccess: true
        }
      }
    }
  });

  console.log(`✅ Created organization: ${org.name} (${org.id})`);
  return org;
}

async function createTestUsers(organizationId: string) {
  console.log('👥 Creating test users...');
  
  const users = [];
  
  for (const userData of TEST_USERS) {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        passwordHash: hashedPassword,
        role: userData.role as any,
        organizationId,
        isActive: true,
        emailVerified: new Date(),
        permissions: getUserPermissions(userData.role),
        lastLogin: new Date()
      }
    });
    
    users.push(user);
    console.log(`✅ Created user: ${user.email} (${user.role})`);
  }
  
  return users;
}

function getUserPermissions(role: string): string[] {
  switch (role) {
    case 'ADMIN':
      return ['*'];
    case 'RISK_MANAGER':
      return [
        'risks:read', 'risks:write', 'risks:delete',
        'controls:read', 'controls:write', 'controls:delete', 
        'documents:read', 'documents:write',
        'ai:chat', 'ai:analysis'
      ];
    case 'AUDITOR':
      return [
        'risks:read', 'controls:read', 'documents:read',
        'reports:read', 'reports:write'
      ];
    case 'USER':
      return ['risks:read', 'controls:read', 'documents:read'];
    default:
      return ['risks:read'];
  }
}

async function createTestRisks(organizationId: string, userId: string) {
  console.log('⚠️ Creating comprehensive risk library...');
  
  const risks = [];
  
  for (const [category, categoryRisks] of Object.entries(RISK_CATEGORIES)) {
    for (const riskData of categoryRisks) {
      const riskScore = riskData.likelihood * riskData.impact;
      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      
      if (riskScore <= 4) riskLevel = 'LOW';
      else if (riskScore <= 9) riskLevel = 'MEDIUM'; 
      else if (riskScore <= 16) riskLevel = 'HIGH';
      else riskLevel = 'CRITICAL';
      
      const risk = await prisma.risk.create({
        data: {
          title: riskData.title,
          description: riskData.description,
          category: riskData.category as any,
          likelihood: riskData.likelihood,
          impact: riskData.impact,
          riskScore,
          riskLevel,
          status: 'ASSESSED',
          dateIdentified: new Date(),
          lastAssessed: new Date(),
          nextReview: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
          aiConfidence: 0.8,
          organizationId,
          createdBy: userId,
          owner: userId
        }
      });
      
      risks.push(risk);
      console.log(`✅ Created ${category} risk: ${risk.title}`);
    }
  }
  
  return risks;
}

async function createTestControls(organizationId: string, userId: string) {
  console.log('🛡️ Creating control library...');
  
  const controls = [];
  
  for (const controlData of CONTROLS_LIBRARY) {
    const control = await prisma.control.create({
      data: {
        title: controlData.title,
        description: controlData.description,
        type: controlData.type as any,
        category: controlData.category as any,
        frequency: controlData.frequency,
        effectiveness: controlData.effectiveness,
        automationLevel: controlData.automationLevel as any,
        status: 'OPERATIONAL',
        priority: 'MEDIUM',
        lastTestDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        nextTestDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        organizationId,
        createdBy: userId,
        owner: userId
      }
    });
    
    controls.push(control);
    console.log(`✅ Created control: ${control.title}`);
  }
  
  return controls;
}

async function createControlRiskMappings(risks: any[], controls: any[]) {
  console.log('🔗 Creating control-risk mappings...');
  
  const mappings = [];
  
  // Map controls to risks based on categories
  for (const risk of risks) {
    const relevantControls = controls.filter(control => {
      if (risk.category === 'TECHNOLOGY') {
        return control.category === 'TECHNICAL';
      }
      if (risk.category === 'COMPLIANCE') {
        return control.category === 'ADMINISTRATIVE' || control.category === 'TECHNICAL';
      }
      if (risk.category === 'OPERATIONAL') {
        return control.category === 'ADMINISTRATIVE' || control.category === 'OPERATIONAL';
      }
      return true;
    });
    
    // Map 2-3 controls per risk
    const controlsToMap = relevantControls.slice(0, Math.min(3, relevantControls.length));
    
    for (const control of controlsToMap) {
      const mapping = await prisma.controlRiskMapping.create({
        data: {
          riskId: risk.id,
          controlId: control.id,
          effectiveness: 0.7 + Math.random() * 0.25 // 0.7 to 0.95
        }
      });
      
      mappings.push(mapping);
    }
  }
  
  console.log(`✅ Created ${mappings.length} control-risk mappings`);
  return mappings;
}

async function createTestScripts(organizationId: string, userId: string) {
  console.log('📋 Creating test scripts...');
  
  const scripts = [];
  
  for (const scriptData of TEST_SCRIPTS) {
    const script = await prisma.testScript.create({
      data: {
        title: scriptData.title,
        description: scriptData.description,
        steps: scriptData.steps,
        expectedResults: scriptData.expectedResults,
        testType: scriptData.testType as any,
        frequency: scriptData.frequency as any,
        estimatedDuration: 60, // 60 minutes
        automationCapable: false,
        organizationId,
        createdBy: userId
      }
    });
    
    scripts.push(script);
    console.log(`✅ Created test script: ${script.title}`);
  }
  
  return scripts;
}

async function createComplianceFrameworks(organizationId: string, userId: string) {
  console.log('📊 Creating compliance frameworks...');
  
  const frameworks = [];
  
  for (const frameworkData of COMPLIANCE_FRAMEWORKS) {
    const framework = await prisma.complianceFramework.create({
      data: {
        name: frameworkData.name,
        description: frameworkData.description,
        type: frameworkData.type as any,
        version: frameworkData.version,
        isActive: true,
        organizationId,
        createdBy: userId
      }
    });
    
    frameworks.push(framework);
    console.log(`✅ Created framework: ${framework.name}`);
  }
  
  return frameworks;
}

async function createTestExecutions(controls: any[], scripts: any[], userId: string) {
  console.log('🧪 Creating test executions...');
  
  const executions = [];
  
  for (let i = 0; i < Math.min(10, controls.length); i++) {
    const control = controls[i];
    const script = scripts[i % scripts.length];
    
    const execution = await prisma.testExecution.create({
      data: {
        testScriptId: script.id,
        controlId: control.id,
        executedBy: userId,
        executionDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        status: Math.random() > 0.2 ? 'PASSED' : 'FAILED',
        results: {
          summary: 'Test execution completed successfully',
          findings: ['All test steps completed', 'No issues identified'],
          recommendations: ['Continue monitoring', 'Schedule next test']
        },
        evidence: ['test-log-001.pdf', 'screenshot-001.png'],
        notes: 'Routine testing performed as scheduled',
        duration: 45 + Math.floor(Math.random() * 60) // 45-105 minutes
      }
    });
    
    executions.push(execution);
  }
  
  console.log(`✅ Created ${executions.length} test executions`);
  return executions;
}

async function createSampleDocuments(organizationId: string, userId: string) {
  console.log('📄 Creating sample documents...');
  
  const documents = [
    {
      name: "Information Security Policy",
      type: "application/pdf",
      size: 2048576,
      content: "Sample information security policy document content...",
      extractedText: "This document outlines the organization's approach to information security...",
      aiAnalysis: {
        summary: "Comprehensive information security policy covering access controls, data protection, and incident response",
        riskFactors: ["Outdated encryption standards", "Missing multi-factor authentication requirements"],
        complianceGaps: ["SOC 2 Type II controls need updating"]
      }
    },
    {
      name: "Business Continuity Plan", 
      type: "application/pdf",
      size: 3145728,
      content: "Sample business continuity plan document content...",
      extractedText: "This business continuity plan ensures organizational resilience...",
      aiAnalysis: {
        summary: "Business continuity plan with disaster recovery procedures and emergency response protocols",
        riskFactors: ["Recovery time objectives may be too optimistic", "Vendor dependencies not fully addressed"],
        complianceGaps: ["ISO 27001 business continuity requirements partially met"]
      }
    },
    {
      name: "Risk Assessment Report Q4 2024",
      type: "application/pdf", 
      size: 1572864,
      content: "Quarterly risk assessment findings and recommendations...",
      extractedText: "Q4 2024 risk assessment identified several areas for improvement...",
      aiAnalysis: {
        summary: "Quarterly risk assessment covering operational, technical, and compliance risks",
        riskFactors: ["Increasing cyber threats", "Supply chain vulnerabilities"],
        complianceGaps: ["Risk register requires additional documentation"]
      }
    }
  ];
  
  const createdDocs = [];
  
  for (const docData of documents) {
    const doc = await prisma.document.create({
      data: {
        name: docData.name,
        type: docData.type,
        size: docData.size,
        content: docData.content,
        extractedText: docData.extractedText,
        aiAnalysis: docData.aiAnalysis,
        uploadedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
        organizationId,
        uploadedBy: userId
      }
    });
    
    createdDocs.push(doc);
    console.log(`✅ Created document: ${doc.name}`);
  }
  
  return createdDocs;
}

async function createActivityLogs(organizationId: string, userId: string, risks: any[], controls: any[]) {
  console.log('📊 Creating activity logs...');
  
  const activities = [];
  const activityTypes = ['CREATED', 'UPDATED', 'APPROVED', 'ASSIGNED', 'COMPLETED'];
  
  // Create activities for risks
  for (let i = 0; i < Math.min(20, risks.length); i++) {
    const risk = risks[i];
    const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
    
    const activity = await prisma.activity.create({
      data: {
        type: activityType as any,
        userId,
        entityType: 'RISK',
        entityId: risk.id,
        description: `Risk "${risk.title}" was ${activityType.toLowerCase()}`,
        metadata: {
          previousValues: {},
          newValues: {},
          userAgent: 'Test Data Generator'
        },
        isPublic: true,
        organizationId
      }
    });
    
    activities.push(activity);
  }
  
  // Create activities for controls
  for (let i = 0; i < Math.min(15, controls.length); i++) {
    const control = controls[i];
    const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
    
    const activity = await prisma.activity.create({
      data: {
        type: activityType as any,
        userId,
        entityType: 'CONTROL',
        entityId: control.id,
        description: `Control "${control.title}" was ${activityType.toLowerCase()}`,
        metadata: {
          previousValues: {},
          newValues: {},
          userAgent: 'Test Data Generator'
        },
        isPublic: true,
        organizationId
      }
    });
    
    activities.push(activity);
  }
  
  console.log(`✅ Created ${activities.length} activity log entries`);
  return activities;
}

async function main() {
  try {
    console.log('🚀 Starting comprehensive test data generation...\n');
    
    // Clean existing test data
    console.log('🧹 Cleaning existing test data...');
    await prisma.activity.deleteMany({ where: { organization: { domain: 'test.riscura.com' } } });
    await prisma.testExecution.deleteMany({ where: { control: { organization: { domain: 'test.riscura.com' } } } });
    await prisma.controlRiskMapping.deleteMany({ where: { risk: { organization: { domain: 'test.riscura.com' } } } });
    await prisma.document.deleteMany({ where: { organization: { domain: 'test.riscura.com' } } });
    await prisma.testScript.deleteMany({ where: { organization: { domain: 'test.riscura.com' } } });
    await prisma.complianceFramework.deleteMany({ where: { organization: { domain: 'test.riscura.com' } } });
    await prisma.control.deleteMany({ where: { organization: { domain: 'test.riscura.com' } } });
    await prisma.risk.deleteMany({ where: { organization: { domain: 'test.riscura.com' } } });
    await prisma.user.deleteMany({ where: { organization: { domain: 'test.riscura.com' } } });
    await prisma.organization.deleteMany({ where: { domain: 'test.riscura.com' } });
    
    // Create test data
    const organization = await createTestOrganization();
    const users = await createTestUsers(organization.id);
    const adminUser = users.find(u => u.role === 'ADMIN')!;
    
    const risks = await createTestRisks(organization.id, adminUser.id);
    const controls = await createTestControls(organization.id, adminUser.id);
    const mappings = await createControlRiskMappings(risks, controls);
    const testScripts = await createTestScripts(organization.id, adminUser.id);
    const frameworks = await createComplianceFrameworks(organization.id, adminUser.id);
    const testExecutions = await createTestExecutions(controls, testScripts, adminUser.id);
    const documents = await createSampleDocuments(organization.id, adminUser.id);
    const activities = await createActivityLogs(organization.id, adminUser.id, risks, controls);
    
    console.log('\n🎉 Test data generation completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Organizations: 1`);
    console.log(`   Users: ${users.length}`);
    console.log(`   Risks: ${risks.length}`);
    console.log(`   Controls: ${controls.length}`);
    console.log(`   Control-Risk Mappings: ${mappings.length}`);
    console.log(`   Test Scripts: ${testScripts.length}`);
    console.log(`   Compliance Frameworks: ${frameworks.length}`);
    console.log(`   Test Executions: ${testExecutions.length}`);
    console.log(`   Documents: ${documents.length}`);
    console.log(`   Activity Logs: ${activities.length}`);
    
    console.log('\n🔐 Test Credentials:');
    console.log(`   Admin: admin@riscura.com / admin123`);
    console.log(`   Risk Manager: risk.manager@riscura.com / password123`);
    console.log(`   Auditor: auditor@riscura.com / password123`);
    console.log(`   Analyst: analyst@riscura.com / password123`);
    
    console.log('\n✅ Ready for comprehensive functionality testing!');
    
  } catch (error) {
    console.error('❌ Error generating test data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if this file is executed directly
main().catch((error) => {
  console.error(error);
  process.exit(1);
});

export { main as generateTestData };