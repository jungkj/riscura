import { Document, Risk, Control, AIAnalysisResponse, RiskCategory } from '@/types';
import { generateId } from './utils';

// Mock keywords for different risk categories
const riskKeywords = {
  operational: [
    'process', 'procedure', 'workflow', 'operation', 'staff', 'employee', 'training',
    'quality', 'production', 'service', 'delivery', 'customer', 'supplier', 'vendor'
  ],
  financial: [
    'budget', 'cost', 'revenue', 'profit', 'loss', 'cash', 'credit', 'debt', 'investment',
    'financial', 'accounting', 'audit', 'payment', 'invoice', 'expense', 'income'
  ],
  strategic: [
    'strategy', 'strategic', 'market', 'competition', 'competitive', 'growth', 'expansion',
    'merger', 'acquisition', 'partnership', 'innovation', 'technology', 'digital', 'transformation'
  ],
  compliance: [
    'regulation', 'regulatory', 'compliance', 'legal', 'law', 'policy', 'standard',
    'requirement', 'audit', 'inspection', 'certification', 'license', 'permit', 'gdpr', 'sox'
  ],
  technology: [
    'system', 'software', 'hardware', 'network', 'security', 'cyber', 'data', 'database',
    'server', 'cloud', 'infrastructure', 'application', 'platform', 'digital', 'it'
  ]
};

// Mock risk templates based on categories
const riskTemplates = {
  operational: [
    {
      title: 'Process Inefficiency Risk',
      description: 'Risk of operational inefficiencies due to outdated or poorly defined processes',
      likelihood: 3,
      impact: 3
    },
    {
      title: 'Staff Training Gap Risk',
      description: 'Risk of inadequate staff training leading to operational errors',
      likelihood: 2,
      impact: 3
    },
    {
      title: 'Supplier Dependency Risk',
      description: 'Risk of over-reliance on key suppliers affecting service delivery',
      likelihood: 3,
      impact: 4
    }
  ],
  financial: [
    {
      title: 'Budget Overrun Risk',
      description: 'Risk of exceeding allocated budgets due to poor cost control',
      likelihood: 3,
      impact: 4
    },
    {
      title: 'Credit Risk Exposure',
      description: 'Risk of customer defaults affecting cash flow and profitability',
      likelihood: 2,
      impact: 4
    },
    {
      title: 'Investment Loss Risk',
      description: 'Risk of financial losses from poor investment decisions',
      likelihood: 2,
      impact: 5
    }
  ],
  strategic: [
    {
      title: 'Market Competition Risk',
      description: 'Risk of losing market share to competitors with superior offerings',
      likelihood: 4,
      impact: 3
    },
    {
      title: 'Strategic Misalignment Risk',
      description: 'Risk of strategic initiatives not aligning with market demands',
      likelihood: 2,
      impact: 4
    },
    {
      title: 'Innovation Gap Risk',
      description: 'Risk of falling behind in technological innovation and digital transformation',
      likelihood: 3,
      impact: 4
    }
  ],
  compliance: [
    {
      title: 'Regulatory Violation Risk',
      description: 'Risk of non-compliance with industry regulations leading to penalties',
      likelihood: 2,
      impact: 5
    },
    {
      title: 'Policy Adherence Risk',
      description: 'Risk of employees not following established policies and procedures',
      likelihood: 3,
      impact: 3
    },
    {
      title: 'Audit Finding Risk',
      description: 'Risk of significant findings during regulatory or internal audits',
      likelihood: 2,
      impact: 4
    }
  ],
  technology: [
    {
      title: 'Cybersecurity Breach Risk',
      description: 'Risk of unauthorized access to systems and data through cyber attacks',
      likelihood: 3,
      impact: 5
    },
    {
      title: 'System Failure Risk',
      description: 'Risk of critical system failures disrupting business operations',
      likelihood: 2,
      impact: 4
    },
    {
      title: 'Data Loss Risk',
      description: 'Risk of losing critical business data due to system failures or attacks',
      likelihood: 2,
      impact: 5
    }
  ]
};

