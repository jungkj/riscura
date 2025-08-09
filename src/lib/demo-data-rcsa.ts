// Comprehensive RCSA Demo Data for Financial Institution
// 77 Risks and 77 Controls based on Risk Control Self-Assessment framework

import { RiskCategory, RiskStatus, RiskLevel, ControlType, ControlStatus, ControlCategory, AutomationLevel } from '@prisma/client';

// Risk Categories and Subcategories
const riskTaxonomy = {
  'Credit Risk': [
    'Consumer Lending',
    'Commercial Lending', 
    'Mortgage Lending',
    'Credit Cards',
    'Loan Portfolio Management'
  ],
  'Compliance Risk': [
    'AML/CTF',
    'Data Privacy',
    'Consumer Protection',
    'Fair Lending',
    'Regulatory Reporting'
  ],
  'Operational Risk': [
    'System Availability',
    'Process Failure',
    'Human Error',
    'External Events',
    'Third Party Risk'
  ],
  'Liquidity & Interest Rate Risk': [
    'Funding Risk',
    'Asset-Liability Management',
    'Interest Rate Risk',
    'Deposit Concentration',
    'Cash Management'
  ],
  'Strategic & Reputational Risk': [
    'Business Strategy',
    'Market Competition',
    'Public Relations',
    'Brand Management',
    'Product Development'
  ]
};

// Helper functions for generating realistic data
function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function calculateRiskScore(likelihood: number, impact: number): number {
  return likelihood * impact;
}

function getRiskLevel(score: number): RiskLevel {
  if (score <= 6) return RiskLevel.LOW;
  if (score <= 12) return RiskLevel.MEDIUM;
  if (score <= 20) return RiskLevel.HIGH;
  return RiskLevel.CRITICAL;
}

// Risk Sources
const riskSources = [
  'Internal Process',
  'External Event',
  'Self-identified',
  'Workshop',
  'Industry Example',
  'Regulatory Requirement',
  'Audit Finding',
  'Incident',
  'Customer Complaint',
  'Market Change'
];

// Business Functions
const businessFunctions = [
  'Credit Analysis',
  'Corporate Banking',
  'Retail Banking',
  'Treasury',
  'Risk Management',
  'Compliance',
  'IT Operations',
  'Human Resources',
  'Finance',
  'Operations',
  'Legal',
  'Internal Audit',
  'Digital Banking',
  'Investment Banking',
  'Wealth Management'
];

// Generic Risk Owners (anonymized roles)
const riskOwners = [
  'Credit Manager',
  'Compliance Officer',
  'Risk Officer',
  'Operations Manager',
  'IT Manager',
  'Treasury Manager',
  'Department Head',
  'Business Unit Lead',
  'Process Owner',
  'Team Lead'
];

// Control Frequencies
const controlFrequencies = [
  'Daily',
  'Weekly',
  'Monthly',
  'Quarterly',
  'Semi-Annually',
  'Annually',
  'Per Transaction',
  'Continuous',
  'On Demand',
  'Event-Driven'
];

