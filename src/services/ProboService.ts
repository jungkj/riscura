import { AIService } from './AIService';
import { ControlType } from '@/types/rcsa.types';

// Import actual Probo data
import mitigationsData from '@/data/mitigations.json';

// Testing guidance interfaces
export interface ControlTestStep {
  description: string;
  expectedResult: string;
  dataRequired: string;
  notes: string;
}

export interface ControlTestingGuidance {
  testSteps: ControlTestStep[];
  suggestions: string[];
}

export interface VendorInfo {
  name: string;
  description: string;
  category: string;
  headquarterAddress: string;
  legalName: string;
  privacyPolicyURL: string;
  serviceLevelAgreementURL: string;
  dataProcessingAgreementURL: string;
  businessAssociateAgreementURL: string;
  subprocessorsListURL: string;
  securityPageURL: string;
  trustPageURL: string;
  termsOfServiceURL: string;
  statusPageURL: string;
  certifications: string[];
}

export interface VendorAssessment {
  id: string;
  vendorInfo: VendorInfo;
  riskScore: number;
  complianceStatus: string;
  findings: VendorFinding[];
  lastAssessed: Date;
}

export interface VendorFinding {
  id: string;
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  remediation: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
}

export interface ComplianceFramework {
  id: string;
  name: string;
  version: string;
  controls: FrameworkControl[];
  requirements: FrameworkRequirement[];
}

export interface FrameworkControl {
  id: string;
  name: string;
  description: string;
  category: string;
  requirement: string;
  standards: string[];
}

export interface FrameworkRequirement {
  id: string;
  title: string;
  description: string;
  controls: string[];
}

export interface ProboControl {
  id: string;
  name: string;
  description: string;
  category: string;
  frameworkId: string;
  sectionTitle: string;
}

export interface MitigationControl {
  id: string;
  name: string;
  category: string;
  importance: 'MANDATORY' | 'PREFERRED' | 'ADVANCED';
  standards: string;
  description: string;
}

export interface ProboMitigation {
  id: string;
  category: string;
  name: string;
  importance: 'MANDATORY' | 'PREFERRED' | 'ADVANCED';
  standards: string;
  description: string;
}

export class ProboService {
  private baseUrl: string;
  private apiKey: string;
  private aiService: AIService;
  private static instance: ProboService;

  constructor() {
    this.baseUrl = process.env.PROBO_SERVICE_URL || 'http://localhost:8080';
    this.apiKey = process.env.PROBO_API_KEY || '';
    this.aiService = new AIService();
  }

  static getInstance(): ProboService {
    if (!ProboService.instance) {
      ProboService.instance = new ProboService();
    }
    return ProboService.instance;
  }

  /**
   * Assess a vendor using Probo's AI-powered vendor assessment
   */
  async assessVendor(websiteUrl: string): Promise<VendorAssessment> {
    try {
      // Use Probo's vendor assessment agent logic
      const vendorInfo = await this.extractVendorInfo(websiteUrl);
      const riskScore = this.calculateVendorRiskScore(vendorInfo);
      const findings = await this.generateVendorFindings(vendorInfo);

      return {
        id: `vendor-${Date.now()}`,
        vendorInfo,
        riskScore,
        complianceStatus: this.determineComplianceStatus(riskScore),
        findings,
        lastAssessed: new Date(),
      };
    } catch (error) {
      console.error('Vendor assessment failed:', error);
      throw new Error('Failed to assess vendor');
    }
  }