// Mock control templates
const controlTemplates = [
  {
    title: 'Regular Process Review',
    description: 'Implement regular reviews of operational processes to identify inefficiencies',
    type: 'detective' as const,
    effectiveness: 'medium' as const
  },
  {
    title: 'Staff Training Program',
    description: 'Establish comprehensive training programs for all staff members',
    type: 'preventive' as const,
    effectiveness: 'high' as const
  },
  {
    title: 'Supplier Diversification',
    description: 'Maintain multiple suppliers to reduce dependency risks',
    type: 'preventive' as const,
    effectiveness: 'high' as const
  },
  {
    title: 'Budget Monitoring System',
    description: 'Implement real-time budget monitoring and reporting systems',
    type: 'detective' as const,
    effectiveness: 'high' as const
  },
  {
    title: 'Credit Assessment Procedures',
    description: 'Establish robust credit assessment and monitoring procedures',
    type: 'preventive' as const,
    effectiveness: 'high' as const
  },
  {
    title: 'Investment Committee Review',
    description: 'Require investment committee approval for significant investments',
    type: 'preventive' as const,
    effectiveness: 'medium' as const
  },
  {
    title: 'Market Intelligence System',
    description: 'Implement market monitoring and competitive intelligence systems',
    type: 'detective' as const,
    effectiveness: 'medium' as const
  },
  {
    title: 'Compliance Monitoring Program',
    description: 'Establish ongoing compliance monitoring and reporting programs',
    type: 'detective' as const,
    effectiveness: 'high' as const
  },
  {
    title: 'Security Awareness Training',
    description: 'Provide regular cybersecurity awareness training for all employees',
    type: 'preventive' as const,
    effectiveness: 'medium' as const
  },
  {
    title: 'Data Backup Procedures',
    description: 'Implement automated data backup and recovery procedures',
    type: 'corrective' as const,
    effectiveness: 'high' as const
  }
];

// Simulate text extraction from different file types
const simulateTextExtraction = (document: Document): string => {
  const fileType = document.type;
  
  // Mock extracted text based on file type
  if (fileType.includes('pdf')) {
    return `
      Risk Management Policy Document
      
      This document outlines the organization's approach to risk management.
      Key areas covered include operational processes, financial controls,
      strategic planning, compliance requirements, and technology security.
      
      The organization must maintain adequate controls to mitigate identified risks
      and ensure compliance with all applicable regulations. Regular audits and
      assessments are required to validate the effectiveness of risk controls.
      
      Staff training and awareness programs are essential for maintaining
      a strong risk management culture throughout the organization.
    `;
  }
  
  if (fileType.includes('word') || fileType.includes('document')) {
    return `
      Operational Procedures Manual
      
      This manual describes the standard operating procedures for key business processes.
      It includes guidelines for quality control, customer service delivery,
      supplier management, and staff training requirements.
      
      All employees must follow these procedures to ensure consistent service quality
      and minimize operational risks. Regular process reviews and updates are required
      to maintain effectiveness and compliance with industry standards.
    `;
  }
  
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
    return `
      Financial Risk Assessment Spreadsheet
      
      This spreadsheet contains financial data and risk calculations including:
      - Budget vs actual analysis
      - Credit risk exposures
      - Investment portfolio performance
      - Cash flow projections
      - Regulatory capital requirements
      
      Regular monitoring and reporting of these metrics is essential for
      maintaining financial stability and regulatory compliance.
    `;
  }
  
  // Default text for other file types
  return `
    Business Document Analysis
    
    This document contains information relevant to business operations,
    risk management, and compliance requirements. Key areas of focus include
    process improvement, quality control, regulatory compliance, and
    technology security measures.
  `;
};