// Generate comprehensive RCSA risks
export function generateRCSARisks(organizationId: string): any[] {
  const risks: any[] = [];
  let riskId = 1;

  // High Priority Material Risks (ensure we have at least 15-20)
  const highPriorityRisks = [
    {
      title: 'Credit portfolio monitoring gaps',
      category: 'Credit Risk',
      description: 'Inadequate monitoring of credit portfolio quality leading to undetected deterioration in asset quality',
      likelihood: 4,
      impact: 5,
      material: true
    },
    {
      title: 'Staffing shortages in accounting/regulatory reporting',
      category: 'Operational Risk',
      description: 'Insufficient qualified staff in critical accounting and regulatory reporting functions',
      likelihood: 4,
      impact: 4,
      material: true
    },
    {
      title: 'Data encryption gaps in core banking systems',
      category: 'Operational Risk',
      description: 'Incomplete data encryption implementation across core banking infrastructure',
      likelihood: 3,
      impact: 5,
      material: true
    },
    {
      title: 'Regulatory compliance failures (Part 500)',
      category: 'Compliance Risk',
      description: 'Non-compliance with Part 500 cybersecurity requirements',
      likelihood: 3,
      impact: 5,
      material: true
    },
    {
      title: 'Unable to meet regulatory deadlines',
      category: 'Compliance Risk',
      description: 'Risk of missing critical regulatory submission deadlines',
      likelihood: 3,
      impact: 5,
      material: true
    },
    {
      title: 'Public enforcement actions damaging reputation',
      category: 'Strategic & Reputational Risk',
      description: 'Regulatory enforcement actions becoming public and damaging institutional reputation',
      likelihood: 2,
      impact: 5,
      material: true
    }
  ];

  // Add high priority risks first
  highPriorityRisks.forEach(riskData => {
    const riskScore = calculateRiskScore(riskData.likelihood, riskData.impact);
    risks.push({
      id: `R${String(riskId).padStart(3, '0')}`,
      organizationId,
      itemNumber: `RCSA-${String(riskId).padStart(3, '0')}`,
      title: riskData.title,
      description: riskData.description,
      relatedRiskTaxonomy: riskData.category,
      category: getCategoryEnum(riskData.category),
      severity: riskScore >= 15 ? 'HIGH' : 'MEDIUM',
      likelihood: riskData.likelihood,
      impact: riskData.impact,
      status: getRandomElement(['IDENTIFIED', 'ASSESSED', 'MITIGATED'] as RiskStatus[]),
      riskScore,
      riskLevel: getRiskLevel(riskScore),
      owner: getRandomElement(riskOwners),
      department: getRandomElement(businessFunctions),
      businessUnit: getRandomElement(businessFunctions),
      sourceOfRisk: getRandomElement(riskSources),
      riskType: getRandomElement(['Internal', 'External', 'Strategic']),
      question: `Are controls adequate to mitigate ${riskData.title.toLowerCase()}?`,
      answerValue: getRandomElement(['Yes', 'No', 'Partially', 'Under Review']),
      comments: `Risk identified through RCSA process. ${riskData.material ? 'Material risk requiring enhanced monitoring.' : 'Standard monitoring applied.'}`,
      identifiedDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
      lastReviewDate: new Date(2024, 11, Math.floor(Math.random() * 20) + 1),
      nextReviewDate: new Date(2025, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1),
      mitigationStrategy: `Implement enhanced controls and monitoring for ${riskData.title.toLowerCase()}`,
      residualRisk: riskScore > 15 ? 'HIGH' : riskScore > 8 ? 'MEDIUM' : 'LOW',
      materiality: riskData.material ? 'Material' : 'Non-Material',
      controls: [`C${String(riskId).padStart(3, '0')}`],
      tags: [riskData.category.toLowerCase().replace(/ /g, '-'), 'rcsa', riskData.material ? 'material' : 'standard'],
      createdAt: new Date(2024, 0, 15),
      updatedAt: new Date(2024, 11, Math.floor(Math.random() * 20) + 1)
    });
    riskId++;
  });

  // Generate remaining risks to reach 77 total
  while (risks.length < 77) {
    const categoryKey = getRandomElement(Object.keys(riskTaxonomy));
    const subcategory = getRandomElement(riskTaxonomy[categoryKey as keyof typeof riskTaxonomy]);
    const likelihood = Math.floor(Math.random() * 5) + 1;
    const impact = Math.floor(Math.random() * 5) + 1;
    const riskScore = calculateRiskScore(likelihood, impact);
    const isMaterial = riskScore >= 15 && Math.random() > 0.5;

    risks.push({
      id: `R${String(riskId).padStart(3, '0')}`,
      organizationId,
      itemNumber: `RCSA-${String(riskId).padStart(3, '0')}`,
      title: generateRiskTitle(categoryKey, subcategory),
      description: generateRiskDescription(categoryKey, subcategory),
      relatedRiskTaxonomy: `${categoryKey} - ${subcategory}`,
      category: getCategoryEnum(categoryKey),
      severity: riskScore >= 15 ? 'HIGH' : riskScore >= 8 ? 'MEDIUM' : 'LOW',
      likelihood,
      impact,
      status: getRandomElement(['IDENTIFIED', 'ASSESSED', 'MITIGATED', 'MONITORING'] as RiskStatus[]),
      riskScore,
      riskLevel: getRiskLevel(riskScore),
      owner: getRandomElement(riskOwners),
      department: getRandomElement(businessFunctions),
      businessUnit: getRandomElement(businessFunctions),
      sourceOfRisk: getRandomElement(riskSources),
      riskType: getRandomElement(['Internal', 'External', 'Strategic', 'Operational']),
      question: generateRiskQuestion(categoryKey, subcategory),
      answerValue: getRandomElement(['Yes', 'No', 'Partially', 'Under Review', 'Not Applicable']),
      comments: `Risk identified through RCSA process. ${isMaterial ? 'Material risk requiring enhanced monitoring.' : 'Standard monitoring applied.'}`,
      identifiedDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
      lastReviewDate: new Date(2024, 11, Math.floor(Math.random() * 20) + 1),
      nextReviewDate: new Date(2025, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1),
      mitigationStrategy: generateMitigationStrategy(categoryKey, subcategory),
      residualRisk: riskScore > 15 ? 'HIGH' : riskScore > 8 ? 'MEDIUM' : 'LOW',
      materiality: isMaterial ? 'Material' : 'Non-Material',
      controls: [`C${String(riskId).padStart(3, '0')}`],
      tags: [categoryKey.toLowerCase().replace(/ /g, '-'), subcategory.toLowerCase().replace(/ /g, '-'), 'rcsa'],
      createdAt: new Date(2024, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1),
      updatedAt: new Date(2024, 11, Math.floor(Math.random() * 20) + 1)
    });
    riskId++;
  }

  return risks;
}

