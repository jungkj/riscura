import { User, Risk, Control, Document, Questionnaire, Workflow, RiskCategory } from '@/types';
import { calculateRiskScore } from './utils';

// Generate realistic sample users
export const generateMockUsers = (): User[] => [
  {
    id: '1',
    email: 'admin@company.com',
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: 'admin',
    organizationId: 'org-1',
    permissions: ['*'], // All permissions
    createdAt: '2024-01-15T10:00:00Z',
    lastLogin: '2024-05-27T09:30:00Z'
  },
  {
    id: '2',
    email: 'risk.manager@company.com',
    firstName: 'Michael',
    lastName: 'Chen',
    role: 'risk_manager',
    organizationId: 'org-1',
    permissions: ['read_risks', 'write_risks', 'read_controls', 'write_controls', 'read_reports'],
    createdAt: '2024-02-01T14:20:00Z',
    lastLogin: '2024-05-27T08:15:00Z'
  },
  {
    id: '3',
    email: 'auditor@company.com',
    firstName: 'Emily',
    lastName: 'Rodriguez',
    role: 'auditor',
    organizationId: 'org-1',
    permissions: ['read_risks', 'read_controls', 'read_reports', 'read_workflows'],
    createdAt: '2024-02-15T11:45:00Z',
    lastLogin: '2024-05-26T16:30:00Z'
  },
  {
    id: '4',
    email: 'user@company.com',
    firstName: 'David',
    lastName: 'Thompson',
    role: 'user',
    organizationId: 'org-1',
    permissions: ['read_risks', 'read_controls'],
    createdAt: '2024-03-01T09:10:00Z',
    lastLogin: '2024-05-25T13:45:00Z'
  }
];

// Generate realistic sample risks
export const generateMockRisks = (): Risk[] => {
  const riskTemplates = [
    {
      title: 'Cybersecurity Data Breach',
      description: 'Risk of unauthorized access to customer data through system vulnerabilities, phishing attacks, or insider threats. Could result in significant financial losses, regulatory penalties, and reputational damage.',
      category: 'technology' as RiskCategory,
      likelihood: 3,
      impact: 5,
      owner: 'IT Security Team'
    },
    {
      title: 'Regulatory Compliance Violation',
      description: 'Risk of non-compliance with industry regulations such as GDPR, SOX, or sector-specific requirements. Could lead to fines, legal action, and operational restrictions.',
      category: 'compliance' as RiskCategory,
      likelihood: 2,
      impact: 4,
      owner: 'Compliance Officer'
    },
    {
      title: 'Supply Chain Disruption',
      description: 'Risk of critical supplier failure or disruption due to natural disasters, geopolitical events, or financial instability. Could impact production and service delivery.',
      category: 'operational' as RiskCategory,
      likelihood: 3,
      impact: 4,
      owner: 'Supply Chain Manager'
    },
    {
      title: 'Market Volatility Impact',
      description: 'Risk of significant market fluctuations affecting investment portfolios, currency exchange rates, and overall financial performance.',
      category: 'financial' as RiskCategory,
      likelihood: 4,
      impact: 3,
      owner: 'CFO'
    },
    {
      title: 'Key Personnel Departure',
      description: 'Risk of losing critical employees with specialized knowledge or skills, potentially disrupting operations and strategic initiatives.',
      category: 'operational' as RiskCategory,
      likelihood: 3,
      impact: 3,
      owner: 'HR Director'
    },
    {
      title: 'Technology Infrastructure Failure',
      description: 'Risk of critical system failures, including servers, networks, or cloud services, that could halt business operations.',
      category: 'technology' as RiskCategory,
      likelihood: 2,
      impact: 5,
      owner: 'IT Operations Manager'
    },
    {
      title: 'Competitive Market Pressure',
      description: 'Risk of losing market share to competitors due to new technologies, pricing strategies, or superior products/services.',
      category: 'strategic' as RiskCategory,
      likelihood: 4,
      impact: 3,
      owner: 'Strategy Director'
    },
    {
      title: 'Credit Risk Exposure',
      description: 'Risk of customer defaults or counterparty failures leading to financial losses and cash flow problems.',
      category: 'financial' as RiskCategory,
      likelihood: 3,
      impact: 4,
      owner: 'Credit Risk Manager'
    },
    {
      title: 'Environmental Compliance Risk',
      description: 'Risk of environmental violations or accidents that could result in cleanup costs, fines, and reputational damage.',
      category: 'compliance' as RiskCategory,
      likelihood: 2,
      impact: 4,
      owner: 'Environmental Manager'
    },
    {
      title: 'Product Quality Defects',
      description: 'Risk of manufacturing defects or quality issues that could lead to recalls, customer dissatisfaction, and legal liability.',
      category: 'operational' as RiskCategory,
      likelihood: 2,
      impact: 4,
      owner: 'Quality Assurance Manager'
    }
  ];

  const statuses: Risk['status'][] = ['identified', 'assessed', 'mitigated', 'closed'];

  return riskTemplates.map((template, index) => ({
    id: `risk-${index + 1}`,
    ...template,
    riskScore: calculateRiskScore(template.likelihood, template.impact),
    status: statuses[index % statuses.length],
    controls: [`ctrl-${index + 1}`, `ctrl-${index + 2}`],
    evidence: [],
    createdAt: new Date(2024, 4, index + 1, 10, 0, 0).toISOString(),
    updatedAt: new Date(2024, 4, index + 15, 14, 30, 0).toISOString(),
    aiConfidence: 0.75 + Math.random() * 0.2 // Random confidence between 0.75-0.95
  }));
};