// Analyze text content and identify relevant risks
const analyzeTextContent = (text: string): {
  identifiedRisks: Array<{
    text: string;
    confidence: number;
    category: RiskCategory;
  }>;
  suggestedControls: Array<{
    title: string;
    description: string;
    confidence: number;
  }>;
  documentSummary: string;
} => {
  const lowerText = text.toLowerCase();
  const identifiedRisks: Array<{
    text: string;
    confidence: number;
    category: RiskCategory;
  }> = [];
  const suggestedControls: Array<{
    title: string;
    description: string;
    confidence: number;
  }> = [];
  
  // Analyze text for risk keywords and generate relevant risks
  Object.entries(riskKeywords).forEach(([category, keywords]) => {
    const matchedKeywords = keywords.filter(keyword => lowerText.includes(keyword));
    
    if (matchedKeywords.length > 0) {
      const categoryTemplates = riskTemplates[category as RiskCategory];
      const selectedTemplate = categoryTemplates[Math.floor(Math.random() * categoryTemplates.length)];
      
      // Calculate confidence based on keyword matches
      const confidence = Math.min(0.95, 0.6 + (matchedKeywords.length * 0.1));
      
      identifiedRisks.push({
        text: selectedTemplate.description,
        confidence,
        category: category as RiskCategory
      });
    }
  });
  
  // Generate suggested controls based on identified risks
  const numControls = Math.min(identifiedRisks.length + 1, 3);
  for (let i = 0; i < numControls; i++) {
    const template = controlTemplates[Math.floor(Math.random() * controlTemplates.length)];
    const confidence = 0.7 + Math.random() * 0.2; // 70-90% confidence
    
    suggestedControls.push({
      title: template.title,
      description: template.description,
      confidence
    });
  }
  
  // Generate document summary
  const documentSummary = `
    This document contains ${identifiedRisks.length} potential risk areas across 
    ${new Set(identifiedRisks.map((r: { category: RiskCategory }) => r.category)).size} categories. 
    Key themes include ${identifiedRisks.slice(0, 3).map((r: { category: RiskCategory }) => r.category).join(', ')}.
    The analysis suggests implementing ${suggestedControls.length} control measures
    to mitigate the identified risks.
  `.trim();
  
  return {
    identifiedRisks,
    suggestedControls,
    documentSummary
  };
};

// Main AI analysis function
export const mockAIAnalysis = async (document: Document): Promise<AIAnalysisResponse> => {
  const jobId = generateId('ai-job');
  const startTime = Date.now();
  
  // Simulate realistic processing delay (2-5 seconds)
  const processingDelay = 2000 + Math.random() * 3000;
  await new Promise(resolve => setTimeout(resolve, processingDelay));
  
  try {
    // Simulate text extraction
    const extractedText = simulateTextExtraction(document);
    
    // Analyze content
    const analysis = analyzeTextContent(extractedText);
    
    const processingTime = Date.now() - startTime;
    
    return {
      jobId,
      status: 'completed',
      results: analysis,
      processingTime
    };
  } catch {
    return {
      jobId,
      status: 'failed',
      processingTime: Date.now() - startTime
    };
  }
};

// Function to convert AI analysis results to Risk objects
export const convertAIRisksToRiskObjects = (
  aiRisks: Array<{
    text: string;
    confidence: number;
    category: RiskCategory;
  }>,
  _documentId: string,
  owner: string = 'AI Analysis'
): Omit<Risk, 'id' | 'createdAt' | 'updatedAt' | 'riskScore'>[] => {
  return aiRisks.map((aiRisk: {
    text: string;
    confidence: number;
    category: RiskCategory;
  }, index: number) => ({
    title: `AI Identified Risk ${index + 1}`,
    description: aiRisk.text,
    category: aiRisk.category,
    likelihood: Math.ceil(aiRisk.confidence * 5), // Convert confidence to 1-5 scale
    impact: 3, // Default impact, can be adjusted by user
    owner,
    status: 'identified' as const,
    controls: [],
    evidence: [], // Empty array, document reference can be added separately
    aiConfidence: aiRisk.confidence
  }));
};

// Function to convert AI controls to Control objects
export const convertAIControlsToControlObjects = (
  aiControls: Array<{
    title: string;
    description: string;
    confidence: number;
  }>,
  owner: string = 'AI Analysis'
): Omit<Control, 'id' | 'createdAt' | 'updatedAt'>[] => {
  return aiControls.map((aiControl: {
    title: string;
    description: string;
    confidence: number;
  }) => ({
    title: aiControl.title,
    description: aiControl.description,
    type: 'preventive' as const, // Default type, can be adjusted
    effectiveness: aiControl.confidence > 0.8 ? 'high' as const : 
                  aiControl.confidence > 0.6 ? 'medium' as const : 'low' as const,
    owner,
    frequency: 'Monthly', // Default frequency
    evidence: [],
    linkedRisks: [],
    status: 'planned' as const
  }));
};

// Batch analysis for multiple documents
export const batchAIAnalysis = async (documents: Document[]): Promise<AIAnalysisResponse[]> => {
  const results: AIAnalysisResponse[] = [];
  
  // Process documents sequentially to simulate realistic processing
  for (const document of documents) {
    const result = await mockAIAnalysis(document);
    results.push(result);
  }
  
  return results;
}; 