// Generate comprehensive RCSA controls
export function generateRCSAControls(organizationId: string): any[] {
  const controls: any[] = [];

  for (let i = 1; i <= 77; i++) {
    const effectiveness = Math.floor(Math.random() * 30) + 70; // 70-100% effectiveness
    const isEffective = effectiveness >= 80;
    const designEffectiveness = isEffective ? 'Effective' : effectiveness >= 60 ? 'Partially Effective' : 'Not Effective';
    const operatingEffectiveness = isEffective ? 'Effective' : effectiveness >= 65 ? 'Partially Effective' : 'Not Effective';

    controls.push({
      id: `C${String(i).padStart(3, '0')}`,
      organizationId,
      name: generateControlName(i),
      description: generateControlDescription(i),
      type: getRandomElement(['PREVENTIVE', 'DETECTIVE', 'CORRECTIVE'] as ControlType[]),
      category: getRandomElement(['TECHNICAL', 'ADMINISTRATIVE', 'MANAGEMENT', 'OPERATIONAL'] as ControlCategory[]),
      status: getRandomElement(['IMPLEMENTED', 'TESTING', 'PLANNED'] as ControlStatus[]),
      effectiveness,
      owner: getRandomElement(riskOwners),
      implementationDate: new Date(2024, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1),
      lastTestDate: new Date(2024, 11, Math.floor(Math.random() * 20) + 1),
      nextTestDate: new Date(2025, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1),
      testFrequency: getRandomElement(controlFrequencies),
      automationLevel: getRandomElement(['MANUAL', 'SEMI_AUTOMATED', 'FULLY_AUTOMATED'] as AutomationLevel[]),
      cost: Math.floor(Math.random() * 400000) + 50000,
      relatedRisks: [`R${String(i).padStart(3, '0')}`],
      evidence: generateControlEvidence(),
      designEffectiveness,
      operatingEffectiveness,
      residualRiskRating: effectiveness >= 85 ? 'LOW' : effectiveness >= 70 ? 'MEDIUM' : 'HIGH',
      createdAt: new Date(2024, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1),
      updatedAt: new Date(2024, 11, Math.floor(Math.random() * 20) + 1)
    });
  }

  return controls;
}

// Helper function to map category to enum
function getCategoryEnum(category: string): RiskCategory {
  if (category.includes('Credit')) return 'FINANCIAL' as RiskCategory;
  if (category.includes('Compliance')) return 'COMPLIANCE' as RiskCategory;
  if (category.includes('Operational')) return 'OPERATIONAL' as RiskCategory;
  if (category.includes('Liquidity') || category.includes('Interest')) return 'FINANCIAL' as RiskCategory;
  if (category.includes('Strategic') || category.includes('Reputational')) return 'STRATEGIC' as RiskCategory;
  return 'OPERATIONAL' as RiskCategory;
}

// Generate realistic risk titles
function generateRiskTitle(category: string, subcategory: string): string {
  const templates = [
    `${subcategory} process deficiencies`,
    `Inadequate ${subcategory.toLowerCase()} controls`,
    `${category} - ${subcategory} exposure`,
    `Failure in ${subcategory.toLowerCase()} management`,
    `${subcategory} compliance gaps`,
    `Insufficient ${subcategory.toLowerCase()} monitoring`,
    `${subcategory} operational failures`,
    `${category} arising from ${subcategory.toLowerCase()}`
  ];
  return getRandomElement(templates);
}

// Generate realistic risk descriptions
function generateRiskDescription(category: string, subcategory: string): string {
  return `Risk of financial loss, regulatory sanctions, or reputational damage due to inadequate controls or processes related to ${subcategory.toLowerCase()} within the ${category.toLowerCase()} framework. This risk could materialize through various scenarios including system failures, human error, or external events affecting ${subcategory.toLowerCase()} operations.`;
}

