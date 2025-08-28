#!/usr/bin/env node

/**
 * Demo Data Population Script
 * Based on KBNY RCSA Banking Risk Assessment
 * 
 * Run with: node scripts/populate-demo-data.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_ORG_ID = 'cmcccirkt0000hevoh09kjf0t';
const DEMO_USER_ID = 'cmcccirww0002hevobw5r2v5n';

// Risk Categories from RCSA
const RISK_CATEGORIES = [
  {
    name: 'Credit Risk',
    subcategories: ['Asset Quality Risk', 'Counterparty / Default Risk', 'Concentration Risk']
  },
  {
    name: 'Operational Risk', 
    subcategories: [
      'Business Continuity, Resiliency, & Recovery Risk',
      'Execution & Delivery Risk',
      'Execution & Delivery Risk (including Regulatory & Financial Reporting)',
      'IT, Cybersecurity, & Data Risk',
      'Model Risk',
      'Fraud Risk',
      'Third Party / Vendor Risk',
      'Physical Security & Safety Risk'
    ]
  },
  {
    name: 'Compliance Risk',
    subcategories: [
      'Regulatory and Financial Crimes Risk',
      'Enterprise Compliance & Ethics Risk',
      'Fraud Risk'
    ]
  },
  {
    name: 'Liquidity & Interest Rate Risk',
    subcategories: ['Interest Rate Risk', 'Liquidity Risk', 'Market Risk']
  },
  {
    name: 'Strategic & Reputational Risk',
    subcategories: ['Reputational Risk', 'Strategic Risk']
  }
];

// Sample risks from RCSA
const SAMPLE_RISKS = [
  {
    id: 'R.001',
    title: 'Asset Quality Classification Standards',
    description: 'Failure to maintain stringent standards for the classification of asset quality may lead to a smaller accrual in the allowance for bad debts, resulting in understated financial liabilities, regulatory non-compliance, and financial instability.',
    category: 'Credit Risk',
    subcategory: 'Asset Quality Risk',
    likelihood: 'Possible',
    impact: 'Moderate',
    inherentRisk: 'Moderate',
    owner: 'Credit Manager',
    function: 'Credit Analysis'
  },
  {
    id: 'R.002', 
    title: 'Asset Quality Reporting Changes',
    description: 'Failure to report changes in classification criteria of asset quality and accrual standards for allowance for bad debts may lead to undetected changes in asset quality and bad debt allowances, resulting in regulatory non-compliance, misinformed decision-making, and financial instability.',
    category: 'Credit Risk',
    subcategory: 'Asset Quality Risk',
    likelihood: 'Possible',
    impact: 'High',
    inherentRisk: 'High',
    owner: 'Compliance Reporting Team',
    function: 'Middle Office (CB)'
  },
  {
    id: 'R.003',
    title: 'Credit Quality Monitoring',
    description: 'Risk that KB is not properly monitoring the credit quality of their loan portfolio may lead to incorrect asset quality (e.g., not downgrading timely when changes to the client risk profile have changed) resulting in financial losses or regulatory fines or notices.',
    category: 'Credit Risk',
    subcategory: 'Asset Quality Risk', 
    likelihood: 'Possible',
    impact: 'High',
    inherentRisk: 'High',
    owner: 'Credit Risk Monitoring Team',
    function: 'Corporate Banking'
  },
  {
    id: 'R.032',
    title: 'Embezzlement and Fraud Detection',
    description: 'Failure to detect embezzlement or fraud, may lead to unauthorized financial transactions and loss of funds, resulting in financial losses, operational disruptions, and legal and reputational consequences.',
    category: 'Compliance Risk',
    subcategory: 'Fraud Risk',
    likelihood: 'Possible',
    impact: 'High', 
    inherentRisk: 'High',
    owner: 'Fraud Prevention Officer',
    function: 'Back Office'
  },
  {
    id: 'R.034',
    title: 'Interest Rate and Market Volatility',
    description: 'Risk that changes in interest rates and market conditions may lead to the adversely affect the financial stability of corporate banking clients, resulting in increased default rates and financial losses.',
    category: 'Liquidity & Interest Rate Risk',
    subcategory: 'Interest Rate Risk',
    likelihood: 'Likely',
    impact: 'High',
    inherentRisk: 'High',
    owner: 'Treasury Desk Officer', 
    function: 'Corporate Banking'
  },
  {
    id: 'R.046',
    title: 'Core Banking System Encryption',
    description: 'Risk that sensitive information in the core banking system may not be adequately encrypted, may lead to potential data breaches, resulting in regulatory non-compliance, financial penalties, and damage to the bank\'s reputation.',
    category: 'Operational Risk',
    subcategory: 'IT, Cybersecurity, & Data Risk',
    likelihood: 'Likely',
    impact: 'High',
    inherentRisk: 'High',
    owner: 'IT Manager',
    function: 'Information Security'
  }
];

// Sample controls from RCSA
const SAMPLE_CONTROLS = [
  {
    id: 'C.001',
    title: 'Risk Rating and Classification Policy Review',
    description: 'Annually, or when regulatory changes occur, the Credit Manager and the USRMC conducts a reviews of Risk Rating and Classification Policy to ensure alignment with regulatory requirements and internal processes. This control mitigates the risk of understated financial liabilities and regulatory non-compliance. Evidence for this control includes the USRMC minutes documenting the review and approval of the Risk Rating and Classification Policy. Documentation is stored in KBNY\'s document management system.',
    riskId: 'R.001',
    owner: 'Credit Manager',
    frequency: 'Annually',
    type: 'PREVENTIVE',
    automation: 'MANUAL',
    effectiveness: 'EFFECTIVE',
    evidence: 'USRMC meeting minutes'
  },
  {
    id: 'C.002',
    title: 'Asset Classification Change Reporting',
    description: 'Quarterly, or when a known change to the credit quality of the borrower occurs, the Credit Manager reviews the credit quality of the borrower and communicates changes in asset classification criteria and accrual standards for allowance for bad debts to the middle office. This control mitigates the risk of undetected changes and regulatory non-compliance. Evidence for this control includes the quarterly review documents, and notifications to middle office of changes in classification. Evidence is stored in KBNY\'s document management system.',
    riskId: 'R.002', 
    owner: 'Compliance Reporting Team',
    frequency: 'Quarterly',
    type: 'DETECTIVE',
    automation: 'MANUAL',
    effectiveness: 'EFFECTIVE',
    evidence: 'Quarterly review documentation, notification of classification changes'
  },
  {
    id: 'C.003',
    title: 'Loan Portfolio Credit Quality Review',
    description: 'Quarterly, the Credit Manager conducts reviews of the loan portfolio\'s borrowers credit quality to ensure timely downgrading the borrower risk profile. This mitigates the risk of financial losses or regulatory fines. Evidence for this control includes credit quality review documentation and, downgrade reports. Evidence is stored in KBNY\'s document management system.',
    riskId: 'R.003',
    owner: 'Credit Risk Monitoring Team',
    frequency: 'Quarterly', 
    type: 'DETECTIVE',
    automation: 'MANUAL',
    effectiveness: 'EFFECTIVE',
    evidence: 'Monitoring reports, credit review logs, adjustment records stored in internal system'
  },
  {
    id: 'C.032',
    title: 'Fraud Detection and Prevention Audits',
    description: 'Monthly, the Fraud Prevention Officer conducts audits and reviews to detect and prevent embezzlement or fraud to mitigate the risk of the failure to detect embezzlement or fraud which lead to financial losses, operational disruptions, and legal and reputational consequences. Evidence includes audit logs, fraud detection reports, and corrective action plans, stored in the bank\'s document management system.',
    riskId: 'R.032',
    owner: 'Fraud Prevention Officer',
    frequency: 'Monthly',
    type: 'DETECTIVE', 
    automation: 'MANUAL',
    effectiveness: 'PARTIALLY_EFFECTIVE',
    evidence: 'Audit logs, fraud detection reports, corrective action plans'
  },
  {
    id: 'C.034',
    title: 'Interest Rate and Market Condition Monitoring',
    description: 'Monthly, the Treasury Desk Officer monitors interest rate fluctuations and market conditions to mitigate adverse impacts on the financial stability of corporate banking clients. This control is in place to mitigate the risk of the severe volatility change of interest rates and market conditions which lead to increase in default rates and financial losses. Evidence includes monitoring reports, risk analysis documents, and client communication logs, stored in the bank\'s document management system.',
    riskId: 'R.034',
    owner: 'Treasury Desk Officer',
    frequency: 'Monthly',
    type: 'DETECTIVE',
    automation: 'SEMI_AUTOMATED', 
    effectiveness: 'PARTIALLY_EFFECTIVE',
    evidence: 'Monitoring reports, risk analysis documents, client communication logs'
  },
  {
    id: 'C.046',
    title: 'Core Banking System Encryption Review',
    description: 'Quarterly, the Encryption Manager reviews and updates encryption protocols for sensitive information in the core banking system to ensure data protection and mitigate potential breaches. Evidence includes encryption review logs, protocol update reports, and compliance checklists, stored in the bank\'s document management system.',
    riskId: 'R.046',
    owner: 'IT Manager',
    frequency: 'Quarterly',
    type: 'PREVENTIVE',
    automation: 'SEMI_AUTOMATED',
    effectiveness: 'PARTIALLY_EFFECTIVE', 
    evidence: 'Encryption review logs, protocol update reports, compliance checklists'
  }
];

async function createDemoRisks() {
  console.log('📊 Creating demo risks...');
  
  for (const riskData of SAMPLE_RISKS) {
    try {
      await prisma.risk.upsert({
        where: { 
          organizationId_externalId: {
            organizationId: DEMO_ORG_ID,
            externalId: riskData.id
          }
        },
        update: {
          title: riskData.title,
          description: riskData.description,
          category: riskData.category,
          subcategory: riskData.subcategory,
          likelihood: riskData.likelihood,
          impact: riskData.impact,
          inherentRisk: riskData.inherentRisk,
          owner: riskData.owner,
          function: riskData.function,
          updatedAt: new Date()
        },
        create: {
          organizationId: DEMO_ORG_ID,
          externalId: riskData.id,
          title: riskData.title,
          description: riskData.description,
          category: riskData.category,
          subcategory: riskData.subcategory,
          likelihood: riskData.likelihood,
          impact: riskData.impact,
          inherentRisk: riskData.inherentRisk,
          owner: riskData.owner,
          function: riskData.function,
          status: 'IDENTIFIED',
          createdBy: DEMO_USER_ID
        }
      });
      console.log(`✅ Created risk: ${riskData.id} - ${riskData.title}`);
    } catch (error) {
      console.error(`❌ Error creating risk ${riskData.id}:`, error.message);
    }
  }
}

async function createDemoControls() {
  console.log('🛡️ Creating demo controls...');
  
  for (const controlData of SAMPLE_CONTROLS) {
    try {
      // Find the risk first
      const risk = await prisma.risk.findFirst({
        where: { 
          organizationId: DEMO_ORG_ID,
          externalId: controlData.riskId
        }
      });

      if (!risk) {
        console.log(`⚠️ Risk ${controlData.riskId} not found, skipping control ${controlData.id}`);
        continue;
      }

      const control = await prisma.control.upsert({
        where: {
          organizationId_externalId: {
            organizationId: DEMO_ORG_ID,
            externalId: controlData.id
          }
        },
        update: {
          title: controlData.title,
          description: controlData.description,
          type: controlData.type,
          frequency: controlData.frequency,
          automationLevel: controlData.automation,
          effectiveness: controlData.effectiveness,
          owner: controlData.owner,
          testResults: controlData.evidence,
          updatedAt: new Date()
        },
        create: {
          organizationId: DEMO_ORG_ID,
          externalId: controlData.id,
          title: controlData.title,
          description: controlData.description,
          type: controlData.type,
          frequency: controlData.frequency,
          automationLevel: controlData.automation,
          effectiveness: controlData.effectiveness,
          owner: controlData.owner,
          testResults: controlData.evidence,
          status: 'IMPLEMENTED',
          createdBy: DEMO_USER_ID
        }
      });

      // Create risk-control mapping
      await prisma.controlRiskMapping.upsert({
        where: {
          riskId_controlId: {
            riskId: risk.id,
            controlId: control.id
          }
        },
        update: {},
        create: {
          riskId: risk.id,
          controlId: control.id
        }
      });

      console.log(`✅ Created control: ${controlData.id} - ${controlData.title}`);
    } catch (error) {
      console.error(`❌ Error creating control ${controlData.id}:`, error.message);
    }
  }
}

async function createTestScripts() {
  console.log('📝 Creating test scripts...');
  
  const testScripts = [
    {
      controlId: 'C.001',
      title: 'Annual Risk Rating Policy Review Test',
      description: 'Test to verify the annual review of Risk Rating and Classification Policy is conducted and documented.',
      testProcedure: `
1. Review USRMC meeting minutes for the current year
2. Verify Risk Rating and Classification Policy review was conducted
3. Confirm policy aligns with current regulatory requirements  
4. Check policy approval and documentation storage
5. Validate any policy updates were properly communicated
`,
      expectedResults: 'USRMC meeting minutes should document policy review, approval, and any updates. Policy should align with regulatory requirements.',
      testData: 'USRMC meeting minutes, Risk Rating and Classification Policy documents',
      frequency: 'ANNUALLY'
    },
    {
      controlId: 'C.002', 
      title: 'Asset Classification Change Communication Test',
      description: 'Test to verify changes in asset classification criteria are properly communicated to middle office.',
      testProcedure: `
1. Review quarterly credit quality assessments
2. Identify any changes in borrower credit quality
3. Verify changes were communicated to middle office
4. Check documentation of classification changes
5. Confirm notification timeliness and completeness
`,
      expectedResults: 'All credit quality changes should be documented and communicated to middle office within required timeframes.',
      testData: 'Quarterly review documents, middle office notifications, credit quality assessments',
      frequency: 'QUARTERLY'
    },
    {
      controlId: 'C.032',
      title: 'Monthly Fraud Detection Audit Test',
      description: 'Test to verify monthly fraud detection audits are conducted and findings are properly addressed.',
      testProcedure: `
1. Review monthly audit schedules and completion
2. Examine fraud detection reports and findings
3. Verify corrective action plans for identified issues
4. Check audit log completeness and storage
5. Confirm follow-up on previous audit findings
`,
      expectedResults: 'Monthly audits should be completed on schedule with documented findings and corrective actions.',
      testData: 'Audit logs, fraud detection reports, corrective action plans, follow-up documentation',
      frequency: 'MONTHLY'
    }
  ];

  for (const scriptData of testScripts) {
    try {
      // Find the control first
      const control = await prisma.control.findFirst({
        where: {
          organizationId: DEMO_ORG_ID,
          externalId: scriptData.controlId
        }
      });

      if (!control) {
        console.log(`⚠️ Control ${scriptData.controlId} not found, skipping test script`);
        continue;
      }

      await prisma.controlTestScript.create({
        data: {
          controlId: control.id,
          title: scriptData.title,
          description: scriptData.description,
          testProcedure: scriptData.testProcedure,
          expectedResults: scriptData.expectedResults,
          testData: scriptData.testData,
          frequency: scriptData.frequency,
          createdBy: DEMO_USER_ID
        }
      });

      console.log(`✅ Created test script: ${scriptData.title}`);
    } catch (error) {
      console.error(`❌ Error creating test script for ${scriptData.controlId}:`, error.message);
    }
  }
}

async function createSampleDocuments() {
  console.log('📄 Creating sample documents...');
  
  const documents = [
    {
      name: 'Risk Rating and Classification Policy v2.1.pdf',
      type: 'Policy Document',
      size: 2048576,
      content: 'Risk Rating and Classification Policy - Updated January 2024'
    },
    {
      name: 'USRMC Meeting Minutes Q4 2024.docx', 
      type: 'Meeting Minutes',
      size: 1024000,
      content: 'United States Risk Management Committee Meeting Minutes - Q4 2024'
    },
    {
      name: 'Credit Quality Review Report Q4 2024.xlsx',
      type: 'Risk Report',
      size: 3145728,
      content: 'Quarterly Credit Quality Review Report - December 2024'
    },
    {
      name: 'Fraud Detection Audit Report Dec 2024.pdf',
      type: 'Audit Report', 
      size: 1572864,
      content: 'Monthly Fraud Detection and Prevention Audit Report - December 2024'
    },
    {
      name: 'Interest Rate Risk Monitoring Report.xlsx',
      type: 'Risk Report',
      size: 2097152,
      content: 'Monthly Interest Rate and Market Condition Monitoring Report'
    },
    {
      name: 'Encryption Protocol Review Q4 2024.pdf',
      type: 'Technical Review',
      size: 1048576,
      content: 'Quarterly Core Banking System Encryption Protocol Review and Update'
    }
  ];

  for (const docData of documents) {
    try {
      await prisma.document.create({
        data: {
          organizationId: DEMO_ORG_ID,
          name: docData.name,
          type: docData.type,
          size: docData.size,
          content: docData.content,
          extractedText: docData.content,
          uploadedBy: DEMO_USER_ID
        }
      });

      console.log(`✅ Created document: ${docData.name}`);
    } catch (error) {
      console.error(`❌ Error creating document ${docData.name}:`, error.message);
    }
  }
}

async function createSampleActivities() {
  console.log('📋 Creating sample activities...');
  
  const activities = [
    {
      type: 'RISK_ASSESSMENT',
      title: 'Q4 2024 Credit Risk Assessment',
      description: 'Quarterly assessment of credit risk across loan portfolio including asset quality review and borrower risk profile updates.',
      status: 'COMPLETED',
      priority: 'HIGH',
      dueDate: new Date('2024-12-31'),
      completedAt: new Date('2024-12-28')
    },
    {
      type: 'CONTROL_TESTING',
      title: 'Monthly Fraud Detection Audit - December 2024',
      description: 'Comprehensive fraud detection audit covering transaction monitoring, access controls, and anomaly detection processes.',
      status: 'COMPLETED', 
      priority: 'HIGH',
      dueDate: new Date('2024-12-31'),
      completedAt: new Date('2024-12-30')
    },
    {
      type: 'POLICY_REVIEW',
      title: 'Annual Risk Rating Policy Review',
      description: 'Annual review and update of Risk Rating and Classification Policy to ensure regulatory compliance and operational effectiveness.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: new Date('2025-01-31')
    },
    {
      type: 'RISK_MITIGATION', 
      title: 'Interest Rate Hedging Strategy Review',
      description: 'Review of current interest rate risk mitigation strategies and evaluation of additional hedging instruments.',
      status: 'PENDING',
      priority: 'MEDIUM',
      dueDate: new Date('2025-02-15')
    },
    {
      type: 'COMPLIANCE_CHECK',
      title: 'Encryption Protocol Compliance Audit',
      description: 'Quarterly audit of core banking system encryption protocols and data protection measures.',
      status: 'IN_PROGRESS',
      priority: 'HIGH', 
      dueDate: new Date('2025-01-15')
    }
  ];

  for (const activityData of activities) {
    try {
      await prisma.activity.create({
        data: {
          organizationId: DEMO_ORG_ID,
          type: activityData.type,
          title: activityData.title,
          description: activityData.description,
          status: activityData.status,
          priority: activityData.priority,
          dueDate: activityData.dueDate,
          completedAt: activityData.completedAt,
          assignedTo: DEMO_USER_ID,
          createdBy: DEMO_USER_ID
        }
      });

      console.log(`✅ Created activity: ${activityData.title}`);
    } catch (error) {
      console.error(`❌ Error creating activity ${activityData.title}:`, error.message);
    }
  }
}

async function main() {
  console.log('🚀 Starting demo data population...');
  console.log(`📍 Organization ID: ${DEMO_ORG_ID}`);
  console.log(`👤 User ID: ${DEMO_USER_ID}`);
  console.log('');

  try {
    await createDemoRisks();
    console.log('');
    
    await createDemoControls();
    console.log('');
    
    await createTestScripts();
    console.log('');
    
    await createSampleDocuments();
    console.log('');
    
    await createSampleActivities();
    console.log('');
    
    console.log('🎉 Demo data population completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`✅ ${SAMPLE_RISKS.length} risks created`);
    console.log(`✅ ${SAMPLE_CONTROLS.length} controls created`); 
    console.log(`✅ 3 test scripts created`);
    console.log(`✅ 6 sample documents created`);
    console.log(`✅ 5 activities created`);
    
  } catch (error) {
    console.error('❌ Error during demo data population:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);