// Generate realistic sample controls
export const generateMockControls = (): Control[] => {
  const controlTemplates = [
    {
      title: 'Multi-Factor Authentication',
      description: 'Implementation of MFA for all user accounts accessing critical systems to prevent unauthorized access.',
      type: 'preventive' as const,
      effectiveness: 'high' as const,
      owner: 'IT Security Team',
      frequency: 'Continuous'
    },
    {
      title: 'Regular Security Audits',
      description: 'Quarterly security assessments and penetration testing to identify vulnerabilities.',
      type: 'detective' as const,
      effectiveness: 'high' as const,
      owner: 'Internal Audit',
      frequency: 'Quarterly'
    },
    {
      title: 'Incident Response Plan',
      description: 'Documented procedures for responding to security incidents and data breaches.',
      type: 'corrective' as const,
      effectiveness: 'medium' as const,
      owner: 'IT Security Team',
      frequency: 'As needed'
    },
    {
      title: 'Compliance Monitoring System',
      description: 'Automated system to monitor and report on regulatory compliance requirements.',
      type: 'detective' as const,
      effectiveness: 'high' as const,
      owner: 'Compliance Officer',
      frequency: 'Continuous'
    },
    {
      title: 'Supplier Due Diligence',
      description: 'Comprehensive evaluation process for new suppliers including financial stability and risk assessment.',
      type: 'preventive' as const,
      effectiveness: 'medium' as const,
      owner: 'Procurement Team',
      frequency: 'Annual'
    },
    {
      title: 'Backup and Recovery Procedures',
      description: 'Regular data backups and tested recovery procedures to ensure business continuity.',
      type: 'corrective' as const,
      effectiveness: 'high' as const,
      owner: 'IT Operations',
      frequency: 'Daily'
    },
    {
      title: 'Employee Training Program',
      description: 'Regular training on security awareness, compliance requirements, and operational procedures.',
      type: 'preventive' as const,
      effectiveness: 'medium' as const,
      owner: 'HR Department',
      frequency: 'Annual'
    },
    {
      title: 'Financial Controls Review',
      description: 'Monthly review of financial transactions and controls to detect anomalies.',
      type: 'detective' as const,
      effectiveness: 'high' as const,
      owner: 'Finance Team',
      frequency: 'Monthly'
    }
  ];

  const statuses: Control['status'][] = ['active', 'inactive', 'planned'];

  return controlTemplates.map((template, index) => ({
    id: `ctrl-${index + 1}`,
    ...template,
    status: statuses[index % statuses.length],
    linkedRisks: [`risk-${index + 1}`],
    evidence: [],
    createdAt: new Date(2024, 3, index + 1, 9, 0, 0).toISOString(),
    updatedAt: new Date(2024, 4, index + 10, 11, 15, 0).toISOString()
  }));
};