// Generate risk questions
function generateRiskQuestion(category: string, subcategory: string): string {
  const templates = [
    `Are current controls adequate to manage ${subcategory.toLowerCase()} risks?`,
    `Is the ${subcategory.toLowerCase()} process properly documented and followed?`,
    `Do we have sufficient monitoring for ${subcategory.toLowerCase()} activities?`,
    `Are staff adequately trained in ${subcategory.toLowerCase()} procedures?`,
    `Is management oversight of ${subcategory.toLowerCase()} appropriate?`,
    `Are ${subcategory.toLowerCase()} risks within acceptable tolerance levels?`
  ];
  return getRandomElement(templates);
}

// Generate mitigation strategies
function generateMitigationStrategy(category: string, subcategory: string): string {
  const strategies = [
    `Enhance ${subcategory.toLowerCase()} controls through automation and regular testing`,
    `Implement comprehensive monitoring and reporting for ${subcategory.toLowerCase()}`,
    `Develop and maintain ${subcategory.toLowerCase()} policies and procedures`,
    `Conduct regular training and awareness programs for ${subcategory.toLowerCase()}`,
    `Establish clear escalation procedures for ${subcategory.toLowerCase()} issues`,
    `Perform periodic assessments of ${subcategory.toLowerCase()} control effectiveness`
  ];
  return getRandomElement(strategies);
}

// Generate control names
function generateControlName(index: number): string {
  const controlTypes = [
    'Automated Monitoring System',
    'Manual Review Process',
    'Preventive Control Framework',
    'Detective Analytics Platform',
    'Compliance Verification Procedure',
    'Risk Assessment Protocol',
    'Security Control Measure',
    'Operational Safeguard',
    'Quality Assurance Check',
    'Validation Mechanism'
  ];
  return `${getRandomElement(controlTypes)} #${index}`;
}

// Generate control descriptions
function generateControlDescription(index: number): string {
  const activities = [
    'monitoring and reporting',
    'review and approval',
    'validation and verification',
    'assessment and testing',
    'detection and prevention',
    'analysis and remediation'
  ];
  
  const targets = [
    'transactions',
    'processes',
    'systems',
    'data',
    'activities',
    'operations'
  ];

  const activity = getRandomElement(activities);
  const target = getRandomElement(targets);
  
  return `Comprehensive control mechanism for ${activity} of ${target}. This control includes automated checks, manual reviews, and periodic assessments to ensure compliance with policies and procedures. Documentation and evidence are maintained for audit purposes.`;
}

// Generate control evidence
function generateControlEvidence(): string[] {
  const evidenceTypes = [
    'Control test results',
    'Exception reports',
    'Approval documentation',
    'System logs',
    'Review checklists',
    'Monitoring dashboards',
    'Audit trails',
    'Policy documents',
    'Training records',
    'Assessment reports'
  ];
  
  // Return 2-4 random evidence types
  const count = Math.floor(Math.random() * 3) + 2;
  const evidence: string[] = [];
  for (let i = 0; i < count; i++) {
    const item = getRandomElement(evidenceTypes);
    if (!evidence.includes(item)) {
      evidence.push(item);
    }
  }
  return evidence;
}

// Export the main function to get all RCSA demo data
export function getRCSADemoData(organizationId: string = 'demo-org-id') {
  const risks = generateRCSARisks(organizationId);
  const controls = generateRCSAControls(organizationId);
  
  // Calculate metrics based on generated data
  const highRisks = risks.filter(r => r.riskLevel === 'HIGH' || r.riskLevel === 'CRITICAL').length;
  const mediumRisks = risks.filter(r => r.riskLevel === 'MEDIUM').length;
  const lowRisks = risks.filter(r => r.riskLevel === 'LOW').length;
  const materialRisks = risks.filter(r => r.materiality === 'Material').length;
  
  const effectiveControls = controls.filter(c => c.effectiveness >= 80).length;
  const avgControlEffectiveness = Math.round(controls.reduce((sum, c) => sum + c.effectiveness, 0) / controls.length);
  
  return {
    risks,
    controls,
    metrics: {
      totalRisks: risks.length,
      highRisks,
      mediumRisks,
      lowRisks,
      criticalRisks: risks.filter(r => r.riskLevel === 'CRITICAL').length,
      materialRisks,
      activeControls: controls.filter(c => c.status === 'IMPLEMENTED').length,
      failedControls: controls.filter(c => c.effectiveness < 60).length,
      partiallyEffectiveControls: controls.filter(c => c.effectiveness >= 60 && c.effectiveness < 80).length,
      effectiveControls,
      complianceScore: avgControlEffectiveness,
      overallRiskScore: Math.round(risks.reduce((sum, r) => sum + r.riskScore, 0) / risks.length),
      controlTestingRate: 100,
      avgControlEffectiveness,
      rcsaCompleteness: 100
    }
  };
}