  /**
   * Extract vendor information using AI (based on Probo's vendor assessment agent)
   */
  private async extractVendorInfo(websiteUrl: string): Promise<VendorInfo> {
    const prompt = `
      # Role: You are a compliance assistant.

      # Objective
      Your task is to fetch the provided company URL and return comprehensive company information.

      # For the company url, return the following fields in structured JSON format:
      - name: The company's commonly used name
      - description: One-sentence summary of the company's core offering
      - headquarter_address: Company's main headquarter full address
      - legal_name: Official registered company name
      - privacy_policy_url: URL to privacy policy page
      - service_level_agreement_url: URL to SLA page
      - data_processing_agreement_url: URL to DPA page
      - business_associate_agreement_url: URL to BAA page
      - subprocessors_list_url: URL to subprocessors/subcontractors list page
      - security_page_url: URL to security information page
      - trust_page_url: URL to trust/compliance page
      - terms_of_service_url: URL to terms of service page
      - status_page_url: URL to system status page
      - certifications: Array of security/compliance certifications (e.g., ["SOC2", "ISO27001"])
      - category: One of the following enum values:
        - "ANALYTICS", "CLOUD_MONITORING", "CLOUD_PROVIDER", "COLLABORATION"
        - "CUSTOMER_SUPPORT", "DATA_STORAGE_AND_PROCESSING", "DOCUMENT_MANAGEMENT"
        - "EMPLOYEE_MANAGEMENT", "ENGINEERING", "FINANCE", "IDENTITY_PROVIDER"
        - "IT", "MARKETING", "OFFICE_OPERATIONS", "OTHER", "PASSWORD_MANAGEMENT"
        - "PRODUCT_AND_DESIGN", "PROFESSIONAL_SERVICES", "RECRUITING"
        - "SALES", "SECURITY", "VERSION_CONTROL"

      Company URL: ${websiteUrl}
    `;

    try {
      const response = await this.aiService.generateContent({
        type: 'analysis',
        context: {
          prompt,
          format: 'json',
        },
      });

      const vendorData =
        typeof response.content === 'string' ? JSON.parse(response.content) : response.content;

      return {
        name: vendorData.name || 'Unknown Company',
        description: vendorData.description || 'No description available',
        category: vendorData.category || 'OTHER',
        headquarterAddress: vendorData.headquarter_address || '',
        legalName: vendorData.legal_name || vendorData.name || 'Unknown',
        privacyPolicyURL: vendorData.privacy_policy_url || '',
        serviceLevelAgreementURL: vendorData.service_level_agreement_url || '',
        dataProcessingAgreementURL: vendorData.data_processing_agreement_url || '',
        businessAssociateAgreementURL: vendorData.business_associate_agreement_url || '',
        subprocessorsListURL: vendorData.subprocessors_list_url || '',
        securityPageURL: vendorData.security_page_url || '',
        trustPageURL: vendorData.trust_page_url || '',
        termsOfServiceURL: vendorData.terms_of_service_url || '',
        statusPageURL: vendorData.status_page_url || '',
        certifications: vendorData.certifications || [],
      };
    } catch (error) {
      console.error('Failed to extract vendor info:', error);
      // Return fallback vendor info
      return {
        name: websiteUrl.replace(/https?:\/\//, '').replace(/\/.*/, ''),
        description: 'Vendor information could not be automatically extracted',
        category: 'OTHER',
        headquarterAddress: '',
        legalName: '',
        privacyPolicyURL: '',
        serviceLevelAgreementURL: '',
        dataProcessingAgreementURL: '',
        businessAssociateAgreementURL: '',
        subprocessorsListURL: '',
        securityPageURL: '',
        trustPageURL: '',
        termsOfServiceURL: '',
        statusPageURL: '',
        certifications: [],
      };
    }
  }

  /**
   * Calculate vendor risk score based on vendor information
   */
  private calculateVendorRiskScore(vendorInfo: VendorInfo): number {
    let riskScore = 50; // Base risk score

    // Lower risk for established certifications
    if (vendorInfo.certifications.includes('SOC2')) riskScore -= 15;
    if (vendorInfo.certifications.includes('ISO27001')) riskScore -= 10;
    if (vendorInfo.certifications.includes('PCI DSS')) riskScore -= 10;

    // Lower risk for having security documentation
    if (vendorInfo.securityPageURL) riskScore -= 5;
    if (vendorInfo.privacyPolicyURL) riskScore -= 5;
    if (vendorInfo.dataProcessingAgreementURL) riskScore -= 5;

    // Higher risk for certain categories
    const higherRiskCategories = ['CLOUD_PROVIDER', 'DATA_STORAGE_AND_PROCESSING', 'FINANCE'];
    if (higherRiskCategories.includes(vendorInfo.category)) {
      riskScore += 10;
    }

    // Ensure score is within bounds
    return Math.max(0, Math.min(100, riskScore));
  }

  /**
   * Generate vendor findings based on assessment
   */
  private async generateVendorFindings(vendorInfo: VendorInfo): Promise<VendorFinding[]> {
    const findings: VendorFinding[] = [];

    // Check for missing security documentation
    if (!vendorInfo.securityPageURL) {
      findings.push({
        id: 'missing-security-page',
        category: 'Documentation',
        severity: 'MEDIUM',
        description: 'Vendor does not have a publicly accessible security page',
        remediation: 'Request security documentation from vendor',
        status: 'OPEN',
      });
    }

    if (!vendorInfo.privacyPolicyURL) {
      findings.push({
        id: 'missing-privacy-policy',
        category: 'Privacy',
        severity: 'HIGH',
        description: 'Vendor does not have a privacy policy URL',
        remediation: 'Verify privacy practices and obtain privacy policy',
        status: 'OPEN',
      });
    }

    // Check for missing certifications
    if (vendorInfo.certifications.length === 0) {
      findings.push({
        id: 'no-certifications',
        category: 'Compliance',
        severity: 'MEDIUM',
        description: 'Vendor has no visible security certifications',
        remediation: 'Request compliance certifications (SOC2, ISO27001, etc.)',
        status: 'OPEN',
      });
    }

    return findings;
  }

  /**
   * Determine compliance status based on risk score
   */
  private determineComplianceStatus(riskScore: number): string {
    if (riskScore <= 25) return 'COMPLIANT';
    if (riskScore <= 50) return 'MODERATE_RISK';
    if (riskScore <= 75) return 'HIGH_RISK';
    return 'CRITICAL_RISK';
  }

  /**
   * Get SOC 2 Framework controls
   */
  async getSOC2Framework(): Promise<ComplianceFramework> {
    // Return SOC 2 framework structure
    return {
      id: 'soc2-framework',
      name: 'SOC 2 Type II',
      version: '2017',
      controls: await this.getSOC2Controls(),
      requirements: await this.getSOC2Requirements(),
    };
  }

  /**
   * Get SOC 2 controls
   */
  async getSOC2Controls(): Promise<FrameworkControl[]> {
    return [
      {
        id: 'cc1.1',
        name: 'Control Environment - Integrity and Ethical Values',
        description: 'The entity demonstrates a commitment to integrity and ethical values.',
        category: 'Control Environment',
        requirement: 'CC1.1',
        standards: ['SOC2'],
      },
      {
        id: 'cc2.1',
        name: 'Communication and Information - Information Quality',
        description: 'The entity obtains or generates and uses relevant, quality information.',
        category: 'Communication and Information',
        requirement: 'CC2.1',
        standards: ['SOC2'],
      },
      {
        id: 'cc6.1',
        name: 'Logical and Physical Access Controls - Restrict Access',
        description: 'The entity implements logical access security software and infrastructure.',
        category: 'Logical and Physical Access Controls',
        requirement: 'CC6.1',
        standards: ['SOC2'],
      },
      // Add more SOC 2 controls as needed
    ];
  }

  /**
   * Get SOC 2 requirements
   */
  async getSOC2Requirements(): Promise<FrameworkRequirement[]> {
    return [
      {
        id: 'security-principle',
        title: 'Security Principle',
        description: 'Information and systems are protected against unauthorized access.',
        controls: ['cc6.1', 'cc6.2', 'cc6.3', 'cc6.4', 'cc6.5', 'cc6.6', 'cc6.7', 'cc6.8'],
      },
      {
        id: 'availability-principle',
        title: 'Availability Principle',
        description: 'Information and systems are available for operation and use.',
        controls: ['a1.1', 'a1.2', 'a1.3'],
      },
      // Add more requirements as needed
    ];
  }

  /**
   * Get Probo's mitigation controls library
   */
  async getMitigationControls(): Promise<MitigationControl[]> {
    try {
      return mitigationsData.map((mitigation: any) => ({
        id: mitigation.id,
        name: mitigation.name,
        category: mitigation.category,
        importance: mitigation.importance as 'MANDATORY' | 'PREFERRED' | 'ADVANCED',
        standards: mitigation.standards,
        description: mitigation.description,
      }));
    } catch (error) {
      console.error('Failed to load mitigation controls:', error);
      return [];
    }
  }

  /**
   * Get controls library
   */
  async getControlsLibrary(): Promise<ProboControl[]> {
    // This would integrate with Probo's control service
    // For now, return a basic set of controls
    return [
      {
        id: 'access-control-1',
        name: 'User Access Management',
        description: 'Implement user access management controls',
        category: 'Access Control',
        frameworkId: 'soc2-framework',
        sectionTitle: 'Logical Access Controls',
      },
      {
        id: 'encryption-1',
        name: 'Data Encryption',
        description: 'Encrypt sensitive data at rest and in transit',
        category: 'Data Protection',
        frameworkId: 'soc2-framework',
        sectionTitle: 'Data Protection',
      },
    ];
  }

  /**
   * Health check for Probo service
   */
  async healthCheck(): Promise<boolean> {
    try {
      // In a real implementation, this would ping the Probo service
      return true;
    } catch (error) {
      console.error('Probo service health check failed:', error);
      return false;
    }
  }

  // Get actual Probo mitigations
  async getMitigations(): Promise<ProboMitigation[]> {
    return mitigationsData.map((mitigation) => ({
      id: mitigation.id,
      category: mitigation.category,
      name: mitigation.name,
      importance: mitigation.importance as 'MANDATORY' | 'PREFERRED' | 'ADVANCED',
      standards: mitigation.standards,
      description: mitigation.description,
    }));
  }

  // Filter mitigations by category
  async getMitigationsByCategory(category: string): Promise<ProboMitigation[]> {
    const mitigations = await this.getMitigations();
    return mitigations.filter((m) => m.category === category);
  }

  // Get mitigation categories
  async getMitigationCategories(): Promise<string[]> {
    const mitigations = await this.getMitigations();
    const categories = [...new Set(mitigations.map((m) => m.category))];
    return categories.sort();
  }

  // Search mitigations
  async searchMitigations(query: string): Promise<ProboMitigation[]> {
    const mitigations = await this.getMitigations();
    const lowerQuery = query.toLowerCase();
    return mitigations.filter(
      (m) =>
        m.name.toLowerCase().includes(lowerQuery) ||
        m.description.toLowerCase().includes(lowerQuery) ||
        m.category.toLowerCase().includes(lowerQuery)
    );
  }

  // Get control testing guidance
  async getControlTestingGuidance(
    controlType: ControlType
  ): Promise<ControlTestingGuidance | null> {
    try {
      // Map control types to testing approaches
      const testingGuidance: Record<ControlType, ControlTestingGuidance> = {
        PREVENTIVE: {
          testSteps: [
            {
              description: 'Verify control is configured to prevent unauthorized actions',
              expectedResult: 'Control blocks unauthorized attempts',
              dataRequired: 'Access logs, configuration settings',
              notes: 'Test both positive and negative scenarios',
            },
            {
              description: 'Test control bypass scenarios',
              expectedResult: 'No unauthorized bypass methods exist',
              dataRequired: 'Security testing tools, bypass attempts log',
              notes: 'Document any potential weaknesses',
            },
          ],
          suggestions: [
            'Test control effectiveness under various load conditions',
            'Verify control configuration against security baselines',
            'Assess control performance impact',
          ],
        },
        DETECTIVE: {
          testSteps: [
            {
              description: 'Verify control detects and logs security events',
              expectedResult: 'All test events are detected and logged',
              dataRequired: 'Test event data, detection logs',
              notes: 'Include both true positives and false positive testing',
            },
            {
              description: 'Test alert generation and notification',
              expectedResult: 'Alerts generated within defined thresholds',
              dataRequired: 'Alert configuration, notification logs',
              notes: 'Verify alert recipients and escalation paths',
            },
          ],
          suggestions: [
            'Measure detection accuracy and false positive rates',
            'Test detection timeliness against SLAs',
            'Verify log retention and integrity',
          ],
        },
        CORRECTIVE: {
          testSteps: [
            {
              description: 'Test control response to identified issues',
              expectedResult: 'Control corrects issues within defined parameters',
              dataRequired: 'Issue scenarios, correction logs',
              notes: 'Document correction time and effectiveness',
            },
            {
              description: 'Verify rollback and recovery procedures',
              expectedResult: 'System restored to secure state',
              dataRequired: 'Backup data, recovery procedures',
              notes: 'Test various failure scenarios',
            },
          ],
          suggestions: [
            'Measure mean time to recovery (MTTR)',
            'Test correction procedures under stress',
            'Verify data integrity after correction',
          ],
        },
        COMPENSATING: {
          testSteps: [
            {
              description: 'Verify compensating control effectiveness',
              expectedResult: 'Control provides equivalent protection',
              dataRequired: 'Risk assessment data, control mapping',
              notes: 'Compare with primary control objectives',
            },
            {
              description: 'Test control integration and dependencies',
              expectedResult: 'No gaps in control coverage',
              dataRequired: 'Control matrix, integration points',
              notes: 'Document any residual risks',
            },
          ],
          suggestions: [
            'Assess control overlap and redundancy',
            'Evaluate cost-effectiveness of compensation',
            'Plan for primary control restoration',
          ],
        },
        DIRECTIVE: {
          testSteps: [
            {
              description: 'Verify control provides clear guidance and direction',
              expectedResult: 'Policies and procedures are comprehensive and current',
              dataRequired: 'Policy documents, procedure manuals',
              notes: 'Check for version control and approval status',
            },
            {
              description: 'Test awareness and compliance with directives',
              expectedResult: 'Staff understand and follow documented procedures',
              dataRequired: 'Training records, compliance assessments',
              notes: 'Sample testing of staff knowledge',
            },
          ],
          suggestions: [
            'Assess clarity and completeness of guidance',
            'Verify accessibility of documentation',
            'Measure compliance rates and understanding',
          ],
        },
      };

      return (
        testingGuidance[controlType] || {
          testSteps: [
            {
              description: 'Perform general control testing',
              expectedResult: 'Control operates as designed',
              dataRequired: 'Control documentation, test data',
              notes: 'Customize based on control specifics',
            },
          ],
          suggestions: [
            'Define specific test objectives',
            'Establish clear pass/fail criteria',
            'Document all test results',
          ],
        }
      );
    } catch (error) {
      console.error('Failed to get control testing guidance:', error);
      return null;
    }
  }
}