// Generate sample documents
export const generateMockDocuments = (): Document[] => [
  {
    id: 'doc-1',
    name: 'Risk Management Policy.pdf',
    type: 'application/pdf',
    size: 2048576,
    content: 'base64encodedcontent1',
    extractedText: 'Risk management policy document content...',
    aiAnalysis: {
      risks: ['Operational risk', 'Compliance risk'],
      controls: ['Risk assessment procedures', 'Monitoring controls'],
      confidence: 0.87
    },
    uploadedBy: 'risk.manager@company.com',
    uploadedAt: '2024-05-01T10:30:00Z'
  },
  {
    id: 'doc-2',
    name: 'Security Procedures.docx',
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 1536000,
    content: 'base64encodedcontent2',
    extractedText: 'Security procedures and guidelines...',
    aiAnalysis: {
      risks: ['Cybersecurity threats', 'Data breach'],
      controls: ['Access controls', 'Encryption'],
      confidence: 0.92
    },
    uploadedBy: 'admin@company.com',
    uploadedAt: '2024-05-05T14:20:00Z'
  },
  {
    id: 'doc-3',
    name: 'Compliance Checklist.xlsx',
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 512000,
    content: 'base64encodedcontent3',
    extractedText: 'Compliance requirements checklist...',
    aiAnalysis: {
      risks: ['Regulatory violations', 'Legal penalties'],
      controls: ['Compliance monitoring', 'Regular audits'],
      confidence: 0.79
    },
    uploadedBy: 'auditor@company.com',
    uploadedAt: '2024-05-10T09:45:00Z'
  }
];

// Generate sample questionnaires
export const generateMockQuestionnaires = (): Questionnaire[] => [
  {
    id: 'quest-1',
    title: 'Annual Risk Assessment Survey',
    description: 'Comprehensive risk assessment questionnaire for all departments',
    questions: [
      {
        id: 'q1',
        text: 'What are the top 3 risks facing your department?',
        type: 'text',
        required: true,
        aiGenerated: false,
        order: 1
      },
      {
        id: 'q2',
        text: 'How would you rate the current risk management maturity?',
        type: 'rating',
        required: true,
        aiGenerated: true,
        order: 2
      },
      {
        id: 'q3',
        text: 'Are you aware of the incident reporting procedures?',
        type: 'yes_no',
        required: true,
        aiGenerated: false,
        order: 3
      }
    ],
    targetRoles: ['risk_manager', 'user'],
    status: 'active',
    responses: [],
    createdAt: '2024-04-01T10:00:00Z',
    dueDate: '2024-06-30T23:59:59Z',
    createdBy: 'admin@company.com'
  }
];

// Generate sample workflows
export const generateMockWorkflows = (): Workflow[] => [
  {
    id: 'wf-1',
    name: 'Risk Assessment Approval',
    description: 'Workflow for approving new risk assessments',
    type: 'approval',
    steps: [
      {
        id: 'step-1',
        name: 'Initial Review',
        type: 'review',
        assignee: 'risk.manager@company.com',
        status: 'completed',
        dueDate: '2024-05-15T17:00:00Z',
        completedAt: '2024-05-14T16:30:00Z',
        order: 1
      },
      {
        id: 'step-2',
        name: 'Management Approval',
        type: 'approval',
        assignee: 'admin@company.com',
        status: 'pending',
        dueDate: '2024-05-20T17:00:00Z',
        order: 2
      }
    ],
    status: 'active',
    assignedTo: ['risk.manager@company.com', 'admin@company.com'],
    createdAt: '2024-05-10T09:00:00Z',
    createdBy: 'admin@company.com',
    priority: 'medium'
  }
];

// Utility function to generate all mock data
export const generateAllMockData = () => ({
  users: generateMockUsers(),
  risks: generateMockRisks(),
  controls: generateMockControls(),
  documents: generateMockDocuments(),
  questionnaires: generateMockQuestionnaires(),
  workflows: generateMockWorkflows()
}); 